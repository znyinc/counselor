/**
 * Error Handler Hook
 * Provides comprehensive error handling functionality
 */

import { useState, useCallback } from 'react';
import { useTranslation } from './useTranslation';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'validation' | 'ai' | 'server' | 'generic';
  message: string;
  retryable: boolean;
  timestamp: number;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { t } = useTranslation();
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorType: 'generic',
    message: '',
    retryable: false,
    timestamp: 0
  });

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorType: 'generic',
      message: '',
      retryable: false,
      timestamp: 0
    });
  }, []);

  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = false,
      logError = true,
      retryable = true,
      fallbackMessage
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorType = determineErrorType(errorObj);
    const message = getErrorMessage(errorObj, errorType, fallbackMessage, t);

    // Log error if enabled
    if (logError) {
      console.error('Error handled:', errorObj);
    }

    // Set error state
    setErrorState({
      hasError: true,
      error: errorObj,
      errorType,
      message,
      retryable,
      timestamp: Date.now()
    });

    // Show toast notification if enabled
    if (showToast) {
      showErrorToast(message);
    }

    return {
      type: errorType,
      message,
      retryable
    };
  }, [t]);

  const handleNetworkError = useCallback((error: Error) => {
    return handleError(error, {
      showToast: true,
      retryable: true
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: Error | string) => {
    return handleError(error, {
      showToast: false,
      retryable: false
    });
  }, [handleError]);

  const handleAIError = useCallback((error: Error) => {
    return handleError(error, {
      showToast: true,
      retryable: true,
      fallbackMessage: t('errors.ai.processing')
    });
  }, [handleError, t]);

  const handleServerError = useCallback((error: Error) => {
    return handleError(error, {
      showToast: true,
      retryable: true,
      fallbackMessage: t('errors.server')
    });
  }, [handleError, t]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    errorHandler?: (error: Error) => void
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (errorHandler) {
          errorHandler(err);
        } else {
          handleError(err);
        }
        
        return null;
      }
    };
  }, [handleError]);

  const retry = useCallback(async (
    retryFn: () => Promise<any>,
    maxRetries: number = 3,
    delay: number = 1000
  ) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await retryFn();
        clearError(); // Clear error on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          handleError(lastError, {
            showToast: true,
            retryable: false,
            fallbackMessage: `Failed after ${maxRetries} attempts`
          });
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }, [handleError, clearError]);

  return {
    errorState,
    clearError,
    handleError,
    handleNetworkError,
    handleValidationError,
    handleAIError,
    handleServerError,
    withErrorHandling,
    retry
  };
};

// Helper functions
function determineErrorType(error: Error): ErrorState['errorType'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation';
  }
  
  if (message.includes('ai') || message.includes('openai') || message.includes('quota') || message.includes('rate limit')) {
    return 'ai';
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('503')) {
    return 'server';
  }
  
  return 'generic';
}

function getErrorMessage(
  error: Error,
  errorType: ErrorState['errorType'],
  fallbackMessage: string | undefined,
  t: (key: string, fallback?: string) => string
): string {
  if (fallbackMessage) {
    return fallbackMessage;
  }
  
  switch (errorType) {
    case 'network':
      return t('errors.network', 'Network error. Please check your connection.');
    case 'validation':
      return t('errors.validation', 'Please check the form for errors.');
    case 'ai':
      return t('errors.ai.processing', 'Error processing your request with AI.');
    case 'server':
      return t('errors.server', 'Server error. Please try again later.');
    default:
      return t('errors.generic', 'Something went wrong. Please try again.');
  }
}

function showErrorToast(message: string) {
  // Simple toast implementation
  // In a real app, you might use a toast library like react-hot-toast
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(toast);
  
  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 300);
  }, 5000);
}

export default useErrorHandler;