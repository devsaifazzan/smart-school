import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Key,
} from 'lucide-react';

interface CreateTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTeacherModal: React.FC<CreateTeacherModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    national_id: '',
    email: '',
    phone_number: '',
    specialization: '',
    employment_status: 'active',
    qualification: "Bachelor's Degree",
    years_of_experience: 1,
    hire_date: new Date().toISOString().split('T')[0],
    username: '',
    password: '',
  });

  const [showAccountCustomization, setShowAccountCustomization] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTeacher, setCreatedTeacher] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'male',
      national_id: '',
      email: '',
      phone_number: '',
      specialization: '',
      employment_status: 'active',
      qualification: "Bachelor's Degree",
      years_of_experience: 1,
      hire_date: new Date().toISOString().split('T')[0],
      username: '',
      password: '',
    });
    setErrorMessage(null);
    setCreatedTeacher(null);
    setShowAccountCustomization(false);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const createTeacherMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiClient.post('/teachers/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers-list'] });
      setCreatedTeacher(data);
    },
    onError: (err: any) => {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        JSON.stringify(err.response?.data) ||
        'Failed to register teacher profile.';
      setErrorMessage(detail);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMessage(
        isRTL
          ? 'يرجى إدخال الاسم الأول واسم العائلة.'
          : 'Please enter both first name and last name.'
      );
      return;
    }

    createTeacherMutation.mutate(formData);
  };

  const copyCredentials = () => {
    const credText = `Teacher Portal Login:\nUsername: ${
      createdTeacher?.credentials?.username || createdTeacher?.username
    }\nPassword: ${createdTeacher?.credentials?.password || 'teacher123'}\nURL: ${
      window.location.origin
    }/login`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('teachers.modalTitle', 'Add New Teacher Profile')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(
                  'teachers.modalSubtitle',
                  'Enter complete personal, contact, and academic details for the staff profile.'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success / Credentials View */}
          {createdTeacher ? (
            <div className="space-y-6 py-4 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('teachers.createdSuccess', 'Teacher profile created successfully!')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {t(
                    'teachers.credentialsAlert',
                    'Make sure to save the login credentials for the teacher:'
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t('teachers.fullName', 'Full Name')}:
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {createdTeacher.full_name || `${createdTeacher.first_name} ${createdTeacher.last_name}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t('teachers.username', 'Username')}:
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
                    {createdTeacher.credentials?.username || createdTeacher.username}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {t('teachers.password', 'Password')}:
                  </span>
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    {createdTeacher.credentials?.password || 'teacher123'}
                  </span>
                </div>
                {createdTeacher.specialization && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {t('teachers.specialization', 'Specialization')}:
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {createdTeacher.specialization}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{t('teachers.copied', 'Copied!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>{t('teachers.copyCredentials', 'Copy Credentials')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition"
                >
                  {t('common.done', 'Done')}
                </button>
              </div>
            </div>
          ) : (
            <form id="create-teacher-form" onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                  {t('teachers.personalInfo', '1. PERSONAL INFORMATION')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.firstName', 'First Name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. John"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.lastName', 'Last Name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.gender', 'Gender')}
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="male">{t('teachers.male', 'Male')}</option>
                      <option value="female">{t('teachers.female', 'Female')}</option>
                    </select>
                  </div>

                  {/* National ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.nationalId', 'National ID')}
                    </label>
                    <input
                      type="text"
                      value={formData.national_id}
                      onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                      placeholder="e.g. 1029384756"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT INFORMATION */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                  {t('teachers.contactInfo', '2. CONTACT INFORMATION')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.email', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. teacher@school.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.phone', 'Phone Number')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="e.g. +1 555 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROFESSIONAL DETAILS & EMPLOYMENT STATUS */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
                  {t('teachers.professionalInfo', '3. PROFESSIONAL DETAILS & EMPLOYMENT STATUS')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Specialization / Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.specialization', 'Specialization / Subject')}
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Mathematics"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.employmentStatus', 'Employment Status')} *
                    </label>
                    <select
                      value={formData.employment_status}
                      onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs sm:text-sm text-emerald-900 dark:text-emerald-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="active">{t('teachers.active', 'Active (On Duty)')}</option>
                      <option value="on_leave">{t('teachers.onLeave', 'On Leave')}</option>
                      <option value="suspended">{t('teachers.suspended', 'Suspended')}</option>
                      <option value="terminated">{t('teachers.terminated', 'Terminated')}</option>
                    </select>
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.qualification', 'Qualification')}
                    </label>
                    <select
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="Bachelor's Degree">{t('teachers.bachelor', "Bachelor's Degree")}</option>
                      <option value="Master's Degree">{t('teachers.master', "Master's Degree")}</option>
                      <option value="Doctorate (PhD)">{t('teachers.doctorate', 'Doctorate (PhD)')}</option>
                      <option value="Higher Diploma">{t('teachers.diploma', 'Higher Diploma')}</option>
                      <option value="High School">{t('teachers.highSchool', 'High School / Other')}</option>
                    </select>
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('teachers.yearsExperience', 'Years of Experience')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.years_of_experience}
                      onChange={(e) =>
                        setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })
                      }
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Optional: Customized Portal Credentials */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAccountCustomization(!showAccountCustomization)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>
                    {showAccountCustomization
                      ? (isRTL ? 'إخفاء تخصيص اسم المستخدم وكلمة المرور' : 'Hide Custom Credentials (Auto-generated)')
                      : (isRTL ? 'تخصيص اسم المستخدم أو كلمة المرور يدوياً' : 'Customize Login Credentials (Optional)')}
                  </span>
                </button>

                {showAccountCustomization && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('teachers.username', 'Username (Optional)')}
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="e.g. teacher.john"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('teachers.password', 'Password (Optional)')}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Defaults to teacher123"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        {!createdTeacher && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t('teachers.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              form="create-teacher-form"
              disabled={createTeacherMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition transform active:scale-95"
            >
              {createTeacherMutation.isPending ? (
                <span>{t('teachers.saving', 'Saving...')}</span>
              ) : (
                <span>{t('teachers.saveTeacher', 'Save Teacher')}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
