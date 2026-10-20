import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Calendar,
  Layers,
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  AlertCircle
} from 'lucide-react';

interface AcademicYearItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface TermItem {
  id: number;
  academic_year: number;
  academic_year_name: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface SectionItem {
  id: number;
  class_level: number;
  class_level_name: string;
  name: string;
  capacity: number;
  enrolled_count?: number;
}

interface ClassLevelItem {
  id: number;
  name: string;
  sections: SectionItem[];
}

interface SubjectItem {
  id: number;
  name: string;
  code: string;
}

export const AcademicsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'years' | 'levels' | 'subjects'>('years');

  // Modals state
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Forms state
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '', is_active: false });
  const [sectionForm, setSectionForm] = useState({ class_level: '', name: '', capacity: '30' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Queries - Robust data extraction supporting both paginated and plain array responses
  const { data: years = [], isLoading: loadingYears } = useQuery<AcademicYearItem[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await apiClient.get('/academic-years/');
      return res.data?.results || res.data || [];
    },
  });

  const { data: terms = [] } = useQuery<TermItem[]>({
    queryKey: ['terms'],
    queryFn: async () => {
      const res = await apiClient.get('/terms/');
      return res.data?.results || res.data || [];
    },
  });

  const { data: classLevels = [], isLoading: loadingLevels } = useQuery<ClassLevelItem[]>({
    queryKey: ['class-levels'],
    queryFn: async () => {
      const res = await apiClient.get('/class-levels/');
      return res.data?.results || res.data || [];
    },
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<SubjectItem[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/subjects/');
      return res.data?.results || res.data || [];
    },
  });

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: async (payload: typeof yearForm) => {
      const res = await apiClient.post('/academic-years/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setShowAddYearModal(false);
      setYearForm({ name: '', start_date: '', end_date: '', is_active: false });
      notify('success', `Academic Year '${data.name}' created successfully.`);
    },
    onError: (err: any) => {
      notify('error', err.response?.data?.name?.[0] || 'Failed to create academic year.');
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async (payload: typeof sectionForm) => {
      const res = await apiClient.post('/sections/', {
        class_level: parseInt(payload.class_level),
        name: payload.name,
        capacity: parseInt(payload.capacity),
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class-levels'] });
      setShowAddSectionModal(false);
      setSectionForm({ class_level: '', name: '', capacity: '30' });
      notify('success', `Section '${data.name}' added successfully.`);
    },
    onError: (err: any) => {
      notify('error', err.response?.data?.name?.[0] || 'Failed to add class section.');
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (payload: typeof subjectForm) => {
      const res = await apiClient.post('/subjects/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setShowAddSubjectModal(false);
      setSubjectForm({ name: '', code: '' });
      notify('success', `Subject '${data.name}' registered successfully.`);
    },
    onError: (err: any) => {
      notify('error', err.response?.data?.name?.[0] || err.response?.data?.code?.[0] || 'Failed to register subject.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            {t('academics.title', 'Academic Structure & Curriculum')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              'academics.subtitle',
              'Manage academic calendars, semesters, grade levels, class sections, and registered subjects'
            )}
          </p>
        </div>

        {/* Action Button depending on active tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'years' && (
            <button
              onClick={() => setShowAddYearModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('academics.addYear', 'Add School Year')}</span>
            </button>
          )}
          {activeTab === 'levels' && (
            <button
              onClick={() => setShowAddSectionModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class Section</span>
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('academics.addSubject', 'Add Subject')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 animate-fadeIn border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('years')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'years'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('academics.yearsTab', 'Academic Years')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {years.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('levels')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'levels'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('academics.levelsTab', 'Class Levels & Sections')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {classLevels.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('academics.subjectsTab', 'Subjects')}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {subjects.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ACADEMIC YEARS & TERMS */}
      {activeTab === 'years' && (
        <div className="space-y-6">
          {loadingYears ? (
            <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>{t('common.loading', 'Loading academic calendars...')}</span>
            </div>
          ) : years.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400">No academic years found. Click "Add School Year" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {years.map((y) => {
                // Find terms for this academic year
                const yearTerms = terms.filter((t) => t.academic_year === y.id);
                return (
                  <div
                    key={y.id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          ID #{y.id}
                        </span>
                        {y.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('academics.activeBadge', 'Active Year')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Archived
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
                        {y.name}
                      </h3>

                      <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            Start Date:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {y.start_date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            End Date:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {y.end_date}
                          </span>
                        </div>
                      </div>

                      {/* Nested Semesters / Terms */}
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                          Academic Semesters / Terms ({yearTerms.length})
                        </span>
                        {yearTerms.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">No terms linked to this year.</span>
                        ) : (
                          <div className="space-y-1.5">
                            {yearTerms.map((term) => (
                              <div
                                key={term.id}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs flex items-center justify-between"
                              >
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {term.name}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {term.start_date} → {term.end_date}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS LEVELS & SECTIONS */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          {loadingLevels ? (
            <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>{t('common.loading', 'Loading class structures...')}</span>
            </div>
          ) : classLevels.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400">No class levels found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classLevels.map((cl) => (
                <div
                  key={cl.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                          {cl.name}
                        </h3>
                        <span className="text-xs text-slate-400">
                          Level ID #{cl.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {cl.sections?.length || 0} Sections
                    </span>
                  </div>

                  {/* Section Cards */}
                  {(!cl.sections || cl.sections.length === 0) ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      No sections allocated for this class level yet. Click "Add Class Section" to create one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {cl.sections.map((sec) => (
                        <div
                          key={sec.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500/40 transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-black text-base text-slate-900 dark:text-white">
                              {sec.name}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                              Cap: {sec.capacity}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>Enrolled: {sec.enrolled_count || 0} students</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBJECTS CURRICULUM */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {loadingSubjects ? (
            <div className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>{t('common.loading', 'Loading curriculum subjects...')}</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-400">No subjects registered. Click "Add Subject" to register one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {subj.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60">
                        {subj.code}
                      </span>
                      <span className="text-[11px] text-slate-400">Core Curriculum</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD ACADEMIC YEAR */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Add Academic Year
              </h3>
              <button
                onClick={() => setShowAddYearModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createYearMutation.mutate(yearForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Year Name *
                </label>
                <input
                  type="text"
                  required
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="e.g. 2026-2027 or 2028"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={yearForm.start_date}
                    onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={yearForm.end_date}
                    onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_year"
                  checked={yearForm.is_active}
                  onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="is_active_year" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Set as Active Current Academic Year
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createYearMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {createYearMutation.isPending ? 'Saving...' : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLASS SECTION */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Add Class Section
              </h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSectionMutation.mutate(sectionForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Grade Level *
                </label>
                <select
                  required
                  value={sectionForm.class_level}
                  onChange={(e) => setSectionForm({ ...sectionForm, class_level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Class Level...</option>
                  {classLevels.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="e.g. 10-B, 11-A, Science-1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class Capacity (Students) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={sectionForm.capacity}
                  onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSectionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {createSectionMutation.isPending ? 'Saving...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBJECT */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Register New Subject
              </h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSubjectMutation.mutate(subjectForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Biology, Chemistry, Computer Science"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  placeholder="e.g. BIO101, CHEM201, CS101"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubjectMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {createSubjectMutation.isPending ? 'Saving...' : 'Register Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicsPage;
