import React, { useState, useEffect } from 'react';
import type { Field } from '../types';
import { apiService } from '../services/api';
import { firestoreService } from '../services/firebase';
import { ECOSYSTEM_UPDATED_EVENT, getFarms, notifyEcosystemChange } from '../services/ecosystem';
import { evaluateFieldDecision } from '../utils/decisionEngine';

export const MyFarm: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newCropType, setNewCropType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmArea, setFarmArea] = useState<number>(0);

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
      alert('Please enter both Field Name and Crop Type.');
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      alert('Field created in local view.');
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
              <span>Enterprise Core</span>
              <span className="text-outline">/</span>
              <span>Spatial Asset Registry</span>
            </div>
            <h1 className="font-display-lg text-primary tracking-tight">My Farm</h1>
            <p className="font-body-md text-on-surface-variant">
              Manage operational farm boundaries, parcels, IoT telemetry networks, and agronomic regimes.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              className="inline-flex items-center gap-space-xs px-space-md h-9 bg-primary-container text-on-primary hover:opacity-90 transition-colors rounded-lg shadow-sm font-label-md font-semibold cursor-pointer"
              onClick={() => setShowAddModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              <span>+ Add Field</span>
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
                  Primary Enterprise Site
                </span>
              </div>

              {/* Dossier Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mb-space-lg">
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">Total Area</span>
                  <span className="font-headline-sm text-on-surface font-semibold">{farmArea} Hectares</span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">Monitored Parcels</span>
                  <span className="font-headline-sm text-on-surface font-semibold">{fields.length} Sectors</span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">Primary Crops</span>
                  <span className="font-headline-sm text-on-surface font-semibold truncate block">
                    {Array.from(new Set(fields.map((f) => f.crop))).filter(Boolean).join(', ') || 'None'}
                  </span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-lg">
                  <span className="font-label-sm text-on-surface-variant block uppercase">Soil Classification</span>
                  <span className="font-headline-sm text-on-surface font-semibold">Silty Clay Loam</span>
                </div>
              </div>

              {/* Fields Table */}
              <h3 className="font-headline-sm text-on-surface font-semibold mb-space-xs">Registered Land Parcels</h3>
              <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(193,200,194,0.3)' }}>
                <table className="w-full text-left font-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase">
                      <th className="py-space-xs px-space-md font-semibold">Sector / ID</th>
                      <th className="py-space-xs px-space-md font-semibold">Crop</th>
                      <th className="py-space-xs px-space-md font-semibold">Moisture</th>
                      <th className="py-space-xs px-space-md font-semibold">Status</th>
                      <th className="py-space-xs px-space-md font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low text-on-surface">
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-on-surface-variant font-body-sm">
                          No fields found in database. Click "+ Add Field" to create your first field parcel.
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
                            <td className="py-space-sm px-space-md">{f.crop}</td>
                            <td className="py-space-sm px-space-md font-data-mono">
                              {fdec.soilMoistureVal !== null ? `${fdec.soilMoistureVal}% VWC` : 'N/A'}
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
                                {fdec.status}
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
                                Inspect
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
                <h3 className="font-headline-sm text-primary">Field Telemetry Inspector</h3>
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>info</span>
              </div>

              {selectedField ? (() => {
                const dec = evaluateFieldDecision(selectedField);
                const area = selectedField.areaAcres !== undefined && selectedField.areaAcres !== null
                  ? `${selectedField.areaAcres} Acres`
                  : ((selectedField as any).area ? `${(selectedField as any).area}` : 'Not available');
                const soilType = selectedField.soilType || 'Not available';
                const farmerName = selectedField.assignedFarmerName || (selectedField as any).farmerName || (selectedField.assignedFarmerId ? 'Assigned' : 'Unassigned');
                const isCritical = dec.status === 'Critical';
                const isAttention = dec.status === 'Attention';

                return (
                  <div className="space-y-space-md text-body-sm text-on-surface">
                    <div>
                      <span className="font-label-sm text-on-surface-variant uppercase block">Selected Sector</span>
                      <span className="font-headline-sm text-primary font-semibold">{selectedField.name} ({selectedField.crop})</span>
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
                        Status: {dec.status}
                      </span>
                      <span className="ml-auto font-label-sm text-on-surface-variant">
                        Water: <strong>{dec.waterNeed}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-space-xs text-xs bg-surface p-2.5 rounded border border-outline-variant/20">
                      <div>Area: <strong>{area}</strong></div>
                      <div>Soil: <strong>{soilType}</strong></div>
                      <div>Action: <strong>{dec.action}</strong></div>
                      <div>Worker: <strong>{farmerName}</strong></div>
                    </div>

                    <div className="grid grid-cols-2 gap-space-xs font-data-mono">
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">SOIL MOISTURE</span>
                        <span className="font-semibold text-primary">
                          {dec.soilMoistureVal !== null ? `${dec.soilMoistureVal}%` : 'Not available'}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">SOIL pH</span>
                        <span className="font-semibold text-primary">
                          {dec.soilPHVal !== null ? `${dec.soilPHVal} pH` : 'Not available'}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">TEMPERATURE</span>
                        <span className="font-semibold text-primary">
                          {dec.temperatureVal !== null ? `${dec.temperatureVal}°C` : 'Not available'}
                        </span>
                      </div>
                      <div className="bg-surface-container p-space-xs rounded">
                        <span className="text-on-surface-variant text-[11px] block">HUMIDITY</span>
                        <span className="font-semibold text-primary">
                          {dec.humidityVal !== null ? `${dec.humidityVal}%` : 'Not available'}
                        </span>
                      </div>
                    </div>

                    {/* Decision Reasons */}
                    {dec.reasons && dec.reasons.length > 0 && (
                      <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1">
                        <div className="font-label-sm font-semibold text-secondary flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>psychology</span>
                          AI Decision Reasons
                        </div>
                        <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                          {dec.reasons.map((r, idx) => (
                            <li key={idx} className="leading-snug">{r}</li>
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
                      Execute: {dec.action}
                    </button>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <span className="material-symbols-outlined text-on-surface-variant opacity-30" style={{ fontSize: '48px' }}>
                    touch_app
                  </span>
                  <p className="font-body-sm text-on-surface-variant mt-space-sm">
                    Click any field row to inspect its properties and telemetry.
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
              <h2 className="font-headline-sm text-on-surface font-semibold">Add New Field</h2>
              <button className="text-on-surface-variant cursor-pointer" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>
            <div className="space-y-space-md">
              <div>
                <label className="font-label-sm text-on-surface-variant block mb-space-xs">Field Name</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Field E"
                  className="w-full h-9 px-space-md bg-surface-container-lowest text-on-surface font-body-md rounded-lg outline-none"
                  style={{ border: '1px solid #c1c8c2' }}
                />
              </div>
              <div>
                <label className="font-label-sm text-on-surface-variant block mb-space-xs">Crop Type</label>
                <input
                  type="text"
                  value={newCropType}
                  onChange={(e) => setNewCropType(e.target.value)}
                  placeholder="e.g. Wheat"
                  className="w-full h-9 px-space-md bg-surface-container-lowest text-on-surface font-body-md rounded-lg outline-none"
                  style={{ border: '1px solid #c1c8c2' }}
                />
              </div>
              <div className="pt-space-sm flex gap-space-sm">
                <button
                  className="flex-1 h-9 bg-surface-container text-on-surface rounded-lg font-label-md font-semibold cursor-pointer"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 h-9 bg-primary-container text-on-primary rounded-lg font-label-md font-semibold hover:opacity-90 cursor-pointer disabled:opacity-50"
                  onClick={handleCreateField}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Create Field'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
