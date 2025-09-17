/**
 * Registration Form Component
 */

import React, { useState, useEffect } from 'react';
import { useAuth, RegisterData } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { LoadingIndicator } from '../LoadingIndicator';
import './RegisterForm.css';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { register, isLoading, error, clearError } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    profile: {
      preferences: {
        language: 'english',
        notifications: true,
      },
    },
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (Object.keys(formData).length > 0 || confirmPassword) {
      setFormErrors({});
    }
  }, [formData, confirmPassword]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = t('form.validation.required', { 
        defaultValue: 'Email is required',
        interpolation: { field: t('form.email') }
      });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('form.validation.invalidEmail');
    }

    // Password validation
    if (!formData.password) {
      errors.password = t('form.validation.required', { 
        defaultValue: 'Password is required',
        interpolation: { field: t('form.password') }
      });
    } else if (formData.password.length < 8) {
      errors.password = t('form.validation.passwordMinLength');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      errors.password = t('form.validation.passwordComplexity');
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = t('form.validation.required', { 
        defaultValue: 'Confirm password is required',
        interpolation: { field: t('form.confirmPassword') }
      });
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = t('form.validation.passwordMismatch');
    }

    // Name validation
    if (!formData.firstName) {
      errors.firstName = t('form.validation.required', { 
        defaultValue: 'First name is required',
        interpolation: { field: t('form.firstName') }
      });
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      errors.firstName = t('form.validation.nameFormat');
    }

    if (!formData.lastName) {
      errors.lastName = t('form.validation.required', { 
        defaultValue: 'Last name is required',
        interpolation: { field: t('form.lastName') }
      });
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      errors.lastName = t('form.validation.nameFormat');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
      console.error('Registration error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
      return;
    }

    if (name.includes('.')) {
      // Handle nested properties
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current: any = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        const finalKey = keys[keys.length - 1];
        if (type === 'checkbox') {
          current[finalKey] = (e.target as HTMLInputElement).checked;
        } else {
          current[finalKey] = value;
        }
        
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="register-form">
      <div className="register-form__header">
        <h2 className="register-form__title">{t('auth.register.title')}</h2>
        <p className="register-form__subtitle">{t('auth.register.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="register-form__form">
        {error && (
          <div className="register-form__error" role="alert">
            <span className="register-form__error-icon">⚠️</span>
            <span className="register-form__error-message">{error}</span>
          </div>
        )}

        <div className="register-form__row">
          <div className="register-form__field">
            <label htmlFor="firstName" className="register-form__label">
              {t('form.firstName')} <span className="register-form__required">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`register-form__input ${formErrors.firstName ? 'register-form__input--error' : ''}`}
              placeholder={t('form.placeholders.firstName')}
              disabled={isLoading}
              autoComplete="given-name"
              aria-describedby={formErrors.firstName ? 'firstName-error' : undefined}
            />
            {formErrors.firstName && (
              <span id="firstName-error" className="register-form__field-error" role="alert">
                {formErrors.firstName}
              </span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="lastName" className="register-form__label">
              {t('form.lastName')} <span className="register-form__required">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`register-form__input ${formErrors.lastName ? 'register-form__input--error' : ''}`}
              placeholder={t('form.placeholders.lastName')}
              disabled={isLoading}
              autoComplete="family-name"
              aria-describedby={formErrors.lastName ? 'lastName-error' : undefined}
            />
            {formErrors.lastName && (
              <span id="lastName-error" className="register-form__field-error" role="alert">
                {formErrors.lastName}
              </span>
            )}
          </div>
        </div>

        <div className="register-form__field">
          <label htmlFor="email" className="register-form__label">
            {t('form.email')} <span className="register-form__required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`register-form__input ${formErrors.email ? 'register-form__input--error' : ''}`}
            placeholder={t('form.placeholders.email')}
            disabled={isLoading}
            autoComplete="email"
            aria-describedby={formErrors.email ? 'email-error' : undefined}
          />
          {formErrors.email && (
            <span id="email-error" className="register-form__field-error" role="alert">
              {formErrors.email}
            </span>
          )}
        </div>

        <div className="register-form__field">
          <label htmlFor="role" className="register-form__label">
            {t('form.role')}
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="register-form__input register-form__select"
            disabled={isLoading}
          >
            <option value="student">{t('form.roles.student')}</option>
            <option value="parent">{t('form.roles.parent')}</option>
            <option value="counselor">{t('form.roles.counselor')}</option>
          </select>
        </div>

        <div className="register-form__row">
          <div className="register-form__field">
            <label htmlFor="password" className="register-form__label">
              {t('form.password')} <span className="register-form__required">*</span>
            </label>
            <div className="register-form__password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`register-form__input ${formErrors.password ? 'register-form__input--error' : ''}`}
                placeholder={t('form.placeholders.password')}
                disabled={isLoading}
                autoComplete="new-password"
                aria-describedby={formErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="register-form__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? t('form.hidePassword') : t('form.showPassword')}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.password && (
              <span id="password-error" className="register-form__field-error" role="alert">
                {formErrors.password}
              </span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="confirmPassword" className="register-form__label">
              {t('form.confirmPassword')} <span className="register-form__required">*</span>
            </label>
            <div className="register-form__password-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                className={`register-form__input ${formErrors.confirmPassword ? 'register-form__input--error' : ''}`}
                placeholder={t('form.placeholders.confirmPassword')}
                disabled={isLoading}
                autoComplete="new-password"
                aria-describedby={formErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              />
              <button
                type="button"
                className="register-form__password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                aria-label={showConfirmPassword ? t('form.hidePassword') : t('form.showPassword')}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.confirmPassword && (
              <span id="confirmPassword-error" className="register-form__field-error" role="alert">
                {formErrors.confirmPassword}
              </span>
            )}
          </div>
        </div>

        <div className="register-form__field">
          <label htmlFor="language" className="register-form__label">
            {t('form.languagePreference')}
          </label>
          <select
            id="language"
            name="profile.preferences.language"
            value={formData.profile?.preferences?.language || 'english'}
            onChange={handleInputChange}
            className="register-form__input register-form__select"
            disabled={isLoading}
          >
            <option value="english">{t('form.languages.english')}</option>
            <option value="hindi">{t('form.languages.hindi')}</option>
          </select>
        </div>

        <div className="register-form__checkbox-field">
          <label className="register-form__checkbox-label">
            <input
              type="checkbox"
              name="profile.preferences.notifications"
              checked={formData.profile?.preferences?.notifications || false}
              onChange={handleInputChange}
              className="register-form__checkbox"
              disabled={isLoading}
            />
            <span className="register-form__checkbox-text">
              {t('form.enableNotifications')}
            </span>
          </label>
        </div>

        <div className="register-form__actions">
          <button
            type="submit"
            className="register-form__submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingIndicator size="small" isLoading={true} />
                <span>{t('auth.register.creating')}</span>
              </>
            ) : (
              t('auth.register.createAccount')
            )}
          </button>
        </div>
      </form>

      {onSwitchToLogin && (
        <div className="register-form__footer">
          <p className="register-form__footer-text">
            {t('auth.register.hasAccount')}{' '}
            <button
              type="button"
              className="register-form__link register-form__link--primary"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              {t('auth.register.signIn')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};