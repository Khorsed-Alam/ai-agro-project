import React from 'react';
import { NavLink } from 'react-router-dom';
import type { HealthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavigationProps {
  health: HealthResponse | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ health, mobileOpen = false, onMobileClose }) => {
  const { userRole } = useAuth();
  const isHealthy = health?.status === 'ok';

  const navSections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: 'home' },
        { name: '1-to-1 Chat', path: '/messages', icon: 'chat' },
        { name: 'My Farm', path: '/my-farm', icon: 'location_on' },
        { name: 'Fields', path: '/fields', icon: 'layers' },
        { name: 'Weather', path: '/weather', icon: 'wb_sunny' },
      ]
    },
    {
      label: 'AI & Analysis',
      items: [
        { name: 'AI Analysis', path: '/ai-analysis', icon: 'memory' },
        { name: 'Disease Detection', path: '/disease-detection', icon: 'filter_center_focus' },
        { name: 'Irrigation Planner', path: '/irrigation-planner', icon: 'water_drop' },
        { name: 'Algorithms & Theory', path: '/algorithms', icon: 'menu_book' },
      ]
    },
    {
      label: userRole === 'farmer' ? 'Workspaces & Tools' : 'Workspaces & Management',
      items: [
        userRole === 'farmer'
          ? { name: 'Farmer Workspace', path: '/farmer-dashboard', icon: 'assignment_turned_in' }
          : { name: 'Owner GIS Workspace', path: '/owner-dashboard', icon: 'admin_panel_settings' },
        { name: 'Resources & Sensors', path: '/resources', icon: 'dns' },
        { name: 'History & Logs', path: '/history', icon: 'schedule' },
        { name: 'Settings', path: '/settings', icon: 'tune' },
      ]
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-surface border-r z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: '240px', borderColor: 'rgba(193,200,194,0.4)' }}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 px-space-md flex items-center gap-space-sm" style={{ borderBottom: '1px solid rgba(193,200,194,0.3)' }}>
            {/* AgroAI Logo Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: '18px' }}>
                eco
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-primary leading-tight truncate">AgroAI</span>
              <span className="font-label-sm text-on-surface-variant truncate">Decision Support</span>
            </div>
          </div>

          {/* Nav Sections */}
          <div className="p-space-sm space-y-space-md">
            {navSections.map((section) => (
              <div key={section.label} className="space-y-space-xs">
                <div className="px-space-sm py-space-xs font-label-sm text-on-surface-variant uppercase tracking-wider">
                  {section.label}
                </div>
                <nav className="flex flex-col space-y-space-xs">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        `flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-body-md ${
                          isActive
                            ? 'bg-primary-container text-on-primary font-semibold'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`
                      }
                      style={({ isActive }) =>
                        isActive
                          ? {}
                          : { ['--tw-bg-opacity' as any]: 1 }
                      }
                      onMouseEnter={(e) => {
                        const el = e.currentTarget;
                        if (!el.classList.contains('bg-primary-container')) {
                          el.style.backgroundColor = '#dee9fc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget;
                        if (!el.classList.contains('bg-primary-container')) {
                          el.style.backgroundColor = '';
                        }
                      }}
                    >
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px' }}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Status */}
        <div className="p-space-sm bg-surface space-y-2" style={{ borderTop: '1px solid rgba(193,200,194,0.3)' }}>
          <div className="flex items-center justify-between px-space-xs py-1 rounded-md bg-surface-container text-xs">
            <span className="font-label-sm text-on-surface-variant">Active Role:</span>
            <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary-container text-on-primary">
              {userRole === 'farmer' ? 'Farmer' : 'Owner'}
            </span>
          </div>

          <div
            className="flex items-center gap-space-xs px-space-xs py-space-xs rounded-lg bg-surface-container-lowest"
            style={{ border: '1px solid rgba(193,200,194,0.4)' }}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-secondary' : 'bg-amber-500'}`}
            />
            <span className="font-label-sm text-on-surface-variant truncate">
              {isHealthy ? 'FastAPI + Firebase (Healthy)' : 'FastAPI (Connecting...)'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
