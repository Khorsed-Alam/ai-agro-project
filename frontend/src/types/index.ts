export type FieldStatus = 'Healthy' | 'Moderate' | 'Dry' | 'Critical';

export interface Field {
  id: string;
  name: string;
  crop: string;
  soilMoisture?: number; // in %
  soilPH?: number;
  temperature?: number; // in °C
  humidity?: number; // in %
  rainfall?: number; // in mm
  status: FieldStatus;
  waterRequirement?: string; // e.g. "Low", "Moderate", "High"
  assignedFarmerId?: string | null;
  assignedFarmerName?: string | null;
  farmerId?: string | null;
  areaAcres?: number;
  soilType?: string;
  latitude?: number;
  longitude?: number;
  farmId?: string;
  ownerId?: string;
  fieldId?: string;
  docId?: string;
  boundary?: any;
  path?: any;
  createdAt?: string;
  updatedAt?: string;
}

export type ModulePhaseStatus = 'Foundation Ready' | 'Coming in Week 2' | 'Research Ready';

export interface AIModuleInfo {
  id: string;
  name: string;
  category: 'Machine Learning' | 'Deep Learning' | 'Constraint Satisfaction' | 'Search Algorithm' | 'Optimization';
  status: ModulePhaseStatus;
  week: 1 | 2;
  description: string;
  route: string;
}

export interface SystemMetrics {
  totalFields: number;
  healthyFields: number;
  dryFields: number;
  criticalFields: number;
  waterAvailability: number; // in Liters or %
}
