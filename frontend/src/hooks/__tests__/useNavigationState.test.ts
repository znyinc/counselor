/**
 * Navigation State Hook Tests
 * Tests for navigation state management and data preservation
 */

import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigationState } from '../useNavigationState';
import React from 'react';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/profile' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('useNavigationState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      expect(result.current.navigationState).toEqual({});
      expect(result.current.getProfileData()).toBeUndefined();
      expect(result.current.getResultsData()).toBeUndefined();
    });

    it('should load saved state from localStorage', () => {
      const savedState = {
        profileData: { id: 'test-profile', name: 'Test User' },
        resultsData: { recommendations: [] },
        timestamp: Date.now()
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));
      
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      expect(result.current.getProfileData()).toEqual(savedState.profileData);
      expect(result.current.getResultsData()).toEqual(savedState.resultsData);
    });

    it('should ignore expired state from localStorage', () => {
      const expiredState = {
        profileData: { id: 'test-profile' },
        timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredState));
      
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      expect(result.current.getProfileData()).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('navigationState');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      expect(result.current.navigationState).toEqual({});
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('navigationState');
    });
  });

  describe('Profile Data Management', () => {
    it('should save profile data', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const profileData = { id: 'test-profile', name: 'Test User' };
      
      act(() => {
        result.current.saveProfileData(profileData);
      });
      
      expect(result.current.getProfileData()).toEqual(profileData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'navigationState',
        expect.stringContaining('"profileData"')
      );
    });

    it('should update profile data', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const initialData = { id: 'test-profile', name: 'Test User' };
      const updatedData = { id: 'test-profile', name: 'Updated User' };
      
      act(() => {
        result.current.saveProfileData(initialData);
      });
      
      act(() => {
        result.current.saveProfileData(updatedData);
      });
      
      expect(result.current.getProfileData()).toEqual(updatedData);
    });
  });

  describe('Results Data Management', () => {
    it('should save results data', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const resultsData = { recommendations: [{ id: 'career1', title: 'Software Engineer' }] };
      
      act(() => {
        result.current.saveResultsData(resultsData);
      });
      
      expect(result.current.getResultsData()).toEqual(resultsData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'navigationState',
        expect.stringContaining('"resultsData"')
      );
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate with state preservation', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      act(() => {
        result.current.navigateWithState('/results', { 
          preserveData: true,
          state: { profileId: 'test-123' }
        });
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/results', {
        replace: false,
        state: { profileId: 'test-123' }
      });
    });

    it('should navigate with replace option', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      act(() => {
        result.current.navigateWithState('/results', { replace: true });
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/results', {
        replace: true,
        state: undefined
      });
    });

    it('should navigate back to previous route', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      // Set up previous route
      act(() => {
        result.current.navigationState.previousRoute = '/profile';
      });
      
      act(() => {
        result.current.navigateBack();
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to fallback when no previous route', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      act(() => {
        result.current.navigateBack('/home');
      });
      
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('should check if can go back', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      expect(result.current.canGoBack()).toBe(false);
      
      act(() => {
        result.current.navigationState.previousRoute = '/profile';
      });
      
      expect(result.current.canGoBack()).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should clear navigation state', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      // Set some data first
      act(() => {
        result.current.saveProfileData({ id: 'test' });
      });
      
      expect(result.current.getProfileData()).toBeDefined();
      
      act(() => {
        result.current.clearNavigationState();
      });
      
      expect(result.current.getProfileData()).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('navigationState');
    });

    it('should save state to localStorage when updated', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      act(() => {
        result.current.saveProfileData({ id: 'test-profile' });
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'navigationState',
        expect.stringContaining('"profileData"')
      );
    });
  });

  describe('Breadcrumbs', () => {
    it('should generate breadcrumbs for profile page', () => {
      mockLocation.pathname = '/profile';
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const breadcrumbs = result.current.getBreadcrumbs();
      
      expect(breadcrumbs).toEqual([
        { path: '/profile', label: 'Profile', active: true }
      ]);
    });

    it('should generate breadcrumbs for results page', () => {
      mockLocation.pathname = '/results';
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const breadcrumbs = result.current.getBreadcrumbs();
      
      expect(breadcrumbs).toEqual([
        { path: '/profile', label: 'Profile', active: false },
        { path: '/results', label: 'Results', active: true }
      ]);
    });

    it('should generate breadcrumbs for analytics page', () => {
      mockLocation.pathname = '/analytics';
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const breadcrumbs = result.current.getBreadcrumbs();
      
      expect(breadcrumbs).toEqual([
        { path: '/profile', label: 'Profile', active: false },
        { path: '/analytics', label: 'Analytics', active: true }
      ]);
    });

    it('should handle unknown paths in breadcrumbs', () => {
      mockLocation.pathname = '/unknown';
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const breadcrumbs = result.current.getBreadcrumbs();
      
      expect(breadcrumbs).toEqual([
        { path: '/profile', label: 'Profile', active: false },
        { path: '/unknown', label: 'Page', active: true }
      ]);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useNavigationState(), { wrapper });
      
      const profileData = { id: 'test-profile', name: 'Test User' };
      
      act(() => {
        result.current.saveProfileData(profileData);
      });
      
      rerender();
      
      expect(result.current.getProfileData()).toEqual(profileData);
    });

    it('should handle multiple data updates', () => {
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      const profileData = { id: 'test-profile' };
      const resultsData = { recommendations: [] };
      
      act(() => {
        result.current.saveProfileData(profileData);
        result.current.saveResultsData(resultsData);
      });
      
      expect(result.current.getProfileData()).toEqual(profileData);
      expect(result.current.getResultsData()).toEqual(resultsData);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      // Should not throw error
      act(() => {
        result.current.saveProfileData({ id: 'test' });
      });
      
      // State should still be updated in memory
      expect(result.current.getProfileData()).toEqual({ id: 'test' });
    });

    it('should handle navigation errors gracefully', () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      const { result } = renderHook(() => useNavigationState(), { wrapper });
      
      // Should not throw error
      expect(() => {
        act(() => {
          result.current.navigateWithState('/results');
        });
      }).not.toThrow();
    });
  });
});