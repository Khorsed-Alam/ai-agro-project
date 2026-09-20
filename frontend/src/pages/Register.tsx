/**
 * AgroAI — Register Page
 * Route: /register
 */

import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #d0d9d0',
  borderRadius: '8px',
  fontSize: '15px',
  fontFamily: 'Inter, sans-serif',
  color: '#1a2e1a',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374537',
  marginBottom: '6px',
  fontFamily: 'Inter, sans-serif',
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#dc2626',
  marginTop: '5px',
  fontFamily: 'Inter, sans-serif',
};

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC = () => {
  const { register, loading, isAuthenticated, isFirebaseReady } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!fullName.trim()) errors.fullName = 'Please enter your full name.';
    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      setGlobalError(result.error || 'Registration failed. Please try again.');
    } else {
      setSuccessMessage('Account created successfully! Redirecting…');
      const targetDashboard = role === 'farmer' ? '/farmer-dashboard' : '/owner-dashboard';
      setTimeout(() => navigate(targetDashboard, { replace: true }), 1000);
    }
  };

  const inputFocusStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    ...inputStyle,
    borderColor: hasError ? '#dc2626' : focusedField === field ? '#2d6a4f' : '#d0d9d0',
    boxShadow:
      hasError
        ? '0 0 0 3px rgba(220,38,38,0.1)'
        : focusedField === field
        ? '0 0 0 3px rgba(45,106,79,0.12)'
        : 'none',
  });

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: '#e5e7eb', width: '0%' };
    if (password.length < 8) return { label: 'Too short', color: '#ef4444', width: '25%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const strength = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (strength === 0) return { label: 'Weak', color: '#f97316', width: '40%' };
    if (strength === 1) return { label: 'Fair', color: '#eab308', width: '60%' };
    if (strength === 2) return { label: 'Good', color: '#22c55e', width: '80%' };
    return { label: 'Strong', color: '#16a34a', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f5f8f5',
        fontFamily: 'Inter, sans-serif',
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
            Join AgroAI
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', margin: '0 0 40px', lineHeight: 1.5 }}>
            Start making smarter agricultural<br />decisions with AI.
          </p>

          {[
            { icon: 'check_circle', text: 'Free for farmers and researchers' },
            { icon: 'check_circle', text: 'Secure Firebase authentication' },
            { icon: 'check_circle', text: 'Your data is private and isolated' },
            { icon: 'check_circle', text: 'Access all AI-powered tools' },
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
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }} className="lg:hidden">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fff' }}>eco</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#1b4332', letterSpacing: '-0.3px' }}>AgroAI</span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#1a2e1a', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
              Create your account
            </h2>
            <p style={{ fontSize: '15px', color: '#6b7a6b', margin: 0 }}>
              Set up your AgroAI farm account in minutes
            </p>
          </div>

          {/* Firebase config warning */}
          {!isFirebaseReady && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '20px', color: '#92400e', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>warning</span>
              <span>Firebase authentication is not configured. Please set credentials in <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>frontend/.env</code></span>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>error</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: undefined })); }}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                style={inputFocusStyle('fullName', !!fieldErrors.fullName)}
                disabled={submitting}
              />
              {fieldErrors.fullName && <p style={fieldErrorStyle}>{fieldErrors.fullName}</p>}
            </div>

            {/* Account Type Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: role === 'owner' ? '2px solid #2d6a4f' : '1.5px solid #d0d9d0',
                    background: role === 'owner' ? '#f0fdf4' : '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: role === 'owner' ? 600 : 400,
                    fontSize: '14px',
                    color: '#1a2e1a',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={role === 'owner'}
                    onChange={() => setRole('owner')}
                    style={{ accentColor: '#2d6a4f' }}
                  />
                  <span>Farm Owner</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    border: role === 'farmer' ? '2px solid #2d6a4f' : '1.5px solid #d0d9d0',
                    background: role === 'farmer' ? '#f0fdf4' : '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: role === 'farmer' ? 600 : 400,
                    fontSize: '14px',
                    color: '#1a2e1a',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="farmer"
                    checked={role === 'farmer'}
                    onChange={() => setRole('farmer')}
                    style={{ accentColor: '#2d6a4f' }}
                  />
                  <span>Farmer / Worker</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-email" style={labelStyle}>Email address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputFocusStyle('email', !!fieldErrors.email)}
                disabled={submitting}
              />
              {fieldErrors.email && <p style={fieldErrorStyle}>{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reg-password" style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="new-password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
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
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a6b', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '2px', transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: strength.color, marginTop: '4px', fontWeight: 500 }}>{strength.label}</p>
                </div>
              )}
              {fieldErrors.password && <p style={fieldErrorStyle}>{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
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
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a6b', padding: '2px', display: 'flex', alignItems: 'center' }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {fieldErrors.confirmPassword && <p style={fieldErrorStyle}>{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={submitting || loading}
              style={{
                width: '100%',
                padding: '12px',
                background: submitting ? '#74c69d' : '#2d6a4f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
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
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              #register-submit-btn:hover:not(:disabled) { background: #1b4332; }
            `}</style>
          </form>

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7a6b', marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2d6a4f', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
