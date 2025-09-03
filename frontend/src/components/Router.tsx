/**
 * Main Router Component
 * Handles routing and navigation for the application with lazy loading
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Navigation } from './Navigation';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorBoundary } from './ErrorBoundary';

// Lazy load components for better performance
const StudentProfileForm = lazy(() => import('./StudentProfileForm').then(module => ({ default: module.StudentProfileForm })));
const ResultsPage = lazy(() => import('./ResultsPage').then(module => ({ default: module.ResultsPage })));
const AnalyticsDashboard = lazy(() => import('./admin/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const NotFoundPage = lazy(() => import('./NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const ProtectedRoute = lazy(() => import('./ProtectedRoute').then(module => ({ default: module.ProtectedRoute })));

export const AppRouter: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <ErrorBoundary>
              <Suspense fallback={<LoadingIndicator isLoading={true} message="Loading page..." />}>
                <Routes>
                  {/* Home route - redirects to profile form */}
                  <Route path="/" element={<Navigate to="/profile" replace />} />
                  
                  {/* Student profile form */}
                  <Route path="/profile" element={<StudentProfileFormContainer />} />
                  
                  {/* Results page with optional profile ID */}
                  <Route path="/results" element={<ResultsPageContainer />} />
                  <Route path="/results/:profileId" element={<ResultsPageContainer />} />
                  
                  {/* Analytics dashboard - protected route for administrators */}
                  <Route 
                    path="/analytics" 
                    element={
                      <ProtectedRouteContainer requiredRole="admin">
                        <AnalyticsDashboard />
                      </ProtectedRouteContainer>
                    } 
                  />
                  
                  {/* Help and about pages */}
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  
                  {/* 404 page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
};

// Container components that handle state and props
const StudentProfileFormContainer: React.FC = React.memo(() => {
  const handleSubmit = React.useCallback((profile: any) => {
    // Handle profile submission
    console.log('Profile submitted:', profile);
    // Navigate to results or handle submission
  }, []);

  return <StudentProfileForm onSubmit={handleSubmit} />;
});

const ResultsPageContainer: React.FC = React.memo(() => {
  // This would typically get data from context or API
  const mockRecommendations = React.useMemo(() => [], []);
  
  const handleLanguageChange = React.useCallback((language: string) => {
    // Handle language change
    console.log('Language changed:', language);
  }, []);

  const handleBackToForm = React.useCallback(() => {
    // Handle navigation back to form
    console.log('Back to form');
  }, []);

  return (
    <ResultsPage 
      recommendations={mockRecommendations}
      studentName="Student"
      language="english"
      onLanguageChange={handleLanguageChange}
      onBackToForm={handleBackToForm}
    />
  );
});

const ProtectedRouteContainer: React.FC<{ requiredRole: "admin" | "user"; children: React.ReactNode }> = React.memo(({ requiredRole, children }) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      {children}
    </ProtectedRoute>
  );
});

// Placeholder components for help and about pages
const HelpPage: React.FC = React.memo(() => {
  return (
    <div className="help-page">
      <h1>Help & Support</h1>
      <p>Help content will be implemented here.</p>
    </div>
  );
});

const AboutPage: React.FC = React.memo(() => {
  return (
    <div className="about-page">
      <h1>About AI Career Counseling</h1>
      <p>About content will be implemented here.</p>
    </div>
  );
});

export default AppRouter;