/**
 * AgroAI — Authentication Context
 * Provides Firebase Auth state to the entire application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { updateProfile, sendPasswordResetEmail as firebaseSendPasswordReset } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { authService, auth, db, isFirebaseConfigured } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'owner' | 'farmer';
}

export interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: 'owner' | 'farmer';
  loading: boolean;
  isAuthenticated: boolean;
  isFirebaseReady: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string, role?: 'owner' | 'farmer') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
}

// ─── Error Code Mapping ────────────────────────────────────────────────────────

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email or password is incorrect. Please try again.';
    case 'auth/user-not-found':
      return 'No account was found with this email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/password login is not enabled. Please contact the administrator.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

function extractFirebaseErrorCode(error: any): string {
  // Firebase errors have a `code` property like "auth/email-already-in-use"
  if (error?.code) return mapFirebaseError(error.code);
  // Fallback: parse from message string
  const match = String(error?.message || '').match(/\(([^)]+)\)/);
  if (match) return mapFirebaseError(match[1]);
  return mapFirebaseError('');
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseReady = isFirebaseConfigured();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let fetchedRole: 'owner' | 'farmer' = 'owner';
        let fetchedName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

        if (db) {
          try {
            const docRef = doc(db, 'users', firebaseUser.uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              if (data.role === 'farmer' || data.role === 'owner') {
                fetchedRole = data.role;
              }
              if (data.fullName) {
                fetchedName = data.fullName;
              }
            }
          } catch {
            // Fallback to defaults
          }
        }

        setUserProfile({
          uid: firebaseUser.uid,
          fullName: fetchedName,
          email: firebaseUser.email || '',
          role: fetchedRole,
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    if (!isFirebaseReady) {
      setLoading(false);
    }

    return unsubscribe;
  }, [isFirebaseReady]);

  // ─── login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseReady) {
      return { success: false, error: 'Firebase is not configured. Please add credentials to frontend/.env' };
    }
    try {
      const result = await authService.loginUser(email, password);
      if (!result.success) {
        return { success: false, error: extractFirebaseErrorCode({ message: result.error }) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractFirebaseErrorCode(err) };
    }
  }, [isFirebaseReady]);

  // ─── register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (fullName: string, email: string, password: string, role: 'owner' | 'farmer' = 'owner') => {
    if (!isFirebaseReady) {
      return { success: false, error: 'Firebase is not configured. Please add credentials to frontend/.env' };
    }
    try {
      const result = await authService.registerUser(email, password);
      if (!result.success || !result.user) {
        return { success: false, error: extractFirebaseErrorCode({ message: result.error }) };
      }

      const { user: newUser } = result;

      // Update Firebase Auth displayName
      if (auth && newUser) {
        try {
          await updateProfile(newUser, { displayName: fullName });
        } catch {
          // Non-critical — profile update failed silently
        }
      }

      // Create Firestore user profile (do NOT store password)
      if (db) {
        try {
          await setDoc(doc(db, 'users', newUser.uid), {
            uid: newUser.uid,
            fullName,
            email,
            role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch {
          // Non-critical for auth flow — Firestore write failed silently
        }
      }

      setUserProfile({
        uid: newUser.uid,
        fullName,
        email,
        role,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractFirebaseErrorCode(err) };
    }
  }, [isFirebaseReady]);

  // ─── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logoutUser();
    setUser(null);
    setUserProfile(null);
  }, []);

  // ─── sendPasswordReset ───────────────────────────────────────────────────────
  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isFirebaseReady || !auth) {
      return { success: false, error: 'Firebase is not configured. Please add credentials to frontend/.env' };
    }
    try {
      await firebaseSendPasswordReset(auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: extractFirebaseErrorCode(err) };
    }
  }, [isFirebaseReady]);

  const value: AuthContextValue = {
    user,
    userProfile,
    userRole: userProfile?.role || 'owner',
    loading,
    isAuthenticated: Boolean(user),
    isFirebaseReady,
    login,
    register,
    logout,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
