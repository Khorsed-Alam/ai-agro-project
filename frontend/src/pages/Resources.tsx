import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Field } from '../types';
import { useI18n } from '../i18n';

export const Resources: React.FC = () => {
  const { t, translateEnum, formatNumber } = useI18n();
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    apiService.getFields().then((data) => setFields(data || [])).catch(() => setFields([]));
  }, []);

  const SENSOR_NODES = [
    { id: 'SN-101', nameKey: 'resources.sensorNames.primaryFieldPivot', name: 'Primary Field Pivot Probe 1', field: fields[0]?.name, sector: 1, typeKey: 'resources.sensorTypes.vwcTemp', type: 'VWC + Temp Soil Probe', status: 'Online', battery: 98, linePower: false, signal: '-64 dBm' },
    { id: 'SN-102', nameKey: 'resources.sensorNames.moistureCluster', name: 'Field Moisture Cluster', field: fields[1]?.name, sector: 2, typeKey: 'resources.sensorTypes.dualDepth', type: 'Dual-Depth Capacitance', status: 'Online', battery: 91, linePower: false, signal: '-72 dBm' },
    { id: 'SN-103', nameKey: 'resources.sensorNames.canopySentry', name: 'Canopy Sentry Probe', field: fields[2]?.name, sector: 3, typeKey: 'resources.sensorTypes.foliarWetness', type: 'Foliar Wetness & Temp', status: 'Warning', battery: 42, linePower: false, signal: '-88 dBm' },
    { id: 'SN-104', nameKey: 'resources.sensorNames.dripPressureHub', name: 'Drip Pressure Hub', field: fields[3]?.name, sector: 4, typeKey: 'resources.sensorTypes.subsurfaceFlow', type: 'Sub-surface Flow Rate', status: 'Online', battery: 100, linePower: false, signal: '-58 dBm' },
    { id: 'SN-105', nameKey: 'resources.sensorNames.reservoirFlowMeter', name: 'Reservoir Main Flow Meter', field: '', sector: 0, typeKey: 'resources.sensorTypes.ultrasonic', type: 'Ultrasonic Liquid Meter', status: 'Online', battery: 0, linePower: true, signal: '-45 dBm' },
  ];

  return (
    <div className="p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider mb-space-xs">
            <span>{t('resources.management')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{t('resources.hardwareTelemetry')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">{t('navigation.resourcesAndSensors')}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            {t('resources.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-3xl">
            {t('resources.description')}
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
            {t('resources.activeNetwork')}
          </span>
          <button className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-headline-sm text-body-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{t('resources.registerNode')}</span>
          </button>
        </div>
      </div>

      {/* Hardware Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('resources.totalProbes')}</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">{t('resources.nodeCount', '{count} Nodes', { count: formatNumber(24) })}</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">{t('resources.meshReachable')}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">sensors</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('resources.pumpsValves')}</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">{t('resources.actuators', { count: formatNumber(8) })}</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">{t('resources.modbusOnline')}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">valve</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('resources.gateway')}</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">{t('resources.gateway')} {formatNumber(4, { minimumIntegerDigits: 2 })}</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">{t('resources.usBand', '915 MHz US Band')}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">router</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{t('resources.managedLand')}</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">{formatNumber(fields.length)} {t('farm.sectors')}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{t('resources.salinasValley', 'Salinas Valley')}</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">grid_view</span>
        </div>
      </div>

      {/* Sensor Node Inventory Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-space-lg bg-surface-container-low flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">{t('resources.fleetRegistry')}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t('resources.fleetDescription')}</p>
          </div>
          <span className="font-data-mono text-data-mono text-on-surface-variant bg-surface-container px-space-sm py-1 rounded">
            {t('common.displayed', { shown: formatNumber(5), total: formatNumber(24) })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-space-md px-space-lg font-semibold">{t('resources.nodeId')}</th>
                <th className="py-space-md px-space-md font-semibold">{t('resources.sensorName')}</th>
                <th className="py-space-md px-space-md font-semibold">{t('resources.fieldSector')}</th>
                <th className="py-space-md px-space-md font-semibold">{t('resources.sensorType')}</th>
                <th className="py-space-md px-space-md font-semibold text-center">{t('resources.battery')}</th>
                <th className="py-space-md px-space-md font-semibold text-center">{t('resources.signal')}</th>
                <th className="py-space-md px-space-lg font-semibold text-center">{t('resources.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-on-surface">
              {SENSOR_NODES.map((node) => (
                <tr key={node.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-lg font-data-mono text-data-mono font-semibold text-primary">
                    {node.id}
                  </td>
                  <td className="py-space-md px-space-md font-medium">{t(node.nameKey, node.name)}</td>
                  <td className="py-space-md px-space-md text-on-surface-variant">
                    {node.field || (node.sector > 0 ? t('dashboard.sectorNumber', 'Sector {number}', { number: formatNumber(node.sector) }) : t('resources.infrastructure'))}
                  </td>
                  <td className="py-space-md px-space-md text-on-surface-variant">{t(node.typeKey, node.type)}</td>
                  <td className="py-space-md px-space-md text-center font-data-mono">
                    {node.linePower ? t('resources.linePower', 'Line Power') : `${formatNumber(node.battery)}%`}
                  </td>
                  <td className="py-space-md px-space-md text-center font-data-mono">{node.signal}</td>
                  <td className="py-space-md px-space-lg text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-label-sm font-semibold ${
                        node.status === 'Online'
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {translateEnum('status', node.status, node.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
