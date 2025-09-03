/**
 * Enhanced useTranslation hook with TypeScript support and additional utilities
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { SupportedLanguage } from '../types';

interface TranslationOptions {
  count?: number;
  context?: string;
  defaultValue?: string;
  interpolation?: Record<string, any>;
}

interface UseTranslationReturn {
  t: (key: string, options?: TranslationOptions) => string;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isLoading: boolean;
  direction: 'ltr' | 'rtl';
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  getLocalizedOptions: <T extends { label: string; value: any }>(
    options: T[],
    labelKey: string
  ) => T[];
}

export const useTranslation = (): UseTranslationReturn => {
  const { t: i18nT } = useI18nTranslation();
  const { language, setLanguage, isLoading, direction } = useLanguage();

  /**
   * Enhanced translation function with better error handling and fallbacks
   */
  const t = (key: string, options: TranslationOptions = {}): string => {
    const { defaultValue, interpolation, ...i18nOptions } = options;
    
    try {
      const translation = (i18nT as any)(key, {
        ...i18nOptions,
        ...interpolation,
        defaultValue: defaultValue || key,
      });
      
      // Ensure we always return a string
      return String(translation || defaultValue || key);
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return defaultValue || key;
    }
  };

  /**
   * Format numbers according to current language locale
   */
  const formatNumber = (num: number): string => {
    const locale = language === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale).format(num);
  };

  /**
   * Format currency according to current language locale
   */
  const formatCurrency = (amount: number): string => {
    const locale = language === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Format date according to current language locale
   */
  const formatDate = (date: Date): string => {
    const locale = language === 'hindi' ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  /**
   * Get localized options for select components
   */
  const getLocalizedOptions = <T extends { label: string; value: any }>(
    options: T[],
    labelKey: string
  ): T[] => {
    return options.map(option => ({
      ...option,
      label: t(`${labelKey}.${option.value}`) || { defaultValue: option.label },
    }));
  };

  return {
    t,
    language,
    setLanguage,
    isLoading,
    direction,
    formatNumber,
    formatCurrency,
    formatDate,
    getLocalizedOptions,
  };
};

/**
 * Hook for form field translations
 */
export const useFormTranslation = (sectionKey: string) => {
  const { t } = useTranslation();

  const getFieldTranslation = (fieldName: string, type: 'label' | 'placeholder' | 'error' | 'helpText'): string => {
    return t(`form.${sectionKey}.${fieldName}.${type}`) || `${sectionKey}.${fieldName}.${type}`;
  };

  const getOptionTranslation = (fieldName: string, optionValue: string): string => {
    return t(`form.${sectionKey}.${fieldName}.options.${optionValue}`) || optionValue;
  };

  return {
    t,
    getFieldTranslation,
    getOptionTranslation,
  };
};

/**
 * Hook for validation message translations
 */
export const useValidationTranslation = () => {
  const { t } = useTranslation();

  const getValidationMessage = (
    type: 'required' | 'minLength' | 'maxLength' | 'invalidEmail' | 'invalidPhone' | 'selectAtLeastOne' | 'invalidAge',
    options?: Record<string, any>
  ): string => {
    return t(`form.validation.${type}`) || `Validation error: ${type}`;
  };

  return {
    getValidationMessage,
  };
};

/**
 * Hook for error message translations
 */
export const useErrorTranslation = () => {
  const { t } = useTranslation();

  const getErrorMessage = (
    category: 'generic' | 'network' | 'validation' | 'server' | 'notFound' | 'unauthorized' | 'timeout',
    subcategory?: string
  ): string => {
    const key = subcategory ? `errors.${category}.${subcategory}` : `errors.${category}`;
    return t(key, { defaultValue: 'An error occurred' });
  };

  return {
    getErrorMessage,
  };
};

/**
 * Hook for success message translations
 */
export const useSuccessTranslation = () => {
  const { t } = useTranslation();

  const getSuccessMessage = (
    type: 'profileSaved' | 'recommendationsGenerated' | 'reportDownloaded' | 'feedbackSubmitted'
  ): string => {
    return t(`success.${type}`) || 'Operation completed successfully';
  };

  return {
    getSuccessMessage,
  };
};

export default useTranslation;