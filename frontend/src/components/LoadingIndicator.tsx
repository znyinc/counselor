/**
 * Loading Indicator Component
 * Displays loading states with progress and stage information
 */

import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import './LoadingIndicator.css';

export interface LoadingIndicatorProps {
  isLoading: boolean;
  progress?: number;
  message?: string;
  stage?: string;
  showProgress?: boolean;
  showStage?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'progress';
  overlay?: boolean;
  estimatedTime?: number | null;
  elapsedTime?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress = 0,
  message = 'Loading...',
  stage = '',
  showProgress = false,
  showStage = false,
  size = 'medium',
  variant = 'spinner',
  overlay = false,
  estimatedTime = null,
  elapsedTime = 0
}) => {
  const { t } = useTranslation();

  if (!isLoading) {
    return null;
  }

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderSpinner = () => (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-circle"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`dots dots-${size}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`pulse pulse-${size}`}>
      <div className="pulse-circle"></div>
    </div>
  );

  const renderProgress = () => (
    <div className={`progress-ring progress-ring-${size}`}>
      <svg className="progress-svg" viewBox="0 0 100 100">
        <circle
          className="progress-background"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          className="progress-foreground"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="progress-text">{Math.round(progress)}%</div>
    </div>
  );

  const renderIndicator = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`loading-indicator loading-indicator-${size}`}>
      <div className="loading-content">
        {renderIndicator()}
        
        <div className="loading-text">
          <div className="loading-message">{message}</div>
          
          {showStage && stage && (
            <div className="loading-stage">{stage}</div>
          )}
          
          {showProgress && (
            <div className="loading-progress-bar">
              <div className="progress-bar-background">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-percentage">{Math.round(progress)}%</div>
            </div>
          )}
          
          {(estimatedTime || elapsedTime > 0) && (
            <div className="loading-time">
              {elapsedTime > 0 && (
                <span className="elapsed-time">
                  Elapsed: {formatTime(elapsedTime)}
                </span>
              )}
              {estimatedTime && (
                <span className="estimated-time">
                  Remaining: ~{formatTime(estimatedTime)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

// Specialized loading components
export const AIProcessingLoader: React.FC<{
  isLoading: boolean;
  stage?: string;
  progress?: number;
}> = ({ isLoading, stage = 'processing', progress = 0 }) => {
  const { t } = useTranslation();
  
  const stageMessages = {
    analyzing: t('loading.ai.analyzing') || 'Analyzing your profile...',
    matching: t('loading.ai.matching') || 'Finding career matches...',
    generating: t('loading.ai.generating') || 'Generating recommendations...',
    finalizing: t('loading.ai.finalizing') || 'Finalizing results...'
  };

  return (
    <LoadingIndicator
      isLoading={isLoading}
      message={stageMessages[stage as keyof typeof stageMessages] || t('loading.ai.processing') || 'Processing with AI...'}
      stage={stage}
      progress={progress}
      showProgress={true}
      showStage={true}
      variant="progress"
      size="large"
      overlay={true}
    />
  );
};

export const FormValidationLoader: React.FC<{
  isLoading: boolean;
}> = ({ isLoading }) => {
  const { t } = useTranslation();
  
  return (
    <LoadingIndicator
      isLoading={isLoading}
      message={t('loading.validation') || 'Validating form data...'}
      variant="spinner"
      size="small"
    />
  );
};

export const DataFetchingLoader: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message }) => {
  const { t } = useTranslation();
  
  return (
    <LoadingIndicator
      isLoading={isLoading}
      message={message || t('loading.fetching') || 'Loading data...'}
      variant="dots"
      size="medium"
    />
  );
};

export default LoadingIndicator;