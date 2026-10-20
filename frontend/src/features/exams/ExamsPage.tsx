import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Award } from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');

  // 1. Fetch exam types
  const { data: examTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: async () => (await apiClient.get('/exam-types/')).data?.results || [],
  });

  // 2. Fetch all marks
  const { data: marks, isLoading } = useQuery({
    queryKey: ['all-marks'],
    queryFn: async () => (await apiClient.get('/marks/')).data?.results || [],
  });

  // 3. Fetch students for transcript filter
  const { data: students } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: async () => (await apiClient.get('/students/')).data?.results || [],
  });

  // 4. Fetch transcript if student selected
  const { data: transcript } = useQuery({
    queryKey: ['report-card', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      const res = await apiClient.get('/marks/report-card/', {
        params: { student_id: selectedStudentId },
      });
      return res.data;
    },
    enabled: !!selectedStudentId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('exams.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('exams.subtitle')}
        </p>
      </div>

      {/* Assessment Weights Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {examTypes?.map((et: any) => (
          <div
            key={et.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-xs text-slate-400 font-semibold">{t('exams.examTypes')}</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{et.name}</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs">
              {et.weight_percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Student Transcript Viewer Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {t('exams.viewTranscript')}
            </h3>
            <p className="text-xs text-slate-400">Generate student report card and weighted term average</p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- {t('exams.selectStudent')} --</option>
            {students?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.full_name} (ID #{s.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generated Report Card Card */}
      {selectedStudentId && transcript && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-700/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Official Academic Transcript</span>
              <h3 className="text-xl font-black mt-0.5">{transcript.student_name}</h3>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
              <span className="text-xs text-slate-300">Cumulative Average:</span>
              <span className="text-2xl font-black text-emerald-400">{transcript.overall_percentage}%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="text-indigo-300 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-2.5">{t('exams.subject')}</th>
                  <th className="py-2.5">Code</th>
                  <th className="py-2.5 text-center">{t('exams.score')}</th>
                  <th className="py-2.5 text-center">{t('exams.percentage')}</th>
                  <th className="py-2.5 text-center">{t('exams.grade')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transcript.subjects?.map((subj: any, i: number) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="py-3 font-semibold text-white">{subj.subject}</td>
                    <td className="py-3 text-indigo-300 font-mono">{subj.code}</td>
                    <td className="py-3 text-center">{subj.subject_score} / {subj.subject_max}</td>
                    <td className="py-3 text-center font-bold text-white">{subj.percentage}%</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        subj.grade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        subj.grade === 'B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        subj.grade === 'C' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {subj.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks Master Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
            Recorded Gradebook Ledger
          </h3>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">{t('students.fullName')}</th>
                  <th className="px-6 py-3.5">{t('academics.subjectsTab')}</th>
                  <th className="px-6 py-3.5">{t('exams.examTypes')}</th>
                  <th className="px-6 py-3.5 text-center">{t('exams.score')}</th>
                  <th className="px-6 py-3.5 text-center">{t('exams.percentage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marks?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                      {m.student_name}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {m.subject_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {m.exam_type_name}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                      {m.score} / {m.max_score}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        m.percentage >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        m.percentage >= 60 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {m.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
