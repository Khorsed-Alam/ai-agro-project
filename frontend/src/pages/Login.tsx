/**
 * AgroAI — Login Page
 * Route: /login
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { PreferenceControls } from '../components/PreferenceControls';

// ─── Shared input style ───────────────────────────────────────────────────────

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--app-outline)',
  marginBottom: '6px',
  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '12px 14px',
  background: 'var(--app-error-container)',
  border: '1px solid var(--app-error)',
  borderRadius: '8px',
  color: 'var(--app-on-error-container)',
  fontSize: '14px',
  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
};

export const Login: React.FC = () => {
  const { login, loading, isAuthenticated, isFirebaseReady } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const validate = (): string => {
    if (!email.trim()) return 'validation.emailRequired';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'validation.emailInvalid';
    if (!password) return 'validation.passwordRequired';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'errors.loginFailed');
    } else {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const inputFocusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? 'var(--app-primary)' : 'var(--app-outline-variant)',
    boxShadow: focusedField === field ? '0 0 0 3px color-mix(in srgb, var(--app-primary) 12%, transparent)' : 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--app-background)',
        color: 'var(--app-on-surface)',
        fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
      }}
    >
      {/* Left panel — branding (desktop only) */}
      <div
        style={{
          flex: '0 0 420px',
          background: 'linear-gradient(160deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '28px',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#fff' }}>
              eco
            </span>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 8px',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
          >
            {t('common.appName')}
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.75)',
              margin: '0 0 40px',
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            {t('auth.intelligentSystem')}
          </p>

          {/* Feature highlights */}
          {[
            { icon: 'memory', text: t('auth.login.featureCropAnalysis') },
            { icon: 'water_drop', text: t('auth.login.featureIrrigation') },
            { icon: 'filter_center_focus', text: t('auth.login.featureDisease') },
            { icon: 'wb_sunny', text: t('auth.login.featureWeather') },
          ].map((item) => (
            <div
              key={item.icon}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#b7e4c7' }}>
                  {item.icon}
                </span>
              </div>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <PreferenceControls compact />
          </div>

          {/* Mobile logo */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}
            className="lg:hidden"
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fff' }}>
                eco
              </span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--app-primary)', letterSpacing: '-0.3px' }}>
              {t('common.appName')}
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--app-on-surface)',
                margin: '0 0 6px',
                letterSpacing: '-0.4px',
              }}
            >
              {t('auth.login.welcomeBack')}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--app-outline)', margin: 0 }}>
              {t('auth.login.signInSubtitle')}
            </p>
          </div>

          {/* Firebase config warning */}
          {!isFirebaseReady && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                background: 'var(--app-surface-container-high)',
                border: '1px solid var(--app-outline-variant)',
                borderRadius: '8px',
                marginBottom: '20px',
                color: 'var(--app-outline)',
                fontSize: '13px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                warning
              </span>
              <span>
                {t('auth.firebaseNotConfigured')}
              </span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div id="login-error" style={{ ...errorBannerStyle, marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                error
              </span>
              <span>{t(error)}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label htmlFor="login-email" style={labelStyle}>
                {t('auth.login.email')}
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputFocusStyle('email')}
                disabled={submitting}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="login-password" style={labelStyle}>
                {t('auth.login.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="current-password"
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputFocusStyle('password'), paddingRight: '44px' }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--app-outline)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '22px' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: 'var(--app-secondary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting || loading}
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
                letterSpacing: '0.1px',
              }}
            >
              {submitting && (
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.4)',
                    borderTop: '2.5px solid #fff',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              {submitting ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </button>

            {/* Quick Demo Login Option */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={async () => {
                  setEmail('demo@agroai.com');
                  setPassword('demo123');
                  setSubmitting(true);
                  await login('demo@agroai.com', 'demo123');
                  setSubmitting(false);
                  const from = (location.state as any)?.from?.pathname || '/dashboard';
                  navigate(from, { replace: true });
                }}
                disabled={submitting || loading}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--app-secondary-container)',
                  color: 'var(--app-on-secondary-container)',
                  border: '1.5px solid var(--app-secondary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  bolt
                </span>
                {t('auth.login.quickDemo')}
              </button>
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              #login-submit-btn:hover:not(:disabled) { background: var(--app-primary-container); }
            `}</style>
          </form>

          {/* Register link */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--app-outline)',
              marginTop: '24px',
              margin: '24px 0 0',
            }}
          >
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register"
              style={{
                color: 'var(--app-secondary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
