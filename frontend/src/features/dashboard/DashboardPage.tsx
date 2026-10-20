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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('dashboard.title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
            {summary.active_academic_year || 'Academic Year'}
          </span>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
          >
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalStudents')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.total_students ?? 0}
            </p>
          </div>
        </div>

        {/* Total Faculty */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.totalTeachers')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.total_teachers ?? 0}
            </p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.attendanceRate')}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {summary.attendance_rate ?? 0}%
            </p>
          </div>
        </div>

        {/* Intervention Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('dashboard.interventionsCount')}
            </p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">
              {summary.interventions_count ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-indigo-800/40">
          <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
            {t('dashboard.totalInvoiced')}
          </span>
          <p className="text-2xl font-black mt-1">
            ${(summary.total_invoiced || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-800/40">
          <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
            {t('dashboard.totalCollected')}
          </span>
          <p className="text-2xl font-black mt-1 text-emerald-400">
            ${(summary.total_collected || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-amber-800/40">
          <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
            {t('dashboard.outstandingBalance')}
          </span>
          <p className="text-2xl font-black mt-1 text-amber-400">
            ${(summary.outstanding_balance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              {t('dashboard.attendanceChart')}
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {t('dashboard.financeChart')}
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Smart Alerts Feed */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          {t('dashboard.recentAlerts')}
        </h3>

        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            {t('dashboard.noAlerts')}
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-start justify-between gap-4"
              >
                <div>
                  <span className="font-bold text-sm text-rose-900 dark:text-rose-200">
                    {alert.student_name}
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                    {alert.note}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-rose-500 shrink-0">
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
