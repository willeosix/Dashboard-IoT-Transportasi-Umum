'use client';
import { useState, useEffect } from 'react';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import { verifySignedToken, startInactivityMonitor } from '@/utils/security';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('transum_session');
      if (token) {
        const payload = await verifySignedToken(token);
        if (payload) {
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem('transum_session');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Set up inactivity monitor when authenticated
  useEffect(() => {
    let cleanup = null;
    if (isAuthenticated) {
      cleanup = startInactivityMonitor(() => {
        handleLogout();
        // Custom alert or toast could be added here
        console.warn('Auto-logout karena inactivity');
      });
    }
    return () => {
      if (cleanup) cleanup();
    };
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('transum_session');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-deepest)]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );
}
