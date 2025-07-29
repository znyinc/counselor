/**
 * Navigation Component
 * Main navigation bar with routing and language switching
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/profile';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo and brand */}
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">🎓</div>
            <span className="brand-text">{t('app.title')}</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navigation links */}
        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/profile" 
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={() => handleNavigation('/profile')}
          >
            <span className="nav-icon">📝</span>
            {t('navigation.profile')}
          </Link>

          <Link 
            to="/results" 
            className={`nav-link ${isActive('/results') ? 'active' : ''}`}
            onClick={() => handleNavigation('/results')}
          >
            <span className="nav-icon">📊</span>
            {t('navigation.results')}
          </Link>

          <Link 
            to="/analytics" 
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
            onClick={() => handleNavigation('/analytics')}
          >
            <span className="nav-icon">📈</span>
            {t('navigation.analytics')}
          </Link>

          <Link 
            to="/help" 
            className={`nav-link ${isActive('/help') ? 'active' : ''}`}
            onClick={() => handleNavigation('/help')}
          >
            <span className="nav-icon">❓</span>
            {t('navigation.help')}
          </Link>

          <Link 
            to="/about" 
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
            onClick={() => handleNavigation('/about')}
          >
            <span className="nav-icon">ℹ️</span>
            {t('navigation.about')}
          </Link>
        </div>

        {/* Language switcher and user actions */}
        <div className="nav-actions">
          <LanguageSwitcher />
          
          {/* Back button - shows when not on home page */}
          {location.pathname !== '/profile' && location.pathname !== '/' && (
            <button 
              className="back-button"
              onClick={() => navigate(-1)}
              title={t('common.back')}
            >
              <span className="back-icon">←</span>
              <span className="back-text">{t('common.back')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;