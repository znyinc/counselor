/**
 * Authentication Modal Component
 * Handles login, registration, and password reset flows
 */

import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useTranslation } from '../../hooks/useTranslation';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="auth-modal" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal__content">
        <button
          className="auth-modal__close"
          onClick={onClose}
          aria-label={t('common.close')}
          type="button"
        >
          ✕
        </button>

        <div className="auth-modal__body">
          {mode === 'login' && (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setMode('register')}
              onSwitchToForgotPassword={() => setMode('forgot-password')}
            />
          )}

          {mode === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}

          {mode === 'forgot-password' && (
            <div className="auth-modal__forgot-password">
              <h2 className="auth-modal__title">{t('auth.forgotPassword.title')}</h2>
              <p className="auth-modal__subtitle">{t('auth.forgotPassword.subtitle')}</p>
              
              <form className="auth-modal__form">
                <div className="auth-modal__field">
                  <label htmlFor="reset-email" className="auth-modal__label">
                    {t('form.email')}
                  </label>
                  <input
                    type="email"
                    id="reset-email"
                    className="auth-modal__input"
                    placeholder={t('form.placeholders.email')}
                  />
                </div>
                
                <button type="submit" className="auth-modal__submit">
                  {t('auth.forgotPassword.sendReset')}
                </button>
              </form>

              <div className="auth-modal__links">
                <button
                  type="button"
                  className="auth-modal__link"
                  onClick={() => setMode('login')}
                >
                  {t('auth.forgotPassword.backToLogin')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};