import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AI_MODULES } from '../data/sampleFields';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Field } from '../types';
import { ECOSYSTEM_UPDATED_EVENT, getFarms } from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';
import { useI18n } from '../i18n';

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { t, translateEnum, formatNumber } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveData, setIsLiveData] = useState<boolean>(false);
  const [farmName, setFarmName] = useState<string>('');
  const [farmArea, setFarmArea] = useState<number>(0);

  const loadData = () => {
    setIsLoading(true);
    apiService.getFields().then((data) => {
      console.log('[Dashboard] field fetch result:', data?.length, data?.map((f: Field) => `${f.id} — ${f.name}`));
      setFields(data || []);
      setIsLiveData(Boolean(data && data.length > 0));
      setIsLoading(false);
    }).catch(() => {
      setFields([]);
      setIsLiveData(false);
      setIsLoading(false);
    });
    getFarms().then((farms) => {
      if (farms && farms.length > 0) {
        setFarmName(farms[0].name);
        setFarmArea(farms[0].areaHectares);
      }
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadData);
  }, []);

  const evaluatedFields = fields.map((f) => ({
    field: f,
    decision: evaluateFieldDecision(f),
  }));

  const totalFields = fields.length;
  const healthyFields = evaluatedFields.filter((ef) => ef.decision.status === 'Healthy').length;
  const dryFields = evaluatedFields.filter((ef) => ef.decision.status === 'Attention').length;
  const criticalFields = evaluatedFields.filter((ef) => ef.decision.status === 'Critical').length;
  const waterAvailability = 64200; // Reservoir capacity liters

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

  const moduleNameKeys: Record<string, string> = {
    kmeans: 'algorithms.kmeans',
    'decision-tree': 'algorithms.dtree',
    cnn: 'algorithms.cnn',
    csp: 'algorithms.csp',
    ac3: 'algorithms.ac3',
    bfs: 'algorithms.bfs',
    dfs: 'algorithms.dfs',
  };

  const moduleCategoryKeys: Record<string, string> = {
    'Machine Learning': 'dashboard.moduleCategories.machineLearning',
    'Deep Learning': 'dashboard.moduleCategories.deepLearning',
    'Constraint Satisfaction': 'dashboard.moduleCategories.constraintSatisfaction',
    'Search Algorithm': 'dashboard.moduleCategories.searchAlgorithm',
    Optimization: 'dashboard.moduleCategories.optimization',
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1640px] mx-auto px-margin md:px-margin-lg py-space-xl flex flex-col gap-space-xl">

        {/* Top Greeting & Operational Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-secondary uppercase tracking-widest font-semibold">
                {farmName} — {t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(4) })}
              </span>
              <span className="text-outline-variant font-label-sm">•</span>
              <span className="inline-flex items-center gap-1 font-label-sm text-on-surface-variant">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLiveData ? 'bg-secondary animate-pulse' : 'bg-outline'}`} />
                {isLoading ? t('dashboard.loadingFieldData') : isLiveData ? t('dashboard.liveDatabaseFields') : t('dashboard.demoFields')}
              </span>
            </div>
            <h1 className="font-headline-lg text-on-surface font-semibold tracking-tight">
              {t('dashboard.morningGreeting', { name: userProfile?.fullName || translateEnum('common.enums.roles', 'systemOperator') })}
            </h1>
            <p className="font-body-md text-on-surface-variant">
              {t('dashboard.monitoredSummary', {
                area: formatNumber(farmArea),
                count: formatNumber(totalFields),
                critical: formatNumber(criticalFields),
              })}
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start lg:self-auto shrink-0">
            <Link
              to="/fields"
              className="flex items-center gap-space-xs px-space-md h-9 bg-surface-container-lowest text-on-surface font-label-md rounded-lg shadow-sm transition-all duration-150"
              style={{ border: '1px solid rgba(193,200,194,0.4)' }}
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>
                radar
              </span>
              <span>{t('dashboard.quickFieldScan')}</span>
            </Link>
            <Link
              to="/ai-analysis"
              className="flex items-center gap-space-xs px-space-md h-9 bg-primary-container text-on-primary font-label-md rounded-lg shadow-sm transition-all duration-150 hover:opacity-90"
            >
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '18px' }}>
                auto_awesome
              </span>
              <span>{t('dashboard.aiAnalysis')}</span>
            </Link>
          </div>
        </div>

        {/* KPI Metric Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {/* Monitored Fields */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">{t('dashboard.monitoredFields')}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {formatNumber(totalFields)}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">{t('dashboard.field')}</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">{t('dashboard.allSectorsActive')}</div>
            </div>
            <div className="flex items-center gap-1.5 pt-space-xs font-label-sm font-medium" style={{ color: isLiveData ? '#296b3c' : undefined }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{isLiveData ? 'cloud_done' : 'add_circle'}</span>
              <span>{isLiveData ? t('dashboard.liveDatabase') : t('dashboard.demoDataset')}</span>
            </div>
          </div>

          {/* Healthy Status */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">{t('dashboard.healthyStatus')}</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {formatNumber(healthyFields)}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">{t('dashboard.field')}</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">{t('dashboard.optimalConditions')}</div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                {t('dashboard.normalGrowth')}
              </span>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">{t('dashboard.needsAttention')}</span>
              <span className="material-symbols-outlined text-amber-700" style={{ fontSize: '18px' }}>warning</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {formatNumber(dryFields)}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">{t('dashboard.field')}</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">
                {fields.filter(f => f.status === 'Dry' || f.status === 'Moderate').map(f => f.name).join(' & ') || t('dashboard.noDryFields')}
              </div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                {t('dashboard.waterDeficit')}
              </span>
            </div>
          </div>

          {/* Critical Status */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">{t('dashboard.criticalAction')}</span>
              <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>emergency</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-error font-semibold tracking-tight">
                {formatNumber(criticalFields)}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">{t('dashboard.field')}</span>
              </div>
              <div className="font-body-sm text-on-surface font-medium mt-0.5">
                {fields.filter(f => f.status === 'Critical').map(f => `${f.name} (${translateEnum('common.enums.crops', f.crop, f.crop)})`).join(', ') || t('dashboard.noneCritical')}
              </div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,218,214,0.6)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-error inline-block animate-pulse" />
                {t('dashboard.urgentAttention')}
              </span>
            </div>
          </div>

          {/* Water Reserves */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">{t('dashboard.reservoirReserves')}</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>water</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {formatNumber(waterAvailability / 1000, { maximumFractionDigits: 1 })}{'k'}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">{t('dashboard.litersAbbreviation', 'L')}</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">{t('dashboard.totalCapacity')}</div>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <div className="w-full bg-surface-container-high rounded-full mr-2 overflow-hidden" style={{ height: '6px' }}>
                <div className="bg-secondary h-full rounded-full" style={{ width: '78%' }} />
              </div>
              <span className="font-data-mono text-label-sm text-secondary shrink-0">{t('dashboard.plusHours', '+{count}h', { count: formatNumber(14) })}</span>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">

          {/* LEFT COLUMN: Farm Map + Field Conditions Table */}
          <div className="xl:col-span-7 flex flex-col gap-space-xl">

            {/* Farm Spatial Map Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md flex items-center justify-between"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>map</span>
                  <h2 className="font-headline-sm text-on-surface font-semibold">{t('dashboard.farmSpatialMap')}</h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono text-label-sm text-on-surface-variant">
                    GPS: 36.677° N, 121.655° W
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
                    {t('dashboard.nodesActive', { count: formatNumber(fields.length) })}
                  </span>
                </div>
              </div>
              <div className="p-space-lg">
                <div className="relative w-full bg-surface-container-low rounded-lg overflow-hidden select-none" style={{ aspectRatio: '16/10' }}>
                  {/* SVG Farm Map */}
                  <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="800" height="500" fill="#F4F7F2" />
                    <path d="M-20 80 Q 200 40 400 90 T 820 60" stroke="#E3EAE0" strokeWidth="1.5" fill="none" />
                    <path d="M-20 220 Q 220 180 450 240 T 820 200" stroke="#E3EAE0" strokeWidth="1.5" fill="none" />
                    <path d="M-20 380 Q 300 320 500 400 T 820 350" stroke="#E3EAE0" strokeWidth="1.5" fill="none" />
                    {/* Irrigation Canal */}
                    <path d="M 40 480 C 180 430, 260 300, 390 260 C 520 220, 620 100, 760 30" stroke="#92C4D6" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <path d="M 40 480 C 180 430, 260 300, 390 260 C 520 220, 620 100, 760 30" stroke="#5E9DB3" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                    {/* Dynamic Field 0 / Sector 1 */}
                    <polygon points="50,50 340,50 330,220 40,220" fill="#E4EFE3" stroke="#B8D7B5" strokeWidth="2" />
                    <path d="M60 80 L330 80 M60 110 L325 110 M55 140 L320 140 M50 170 L315 170 M45 200 L310 200" stroke="#CFE4CB" strokeWidth="1" />
                    <rect x="65" y="65" width="150" height="24" rx="4" fill="#FFFFFF" opacity="0.92" />
                    <text x="75" y="81" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#1E3D2F">
                      {fields[0] ? `${fields[0].name} • ${translateEnum('common.enums.crops', fields[0].crop, fields[0].crop)}` : t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(1) })}
                    </text>
                    <text x="75" y="112" fontFamily="Inter" fontSize="11" fill="#424844">
                      {fields[0] ? `${translateEnum('status', fields[0].status, fields[0].status)} • ${fields[0].soilMoisture !== undefined && fields[0].soilMoisture !== null ? `${formatNumber(fields[0].soilMoisture)}%` : t('dashboard.telemetryPending')} ${t('dashboard.moisture')}` : t('dashboard.noTelemetry')}
                    </text>
                    {/* Dynamic Field 1 / Sector 2 */}
                    <polygon points="380,45 740,40 730,210 390,210" fill="#FBF3DE" stroke="#E6D3A3" strokeWidth="2" />
                    <rect x="400" y="55" width="150" height="24" rx="4" fill="#FFFFFF" opacity="0.92" />
                    <text x="410" y="71" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#4E3E1A">
                      {fields[1] ? `${fields[1].name} • ${translateEnum('common.enums.crops', fields[1].crop, fields[1].crop)}` : t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(2) })}
                    </text>
                    <text x="410" y="102" fontFamily="Inter" fontSize="11" fill="#6B5B30">
                      {fields[1] ? `${translateEnum('status', fields[1].status, fields[1].status)} • ${fields[1].soilMoisture !== undefined && fields[1].soilMoisture !== null ? `${formatNumber(fields[1].soilMoisture)}%` : t('dashboard.telemetryPending')} ${t('dashboard.moisture')}` : t('dashboard.noTelemetry')}
                    </text>
                    {/* Central Water Hub */}
                    <circle cx="370" cy="245" r="28" fill="#1E3D2F" stroke="#FFFFFF" strokeWidth="3" />
                    <circle cx="370" cy="245" r="20" fill="#2E6F40" />
                    <rect x="330" y="278" width="80" height="20" rx="3" fill="#06271a" />
                    <text x="370" y="292" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" fill="#FFFFFF">{t('dashboard.pumps', 'PUMPS P1–P3')}</text>
                    {/* Roads */}
                    <path d="M 360 490 L 360 290" stroke="#D1C7B7" strokeWidth="8" strokeLinecap="square" />
                    <path d="M 360 490 L 360 290" stroke="#FAF8F5" strokeDasharray="6 6" strokeWidth="2" />
                    <path d="M 20 235 L 780 230" stroke="#D1C7B7" strokeWidth="7" />
                    <path d="M 20 235 L 780 230" stroke="#FAF8F5" strokeDasharray="6 6" strokeWidth="2" />
                    {/* Dynamic Field 2 / Sector 3 */}
                    <polygon points="45,260 330,260 320,460 35,460" fill="#FDFAF0" stroke="#D4C990" strokeWidth="2" />
                    <rect x="55" y="272" width="160" height="26" rx="4" fill="#92400E" />
                    <text x="65" y="289" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#FFFFFF">
                      {fields[2] ? `${fields[2].name} • ${translateEnum('common.enums.crops', fields[2].crop, fields[2].crop)}` : t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(3) })}
                    </text>
                    {/* Dynamic Field 3 / Sector 4 */}
                    <polygon points="400,260 745,255 735,465 390,465" fill="#FDF2F2" stroke="#EAA1A1" strokeWidth="2" />
                    <rect x="415" y="272" width="160" height="24" rx="4" fill="#FFFFFF" opacity="0.92" />
                    <text x="425" y="288" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#991B1B">
                      {fields[3] ? `${fields[3].name} • ${translateEnum('common.enums.crops', fields[3].crop, fields[3].crop)}` : t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(4) })}
                    </text>
                    {/* Tractor */}
                    <path d="M 380 430 Q 560 420 580 340 T 680 300" stroke="#296b3c" strokeDasharray="4 6" strokeWidth="2.5" fill="none" />
                    <circle cx="690" cy="300" r="14" fill="#06271a" />
                    <text x="690" y="304" fontFamily="Inter" fontSize="10" textAnchor="middle" fill="#adf3b8">🚜</text>
                  </svg>

                  {/* Map Legend */}
                  <div className="absolute bottom-3 left-3 bg-surface-container-lowest/95 px-3 py-2 rounded shadow-sm flex flex-wrap items-center gap-space-md text-on-surface-variant font-label-sm"
                    style={{ backdropFilter: 'blur(4px)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: '#B8D7B5' }} />
                      <span>{t('dashboard.crops')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5" style={{ backgroundColor: '#5E9DB3' }} />
                      <span>{t('dashboard.canal')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                      <span>{t('dashboard.iotProbes')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Field Conditions Table */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex items-center justify-between"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>tune</span>
                  <h2 className="font-headline-sm text-on-surface font-semibold">{t('dashboard.liveFieldConditions')}</h2>
                </div>
                <span className="font-label-sm text-on-surface-variant">{t('dashboard.realTimeMatrix')}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-md font-semibold">{t('dashboard.field')}</th>
                      <th className="py-2.5 px-space-md font-semibold">{t('dashboard.crop')}</th>
                      <th className="py-2.5 px-space-md font-semibold w-40">{t('dashboard.soilMoisture')}</th>
                      <th className="py-2.5 px-space-md font-semibold">{t('dashboard.ph')}</th>
                      <th className="py-2.5 px-space-md font-semibold">{t('dashboard.status')}</th>
                      <th className="py-2.5 px-space-md font-semibold">{t('dashboard.waterNeed')}</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">{t('common.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-on-surface font-body-sm" style={{ borderColor: '#eff4ff' }}>
                    {isLoading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-sm">{t('dashboard.loadingFields')}</td></tr>
                    ) : fields.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-sm">{t('dashboard.noFieldsCreate')}</td></tr>
                    ) : null}
                    {!isLoading && evaluatedFields.map(({ field, decision }) => {
                      const isCritical = decision.status === 'Critical';
                      const isAttention = decision.status === 'Attention';
                      const isHealthy = decision.status === 'Healthy';
                      const moistureColor = isCritical ? '#ba1a1a' : isAttention ? '#b45309' : '#296b3c';
                      const displayMoisture = decision.soilMoistureVal !== null ? `${formatNumber(decision.soilMoistureVal)}%` : t('common.notAvailable');
                      const displayPH = decision.soilPHVal !== null ? `${formatNumber(decision.soilPHVal)} ${t('dashboard.ph')}` : t('common.notAvailable');

                      return (
                        <tr
                          key={field.id || field.fieldId || field.docId || field.name}
                          className="transition-colors"
                          style={{
                            backgroundColor: isCritical ? 'rgba(255,218,214,0.15)' : isAttention ? 'rgba(254,243,199,0.15)' : 'transparent'
                          }}
                        >
                          <td className="py-3 px-space-md font-data-mono font-semibold" style={{ color: isCritical ? '#ba1a1a' : '#121c2a' }}>
                            {field.name}
                          </td>
                          <td className="py-3 px-space-md">{translateEnum('common.enums.crops', field.crop, field.crop)}</td>
                          <td className="py-3 px-space-md">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-surface-container-high rounded-full overflow-hidden" style={{ height: '6px' }}>
                                <div className="h-full rounded-full" style={{ width: `${decision.soilMoistureVal ?? 0}%`, backgroundColor: moistureColor }} />
                              </div>
                              <span className="font-data-mono text-label-sm" style={{ color: moistureColor }}>
                                {displayMoisture}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-space-md font-data-mono">
                            {displayPH}
                          </td>
                          <td className="py-3 px-space-md">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                                style={{ backgroundColor: 'rgba(255,218,214,0.8)' }}
                                title={decision.reasons.map(translateDecisionReason).join('\n')}>
                                {t('status.critical')}
                              </span>
                            ) : isAttention ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold"
                                title={decision.reasons.map(translateDecisionReason).join('\n')}>
                                {t('status.attention')}
                              </span>
                            ) : isHealthy ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                                style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}
                                title={decision.reasons.map(translateDecisionReason).join('\n')}>
                                {t('status.healthy')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-surface-variant bg-surface-container font-label-sm font-semibold"
                                title={decision.reasons.map(translateDecisionReason).join('\n')}>
                                {translateEnum('status', decision.status, decision.status)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-space-md text-on-surface font-medium">
                            {translateEnum('common.enums.waterRequirements', decision.waterNeed, decision.waterNeed)}
                          </td>
                          <td className="py-3 px-space-md text-right">
                            {decision.action === 'Pathogen AI' ? (
                              <button
                                className="px-2 py-0.5 rounded bg-error text-on-error font-label-sm font-semibold hover:opacity-90 cursor-pointer"
                                type="button"
                                title={decision.reasons.map(translateDecisionReason).join('\n')}
                                onClick={() => window.location.href = decision.actionRoute}
                              >
                                {translateEnum('common.enums.recommendations', decision.action, decision.action)}
                              </button>
                            ) : decision.action === 'Queue Run' ? (
                              <button
                                className="text-amber-800 hover:text-amber-900 font-label-sm font-semibold cursor-pointer"
                                type="button"
                                title={decision.reasons.map(translateDecisionReason).join('\n')}
                                onClick={() => window.location.href = decision.actionRoute}
                              >
                                {translateEnum('common.enums.recommendations', decision.action, decision.action)}
                              </button>
                            ) : (
                              <button
                                className="text-secondary hover:text-primary font-label-sm font-semibold cursor-pointer"
                                type="button"
                                title={decision.reasons.map(translateDecisionReason).join('\n')}
                                onClick={() => window.location.href = decision.actionRoute}
                              >
                                {translateEnum('common.enums.recommendations', decision.action, decision.action)}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Task Feed + AI Modules */}
          <div className="xl:col-span-5 flex flex-col gap-space-xl">

            {/* Today's Task Feed */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex items-center justify-between"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>calendar_today</span>
                  <h2 className="font-headline-sm text-on-surface font-semibold">{t('dashboard.taskActivityFeed')}</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm font-semibold">
                  {t('common.items', { count: formatNumber(fields.length) })}
                </span>
              </div>
              <div className="p-space-lg flex flex-col gap-space-md">
                {fields.length > 0 ? (
                  <>
                    {/* Feed Item 1: Primary field check */}
                    <div className="flex items-start gap-space-md relative pb-space-md">
                      <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                      </div>
                      <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-surface-container" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-label-sm font-semibold text-secondary">06:00 — {t('status.completed')}</span>
                          <span className="font-data-mono text-label-sm text-on-surface-variant">{fields[0]?.name}</span>
                        </div>
                        <div className="font-body-sm text-on-surface font-medium mt-0.5">{t('dashboard.automatedMoistureCheck')}</div>
                        <div className="font-body-sm text-on-surface-variant mt-0.5">
                          {t('dashboard.standardMoisture', {
                            value: fields[0]?.soilMoisture !== undefined && fields[0]?.soilMoisture !== null
                              ? formatNumber(fields[0].soilMoisture)
                              : t('dashboard.standardMoistureLabel', 'Standard'),
                            crop: translateEnum('common.enums.crops', fields[0]?.crop, fields[0]?.crop),
                          })}
                        </div>
                      </div>
                    </div>
                    {/* Feed Item 2: Status check */}
                    <div className="flex items-start gap-space-md relative pb-space-md">
                      <div className={`w-7 h-7 rounded-full ${fields[fields.length - 1]?.status === 'Critical' ? 'bg-error-container text-error' : 'bg-surface-container text-secondary'} flex items-center justify-center shrink-0 mt-0.5 z-10`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {fields[fields.length - 1]?.status === 'Critical' ? 'notification_important' : 'opacity'}
                        </span>
                      </div>
                      <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-surface-container" />
                      <div className="flex flex-col min-w-0 flex-1 p-space-sm rounded-lg" style={{ backgroundColor: fields[fields.length - 1]?.status === 'Critical' ? 'rgba(255,218,214,0.2)' : 'transparent' }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-label-sm font-bold ${fields[fields.length - 1]?.status === 'Critical' ? 'text-error' : 'text-on-surface'}`}>
                            08:30 — {fields[fields.length - 1]?.status === 'Critical' ? t('status.aiAlert') : t('status.statusUpdate')}
                          </span>
                          <span className="font-data-mono text-label-sm text-on-surface-variant font-semibold">{fields[fields.length - 1]?.name}</span>
                        </div>
                        <div className="font-body-sm text-on-surface font-semibold mt-0.5">{t('dashboard.soilStatus', 'Soil Status: {value}', { value: translateEnum('status', fields[fields.length - 1]?.status, fields[fields.length - 1]?.status) })}</div>
                        <div className="font-body-sm text-on-surface-variant mt-0.5">
                          {t('dashboard.telemetryReadingWithLabel', '{value} moisture reading for {crop}.', {
                            value: fields[fields.length - 1]?.soilMoisture !== undefined && fields[fields.length - 1]?.soilMoisture !== null
                              ? `${formatNumber(fields[fields.length - 1]?.soilMoisture ?? 0)}%`
                              : t('dashboard.telemetryLabel', 'Telemetry'),
                            crop: translateEnum('common.enums.crops', fields[fields.length - 1]?.crop, fields[fields.length - 1]?.crop),
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-on-surface-variant font-body-sm">
                    {t('dashboard.noFieldTasks')}
                  </div>
                )}
              </div>
            </div>

            {/* AI Modules Status */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-space-lg py-space-md flex items-center justify-between"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>model_training</span>
                  <h2 className="font-headline-sm text-on-surface font-semibold">{t('dashboard.aiModuleStatus')}</h2>
                </div>
                <Link to="/ai-analysis" className="font-label-sm text-secondary hover:text-primary transition-colors">
                  {t('common.viewAll')} →
                </Link>
              </div>
              <div className="p-space-lg grid grid-cols-2 gap-space-sm">
                {AI_MODULES.slice(0, 6).map((module) => {
                  const isReady = module.week === 1;
                  return (
                    <div key={module.id} className="p-space-sm rounded-lg flex flex-col gap-1"
                      style={{ backgroundColor: isReady ? 'rgba(173,243,184,0.1)' : 'rgba(230,238,255,0.3)' }}>
                      <div className="flex items-center justify-between">
                        <span className="font-data-mono font-semibold text-label-sm text-on-surface truncate">
                          {moduleNameKeys[module.id] ? t(moduleNameKeys[module.id]) : module.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isReady ? 'bg-secondary' : 'bg-outline'}`} />
                      </div>
                      <div className="font-label-sm text-on-surface-variant truncate">{t(moduleCategoryKeys[module.category], module.category)}</div>
                      <div className="font-label-sm font-semibold" style={{ color: isReady ? '#296b3c' : '#727974' }}>
                        {isReady ? t('status.active') : t('dashboard.comingSoon')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
