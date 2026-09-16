import React from 'react';
import { SAMPLE_FIELDS, AI_MODULES } from '../data/sampleFields';
import type { SystemMetrics } from '../types';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Cpu,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // Compute metrics dynamically from sample dataset
  const metrics: SystemMetrics = {
    totalFields: SAMPLE_FIELDS.length,
    healthyFields: SAMPLE_FIELDS.filter((f) => f.status === 'Healthy').length,
    dryFields: SAMPLE_FIELDS.filter((f) => f.status === 'Dry').length,
    criticalFields: SAMPLE_FIELDS.filter((f) => f.status === 'Critical').length,
    waterAvailability: 8200 // Liters demo value
  };

  return (
    <div className="space-y-8">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Week 1 — Foundation & Core Setup
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">AgroAI</h1>
          <p className="text-emerald-100 text-lg font-medium">
            AI-Based Agricultural Decision Support System
          </p>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Welcome to AgroAI. This platform provides intelligent monitoring, crop health diagnosis,
            irrigation scheduling via Constraint Satisfaction (CSP), and farm navigation planning using Search Algorithms.
          </p>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-600" />
          Farm Overview Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Fields</span>
              <Sprout className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.totalFields}</span>
              <span className="text-xs text-slate-500 ml-2">Monitored</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Healthy Fields</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-emerald-600">{metrics.healthyFields}</span>
              <span className="text-xs text-emerald-700 ml-2">Optimal Soil</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Dry Fields</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-amber-600">{metrics.dryFields}</span>
              <span className="text-xs text-amber-700 ml-2">Needs Water</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Critical Fields</span>
              <Flame className="w-5 h-5 text-red-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-red-600">{metrics.criticalFields}</span>
              <span className="text-xs text-red-700 ml-2">Action Required</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Water Availability</span>
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-blue-600">{metrics.waterAvailability}</span>
              <span className="text-xs text-blue-700 ml-2">Liters Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Modules Status Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              AI System Modules & Algorithm Readiness
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Week 1 focuses on core foundation, search algorithms, CSP, and research setup. Full models arrive in Week 2.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AI_MODULES.map((module) => {
            const isWeek1 = module.week === 1;
            return (
              <div
                key={module.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {module.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isWeek1
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {module.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{module.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Phase: Week {module.week}
                  </span>
                  <Link
                    to={module.route}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    View Module <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
