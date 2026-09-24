/**
 * AgroAI — Owner + Farmer Ecosystem Firestore Services
 * Handles Farms, Fields, Field Geometry (Mapbox), Farmer Assignments, Land Data, Cloudinary Images, Notifications.
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { GeoPolygon, GeoLineString } from '../components/map/AgroMap';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FarmerProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'farmer';
  assignedFieldsCount?: number;
}

export interface Farm {
  farmId: string;
  ownerId: string;
  name: string;
  location: string;
  areaHectares: number;
  description?: string;
  createdAt?: any;
}

export interface Field {
  id?: string;
  fieldId: string;
  farmId: string;
  ownerId: string;
  name: string;
  crop: string;
  areaAcres: number;
  soilType: string;
  latitude: number;
  longitude: number;
  boundary?: GeoPolygon | null;
  path?: GeoLineString | null;
  assignedFarmerId?: string | null;
  assignedFarmerName?: string | null;
  soilMoisture?: number;
  soilPH?: number;
  temperature?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  cropGrowthStage?: string;
  waterRequirement?: string;
  status: 'Healthy' | 'Needs Attention' | 'Critical' | 'Dry' | 'Moderate';
  createdAt?: any;
  updatedAt?: any;
}

export interface FieldLandData {
  id?: string;
  fieldId: string;
  farmerId: string;
  farmerName?: string;
  ownerId: string;
  soilMoisture: number; // %
  soilPH: number;
  temperature: number; // °C
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  cropGrowthStage: string;
  notes: string;
  submittedAt: any;
}

export interface FieldImageRecord {
  id?: string;
  fieldId: string;
  farmerId: string;
  farmerName?: string;
  ownerId: string;
  imageUrl: string;
  publicId?: string;
  imageType: 'leaf' | 'crop' | 'soil' | 'pest' | 'field' | 'water';
  caption: string;
  uploadedAt: any;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'assignment' | 'submission' | 'alert';
  read: boolean;
  createdAt: any;
}

// ─── Reactive Event & LocalStorage Persistence ───────────────────────────

export const ECOSYSTEM_UPDATED_EVENT = 'agroai-ecosystem-updated';

export function notifyEcosystemChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ECOSYSTEM_UPDATED_EVENT));
  }
}

const LOCAL_FARMS_KEY = 'agroai_cache_farms';
const LOCAL_FIELDS_KEY = 'agroai_cache_fields';
const LOCAL_SUBS_KEY = 'agroai_cache_submissions';
const LOCAL_IMGS_KEY = 'agroai_cache_images';

function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function syncEcosystemCache(): void {
  // When Firebase is configured, skip localStorage caching — DB is the source of truth
  // Only cache locally in offline/demo mode (when Firebase not configured)
  if (typeof window === 'undefined') return;
  try {
    const isFirebaseActive = Boolean(
      (import.meta as any).env?.VITE_FIREBASE_API_KEY &&
      (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID &&
      (import.meta as any).env?.VITE_FIREBASE_API_KEY !== 'demo-api-key'
    );
    if (isFirebaseActive) return; // Don't cache when live DB is active
    localStorage.setItem(LOCAL_FARMS_KEY, JSON.stringify(FALLBACK_FARMS));
    localStorage.setItem(LOCAL_FIELDS_KEY, JSON.stringify(FALLBACK_FIELDS));
    localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(inMemorySubmissions));
    localStorage.setItem(LOCAL_IMGS_KEY, JSON.stringify(inMemoryImages));
  } catch {
    // Ignore storage quota
  }
}

// ─── Fallback Demo Data & In-Memory Cache Initialization ────────────────────────

const FALLBACK_FARMERS: FarmerProfile[] = [
  { uid: 'farmer_01', fullName: 'Rahim Uddin', email: 'rahim@agroai.edu', role: 'farmer', assignedFieldsCount: 2 },
  { uid: 'farmer_02', fullName: 'Karim Hossain', email: 'karim@agroai.edu', role: 'farmer', assignedFieldsCount: 1 },
  { uid: 'farmer_03', fullName: 'Hasan Mahmud', email: 'hasan@agroai.edu', role: 'farmer', assignedFieldsCount: 0 },
];

const DEFAULT_FARMS: Farm[] = [
  {
    farmId: 'farm_salinas_01',
    ownerId: 'owner_demo',
    name: 'Green Valley Agriculture Farm',
    location: 'Salinas Valley, Sector 4, CA',
    areaHectares: 420,
    description: 'Primary organic cereal, vegetable, and high-yield crop operations.',
  },
];

const DEFAULT_FIELDS: Field[] = [
  {
    fieldId: 'field_north_rice',
    farmId: 'farm_salinas_01',
    ownerId: 'owner_demo',
    name: 'North Rice Field',
    crop: 'Rice',
    areaAcres: 12.5,
    soilType: 'Salinas Silty Loam',
    latitude: 36.677,
    longitude: -121.655,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.658, 36.679],
          [-121.652, 36.679],
          [-121.652, 36.675],
          [-121.658, 36.675],
          [-121.658, 36.679],
        ],
      ],
    },
    path: {
      type: 'LineString',
      coordinates: [
        [-121.659, 36.679],
        [-121.655, 36.677],
        [-121.652, 36.676],
      ],
    },
    assignedFarmerId: 'farmer_01',
    assignedFarmerName: 'Rahim Uddin',
    status: 'Healthy',
  },
  {
    fieldId: 'field_south_corn',
    farmId: 'farm_salinas_01',
    ownerId: 'owner_demo',
    name: 'South Maize Parcel',
    crop: 'Maize',
    areaAcres: 18.2,
    soilType: 'Clay Loam',
    latitude: 36.672,
    longitude: -121.65,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.654, 36.674],
          [-121.648, 36.674],
          [-121.648, 36.670],
          [-121.654, 36.670],
          [-121.654, 36.674],
        ],
      ],
    },
    path: {
      type: 'LineString',
      coordinates: [
        [-121.655, 36.674],
        [-121.650, 36.672],
      ],
    },
    assignedFarmerId: 'farmer_02',
    assignedFarmerName: 'Karim Hossain',
    status: 'Needs Attention',
  },
  {
    fieldId: 'field_east_wheat',
    farmId: 'farm_salinas_01',
    ownerId: 'owner_demo',
    name: 'East Wheat Plot',
    crop: 'Wheat',
    areaAcres: 9.4,
    soilType: 'Chualar Sandy Loam',
    latitude: 36.680,
    longitude: -121.645,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.648, 36.682],
          [-121.642, 36.682],
          [-121.642, 36.678],
          [-121.648, 36.678],
          [-121.648, 36.682],
        ],
      ],
    },
    path: {
      type: 'LineString',
      coordinates: [
        [-121.649, 36.682],
        [-121.645, 36.680],
      ],
    },
    assignedFarmerId: null,
    assignedFarmerName: null,
    status: 'Healthy',
  },
  {
    fieldId: 'field_west_tomato',
    farmId: 'farm_salinas_01',
    ownerId: 'owner_demo',
    name: 'West Tomato Sector',
    crop: 'Tomato',
    areaAcres: 15.0,
    soilType: 'Pacheco Silt Loam',
    latitude: 36.675,
    longitude: -121.662,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-121.665, 36.677],
          [-121.659, 36.677],
          [-121.659, 36.673],
          [-121.665, 36.673],
          [-121.665, 36.677],
        ],
      ],
    },
    path: {
      type: 'LineString',
      coordinates: [
        [-121.666, 36.677],
        [-121.662, 36.675],
      ],
    },
    assignedFarmerId: null,
    assignedFarmerName: null,
    status: 'Healthy',
  },
];

const DEFAULT_LAND_DATA: FieldLandData[] = [
  {
    id: 'data_demo_01',
    fieldId: 'field_north_rice',
    farmerId: 'farmer_01',
    farmerName: 'Rahim Uddin',
    ownerId: 'owner_demo',
    soilMoisture: 42,
    soilPH: 6.8,
    temperature: 24.5,
    nitrogen: 45,
    phosphorus: 32,
    potassium: 120,
    cropGrowthStage: 'Vegetative Phase',
    notes: 'Optimal soil moisture and leaf canopy density. Minor leaf tip chlorosis observed in northeast corner.',
    submittedAt: '2026-09-18T10:30:00Z',
  },
  {
    id: 'data_demo_02',
    fieldId: 'field_south_corn',
    farmerId: 'farmer_02',
    farmerName: 'Karim Hossain',
    ownerId: 'owner_demo',
    soilMoisture: 28,
    soilPH: 6.2,
    temperature: 28.1,
    nitrogen: 30,
    phosphorus: 20,
    potassium: 90,
    cropGrowthStage: 'Flowering & Tasseling',
    notes: 'Soil moisture is low (28%). Irrigation scheduled for tomorrow morning.',
    submittedAt: '2026-09-19T08:15:00Z',
  },
];

const DEFAULT_FIELD_IMAGES: FieldImageRecord[] = [
  {
    id: 'img_demo_01',
    fieldId: 'field_north_rice',
    farmerId: 'farmer_01',
    farmerName: 'Rahim Uddin',
    ownerId: 'owner_demo',
    imageUrl: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    imageType: 'leaf',
    caption: 'Healthy paddy leaves inspection',
    uploadedAt: '2026-09-18T10:32:00Z',
  },
  {
    id: 'img_demo_02',
    fieldId: 'field_south_corn',
    farmerId: 'farmer_02',
    farmerName: 'Karim Hossain',
    ownerId: 'owner_demo',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    imageType: 'field',
    caption: 'Overview of South Maize field sector 2',
    uploadedAt: '2026-09-19T08:20:00Z',
  },
];

// Initialize live memory stores from localStorage if present.
// If Firebase IS configured (live DB), clear any stale demo cache so we start clean.
function clearDemoCache(): void {
  try {
    // Remove any stale demo/seed data that may have been cached from a previous session
    localStorage.removeItem(LOCAL_FARMS_KEY);
    localStorage.removeItem(LOCAL_FIELDS_KEY);
    localStorage.removeItem(LOCAL_SUBS_KEY);
    localStorage.removeItem(LOCAL_IMGS_KEY);
  } catch {
    // Ignore
  }
}

// Detect whether Firebase is configured by checking env vars directly (avoid circular import)
const _isFirebaseReady = Boolean(
  (import.meta as any).env?.VITE_FIREBASE_API_KEY &&
  (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID &&
  (import.meta as any).env?.VITE_FIREBASE_API_KEY !== '' &&
  (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID !== '' &&
  (import.meta as any).env?.VITE_FIREBASE_API_KEY !== 'demo-api-key'
);

// When Firebase is configured, clear stale localStorage demo data
if (_isFirebaseReady) {
  clearDemoCache();
}

const FALLBACK_FARMS: Farm[] = _isFirebaseReady ? [] : loadCache(LOCAL_FARMS_KEY, DEFAULT_FARMS);
const FALLBACK_FIELDS: Field[] = _isFirebaseReady ? [] : loadCache(LOCAL_FIELDS_KEY, DEFAULT_FIELDS);
const inMemorySubmissions: FieldLandData[] = _isFirebaseReady ? [] : loadCache(LOCAL_SUBS_KEY, DEFAULT_LAND_DATA);
const inMemoryImages: FieldImageRecord[] = _isFirebaseReady ? [] : loadCache(LOCAL_IMGS_KEY, DEFAULT_FIELD_IMAGES);

// ─── Ecosystem Firestore API ──────────────────────────────────────────────────

/**
 * Fetch all registered users with role == 'farmer'
 */
export async function getRegisteredFarmers(): Promise<FarmerProfile[]> {
  if (!db) return FALLBACK_FARMERS;
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'farmer'));
    const snap = await getDocs(q);
    // DB is reachable — return only real DB farmers (empty array if none registered)
    const farmers: FarmerProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      farmers.push({
        uid: docSnap.id,
        fullName: data.fullName || 'Farmer Worker',
        email: data.email || '',
        role: 'farmer',
        assignedFieldsCount: data.assignedFieldsCount || 0,
      });
    });
    return farmers;
  } catch {
    return FALLBACK_FARMERS;
  }
}

/**
 * Create a new farm in Firestore and update local cache
 */
export async function createFarm(farm: Omit<Farm, 'farmId' | 'createdAt'>): Promise<Farm> {
  const farmId = `farm_${Date.now()}`;
  const newFarm: Farm = {
    ...farm,
    farmId,
    createdAt: new Date().toISOString(),
  };

  FALLBACK_FARMS.unshift(newFarm);
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      await setDoc(doc(db, 'farms', farmId), {
        ...newFarm,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Memory fallback
    }
  }
  return newFarm;
}

/**
 * Update an existing farm details (e.g. name, location, area, description)
 */
export async function updateFarm(farmId: string, updates: Partial<Farm>): Promise<boolean> {
  const idx = FALLBACK_FARMS.findIndex((f) => f.farmId === farmId);
  if (idx !== -1) {
    FALLBACK_FARMS[idx] = { ...FALLBACK_FARMS[idx], ...updates };
  } else if (FALLBACK_FARMS.length > 0) {
    FALLBACK_FARMS[0] = { ...FALLBACK_FARMS[0], ...updates };
  }
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      const ref = doc(db, 'farms', farmId);
      await updateDoc(ref, updates);
    } catch {
      // Memory fallback active
    }
  }
  return true;
}

/**
 * Get farms owned by ownerId
 */
export async function getFarms(ownerId?: string): Promise<Farm[]> {
  if (!db) return FALLBACK_FARMS;
  try {
    const snap = await getDocs(collection(db, 'farms'));
    
    const dbFarms: Farm[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      const fId = data.farmId || data.id || d.id;
      const fOwner = data.ownerId || data.userId || ownerId || '';
      dbFarms.push({
        ...data,
        farmId: fId,
        id: fId,
        name: data.name || 'Unnamed Farm',
        location: data.location || '',
        areaHectares: data.areaHectares || parseFloat(data.area) || 0,
        description: data.description || '',
        ownerId: fOwner,
        userId: fOwner
      } as Farm);
    });

    // DB is reachable — return only real DB farms (filtered or all, empty if none exist)
    const filtered = ownerId
      ? dbFarms.filter((f) => f.ownerId === ownerId || (f as any).userId === ownerId)
      : dbFarms;

    return filtered;
  } catch {
    return FALLBACK_FARMS;
  }
}

/**
 * Create a new field with location, boundary polygon, and path LineString
 */
export async function createField(field: Omit<Field, 'fieldId' | 'createdAt'> & { id?: string; fieldId?: string }): Promise<Field> {
  const fieldId = (field as any).id || (field as any).fieldId || `field_${Date.now()}`;
  const ownerId = field.ownerId || 'owner_demo';
  const status = (field.status as any) || 'Healthy';
  const newField: Field = {
    soilMoisture: (field as any).soilMoisture,
    soilPH: (field as any).soilPH,
    temperature: (field as any).temperature,
    humidity: (field as any).humidity,
    rainfall: (field as any).rainfall,
    waterRequirement: (field as any).waterRequirement || (status === 'Critical' ? 'Urgent' : (status === 'Dry' || status === 'Moderate') ? 'High' : 'Low'),
    ...field,
    fieldId,
    ownerId,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Field;
  (newField as any).id = fieldId;
  (newField as any).userId = ownerId;

  FALLBACK_FIELDS.unshift(newField);
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      await setDoc(doc(db, 'fields', fieldId), {
        ...newField,
        id: fieldId,
        fieldId,
        ownerId,
        userId: ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Memory fallback active
    }
  }
  return newField;
}

/**
 * Update existing field attributes (e.g. status, boundary, name, crop, soilType, areaAcres, soilMoisture, soilPH, temperature)
 */
export async function updateField(fieldId: string, updates: Partial<Field>): Promise<boolean> {
  const idx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === fieldId || (f as any).id === fieldId || (f as any).docId === fieldId
  );
  let targetDocId = fieldId;
  if (idx !== -1) {
    FALLBACK_FIELDS[idx] = { ...FALLBACK_FIELDS[idx], ...updates, updatedAt: new Date().toISOString() };
    targetDocId = (FALLBACK_FIELDS[idx] as any).docId || (FALLBACK_FIELDS[idx] as any).id || fieldId;
  }
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      let fieldRef: any = null;

      // Strategy A: Direct doc ID lookup
      const directRef = doc(db, 'fields', targetDocId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        fieldRef = directRef;
      }

      // Strategy B: Try fieldId directly if different
      if (!fieldRef && targetDocId !== fieldId) {
        const altRef = doc(db, 'fields', fieldId);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          fieldRef = altRef;
        }
      }

      // Strategy C: Query by fieldId field
      if (!fieldRef) {
        const qField = query(collection(db, 'fields'), where('fieldId', '==', fieldId));
        const snapField = await getDocs(qField);
        if (!snapField.empty) {
          fieldRef = snapField.docs[0].ref;
        }
      }

      // Strategy D: Query by id field
      if (!fieldRef) {
        const qId = query(collection(db, 'fields'), where('id', '==', fieldId));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          fieldRef = snapId.docs[0].ref;
        }
      }

      if (fieldRef) {
        await setDoc(fieldRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        console.warn(`[updateField] Field matching ID '${fieldId}' not found in Firestore fields collection.`);
      }
    } catch (err) {
      console.error('Firestore updateField error:', err);
    }
  }
  return true;
}

/**
 * Fetch fields for an Owner (combines user created fields with pre-existing demo fields)
 */
export async function getOwnerFields(ownerId?: string): Promise<Field[]> {
  if (!db) return FALLBACK_FIELDS;
  try {
    const snap = await getDocs(collection(db, 'fields'));
    
    const dbFields: Field[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      const fId = data.fieldId || data.id || d.id;
      const fOwner = data.ownerId || data.userId || '';
      const assignedId = data.assignedFarmerId || data.farmerId || data.assignedTo || null;
      const assignedName = data.assignedFarmerName || data.farmerName || null;
      dbFields.push({
        ...data,
        fieldId: fId,
        id: fId,
        docId: d.id,
        assignedFarmerId: assignedId,
        assignedFarmerName: assignedName,
        farmerId: assignedId,
        ownerId: fOwner,
        userId: fOwner
      } as unknown as Field);
    });
    
    // DB is reachable — return only real DB fields (no demo data injected)
    const filtered = ownerId
      ? dbFields.filter((f) => f.ownerId === ownerId || (f as any).userId === ownerId)
      : dbFields;

    return filtered;
  } catch (err) {
    console.error('getOwnerFields Firestore error:', err);
    return FALLBACK_FIELDS;
  }
}

/**
 * Fetch assigned fields for a Farmer (falls back to demo fields if no active assignment)
 */
export async function getFarmerAssignedFields(farmerId: string): Promise<Field[]> {
  if (!db) return FALLBACK_FIELDS;
  try {
    const list: Field[] = [];

    // Query 1: where assignedFarmerId == farmerId
    try {
      const q1 = query(collection(db, 'fields'), where('assignedFarmerId', '==', farmerId));
      const snap1 = await getDocs(q1);
      snap1.forEach((d) => {
        const data = d.data() as any;
        const fId = data.fieldId || data.id || d.id;
        list.push({
          ...data,
          fieldId: fId,
          id: fId,
          docId: d.id,
          assignedFarmerId: data.assignedFarmerId || data.farmerId || farmerId,
          assignedFarmerName: data.assignedFarmerName || data.farmerName || null,
          farmerId: data.farmerId || data.assignedFarmerId || farmerId,
        } as unknown as Field);
      });
    } catch {
      // Fallthrough to query 2
    }

    // Query 2: where farmerId == farmerId (fallback query for legacy documents)
    try {
      const q2 = query(collection(db, 'fields'), where('farmerId', '==', farmerId));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => {
        const data = d.data() as any;
        const fId = data.fieldId || data.id || d.id;
        if (!list.some((item) => item.fieldId === fId || (item as any).id === fId)) {
          list.push({
            ...data,
            fieldId: fId,
            id: fId,
            docId: d.id,
            assignedFarmerId: data.assignedFarmerId || data.farmerId || farmerId,
            assignedFarmerName: data.assignedFarmerName || data.farmerName || null,
            farmerId: data.farmerId || data.assignedFarmerId || farmerId,
          } as unknown as Field);
        }
      });
    } catch {
      // Fallthrough
    }

    return list;
  } catch {
    return FALLBACK_FIELDS;
  }
}

/**
 * Assign a farmer to a field and send notification
 */
export async function assignFarmerToField(
  fieldId: string,
  farmerId: string | null,
  farmerName: string | null,
  ownerId: string
): Promise<boolean> {
  if (!fieldId) {
    console.error('assignFarmerToField error: missing fieldId');
    return false;
  }

  // Update local fallback copy as well
  const idx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === fieldId || (f as any).id === fieldId || (f as any).docId === fieldId
  );
  let targetDocId = fieldId;
  if (idx !== -1) {
    FALLBACK_FIELDS[idx].assignedFarmerId = farmerId;
    FALLBACK_FIELDS[idx].assignedFarmerName = farmerName;
    (FALLBACK_FIELDS[idx] as any).farmerId = farmerId;
    (FALLBACK_FIELDS[idx] as any).assignedTo = farmerId;
    targetDocId = (FALLBACK_FIELDS[idx] as any).docId || (FALLBACK_FIELDS[idx] as any).id || fieldId;
  }
  syncEcosystemCache();

  if (db) {
    try {
      const updates = {
        assignedFarmerId: farmerId,
        assignedFarmerName: farmerName,
        farmerId: farmerId,
        assignedTo: farmerId,
        updatedAt: serverTimestamp(),
      };

      // Resolve exact existing Firestore document reference
      let fieldRef: any = null;

      // Strategy A: Direct document ID lookup
      const directRef = doc(db, 'fields', targetDocId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        fieldRef = directRef;
      }

      // Strategy B: If targetDocId differed, try fieldId directly
      if (!fieldRef && targetDocId !== fieldId) {
        const altRef = doc(db, 'fields', fieldId);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          fieldRef = altRef;
        }
      }

      // Strategy C: Query by 'fieldId' field
      if (!fieldRef) {
        const qField = query(collection(db, 'fields'), where('fieldId', '==', fieldId));
        const snapField = await getDocs(qField);
        if (!snapField.empty) {
          fieldRef = snapField.docs[0].ref;
        }
      }

      // Strategy D: Query by 'id' field
      if (!fieldRef) {
        const qId = query(collection(db, 'fields'), where('id', '==', fieldId));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          fieldRef = snapId.docs[0].ref;
        }
      }

      // Strategy E: Scan all documents in collection to locate matching document
      if (!fieldRef) {
        const allSnap = await getDocs(collection(db, 'fields'));
        for (const docSnap of allSnap.docs) {
          const data = docSnap.data();
          if (
            docSnap.id === fieldId ||
            docSnap.id === targetDocId ||
            data.fieldId === fieldId ||
            data.id === fieldId ||
            data.docId === fieldId
          ) {
            fieldRef = docSnap.ref;
            break;
          }
        }
      }

      // CRITICAL: Only update existing field document. Never setDoc on non-existent reference.
      if (fieldRef) {
        await setDoc(fieldRef, updates, { merge: true });
      } else {
        console.warn(`[assignFarmerToField] Field document matching ID '${fieldId}' not found in Firestore.`);
        return false;
      }

      // Sync with FastAPI backend if running
      try {
        const { apiService } = await import('./api');
        const apiUpdates = {
          assignedFarmerId: farmerId,
          assignedFarmerName: farmerName,
          farmerId: farmerId,
          assignedTo: farmerId,
          updatedAt: new Date().toISOString(),
        };
        await apiService.updateField(fieldId, apiUpdates as any);
      } catch (apiErr) {
        console.warn('Backend API updateField sync notice:', apiErr);
      }

      // Create field assignment audit document
      const assignId = `assign_${fieldId}_${Date.now()}`;
      await setDoc(doc(db, 'field_assignments', assignId), {
        fieldId,
        farmerId,
        farmerName,
        ownerId,
        assignedAt: serverTimestamp(),
      });

      // Send notification document if assigned
      if (farmerId) {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          recipientId: farmerId,
          title: 'New Field Assignment',
          message: `You have been assigned to field ${fieldId}.`,
          type: 'assignment',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      notifyEcosystemChange();
      return true;
    } catch (err) {
      console.error('Firestore assignFarmerToField error:', err);
      notifyEcosystemChange();
      return false;
    }
  }

  notifyEcosystemChange();
  return true;
}

/**
 * Submit field soil & crop observation land data
 */
export async function submitFieldData(data: Omit<FieldLandData, 'id' | 'submittedAt'>): Promise<boolean> {
  const id = `data_${Date.now()}`;
  const submissionRecord: FieldLandData = {
    ...data,
    id,
    submittedAt: new Date().toISOString(),
  };
  inMemorySubmissions.unshift(submissionRecord);

  // Calculate telemetry status & water requirement
  const calculatedStatus: Field['status'] =
    data.soilMoisture < 30
      ? 'Dry'
      : data.notes?.includes('Pest Observed') || data.notes?.includes('Critical')
      ? 'Critical'
      : data.soilMoisture < 45
      ? 'Moderate'
      : 'Healthy';

  const waterReq =
    data.soilMoisture < 30
      ? 'Urgent'
      : data.soilMoisture < 45
      ? 'High'
      : data.soilMoisture < 60
      ? 'Moderate'
      : 'Low';

  const fieldTelemetryUpdates: Partial<Field> = {
    soilMoisture: Number(data.soilMoisture),
    soilPH: Number(data.soilPH),
    temperature: Number(data.temperature),
    nitrogen: Number(data.nitrogen),
    phosphorus: Number(data.phosphorus),
    potassium: Number(data.potassium),
    cropGrowthStage: data.cropGrowthStage,
    waterRequirement: waterReq,
    status: calculatedStatus,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update field telemetry values in FALLBACK_FIELDS in-place
  const targetIdx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === data.fieldId || (f as any).id === data.fieldId || (f as any).docId === data.fieldId
  );
  if (targetIdx !== -1) {
    FALLBACK_FIELDS[targetIdx] = {
      ...FALLBACK_FIELDS[targetIdx],
      ...fieldTelemetryUpdates,
    };
  }

  syncEcosystemCache();

  if (db) {
    try {
      // 2. Save observation record in field_data collection
      await setDoc(doc(db, 'field_data', id), {
        ...data,
        id,
        submittedAt: serverTimestamp(),
      });

      // 3. Resolve exact existing field document in fields collection
      let targetDocId = data.fieldId;
      if (targetIdx !== -1) {
        targetDocId = (FALLBACK_FIELDS[targetIdx] as any).docId || (FALLBACK_FIELDS[targetIdx] as any).id || data.fieldId;
      }

      let fieldRef: any = null;

      // Strategy A: Direct doc ID lookup
      const directRef = doc(db, 'fields', targetDocId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        fieldRef = directRef;
      }

      // Strategy B: Try fieldId directly if different
      if (!fieldRef && targetDocId !== data.fieldId) {
        const altRef = doc(db, 'fields', data.fieldId);
        const altSnap = await getDoc(altRef);
        if (altSnap.exists()) {
          fieldRef = altRef;
        }
      }

      // Strategy C: Query by fieldId field
      if (!fieldRef) {
        const qField = query(collection(db, 'fields'), where('fieldId', '==', data.fieldId));
        const snapField = await getDocs(qField);
        if (!snapField.empty) {
          fieldRef = snapField.docs[0].ref;
        }
      }

      // Strategy D: Query by id field
      if (!fieldRef) {
        const qId = query(collection(db, 'fields'), where('id', '==', data.fieldId));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          fieldRef = snapId.docs[0].ref;
        }
      }

      // Strategy E: Scan all documents in collection to locate matching document
      if (!fieldRef) {
        const allSnap = await getDocs(collection(db, 'fields'));
        for (const docSnap of allSnap.docs) {
          const docData = docSnap.data();
          if (
            docSnap.id === data.fieldId ||
            docSnap.id === targetDocId ||
            docData.fieldId === data.fieldId ||
            docData.id === data.fieldId ||
            docData.docId === data.fieldId
          ) {
            fieldRef = docSnap.ref;
            break;
          }
        }
      }

      // 4. Update the EXISTING field document in-place with telemetry updates
      if (fieldRef) {
        await setDoc(
          fieldRef,
          {
            ...fieldTelemetryUpdates,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        console.warn(`[submitFieldData] Target field '${data.fieldId}' not found in Firestore fields collection.`);
      }

      // 5. Sync with FastAPI backend if running
      try {
        const { apiService } = await import('./api');
        await apiService.updateField(data.fieldId, {
          ...fieldTelemetryUpdates,
          updatedAt: new Date().toISOString(),
        } as any);
      } catch (apiErr) {
        console.warn('Backend API updateField sync notice:', apiErr);
      }

      // 6. Send notification to Owner
      try {
        const notifId = `notif_sub_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          recipientId: data.ownerId,
          title: 'New Field Data Submission',
          message: `${data.farmerName || 'Farmer'} submitted new soil & crop data for field.`,
          type: 'submission',
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn('Notification send notice:', notifErr);
      }

      notifyEcosystemChange();
      return true;
    } catch (err) {
      console.error('Firestore submitFieldData error:', err);
      notifyEcosystemChange();
      return true;
    }
  }

  notifyEcosystemChange();
  return true;
}

/**
 * Fetch land data submissions for a field
 */
export async function getFieldData(fieldId: string): Promise<FieldLandData[]> {
  let dbList: FieldLandData[] = [];
  if (db) {
    try {
      const q = query(collection(db, 'field_data'), where('fieldId', '==', fieldId));
      const snap = await getDocs(q);
      snap.forEach((d) => dbList.push(d.data() as FieldLandData));
    } catch {
      // Fallthrough
    }
  }
  const memList = inMemorySubmissions.filter((item) => item.fieldId === fieldId);
  const combined = [...dbList];
  memList.forEach((mem) => {
    if (!combined.some((item) => item.id === mem.id)) {
      combined.push(mem);
    }
  });
  return combined;
}

/**
 * Save uploaded Cloudinary field image metadata into Firestore
 */
export async function recordFieldImage(
  image: Omit<FieldImageRecord, 'id' | 'uploadedAt'>
): Promise<boolean> {
  const id = `img_${Date.now()}`;
  const record: FieldImageRecord = {
    ...image,
    id,
    uploadedAt: new Date().toISOString(),
  };
  inMemoryImages.unshift(record);
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      await setDoc(doc(db, 'field_images', id), {
        ...image,
        id,
        uploadedAt: serverTimestamp(),
      });

      // Notify Owner
      const notifId = `notif_img_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: image.ownerId,
        title: 'New Field Image Uploaded',
        message: `${image.farmerName || 'Farmer'} uploaded a new ${image.imageType} image.`,
        type: 'submission',
        read: false,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch {
      return true;
    }
  }
  return true;
}

/**
 * Fetch field images for a field
 */
export async function getFieldImages(fieldId: string): Promise<FieldImageRecord[]> {
  let dbImages: FieldImageRecord[] = [];
  if (db) {
    try {
      const q = query(collection(db, 'field_images'), where('fieldId', '==', fieldId));
      const snap = await getDocs(q);
      snap.forEach((d) => dbImages.push(d.data() as FieldImageRecord));
    } catch {
      // Fallthrough
    }
  }
  const memImages = inMemoryImages.filter((img) => img.fieldId === fieldId);
  const combined = [...dbImages];
  memImages.forEach((mem) => {
    if (!combined.some((img) => img.id === mem.id)) {
      combined.push(mem);
    }
  });
  return combined;
}

