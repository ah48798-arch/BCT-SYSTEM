import arCommon from './ar/common.json';
import enCommon from './en/common.json';
import arAudit from './ar/audit.json';
import enAudit from './en/audit.json';

export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    ...arCommon,
    audit: arAudit,
  },
  en: {
    ...enCommon,
    audit: enAudit,
  },
};

// Universal fallback dictionaries to guarantee zero raw translation keys leak
const FALLBACK_ACTIONS: Record<string, { ar: string; en: string }> = {
  close: { ar: 'إغلاق', en: 'Close' },
  open: { ar: 'فتح', en: 'Open' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  save: { ar: 'حفظ', en: 'Save' },
  delete: { ar: 'حذف', en: 'Delete' },
  edit: { ar: 'تعديل', en: 'Edit' },
  create: { ar: 'إنشاء', en: 'Create' },
  filter: { ar: 'تصفية', en: 'Filter' },
  search: { ar: 'بحث', en: 'Search' },
  export: { ar: 'تصدير', en: 'Export' },
  exportPdf: { ar: 'تصدير PDF', en: 'Export PDF' },
  exportExcel: { ar: 'تصدير Excel', en: 'Export Excel' },
  approve: { ar: 'موافقة', en: 'Approve' },
  reject: { ar: 'رفض', en: 'Reject' },
  confirm: { ar: 'تأكيد', en: 'Confirm' },
  assign: { ar: 'إسناد', en: 'Assign' },
  view: { ar: 'عرض', en: 'View' },
  back: { ar: 'رجوع', en: 'Back' },
  upload: { ar: 'رفع', en: 'Upload' },
  download: { ar: 'تحميل', en: 'Download' },
  refresh: { ar: 'تحديث', en: 'Refresh' },
  reset: { ar: 'إعادة تعيين', en: 'Reset' },
  details: { ar: 'التفاصيل', en: 'Details' },
  print: { ar: 'طباعة', en: 'Print' },
  copy: { ar: 'نسخ', en: 'Copy' },
  reopen: { ar: 'إعادة فتح', en: 'Reopen' },
  archive: { ar: 'أرشفة', en: 'Archive' },
  evaluate: { ar: 'تقييم', en: 'Evaluate' },
  change: { ar: 'تغيير', en: 'Change' },
  saveNote: { ar: 'حفظ الملاحظة', en: 'Save Note' },
};

const FALLBACK_DEPARTMENTS: Record<string, { ar: string; en: string }> = {
  gm: { ar: 'الإدارة العامة', en: 'General Management' },
  ops: { ar: 'إدارة العمليات والخدمات', en: 'Operations & Services' },
  cs: { ar: 'إدارة المستشارين وخدمة العملاء', en: 'Consultants & Customer Service' },
  mkt: { ar: 'إدارة التسويق', en: 'Marketing' },
  fin: { ar: 'الإدارة المالية والإدارية', en: 'Finance & Administration' },
  qa: { ar: 'الجودة والأنظمة', en: 'Quality & Systems' },
  it: { ar: 'تقنية المعلومات والأنظمة', en: 'Information Technology & Systems' },
  hr: { ar: 'الموارد البشرية والمستخدمين', en: 'Human Resources' },
  system: { ar: 'إدارة النظام والتقنية', en: 'System Administration' },
  security: { ar: 'الأمن والمعلومات', en: 'Security & Intelligence' },
  sales: { ar: 'المبيعات', en: 'Sales' },
  admin: { ar: 'الإدارة التنفيذية', en: 'Executive Administration' },
};

const FALLBACK_STATUSES: Record<string, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  qualified: { ar: 'مؤهل', en: 'Qualified' },
  registered: { ar: 'مسجّل ومسدّد', en: 'Registered & Paid' },
  review: { ar: 'قيد مراجعة الأوراق', en: 'Document Review' },
  submitted: { ar: 'مقدَّم على المنصة', en: 'Submitted on Platform' },
  preliminary: { ar: 'قبول مبدئي', en: 'Preliminary Admission' },
  stage2: { ar: 'سداد المرحلة الثانية', en: 'Second-Stage Payment' },
  docs: { ar: 'توثيق وتسليم الأصول', en: 'Documentation & Attestation' },
  final: { ar: 'قبول نهائي', en: 'Final Admission' },
  closed: { ar: 'مغلق + تقييم', en: 'Closed & Evaluated' },
  new_inquiry: { ar: 'استفسار جديد', en: 'New Inquiry' },
  contacted: { ar: 'تم التواصل', en: 'Contacted' },
  documentation: { ar: 'توثيق وتسليم الأوراق', en: 'Documentation & Attestation' },
  initial_admit: { ar: 'قبول مبدئي', en: 'Initial Admission' },
  final_admit: { ar: 'قبول نهائي', en: 'Final Admission' },
  admitted: { ar: 'مقبول', en: 'Admitted' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  graduated: { ar: 'تخرج', en: 'Graduated' },
  archived: { ar: 'مؤرشف', en: 'Archived' },
};

function formatKeyToLabel(key: string, isAr: boolean): string {
  // Strip category prefix if present e.g. "actions.close" -> "close"
  const cleanKey = key.includes('.') ? key.split('.').pop() || key : key;
  
  // Check in actions dictionary
  if (FALLBACK_ACTIONS[cleanKey]) {
    return isAr ? FALLBACK_ACTIONS[cleanKey].ar : FALLBACK_ACTIONS[cleanKey].en;
  }
  // Check in departments dictionary
  if (FALLBACK_DEPARTMENTS[cleanKey]) {
    return isAr ? FALLBACK_DEPARTMENTS[cleanKey].ar : FALLBACK_DEPARTMENTS[cleanKey].en;
  }
  // Check in statuses dictionary
  if (FALLBACK_STATUSES[cleanKey]) {
    return isAr ? FALLBACK_STATUSES[cleanKey].ar : FALLBACK_STATUSES[cleanKey].en;
  }

  if (isAr) {
    // If unknown key in Arabic, return clean Arabic label or fallback
    return cleanKey.replace(/_/g, ' ');
  }

  // English: format snake_case or camelCase to Title Case
  return cleanKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getNestedTranslation(
  obj: any,
  path: string,
  paramsOrFallback?: Record<string, string | number> | string,
  targetLang?: Language
): string {
  const parts = path.split('.');
  let current = obj;
  let found = true;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      found = false;
      break;
    }
  }

  const isArabic = targetLang
    ? targetLang === 'ar'
    : obj === translations.ar || obj?.actions?.save === 'حفظ' || obj?.common?.appName === 'بي سي تي للاستشارات';

  let result: string;
  if (found && typeof current === 'string') {
    result = current;
  } else if (typeof paramsOrFallback === 'string') {
    result = paramsOrFallback;
  } else {
    // Direct lookup in Fallback registries
    const topKey = parts[0];
    const subKey = parts.slice(1).join('.');

    if (topKey === 'actions' && FALLBACK_ACTIONS[subKey]) {
      result = isArabic ? FALLBACK_ACTIONS[subKey].ar : FALLBACK_ACTIONS[subKey].en;
    } else if (topKey === 'departments' && FALLBACK_DEPARTMENTS[subKey]) {
      result = isArabic ? FALLBACK_DEPARTMENTS[subKey].ar : FALLBACK_DEPARTMENTS[subKey].en;
    } else if (topKey === 'statuses' && FALLBACK_STATUSES[subKey]) {
      result = isArabic ? FALLBACK_STATUSES[subKey].ar : FALLBACK_STATUSES[subKey].en;
    } else {
      // Look up in opposite language dictionary
      const oppositeDict: any = isArabic ? translations.en : translations.ar;
      let oppCurrent = oppositeDict;
      let oppFound = true;
      for (const part of parts) {
        if (oppCurrent && typeof oppCurrent === 'object' && part in oppCurrent) {
          oppCurrent = oppCurrent[part];
        } else {
          oppFound = false;
          break;
        }
      }
      if (oppFound && typeof oppCurrent === 'string') {
        result = oppCurrent;
      } else {
        // Universal safeguard: Never return raw dot-separated programming keys
        result = formatKeyToLabel(path, isArabic);
      }
    }
  }

  // Parameter interpolation e.g. {count}, {total}
  if (paramsOrFallback && typeof paramsOrFallback === 'object') {
    for (const [key, val] of Object.entries(paramsOrFallback)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }
  }

  return result;
}
