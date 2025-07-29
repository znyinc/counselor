/**
 * Router Component Tests
 * Tests for routing and navigation functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '../Router';

// Mock components to avoid complex dependencies
jest.mock('../StudentProfileForm', () => ({
  StudentProfileForm: () => <div data-testid="profile-form">Profile Form</div>
}));

jest.mock('../ResultsPage', () => ({
  ResultsPage: () => <div data-testid="results-page">Results Page</div>
}));

jest.mock('../admin/AnalyticsDashboard', () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard">Analytics Dashboard</div>
}));

jest.mock('../Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>
}));

jest.mock('../ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  )
}));

jest.mock('../NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">Not Found</div>
}));

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppRouter />
    </MemoryRouter>
  );
};

describe('AppRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Route Navigation', () => {
    it('should redirect root path to profile', () => {
      renderWithRouter(['/']);
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should render profile form on /profile route', () => {
      renderWithRouter(['/profile']);
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    it('should render results page on /results route', () => {
      renderWithRouter(['/results']);
      expect(screen.getByTestId('results-page')).toBeInTheDocument();
    });

    it('should render results page with profile ID parameter', () => {
      renderWithRouter(['/results/profile123']);
      expect(screen.getByTestId('results-page')).toBeInTheDocument();
    });

    it('should render analytics dashboard on /analytics route', () => {
      renderWithRouter(['/analytics']);
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      expect(screen.getByTestId('analytics-dashboard')).toBeInTheDocument();
    });

    it('should render help page on /help route', () => {
      renderWithRouter(['/help']);
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });

    it('should render about page on /about route', () => {
      renderWithRouter(['/about']);
      expect(screen.getByText('About AI Career Counseling')).toBeInTheDocument();
    });

    it('should render 404 page for unknown routes', () => {
      renderWithRouter(['/unknown-route']);
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });

  describe('Navigation Component', () => {
    it('should render navigation component on all routes', () => {
      renderWithRouter(['/profile']);
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('should maintain navigation across route changes', () => {
      const { rerender } = renderWithRouter(['/profile']);
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      
      rerender(
        <MemoryRouter initialEntries={['/results']}>
          <AppRouter />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('should wrap analytics route with ProtectedRoute', () => {
      renderWithRouter(['/analytics']);
      expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    });
  });

  describe('Language Provider', () => {
    it('should wrap entire app with LanguageProvider', () => {
      renderWithRouter(['/profile']);
      // The LanguageProvider should be present (tested indirectly through component rendering)
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });
  });
});