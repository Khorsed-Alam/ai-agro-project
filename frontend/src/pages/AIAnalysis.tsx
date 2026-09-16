import React from 'react';
import { AI_MODULES } from '../data/sampleFields';
import { Cpu, CheckCircle2, Clock, BookOpen } from 'lucide-react';

export const AIAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-emerald-600" />
          AI Engines & Analytics Roadmap
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete system architecture inventory of machine learning, deep learning, search, and optimization engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Week 1 Modules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Week 1 — Foundation & Search/CSP Modules
            </h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Foundation Ready
            </span>
          </div>

          <div className="space-y-3">
            {AI_MODULES.filter((m) => m.week === 1).map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">{m.name}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Week 2 Modules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Week 2 — Production AI Implementation Plan
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full">
              Coming in Week 2
            </span>
          </div>

          <div className="space-y-3">
            {AI_MODULES.filter((m) => m.week === 2).map((m) => (
              <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-800">{m.name}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex items-start gap-4 text-xs">
        <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-400 text-sm mb-1">University Lab Quality Policy</h4>
          <p className="text-slate-300 leading-relaxed">
            In compliance with Week 1 requirements, no simulated or fake model outputs (e.g. artificial accuracy scores or bogus yield predictions) are displayed. Real model training, evaluation, and backend inference will be implemented in Week 2.
          </p>
        </div>
      </div>
    </div>
  );
};
