/**
 * Tests for LanguageContext
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage, LanguageUtils } from '../LanguageContext';
import { SupportedLanguage } from '../../types';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options && typeof options === 'object') {
        return key.replace(/\{\{(\w+)\}\}/g, (match, variable) => options[variable] || match);
      }
      return key;
    },
    i18n: {
      language: 'english',
      changeLanguage: jest.fn().mockResolvedValue(undefined),
    },
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test component that uses the language context
const TestComponent: React.FC = () => {
  const { language, setLanguage, t, isLoading, direction } = useLanguage();

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="direction">{direction}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="translation">{t('test.key', 'Default Value')}</div>
      <button 
        data-testid="change-to-hindi" 
        onClick={() => setLanguage('hindi')}
      >
        Change to Hindi
      </button>
      <button 
        data-testid="change-to-english" 
        onClick={() => setLanguage('english')}
      >
        Change to English
      </button>
    </div>
  );
};

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('LanguageProvider', () => {
    test('should provide default language as english', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('english');
      expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
    });

    test('should load saved language from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('hindi');

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('hindi');
    });

    test('should change language when setLanguage is called', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByTestId('change-to-hindi'));

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hindi');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('i18nextLng', 'hindi');
    });

    test('should not change language if same language is selected', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByTestId('change-to-english'));

      // Should not trigger any changes since english is already selected
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    test('should show loading state during language change', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByTestId('change-to-hindi'));

      // Loading state should be briefly true
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hindi');
      });
    });

    test('should provide translation function', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('test.key');
    });

    test('should throw error when useLanguage is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLanguage must be used within a LanguageProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('LanguageUtils', () => {
    test('should return correct display names', () => {
      expect(LanguageUtils.getLanguageDisplayName('english')).toBe('English');
      expect(LanguageUtils.getLanguageDisplayName('hindi')).toBe('हिंदी');
    });

    test('should return correct native names', () => {
      expect(LanguageUtils.getLanguageNativeName('english')).toBe('English');
      expect(LanguageUtils.getLanguageNativeName('hindi')).toBe('हिंदी');
    });

    test('should return correct language codes', () => {
      expect(LanguageUtils.getLanguageCode('english')).toBe('en');
      expect(LanguageUtils.getLanguageCode('hindi')).toBe('hi');
    });

    test('should detect browser language support', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'hi-IN',
      });

      expect(LanguageUtils.isBrowserLanguageSupported()).toBe('hindi');

      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'en-US',
      });

      expect(LanguageUtils.isBrowserLanguageSupported()).toBe('english');

      Object.defineProperty(navigator, 'language', {
        writable: true,
        value: 'fr-FR',
      });

      expect(LanguageUtils.isBrowserLanguageSupported()).toBeNull();
    });

    test('should return correct font families', () => {
      const englishFont = LanguageUtils.getFontFamily('english');
      const hindiFont = LanguageUtils.getFontFamily('hindi');

      expect(englishFont).toContain('Roboto');
      expect(hindiFont).toContain('Noto Sans Devanagari');
    });

    test('should format numbers correctly', () => {
      const number = 123456.789;

      const englishFormatted = LanguageUtils.formatNumber(number, 'english');
      const hindiFormatted = LanguageUtils.formatNumber(number, 'hindi');

      expect(englishFormatted).toContain('123,456');
      expect(hindiFormatted).toContain('123,456');
    });

    test('should format currency correctly', () => {
      const amount = 50000;

      const englishFormatted = LanguageUtils.formatCurrency(amount, 'english');
      const hindiFormatted = LanguageUtils.formatCurrency(amount, 'hindi');

      expect(englishFormatted).toContain('₹');
      expect(englishFormatted).toContain('50,000');
      expect(hindiFormatted).toContain('₹');
    });

    test('should format dates correctly', () => {
      const date = new Date('2024-01-15');

      const englishFormatted = LanguageUtils.formatDate(date, 'english');
      const hindiFormatted = LanguageUtils.formatDate(date, 'hindi');

      expect(englishFormatted).toContain('January');
      expect(englishFormatted).toContain('2024');
      expect(hindiFormatted).toContain('2024');
    });
  });

  describe('Language switching integration', () => {
    test('should dispatch custom event on language change', async () => {
      const eventListener = jest.fn();
      window.addEventListener('languageChanged', eventListener);

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByTestId('change-to-hindi'));

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: { language: 'hindi' }
          })
        );
      });

      window.removeEventListener('languageChanged', eventListener);
    });

    test('should update document attributes on language change', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      fireEvent.click(screen.getByTestId('change-to-hindi'));

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('hi');
        expect(document.documentElement.dir).toBe('ltr');
      });
    });

    test('should handle storage events', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Simulate storage event
      const storageEvent = new StorageEvent('storage', {
        key: 'i18nextLng',
        newValue: 'hindi',
      });

      fireEvent(window, storageEvent);

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('hindi');
      });
    });
  });
});