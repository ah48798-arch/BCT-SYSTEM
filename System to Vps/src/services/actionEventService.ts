/**
 * BCT Enterprise - Action Event Translation Service & Centralized Registry
 * 
 * Provides a single source of truth for translating and styling all system event codes
 * across Audit Logs, File Lifecycles, Pipelines, and Activity Timelines.
 * 
 * Strict Requirements:
 * - Centralized Event Registry with unique codes, bilingual labels, descriptions,
 *   macro categories (Management & Operations, HR, Financial, Quality & Complaints, System & Security),
 *   responsible departments, and badge colors.
 * - Arabic mode: 100% formal Arabic text without raw codes.
 * - English mode: Professional English text.
 * - Unknown codes: Smart diagnostic fallback displaying the raw code in parentheses.
 */

export type ActionCategory =
  | 'management_operations' // إدارة وعمليات
  | 'hr'                   // شؤون الموظفين
  | 'financial'            // الشؤون المالية
  | 'quality_complaints'   // إدارة الجودة والشكاوى
  | 'system_security'      // إدارة النظام والأمان
  // Granular categories for backwards compatibility:
  | 'file'
  | 'student'
  | 'finance'
  | 'expense'
  | 'campaign'
  | 'security'
  | 'task'
  | 'complaint'
  | 'meeting'
  | 'sla'
  | 'general';

export type MacroCategory =
  | 'management_operations'
  | 'hr'
  | 'financial'
  | 'quality_complaints'
  | 'system_security';

export type ActionDepartment =
  | 'gm'        // الإدارة العامة (General Management)
  | 'ops'       // العمليات والتسجيل الأكاديمي (Operations & Admissions)
  | 'cs'        // خدمة العملاء والطلاب (Customer Service)
  | 'mkt'       // التسويق وتوليد الفرص (Marketing & Campaigns)
  | 'fin'       // الإدارة المالية والحسابات (Finance & Accounts)
  | 'qa'        // إدارة الجودة والامتثال (Quality Assurance & SLA)
  | 'hr'        // الموارد البشرية والمستخدمين (Human Resources)
  | 'security'  // الأمان والمصادقة (Security & Authentication)
  | 'system';   // إدارة النظام والتقنية (System Administration)

export interface ActionEventDefinition {
  code: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: ActionCategory;
  department: ActionDepartment;
  badgeColor: string;
}

export interface ResolvedActionEvent {
  code: string;
  label: string;
  description: string;
  category: ActionCategory;
  categoryLabel: string;
  macroCategory: MacroCategory;
  macroCategoryLabel: string;
  department: ActionDepartment;
  departmentLabel: string;
  color: string;
  isRecognized: boolean;
}

export const DEPARTMENT_LABELS: Record<ActionDepartment, { ar: string; en: string }> = {
  gm: { ar: 'الإدارة العامة والتنفيذية', en: 'General Management' },
  ops: { ar: 'العمليات والتسجيل الأكاديمي', en: 'Operations & Admissions' },
  cs: { ar: 'خدمة العملاء والطلاب', en: 'Customer Service' },
  mkt: { ar: 'التسويق وتوليد الفرص', en: 'Marketing & Campaigns' },
  fin: { ar: 'الإدارة المالية والحسابات', en: 'Finance & Accounts' },
  qa: { ar: 'إدارة الجودة والامتثال (QA)', en: 'Quality Assurance & SLA' },
  hr: { ar: 'الموارد البشرية والمستخدمين', en: 'Human Resources' },
  security: { ar: 'الأمان والمصادقة', en: 'Security & Authentication' },
  system: { ar: 'إدارة النظام والتقنية', en: 'System Administration' }
};

export const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  management_operations: { ar: 'إدارة وعمليات', en: 'Management & Operations' },
  hr: { ar: 'شؤون الموظفين', en: 'Human Resources' },
  financial: { ar: 'الشؤون المالية', en: 'Financial' },
  quality_complaints: { ar: 'إدارة الجودة والشكاوى', en: 'Quality & Complaints' },
  system_security: { ar: 'إدارة النظام والأمان', en: 'System & Security' },
  file: { ar: 'الملفات الأكاديمية', en: 'Academic Files' },
  student: { ar: 'شؤون الطلاب', en: 'Student Affairs' },
  finance: { ar: 'الشؤون المالية', en: 'Financial Affairs' },
  expense: { ar: 'المصروفات والاعتمادات', en: 'Expenses' },
  campaign: { ar: 'التسويق وبوابة الطاقة', en: 'Marketing & Capacity' },
  security: { ar: 'الأمان والصلاحيات', en: 'Security & Permissions' },
  sla: { ar: 'اتفاقيات مستوى الخدمة (SLA)', en: 'Service Level Agreements' },
  task: { ar: 'المهام الإدارية', en: 'Administrative Tasks' },
  complaint: { ar: 'الشكاوى والاعتراضات', en: 'Complaints' },
  meeting: { ar: 'الاجتماعات والمقابلات', en: 'Meetings' },
  general: { ar: 'إجراء تشغيلي معتمد', en: 'General Operational' }
};

export function getMacroCategory(category: string): MacroCategory {
  switch (category) {
    case 'finance':
    case 'expense':
    case 'financial':
      return 'financial';
    case 'hr':
      return 'hr';
    case 'complaint':
    case 'sla':
    case 'quality_complaints':
      return 'quality_complaints';
    case 'security':
    case 'system_security':
      return 'system_security';
    case 'file':
    case 'student':
    case 'campaign':
    case 'task':
    case 'meeting':
    case 'management_operations':
    default:
      return 'management_operations';
  }
}

export function resolveActionDepartment(category: string, code: string = ''): ActionDepartment {
  const upperCode = code.toUpperCase();
  if (upperCode.includes('SETTING') || upperCode.includes('INITIALIZATION') || upperCode.includes('RECORD') || upperCode === 'RECONCILE_SYSTEM_USERS') {
    return 'system';
  }
  if (upperCode === 'CUSTOMER_HANDOVER_TO_CONSULTANT') {
    return 'cs';
  }
  if (upperCode.includes('COMPLAINT') || upperCode.includes('SLA') || upperCode === 'ESCALATE_STAGNANT_FILE') {
    return 'qa';
  }
  if (upperCode.includes('MEETING')) {
    return 'gm';
  }
  switch (category) {
    case 'finance':
    case 'expense':
    case 'financial':
      return 'fin';
    case 'hr':
      return 'hr';
    case 'campaign':
      return 'mkt';
    case 'security':
    case 'system_security':
      return 'security';
    case 'complaint':
    case 'sla':
    case 'quality_complaints':
      return 'qa';
    case 'file':
    case 'student':
    case 'task':
    case 'management_operations':
    default:
      return 'ops';
  }
}

export const ACTION_EVENTS_REGISTRY: Record<string, ActionEventDefinition> = {
  'FILE_FILE_CLOSED': {
    code: 'FILE_FILE_CLOSED',
    labelAr: 'إغلاق الملف الأكاديمي',
    labelEn: 'Academic File Closed',
    descriptionAr: 'إغلاق الملف الأكاديمي وتوثيق التقييم النهائي',
    descriptionEn: 'Close student academic file and record evaluation',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'FILE_FILE_APPROVED': {
    code: 'FILE_FILE_APPROVED',
    labelAr: 'اعتماد الملف الأكاديمي',
    labelEn: 'Academic File Approved',
    descriptionAr: 'اعتماد القبول النهائي بالملف الأكاديمي',
    descriptionEn: 'Approve final admission on academic file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'FILE_STAGE_TRANSITION': {
    code: 'FILE_STAGE_TRANSITION',
    labelAr: 'انتقال الملف إلى مرحلة جديدة',
    labelEn: 'File Stage Transition',
    descriptionAr: 'انتقال الملف الأكاديمي عبر مراحل مسار العمليات',
    descriptionEn: 'Transition file across operational pipeline stages',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'FILE_APPLICATION_SUBMITTED': {
    code: 'FILE_APPLICATION_SUBMITTED',
    labelAr: 'تقديم طلب الالتحاق',
    labelEn: 'Application Submitted',
    descriptionAr: 'تقديم ملف الطالب على منصة تنسيق الجامعات',
    descriptionEn: 'Submit application on university platform',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'FILE_CHOICES_UPDATED': {
    code: 'FILE_CHOICES_UPDATED',
    labelAr: 'تحديث رغبات الملف',
    labelEn: 'File Choices Updated',
    descriptionAr: 'تحديث قائمة الرغبات والجامعات بملف الطالب',
    descriptionEn: 'Update university preference choices in file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  'FILE_FILE_CREATED': {
    code: 'FILE_FILE_CREATED',
    labelAr: 'إنشاء ملف أكاديمي جديد',
    labelEn: 'Create Academic File',
    descriptionAr: 'فتح وتوثيق ملف أكاديمي جديد للطالب',
    descriptionEn: 'Open and register new academic student file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'FILE_FILE_ASSIGNED': {
    code: 'FILE_FILE_ASSIGNED',
    labelAr: 'إسناد مسؤولية الملف الأكاديمي',
    labelEn: 'Assign Academic File',
    descriptionAr: 'إسناد متابعة الملف الأكاديمي للموظف المسؤول',
    descriptionEn: 'Assign student file responsibility to specialist',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'FILE_FILE_REASSIGNED': {
    code: 'FILE_FILE_REASSIGNED',
    labelAr: 'إعادة إسناد مسؤولية الملف',
    labelEn: 'Reassign Academic File',
    descriptionAr: 'إعادة تعيين وتكليف مسؤول جديد لمتابعة الملف',
    descriptionEn: 'Reassign file responsibility to another specialist',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'FILE_DOCUMENTS_VERIFIED': {
    code: 'FILE_DOCUMENTS_VERIFIED',
    labelAr: 'مراجعة المستندات والأوراق الأكاديمية',
    labelEn: 'Academic Documents Verified',
    descriptionAr: 'التدقيق والتحقق من صحة المستندات والشهادات',
    descriptionEn: 'Verify and approve student documents and certificates',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'FILE_DOCUMENTS_REJECTED': {
    code: 'FILE_DOCUMENTS_REJECTED',
    labelAr: 'رفض مستندات الطالب',
    labelEn: 'Documents Rejected',
    descriptionAr: 'رفض أوراق ومستندات غير مطابقة للشروط',
    descriptionEn: 'Reject incomplete or non-compliant documents',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'FILE_PAYMENT_CONFIRMED': {
    code: 'FILE_PAYMENT_CONFIRMED',
    labelAr: 'تأكيد استلام السداد بالملف',
    labelEn: 'File Payment Confirmed',
    descriptionAr: 'تأكيد استلام وتوثيق السداد المالي بملف الطالب',
    descriptionEn: 'Confirm and record financial clearance on file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'FILE_FILE_REOPENED': {
    code: 'FILE_FILE_REOPENED',
    labelAr: 'إعادة فتح الملف الأكاديمي',
    labelEn: 'Reopen Academic File',
    descriptionAr: 'إعادة تفعيل وفتح الملف الأكاديمي من الأرشيف',
    descriptionEn: 'Reopen student file from historical archive',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-300'
  },
  'FILE_FILE_EVALUATED': {
    code: 'FILE_FILE_EVALUATED',
    labelAr: 'تقييم أداء الملف الأكاديمي',
    labelEn: 'Evaluate Academic File',
    descriptionAr: 'تقييم جودة وسرعة الإنجاز بالملف الأكاديمي',
    descriptionEn: 'Evaluate file quality and SLA turnaround',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'FILE_FILE_ARCHIVED': {
    code: 'FILE_FILE_ARCHIVED',
    labelAr: 'أرشفة ملف الطالب',
    labelEn: 'Archive Student File',
    descriptionAr: 'أرشفة الملف الأكاديمي وحفظه في السجلات',
    descriptionEn: 'Archive student file to historical register',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'FILE_NOTE_ADDED': {
    code: 'FILE_NOTE_ADDED',
    labelAr: 'إضافة ملاحظة إدارية بالملف',
    labelEn: 'Administrative Note Added',
    descriptionAr: 'إضافة تعليق أو توجيه إداري بملف الطالب',
    descriptionEn: 'Add administrative note or instruction to file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
  },
  'FILE_STATUS_UPDATED': {
    code: 'FILE_STATUS_UPDATED',
    labelAr: 'تحديث حالة الملف الأكاديمي',
    labelEn: 'Update File Status',
    descriptionAr: 'تحديث الحالة التشغيلية لملف الطالب',
    descriptionEn: 'Update student file operational status',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'FILE_ADMIN_CORRECTION': {
    code: 'FILE_ADMIN_CORRECTION',
    labelAr: 'تصحيح إداري لبيانات الملف',
    labelEn: 'Administrative File Correction',
    descriptionAr: 'تعديل أو تصحيح استثنائي في بيانات الملف الأكاديمي',
    descriptionEn: 'Administrative correction of file details',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'FILE_CREATED': {
    code: 'FILE_CREATED',
    labelAr: 'إنشاء ملف طالب جديد',
    labelEn: 'File Created',
    descriptionAr: 'إنشاء وتوثيق ملف أكاديمي للطالب',
    descriptionEn: 'Create student file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'STAGE_TRANSITION': {
    code: 'STAGE_TRANSITION',
    labelAr: 'انتقال الملف إلى مرحلة جديدة',
    labelEn: 'Stage Transition',
    descriptionAr: 'انتقال مرحلة الملف بالمسار التشغيلي',
    descriptionEn: 'Pipeline stage transition',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'FILE_ASSIGNED': {
    code: 'FILE_ASSIGNED',
    labelAr: 'إسناد مسؤولية الملف الأكاديمي',
    labelEn: 'File Assigned',
    descriptionAr: 'تعيين الموظف المسؤول عن متابعة الملف',
    descriptionEn: 'Assign file responsibility',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'FILE_REASSIGNED': {
    code: 'FILE_REASSIGNED',
    labelAr: 'إعادة إسناد مسؤولية الملف',
    labelEn: 'File Reassigned',
    descriptionAr: 'إعادة تعيين مسؤول الملف',
    descriptionEn: 'Reassign file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'DOCUMENTS_VERIFIED': {
    code: 'DOCUMENTS_VERIFIED',
    labelAr: 'مراجعة المستندات والأوراق الأكاديمية',
    labelEn: 'Documents Verified',
    descriptionAr: 'اعتماد وتدقيق مستندات الطالب',
    descriptionEn: 'Verify student documents',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'DOCUMENTS_REJECTED': {
    code: 'DOCUMENTS_REJECTED',
    labelAr: 'رفض مستندات الطالب',
    labelEn: 'Documents Rejected',
    descriptionAr: 'رفض أوراق غير مستوفاة للشروط',
    descriptionEn: 'Reject documents',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'APPLICATION_SUBMITTED': {
    code: 'APPLICATION_SUBMITTED',
    labelAr: 'تقديم طلب الالتحاق',
    labelEn: 'Application Submitted',
    descriptionAr: 'التقديم على منصة الجامعات',
    descriptionEn: 'Submit application',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'PAYMENT_CONFIRMED': {
    code: 'PAYMENT_CONFIRMED',
    labelAr: 'تأكيد استلام السداد بالملف',
    labelEn: 'Payment Confirmed',
    descriptionAr: 'تأكيد السداد المالي للملف',
    descriptionEn: 'Confirm payment',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'FILE_APPROVED': {
    code: 'FILE_APPROVED',
    labelAr: 'اعتماد الملف الأكاديمي',
    labelEn: 'File Approved',
    descriptionAr: 'اعتماد القبول النهائي بالملف',
    descriptionEn: 'Approve file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'FILE_REJECTED': {
    code: 'FILE_REJECTED',
    labelAr: 'رفض القبول بالملف',
    labelEn: 'Application Rejected',
    descriptionAr: 'رفض القبول بالملف الأكاديمي',
    descriptionEn: 'Reject admission',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'FILE_CLOSED': {
    code: 'FILE_CLOSED',
    labelAr: 'إغلاق الملف الأكاديمي',
    labelEn: 'File Closed',
    descriptionAr: 'إغلاق الملف الأكاديمي',
    descriptionEn: 'Close file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'FILE_EVALUATED': {
    code: 'FILE_EVALUATED',
    labelAr: 'تقييم الملف الأكاديمي',
    labelEn: 'File Evaluated',
    descriptionAr: 'تقييم أداء الملف',
    descriptionEn: 'Evaluate file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'FILE_ARCHIVED': {
    code: 'FILE_ARCHIVED',
    labelAr: 'أرشفة ملف الطالب',
    labelEn: 'File Archived',
    descriptionAr: 'أرشفة الملف',
    descriptionEn: 'Archive file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'FILE_REOPENED': {
    code: 'FILE_REOPENED',
    labelAr: 'إعادة فتح الملف الأكاديمي',
    labelEn: 'File Reopened',
    descriptionAr: 'إعادة فتح الملف من الأرشيف',
    descriptionEn: 'Reopen file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-300'
  },
  'CHOICES_UPDATED': {
    code: 'CHOICES_UPDATED',
    labelAr: 'تحديث رغبات الملف',
    labelEn: 'Choices Updated',
    descriptionAr: 'تحديث رغبات الجامعات بالملف',
    descriptionEn: 'Update choices',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  'NOTE_ADDED': {
    code: 'NOTE_ADDED',
    labelAr: 'إضافة ملاحظة إدارية بالملف',
    labelEn: 'Note Added',
    descriptionAr: 'ملاحظة إدارية بالملف',
    descriptionEn: 'Administrative note',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
  },
  'STATUS_UPDATED': {
    code: 'STATUS_UPDATED',
    labelAr: 'تحديث حالة الملف الأكاديمي',
    labelEn: 'Status Updated',
    descriptionAr: 'تحديث حالة الملف',
    descriptionEn: 'Update status',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'ADMIN_CORRECTION': {
    code: 'ADMIN_CORRECTION',
    labelAr: 'تصحيح إداري لبيانات الملف',
    labelEn: 'Admin Correction',
    descriptionAr: 'تصحيح إداري بالملف',
    descriptionEn: 'Administrative correction',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_STUDENT': {
    code: 'CREATE_STUDENT',
    labelAr: 'تسجيل طالب جديد',
    labelEn: 'Register Student',
    descriptionAr: 'تسجيل بيانات طالب جديد في النظام',
    descriptionEn: 'Register student profile',
    category: 'student',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UPDATE_STUDENT': {
    code: 'UPDATE_STUDENT',
    labelAr: 'تعديل بيانات طالب',
    labelEn: 'Update Student',
    descriptionAr: 'تحديث بيانات الطالب الأساسية',
    descriptionEn: 'Update student details',
    category: 'student',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'DELETE_STUDENT': {
    code: 'DELETE_STUDENT',
    labelAr: 'أرشفة / حذف ملف طالب',
    labelEn: 'Archive Student',
    descriptionAr: 'أرشفة سجل الطالب',
    descriptionEn: 'Archive student',
    category: 'student',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_STUDENT_FILE': {
    code: 'CREATE_STUDENT_FILE',
    labelAr: 'فتح ملف أكاديمي',
    labelEn: 'Open Academic File',
    descriptionAr: 'فتح ملف أكاديمي جديد للطالب',
    descriptionEn: 'Open student file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'UPDATE_STUDENT_FILE': {
    code: 'UPDATE_STUDENT_FILE',
    labelAr: 'تحديث الملف الأكاديمي',
    labelEn: 'Update Academic File',
    descriptionAr: 'تحديث بيانات الملف الأكاديمي',
    descriptionEn: 'Update file details',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'ARCHIVE_STUDENT_FILE': {
    code: 'ARCHIVE_STUDENT_FILE',
    labelAr: 'أرشفة ملف طالب',
    labelEn: 'Archive Student File',
    descriptionAr: 'أرشفة ملف الطالب',
    descriptionEn: 'Archive student file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  'REOPEN_STUDENT_FILE': {
    code: 'REOPEN_STUDENT_FILE',
    labelAr: 'إعادة فتح الملف الأكاديمي',
    labelEn: 'Reopen Academic File',
    descriptionAr: 'إعادة فتح الملف الأكاديمي من الأرشيف',
    descriptionEn: 'Reopen student file from archive',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-300'
  },
  'EVALUATE_STUDENT_FILE': {
    code: 'EVALUATE_STUDENT_FILE',
    labelAr: 'تقييم الملف الأكاديمي',
    labelEn: 'Evaluate Academic File',
    descriptionAr: 'تقييم أداء الملف الأكاديمي',
    descriptionEn: 'Evaluate student file',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'UPDATE_CHOICES': {
    code: 'UPDATE_CHOICES',
    labelAr: 'تحديث رغبات الجامعات',
    labelEn: 'Update University Choices',
    descriptionAr: 'تحديث قائمة الرغبات الجامعية',
    descriptionEn: 'Update university choices',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'ADD_PREFERENCE': {
    code: 'ADD_PREFERENCE',
    labelAr: 'إضافة رغبة جامعية',
    labelEn: 'Add University Choice',
    descriptionAr: 'إضافة رغبة جامعية بالملف',
    descriptionEn: 'Add university choice',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'REORDER_PREFERENCES': {
    code: 'REORDER_PREFERENCES',
    labelAr: 'إعادة ترتيب الرغبات',
    labelEn: 'Reorder Choices',
    descriptionAr: 'إعادة ترتيب أولويات الرغبات',
    descriptionEn: 'Reorder university choices',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'DELETE_PREFERENCE': {
    code: 'DELETE_PREFERENCE',
    labelAr: 'حذف رغبة جامعية',
    labelEn: 'Delete Choice',
    descriptionAr: 'حذف رغبة من قائمة الجامعات',
    descriptionEn: 'Delete university choice',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'LIFECYCLE_TRANSITION': {
    code: 'LIFECYCLE_TRANSITION',
    labelAr: 'نقل مرحلة الطالب بالمسار',
    labelEn: 'Transition Pipeline Stage',
    descriptionAr: 'نقل الطالب إلى مرحلة تشغيلية جديدة',
    descriptionEn: 'Transition pipeline stage',
    category: 'file',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'CREATE_PAYMENT': {
    code: 'CREATE_PAYMENT',
    labelAr: 'تسجيل إيصال سداد',
    labelEn: 'Create Payment Receipt',
    descriptionAr: 'تسجيل إيصال سداد مالي جديد',
    descriptionEn: 'Create payment receipt',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'UPDATE_PAYMENT_DESCRIPTION': {
    code: 'UPDATE_PAYMENT_DESCRIPTION',
    labelAr: 'تعديل وصف إيصال السداد',
    labelEn: 'Update Receipt Description',
    descriptionAr: 'تعديل بيان الإيصال المالي',
    descriptionEn: 'Update receipt description',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'UPDATE_PENDING_PAYMENT': {
    code: 'UPDATE_PENDING_PAYMENT',
    labelAr: 'تعديل سند تحصيل غير مؤكد',
    labelEn: 'Edit Pending Payment Receipt',
    descriptionAr: 'تعديل بيانات إيصال تحصيل مالي قبل تأكيد السداد',
    descriptionEn: 'Modify unconfirmed payment receipt details before confirmation',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'CANCEL_PENDING_PAYMENT': {
    code: 'CANCEL_PENDING_PAYMENT',
    labelAr: 'إلغاء سند تحصيل غير مؤكد',
    labelEn: 'Cancel Pending Payment Receipt',
    descriptionAr: 'إلغاء سند التحصيل قبل تأكيد السداد مع حفظه في السجلات لأغراض التدقيق',
    descriptionEn: 'Cancel payment receipt before confirmation while retaining records for audit',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'SECURITY_BLOCK_CONFIRMED_PAYMENT_EDIT': {
    code: 'SECURITY_BLOCK_CONFIRMED_PAYMENT_EDIT',
    labelAr: 'منع تعديل سند تحصيل مؤكد',
    labelEn: 'Blocked Confirmed Receipt Edit',
    descriptionAr: 'رفض محاولة تعديل مباشر لسند تحصيل بعد تأكيد السداد',
    descriptionEn: 'Blocked attempt to directly edit a confirmed payment receipt',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'SECURITY_BLOCK_CONFIRMED_PAYMENT_CANCEL': {
    code: 'SECURITY_BLOCK_CONFIRMED_PAYMENT_CANCEL',
    labelAr: 'منع إلغاء سند تحصيل مؤكد',
    labelEn: 'Blocked Confirmed Receipt Cancellation',
    descriptionAr: 'رفض محاولة إلغاء مباشر لسند تحصيل بعد تأكيد السداد',
    descriptionEn: 'Blocked attempt to directly cancel a confirmed payment receipt',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CONFIRM_PAYMENT': {
    code: 'CONFIRM_PAYMENT',
    labelAr: 'تأكيد السداد المالي',
    labelEn: 'Confirm Payment',
    descriptionAr: 'اعتماد وتأكيد استلام الدفعة المالية',
    descriptionEn: 'Confirm payment receipt',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'PAYMENT_CONFIRMATION': {
    code: 'PAYMENT_CONFIRMATION',
    labelAr: 'تأكيد السداد المالي وقيد الدفعة',
    labelEn: 'Payment Confirmation',
    descriptionAr: 'تأكيد السداد وقيد الإيراد',
    descriptionEn: 'Payment confirmation',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'REJECT_PAYMENT': {
    code: 'REJECT_PAYMENT',
    labelAr: 'رفض إيصال السداد',
    labelEn: 'Reject Payment',
    descriptionAr: 'رفض إيصال السداد المالي',
    descriptionEn: 'Reject payment receipt',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'REVERSE_PAYMENT': {
    code: 'REVERSE_PAYMENT',
    labelAr: 'عكس / استرداد سداد مالي',
    labelEn: 'Reverse Payment',
    descriptionAr: 'عكس قيد السداد واسترداد المبلغ',
    descriptionEn: 'Reverse payment',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CORRECT_PAYMENT_METHOD': {
    code: 'CORRECT_PAYMENT_METHOD',
    labelAr: 'تعديل طريقة الدفع لإيصال',
    labelEn: 'Correct Receipt Payment Method',
    descriptionAr: 'تعديل قناة التحصيل المالي',
    descriptionEn: 'Correct payment method',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'PRINT_PAYMENT_VOUCHER': {
    code: 'PRINT_PAYMENT_VOUCHER',
    labelAr: 'طباعة سند صرف مالي',
    labelEn: 'Print Payment Voucher',
    descriptionAr: 'توليد وطباعة سند الصرف',
    descriptionEn: 'Print payment voucher',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  'CREATE_INTERNAL_TRANSFER': {
    code: 'CREATE_INTERNAL_TRANSFER',
    labelAr: 'تحويل مالي بين الحسابات',
    labelEn: 'Internal Account Transfer',
    descriptionAr: 'تحويل مالي بين حسابات المؤسسة',
    descriptionEn: 'Internal account transfer',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'POST_ACCOUNT_MOVEMENT': {
    code: 'POST_ACCOUNT_MOVEMENT',
    labelAr: 'قيد حركة بالحساب المالي',
    labelEn: 'Post Account Movement',
    descriptionAr: 'تسجيل حركة مالية في كشف الحساب',
    descriptionEn: 'Post account movement',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'CREATE_BUDGET': {
    code: 'CREATE_BUDGET',
    labelAr: 'تخصيص موازنة تقديرية',
    labelEn: 'Allocate Budget',
    descriptionAr: 'اعتماد وتخصيص موازنة للقسم',
    descriptionEn: 'Allocate budget',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'UPDATE_BUDGET': {
    code: 'UPDATE_BUDGET',
    labelAr: 'تعديل الموازنة التقديرية',
    labelEn: 'Update Budget Allocation',
    descriptionAr: 'تعديل مخصصات الموازنة',
    descriptionEn: 'Update budget',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'UPDATE_EXCHANGE_RATE': {
    code: 'UPDATE_EXCHANGE_RATE',
    labelAr: 'تحديث سعر الصرف الرسمي',
    labelEn: 'Update Exchange Rate',
    descriptionAr: 'تحديث سعر صرف الدولار المعتمد',
    descriptionEn: 'Update exchange rate',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'CREATE_EXPENSE': {
    code: 'CREATE_EXPENSE',
    labelAr: 'تسجيل مصروف تشغيلي',
    labelEn: 'Register Expense',
    descriptionAr: 'تسجيل طلب مصروف تشغيلي جديد',
    descriptionEn: 'Register operational expense',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'UPDATE_EXPENSE_STATUS': {
    code: 'UPDATE_EXPENSE_STATUS',
    labelAr: 'تحديث حالة المصروف',
    labelEn: 'Update Expense Status',
    descriptionAr: 'تحديث حالة اعتماد المصروف',
    descriptionEn: 'Update expense status',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'EXPENSE_APPROVED': {
    code: 'EXPENSE_APPROVED',
    labelAr: 'اعتماد مصروف تشغيلي',
    labelEn: 'Approve Expense',
    descriptionAr: 'الموافقة على صرف المصروف',
    descriptionEn: 'Approve expense',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'EXPENSE_REJECTED': {
    code: 'EXPENSE_REJECTED',
    labelAr: 'رفض صرف مصروف',
    labelEn: 'Reject Expense',
    descriptionAr: 'رفض طلب صرف المصروف',
    descriptionEn: 'Reject expense',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'EXPENSE_PAID': {
    code: 'EXPENSE_PAID',
    labelAr: 'صرف وسداد مصروف فعلي',
    labelEn: 'Mark Expense Paid',
    descriptionAr: 'صرف وقيد سداد المصروف',
    descriptionEn: 'Disburse expense',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'EXPENSE_CANCELLED': {
    code: 'EXPENSE_CANCELLED',
    labelAr: 'إلغاء مصروف تشغيلي',
    labelEn: 'Cancel Expense',
    descriptionAr: 'إلغاء طلب المصروف',
    descriptionEn: 'Cancel expense',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  'CORRECT_EXPENSE_PAYMENT_METHOD': {
    code: 'CORRECT_EXPENSE_PAYMENT_METHOD',
    labelAr: 'تعديل قناة سداد المصروف',
    labelEn: 'Correct Expense Payment Method',
    descriptionAr: 'تعديل طريقة سداد المصروف',
    descriptionEn: 'Correct expense method',
    category: 'expense',
    department: 'fin',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'CREATE_EMPLOYEE': {
    code: 'CREATE_EMPLOYEE',
    labelAr: 'إنشاء حساب موظف',
    labelEn: 'Create Employee',
    descriptionAr: 'إضافة حساب موظف جديد بالمنظومة',
    descriptionEn: 'Create employee profile',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UPDATE_EMPLOYEE': {
    code: 'UPDATE_EMPLOYEE',
    labelAr: 'تعديل بيانات موظف',
    labelEn: 'Update Employee',
    descriptionAr: 'تعديل بيانات أو حالة حساب موظف',
    descriptionEn: 'Update employee details',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'DELETE_EMPLOYEE': {
    code: 'DELETE_EMPLOYEE',
    labelAr: 'حذف / أرشفة موظف',
    labelEn: 'Archive Employee Account',
    descriptionAr: 'تعطيل وأرشفة حساب موظف',
    descriptionEn: 'Archive employee account',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'UPDATE_PERMISSIONS': {
    code: 'UPDATE_PERMISSIONS',
    labelAr: 'تعديل مصفوفة الصلاحيات',
    labelEn: 'Update Permissions Matrix',
    descriptionAr: 'تعديل الصلاحيات الممنوحة للأدوار',
    descriptionEn: 'Update role permissions',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'UPDATE_EMPLOYEE_PERMISSIONS': {
    code: 'UPDATE_EMPLOYEE_PERMISSIONS',
    labelAr: 'تعديل صلاحيات موظف استثنائية',
    labelEn: 'Update Employee Permissions',
    descriptionAr: 'تعديل مصفوفة صلاحيات موظف فردي',
    descriptionEn: 'Update specific employee overrides',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'CREATE_EMPLOYEE_INCENTIVE': {
    code: 'CREATE_EMPLOYEE_INCENTIVE',
    labelAr: 'تسجيل استحقاق حافز موظف',
    labelEn: 'Register Employee Incentive',
    descriptionAr: 'قيد استحقاق مكافأة أو حافز',
    descriptionEn: 'Register incentive accrual',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'APPROVE_EMPLOYEE_INCENTIVE': {
    code: 'APPROVE_EMPLOYEE_INCENTIVE',
    labelAr: 'اعتماد حافز موظف',
    labelEn: 'Approve Employee Incentive',
    descriptionAr: 'الموافقة على صرف الحافز المالي',
    descriptionEn: 'Approve incentive payment',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'PAY_EMPLOYEE_INCENTIVE': {
    code: 'PAY_EMPLOYEE_INCENTIVE',
    labelAr: 'صرف وسداد حافز موظف',
    labelEn: 'Disburse Employee Incentive',
    descriptionAr: 'صرف وتسليم الحافز المالي',
    descriptionEn: 'Disburse incentive to employee',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'CREATE_DEPARTMENT': {
    code: 'CREATE_DEPARTMENT',
    labelAr: 'إنشاء وحدة تنظيمية',
    labelEn: 'Create Department',
    descriptionAr: 'إضافة قسم جديد في الهيكل الإداري',
    descriptionEn: 'Create organization department',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'UPDATE_DEPARTMENT': {
    code: 'UPDATE_DEPARTMENT',
    labelAr: 'تعديل بيانات القسم',
    labelEn: 'Update Department',
    descriptionAr: 'تعديل بيانات الإدارة أو القسم',
    descriptionEn: 'Update department details',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'DELETE_DEPARTMENT': {
    code: 'DELETE_DEPARTMENT',
    labelAr: 'حذف وحدة تنظيمية',
    labelEn: 'Delete Department',
    descriptionAr: 'حذف قسم من الهيكل الإداري',
    descriptionEn: 'Delete department',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'UPDATE_JOB_POSITION': {
    code: 'UPDATE_JOB_POSITION',
    labelAr: 'تعديل بيانات المنصب الوظيفي',
    labelEn: 'Update Job Position',
    descriptionAr: 'تعديل صلاحيات أو مسمى المنصب',
    descriptionEn: 'Update job position',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'ASSIGN_BACKUP': {
    code: 'ASSIGN_BACKUP',
    labelAr: 'تعيين موظف بديل معتمد',
    labelEn: 'Assign Backup Role',
    descriptionAr: 'تكليف موظف بديل للمسؤوليات',
    descriptionEn: 'Assign operational backup',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'ASSIGN_BACKUP_ROLE': {
    code: 'ASSIGN_BACKUP_ROLE',
    labelAr: 'تعيين موظف بديل معتمد',
    labelEn: 'Assign Backup Role',
    descriptionAr: 'تكليف موظف بديل معتمد',
    descriptionEn: 'Assign backup assignment',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  'UPDATE_BACKUP_ROLE': {
    code: 'UPDATE_BACKUP_ROLE',
    labelAr: 'تعديل تكليف الموظف البديل',
    labelEn: 'Update Backup Assignment',
    descriptionAr: 'تعديل فترة أو صلاحيات البديل',
    descriptionEn: 'Update backup role',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'DELETE_BACKUP_ASSIGNMENT': {
    code: 'DELETE_BACKUP_ASSIGNMENT',
    labelAr: 'إلغاء تعيين موظف بديل',
    labelEn: 'Delete Backup Assignment',
    descriptionAr: 'إلغاء تكليف الموظف البديل',
    descriptionEn: 'Delete backup assignment',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'REMOVE_BACKUP_ROLE': {
    code: 'REMOVE_BACKUP_ROLE',
    labelAr: 'إلغاء تكليف موظف بديل',
    labelEn: 'Remove Backup Assignment',
    descriptionAr: 'إلغاء تكليف البديل المعين',
    descriptionEn: 'Remove backup role',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_EVALUATION': {
    code: 'CREATE_EVALUATION',
    labelAr: 'تقييم أداء ربع سنوي',
    labelEn: 'Performance Appraisal',
    descriptionAr: 'إنشاء تقييم أداء دوري لموظف',
    descriptionEn: 'Create quarterly evaluation',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'CREATE_PERFORMANCE_EVALUATION': {
    code: 'CREATE_PERFORMANCE_EVALUATION',
    labelAr: 'إنشاء تقييم أداء جديد',
    labelEn: 'Create Performance Appraisal',
    descriptionAr: 'إنشاء تقييم أداء جديد',
    descriptionEn: 'Create performance appraisal',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'UPDATE_PERFORMANCE_EVALUATION': {
    code: 'UPDATE_PERFORMANCE_EVALUATION',
    labelAr: 'تعديل تقييم أداء',
    labelEn: 'Update Performance Appraisal',
    descriptionAr: 'تعديل تقييم أداء موظف',
    descriptionEn: 'Update performance appraisal',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'DELETE_PERFORMANCE_EVALUATION': {
    code: 'DELETE_PERFORMANCE_EVALUATION',
    labelAr: 'إلغاء تقييم أداء',
    labelEn: 'Delete Performance Appraisal',
    descriptionAr: 'حذف تقييم أداء من السجلات',
    descriptionEn: 'Delete performance appraisal',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_CAMPAIGN': {
    code: 'CREATE_CAMPAIGN',
    labelAr: 'إنشاء حملة تسويقية',
    labelEn: 'Create Campaign',
    descriptionAr: 'إنشاء حملة تسويقية جديدة',
    descriptionEn: 'Create marketing campaign',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'UPDATE_CAMPAIGN': {
    code: 'UPDATE_CAMPAIGN',
    labelAr: 'تعديل بيانات الحملة',
    labelEn: 'Update Campaign',
    descriptionAr: 'تحديث بيانات الحملة التسويقية',
    descriptionEn: 'Update campaign details',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'SUBMIT_CAPACITY_GATE': {
    code: 'SUBMIT_CAPACITY_GATE',
    labelAr: 'إرسال الحملة لبوابة الطاقة',
    labelEn: 'Submit Campaign to Capacity Gate',
    descriptionAr: 'إرسال الحملة لمراجعة الطاقة الاستيعابية',
    descriptionEn: 'Submit campaign for operational review',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'APPROVE_CAPACITY_GATE': {
    code: 'APPROVE_CAPACITY_GATE',
    labelAr: 'اعتماد بوابة الطاقة',
    labelEn: 'Approve Capacity Gate',
    descriptionAr: 'الموافقة على سقف الحملة التسويقية',
    descriptionEn: 'Approve campaign capacity gate',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'CAPACITY_GATE_APPROVAL': {
    code: 'CAPACITY_GATE_APPROVAL',
    labelAr: 'اعتماد بوابة الطاقة الاستيعابية',
    labelEn: 'Capacity Gate Approval',
    descriptionAr: 'اعتماد سقف الطاقة للحملة',
    descriptionEn: 'Capacity gate approval',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'REJECT_CAPACITY_GATE': {
    code: 'REJECT_CAPACITY_GATE',
    labelAr: 'رفض بوابة الطاقة',
    labelEn: 'Reject Capacity Gate',
    descriptionAr: 'رفض إطلاق الحملة لتجاوز الطاقة',
    descriptionEn: 'Reject capacity gate',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'REQUEST_CAPACITY_ADJUSTMENT': {
    code: 'REQUEST_CAPACITY_ADJUSTMENT',
    labelAr: 'طلب تعديل سقف الحملة',
    labelEn: 'Request Campaign Adjustment',
    descriptionAr: 'طلب تعديل سقف الطاقة للحملة',
    descriptionEn: 'Request campaign quota adjustment',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'ADJUST_CAPACITY': {
    code: 'ADJUST_CAPACITY',
    labelAr: 'تعديل الطاقة الاستيعابية',
    labelEn: 'Adjust Operational Capacity',
    descriptionAr: 'تعديل حدود الطاقة التشغيلية',
    descriptionEn: 'Adjust operational capacity settings',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200'
  },
  'CANCEL_CAMPAIGN': {
    code: 'CANCEL_CAMPAIGN',
    labelAr: 'إلغاء الحملة التسويقية',
    labelEn: 'Cancel Campaign',
    descriptionAr: 'إلغاء وإيقاف الحملة التسويقية',
    descriptionEn: 'Cancel marketing campaign',
    category: 'campaign',
    department: 'mkt',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  'LOGIN_SUCCESS': {
    code: 'LOGIN_SUCCESS',
    labelAr: 'تسجيل دخول ناجح',
    labelEn: 'Login Success',
    descriptionAr: 'تسجيل دخول معتمد للمنظومة',
    descriptionEn: 'Successful user sign-in',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'LOGOUT': {
    code: 'LOGOUT',
    labelAr: 'تسجيل خروج من النظام',
    labelEn: 'System Logout',
    descriptionAr: 'إنهاء الجلسة وتسجيل الخروج',
    descriptionEn: 'User signed out',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  'SWITCH_ACCOUNT': {
    code: 'SWITCH_ACCOUNT',
    labelAr: 'تبديل الحساب الإداري',
    labelEn: 'Switch User Account',
    descriptionAr: 'التبديل إلى حساب موظف آخر',
    descriptionEn: 'Switch user session',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'SESSION_TIMEOUT_INACTIVITY': {
    code: 'SESSION_TIMEOUT_INACTIVITY',
    labelAr: 'انتهاء الجلسة لعدم النشاط',
    labelEn: 'Session Timeout',
    descriptionAr: 'إغلاق الجلسة تلقائياً بعد مهلة عدم النشاط',
    descriptionEn: 'Session expired due to inactivity',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'AUTH_DENIED_UNKNOWN_USER': {
    code: 'AUTH_DENIED_UNKNOWN_USER',
    labelAr: 'رفض مصادقة: مستخدم مجهول',
    labelEn: 'Auth Denied: Unknown User',
    descriptionAr: 'محاولة تسجيل دخول باسم مستخدم غير موجود',
    descriptionEn: 'Access denied: unknown username',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'AUTH_DENIED_INACTIVE_USER': {
    code: 'AUTH_DENIED_INACTIVE_USER',
    labelAr: 'رفض وصول: حساب معطل',
    labelEn: 'Auth Denied: Inactive Account',
    descriptionAr: 'محاولة تسجيل دخول لحساب موظف معطل',
    descriptionEn: 'Access denied: deactivated account',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'UNAUTHORIZED_ACCESS_DENIED': {
    code: 'UNAUTHORIZED_ACCESS_DENIED',
    labelAr: 'محاولة وصول غير مصرح بها',
    labelEn: 'Unauthorized Access Blocked',
    descriptionAr: 'حظر محاولة استخدام صلاحية غير ممنوحة',
    descriptionEn: 'Blocked unauthorized action attempt',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION': {
    code: 'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION',
    labelAr: 'حظر أمني: تعطيل آخر مدير نظام',
    labelEn: 'Security Block: Last Admin Deactivation',
    descriptionAr: 'منع تعطيل آخر مدير عام لتفادي قفل المنظومة',
    descriptionEn: 'Blocked deactivation of last admin',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'SECURITY_BLOCK_LAST_ADMIN_PRIVILEGE_STRIP': {
    code: 'SECURITY_BLOCK_LAST_ADMIN_PRIVILEGE_STRIP',
    labelAr: 'حظر أمني: تجريد صلاحية آخر مدير',
    labelEn: 'Security Block: Admin Privilege Strip',
    descriptionAr: 'منع سحب الصلاحيات الإدارية من آخر مدير',
    descriptionEn: 'Blocked stripping privileges from last admin',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'UPDATE_SYSTEM_SETTINGS': {
    code: 'UPDATE_SYSTEM_SETTINGS',
    labelAr: 'تحديث الإعدادات العامة للمنظومة',
    labelEn: 'Update Global System Settings',
    descriptionAr: 'تعديل سياسات وإعدادات المنظومة',
    descriptionEn: 'Update global system settings',
    category: 'security',
    department: 'system',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'SYSTEM_INITIALIZATION': {
    code: 'SYSTEM_INITIALIZATION',
    labelAr: 'تهيئة المنظومة وقواعد البيانات',
    labelEn: 'System Initialization',
    descriptionAr: 'تهيئة النظام وقواعد البيانات التشغيلية',
    descriptionEn: 'Initialize core system entities',
    category: 'security',
    department: 'system',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UPDATE_SLA_CONFIG': {
    code: 'UPDATE_SLA_CONFIG',
    labelAr: 'تحديث معايير اتفاقيات الخدمة (SLA)',
    labelEn: 'Update SLA Configuration',
    descriptionAr: 'تعديل مهل ونسب تنبيهات اتفاقيات الخدمة',
    descriptionEn: 'Update SLA policy configuration',
    category: 'sla',
    department: 'qa',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'CREATE_SLA_CONFIG': {
    code: 'CREATE_SLA_CONFIG',
    labelAr: 'إنشاء معيار اتفاقية مستوى الخدمة',
    labelEn: 'Create SLA Rule',
    descriptionAr: 'إضافة قاعدة SLA جديدة',
    descriptionEn: 'Create new SLA rule',
    category: 'sla',
    department: 'qa',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'DELETE_SLA_CONFIG': {
    code: 'DELETE_SLA_CONFIG',
    labelAr: 'حذف معيار اتفاقية مستوى الخدمة',
    labelEn: 'Delete SLA Rule',
    descriptionAr: 'حذف قاعدة SLA',
    descriptionEn: 'Delete SLA rule',
    category: 'sla',
    department: 'qa',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'TOGGLE_SLA_STATUS': {
    code: 'TOGGLE_SLA_STATUS',
    labelAr: 'تفعيل / تعطيل معيار SLA',
    labelEn: 'Toggle SLA Rule Status',
    descriptionAr: 'تغيير حالة تفعيل سياسة SLA',
    descriptionEn: 'Toggle SLA status',
    category: 'sla',
    department: 'qa',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'CREATE_RECORD': {
    code: 'CREATE_RECORD',
    labelAr: 'إضافة سجل بالدليل الأكاديمي',
    labelEn: 'Create Catalog Record',
    descriptionAr: 'إضافة جامعة أو كلية أو تخصص جديد',
    descriptionEn: 'Create academic catalog record',
    category: 'general',
    department: 'system',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'UPDATE_RECORD': {
    code: 'UPDATE_RECORD',
    labelAr: 'تعديل سجل بالدليل الأكاديمي',
    labelEn: 'Update Catalog Record',
    descriptionAr: 'تعديل بيانات جامعة أو كلية بالدليل',
    descriptionEn: 'Update catalog record',
    category: 'general',
    department: 'system',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'DELETE_RECORD': {
    code: 'DELETE_RECORD',
    labelAr: 'حذف سجل من الدليل الأكاديمي',
    labelEn: 'Delete Catalog Record',
    descriptionAr: 'حذف كيان من الدليل الأكاديمي',
    descriptionEn: 'Delete catalog record',
    category: 'general',
    department: 'system',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CUSTOMER_HANDOVER_TO_CONSULTANT': {
    code: 'CUSTOMER_HANDOVER_TO_CONSULTANT',
    labelAr: 'تحويل العميل لمستشار القبول',
    labelEn: 'Customer Handover to Consultant',
    descriptionAr: 'إحالة العميل من خدمة العملاء للمستشار',
    descriptionEn: 'Hand over lead to consultant',
    category: 'student',
    department: 'cs',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'CREATE_TASK': {
    code: 'CREATE_TASK',
    labelAr: 'إنشاء مهمة عمل تشغيلية',
    labelEn: 'Create Operational Task',
    descriptionAr: 'إسناد وتوثيق مهمة عمل للموظف',
    descriptionEn: 'Create task assignment',
    category: 'task',
    department: 'ops',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UPDATE_TASK_STATUS': {
    code: 'UPDATE_TASK_STATUS',
    labelAr: 'تحديث حالة المهمة',
    labelEn: 'Update Task Status',
    descriptionAr: 'تحديث حالة إنجاز مهمة العمل',
    descriptionEn: 'Update task progress',
    category: 'task',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'CREATE_COMPLAINT': {
    code: 'CREATE_COMPLAINT',
    labelAr: 'تسجيل شكوى عميل جديدة',
    labelEn: 'Register Customer Complaint',
    descriptionAr: 'تسجيل وتوثيق تذكرة شكوى عميل',
    descriptionEn: 'Register customer complaint ticket',
    category: 'complaint',
    department: 'qa',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'RESOLVE_COMPLAINT': {
    code: 'RESOLVE_COMPLAINT',
    labelAr: 'معالجة وحل الشكوى',
    labelEn: 'Resolve Customer Complaint',
    descriptionAr: 'إغلاق وحل الشكوى وتحديد السبب الجذري',
    descriptionEn: 'Resolve complaint and document root cause',
    category: 'complaint',
    department: 'qa',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'CREATE_HANDOFF': {
    code: 'CREATE_HANDOFF',
    labelAr: 'إنشاء تسليم تشغيلي بين الإدارات',
    labelEn: 'Create Departmental Handoff',
    descriptionAr: 'إنشاء إجراء تسليم رسمي بين قسمين',
    descriptionEn: 'Create formal handoff between departments',
    category: 'task',
    department: 'ops',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'RESOLVE_HANDOFF_APPROVED': {
    code: 'RESOLVE_HANDOFF_APPROVED',
    labelAr: 'اعتماد التسليم التشغيلي بين الإدارات',
    labelEn: 'Approve Departmental Handoff',
    descriptionAr: 'الموافقة على استلام المعاملة المحولة',
    descriptionEn: 'Approve departmental handoff',
    category: 'task',
    department: 'ops',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'RESOLVE_HANDOFF_REJECTED': {
    code: 'RESOLVE_HANDOFF_REJECTED',
    labelAr: 'رفض استلام المعاملة بين الإدارات',
    labelEn: 'Reject Departmental Handoff',
    descriptionAr: 'رفض استلام التسليم لعدم اكتمال المتطلبات',
    descriptionEn: 'Reject handoff due to requirements',
    category: 'task',
    department: 'ops',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'RECORD_MEETING': {
    code: 'RECORD_MEETING',
    labelAr: 'توثيق محضر اجتماع إداري',
    labelEn: 'Record Administrative Meeting',
    descriptionAr: 'توثيق قرارات وأجندة الاجتماع الإداري',
    descriptionEn: 'Record meeting minutes and decisions',
    category: 'meeting',
    department: 'system',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'ACTIVATE_SYSTEM_USER': {
    code: 'ACTIVATE_SYSTEM_USER',
    labelAr: 'تفعيل مستخدم النظام',
    labelEn: 'Activate System User',
    descriptionAr: 'تفعيل حساب مستخدم النظام ومنحه صلاحية تسجيل الدخول للمنظومة',
    descriptionEn: 'Activate system user account and enable login access',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'DEACTIVATE_SYSTEM_USER': {
    code: 'DEACTIVATE_SYSTEM_USER',
    labelAr: 'إيقاف مستخدم النظام',
    labelEn: 'Deactivate System User',
    descriptionAr: 'تعطيل حساب مستخدم النظام وإيقاف صلاحية تسجيل الدخول للمنظومة',
    descriptionEn: 'Deactivate system user account and suspend login access',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_SYSTEM_USER': {
    code: 'CREATE_SYSTEM_USER',
    labelAr: 'إنشاء مستخدم للنظام',
    labelEn: 'Create System User',
    descriptionAr: 'إنشاء وتفعيل حساب دخول جديد لمنظومة BCT للموظف',
    descriptionEn: 'Provision and activate BCT system login account for employee',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'RESET_USER_PASSWORD': {
    code: 'RESET_USER_PASSWORD',
    labelAr: 'إعادة تعيين كلمة المرور للمستخدم',
    labelEn: 'Reset User Password',
    descriptionAr: 'إعادة تعيين كلمة مرور المستخدم إلى كلمة مرور مؤقتة وتفعيل إلزامية التغيير',
    descriptionEn: 'Reset user password to temporary credentials with mandatory change',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'REPAIR_USER_ACCOUNT': {
    code: 'REPAIR_USER_ACCOUNT',
    labelAr: 'إصلاح وتزامن حساب المستخدم',
    labelEn: 'Repair & Synchronize User Account',
    descriptionAr: 'إصلاح مزامنة حساب الموظف مع سجلات المصادقة وإعادة ضبط بيانات الدخول',
    descriptionEn: 'Repair employee-to-auth sync record and reset login credentials',
    category: 'hr',
    department: 'hr',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  'RECONCILE_SYSTEM_USERS': {
    code: 'RECONCILE_SYSTEM_USERS',
    labelAr: 'فحص ومزامنة حسابات مستخدمي المنظومة',
    labelEn: 'Reconcile All System Users',
    descriptionAr: 'فحص ومطابقة شاملة لسجلات الموظفين وحسابات مستخدمي النظام ومعالجة الفروقات',
    descriptionEn: 'Perform complete audit reconciliation between employees and system auth accounts',
    category: 'security',
    department: 'system',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'CHANGE_FIRST_LOGIN_PASSWORD': {
    code: 'CHANGE_FIRST_LOGIN_PASSWORD',
    labelAr: 'تغيير كلمة المرور الإلزامي عند أول دخول',
    labelEn: 'Mandatory Initial Password Change',
    descriptionAr: 'قيام المستخدم بتغيير كلمة المرور المؤقتة إلى كلمة مرور شخصية جديدة بنجاح',
    descriptionEn: 'User successfully changed temporary password to a permanent one upon initial login',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'LOGIN_FAILED_WRONG_PASSWORD': {
    code: 'LOGIN_FAILED_WRONG_PASSWORD',
    labelAr: 'فشل تسجيل الدخول: كلمة المرور غير صحيحة',
    labelEn: 'Login Failed: Incorrect Password',
    descriptionAr: 'محاولة تسجيل دخول فاشلة بسبب إدخال كلمة مرور غير مطابقة',
    descriptionEn: 'Failed authentication attempt due to incorrect password entry',
    category: 'security',
    department: 'security',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  'CREATE_INCENTIVE_POLICY': {
    code: 'CREATE_INCENTIVE_POLICY',
    labelAr: 'إنشاء سياسة حوافز مالية',
    labelEn: 'Create Incentive Policy',
    descriptionAr: 'تحديد واعتماد سياسة حوافز ومكافآت مالية جديدة لأحد الأقسام',
    descriptionEn: 'Define and approve new financial incentive policy for department',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'UPDATE_INCENTIVE_POLICY': {
    code: 'UPDATE_INCENTIVE_POLICY',
    labelAr: 'تعديل سياسة الحوافز المالية',
    labelEn: 'Update Incentive Policy',
    descriptionAr: 'تحديث معايير أو مبالغ سياسة الحوافز المالية المعتمدة',
    descriptionEn: 'Update rules, targets, or payout amounts of incentive policy',
    category: 'finance',
    department: 'fin',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'UPDATE_COMPLAINT_CORRECTIVE_ACTION': {
    code: 'UPDATE_COMPLAINT_CORRECTIVE_ACTION',
    labelAr: 'توثيق الإجراء التصحيحي والوقائي للشكوى',
    labelEn: 'Document Corrective & Preventative Action',
    descriptionAr: 'توثيق الإجراء التصحيحي والوقائي لقسم إدارة الجودة على شكوى معتمدة',
    descriptionEn: 'Document QA corrective and preventative action for customer complaint',
    category: 'complaint',
    department: 'qa',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  'ESCALATE_STAGNANT_FILE': {
    code: 'ESCALATE_STAGNANT_FILE',
    labelAr: 'تصعيد ملف راكد للإدارة المشرفة',
    labelEn: 'Escalate Stagnant File to Supervisor',
    descriptionAr: 'تصعيد ملف طالب راكد لتجاوزه المهلة المحددة بدون إجراء تشغيلي',
    descriptionEn: 'Escalate stagnant academic file exceeding SLA threshold to supervisor',
    category: 'file',
    department: 'qa',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'UPDATE_DEPARTMENT_REPORT_PERMISSIONS': {
    code: 'UPDATE_DEPARTMENT_REPORT_PERMISSIONS',
    labelAr: 'تحديث صلاحيات تقارير الإدارة',
    labelEn: 'Update Department Report Permissions',
    descriptionAr: 'تعديل الصلاحيات المتاحة لإدارة معينة في عرض التقارير التفصيلية',
    descriptionEn: 'Update report visibility permissions assigned to a department',
    category: 'system_security',
    department: 'gm',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  'UPDATE_EMPLOYEE_REPORT_PERMISSIONS': {
    code: 'UPDATE_EMPLOYEE_REPORT_PERMISSIONS',
    labelAr: 'تحديث استثناءات تقارير الموظف',
    labelEn: 'Update Employee Report Overrides',
    descriptionAr: 'تعديل استثناءات المنح أو الحجب الفردي لعرض التقارير للموظف',
    descriptionEn: 'Update individual employee report visibility grant or deny overrides',
    category: 'system_security',
    department: 'gm',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT': {
    code: 'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT',
    labelAr: 'محاولة ولوج غير مصرح لتقرير',
    labelEn: 'Unauthorized Report Access Attempt',
    descriptionAr: 'تم حجب محاولة وصول مباشرة لبيانات تقرير غير مصرح به للمستخدم',
    descriptionEn: 'Blocked unauthorized direct access attempt to confidential report data',
    category: 'system_security',
    department: 'qa',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  }
};

export type SystemAuditEventCode = keyof typeof ACTION_EVENTS_REGISTRY;

/**
 * Normalizes an event code to find an existing registry match.
 * For example: matches 'FILE_STAGE_TRANSITION' with 'STAGE_TRANSITION' or 'FILE_ACTIVITY_STAGE_TRANSITION'.
 */
export function findRegisteredDefinition(code: string): ActionEventDefinition | null {
  if (!code) return null;
  const cleanCode = code.trim();
  const directMatch = ACTION_EVENTS_REGISTRY[cleanCode] || ACTION_EVENTS_REGISTRY[cleanCode.toUpperCase()];
  if (directMatch) return directMatch;

  // Try prefix variations
  if (cleanCode.startsWith('FILE_')) {
    const stripped = cleanCode.replace(/^FILE_/, '');
    if (ACTION_EVENTS_REGISTRY[stripped]) return ACTION_EVENTS_REGISTRY[stripped];
  } else {
    const prepended = `FILE_${cleanCode}`;
    if (ACTION_EVENTS_REGISTRY[prepended]) return ACTION_EVENTS_REGISTRY[prepended];
  }

  // Try legacy prefix 'FILE_ACTIVITY_'
  if (cleanCode.startsWith('FILE_ACTIVITY_')) {
    const strippedLegacy = cleanCode.replace(/^FILE_ACTIVITY_/, '');
    if (ACTION_EVENTS_REGISTRY[strippedLegacy]) return ACTION_EVENTS_REGISTRY[strippedLegacy];
    const withFile = `FILE_${strippedLegacy}`;
    if (ACTION_EVENTS_REGISTRY[withFile]) return ACTION_EVENTS_REGISTRY[withFile];
  }

  return null;
}

/**
 * Resolves an action event code into localized text and presentation attributes.
 * Strictly guarantees that Arabic mode NEVER returns raw English codes.
 * If code is unrecognized, displays the original code in parentheses for diagnostics.
 */
export function getActionEventMeta(code: string, language: 'ar' | 'en' = 'ar'): ResolvedActionEvent {
  const def = findRegisteredDefinition(code);

  if (def) {
    const macroCat = getMacroCategory(def.category);
    const dept = def.department || resolveActionDepartment(def.category, def.code);
    return {
      code,
      label: language === 'ar' ? def.labelAr : def.labelEn,
      description: language === 'ar' ? def.descriptionAr : def.descriptionEn,
      category: def.category,
      categoryLabel: language === 'ar' ? (CATEGORY_LABELS[def.category]?.ar || def.category) : (CATEGORY_LABELS[def.category]?.en || def.category),
      macroCategory: macroCat,
      macroCategoryLabel: language === 'ar' ? CATEGORY_LABELS[macroCat]?.ar : CATEGORY_LABELS[macroCat]?.en,
      department: dept,
      departmentLabel: language === 'ar' ? DEPARTMENT_LABELS[dept]?.ar : DEPARTMENT_LABELS[dept]?.en,
      color: def.badgeColor,
      isRecognized: true
    };
  }

  // Smart Fallback for truly unregistered or legacy custom codes:
  const cleanCode = (code || '').trim();
  const fallbackDept: ActionDepartment = 'system';
  const fallbackMacroCat: MacroCategory = 'system_security';

  if (language === 'ar') {
    return {
      code: cleanCode,
      label: cleanCode ? `عملية نظام غير معرّفة (${cleanCode})` : 'عملية نظام غير معرّفة',
      description: cleanCode ? `كود عملية تشغيلي غير مسجل بالدليل المركزي: ${cleanCode}` : 'إجراء تشغيلي موثق بالنظام',
      category: 'general',
      categoryLabel: 'إجراء تشغيلي غير معرّف',
      macroCategory: fallbackMacroCat,
      macroCategoryLabel: 'إدارة النظام والأمان',
      department: fallbackDept,
      departmentLabel: 'إدارة النظام والتقنية',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      isRecognized: false
    };
  }

  // English fallback:
  return {
    code: cleanCode,
    label: cleanCode ? `Unknown System Action (${cleanCode})` : 'Unknown System Action',
    description: cleanCode ? `Unregistered event code in central registry: ${cleanCode}` : 'Unrecognized operational system event',
    category: 'general',
    categoryLabel: 'Unrecognized Action',
    macroCategory: fallbackMacroCat,
    macroCategoryLabel: 'System & Security',
    department: fallbackDept,
    departmentLabel: 'System Administration',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    isRecognized: false
  };
}
