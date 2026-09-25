import React, { useState, useEffect } from 'react';
import type { Field } from '../types';
import { apiService } from '../services/api';
import { firestoreService } from '../services/firebase';
import { ECOSYSTEM_UPDATED_EVENT, getFarms, notifyEcosystemChange } from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';
import { useI18n } from '../i18n';

export const MyFarm: React.FC = () => {
  const { t, translateEnum, formatDate, formatNumber } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newCropType, setNewCropType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState<number>(0);

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

  const loadData = () => {
    apiService.getFields().then((data) => {
      setFields(data || []);
    });
    // Fetch all farms from DB (no ownerId filter — show all DB records)
    getFarms().then((farms) => {
      if (farms && farms.length > 0) {
        setFarmName(farms[0].name);
        setFarmLocation(farms[0].location);
        setFarmArea(farms[0].areaHectares);
      }
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
  }, []);

  const handleCreateField = async () => {
    if (!newFieldName.trim() || !newCropType.trim()) {
      alert(t('validation.fieldAndCropRequired'));
      return;
    }

    setIsSaving(true);
    const fieldId = `field_${Date.now()}`;
    const newFieldObj: Partial<Field> = {
      id: fieldId,
      name: newFieldName.trim(),
      crop: newCropType.trim(),
      soilMoisture: 50,
      soilPH: 6.5,
      temperature: 28,
      humidity: 60,
      rainfall: 10,
      status: 'Healthy',
      waterRequirement: 'Low'
    };

    try {
      // 1. API & Ecosystem Persistence
      const savedField = await apiService.createField(newFieldObj);
      // 2. Firestore Cloud Persistence
      await firestoreService.saveField(savedField);
      // 3. Log to Activity Stream
      await apiService.createLog({
        timestamp: formatDate(new Date(), { hour: '2-digit', minute: '2-digit' }),
        category: 'Field',
        field: savedField.name,
        description: `Created new field asset ${savedField.name} (${savedField.crop})`,
        engine: 'Farm Manager',
        status: 'Success'
      });

      notifyEcosystemChange();
      setFields((prev) => [savedField, ...prev]);
      setNewFieldName('');
      setNewCropType('');
      setShowAddModal(false);
    } catch {
      alert(t('farm.createdLocalView'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-margin-lg space-y-gutter-lg max-w-[1600px] mx-auto w-full">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-xs">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
              <span>{t('farm.enterpriseCore')}</span>
              <span className="text-outline">/</span>
              <span>{t('farm.spatialAssetRegistry')}</span>
            </div>
            <h1 className="font-display-lg text-primary tracking-tight">{t('farm.title')}</h1>
            <p className="font-body-md text-on-surface-variant">
              {t('farm.description')}
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              className="inline-flex items-center gap-space-xs px-space-md h-9 bg-primary-container text-on-primary hover:opacity-90 transition-colors rounded-lg shadow-sm font-label-md font-semibold cursor-pointer"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>{t('farm.addField')}</span>
            </button>
          </div>
        </div>

        {/* Farm Dossier */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">

          {/* Agricultural Metadata Card */}
          <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-space-lg">
              <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-md mb-space-md -mx-space-lg -mt-space-lg px-space-lg pt-space-lg"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                <div className="flex items-center gap-space-sm">
                  <span className="p-space-xs bg-primary text-on-primary rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>agriculture</span>
                  </span>
                  <div>
                    <h2 className="font-headline-md text-on-surface">{farmName}</h2>
                    <span className="font-data-mono text-on-surface-variant">
                      36.677° N, 121.655° W • {farmLocation}
                    </span>
                  </div>
                </div>
                <span className="px-space-sm py-0.5 bg-secondary-container text-on-secondary-container rounded-full font-label-sm font-semibold">
                  {t('farm.primaryEnterpriseSite')}
                </span>
              </div>

              {/* Dossier Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mb-space-lg">
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">{t('farm.totalArea')}</span>
                  <span className="font-headline-sm text-on-surface font-semibold">{formatNumber(farmArea)} {t('farm.hectares')}</span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">{t('farm.monitoredParcels')}</span>
                  <span className="font-headline-sm text-on-surface font-semibold">{formatNumber(fields.length)} {t('farm.sectors')}</span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">{t('farm.primaryCrops')}</span>
                  <span className="font-headline-sm text-on-surface font-semibold truncate block">
                    {Array.from(new Set(fields.map((f) => f.crop))).filter(Boolean).map((crop) => translateEnum('common.enums.crops', crop, crop)).join(', ') || t('common.none')}
                  </span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">{t('farm.soilClassification')}</span>
                  <span className="font-headline-sm text-on-surface font-semibold">{translateEnum('common.enums.soilTypes', 'Silty Clay Loam')}</span>
                </div>
              </div>

              {/* Fields Table */}
              <h3 className="font-headline-sm text-on-surface font-semibold mb-space-xs">{t('farm.registeredParcels')}</h3>
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(193,200,194,0.3)' }}>
                <table className="w-full text-left font-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase">
                      <th className="py-space-xs px-space-md font-semibold">{t('farm.sectorId')}</th>
                      <th className="py-space-xs px-space-md font-semibold">{t('dashboard.crop')}</th>
                      <th className="py-space-xs px-space-md font-semibold">{t('farm.moisture')}</th>
                      <th className="py-space-xs px-space-md font-semibold">{t('dashboard.status')}</th>
                      <th className="py-space-xs px-space-md font-semibold text-right">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low text-on-surface">
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-on-surface-variant font-body-sm">
                          {t('farm.noFields')}
                        </td>
                      </tr>
                    ) : (
                      fields.map((f) => {
                        const fdec = evaluateFieldDecision(f);
                        const isCrit = fdec.status === 'Critical';
                        const isAtt = fdec.status === 'Attention';
                        return (
                          <tr
                            key={f.id || f.fieldId || (f as any).docId || f.name}
                            onClick={() => setSelectedField(f)}
                            className={`hover:bg-surface-container-low transition-colors cursor-pointer ${
                              selectedField?.id === f.id ? 'bg-surface-container-low font-semibold' : ''
                            }`}
                          >
                            <td className="py-space-sm px-space-md font-data-mono font-medium text-primary">
                              {f.name}
                            </td>
                            <td className="py-space-sm px-space-md">{translateEnum('common.enums.crops', f.crop, f.crop)}</td>
                            <td className="py-space-sm px-space-md font-data-mono">
                              {fdec.soilMoistureVal !== null ? `${formatNumber(fdec.soilMoistureVal)}% VWC` : t('common.notAvailable')}
                            </td>
                            <td className="py-space-sm px-space-md">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-label-sm font-semibold ${
                                  isCrit
                                    ? 'bg-error-container text-on-error-container'
                                    : isAtt
                                    ? 'bg-amber-100 text-amber-800'
                                    : fdec.status === 'Insufficient Data'
                                    ? 'bg-surface-container text-on-surface-variant'
                                    : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                }`}
                              >
                                {translateEnum('status', fdec.status, fdec.status)}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-md text-right">
                              <button
                                className="px-space-xs py-1 text-secondary font-label-md hover:underline cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedField(f);
                                }}
                              >
                                {translateEnum('common.enums.recommendations', fdec.action, fdec.action)}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Inspector Panel */}
          <div className="xl:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between border border-outline-variant/30">
            <div>
              <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30 mb-space-md">
                <h3 className="font-headline-sm text-primary">{t('farm.fieldTelemetryInspector')}</h3>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>info</span>
              </div>

              {selectedField ? (() => {
                const dec = evaluateFieldDecision(selectedField);
                const area = selectedField.areaAcres !== undefined && selectedField.areaAcres !== null
                  ? `${formatNumber(selectedField.areaAcres)} ${t('farm.acres')}`
                  : ((selectedField as any).area ? `${(selectedField as any).area}` : t('common.notAvailable'));
                const soilType = selectedField.soilType
                  ? translateEnum('common.enums.soilTypes', selectedField.soilType, selectedField.soilType)
                  : t('common.notAvailable');
                const farmerName = selectedField.assignedFarmerName || (selectedField as any).farmerName || (selectedField.assignedFarmerId ? t('status.assigned') : t('status.unassigned'));
                const isCritical = dec.status === 'Critical';
                const isAttention = dec.status === 'Attention';

                return (
                  <div className="space-y-space-md text-body-sm text-on-surface">
                    <div>
                      <span className="font-label-sm text-on-surface-variant uppercase block">{t('farm.selectedSector')}</span>
                      <span className="font-headline-sm text-primary font-semibold">{selectedField.name} ({translateEnum('common.enums.crops', selectedField.crop, selectedField.crop)})</span>
                    </div>

                    {/* Status badge */}
                    <div className={`p-space-sm rounded-lg flex items-center gap-2 ${
                      isCritical ? 'bg-error-container/40' : isAttention ? 'bg-amber-50' : 'bg-secondary-fixed/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isCritical ? 'bg-error animate-pulse' : isAttention ? 'bg-amber-500' : 'bg-secondary'
                      }`} />
                      <span className={`font-label-sm font-semibold ${
                        isCritical ? 'text-error' : isAttention ? 'text-amber-800' : 'text-secondary'
                      }`}>
                        {t('accessibility.status', { value: translateEnum('status', dec.status, dec.status) })}
                      </span>
                      <span className="ml-auto font-label-sm text-on-surface-variant">
                        {t('farm.water')}: <strong>{translateEnum('common.enums.waterRequirements', dec.waterNeed, dec.waterNeed)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-space-xs text-xs bg-surface p-2.5 rounded border border-outline-variant/20">
                      <div>{t('farm.area')}: <strong>{area}</strong></div>
                      <div>{t('farm.soil')}: <strong>{soilType}</strong></div>
                      <div>{t('common.action')}: <strong>{translateEnum('common.enums.recommendations', dec.action, dec.action)}</strong></div>
                      <div>{t('farm.worker')}: <strong>{farmerName}</strong></div>
                    </div>

                    <div className="grid grid-cols-2 gap-space-xs font-data-mono">
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">{t('fields.soilMoisture').toUpperCase()}</span>
                        <span className="font-semibold text-primary">
                          {dec.soilMoistureVal !== null ? `${formatNumber(dec.soilMoistureVal)}%` : t('common.notAvailable')}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">{t('fields.soilPh').toUpperCase()}</span>
                        <span className="font-semibold text-primary">
                          {dec.soilPHVal !== null ? `${formatNumber(dec.soilPHVal)} ${t('dashboard.ph')}` : t('common.notAvailable')}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">{t('fields.temperature').toUpperCase()}</span>
                        <span className="font-semibold text-primary">
                          {dec.temperatureVal !== null ? `${formatNumber(dec.temperatureVal)}°C` : t('common.notAvailable')}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">{t('fields.humidity').toUpperCase()}</span>
                        <span className="font-semibold text-primary">
                          {dec.humidityVal !== null ? `${formatNumber(dec.humidityVal)}%` : t('common.notAvailable')}
                        </span>
                      </div>
                    </div>

                    {/* Decision Reasons */}
                    {dec.reasons && dec.reasons.length > 0 && (
                      <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1">
                        <div className="font-label-sm font-semibold text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>psychology</span>
                          {t('farm.aiDecisionReasons')}
                        </div>
                        <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                          {dec.reasons.map((r, idx) => (
                            <li key={idx} className="leading-snug">{translateDecisionReason(r)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <button
                      className="w-full h-9 bg-primary-container text-on-primary rounded-lg font-label-md font-semibold hover:opacity-90 flex items-center justify-center gap-space-xs cursor-pointer"
                      onClick={() => window.location.href = dec.actionRoute}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        {dec.action === 'Pathogen AI' ? 'filter_center_focus' : dec.action === 'Queue Run' ? 'water_drop' : 'search'}
                      </span>
                      {t('farm.executeDecision', { action: translateEnum('common.enums.recommendations', dec.action, dec.action) })}
                    </button>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: '48px' }}>
                    touch_app
                  </span>
                  <p className="font-body-sm text-on-surface-variant mt-space-sm">
                    {t('farm.selectFieldRow')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-margin" onClick={() => setShowAddModal(false)}>
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-md p-space-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-space-lg">
              <h2 className="font-headline-sm text-on-surface font-semibold">{t('farm.addNewField')}</h2>
              <button className="text-on-surface-variant cursor-pointer" onClick={() => setShowAddModal(false)} aria-label={t('common.close')}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>
            <div className="space-y-space-md">
              <div>
                <label className="font-label-sm text-on-surface-variant block mb-space-xs">{t('farm.fieldName')}</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={t('farm.fieldNamePlaceholder')}
                  className="w-full h-9 px-space-md bg-surface-container-lowest text-on-surface font-body-md rounded-lg outline-none"
                  style={{ border: '1px solid #c1c8c2' }}
                />
              </div>
              <div>
                <label className="font-label-sm text-on-surface-variant block mb-space-xs">{t('farm.cropType')}</label>
                <input
                  type="text"
                  value={newCropType}
                  onChange={(e) => setNewCropType(e.target.value)}
                  placeholder={t('farm.cropTypePlaceholder')}
                  className="w-full h-9 px-space-md bg-surface-container-lowest text-on-surface font-body-md rounded-lg outline-none"
                  style={{ border: '1px solid #c1c8c2' }}
                />
              </div>
              <div className="pt-space-sm flex gap-space-sm">
                <button
                  className="flex-1 h-9 bg-surface-container text-on-surface rounded-lg font-label-md font-semibold cursor-pointer"
                  onClick={() => setShowAddModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  className="flex-1 h-9 bg-primary-container text-on-primary rounded-lg font-label-md font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                  onClick={handleCreateField}
                  disabled={isSaving}
                >
                  {isSaving ? t('common.saving') : t('farm.createField')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
