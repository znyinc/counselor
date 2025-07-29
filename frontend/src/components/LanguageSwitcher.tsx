/**
 * Language Switcher Component
 */

import React, { useState } from 'react';
import { useLanguage, LanguageUtils } from '../contexts/LanguageContext';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'buttons';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  size = 'medium',
  showLabel = true,
  className = '',
}) => {
  const { language, setLanguage, t, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: SupportedLanguage): Promise<void> => {
    if (newLanguage !== language) {
      await setLanguage(newLanguage);
      setIsOpen(false);
    }
  };

  const getSizeClasses = (): string => {
    const sizeClasses = {
      small: 'text-sm px-2 py-1',
      medium: 'text-base px-3 py-2',
      large: 'text-lg px-4 py-3',
    };
    return sizeClasses[size];
  };

  const renderDropdown = (): JSX.Element => (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          ${getSizeClasses()}
          bg-white border border-gray-300 rounded-md shadow-sm
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center space-x-2
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-2">
          <span className="text-lg">
            {language === 'hindi' ? '🇮🇳' : '🇬🇧'}
          </span>
          {showLabel && (
            <span>{LanguageUtils.getLanguageDisplayName(language)}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="py-1" role="listbox">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`
                  w-full text-left px-4 py-2 hover:bg-gray-100
                  flex items-center space-x-3
                  ${language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
                role="option"
                aria-selected={language === lang}
              >
                <span className="text-lg">
                  {lang === 'hindi' ? '🇮🇳' : '🇬🇧'}
                </span>
                <span>{LanguageUtils.getLanguageDisplayName(lang)}</span>
                {language === lang && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderToggle = (): JSX.Element => (
    <button
      onClick={() => handleLanguageChange(language === 'english' ? 'hindi' : 'english')}
      disabled={isLoading}
      className={`
        ${getSizeClasses()}
        bg-blue-600 text-white rounded-md hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center space-x-2 transition-colors
        ${className}
      `}
      title={t('language.switchTo', 'Switch to {{language}}', {
        language: LanguageUtils.getLanguageDisplayName(language === 'english' ? 'hindi' : 'english')
      })}
    >
      <span className="text-lg">
        {language === 'english' ? '🇮🇳' : '🇬🇧'}
      </span>
      {showLabel && (
        <span>
          {language === 'english' ? 'हिंदी' : 'English'}
        </span>
      )}
      {isLoading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
    </button>
  );

  const renderButtons = (): JSX.Element => (
    <div className={`flex space-x-1 ${className}`}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
          disabled={isLoading}
          className={`
            ${getSizeClasses()}
            rounded-md border transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center space-x-2
            ${language === lang
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <span className="text-lg">
            {lang === 'hindi' ? '🇮🇳' : '🇬🇧'}
          </span>
          {showLabel && (
            <span>{LanguageUtils.getLanguageDisplayName(lang)}</span>
          )}
        </button>
      ))}
    </div>
  );

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.relative')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  switch (variant) {
    case 'toggle':
      return renderToggle();
    case 'buttons':
      return renderButtons();
    case 'dropdown':
    default:
      return renderDropdown();
  }
};

export default LanguageSwitcher;