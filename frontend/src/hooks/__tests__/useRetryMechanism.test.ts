/**
 * Retry Mechanism Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useRetryMechanism, useNetworkRetry, useAIRetry } from '../useRetryMechanism';

// Mock the translation hook
jest.mock('../useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('useRetryMechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('executes operation successfully on first attempt', async () => {
    const { result } = renderHook(() => useRetryMechanism());
    const mockOperation = jest.fn().mockResolvedValue('success');

    let operationResult: string;
    await act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult!).toBe('success');
    expect(result.current.retryState.currentAttempt).toBe(0);
    expect(result.current.retryState.isRetrying).toBe(false);
  });

  it('retries operation on failure', async () => {
    const { result } = renderHook(() => useRetryMechanism({ maxRetries: 2 }));
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');

    let operationResult: string;
    const executePromise = act(async () => {
      operationResult = await result.current.executeWithRetry(mockOperation);
    });

    // Fast-forward through the retry delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(operationResult!).toBe('success');
  });

  it('fails after max retries', async () => {
    const { result } = renderHook(() => useRetryMechanism({ maxRetries: 2 }));
    const error = new Error('Persistent error');
    const mockOperation = jest.fn().mockRejectedValue(error);

    let thrownError: Error;
    const executePromise = act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    // Fast-forward through all retry delays
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await executePromise;

    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(thrownError!).toBe(error);
    expect(result.current.retryState.canRetry).toBe(false);
  });

  it('respects retry condition', async () => {
    const { result } = renderHook(() => 
      useRetryMechanism({ 
        maxRetries: 3,
        retryCondition: (error) => !error.message.includes('validation')
      })
    );

    const validationError = new Error('validation failed');
    const mockOperation = jest.fn().mockRejectedValue(validationError);

    let thrownError: Error;
    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(thrownError!).toBe(validationError);
  });

  it('calls onRetryAttempt callback', async () => {
    const onRetryAttempt = jest.fn();
    const { result } = renderHook(() => 
      useRetryMechanism({ 
        maxRetries: 2,
        onRetryAttempt
      })
    );

    const error = new Error('Network error');
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    expect(onRetryAttempt).toHaveBeenCalledWith(2, error);
  });

  it('calls onMaxRetriesReached callback', async () => {
    const onMaxRetriesReached = jest.fn();
    const { result } = renderHook(() => 
      useRetryMechanism({ 
        maxRetries: 1,
        onMaxRetriesReached
      })
    );

    const error = new Error('Persistent error');
    const mockOperation = jest.fn().mockRejectedValue(error);

    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (e) {
        // Expected to throw
      }
    });

    expect(onMaxRetriesReached).toHaveBeenCalledWith(error);
  });

  it('updates retry state correctly', async () => {
    const { result } = renderHook(() => useRetryMechanism({ maxRetries: 2 }));
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });

    // Check state during retry
    expect(result.current.retryState.isRetrying).toBe(true);
    expect(result.current.retryState.currentAttempt).toBe(2);
    expect(result.current.retryState.canRetry).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    // Check state after success
    expect(result.current.retryState.isRetrying).toBe(false);
    expect(result.current.retryState.currentAttempt).toBe(0);
    expect(result.current.retryState.canRetry).toBe(true);
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useRetryMechanism());

    act(() => {
      result.current.reset();
    });

    expect(result.current.retryState).toEqual({
      isRetrying: false,
      currentAttempt: 0,
      nextRetryIn: 0,
      canRetry: true,
      lastError: null
    });
  });

  it('handles manual retry', async () => {
    const { result } = renderHook(() => useRetryMechanism());
    const mockOperation = jest.fn().mockResolvedValue('success');

    let operationResult: string;
    await act(async () => {
      operationResult = await result.current.manualRetry(mockOperation);
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult!).toBe('success');
  });
});

describe('useNetworkRetry', () => {
  it('retries network errors', async () => {
    const { result } = renderHook(() => useNetworkRetry());
    const networkError = new Error('Network connection failed');
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await executePromise;

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-network errors', async () => {
    const { result } = renderHook(() => useNetworkRetry());
    const validationError = new Error('Validation failed');
    const mockOperation = jest.fn().mockRejectedValue(validationError);

    let thrownError: Error;
    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(thrownError!).toBe(validationError);
  });
});

describe('useAIRetry', () => {
  it('retries AI errors', async () => {
    const { result } = renderHook(() => useAIRetry());
    const aiError = new Error('AI service timeout');
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(aiError)
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeWithRetry(mockOperation);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await executePromise;

    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it('does not retry quota exceeded errors', async () => {
    const { result } = renderHook(() => useAIRetry());
    const quotaError = new Error('AI quota exceeded');
    const mockOperation = jest.fn().mockRejectedValue(quotaError);

    let thrownError: Error;
    await act(async () => {
      try {
        await result.current.executeWithRetry(mockOperation);
      } catch (e) {
        thrownError = e as Error;
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(thrownError!).toBe(quotaError);
  });
});