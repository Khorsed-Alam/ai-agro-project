import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Field } from '../types';

export const Resources: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    apiService.getFields().then((data) => setFields(data || [])).catch(() => setFields([]));
  }, []);

  const SENSOR_NODES = [
    { id: 'SN-101', name: 'Primary Field Pivot Probe 1', field: fields[0]?.name || 'Sector 1', type: 'VWC + Temp Soil Probe', status: 'Online', battery: '98%', signal: '-64 dBm' },
    { id: 'SN-102', name: 'Field Moisture Cluster', field: fields[1]?.name || 'Sector 2', type: 'Dual-Depth Capacitance', status: 'Online', battery: '91%', signal: '-72 dBm' },
    { id: 'SN-103', name: 'Canopy Sentry Probe', field: fields[2]?.name || 'Sector 3', type: 'Foliar Wetness & Temp', status: 'Warning', battery: '42%', signal: '-88 dBm' },
    { id: 'SN-104', name: 'Drip Pressure Hub', field: fields[3]?.name || 'Sector 4', type: 'Sub-surface Flow Rate', status: 'Online', battery: '100%', signal: '-58 dBm' },
    { id: 'SN-105', name: 'Reservoir Main Flow Meter', field: 'Infrastructure', type: 'Ultrasonic Liquid Meter', status: 'Online', battery: 'Line Power', signal: '-45 dBm' },
  ];

  return (
    <div className="p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider mb-space-xs">
            <span>Management</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Hardware & Telemetry</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">Resources & Sensors</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            Resources & IoT Sensor Fleet Management
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-3xl">
            Real-time status of deployed field probes, LoRaWAN gateways, automated pump actuators, and valve solenoids.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
            Active Sensor Network
          </span>
          <button className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-headline-sm text-body-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Register New Node</span>
          </button>
        </div>
      </div>

      {/* Hardware Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Active Probes</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">24 Nodes</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">100% Mesh Reachable</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">sensors</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Pumps & Valves</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">8 Actuators</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">Modbus TCP Online</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">valve</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">LoRaWAN Gateway</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">Gateway 04</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">915 MHz US Band</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">router</span>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Managed Land</span>
            <span className="font-display-lg text-display-lg text-on-surface font-semibold block mt-1">{fields.length} Sectors</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Salinas Valley</span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[28px]">grid_view</span>
        </div>
      </div>

      {/* Sensor Node Inventory Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        <div className="p-space-lg bg-surface-container-low flex items-center justify-between">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Sensor Fleet Registry</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Active field hardware nodes and telemetry statistics</p>
          </div>
          <span className="font-data-mono text-data-mono text-on-surface-variant bg-surface-container px-space-sm py-1 rounded">
            5 / 24 Displayed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                <th className="py-space-md px-space-lg font-semibold">Node ID</th>
                <th className="py-space-md px-space-md font-semibold">Sensor Name</th>
                <th className="py-space-md px-space-md font-semibold">Field Sector</th>
                <th className="py-space-md px-space-md font-semibold">Sensor Type</th>
                <th className="py-space-md px-space-md font-semibold text-center">Battery</th>
                <th className="py-space-md px-space-md font-semibold text-center">Signal (RSSI)</th>
                <th className="py-space-md px-space-lg font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-on-surface">
              {SENSOR_NODES.map((node) => (
                <tr key={node.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-space-md px-space-lg font-data-mono text-data-mono font-semibold text-primary">
                    {node.id}
                  </td>
                  <td className="py-space-md px-space-md font-medium">{node.name}</td>
                  <td className="py-space-md px-space-md text-on-surface-variant">{node.field}</td>
                  <td className="py-space-md px-space-md text-on-surface-variant">{node.type}</td>
                  <td className="py-space-md px-space-md text-center font-data-mono">{node.battery}</td>
                  <td className="py-space-md px-space-md text-center font-data-mono">{node.signal}</td>
                  <td className="py-space-md px-space-lg text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-label-sm font-semibold ${
                        node.status === 'Online'
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {node.status}
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
