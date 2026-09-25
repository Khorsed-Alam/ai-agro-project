/**
 * AgroAI — Register Page
 * Route: /register
 */

import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--app-outline)',
  marginBottom: '6px',
  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--app-error)',
  marginTop: '5px',
  fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
};

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC = () => {
  const { register, loading, isAuthenticated, isFirebaseReady } = useAuth();
  const { t, translateEnum } = useI18n();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'farmer'>('owner');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = 'validation.fullNameRequired';
    if (!email.trim()) {
      errors.email = 'validation.emailRequired';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'validation.emailInvalid';
    }
    if (!password) {
      errors.password = 'validation.passwordRequired';
    } else if (password.length < 8) {
      errors.password = 'validation.passwordLength';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'validation.confirmPasswordRequired';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'validation.passwordsDoNotMatch';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMessage('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await register(fullName.trim(), email.trim(), password, role);
    setSubmitting(false);

    if (!result.success) {
      setGlobalError(result.error || 'errors.registrationFailed');
    } else {
      setSuccessMessage('auth.register.accountCreated');
      const targetDashboard = role === 'farmer' ? '/farmer-dashboard' : '/owner-dashboard';
      setTimeout(() => navigate(targetDashboard, { replace: true }), 1000);
    }
  };

  const inputFocusStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    ...inputStyle,
    borderColor: hasError ? 'var(--app-error)' : focusedField === field ? 'var(--app-primary)' : 'var(--app-outline-variant)',
    boxShadow:
      hasError
        ? '0 0 0 3px color-mix(in srgb, var(--app-error) 10%, transparent)'
        : focusedField === field
        ? '0 0 0 3px color-mix(in srgb, var(--app-primary) 12%, transparent)'
        : 'none',
  });

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: 'var(--app-outline-variant)', width: '0%' };
    if (password.length < 8) return { label: 'auth.register.strengthTooShort', color: 'var(--app-error)', width: '25%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const strength = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength === 0) return { label: 'auth.register.strengthWeak', color: '#f97316', width: '40%' };
    if (strength === 1) return { label: 'auth.register.strengthFair', color: '#eab308', width: '60%' };
    if (strength === 2) return { label: 'auth.register.strengthGood', color: '#22c55e', width: '80%' };
    return { label: 'auth.register.strengthStrong', color: '#16a34a', width: '100%' };
  };

  const strength = passwordStrength();

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
      {/* Left branding panel */}
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
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', border: '1.5px solid rgba(255,255,255,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '30px', color: '#fff' }}>eco</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {t('auth.register.joinTitle')}
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', margin: '0 0 40px', lineHeight: 1.5 }}>
            {t('auth.register.joinSubtitle')}
          </p>

          {[
            { icon: 'check_circle', text: t('auth.register.featureFree') },
            { icon: 'check_circle', text: t('auth.register.featureSecure') },
            { icon: 'check_circle', text: t('auth.register.featurePrivate') },
            { icon: 'check_circle', text: t('auth.register.featureTools') },
          ].map((item) => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b7e4c7', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.82)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <PreferenceControls compact />
          </div>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }} className="lg:hidden">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fff' }}>eco</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--app-primary)', letterSpacing: '-0.3px' }}>{t('common.appName')}</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--app-on-surface)', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              {t('auth.register.createTitle')}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--app-outline)', margin: 0 }}>
              {t('auth.register.createSubtitle')}
            </p>
          </div>

          {/* Firebase config warning */}
          {!isFirebaseReady && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--app-surface-container-high)', border: '1px solid var(--app-outline-variant)', borderRadius: '8px', marginBottom: '20px', color: 'var(--app-outline)', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>warning</span>
              <span>{t('auth.firebaseNotConfigured')}</span>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--app-error-container)', border: '1px solid var(--app-error)', borderRadius: '8px', color: 'var(--app-on-error-container)', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>error</span>
              <span>{t(globalError)}</span>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--app-secondary-container)', border: '1px solid var(--app-secondary)', borderRadius: '8px', color: 'var(--app-on-secondary-container)', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>check_circle</span>
              <span>{t(successMessage)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-name" style={labelStyle}>{t('auth.register.fullName')}</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder={t('auth.register.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: undefined })); }}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                style={inputFocusStyle('fullName', !!fieldErrors.fullName)}
                disabled={submitting}
              />
              {fieldErrors.fullName && <p style={fieldErrorStyle}>{t(fieldErrors.fullName)}</p>}
            </div>

            {/* Account Type Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>{t('auth.register.accountType')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: role === 'owner' ? '2px solid var(--app-secondary)' : '1.5px solid var(--app-outline-variant)',
                    background: role === 'owner' ? 'var(--app-secondary-container)' : 'var(--app-surface)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: role === 'owner' ? 600 : 400,
                    fontSize: '14px',
                    color: 'var(--app-on-surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={role === 'owner'}
                    onChange={() => setRole('owner')}
                    style={{ accentColor: 'var(--app-secondary)' }}
                  />
                  <span>{translateEnum('common.enums.roles', 'owner')}</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: role === 'farmer' ? '2px solid var(--app-secondary)' : '1.5px solid var(--app-outline-variant)',
                    background: role === 'farmer' ? 'var(--app-secondary-container)' : 'var(--app-surface)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: role === 'farmer' ? 600 : 400,
                    fontSize: '14px',
                    color: 'var(--app-on-surface)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="farmer"
                    checked={role === 'farmer'}
                    onChange={() => setRole('farmer')}
                    style={{ accentColor: 'var(--app-secondary)' }}
                  />
                  <span>{translateEnum('common.enums.roles', 'farmer')}</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-email" style={labelStyle}>{t('auth.register.email')}</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t('auth.register.emailPlaceholder')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputFocusStyle('email', !!fieldErrors.email)}
                disabled={submitting}
              />
              {fieldErrors.email && <p style={fieldErrorStyle}>{t(fieldErrors.email)}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-password" style={labelStyle}>{t('auth.register.password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="new-password"
                  autoComplete="new-password"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputFocusStyle('password', !!fieldErrors.password), paddingRight: '44px' }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-outline)', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label={showPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: 'var(--app-surface-container-high)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: strength.color, marginTop: '4px', fontWeight: 500 }}>{t(strength.label)}</p>
                </div>
              )}
              {fieldErrors.password && <p style={fieldErrorStyle}>{t(fieldErrors.password)}</p>}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label htmlFor="reg-confirm" style={labelStyle}>{t('auth.register.confirmPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputFocusStyle('confirmPassword', !!fieldErrors.confirmPassword), paddingRight: '44px' }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--app-outline)', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label={showConfirmPassword ? t('accessibility.hidePassword') : t('accessibility.showPassword')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.confirmPassword && <p style={fieldErrorStyle}>{t(fieldErrors.confirmPassword)}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
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
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              )}
              {submitting ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
            </button>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              #register-submit-btn:hover:not(:disabled) { background: var(--app-primary-container); }
            `}</style>
          </form>

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--app-outline)', marginTop: '24px' }}>
            {t('auth.register.alreadyHaveAccount')}{' '}
            <Link to="/login" style={{ color: 'var(--app-secondary)', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
