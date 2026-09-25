/**
 * AgroAI — ProtectedRoute Component
 * Redirects unauthenticated users to /login.
 * Shows a loading screen while Firebase checks session.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--app-background)',
          color: 'var(--app-on-surface)',
          gap: '16px',
        }}
      >
        {/* AgroAI Logo */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#fff' }}>
            eco
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--app-on-surface)',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            {t('common.appName')}
          </p>
          <p
            style={{
              fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
              fontSize: '14px',
              color: 'var(--app-outline)',
              margin: '6px 0 0',
            }}
          >
            {t('auth.checkingSession')}
          </p>
        </div>
        {/* Spinner */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '3px solid var(--app-outline-variant)',
            borderTop: '3px solid var(--app-primary)',
            animation: 'spin 0.8s linear infinite',
            marginTop: '8px',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted location so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
