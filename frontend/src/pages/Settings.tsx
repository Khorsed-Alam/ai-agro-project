import React from 'react';
import { Settings as SettingsIcon, Database, Server, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getFirebaseStatus } from '../services/firebase';

export const Settings: React.FC = () => {
  const fbStatus = getFirebaseStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          System Configuration & Services
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage Firebase modular SDK connections, FastAPI endpoints, and environment configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Firebase Config Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              Firebase & Firestore Services
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                fbStatus.isConfigured
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {fbStatus.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Firebase SDK:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Installed (v12.19.0)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Project ID:</span>
              <span className="font-mono text-slate-800">{fbStatus.projectId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Authentication:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {fbStatus.authReady ? 'Connected (Live Auth)' : 'Code Ready (Env Config Required)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Firestore Database:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                {fbStatus.firestoreReady ? 'Connected (Live Firestore)' : 'Code Ready (Env Config Required)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Firestore Collections:</span>
              <span className="font-semibold text-emerald-700">11 Schemas Documented</span>
            </div>
          </div>

          {!fbStatus.isConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Credentials Pending:</strong> Firebase SDK code & auth/firestore services are fully built. Add your credentials to <code className="bg-amber-100 px-1 rounded">frontend/.env</code> to connect live.
              </div>
            </div>
          )}
        </div>

        {/* FastAPI Backend Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              FastAPI Python Backend
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Port 8000
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Base API Route:</span>
              <span className="font-mono text-slate-800">http://localhost:8000/api</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Health Endpoint:</span>
              <span className="font-mono text-slate-800">/api/health</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">AI Endpoints:</span>
              <span className="font-semibold text-emerald-700">5 Modules Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
