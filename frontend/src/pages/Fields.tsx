import React, { useEffect, useState } from 'react';
import type { Field } from '../types';
import { apiService } from '../services/api';
import { ECOSYSTEM_UPDATED_EVENT } from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';

type FilterStatus = 'all' | 'Healthy' | 'Moderate' | 'Dry' | 'Critical';

export const Fields: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

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
        setError('Unable to load fields from database.');
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
      moistureDisplay: decision.soilMoistureVal !== null ? `${decision.soilMoistureVal}%` : 'Not available',
      phDisplay: decision.soilPHVal !== null ? `${decision.soilPHVal} pH` : 'Not available',
      tempDisplay: decision.temperatureVal !== null ? `${decision.temperatureVal}°C` : 'Not available',
      rainDisplay: decision.rainfallVal !== null ? `${decision.rainfallVal} mm` : 'Not available',
      humidityDisplay: decision.humidityVal !== null ? `${decision.humidityVal}%` : 'Not available',
      waterRequirement: decision.waterNeed,
      action: decision.action,
      actionRoute: decision.actionRoute,
      reasons: decision.reasons,
      areaDisplay: f.areaAcres !== undefined && f.areaAcres !== null ? `${f.areaAcres} Acres` : (f.area ? `${f.area}` : 'Not available'),
      soilType: f.soilType || 'Not available',
      status: decision.status,
      latDisplay: f.latitude !== undefined && f.latitude !== null ? `${f.latitude}` : 'Not available',
      lngDisplay: f.longitude !== undefined && f.longitude !== null ? `${f.longitude}` : 'Not available',
      farmerName: f.assignedFarmerName || f.farmerName || (f.assignedFarmerId ? 'Assigned' : 'Unassigned'),
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
              <span>Main</span>
              <span className="text-outline">/</span>
              <span>Field Directory</span>
            </div>
            <h1 className="font-display-lg text-primary tracking-tight">Fields</h1>
            <p className="font-body-md text-on-surface-variant">
              Environmental data directory — real-time telemetry and agronomic metrics per field sector.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface-variant font-label-sm font-medium"
              style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
              <span className="w-2 h-2 rounded-full bg-secondary inline-block animate-pulse" />
              Live Database ({fields.length} Fields)
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
              placeholder="Search fields or crops..."
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
                {status === 'all' ? `All (${fields.length})` : status}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-space-md rounded-lg bg-amber-50 text-amber-900 font-body-sm flex items-center gap-space-sm"
            style={{ border: '1px solid #fcd34d' }}>
            <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '18px' }}>info</span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-space-md">
            <div className="w-10 h-10 rounded-full border-2 border-primary-container animate-spin"
              style={{ borderTopColor: '#1e3d2f' }} />
            <p className="font-body-md text-on-surface-variant">Loading field dataset...</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-space-md">
            <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: '64px' }}>
              layers
            </span>
            <p className="font-headline-sm text-on-surface-variant">No fields found</p>
            <p className="font-body-sm text-on-surface-variant">Try adjusting your filter or search query.</p>
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
                        <div className="font-body-sm text-on-surface-variant">Crop: <strong className="text-on-surface">{field.crop}</strong></div>
                      </div>
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error font-label-sm font-semibold"
                          style={{ backgroundColor: 'rgba(255,218,214,0.8)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-error inline-block animate-pulse" />
                          Critical
                        </span>
                      ) : isAttention ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-800 bg-amber-100 font-label-sm font-semibold">
                          Attention
                        </span>
                      ) : isInsufficient ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-surface-variant bg-surface-container font-label-sm font-semibold">
                          No Data
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-on-secondary-container font-label-sm font-semibold"
                          style={{ backgroundColor: 'rgba(173,243,184,0.4)' }}>
                          Healthy
                        </span>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="p-space-md grid grid-cols-2 gap-space-sm">
                      {[
                        { icon: 'water_drop', label: 'Soil Moisture', value: m.moistureDisplay },
                        { icon: 'science', label: 'Soil pH', value: m.phDisplay },
                        { icon: 'thermostat', label: 'Temperature', value: m.tempDisplay },
                        { icon: 'rainy', label: 'Rainfall', value: m.rainDisplay },
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
                      <span className="font-label-sm text-on-surface-variant">Water Need:</span>
                      <span className={`font-label-sm font-semibold ${
                        m.waterRequirement === 'Urgent' || m.waterRequirement === 'High'
                          ? 'text-error'
                          : m.waterRequirement === 'Moderate'
                          ? 'text-amber-700'
                          : m.waterRequirement === 'Low'
                          ? 'text-secondary'
                          : 'text-on-surface-variant'
                      }`}>
                        {m.waterRequirement}
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
                <h2 className="font-headline-sm text-on-surface font-semibold">Field Detail</h2>
              </div>

              <div className="flex-1 p-space-lg">
                {selectedField ? (() => {
                  const sm = getMetrics(selectedField);
                  return (
                    <div className="space-y-space-md">
                      <div className="p-space-md bg-surface-container-low rounded-lg">
                        <div className="font-headline-sm text-on-surface">{selectedField.name}</div>
                        <div className="font-body-sm text-on-surface-variant font-medium">Crop: {selectedField.crop}</div>
                      </div>

                      {/* Moisture bar */}
                      <div>
                        <div className="flex items-center justify-between mb-space-xs">
                          <span className="font-label-sm text-on-surface-variant">Soil Moisture</span>
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
                          { label: 'Status', value: sm.status },
                          { label: 'Area', value: sm.areaDisplay },
                          { label: 'Soil Type', value: sm.soilType },
                          { label: 'Soil pH', value: sm.phDisplay },
                          { label: 'Temperature', value: sm.tempDisplay },
                          { label: 'Humidity', value: sm.humidityDisplay },
                          { label: 'Rainfall', value: sm.rainDisplay },
                          { label: 'Water Need', value: sm.waterRequirement },
                          { label: 'Recommended Action', value: sm.action },
                          { label: 'Assigned Farmer', value: sm.farmerName },
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
                            Decision Reasons
                          </div>
                          <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                            {sm.reasons.map((r, idx) => (
                              <li key={idx} className="leading-snug">{r}</li>
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
                          Execute {sm.action}
                        </button>
                        <button
                          className="w-full h-9 bg-surface-container-lowest text-on-surface rounded-lg font-label-md font-semibold flex items-center justify-center gap-space-xs cursor-pointer"
                          style={{ border: '1px solid rgba(193,200,194,0.4)' }}
                          onClick={() => window.location.href = '/disease-detection'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>analytics</span>
                          Analyze Leaf Image
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
                      Select a field card to view detailed metrics.
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
