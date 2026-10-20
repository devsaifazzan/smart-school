import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Search, HeartPulse } from 'lucide-react';

export const StudentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ['students-list', searchTerm],
    queryFn: async () => {
      const res = await apiClient.get('/students/', {
        params: { search: searchTerm },
      });
      return res.data?.results || res.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('students.title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('students.subtitle')}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3.5 rtl:right-3.5 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('students.searchPlaceholder')}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {students?.length || 0} {t('students.fullName')}
        </span>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {t('common.loading')}
          </div>
        ) : students?.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {t('students.noStudents')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">{t('students.fullName')}</th>
                  <th className="px-6 py-4">{t('students.section')}</th>
                  <th className="px-6 py-4">{t('students.nationalId')}</th>
                  <th className="px-6 py-4">{t('students.phone')}</th>
                  <th className="px-6 py-4">{t('students.guardians')}</th>
                  <th className="px-6 py-4 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student: any) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.first_name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-slate-400">{student.email || student.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.current_section ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {student.current_section.class_level} - {student.current_section.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {student.national_id || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {student.phone_number || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {student.guardians?.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {student.guardians.map((g: any) => (
                            <span key={g.id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No guardian linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 transition"
                      >
                        {t('dashboard.viewAll')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {selectedStudent.first_name?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-xs text-slate-400">ID #{selectedStudent.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 uppercase font-semibold">{t('students.gender')}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.gender || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 uppercase font-semibold">{t('students.bloodType')}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.blood_type || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 uppercase font-semibold">{t('students.nationalId')}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.national_id || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-400 uppercase font-semibold">{t('students.enrollmentDate')}</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStudent.enrollment_date}</p>
              </div>
            </div>

            {selectedStudent.medical_conditions && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" />
                  {t('students.medicalNotes')}
                </span>
                <p className="text-amber-700 dark:text-amber-200 mt-1">{selectedStudent.medical_conditions}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold transition"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
