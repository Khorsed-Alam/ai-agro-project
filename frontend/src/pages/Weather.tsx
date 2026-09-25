import React, { useState } from 'react';
import { useI18n } from '../i18n';

const forecastAnchor = new Date();

export const Weather: React.FC = () => {
  const { t, translateEnum, formatDate, formatNumber } = useI18n();
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1000);
  };

  const getForecastDay = (dayOffset: number) => dayOffset === 0
    ? t('common.today')
    : formatDate(new Date(forecastAnchor.getTime() + dayOffset * 86400000), { weekday: 'short' });

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
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-data-mono text-data-mono text-on-surface-variant">
              {t('weather.station', 'NOAA Mesonet + Davis Vantage Pro2 (Salinas Sector {sector})', { sector: formatNumber(4) })}
            </span>
          </div>
          <span className="text-outline-variant font-label-md text-label-md">•</span>
          <span className="font-label-md text-label-md text-on-surface-variant">{t('weather.syncedAgo', { time: formatNumber(8) })}</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-space-xs inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[15px] ${syncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{t('common.sync')}</span>
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
                <span>{t('weather.sensorDepth')}</span>
              </div>
            </div>

            <div className="mt-space-lg flex items-baseline gap-space-sm">
              <span className="font-display-lg text-[64px] leading-none text-primary font-semibold tracking-tight">
                {formatNumber(22.8, { maximumFractionDigits: 1 })}°
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">{t('weather.celsius', 'C')}</span>
              <div className="ml-space-sm pl-space-sm border-l border-outline-variant/30 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('weather.thermalRange')}</span>
                <span className="font-data-mono text-data-mono text-on-surface font-semibold">{t('weather.high', 'H')}: {formatNumber(26)}°C · {t('weather.low', 'L')}: {formatNumber(14)}°C</span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center gap-space-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[24px]">partly_cloudy_day</span>
              <span className="font-headline-sm text-headline-sm font-semibold">{t('weather.partlyCloudy')}</span>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.conditionsSummary')}
            </p>
          </div>

          <div className="mt-space-xl pt-space-md border-t border-outline-variant/30 grid grid-cols-3 gap-space-sm text-center">
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.deltaT')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">{formatNumber(3.8, { maximumFractionDigits: 1 })}°C</span>
              <span className="block font-label-sm text-[10px] text-secondary font-medium">{t('weather.sprayFavorable')}</span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.vpdDeficit')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">{formatNumber(1.12, { maximumFractionDigits: 2 })} kPa</span>
              <span className="block font-label-sm text-[10px] text-on-surface-variant font-medium">{t('weather.normalStomatal')}</span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">{t('weather.leafMoisture')}</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">{formatNumber(22)}%</span>
              <span className="block font-label-sm text-[10px] text-secondary font-medium">{t('weather.dryFoliage')}</span>
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(58)}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.transpirationPotential')}
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(9.4, { maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">km/h</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                  {t('weather.northwest', 'NW')}
                </span>
              </div>
              <span className="inline-block mt-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                ● {t('weather.safeForSpraying')}
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(720)}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">W/m²</span>
              </div>
              <div className="flex items-center gap-1.5 mt-space-xs">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-label-sm text-label-sm font-semibold">
                  {t('weather.uvHigh')}
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(4.2, { maximumFractionDigits: 1 })}</span>
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(1014.8, { maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">hPa</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-space-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_flat</span>
                <span>{t('weather.barometerSteady')}</span>
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
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">{formatNumber(0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">mm</span>
              </div>
              <span className="inline-block mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                {t('weather.dewPoint', { value: `${formatNumber(13.5, { maximumFractionDigits: 1 })}°C` })}
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {t('weather.noRain')}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Agricultural Forecast */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-outline-variant/30 pb-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">{t('weather.agronomicHorizon')}</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t('weather.forecastTitle')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-sm">
          {[
            { day: 0, icon: 'partly_cloudy_day', high: 23, low: 14, desc: 'Partly Cloudy', rain: 0, prob: 10 },
            { day: 1, icon: 'wb_sunny', high: 25, low: 15, desc: 'Sunny', rain: 0, prob: 5 },
            { day: 2, icon: 'wb_sunny', high: 26, low: 16, desc: 'Clear Peak', rain: 0, prob: 0 },
            { day: 3, icon: 'partly_cloudy_day', high: 22, low: 13, desc: 'Coastal Fog', rain: 0, prob: 15 },
            { day: 4, icon: 'cloud', high: 20, low: 12, desc: 'Overcast', rain: 1.2, prob: 40 },
            { day: 5, icon: 'rainy', high: 19, low: 11, desc: 'Light Showers', rain: 4.5, prob: 75 },
            { day: 6, icon: 'partly_cloudy_day', high: 21, low: 13, desc: 'Clearing', rain: 0.2, prob: 20 },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-surface-container-low/60 hover:bg-surface-container-low transition-colors rounded-lg p-space-md flex flex-col justify-between ${
                idx === 0 ? 'border-t-2 border-secondary' : ''
              }`}
            >
              <div className="text-center">
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">{getForecastDay(item.day)}</span>
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
