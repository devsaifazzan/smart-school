import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Check } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimetableId, setSelectedTimetableId] = useState<number | ''>('');
  const [remarksMap, setRemarksMap] = useState<Record<number, string>>({});
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch available timetables for selection
  const { data: timetables } = useQuery({
    queryKey: ['attendance-timetables'],
    queryFn: async () => (await apiClient.get('/timetables/')).data?.results || [],
  });

  // 2. Fetch students enrolled in the chosen timetable's section
  const selectedTimetable = timetables?.find((t: any) => t.id === Number(selectedTimetableId));

  const { data: enrollments } = useQuery({
    queryKey: ['section-enrollments', selectedTimetable?.section],
    queryFn: async () => {
      if (!selectedTimetable) return [];
      const res = await apiClient.get('/enrollments/', {
        params: { section: selectedTimetable.section },
      });
      return res.data?.results || res.data || [];
    },
    enabled: !!selectedTimetable,
  });

  // 3. Fetch existing attendance for this timetable & date
  useQuery({
    queryKey: ['existing-attendance', selectedTimetableId, selectedDate],
    queryFn: async () => {
      if (!selectedTimetableId) return [];
      const res = await apiClient.get('/attendance/', {
        params: { timetable: selectedTimetableId, date: selectedDate },
      });
      const records = res.data?.results || res.data || [];
      const newStatusMap: Record<number, string> = {};
      const newRemarksMap: Record<number, string> = {};
      records.forEach((r: any) => {
        newStatusMap[r.student] = r.status;
        if (r.remarks) newRemarksMap[r.student] = r.remarks;
      });
      setStatusMap(newStatusMap);
      setRemarksMap(newRemarksMap);
      return records;
    },
    enabled: !!selectedTimetableId,
  });

  // 4. Save bulk attendance mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTimetableId || !enrollments) return;
      const entries = enrollments.map((enr: any) => ({
        student_id: enr.student,
        status: statusMap[enr.student] || 'Present',
        remarks: remarksMap[enr.student] || '',
      }));
      return await apiClient.post('/attendance/bulk-mark/', {
        timetable_id: Number(selectedTimetableId),
        date: selectedDate,
        entries,
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['existing-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const markAll = (status: string) => {
    if (!enrollments) return;
    const updated: Record<number, string> = {};
    enrollments.forEach((enr: any) => {
      updated[enr.student] = status;
    });
    setStatusMap(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('attendance.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('attendance.subtitle')}
        </p>
      </div>

      {/* Select Controls Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t('attendance.date')}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t('attendance.selectTimetable')}
          </label>
          <select
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choose scheduled lesson --</option>
            {timetables?.map((tt: any) => (
              <option key={tt.id} value={tt.id}>
                {tt.day_of_week} ({tt.start_time.slice(0, 5)}-{tt.end_time.slice(0, 5)}) : {tt.section_name} - {tt.subject_name} ({tt.teacher_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Sheet */}
      {selectedTimetable && enrollments && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {selectedTimetable.subject_name} — {selectedTimetable.section_name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {enrollments.length} Enrolled Students • {selectedDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAll('Present')}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
              >
                {t('attendance.bulkMarkPresent')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('students.fullName')}</th>
                  <th className="px-4 py-3 text-center">{t('attendance.present')}</th>
                  <th className="px-4 py-3 text-center">{t('attendance.absent')}</th>
                  <th className="px-4 py-3 text-center">{t('attendance.late')}</th>
                  <th className="px-4 py-3 text-center">{t('attendance.excused')}</th>
                  <th className="px-4 py-3">{t('attendance.remarks')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {enrollments.map((enr: any) => {
                  const currentStatus = statusMap[enr.student] || 'Present';
                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {enr.student_name}
                      </td>
                      {['Present', 'Absent', 'Late', 'Excused'].map((statusOption) => (
                        <td key={statusOption} className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setStatusMap({ ...statusMap, [enr.student]: statusOption })}
                            className={`w-7 h-7 rounded-lg text-xs font-bold inline-flex items-center justify-center transition ${
                              currentStatus === statusOption
                                ? statusOption === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : statusOption === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : statusOption === 'Late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {statusOption[0]}
                          </button>
                        </td>
                      ))}
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          value={remarksMap[enr.student] || ''}
                          onChange={(e) => setRemarksMap({ ...remarksMap, [enr.student]: e.target.value })}
                          placeholder="Note..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {t('common.success')}
              </span>
            )}
            <div className="ml-auto rtl:mr-auto rtl:ml-0">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {saveMutation.isPending ? t('common.loading') : t('attendance.saveAttendance')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
