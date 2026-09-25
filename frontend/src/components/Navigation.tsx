import React from 'react';
import { NavLink } from 'react-router-dom';
import type { HealthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  key: string;
}

interface NavSection {
  label: string;
  key: string;
  items: NavItem[];
}

interface NavigationProps {
  health: HealthResponse | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ health, mobileOpen = false, onMobileClose }) => {
  const { userRole } = useAuth();
  const { t, translateEnum } = useI18n();
  const isHealthy = health?.status === 'ok';

  const navSections: NavSection[] = [
    {
      label: t('navigation.main'),
      key: 'main',
      items: [
        { name: t('navigation.dashboard'), path: '/dashboard', icon: 'home', key: 'dashboard' },
        { name: t('navigation.oneToOneChat'), path: '/messages', icon: 'chat', key: 'oneToOneChat' },
        { name: t('navigation.myFarm'), path: '/my-farm', icon: 'location_on', key: 'myFarm' },
        { name: t('navigation.fields'), path: '/fields', icon: 'layers', key: 'fields' },
        { name: t('navigation.weather'), path: '/weather', icon: 'wb_sunny', key: 'weather' },
      ]
    },
    {
      label: t('navigation.aiAndAnalysis'),
      key: 'aiAndAnalysis',
      items: [
        { name: t('navigation.aiAnalysis'), path: '/ai-analysis', icon: 'memory', key: 'aiAnalysis' },
        { name: t('navigation.diseaseDetection'), path: '/disease-detection', icon: 'filter_center_focus', key: 'diseaseDetection' },
        { name: t('navigation.irrigationPlanner'), path: '/irrigation-planner', icon: 'water_drop', key: 'irrigationPlanner' },
        { name: t('navigation.algorithmsAndTheory'), path: '/algorithms', icon: 'menu_book', key: 'algorithmsAndTheory' },
      ]
    },
    {
      label: userRole === 'farmer' ? t('navigation.workspacesAndTools') : t('navigation.workspacesAndManagement'),
      key: 'workspaces',
      items: [
        userRole === 'farmer'
          ? { name: t('navigation.farmerWorkspace'), path: '/farmer-dashboard', icon: 'assignment_turned_in', key: 'farmerWorkspace' }
          : { name: t('navigation.ownerGisWorkspace'), path: '/owner-dashboard', icon: 'admin_panel_settings', key: 'ownerGisWorkspace' },
        { name: t('navigation.resourcesAndSensors'), path: '/resources', icon: 'dns', key: 'resourcesAndSensors' },
        { name: t('navigation.historyAndLogs'), path: '/history', icon: 'schedule', key: 'historyAndLogs' },
        { name: t('navigation.settings'), path: '/settings', icon: 'tune', key: 'settings' },
      ]
    }
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-surface border-r z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: '240px', borderColor: 'var(--app-outline-variant)' }}
      >
        <div className="flex flex-col">
          <div className="h-16 px-space-md flex items-center gap-space-sm" style={{ borderBottom: '1px solid var(--app-outline-variant)' }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: '18px' }}>
                eco
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-primary leading-tight truncate">{t('common.appName')}</span>
              <span className="font-label-sm text-on-surface-variant truncate">{t('common.decisionSupport')}</span>
            </div>
          </div>

          <div className="p-space-sm space-y-space-md">
            {navSections.map((section) => (
              <div key={section.key} className="space-y-space-xs">
                <div className="px-space-sm py-space-xs font-label-sm text-on-surface-variant uppercase tracking-wider">
                  {section.label}
                </div>
                <nav className="flex flex-col space-y-space-xs" aria-label={section.label}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        `flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-body-md ${
                          isActive
                            ? 'bg-primary-container text-on-primary font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px' }} aria-hidden="true">
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

        <div className="p-space-sm bg-surface space-y-2" style={{ borderTop: '1px solid var(--app-outline-variant)' }}>
          <div className="flex items-center justify-between px-space-xs py-1 rounded-md bg-surface-container text-xs">
            <span className="font-label-sm text-on-surface-variant">{t('navigation.activeRole')}</span>
            <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary-container text-on-primary">
              {translateEnum('common.enums.roles', userRole, userRole)}
            </span>
          </div>

          <div
            className="flex items-center gap-space-xs px-space-xs py-space-xs rounded-lg bg-surface-container-lowest"
            style={{ border: `1px solid ${isHealthy ? 'var(--app-outline-variant)' : '#b45309'}` }}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${isHealthy ? 'bg-secondary' : 'bg-amber-500'}`}
              aria-hidden="true"
            />
            <span className="font-label-sm text-on-surface-variant truncate">
              {isHealthy ? t('navigation.systemHealthy') : t('navigation.connecting')}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
