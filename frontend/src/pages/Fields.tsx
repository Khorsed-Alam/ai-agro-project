import React, { useEffect, useState } from 'react';
import type { Field } from '../types';
import { apiService } from '../services/api';
import { ECOSYSTEM_UPDATED_EVENT } from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';
import { useI18n } from '../i18n';

type FilterStatus = 'all' | 'Healthy' | 'Moderate' | 'Dry' | 'Critical';

export const Fields: React.FC = () => {
  const { t, translateEnum, formatNumber } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const translateDecisionReason = (reason: string) => {
    let match = reason.match(/^Soil moisture \(([^)]+)\) is severely dry \(<30%\)\. Immediate irrigation required\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      return t('dashboard.decisionReasons.severeDry', `Soil moisture (${value}%) is severely dry (<30%). Immediate irrigation required.`, { value });
    }
    match = reason.match(/^Soil moisture \(([^)]+)\) is below optimal target \(([^)]+)%–([^)]+)%\) for (.+)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const min = formatNumber(Number(match[2]));
      const max = formatNumber(Number(match[3]));
      const crop = translateEnum('common.enums.crops', match[4], match[4]);
      return t('dashboard.decisionReasons.belowOptimal', `Soil moisture (${value}%) is below optimal target (${min}%–${max}%) for ${crop}.`, { value, min, max, crop });
    }
    match = reason.match(/^Soil moisture \(([^)]+)\) is moderate for (.+)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const crop = translateEnum('common.enums.crops', match[2], match[2]);
      return t('dashboard.decisionReasons.moderateMoisture', `Soil moisture (${value}%) is moderate for ${crop}.`, { value, crop });
    }
    match = reason.match(/^Soil is saturated \(([^)]+)% > max ([^)]+)%\)\. Hold irrigation to prevent root hypoxia\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const max = formatNumber(Number(match[2]));
      return t('dashboard.decisionReasons.saturated', `Soil is saturated (${value}% > max ${max}%). Hold irrigation to prevent root hypoxia.`, { value, max });
    }
    match = reason.match(/^Soil moisture \(([^)]+)\) is optimal for (.+) \(([^)]+)%–([^)]+)%\)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const crop = translateEnum('common.enums.crops', match[2], match[2]);
      const min = formatNumber(Number(match[3]));
      const max = formatNumber(Number(match[4]));
      return t('dashboard.decisionReasons.optimalMoisture', `Soil moisture (${value}%) is optimal for ${crop} (${min}%–${max}%).`, { value, crop, min, max });
    }
    match = reason.match(/^High ambient temperature \(([^)]+)°C\) accelerates evapotranspiration, elevating water need\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      return t('dashboard.decisionReasons.highTemperature', `High ambient temperature (${value}°C) accelerates evapotranspiration, elevating water need.`, { value });
    }
    match = reason.match(/^Recent rainfall \(([^)]+) mm\) provides adequate water; delaying scheduled irrigation cycle\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      return t('dashboard.decisionReasons.rainfallAdequate', `Recent rainfall (${value} mm) provides adequate water; delaying scheduled irrigation cycle.`, { value });
    }
    match = reason.match(/^High humidity \(([^)]+)%\) and elevated temperature \(([^)]+)°C\) create high fungal pathogen\/blight risk\.$/);
    if (match) {
      const humidity = formatNumber(Number(match[1]));
      const temperature = formatNumber(Number(match[2]));
      return t('dashboard.decisionReasons.diseaseRisk', `High humidity (${humidity}%) and elevated temperature (${temperature}°C) create high fungal pathogen/blight risk.`, { humidity, temperature });
    }
    match = reason.match(/^Waterlogged soil \(([^)]+)%\) increases susceptibility to root rot & soil-borne pathogens\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      return t('dashboard.decisionReasons.waterlogged', `Waterlogged soil (${value}%) increases susceptibility to root rot & soil-borne pathogens.`, { value });
    }
    match = reason.match(/^Soil pH \(([^)]+)\) is too acidic for (.+) \(preferred min ([^)]+)\)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const crop = translateEnum('common.enums.crops', match[2], match[2]);
      const min = formatNumber(Number(match[3]));
      return t('dashboard.decisionReasons.phAcidic', `Soil pH (${value}) is too acidic for ${crop} (preferred min ${min}).`, { value, crop, min });
    }
    match = reason.match(/^Soil pH \(([^)]+)\) is too alkaline for (.+) \(preferred max ([^)]+)\)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const crop = translateEnum('common.enums.crops', match[2], match[2]);
      const max = formatNumber(Number(match[3]));
      return t('dashboard.decisionReasons.phAlkaline', `Soil pH (${value}) is too alkaline for ${crop} (preferred max ${max}).`, { value, crop, max });
    }
    match = reason.match(/^Soil pH \(([^)]+)\) is balanced for (.+) \(([^)]+)–([^)]+)\)\.$/);
    if (match) {
      const value = formatNumber(Number(match[1]));
      const crop = translateEnum('common.enums.crops', match[2], match[2]);
      const min = formatNumber(Number(match[3]));
      const max = formatNumber(Number(match[4]));
      return t('dashboard.decisionReasons.phBalanced', `Soil pH (${value}) is balanced for ${crop} (${min}–${max}).`, { value, crop, min, max });
    }
    if (reason === 'Soil moisture telemetry unavailable or probe offline.') {
      return t('dashboard.decisionReasons.moistureUnavailable', reason);
    }
    if (reason === 'Soil pH telemetry missing.') {
      return t('dashboard.decisionReasons.phMissing', reason);
    }
    if (reason === 'No field data provided for evaluation.') {
      return t('dashboard.decisionReasons.noFieldData', reason);
    }
    return reason;
  };

  const loadFields = () => {
    apiService.getFields()
      .then((data) => {
        const rawList = data || [];
        const uniqueMap = new Map<string, Field>();
        rawList.forEach((f: any) => {
          const uId = f.fieldId || f.id || f.docId || f.name;
          if (!uniqueMap.has(uId) || f.assignedFarmerId || f.assignedFarmerName) {
            uniqueMap.set(uId, f);
          }
        });
        const cleanedList = Array.from(uniqueMap.values());
        setFields(cleanedList);
        setLoading(false);
      })
      .catch(() => {
        setError('fields.unableToLoad');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFields();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadFields);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadFields);
  }, []);

  const selectedField = fields.find((f) => (f.fieldId || f.id || (f as any).docId) === selectedFieldId) || null;

  const getMetrics = (f: any) => {
    const decision = evaluateFieldDecision(f);

    return {
      moistureVal: decision.soilMoistureVal,
      moistureDisplay: decision.soilMoistureVal !== null ? `${formatNumber(decision.soilMoistureVal)}%` : t('common.notAvailable'),
      phDisplay: decision.soilPHVal !== null ? `${formatNumber(decision.soilPHVal)} ${t('dashboard.ph')}` : t('common.notAvailable'),
      tempDisplay: decision.temperatureVal !== null ? `${formatNumber(decision.temperatureVal)}°C` : t('common.notAvailable'),
      rainDisplay: decision.rainfallVal !== null ? `${formatNumber(decision.rainfallVal)} mm` : t('common.notAvailable'),
      humidityDisplay: decision.humidityVal !== null ? `${formatNumber(decision.humidityVal)}%` : t('common.notAvailable'),
      waterRequirement: decision.waterNeed,
      action: decision.action,
      actionRoute: decision.actionRoute,
      reasons: decision.reasons,
      areaDisplay: f.areaAcres !== undefined && f.areaAcres !== null
        ? `${formatNumber(f.areaAcres)} ${t('farm.acres')}`
        : (f.area ? (typeof f.area === 'number' ? formatNumber(f.area) : `${f.area}`) : t('common.notAvailable')),
      soilType: f.soilType ? translateEnum('common.enums.soilTypes', f.soilType, f.soilType) : t('common.notAvailable'),
      status: decision.status,
      latDisplay: f.latitude !== undefined && f.latitude !== null ? `${f.latitude}` : t('common.notAvailable'),
      lngDisplay: f.longitude !== undefined && f.longitude !== null ? `${f.longitude}` : t('common.notAvailable'),
      farmerName: f.assignedFarmerName || f.farmerName || (f.assignedFarmerId ? t('status.assigned') : t('status.unassigned')),
    };
  };

  const filteredFields = fields.filter((f) => {
    const m = getMetrics(f);
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus || (filterStatus === 'Moderate' && m.status === 'Attention') || (filterStatus === 'Dry' && m.status === 'Attention');
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.crop && f.crop.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statusFilters: FilterStatus[] = ['all', 'Healthy', 'Moderate', 'Dry', 'Critical'];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1640px] mx-auto px-margin md:px-margin-lg py-space-xl flex flex-col gap-space-xl">

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider">
              <span>{t('navigation.main')}</span>
              <span className="text-outline">/</span>
              <span>{t('fields.fieldDirectory')}</span>
            </div>
            <h1 className="font-display-lg text-primary tracking-tight">{t('fields.title')}</h1>
            <p className="font-body-md text-on-surface-variant">
              {t('fields.description')}
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface-variant font-label-sm font-medium"
              style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
              <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
              {t('fields.liveDatabase', { count: formatNumber(fields.length) })}
            </span>
          </div>
        </div>

        {/* Filter + Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-md">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-space-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>
              search
            </span>
            <input
              type="text"
              placeholder={t('fields.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-space-md bg-surface-container-lowest text-on-surface font-body-md rounded-lg outline-none"
              style={{ border: '1px solid rgba(193,200,194,0.6)', paddingLeft: '2rem' }}
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-space-xs flex-wrap">
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-space-md py-space-xs rounded-lg font-label-md transition-all ${
                  filterStatus === status
                    ? 'bg-primary-container text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant'
                }`}
                style={filterStatus !== status ? { border: '1px solid rgba(193,200,194,0.4)' } : {}}
              >
                {status === 'all' ? `${t('common.all')} (${formatNumber(fields.length)})` : translateEnum('status', status, status)}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-space-md rounded-lg bg-amber-50 text-amber-900 font-body-sm flex items-center gap-space-sm"
            style={{ border: '1px solid #fcd34d' }}>
            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '18px' }}>info</span>
            {t(error)}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-space-md">
            <div className="w-10 h-10 rounded-full border-2 border-primary-container animate-spin"
              style={{ borderTopColor: '#1e3d2f' }} />
            <p className="font-body-md text-on-surface-variant">{t('fields.loadingDataset')}</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-space-md">
            <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: '64px' }}>
              layers
            </span>
            <p className="font-headline-sm text-on-surface-variant">{t('fields.noFields')}</p>
            <p className="font-body-sm text-on-surface-variant">{t('fields.adjustFilters')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg">
            {/* Fields Grid */}
            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {filteredFields.map((field) => {
                const m = getMetrics(field);
                const isCritical = m.status === 'Critical';
                const isAttention = m.status === 'Attention';
                const isInsufficient = m.status === 'Insufficient Data';
                const fieldUniqueId = field.fieldId || field.id || (field as any).docId;
                const isSelected = selectedFieldId === fieldUniqueId;

                return (
                  <button
                    key={fieldUniqueId}
                    className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col text-left transition-all hover:shadow-md cursor-pointer overflow-hidden"
                    style={{
                      border: isSelected ? '2px solid #1e3d2f' : '1px solid rgba(193,200,194,0.4)',
                      backgroundColor: isCritical ? 'rgba(255,218,214,0.08)' : '#ffffff'
                    }}
                    onClick={() => setSelectedFieldId(isSelected ? null : fieldUniqueId)}
                  >
                    {/* Card Header */}
                    <div className="px-space-lg py-space-md flex items-center justify-between"
                      style={{
                        backgroundColor: 'rgba(239,244,255,0.4)',
                        borderBottom: '1px solid rgba(193,200,194,0.3)'
                      }}>
                      <div>
                        <div className="font-headline-sm text-on-surface">{field.name}</div>
                        <div className="font-body-sm text-on-surface-variant">{t('fields.crop')}: <strong className="text-on-surface">{translateEnum('common.enums.crops', field.crop, field.crop)}</strong></div>
                      </div>
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                          style={{ backgroundColor: 'rgba(255,218,214,0.8)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-error inline-block animate-pulse" />
                          {t('status.critical')}
                        </span>
                      ) : isAttention ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold">
                          {t('status.attention')}
                        </span>
                      ) : isInsufficient ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-surface-variant bg-surface-container font-label-sm font-semibold">
                          {t('status.noData')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                          style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}>
                          {t('status.healthy')}
                        </span>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="p-space-md grid grid-cols-2 gap-space-sm">
                      {[
                        { icon: 'water_drop', label: t('fields.soilMoisture'), value: m.moistureDisplay },
                        { icon: 'science', label: t('fields.soilPh'), value: m.phDisplay },
                        { icon: 'thermostat', label: t('fields.temperature'), value: m.tempDisplay },
                        { icon: 'rainy', label: t('fields.rainfall'), value: m.rainDisplay },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="p-space-sm rounded-lg flex items-center gap-space-sm"
                          style={{ backgroundColor: '#f8f9ff', border: '1px solid rgba(193,200,194,0.2)' }}>
                          <span className="material-symbols-outlined text-on-surface-variant shrink-0" style={{ fontSize: '18px' }}>{icon}</span>
                          <div>
                            <div className="font-label-sm text-on-surface-variant">{label}</div>
                            <div className="font-data-mono text-on-surface font-semibold">{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-space-md pb-space-md flex items-center justify-between">
                      <span className="font-label-sm text-on-surface-variant">{t('fields.waterNeed')}:</span>
                      <span className={`font-label-sm font-semibold ${
                        m.waterRequirement === 'Urgent' || m.waterRequirement === 'High'
                          ? 'text-error'
                          : m.waterRequirement === 'Moderate'
                          ? 'text-amber-700'
                          : m.waterRequirement === 'Low'
                          ? 'text-secondary'
                          : 'text-on-surface-variant'
                      }`}>
                        {translateEnum('common.enums.waterRequirements', m.waterRequirement, m.waterRequirement)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Field Detail Panel */}
            <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col"
              style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
              <div className="px-space-lg py-space-md flex items-center gap-space-xs"
                style={{ borderBottom: '1px solid rgba(193,200,194,0.3)', backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>analytics</span>
                <h2 className="font-headline-sm text-on-surface font-semibold">{t('fields.fieldDetail')}</h2>
              </div>

              <div className="flex-1 p-space-lg">
                {selectedField ? (() => {
                  const sm = getMetrics(selectedField);
                  return (
                    <div className="space-y-space-md">
                      <div className="p-space-md bg-surface-container-low rounded-lg">
                        <div className="font-headline-sm text-on-surface">{selectedField.name}</div>
                        <div className="font-body-sm text-on-surface-variant font-medium">{t('fields.crop')}: {translateEnum('common.enums.crops', selectedField.crop, selectedField.crop)}</div>
                      </div>

                      {/* Moisture bar */}
                      <div>
                        <div className="flex items-center justify-between mb-space-xs">
                          <span className="font-label-sm text-on-surface-variant">{t('fields.soilMoisture')}</span>
                          <span className="font-data-mono text-on-surface font-semibold">
                            {sm.moistureDisplay}
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full overflow-hidden" style={{ height: '8px' }}>
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${sm.moistureVal ?? 0}%`,
                            backgroundColor: sm.status === 'Critical' ? '#ba1a1a' :
                              sm.status === 'Attention' ? '#b45309' : '#296b3c'
                          }} />
                        </div>
                      </div>

                      {/* Field Metadata & Telemetry Table */}
                      <div className="space-y-space-xs">
                        {[
                          { label: t('fields.status'), value: translateEnum('status', sm.status, sm.status) },
                          { label: t('fields.area'), value: sm.areaDisplay },
                          { label: t('fields.soilType'), value: sm.soilType },
                          { label: t('fields.soilPh'), value: sm.phDisplay },
                          { label: t('fields.temperature'), value: sm.tempDisplay },
                          { label: t('fields.humidity'), value: sm.humidityDisplay },
                          { label: t('fields.rainfall'), value: sm.rainDisplay },
                          { label: t('fields.waterNeed'), value: translateEnum('common.enums.waterRequirements', sm.waterRequirement, sm.waterRequirement) },
                          { label: t('fields.recommendedAction'), value: translateEnum('common.enums.recommendations', sm.action, sm.action) },
                          { label: t('fields.assignedFarmer'), value: sm.farmerName },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid rgba(193,200,194,0.2)' }}>
                            <span className="font-body-sm text-on-surface-variant">{label}</span>
                            <span className="font-data-mono text-on-surface font-medium">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* AI Decision Reasons Box */}
                      {sm.reasons && sm.reasons.length > 0 && (
                        <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1">
                          <div className="font-label-sm font-semibold text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>psychology</span>
                            {t('fields.decisionReasons')}
                          </div>
                          <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                            {sm.reasons.map((r, idx) => (
                              <li key={idx} className="leading-snug">{translateDecisionReason(r)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-col gap-space-sm pt-space-sm">
                        <button
                          className="w-full h-9 bg-primary-container text-on-primary rounded-lg font-label-md font-semibold hover:opacity-90 flex items-center justify-center gap-space-xs cursor-pointer"
                          onClick={() => window.location.href = sm.actionRoute || '/irrigation-planner'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            {sm.action === 'Pathogen AI' ? 'filter_center_focus' : 'water_drop'}
                          </span>
                          {t('fields.executeAction', { action: translateEnum('common.enums.recommendations', sm.action, sm.action) })}
                        </button>
                        <button
                          className="w-full h-9 bg-surface-container-lowest text-on-surface rounded-lg font-label-md font-semibold flex items-center justify-center gap-space-xs cursor-pointer"
                          style={{ border: '1px solid rgba(193,200,194,0.4)' }}
                          onClick={() => window.location.href = '/disease-detection'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>analytics</span>
                          {t('fields.analyzeLeafImage')}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex flex-col items-center justify-center h-full min-h-40 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: '48px' }}>
                      crop_square
                    </span>
                    <p className="font-body-sm text-on-surface-variant mt-space-sm">
                      {t('fields.selectField')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
