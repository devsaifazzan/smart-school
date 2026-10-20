import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  X,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Phone,
  Shield,
  HeartPulse,
  Key,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  School,
  MapPin,
  IdCard,
} from 'lucide-react';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '2010-01-01',
    national_id: '',
    blood_type: 'O+',
    academic_year_id: '',
    section_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    phone_number: '',
    address: '',
    medical_conditions: '',
    username: '',
    password: '',
    email: '',
  });

  // Fetch Academic Years
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years-select'],
    queryFn: async () => {
      const res = await apiClient.get('/academic-years/');
      return res.data?.results || res.data || [];
    },
    enabled: isOpen,
  });

  // Fetch Sections (with class level information)
  const { data: sections } = useQuery({
    queryKey: ['sections-select'],
    queryFn: async () => {
      const res = await apiClient.get('/sections/');
      return res.data?.results || res.data || [];
    },
    enabled: isOpen,
  });

  const yearsList: any[] = Array.isArray(academicYears)
    ? academicYears
    : Array.isArray((academicYears as any)?.results)
    ? (academicYears as any).results
    : [];

  const sectionsList: any[] = Array.isArray(sections)
    ? sections
    : Array.isArray((sections as any)?.results)
    ? (sections as any).results
    : [];

  // Set default active academic year when loaded
  React.useEffect(() => {
    if (yearsList.length > 0 && !formData.academic_year_id) {
      const activeYear = yearsList.find((y: any) => y.is_active) || yearsList[0];
      setFormData((prev) => ({ ...prev, academic_year_id: String(activeYear.id) }));
    }
  }, [yearsList, formData.academic_year_id]);

  // Set default section when loaded
  React.useEffect(() => {
    if (sectionsList.length > 0 && !formData.section_id) {
      setFormData((prev) => ({ ...prev, section_id: String(sectionsList[0].id) }));
    }
  }, [sectionsList, formData.section_id]);

  // Auto-generate credentials helper
  const handleAutoGenerateCredentials = () => {
    const fn = (formData.first_name || 'student').toLowerCase().trim().replace(/\s+/g, '');
    const ln = (formData.last_name || 'user').toLowerCase().trim().replace(/\s+/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `${fn}.${ln}${randomSuffix}`;
    const generatedPassword = `Std#${Math.floor(1000 + Math.random() * 9000)}!`;
    const generatedEmail = `${generatedUsername}@school.edu`;

    setFormData((prev) => ({
      ...prev,
      username: generatedUsername,
      password: generatedPassword,
      email: generatedEmail,
    }));
  };

  // Create Student Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/students/', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      queryClient.invalidateQueries({ queryKey: ['sections-select'] });
      setCreatedStudent(data);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      const errDetail =
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.first_name?.[0] ||
        (err.response?.data ? JSON.stringify(err.response.data) : 'Failed to register student. Please try again.');
      setErrorMessage(errDetail);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMessage(isRTL ? 'يرجى إدخال الاسم الأول واسم العائلة للطالب' : 'First Name and Last Name are required.');
      setStep(1);
      return;
    }

    const payload: any = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      gender: formData.gender,
      date_of_birth: formData.date_of_birth || null,
      national_id: formData.national_id.trim() || null,
      blood_type: formData.blood_type || null,
      enrollment_date: formData.enrollment_date,
      phone_number: formData.phone_number.trim() || null,
      address: formData.address.trim() || null,
      medical_conditions: formData.medical_conditions.trim() || null,
    };

    if (formData.section_id) {
      payload.section_id = Number(formData.section_id);
    }
    if (formData.academic_year_id) {
      payload.academic_year_id = Number(formData.academic_year_id);
    }
    if (formData.username.trim()) {
      payload.username = formData.username.trim();
    }
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }
    if (formData.email.trim()) {
      payload.email = formData.email.trim();
    }

    createMutation.mutate(payload);
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      gender: 'male',
      date_of_birth: '2010-01-01',
      national_id: '',
      blood_type: 'O+',
      academic_year_id: academicYears?.[0]?.id ? String(academicYears[0].id) : '',
      section_id: sections?.[0]?.id ? String(sections[0].id) : '',
      enrollment_date: new Date().toISOString().split('T')[0],
      phone_number: '',
      address: '',
      medical_conditions: '',
      username: '',
      password: '',
      email: '',
    });
    setStep(1);
    setCreatedStudent(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedSection = sectionsList.find((s: any) => String(s.id) === String(formData.section_id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                {isRTL ? 'تسجيل طالب جديد' : 'Register New Student'}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {isRTL ? 'نظام القيد الذكي' : 'Smart Enrollment'}
                </span>
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {isRTL
                  ? 'إنشاء الملف الأكاديمي، تعيين الشعبة، وتوليد حساب البوابة'
                  : 'Create academic profile, assign section, and configure portal credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Modal View */}
        {createdStudent ? (
          <div className="p-8 space-y-6 text-center animate-in zoom-in-95 duration-200 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isRTL ? 'تم تسجيل الطالب بنجاح! 🎉' : 'Student Registered Successfully! 🎉'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isRTL
                  ? `تم إنشاء السجل الأكاديمي للطالب "${createdStudent.full_name}" بنجاح في النظام.`
                  : `Academic profile for "${createdStudent.full_name}" has been created.`}
              </p>
            </div>

            {/* Credentials Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left rtl:text-right space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <Key className="w-4 h-4" />
                  {isRTL ? 'بيانات تسجيل الدخول للبوابة' : 'Student Portal Credentials'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = `Username: ${createdStudent.username}\nPassword: ${formData.password || 'student123'}`;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? (isRTL ? 'تم النسخ' : 'Copied!') : (isRTL ? 'نسخ البيانات' : 'Copy')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">{isRTL ? 'اسم المستخدم:' : 'Username:'}</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {createdStudent.username}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">{isRTL ? 'كلمة المرور:' : 'Initial Password:'}</span>
                  <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                    {formData.password || 'student123'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">{isRTL ? 'البريد الإلكتروني:' : 'Email:'}</span>
                  <p className="text-slate-700 dark:text-slate-300 truncate mt-0.5">
                    {createdStudent.email || `${createdStudent.username}@school.edu`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">{isRTL ? 'الشعبة المسجلة:' : 'Assigned Section:'}</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {createdStudent.current_section
                      ? `${createdStudent.current_section.class_level} - ${createdStudent.current_section.name}`
                      : 'Not Assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isRTL ? '+ تسجيل طالب آخر' : '+ Register Another Student'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
              >
                {isRTL ? 'تم والعودة للدليل' : 'Done & Return to Directory'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Step Navigation Tabs */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${
                    step === 1
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    1
                  </span>
                  <span>{isRTL ? 'البيانات الشخصية' : 'Personal Info'}</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${
                    step === 2
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    2
                  </span>
                  <span>{isRTL ? 'التسكين والقيد' : 'Academic Placement'}</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 rtl:rotate-180" />

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${
                    step === 3
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    3
                  </span>
                  <span>{isRTL ? 'حساب البوابة والتواصل' : 'Portal & Contact'}</span>
                </button>
              </div>

              {/* Student Card Mini Preview Badge */}
              <div className="hidden md:flex items-center gap-2 text-xs bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {formData.first_name || formData.last_name
                    ? `${formData.first_name} ${formData.last_name}`
                    : (isRTL ? 'معاينة الطالب' : 'Student Preview')}
                </span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Form Step Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* STEP 1: Personal Profile */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL ? 'الاسم الأول *' : 'First Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder={isRTL ? 'مثال: عمر' : 'e.g. Omar'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL ? 'اسم العائلة *' : 'Last Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder={isRTL ? 'مثال: الفاروق' : 'e.g. Al-Farooq'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition"
                      />
                    </div>
                  </div>

                  {/* Gender Selector Cards */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isRTL ? 'الجنس' : 'Gender'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: 'male' })}
                        className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                          formData.gender === 'male'
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>👦</span>
                        <span>{isRTL ? 'ذكر' : 'Male'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: 'female' })}
                        className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                          formData.gender === 'female'
                            ? 'border-pink-600 bg-pink-50/70 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 ring-2 ring-pink-500/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>👧</span>
                        <span>{isRTL ? 'أنثى' : 'Female'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <IdCard className="w-3.5 h-3.5 text-slate-400" />
                        {isRTL ? 'الهوية الوطنية / السجل' : 'National ID / Iqama'}
                      </label>
                      <input
                        type="text"
                        value={formData.national_id}
                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                        placeholder="1098234812"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        {isRTL ? 'فصيلة الدم' : 'Blood Type'}
                      </label>
                      <select
                        value={formData.blood_type}
                        onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      >
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic Placement */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <School className="w-4 h-4 text-indigo-500" />
                        {isRTL ? 'العام الدراسي *' : 'Academic Year *'}
                      </label>
                      <select
                        value={formData.academic_year_id}
                        onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      >
                        {yearsList.map((y: any) => (
                          <option key={y.id} value={y.id}>
                            {y.name} {y.is_active ? (isRTL ? '(الحالي النشط)' : '(Active)') : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {isRTL ? 'تاريخ القيد والتسجيل' : 'Enrollment Date'}
                      </label>
                      <input
                        type="date"
                        value={formData.enrollment_date}
                        onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-indigo-500" />
                        {isRTL ? 'المرحلة والشعبة الدراسية *' : 'Grade Level & Section *'}
                      </span>
                      {selectedSection && (
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {isRTL ? 'السعة:' : 'Capacity:'} {selectedSection.enrolled_count || 0} / {selectedSection.capacity || 30}
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.section_id}
                      onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                    >
                      <option value="">{isRTL ? '-- اختر الشعبة الدراسية --' : '-- Select Section --'}</option>
                      {sectionsList.map((sec: any) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.class_level_name ? `${sec.class_level_name} - ` : ''}
                          {sec.name} ({sec.enrolled_count || 0}/{sec.capacity || 30})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Summary Card for Placement */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 dark:text-indigo-200">
                      <p className="font-bold">
                        {isRTL ? 'إدراج فوري في الجدول الدراسي وحساب الرسوم' : 'Automatic Timetable & Fee Assignment'}
                      </p>
                      <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                        {isRTL
                          ? 'بمجرد الحفظ سيتم ربط الطالب تلقائياً بجدول الحصص الخاصة بالشعبة، وتوليد الفواتير المرتبطة بالمرحلة.'
                          : 'Upon registration, the student is instantly scheduled into the section timetable and fees are computed.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Portal & Contact Info */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Auto-fill Credentials Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-200 dark:border-violet-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="font-bold text-violet-900 dark:text-violet-200">
                        {isRTL ? 'توليد بيانات البوابة الذكية تلقائياً' : 'Auto-Generate Portal Credentials'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoGenerateCredentials}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      {isRTL ? 'توليد تلقائي' : 'Auto Generate'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL ? 'اسم المستخدم للدخول' : 'Portal Username'}
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder={isRTL ? 'يُنشأ تلقائياً إذا تُرك فارغاً' : 'Auto-generated if left blank'}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isRTL ? 'كلمة المرور المبدئية' : 'Initial Password'}
                      </label>
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={isRTL ? 'افتراضي: student123' : 'Default: student123'}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {isRTL ? 'رقم الهاتف / الاتصال' : 'Contact Phone'}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+966 50 123 4567"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {isRTL ? 'العنوان السكني' : 'Residential Address'}
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder={isRTL ? 'الرياض، حي النخيل' : 'e.g. Riyadh, Al Nakheel'}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                      {isRTL ? 'الحالات الصحية والملاحظات الطبية' : 'Medical Conditions & Allergies'}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                      placeholder={
                        isRTL
                          ? 'أي ملاحظات طبية، حساسية طعام، أو حالات مزمنة (اتركه فارغاً إذا لا يوجد)'
                          : 'Any allergies, medical notes, or chronic conditions (leave blank if none)'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    <span>{isRTL ? 'السابق' : 'Previous'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 1 && (!formData.first_name.trim() || !formData.last_name.trim())) {
                        setErrorMessage(
                          isRTL
                            ? 'يرجى إدخال الاسم الأول واسم العائلة للمتابعة'
                            : 'First Name and Last Name are required to proceed.'
                        );
                        return;
                      }
                      setErrorMessage(null);
                      setStep((s) => (s + 1) as any);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
                  >
                    <span>{isRTL ? 'التالي' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isRTL ? 'جاري التسجيل...' : 'Registering...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isRTL ? 'تأكيد وحفظ الطالب' : 'Confirm & Register Student'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
