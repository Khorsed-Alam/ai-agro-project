import React, { useState } from 'react';
import { SAMPLE_FIELDS } from '../data/sampleFields';
import type { Field } from '../types';
import { Map, Droplet, Gauge, Navigation as TractorIcon, Compass, Info } from 'lucide-react';

export const Farm: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const getStatusBadge = (status: Field['status']) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-500 text-white';
      case 'Moderate':
        return 'bg-amber-500 text-white';
      case 'Dry':
        return 'bg-orange-500 text-white';
      case 'Critical':
        return 'bg-red-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-6 h-6 text-emerald-600" />
            Virtual Farm Visualization Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grid layout representing agricultural fields, irrigation pumps, water reserves, and tractor routing nodes.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
          <span className="font-semibold text-slate-700">Grid Scale: 4x4 Farm Sectors</span>
        </div>
      </div>

      {/* Main Farm Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl text-white relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <span className="text-xs font-mono tracking-widest uppercase text-emerald-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              AgroAI Farm Layout Schema
            </span>
            <span className="text-xs text-slate-400">Target Grid for A* Pathfinding</span>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {/* Field A */}
            <button
              onClick={() => setSelectedElement('Field A')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Field A'
                  ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-emerald-500'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 ${getStatusBadge('Healthy')}`}>
                Healthy
              </span>
              <span className="text-sm font-bold text-white">Field A</span>
              <span className="text-xs text-slate-400 mt-1">Crop: Rice (75% M)</span>
            </button>

            {/* Farm Road Section 1 */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono text-slate-400">Farm Road</span>
              <span className="text-[10px] text-slate-500">🛣️ Transport Arc</span>
            </div>

            {/* Field B */}
            <button
              onClick={() => setSelectedElement('Field B')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Field B'
                  ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-400/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-amber-500'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 ${getStatusBadge('Moderate')}`}>
                Moderate
              </span>
              <span className="text-sm font-bold text-white">Field B</span>
              <span className="text-xs text-slate-400 mt-1">Crop: Tomato (45% M)</span>
            </button>

            {/* Irrigation Pump */}
            <button
              onClick={() => setSelectedElement('Pump P1')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Pump P1'
                  ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-blue-500'
              }`}
            >
              <Gauge className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-sm font-bold text-white">Pump P1</span>
              <span className="text-xs text-slate-400">Status: Active</span>
            </button>

            {/* Tractor Central Hub */}
            <button
              onClick={() => setSelectedElement('Tractor Hub')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Tractor Hub'
                  ? 'border-emerald-400 bg-emerald-900/60 ring-2 ring-emerald-400/50'
                  : 'border-emerald-600/50 bg-emerald-950/40 hover:border-emerald-400'
              }`}
            >
              <TractorIcon className="w-6 h-6 text-emerald-400 mb-1 animate-bounce" />
              <span className="text-sm font-bold text-white">Tractor Node (Start S)</span>
              <span className="text-xs text-emerald-300 font-mono">Location [1, 1]</span>
            </button>

            {/* Irrigation Pump P2 */}
            <button
              onClick={() => setSelectedElement('Pump P2')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Pump P2'
                  ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-blue-500'
              }`}
            >
              <Gauge className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-sm font-bold text-white">Pump P2</span>
              <span className="text-xs text-slate-400">Status: Standby</span>
            </button>

            {/* Field C */}
            <button
              onClick={() => setSelectedElement('Field C')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Field C'
                  ? 'border-orange-400 bg-orange-950/60 ring-2 ring-orange-400/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-orange-500'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 ${getStatusBadge('Dry')}`}>
                Dry
              </span>
              <span className="text-sm font-bold text-white">Field C</span>
              <span className="text-xs text-slate-400 mt-1">Crop: Maize (20% M)</span>
            </button>

            {/* Water Tank */}
            <button
              onClick={() => setSelectedElement('Water Tank')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Water Tank'
                  ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-400/50'
                  : 'border-cyan-800 bg-cyan-950/40 hover:border-cyan-400'
              }`}
            >
              <Droplet className="w-6 h-6 text-cyan-400 mb-1" />
              <span className="text-sm font-bold text-white">Water Tank</span>
              <span className="text-xs text-cyan-300">Reserve: 8,200 L</span>
            </button>

            {/* Field D */}
            <button
              onClick={() => setSelectedElement('Field D')}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                selectedElement === 'Field D'
                  ? 'border-red-500 bg-red-950/60 ring-2 ring-red-500/50'
                  : 'border-slate-700 bg-slate-800/80 hover:border-red-500'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 ${getStatusBadge('Critical')}`}>
                Critical
              </span>
              <span className="text-sm font-bold text-white">Field D</span>
              <span className="text-xs text-slate-400 mt-1">Crop: Potato (10% M)</span>
            </button>
          </div>
        </div>

        {/* Selected Node Details Sidepanel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              Farm Entity Inspector
            </h2>

            {selectedElement ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-mono uppercase text-slate-500">Selected Node</span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{selectedElement}</h3>
                </div>

                {selectedElement.startsWith('Field') && (
                  <div className="space-y-2 text-xs">
                    {SAMPLE_FIELDS.filter(f => f.name === selectedElement).map(f => (
                      <React.Fragment key={f.id}>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Crop Type:</span>
                          <span className="font-semibold text-slate-800">{f.crop}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Soil Moisture:</span>
                          <span className="font-semibold text-slate-800">{f.soilMoisture}%</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Soil pH:</span>
                          <span className="font-semibold text-slate-800">{f.soilPH}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100">
                          <span className="text-slate-500">Temperature:</span>
                          <span className="font-semibold text-slate-800">{f.temperature}°C</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-500">Water Priority:</span>
                          <span className="font-semibold text-emerald-700">{f.waterRequirement}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {selectedElement === 'Water Tank' && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Main reservoir supplying water to Pumps P1 and P2. Connected to CSP constraint solver to prevent over-allocation.
                  </p>
                )}

                {selectedElement === 'Tractor Hub' && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Starting position (S) for automated farm navigation vehicle. Used by A* pathfinding algorithm to compute optimal travel routes avoiding field obstacles.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Map className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                <p className="text-xs font-medium">Click any field or infrastructure node on the map to inspect properties.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Week 1 Status:</span> Visualization grid interactive. A* traversal logic ready in backend.
          </div>
        </div>
      </div>
    </div>
  );
};
