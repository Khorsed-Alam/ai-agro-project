/**
 * AgroAI - Firebase Service Layer
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
  deleteDoc,
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

export const isFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(key && project && key !== '' && project !== '' && key !== 'demo-api-key');
};

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

export const authService = {
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

  onAuthChange(callback: (user: User | null) => void) {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};

export const firestoreService = {
  /** Fields Collection */
  async saveField(fieldData: any): Promise<{ success: boolean; id: string; error?: string }> {
    if (!db) return { success: false, id: fieldData.id || fieldData.fieldId || 'mock-id', error: 'Firestore not configured' };
    try {
      const fieldId = fieldData.id || fieldData.fieldId || `field_${Date.now()}`;
      const docRef = doc(db, 'fields', fieldId);
      const currentUser = auth?.currentUser;
      const ownerId = fieldData.ownerId || fieldData.userId || currentUser?.uid || 'guest';
      const payload = {
        ...fieldData,
        id: fieldId,
        fieldId: fieldId,
        ownerId: ownerId,
        userId: ownerId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, payload, { merge: true });
      return { success: true, id: fieldId };
    } catch (error: any) {
      return { success: false, id: fieldData.id || fieldData.fieldId || 'mock-id', error: error.message };
    }
  },

  async getFields(): Promise<{ success: boolean; data: any[]; error?: string }> {
    if (!db) return { success: false, data: [], error: 'Firestore not configured' };
    try {
      const querySnapshot = await getDocs(collection(db, 'fields'));
      const fields: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = data.fieldId || data.id || docSnap.id;
        const ownerId = data.ownerId || data.userId || 'guest';
        fields.push({
          ...data,
          id: docId,
          fieldId: docId,
          ownerId: ownerId,
          userId: ownerId
        });
      });
      return { success: true, data: fields };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  },

  async deleteField(fieldId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) return { success: false, error: 'Firestore not configured' };
    try {
      await deleteDoc(doc(db, 'fields', fieldId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /** Farms Collection */
  async saveFarm(farmData: any): Promise<{ success: boolean; id: string; error?: string }> {
    if (!db) return { success: false, id: farmData.id || farmData.farmId || 'mock-id', error: 'Firestore not configured' };
    try {
      const farmId = farmData.id || farmData.farmId || `farm-${Date.now()}`;
      const currentUser = auth?.currentUser;
      const ownerId = farmData.ownerId || farmData.userId || currentUser?.uid || 'guest';
      const payload = {
        ...farmData,
        id: farmId,
        farmId: farmId,
        ownerId: ownerId,
        userId: ownerId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'farms', farmId), payload, { merge: true });
      return { success: true, id: farmId };
    } catch (error: any) {
      return { success: false, id: farmData.id || farmData.farmId || 'mock-id', error: error.message };
    }
  },

  async getFarms(): Promise<{ success: boolean; data: any[]; error?: string }> {
    if (!db) return { success: false, data: [], error: 'Firestore not configured' };
    try {
      const querySnapshot = await getDocs(collection(db, 'farms'));
      const farms: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = data.farmId || data.id || docSnap.id;
        const ownerId = data.ownerId || data.userId || 'guest';
        farms.push({
          ...data,
          id: docId,
          farmId: docId,
          ownerId: ownerId,
          userId: ownerId
        });
      });
      return { success: true, data: farms };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  },

  async deleteFarm(farmId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) return { success: false, error: 'Firestore not configured' };
    try {
      await deleteDoc(doc(db, 'farms', farmId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /** Activity Logs Collection */
  async saveLog(logData: any): Promise<{ success: boolean; id: string; error?: string }> {
    if (!db) return { success: false, id: logData.id || 'mock-id', error: 'Firestore not configured' };
    try {
      const logId = logData.id || `rec-${Date.now()}`;
      const currentUser = auth?.currentUser;
      await setDoc(doc(db, 'activity_logs', logId), { ...logData, userId: currentUser?.uid || 'guest', timestamp: new Date().toISOString() }, { merge: true });
      return { success: true, id: logId };
    } catch (error: any) {
      return { success: false, id: logData.id || 'mock-id', error: error.message };
    }
  },

  async getLogs(): Promise<{ success: boolean; data: any[]; error?: string }> {
    if (!db) return { success: false, data: [], error: 'Firestore not configured' };
    try {
      const querySnapshot = await getDocs(collection(db, 'activity_logs'));
      const logs: any[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      return { success: true, data: logs };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }
};

export const firebaseService = firestoreService;
