import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AI_MODULES } from '../data/sampleFields';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Field } from '../types';
import { ECOSYSTEM_UPDATED_EVENT, getFarms } from '../services/ecosystem';

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
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

  const totalFields = fields.length;
  const healthyFields = fields.filter((f) => f.status === 'Healthy').length;
  const dryFields = fields.filter((f) => f.status === 'Dry' || f.status === 'Moderate').length;
  const criticalFields = fields.filter((f) => f.status === 'Critical').length;
  const waterAvailability = 64200; // Reservoir capacity liters

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1640px] mx-auto px-margin md:px-margin-lg py-space-xl flex flex-col gap-space-xl">

        {/* Top Greeting & Operational Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-secondary uppercase tracking-widest font-semibold">
                {farmName} — Sector 4
              </span>
              <span className="text-outline-variant font-label-sm">•</span>
              <span className="inline-flex items-center gap-1 font-label-sm text-on-surface-variant">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLiveData ? 'bg-secondary animate-pulse' : 'bg-outline'}`} />
                {isLoading ? 'Loading field data…' : isLiveData ? 'Live database fields' : 'Demo data — Sample fields active'}
              </span>
            </div>
            <h1 className="font-headline-lg text-on-surface font-semibold tracking-tight">
              Good morning, {userProfile?.fullName || 'Farm Operator'}
            </h1>
            <p className="font-body-md text-on-surface-variant">
              {farmArea} hectares actively monitored across {totalFields} fields. {criticalFields} critical action{criticalFields !== 1 ? 's' : ''} flagged.
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
              <span>Quick Field Scan</span>
            </Link>
            <Link
              to="/ai-analysis"
              className="flex items-center gap-space-xs px-space-md h-9 bg-primary-container text-on-primary font-label-md rounded-lg shadow-sm transition-all duration-150 hover:opacity-90"
            >
              <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '18px' }}>
                auto_awesome
              </span>
              <span>AI Analysis</span>
            </Link>
          </div>
        </div>

        {/* KPI Metric Summary Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {/* Monitored Fields */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">Monitored Fields</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {totalFields}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">Fields</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">All sectors active</div>
            </div>
            <div className="flex items-center gap-1.5 pt-space-xs font-label-sm font-medium" style={{ color: isLiveData ? '#296b3c' : undefined }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{isLiveData ? 'cloud_done' : 'add_circle'}</span>
              <span>{isLiveData ? 'Live database' : 'Demo dataset'}</span>
            </div>
          </div>

          {/* Healthy Status */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">Healthy Status</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {healthyFields}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">Fields</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">Optimal conditions</div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                Normal Growth
              </span>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">Needs Attention</span>
              <span className="material-symbols-outlined text-amber-700" style={{ fontSize: '18px' }}>warning</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {dryFields}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">Fields</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">
                {fields.filter(f => f.status === 'Dry' || f.status === 'Moderate').map(f => f.name).join(' & ') || 'No dry fields'}
              </div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                Water Deficit
              </span>
            </div>
          </div>

          {/* Critical Status */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">Critical Action</span>
              <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>emergency</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-error font-semibold tracking-tight">
                {criticalFields}{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">Field</span>
              </div>
              <div className="font-body-sm text-on-surface font-medium mt-0.5">
                {fields.filter(f => f.status === 'Critical').map(f => `${f.name} (${f.crop})`).join(', ') || 'None'}
              </div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,218,214,0.6)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-error inline-block animate-pulse" />
                Urgent Attention
              </span>
            </div>
          </div>

          {/* Water Reserves */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-sm uppercase tracking-wider font-semibold">Reservoir Reserves</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>water</span>
            </div>
            <div className="my-space-xs">
              <div className="font-display-lg text-on-surface font-semibold tracking-tight">
                {(waterAvailability / 1000).toFixed(1)}k{' '}
                <span className="font-headline-sm text-on-surface-variant font-normal">L</span>
              </div>
              <div className="font-body-sm text-on-surface-variant mt-0.5">78% total capacity</div>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <div className="w-full bg-surface-container-high rounded-full mr-2 overflow-hidden" style={{ height: '6px' }}>
                <div className="bg-secondary h-full rounded-full" style={{ width: '78%' }} />
              </div>
              <span className="font-data-mono text-label-sm text-secondary shrink-0">+14h</span>
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
                  <h2 className="font-headline-sm text-on-surface font-semibold">Farm Spatial Map &amp; Sensor Nodes</h2>
                  <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono text-label-sm text-on-surface-variant">
                    GPS: 36.677° N, 121.655° W
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
                    {fields.length} Nodes Active
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
                      {fields[0] ? `${fields[0].name} • ${fields[0].crop}` : 'Sector 1'}
                    </text>
                    <text x="75" y="112" fontFamily="Inter" fontSize="11" fill="#424844">
                      {fields[0] ? `${fields[0].status} • ${fields[0].soilMoisture !== undefined && fields[0].soilMoisture !== null ? `${fields[0].soilMoisture}%` : 'Telemetry pending'} Moisture` : 'No Telemetry'}
                    </text>
                    {/* Dynamic Field 1 / Sector 2 */}
                    <polygon points="380,45 740,40 730,210 390,210" fill="#FBF3DE" stroke="#E6D3A3" strokeWidth="2" />
                    <rect x="400" y="55" width="150" height="24" rx="4" fill="#FFFFFF" opacity="0.92" />
                    <text x="410" y="71" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#4E3E1A">
                      {fields[1] ? `${fields[1].name} • ${fields[1].crop}` : 'Sector 2'}
                    </text>
                    <text x="410" y="102" fontFamily="Inter" fontSize="11" fill="#6B5B30">
                      {fields[1] ? `${fields[1].status} • ${fields[1].soilMoisture !== undefined && fields[1].soilMoisture !== null ? `${fields[1].soilMoisture}%` : 'Telemetry pending'} Moisture` : 'No Telemetry'}
                    </text>
                    {/* Central Water Hub */}
                    <circle cx="370" cy="245" r="28" fill="#1E3D2F" stroke="#FFFFFF" strokeWidth="3" />
                    <circle cx="370" cy="245" r="20" fill="#2E6F40" />
                    <rect x="330" y="278" width="80" height="20" rx="3" fill="#06271a" />
                    <text x="370" y="292" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" fill="#FFFFFF">PUMPS P1-P3</text>
                    {/* Roads */}
                    <path d="M 360 490 L 360 290" stroke="#D1C7B7" strokeWidth="8" strokeLinecap="square" />
                    <path d="M 360 490 L 360 290" stroke="#FAF8F5" strokeDasharray="6 6" strokeWidth="2" />
                    <path d="M 20 235 L 780 230" stroke="#D1C7B7" strokeWidth="7" />
                    <path d="M 20 235 L 780 230" stroke="#FAF8F5" strokeDasharray="6 6" strokeWidth="2" />
                    {/* Dynamic Field 2 / Sector 3 */}
                    <polygon points="45,260 330,260 320,460 35,460" fill="#FDFAF0" stroke="#D4C990" strokeWidth="2" />
                    <rect x="55" y="272" width="160" height="26" rx="4" fill="#92400E" />
                    <text x="65" y="289" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#FFFFFF">
                      {fields[2] ? `${fields[2].name} • ${fields[2].crop}` : 'Sector 3'}
                    </text>
                    {/* Dynamic Field 3 / Sector 4 */}
                    <polygon points="400,260 745,255 735,465 390,465" fill="#FDF2F2" stroke="#EAA1A1" strokeWidth="2" />
                    <rect x="415" y="272" width="160" height="24" rx="4" fill="#FFFFFF" opacity="0.92" />
                    <text x="425" y="288" fontFamily="Inter" fontSize="12" fontWeight="600" fill="#991B1B">
                      {fields[3] ? `${fields[3].name} • ${fields[3].crop}` : 'Sector 4'}
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
                      <span>Crops</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-4 h-0.5" style={{ backgroundColor: '#5E9DB3' }} />
                      <span>Canal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                      <span>IoT Probes</span>
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
                  <h2 className="font-headline-sm text-on-surface font-semibold">Live Field Conditions Monitoring</h2>
                </div>
                <span className="font-label-sm text-on-surface-variant">Real-time Soil &amp; Microclimate Matrix</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wider">
                      <th className="py-2.5 px-space-md font-semibold">Field</th>
                      <th className="py-2.5 px-space-md font-semibold">Crop</th>
                      <th className="py-2.5 px-space-md font-semibold w-40">Soil Moisture</th>
                      <th className="py-2.5 px-space-md font-semibold">pH</th>
                      <th className="py-2.5 px-space-md font-semibold">Status</th>
                      <th className="py-2.5 px-space-md font-semibold">Water Need</th>
                      <th className="py-2.5 px-space-md font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-on-surface font-body-sm" style={{ borderColor: '#eff4ff' }}>
                    {isLoading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-sm">Loading fields from database…</td></tr>
                    ) : fields.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-sm">No fields found. Create a field to get started.</td></tr>
                    ) : null}
                    {!isLoading && fields.map((field) => {
                      const isCritical = field.status === 'Critical';
                      const isWarning = field.status === 'Dry' || field.status === 'Moderate';
                      const moistureColor = isCritical ? '#ba1a1a' : isWarning ? '#b45309' : '#296b3c';
                      return (
                        <tr
                          key={field.id}
                          className="transition-colors"
                          style={{
                            backgroundColor: isCritical ? 'rgba(255,218,214,0.15)' : isWarning ? 'rgba(254,243,199,0.15)' : 'transparent'
                          }}
                        >
                          <td className="py-3 px-space-md font-data-mono font-semibold" style={{ color: isCritical ? '#ba1a1a' : '#121c2a' }}>
                            {field.name}
                          </td>
                          <td className="py-3 px-space-md">{field.crop}</td>
                          <td className="py-3 px-space-md">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-surface-container-high rounded-full overflow-hidden" style={{ height: '6px' }}>
                                <div className="h-full rounded-full" style={{ width: `${field.soilMoisture ?? 0}%`, backgroundColor: moistureColor }} />
                              </div>
                              <span className="font-data-mono text-label-sm" style={{ color: moistureColor }}>
                                {field.soilMoisture !== undefined && field.soilMoisture !== null ? `${field.soilMoisture}%` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-space-md font-data-mono">
                            {field.soilPH !== undefined && field.soilPH !== null ? `${field.soilPH} pH` : 'N/A'}
                          </td>
                          <td className="py-3 px-space-md">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                                style={{ backgroundColor: 'rgba(255,218,214,0.8)' }}>
                                Critical
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold">
                                Attention
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                                style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}>
                                Healthy
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-space-md text-on-surface-variant">
                            {field.waterRequirement || (field as any).waterNeed || (field as any).waterPriority || (field.status === 'Critical' ? 'Urgent' : field.status === 'Dry' || field.status === 'Moderate' ? 'High' : 'Low')}
                          </td>
                          <td className="py-3 px-space-md text-right">
                            {isCritical ? (
                              <button
                                className="px-2 py-0.5 rounded bg-error text-on-error font-label-sm font-semibold hover:opacity-90"
                                type="button"
                                onClick={() => window.location.href = '/disease-detection'}
                              >
                                Pathogen AI
                              </button>
                            ) : isWarning ? (
                              <button
                                className="text-amber-800 hover:text-amber-900 font-label-sm font-semibold"
                                type="button"
                                onClick={() => window.location.href = '/irrigation-planner'}
                              >
                                Queue Run
                              </button>
                            ) : (
                              <button
                                className="text-secondary hover:text-primary font-label-sm font-semibold"
                                type="button"
                                onClick={() => window.location.href = '/fields'}
                              >
                                Inspect
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
                  <h2 className="font-headline-sm text-on-surface font-semibold">Today's Task &amp; AI Activity Feed</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm font-semibold">
                  {fields.length} Items
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
                          <span className="font-label-sm font-semibold text-secondary">06:00 AM — COMPLETED</span>
                          <span className="font-data-mono text-label-sm text-on-surface-variant">{fields[0]?.name}</span>
                        </div>
                        <div className="font-body-sm text-on-surface font-medium mt-0.5">Automated Soil Moisture Check</div>
                        <div className="font-body-sm text-on-surface-variant mt-0.5">
                          {fields[0]?.soilMoisture !== undefined && fields[0]?.soilMoisture !== null ? `${fields[0]?.soilMoisture}%` : 'Standard'} moisture confirmed ({fields[0]?.crop}). AC-3 constraint satisfied.
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
                            08:30 AM — {fields[fields.length - 1]?.status === 'Critical' ? 'AI ALERT' : 'STATUS UPDATE'}
                          </span>
                          <span className="font-data-mono text-label-sm text-on-surface-variant font-semibold">{fields[fields.length - 1]?.name}</span>
                        </div>
                        <div className="font-body-sm text-on-surface font-semibold mt-0.5">Soil Status: {fields[fields.length - 1]?.status}</div>
                        <div className="font-body-sm text-on-surface-variant mt-0.5">
                          {fields[fields.length - 1]?.soilMoisture !== undefined && fields[fields.length - 1]?.soilMoisture !== null ? `${fields[fields.length - 1]?.soilMoisture}%` : 'Telemetry'} moisture reading for {fields[fields.length - 1]?.crop}.
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-on-surface-variant font-body-sm">
                    No field tasks recorded. Database contains 0 active fields.
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
                  <h2 className="font-headline-sm text-on-surface font-semibold">AI Module Status</h2>
                </div>
                <Link to="/ai-analysis" className="font-label-sm text-secondary hover:text-primary transition-colors">
                  View All →
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
                          {module.name.split(' ')[0]}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isReady ? 'bg-secondary' : 'bg-outline'}`} />
                      </div>
                      <div className="font-label-sm text-on-surface-variant truncate">{module.category}</div>
                      <div className="font-label-sm font-semibold" style={{ color: isReady ? '#296b3c' : '#727974' }}>
                        {isReady ? 'Active' : 'Coming Soon'}
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
