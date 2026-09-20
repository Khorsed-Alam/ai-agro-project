import React, { useState, useEffect } from 'react';
import { AI_MODULES } from '../data/sampleFields';
import { apiService } from '../services/api';
import type { Field } from '../types';

type ActiveTab = 'all' | 'clustering' | 'rules' | 'csp' | 'astar';

interface ModuleResult {
  moduleId: string;
  status: string;
  message: string;
}

export const AIAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [runningModule, setRunningModule] = useState<string | null>(null);
  const [results, setResults] = useState<ModuleResult[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    apiService.getFields().then((data) => setFields(data || [])).catch(() => setFields([]));
  }, []);

  const runModule = async (algorithmId: string, name: string) => {
    setRunningModule(algorithmId);
    const result = await apiService.runAlgorithmPlaceholder(algorithmId);
    setResults(prev => [{
      moduleId: algorithmId,
      status: result.status || 'completed',
      message: result.message || `${name} execution completed.`
    }, ...prev.slice(0, 4)]);
    setRunningModule(null);
  };

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'all', label: 'All Active Pipelines (4)' },
    { id: 'clustering', label: 'Field Clustering (K-Means)' },
    { id: 'rules', label: 'Recommendations (Decision Tree)' },
    { id: 'csp', label: 'Irrigation (CSP & AC-3)' },
    { id: 'astar', label: 'Tractor Pathfinding (A*)' },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] mx-auto w-full">

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '15px' }}>model_training</span>
              <span>Inference Engine v2.4</span>
              <span>•</span>
              <span>Salinas Valley Operational Grid</span>
            </div>
            <h1 className="font-display-lg text-on-surface tracking-tight font-semibold">
              AI Decision Support &amp; Model Insights
            </h1>
            <p className="font-body-lg text-on-surface-variant">
              Integrated machine learning and classical AI algorithms applied to multi-field farm telemetry
            </p>
          </div>

          {/* Engine Status */}
          <div className="flex items-center gap-space-sm self-start lg:self-auto shrink-0 bg-surface-container-low px-space-md py-space-sm rounded-xl shadow-sm">
            <span className="relative flex" style={{ width: '10px', height: '10px' }}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
            </span>
            <div className="flex flex-col">
              <span className="font-label-sm text-on-surface font-semibold">FastAPI Engine: Active • Inference Latency: 42ms</span>
              <span className="font-label-sm text-on-surface-variant">PyTorch 2.2.1 • Scikit-learn 1.4 • Demo Mode</span>
            </div>
          </div>
        </div>

        {/* Tab Filter Bar */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn px-space-md py-space-xs rounded-lg font-label-md transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm'
              }`}
              style={activeTab !== tab.id ? { border: '1px solid rgba(193,200,194,0.4)' } : {}}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Result Notification */}
        {results.length > 0 && (
          <div className="flex items-start gap-space-sm p-space-md bg-surface-container-low rounded-xl"
            style={{ border: '1px solid rgba(173,243,184,0.4)' }}>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
            <div>
              <div className="font-label-sm text-secondary font-semibold">{results[0].moduleId.toUpperCase()} — Completed</div>
              <div className="font-body-sm text-on-surface-variant">{results[0].message}</div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-gutter-lg">

          {/* K-Means Clustering Module */}
          {(activeTab === 'all' || activeTab === 'clustering') && (
            <section className="col-span-12 xl:col-span-7 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)' }}>
                <div className="flex items-center gap-space-sm">
                  <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bubble_chart</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-on-surface">Field Environmental Clustering</span>
                      <span className="font-label-sm px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">k=4</span>
                    </div>
                    <p className="font-label-md text-on-surface-variant">Unsupervised topology grouping (Soil Moisture % vs Ambient Temp °C)</p>
                  </div>
                </div>
                <div className="flex items-center gap-space-md text-right shrink-0">
                  <div>
                    <span className="font-label-sm text-on-surface-variant block uppercase tracking-wider">Silhouette</span>
                    <span className="font-data-mono font-headline-sm text-secondary font-semibold">0.74</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-on-surface-variant block uppercase tracking-wider">Inertia</span>
                    <span className="font-data-mono font-headline-sm text-on-surface font-semibold">184.2</span>
                  </div>
                </div>
              </div>

              <div className="p-space-lg flex flex-col gap-space-lg">
                {/* Scatter plot canvas */}
                <div className="relative w-full bg-surface-container-low rounded-xl p-space-md flex flex-col justify-between overflow-hidden" style={{ height: '320px' }}>
                  <div className="flex justify-between items-center text-on-surface-variant font-label-sm mb-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>thermostat</span>
                      Ambient Temperature (°C) [Y: 18°C – 36°C]
                    </span>
                    <span className="font-data-mono text-label-sm text-on-surface-variant">Convergence: 8 Iterations</span>
                  </div>
                  <svg className="absolute inset-0 w-full h-full p-space-lg pointer-events-none" viewBox="0 0 540 240" fill="none" preserveAspectRatio="none">
                    <line stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" x1="40" x2="520" y1="40" y2="40" />
                    <line stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" x1="40" x2="520" y1="100" y2="100" />
                    <line stroke="currentColor" className="text-surface-container" strokeDasharray="3 3" x1="40" x2="520" y1="160" y2="160" />
                    <line stroke="#c1c8c2" x1="40" x2="520" y1="210" y2="210" />
                    <line stroke="#c1c8c2" x1="40" x2="40" y1="20" y2="210" />
                    {/* Cluster ellipses */}
                    <ellipse cx="140" cy="85" rx="75" ry="45" fill="rgba(199,235,214,0.2)" stroke="#06271a" strokeDasharray="2 2" strokeWidth="1" />
                    <ellipse cx="410" cy="70" rx="60" ry="38" fill="rgba(214,214,214,0.2)" stroke="#456555" strokeDasharray="2 2" strokeWidth="1" />
                    <ellipse cx="370" cy="165" rx="75" ry="35" fill="rgba(173,243,184,0.2)" stroke="#296b3c" strokeDasharray="2 2" strokeWidth="1" />
                    <ellipse cx="110" cy="180" rx="45" ry="25" fill="rgba(255,218,214,0.3)" stroke="#ba1a1a" strokeDasharray="2 2" strokeWidth="1" />
                    {/* Data points from SAMPLE_FIELDS */}
                    <circle cx="120" cy="90" r="6" fill="#296b3c" />
                    <circle cx="150" cy="100" r="5" fill="#296b3c" />
                    <circle cx="390" cy="75" r="6" fill="#456555" />
                    <circle cx="420" cy="65" r="5" fill="#456555" />
                    <circle cx="360" cy="160" r="6" fill="#296b3c" />
                    <circle cx="380" cy="170" r="7" fill="#296b3c" />
                    <circle cx="100" cy="185" r="7" fill="#ba1a1a" />
                    <circle cx="120" cy="175" r="5" fill="#ba1a1a" />
                  </svg>
                  <div className="absolute bottom-3 right-3 bg-surface-container-lowest/90 p-2 rounded-lg">
                    <div className="flex items-center gap-1.5 font-label-sm text-on-surface-variant">
                      <span className="font-body-sm text-on-surface-variant">→ Soil Moisture %</span>
                    </div>
                  </div>
                </div>

                {/* Cluster Summaries */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  {[
                    { label: 'Cluster 0', subtitle: 'Optimal', color: '#296b3c', count: '2 fields', bg: 'rgba(173,243,184,0.15)' },
                    { label: 'Cluster 1', subtitle: 'Moderate', color: '#456555', count: '1 field', bg: 'rgba(207,235,193,0.2)' },
                    { label: 'Cluster 2', subtitle: 'High Temp', color: '#727974', count: '1 field', bg: 'rgba(217,227,246,0.3)' },
                    { label: 'Cluster 3', subtitle: 'Critical', color: '#ba1a1a', count: '1 field', bg: 'rgba(255,218,214,0.2)' },
                  ].map((c) => (
                    <div key={c.label} className="p-space-sm rounded-lg flex flex-col gap-space-xs"
                      style={{ backgroundColor: c.bg, border: `1px solid ${c.color}30` }}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                        <span className="font-label-sm font-semibold text-on-surface">{c.label}</span>
                      </div>
                      <div className="font-body-sm text-on-surface-variant">{c.subtitle}</div>
                      <div className="font-data-mono text-label-sm" style={{ color: c.color }}>{c.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Right Panel: Module List */}
          <div className="col-span-12 xl:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              <div className="px-space-lg py-space-md"
                style={{ backgroundColor: 'rgba(239,244,255,0.4)', borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
                <h2 className="font-headline-sm text-on-surface font-semibold">AI Algorithm Registry</h2>
                <p className="font-label-md text-on-surface-variant mt-space-xs">All modules — current execution status</p>
              </div>

              <div className="divide-y" style={{ borderColor: 'rgba(239,244,255,0.8)' }}>
                {AI_MODULES.map((module) => {
                  const isReady = module.week === 1;
                  const isRunning = runningModule === module.id;
                  return (
                    <div key={module.id} className="px-space-lg py-space-md flex items-center justify-between gap-space-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-space-xs">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? 'bg-secondary animate-pulse' : isReady ? 'bg-secondary' : 'bg-outline'}`} />
                          <span className="font-body-sm text-on-surface font-semibold truncate">{module.name}</span>
                        </div>
                        <div className="font-label-sm text-on-surface-variant mt-0.5 ml-4">{module.category}</div>
                      </div>
                      <div className="flex items-center gap-space-sm shrink-0">
                        <span className={`font-label-sm px-2 py-0.5 rounded font-semibold ${
                          isReady
                            ? 'text-on-secondary-container'
                            : 'text-on-surface-variant'
                        }`}
                          style={{
                            backgroundColor: isReady ? 'rgba(173,243,184,0.3)' : 'rgba(230,238,255,0.5)'
                          }}>
                          {isRunning ? 'Running...' : module.status}
                        </span>
                        {isReady && (
                          <button
                            disabled={isRunning}
                            onClick={() => runModule(module.id, module.name)}
                            className="px-2 py-1 rounded bg-primary-container text-on-primary font-label-sm font-semibold hover:opacity-90 disabled:opacity-50"
                          >
                            {isRunning ? '...' : 'Run'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision Engine Panel */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg"
              style={{ border: '1px solid rgba(193,200,194,0.4)' }}>
              <div className="flex items-center gap-space-sm mb-space-md">
                <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_tree</span>
                </div>
                <div>
                  <div className="font-headline-sm text-on-surface">Decision Engine</div>
                  <div className="font-label-md text-on-surface-variant">Rule-based agronomic interventions</div>
                </div>
              </div>
              <div className="space-y-space-sm font-body-sm text-on-surface-variant">
                {fields.length === 0 ? (
                  <div className="p-4 text-center text-on-surface-variant font-body-sm">
                    No active fields found in database for decision engine evaluation.
                  </div>
                ) : (
                  fields.map((field) => {
                    const isCritical = field.status === 'Critical';
                    const isWarning = field.status === 'Dry' || field.status === 'Moderate';
                    return (
                      <div
                        key={field.id}
                        className="p-space-sm rounded-lg flex items-center gap-space-sm"
                        style={{
                          backgroundColor: isCritical
                            ? 'rgba(255,218,214,0.2)'
                            : isWarning
                            ? 'rgba(254,243,199,0.3)'
                            : 'rgba(173,243,184,0.1)',
                          border: isCritical
                            ? '1px solid rgba(255,218,214,0.5)'
                            : isWarning
                            ? '1px solid rgba(253,230,138,0.4)'
                            : '1px solid rgba(173,243,184,0.3)',
                        }}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            isCritical ? 'text-error' : isWarning ? 'text-amber-700' : 'text-secondary'
                          }`}
                          style={{ fontSize: '16px' }}
                        >
                          {isCritical ? 'error' : isWarning ? 'warning' : 'check_circle'}
                        </span>
                        <span>
                          {field.name} ({field.crop}):{' '}
                          {field.soilMoisture !== undefined && field.soilMoisture !== null
                            ? (isCritical
                                ? `Immediate action required — moisture critical at ${field.soilMoisture}%`
                                : isWarning
                                ? `Advisory — increase irrigation frequency (Moisture ${field.soilMoisture}%)`
                                : `No intervention required (Moisture ${field.soilMoisture}%)`)
                            : (isCritical
                                ? `Immediate action required — field status is Critical`
                                : isWarning
                                ? `Advisory — increase irrigation frequency`
                                : `No intervention required (Status: ${field.status})`)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
