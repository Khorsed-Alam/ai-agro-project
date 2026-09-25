import React from 'react';
import { useI18n, type Language } from '../i18n';
import { useTheme } from '../theme/ThemeContext';

interface PreferenceControlsProps {
  compact?: boolean;
}

export const PreferenceControls: React.FC<PreferenceControlsProps> = ({ compact = false }) => {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const languages: Array<{ code: Language; label: string }> = [
    { code: 'en', label: t('common.english') },
    { code: 'bn', label: t('common.bangla') },
  ];

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-0.5 ${compact ? 'text-xs' : 'text-sm'}`}
      role="group"
      aria-label={t('common.preferences')}
    >
      <div className="flex items-center gap-0.5" role="group" aria-label={t('theme.chooseLanguage')}>
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            aria-pressed={language === item.code}
            aria-label={item.code === 'bn' ? t('common.bangla') : t('common.english')}
            className={`rounded-md px-2 py-1 font-label-sm transition-colors ${
              language === item.code
                ? 'bg-primary text-on-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <span className="h-4 w-px bg-outline-variant/50" aria-hidden="true" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={t('theme.toggleTheme')}
        title={t('theme.toggleTheme')}
        className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
          {theme === 'light' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
    </div>
  );
};
