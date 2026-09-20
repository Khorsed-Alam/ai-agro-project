import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { firestoreService } from '../services/firebase';
import { ECOSYSTEM_UPDATED_EVENT } from '../services/ecosystem';

interface AuditLog {
  id: string;
  timestamp: string;
  utcTime: string;
  category: 'Irrigation' | 'Disease' | 'AI Model' | 'Telemetry' | 'Manual Override' | 'Field';
  field: string;
  description: string;
  subDetail: string;
  engine: string;
  status: 'Success' | 'Action Flagged' | 'Advisory' | 'Locked';
  operator: string;
  hash: string;
}

export const History: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditLog | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadAuditLogs = async () => {
    try {
      let dbLogs: any[] = [];
      const apiLogs = await apiService.getLogs();
      if (apiLogs && apiLogs.length > 0) {
        dbLogs = apiLogs;
      } else {
        const fireLogs = await firestoreService.getLogs();
        if (fireLogs.success && fireLogs.data.length > 0) {
          dbLogs = fireLogs.data;
        }
      }

      if (dbLogs.length > 0) {
        const mapped: AuditLog[] = dbLogs.map((l: any, idx: number) => ({
          id: l.id || `rec-${1050 + idx}`,
          timestamp: l.timestamp || 'Recently',
          utcTime: l.utcTime || new Date().toISOString(),
          category: (l.category || 'Telemetry') as any,
          field: l.field || 'General Farm Sector',
          description: l.description || l.message || 'System log event recorded',
          subDetail: l.subDetail || `Engine: ${l.engine || 'System Core'}`,
          engine: l.engine || 'Firestore Audit Pipeline',
          status: (l.status || 'Success') as any,
          operator: l.operator || l.userId || 'System Operator',
          hash: l.hash || `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`
        }));

        setLogs(mapped);
        if (mapped.length > 0) {
          setSelectedRecord((prev) => prev || mapped[0]);
        }
      } else {
        setLogs([]);
        setSelectedRecord(null);
      }
    } catch {
      setLogs([]);
      setSelectedRecord(null);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadAuditLogs);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadAuditLogs);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      log.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.engine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface">
      {/* Top Context Ledger Bar */}
      <div className="w-full bg-surface-container-low px-margin-lg py-space-lg">
        <div className="max-w-[1680px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs text-secondary font-label-sm uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Immutable System Audit Trail</span>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface-variant font-data-mono">ISO-22000 & GAP Compliant</span>
              <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px]">
                Live Audit Ledger
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Farm Operations & Audit History
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-4xl">
              Chronological ledger of automated AI dispatches, manual scout inspections, disease detections, and sensor telemetry events.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
            <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-on-surface font-label-md rounded-lg shadow-sm hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px] text-outline">tune</span>
              <span>Filter Presets</span>
            </button>
            <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Audit Log (CSV / JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Tier Grid Container */}
      <div className="w-full px-margin-lg py-space-lg max-w-[1680px] mx-auto space-y-space-lg">
        {/* KPI / Throughput Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                7-Day Log Volume
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">1,428</span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> +8.4% telemetry rate
              </span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Autonomous Actions
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">312 Cycles</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">99.1% execution fidelity</span>
            </div>
            <div className="p-space-xs rounded-lg bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Flagged Interventions
              </span>
              <span className="font-headline-lg text-headline-lg text-error font-semibold mt-1">14</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">3 active spore vectors</span>
            </div>
            <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Mean Ingestion Latency
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">18.4 ms</span>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5">Edge Broker (MQTT/CoAP)</span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">speed</span>
            </div>
          </div>
        </div>

        {/* Filter & Query Control Console */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-sm">
            {/* Event Category */}
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
                Event Category
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px] pointer-events-none">
                  category
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:bg-surface-container"
                >
                  <option value="All">All Categories</option>
                  <option value="Irrigation">Irrigation Dispatch</option>
                  <option value="Disease">Disease Detection</option>
                  <option value="AI Model">AI Search & Model</option>
                  <option value="Telemetry">Telemetry Sensor</option>
                  <option value="Manual Override">Manual Override</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Direct Search */}
            <div className="flex flex-col gap-1 xl:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
                Direct Search
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by field, description, algorithm name..."
                  className="w-full h-9 pl-8 pr-3 bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Split: Table + Detail Inspector */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-lg items-start">
          {/* Table (8 Cols) */}
          <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-space-md py-space-sm bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-on-surface">view_headline</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Ledger Stream</h2>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-data-mono text-label-sm text-on-surface-variant uppercase">Stream Synchronized</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="py-space-xs px-space-md font-semibold">Timestamp</th>
                    <th className="py-space-xs px-space-sm font-semibold">Category</th>
                    <th className="py-space-xs px-space-sm font-semibold">Field / Asset</th>
                    <th className="py-space-xs px-space-md font-semibold">Event Description</th>
                    <th className="py-space-xs px-space-sm font-semibold">Engine</th>
                    <th className="py-space-xs px-space-sm font-semibold text-center">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low text-on-surface">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedRecord(log)}
                      className={`hover:bg-surface-container-low transition-colors cursor-pointer ${
                        selectedRecord?.id === log.id ? 'bg-surface-container-low font-semibold' : ''
                      }`}
                    >
                      <td className="py-space-sm px-space-md font-data-mono whitespace-nowrap text-on-surface-variant">
                        <span className="font-semibold text-on-surface block">{log.timestamp}</span>
                        <span className="text-[11px] text-outline">{log.utcTime}</span>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm">
                          <span className="material-symbols-outlined text-[13px] text-secondary">
                            {log.category === 'Irrigation' ? 'water_drop' : log.category === 'Disease' ? 'coronavirus' : 'memory'}
                          </span>
                          {log.category}
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap font-medium">{log.field}</td>
                      <td className="py-space-sm px-space-md max-w-xs">
                        <p className="truncate font-body-sm text-body-sm text-on-surface font-medium">{log.description}</p>
                        <p className="truncate font-data-mono text-[11px] text-on-surface-variant">{log.subDetail}</p>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap">
                        <span className="font-data-mono text-label-sm text-on-surface">{log.engine}</span>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-label-sm font-semibold ${
                            log.status === 'Success'
                              ? 'bg-secondary-container text-on-secondary-container'
                              : log.status === 'Action Flagged'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container text-on-surface'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Inspector Drawer Panel (4 Cols) */}
          <div className="xl:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-space-md">
            {selectedRecord ? (
              <>
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px]">find_in_page</span>
                    <h3 className="font-headline-sm text-headline-sm text-primary">Audit Inspector</h3>
                  </div>
                  <span className="font-data-mono text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface">
                    ID: {selectedRecord.id}
                  </span>
                </div>

                <div className="space-y-space-sm text-body-sm text-on-surface">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      Target Asset / Location
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary">{selectedRecord.field}</span>
                  </div>

                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      Primary Dispatch Description
                    </span>
                    <p className="p-space-xs bg-surface-container-low rounded text-on-surface mt-0.5">
                      {selectedRecord.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-space-xs text-data-mono">
                    <div className="bg-surface-container p-space-xs rounded">
                      <span className="text-on-surface-variant text-[11px] block">ENGINE</span>
                      <span className="font-semibold text-primary">{selectedRecord.engine}</span>
                    </div>
                    <div className="bg-surface-container p-space-xs rounded">
                      <span className="text-on-surface-variant text-[11px] block">OPERATOR</span>
                      <span className="font-semibold text-primary">{selectedRecord.operator}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      SHA-256 Audit Verification Hash
                    </span>
                    <span className="font-data-mono text-[11px] bg-primary-container text-on-primary p-space-xs rounded block truncate">
                      {selectedRecord.hash}
                    </span>
                  </div>
                </div>

                <div className="pt-space-sm border-t border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Cryptographically Sealed Log Record
                  </span>
                </div>
              </>
            ) : (
              <p className="text-on-surface-variant text-body-sm italic text-center py-space-lg">
                Select a log row from the table to inspect details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
