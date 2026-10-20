import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
    localStorage.setItem('ssms_lang', nextLang);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          {t('appName')}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shadow-xs"
          title="Switch Language / تغيير اللغة"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>{currentLang === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {user.profile ? user.profile.name : user.username}
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
