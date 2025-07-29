/**
 * Navigation State Hook
 * Manages navigation state and data preservation across routes
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationState {
  profileData?: any;
  resultsData?: any;
  previousRoute?: string;
  timestamp?: number;
}

const STORAGE_KEY = 'navigationState';
const STATE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const useNavigationState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>({});

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const now = Date.now();
        
        // Check if state has expired
        if (parsed.timestamp && (now - parsed.timestamp) < STATE_EXPIRY) {
          setNavigationState(parsed);
        } else {
          // Clear expired state
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to parse navigation state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(navigationState).length > 0) {
      const stateWithTimestamp = {
        ...navigationState,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    }
  }, [navigationState]);

  // Update previous route when location changes
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      previousRoute: location.pathname
    }));
  }, [location.pathname]);

  // Save profile data
  const saveProfileData = useCallback((data: any) => {
    setNavigationState(prev => ({
      ...prev,
      profileData: data
    }));
  }, []);

  // Save results data
  const saveResultsData = useCallback((data: any) => {
    setNavigationState(prev => ({
      ...prev,
      resultsData: data
    }));
  }, []);

  // Navigate with state preservation
  const navigateWithState = useCallback((
    path: string, 
    options?: { 
      replace?: boolean; 
      state?: any;
      preserveData?: boolean;
    }
  ) => {
    const { replace = false, state, preserveData = true } = options || {};
    
    if (preserveData) {
      // Update navigation state before navigating
      setNavigationState(prev => ({
        ...prev,
        previousRoute: location.pathname
      }));
    }
    
    navigate(path, { replace, state });
  }, [navigate, location.pathname]);

  // Navigate back with data preservation
  const navigateBack = useCallback((fallbackPath = '/profile') => {
    const { previousRoute } = navigationState;
    
    if (previousRoute && previousRoute !== location.pathname) {
      navigate(previousRoute);
    } else {
      navigate(fallbackPath);
    }
  }, [navigate, navigationState, location.pathname]);

  // Clear navigation state
  const clearNavigationState = useCallback(() => {
    setNavigationState({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get profile data
  const getProfileData = useCallback(() => {
    return navigationState.profileData;
  }, [navigationState.profileData]);

  // Get results data
  const getResultsData = useCallback(() => {
    return navigationState.resultsData;
  }, [navigationState.resultsData]);

  // Check if we can go back
  const canGoBack = useCallback(() => {
    return !!(navigationState.previousRoute && 
             navigationState.previousRoute !== location.pathname);
  }, [navigationState.previousRoute, location.pathname]);

  // Get breadcrumb trail
  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs = [];
    const currentPath = location.pathname;
    
    // Add home/profile as root
    breadcrumbs.push({
      path: '/profile',
      label: 'Profile',
      active: currentPath === '/profile'
    });
    
    // Add current page if not profile
    if (currentPath !== '/profile') {
      const pathMap: Record<string, string> = {
        '/results': 'Results',
        '/analytics': 'Analytics',
        '/help': 'Help',
        '/about': 'About'
      };
      
      const label = pathMap[currentPath] || 'Page';
      breadcrumbs.push({
        path: currentPath,
        label,
        active: true
      });
    }
    
    return breadcrumbs;
  }, [location.pathname]);

  return {
    navigationState,
    saveProfileData,
    saveResultsData,
    navigateWithState,
    navigateBack,
    clearNavigationState,
    getProfileData,
    getResultsData,
    canGoBack,
    getBreadcrumbs
  };
};

export default useNavigationState;