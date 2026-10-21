import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Globe, Menu, School } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
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
    <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Leading Section: Mobile Menu Trigger + Brand/Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
        {/* Hamburger Menu Trigger for Mobile */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 rtl:-mr-1 rtl:ml-0 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small Logo Icon on Mobile only */}
        <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs shrink-0">
          <School className="w-4 h-4" />
        </div>

        {/* Dynamic Title */}
        <div className="truncate">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
            <span className="hidden sm:inline">{t('appName')}</span>
            <span className="sm:hidden">{t('shortName')}</span>
          </h1>
        </div>
      </div>

      {/* Trailing Section: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition shadow-2xs active:scale-95"
          title="Switch Language / تغيير اللغة"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="hidden xs:inline sm:inline">
            {currentLang === 'ar' ? 'English (EN)' : 'العربية (AR)'}
          </span>
          <span className="xs:hidden sm:hidden font-mono uppercase text-[11px]">
            {currentLang === 'ar' ? 'EN' : 'ع'}
          </span>
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 rtl:pr-2 rtl:pl-0 border-l rtl:border-r rtl:border-l-0 border-slate-200 dark:border-slate-700">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs shrink-0"
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
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
