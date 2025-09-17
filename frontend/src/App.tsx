import React from 'react';
import { AppRouter } from './components/Router';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import './i18n'; // Initialize i18n

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;