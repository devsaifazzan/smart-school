import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/notes/dashboard/');
      return res.data;
    },
  });

  const summary = data?.summary || {};
  const alerts = data?.alerts || [];

  // Attendance bar chart mock weekly flow + real overall rate
  const attendanceData = [
    { day: 'Sun', rate: summary.attendance_rate || 92 },
    { day: 'Mon', rate: Math.min(100, (summary.attendance_rate || 90) + 2) },
    { day: 'Tue', rate: Math.max(80, (summary.attendance_rate || 94) - 3) },
    { day: 'Wed', rate: Math.min(100, (summary.attendance_rate || 91) + 4) },
    { day: 'Thu', rate: summary.attendance_rate || 93 },
  ];

  // Financial breakdown
  const financeData = [
    { name: t('dashboard.totalCollected'), value: summary.total_collected || 0, color: '#10b981' },
    { name: t('dashboard.outstandingBalance'), value: summary.outstanding_balance || 0, color: '#f59e0b' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] sm:text-xs font-bold truncate max-w-[200px]">
            {summary.active_academic_year || 'Academic Year'}
          </span>
          <button
            onClick={() => refetch()}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] sm:text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs active:scale-95"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {t('dashboard.totalStudents')}
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.total_students ?? 0}
            </p>
          </div>
        </div>

        {/* Total Faculty */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {t('dashboard.totalTeachers')}
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.total_teachers ?? 0}
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {t('dashboard.attendanceRate')}
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.attendance_rate ?? 0}%
            </p>
          </div>
        </div>

        {/* Intervention Alerts */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col xs:flex-row items-start xs:items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {t('dashboard.interventionsCount')}
            </p>
            <p className="text-lg sm:text-2xl font-black text-rose-600 mt-0.5">
              {summary.interventions_count ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-indigo-800/40">
          <span className="text-[11px] sm:text-xs text-indigo-300 font-semibold uppercase tracking-wider">
            {t('dashboard.totalInvoiced')}
          </span>
          <p className="text-xl sm:text-2xl font-black mt-1">
            ${(summary.total_invoiced || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-800/40">
          <span className="text-[11px] sm:text-xs text-emerald-300 font-semibold uppercase tracking-wider">
            {t('dashboard.totalCollected')}
          </span>
          <p className="text-xl sm:text-2xl font-black mt-1 text-emerald-400">
            ${(summary.total_collected || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-amber-800/40">
          <span className="text-[11px] sm:text-xs text-amber-300 font-semibold uppercase tracking-wider">
            {t('dashboard.outstandingBalance')}
          </span>
          <p className="text-xl sm:text-2xl font-black mt-1 text-amber-400">
            ${(summary.outstanding_balance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attendance Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              {t('dashboard.attendanceChart')}
            </h3>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm tracking-tight flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {t('dashboard.financeChart')}
            </h3>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Alerts Feed */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm tracking-tight flex items-center gap-2 mb-3 sm:mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          {t('dashboard.recentAlerts')}
        </h3>

        {alerts.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-400 py-4 text-center">
            {t('dashboard.noAlerts')}
          </p>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="p-3.5 sm:p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                    {alert.student_name}
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                    {alert.note}
                  </p>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-rose-500 self-end sm:self-auto shrink-0">
                  {alert.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

