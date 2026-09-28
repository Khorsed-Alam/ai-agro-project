import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { agroApi } from '../services/api';

const forecastAnchor = new Date();

export interface ForecastDayItem {
  day: number;
  date?: string;
  icon: string;
  high: number;
  low: number;
  desc: string;
  rain: number;
  prob: number;
  et0?: number;
  uv_index?: number;
}

export interface HourlyForecastItem {
  time: string;
  hour: string;
  temp_c: number;
  feels_like_c: number;
  humidity_pct: number;
  rain_prob: number;
  rain_mm: number;
  wind_speed_kmh: number;
  cloud_cover_pct: number;
  weather_code?: number;
  icon: string;
  desc: string;
}

export interface LiveWeatherData {
  location: string;
  latitude?: number;
  longitude?: number;
  temperature_c: number;
  feels_like_c?: number;
  temp_high_c: number;
  temp_low_c: number;
  humidity_pct: number;
  dew_point_c: number;
  wet_bulb_c?: number;
  delta_t_c: number;
  vpd_kpa: number;
  leaf_moisture_pct: number;
  wind_speed_kmh: number;
  wind_gusts_kmh?: number;
  wind_direction: string;
  wind_direction_deg?: number;
  cloud_cover_pct?: number;
  uv_index?: number;
  solar_irradiance_w_m2: number;
  evapotranspiration_eto_mm: number;
  barometer_hpa: number;
  precipitation_24h_mm: number;
  status: string;
  icon: string;
  summary: string;
  forecast: ForecastDayItem[];
  hourly?: HourlyForecastItem[];
  is_simulated: boolean;
  source: string;
  online: boolean;
  updated_at?: string;
}

const initialWeatherData: LiveWeatherData = {
  location: 'Dhaka, Bangladesh',
  latitude: 23.7891,
  longitude: 90.4126,
  temperature_c: 31.4,
  feels_like_c: 37.4,
  temp_high_c: 34,
  temp_low_c: 26,
  humidity_pct: 68,
  dew_point_c: 24.2,
  wet_bulb_c: 26.6,
  delta_t_c: 4.8,
  vpd_kpa: 1.35,
  leaf_moisture_pct: 35,
  wind_speed_kmh: 8.5,
  wind_gusts_kmh: 14.2,
  wind_direction: 'SE',
  wind_direction_deg: 135,
  cloud_cover_pct: 20,
  uv_index: 7.5,
  solar_irradiance_w_m2: 650,
  evapotranspiration_eto_mm: 4.5,
  barometer_hpa: 1007.2,
  precipitation_24h_mm: 0.0,
  status: 'Clear Peak',
  icon: 'wb_sunny',
  summary: 'Tropical agricultural microclimate. Favorable photosynthesis and canopy transpiration conditions.',
  forecast: [
    { day: 0, icon: 'wb_sunny', high: 34, low: 26, desc: 'Clear Peak', rain: 0, prob: 5, uv_index: 7.5 },
    { day: 1, icon: 'partly_cloudy_day', high: 34, low: 26, desc: 'Partly Cloudy', rain: 0, prob: 10, uv_index: 7.0 },
    { day: 2, icon: 'partly_cloudy_day', high: 33, low: 25, desc: 'Partly Cloudy', rain: 0.5, prob: 25, uv_index: 6.2 },
    { day: 3, icon: 'rainy', high: 31, low: 25, desc: 'Light Showers', rain: 2.8, prob: 55, uv_index: 4.5 },
    { day: 4, icon: 'cloud', high: 30, low: 24, desc: 'Overcast', rain: 1.2, prob: 40, uv_index: 5.0 },
    { day: 5, icon: 'wb_sunny', high: 32, low: 25, desc: 'Sunny', rain: 0.0, prob: 10, uv_index: 6.8 },
    { day: 6, icon: 'wb_sunny', high: 33, low: 26, desc: 'Clear Peak', rain: 0.0, prob: 5, uv_index: 7.2 },
  ],
  hourly: [],
  is_simulated: false,
  source: 'Open-Meteo High-Resolution (ECMWF/ICON/GFS Blended)',
  online: true
};

export const Weather: React.FC = () => {
  const { t, translateEnum, formatDate, formatNumber } = useI18n();
  const [weather, setWeather] = useState<LiveWeatherData>(initialWeatherData);
  const [syncing, setSyncing] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [syncedMinutesAgo, setSyncedMinutesAgo] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; country: string; latitude: number; longitude: number; label: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const fetchWeather = async (lat?: number, lon?: number, locName?: string) => {
    setSyncing(true);
    try {
      const data = await agroApi.getWeather(lat, lon, locName);
      if (data && typeof data.temperature_c === 'number') {
        setWeather(data);
        setLastSyncedAt(Date.now());
        setSyncedMinutesAgo(0);

        if (data.latitude && data.longitude) {
          localStorage.setItem('agro_weather_selected_location', JSON.stringify({
            latitude: data.latitude,
            longitude: data.longitude,
            label: data.location
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch live weather telemetry:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUseGps = async () => {
    setDetectingGps(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            let label = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
            try {
              const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
              if (revRes.ok) {
                const rev = await revRes.json();
                const city = rev.city || rev.locality || rev.principalSubdivision || '';
                const country = rev.countryName || '';
                if (city || country) label = `${city}, ${country}`.replace(/^,\s*|,\s*$/g, '');
              }
            } catch {
              // ignore reverse geocode error
            }
            await fetchWeather(lat, lon, label);
            setDetectingGps(false);
          },
          async (err) => {
            console.warn('GPS denied or timed out, using IP location:', err.message);
            const detected = await agroApi.detectUserLocation();
            await fetchWeather(detected.latitude, detected.longitude, detected.label);
            setDetectingGps(false);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      } else {
        const detected = await agroApi.detectUserLocation();
        await fetchWeather(detected.latitude, detected.longitude, detected.label);
        setDetectingGps(false);
      }
    } catch {
      setDetectingGps(false);
    }
  };

  const handleLocationSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await agroApi.searchWeatherLocations(val);
      setSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = async (item: { latitude: number; longitude: number; label: string }) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    await fetchWeather(item.latitude, item.longitude, item.label);
  };

  useEffect(() => {
    // Initial fetch on mount: check localStorage or auto-detect
    try {
      const saved = localStorage.getItem('agro_weather_selected_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          fetchWeather(parsed.latitude, parsed.longitude, parsed.label);
          return;
        }
      }
    } catch {
      // ignore
    }
    // If no saved preference, auto-detect location
    fetchWeather();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncedMinutesAgo(Math.floor((Date.now() - lastSyncedAt) / 60000));
    }, 30000);
    return () => clearInterval(timer);
  }, [lastSyncedAt]);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getForecastDay = (dayOffset: number, dateStr?: string) => {
    if (dayOffset === 0) return t('common.today');
    if (dateStr) {
      try {
        const d = new Date(dateStr + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          return formatDate(d, { weekday: 'short' });
        }
      } catch {
        // fallback
      }
    }
    return formatDate(new Date(forecastAnchor.getTime() + dayOffset * 86400000), { weekday: 'short' });
  };

  return (
    <div className="p-margin md:p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="space-y-space-xs min-w-0">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px] text-secondary">routine</span>
            <span>{t('weather.observationGrid')}</span>
            <span>•</span>
            <span className="text-secondary font-semibold">{t('weather.liveTelemetry')}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
            {t('weather.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            {t('weather.description')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-auto bg-surface-container-low px-space-md py-space-xs rounded-xl">
          <div className="flex items-center gap-space-xs">
            <span className={`w-2 h-2 rounded-full ${weather.online ? 'bg-secondary' : 'bg-amber-500'} animate-pulse`} />
            <span className="font-data-mono text-data-mono text-on-surface font-semibold truncate max-w-[260px]" title={weather.location}>
              {weather.location}
            </span>
          </div>
          <span className="text-outline-variant font-label-md text-label-md">•</span>
          <span className="font-label-md text-label-md text-on-surface-variant">
            {t('weather.syncedAgo', { time: formatNumber(syncedMinutesAgo) })}
          </span>
          <button
            onClick={() => fetchWeather(weather.latitude, weather.longitude, weather.location)}
            disabled={syncing}
            className="ml-space-xs inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
            title="Refresh weather data"
          >
            <span className={`material-symbols-outlined text-[15px] ${syncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{t('common.sync')}</span>
          </button>
        </div>
      </div>

      {/* Location Picker & Quick Selector Strip */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm flex-1 relative" ref={searchBoxRef}>
          <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">location_on</span>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleLocationSearch(e.target.value)}
              placeholder="Search your city or farm location (e.g. Dhaka, Chittagong, Sylhet, Bogura, London...)"
              className="w-full bg-surface-container-low px-space-md py-1.5 rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/40 focus:outline-none focus:border-secondary transition-all"
            />
            {isSearching && (
              <span className="absolute right-3 top-2 material-symbols-outlined text-[16px] text-secondary animate-spin">
                sync
              </span>
            )}

            {/* Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 z-50 overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(res)}
                    className="w-full text-left px-space-md py-2 hover:bg-surface-container transition-colors flex items-center justify-between border-b border-outline-variant/20 last:border-none cursor-pointer"
                  >
                    <span className="text-body-md text-on-surface font-medium">{res.label}</span>
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs shrink-0">
          <button
            onClick={handleUseGps}
            disabled={detectingGps}
            className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-label-md text-label-md font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Detect precise device location via GPS"
          >
            <span className={`material-symbols-outlined text-[16px] ${detectingGps ? 'animate-spin' : ''}`}>
              my_location
            </span>
            <span>{detectingGps ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
          </button>

          {/* Quick Shortcuts */}
          <button
            onClick={() => fetchWeather(23.7891, 90.4126, 'Dhaka, Bangladesh')}
            className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-all cursor-pointer"
          >
            Dhaka
          </button>
          <button
            onClick={() => fetchWeather(22.3569, 91.7832, 'Chittagong, Bangladesh')}
            className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-all cursor-pointer"
          >
            Chittagong
          </button>
          <button
            onClick={() => fetchWeather(24.8949, 91.8687, 'Sylhet, Bangladesh')}
            className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-all cursor-pointer"
          >
            Sylhet
          </button>
          <button
            onClick={() => fetchWeather(24.3636, 88.6241, 'Rajshahi, Bangladesh')}
            className="px-space-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-all cursor-pointer"
          >
            Rajshahi
          </button>
        </div>
      </div>

      {/* Main Grid: Live Ambient Hero Card + Sensor Bento Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg">
        {/* Ambient Status Card (5 cols) */}
        <div className="xl:col-span-5 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-56 h-56 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold tracking-wide">
                {t('weather.fieldAmbientStatus')}
              </span>
              <div className="flex items-center gap-1 text-on-surface-variant font-data-mono text-data-mono">
                <span className="material-symbols-outlined text-[16px] text-secondary">thermostat</span>
                <span>{weather.latitude !== undefined ? `${weather.latitude.toFixed(2)}°N, ${weather.longitude?.toFixed(2)}°E` : t('weather.sensorDepth')}</span>
              </div>
            </div>

            <div className="mt-space-lg flex flex-wrap items-baseline gap-space-sm">
              <span className="font-display-lg text-[64px] leading-none text-primary font-semibold tracking-tight">
                {formatNumber(weather.temperature_c, { maximumFractionDigits: 1 })}°
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">{t('weather.celsius', 'C')}</span>
              {weather.feels_like_c !== undefined && (
                <div className="flex flex-col border-l border-outline-variant/30 pl-space-sm">
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">Feels Like</span>
                  <span className="font-data-mono text-title-md font-semibold text-on-surface">
                    {formatNumber(weather.feels_like_c, { maximumFractionDigits: 1 })}°C
                  </span>
                </div>
              )}
              <div className="ml-auto pl-space-sm border-l border-outline-variant/30 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.thermalRange')}</span>
                <span className="font-data-mono text-data-mono text-on-surface font-semibold">
                  {t('weather.high', 'H')}: {formatNumber(weather.temp_high_c)}°C · {t('weather.low', 'L')}: {formatNumber(weather.temp_low_c)}°C
                </span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center gap-space-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[24px]">{weather.icon}</span>
              <span className="font-headline-sm text-headline-sm font-semibold">
                {translateEnum('weather.conditions', weather.status, weather.status)}
              </span>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {weather.summary || t('weather.conditionsSummary')}
            </p>
          </div>

          <div className="mt-space-xl pt-space-md border-t border-outline-variant/30 grid grid-cols-3 gap-space-sm text-center">
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.deltaT')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">
                {formatNumber(weather.delta_t_c, { maximumFractionDigits: 1 })}°C
              </span>
              <span className={`block font-label-sm text-[10px] font-medium ${
                weather.delta_t_c >= 2 && weather.delta_t_c <= 8 ? 'text-secondary' : 'text-amber-700'
              }`}>
                {weather.delta_t_c >= 2 && weather.delta_t_c <= 8 ? 'Optimal Spray Window' : weather.delta_t_c > 8 ? 'Evaporation Risk' : 'Inversion Risk'}
              </span>
              {weather.wet_bulb_c !== undefined && (
                <span className="block font-data-mono text-[9px] text-on-surface-variant/70 mt-0.5">
                  Twb: {formatNumber(weather.wet_bulb_c)}°C
                </span>
              )}
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.vpdDeficit')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">
                {formatNumber(weather.vpd_kpa, { maximumFractionDigits: 2 })} kPa
              </span>
              <span className="block font-label-sm text-[10px] text-on-surface-variant font-medium">
                {weather.vpd_kpa >= 0.4 && weather.vpd_kpa <= 1.4 ? t('weather.normalStomatal') : weather.vpd_kpa > 1.4 ? 'VPD Stress' : 'Low Transpiration'}
              </span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.leafMoisture')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">
                {formatNumber(weather.leaf_moisture_pct)}%
              </span>
              <span className={`block font-label-sm text-[10px] font-medium ${
                weather.leaf_moisture_pct <= 60 ? 'text-secondary' : 'text-amber-700'
              }`}>
                {weather.leaf_moisture_pct <= 60 ? t('weather.dryFoliage') : 'Wet Foliage'}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Grid Metrics (7 cols) */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-sm">
          {/* Relative Humidity */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.relativeHumidity')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">humidity_percentage</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.humidity_pct)}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, weather.humidity_pct))}%` }} />
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {weather.humidity_pct > 70 ? 'Elevated atmospheric humidity across canopy.' : weather.humidity_pct < 35 ? 'Dry air, accelerated soil evaporation.' : t('weather.transpirationPotential')}
            </span>
          </div>

          {/* Wind Vector */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.windVector')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">air</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.wind_speed_kmh, { maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">km/h</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                  {weather.wind_direction}
                </span>
              </div>
              {weather.wind_gusts_kmh !== undefined && (
                <div className="text-on-surface-variant font-data-mono text-label-sm mt-0.5">
                  Gusts: <span className="font-semibold text-on-surface">{formatNumber(weather.wind_gusts_kmh, { maximumFractionDigits: 1 })} km/h</span>
                </div>
              )}
              <span className={`inline-block mt-space-xs font-label-sm text-label-sm font-semibold ${
                weather.wind_speed_kmh <= 18 ? 'text-secondary' : 'text-amber-700'
              }`}>
                ● {weather.wind_speed_kmh <= 18 ? t('weather.safeForSpraying') : 'Wind drift caution (limit: 18 km/h)'}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.gustsDamped')}
            </span>
          </div>

          {/* Solar Irradiance */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.solarIrradiance')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">wb_sunny</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.solar_irradiance_w_m2)}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">W/m²</span>
              </div>
              <div className="flex items-center gap-1.5 mt-space-xs">
                <span className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                  (weather.uv_index ?? (weather.solar_irradiance_w_m2 / 100)) >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  UV: {weather.uv_index !== undefined ? formatNumber(weather.uv_index, { maximumFractionDigits: 1 }) : formatNumber(Math.round(weather.solar_irradiance_w_m2 / 100))}
                  {' '}({(weather.uv_index ?? 0) >= 8 ? 'Very High' : (weather.uv_index ?? 0) >= 6 ? 'High' : (weather.uv_index ?? 0) >= 3 ? 'Moderate' : 'Low'})
                </span>
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.maxPar')}
            </span>
          </div>

          {/* Evapotranspiration (ETo) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.evapotranspiration')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.evapotranspiration_eto_mm, { maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">mm/day</span>
              </div>
              <span className="inline-block mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                {t('weather.penmanMonteith')}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.rootZoneBaseline')}
            </span>
          </div>

          {/* Barometric Pressure */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.barometricPressure')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">compress</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.barometer_hpa, { maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">hPa</span>
              </div>
              <div className="flex items-center justify-between text-label-sm mt-space-xs">
                <div className="flex items-center gap-1 text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[14px]">trending_flat</span>
                  <span>MSL Standard</span>
                </div>
                {weather.cloud_cover_pct !== undefined && (
                  <span className="font-data-mono text-on-surface-variant text-[11px]">
                    {weather.cloud_cover_pct}% Clouds
                  </span>
                )}
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.noFrontalDisruption')}
            </span>
          </div>

          {/* Precipitation (24h) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.precipitation24h')}</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">rainy</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(weather.precipitation_24h_mm, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">mm</span>
              </div>
              <span className="inline-block mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                {t('weather.dewPoint', { value: `${formatNumber(weather.dew_point_c, { maximumFractionDigits: 1 })}°C` })}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {weather.precipitation_24h_mm > 0 ? `${formatNumber(weather.precipitation_24h_mm, { maximumFractionDigits: 1 })} mm rainfall recorded in 24h.` : t('weather.noRain')}
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Microclimate Hourly Projection Track */}
      {weather.hourly && weather.hourly.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs border-b border-outline-variant/30 pb-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">schedule</span>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">24-Hour Microclimate Projection</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  High-resolution hourly telemetry from blended numerical models (ECMWF IFS / ICON / GFS)
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary/10 text-secondary">
              Hourly Granularity
            </span>
          </div>

          <div className="overflow-x-auto pb-2 -mx-space-lg px-space-lg flex gap-space-sm scrollbar-thin">
            {weather.hourly.map((h, i) => (
              <div
                key={i}
                className={`shrink-0 w-24 rounded-xl p-3 flex flex-col items-center justify-between transition-all ${
                  i === 0
                    ? 'bg-secondary/10 border border-secondary/30'
                    : 'bg-surface-container-low hover:bg-surface-container border border-outline-variant/20'
                }`}
              >
                <span className="font-label-sm text-[11px] font-bold text-on-surface">
                  {i === 0 ? 'Now' : h.hour}
                </span>
                <span className="material-symbols-outlined text-[24px] text-secondary my-1">
                  {h.icon}
                </span>
                <div className="font-data-mono font-bold text-on-surface text-sm">
                  {formatNumber(h.temp_c, { maximumFractionDigits: 1 })}°
                </div>
                <div className="text-[10px] text-on-surface-variant font-data-mono">
                  Feels {formatNumber(h.feels_like_c, { maximumFractionDigits: 0 })}°
                </div>

                {/* Rain probability bar or pill */}
                <div className="mt-2 w-full pt-1.5 border-t border-outline-variant/20 text-center">
                  <div className="flex items-center justify-center gap-0.5 text-[10px] font-semibold">
                    <span className="material-symbols-outlined text-[12px] text-sky-500">water_drop</span>
                    <span className={h.rain_prob > 20 ? 'text-sky-600 font-bold' : 'text-on-surface-variant'}>
                      {h.rain_prob}%
                    </span>
                  </div>
                  {h.rain_mm > 0 && (
                    <span className="block text-[9px] text-sky-600 font-data-mono font-medium">
                      {h.rain_mm}mm
                    </span>
                  )}
                  <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-on-surface-variant font-data-mono">
                    <span className="material-symbols-outlined text-[11px]">air</span>
                    <span>{Math.round(h.wind_speed_kmh)} km/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Agricultural Forecast */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-outline-variant/30 pb-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{t('weather.agronomicHorizon')}</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t('weather.forecastTitle')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-sm">
          {weather.forecast.map((item, idx) => (
            <div
              key={idx}
              className={`bg-surface-container-low/60 hover:bg-surface-container-low transition-colors rounded-lg p-space-md flex flex-col justify-between ${
                idx === 0 ? 'border-t-2 border-secondary' : ''
              }`}
            >
              <div className="text-center">
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">{getForecastDay(item.day, item.date)}</span>
                <div className="mt-1 flex justify-center text-secondary">
                  <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                </div>
                <div className="mt-1 font-headline-sm text-headline-sm text-on-surface">
                  {formatNumber(item.high)}° <span className="text-on-surface-variant font-normal">/ {formatNumber(item.low)}°</span>
                </div>
                <span className="font-label-sm text-[11px] text-on-surface-variant block mt-0.5 truncate">{translateEnum('weather.conditions', item.desc, item.desc)}</span>
              </div>
              <div className="mt-space-md space-y-space-xs font-data-mono text-[11px]">
                <div className="flex justify-between text-on-surface-variant">
                  <span>{t('weather.rain')}</span>
                  <span className="font-semibold text-on-surface">{formatNumber(item.rain, { maximumFractionDigits: 1 })} mm</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant pt-1">
                  <span className="flex items-center gap-0.5">{t('weather.probability')}</span>
                  <span className="text-secondary font-semibold">{formatNumber(item.prob)}%</span>
                </div>
                {item.uv_index !== undefined && (
                  <div className="flex justify-between items-center text-on-surface-variant pt-0.5">
                    <span>UV Index</span>
                    <span className="font-semibold text-on-surface">{formatNumber(item.uv_index, { maximumFractionDigits: 1 })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
