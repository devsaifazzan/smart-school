import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Calendar,
  Grid,
} from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const primaryItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, resource: 'dashboard' },
    { to: '/students', label: t('nav.students'), icon: Users, resource: 'students' },
    { to: '/attendance', label: t('nav.attendance'), icon: CheckCircle2, resource: 'attendance' },
    { to: '/timetable', label: t('nav.timetable'), icon: Calendar, resource: 'timetable' },
  ].filter((item) => hasPermission(item.resource, 'read'));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5 flex items-center justify-around"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile Bottom Navigation"
    >
      {primaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition duration-150 relative ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-0.5 line-clamp-1 max-w-[64px] text-center">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0.5" />
                )}
              </>
            )}
          </NavLink>
        );
      })}

      {/* Menu / All Modules button */}
      <button
        onClick={onOpenMenu}
        type="button"
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium active:scale-95"
        aria-label="Open full menu"
      >
        <div className="p-1 rounded-lg">
          <Grid className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight leading-tight mt-0.5 line-clamp-1">
          {t('common.menu', 'القائمة / More')}
        </span>
      </button>
    </nav>
  );
};
