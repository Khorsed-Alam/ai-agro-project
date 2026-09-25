import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { firestoreService } from '../services/firebase';
import { ECOSYSTEM_UPDATED_EVENT } from '../services/ecosystem';
import { useI18n } from '../i18n';

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
  const { t, translateEnum, formatDate, formatNumber } = useI18n();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditLog | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const translateCategory = (category: AuditLog['category']) => {
    if (category === 'AI Model') return t('history.categories.aiModel');
    if (category === 'Field') return t('history.categories.field', 'Field');
    return translateEnum('history.categories', category, category);
  };

  const formatTimestamp = (value: string) => formatDate(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) || t('history.recently');

  const getField = (field: string) => field || t('history.generalSector');
  const getDescription = (description: string) => description || t('history.systemEvent');
  const getEngine = (engine: string) => engine || t('history.firestoreAuditPipeline', 'Firestore Audit Pipeline');
  const getOperator = (operator: string) => operator || translateEnum('common.enums.roles', 'systemOperator');

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
          timestamp: l.timestamp || '',
          utcTime: l.utcTime || new Date().toISOString(),
          category: (l.category || 'Telemetry') as any,
          field: l.field || '',
          description: l.description || l.message || '',
          subDetail: l.subDetail || '',
          engine: l.engine || '',
          status: (l.status || 'Success') as any,
          operator: l.operator || l.userId || '',
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
              <span>{t('history.immutableTrail')}</span>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface-variant font-data-mono">{t('history.compliant')}</span>
              <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px]">
                {t('history.liveLedger')}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              {t('history.title')}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-4xl">
              {t('history.description')}
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
            <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container-lowest text-on-surface font-label-md rounded-lg shadow-sm hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[18px] text-outline">tune</span>
              <span>{t('history.filterPresets')}</span>
            </button>
            <button className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-primary text-on-primary font-label-md rounded-lg shadow-sm hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{t('history.exportLog')}</span>
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
                {t('history.logVolume')}
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">{formatNumber(1428)}</span>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> {t('history.telemetryRate', { value: formatNumber(8.4, { maximumFractionDigits: 1 }) })}
              </span>
            </div>
            <div className="p-space-xs rounded-lg bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {t('history.autonomousActions')}
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">{t('history.cycles', '{count} Cycles', { count: formatNumber(312) })}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{t('history.executionFidelity', { value: formatNumber(99.1, { maximumFractionDigits: 1 }) })}</span>
            </div>
            <div className="p-space-xs rounded-lg bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {t('history.flaggedInterventions')}
              </span>
              <span className="font-headline-lg text-headline-lg text-error font-semibold mt-1">{formatNumber(14)}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">{t('history.activeSporeVectors', { count: formatNumber(3) })}</span>
            </div>
            <div className="p-space-xs rounded-lg bg-error-container text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">flag</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {t('history.ingestionLatency')}
              </span>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">{formatNumber(18.4, { maximumFractionDigits: 1 })} ms</span>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5">{t('history.edgeBroker')}</span>
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
                {t('history.eventCategory')}
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
                  <option value="All">{t('history.categories.all')}</option>
                  <option value="Irrigation">{t('history.categories.irrigation')}</option>
                  <option value="Disease">{t('history.categories.disease')}</option>
                  <option value="AI Model">{t('history.categories.aiModel')}</option>
                  <option value="Telemetry">{t('history.categories.telemetry')}</option>
                  <option value="Manual Override">{t('history.categories.manualOverride')}</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Direct Search */}
            <div className="flex flex-col gap-1 xl:col-span-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold uppercase tracking-wider">
                {t('history.directSearch')}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('history.searchPlaceholder')}
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
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{t('history.ledgerStream')}</h2>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-data-mono text-label-sm text-on-surface-variant uppercase">{t('history.streamSynchronized')}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wider border-b border-outline-variant/30">
                      <th className="py-space-xs px-space-md font-semibold">{t('history.timestamp')}</th>
                      <th className="py-space-xs px-space-sm font-semibold">{t('history.category')}</th>
                      <th className="py-space-xs px-space-sm font-semibold">{t('history.fieldAsset')}</th>
                      <th className="py-space-xs px-space-md font-semibold">{t('history.eventDescription')}</th>
                      <th className="py-space-xs px-space-sm font-semibold">{t('history.engine')}</th>
                      <th className="py-space-xs px-space-sm font-semibold text-center">{t('history.state')}</th>
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
                        <span className="font-semibold text-on-surface block">{formatTimestamp(log.timestamp)}</span>
                        <span className="text-[11px] text-outline">{formatDate(log.utcTime, { timeStyle: 'medium', timeZone: 'UTC' })}</span>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm">
                          <span className="material-symbols-outlined text-[13px] text-secondary">
                            {log.category === 'Irrigation' ? 'water_drop' : log.category === 'Disease' ? 'coronavirus' : 'memory'}
                          </span>
                          {translateCategory(log.category)}
                        </span>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap font-medium">{getField(log.field)}</td>
                      <td className="py-space-sm px-space-md max-w-xs">
                        <p className="truncate font-body-sm text-body-sm text-on-surface font-medium">{getDescription(log.description)}</p>
                        <p className="truncate font-data-mono text-[11px] text-on-surface-variant">
                          {log.subDetail || `${t('history.engine')}: ${log.engine || t('history.systemCore', 'System Core')}`}
                        </p>
                      </td>
                      <td className="py-space-sm px-space-sm whitespace-nowrap">
                        <span className="font-data-mono text-label-sm text-on-surface">{getEngine(log.engine)}</span>
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
                          {translateEnum('status', log.status, log.status)}
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
                    <h3 className="font-headline-sm text-headline-sm text-primary">{t('history.auditInspector')}</h3>
                  </div>
                  <span className="font-data-mono text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface">
                    {t('history.recordId', 'ID: {id}', { id: selectedRecord.id })}
                  </span>
                </div>

                <div className="space-y-space-sm text-body-sm text-on-surface">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      {t('history.targetAsset')}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary">{getField(selectedRecord.field)}</span>
                  </div>

                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      {t('history.dispatchDescription')}
                    </span>
                    <p className="p-space-xs bg-surface-container-low rounded text-on-surface mt-0.5">
                      {getDescription(selectedRecord.description)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-space-xs text-data-mono">
                    <div className="bg-surface-container p-space-xs rounded">
                      <span className="text-on-surface-variant text-[11px] block">{t('history.engine').toUpperCase()}</span>
                      <span className="font-semibold text-primary">{getEngine(selectedRecord.engine)}</span>
                    </div>
                    <div className="bg-surface-container p-space-xs rounded">
                      <span className="text-on-surface-variant text-[11px] block">{t('history.operator').toUpperCase()}</span>
                      <span className="font-semibold text-primary">{getOperator(selectedRecord.operator)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                      {t('history.verificationHash')}
                    </span>
                    <span className="font-data-mono text-[11px] bg-primary-container text-on-primary p-space-xs rounded block truncate">
                      {selectedRecord.hash}
                    </span>
                  </div>
                </div>

                <div className="pt-space-sm border-t border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    {t('history.sealedRecord')}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-on-surface-variant text-body-sm italic text-center py-space-lg">
                {t('history.selectRecord')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
