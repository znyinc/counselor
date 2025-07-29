/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const { t } = useTranslation();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/profile';
  };

  return (
    <div className="error-boundary">
      <div className="error-boundary-content">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">{t('errors.generic')}</h2>
        <p className="error-description">
          Something unexpected happened. We apologize for the inconvenience.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-details">
            <summary>Error Details (Development)</summary>
            <pre className="error-stack">
              {error.name}: {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="error-actions">
          <button onClick={onRetry} className="btn btn-primary">
            {t('common.retry')}
          </button>
          <button onClick={handleReload} className="btn btn-secondary">
            Reload Page
          </button>
          <button onClick={handleGoHome} className="btn btn-outline">
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component to use hooks
export const ErrorBoundary: React.FC<Props> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;