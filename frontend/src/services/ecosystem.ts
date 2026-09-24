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
  orderBy,
  limit,
  onSnapshot,
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
  humidity?: number;
  rainfall?: number;
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

  // Section 6: Automatically create 4 default fields (Field A, Field B, Field C, Field D)
  const defaultFieldNames = ['Field A', 'Field B', 'Field C', 'Field D'];
  const defaultCrops = ['Rice', 'Maize', 'Wheat', 'Potato'];
  const defaultSoils = ['Salinas Silty Loam', 'Clay Loam', 'Chualar Sandy Loam', 'Pacheco Silt Loam'];

  for (let i = 0; i < 4; i++) {
    const fId = `field_${farmId}_${i + 1}`;
    try {
      await createField({
        fieldId: fId,
        id: fId,
        farmId: farmId,
        ownerId: farm.ownerId || 'owner_demo',
        name: defaultFieldNames[i],
        crop: defaultCrops[i],
        areaAcres: 10 + i * 2,
        soilType: defaultSoils[i],
        latitude: 36.677 + i * 0.004,
        longitude: -121.655 + i * 0.004,
        status: 'Healthy',
        soilMoisture: 45 + i * 3,
        soilPH: 6.5 + i * 0.1,
        temperature: 24.0 + i,
      });
    } catch (err) {
      console.warn('Auto-create default field error:', err);
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
      const fId = data.farmId || data.fieldId || d.id;
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
      const fId = data.farmId || data.fieldId || d.id;
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
        if (data.deleted === true) return;
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
        const fId = data.farmId || data.fieldId || d.id;
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


// ─── Assignment Requests ───────────────────────────────────────────────────────

export type AssignmentRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'unassigned';

export interface AssignmentRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  farmName: string;
  fieldId: string;
  fieldName: string;
  status: AssignmentRequestStatus;
  createdAt: any;
  updatedAt?: any;
  approvedAt?: any;
  rejectedAt?: any;
  unassignedAt?: any;
}

export interface AssignmentRecord {
  id: string;
  ownerId: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  farmName: string;
  fieldId: string;
  fieldName: string;
  status: 'active' | 'inactive';
  assignedAt: any;
  unassignedAt?: any;
}

// In-memory fallbacks for offline/demo mode
const inMemoryAssignmentRequests: AssignmentRequest[] = [];
const inMemoryAssignments: AssignmentRecord[] = [];

/**
 * Get active assignment for a farmer (returns null if none)
 * Business Rule: One farmer = one active field at a time
 */
export async function getFarmerActiveAssignment(farmerId: string): Promise<AssignmentRecord | null> {
  if (db) {
    try {
      const q = query(
        collection(db, 'assignments'),
        where('farmerId', '==', farmerId),
        where('status', '==', 'active'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as AssignmentRecord;
      }
      return null;
    } catch {
      // fallthrough
    }
  }
  return inMemoryAssignments.find((a) => a.farmerId === farmerId && a.status === 'active') || null;
}

/**
 * Get active assignment for a field (returns null if none)
 * Business Rule: One field = one active farmer at a time
 */
export async function getFieldActiveAssignment(fieldId: string): Promise<AssignmentRecord | null> {
  if (db) {
    try {
      const q = query(
        collection(db, 'assignments'),
        where('fieldId', '==', fieldId),
        where('status', '==', 'active'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as AssignmentRecord;
      }
      return null;
    } catch {
      // fallthrough
    }
  }
  return inMemoryAssignments.find((a) => a.fieldId === fieldId && a.status === 'active') || null;
}

/**
 * Owner creates an assignment request for a farmer to work a field.
 * Enforces: farmer must be available, field must be available.
 */
export async function createAssignmentRequest(params: {
  ownerId: string;
  ownerName: string;
  farmerId: string;
  farmerName: string;
  farmId: string;
  farmName: string;
  fieldId: string;
  fieldName: string;
}): Promise<{ success: boolean; error?: string; request?: AssignmentRequest }> {

  // Rule 1: Farmer must not have active assignment
  const farmerActive = await getFarmerActiveAssignment(params.farmerId);
  if (farmerActive) {
    return { success: false, error: 'This farmer is already assigned to another field.' };
  }

  // Rule 2: Field must not have active farmer
  const fieldActive = await getFieldActiveAssignment(params.fieldId);
  if (fieldActive) {
    return { success: false, error: 'This field already has an assigned farmer.' };
  }

  // Rule 3: No pending request to the same field or from the same farmer already pending
  if (db) {
    try {
      const qExisting = query(
        collection(db, 'assignment_requests'),
        where('farmerId', '==', params.farmerId),
        where('status', '==', 'pending')
      );
      const existingSnap = await getDocs(qExisting);
      if (!existingSnap.empty) {
        return { success: false, error: 'A pending assignment request already exists for this farmer.' };
      }
    } catch {
      // Proceed
    }
  }

  const requestId = `areq_${Date.now()}`;
  const request: AssignmentRequest = {
    ...params,
    id: requestId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  inMemoryAssignmentRequests.unshift(request);

  if (db) {
    try {
      await setDoc(doc(db, 'assignment_requests', requestId), {
        ...request,
        createdAt: serverTimestamp(),
      });

      // Notify farmer
      const notifId = `notif_areq_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: params.farmerId,
        title: 'New Field Assignment Request',
        message: `${params.ownerName} wants to assign you to ${params.fieldName} at ${params.farmName}.`,
        type: 'assignment',
        read: false,
        requestId,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('createAssignmentRequest Firestore error:', err);
    }
  }

  notifyEcosystemChange();
  return { success: true, request };
}

/**
 * Get assignment requests by farmerId (farmer sees their incoming requests)
 */
export async function getFarmerAssignmentRequests(farmerId: string): Promise<AssignmentRequest[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'assignment_requests'),
        where('farmerId', '==', farmerId)
      );
      const snap = await getDocs(q);
      const list: AssignmentRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AssignmentRequest));
      return list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    } catch (err) {
      console.error('getFarmerAssignmentRequests error:', err);
    }
  }
  return inMemoryAssignmentRequests.filter((r) => r.farmerId === farmerId);
}

/**
 * Get assignment requests by ownerId (owner sees outgoing requests)
 */
export async function getOwnerAssignmentRequests(ownerId: string): Promise<AssignmentRequest[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'assignment_requests'),
        where('ownerId', '==', ownerId)
      );
      const snap = await getDocs(q);
      const list: AssignmentRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AssignmentRequest));
      return list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    } catch (err) {
      console.error('getOwnerAssignmentRequests error:', err);
    }
  }
  return inMemoryAssignmentRequests.filter((r) => r.ownerId === ownerId);
}

/**
 * Farmer approves an assignment request.
 * Creates an active assignment record and updates the field.
 */
export async function approveAssignmentRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  let request: AssignmentRequest | null = null;

  // Load from DB or memory
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'assignment_requests', requestId));
      if (snap.exists()) {
        request = { id: snap.id, ...snap.data() } as AssignmentRequest;
      }
    } catch {
      // fallthrough
    }
  }
  if (!request) {
    request = inMemoryAssignmentRequests.find((r) => r.id === requestId) || null;
  }
  if (!request) return { success: false, error: 'Assignment request not found.' };
  if (request.status !== 'pending') return { success: false, error: 'Request is no longer pending.' };

  // Re-check business rules at approval time
  const farmerActive = await getFarmerActiveAssignment(request.farmerId);
  if (farmerActive) {
    return { success: false, error: 'You already have an active field assignment. Please unassign first.' };
  }
  const fieldActive = await getFieldActiveAssignment(request.fieldId);
  if (fieldActive) {
    return { success: false, error: 'This field already has an assigned farmer.' };
  }

  const now = new Date().toISOString();

  // Create active assignment record
  const assignId = `assign_${Date.now()}`;
  const assignmentRecord: AssignmentRecord = {
    id: assignId,
    ownerId: request.ownerId,
    farmerId: request.farmerId,
    farmerName: request.farmerName,
    farmId: request.farmId,
    farmName: request.farmName,
    fieldId: request.fieldId,
    fieldName: request.fieldName,
    status: 'active',
    assignedAt: now,
  };
  inMemoryAssignments.unshift(assignmentRecord);

  // Update request status in memory
  const memIdx = inMemoryAssignmentRequests.findIndex((r) => r.id === requestId);
  if (memIdx !== -1) {
    inMemoryAssignmentRequests[memIdx].status = 'approved';
    inMemoryAssignmentRequests[memIdx].approvedAt = now;
  }

  if (db) {
    try {
      // Update request
      await setDoc(doc(db, 'assignment_requests', requestId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create assignments record
      await setDoc(doc(db, 'assignments', assignId), {
        ...assignmentRecord,
        assignedAt: serverTimestamp(),
      });

      // Update field with assigned farmer
      await assignFarmerToField(request.fieldId, request.farmerId, request.farmerName, request.ownerId);

      // Notify owner
      const notifId = `notif_approved_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: request.ownerId,
        title: 'Assignment Request Approved',
        message: `${request.farmerName} approved your assignment request for ${request.fieldName}.`,
        type: 'assignment',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('approveAssignmentRequest Firestore error:', err);
    }
  } else {
    // Offline: update field in memory
    await assignFarmerToField(request.fieldId, request.farmerId, request.farmerName, request.ownerId);
  }

  notifyEcosystemChange();
  return { success: true };
}

/**
 * Farmer rejects an assignment request.
 */
export async function rejectAssignmentRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  let request: AssignmentRequest | null = null;

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'assignment_requests', requestId));
      if (snap.exists()) {
        request = { id: snap.id, ...snap.data() } as AssignmentRequest;
      }
    } catch {
      // fallthrough
    }
  }
  if (!request) {
    request = inMemoryAssignmentRequests.find((r) => r.id === requestId) || null;
  }
  if (!request) return { success: false, error: 'Assignment request not found.' };

  const now = new Date().toISOString();

  // Update in memory
  const memIdx = inMemoryAssignmentRequests.findIndex((r) => r.id === requestId);
  if (memIdx !== -1) {
    inMemoryAssignmentRequests[memIdx].status = 'rejected';
    inMemoryAssignmentRequests[memIdx].rejectedAt = now;
  }

  if (db) {
    try {
      await setDoc(doc(db, 'assignment_requests', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Notify owner
      const notifId = `notif_rejected_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: request.ownerId,
        title: 'Assignment Request Rejected',
        message: `${request.farmerName} rejected your assignment request for ${request.fieldName}.`,
        type: 'assignment',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('rejectAssignmentRequest Firestore error:', err);
    }
  }

  notifyEcosystemChange();
  return { success: true };
}

/**
 * Farmer unassigns themselves from their currently active field.
 * Keeps assignment history intact.
 */
export async function unassignFarmerFromField(farmerId: string, farmerName: string): Promise<{ success: boolean; error?: string }> {
  let activeAssignment = await getFarmerActiveAssignment(farmerId);
  
  if (!activeAssignment) {
    const assignedFields = await getFarmerAssignedFields(farmerId);
    if (assignedFields.length > 0) {
      const f = assignedFields[0];
      activeAssignment = {
        id: f.fieldId || (f as any).id,
        ownerId: f.ownerId || 'owner_demo',
        farmerId: farmerId,
        farmerName: farmerName,
        farmId: f.farmId || 'farm_salinas_01',
        farmName: 'My Farm',
        fieldId: f.fieldId || (f as any).id,
        fieldName: f.name,
        status: 'active',
        assignedAt: new Date().toISOString()
      };
    }
  }

  if (!activeAssignment) {
    return { success: false, error: 'No active assignment found.' };
  }

  const now = new Date().toISOString();

  // Update in memory
  const memIdx = inMemoryAssignments.findIndex((a) => a.id === activeAssignment.id);
  if (memIdx !== -1) {
    inMemoryAssignments[memIdx].status = 'inactive';
    inMemoryAssignments[memIdx].unassignedAt = now;
  }

  // Clear field assignment
  await assignFarmerToField(activeAssignment.fieldId, null, null, activeAssignment.ownerId);

  if (db) {
    try {
      // Mark assignment as inactive (do NOT delete — keep history)
      await setDoc(doc(db, 'assignments', activeAssignment.id), {
        status: 'inactive',
        unassignedAt: serverTimestamp(),
      }, { merge: true });

      // Also update the matching assignment_request to unassigned
      const q = query(
        collection(db, 'assignment_requests'),
        where('farmerId', '==', farmerId),
        where('fieldId', '==', activeAssignment.fieldId),
        where('status', '==', 'approved')
      );
      const reqSnap = await getDocs(q);
      for (const d of reqSnap.docs) {
        await setDoc(d.ref, { status: 'unassigned', unassignedAt: serverTimestamp() }, { merge: true });
      }

      // Notify owner
      const notifId = `notif_unassign_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        recipientId: activeAssignment.ownerId,
        title: 'Farmer Unassigned',
        message: `${farmerName} has unassigned from ${activeAssignment.fieldName}.`,
        type: 'assignment',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('unassignFarmerFromField Firestore error:', err);
    }
  }

  notifyEcosystemChange();
  return { success: true };
}

/**
 * Get assignment history for a farmer
 */
export async function getFarmerAssignmentHistory(farmerId: string): Promise<AssignmentRecord[]> {
  if (db) {
    try {
      const q = query(collection(db, 'assignments'), where('farmerId', '==', farmerId));
      const snap = await getDocs(q);
      const list: AssignmentRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AssignmentRecord));
      return list.sort((a, b) => (b.assignedAt > a.assignedAt ? 1 : -1));
    } catch (err) {
      console.error('getFarmerAssignmentHistory error:', err);
    }
  }
  return inMemoryAssignments.filter((a) => a.farmerId === farmerId);
}

/**
 * Get assignment history for an owner's farms
 */
export async function getOwnerAssignmentHistory(ownerId: string): Promise<AssignmentRecord[]> {
  if (db) {
    try {
      const q = query(collection(db, 'assignments'), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const list: AssignmentRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AssignmentRecord));
      return list.sort((a, b) => (b.assignedAt > a.assignedAt ? 1 : -1));
    } catch (err) {
      console.error('getOwnerAssignmentHistory error:', err);
    }
  }
  return inMemoryAssignments.filter((a) => a.ownerId === ownerId);
}


// ─── 1-to-1 Chat System ───────────────────────────────────────────────────────

export interface ConversationRecord {
  id: string;
  participants: string[];  // [ownerId, farmerId]
  ownerId: string;
  farmerId: string;
  ownerName: string;
  farmerName: string;
  lastMessage?: string;
  lastMessageAt?: any;
  createdAt: any;
  updatedAt?: any;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: any;
  read: boolean;
}

// In-memory chat fallbacks
const inMemoryConversations: ConversationRecord[] = [];
const inMemoryMessages: ChatMessage[] = [];

/**
 * Get or create a 1:1 conversation between owner and farmer.
 * Prevents duplicate conversations.
 */
export async function getOrCreateConversation(params: {
  ownerId: string;
  farmerId: string;
  ownerName: string;
  farmerName: string;
}): Promise<ConversationRecord> {
  // Try to find existing conversation
  if (db) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('ownerId', '==', params.ownerId),
        where('farmerId', '==', params.farmerId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as ConversationRecord;
      }
    } catch {
      // fallthrough
    }
  } else {
    const existing = inMemoryConversations.find(
      (c) => c.ownerId === params.ownerId && c.farmerId === params.farmerId
    );
    if (existing) return existing;
  }

  // Create new conversation
  const convId = `conv_${params.ownerId}_${params.farmerId}_${Date.now()}`;
  const conversation: ConversationRecord = {
    id: convId,
    participants: [params.ownerId, params.farmerId],
    ownerId: params.ownerId,
    farmerId: params.farmerId,
    ownerName: params.ownerName,
    farmerName: params.farmerName,
    createdAt: new Date().toISOString(),
  };

  inMemoryConversations.unshift(conversation);

  if (db) {
    try {
      await setDoc(doc(db, 'conversations', convId), {
        ...conversation,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('getOrCreateConversation Firestore error:', err);
    }
  }

  return conversation;
}

/**
 * Get all conversations for a user (owner or farmer)
 * Access control: only conversations where userId is a participant
 */
export async function getUserConversations(userId: string): Promise<ConversationRecord[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      const list: ConversationRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ConversationRecord));
      return list.sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return bTime > aTime ? 1 : -1;
      });
    } catch (err) {
      console.error('getUserConversations error:', err);
    }
  }
  return inMemoryConversations.filter((c) => c.participants.includes(userId));
}

/**
 * Send a message in a conversation.
 * Access control: sender must be a participant.
 */
export async function sendChatMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
}): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!params.text.trim()) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  // Verify sender is a participant
  if (db) {
    try {
      const convSnap = await getDoc(doc(db, 'conversations', params.conversationId));
      if (convSnap.exists()) {
        const convData = convSnap.data();
        if (!convData.participants?.includes(params.senderId)) {
          return { success: false, error: 'You cannot access this conversation.' };
        }
      }
    } catch {
      // Proceed
    }
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const message: ChatMessage = {
    id: msgId,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    receiverId: params.receiverId,
    text: params.text.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  inMemoryMessages.unshift(message);

  if (db) {
    try {
      await setDoc(doc(db, 'messages', msgId), {
        ...message,
        createdAt: serverTimestamp(),
      });

      // Update conversation last message
      await setDoc(doc(db, 'conversations', params.conversationId), {
        lastMessage: params.text.trim().slice(0, 100),
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.error('sendChatMessage Firestore error:', err);
      return { success: false, error: 'Unable to send message. Please try again.' };
    }
  }

  notifyEcosystemChange();
  return { success: true, message };
}

/**
 * Get messages for a conversation (with access control check)
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  // Verify access
  if (db) {
    try {
      const convSnap = await getDoc(doc(db, 'conversations', conversationId));
      if (convSnap.exists()) {
        const convData = convSnap.data();
        if (!convData.participants?.includes(userId)) {
          return { success: false, error: 'You cannot access this conversation.' };
        }
      }
    } catch {
      // Proceed with query
    }
  }

  if (db) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      const messages: ChatMessage[] = [];
      snap.forEach((d) => messages.push({ id: d.id, ...d.data() } as ChatMessage));
      return { success: true, messages };
    } catch (err) {
      console.error('getConversationMessages error:', err);
    }
  }

  // Offline fallback
  const messages = inMemoryMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  return { success: true, messages };
}

/**
 * Subscribe to real-time messages in a conversation.
 * Returns unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  _userId: string,
  onMessages: (messages: ChatMessage[]) => void
): () => void {
  if (!db) {
    // Offline: return current messages once
    const msgs = inMemoryMessages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    onMessages(msgs);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const messages: ChatMessage[] = [];
      snap.forEach((d) => messages.push({ id: d.id, ...d.data() } as ChatMessage));
      onMessages(messages);
    });
    return unsubscribe;
  } catch (err) {
    console.error('subscribeToMessages error:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time assignment requests for a farmer.
 */
export function subscribeToFarmerRequests(
  farmerId: string,
  onRequests: (requests: AssignmentRequest[]) => void
): () => void {
  if (!db) return () => {};
  try {
    const q = query(
      collection(db, 'assignment_requests'),
      where('farmerId', '==', farmerId)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: AssignmentRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AssignmentRequest));
      list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      onRequests(list);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Create default 4 fields when a new farm is created
 */
export async function createDefaultFieldsForFarm(
  farmId: string,
  ownerId: string,
  _farmName: string
): Promise<Field[]> {
  const defaultFields = [
    { name: 'Field A', crop: 'Rice', soilType: 'Silty Loam', lat: 36.677, lng: -121.655 },
    { name: 'Field B', crop: 'Maize', soilType: 'Clay Loam', lat: 36.672, lng: -121.650 },
    { name: 'Field C', crop: 'Wheat', soilType: 'Sandy Loam', lat: 36.680, lng: -121.645 },
    { name: 'Field D', crop: 'Tomato', soilType: 'Silt Loam', lat: 36.675, lng: -121.662 },
  ];

  const created: Field[] = [];
  for (const f of defaultFields) {
    const field = await createField({
      farmId,
      ownerId,
      name: f.name,
      crop: f.crop,
      areaAcres: 10,
      soilType: f.soilType,
      latitude: f.lat,
      longitude: f.lng,
      status: 'Healthy',
      soilMoisture: 50,
      soilPH: 6.5,
      temperature: 28,
      waterRequirement: 'Moderate',
    });
    created.push(field);
  }
  return created;
}

/**
 * Delete a field by ID (with Firestore + memory cleanup)
 */
export async function deleteField(fieldId: string): Promise<boolean> {
  // Remove from memory
  const idx = FALLBACK_FIELDS.findIndex(
    (f) => f.fieldId === fieldId || (f as any).id === fieldId || (f as any).docId === fieldId
  );
  if (idx !== -1) FALLBACK_FIELDS.splice(idx, 1);
  syncEcosystemCache();

  if (db) {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const directRef = doc(db, 'fields', fieldId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        try {
          await deleteDoc(directRef);
        } catch {
          await setDoc(directRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        }
      }

      const q = query(collection(db, 'fields'), where('fieldId', '==', fieldId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        try {
          await deleteDoc(d.ref);
        } catch {
          await setDoc(d.ref, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        }
      }
    } catch (err) {
      console.error('deleteField error:', err);
    }
  }

  notifyEcosystemChange();
  return true;
}

/**
 * Delete a farm by ID
 */
export async function deleteFarm(farmId: string): Promise<boolean> {
  const idx = FALLBACK_FARMS.findIndex((f) => f.farmId === farmId);
  if (idx !== -1) FALLBACK_FARMS.splice(idx, 1);
  syncEcosystemCache();
  notifyEcosystemChange();

  if (db) {
    try {
      await setDoc(doc(db, 'farms', farmId), { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('deleteFarm error:', err);
    }
  }
  return true;
}

