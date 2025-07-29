/**
 * Language Context Provider for managing language state and translations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SupportedLanguage, isSupportedLanguage } from '../types';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultValue?: string, options?: any) => string;
  isLoading: boolean;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize language from localStorage or default to English
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      return savedLanguage;
    }
    return 'english';
  });

  // Get text direction based on language
  const direction: 'ltr' | 'rtl' = language === 'hindi' ? 'ltr' : 'ltr'; // Hindi is LTR, but can be changed if needed

  const setLanguage = async (newLanguage: SupportedLanguage): Promise<void> => {
    if (newLanguage === language) return;

    setIsLoading(true);
    try {
      await i18n.changeLanguage(newLanguage);
      setLanguageState(newLanguage);
      localStorage.setItem('i18nextLng', newLanguage);
      
      // Update document language and direction
      document.documentElement.lang = newLanguage === 'hindi' ? 'hi' : 'en';
      document.documentElement.dir = direction;
      
      // Dispatch custom event for language change
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      }));
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced translation function with fallback
  const translate = (key: string, defaultValue?: string, options?: any): string => {
    const translation = t(key, options);
    
    // If translation is the same as key, it means translation is missing
    if (translation === key && defaultValue) {
      return defaultValue;
    }
    
    return translation;
  };

  // Initialize i18n language on mount
  useEffect(() => {
    const initializeLanguage = async (): Promise<void> => {
      if (i18n.language !== language) {
        setIsLoading(true);
        try {
          await i18n.changeLanguage(language);
          document.documentElement.lang = language === 'hindi' ? 'hi' : 'en';
          document.documentElement.dir = direction;
        } catch (error) {
          console.error('Failed to initialize language:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeLanguage();
  }, [i18n, language, direction]);

  // Listen for system language changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'i18nextLng' && e.newValue && isSupportedLanguage(e.newValue)) {
        setLanguageState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t: translate,
    isLoading,
    direction,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// HOC for components that need language context
export const withLanguage = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <LanguageProvider>
      <Component {...props} />
    </LanguageProvider>
  );
};

// Utility functions for language management
export const LanguageUtils = {
  /**
   * Get the display name for a language
   */
  getLanguageDisplayName: (lang: SupportedLanguage): string => {
    const displayNames: Record<SupportedLanguage, string> = {
      english: 'English',
      hindi: 'हिंदी',
    };
    return displayNames[lang];
  },

  /**
   * Get the native name for a language
   */
  getLanguageNativeName: (lang: SupportedLanguage): string => {
    const nativeNames: Record<SupportedLanguage, string> = {
      english: 'English',
      hindi: 'हिंदी',
    };
    return nativeNames[lang];
  },

  /**
   * Get the ISO code for a language
   */
  getLanguageCode: (lang: SupportedLanguage): string => {
    const codes: Record<SupportedLanguage, string> = {
      english: 'en',
      hindi: 'hi',
    };
    return codes[lang];
  },

  /**
   * Check if browser supports a language
   */
  isBrowserLanguageSupported: (): SupportedLanguage | null => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('hi')) return 'hindi';
    if (browserLang.startsWith('en')) return 'english';
    return null;
  },

  /**
   * Get appropriate font family for language
   */
  getFontFamily: (lang: SupportedLanguage): string => {
    const fonts: Record<SupportedLanguage, string> = {
      english: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      hindi: '"Noto Sans Devanagari", "Mangal", "Devanagari Sangam MN", sans-serif',
    };
    return fonts[lang];
  },

  /**
   * Format numbers according to language locale
   */
  formatNumber: (num: number, lang: SupportedLanguage): string => {
    const locale = lang === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale).format(num);
  },

  /**
   * Format currency according to language locale
   */
  formatCurrency: (amount: number, lang: SupportedLanguage): string => {
    const locale = lang === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  },

  /**
   * Format date according to language locale
   */
  formatDate: (date: Date, lang: SupportedLanguage): string => {
    const locale = lang === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },
};