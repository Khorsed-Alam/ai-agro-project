import type { Field } from '../types';

export type FieldStatus = 'Healthy' | 'Attention' | 'Critical' | 'Insufficient Data';
export type WaterNeedLevel = 'Low' | 'Moderate' | 'High' | 'Urgent' | 'Not Available';
export type ActionType = 'Queue Run' | 'Pathogen AI' | 'Inspect' | 'Data Needed';

export interface CropProfile {
  name: string;
  minMoisture: number; // % below which crop is severely stressed
  optimalMoistureMin: number;
  optimalMoistureMax: number;
  maxMoisture: number; // % above which saturation risk occurs
  minPH: number;
  maxPH: number;
  optimalTempMin: number;
  optimalTempMax: number;
}

export const CROP_PROFILES: Record<string, CropProfile> = {
  rice: {
    name: 'Rice',
    minMoisture: 50,
    optimalMoistureMin: 60,
    optimalMoistureMax: 85,
    maxMoisture: 95,
    minPH: 5.5,
    maxPH: 7.0,
    optimalTempMin: 20,
    optimalTempMax: 35,
  },
  potato: {
    name: 'Potato',
    minMoisture: 35,
    optimalMoistureMin: 50,
    optimalMoistureMax: 70,
    maxMoisture: 85,
    minPH: 4.8,
    maxPH: 6.5,
    optimalTempMin: 15,
    optimalTempMax: 25,
  },
  tomato: {
    name: 'Tomato',
    minMoisture: 35,
    optimalMoistureMin: 45,
    optimalMoistureMax: 65,
    maxMoisture: 80,
    minPH: 6.0,
    maxPH: 6.8,
    optimalTempMin: 18,
    optimalTempMax: 30,
  },
  maize: {
    name: 'Maize',
    minMoisture: 30,
    optimalMoistureMin: 40,
    optimalMoistureMax: 65,
    maxMoisture: 80,
    minPH: 5.8,
    maxPH: 7.0,
    optimalTempMin: 18,
    optimalTempMax: 32,
  },
  corn: {
    name: 'Corn',
    minMoisture: 30,
    optimalMoistureMin: 40,
    optimalMoistureMax: 65,
    maxMoisture: 80,
    minPH: 5.8,
    maxPH: 7.0,
    optimalTempMin: 18,
    optimalTempMax: 32,
  },
  wheat: {
    name: 'Wheat',
    minMoisture: 30,
    optimalMoistureMin: 40,
    optimalMoistureMax: 60,
    maxMoisture: 75,
    minPH: 6.0,
    maxPH: 7.0,
    optimalTempMin: 12,
    optimalTempMax: 25,
  },
  cotton: {
    name: 'Cotton',
    minMoisture: 35,
    optimalMoistureMin: 45,
    optimalMoistureMax: 65,
    maxMoisture: 80,
    minPH: 5.8,
    maxPH: 8.0,
    optimalTempMin: 21,
    optimalTempMax: 35,
  },
  default: {
    name: 'General Crop',
    minMoisture: 30,
    optimalMoistureMin: 45,
    optimalMoistureMax: 70,
    maxMoisture: 85,
    minPH: 6.0,
    maxPH: 7.2,
    optimalTempMin: 15,
    optimalTempMax: 32,
  },
};

export interface FieldDecision {
  status: FieldStatus;
  waterNeed: WaterNeedLevel;
  action: ActionType;
  actionRoute: string;
  reasons: string[];
  soilMoistureVal: number | null;
  soilPHVal: number | null;
  temperatureVal: number | null;
  humidityVal: number | null;
  rainfallVal: number | null;
  cropProfileName: string;
}

/**
 * Safely parses any input into a valid numeric value or null.
 * Handles string numbers like "38.5%", "6.5 pH", "28.0°C", "10 mm", "38.5".
 */
export function parseNumeric(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isFinite(num) ? num : null;
}

/**
 * Gets the crop profile corresponding to the crop name.
 */
export function getCropProfile(cropName?: string): CropProfile {
  if (!cropName) return CROP_PROFILES.default;
  const normalized = cropName.trim().toLowerCase();
  for (const [key, profile] of Object.entries(CROP_PROFILES)) {
    if (normalized.includes(key)) {
      return profile;
    }
  }
  return CROP_PROFILES.default;
}

/**
 * Evaluates a single field object independently based on its current telemetry and crop data.
 * Pure deterministic function — no side effects, no database mutations.
 */
export function evaluateFieldDecision(field: Field | any): FieldDecision {
  if (!field) {
    return {
      status: 'Insufficient Data',
      waterNeed: 'Not Available',
      action: 'Data Needed',
      actionRoute: '/fields',
      reasons: ['No field data provided for evaluation.'],
      soilMoistureVal: null,
      soilPHVal: null,
      temperatureVal: null,
      humidityVal: null,
      rainfallVal: null,
      cropProfileName: 'General Crop',
    };
  }

  // 1. Normalize telemetry values safely without inventing fake numbers
  const moisture = parseNumeric(field.soilMoisture ?? field.moisture);
  const ph = parseNumeric(field.soilPH ?? field.soilPh ?? field.ph);
  const temp = parseNumeric(field.temperature ?? field.temp);
  const humidity = parseNumeric(field.humidity);
  const rainfall = parseNumeric(field.rainfall ?? field.rain);
  const cropStr = String(field.crop || '').trim();

  const profile = getCropProfile(cropStr);
  const reasons: string[] = [];

  // 2. Evaluate Soil Moisture & Initial Water Need
  let waterNeed: WaterNeedLevel = 'Low';

  if (moisture === null) {
    waterNeed = 'Not Available';
    reasons.push('Soil moisture telemetry unavailable or probe offline.');
  } else if (moisture < 30) {
    waterNeed = 'Urgent';
    reasons.push(`Soil moisture (${moisture}%) is severely dry (<30%). Immediate irrigation required.`);
  } else if (moisture < 45 || moisture < profile.optimalMoistureMin) {
    waterNeed = 'High';
    reasons.push(
      `Soil moisture (${moisture}%) is below optimal target (${profile.optimalMoistureMin}%–${profile.optimalMoistureMax}%) for ${profile.name}.`
    );
  } else if (moisture < 60) {
    waterNeed = 'Moderate';
    reasons.push(`Soil moisture (${moisture}%) is moderate for ${profile.name}.`);
  } else if (moisture > profile.maxMoisture) {
    waterNeed = 'Low';
    reasons.push(`Soil is saturated (${moisture}% > max ${profile.maxMoisture}%). Hold irrigation to prevent root hypoxia.`);
  } else {
    waterNeed = 'Low';
    reasons.push(`Soil moisture (${moisture}%) is optimal for ${profile.name} (${profile.optimalMoistureMin}%–${profile.optimalMoistureMax}%).`);
  }

  // Adjust water need for microclimate factors (high temp / low rainfall increases urgency)
  if (moisture !== null && waterNeed === 'Moderate' && temp !== null && temp > profile.optimalTempMax) {
    waterNeed = 'High';
    reasons.push(`High ambient temperature (${temp}°C) accelerates evapotranspiration, elevating water need.`);
  }

  if (moisture !== null && (waterNeed === 'High' || waterNeed === 'Moderate') && rainfall !== null && rainfall >= 15) {
    waterNeed = 'Low';
    reasons.push(`Recent rainfall (${rainfall} mm) provides adequate water; delaying scheduled irrigation cycle.`);
  }

  // 3. Evaluate Fungal / Pathogen Risk
  let isDiseaseRisk = false;
  if (humidity !== null && temp !== null && humidity >= 70 && temp >= 28) {
    isDiseaseRisk = true;
    reasons.push(`High humidity (${humidity}%) and elevated temperature (${temp}°C) create high fungal pathogen/blight risk.`);
  }
  if (moisture !== null && moisture > 85) {
    isDiseaseRisk = true;
    reasons.push(`Waterlogged soil (${moisture}%) increases susceptibility to root rot & soil-borne pathogens.`);
  }

  // 4. Evaluate Soil pH Anomaly
  let isPHAnomaly = false;
  if (ph !== null) {
    if (ph < profile.minPH) {
      isPHAnomaly = true;
      reasons.push(`Soil pH (${ph}) is too acidic for ${profile.name} (preferred min ${profile.minPH}).`);
    } else if (ph > profile.maxPH) {
      isPHAnomaly = true;
      reasons.push(`Soil pH (${ph}) is too alkaline for ${profile.name} (preferred max ${profile.maxPH}).`);
    } else {
      reasons.push(`Soil pH (${ph}) is balanced for ${profile.name} (${profile.minPH}–${profile.maxPH}).`);
    }
  } else {
    reasons.push('Soil pH telemetry missing.');
  }

  // 5. Evaluate Overall Field Status
  let status: FieldStatus = 'Healthy';

  if (moisture === null) {
    status = ph === null && temp === null ? 'Insufficient Data' : 'Attention';
  } else if (moisture < 30 || moisture < profile.minMoisture || (isDiseaseRisk && moisture < 35)) {
    status = 'Critical';
  } else if (moisture < profile.optimalMoistureMin || isDiseaseRisk || isPHAnomaly || (temp !== null && temp > profile.optimalTempMax)) {
    status = 'Attention';
  } else {
    status = 'Healthy';
  }

  // 6. Map Action & Target Route
  let action: ActionType = 'Inspect';
  let actionRoute = '/fields';

  if (moisture === null && ph === null && temp === null) {
    action = 'Data Needed';
    actionRoute = '/fields';
  } else if (status === 'Critical' || isDiseaseRisk) {
    action = 'Pathogen AI';
    actionRoute = '/disease-detection';
  } else if (waterNeed === 'Urgent' || waterNeed === 'High' || (status === 'Attention' && moisture !== null && moisture < profile.optimalMoistureMin)) {
    action = 'Queue Run';
    actionRoute = '/irrigation-planner';
  } else {
    action = 'Inspect';
    actionRoute = '/fields';
  }

  return {
    status,
    waterNeed,
    action,
    actionRoute,
    reasons,
    soilMoistureVal: moisture,
    soilPHVal: ph,
    temperatureVal: temp,
    humidityVal: humidity,
    rainfallVal: rainfall,
    cropProfileName: profile.name,
  };
}
