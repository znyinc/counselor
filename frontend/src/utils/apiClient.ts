/**
 * Enhanced API Client with error handling and retry logic
 */

import { useRetryMechanism } from '../hooks/useRetryMechanism';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  retryable?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
  requestId?: string;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = 3,
      retryDelay = 1000,
      headers = {},
      signal,
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine signals if provided
    const combinedSignal = signal ? this.combineSignals([signal, controller.signal]) : controller.signal;

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createApiError(response);
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success && data.error) {
        const error = new Error(data.error.message) as ApiError;
        error.code = data.error.code;
        error.details = data.error.details;
        error.status = response.status;
        error.retryable = this.isRetryableError(response.status, data.error.code);
        throw error;
      }

      return data.data as T;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timed out') as ApiError;
          timeoutError.code = 'TIMEOUT';
          timeoutError.retryable = true;
          throw timeoutError;
        }

        if (error.message.includes('Failed to fetch')) {
          const networkError = new Error('Network error. Please check your connection.') as ApiError;
          networkError.code = 'NETWORK_ERROR';
          networkError.retryable = true;
          throw networkError;
        }
      }

      throw error;
    }
  }

  private async createApiError(response: Response): Promise<ApiError> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // If response is not JSON, create a generic error
      errorData = {
        error: {
          code: 'HTTP_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }
      };
    }

    const error = new Error(errorData.error?.message || `HTTP ${response.status}`) as ApiError;
    error.status = response.status;
    error.code = errorData.error?.code || 'HTTP_ERROR';
    error.details = errorData.error?.details;
    error.retryable = this.isRetryableError(response.status, error.code);

    return error;
  }

  private isRetryableError(status?: number, code?: string): boolean {
    // Retry on network errors, timeouts, and server errors
    if (!status) return true; // Network errors
    
    // Retry on server errors (5xx)
    if (status >= 500) return true;
    
    // Retry on specific 4xx errors
    if (status === 408 || status === 429) return true; // Timeout, Rate limit
    
    // Retry on specific error codes
    if (code === 'TIMEOUT' || code === 'NETWORK_ERROR' || code === 'RATE_LIMIT_EXCEEDED') {
      return true;
    }
    
    return false;
  }

  private combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    
    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });
    
    return controller.signal;
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET', ...config });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE', ...config });
  }

  // Specialized methods for the career counseling app
  async submitProfile(profileData: any, config?: RequestConfig) {
    return this.post('/profile', profileData, {
      timeout: 60000, // Longer timeout for AI processing
      ...config,
    });
  }

  async getAnalytics(filters?: any, config?: RequestConfig) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.get(`/analytics${queryParams}`) || config;
  }

  async sendNotification(notificationData: any, config?: RequestConfig) {
    return this.post('/notify', notificationData, config);
  }

  // Utility methods
  setDefaultHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  removeDefaultHeader(key: string) {
    delete this.defaultHeaders[key];
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Hook for using API client with retry mechanism
export const useApiClient = () => {
  const { executeWithRetry, retryState } = useRetryMechanism({
    maxRetries: 3,
    initialDelay: 1000,
    retryCondition: (error: Error) => {
      const apiError = error as ApiError;
      return apiError.retryable ?? false;
    },
  });

  const submitProfileWithRetry = async (profileData: any, signal?: AbortSignal) => {
    return executeWithRetry(() => apiClient.submitProfile(profileData, { signal }));
  };

  const getAnalyticsWithRetry = async (filters?: any, signal?: AbortSignal) => {
    return executeWithRetry(() => apiClient.getAnalytics(filters, { signal }));
  };

  const sendNotificationWithRetry = async (notificationData: any, signal?: AbortSignal) => {
    return executeWithRetry(() => apiClient.sendNotification(notificationData, { signal }));
  };

  return {
    apiClient,
    retryState,
    submitProfileWithRetry,
    getAnalyticsWithRetry,
    sendNotificationWithRetry,
  };
};

export default apiClient;