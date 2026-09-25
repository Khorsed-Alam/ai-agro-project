import React, { useState } from 'react';
import { getFirebaseStatus } from '../services/firebase';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

export const Settings: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { t, language, setLanguage, translateEnum } = useI18n();
  const { theme, setTheme } = useTheme();
  const fbStatus = getFirebaseStatus();
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85.0);

  const handleTestConnection = async () => {
    setTestingPing(true);
    setPingResult(null);
    try {
      const res = await apiService.healthCheck();
      setPingResult(`${t('settings.backendApi')}: ${res.status || 'OK'} • ${t('settings.firebaseProject')}: ${fbStatus.status}`);
    } catch {
      setPingResult(`${t('settings.firebaseProject')}: ${fbStatus.status} • ${t('errors.fastApiOffline')}`);
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="px-margin-lg py-margin flex flex-col gap-space-xl max-w-[1600px] w-full mx-auto">
      {/* Top Breadcrumb & Page Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
            <span>{t('settings.enterprisePortal')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{t('settings.systemAdministration')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">{t('navigation.settings')}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
            {t('settings.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            {t('settings.description')}
          </p>
        </div>

        {/* Live Connectivity Badge */}
        <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm self-start md:self-center">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary" />
          </span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">
              {t('settings.connection')}
            </span>
            <span className="font-data-mono text-label-sm text-secondary">
              {t('settings.statusProject', { status: fbStatus.status, project: fbStatus.projectId })}
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary text-[18px] ml-space-xs">
            verified
          </span>
        </div>
      </div>

      {/* Main Layout Grid: Settings Navigation Dock + Content Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Left Navigation Dock */}
        <aside className="lg:col-span-3 sticky top-20 bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-space-xs">
          <div className="px-space-md py-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
            {t('settings.configurationCategories')}
          </div>
          <nav className="flex flex-col space-y-1 font-body-md text-body-md">
            <a
              href="#farm-info"
              className="flex items-center justify-between px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-semibold shadow-sm"
            >
              <span className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">agriculture</span>
                {t('settings.farmInformation')}
              </span>
              <span className="text-label-sm font-semibold px-1.5 py-0.5 rounded bg-secondary text-on-primary">
                {t('status.active')}
              </span>
            </a>
            <a
              href="#ai-engine"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">psychology</span>
              <span>              {t('settings.aiPreferences')}</span>
            </a>
            <a
              href="#data-firebase"
              className="flex items-center justify-between px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-secondary">cloud_sync</span>
                <span>{t('settings.dataFirebase')}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </a>
            <a
              href="#notifications"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications_active</span>
              <span>{t('settings.notificationsAlerts')}</span>
            </a>
            <a
              href="#appearance"
              className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">tune</span>
              <span>{t('settings.appearance')}</span>
            </a>
          </nav>

          {/* Authenticated User Profile Summary Card */}
          <div className="mt-space-lg bg-surface-container p-space-md rounded-lg flex flex-col gap-space-xs text-on-surface border border-outline-variant/30">
            <div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span>{t('settings.authenticatedOperator')}</span>
            </div>
            <div className="flex flex-col gap-0.5 font-body-sm text-body-sm text-on-surface-variant">
              <p><strong className="text-on-surface">{userProfile?.fullName || user?.displayName || 'Farm Operator'}</strong></p>
              <p className="text-xs">{user?.email || 'Unauthenticated'}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-medium capitalize">
                  {t('settings.role', { role: translateEnum('common.enums.roles', userProfile?.role || 'farmer', userProfile?.role || 'Farmer') })}
                </span>
                <span className="font-data-mono text-[10px] text-on-surface-variant truncate max-w-[100px]">
                  UID: {user?.uid?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Form Sections Area */}
        <main className="lg:col-span-9 flex flex-col gap-space-xl">
          {/* SECTION 1: {t('settings.farmInformation')} */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="farm-info">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">potted_plant</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">{t('settings.farmInformation')}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.farmInformationDescription')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm bg-surface-container px-2.5 py-1 rounded-full text-secondary font-semibold">
                {t('settings.gisVerified')}
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                  <span>{t('settings.farmName')}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.enterpriseId', { id: 'AG-841' })}</span>
                </label>
                <input
                  type="text"
                  defaultValue="Green Valley Farm"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">
                  {t('settings.headquarters')}
                </label>
                <input
                  type="text"
                  defaultValue="Sector 4 — Salinas Valley, CA"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                  <span>{t('settings.gpsCoordinates')}</span>
                  <span className="font-data-mono text-label-sm text-secondary">{t('settings.gpsDatum')}</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    defaultValue="36.677° N, 121.655° W"
                    className="w-full bg-surface h-9 px-3 pr-10 rounded-lg text-on-surface font-data-mono text-data-mono focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 text-on-surface-variant text-[18px]">
                    satellite_alt
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">{t('settings.totalLandArea')}</label>
                <input
                  type="text"
                  defaultValue="420 Hectares / 1,038 Acres"
                  className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">{t('settings.defaultSoil')}</label>
                <select className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                  <option>{t('settings.soilSalinas')}</option>
                  <option>{t('settings.soilChualar')}</option>
                  <option>{t('settings.soilPacheco')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md font-semibold text-on-surface">{t('settings.growingSeason')}</label>
                <select className="w-full bg-surface h-9 px-3 rounded-lg text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm">
                  <option>{t('settings.seasonSpring')}</option>
                  <option>{t('settings.seasonFall')}</option>
                </select>
              </div>
            </form>

            <div className="flex items-center justify-between pt-space-md border-t border-outline-variant/30">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                {t('settings.parcelsSynchronized', { count: 14 })}
              </span>
              <button
                type="button"
                className="h-9 px-space-lg rounded-lg bg-primary text-on-primary font-headline-sm text-body-md hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {t('settings.saveFarm')}
              </button>
            </div>
          </section>

          {/* SECTION 2: AI Engine & Algorithm Preferences */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="ai-engine">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">model_training</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">{t('settings.aiEngineTitle')}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.solverDescription')}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm font-semibold">
                {t('settings.solverActive')}
              </span>
            </div>

            <div className="flex flex-col gap-space-md">
              {/* Toggle 1 */}
              <div className="bg-surface p-space-md rounded-xl flex items-start justify-between gap-space-md">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {t('settings.automatedIrrigation')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-label-sm font-semibold">
                      {t('settings.deterministic')}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.automatedIrrigationDescription')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#296b3c] cursor-pointer mt-1" />
              </div>

              {/* Toggle 2 */}
              <div className="bg-surface p-space-md rounded-xl flex items-start justify-between gap-space-md">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {t('settings.transparency')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      {t('settings.explainability')}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.transparencyDescription')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#296b3c] cursor-pointer mt-1" />
              </div>

              {/* Slider: Confidence Threshold */}
              <div className="bg-surface p-space-md rounded-xl flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-headline-sm text-headline-sm text-on-surface">
                      {t('settings.confidenceCutoff')}
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {t('settings.confidenceDescription')}
                    </p>
                  </div>
                  <span className="font-data-mono text-headline-sm text-secondary bg-surface-container px-3 py-1 rounded-lg">
                    {confidenceThreshold.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-data-mono">50.0%</span>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    step="0.5"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#296b3c] h-2 bg-surface-container-high rounded-lg cursor-pointer"
                  />
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-data-mono">99.0%</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: {t('settings.dataFirebase')} Status */}
          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="data-firebase">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">database</span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">{t('settings.dataServices')}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.dataServicesDescription')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 font-data-mono text-label-sm bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary" /> {fbStatus.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.backendApi')}</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{t('settings.fastApiPython')}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.backEndPort')}</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">{t('status.active')}</span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.firebaseProject')}</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate block">
                    {fbStatus.projectId}
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.authAndFirestore')}</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">
                  {fbStatus.isConfigured ? t('settings.configured') : t('settings.envPending')}
                </span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.firestoreSchemas')}</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{t('common.items', { count: 11 })}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.fieldsLogsTelemetry')}</p>
                </div>
                <span className="font-data-mono text-label-sm text-on-surface-variant">{t('settings.documented')}</span>
              </div>

              <div className="bg-surface p-space-md rounded-xl flex flex-col justify-between gap-space-sm shadow-sm">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{t('settings.telemetryBuffer')}</span>
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{t('settings.droppedPackets')}</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.cycle')}</p>
                </div>
                <span className="font-data-mono text-label-sm text-secondary font-semibold">{t('settings.points')}</span>
              </div>
            </div>

            <div className="bg-surface p-space-md rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[24px]">troubleshoot</span>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{t('settings.diagnostics')}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {t('settings.diagnosticsDescription')}
                  </span>
                  {pingResult && <span className="font-data-mono text-label-sm text-secondary mt-1">{pingResult}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingPing}
                className="h-9 px-space-md rounded-lg bg-surface-container-highest text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-high transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${testingPing ? 'animate-spin' : ''}`}>
                  {testingPing ? 'refresh' : 'network_check'}
                </span>
                <span>{testingPing ? t('settings.pinging') : t('settings.testConnection')}</span>
              </button>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg" id="appearance">
            <div className="flex items-center gap-space-sm pb-space-md border-b border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[24px]">palette</span>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">{t('settings.appearance')}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.themeDescription')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-lg">
              <div className="flex flex-col gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">{t('settings.language')}</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.languageDescription')}</p>
                <div className="flex gap-space-sm" role="group" aria-label={t('settings.language')}>
                  {(['en', 'bn'] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguage(code)}
                      aria-pressed={language === code}
                      className={`flex-1 rounded-lg border px-space-md py-space-sm text-left transition-colors ${
                        language === code
                          ? 'border-primary bg-primary-container text-on-primary'
                          : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="block font-headline-sm">{code === 'en' ? t('settings.languageEnglish') : t('settings.languageBangla')}</span>
                      <span className="block font-body-sm opacity-80">{t('settings.savedOnDevice')}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-space-sm">
                <span className="font-headline-sm text-headline-sm text-on-surface">{t('settings.theme')}</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{t('settings.themeDescription')}</p>
                <div className="flex gap-space-sm" role="group" aria-label={t('settings.theme')}>
                  {(['light', 'dark'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTheme(mode)}
                      aria-pressed={theme === mode}
                      className={`flex-1 rounded-lg border px-space-md py-space-sm text-left transition-colors ${
                        theme === mode
                          ? 'border-primary bg-primary-container text-on-primary'
                          : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-headline-sm">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          {mode === 'light' ? 'light_mode' : 'dark_mode'}
                        </span>
                        {mode === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
                      </span>
                      <span className="block font-body-sm opacity-80">
                        {mode === 'light' ? t('theme.lightDescription') : t('theme.darkDescription')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
