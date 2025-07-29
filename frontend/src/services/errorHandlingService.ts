/**
 * Error Handling Service
 * Centralized error handling and reporting service
 */

import { ApiError } from '../utils/apiClient';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    action?: string;
    component?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  retryable: boolean;
}

export interface ErrorHandlingConfig {
  enableReporting: boolean;
  enableConsoleLogging: boolean;
  enableUserNotification: boolean;
  maxReports: number;
  reportingEndpoint?: string;
}

class ErrorHandlingService {
  private config: ErrorHandlingConfig;
  private errorReports: ErrorReport[] = [];
  private errorCounts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      enableReporting: true,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableUserNotification: true,
      maxReports: 100,
      ...config
    };
  }

  /**
   * Handle an error with context information
   */
  handleError(
    error: Error,
    context: Partial<ErrorReport['context']> = {},
    options: {
      severity?: ErrorReport['severity'];
      handled?: boolean;
      notify?: boolean;
    } = {}
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      severity: options.severity || this.determineSeverity(error),
      handled: options.handled ?? true,
      retryable: this.isRetryableError(error)
    };

    // Store error report
    this.storeErrorReport(errorReport);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorReport);
    }

    // Send to reporting service if enabled
    if (this.config.enableReporting) {
      this.reportError(errorReport);
    }

    // Notify user if enabled and appropriate
    if (this.config.enableUserNotification && options.notify !== false) {
      this.notifyUser(errorReport);
    }

    return errorReport;
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(
    error: ApiError,
    endpoint: string,
    method: string,
    context: Partial<ErrorReport['context']> = {}
  ): ErrorReport {
    return this.handleError(error, {
      ...context,
      action: `API_${method.toUpperCase()}`,
      component: `API:${endpoint}`
    }, {
      severity: this.determineApiErrorSeverity(error),
      notify: this.shouldNotifyForApiError(error)
    });
  }

  /**
   * Handle form validation errors
   */
  handleValidationError(
    error: Error,
    formName: string,
    fieldName?: string,
    context: Partial<ErrorReport['context']> = {}
  ): ErrorReport {
    return this.handleError(error, {
      ...context,
      action: 'FORM_VALIDATION',
      component: fieldName ? `${formName}:${fieldName}` : formName
    }, {
      severity: 'low',
      notify: false // Don't notify for validation errors
    });
  }

  /**
   * Handle AI processing errors
   */
  handleAIError(
    error: Error,
    stage: string,
    context: Partial<ErrorReport['context']> = {}
  ): ErrorReport {
    return this.handleError(error, {
      ...context,
      action: 'AI_PROCESSING',
      component: `AI:${stage}`
    }, {
      severity: 'high',
      notify: true
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorReports.forEach(report => {
      const errorType = report.error.constructor.name;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      errorsBySeverity[report.severity] = (errorsBySeverity[report.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorReports.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorReports.slice(-10)
    };
  }

  /**
   * Clear error reports
   */
  clearErrorReports(): void {
    this.errorReports = [];
    this.errorCounts.clear();
  }

  /**
   * Get error reports by criteria
   */
  getErrorReports(criteria: {
    severity?: ErrorReport['severity'];
    component?: string;
    since?: Date;
    limit?: number;
  } = {}): ErrorReport[] {
    let filtered = this.errorReports;

    if (criteria.severity) {
      filtered = filtered.filter(report => report.severity === criteria.severity);
    }

    if (criteria.component) {
      filtered = filtered.filter(report => 
        report.context.component?.includes(criteria.component!)
      );
    }

    if (criteria.since) {
      filtered = filtered.filter(report => report.timestamp >= criteria.since!);
    }

    if (criteria.limit) {
      filtered = filtered.slice(-criteria.limit);
    }

    return filtered;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }

    if (message.includes('network') || message.includes('server') || message.includes('ai')) {
      return 'high';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'low';
    }

    return 'medium';
  }

  private determineApiErrorSeverity(error: ApiError): ErrorReport['severity'] {
    if (error.status && error.status >= 500) {
      return 'high';
    }

    if (error.code === 'AI_SERVICE_UNAVAILABLE' || error.code === 'AI_QUOTA_EXCEEDED') {
      return 'high';
    }

    if (error.code === 'VALIDATION_ERROR') {
      return 'low';
    }

    return 'medium';
  }

  private shouldNotifyForApiError(error: ApiError): boolean {
    // Don't notify for validation errors
    if (error.code === 'VALIDATION_ERROR') {
      return false;
    }

    // Don't notify for client errors (4xx) except specific ones
    if (error.status && error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429; // Timeout, Rate limit
    }

    return true;
  }

  private isRetryableError(error: Error): boolean {
    const apiError = error as ApiError;
    if (apiError.retryable !== undefined) {
      return apiError.retryable;
    }

    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('server') ||
           message.includes('connection');
  }

  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.push(report);

    // Keep only the most recent reports
    if (this.errorReports.length > this.config.maxReports) {
      this.errorReports = this.errorReports.slice(-this.config.maxReports);
    }

    // Update error counts
    const errorKey = `${report.error.constructor.name}:${report.context.component || 'unknown'}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
  }

  private logToConsole(report: ErrorReport): void {
    const logMethod = report.severity === 'critical' ? 'error' : 
                     report.severity === 'high' ? 'error' :
                     report.severity === 'medium' ? 'warn' : 'info';

    console[logMethod]('Error Report:', {
      id: report.id,
      error: report.error,
      context: report.context,
      severity: report.severity,
      timestamp: report.timestamp
    });
  }

  private async reportError(report: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return;
    }

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: report.id,
          timestamp: report.timestamp.toISOString(),
          error: {
            name: report.error.name,
            message: report.error.message,
            stack: report.error.stack
          },
          context: report.context,
          severity: report.severity,
          handled: report.handled,
          retryable: report.retryable
        })
      });
    } catch (error) {
      // Silently fail - don't create infinite error loops
      if (this.config.enableConsoleLogging) {
        console.warn('Failed to report error:', error);
      }
    }
  }

  private notifyUser(report: ErrorReport): void {
    // This would integrate with your notification system
    // For now, we'll just dispatch a custom event
    window.dispatchEvent(new CustomEvent('error-notification', {
      detail: {
        error: report.error,
        severity: report.severity,
        retryable: report.retryable,
        context: report.context
      }
    }));
  }
}

// Create and export singleton instance
export const errorHandlingService = new ErrorHandlingService();

// React hook for using error handling service
export const useErrorHandlingService = () => {
  const handleError = (
    error: Error,
    context?: Partial<ErrorReport['context']>,
    options?: Parameters<typeof errorHandlingService.handleError>[2]
  ) => {
    return errorHandlingService.handleError(error, context, options);
  };

  const handleApiError = (
    error: ApiError,
    endpoint: string,
    method: string,
    context?: Partial<ErrorReport['context']>
  ) => {
    return errorHandlingService.handleApiError(error, endpoint, method, context);
  };

  const handleValidationError = (
    error: Error,
    formName: string,
    fieldName?: string,
    context?: Partial<ErrorReport['context']>
  ) => {
    return errorHandlingService.handleValidationError(error, formName, fieldName, context);
  };

  const handleAIError = (
    error: Error,
    stage: string,
    context?: Partial<ErrorReport['context']>
  ) => {
    return errorHandlingService.handleAIError(error, stage, context);
  };

  return {
    handleError,
    handleApiError,
    handleValidationError,
    handleAIError,
    getErrorStats: () => errorHandlingService.getErrorStats(),
    clearErrorReports: () => errorHandlingService.clearErrorReports(),
    getErrorReports: (criteria?: Parameters<typeof errorHandlingService.getErrorReports>[0]) => 
      errorHandlingService.getErrorReports(criteria)
  };
};

export default errorHandlingService;