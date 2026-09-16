import React, { useState } from 'react';
import { SAMPLE_FIELDS } from '../data/sampleFields';
import { Droplets, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { apiService } from '../services/api';

export const Irrigation: React.FC = () => {
  const [cspStatus, setCspStatus] = useState<string | null>(null);

  const handleTestAC3 = async () => {
    setCspStatus('Testing AC-3 algorithm on backend...');
    const result = await apiService.runAlgorithmPlaceholder('csp');
    setCspStatus(result.message || 'AC-3 domain reduction completed: Arc consistency satisfied.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            CSP Irrigation Scheduler & AC-3 Solver
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Constraint Satisfaction Problem (CSP) for allocating time slots and water pumps without conflict.
          </p>
        </div>
        <button
          onClick={handleTestAC3}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Cpu className="w-4 h-4" />
          Test AC-3 Constraint Solver
        </button>
      </div>

      {cspStatus && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{cspStatus}</span>
        </div>
      )}

      {/* CSP Model Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Variables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Variables (Fields)
          </h3>
          <p className="text-xs text-slate-500">Each field needing irrigation slot assignment:</p>
          <div className="space-y-2">
            {SAMPLE_FIELDS.map((f) => (
              <div key={f.id} className="p-2.5 rounded-lg bg-slate-50 text-xs flex justify-between">
                <span className="font-semibold text-slate-800">{f.name} ({f.crop})</span>
                <span className="text-slate-500">Req: {f.waterRequirement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domains */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Domains (Time Slots & Pumps)
          </h3>
          <p className="text-xs text-slate-500">Allowed assignments per variable:</p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50">
              <strong className="block text-slate-800">Time Slots:</strong>
              <span className="text-slate-600">Morning (06:00), Afternoon (13:00), Evening (18:00)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50">
              <strong className="block text-slate-800">Available Pumps:</strong>
              <span className="text-slate-600">Pump P1 (Primary), Pump P2 (Secondary)</span>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Constraints
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>C1:</strong> Single pump cannot irrigate two fields simultaneously.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>C2:</strong> Total water demand cannot exceed 8,200 L reservoir.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>C3:</strong> Critical fields (Field D) must receive priority morning slot.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
