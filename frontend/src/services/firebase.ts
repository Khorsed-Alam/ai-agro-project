/**
 * AgroAI - Firebase Foundation Service Layer (Week 1)
 *
 * Beginners Guide to this architecture:
 * 1. Initialize Firebase App using Vite environment variables.
 * 2. Get Firebase Authentication service for email/password user login.
 * 3. Get Firestore Database instance for cloud field data persistence.
 * 4. Gracefully fallback to local/demo data if Firebase credentials are missing.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  type Firestore
} from 'firebase/firestore';

// STEP 1: Firebase Configuration using Vite Environment Variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if real Firebase environment variables are provided by the user
export const isFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(key && project && key !== '' && project !== '' && key !== 'demo-api-key');
};

// STEP 2: Initialize Firebase App, Auth, and Firestore Services
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[AgroAI Firebase] SDK successfully initialized with environment credentials.');
  } catch (error) {
    console.warn('[AgroAI Firebase] Initialization attempt failed:', error);
  }
} else {
  console.info('[AgroAI Firebase] SDK installed & ready. Awaiting real credentials in frontend/.env');
}

export { app, auth, db };

// STEP 3: Detailed Status Helper for Settings UI
export const getFirebaseStatus = () => {
  const configured = isFirebaseConfigured();
  return {
    sdkInstalled: true,
    isConfigured: configured,
    projectId: firebaseConfig.projectId || 'agroai-demo',
    status: configured
      ? 'Connected (Live Firebase Cloud)'
      : 'SDK Installed & Code Ready (Configuration Required)',
    authReady: Boolean(auth),
    firestoreReady: Boolean(db)
  };
};

// STEP 4: Beginner-Friendly Authentication Helpers
export const authService = {
  /**
   * Register a new user with email and password
   */
  async registerUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not configured. Please add credentials to .env' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  },

  /**
   * Log in an existing user with email and password
   */
  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not configured. Please add credentials to .env' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  /**
   * Sign out the currently logged-in user
   */
  async logoutUser(): Promise<{ success: boolean; error?: string }> {
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not configured' };
    }
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Logout failed' };
    }
  },

  /**
   * Listen for user login/logout state changes
   */
  onAuthChange(callback: (user: User | null) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};

// STEP 5: Beginner-Friendly Firestore Persistence Helpers (Fields collection)
export const firestoreService = {
  /**
   * Save or update a field record in Firestore 'fields' collection
   */
  async saveField(fieldData: any): Promise<{ success: boolean; id: string; error?: string }> {
    if (!db) {
      console.warn('[Firestore Service] Firestore not connected. Skipping cloud save.');
      return { success: false, id: fieldData.id || 'mock-id', error: 'Firestore not configured' };
    }
    try {
      const fieldId = fieldData.id || `field_${Date.now()}`;
      const docRef = doc(db, 'fields', fieldId);
      await setDoc(docRef, { ...fieldData, updatedAt: new Date().toISOString() }, { merge: true });
      return { success: true, id: fieldId };
    } catch (error: any) {
      console.error('[Firestore Service] Save error:', error);
      return { success: false, id: fieldData.id || 'mock-id', error: error.message };
    }
  },

  /**
   * Retrieve all fields from Firestore 'fields' collection
   */
  async getFields(): Promise<{ success: boolean; data: any[]; error?: string }> {
    if (!db) {
      return { success: false, data: [], error: 'Firestore not configured' };
    }
    try {
      const querySnapshot = await getDocs(collection(db, 'fields'));
      const fields: any[] = [];
      querySnapshot.forEach((docSnap) => {
        fields.push({ id: docSnap.id, ...docSnap.data() });
      });
      return { success: true, data: fields };
    } catch (error: any) {
      console.error('[Firestore Service] Fetch error:', error);
      return { success: false, data: [], error: error.message };
    }
  }
};

// Legacy compatibility export
export const firebaseService = firestoreService;
