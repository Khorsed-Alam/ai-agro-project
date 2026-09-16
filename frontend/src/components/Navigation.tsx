import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Sprout,
  Cpu,
  Droplets,
  Scan,
  GitBranch,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Leaf
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Farm', path: '/farm', icon: Map },
  { name: 'Fields', path: '/fields', icon: Sprout },
  { name: 'AI Analysis', path: '/ai-analysis', icon: Cpu },
  { name: 'Irrigation', path: '/irrigation', icon: Droplets },
  { name: 'Disease Detection', path: '/disease-detection', icon: Scan },
  { name: 'Algorithms', path: '/algorithms', icon: GitBranch },
  { name: 'History', path: '/history', icon: HistoryIcon },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export const Navigation: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Agro<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-xs text-emerald-300 font-medium">Decision Support System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-emerald-300'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-semibold">
            <span>Week 1</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5">Foundation & Core Setup</p>
        </div>
      </div>
    </aside>
  );
};
