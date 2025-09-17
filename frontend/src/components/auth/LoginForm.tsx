/**
 * Login Form Component
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { LoadingIndicator } from '../LoadingIndicator';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const { login, isLoading, error, clearError } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (formData.email || formData.password) {
      setFormErrors({});
    }
  }, [formData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = t('form.validation.required', { 
        defaultValue: 'Email is required',
        interpolation: { field: t('form.email') }
      });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('form.validation.invalidEmail');
    }

    if (!formData.password) {
      errors.password = t('form.validation.required', { 
        defaultValue: 'Password is required',
        interpolation: { field: t('form.password') }
      });
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
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="login-form">
      <div className="login-form__header">
        <h2 className="login-form__title">{t('auth.login.title')}</h2>
        <p className="login-form__subtitle">{t('auth.login.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form__form">
        {error && (
          <div className="login-form__error" role="alert">
            <span className="login-form__error-icon">⚠️</span>
            <span className="login-form__error-message">{error}</span>
          </div>
        )}

        <div className="login-form__field">
          <label htmlFor="email" className="login-form__label">
            {t('form.email')} <span className="login-form__required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`login-form__input ${formErrors.email ? 'login-form__input--error' : ''}`}
            placeholder={t('form.placeholders.email')}
            disabled={isLoading}
            autoComplete="email"
            aria-describedby={formErrors.email ? 'email-error' : undefined}
          />
          {formErrors.email && (
            <span id="email-error" className="login-form__field-error" role="alert">
              {formErrors.email}
            </span>
          )}
        </div>

        <div className="login-form__field">
          <label htmlFor="password" className="login-form__label">
            {t('form.password')} <span className="login-form__required">*</span>
          </label>
          <div className="login-form__password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`login-form__input ${formErrors.password ? 'login-form__input--error' : ''}`}
              placeholder={t('form.placeholders.password')}
              disabled={isLoading}
              autoComplete="current-password"
              aria-describedby={formErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="login-form__password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? t('form.hidePassword') : t('form.showPassword')}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <span id="password-error" className="login-form__field-error" role="alert">
              {formErrors.password}
            </span>
          )}
        </div>

        <div className="login-form__actions">
          <button
            type="submit"
            className="login-form__submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingIndicator size="small" isLoading={true} />
                <span>{t('auth.login.signingIn')}</span>
              </>
            ) : (
              t('auth.login.signIn')
            )}
          </button>
        </div>

        <div className="login-form__links">
          {onSwitchToForgotPassword && (
            <button
              type="button"
              className="login-form__link"
              onClick={onSwitchToForgotPassword}
              disabled={isLoading}
            >
              {t('auth.login.forgotPassword')}
            </button>
          )}
        </div>
      </form>

      {onSwitchToRegister && (
        <div className="login-form__footer">
          <p className="login-form__footer-text">
            {t('auth.login.noAccount')}{' '}
            <button
              type="button"
              className="login-form__link login-form__link--primary"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              {t('auth.login.signUp')}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};