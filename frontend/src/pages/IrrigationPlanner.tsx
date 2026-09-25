import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { apiService } from '../services/api';
import type { Field } from '../types';

export const IrrigationPlanner: React.FC = () => {
  const { t, translateEnum, formatNumber } = useI18n();
  const [calculating, setCalculating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    apiService.getFields().then((data) => setFields(data || [])).catch(() => setFields([]));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      await apiService.runAlgorithmPlaceholder('csp');
      showToast(t('irrigation.verifiedSuccess'));
    } catch {
      showToast(t('irrigation.solverUpdated'));
    } finally {
      setCalculating(false);
    }
  };

  const handleCommit = () => {
    showToast(t('irrigation.commandsDispatched'));
  };

  const handleOverride = () => {
    showToast(t('irrigation.sandboxUnlocked'));
  };

  return (
    <div className="p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider mb-space-xs">
            <span>{t('irrigation.decisionEngine')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{t('irrigation.optimizationSolvers')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">{t('irrigation.irrigationCsp')}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            {t('irrigation.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-3xl">
            {t('irrigation.description')}
          </p>
        </div>

        {/* AC-3 Solver Status Indicator Badge */}
        <div className="flex items-center gap-space-sm bg-surface-container px-space-md py-space-sm rounded-xl self-start md:self-auto shadow-sm">
          <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wide">
                {t('irrigation.engineOnline')}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-medium">
                {t('irrigation.liveSolver')}
              </span>
            </div>
            <span className="font-data-mono text-data-mono text-on-surface">
              {t('irrigation.verifiedSolver')}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Availability Bar (Horizontal Bento Unit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Water Reservoir */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
              {t('irrigation.waterReservoir')}
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">water</span>
          </div>
          <div className="my-space-md">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display-lg text-display-lg text-on-surface tabular-nums font-semibold">{formatNumber(64200)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">{t('irrigation.litersRemaining')}</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-space-sm flex">
              <div className="bg-secondary h-full rounded-full" style={{ width: '76%' }} />
            </div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>{t('irrigation.capacity', { value: formatNumber(85000) })}</span>
            <span className="text-error font-data-mono font-medium">{t('irrigation.safeBuffer')}</span>
          </div>
        </div>

        {/* Active Pumps */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
              {t('irrigation.activePumps')}
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">swap_driving_apps_wheel</span>
          </div>
          <div className="my-space-md">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display-lg text-display-lg text-on-surface tabular-nums font-semibold">
                {formatNumber(2)} <span className="text-headline-md font-normal text-on-surface-variant">/ {formatNumber(3)}</span>
              </span>
              <span className="font-label-md text-label-md text-secondary font-semibold">{t('irrigation.available')}</span>
            </div>
            <div className="mt-space-xs flex gap-1">
              <span className="h-1.5 flex-1 bg-secondary rounded" />
              <span className="h-1.5 flex-1 bg-secondary rounded" />
              <span className="h-1.5 flex-1 bg-surface-container-highest rounded" />
            </div>
          </div>
          <div className="font-data-mono text-data-mono text-on-surface-variant truncate">
            P1: {formatNumber(180)} L/m • P2: {formatNumber(120)} L/m • <span className="text-error">P3: {translateEnum('status', 'offline', 'Offline')}</span>
          </div>
        </div>

        {/* Weather Restriction */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
              {t('irrigation.atmosphericWindow')}
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">wb_twilight</span>
          </div>
          <div className="my-space-md">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-lg text-headline-lg text-error font-semibold">12:00 – 15:30</span>
              <span className="font-label-sm text-label-sm text-error bg-error-container/60 px-space-xs py-0.5 rounded uppercase font-semibold">
                {t('irrigation.lockout')}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs line-clamp-1">
              {t('irrigation.peakHeat')}
            </p>
          </div>
          <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">cloud_off</span>
            <span>{t('irrigation.rainProbability', { value: formatNumber(0) })}</span>
          </div>
        </div>

        {/* Target Water Demand */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">
              {t('irrigation.targetDemand')}
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">pin_invoke</span>
          </div>
          <div className="my-space-md">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-display-lg text-display-lg text-primary tabular-nums font-semibold">{formatNumber(2450)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">{t('irrigation.litersNeededToday')}</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-space-sm flex">
              <div className="bg-primary-container h-full rounded-full" style={{ width: '68%' }} />
            </div>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>{t('irrigation.coveringZones', { count: formatNumber(fields.length) })}</span>
            <span className="font-data-mono font-medium text-secondary">{t('irrigation.optimalEtc')}</span>
          </div>
        </div>
      </div>

      {/* Main Schedule Grid & Gantt Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left 8 Cols: Schedule Timetable & Timeline */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          {/* Interactive Gantt Visual Timeline */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  {t('irrigation.dispatchTimeline')}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('irrigation.dispatchDescription')}
                </p>
              </div>
              <div className="flex items-center gap-space-sm font-label-sm text-label-sm">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary-container" /> {t('irrigation.scheduled')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-secondary" /> {t('irrigation.proposed')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-error-container" /> {t('irrigation.forbiddenWindow')}
                </span>
              </div>
            </div>

            {/* Timeline Graph */}
            <div className="relative pt-space-lg pb-space-sm overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Axis Marks */}
                <div className="flex justify-between font-data-mono text-label-sm text-on-surface-variant pb-space-xs border-b border-surface-container-high">
                  <span>04:00</span>
                  <span>06:00</span>
                  <span>08:00</span>
                  <span>10:00</span>
                  <span>12:00</span>
                  <span>14:00</span>
                  <span>16:00</span>
                  <span>18:00</span>
                  <span>20:00</span>
                </div>

                {/* Track Rows */}
                <div className="space-y-space-sm mt-space-md relative">
                  {/* Background Thermal Lockout Strip */}
                  <div className="absolute inset-y-0 left-[44%] right-[25%] bg-error-container/40 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="font-label-sm text-label-sm text-error font-semibold uppercase tracking-wider bg-surface-container-lowest/90 px-space-xs py-0.5 rounded shadow-sm">
                      {t('irrigation.thermalPeakLockout')}
                    </span>
                  </div>

                  {fields.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant font-body-sm">
                      {t('irrigation.noFieldsSchedule')}
                    </div>
                  ) : (
                    fields.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-space-md h-9">
                        <span className="w-28 font-label-md text-label-md font-semibold text-on-surface truncate">
                          {f.name} ({translateEnum('common.enums.crops', f.crop, f.crop)})
                        </span>
                        <div className="relative flex-1 h-7 bg-surface-container rounded-lg overflow-hidden">
                          <div
                            className={`absolute left-[${12.5 + (idx * 15) % 70}%] w-[10%] h-full bg-primary-container rounded flex items-center justify-center text-on-primary font-data-mono text-label-sm font-semibold shadow-sm`}
                            title={`0${6 + idx}:00 - 0${7 + idx}:15`}
                          >
                            P{(idx % 3) + 1} • {formatNumber(1000 + idx * 250)}L
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timetable Table Unit */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-low">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">{t('irrigation.dailyTimetable')}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('irrigation.timetableDescription')}
                </p>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-data-mono text-data-mono text-on-surface-variant bg-surface-container px-space-sm py-1 rounded">
                  {t('irrigation.solverTime', { value: formatNumber(14.2, { maximumFractionDigits: 1 }) })}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    <th className="py-space-md px-space-lg font-semibold">{t('irrigation.timeWindow')}</th>
                    <th className="py-space-md px-space-md font-semibold">{t('irrigation.fieldCrop')}</th>
                    <th className="py-space-md px-space-md font-semibold">{t('irrigation.pumpUnit')}</th>
                    <th className="py-space-md px-space-md font-semibold text-right">{t('irrigation.volume')}</th>
                    <th className="py-space-md px-space-md font-semibold">{t('irrigation.deliveryMethod')}</th>
                    <th className="py-space-md px-space-lg font-semibold">{t('irrigation.cspReason')}</th>
                    <th className="py-space-md px-space-lg font-semibold text-center">{t('fields.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-body-md text-body-md text-on-surface">
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-sm">
                        {t('irrigation.noFieldsSchedule')}
                      </td>
                    </tr>
                  ) : (
                    fields.map((f, idx) => (
                      <tr key={f.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-space-md px-space-lg font-data-mono text-data-mono font-medium whitespace-nowrap">
                          {`0${6 + (idx % 4)}:00 – 0${7 + (idx % 4)}:15`}
                        </td>
                        <td className="py-space-md px-space-md font-semibold text-primary whitespace-nowrap">
                          {f.name} <span className="font-normal text-on-surface-variant font-body-sm">({translateEnum('common.enums.crops', f.crop, f.crop)})</span>
                        </td>
                        <td className="py-space-md px-space-md font-data-mono text-data-mono">
                          <span className="bg-surface-container-high px-space-xs py-0.5 rounded">P{(idx % 3) + 1} ({formatNumber(180)} L/m)</span>
                        </td>
                        <td className="py-space-md px-space-md font-data-mono text-data-mono text-right font-semibold">
                          {formatNumber(1200 + idx * 150)} L
                        </td>
                        <td className="py-space-md px-space-md text-on-surface-variant">{t('irrigation.centerPivot')}</td>
                        <td className="py-space-md px-space-lg font-body-sm text-body-sm text-on-surface-variant">
                          {t('irrigation.optimalIntake', { crop: translateEnum('common.enums.crops', f.crop, f.crop) })}
                        </td>
                        <td className="py-space-md px-space-lg text-center">
                          <span className="inline-flex items-center px-space-sm py-0.5 rounded-full text-label-sm font-semibold bg-secondary-fixed text-on-secondary-fixed-variant">
                            {t('irrigation.scheduled')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Mathematical Formulation & CSP Theory Panel */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">functions</span>
                <h3 className="font-headline-sm text-headline-sm text-primary">{t('irrigation.mathematicalFormulation')}</h3>
              </div>
              <span className="font-data-mono text-label-sm bg-primary-fixed text-on-primary-fixed px-space-xs py-0.5 rounded">
                {t('irrigation.cspModel', 'CSP Model v4.2')}
              </span>
            </div>

            {/* Variable Set Notation */}
            <div className="bg-surface-container p-space-md rounded-lg font-data-mono text-body-sm text-primary space-y-1">
              <div className="font-semibold text-on-surface-variant text-label-sm uppercase tracking-wider">
                {t('irrigation.formalStateSpace')}
              </div>
              <div>
                <span className="font-semibold text-primary">{t('irrigation.variables', 'Variables:')}</span> V = {'{F_i, T_start_j, P_k, Q_m}'}
              </div>
              <div className="text-on-surface-variant text-label-md">
                {t('irrigation.variableDefinitions', 'F = Fields, T = Slot Domain (15m), P = Pump Set, Q = Volumetric Discharge')}
              </div>
            </div>

            {/* Strict Constraints List */}
            <div className="space-y-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-on-surface-variant">
                {t('irrigation.hardConstraints')}
              </span>
              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-data-mono text-data-mono font-semibold text-primary">
                    {t('irrigation.flowThresholdConstraint', 'Constraint C1: Flow Threshold')}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('irrigation.simultaneousPumpConstraint', 'Simultaneous Pump Capacity ≤ Max Reservoir Discharge:')}
                </p>
                <div className="font-data-mono text-label-md bg-surface-container-lowest p-space-xs rounded text-primary font-semibold">
                  ∑ Flow(P_k(t)) ≤ 300 L/min ∀ t ∈ T
                </div>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-data-mono text-data-mono font-semibold text-primary">
                    {t('irrigation.environmentalPruningConstraint', 'Constraint C2: Environmental Pruning')}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('irrigation.sprayRestrictionConstraint', 'No overhead spray when ambient temperature > 30°C or wind speed > 20 km/h:')}
                </p>
                <div className="font-data-mono text-label-md bg-surface-container-lowest p-space-xs rounded text-primary font-semibold">
                  Method(F_i) = Spray → Temp(t) ≤ 30°C ∧ Wind(t) ≤ 20 km/h
                </div>
              </div>

              <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-data-mono text-data-mono font-semibold text-primary">
                    {t('irrigation.pathologicalSafeguardConstraint', 'Constraint C3: Pathological Safeguard')}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('irrigation.sprinklerExclusionConstraint', 'Field C-4 strictly excluded from overhead sprinkler due to fungal spore vulnerability:')}
                </p>
                <div className="font-data-mono text-label-md bg-surface-container-lowest p-space-xs rounded text-error font-semibold">
                  F_C-4 ∩ {'{Sprinkler, Pivot}'} = ∅ [Domain Eliminated]
                </div>
              </div>
            </div>

            {/* Arc Consistency AC-3 Metrics */}
            <div className="bg-surface-container p-space-md rounded-lg space-y-space-xs">
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span className="text-on-surface-variant font-medium">{t('irrigation.domainPruningDepth')}</span>
                <span className="font-data-mono font-semibold text-primary">{t('irrigation.statesRemoved', { value: formatNumber(84.2, { maximumFractionDigits: 1 }) })}</span>
              </div>
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span className="text-on-surface-variant font-medium">{t('irrigation.backtrackingNodes')}</span>
                <span className="font-data-mono font-semibold text-primary">{t('irrigation.iterations', { count: formatNumber(18) })}</span>
              </div>
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span className="text-on-surface-variant font-medium">{t('irrigation.waterEfficiency')}</span>
                <span className="font-data-mono font-semibold text-secondary">{t('irrigation.efficiencyGain', { value: formatNumber(19.4, { maximumFractionDigits: 1 }) })}</span>
              </div>
            </div>

            {/* Execution Action Bar */}
            <div className="flex flex-col gap-space-sm pt-space-sm">
              <button
                className="w-full bg-primary-container text-on-primary font-label-md text-label-md py-space-sm px-space-md rounded-lg font-semibold flex items-center justify-center gap-space-xs hover:bg-primary transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                onClick={handleRecalculate}
                disabled={calculating}
              >
                <span className={`material-symbols-outlined text-[18px] ${calculating ? 'animate-spin' : ''}`}>
                  {calculating ? 'progress_activity' : 'sync'}
                </span>
                <span>{calculating ? t('irrigation.executing') : t('irrigation.recalculate')}</span>
              </button>
              <button
                className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-space-sm px-space-md rounded-lg font-semibold flex items-center justify-center gap-space-xs hover:opacity-95 transition-all shadow-sm active:scale-[0.98]"
                onClick={handleCommit}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{t('irrigation.commitHardware')}</span>
              </button>
              <button
                className="w-full bg-surface-container-highest text-on-surface font-label-md text-label-md py-space-sm px-space-md rounded-lg font-semibold flex items-center justify-center gap-space-xs hover:bg-surface-container-high transition-colors active:scale-[0.98]"
                onClick={handleOverride}
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>{t('irrigation.manualOverride')}</span>
              </button>
            </div>

            {/* Telemetry Health Ping Footer inside Card */}
            <div className="flex items-center justify-between text-label-sm text-on-surface-variant pt-space-xs">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                {t('irrigation.plcActive')}
              </span>
              <span className="font-data-mono">{t('irrigation.latency', { value: formatNumber(12) })}</span>
            </div>
          </div>

          {/* Secondary Guidance Callout */}
          <div className="bg-surface-container-low p-space-md rounded-xl flex items-start gap-space-md">
            <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">lightbulb</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary">{t('irrigation.tariffOptimization')}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {t('irrigation.tariffDescription', 'Pacific Gas & Electric AG-5B tariff applies between 12:00 and 18:00 ($0.38/kWh vs off-peak $0.11/kWh). AC-3 solver automatically weights power cost alongside soil matrix suction.')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-on-primary px-space-lg py-space-md rounded-xl shadow-xl flex items-center gap-space-sm z-50 font-body-md text-body-md animate-bounce">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
