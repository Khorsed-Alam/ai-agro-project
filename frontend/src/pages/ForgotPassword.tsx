/**
 * AgroAI — Forgot Password Page
 * Route: /forgot-password
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

export const ForgotPassword: React.FC = () => {
  const { sendPasswordReset, isAuthenticated, isFirebaseReady } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const result = await sendPasswordReset(email.trim());
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to send reset email. Please try again.');
    } else {
      setSuccessMessage('Password reset email sent! Please check your inbox (and spam folder).');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f8f5',
        fontFamily: 'Inter, sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
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
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#1b4332', letterSpacing: '-0.3px' }}>AgroAI</span>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '36px 32px',
            border: '1px solid #e0e8e0',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              border: '1px solid #bbf7d0',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#2d6a4f' }}>lock_reset</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2e1a', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
            Reset your password
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7a6b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {!isFirebaseReady && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '20px', color: '#92400e', fontSize: '13px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>warning</span>
              <span>Firebase is not configured. Please add credentials to <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>frontend/.env</code></span>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0, color: '#22c55e' }}>mark_email_read</span>
                <span>{successMessage}</span>
              </div>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  background: '#2d6a4f',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="forgot-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374537', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={{
                    ...inputStyle,
                    borderColor: focused ? '#2d6a4f' : '#d0d9d0',
                    boxShadow: focused ? '0 0 0 3px rgba(45,106,79,0.12)' : 'none',
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
                  marginBottom: '16px',
                }}
              >
                {submitting && (
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTop: '2.5px solid #fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                )}
                {submitting ? 'Sending…' : 'Send Reset Email'}
              </button>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                #forgot-submit-btn:hover:not(:disabled) { background: #1b4332; }
              `}</style>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Link to="/login" style={{ fontSize: '13px', color: '#6b7a6b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
