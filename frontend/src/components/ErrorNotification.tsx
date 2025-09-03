/**
 * Error Notification Component
 * Displays error notifications with retry functionality and auto-dismiss
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './ErrorNotification.css';

export interface ErrorNotificationProps {
  error: Error | string | null;
  type?: 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
  persistent?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  type = 'error',
  title,
  message,
  retryable = false,
  onRetry,
  onDismiss,
  autoHide = true,
  hideDelay = 5000,
  persistent = false,
  showIcon = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(!!error);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide && !persistent && hideDelay > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, hideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, persistent, hideDelay]);

  useEffect(() => {
    if (retryable && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown, retryable]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❗';
    }
  };

  const getErrorMessage = () => {
    if (message) return message;
    
    if (typeof error === 'string') return error;
    
    if (error instanceof Error) {
      // Try to get a user-friendly message based on error type
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return t('errors.network');
      }
      
      if (errorMessage.includes('timeout')) {
        return t('errors.timeout');
      }
      
      if (errorMessage.includes('validation')) {
        return t('errors.validation');
      }
      
      if (errorMessage.includes('ai') || errorMessage.includes('openai')) {
        return t('errors.ai.processing');
      }
      
      if (errorMessage.includes('server') || errorMessage.includes('500')) {
        return t('errors.server');
      }
      
      return error.message;
    }
    
    return t('errors.generic');
  };

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'error':
        return t('common.error');
      case 'warning':
        return t('common.warning');
      case 'info':
        return t('common.info');
      default:
        return t('common.error');
    }
  };

  if (!isVisible || !error) {
    return null;
  }

  return (
    <div className={`error-notification error-notification-${type} ${className}`}>
      <div className="error-notification-content">
        {showIcon && (
          <div className="error-notification-icon">
            {getIcon()}
          </div>
        )}
        
        <div className="error-notification-text">
          <div className="error-notification-title">
            {getTitle()}
          </div>
          <div className="error-notification-message">
            {getErrorMessage()}
          </div>
        </div>
        
        <div className="error-notification-actions">
          {retryable && onRetry && (
            <button
              onClick={handleRetry}
              className="error-notification-retry"
              disabled={countdown > 0}
            >
              {countdown > 0 
                ? t('errors.retryIn', { seconds: countdown } as any)
                : t('errors.retry')
              }
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="error-notification-dismiss"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </div>
      
      {autoHide && !persistent && (
        <div className="error-notification-progress">
          <div 
            className="error-notification-progress-bar"
            style={{ 
              animationDuration: `${hideDelay}ms`,
              animationPlayState: isVisible ? 'running' : 'paused'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Specialized error notification components
export const NetworkErrorNotification: React.FC<{
  isVisible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ isVisible, onRetry, onDismiss }) => {
  const { t } = useTranslation();
  
  return (
    <ErrorNotification
      error={isVisible ? new Error('network') : null}
      type="error"
      title={t('errors.network')}
      message={t('errors.network')}
      retryable={true}
      onRetry={onRetry}
      onDismiss={onDismiss}
      persistent={true}
    />
  );
};

export const AIErrorNotification: React.FC<{
  isVisible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  fallbackAvailable?: boolean;
}> = ({ isVisible, onRetry, onDismiss, fallbackAvailable = false }) => {
  const { t } = useTranslation();
  
  const message = fallbackAvailable 
    ? t('errors.ai.fallback')
    : t('errors.ai.processing');
  
  return (
    <ErrorNotification
      error={isVisible ? new Error('ai') : null}
      type={fallbackAvailable ? 'warning' : 'error'}
      title={t('errors.ai.processing')}
      message={message}
      retryable={!fallbackAvailable}
      onRetry={onRetry}
      onDismiss={onDismiss}
      persistent={!fallbackAvailable}
    />
  );
};

export const FormErrorNotification: React.FC<{
  isVisible: boolean;
  errorCount?: number;
  onDismiss?: () => void;
}> = ({ isVisible, errorCount = 0, onDismiss }) => {
  const { t } = useTranslation();
  
  const message = errorCount > 0 
    ? `${t('errors.form.validationFailed')} (${errorCount} errors)`
    : t('errors.form.validationFailed');
  
  return (
    <ErrorNotification
      error={isVisible ? new Error('validation') : null}
      type="warning"
      title={t('errors.validation')}
      message={message}
      retryable={false}
      onDismiss={onDismiss}
      autoHide={false}
      persistent={true}
    />
  );
};

export const LoadingTimeoutNotification: React.FC<{
  isVisible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ isVisible, onRetry, onDismiss }) => {
  const { t } = useTranslation();
  
  return (
    <ErrorNotification
      error={isVisible ? new Error('timeout') : null}
      type="warning"
      title={t('errors.loading.timeout')}
      message={t('errors.loading.timeout')}
      retryable={true}
      onRetry={onRetry}
      onDismiss={onDismiss}
      persistent={true}
    />
  );
};

export default ErrorNotification;