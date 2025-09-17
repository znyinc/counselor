/**
 * Translation helper utilities to handle i18next function signature changes
 */

import { TFunction } from 'i18next';

/**
 * Safe translation function that handles both old and new i18next signatures
 */
export const safeTranslate = (
  t: TFunction,
  key: string,
  fallback?: string,
  options?: Record<string, any>
): string => {
  try {
    if (options) {
      // For interpolation with variables
      return t(key, options) as string || fallback || key;
    } else {
      // Simple translation
      return t(key) as string || fallback || key;
    }
  } catch (error) {
    console.warn(`Translation error for key "${key}":`, error);
    return fallback || key;
  }
};

/**
 * Translation function with interpolation support
 */
export const translateWithVars = (
  t: TFunction,
  key: string,
  variables: Record<string, any>,
  fallback?: string
): string => {
  try {
    return t(key, variables) as string || fallback || key;
  } catch (error) {
    console.warn(`Translation error for key "${key}" with variables:`, error);
    return fallback || key;
  }
};