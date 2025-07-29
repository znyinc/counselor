/**
 * 404 Not Found Page Component
 * Displays when user navigates to a non-existent route
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import './NotFoundPage.css';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/profile');
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-illustration">
          <div className="error-code">404</div>
          <div className="error-icon">🔍</div>
        </div>
        
        <div className="not-found-content">
          <h1 className="not-found-title">
            {t('errors.notFound')}
          </h1>
          
          <p className="not-found-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="not-found-suggestions">
            <h3>Here are some helpful links:</h3>
            <ul>
              <li>
                <Link to="/profile" className="suggestion-link">
                  📝 {t('navigation.profile')} - Start your career assessment
                </Link>
              </li>
              <li>
                <Link to="/results" className="suggestion-link">
                  📊 {t('navigation.results')} - View your recommendations
                </Link>
              </li>
              <li>
                <Link to="/help" className="suggestion-link">
                  ❓ {t('navigation.help')} - Get help and support
                </Link>
              </li>
              <li>
                <Link to="/about" className="suggestion-link">
                  ℹ️ {t('navigation.about')} - Learn about our platform
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="not-found-actions">
            <button 
              onClick={handleGoBack}
              className="action-button secondary"
            >
              ← {t('common.back')}
            </button>
            
            <button 
              onClick={handleGoHome}
              className="action-button primary"
            >
              🏠 Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;