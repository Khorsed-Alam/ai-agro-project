import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { bn } from "./bn";
import { en } from "./en";
import type { TranslationKey, TranslationValues } from "./en";

export type Language = "en" | "bn";

export type EnumTranslationGroup =
  | "status"
  | "common.enums.roles"
  | "common.enums.crops"
  | "common.enums.soilTypes"
  | "common.enums.waterRequirements"
  | "common.enums.imageTypes"
  | "common.enums.assignmentStatuses"
  | "common.enums.recommendations"
  | "weather.conditions"
  | "history.categories"
  | "diseaseDetection.diseases"
  | "algorithms";

export type DateInput =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | null
  | undefined;

export type Translate = (
  key: TranslationKey | (string & {}),
  fallbackOrValues?: string | TranslationValues,
  values?: TranslationValues,
) => string;

export type FormatDate = (
  value: DateInput,
  options?: Intl.DateTimeFormatOptions,
) => string;

export type FormatNumber = (
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
) => string;

export type TranslateEnum = (
  group: EnumTranslationGroup,
  value: unknown,
  fallback?: string,
) => string;

export interface I18nContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: Translate;
  formatDate: FormatDate;
  formatNumber: FormatNumber;
  translateEnum: TranslateEnum;
}

export interface I18nProviderProps {
  children: ReactNode;
}

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_STORAGE_KEY = "agroai-language";
export const SUPPORTED_LANGUAGES: readonly Language[] = ["en", "bn"];

const localeByLanguage: Record<Language, string> = {
  en: "en-US",
  bn: "bn-BD",
};

const enumAliases: Partial<Record<EnumTranslationGroup, Readonly<Record<string, string>>>> = {
  status: {
    needs_data: "insufficient_data",
    not_available: "not_available",
    no_data: "no_data",
    ai_model: "warning",
  },
  "common.enums.roles": {
    farm_owner: "farm_owner",
    farmer_worker: "farmer_worker",
    field_worker: "field_worker",
  },
  "common.enums.imageTypes": {
    leaf_disease_inspection: "leaf_disease_inspection",
    crop_stand_overview: "crop_stand_overview",
    soil_texture_moisture: "soil_texture_moisture",
    pest_observation: "pest_observation",
    general_field_panorama: "general_field_panorama",
  },
  "common.enums.recommendations": {
    pathogen_ai: "pathogen_ai",
    queue_run: "queue_run",
    data_needed: "data_needed",
  },
  "weather.conditions": {
    partly_cloudy: "partly_cloudy",
    clear_peak: "clear_peak",
    coastal_fog: "coastal_fog",
    light_showers: "light_showers",
  },
  "history.categories": {
    irrigation_dispatch: "irrigation",
    disease_detection: "disease",
    ai_search_model: "aiModel",
    telemetry_sensor: "telemetry",
    manual_override: "manualOverride",
  },
  "diseaseDetection.diseases": {
    leaf_septoria: "leafSeptoria",
    powdery_mildew: "powderyMildew",
    early_blight: "earlyBlight",
    late_blight: "lateBlight",
    leaf_rust: "leafRust",
  },
};

export const resources = {
  en,
  bn,
} as const;

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "bn";
}

export function normalizeLanguage(value: unknown): Language {
  if (isLanguage(value)) return value;
  if (typeof value !== "string") return DEFAULT_LANGUAGE;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguage(base) ? base : DEFAULT_LANGUAGE;
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function readResourceValue(resource: unknown, key: string): string | undefined {
  const segments = key.split(".").filter(Boolean);
  let current: unknown = resource;

  for (const segment of segments) {
    if (
      typeof current !== "object" ||
      current === null ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
}

function humanizeKey(key: string): string {
  const leaf = key.split(".").filter(Boolean).at(-1) ?? key;
  const words = leaf
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!words) return key;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (placeholder, name: string) => {
    const value = values[name];
    return value === null || value === undefined ? placeholder : String(value);
  });
}

function translateResource(
  language: Language,
  key: string,
  fallback?: string,
  values?: TranslationValues,
): string {
  const localized = readResourceValue(resources[language], key);
  const source = readResourceValue(resources.en, key);
  const template = localized ?? source ?? fallback ?? humanizeKey(key);
  return interpolate(template, values);
}

function normalizeEnumValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[–—]+/g, "_")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeDateInput(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object") {
    if (typeof value.toDate !== "function") return null;
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
  const locale = localeByLanguage[language];

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      return;
    }
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguageState(normalizeLanguage(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    if (isLanguage(nextLanguage)) {
      setLanguageState(nextLanguage);
    }
  }, []);

  const t = useCallback<Translate>(
    (key, fallbackOrValues, values) => {
      const hasValues = typeof fallbackOrValues === "object" && fallbackOrValues !== null;
      const fallback = hasValues || fallbackOrValues === undefined ? undefined : fallbackOrValues;
      const interpolationValues = hasValues ? fallbackOrValues : values;
      return translateResource(language, key, fallback, interpolationValues);
    },
    [language],
  );

  const formatDate = useCallback<FormatDate>(
    (value, options) => {
      const date = normalizeDateInput(value);
      if (!date) return "";

      try {
        return new Intl.DateTimeFormat(locale, options).format(date);
      } catch {
        return "";
      }
    },
    [locale],
  );

  const formatNumber = useCallback<FormatNumber>(
    (value, options) => {
      try {
        return new Intl.NumberFormat(locale, options).format(value);
      } catch {
        return "";
      }
    },
    [locale],
  );

  const translateEnum = useCallback<TranslateEnum>(
    (group, value, fallback) => {
      const source = String(value ?? "").trim();
      if (!source) return fallback ?? "";

      const normalized = normalizeEnumValue(source);
      const alias = enumAliases[group]?.[normalized];
      const candidates = alias && alias !== normalized ? [alias, normalized] : [normalized];

      for (const candidate of candidates) {
        const key = `${group}.${candidate}`;
        const localized = readResourceValue(resources[language], key);
        if (localized !== undefined) return localized;
        const sourceText = readResourceValue(resources.en, key);
        if (sourceText !== undefined) return sourceText;
      }

      return fallback ?? source;
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale,
      setLanguage,
      t,
      formatDate,
      formatNumber,
      translateEnum,
    }),
    [formatDate, formatNumber, language, locale, setLanguage, t, translateEnum],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
