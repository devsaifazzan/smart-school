import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Receipt,
  BrainCircuit,
  ShieldCheck,
  LogOut,
  School,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const isRtl = i18n.language === 'ar';

  const allNavItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, resource: 'dashboard' },
    { to: '/students', label: t('nav.students'), icon: Users, resource: 'students' },
    { to: '/academics', label: t('nav.academics'), icon: GraduationCap, resource: 'academics' },
    { to: '/timetable', label: t('nav.timetable'), icon: Calendar, resource: 'timetable' },
    { to: '/attendance', label: t('nav.attendance'), icon: CheckCircle2, resource: 'attendance' },
    { to: '/exams', label: t('nav.exams'), icon: FileSpreadsheet, resource: 'exams' },
    { to: '/finance', label: t('nav.finance'), icon: Receipt, resource: 'finance' },
    { to: '/analytics', label: t('nav.ai_notes'), icon: BrainCircuit, resource: 'analytics' },
    { to: '/users', label: t('nav.users', 'Users & Roles'), icon: ShieldCheck, resource: 'users' },
  ];

  const navItems = allNavItems.filter((item) => hasPermission(item.resource, 'read'));

  return (
    <aside
      className={`fixed top-0 bottom-0 z-30 transition-all duration-300 bg-slate-900 text-slate-200 border-slate-800 flex flex-col ${
        isRtl ? 'right-0 border-l' : 'left-0 border-r'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <School className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-base leading-tight tracking-tight">
                {t('shortName')}
              </span>
              <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase">
                {user?.role?.replace('_', ' ') || 'Portal'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Toggle Sidebar"
        >
          {collapsed ? (
            isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User / Sign Out Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-slate-800/40 border border-slate-700/50 flex flex-col">
            <span className="text-xs text-slate-400">Signed in as</span>
            <span className="text-sm font-semibold text-white truncate">{user.username}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};
