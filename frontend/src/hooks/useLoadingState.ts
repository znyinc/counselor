/**
 * Loading State Hook
 * Manages loading states and progress indicators
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
  stage: string;
  startTime: number | null;
  estimatedDuration: number | null;
}

export interface LoadingOptions {
  message?: string;
  stage?: string;
  estimatedDuration?: number;
  showProgress?: boolean;
}

export const useLoadingState = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
    stage: '',
    startTime: null,
    estimatedDuration: null
  });

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const stageTimeouts = useRef<NodeJS.Timeout[]>([]);

  const startLoading = useCallback((options: LoadingOptions = {}) => {
    const {
      message = 'Loading...',
      stage = 'initializing',
      estimatedDuration = null,
      showProgress = true
    } = options;

    setLoadingState({
      isLoading: true,
      progress: 0,
      message,
      stage,
      startTime: Date.now(),
      estimatedDuration
    });

    // Start progress simulation if enabled and estimated duration is provided
    if (showProgress && estimatedDuration) {
      simulateProgress(estimatedDuration);
    }
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100
    }));

    // Clear intervals and timeouts
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    stageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    stageTimeouts.current = [];
  }, []);

  const updateProgress = useCallback((progress: number, message?: string, stage?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      ...(message && { message }),
      ...(stage && { stage })
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const updateStage = useCallback((stage: string, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      ...(message && { message })
    }));
  }, []);

  const simulateProgress = useCallback((duration: number) => {
    const startTime = Date.now();
    const interval = 100; // Update every 100ms
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(95, (elapsed / duration) * 100); // Cap at 95% until completion
      
      setLoadingState(prev => ({
        ...prev,
        progress
      }));
      
      if (progress >= 95) {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    }, interval);
  }, []);

  const withLoading = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: LoadingOptions = {}
  ) => {
    return async (...args: T): Promise<R> => {
      startLoading(options);
      try {
        const result = await fn(...args);
        stopLoading();
        return result;
      } catch (error) {
        stopLoading();
        throw error;
      }
    };
  }, [startLoading, stopLoading]);

  const createStageSequence = useCallback((stages: Array<{
    stage: string;
    message: string;
    duration: number;
  }>) => {
    let currentProgress = 0;
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    
    stages.forEach((stageInfo, index) => {
      const timeout = setTimeout(() => {
        updateStage(stageInfo.stage, stageInfo.message);
        
        // Update progress based on stage completion
        currentProgress += (stageInfo.duration / totalDuration) * 100;
        updateProgress(currentProgress);
      }, stages.slice(0, index).reduce((sum, s) => sum + s.duration, 0));
      
      stageTimeouts.current.push(timeout);
    });
  }, [updateStage, updateProgress]);

  // AI Processing specific loading states
  const startAIProcessing = useCallback(() => {
    startLoading({
      message: 'Processing your profile with AI...',
      stage: 'analyzing',
      estimatedDuration: 15000, // 15 seconds
      showProgress: true
    });

    // Create AI processing stages
    createStageSequence([
      { stage: 'analyzing', message: 'Analyzing your profile...', duration: 3000 },
      { stage: 'matching', message: 'Finding career matches...', duration: 5000 },
      { stage: 'generating', message: 'Generating recommendations...', duration: 4000 },
      { stage: 'finalizing', message: 'Finalizing results...', duration: 3000 }
    ]);
  }, [startLoading, createStageSequence]);

  // Form validation loading
  const startFormValidation = useCallback(() => {
    startLoading({
      message: 'Validating form data...',
      stage: 'validating',
      estimatedDuration: 2000,
      showProgress: true
    });
  }, [startLoading]);

  // Data fetching loading
  const startDataFetching = useCallback((message: string = 'Fetching data...') => {
    startLoading({
      message,
      stage: 'fetching',
      estimatedDuration: 3000,
      showProgress: true
    });
  }, [startLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      stageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Calculate elapsed time
  const elapsedTime = loadingState.startTime 
    ? Date.now() - loadingState.startTime 
    : 0;

  // Calculate estimated remaining time
  const estimatedRemainingTime = loadingState.estimatedDuration && loadingState.startTime
    ? Math.max(0, loadingState.estimatedDuration - elapsedTime)
    : null;

  return {
    loadingState,
    isLoading: loadingState.isLoading,
    progress: loadingState.progress,
    message: loadingState.message,
    stage: loadingState.stage,
    elapsedTime,
    estimatedRemainingTime,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    updateStage,
    withLoading,
    createStageSequence,
    startAIProcessing,
    startFormValidation,
    startDataFetching
  };
};

export default useLoadingState;