/**
 * Retry Mechanism Hook
 * Provides intelligent retry functionality with exponential backoff
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from './useTranslation';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
  onRetryAttempt?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface RetryState {
  isRetrying: boolean;
  currentAttempt: number;
  nextRetryIn: number;
  canRetry: boolean;
  lastError: Error | null;
}

export const useRetryMechanism = (config: RetryConfig = {}) => {
  const { t } = useTranslation();
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
    onRetryAttempt,
    onMaxRetriesReached
  } = config;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    currentAttempt: 0,
    nextRetryIn: 0,
    canRetry: true,
    lastError: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffFactor, maxDelay]);

  const clearTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((delay: number) => {
    let remaining = Math.ceil(delay / 1000);
    setRetryState(prev => ({ ...prev, nextRetryIn: remaining }));

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setRetryState(prev => ({ ...prev, nextRetryIn: remaining }));
      
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
      }
    }, 1000);
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const finalConfig = { ...config, ...customConfig };
    const finalMaxRetries = finalConfig.maxRetries || maxRetries;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= finalMaxRetries; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          isRetrying: attempt > 1,
          currentAttempt: attempt,
          canRetry: attempt < finalMaxRetries
        }));

        if (onRetryAttempt && attempt > 1) {
          onRetryAttempt(attempt, lastError!);
        }

        const result = await operation();
        
        // Success - reset state
        setRetryState({
          isRetrying: false,
          currentAttempt: 0,
          nextRetryIn: 0,
          canRetry: true,
          lastError: null
        });
        
        clearTimers();
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setRetryState(prev => ({
          ...prev,
          lastError: lastError,
          canRetry: attempt < finalMaxRetries
        }));

        // Check if we should retry this error
        if (!retryCondition(lastError)) {
          throw lastError;
        }

        // If this was the last attempt, don't wait
        if (attempt === finalMaxRetries) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            canRetry: false
          }));
          
          if (onMaxRetriesReached) {
            onMaxRetriesReached(lastError);
          }
          
          throw lastError;
        }

        // Calculate delay and wait before next attempt
        const delay = calculateDelay(attempt);
        startCountdown(delay);
        
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, delay);
        });
      }
    }

    throw lastError!;
  }, [
    config,
    maxRetries,
    retryCondition,
    onRetryAttempt,
    onMaxRetriesReached,
    calculateDelay,
    startCountdown,
    clearTimers
  ]);

  const manualRetry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!retryState.canRetry) {
      throw new Error(t('errors.maxRetriesReached'));
    }

    return executeWithRetry(operation, { maxRetries: 1 });
  }, [retryState.canRetry, executeWithRetry, t]);

  const reset = useCallback(() => {
    clearTimers();
    setRetryState({
      isRetrying: false,
      currentAttempt: 0,
      nextRetryIn: 0,
      canRetry: true,
      lastError: null
    });
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Predefined retry conditions
  const retryConditions = {
    networkErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('connection') ||
             message.includes('timeout');
    },
    
    serverErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('500') || 
             message.includes('502') || 
             message.includes('503') || 
             message.includes('504') ||
             message.includes('server');
    },
    
    aiErrors: (error: Error) => {
      const message = error.message.toLowerCase();
      return message.includes('ai') || 
             message.includes('openai') || 
             message.includes('quota') ||
             message.includes('rate limit');
    },
    
    retryableErrors: (error: Error) => {
      return retryConditions.networkErrors(error) || 
             retryConditions.serverErrors(error) || 
             retryConditions.aiErrors(error);
    }
  };

  return {
    retryState,
    executeWithRetry,
    manualRetry,
    reset,
    retryConditions
  };
};

// Specialized retry hooks
export const useNetworkRetry = (config?: Partial<RetryConfig>) => {
  return useRetryMechanism({
    maxRetries: 3,
    initialDelay: 1000,
    retryCondition: (error) => {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('connection');
    },
    ...config
  });
};

export const useAIRetry = (config?: Partial<RetryConfig>) => {
  return useRetryMechanism({
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 8000,
    retryCondition: (error) => {
      const message = error.message.toLowerCase();
      return message.includes('ai') || 
             message.includes('openai') || 
             message.includes('timeout') ||
             (message.includes('quota') && !message.includes('exceeded'));
    },
    ...config
  });
};

export const useFormSubmissionRetry = (config?: Partial<RetryConfig>) => {
  return useRetryMechanism({
    maxRetries: 2,
    initialDelay: 1500,
    retryCondition: (error) => {
      const message = error.message.toLowerCase();
      // Don't retry validation errors
      if (message.includes('validation') || message.includes('invalid')) {
        return false;
      }
      // Retry network and server errors
      return message.includes('network') || 
             message.includes('server') || 
             message.includes('timeout');
    },
    ...config
  });
};

export default useRetryMechanism;