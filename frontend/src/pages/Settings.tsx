import React, { useState } from 'react';
import { getFirebaseStatus } from '../services/firebase';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const fbStatus = getFirebaseStatus();
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85.0);

  const handleTestConnection = async () => {
    setTestingPing(true);
    setPingResult(null);
    try {
      const res = await apiService.healthCheck();
      setPingResult(`FastAPI connected (${res.status || 'OK'}) • Firebase: ${fbStatus.status}`);
    } catch {
      setPingResult(`Firebase Status: ${fbStatus.status} • (FastAPI offline fallback active)`);
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] w-full mx-auto">
      {/* Top Breadcrumb & Page Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>Enterprise Portal</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>System Administration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">Settings</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            Application & Farm Settings
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Configure farm profile, sensor integrations, automated AI engine parameters, and user preferences.
          </p>
        </div>

        {/* Live Connectivity Badge */}
        <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm self-start md:self-center">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">
              FastAPI + Firebase Connection
            </span>
            <span className="font-data-mono text-label-sm text-secondary">
              Status: {fbStatus.status} • Project: {fbStatus.projectId}
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[18px] ml-space-xs">
            verified
          </span>
        </div>
      </div>

      {/* Main Layout Grid: Settings Navigation Dock + Content Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Left Navigation Dock */}
        <aside className="lg:col-span-3 sticky top-20 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-space-xs">
          <div className="px-space-md py-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
            Configuration Categories
          </div>
          <nav className="flex flex-col space-y-1 font-body-md text-body-md">
            <a
              href="#farm-info"
              className="flex items-center justify-between px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-semibold shadow-sm"
            >
              <span className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">agriculture</span>
                <span>Farm Information</span>
              </span>
              <span className="text-label-sm font-semibold px-1.5 py-0.5 rounded bg-secondary text-on-primary">
                Active
              </span>
            </a>
            <a
              href="#ai-engine"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">psychology</span>
              <span>AI Engine Preferences</span>
            </a>
            <a
              href="#data-firebase"
              className="flex items-center justify-between px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-secondary">cloud_sync</span>
                <span>Data & Firebase</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </a>
            <a
              href="#notifications"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications_active</span>
              <span>Notifications & Alerts</span>
            </a>
            <a
              href="#appearance"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">tune</span>
              <span>Agronomic Units</span>
            </a>
          </nav>

          {/* Authenticated User Profile Summary Card */}
          <div className="mt-space-lg bg-surface-container p-space-md rounded-lg flex flex-col gap-space-xs text-on-surface border border-outline-variant/30">
            <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span>Authenticated Operator</span>
            </div>
            <div className="flex flex-col gap-0.5 font-body-sm text-body-sm text-on-surface-variant">
              <p><strong className="text-on-surface">{userProfile?.fullName || user?.displayName || 'Farm Operator'}</strong></p>
              <p className="text-xs">{user?.email || 'Unauthenticated'}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-medium capitalize">
                  Role: {userProfile?.role || 'Farmer'}
                </span>
                <span className="font-data-mono text-[10px] text-on-surface-variant truncate max-w-[100px]">
                  UID: {user?.uid?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Form Sections Area */}
        <main className="lg:col-span-9 flex flex-col gap-space-xl">
          {/* SECTION 1: Farm Information */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="farm-info">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">potted_plant</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Farm Information</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Primary geographical boundaries, parcel classifications, and regional parameters.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-full text-secondary font-semibold">
                <span className="material-symbols-outlined text-[14px]">pin_drop</span> GIS Anchor Verified
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                  <span>Farm Name</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Enterprise ID: AG-841</span>
                </label>
                <input
                  type="text"
                  defaultValue="Green Valley Farm"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  Operational Headquarters
                </label>
                <input
                  type="text"
                  defaultValue="Sector 4 — Salinas Valley, CA"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                  <span>GPS Centroid Coordinates</span>
                  <span className="font-data-mono text-label-sm text-secondary">WGS84 Datum</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    defaultValue="36.677° N, 121.655° W"
                    className="w-full bg-surface h-9 px-3 pr-10 rounded-lg text-on-surface font-data-mono text-data-mono focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[18px]">
                    satellite_alt
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">Total Managed Land Area</label>
                <input
                  type="text"
                  defaultValue="420 Hectares / 1,038 Acres"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">Default Soil Classification</label>
                <select className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                  <option>Salinas Silty Clay Loam (Fine-Silty, Mixed)</option>
                  <option>Chualar Sandy Loam</option>
                  <option>Pacheco Silt Loam</option>
                </select>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">Current Growing Season</label>
                <select className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                  <option>Spring / Summer 2025 (Active Rotation)</option>
                  <option>Fall Cover Crop 2025</option>
                </select>
              </div>
            </form>

            <div className="flex items-center justify-between pt-space-md border-t border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                All 14 field parcels synchronize coordinate geometry dynamically
              </span>
              <button
                type="button"
                className="h-9 px-space-lg rounded-lg bg-primary text-on-primary font-headline-sm text-body-md hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Farm Details</span>
              </button>
            </div>
          </section>

          {/* SECTION 2: AI Engine & Algorithm Preferences */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="ai-engine">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">model_training</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">AI Engine & Algorithm Preferences</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Configure autonomous decision weights, mathematical transparency, and constraint solver thresholds.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm font-semibold">
                AC-3 Solver Active
              </span>
            </div>

            <div className="flex flex-col gap-space-md">
              {/* Toggle 1 */}
              <div className="bg-surface p-space-md rounded-xl flex items-start justify-between gap-space-md">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Enable Automated Irrigation Recommendations (CSP + AC-3)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
                      Deterministic
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Automatically formulate feasible valve actuation schedules when root-zone matric potential drops below targeted threshold.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#296b3c] cursor-pointer mt-1" />
              </div>

              {/* Toggle 2 */}
              <div className="bg-surface p-space-md rounded-xl flex items-start justify-between gap-space-md">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Show Algorithmic Transparency & Mathematical Formulations
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      Explainability
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Display constraint satisfaction networks, dual graph representations, and Gini impurity indices.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#296b3c] cursor-pointer mt-1" />
              </div>

              {/* Slider: Confidence Threshold */}
              <div className="bg-surface p-space-md rounded-xl flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      Minimum Diagnostic Confidence Cutoff
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Predictions below this cutoff generate a human inspection prompt.
                    </p>
                  </div>
                  <span className="font-data-mono text-headline-sm text-secondary bg-surface-container px-3 py-1 rounded-lg">
                    {confidenceThreshold.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-data-mono">50.0%</span>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    step="0.5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#296b3c] h-2 bg-surface-container-high rounded-lg cursor-pointer"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-data-mono">99.0%</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Data & Firebase Status */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="data-firebase">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">database</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Data Services & Firebase Status</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time edge telemetry bridge, cloud database sync, and protocol heartbeats.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 font-data-mono text-label-sm bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary" /> {fbStatus.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">BACKEND API</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">FastAPI Python</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Port 8000 /api</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">Active</span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">FIREBASE PROJECT</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate block">
                    {fbStatus.projectId}
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Auth + Firestore</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">
                  {fbStatus.isConfigured ? 'Configured' : 'Env Pending'}
                </span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">FIRESTORE SCHEMAS</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">11 Schemas</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Fields, Logs, Telemetry</p>
                </div>
                <span className="font-data-mono text-label-sm text-on-surface-variant">Documented</span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">TELEMETRY BUFFER</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">0 Dropped Pkts</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">24h Cycle</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">1,842,090 pts</span>
              </div>
            </div>

            <div className="bg-surface p-space-md rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">troubleshoot</span>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Diagnostics & Connection Test</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Execute synthetic health pings across FastAPI and Firebase endpoints.
                  </span>
                  {pingResult && <span className="font-data-mono text-label-sm text-secondary mt-1">{pingResult}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingPing}
                className="h-9 px-space-md rounded-lg bg-surface-container-highest text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${testingPing ? 'animate-spin' : ''}`}>
                  {testingPing ? 'refresh' : 'network_check'}
                </span>
                <span>{testingPing ? 'Pinging Services...' : 'Test Connection'}</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
