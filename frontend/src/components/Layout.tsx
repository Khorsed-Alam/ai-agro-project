import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navigation } from './Navigation';
import { apiService } from '../services/api';
import type { HealthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ECOSYSTEM_UPDATED_EVENT, getFarms } from '../services/ecosystem';

export const Layout: React.FC = () => {
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { userProfile, userRole, logout } = useAuth();

  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [farmLocation, setFarmLocation] = useState('Sector 4 — Salinas Valley, CA');

  const loadFarmHeader = () => {
    getFarms().then((farms) => {
      if (farms && farms.length > 0) {
        setFarmName(farms[0].name);
        setFarmLocation(farms[0].location);
      }
    });
  };

  useEffect(() => {
    apiService.healthCheck().then(setBackendHealth);
    loadFarmHeader();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadFarmHeader);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadFarmHeader);
  }, []);

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = userProfile?.fullName || 'Farm Operator';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-surface text-on-surface font-body-md">
      {/* Sidebar */}
      <Navigation
        health={backendHealth}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen w-full" style={{ paddingLeft: '240px' }}>
        {/* Top Header */}
        <header
          className="fixed top-0 right-0 h-16 bg-surface-container-lowest z-40 flex items-center justify-between px-margin"
          style={{
            left: '240px',
            borderBottom: '1px solid rgba(193,200,194,0.4)',
            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Left: Mobile hamburger + Farm name */}
          <div className="flex items-center gap-space-sm min-w-0">
            <button
              className="p-space-xs rounded-lg text-on-surface-variant lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
            </button>

            {/* Farm name */}
            <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontSize: '20px' }}>
              eco
            </span>
            <div className="flex items-center gap-space-xs truncate">
              <span className="font-headline-sm text-on-surface font-semibold truncate">
                {farmName}
              </span>
              <span className="text-outline font-label-md">•</span>
              <span className="font-body-md text-on-surface-variant truncate hidden md:block">
                {farmLocation}
              </span>
            </div>
          </div>

          {/* Right: Weather + Notifications + User */}
          <div className="flex items-center gap-gutter-lg shrink-0">
            {/* Weather widget (desktop) */}
            <div
              className="hidden xl:flex items-center gap-space-xs bg-surface px-space-md py-space-xs rounded-lg text-on-surface-variant font-data-mono"
              style={{ border: '1px solid rgba(193,200,194,0.3)' }}
            >
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>
                partly_cloudy_day
              </span>
              <span>22°C Clear</span>
              <span className="text-outline-variant">|</span>
              <span>Humidity 58%</span>
              <span className="text-outline-variant">|</span>
              <span>Wind 9 km/h NW</span>
            </div>

            <div className="flex items-center gap-space-md">
              {/* Notification bell */}
              <button
                className="relative p-space-xs rounded-lg text-on-surface-variant transition-colors"
                aria-label="Notifications"
                type="button"
                onClick={() => navigate('/history')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
                <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center font-label-sm">
                  2
                </span>
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-outline-variant" style={{ opacity: 0.4 }} />

              {/* User info + dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen((o) => !o); }}
                  className="flex items-center gap-space-sm"
                  aria-label="User menu"
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '8px' }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(193,200,194,0.4)',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {initials}
                    </span>
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="font-label-md text-on-surface font-semibold leading-tight flex items-center gap-1.5">
                      {displayName}
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-primary-container text-on-primary font-bold uppercase">
                        {userRole === 'farmer' ? 'Farmer' : 'Owner'}
                      </span>
                    </span>
                    <span className="font-label-sm text-on-surface-variant leading-tight">
                      {backendHealth?.status === 'ok' ? 'System Online' : 'Demo Mode'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant hidden md:block" style={{ fontSize: '18px' }}>
                    {userMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: '220px',
                      background: '#fff',
                      borderRadius: '10px',
                      border: '1px solid rgba(193,200,194,0.5)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      overflow: 'hidden',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {/* User info header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(193,200,194,0.4)', background: '#f8faf8' }}>
                      <div className="flex items-center justify-between">
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1a2e1a' }}>{displayName}</p>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-primary-container text-on-primary font-bold uppercase">
                          {userRole === 'farmer' ? 'Farmer' : 'Owner'}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7a6b' }}>
                        {userProfile?.email || 'farmer@agroai.app'}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate(userRole === 'farmer' ? '/farmer-dashboard' : '/owner-dashboard');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#2d6a4f',
                          fontWeight: 600,
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2d6a4f' }}>
                          {userRole === 'farmer' ? 'assignment_turned_in' : 'admin_panel_settings'}
                        </span>
                        Go to My Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374537',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6b7a6b' }}>settings</span>
                        Settings
                      </button>

                      <div style={{ height: '1px', background: 'rgba(193,200,194,0.4)', margin: '4px 0' }} />

                      <button
                        id="logout-btn"
                        type="button"
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#dc2626',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16 bg-surface min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
