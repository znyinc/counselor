/**
 * Error Notification Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorNotification, NetworkErrorNotification, AIErrorNotification } from '../ErrorNotification';

// Mock the translation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('ErrorNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error notification with message', () => {
    const error = new Error('Test error message');
    render(<ErrorNotification error={error} />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('common.error')).toBeInTheDocument();
  });

  it('does not render when error is null', () => {
    const { container } = render(<ErrorNotification error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');
    
    render(<ErrorNotification error={error} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    const error = new Error('Test error');
    
    render(<ErrorNotification error={error} retryable={true} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('errors.retry');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows retry button only when retryable is true', () => {
    const error = new Error('Test error');
    
    const { rerender } = render(<ErrorNotification error={error} retryable={false} />);
    expect(screen.queryByText('errors.retry')).not.toBeInTheDocument();
    
    rerender(<ErrorNotification error={error} retryable={true} onRetry={() => {}} />);
    expect(screen.getByText('errors.retry')).toBeInTheDocument();
  });

  it('auto-hides after specified delay', async () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');
    
    render(
      <ErrorNotification 
        error={error} 
        autoHide={true} 
        hideDelay={100} 
        onDismiss={onDismiss} 
      />
    );
    
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });

  it('does not auto-hide when persistent is true', async () => {
    const onDismiss = jest.fn();
    const error = new Error('Test error');
    
    render(
      <ErrorNotification 
        error={error} 
        autoHide={true} 
        hideDelay={100} 
        persistent={true}
        onDismiss={onDismiss} 
      />
    );
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('displays correct icon for different error types', () => {
    const error = new Error('Test error');
    
    const { rerender } = render(<ErrorNotification error={error} type="error" />);
    expect(screen.getByText('❌')).toBeInTheDocument();
    
    rerender(<ErrorNotification error={error} type="warning" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    
    rerender(<ErrorNotification error={error} type="info" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('handles string errors correctly', () => {
    render(<ErrorNotification error="String error message" />);
    expect(screen.getByText('String error message')).toBeInTheDocument();
  });

  it('shows custom title and message when provided', () => {
    const error = new Error('Original error');
    
    render(
      <ErrorNotification 
        error={error} 
        title="Custom Title" 
        message="Custom Message" 
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
    expect(screen.queryByText('Original error')).not.toBeInTheDocument();
  });
});

describe('NetworkErrorNotification', () => {
  it('renders network error notification when visible', () => {
    render(<NetworkErrorNotification isVisible={true} />);
    
    expect(screen.getByText('errors.network')).toBeInTheDocument();
    expect(screen.getByText('errors.retry')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    const { container } = render(<NetworkErrorNotification isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    
    render(<NetworkErrorNotification isVisible={true} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('errors.retry');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('AIErrorNotification', () => {
  it('renders AI error notification when visible', () => {
    render(<AIErrorNotification isVisible={true} />);
    
    expect(screen.getByText('errors.ai.processing')).toBeInTheDocument();
    expect(screen.getByText('errors.retry')).toBeInTheDocument();
  });

  it('shows fallback message when fallback is available', () => {
    render(<AIErrorNotification isVisible={true} fallbackAvailable={true} />);
    
    expect(screen.getByText('errors.ai.fallback')).toBeInTheDocument();
    expect(screen.queryByText('errors.retry')).not.toBeInTheDocument();
  });

  it('shows warning type when fallback is available', () => {
    render(<AIErrorNotification isVisible={true} fallbackAvailable={true} />);
    
    const notification = screen.getByText('⚠️');
    expect(notification).toBeInTheDocument();
  });

  it('shows error type when fallback is not available', () => {
    render(<AIErrorNotification isVisible={true} fallbackAvailable={false} />);
    
    const notification = screen.getByText('❌');
    expect(notification).toBeInTheDocument();
  });
});