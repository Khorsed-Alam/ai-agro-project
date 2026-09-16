import React from 'react';
import { History as HistoryIcon, Clock, CheckCircle } from 'lucide-react';

export const History: React.FC = () => {
  const historyLogs = [
    {
      id: 'log-1',
      time: 'Today, 09:30 AM',
      algorithm: 'AC-3 Constraint Solver',
      target: 'Field D (Potato)',
      decision: 'Assigned Morning Irrigation Slot (Pump P1)',
      status: 'Verified'
    },
    {
      id: 'log-2',
      time: 'Today, 08:15 AM',
      algorithm: 'A* Pathfinding',
      target: 'Tractor Hub -> Field C',
      decision: 'Computed optimal path [ (1,1) -> (1,2) -> (2,2) ] avoiding reservoir obstacle',
      status: 'Verified'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-emerald-600" />
          AI System Decision & Audit History Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical record of automated recommendations, CSP schedules, and search navigation runs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50">
          <span>Executed AI Decision Runs</span>
          <span>Foundation Log Archive</span>
        </div>

        <div className="divide-y divide-slate-100">
          {historyLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.algorithm}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {log.target}
                  </span>
                </div>
                <p className="text-slate-600">{log.decision}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {log.time}
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
