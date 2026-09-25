/**
 * AgroAI — Forgot Password Page
 * Route: /forgot-password
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { PreferenceControls } from '../components/PreferenceControls';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--app-outline-variant)',
  borderRadius: '8px',
  fontSize: '15px',
  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
  color: 'var(--app-on-surface)',
  background: 'var(--app-surface)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

export const ForgotPassword: React.FC = () => {
  const { sendPasswordReset, isAuthenticated, isFirebaseReady } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('validation.emailRequired');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('validation.emailInvalid');
      return;
    }

    setSubmitting(true);
    const result = await sendPasswordReset(email.trim());
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'errors.resetEmailFailed');
    } else {
      setSuccessMessage('auth.passwordReset.success');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--app-background)',
        color: 'var(--app-on-surface)',
        fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <PreferenceControls compact />
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', justifyContent: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#fff' }}>eco</span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--app-primary)', letterSpacing: '-0.3px' }}>{t('common.appName')}</span>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--app-surface)',
            borderRadius: '16px',
            padding: '36px 32px',
            border: '1px solid var(--app-outline-variant)',
            boxShadow: 'var(--app-shadow)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'var(--app-secondary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid var(--app-secondary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--app-secondary)' }}>lock_reset</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--app-on-surface)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            {t('auth.passwordReset.title')}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--app-outline)', margin: '0 0 24px', lineHeight: 1.5 }}>
            {t('auth.passwordReset.description')}
          </p>

          {!isFirebaseReady && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--app-surface-container-high)', border: '1px solid var(--app-outline-variant)', borderRadius: '8px', marginBottom: '20px', color: 'var(--app-outline)', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>warning</span>
              <span>{t('auth.firebaseNotConfigured')}</span>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--app-error-container)', border: '1px solid var(--app-error)', borderRadius: '8px', color: 'var(--app-on-error-container)', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>error</span>
              <span>{t(error)}</span>
            </div>
          )}

          {successMessage ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', background: 'var(--app-secondary-container)', border: '1px solid var(--app-secondary)', borderRadius: '8px', color: 'var(--app-on-secondary-container)', fontSize: '14px', marginBottom: '24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0, color: 'var(--app-secondary)' }}>mark_email_read</span>
                <span>{t(successMessage)}</span>
              </div>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  background: 'var(--app-primary)',
                  color: 'var(--app-on-primary)',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {t('auth.passwordReset.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="forgot-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--app-outline)', marginBottom: '6px' }}>
                  {t('auth.passwordReset.email')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={t('auth.passwordReset.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    ...inputStyle,
                    borderColor: focused ? 'var(--app-primary)' : 'var(--app-outline-variant)',
                    boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--app-primary) 12%, transparent)' : 'none',
                  }}
                  disabled={submitting}
                />
              </div>

              <button
                id="forgot-submit-btn"
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: submitting ? 'var(--app-outline-variant)' : 'var(--app-primary)',
                  color: submitting ? 'var(--app-outline)' : 'var(--app-on-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.15s',
                  marginBottom: '16px',
                }}
              >
                {submitting && (
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                )}
                {submitting ? t('auth.passwordReset.sending') : t('auth.passwordReset.sendEmail')}
              </button>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                #forgot-submit-btn:hover:not(:disabled) { background: var(--app-primary-container); }
              `}</style>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Link to="/login" style={{ fontSize: '13px', color: 'var(--app-outline)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              {t('auth.passwordReset.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
