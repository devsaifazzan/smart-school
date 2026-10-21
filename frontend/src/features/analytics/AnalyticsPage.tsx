import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { BrainCircuit, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Fetch AI student notes
  const { data: rawNotes, isLoading } = useQuery({
    queryKey: ['ai-notes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/notes/');
      return res.data?.results || res.data || [];
    },
  });

  const notes = Array.isArray(rawNotes) ? rawNotes : [];

  // 2. Trigger diagnostic scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => await apiClient.post('/analytics/notes/generate-notes/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-notes-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const urgentCount = notes.filter((n: any) => n.requires_intervention).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-2.5">
            <BrainCircuit className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{t('analytics.title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {scanMutation.isPending ? t('analytics.analyzing') : t('analytics.runAnalysis')}
          </span>
        </button>
      </div>

      {/* Summary Alert Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider">
              {t('analytics.interventionRequired')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-100 mt-0.5">
              {urgentCount} Students
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">
              {t('analytics.onTrack')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {(notes?.length || 0) - urgentCount} Students
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostic Cards List */}
      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">{t('common.loading')}</div>
        ) : notes?.length === 0 ? (
          <div className="py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-400">
            No diagnostic notes generated yet. Click "Run Smart Diagnostic Scan" above to analyze.
          </div>
        ) : (
          notes.map((note: any) => (
            <div
              key={note.id}
              className={`p-4 sm:p-6 rounded-2xl border transition shadow-xs ${
                note.requires_intervention
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      note.requires_intervention
                        ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
                    }`}
                  >
                    {note.student_name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {note.student_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Section: {note.student_section} • ID #{note.student}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    note.requires_intervention
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {note.requires_intervention ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('analytics.interventionRequired')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('analytics.onTrack')}
                    </>
                  )}
                </span>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {note.note_content}
              </p>

              {note.insights_json && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-4 text-xs">
                  {note.insights_json.attendance_rate !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Attendance:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {note.insights_json.attendance_rate}%
                      </span>
                    </div>
                  )}
                  {note.insights_json.grade_average !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Academic Average:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {note.insights_json.grade_average}%
                      </span>
                    </div>
                  )}
                  <div className="ml-auto rtl:mr-auto rtl:ml-0 text-slate-400 font-mono text-[11px]">
                    {note.generated_at?.slice(0, 10)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
