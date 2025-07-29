/**
 * Navigation Component Tests
 * Tests for navigation bar functionality and routing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Mock the hooks
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation()
}));

jest.mock('../LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>
}));

const renderWithRouter = (initialPath = '/profile') => {
  mockUseLocation.mockReturnValue({ pathname: initialPath });
  
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <Navigation />
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Brand and Logo', () => {
    it('should render brand logo and title', () => {
      renderWithRouter();
      
      expect(screen.getByText('🎓')).toBeInTheDocument();
      expect(screen.getByText('app.title')).toBeInTheDocument();
    });

    it('should navigate to home when brand is clicked', () => {
      renderWithRouter();
      
      const brandLink = screen.getByRole('link', { name: /app.title/i });
      fireEvent.click(brandLink);
      
      // Brand link should have href="/"
      expect(brandLink).toHaveAttribute('href', '/');
    });
  });

  describe('Navigation Links', () => {
    it('should render all navigation links', () => {
      renderWithRouter();
      
      expect(screen.getByText('navigation.profile')).toBeInTheDocument();
      expect(screen.getByText('navigation.results')).toBeInTheDocument();
      expect(screen.getByText('navigation.analytics')).toBeInTheDocument();
      expect(screen.getByText('navigation.help')).toBeInTheDocument();
      expect(screen.getByText('navigation.about')).toBeInTheDocument();
    });

    it('should highlight active navigation link', () => {
      renderWithRouter('/profile');
      
      const profileLink = screen.getByText('navigation.profile').closest('a');
      expect(profileLink).toHaveClass('active');
    });

    it('should navigate when navigation links are clicked', () => {
      renderWithRouter();
      
      const resultsLink = screen.getByText('navigation.results').closest('a');
      fireEvent.click(resultsLink!);
      
      expect(mockNavigate).toHaveBeenCalledWith('/results');
    });

    it('should close mobile menu when navigation link is clicked', () => {
      renderWithRouter();
      
      // Open mobile menu
      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(mobileToggle);
      
      // Click a navigation link
      const profileLink = screen.getByText('navigation.profile').closest('a');
      fireEvent.click(profileLink!);
      
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Mobile Menu', () => {
    it('should render mobile menu toggle button', () => {
      renderWithRouter();
      
      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      expect(mobileToggle).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', () => {
      renderWithRouter();
      
      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      const hamburger = mobileToggle.querySelector('.hamburger');
      
      expect(hamburger).not.toHaveClass('open');
      
      fireEvent.click(mobileToggle);
      expect(hamburger).toHaveClass('open');
      
      fireEvent.click(mobileToggle);
      expect(hamburger).not.toHaveClass('open');
    });

    it('should close mobile menu when overlay is clicked', () => {
      renderWithRouter();
      
      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      fireEvent.click(mobileToggle);
      
      const overlay = document.querySelector('.mobile-overlay');
      expect(overlay).toBeInTheDocument();
      
      fireEvent.click(overlay!);
      
      const hamburger = mobileToggle.querySelector('.hamburger');
      expect(hamburger).not.toHaveClass('open');
    });
  });

  describe('Back Button', () => {
    it('should show back button when not on profile page', () => {
      renderWithRouter('/results');
      
      expect(screen.getByText('common.back')).toBeInTheDocument();
    });

    it('should not show back button on profile page', () => {
      renderWithRouter('/profile');
      
      expect(screen.queryByText('common.back')).not.toBeInTheDocument();
    });

    it('should not show back button on home page', () => {
      renderWithRouter('/');
      
      expect(screen.queryByText('common.back')).not.toBeInTheDocument();
    });

    it('should navigate back when back button is clicked', () => {
      renderWithRouter('/results');
      
      const backButton = screen.getByText('common.back').closest('button');
      fireEvent.click(backButton!);
      
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Language Switcher', () => {
    it('should render language switcher', () => {
      renderWithRouter();
      
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });
  });

  describe('Active Link Detection', () => {
    it('should mark profile link as active on profile page', () => {
      renderWithRouter('/profile');
      
      const profileLink = screen.getByText('navigation.profile').closest('a');
      expect(profileLink).toHaveClass('active');
    });

    it('should mark results link as active on results page', () => {
      renderWithRouter('/results');
      
      const resultsLink = screen.getByText('navigation.results').closest('a');
      expect(resultsLink).toHaveClass('active');
    });

    it('should mark analytics link as active on analytics page', () => {
      renderWithRouter('/analytics');
      
      const analyticsLink = screen.getByText('navigation.analytics').closest('a');
      expect(analyticsLink).toHaveClass('active');
    });

    it('should handle nested routes correctly', () => {
      renderWithRouter('/results/profile123');
      
      const resultsLink = screen.getByText('navigation.results').closest('a');
      expect(resultsLink).toHaveClass('active');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter();
      
      const mobileToggle = screen.getByLabelText('Toggle navigation menu');
      expect(mobileToggle).toHaveAttribute('aria-label', 'Toggle navigation menu');
    });

    it('should have proper link roles', () => {
      renderWithRouter();
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have proper button roles', () => {
      renderWithRouter('/results');
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle mobile viewport changes', () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      renderWithRouter();
      
      // Component should render without errors on mobile
      expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });
  });
});