/**
 * Protected Route Component
 * Handles route protection based on user roles and authentication
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'user',
  requireAuth = true
}) => {
  const { t } = useTranslation();
  const location = useLocation();

  // For demo purposes, we'll use a simple check
  // In a real application, this would check actual authentication state
  const isAuthenticated = () => {
    // Check for admin access - in demo mode, allow access
    if (requiredRole === 'admin') {
      // Check for admin flag in localStorage or environment
      const isAdminMode = localStorage.getItem('adminMode') === 'true' || 
                         process.env.NODE_ENV === 'development';
      return isAdminMode;
    }
    
    // For regular users, no authentication required in demo
    return true;
  };

  const hasRequiredRole = () => {
    if (requiredRole === 'admin') {
      return localStorage.getItem('userRole') === 'admin' || 
             process.env.NODE_ENV === 'development';
    }
    return true;
  };

  if (requireAuth && !isAuthenticated()) {
    // Redirect to login page (not implemented in demo)
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  if (!hasRequiredRole()) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>{t('errors.unauthorized')}</h2>
          <p>You don't have permission to access this page.</p>
          <div className="access-denied-actions">
            <button 
              onClick={() => window.history.back()}
              className="back-button"
            >
              {t('common.back')}
            </button>
            <button 
              onClick={() => localStorage.setItem('adminMode', 'true')}
              className="demo-admin-button"
            >
              Enable Admin Mode (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;