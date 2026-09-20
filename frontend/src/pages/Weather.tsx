import React, { useState } from 'react';

export const Weather: React.FC = () => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1000);
  };

  return (
    <div className="p-margin md:p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="space-y-space-xs min-w-0">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px] text-secondary">routine</span>
            <span>Micrometeorological Observation Grid</span>
            <span>•</span>
            <span className="text-secondary font-semibold">Live Telemetry</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
            Agricultural Weather Intelligence
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Monitor microclimate conditions that directly affect crop transpiration, disease sporulation, and irrigation scheduling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start lg:self-auto bg-surface-container-low px-space-md py-space-xs rounded-xl">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-data-mono text-data-mono text-on-surface-variant">
              NOAA Mesonet + Davis Vantage Pro2 (Salinas Sector 4)
            </span>
          </div>
          <span className="text-outline-variant font-label-md text-label-md">•</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Synced 8m ago</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="ml-space-xs inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[15px] ${syncing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Sync</span>
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
                FIELD AMBIENT STATUS
              </span>
              <div className="flex items-center gap-1 text-on-surface-variant font-data-mono text-data-mono">
                <span className="material-symbols-outlined text-[16px] text-secondary">thermostat</span>
                <span>Sensor Depth: 1.5m</span>
              </div>
            </div>

            <div className="mt-space-lg flex items-baseline gap-space-sm">
              <span className="font-display-lg text-[64px] leading-none text-primary font-semibold tracking-tight">
                22.8°
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">C</span>
              <div className="ml-space-sm pl-space-sm border-l border-outline-variant/30 flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Thermal Range</span>
                <span className="font-data-mono text-data-mono text-on-surface font-semibold">H: 26°C · L: 14°C</span>
              </div>
            </div>

            <div className="mt-space-sm flex items-center gap-space-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[24px]">partly_cloudy_day</span>
              <span className="font-headline-sm text-headline-sm font-semibold">Partly Cloudy / Mild Marine Inversion</span>
            </div>
            <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant">
              Stable boundary layer with high coastal stratus burning off slowly. Evaporative pressure ramping towards diurnal peak at 14:00 PST.
            </p>
          </div>

          <div className="mt-space-xl pt-space-md border-t border-outline-variant/30 grid grid-cols-3 gap-space-sm text-center">
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">Delta-T Index</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">3.8°C</span>
              <span className="block font-label-sm text-[10px] text-secondary font-medium">Spray Favorable</span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">VPD Deficit</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">1.12 kPa</span>
              <span className="block font-label-sm text-[10px] text-on-surface-variant font-medium">Normal Stomatal</span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container-low">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">Leaf Moisture</span>
              <span className="block font-data-mono text-headline-sm text-primary font-semibold mt-0.5">22%</span>
              <span className="block font-label-sm text-[10px] text-secondary font-medium">Dry Foliage</span>
            </div>
          </div>
        </div>

        {/* 6 Grid Metrics (7 cols) */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-sm">
          {/* Relative Humidity */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Relative Humidity</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">humidity_percentage</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">58</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">%</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Moderate transpiration potential across canopy.
            </span>
          </div>

          {/* Wind Vector */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Wind Vector</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">air</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">9.4</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">km/h</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                  NW
                </span>
              </div>
              <span className="inline-block mt-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                ● Safe for foliar spraying (limit: 20 km/h)
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Gusts damped by western hedgerow strip.
            </span>
          </div>

          {/* Solar Irradiance */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Solar Irradiance</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">wb_sunny</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">720</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">W/m²</span>
              </div>
              <div className="flex items-center gap-1.5 mt-space-xs">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-label-sm text-label-sm font-semibold">
                  UV: 6 High
                </span>
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Max PAR accumulation: 41.2 mol/m²/day.
            </span>
          </div>

          {/* Evapotranspiration (ETo) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Evapotranspiration (ETo)</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">water_drop</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">4.2</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">mm/day</span>
              </div>
              <span className="inline-block mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                Standard Penman-Monteith calibration
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Transpiration baseline for root depth zone 1.
            </span>
          </div>

          {/* Barometric Pressure */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Barometric Pressure</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">compress</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">1014.8</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">hPa</span>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm mt-space-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_flat</span>
                <span>Barometer Steady (±0.2 hPa/3h)</span>
              </div>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              No frontal disruption within 36 hours.
            </span>
          </div>

          {/* Precipitation (24h) */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Precipitation (24h)</span>
              <span className="material-symbols-outlined text-secondary text-[20px]">rainy</span>
            </div>
            <div className="my-space-sm">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface font-semibold">0.0</span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">mm</span>
              </div>
              <span className="inline-block mt-space-xs text-on-surface-variant font-label-sm text-label-sm">
                Dew point: <strong className="text-on-surface">13.5°C</strong>
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Zero rain accumulation over previous cycle.
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Agricultural Forecast */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-outline-variant/30 pb-space-md">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold">Agronomic Horizon</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">7-Day Agricultural Forecast & Rain Probabilities</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-sm">
          {[
            { day: 'Today', icon: 'partly_cloudy_day', high: 23, low: 14, desc: 'Partly Cloudy', rain: '0 mm', prob: '10%' },
            { day: 'Tue', icon: 'wb_sunny', high: 25, low: 15, desc: 'Sunny', rain: '0 mm', prob: '5%' },
            { day: 'Wed', icon: 'wb_sunny', high: 26, low: 16, desc: 'Clear Peak', rain: '0 mm', prob: '0%' },
            { day: 'Thu', icon: 'partly_cloudy_day', high: 22, low: 13, desc: 'Coastal Fog', rain: '0 mm', prob: '15%' },
            { day: 'Fri', icon: 'cloud', high: 20, low: 12, desc: 'Overcast', rain: '1.2 mm', prob: '40%' },
            { day: 'Sat', icon: 'rainy', high: 19, low: 11, desc: 'Light Showers', rain: '4.5 mm', prob: '75%' },
            { day: 'Sun', icon: 'partly_cloudy_day', high: 21, low: 13, desc: 'Clearing', rain: '0.2 mm', prob: '20%' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`bg-surface-container-low/60 hover:bg-surface-container-low transition-colors rounded-lg p-space-md flex flex-col justify-between ${
                idx === 0 ? 'border-t-2 border-secondary' : ''
              }`}
            >
              <div className="text-center">
                <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">{item.day}</span>
                <div className="mt-1 flex justify-center text-secondary">
                  <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                </div>
                <div className="mt-1 font-headline-sm text-headline-sm text-on-surface">
                  {item.high}° <span className="text-on-surface-variant font-normal">/ {item.low}°</span>
                </div>
                <span className="font-label-sm text-[11px] text-on-surface-variant block mt-0.5 truncate">{item.desc}</span>
              </div>
              <div className="mt-space-md space-y-space-xs font-data-mono text-[11px]">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Rain:</span>
                  <span className="font-semibold text-on-surface">{item.rain}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant pt-1">
                  <span className="flex items-center gap-0.5">Prob:</span>
                  <span className="text-secondary font-semibold">{item.prob}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
