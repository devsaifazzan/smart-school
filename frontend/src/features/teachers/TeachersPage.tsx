import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Search,
  UserPlus,
  Phone,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CreateTeacherModal } from './CreateTeacherModal';

export const TeachersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canCreateTeacher =
    !user?.role ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    hasPermission('teachers', 'create');

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers-list', searchTerm],
    queryFn: async () => {
      const res = await apiClient.get('/teachers/', {
        params: { search: searchTerm },
      });
      return res.data?.results || res.data || [];
    },
  });

  const teacherList: any[] = Array.isArray(teachers)
    ? teachers
    : Array.isArray((teachers as any)?.results)
    ? (teachers as any).results
    : [];

  const filteredTeachers = teacherList.filter((teacher) => {
    if (statusFilter === 'all') return true;
    return teacher.employment_status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('teachers.active', 'Active (On Duty)')}
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('teachers.onLeave', 'On Leave')}
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t('teachers.suspended', 'Suspended')}
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            {t('teachers.terminated', 'Terminated')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status || 'Active'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('teachers.title', 'Faculty & Teachers Directory')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            {t(
              'teachers.subtitle',
              'Comprehensive staff directory, employment status, and academic specializations'
            )}
          </p>
        </div>

        {canCreateTeacher && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition duration-150 transform active:scale-95 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('teachers.addTeacher', 'Add New Teacher')}</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3.5 rtl:right-3.5 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(
              'teachers.searchPlaceholder',
              'Search by teacher name, subject, phone, national ID...'
            )}
            className="w-full pl-10 pr-4 rtl:pr-10 rtl:pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{isRTL ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="active">{t('teachers.active', 'Active (On Duty)')}</option>
            <option value="on_leave">{t('teachers.onLeave', 'On Leave')}</option>
            <option value="suspended">{t('teachers.suspended', 'Suspended')}</option>
            <option value="terminated">{t('teachers.terminated', 'Terminated')}</option>
          </select>

          <span className="text-xs font-bold text-slate-500 shrink-0">
            {filteredTeachers.length} {isRTL ? 'معلم' : 'Faculty'}
          </span>
        </div>
      </div>

      {/* Teachers Directory: Mobile Cards (<md) & Desktop Table (>=md) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {t('common.loading', 'Loading...')}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            {t('teachers.noTeachers', 'No teacher profiles found matching criteria.')}
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (<md) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTeachers.map((teacher: any) => (
                <div key={teacher.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {teacher.first_name?.[0] || 'T'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {teacher.email || teacher.username}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(teacher.employment_status || 'active')}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {t('teachers.specialization', 'Subject')}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {teacher.specialization || 'General Academic'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {t('teachers.qualification', 'Qualification')}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">
                        {teacher.qualification || "Bachelor's Degree"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {t('teachers.yearsExperience', 'Experience')}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">
                        {teacher.years_of_experience ?? 1} {isRTL ? 'سنوات' : 'yrs'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {t('teachers.phone', 'Phone')}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                        {teacher.phone_number || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => setSelectedTeacher(teacher)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 active:scale-95 transition shadow-2xs"
                    >
                      {t('dashboard.viewAll', 'View Details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE VIEW (>=md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">{t('students.fullName', 'Teacher Name')}</th>
                    <th className="px-6 py-4">{t('teachers.specialization', 'Specialization')}</th>
                    <th className="px-6 py-4">{t('teachers.qualification', 'Qualification')}</th>
                    <th className="px-6 py-4">{t('teachers.phone', 'Phone / Contact')}</th>
                    <th className="px-6 py-4">{t('teachers.employmentStatus', 'Status')}</th>
                    <th className="px-6 py-4 text-center">{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTeachers.map((teacher: any) => (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            {teacher.first_name?.[0] || 'T'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}
                            </span>
                            <span className="text-xs text-slate-400 block font-mono">
                              {teacher.email || teacher.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {teacher.specialization || 'General Academic'}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs">
                        <div>{teacher.qualification || "Bachelor's Degree"}</div>
                        <div className="text-[11px] text-slate-400">
                          {teacher.years_of_experience ?? 1} {isRTL ? 'سنوات خبرة' : 'yrs experience'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                        {teacher.phone_number ? (
                          <a
                            href={`tel:${teacher.phone_number}`}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {teacher.phone_number}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(teacher.employment_status || 'active')}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition shadow-2xs"
                        >
                          {t('dashboard.viewAll', 'View Details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Teacher Profile Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedTeacher(null)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-black">
                  {selectedTeacher.first_name?.[0] || 'T'}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">
                    {selectedTeacher.full_name ||
                      `${selectedTeacher.first_name} ${selectedTeacher.last_name}`}
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {selectedTeacher.specialization || 'Faculty Staff'} • {selectedTeacher.qualification || "Bachelor's"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {t('teachers.employmentStatus', 'Status')}
                  </span>
                  <div>{getStatusBadge(selectedTeacher.employment_status || 'active')}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {t('teachers.gender', 'Gender')}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedTeacher.gender === 'female' ? t('teachers.female', 'Female') : t('teachers.male', 'Male')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {t('teachers.nationalId', 'National ID')}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedTeacher.national_id || '—'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {t('teachers.yearsExperience', 'Experience')}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedTeacher.years_of_experience ?? 1} {isRTL ? 'سنوات' : 'years'}
                  </span>
                </div>
              </div>

              {/* Contact Information Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{t('teachers.contactInfo', 'Contact Details')}</span>
                </h4>
                <div className="space-y-1.5 pl-6 rtl:pr-6 rtl:pl-0">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('teachers.email', 'Email')}:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedTeacher.email || `${selectedTeacher.username}@school.edu`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('teachers.phone', 'Phone')}:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedTeacher.phone_number || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('teachers.username', 'System Username')}:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedTeacher.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
              >
                {t('common.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Teacher Modal */}
      <CreateTeacherModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
