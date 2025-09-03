/**
 * Form Validation Feedback Component
 * Provides enhanced validation feedback with specific error messages
 */

import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './FormValidationFeedback.css';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  constraint?: any;
}

export interface FormValidationFeedbackProps {
  errors: ValidationError[];
  field: string;
  showIcon?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

export const FormValidationFeedback: React.FC<FormValidationFeedbackProps> = ({
  errors,
  field,
  showIcon = true,
  showSuggestions = true,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const fieldErrors = errors.filter(error => error.field === field);
  
  if (fieldErrors.length === 0) {
    return null;
  }

  const getErrorIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'required':
        return '⚠️';
      case 'invalid':
        return '❌';
      case 'minLength':
      case 'maxLength':
        return '📏';
      case 'pattern':
        return '🔤';
      default:
        return '❗';
    }
  };

  const getSuggestion = (error: ValidationError): string | null => {
    switch (error.type) {
      case 'required':
        return t('form.validation.suggestions.required') || 'This field is required to continue.';
      case 'minLength':
        return t('form.validation.suggestions.minLength', { min: error.constraint } as any) || `Please enter at least ${error.constraint} characters.`;
      case 'maxLength':
        return t('form.validation.suggestions.maxLength', { max: error.constraint } as any) || `Please enter no more than ${error.constraint} characters.`;
      case 'pattern':
        if (field.includes('email')) {
          return t('form.validation.suggestions.email') || 'Please enter a valid email address (e.g., user@example.com).';
        }
        if (field.includes('phone')) {
          return t('form.validation.suggestions.phone') || 'Please enter a valid phone number (e.g., +91 9876543210).';
        }
        if (field.includes('name')) {
          return t('form.validation.suggestions.name') || 'Use only letters and spaces in your name.';
        }
        if (field.includes('location')) {
          return t('form.validation.suggestions.location') || 'Enter your city and state (e.g., Mumbai, Maharashtra).';
        }
        return t('form.validation.suggestions.pattern') || 'Please check the format of your input.';
      case 'invalid':
        if (field.includes('age')) {
          return t('form.validation.suggestions.age') || 'Please enter a valid age between 10 and 25.';
        }
        if (field.includes('familyBackground')) {
          return t('form.validation.suggestions.familyBackground') || 'Briefly describe your family\'s educational and professional background.';
        }
        return t('form.validation.suggestions.invalid') || 'Please enter a valid value.';
      case 'custom':
        // Handle custom validation suggestions
        if (field.includes('interests') || field.includes('subjects')) {
          return t('form.validation.suggestions.selectMultiple') || 'You can select multiple options that apply to you.';
        }
        if (field.includes('grade') || field.includes('board') || field.includes('language')) {
          return t('form.validation.suggestions.selectOne') || 'Please select one option from the list.';
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={`form-validation-feedback ${className}`}>
      {fieldErrors.map((error, index) => (
        <div key={index} className={`validation-error validation-error-${error.type}`}>
          <div className="error-content">
            {showIcon && (
              <span className="error-icon" role="img" aria-label="Error">
                {getErrorIcon(error.type)}
              </span>
            )}
            <span className="error-message">{error.message}</span>
          </div>
          
          {showSuggestions && (
            <div className="error-suggestion">
              {getSuggestion(error)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Field-specific validation feedback components
export const EmailValidationFeedback: React.FC<{
  value: string;
  errors: ValidationError[];
  showStrength?: boolean;
}> = ({ value, errors, showStrength = false }) => {
  const { t } = useTranslation();
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailPattern.test(value);
  
  const getEmailStrength = (email: string): 'weak' | 'medium' | 'strong' => {
    if (!email || !isValid) return 'weak';
    
    const hasCommonDomain = /@(gmail|yahoo|hotmail|outlook)\./.test(email);
    const hasNumbers = /\d/.test(email);
    const hasSpecialChars = /[._-]/.test(email);
    
    if (hasCommonDomain && hasNumbers && hasSpecialChars) return 'strong';
    if (hasCommonDomain || hasNumbers || hasSpecialChars) return 'medium';
    return 'weak';
  };

  return (
    <div className="email-validation-feedback">
      <FormValidationFeedback errors={errors} field="email" />
      
      {showStrength && value && isValid && (
        <div className="email-strength">
          <div className="strength-label">
            {t('validation.email.strength') || 'Email strength:'}
          </div>
          <div className={`strength-indicator strength-${getEmailStrength(value)}`}>
            <div className="strength-bar"></div>
            <div className="strength-bar"></div>
            <div className="strength-bar"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PasswordValidationFeedback: React.FC<{
  value: string;
  errors: ValidationError[];
  showStrength?: boolean;
}> = ({ value, errors, showStrength = true }) => {
  const { t } = useTranslation();
  
  const getPasswordStrength = (password: string): {
    score: number;
    level: 'weak' | 'medium' | 'strong';
    checks: Array<{ label: string; passed: boolean }>;
  } => {
    const checks = [
      { label: t('validation.password.minLength') || 'At least 8 characters', passed: password.length >= 8 },
      { label: t('validation.password.uppercase') || 'Contains uppercase letter', passed: /[A-Z]/.test(password) },
      { label: t('validation.password.lowercase') || 'Contains lowercase letter', passed: /[a-z]/.test(password) },
      { label: t('validation.password.number') || 'Contains number', passed: /\d/.test(password) },
      { label: t('validation.password.special') || 'Contains special character', passed: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];
    
    const score = checks.filter(check => check.passed).length;
    let level: 'weak' | 'medium' | 'strong' = 'weak';
    
    if (score >= 4) level = 'strong';
    else if (score >= 2) level = 'medium';
    
    return { score, level, checks };
  };

  const strength = getPasswordStrength(value);

  return (
    <div className="password-validation-feedback">
      <FormValidationFeedback errors={errors} field="password" />
      
      {showStrength && value && (
        <div className="password-strength">
          <div className="strength-header">
            <span className="strength-label">
              {t('validation.password.strength') || 'Password strength:'}
            </span>
            <span className={`strength-level strength-level-${strength.level}`}>
              {t(`validation.password.${strength.level}`) || strength.level}
            </span>
          </div>
          
          <div className="strength-progress">
            <div className={`strength-bar strength-bar-${strength.level}`}>
              <div 
                className="strength-fill"
                style={{ width: `${(strength.score / 5) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="strength-checks">
            {strength.checks.map((check, index) => (
              <div key={index} className={`strength-check ${check.passed ? 'passed' : 'failed'}`}>
                <span className="check-icon">
                  {check.passed ? '✓' : '○'}
                </span>
                <span className="check-label">{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const PhoneValidationFeedback: React.FC<{
  value: string;
  errors: ValidationError[];
  countryCode?: string;
}> = ({ value, errors, countryCode = 'IN' }) => {
  const { t } = useTranslation();
  
  const formatPhoneNumber = (phone: string, country: string): string => {
    if (country === 'IN') {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
      }
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
      }
    }
    return phone;
  };

  const isValidPhone = (phone: string, country: string): boolean => {
    if (country === 'IN') {
      const cleaned = phone.replace(/\D/g, '');
      return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
    }
    return true;
  };

  return (
    <div className="phone-validation-feedback">
      <FormValidationFeedback errors={errors} field="phone" />
      
      {value && isValidPhone(value, countryCode) && (
        <div className="phone-format-suggestion">
          <span className="format-icon">📱</span>
          <span className="format-text">
            {t('validation.phone.formatted') || 'Formatted:'} {formatPhoneNumber(value, countryCode)}
          </span>
        </div>
      )}
    </div>
  );
};

export default FormValidationFeedback;