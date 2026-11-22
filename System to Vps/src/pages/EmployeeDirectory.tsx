import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Employee, DepartmentId, RoleId, Department, JobPosition } from '../types/database.types';
import { rbacService, normalizePermission } from '../services/rbacService';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  CheckCircle, 
  XCircle,
  X,
  Filter,
  Trash2,
  AlertTriangle,
  Save,
  Check,
  Key,
  KeyRound,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    key: 'admissions',
    titleAr: 'القبول والتسجيل والطلاب',
    titleEn: 'Admissions & Students',
    permissions: [
      { id: 'files:view', labelAr: 'عرض ملفات الطلاب', labelEn: 'View Student Files' },
      { id: 'files:create', labelAr: 'إنشاء ملف طالب جديد', labelEn: 'Create Student File' },
      { id: 'files:edit', labelAr: 'تعديل بيانات وملفات الطالب', labelEn: 'Edit Student File' },
      { id: 'files:stage_move', labelAr: 'نقل مرحلة الطالب في المسار', labelEn: 'Transition Pipeline Stage' },
      { id: 'preferences:edit', labelAr: 'إدارة رغبات الجامعات والتخصصات', labelEn: 'Manage University Preferences' },
    ]
  },
  {
    key: 'finance',
    titleAr: 'الشؤون المالية والتحصيل',
    titleEn: 'Finance & Payments',
    permissions: [
      { id: 'payments:view', labelAr: 'عرض سجلات المدفوعات', labelEn: 'View Payment Records' },
      { id: 'payments:create', labelAr: 'تسجيل دفعة جديدة', labelEn: 'Record New Payment' },
      { id: 'payments:edit_pending', labelAr: 'تعديل سند تحصيل غير مؤكد', labelEn: 'Edit Pending Payment Receipt' },
      { id: 'payments:cancel_pending', labelAr: 'إلغاء سند تحصيل غير مؤكد', labelEn: 'Cancel Pending Payment Receipt' },
      { id: 'payments:confirm', labelAr: 'تأكيد وقبول الدفعات المالية', labelEn: 'Confirm Financial Payments' },
      { id: 'expenses:create', labelAr: 'تسجيل مصروفات تشغيلية', labelEn: 'Register Operating Expenses' },
      { id: 'expenses:approve', labelAr: 'اعتماد وصرف المصروفات', labelEn: 'Approve Operating Expenses' },
      { id: 'budgets:manage', labelAr: 'إدارة الموازنات التقديرية', labelEn: 'Manage Department Budgets' },
    ]
  },
  {
    key: 'complaints',
    titleAr: 'الشكاوى وجودة الخدمة',
    titleEn: 'Complaints & Quality',
    permissions: [
      { id: 'complaints:view', labelAr: 'عرض سجل الشكاوى', labelEn: 'View Complaints Log' },
      { id: 'complaints:create', labelAr: 'تسجيل شكوى جديدة', labelEn: 'Register New Complaint' },
      { id: 'complaints:resolve', labelAr: 'التحقيق وإغلاق الشكوى', labelEn: 'Resolve & Close Complaints' },
    ]
  },
  {
    key: 'operations',
    titleAr: 'العمليات والطاقة الاستيعابية',
    titleEn: 'Operations & Capacity',
    permissions: [
      { id: 'capacity:view', labelAr: 'عرض الطاقة الاستيعابية', labelEn: 'View Operational Capacity' },
      { id: 'capacity:gate_override', labelAr: 'اعتماد بوابة الطاقة للحملات', labelEn: 'Approve Campaign Capacity Gate' },
      { id: 'assignments:backup', labelAr: 'تعيين وإدارة البدلاء', labelEn: 'Manage Backup Assignments' },
    ]
  },
  {
    key: 'admin',
    titleAr: 'الإدارة والأمان والتدقيق',
    titleEn: 'Administration & Security',
    permissions: [
      { id: 'employees:manage', labelAr: 'إدارة وتعيين الموظفين والصلاحيات', labelEn: 'Manage Employees & Roles' },
      { id: 'departments:manage', labelAr: 'إدارة وتعديل الأقسام', labelEn: 'Manage Departments' },
      { id: 'audit:view', labelAr: 'سجل التدقيق المؤسسي والرقابة', labelEn: 'View Institutional Audit Log' },
    ]
  },
  {
    key: 'system_users',
    titleAr: 'إدارة مستخدمي النظام وكلمات المرور',
    titleEn: 'System Users & Password Administration',
    permissions: [
      { id: 'users:view_system_users', labelAr: 'عرض مستخدمي النظام', labelEn: 'View System Users' },
      { id: 'users:create_system_user', labelAr: 'إنشاء مستخدم للنظام', labelEn: 'Create System User' },
      { id: 'users:activate_system_user', labelAr: 'تفعيل مستخدم النظام', labelEn: 'Activate System User' },
      { id: 'users:deactivate_system_user', labelAr: 'إيقاف مستخدم النظام', labelEn: 'Deactivate System User' },
      { id: 'users:reset_password', labelAr: 'إعادة تعيين كلمة المرور', labelEn: 'Reset User Password' },
      { id: 'users:manage_permissions', labelAr: 'إدارة صلاحيات مستخدمي النظام', labelEn: 'Manage System User Permissions' },
    ]
  }
];

interface EmployeeFormData {
  full_name_ar: string;
  full_name_en: string;
  employee_code: string;
  username: string;
  email: string;
  phone: string;
  whatsapp: string;
  department_id: DepartmentId;
  position_id: RoleId;
  job_title: string;
  direct_manager_id: string;
  joining_date: string;
  employment_status: 'active' | 'on_leave' | 'terminated';
  avatar_url: string;
  is_system_user: boolean;
}

const getInitialEmployeeFormData = (employeesList: Employee[]): EmployeeFormData => {
  const nextNum = employeesList.length + 1;
  return {
    full_name_ar: '',
    full_name_en: '',
    employee_code: `BCT-EMP-${String(nextNum).padStart(3, '0')}`,
    username: '',
    email: '',
    phone: '',
    whatsapp: '',
    department_id: 'ops',
    position_id: 'apply_off',
    job_title: '',
    direct_manager_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'active',
    avatar_url: '',
    is_system_user: true,
  };
};

interface EmployeeModalFormProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  formData: EmployeeFormData;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  error: string | null;
  successMessage: string | null;
  targetEmployee?: Employee | null;
  language: 'ar' | 'en';
  isRtl: boolean;
  departments: Department[];
  positions: Record<string, JobPosition>;
  employees: Employee[];
  t: (key: string) => string;
}

const EmployeeModalForm: React.FC<EmployeeModalFormProps> = ({
  isOpen,
  mode,
  formData,
  setFormData,
  onSubmit,
  onClose,
  error,
  successMessage,
  targetEmployee,
  language,
  isRtl,
  departments,
  positions,
  employees,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 bg-bct-navy text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {mode === 'add' ? (
              <UserPlus className="w-4 h-4 text-emerald-400" />
            ) : (
              <Edit3 className="w-4 h-4 text-emerald-400" />
            )}
            <h3 className="text-sm font-bold">
              {mode === 'add'
                ? (language === 'ar' ? 'إضافة موظف جديد' : 'Add New Employee')
                : (language === 'ar' 
                    ? `تعديل بيانات الموظف: ${targetEmployee?.full_name_ar || ''}` 
                    : `Edit Employee: ${targetEmployee?.full_name_en || ''}`)}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Full Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الاسم الكامل بالعربية *' : 'Full Name (Arabic) *'}
              </label>
              <input
                type="text"
                required
                value={formData.full_name_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name_ar: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                placeholder={language === 'ar' ? 'محمد أحمد علي' : 'Mohamed Ahmed Ali'}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الاسم الكامل بالإنجليزية *' : 'Full Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={formData.full_name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name_en: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                placeholder={language === 'ar' ? 'Mohamed Ahmed Ali' : 'Mohamed Ahmed Ali'}
              />
            </div>
          </div>

          {/* System User Authorization Switch Card */}
          <div 
            onClick={() => setFormData(prev => ({ ...prev, is_system_user: !prev.is_system_user }))}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
              formData.is_system_user
                ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg transition-colors ${
                  formData.is_system_user ? 'bg-bct-navy text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800">
                      {language === 'ar' ? 'مستخدم النظام' : 'System User'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                      formData.is_system_user
                        ? 'bg-blue-100 text-bct-navy border border-blue-200 shadow-xs'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${formData.is_system_user ? 'bg-bct-navy animate-pulse' : 'bg-slate-400'}`} />
                      <span>
                        {formData.is_system_user 
                          ? (language === 'ar' ? 'مفعّل' : 'Enabled')
                          : (language === 'ar' ? 'غير مفعّل' : 'Disabled')}
                      </span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.is_system_user
                      ? (language === 'ar'
                          ? (mode === 'add'
                              ? 'مفعّل: يملك الموظف حساب دخول للنظام. سيتم تعيين كلمة مرور مؤقتة (123) وإلزامه بتغييرها فور أول تسجيل دخول.'
                              : 'مفعّل: يملك الموظف حساب دخول للنظام وتطبق عليه صلاحيات الدور المعين.')
                          : (mode === 'add'
                              ? 'Enabled: Authorized to log in. Temporary password (123) will be set, requiring change on first login.'
                              : 'Enabled: Authorized to log in to BCT Enterprise with assigned role permissions.'))
                      : (language === 'ar'
                          ? 'معطّل: موظف داخلي بالشركة فقط (مثل عمال البوفيه والنظافة) دون صلاحية تسجيل الدخول للنظام.'
                          : 'Disabled: Registered internally only with no system login credentials.')}
                  </p>
                </div>
              </div>

              {/* Modern Toggle Switch (48px x 26px) */}
              <div className="shrink-0 flex items-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_system_user}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, is_system_user: !prev.is_system_user }));
                  }}
                  className={`relative inline-flex items-center w-12 h-[26px] rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-bct-navy focus-visible:ring-offset-2 ${
                    formData.is_system_user
                      ? 'bg-bct-navy border border-blue-900/40 shadow-xs'
                      : 'bg-slate-300 border border-slate-300 hover:bg-slate-400/80'
                  }`}
                  title={formData.is_system_user ? (language === 'ar' ? 'إيقاف خيار مستخدم النظام' : 'Disable System User') : (language === 'ar' ? 'تفعيل خيار مستخدم النظام' : 'Enable System User')}
                >
                  <span
                    className={`absolute top-[2px] start-[2px] w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
                      formData.is_system_user
                        ? (isRtl ? '-translate-x-[22px]' : 'translate-x-[22px]')
                        : 'translate-x-0'
                    }`}
                  >
                    {formData.is_system_user && (
                      <Check className="w-3 h-3 text-bct-navy stroke-[2.5] animate-in zoom-in-75 duration-200" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Employee ID & Username */}
          <div className={`grid gap-3 ${formData.is_system_user ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الرقم الوظيفي / كود الموظف *' : 'Employee ID / Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.employee_code}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                placeholder="BCT-EMP-012"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'ar' ? 'معرّف فريد لا يتكرر' : 'Unique identifier'}
              </span>
            </div>
            {formData.is_system_user && (
              <div className="animate-in fade-in duration-200">
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'اسم المستخدم للدخول *' : 'System Username *'}
                </label>
                <input
                  type="text"
                  required={formData.is_system_user}
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                  placeholder="username"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {language === 'ar' ? 'اسم تسجيل الدخول المعتمد للنظام' : 'Authorized system login handle'}
                </span>
              </div>
            )}
          </div>

          {/* 3. Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'البريد الإلكتروني المؤسسي *' : 'Corporate Email *'}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                placeholder="employee@bct-educational.com"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
                placeholder="+2010XXXXXXXX"
              />
            </div>
          </div>

          {/* 4. WhatsApp & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'}
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+2010XXXXXXXX"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'الإدارة التابعة *' : 'Department *'}
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value as DepartmentId }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {language === 'ar' ? d.name_ar : d.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. System Role & Direct Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'دور المستخدم بالنظام (System Role) *' : 'System Role *'}
              </label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormData(prev => ({ ...prev, position_id: e.target.value as RoleId }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              >
                {Object.values(positions).map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'ar' ? p.title_ar : p.title_en} ({p.id})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {language === 'ar' ? 'يحدد الصلاحيات ومستوى الوصول للوحدات بالنظام' : 'Determines system modules access and permissions'}
              </span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'المدير المباشر' : 'Direct Manager'}
              </label>
              <select
                value={formData.direct_manager_id}
                onChange={(e) => setFormData(prev => ({ ...prev, direct_manager_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              >
                <option value="">
                  {language === 'ar' ? 'بدون مدير مباشر (الإدارة العليا / الإشراف المباشر)' : 'No Direct Manager (Top Executive)'}
                </option>
                {employees
                  .filter(e => (!targetEmployee || e.id !== targetEmployee.id) && e.employment_status === 'active')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {language === 'ar' ? m.full_name_ar : m.full_name_en} ({m.employee_code} - {bctStore.getEmployeeJobTitle(m, language)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 6. Custom Job Title Field (Free-text - Optional!) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 text-xs">
                {language === 'ar' ? 'المسمى الوظيفي (Job Title)' : 'Job Title'}
                <span className="text-slate-400 font-normal ms-1 text-[11px]">
                  {language === 'ar' ? '(اختياري)' : '(Optional)'}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">
                {language === 'ar' ? 'المسمى المهني الفعلي (اختياري - حر وغير مقيد بأدوار النظام)' : 'Actual occupational title (Optional)'}
              </span>
            </div>
            <input
              type="text"
              maxLength={100}
              value={formData.job_title}
              onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy placeholder:text-slate-400"
              placeholder={language === 'ar' ? 'أدخل المسمى الوظيفي... (مثل: عامل نظافة، عامل بوفيه، سائق)' : 'Enter job title... (optional)'}
            />
            {/* Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'أمثلة سريعة:' : 'Quick examples:'}
              </span>
              {['عامل نظافة', 'عامل بوفيه', 'سائق', 'عامل خدمات', 'مندوب', 'مساعد إداري', 'عامل صيانة'].map((titleExample) => (
                <button
                  key={titleExample}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, job_title: titleExample }))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-bct-navy border border-slate-200 text-slate-600 transition"
                >
                  {titleExample}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Joining Date & Employment Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'تاريخ الالتحاق بالعمل *' : 'Joining Date *'}
              </label>
              <input
                type="date"
                required
                value={formData.joining_date}
                onChange={(e) => setFormData(prev => ({ ...prev, joining_date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'ar' ? 'حالة التوظيف والحساب *' : 'Employment Status *'}
              </label>
              <select
                value={formData.employment_status}
                onChange={(e) => setFormData(prev => ({ ...prev, employment_status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
              >
                <option value="active">{language === 'ar' ? 'نشط (متاح للعمليات)' : 'Active (Operational)'}</option>
                <option value="on_leave">{language === 'ar' ? 'في إجازة رسمية' : 'On Leave'}</option>
                <option value="terminated">{language === 'ar' ? 'معطل / غير نشط' : 'Suspended / Inactive'}</option>
              </select>
            </div>
          </div>

          {/* 8. Profile Photo / Avatar URL */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {language === 'ar' ? 'رابط الصورة الشخصية (اختياري)' : 'Avatar / Photo URL (Optional)'}
            </label>
            <input
              type="text"
              value={formData.avatar_url}
              onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              {language === 'ar' ? 'سيتم حفظ التغييرات وتوثيقها تلقائياً في سجل التدقيق المؤسسي.' : 'Changes are automatically recorded in the audit log.'}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs transition"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark text-xs flex items-center gap-1.5 shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {mode === 'add'
                    ? (language === 'ar' ? 'حفظ بيانات الموظف الجديد' : 'Save New Employee')
                    : (language === 'ar' ? 'حفظ بيانات الموظف' : 'Save Changes')}
                </span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export const EmployeeDirectory: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();
  
  const [employees, setEmployees] = useState(bctStore.getEmployees());
  const departments = bctStore.getDepartments();
  const positions = bctStore.getJobPositions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [permissionsModalEmp, setPermissionsModalEmp] = useState<Employee | null>(null);
  const [editablePermissions, setEditablePermissions] = useState<string[]>([]);
  const [permissionsSavedSuccess, setPermissionsSavedSuccess] = useState(false);

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<EmployeeFormData>(() => getInitialEmployeeFormData([]));
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Administrative permission check for employee editing & management
  const canManageEmployees = Boolean(
    isSuperAdmin || 
    hasPermission('employees:manage') || 
    currentUser?.position_id === 'gm' || 
    currentUser?.position_id === 'hr'
  );

  const canResetPassword = Boolean(
    isSuperAdmin || 
    hasPermission('users:reset_password') || 
    currentUser?.position_id === 'gm'
  );

  const canManageSystemUsers = Boolean(
    isSuperAdmin ||
    hasPermission('users:manage_permissions') ||
    hasPermission('users:activate_system_user') ||
    hasPermission('users:deactivate_system_user') ||
    canManageEmployees
  );

  // Filter for system user status
  const [systemUserFilter, setSystemUserFilter] = useState<
    'all' | 'system_users' | 'non_system_users' | 'active_accounts' | 'suspended_accounts' | 'pending_password_change' | 'requires_repair'
  >('all');

  // Synchronization status feedback
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Reset Password Modal State
  const [resetPasswordCandidate, setResetPasswordCandidate] = useState<Employee | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<{ username: string; tempPass: string } | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<Employee | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Synchronization handlers
  const handleRepairAccount = (empId: string) => {
    const res = bctStore.repairSystemUserAccount(empId, currentUser?.username || 'admin');
    if (res.success) {
      setSyncFeedback({
        message: language === 'ar' ? res.message : res.message_en,
        type: 'success'
      });
      setTimeout(() => setSyncFeedback(null), 4500);
    } else {
      setSyncFeedback({
        message: language === 'ar' ? res.message : res.message_en,
        type: 'error'
      });
      setTimeout(() => setSyncFeedback(null), 4500);
    }
  };

  const handleRepairAllAccounts = () => {
    setIsSyncing(true);
    try {
      const res = bctStore.repairAllSystemUserAccounts(currentUser?.username || 'admin');
      setSyncFeedback({
        message: language === 'ar' ? res.message : res.message_en,
        type: 'success'
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Form State for Add Employee
  const [formData, setFormData] = useState<EmployeeFormData>(() => getInitialEmployeeFormData([]));
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setFormData(getInitialEmployeeFormData(employees));
    setAddError(null);
    setAddSuccessMessage(null);
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    return bctStore.subscribe(() => {
      setEmployees(bctStore.getEmployees());
    });
  }, []);

  const totalEmployees = employees.length;
  const systemUsersCount = employees.filter(e => e.is_system_user !== false).length;
  const activeEmployees = employees.filter(e => e.employment_status === 'active').length;
  const nonSystemStaffCount = employees.filter(e => e.is_system_user === false).length;
  const pendingPasswordChangeCount = employees.filter(
    e => e.is_system_user !== false && (e.account_status === 'pending_password_change' || e.must_change_password === true)
  ).length;

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase().trim();
    const customTitleAr = (emp.job_title_ar || emp.job_title || '').toLowerCase();
    const customTitleEn = (emp.job_title_en || '').toLowerCase();
    const posTitle = positions[emp.position_id]?.title_ar?.toLowerCase() || '';
    const posTitleEn = positions[emp.position_id]?.title_en?.toLowerCase() || '';

    const matchesSearch = !query ||
      emp.full_name_ar.toLowerCase().includes(query) ||
      emp.full_name_en.toLowerCase().includes(query) ||
      emp.username.toLowerCase().includes(query) ||
      emp.employee_code.toLowerCase().includes(query) ||
      customTitleAr.includes(query) ||
      customTitleEn.includes(query) ||
      posTitle.includes(query) ||
      posTitleEn.includes(query);

    const matchesDept = selectedDept === 'all' || emp.department_id === selectedDept;

    let matchesSystemFilter = true;
    if (systemUserFilter === 'system_users') {
      matchesSystemFilter = emp.is_system_user !== false;
    } else if (systemUserFilter === 'non_system_users') {
      matchesSystemFilter = emp.is_system_user === false;
    } else if (systemUserFilter === 'active_accounts') {
      matchesSystemFilter = emp.is_system_user !== false && emp.account_status === 'active';
    } else if (systemUserFilter === 'suspended_accounts') {
      matchesSystemFilter = emp.is_system_user !== false && emp.account_status === 'suspended';
    } else if (systemUserFilter === 'pending_password_change') {
      matchesSystemFilter = emp.is_system_user !== false && (emp.account_status === 'pending_password_change' || emp.must_change_password === true);
    } else if (systemUserFilter === 'requires_repair') {
      const syncStatus = bctStore.getAccountSyncStatus(emp.id);
      matchesSystemFilter = emp.is_system_user !== false && (syncStatus === 'requires_repair' || syncStatus === 'not_linked');
    }

    return matchesSearch && matchesDept && matchesSystemFilter;
  });

  const validateEmployeeForm = (
    data: EmployeeFormData,
    mode: 'add' | 'edit',
    targetEmployeeId?: string
  ): string | null => {
    // 1. Required fields validation
    if (!data.full_name_ar.trim() || !data.full_name_en.trim()) {
      return language === 'ar' ? 'يرجى إدخال الاسم بالكامل باللغتين العربية والإنجليزية' : 'Please provide full name in both Arabic and English';
    }
    if (!data.employee_code.trim()) {
      return language === 'ar' ? 'يرجى إدخال كود الموظف' : 'Employee ID is required';
    }

    // 2. Employee code uniqueness
    const cleanCode = data.employee_code.trim().toUpperCase();
    const duplicateCode = employees.find(
      e => (mode === 'add' || e.id !== targetEmployeeId) && e.employee_code.trim().toUpperCase() === cleanCode
    );
    if (duplicateCode) {
      return language === 'ar' 
        ? `كود الموظف "${data.employee_code}" مسجل بالفعل لموظف آخر (${duplicateCode.full_name_ar})` 
        : `Employee ID "${data.employee_code}" is already assigned to another employee.`;
    }

    // 3. System user credentials
    const cleanUsername = data.username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    if (data.is_system_user) {
      if (!cleanUsername) {
        return language === 'ar' ? 'يرجى إدخال اسم المستخدم للدخول' : 'System username is required';
      }
      const duplicateUsername = employees.find(
        e => (mode === 'add' || e.id !== targetEmployeeId) && e.is_system_user !== false && e.username.trim().toLowerCase() === cleanUsername
      );
      if (duplicateUsername) {
        return language === 'ar' 
          ? `اسم المستخدم "${cleanUsername}" مسجل بالفعل لموظف آخر (${duplicateUsername.full_name_ar})` 
          : `Username "${cleanUsername}" is already taken by another employee.`;
      }
    }

    // 4. Email format & Phone validation
    if (!data.email.trim()) {
      return language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Email address is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address format';
    }
    if (!data.phone.trim()) {
      return language === 'ar' ? 'يرجى إدخال رقم الهاتف' : 'Phone number is required';
    }

    // 5. Manager validation (cannot be direct manager to oneself)
    if (mode === 'edit' && targetEmployeeId && data.direct_manager_id && data.direct_manager_id === targetEmployeeId) {
      return language === 'ar' ? 'لا يمكن اختيار الموظف كمدير مباشر لنفسه' : 'An employee cannot be their own direct manager';
    }

    // 6. Optional Job Title validation (only length check if provided, NO mandatory check!)
    const customJobTitle = (data.job_title || '').trim();
    if (customJobTitle.length > 100) {
      return language === 'ar' ? 'المسمى الوظيفي طويل جداً (الحد الأقصى 100 حرف)' : 'Job title is too long (max 100 chars)';
    }

    return null;
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const validationError = validateEmployeeForm(formData, 'add');
    if (validationError) {
      setAddError(validationError);
      return;
    }

    const cleanUsername = (formData.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    const customJobTitle = (formData.job_title || '').trim();

    const created = bctStore.createEmployee({
      full_name_ar: formData.full_name_ar.trim(),
      full_name_en: formData.full_name_en.trim(),
      employee_code: formData.employee_code.trim().toUpperCase(),
      username: cleanUsername,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
      department_id: formData.department_id,
      position_id: formData.position_id,
      job_title: customJobTitle || undefined,
      job_title_ar: customJobTitle || undefined,
      job_title_en: customJobTitle || undefined,
      direct_manager_id: formData.direct_manager_id || undefined,
      joining_date: formData.joining_date,
      employment_status: formData.employment_status,
      avatar_url: formData.avatar_url.trim() || undefined,
      is_system_user: formData.is_system_user,
      roles: formData.is_system_user ? [formData.position_id] : []
    }, currentUser?.username || 'admin');

    if (!created) {
      setAddError(language === 'ar' ? 'حدث خطأ أثناء إنشاء حساب الموظف' : 'Failed to create employee');
      return;
    }

    setAddSuccessMessage(language === 'ar' ? 'تم إنشاء حساب الموظف بنجاح!' : 'Employee created successfully!');
    setTimeout(() => {
      setIsAddModalOpen(false);
      setAddSuccessMessage(null);
      setFormData(getInitialEmployeeFormData(employees));
    }, 1000);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditError(null);
    setEditSuccessMessage(null);
    setEditFormData({
      full_name_ar: emp.full_name_ar || '',
      full_name_en: emp.full_name_en || '',
      employee_code: emp.employee_code || '',
      username: emp.username || '',
      email: emp.email || '',
      phone: emp.phone || '',
      whatsapp: emp.whatsapp || emp.phone || '',
      department_id: (emp.department_id || 'ops') as DepartmentId,
      position_id: (emp.position_id || 'apply_off') as RoleId,
      job_title: emp.job_title_ar || emp.job_title || '',
      direct_manager_id: emp.direct_manager_id || '',
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0],
      employment_status: emp.employment_status || 'active',
      avatar_url: emp.avatar_url || '',
      is_system_user: emp.is_system_user !== false,
    });
  };

  const handleSaveEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError(null);

    const validationError = validateEmployeeForm(editFormData, 'edit', editingEmployee.id);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    const cleanUsername = editFormData.username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    const customJobTitle = (editFormData.job_title || '').trim();

    const updated = bctStore.updateEmployee(
      editingEmployee.id,
      {
        full_name_ar: editFormData.full_name_ar.trim(),
        full_name_en: editFormData.full_name_en.trim(),
        employee_code: editFormData.employee_code.trim().toUpperCase(),
        username: cleanUsername,
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim(),
        whatsapp: editFormData.whatsapp.trim() || editFormData.phone.trim(),
        department_id: editFormData.department_id,
        position_id: editFormData.position_id,
        job_title: customJobTitle,
        job_title_ar: customJobTitle,
        job_title_en: customJobTitle,
        direct_manager_id: editFormData.direct_manager_id || undefined,
        joining_date: editFormData.joining_date,
        employment_status: editFormData.employment_status,
        avatar_url: editFormData.avatar_url.trim() || undefined,
        is_system_user: editFormData.is_system_user,
        roles: editFormData.is_system_user
          ? ((editingEmployee.roles || []).includes(editFormData.position_id)
              ? editingEmployee.roles
              : [editFormData.position_id, ...(editingEmployee.roles || []).filter(r => r !== editingEmployee.position_id)])
          : []
      },
      currentUser?.username || 'admin'
    );

    if (!updated) {
      setEditError(language === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to update employee');
      return;
    }

    setEditSuccessMessage(language === 'ar' ? 'تم تحديث بيانات الموظف بنجاح!' : 'Employee updated successfully!');
    setTimeout(() => {
      setEditingEmployee(null);
      setEditSuccessMessage(null);
    }, 1000);
  };

  const handleConfirmResetPassword = (emp: Employee) => {
    setResetPasswordError(null);
    const res = bctStore.resetUserPassword(emp.id, currentUser?.username || 'admin');
    if (!res.success) {
      setResetPasswordError(res.message || (language === 'ar' ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password'));
      return;
    }
    setResetPasswordCandidate(null);
    setResetPasswordSuccess({
      username: emp.username,
      tempPass: res.tempPassword || '123'
    });
  };

  const handleToggleSystemUser = (emp: Employee) => {
    const isCurrentlyUser = emp.is_system_user !== false;
    const res = bctStore.toggleSystemUserStatus(
      emp.id,
      !isCurrentlyUser,
      currentUser?.username || 'admin'
    );
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    const newStatus = emp.employment_status === 'active' ? 'terminated' : 'active';
    bctStore.updateEmployee(emp.id, { employment_status: newStatus }, currentUser?.username || 'admin');
  };

  const [editableOverrides, setEditableOverrides] = useState<Record<string, boolean>>({});

  const openPermissionsModal = (emp: Employee) => {
    setPermissionsModalEmp(emp);
    const overrides = { ...(emp.permission_overrides || {}) };
    setEditableOverrides(overrides);
    const summary = rbacService.getEffectivePermissionSummary(emp, positions);
    setEditablePermissions(summary.effectivePermissions);
    setPermissionsSavedSuccess(false);
  };

  const handleSetOverride = (permId: string, value: boolean | null) => {
    setEditableOverrides(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[permId];
      } else {
        next[permId] = value;
      }
      return next;
    });
  };

  const handleResetToRoleDefaults = () => {
    if (!permissionsModalEmp) return;
    setEditableOverrides({});
    const baseEmp = { ...permissionsModalEmp, permission_overrides: {}, custom_permissions: [] };
    const summary = rbacService.getEffectivePermissionSummary(baseEmp, positions);
    setEditablePermissions(summary.effectivePermissions);
  };

  const handleSavePermissions = () => {
    if (!permissionsModalEmp) return;

    // Recalculate authoritative effective permissions
    const updatedEmp: Employee = {
      ...permissionsModalEmp,
      permission_overrides: editableOverrides
    };
    const summary = rbacService.getEffectivePermissionSummary(updatedEmp, positions);

    bctStore.updateEmployeePermissions(
      permissionsModalEmp.id,
      permissionsModalEmp.roles || [],
      summary.effectivePermissions,
      editableOverrides,
      currentUser?.username || 'admin'
    );
    setPermissionsSavedSuccess(true);
    setTimeout(() => {
      setPermissionsModalEmp(null);
      setPermissionsSavedSuccess(false);
    }, 1200);
  };

  const handleDeleteEmployee = () => {
    if (!deleteCandidate) return;
    const result = bctStore.deleteEmployee(deleteCandidate.id, currentUser?.username || 'admin');
    if (!result.success) {
      setDeleteError(result.message || 'Failed to delete employee');
      return;
    }
    setDeleteCandidate(null);
    setDeleteError(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-bct-navy">
            {t('nav.employees')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'دليل حسابات وموظفي BCT والصلاحيات وتعيينات الإدارات والمديرين المباشرين.'
              : 'Directory of BCT employee accounts, departmental assignments, and reporting managers.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManageEmployees && (
            <button
              onClick={handleRepairAllAccounts}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs disabled:opacity-50"
              title={language === 'ar' ? 'فحص وتزامن جميع حسابات مستخدمي النظام' : 'Check & Repair All Accounts Synchronization'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-bct-navy ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'فحص وإصلاح المزامنة الشاملة' : 'Sync All Accounts'}</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إضافة موظف جديد' : 'New Employee'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in ${
          syncFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Counter Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {language === 'ar' ? 'إجمالي الموظفين' : 'Total Staff'}
            </span>
            <span className="text-2xl font-black text-slate-800">{totalEmployees}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-bct-navy rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {language === 'ar' ? 'مستخدمو النظام' : 'System Users'}
            </span>
            <span className="text-2xl font-black text-blue-600">{systemUsersCount}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {language === 'ar' ? 'موظفون بدون حساب' : 'Staff Without Account'}
            </span>
            <span className="text-2xl font-black text-slate-600">{nonSystemStaffCount}</span>
          </div>
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">
              {language === 'ar' ? 'بانتظار تغيير كلمة المرور' : 'Pending Password Change'}
            </span>
            <span className="text-2xl font-black text-amber-600">{pendingPasswordChangeCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('actions.search')}
            className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy"
          />
        </div>

        {/* System User Status Filter Dropdown */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={systemUserFilter}
            onChange={(e) => setSystemUserFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl focus:ring-1 focus:ring-bct-navy focus:bg-white transition"
          >
            <option value="all">{language === 'ar' ? 'جميع الموظفين' : 'All Employees'}</option>
            <option value="system_users">{language === 'ar' ? 'مستخدمو النظام فقط' : 'System Users Only'}</option>
            <option value="non_system_users">{language === 'ar' ? 'موظفون بدون حساب نظام' : 'Non-System Users'}</option>
            <option value="active_accounts">{language === 'ar' ? 'حسابات نظام نشطة' : 'Active System Accounts'}</option>
            <option value="suspended_accounts">{language === 'ar' ? 'حسابات نظام معطلة' : 'Suspended System Accounts'}</option>
            <option value="pending_password_change">{language === 'ar' ? 'بانتظار تغيير كلمة المرور' : 'Pending Password Change'}</option>
            <option value="requires_repair">{language === 'ar' ? 'بحاجة إلى إصلاح المزامنة' : 'Requires Sync Repair'}</option>
          </select>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedDept === 'all'
                ? 'bg-bct-navy text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('common.all')}
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedDept === dept.id
                  ? 'bg-bct-navy text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'ar' ? dept.name_ar : dept.name_en}
            </button>
          ))}
        </div>

      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const pos = positions[emp.position_id];
          const dept = departments.find(d => d.id === emp.department_id);
          const isUserAdminAccount = emp.username === 'admin' || emp.position_id === 'gm';
          const syncDiagnostic = bctStore.getAccountSyncDiagnostic(emp.id);
          const syncStatus = syncDiagnostic.status;

          return (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold text-sm shrink-0">
                      {emp.full_name_ar.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">
                        {language === 'ar' ? emp.full_name_ar : emp.full_name_en}
                      </h4>
                      <p className="text-[11px] font-semibold text-bct-navy mt-0.5">
                        {bctStore.getEmployeeJobTitle(emp, language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* 1. Employment Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.employment_status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {emp.employment_status === 'active' ? (language === 'ar' ? 'موظف نشط' : 'Active Staff') : (language === 'ar' ? 'معطل' : 'Suspended')}
                    </span>

                    {/* 2. System User Status & Auth Account State */}
                    {emp.is_system_user !== false ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-bct-navy border border-blue-200 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-bct-navy" />
                            <span>{language === 'ar' ? 'مستخدم النظام – نعم' : 'System User – Yes'}</span>
                          </span>
                          {emp.account_status === 'suspended' ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {language === 'ar' ? 'حساب معطل' : 'Suspended'}
                            </span>
                          ) : emp.account_status === 'pending_password_change' || emp.must_change_password ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title={language === 'ar' ? 'يلزم تغيير كلمة المرور عند أول تسجيل دخول' : 'Password change required on initial login'}>
                              {language === 'ar' ? 'بانتظار تغيير كلمة المرور' : 'Pending Password Change'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {language === 'ar' ? 'حساب نشط' : 'Active'}
                            </span>
                          )}
                        </div>

                        {/* 3. Synchronization Status Badge for Administrators (System Users Only) */}
                        {canManageEmployees && (
                          <div className="flex items-center gap-1">
                            {syncStatus === 'synchronized' && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1" title={language === 'ar' ? syncDiagnostic.reasonAr : syncDiagnostic.reasonEn}>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{language === 'ar' ? 'متزامن' : 'Synchronized'}</span>
                              </span>
                            )}
                            {syncStatus === 'requires_repair' && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse" title={language === 'ar' ? syncDiagnostic.reasonAr : syncDiagnostic.reasonEn}>
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                <span>{language === 'ar' ? 'يحتاج إلى إصلاح' : 'Requires Repair'}</span>
                              </span>
                            )}
                            {syncStatus === 'not_linked' && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1" title={language === 'ar' ? syncDiagnostic.reasonAr : syncDiagnostic.reasonEn}>
                                <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                <span>{language === 'ar' ? 'غير مرتبط' : 'Not Linked'}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <UserX className="w-2.5 h-2.5 text-slate-500" />
                        <span>{language === 'ar' ? 'مستخدم النظام – لا' : 'System User – No'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Info List */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  {emp.is_system_user !== false && emp.username && (
                    <div className="flex items-center gap-2 text-slate-700 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Key className="w-3.5 h-3.5 text-bct-navy shrink-0" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-sans">{language === 'ar' ? 'اسم الدخول:' : 'Login:'}</span>
                        <bdi dir="ltr" className="text-xs font-bold text-bct-navy select-all tracking-wide">
                          {emp.username}
                        </bdi>
                      </div>
                      {emp.must_change_password && (
                        <span className="ms-auto text-[9px] text-amber-700 font-sans font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {language === 'ar' ? 'كلمة مرور مؤقتة' : 'Temp password'}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 4. System Role / Permission Profile Tag */}
                  {emp.is_system_user !== false ? (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-600">
                        <strong className="text-slate-500 font-medium">{language === 'ar' ? 'دور النظام: ' : 'System Role: '}</strong>
                        {pos ? (language === 'ar' ? pos.title_ar : pos.title_en) : emp.position_id}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500">
                        {language === 'ar' ? 'بدون دور تشغيلي بالنظام (خدمات/دعم)' : 'No System Role (Service/Support)'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{language === 'ar' ? dept?.name_ar : dept?.name_en}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span>{emp.employee_code}</span>
                    <span>{language === 'ar' ? `انضم: ${emp.joining_date}` : `Joined: ${emp.joining_date}`}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canManageEmployees && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenEditModal(emp)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      title={language === 'ar' ? 'تعديل بيانات الموظف' : 'Edit Employee'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تعديل بيانات الموظف' : 'Edit Employee'}</span>
                    </button>

                    <button
                      onClick={() => openPermissionsModal(emp)}
                      className="text-[11px] font-bold text-bct-navy hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</span>
                    </button>

                    {/* Reset Password Action Button - Only for system users */}
                    {emp.is_system_user !== false && canResetPassword && (
                      <button
                        onClick={() => { setResetPasswordCandidate(emp); setResetPasswordError(null); }}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                        title={language === 'ar' ? 'إعادة تعيين كلمة المرور إلى 123 المؤقتة' : 'Reset password to temporary 123'}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</span>
                      </button>
                    )}

                    {/* Repair Account Sync Action Button */}
                    {emp.is_system_user !== false && (syncStatus === 'requires_repair' || syncStatus === 'not_linked') && canManageEmployees && (
                      <button
                        onClick={() => handleRepairAccount(emp.id)}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1"
                        title={language === 'ar' ? 'إصلاح مزامنة حساب المستخدم مع النظام' : 'Repair Account Synchronization'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إصلاح المزامنة' : 'Repair Sync'}</span>
                      </button>
                    )}
                    {canManageSystemUsers && (
                      <button
                        onClick={() => handleToggleSystemUser(emp)}
                        className={`text-[11px] font-semibold hover:underline flex items-center gap-1 ${
                          emp.is_system_user !== false ? 'text-slate-600' : 'text-blue-700'
                        }`}
                        title={
                          emp.is_system_user !== false
                            ? (language === 'ar' ? 'إيقاف حساب مستخدم النظام' : 'Deactivate System User')
                            : (language === 'ar' ? 'تفعيل مستخدم النظام' : 'Activate System User')
                        }
                      >
                        {emp.is_system_user !== false ? (
                          <>
                            <UserX className="w-3.5 h-3.5 text-slate-500" />
                            <span>{language === 'ar' ? 'إيقاف مستخدم النظام' : 'Deactivate User'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{language === 'ar' ? 'تفعيل مستخدم النظام' : 'Activate User'}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => toggleEmployeeStatus(emp)}
                      className={`text-[11px] font-semibold hover:underline flex items-center gap-1 ${
                        emp.employment_status === 'active' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {emp.employment_status === 'active' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تعطيل الحساب' : 'Deactivate'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تفعيل الحساب' : 'Activate'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isUserAdminAccount && (
                    <button
                      onClick={() => { setDeleteCandidate(emp); setDeleteError(null); }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                      title={language === 'ar' ? 'حذف الموظف' : 'Delete Employee'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: View & Edit Permissions (Requirement 7) */}
      {permissionsModalEmp && (() => {
        const summary = rbacService.getEffectivePermissionSummary(
          { ...permissionsModalEmp, permission_overrides: editableOverrides },
          positions
        );
        const dept = departments.find(d => d.id === permissionsModalEmp.department_id);
        const pos = positions[permissionsModalEmp.position_id];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="p-4 bg-bct-navy text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {language === 'ar' 
                        ? `مصفوفة الصلاحيات الفعالة: ${permissionsModalEmp.full_name_ar}` 
                        : `Effective Permissions Matrix: ${permissionsModalEmp.full_name_en}`}
                    </span>
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {language === 'ar' 
                      ? 'مراجعة وتعديل الصلاحيات الموروثة والاستثناءات الفردية المنفذة في النظام' 
                      : 'Audit and configure inherited role permissions and individual overrides'}
                  </p>
                </div>
                <button 
                  onClick={() => setPermissionsModalEmp(null)} 
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Identity & Metadata Strip (Req 7) */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{language === 'ar' ? 'الموظف وكوده' : 'Employee ID'}</span>
                    <span className="font-bold text-slate-800">{permissionsModalEmp.employee_code}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{language === 'ar' ? 'الإدارة' : 'Department'}</span>
                    <span className="font-bold text-slate-800">{language === 'ar' ? dept?.name_ar : dept?.name_en}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{language === 'ar' ? 'المسمى الوظيفي' : 'Job Position'}</span>
                    <span className="font-bold text-slate-800">{bctStore.getEmployeeJobTitle(permissionsModalEmp, language)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">{language === 'ar' ? 'الأدوار المسندة' : 'Assigned Roles'}</span>
                    <span className="font-mono text-bct-navy font-bold">{summary.roles.join(', ') || permissionsModalEmp.position_id}</span>
                  </div>
                </div>

                {/* 4 Summary Stat Badges (Req 7) */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {language === 'ar' ? 'موروثة من الدور:' : 'Inherited:'} {summary.inheritedFromRoles.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      {language === 'ar' ? 'استثناءات منح (+):' : 'Grants (+):'} {summary.individualGrants.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-bold border border-rose-200">
                      {language === 'ar' ? 'استثناءات حظر (-):' : 'Restrictions (-):'} {summary.individualDenies.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black">
                      {language === 'ar' ? 'الفعالة النهائية:' : 'Final Effective:'} {summary.effectivePermissions.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-xs"
                    title={language === 'ar' ? 'إلغاء كل الاستثناءات الفردية والرجوع للدور الأصلي' : 'Remove all individual overrides and restore role defaults'}
                  >
                    {language === 'ar' ? 'استعادة صلاحيات الدور الافتراضية' : 'Reset to Role Defaults'}
                  </button>
                </div>
              </div>

              {/* Granular Groups List */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-slate-200">
                      <span>{language === 'ar' ? group.titleAr : group.titleEn}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {group.permissions.filter(p => summary.effectivePermissions.includes(p.id) || summary.isSuperAdmin).length} / {group.permissions.length}
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      {group.permissions.map((p) => {
                        const isInherited = summary.inheritedFromRoles.includes(p.id) || summary.inheritedFromRoles.includes('*');
                        const overrideState = editableOverrides[p.id]; // true, false, or undefined
                        const isEffective = overrideState === true || (isInherited && overrideState !== false) || summary.isSuperAdmin;

                        return (
                          <div 
                            key={p.id}
                            className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                              overrideState === true
                                ? 'bg-emerald-50/80 border-emerald-300'
                                : overrideState === false
                                ? 'bg-rose-50/80 border-rose-300'
                                : isInherited
                                ? 'bg-blue-50/50 border-blue-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-xs truncate">
                                {language === 'ar' ? p.labelAr : p.labelEn}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                {overrideState === true ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    {language === 'ar' ? 'استثناء منح (+)' : 'Override Grant (+)'}
                                  </span>
                                ) : overrideState === false ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    {language === 'ar' ? 'استثناء حظر (-)' : 'Override Deny (-)'}
                                  </span>
                                ) : isInherited ? (
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                    {language === 'ar' ? 'موروثة من الدور' : 'Role Inherited'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {language === 'ar' ? 'غير مصرح' : 'Restricted'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Tri-state Controls: Grant (+), Deny (-), Neutral/Inherit */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSetOverride(p.id, true)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  overrideState === true 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                                }`}
                                title={language === 'ar' ? 'منح صلاحية فردية صريحة' : 'Explicit Grant'}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetOverride(p.id, false)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  overrideState === false 
                                    ? 'bg-rose-600 text-white shadow-xs' 
                                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                                }`}
                                title={language === 'ar' ? 'حظر صريح يلغي موروث الدور' : 'Explicit Deny'}
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetOverride(p.id, null)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                                  overrideState === undefined 
                                    ? 'bg-slate-200 text-slate-800 font-bold' 
                                    : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-200'
                                }`}
                                title={language === 'ar' ? 'إلغاء الاستثناء والرجوع للدور الأصلي' : 'Inherit from role'}
                              >
                                {language === 'ar' ? 'دور' : 'Role'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                  {permissionsSavedSuccess && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1 text-xs">
                      <Check className="w-4 h-4" />
                      {language === 'ar' ? 'تم حفظ وتطبيق الصلاحيات الفعالة فوراً!' : 'Effective permissions applied immediately!'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPermissionsModalEmp(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 text-xs"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark text-xs flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'حفظ الصلاحيات الفعالة' : 'Save Effective Permissions'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal: Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {language === 'ar' ? 'تأكيد حذف الموظف' : 'Confirm Employee Deletion'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {language === 'ar' 
                ? `هل أنت متأكد من حذف حساب الموظف (${deleteCandidate.full_name_ar})؟`
                : `Are you sure you want to delete employee (${deleteCandidate.full_name_en})?`}
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-3 font-semibold">
              {language === 'ar'
                ? 'ملاحظة: لحماية السجلات المالية والعمليات السابقة، سيتم إيقاف الحساب وأرشفته مع الحفاظ على سجل التدقيق كاملاً.'
                : 'Note: To protect audit logs and financial history, the account will be safely archived.'}
            </p>

            {deleteError && (
              <div className="mt-3 text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => { setDeleteCandidate(null); setDeleteError(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'نعم، حذف الموظف' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Unified Employee Modal: Add Mode */}
      <EmployeeModalForm
        isOpen={isAddModalOpen}
        mode="add"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateEmployee}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddError(null);
          setAddSuccessMessage(null);
        }}
        error={addError}
        successMessage={addSuccessMessage}
        language={language}
        isRtl={isRtl}
        departments={departments}
        positions={positions}
        employees={employees}
        t={t}
      />

      {/* Shared Unified Employee Modal: Edit Mode */}
      <EmployeeModalForm
        isOpen={Boolean(editingEmployee)}
        mode="edit"
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleSaveEditEmployee}
        onClose={() => {
          setEditingEmployee(null);
          setEditError(null);
          setEditSuccessMessage(null);
        }}
        error={editError}
        successMessage={editSuccessMessage}
        targetEmployee={editingEmployee}
        language={language}
        isRtl={isRtl}
        departments={departments}
        positions={positions}
        employees={employees}
        t={t}
      />

      {/* Modal: Reset Password Confirmation */}
      {resetPasswordCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset User Password'}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <span>@</span>
                  <bdi dir="ltr" className="font-bold text-slate-700 select-all">{resetPasswordCandidate.username}</bdi>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {language === 'ar'
                ? `هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم (${resetPasswordCandidate.full_name_ar})؟ سيتم تعيين كلمة المرور المؤقتة (123) وإلزام المستخدم بتغييرها عند أول تسجيل دخول.`
                : `Are you sure you want to reset the password for (${resetPasswordCandidate.full_name_en})? The password will be reset to temporary (123) and the user must change it upon their next login.`}
            </p>

            {resetPasswordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {resetPasswordError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setResetPasswordCandidate(null); setResetPasswordError(null); }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmResetPassword(resetPasswordCandidate)}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>{language === 'ar' ? 'تأكيد إعادة التعيين' : 'Confirm Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password Success */}
      {resetPasswordSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">
              {language === 'ar' ? 'تمت إعادة تعيين كلمة المرور بنجاح' : 'Password Reset Successfully'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center justify-center gap-1 flex-wrap">
              <span>{language === 'ar' ? 'تم تعيين كلمة المرور المؤقتة للمستخدم' : 'Temporary password set for user'}</span>
              <span className="font-mono font-bold text-slate-700 flex items-center">
                <span>@</span>
                <bdi dir="ltr">{resetPasswordSuccess.username}</bdi>
              </span>
            </p>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 font-mono font-bold text-sm text-slate-800 mb-4 inline-block px-6">
              {resetPasswordSuccess.tempPass}
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-4 font-semibold">
              {language === 'ar'
                ? 'سيتعين على المستخدم إدخال كلمة المرور المؤقتة هذه وتعيين كلمة مرور جديدة فور تسجيل الدخول القادم.'
                : 'The user will be required to change this temporary password upon their next login.'}
            </p>

            <button
              type="button"
              onClick={() => setResetPasswordSuccess(null)}
              className="w-full py-2.5 bg-bct-navy text-white text-xs font-bold rounded-xl hover:bg-bct-dark transition"
            >
              {language === 'ar' ? 'تم الفهم والمتابعة' : 'Done'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
