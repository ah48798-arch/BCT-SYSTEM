/**
 * BCT Enterprise - Audit Log Diff Utility
 * Provides deep comparison between old_state and new_state
 * with structured diff nodes, Arabic/English localized labels,
 * array element diffing, and nested object support.
 */

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ArrayDiffSummary {
  added: any[];
  removed: any[];
  unchanged: any[];
  isPrimitiveArray: boolean;
}

export interface DiffNode {
  key: string;
  path: string;
  labelAr: string;
  labelEn: string;
  type: DiffType;
  oldValue: any;
  newValue: any;
  isNested: boolean;
  isArray: boolean;
  arrayDiff?: ArrayDiffSummary;
  children?: DiffNode[];
}

export interface DiffSummaryStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  total: number;
}

// Comprehensive dictionary for field localization
export const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  // General & Identifiers
  id: { ar: 'المعرف الرقمي', en: 'ID' },
  status: { ar: 'الحالة التشغيلية', en: 'Status' },
  name: { ar: 'الاسم', en: 'Name' },
  title: { ar: 'العنوان', en: 'Title' },
  description: { ar: 'الوصف والبيان', en: 'Description' },
  notes: { ar: 'الملاحظات الإدارية', en: 'Notes' },
  note: { ar: 'ملاحظة', en: 'Note' },
  reason: { ar: 'السبب / المبرر', en: 'Reason' },
  created_at: { ar: 'تاريخ الإنشاء', en: 'Created At' },
  updated_at: { ar: 'تاريخ التحديث', en: 'Updated At' },
  deleted_at: { ar: 'تاريخ الحذف', en: 'Deleted At' },
  category: { ar: 'التصنيف', en: 'Category' },
  type: { ar: 'النوع', en: 'Type' },
  priority: { ar: 'الأولوية', en: 'Priority' },
  is_active: { ar: 'الحالة (نشط/معطل)', en: 'Active Status' },
  active: { ar: 'نشط', en: 'Active' },
  version: { ar: 'إصدار النظام', en: 'Version' },
  ip_address: { ar: 'عنوان IP', en: 'IP Address' },
  user_agent: { ar: 'المتصفح وبيئة العمل', en: 'User Agent' },

  // Student & Academic Pipeline
  full_name: { ar: 'الاسم الكامل', en: 'Full Name' },
  first_name: { ar: 'الاسم الأول', en: 'First Name' },
  last_name: { ar: 'اسم العائلة', en: 'Last Name' },
  student_name: { ar: 'اسم الطالب', en: 'Student Name' },
  student_id: { ar: 'معرف الطالب', en: 'Student ID' },
  file_number: { ar: 'رقم الملف', en: 'File Number' },
  phone: { ar: 'رقم الهاتف', en: 'Phone' },
  phone_number: { ar: 'رقم الهاتف', en: 'Phone Number' },
  whatsapp: { ar: 'رقم الواتساب', en: 'WhatsApp' },
  whatsapp_number: { ar: 'رقم الواتساب', en: 'WhatsApp' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  nationality: { ar: 'الجنسية', en: 'Nationality' },
  passport_number: { ar: 'رقم جواز السفر', en: 'Passport Number' },
  national_id: { ar: 'الرقم القومي', en: 'National ID' },
  birth_date: { ar: 'تاريخ الميلاد', en: 'Birth Date' },
  gender: { ar: 'الجنس', en: 'Gender' },
  high_school_percentage: { ar: 'نسبة الثانوية العامة', en: 'High School %' },
  high_school_type: { ar: 'نوع شهادة الثانوية', en: 'High School Type' },
  high_school_country: { ar: 'دولة الشهادة', en: 'Certificate Country' },
  graduation_year: { ar: 'سنة التخرج', en: 'Graduation Year' },
  assigned_to: { ar: 'الموظف المسؤول', en: 'Assigned Specialist' },
  specialist_id: { ar: 'معرف الموظف المسؤول', en: 'Specialist ID' },
  specialist_name: { ar: 'اسم الموظف المسؤول', en: 'Specialist Name' },
  stage: { ar: 'مرحلة الملف', en: 'Pipeline Stage' },
  stage_id: { ar: 'معرف المرحلة', en: 'Stage ID' },
  stage_number: { ar: 'رقم المرحلة', en: 'Stage Number' },
  current_stage: { ar: 'المرحلة الحالية', en: 'Current Stage' },
  previous_stage: { ar: 'المرحلة السابقة', en: 'Previous Stage' },
  from_stage: { ar: 'من المرحلة', en: 'From Stage' },
  to_stage: { ar: 'إلى المرحلة', en: 'To Stage' },
  academic_year: { ar: 'العام الأكاديمي', en: 'Academic Year' },
  term: { ar: 'الفصل الدراسي', en: 'Academic Term' },
  preferred_term: { ar: 'الفصل الدراسي المفضل', en: 'Preferred Term' },
  source: { ar: 'مصدر العميل / القناة', en: 'Lead Source' },
  lead_source: { ar: 'مصدر العميل', en: 'Lead Source' },
  campaign_id: { ar: 'الحملة التسويقية', en: 'Campaign ID' },
  campaign_name: { ar: 'اسم الحملة', en: 'Campaign Name' },

  // University & Faculties & Programs
  university_id: { ar: 'معرف الجامعة', en: 'University ID' },
  university_name: { ar: 'اسم الجامعة', en: 'University Name' },
  university_name_ar: { ar: 'اسم الجامعة بالعربية', en: 'University Arabic Name' },
  university_name_en: { ar: 'اسم الجامعة بالإنجليزية', en: 'University English Name' },
  faculty_id: { ar: 'معرف الكلية', en: 'Faculty ID' },
  faculty_name: { ar: 'اسم الكلية', en: 'Faculty Name' },
  faculty_name_ar: { ar: 'اسم الكلية بالعربية', en: 'Faculty Arabic Name' },
  faculty_name_en: { ar: 'اسم الكلية بالإنجليزية', en: 'Faculty English Name' },
  program_id: { ar: 'معرف البرنامج الأكاديمي', en: 'Program ID' },
  program_name: { ar: 'البرنامج الأكاديمي', en: 'Academic Program' },
  campus_id: { ar: 'معرف الحرم الجامعي', en: 'Campus ID' },
  campus_name: { ar: 'الحرم الجامعي / الفرع', en: 'Campus / Branch' },
  choices: { ar: 'قائمة الرغبات الجامعية', en: 'University Choices' },
  choices_count: { ar: 'عدد الرغبات', en: 'Choices Count' },
  preference_order: { ar: 'ترتيب الرغبة', en: 'Preference Order' },
  order: { ar: 'الترتيب', en: 'Order' },

  // Financial & Accounting
  amount: { ar: 'المبلغ المالي', en: 'Amount' },
  amount_egp: { ar: 'المبلغ بالجنيه المصري', en: 'Amount (EGP)' },
  amount_usd: { ar: 'المبلغ بالدولار الأمريكي', en: 'Amount (USD)' },
  currency: { ar: 'العملة', en: 'Currency' },
  exchange_rate: { ar: 'سعر الصرف المعتمد', en: 'Exchange Rate' },
  payment_method: { ar: 'طريقة الدفع / القناة', en: 'Payment Method' },
  receipt_code: { ar: 'رقم الإيصال', en: 'Receipt Code' },
  receipt_number: { ar: 'رقم إيصال السداد', en: 'Receipt Number' },
  receipt_id: { ar: 'معرف الإيصال', en: 'Receipt ID' },
  voucher_number: { ar: 'رقم سند الصرف', en: 'Payment Voucher #' },
  transaction_id: { ar: 'معرف المعاملة', en: 'Transaction ID' },
  reference_number: { ar: 'الرقم المرجعي', en: 'Reference Number' },
  payment_reference: { ar: 'مرجع التحويل / المعاملة', en: 'Payment Reference' },
  payment_description: { ar: 'بيان السداد (وذلك مقابل)', en: 'Payment Description' },
  payer_name: { ar: 'اسم المودع / ولي الأمر', en: 'Payer Name' },
  bank_name: { ar: 'البنك / الحساب المستلم', en: 'Bank / Receiving Account' },
  receipt_type: { ar: 'نوع الإيصال', en: 'Receipt Type' },
  expense_type: { ar: 'بند المصروف', en: 'Expense Category' },
  financial_account_id: { ar: 'الحساب المالي المستهدف', en: 'Financial Account ID' },
  financial_account_name: { ar: 'اسم الحساب المالي المستلم', en: 'Receiving Financial Account' },
  student_file_id: { ar: 'ملف الطالب المرتبط', en: 'Linked Student File' },
  last_edit_reason: { ar: 'سبب تعديل السند', en: 'Modification Reason' },
  cancellation_reason: { ar: 'سبب إلغاء السند', en: 'Cancellation Reason' },
  cancelled_at: { ar: 'تاريخ ووقت الإلغاء', en: 'Cancelled At' },
  cancelled_by: { ar: 'الموظف القائم بالإلغاء', en: 'Cancelled By' },
  updated_by: { ar: 'آخر تعديل بواسطة', en: 'Last Modified By' },
  changed_fields: { ar: 'الحقول المعدلة', en: 'Changed Fields' },
  account_id: { ar: 'معرف الحساب', en: 'Account ID' },
  from_account_id: { ar: 'من حساب', en: 'From Account' },
  to_account_id: { ar: 'إلى حساب', en: 'To Account' },
  paid_by: { ar: 'القائم بالسداد', en: 'Paid By' },
  collected_by: { ar: 'المحصل', en: 'Collected By' },
  confirmed_by: { ar: 'معتمد التحصيل', en: 'Confirmed By' },
  approved_by: { ar: 'معتمد الصرف', en: 'Approved By' },
  beneficiary: { ar: 'المستفيد', en: 'Beneficiary' },
  payment_date: { ar: 'تاريخ السداد', en: 'Payment Date' },
  confirmed_at: { ar: 'تاريخ ووقت الاعتماد', en: 'Confirmed At' },
  rejected_at: { ar: 'تاريخ الرفض', en: 'Rejected At' },
  reversed_at: { ar: 'تاريخ الاسترداد', en: 'Reversed At' },
  is_confirmed: { ar: 'تأكيد السداد', en: 'Payment Confirmed' },
  is_approved: { ar: 'حالة الاعتماد', en: 'Approval Status' },
  total_budget: { ar: 'الموازنة التقديرية', en: 'Total Budget' },
  allocated_amount: { ar: 'المبلغ المخصص', en: 'Allocated Amount' },
  spent_amount: { ar: 'المبلغ المنصرف', en: 'Spent Amount' },
  remaining_amount: { ar: 'الرصيد المتبقي', en: 'Remaining Balance' },

  // HR, Users & Roles
  username: { ar: 'اسم المستخدم', en: 'Username' },
  role: { ar: 'الدور الإداري الرئيسي', en: 'Role' },
  roles: { ar: 'مصفوفة الأدوار المعينة', en: 'Assigned Roles' },
  permissions: { ar: 'مصفوفة الصلاحيات التشغيلية', en: 'Permissions' },
  overrides: { ar: 'تجاوزات الصلاحيات', en: 'Permission Overrides' },
  department_id: { ar: 'القسم / الإدارة', en: 'Department' },
  department_name: { ar: 'اسم الإدارة', en: 'Department Name' },
  job_title: { ar: 'المسمى الوظيفي', en: 'Job Title' },
  direct_manager_id: { ar: 'المدير المباشر', en: 'Direct Manager' },
  backup_employee_id: { ar: 'الموظف البديل المعتمد', en: 'Backup Employee' },
  backup_role: { ar: 'دور الموظف البديل', en: 'Backup Role' },
  start_date: { ar: 'تاريخ البدء', en: 'Start Date' },
  end_date: { ar: 'تاريخ الانتهاء', en: 'End Date' },
  evaluation_period: { ar: 'فترة التقييم', en: 'Evaluation Period' },
  score: { ar: 'درجة التقييم', en: 'Score' },
  rating: { ar: 'التقييم', en: 'Rating' },
  performance_score: { ar: 'درجة الأداء', en: 'Performance Score' },
  workload: { ar: 'عبء العمل', en: 'Workload' },
  max_workload: { ar: 'الحد الأقصى للعمل', en: 'Max Workload' },
  weekly_capacity: { ar: 'الطاقة الاستيعابية الأسبوعية', en: 'Weekly Capacity' },
  daily_capacity: { ar: 'الطاقة الاستيعابية اليومية', en: 'Daily Capacity' },
  monthly_capacity: { ar: 'الطاقة الاستيعابية الشهرية', en: 'Monthly Capacity' },
  suspended: { ar: 'معلق إدارياً', en: 'Suspended' },
  last_login: { ar: 'آخر تسجيل دخول', en: 'Last Login' },

  // SLA & Workflow
  target_hours: { ar: 'المهلة الزمنية المحددة (بالساعات)', en: 'Target Hours (SLA)' },
  warning_threshold_pct: { ar: 'نسبة التنبيه قبل تجاوز المهلة', en: 'Warning Threshold %' },
  auto_escalate: { ar: 'التصعيد التلقائي', en: 'Auto Escalate' },
  escalate_to: { ar: 'الجهة المصعّد إليها', en: 'Escalate To' },
  is_enabled: { ar: 'تفعيل الإجراء', en: 'Enabled Status' },
  documents: { ar: 'المستندات والأوراق', en: 'Documents' },
  documents_count: { ar: 'عدد المستندات', en: 'Documents Count' },
  verified: { ar: 'تم التحقق والاعتماد', en: 'Verified' },
  status_note: { ar: 'بيان الحالة الإداري', en: 'Status Note' }
};

/**
 * Returns a human-friendly Arabic and English label for a given field key.
 */
export function getFieldLabel(key: string): { ar: string; en: string } {
  const normalizedKey = key.toLowerCase().trim();
  if (FIELD_LABELS[normalizedKey]) {
    return FIELD_LABELS[normalizedKey];
  }

  // Convert snake_case or camelCase to words
  const words = normalizedKey
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    ar: words,
    en: words
  };
}

/**
 * Format a value nicely for display.
 */
export function formatDiffValue(val: any, language: 'ar' | 'en' = 'ar'): string {
  if (val === null || val === undefined) {
    return language === 'ar' ? '— (فارغ)' : '— (Empty)';
  }

  if (typeof val === 'boolean') {
    if (language === 'ar') {
      return val ? 'نعم (True)' : 'لا (False)';
    }
    return val ? 'Yes (True)' : 'No (False)';
  }

  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
  }

  if (typeof val === 'string') {
    if (val.trim() === '') {
      return language === 'ar' ? '— (نص فارغ)' : '— (Empty String)';
    }
    // Check if ISO date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
        }
      } catch {
        // Fallback to raw string
      }
    }
    return val;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return language === 'ar' ? 'قائمة فارغة []' : 'Empty List []';
    }
    if (val.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
      return val.join(', ');
    }
    return language === 'ar' ? `قائمة عناصر (${val.length} عنصر)` : `Array (${val.length} items)`;
  }

  if (typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) {
      return '{}';
    }
    return language === 'ar' ? `كائن بيانات (${keys.length} حقل)` : `Object (${keys.length} fields)`;
  }

  return String(val);
}

/**
 * Check deep equality between two arbitrary values
 */
export function isDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isDeepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Analyze an array difference for primitive elements
 */
function analyzeArrayDiff(oldArr: any[], newArr: any[]): ArrayDiffSummary {
  const isOldPrimitive = oldArr.every(x => typeof x !== 'object' || x === null);
  const isNewPrimitive = newArr.every(x => typeof x !== 'object' || x === null);
  const isPrimitiveArray = isOldPrimitive && isNewPrimitive;

  if (!isPrimitiveArray) {
    return {
      added: newArr,
      removed: oldArr,
      unchanged: [],
      isPrimitiveArray: false
    };
  }

  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);

  const added = newArr.filter(x => !oldSet.has(x));
  const removed = oldArr.filter(x => !newSet.has(x));
  const unchanged = newArr.filter(x => oldSet.has(x));

  return {
    added,
    removed,
    unchanged,
    isPrimitiveArray: true
  };
}

/**
 * Recursively computes the diff between oldState and newState
 */
export function computeDiff(oldState: any, newState: any, parentPath: string = ''): DiffNode[] {
  // Case 1: Both states are null / undefined / empty
  if ((oldState === null || oldState === undefined) && (newState === null || newState === undefined)) {
    return [];
  }

  // Case 2: Primitive comparison (neither is an object or array)
  const isOldObject = typeof oldState === 'object' && oldState !== null;
  const isNewObject = typeof newState === 'object' && newState !== null;

  if (!isOldObject && !isNewObject) {
    const isEq = oldState === newState;
    const key = parentPath || 'value';
    const label = getFieldLabel(key);
    return [
      {
        key,
        path: key,
        labelAr: label.ar,
        labelEn: label.en,
        type: isEq ? 'unchanged' : 'modified',
        oldValue: oldState,
        newValue: newState,
        isNested: false,
        isArray: false
      }
    ];
  }

  // Normalize states into objects if one was null or undefined
  const safeOld = isOldObject ? oldState : {};
  const safeNew = isNewObject ? newState : {};

  // Case 3: If one was entirely null/undefined
  const isOldCompletelyMissing = oldState === null || oldState === undefined;
  const isNewCompletelyMissing = newState === null || newState === undefined;

  // Collect all unique keys from both objects
  const allKeys = Array.from(new Set([...Object.keys(safeOld), ...Object.keys(safeNew)]));

  const diffNodes: DiffNode[] = [];

  for (const key of allKeys) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const label = getFieldLabel(key);

    const hasInOld = Object.prototype.hasOwnProperty.call(safeOld, key) && !isOldCompletelyMissing;
    const hasInNew = Object.prototype.hasOwnProperty.call(safeNew, key) && !isNewCompletelyMissing;

    const valOld = hasInOld ? safeOld[key] : undefined;
    const valNew = hasInNew ? safeNew[key] : undefined;

    // Added key
    if (!hasInOld && hasInNew) {
      const isNestedObj = typeof valNew === 'object' && valNew !== null && !Array.isArray(valNew);
      const isArr = Array.isArray(valNew);

      let children: DiffNode[] | undefined = undefined;
      if (isNestedObj) {
        children = computeDiff(undefined, valNew, currentPath);
      }

      diffNodes.push({
        key,
        path: currentPath,
        labelAr: label.ar,
        labelEn: label.en,
        type: 'added',
        oldValue: undefined,
        newValue: valNew,
        isNested: isNestedObj,
        isArray: isArr,
        arrayDiff: isArr ? analyzeArrayDiff([], valNew) : undefined,
        children
      });
      continue;
    }

    // Removed key
    if (hasInOld && !hasInNew) {
      const isNestedObj = typeof valOld === 'object' && valOld !== null && !Array.isArray(valOld);
      const isArr = Array.isArray(valOld);

      let children: DiffNode[] | undefined = undefined;
      if (isNestedObj) {
        children = computeDiff(valOld, undefined, currentPath);
      }

      diffNodes.push({
        key,
        path: currentPath,
        labelAr: label.ar,
        labelEn: label.en,
        type: 'removed',
        oldValue: valOld,
        newValue: undefined,
        isNested: isNestedObj,
        isArray: isArr,
        arrayDiff: isArr ? analyzeArrayDiff(valOld, []) : undefined,
        children
      });
      continue;
    }

    // Key exists in both: compare values
    const isBothArray = Array.isArray(valOld) && Array.isArray(valNew);
    const isBothPlainObject =
      typeof valOld === 'object' &&
      valOld !== null &&
      !Array.isArray(valOld) &&
      typeof valNew === 'object' &&
      valNew !== null &&
      !Array.isArray(valNew);

    if (isBothPlainObject) {
      const children = computeDiff(valOld, valNew, currentPath);
      const hasAnyChange = children.some(c => c.type !== 'unchanged');

      diffNodes.push({
        key,
        path: currentPath,
        labelAr: label.ar,
        labelEn: label.en,
        type: hasAnyChange ? 'modified' : 'unchanged',
        oldValue: valOld,
        newValue: valNew,
        isNested: true,
        isArray: false,
        children
      });
      continue;
    }

    if (isBothArray) {
      const isEq = isDeepEqual(valOld, valNew);
      const arrayDiff = analyzeArrayDiff(valOld, valNew);

      diffNodes.push({
        key,
        path: currentPath,
        labelAr: label.ar,
        labelEn: label.en,
        type: isEq ? 'unchanged' : 'modified',
        oldValue: valOld,
        newValue: valNew,
        isNested: false,
        isArray: true,
        arrayDiff
      });
      continue;
    }

    // Primitives or mixed types
    const isEq = isDeepEqual(valOld, valNew);
    diffNodes.push({
      key,
      path: currentPath,
      labelAr: label.ar,
      labelEn: label.en,
      type: isEq ? 'unchanged' : 'modified',
      oldValue: valOld,
      newValue: valNew,
      isNested: false,
      isArray: false
    });
  }

  return diffNodes;
}

/**
 * Computes statistical counts of added, removed, modified, and unchanged nodes.
 */
export function getDiffStats(nodes: DiffNode[]): DiffSummaryStats {
  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;

  for (const node of nodes) {
    if (node.type === 'added') added++;
    else if (node.type === 'removed') removed++;
    else if (node.type === 'modified') modified++;
    else if (node.type === 'unchanged') unchanged++;
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    total: nodes.length
  };
}
