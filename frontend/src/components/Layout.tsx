import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { apiService } from '../services/api';
import type { HealthResponse } from '../services/api';
import { DEMO_DATA_LABEL } from '../data/sampleFields';
import { Database, Server, Info } from 'lucide-react';

export const Layout: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    apiService.healthCheck().then(setBackendHealth);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              {DEMO_DATA_LABEL}
            </span>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>FastAPI Backend:</span>
              {backendHealth?.status === 'ok' ? (
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </span>
              ) : (
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Foundation Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Firestore:</span>
              <span className="font-semibold text-emerald-600">Schema Ready</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
