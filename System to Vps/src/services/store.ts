import {
  Department,
  DepartmentId,
  JobPosition,
  Employee,
  Student,
  StudentFile,
  StudentFileStatus,
  StudentChoice,
  PaymentRecord,
  Task,
  Complaint,
  DepartmentalHandoff,
  AuditLog,
  StudentDocument,
  AppNotification,
  University,
  UniversityFaculty,
  UniversityCampus,
  AcademicDepartment,
  AcademicSpecialization,
  UniversityType,
  ExpenseRecord,
  DepartmentBudget,
  ExchangeRate,
  HRBackupAssignment,
  PerformanceEvaluation,
  Campaign,
  CampaignStatus,
  CampaignReviewLog,
  CapacitySettings,
  CapacityAdjustment,
  CapacityBreakdown,
  StudentFileActivityRecord,
  StudentFileActionType,
  FinancialAccount,
  StandardPaymentMethod,
  IncentivePolicy,
  EmployeeIncentiveRecord,
  AccountMovement,
  InternalTransfer,
  ACTIVE_LIFECYCLE_STAGES,
  STAGE_SLA_CONFIG,
  LifecycleIntegrityReport,
  SLAConfigurationItem,
  SLAUnit,
  SLACategory,
  SLACalculationScope,
  computeDurationMs,
  formatSLALabel,
  calculateSLADeadline,
  SystemUserAccount,
  AccountSyncStatus,
  AccountSyncDiagnostic,
  AuthDiagnosticCode,
  AuthDiagnosticResult
} from '../types/database.types';

import { filterStudents, StudentFilterOptions } from './studentSearchService';
import { SystemAuditEventCode } from './actionEventService';
import { SYSTEM_REPORTS, SystemReportDefinition } from '../types/reports.types';
import { ReportDataService } from './reportDataService';
import { ALL_DASHBOARD_ELEMENTS, GENERAL_DASHBOARD_ELEMENTS, EXECUTIVE_DASHBOARD_ELEMENTS, DashboardElementDefinition } from '../types/dashboardVisibility.types';

import {
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_EMPLOYEES,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_FILES,
  INITIAL_FILE_ACTIVITIES,
  INITIAL_PAYMENTS,
  INITIAL_TASKS,
  INITIAL_COMPLAINTS,
  INITIAL_HANDOFFS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SLA_CONFIG,
  INITIAL_SYSTEM_USERS
} from './seedData';
import { 
  DEFAULT_INITIAL_PASSWORD, 
  DEFAULT_INITIAL_PASSWORD_HASH, 
  DEMO_PASSWORD_HASH, 
  hashPasswordSync, 
  verifyPasswordSync, 
  validatePasswordStrength 
} from '../utils/cryptoUtils';

import { rbacService, DEFAULT_ROLE_PERMISSIONS } from './rbacService';
import { 
  INITIAL_UNIVERSITIES, 
  INITIAL_FACULTIES,
  INITIAL_CAMPUSES,
  normalizeAcademicSearch,
  searchUniversities,
  getFacultiesByUniversity,
  getSpecializationsByFaculty,
  getCampusesByUniversity,
  searchFaculties,
  searchSpecializations
} from './universityCatalog';
import { CapacityCalculationService, DEFAULT_CAPACITY_SETTINGS } from './capacityService';
import {
  BackupRecord,
  BackupScheduleConfig,
  BackupRetentionPolicy,
  GoogleDriveConfig,
  BackupType,
  BackupDestination,
  BackupRestorePayload,
  BackupVerificationResult,
  BackupArchiveHeader
} from '../types/backup.types';
import {
  computeSHA256,
  formatBytes,
  packBCTBakArchive,
  unpackBCTBakArchive,
  verifyBackupArchiveContent,
  encryptBackupPayload,
  decryptBackupPayload
} from '../utils/backupCrypto';

export const DEFAULT_BACKUP_SCHEDULE: BackupScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  execution_time: '03:00',
  day_of_week: 5,
  day_of_month: 1,
  timezone: 'Africa/Cairo',
  destination: 'multi',
  local_backup_path: './backups',
  windows_backup_path: 'C:\\Users\\AHMED\\Downloads\\BCT Backups',
  destinations: {
    local_computer: {
      enabled: true,
      path: 'C:\\Users\\AHMED\\Downloads\\BCT Backups',
      agent_status: 'disconnected'
    },
    server_storage: {
      enabled: true,
      path: './backups'
    },
    google_drive: {
      enabled: false,
      folder_id: 'gdrive_folder_bct_root',
      folder_name: 'BCT_Enterprise_Backups'
    }
  },
  auto_retry_on_failure: true,
  max_retries: 3
};

export const DEFAULT_BACKUP_RETENTION: BackupRetentionPolicy = {
  daily_backups_to_keep: 7,
  weekly_backups_to_keep: 4,
  monthly_backups_to_keep: 12,
  max_storage_allocation_mb: 2048,
  auto_purge_enabled: true
};

export const DEFAULT_GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  connected: false,
  folder_name: 'BCT_Enterprise_Backups',
  auto_upload: false,
  status: 'disconnected'
};

// Local storage keys
import authoritativeMasterData from './authoritativeMasterData.json';

const STORAGE_KEYS = {
  EMPLOYEES: 'bct_store_employees',
  DEPARTMENTS: 'bct_store_departments',
  POSITIONS: 'bct_store_positions',
  STUDENTS: 'bct_store_students',
  FILES: 'bct_store_files',
  DOCUMENTS: 'bct_store_documents',
  PAYMENTS: 'bct_store_payments',
  TASKS: 'bct_store_tasks',
  COMPLAINTS: 'bct_store_complaints',
  HANDOFFS: 'bct_store_handoffs',
  AUDIT_LOGS: 'bct_store_audit_logs',
  CAMPAIGNS: 'bct_store_campaigns',
  MEETINGS: 'bct_store_meetings',
  NOTIFICATIONS: 'bct_store_notifications',
  UNIVERSITIES: 'bct_store_universities',
  FACULTIES: 'bct_store_faculties',
  CAMPUSES: 'bct_store_campuses',
  EXPENSES: 'bct_store_expenses',
  BUDGETS: 'bct_store_budgets',
  EXCHANGE_RATE: 'bct_store_exchange_rate',
  BACKUPS: 'bct_store_backups',
  EVALUATIONS: 'bct_store_evaluations',
  CAPACITY_SETTINGS: 'bct_store_capacity_settings',
  FILE_ACTIVITIES: 'bct_store_file_activities',
  FINANCIAL_ACCOUNTS: 'bct_store_financial_accounts',
  INCENTIVE_POLICIES: 'bct_store_incentive_policies',
  EMPLOYEE_INCENTIVES: 'bct_store_employee_incentives',
  ACCOUNT_MOVEMENTS: 'bct_store_account_movements',
  INTERNAL_TRANSFERS: 'bct_store_internal_transfers',
  SLA_CONFIG: 'bct_store_sla_configs',
  USERS: 'bct_store_system_users',
  BACKUP_RECORDS: 'bct_store_system_backup_records',
  BACKUP_SCHEDULE: 'bct_store_system_backup_schedule',
  BACKUP_RETENTION: 'bct_store_system_backup_retention',
  GOOGLE_DRIVE_CONFIG: 'bct_store_google_drive_config'
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    const masterVal = (authoritativeMasterData as Record<string, any>)[key];

    if (!raw) {
      if (masterVal !== undefined) {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(key, JSON.stringify(masterVal));
          } catch (_) {}
        }
        return masterVal as T;
      }
      return fallback;
    }

    const parsed = JSON.parse(raw);

    // Cleanse known rogue mock records (e.g. test payment pay-8588 that had 35,000 USD entered by mistake on localhost)
    if (key === STORAGE_KEYS.PAYMENTS && Array.isArray(parsed)) {
      const hasRogue = parsed.some((p: any) => p && p.id === 'pay-8588');
      if (hasRogue) {
        const cleaned = parsed.filter((p: any) => p && p.id !== 'pay-8588');
        if (typeof localStorage !== 'undefined') {
          try { localStorage.setItem(key, JSON.stringify(cleaned)); } catch (_) {}
        }
        return cleaned as T;
      }
    }

    // Cleanse task completed status parity
    if (key === STORAGE_KEYS.TASKS && Array.isArray(parsed)) {
      const tsk001 = parsed.find((t: any) => t && t.id === 'tsk-001');
      if (tsk001 && tsk001.status === 'assigned') {
        tsk001.status = 'completed';
        if (typeof localStorage !== 'undefined') {
          try { localStorage.setItem(key, JSON.stringify(parsed)); } catch (_) {}
        }
      }
    }

    // Cleanse student file archive status parity
    if (key === STORAGE_KEYS.FILES && Array.isArray(parsed)) {
      const f2441 = parsed.find((f: any) => f && f.id === 'file-2441');
      if (f2441 && !f2441.is_archived) {
        f2441.is_archived = true;
        if (typeof localStorage !== 'undefined') {
          try { localStorage.setItem(key, JSON.stringify(parsed)); } catch (_) {}
        }
      }
    }

    // Automatic reconciliation with authoritative data:
    // If master has records and current storage has fewer, merge authoritative records without losing anything
    if (masterVal && Array.isArray(masterVal) && Array.isArray(parsed)) {
      if (parsed.length < masterVal.length) {
        const existingIds = new Set(parsed.map((item: any) => item?.id || item?.student_code || item?.employee_code || item?.code));
        let merged = false;
        for (const item of masterVal) {
          const identifier = item?.id || item?.student_code || item?.employee_code || item?.code;
          if (identifier && !existingIds.has(identifier)) {
            parsed.push(item);
            merged = true;
          }
        }
        if (merged && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(key, JSON.stringify(parsed));
          } catch (_) {}
        }
      }
      return parsed as T;
    }

    return parsed;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

let isStoreInitialized = false;
const pendingServerWrites: Record<string, any> = {};
let serverWriteTimer: any = null;

export function flushServerWritesNow(): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return Promise.resolve();
  if (serverWriteTimer) {
    clearTimeout(serverWriteTimer);
    serverWriteTimer = null;
  }
  const tablesToSave = { ...pendingServerWrites };
  const keys = Object.keys(tablesToSave);
  if (keys.length === 0) return Promise.resolve();

  for (const k of keys) {
    delete pendingServerWrites[k];
  }

  return fetch('/api/database/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tables: tablesToSave })
  }).then(async res => {
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.revision === 'number') {
        bctStore.updateServerRevision(data.revision);
      }
    }
  }).catch(err => {
    console.warn('[BCT Store] Sync to server database failed:', err.message);
  });
}

function flushServerWrites() {
  flushServerWritesNow();
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
    if (isStoreInitialized) {
      pendingServerWrites[key] = data;
      if (serverWriteTimer) clearTimeout(serverWriteTimer);
      serverWriteTimer = setTimeout(flushServerWrites, 25);
    }
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Initial Notifications Seed (Strictly User-Targeted)
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    recipient_id: 'emp-006', // Application Officer: ياسر خالد مصطفى
    recipient_user_id: 'emp-006',
    title_ar: 'مهمة جديدة مسندة إليك',
    title_en: 'New Task Assigned to You',
    description_ar: 'مراجعة أوراق التقديم لجامعة القاهرة - الطالب محمد الصادق',
    description_en: 'Review Cairo University application papers for student Mohamed Al-Sadeq',
    category: 'task',
    module: 'tasks',
    priority: 'high',
    read: false,
    related_link: '/tasks',
    sender_name: 'أحمد إبراهيم خليل',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'notif-02',
    recipient_id: 'emp-008', // Accountant: كريم حسن الدسوقي
    recipient_user_id: 'emp-008',
    title_ar: 'سداد مؤكد وبانتظار بدء المراجعة',
    title_en: 'Payment Confirmed - Awaiting Review',
    description_ar: 'تم تأكيد استلام سداد الطالبة رنا طارق (25,000 ج.م) عبر إنستاباي',
    description_en: 'Payment of 25,000 EGP confirmed via InstaPay for Rana Tariq',
    category: 'payment',
    module: 'finance',
    priority: 'medium',
    read: false,
    related_link: '/finance',
    sender_name: 'بوابة الدفع الإلكتروني',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'notif-03',
    recipient_id: 'emp-002', // Operations Manager: أحمد إبراهيم خليل
    recipient_user_id: 'emp-002',
    title_ar: 'طلب اعتماد بوابة الطاقة الاستيعابية',
    title_en: 'Capacity Gate Approval Requested',
    description_ar: 'حملة كليات الطب والصيدلة (MKT-GULF-MED26) بانتظار إقرار مدير العمليات',
    description_en: 'Gulf Medicine Campaign awaiting Operations capacity gate approval',
    category: 'approval',
    module: 'capacity',
    priority: 'urgent',
    read: false,
    related_link: '/capacity-gate',
    sender_name: 'طارق صلاح الدين',
    created_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString()
  },
  {
    id: 'notif-04',
    recipient_id: 'emp-005', // QA Manager: محمود سامي عبد الحميد
    recipient_user_id: 'emp-005',
    title_ar: 'تذكرة شكوى قيد التحقيق',
    title_en: 'Complaint Under Investigation',
    description_ar: 'شكوى تأخر إفادة القبول المبدئي للطالب يوسف عبد الله عثمان',
    description_en: 'Delay complaint for Youssef Abdallah preliminary admission',
    category: 'complaint',
    module: 'quality',
    priority: 'medium',
    read: true,
    related_link: '/complaints',
    sender_name: 'نظام الجودة والشكاوى',
    created_at: new Date(Date.now() - 1000 * 3600 * 24).toISOString()
  },
  {
    id: 'notif-05',
    recipient_id: 'emp-001', // General Manager: خليل محمد عثمان
    recipient_user_id: 'emp-001',
    title_ar: 'طلب اعتماد صرف مالي استثنائي',
    title_en: 'Exceptional Financial Disbursement Approval Request',
    description_ar: 'طلب اعتماد صرف حملة خريف 2026 (EXP-2026-002) بمبلغ 1,500 دولار بانتظار توقيع المدير العام',
    description_en: 'Disbursement approval for Fall 2026 Campaign (EXP-2026-002) of $1,500 awaiting General Manager sign-off',
    category: 'approval',
    module: 'finance',
    priority: 'high',
    read: false,
    related_link: '/finance',
    sender_name: 'فاطمة الزهراء علي',
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
  },
  {
    id: 'notif-06',
    recipient_id: 'emp-007', // Educational Consultant: سارة عبد الرحمن
    recipient_user_id: 'emp-007',
    title_ar: 'ملف طالب جديد بحاجة للاستشارة الأكاديمية',
    title_en: 'New Student File Assigned for Academic Consultation',
    description_ar: 'تم تحويل الطالب عبد الله محمد منصور (BCT-2026-015) لاستكمال الاستشارة الأكاديمية',
    description_en: 'Student Abdullah Mohamed Mansoor (BCT-2026-015) routed for academic consultation',
    category: 'file',
    module: 'crm',
    priority: 'medium',
    read: false,
    related_link: '/crm',
    sender_name: 'عمر طارق النور',
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: 'notif-07',
    recipient_id: 'emp-004', // Finance Manager: فاطمة الزهراء علي
    recipient_user_id: 'emp-004',
    title_ar: 'طلب اعتماد سند صرف جديد بانتظار المراجعة',
    title_en: 'New Expense Voucher Awaiting Review',
    description_ar: 'سند صرف رسوم توثيقات خارجية وسفارات (EXP-2026-001) بمبلغ 12,500 ج.م بانتظار الاعتماد',
    description_en: 'Expense voucher for embassy attestation fees (EXP-2026-001) of 12,500 EGP awaiting review',
    category: 'approval',
    module: 'finance',
    priority: 'high',
    read: false,
    related_link: '/finance',
    sender_name: 'كريم حسن الدسوقي',
    created_at: new Date(Date.now() - 1000 * 3600 * 5).toISOString()
  }
];

function normalizeNotifications(rawList: any[]): AppNotification[] {
  if (!Array.isArray(rawList)) return [...INITIAL_NOTIFICATIONS];
  
  const seedMap = new Map(INITIAL_NOTIFICATIONS.map(n => [n.id, n]));
  const normalized = rawList.map(item => {
    const seed = seedMap.get(item.id);
    const recipient_id = item.recipient_id || item.recipient_user_id || seed?.recipient_id || '';
    const module = item.module || seed?.module || (
      item.category === 'task' ? 'tasks' :
      item.category === 'approval' ? 'approvals' :
      item.category === 'payment' ? 'finance' :
      item.category === 'complaint' ? 'quality' :
      item.category === 'file' || item.category === 'file_update' ? 'crm' : 'system'
    );
    const priority = item.priority || seed?.priority || 'medium';
    return {
      ...item,
      recipient_id,
      recipient_user_id: recipient_id,
      module,
      priority
    };
  });

  for (const seed of INITIAL_NOTIFICATIONS) {
    if (!normalized.some(n => n.id === seed.id)) {
      normalized.push(seed);
    }
  }

  return normalized;
}

// Initial Expenses Seed
const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-01',
    voucher_code: 'EXP-2026-001',
    title_ar: 'رسوم توثيقات خارجية وسفارات للمندوب',
    title_en: 'Embassy & Foreign Affairs Attestation Fees',
    category: 'government_fees',
    department_id: 'ops',
    amount: 12500,
    currency: 'EGP',
    payment_method: 'cash',
    responsible_employee_id: 'emp-007',
    status: 'approved',
    approved_by: 'emp-004',
    approved_at: '2026-11-05T10:00:00Z',
    notes: 'توثيق 5 شهادات ثانوية بالسفارة السودانية والقنصلية',
    created_at: '2026-11-04T14:30:00Z'
  },
  {
    id: 'exp-02',
    voucher_code: 'EXP-2026-002',
    title_ar: 'إعلانات حملة خريف 2026 (Meta Ads)',
    title_en: 'Fall 2026 Meta Ads Spend',
    category: 'marketing',
    department_id: 'mkt',
    amount: 1500,
    currency: 'USD',
    payment_method: 'card',
    responsible_employee_id: 'emp-005',
    status: 'approved',
    approved_by: 'emp-001',
    approved_at: '2026-11-02T11:00:00Z',
    notes: 'تمويل إعلانات فيسبوك وإنستغرام للطلاب الوافدين',
    created_at: '2026-11-01T09:00:00Z'
  },
  {
    id: 'exp-03',
    voucher_code: 'EXP-2026-003',
    title_ar: 'مصاريف تشغيل وانتقالات المعقب الميداني',
    title_en: 'Liaison Field Transport & Dispatch',
    category: 'operational',
    department_id: 'ops',
    amount: 4200,
    currency: 'EGP',
    payment_method: 'cash',
    responsible_employee_id: 'emp-007',
    status: 'pending_approval',
    notes: 'تنقلات أسبوعية بين مكاتب التوثيق وإدارة الوافدين',
    created_at: '2026-11-08T16:00:00Z'
  },
  {
    id: 'exp-04',
    voucher_code: 'EXP-2026-004',
    title_ar: 'إيجار مقر الشركة الرئيسي - شهر أكتوبر',
    title_en: 'Headquarters Office Rent - October',
    category: 'operational',
    department_id: 'ops',
    amount: 35000,
    currency: 'EGP',
    payment_method: 'bank_transfer',
    financial_account_id: 'acc-bank-01',
    financial_account_name: 'البنك الأهلي المصري (حساب العمليات والتحصيل)',
    bank_name: 'البنك الأهلي المصري',
    vendor_name: 'شركة القاهرة للاستثمار والتطوير العقاري',
    responsible_employee_id: 'emp-004',
    status: 'paid',
    approved_by: 'emp-001',
    approved_at: '2026-10-25T10:00:00Z',
    paid_by: 'emp-004',
    paid_at: '2026-10-26T12:00:00Z',
    disbursed_by: 'emp-004',
    disbursed_at: '2026-10-26T12:00:00Z',
    voucher_issue_date: '2026-10-26T12:00:00Z',
    notes: 'سداد إيجار مقر الشركة الشهري عبر تحويل بنكي رسمي',
    created_at: '2026-10-24T09:00:00Z'
  },
  {
    id: 'exp-05',
    voucher_code: 'EXP-2026-005',
    title_ar: 'حافز إنجاز ملف الطالب محمد الصادق البشير',
    title_en: 'File Completion Incentive - Muhammad El-Sadiq',
    category: 'employee_incentives',
    department_id: 'ops',
    amount: 1000,
    currency: 'EGP',
    payment_method: 'instapay',
    financial_account_id: 'acc-ipn-01',
    financial_account_name: 'حساب التحصيل اللحظي BCT-IPN (إنستاباي)',
    responsible_employee_id: 'emp-006',
    beneficiary_employee_id: 'emp-006',
    beneficiary_employee_name: 'سلمى محمد عبد الله',
    transaction_number: 'BCT-FILE-2026-001',
    student_file_id: 'file-201',
    student_name: 'محمد الصادق البشير',
    incentive_type: 'file_completion',
    incentive_policy_id: 'pol-01',
    incentive_calculation_reference: 'POL-COMPL-01 v1.0',
    eligibility_status: 'eligible',
    status: 'approved',
    approved_by: 'emp-002',
    approved_at: '2026-11-02T14:00:00Z',
    notes: 'حافز إنجاز ملف الطالب واستيفاء كامل شروط القبول وبلوغ مرحلة مغلق + تقييم',
    created_at: '2026-11-01T11:00:00Z'
  },
  {
    id: 'exp-06',
    voucher_code: 'EXP-2026-006',
    title_ar: 'حافز استقطاب ومتابعة ملف طالب قيد المعالجة',
    title_en: 'Incentive Claim - File In Progress',
    category: 'employee_incentives',
    department_id: 'cs',
    amount: 1000,
    currency: 'EGP',
    payment_method: 'cash',
    financial_account_id: 'acc-cash-01',
    financial_account_name: 'خزينة المقر الرئيسي (القاهرة)',
    responsible_employee_id: 'emp-007',
    beneficiary_employee_id: 'emp-007',
    beneficiary_employee_name: 'رنا يوسف المهدي',
    transaction_number: 'BCT-FILE-2026-001',
    student_file_id: 'file-201',
    student_name: 'محمد الصادق البشير',
    incentive_type: 'file_completion',
    incentive_policy_id: 'pol-01',
    incentive_calculation_reference: 'POL-COMPL-01 v1.0',
    eligibility_status: 'pending_completion',
    ineligibility_reason: 'المعاملة في مرحلة (على المنصة) ولم تصل بعد إلى مغلق + تقييم',
    status: 'pending_approval',
    notes: 'مطالبة حافز تحت المراجعة - مشروطة ببلوغ المرحلة 10',
    created_at: '2026-11-05T12:00:00Z'
  }
];

// Initial Financial Accounts Seed
export const INITIAL_FINANCIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-bank-01',
    account_code: 'BANK-NBE-01',
    account_name_ar: 'البنك الأهلي المصري (حساب العمليات والتحصيل)',
    account_name_en: 'National Bank of Egypt (Ops & Collections)',
    channel: 'bank_transfer',
    institution_name_ar: 'البنك الأهلي المصري',
    institution_name_en: 'National Bank of Egypt',
    account_number: '1092-8847-2291-01',
    currency: 'multi',
    is_active: true
  },
  {
    id: 'acc-cash-01',
    account_code: 'VAULT-CAIRO-01',
    account_name_ar: 'خزينة المقر الرئيسي (القاهرة)',
    account_name_en: 'Headquarters Vault (Cairo)',
    channel: 'cash',
    institution_name_ar: 'خزينة بي سي تي للاستشارات التعليمية والتدريب',
    institution_name_en: 'BCT Educational Consulting & Training Vault',
    account_number: 'VLT-CAIRO-MAIN',
    currency: 'multi',
    is_active: true
  },
  {
    id: 'acc-ipn-01',
    account_code: 'IPN-BCT-01',
    account_name_ar: 'حساب التحصيل اللحظي BCT-IPN (إنستاباي)',
    account_name_en: 'BCT Instant Collection Account (InstaPay)',
    channel: 'instapay',
    institution_name_ar: 'شبكة المدفوعات اللحظية IPN',
    institution_name_en: 'Instant Payment Network',
    account_number: 'bct.payments@ipn',
    currency: 'EGP',
    is_active: true
  },
  {
    id: 'acc-vfcash-01',
    account_code: 'WALLET-VF-01',
    account_name_ar: 'محفظة فودافون كاش الرسمية للشركة',
    account_name_en: 'Corporate Vodafone Cash Wallet',
    channel: 'vodafone_cash',
    institution_name_ar: 'فودافون كاش مصر',
    institution_name_en: 'Vodafone Cash Egypt',
    account_number: '010-9876-5432',
    currency: 'EGP',
    is_active: true
  }
];

// Initial Incentive Policies Seed
export const INITIAL_INCENTIVE_POLICIES: IncentivePolicy[] = [
  {
    id: 'pol-01',
    code: 'POL-COMPL-01',
    title_ar: 'حافز إنجاز ملف الطالب (مغلق + تقييم)',
    title_en: 'Student File Completion Incentive (Closed & Evaluated)',
    incentive_type: 'file_completion',
    calc_mode: 'fixed',
    amount_or_percentage: 1000,
    currency: 'EGP',
    eligible_roles: ['apply_off', 'ops_mgr', 'adm_off', 'liaison'],
    eligible_services: ['university_admission', 'cert_extraction', 'attestation', 're_nomination'],
    required_stage: 'closed',
    is_active: true,
    version: 'v1.0',
    effective_from: '2026-01-01',
    description_ar: 'يصرف عند اكتمال كافة مراحل الملف ووصوله للمرحلة 10 مغلق + تقييم بنجاح.',
    description_en: 'Payable upon file reaching Stage 10 Closed & Evaluated.'
  },
  {
    id: 'pol-02',
    code: 'POL-EXC-02',
    title_ar: 'مكافأة جودة الخدمة ورضا العميل',
    title_en: 'Customer Satisfaction & Excellence Bonus',
    incentive_type: 'excellence',
    calc_mode: 'fixed',
    amount_or_percentage: 500,
    currency: 'EGP',
    eligible_roles: ['apply_off', 'con_lead', 'adm_off'],
    eligible_services: ['university_admission', 'cert_extraction'],
    required_stage: 'closed',
    required_min_score: 90,
    is_active: true,
    version: 'v1.0',
    effective_from: '2026-01-01',
    description_ar: 'تصرف عند تحقيق تقييم رضا عميل لا يقل عن 90% بعد إغلاق الملف.',
    description_en: 'Payable for client satisfaction score >= 90% upon file closing.'
  },
  {
    id: 'pol-03',
    code: 'POL-ACQ-03',
    title_ar: 'عمولة استقطاب طالب مسجل ومسدد',
    title_en: 'Student Acquisition Commission',
    incentive_type: 'acquisition',
    calc_mode: 'fixed',
    amount_or_percentage: 1500,
    currency: 'EGP',
    eligible_roles: ['con_lead', 'agent'],
    eligible_services: ['university_admission'],
    required_stage: 'closed',
    is_active: true,
    version: 'v1.0',
    effective_from: '2026-01-01',
    description_ar: 'تصرف للمستشار المسؤول بعد إتمام إجراءات القبول وسداد الرسوم وإغلاق الملف.',
    description_en: 'Payable to consultant upon complete admission and file closing.'
  }
];

// Initial Employee Incentives Seed
export const INITIAL_EMPLOYEE_INCENTIVES: EmployeeIncentiveRecord[] = [
  {
    id: 'inc-01',
    incentive_code: 'INC-2026-001',
    employee_id: 'emp-006',
    employee_name: 'سلمى محمد عبد الله',
    employee_name_ar: 'سلمى محمد عبد الله',
    department_id: 'ops',
    student_file_id: 'file-201',
    transaction_number: 'BCT-FILE-2026-001',
    student_name: 'محمد الصادق البشير',
    service_type: 'university_admission',
    policy_id: 'pol-01',
    policy_version: 'v1.0',
    policy_name: 'حافز إنجاز ملف الطالب (مغلق + تقييم)',
    incentive_type: 'file_completion',
    amount: 1000,
    currency: 'EGP',
    calculation_note: 'مبلغ مقطوع لإنجاز ملف الطالب واستيفاء القبول والتقييم',
    eligibility_status: 'eligible',
    approval_status: 'approved',
    approved_by: 'emp-002',
    approved_at: '2026-11-02T14:00:00Z',
    payment_status: 'unpaid',
    created_at: '2026-11-01T11:00:00Z',
    updated_at: '2026-11-02T14:00:00Z'
  },
  {
    id: 'inc-02',
    incentive_code: 'INC-2026-002',
    employee_id: 'emp-007',
    employee_name: 'رنا يوسف المهدي',
    employee_name_ar: 'رنا يوسف المهدي',
    department_id: 'cs',
    student_file_id: 'file-201',
    transaction_number: 'BCT-FILE-2026-001',
    student_name: 'محمد الصادق البشير',
    service_type: 'university_admission',
    policy_id: 'pol-01',
    policy_version: 'v1.0',
    policy_name: 'حافز إنجاز ملف الطالب (مغلق + تقييم)',
    incentive_type: 'file_completion',
    amount: 1000,
    currency: 'EGP',
    calculation_note: 'حافز مشروط بوصول المعاملة للمرحلة 10 مغلق + تقييم',
    eligibility_status: 'pending_completion',
    eligibility_note: 'المعاملة في مرحلة (على المنصة) ولم تصل بعد إلى مغلق + تقييم',
    approval_status: 'pending_approval',
    payment_status: 'unpaid',
    created_at: '2026-11-05T12:00:00Z',
    updated_at: '2026-11-05T12:00:00Z'
  }
];

// Initial Budgets Seed
const INITIAL_BUDGETS: DepartmentBudget[] = [
  {
    id: 'bdg-ops-q4',
    budget_code: 'BDG-2026-Q4-OPS',
    department_id: 'ops',
    department_name_ar: 'إدارة العمليات والخدمات',
    period_type: 'quarterly',
    fiscal_period: 'Q4 2026',
    allocated_amount: 180000,
    currency: 'EGP',
    status: 'approved',
    approved_by: 'emp-001',
    notes: 'ميزانية تشغيل التقديمات والتوثيق والمناديب للربع الرابع',
    created_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'bdg-mkt-q4',
    budget_code: 'BDG-2026-Q4-MKT',
    department_id: 'mkt',
    department_name_ar: 'إدارة التسويق',
    period_type: 'quarterly',
    fiscal_period: 'Q4 2026',
    allocated_amount: 5000,
    currency: 'USD',
    status: 'approved',
    approved_by: 'emp-001',
    notes: 'ميزانية الحملات الإعلانية الخارجية بالدولار',
    created_at: '2026-10-01T08:00:00Z'
  },
  {
    id: 'bdg-cs-q4',
    budget_code: 'BDG-2026-Q4-CS',
    department_id: 'cs',
    department_name_ar: 'إدارة المستشارين وخدمة العملاء',
    period_type: 'quarterly',
    fiscal_period: 'Q4 2026',
    allocated_amount: 60000,
    currency: 'EGP',
    status: 'approved',
    approved_by: 'emp-001',
    notes: 'خدمات الاتصال، خطوط واتساب الأعمال وخدمة العملاء',
    created_at: '2026-10-01T08:00:00Z'
  }
];

// Initial Exchange Rate Seed
const INITIAL_EXCHANGE_RATE: ExchangeRate = {
  id: 'rate-usd-egp',
  base_currency: 'USD',
  target_currency: 'EGP',
  rate: 56.0,
  effective_date: '2026-11-01',
  source: 'البنك المركزي المصري / BCT Finance Policy',
  last_updated_at: new Date().toISOString()
};

// Initial HR Backups Seed
const INITIAL_BACKUPS: HRBackupAssignment[] = [
  {
    id: 'bk-01',
    role_id: 'ops_mgr',
    role_title_ar: 'مدير العمليات والخدمات',
    role_title_en: 'Operations Manager',
    primary_employee_id: 'emp-002',
    primary_employee_name_ar: 'أحمد إبراهيم خليل',
    backup_employee_id: 'emp-006',
    backup_employee_name_ar: 'ياسر خالد مصطفى',
    backup_employee_role_ar: 'أخصائي التقديمات الجامعية',
    readiness_percentage: 95,
    notes: 'مفوض بتسيير أعمال المراجعة والاعتماد عند غياب المدير'
  },
  {
    id: 'bk-02',
    role_id: 'accountant',
    role_title_ar: 'المحاسب وأمين التحصيل',
    role_title_en: 'Accountant & Collection Officer',
    primary_employee_id: 'emp-008',
    primary_employee_name_ar: 'كريم حسن الدسوقي',
    backup_employee_id: 'emp-004',
    backup_employee_name_ar: 'فاطمة الزهراء علي',
    backup_employee_role_ar: 'المدير المالي والإداري',
    readiness_percentage: 90,
    notes: 'صلاحيات كاملة لتأكيد الإيصالات والتحصيلات في النظام'
  },
  {
    id: 'bk-03',
    role_id: 'liaison',
    role_title_ar: 'المعقب ومندوب المعاملات الخارجية',
    role_title_en: 'External Transactions Representative',
    primary_employee_id: 'emp-007',
    primary_employee_name_ar: 'هشام كمال المعقب',
    backup_employee_id: 'emp-006',
    backup_employee_name_ar: 'ياسر خالد مصطفى',
    backup_employee_role_ar: 'أخصائي التقديمات الجامعية',
    readiness_percentage: 85,
    notes: 'تدريب ميداني على مكاتب التوثيق بالسفارات والتعليم العالي'
  },
  {
    id: 'bk-04',
    role_id: 'cs_lead',
    role_title_ar: 'رئيس قسم المستشارين',
    role_title_en: 'Head of Consultants',
    primary_employee_id: 'emp-003',
    primary_employee_name_ar: 'عمر طارق النور',
    backup_employee_id: 'emp-009',
    backup_employee_name_ar: 'سارة عبد الرحمن',
    backup_employee_role_ar: 'مستشار تعليمي متميز',
    readiness_percentage: 90,
    notes: 'توزيع الاستفسارات ومتابعة زمن الرد للعملاء'
  }
];

// Initial Performance Evaluations Seed
const INITIAL_EVALUATIONS: PerformanceEvaluation[] = [
  {
    id: 'eval-01',
    evaluation_code: 'EV-2026-Q3-001',
    employee_id: 'emp-002',
    employee_name_ar: 'أحمد إبراهيم خليل',
    evaluator_id: 'emp-001',
    evaluator_name_ar: 'خليل محمد عثمان',
    evaluation_period: 'Q3 2026',
    sla_compliance_score: 96,
    task_completion_score: 95,
    quality_accuracy_score: 98,
    client_satisfaction_score: 92,
    overall_score: 95,
    strengths: 'كفاءة تشغيلية عالية وضبط مواعيد مراجعة المستندات بدقة',
    areas_for_improvement: 'زيادة التفويض للموظف البديل أثناء ضغط التقديمات',
    evaluator_comments: 'أداء متميز يمثل ركيزة العمليات بالشركة',
    status: 'approved',
    approved_by: 'emp-001',
    created_at: '2026-10-05T12:00:00Z'
  },
  {
    id: 'eval-02',
    evaluation_code: 'EV-2026-Q3-002',
    employee_id: 'emp-003',
    employee_name_ar: 'عمر طارق النور',
    evaluator_id: 'emp-001',
    evaluator_name_ar: 'خليل محمد عثمان',
    evaluation_period: 'Q3 2026',
    sla_compliance_score: 92,
    task_completion_score: 90,
    quality_accuracy_score: 94,
    client_satisfaction_score: 95,
    overall_score: 93,
    strengths: 'قدرة فائقة على تأهيل الطلاب وتحقيق نسب تسجيل مرتفعة',
    areas_for_improvement: 'تسجيل ملخص المكالمات بانتظام في سجل CRM',
    evaluator_comments: 'جهد مشكور ونتائج تحويل إيجابية',
    status: 'approved',
    approved_by: 'emp-001',
    created_at: '2026-10-06T14:00:00Z'
  }
];

function mergeUniversitiesWithDefaults(stored: University[]): University[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return [...INITIAL_UNIVERSITIES];
  const map = new Map<string, University>();
  INITIAL_UNIVERSITIES.forEach(u => map.set(u.id, u));
  stored.forEach(u => {
    const existing = map.get(u.id);
    map.set(u.id, existing ? { ...existing, ...u } : u);
  });
  return Array.from(map.values());
}

function mergeFacultiesWithDefaults(stored: UniversityFaculty[]): UniversityFaculty[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return [...INITIAL_FACULTIES];
  const map = new Map<string, UniversityFaculty>();
  INITIAL_FACULTIES.forEach(f => map.set(f.id, f));
  stored.forEach(f => {
    const existing = map.get(f.id);
    map.set(f.id, existing ? { ...existing, ...f } : f);
  });
  return Array.from(map.values());
}

function mergeCampusesWithDefaults(stored: UniversityCampus[]): UniversityCampus[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) return [...INITIAL_CAMPUSES];
  const map = new Map<string, UniversityCampus>();
  INITIAL_CAMPUSES.forEach(c => map.set(c.id, c));
  stored.forEach(c => {
    const existing = map.get(c.id);
    map.set(c.id, existing ? { ...existing, ...c } : c);
  });
  return Array.from(map.values());
}

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-01',
    campaign_code: 'MKT-SUDAN-FALL26',
    name: 'حملة القبول الجامعي – السودان خريف 2026',
    channel: 'meta',
    target_country: 'السودان',
    target_audience: 'خريجو الثانوية السودانية وأولياء الأمور بالخرطوم والولايات',
    budget_amount: 50000,
    currency: 'EGP',
    start_date: '2026-10-01',
    end_date: '2026-11-30',
    target_leads: 1200,
    expected_registrations: 554,
    owner_id: 'emp-008',
    owner_name: 'سارة ممدوح (مسؤولة التسويق الرقمي)',
    owner_role: 'digital_marketing',
    ops_capacity_approved: true,
    ops_capacity_approved_by: 'emp-002',
    ops_capacity_approved_at: '2026-10-01T10:00:00.000Z',
    status: 'approved',
    created_at: '2026-09-30T10:00:00.000Z',
    review_history: [
      {
        id: 'log-cmp01-01',
        action: 'submit',
        actor_id: 'emp-008',
        actor_name: 'سارة ممدوح',
        actor_role: 'digital_marketing',
        timestamp: '2026-09-30T14:00:00.000Z',
        notes: 'تقديم خطة خريف 2026 لاستهداف طلاب الشهادة السودانية'
      },
      {
        id: 'log-cmp01-02',
        action: 'approve',
        actor_id: 'emp-002',
        actor_name: 'أحمد إبراهيم (مدير العمليات)',
        actor_role: 'operations_manager',
        timestamp: '2026-10-01T10:00:00.000Z',
        notes: 'اعتماد الطاقة الاستيعابية وحجز 554 ملف تسجيل مؤكد',
        capacity_snapshot: {
          approved_capacity: 2500,
          committed_capacity: 0,
          available_capacity: 2500,
          expected_registrations: 554
        }
      }
    ]
  },
  {
    id: 'cmp-02',
    campaign_code: 'MKT-GULF-FALL26',
    name: 'حملة استقطاب طلاب دول الخليج والشهادات المعادلة خريف 2026',
    channel: 'google',
    target_country: 'السعودية، الإمارات، الكويت، قطر، عمان، البحرين',
    target_audience: 'طلاب الجاليات والشهادات المعادلة العربية الراغبين بالدراسة في مصر',
    budget_amount: 180000,
    currency: 'EGP',
    start_date: '2026-10-05',
    end_date: '2026-12-31',
    target_leads: 2500,
    expected_registrations: 1000,
    owner_id: 'emp-008',
    owner_name: 'سارة ممدوح (مسؤولة التسويق الرقمي)',
    owner_role: 'digital_marketing',
    ops_capacity_approved: true,
    ops_capacity_approved_by: 'emp-002',
    ops_capacity_approved_at: '2026-10-05T12:00:00.000Z',
    status: 'approved',
    created_at: '2026-10-04T09:00:00.000Z',
    review_history: [
      {
        id: 'log-cmp02-01',
        action: 'submit',
        actor_id: 'emp-008',
        actor_name: 'سارة ممدوح',
        actor_role: 'digital_marketing',
        timestamp: '2026-10-04T09:00:00.000Z',
        notes: 'خطة استقطاب طلاب الخليج للجامعات المصرية (طب وهندسة وتخصصات نوعية)'
      },
      {
        id: 'log-cmp02-02',
        action: 'approve',
        actor_id: 'emp-002',
        actor_name: 'أحمد إبراهيم (مدير العمليات)',
        actor_role: 'operations_manager',
        timestamp: '2026-10-05T12:00:00.000Z',
        notes: 'اعتماد سقف القبول المخصص للخليج بحجز 1000 ملف',
        capacity_snapshot: {
          approved_capacity: 2500,
          committed_capacity: 554,
          available_capacity: 1946,
          expected_registrations: 1000
        }
      }
    ]
  },
  {
    id: 'cmp-03',
    campaign_code: 'MKT-GULF-MED26',
    name: 'حملة كليات الطب والصيدلة – طلاب الخليج',
    channel: 'google',
    target_country: 'السعودية والإمارات',
    target_audience: 'طلاب الجاليات والشهادات المعادلة العربية الراغبين بالدراسة في مصر',
    budget_amount: 120000,
    currency: 'EGP',
    start_date: '2026-10-15',
    end_date: '2026-12-15',
    target_leads: 80,
    expected_registrations: 100,
    owner_id: 'emp-008',
    owner_name: 'سارة ممدوح (مسؤولة التسويق الرقمي)',
    owner_role: 'digital_marketing',
    ops_capacity_approved: false,
    status: 'pending_approval',
    created_at: '2026-10-14T09:30:00.000Z',
    review_history: [
      {
        id: 'log-cmp03-01',
        action: 'submit',
        actor_id: 'emp-008',
        actor_name: 'سارة ممدوح',
        actor_role: 'digital_marketing',
        timestamp: '2026-10-14T11:00:00.000Z',
        notes: 'طلب إذن إطلاق إعلانات جوجل لاستهداف كليات القمة بالجامعات المصرية'
      }
    ]
  }
];

function mergeCapacitySettingsWithDefaults(stored: CapacitySettings | null): CapacitySettings {
  if (!stored) return { ...DEFAULT_CAPACITY_SETTINGS };
  if (!stored.base_capacity || stored.base_capacity <= 60) {
    return {
      ...stored,
      base_capacity: 2500,
      period: stored.period || DEFAULT_CAPACITY_SETTINGS.period,
      adjustments: stored.adjustments && stored.adjustments.length > 0 ? stored.adjustments : DEFAULT_CAPACITY_SETTINGS.adjustments
    };
  }
  return stored;
}

function mergeCampaignsWithDefaults(stored: Campaign[] | null): Campaign[] {
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return [...INITIAL_CAMPAIGNS];
  }
  const totalApproved = stored
    .filter(c => (c.status === 'approved' || c.ops_capacity_approved) && c.status !== 'cancelled' && c.status !== 'rejected')
    .reduce((sum, c) => sum + (Number(c.expected_registrations) || 0), 0);

  if (totalApproved < 100) {
    const cmp01 = stored.find(c => c.id === 'cmp-01');
    const cmp02 = stored.find(c => c.id === 'cmp-02');
    if (cmp01 && cmp01.expected_registrations < 100) {
      cmp01.expected_registrations = 554;
      cmp01.ops_capacity_approved = true;
      cmp01.status = 'approved';
    }
    if (cmp02 && cmp02.expected_registrations < 100) {
      cmp02.name = 'حملة استقطاب طلاب دول الخليج والشهادات المعادلة خريف 2026';
      cmp02.campaign_code = 'MKT-GULF-FALL26';
      cmp02.expected_registrations = 1000;
      cmp02.ops_capacity_approved = true;
      cmp02.status = 'approved';
    }
    if (!stored.some(c => c.id === 'cmp-03')) {
      stored.push(INITIAL_CAMPAIGNS[2]);
    }
    saveToStorage(STORAGE_KEYS.CAMPAIGNS, stored);
  }
  return stored;
}

function generateUniqueUsername(
  emp: { id?: string; email?: string; employee_code?: string; username?: string; full_name_en?: string },
  existingEmployees: Employee[],
  currentEmployeeId?: string
): string {
  let base = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
  if (!base) {
    if (emp.full_name_en && emp.full_name_en.trim().length > 0) {
      const parts = emp.full_name_en.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        base = `${parts[0]}.${parts[parts.length - 1]}`.replace(/[^a-z0-9._-]/g, '');
      } else {
        base = parts[0].replace(/[^a-z0-9._-]/g, '');
      }
    } else if (emp.email && emp.email.includes('@')) {
      base = emp.email.split('@')[0].trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    }
    if (!base) {
      const codeOrId = emp.employee_code ? emp.employee_code.toLowerCase().replace(/[^a-z0-9]/g, '') : (emp.id || 'usr');
      base = `user.${codeOrId}`;
    }
  }

  // Ensure uniqueness across existing employees (excluding current employee)
  let candidate = base;
  let counter = 1;
  const targetId = currentEmployeeId || emp.id;
  while (existingEmployees.some(e => (!targetId || e.id !== targetId) && e.username?.toLowerCase() === candidate)) {
    candidate = `${base}${counter}`;
    counter++;
  }
  return candidate;
}

function normalizeEmployees(stored: Employee[], skipSave: boolean = false): Employee[] {
  let changed = false;
  const result = stored.map(emp => {
    const updated = { ...emp };

    // Clean username from any leading or trailing @
    if (updated.username) {
      const cleaned = updated.username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      if (cleaned !== updated.username) {
        updated.username = cleaned;
        changed = true;
      }
    }

    // Canonical baseline reconciliation for emp-011 (Ramadan Fathy El-Shenawy)
    // Ramadan is hospitality staff (hospitality & office support) and by default is NOT a system user
    if (updated.id === 'emp-011' && (!updated.username || updated.username.trim() === '')) {
      if (updated.is_system_user !== false) {
        updated.is_system_user = false;
        updated.account_status = 'suspended';
        updated.must_change_password = false;
        updated.sync_status = 'disabled';
        updated.auth_account_id = undefined;
        changed = true;
      }
    }

    // Official General Manager reconciliation for emp-001 (Khalil Mohamed Osman)
    if (updated.id === 'emp-001' || (updated.department_id === 'gm' && updated.position_id === 'gm')) {
      if (updated.full_name_ar === 'بشدار محمد عثمان' || !updated.full_name_ar) {
        updated.full_name_ar = 'خليل محمد عثمان';
        updated.full_name_en = 'Khalil Mohamed Osman';
        changed = true;
      }
    }

    if (updated.is_system_user === undefined) {
      updated.is_system_user = Boolean(updated.username && updated.username.trim() !== '');
      changed = true;
    }

    // Authoritative job title synchronization from seed or positions
    if (!updated.job_title_ar || !updated.job_title_en) {
      const seedEmp = INITIAL_EMPLOYEES.find(e => e.id === updated.id);
      const pos = INITIAL_POSITIONS[updated.position_id];
      if (!updated.job_title_ar) {
        updated.job_title_ar = seedEmp?.job_title_ar || updated.job_title || pos?.title_ar || '';
        if (updated.job_title_ar) changed = true;
      }
      if (!updated.job_title_en) {
        updated.job_title_en = seedEmp?.job_title_en || updated.job_title || pos?.title_en || '';
        if (updated.job_title_en) changed = true;
      }
    }
    if (!updated.job_title && (updated.job_title_ar || updated.job_title_en)) {
      updated.job_title = updated.job_title_ar || updated.job_title_en;
      changed = true;
    }

    if (updated.is_system_user) {
      if (!updated.username || updated.username.trim() === '') {
        if (updated.email && updated.email.includes('@')) {
          updated.username = updated.email.split('@')[0].trim().toLowerCase();
        } else {
          updated.username = `user.${updated.employee_code ? updated.employee_code.toLowerCase().replace(/[^a-z0-9]/g, '') : updated.id}`;
        }
        changed = true;
      }

      // Authoritative password lifecycle alignment
      const empPassChanged = updated.password_changed_at ? new Date(updated.password_changed_at).getTime() : 0;
      const empReset = updated.last_password_reset_at ? new Date(updated.last_password_reset_at).getTime() : 0;

      let targetMustChange: boolean;
      if (empReset > empPassChanged) {
        targetMustChange = true;
      } else if (empPassChanged > 0 && empPassChanged >= empReset) {
        targetMustChange = false;
      } else if (updated.must_change_password !== undefined) {
        targetMustChange = Boolean(updated.must_change_password);
      } else if (updated.account_status === 'pending_password_change') {
        targetMustChange = true;
      } else {
        targetMustChange = false;
      }

      if (updated.must_change_password !== targetMustChange) {
        updated.must_change_password = targetMustChange;
        changed = true;
      }

      const targetAccountStatus = updated.employment_status !== 'active'
        ? 'suspended'
        : (targetMustChange ? 'pending_password_change' : 'active');

      if (updated.account_status !== targetAccountStatus) {
        updated.account_status = targetAccountStatus;
        changed = true;
      }

      if (!updated.password_hash) {
        updated.password_hash = targetMustChange ? DEFAULT_INITIAL_PASSWORD_HASH : DEMO_PASSWORD_HASH;
        changed = true;
      }
      if (!updated.auth_account_id) {
        updated.auth_account_id = `usr-${updated.id}`;
        changed = true;
      }
      if (!updated.sync_status || updated.sync_status !== 'synchronized') {
        updated.sync_status = 'synchronized';
        changed = true;
      }
    } else {
      if (updated.account_status !== 'suspended') {
        updated.account_status = 'suspended';
        changed = true;
      }
      if (updated.must_change_password !== false) {
        updated.must_change_password = false;
        changed = true;
      }
      if (updated.sync_status !== 'disabled') {
        updated.sync_status = 'disabled';
        changed = true;
      }
      if (updated.auth_account_id) {
        updated.auth_account_id = undefined;
        changed = true;
      }
    }
    return updated;
  });

  if (!result.some(e => e.id === 'emp-011')) {
    const emp011 = INITIAL_EMPLOYEES.find(e => e.id === 'emp-011');
    if (emp011) {
      result.push(emp011);
      changed = true;
    }
  }

  if (changed && !skipSave) {
    saveToStorage(STORAGE_KEYS.EMPLOYEES, result);
  }
  return result;
}

function normalizeSystemUsers(storedUsers: SystemUserAccount[], employees: Employee[], skipSave: boolean = false): SystemUserAccount[] {
  let changed = false;
  const userMap = new Map<string, SystemUserAccount>();

  // Index stored users, deduplicating multiple records for the same employee
  for (const u of storedUsers) {
    const cleanUser: SystemUserAccount = {
      ...u,
      username: (u.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase()
    };
    if (cleanUser.employee_id) {
      const existing = userMap.get(cleanUser.employee_id);
      if (!existing) {
        userMap.set(cleanUser.employee_id, cleanUser);
      } else {
        // Deduplicate: keep active/recently updated account
        if (cleanUser.status === 'active' && existing.status !== 'active') {
          userMap.set(cleanUser.employee_id, cleanUser);
        }
        changed = true;
      }
    }
  }

  // Ensure every system user employee has a synchronized SystemUserAccount
  for (const emp of employees) {
    if (emp.is_system_user !== false) {
      let cleanUsername = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      if (!cleanUsername) {
        if (emp.email && emp.email.includes('@')) {
          cleanUsername = emp.email.split('@')[0].trim().toLowerCase();
        } else {
          cleanUsername = `user.${emp.employee_code ? emp.employee_code.toLowerCase().replace(/[^a-z0-9]/g, '') : emp.id}`;
        }
      }

      let existing = userMap.get(emp.id);
      if (!existing) {
        for (const u of userMap.values()) {
          if (u.username.toLowerCase() === cleanUsername) {
            existing = u;
            existing.employee_id = emp.id;
            changed = true;
            break;
          }
        }
      }

      const empPassChanged = emp.password_changed_at ? new Date(emp.password_changed_at).getTime() : 0;
      const empReset = emp.last_password_reset_at ? new Date(emp.last_password_reset_at).getTime() : 0;
      const userPassChanged = existing?.password_changed_at ? new Date(existing.password_changed_at).getTime() : 0;
      const userReset = existing?.last_password_reset_at ? new Date(existing.last_password_reset_at).getTime() : 0;

      const latestPassChanged = Math.max(empPassChanged, userPassChanged);
      const latestReset = Math.max(empReset, userReset);

      let mustChange: boolean;
      if (latestReset > latestPassChanged) {
        mustChange = true;
      } else if (latestPassChanged > 0 && latestPassChanged >= latestReset) {
        mustChange = false;
      } else {
        mustChange = emp.must_change_password ?? existing?.must_change_password ?? false;
      }

      const status = emp.employment_status !== 'active'
        ? 'suspended'
        : (mustChange ? 'pending_password_change' : 'active');

      const expectedHash = existing?.password_hash || emp.password_hash || (mustChange ? DEFAULT_INITIAL_PASSWORD_HASH : DEMO_PASSWORD_HASH);
      const passwordChangedAtIso = latestPassChanged > 0 ? new Date(latestPassChanged).toISOString() : undefined;
      const lastResetAtIso = latestReset > 0 ? new Date(latestReset).toISOString() : undefined;

      if (!existing) {
        const newUser: SystemUserAccount = {
          id: `usr-${emp.id}`,
          employee_id: emp.id,
          username: cleanUsername,
          email: emp.email,
          password_hash: expectedHash,
          must_change_password: mustChange,
          status: status,
          password_changed_at: passwordChangedAtIso,
          last_password_reset_at: lastResetAtIso,
          is_super_admin: emp.roles?.includes('gm') || emp.roles?.includes('super_admin') || emp.id === 'emp-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        userMap.set(emp.id, newUser);
        changed = true;
      } else {
        let userUpdated = false;
        if (existing.username !== cleanUsername) {
          existing.username = cleanUsername;
          userUpdated = true;
        }
        if (existing.employee_id !== emp.id) {
          existing.employee_id = emp.id;
          userUpdated = true;
        }
        if (existing.status !== status) {
          existing.status = status;
          userUpdated = true;
        }
        if (existing.must_change_password !== mustChange) {
          existing.must_change_password = mustChange;
          userUpdated = true;
        }
        if (existing.password_changed_at !== passwordChangedAtIso) {
          existing.password_changed_at = passwordChangedAtIso;
          userUpdated = true;
        }
        if (existing.last_password_reset_at !== lastResetAtIso) {
          existing.last_password_reset_at = lastResetAtIso;
          userUpdated = true;
        }
        if (existing.password_hash !== expectedHash && emp.password_hash) {
          existing.password_hash = emp.password_hash;
          userUpdated = true;
        }
        if (userUpdated) {
          existing.updated_at = new Date().toISOString();
          changed = true;
        }
      }
    } else {
      // If employee is not a system user, ensure linked user account is suspended
      const existing = userMap.get(emp.id);
      if (existing && existing.status !== 'suspended') {
        existing.status = 'suspended';
        existing.updated_at = new Date().toISOString();
        changed = true;
      }
    }
  }

  const result = Array.from(userMap.values());
  if ((changed || storedUsers.length !== result.length) && !skipSave) {
    saveToStorage(STORAGE_KEYS.USERS, result);
  }
  return result;
}

function normalizeDepartments(storedDepts: Department[]): Department[] {
  if (!storedDepts || !Array.isArray(storedDepts) || storedDepts.length === 0) {
    return [...INITIAL_DEPARTMENTS];
  }
  return storedDepts.map(d => {
    const initial = INITIAL_DEPARTMENTS.find(init => init.id === d.id);
    const existingPerms = d.report_permissions;
    const existingDash = d.dashboard_permissions;
    return {
      ...d,
      report_permissions: existingPerms && Object.keys(existingPerms).length > 0
        ? existingPerms
        : (initial?.report_permissions ? { ...initial.report_permissions } : {}),
      dashboard_permissions: existingDash && Object.keys(existingDash).length > 0
        ? existingDash
        : (initial?.dashboard_permissions ? { ...initial.dashboard_permissions } : {})
    };
  });
}

const INSTANCE_TAB_ID = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : 'bct_inst_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);

class BCTStore {
  private employees: Employee[] = normalizeEmployees(loadFromStorage(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
  private systemUsers: SystemUserAccount[] = normalizeSystemUsers(loadFromStorage(STORAGE_KEYS.USERS, INITIAL_SYSTEM_USERS), this.employees);
  private departments: Department[] = normalizeDepartments(loadFromStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS));
  private positions: Record<string, JobPosition> = loadFromStorage(STORAGE_KEYS.POSITIONS, INITIAL_POSITIONS);
  private students: Student[] = loadFromStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  private studentFiles: StudentFile[] = loadFromStorage(STORAGE_KEYS.FILES, INITIAL_STUDENT_FILES);
  private documents: StudentDocument[] = loadFromStorage(STORAGE_KEYS.DOCUMENTS, []);
  private payments: PaymentRecord[] = loadFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  private tasks: Task[] = loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  private complaints: Complaint[] = loadFromStorage(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  private handoffs: DepartmentalHandoff[] = loadFromStorage(STORAGE_KEYS.HANDOFFS, INITIAL_HANDOFFS);
  private auditLogs: AuditLog[] = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  private capacitySettings: CapacitySettings = mergeCapacitySettingsWithDefaults(loadFromStorage(STORAGE_KEYS.CAPACITY_SETTINGS, DEFAULT_CAPACITY_SETTINGS));
  private campaigns: Campaign[] = mergeCampaignsWithDefaults(loadFromStorage(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS));
  private meetings: any[] = loadFromStorage(STORAGE_KEYS.MEETINGS, [
    {
      id: 'mtg-01',
      meeting_type: 'daily_standup',
      meeting_date: '2026-11-10',
      chairperson_ar: 'أحمد إبراهيم (مدير العمليات)',
      agenda: 'مراجعة الملفات المتأخرة، قائمة المعقب بالسفارات، والتسليمات المجدولة',
      decisions: 'أولوية التوثيق لطلاب دفعة 2024 وتأكيد سداد الرغبات لـ 5 طلاب',
      attendees_count: 8
    },
    {
      id: 'mtg-02',
      meeting_type: 'weekly_mgmt',
      meeting_date: '2026-11-08',
      chairperson_ar: 'خليل محمد (المدير العام)',
      agenda: 'تقييم الطاقة الاستيعابية، تقرير التحصيل الأسبوعي، ومراجعة شكاوى التأخير',
      decisions: 'الموافقة على زيادة سقف حملة السودان إلى 50 ملفاً أسبوعياً بعد تعزيز فريق التقديمات',
      attendees_count: 6
    }
  ]);
  private notifications: AppNotification[] = normalizeNotifications(loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS));
  private universities: University[] = mergeUniversitiesWithDefaults(loadFromStorage(STORAGE_KEYS.UNIVERSITIES, INITIAL_UNIVERSITIES));
  private faculties: UniversityFaculty[] = mergeFacultiesWithDefaults(loadFromStorage(STORAGE_KEYS.FACULTIES, INITIAL_FACULTIES));
  private campuses: UniversityCampus[] = mergeCampusesWithDefaults(loadFromStorage(STORAGE_KEYS.CAMPUSES, INITIAL_CAMPUSES));
  private expenses: ExpenseRecord[] = loadFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  private budgets: DepartmentBudget[] = loadFromStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
  private exchangeRate: ExchangeRate = loadFromStorage(STORAGE_KEYS.EXCHANGE_RATE, INITIAL_EXCHANGE_RATE);
  private backups: HRBackupAssignment[] = loadFromStorage(STORAGE_KEYS.BACKUPS, INITIAL_BACKUPS);
  private evaluations: PerformanceEvaluation[] = loadFromStorage(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
  private fileActivities: StudentFileActivityRecord[] = loadFromStorage(STORAGE_KEYS.FILE_ACTIVITIES, INITIAL_FILE_ACTIVITIES);
  private financialAccounts: FinancialAccount[] = loadFromStorage(STORAGE_KEYS.FINANCIAL_ACCOUNTS, INITIAL_FINANCIAL_ACCOUNTS);
  private incentivePolicies: IncentivePolicy[] = loadFromStorage(STORAGE_KEYS.INCENTIVE_POLICIES, INITIAL_INCENTIVE_POLICIES);
  private employeeIncentives: EmployeeIncentiveRecord[] = loadFromStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, INITIAL_EMPLOYEE_INCENTIVES);
  private accountMovements: AccountMovement[] = loadFromStorage(STORAGE_KEYS.ACCOUNT_MOVEMENTS, []);
  private internalTransfers: InternalTransfer[] = loadFromStorage(STORAGE_KEYS.INTERNAL_TRANSFERS, []);
  private slaConfigs: SLAConfigurationItem[] = loadFromStorage(STORAGE_KEYS.SLA_CONFIG, INITIAL_SLA_CONFIG);
  private backupRecords: BackupRecord[] = loadFromStorage(STORAGE_KEYS.BACKUP_RECORDS, []);
  private backupSchedule: BackupScheduleConfig = loadFromStorage(STORAGE_KEYS.BACKUP_SCHEDULE, DEFAULT_BACKUP_SCHEDULE);
  private backupRetention: BackupRetentionPolicy = loadFromStorage(STORAGE_KEYS.BACKUP_RETENTION, DEFAULT_BACKUP_RETENTION);
  private googleDriveConfig: GoogleDriveConfig = loadFromStorage(STORAGE_KEYS.GOOGLE_DRIVE_CONFIG, DEFAULT_GOOGLE_DRIVE_CONFIG);

  private listeners: (() => void)[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private remoteSyncDebounceTimer: any = null;
  private lastRemoteSyncTime = 0;
  private registrationMutex = false;
  private serverRevision: number = 1;
  private isSyncingWithServer: boolean = false;
  private serverPollInterval: any = null;
  private mergedFileCodeMap: Record<string, string> = {
    'file-204': 'file-201',
    'BCT-FILE-2026-004': 'BCT-FILE-2026-001',
    'file-208': 'file-201',
    'BCT-FILE-2026-008': 'BCT-FILE-2026-001',
    'file-211': 'file-201',
    'BCT-FILE-2026-011': 'BCT-FILE-2026-001',
    'file-206': 'file-202',
    'BCT-FILE-2026-006': 'BCT-FILE-2026-002',
    'file-207': 'file-202',
    'BCT-FILE-2026-007': 'BCT-FILE-2026-002',
    'file-209': 'file-202',
    'BCT-FILE-2026-009': 'BCT-FILE-2026-002',
    'file-205': 'file-203',
    'BCT-FILE-2026-005': 'BCT-FILE-2026-003'
  };

  constructor() {
    this.ensureRolePermissionsPopulated();
    this.reconcileAccountMovements();
    this.consolidateDuplicateStudentFiles('system');
    this.performAutoArchiving(true);
    this.reconcileStudentFiles();
    this.reconcileAllEmployeesAndSystemUsers('system');
    this.ensureInitialBackupSeed();

    if (typeof window !== 'undefined') {
      isStoreInitialized = true;

      // 1. Initial hydration from single source of truth canonical database
      this.syncFromServer();

      // 2. Periodic revision check every 1500ms
      this.serverPollInterval = setInterval(() => {
        this.checkServerVersion();
      }, 1500);

      // 3. Focus and visibility change listeners
      window.addEventListener('focus', () => this.checkServerVersion());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkServerVersion();
        }
      });

      // 4. Same-origin storage event listener
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('bct_store_')) {
          this.handleRemoteSyncTrigger();
        }
      });

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          this.broadcastChannel = new BroadcastChannel('bct_erp_sync_channel');
          this.broadcastChannel.onmessage = (event) => {
            // Loop break & echo cancellation: ignore messages originated from this same tab/instance
            if (event.data?.senderId === INSTANCE_TAB_ID) {
              return;
            }
            this.handleRemoteSyncTrigger();
          };
        }
      } catch {
        // BroadcastChannel optional fallback
      }
    }
  }

  /**
   * Safe throttled sync from remote storage or broadcast events.
   * Debounces multiple fast mutations into a single reload, and
   * triggers LOCAL listeners only without re-broadcasting.
   */
  private handleRemoteSyncTrigger(): void {
    const now = Date.now();
    if (this.remoteSyncDebounceTimer) {
      clearTimeout(this.remoteSyncDebounceTimer);
    }

    // Trailing debounce: coalesces rapid bursts into a single coordinated store reload
    const delay = (now - this.lastRemoteSyncTime < 100) ? 100 : 25;

    this.remoteSyncDebounceTimer = setTimeout(() => {
      this.lastRemoteSyncTime = Date.now();
      this.reloadAllFromStorage(true);
      this.notifyLocal();
    }, delay);
  }

  private ensureRolePermissionsPopulated(): void {
    let changed = false;
    Object.keys(this.positions).forEach(key => {
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[key] || [];
      if (!this.positions[key].permissions || this.positions[key].permissions.length === 0) {
        if (defaultPerms.length > 0) {
          this.positions[key].permissions = [...defaultPerms];
          changed = true;
        }
      } else {
        // If the position has operational permissions but has never been seeded with default dashboard widgets:
        const currentPerms = this.positions[key].permissions;
        const hasAnyDashKey = currentPerms.some(p => p.startsWith('dash:'));
        const defaultDashKeys = defaultPerms.filter(p => p.startsWith('dash:'));
        if (!hasAnyDashKey && defaultDashKeys.length > 0) {
          this.positions[key].permissions = [...currentPerms, ...defaultDashKeys];
          changed = true;
        }
      }
    });

    // One-time idempotent seed of dedicated 'payments:edit_pending' permission for fin_mgr & accountant
    // Respects any future administrator revocations by running only once per storage instance.
    const editPendingMigrationKey = 'bct_perm_migration_edit_pending_v1';
    const hasMigratedEditPending = typeof localStorage !== 'undefined' && localStorage.getItem(editPendingMigrationKey) === 'done';
    if (!hasMigratedEditPending) {
      (['fin_mgr', 'accountant'] as const).forEach(roleKey => {
        const pos = this.positions[roleKey];
        if (pos && Array.isArray(pos.permissions) && !pos.permissions.includes('payments:edit_pending')) {
          pos.permissions = [...pos.permissions, 'payments:edit_pending'];
          changed = true;
        }
      });
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(editPendingMigrationKey, 'done');
        } catch {
          // Ignore storage quota errors in restricted environments
        }
      }
    }

    // One-time idempotent seed of dedicated 'payments:cancel_pending' permission for fin_mgr & accountant
    const cancelPendingMigrationKey = 'bct_perm_migration_cancel_pending_v1';
    const hasMigratedCancelPending = typeof localStorage !== 'undefined' && localStorage.getItem(cancelPendingMigrationKey) === 'done';
    if (!hasMigratedCancelPending) {
      (['fin_mgr', 'accountant'] as const).forEach(roleKey => {
        const pos = this.positions[roleKey];
        if (pos && Array.isArray(pos.permissions) && !pos.permissions.includes('payments:cancel_pending')) {
          pos.permissions = [...pos.permissions, 'payments:cancel_pending'];
          changed = true;
        }
      });
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(cancelPendingMigrationKey, 'done');
        } catch {
          // Ignore storage quota errors in restricted environments
        }
      }
    }

    if (changed) {
      saveToStorage(STORAGE_KEYS.POSITIONS, this.positions);
    }
  }

  /**
   * Level 4 Backend & Store Authorization Enforcement
   * Verifies that the actor has the required permissions before mutating critical business records
   */
  public checkActorAuthorization(
    actorUsername: string,
    requiredPermission: string,
    resourceType: string,
    resourceId?: string
  ): boolean {
    if (!actorUsername) return false;
    // System automated daemons, admin, and Super Admin GM
    if (actorUsername === 'system' || actorUsername === 'system_auto' || actorUsername === 'admin' || actorUsername === 'bashdar.gm') {
      return true;
    }

    const actor = this.getEmployeeByUsername(actorUsername);
    if (!actor) {
      this.addAuditLog(actorUsername, 'AUTH_DENIED_UNKNOWN_USER', resourceType, resourceId || 'unknown', {
        requiredPermission
      });
      return false;
    }

    if (actor.employment_status !== 'active') {
      this.addAuditLog(actor.username, 'AUTH_DENIED_INACTIVE_USER', resourceType, resourceId || actor.id, {
        requiredPermission,
        status: actor.employment_status
      });
      return false;
    }

    const hasAccess = rbacService.hasPermission(actor, requiredPermission, this.positions);
    if (!hasAccess) {
      this.addAuditLog(actor.username, 'UNAUTHORIZED_ACCESS_DENIED', resourceType, resourceId || 'unauthorized', {
        requiredPermission,
        actorRole: actor.position_id
      });
      return false;
    }

    return true;
  }

  private reloadAllFromStorage(skipSave: boolean = true): void {
    this.employees = normalizeEmployees(loadFromStorage(STORAGE_KEYS.EMPLOYEES, this.employees), skipSave);
    this.departments = normalizeDepartments(loadFromStorage(STORAGE_KEYS.DEPARTMENTS, this.departments));
    this.positions = loadFromStorage(STORAGE_KEYS.POSITIONS, this.positions);
    this.students = loadFromStorage(STORAGE_KEYS.STUDENTS, this.students);
    this.studentFiles = loadFromStorage(STORAGE_KEYS.FILES, this.studentFiles);
    this.documents = loadFromStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    this.payments = loadFromStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.tasks = loadFromStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.complaints = loadFromStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
    this.handoffs = loadFromStorage(STORAGE_KEYS.HANDOFFS, this.handoffs);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    this.campaigns = mergeCampaignsWithDefaults(loadFromStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns));
    this.meetings = loadFromStorage(STORAGE_KEYS.MEETINGS, this.meetings);
    this.notifications = normalizeNotifications(loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications));
    this.universities = mergeUniversitiesWithDefaults(loadFromStorage(STORAGE_KEYS.UNIVERSITIES, this.universities));
    this.faculties = mergeFacultiesWithDefaults(loadFromStorage(STORAGE_KEYS.FACULTIES, this.faculties));
    this.campuses = mergeCampusesWithDefaults(loadFromStorage(STORAGE_KEYS.CAMPUSES, this.campuses));
    this.expenses = loadFromStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    this.budgets = loadFromStorage(STORAGE_KEYS.BUDGETS, this.budgets);
    this.exchangeRate = loadFromStorage(STORAGE_KEYS.EXCHANGE_RATE, this.exchangeRate);
    this.backups = loadFromStorage(STORAGE_KEYS.BACKUPS, this.backups);
    this.evaluations = loadFromStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
    this.capacitySettings = mergeCapacitySettingsWithDefaults(loadFromStorage(STORAGE_KEYS.CAPACITY_SETTINGS, this.capacitySettings));
    this.fileActivities = loadFromStorage(STORAGE_KEYS.FILE_ACTIVITIES, this.fileActivities);
    this.financialAccounts = loadFromStorage(STORAGE_KEYS.FINANCIAL_ACCOUNTS, this.financialAccounts);
    this.incentivePolicies = loadFromStorage(STORAGE_KEYS.INCENTIVE_POLICIES, this.incentivePolicies);
    this.employeeIncentives = loadFromStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
    this.accountMovements = loadFromStorage(STORAGE_KEYS.ACCOUNT_MOVEMENTS, this.accountMovements);
    this.internalTransfers = loadFromStorage(STORAGE_KEYS.INTERNAL_TRANSFERS, this.internalTransfers);
    this.slaConfigs = loadFromStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);
    this.systemUsers = normalizeSystemUsers(loadFromStorage(STORAGE_KEYS.USERS, this.systemUsers), this.employees, skipSave);
    this.consolidateDuplicateStudentFiles('system');
    this.reconcileStudentFiles();
    this.reconcileAllEmployeesAndSystemUsers('system', true);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    try {
      this.broadcastChannel?.postMessage({
        type: 'STORE_UPDATED',
        senderId: INSTANCE_TAB_ID,
        timestamp: Date.now()
      });
    } catch {
      // Ignore broadcast errors
    }
    this.notifyLocal();
  }

  private notifyLocal(): void {
    for (let i = 0; i < this.listeners.length; i++) {
      try {
        this.listeners[i]();
      } catch (err) {
        console.error('[BCT Store] Error executing listener:', err);
      }
    }
  }

  public getServerRevision(): number {
    return this.serverRevision;
  }

  public updateServerRevision(rev: number): void {
    if (typeof rev === 'number' && rev > this.serverRevision) {
      this.serverRevision = rev;
    }
  }

  public async syncFromServer(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return false;
    if (this.isSyncingWithServer) return false;

    this.isSyncingWithServer = true;
    try {
      const res = await fetch('/api/database/all', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) {
        this.isSyncingWithServer = false;
        return false;
      }
      const data = await res.json();
      if (!data || !data.tables) {
        this.isSyncingWithServer = false;
        return false;
      }

      this.applyServerTables(data.tables, data.revision || 1);
      this.isSyncingWithServer = false;
      return true;
    } catch (err: any) {
      console.warn('[BCT Store] Could not sync from server:', err?.message || err);
      this.isSyncingWithServer = false;
      return false;
    }
  }

  public async checkServerVersion(): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    if (this.isSyncingWithServer) return;

    try {
      const res = await fetch('/api/database/version', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.revision === 'number') {
        if (data.revision > this.serverRevision) {
          console.log(`[BCT Store] Server revision advanced (${this.serverRevision} -> ${data.revision}). Synchronizing...`);
          await this.syncFromServer();
        }
      }
    } catch {
      // Network silent fail
    }
  }

  public applyServerTables(tables: Record<string, any>, revision: number): void {
    if (!tables || typeof tables !== 'object') return;

    // 1. Update localStorage so client-side reload matches server state exactly
    if (typeof localStorage !== 'undefined') {
      for (const [key, val] of Object.entries(tables)) {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch {}
      }
    }

    // 2. Update in-memory tables
    if (tables[STORAGE_KEYS.EMPLOYEES]) this.employees = normalizeEmployees(tables[STORAGE_KEYS.EMPLOYEES], true);
    if (tables[STORAGE_KEYS.DEPARTMENTS]) this.departments = normalizeDepartments(tables[STORAGE_KEYS.DEPARTMENTS]);
    if (tables[STORAGE_KEYS.POSITIONS]) this.positions = tables[STORAGE_KEYS.POSITIONS];
    if (tables[STORAGE_KEYS.STUDENTS]) this.students = tables[STORAGE_KEYS.STUDENTS];
    if (tables[STORAGE_KEYS.FILES]) this.studentFiles = tables[STORAGE_KEYS.FILES];
    if (tables[STORAGE_KEYS.DOCUMENTS]) this.documents = tables[STORAGE_KEYS.DOCUMENTS];
    if (tables[STORAGE_KEYS.PAYMENTS]) this.payments = tables[STORAGE_KEYS.PAYMENTS];
    if (tables[STORAGE_KEYS.TASKS]) this.tasks = tables[STORAGE_KEYS.TASKS];
    if (tables[STORAGE_KEYS.COMPLAINTS]) this.complaints = tables[STORAGE_KEYS.COMPLAINTS];
    if (tables[STORAGE_KEYS.HANDOFFS]) this.handoffs = tables[STORAGE_KEYS.HANDOFFS];
    if (tables[STORAGE_KEYS.AUDIT_LOGS]) this.auditLogs = tables[STORAGE_KEYS.AUDIT_LOGS];
    if (tables[STORAGE_KEYS.CAMPAIGNS]) this.campaigns = mergeCampaignsWithDefaults(tables[STORAGE_KEYS.CAMPAIGNS]);
    if (tables[STORAGE_KEYS.MEETINGS]) this.meetings = tables[STORAGE_KEYS.MEETINGS];
    if (tables[STORAGE_KEYS.NOTIFICATIONS]) this.notifications = normalizeNotifications(tables[STORAGE_KEYS.NOTIFICATIONS]);
    if (tables[STORAGE_KEYS.UNIVERSITIES]) this.universities = mergeUniversitiesWithDefaults(tables[STORAGE_KEYS.UNIVERSITIES]);
    if (tables[STORAGE_KEYS.FACULTIES]) this.faculties = mergeFacultiesWithDefaults(tables[STORAGE_KEYS.FACULTIES]);
    if (tables[STORAGE_KEYS.CAMPUSES]) this.campuses = mergeCampusesWithDefaults(tables[STORAGE_KEYS.CAMPUSES]);
    if (tables[STORAGE_KEYS.EXPENSES]) this.expenses = tables[STORAGE_KEYS.EXPENSES];
    if (tables[STORAGE_KEYS.BUDGETS]) this.budgets = tables[STORAGE_KEYS.BUDGETS];
    if (tables[STORAGE_KEYS.EXCHANGE_RATE]) this.exchangeRate = tables[STORAGE_KEYS.EXCHANGE_RATE];
    if (tables[STORAGE_KEYS.BACKUPS]) this.backups = tables[STORAGE_KEYS.BACKUPS];
    if (tables[STORAGE_KEYS.EVALUATIONS]) this.evaluations = tables[STORAGE_KEYS.EVALUATIONS];
    if (tables[STORAGE_KEYS.CAPACITY_SETTINGS]) this.capacitySettings = mergeCapacitySettingsWithDefaults(tables[STORAGE_KEYS.CAPACITY_SETTINGS]);
    if (tables[STORAGE_KEYS.FILE_ACTIVITIES]) this.fileActivities = tables[STORAGE_KEYS.FILE_ACTIVITIES];
    if (tables[STORAGE_KEYS.FINANCIAL_ACCOUNTS]) this.financialAccounts = tables[STORAGE_KEYS.FINANCIAL_ACCOUNTS];
    if (tables[STORAGE_KEYS.INCENTIVE_POLICIES]) this.incentivePolicies = tables[STORAGE_KEYS.INCENTIVE_POLICIES];
    if (tables[STORAGE_KEYS.EMPLOYEE_INCENTIVES]) this.employeeIncentives = tables[STORAGE_KEYS.EMPLOYEE_INCENTIVES];
    if (tables[STORAGE_KEYS.ACCOUNT_MOVEMENTS]) this.accountMovements = tables[STORAGE_KEYS.ACCOUNT_MOVEMENTS];
    if (tables[STORAGE_KEYS.INTERNAL_TRANSFERS]) this.internalTransfers = tables[STORAGE_KEYS.INTERNAL_TRANSFERS];
    if (tables[STORAGE_KEYS.SLA_CONFIG]) this.slaConfigs = tables[STORAGE_KEYS.SLA_CONFIG];
    if (tables[STORAGE_KEYS.USERS]) this.systemUsers = normalizeSystemUsers(tables[STORAGE_KEYS.USERS], this.employees, true);
    if (tables[STORAGE_KEYS.BACKUP_RECORDS]) this.backupRecords = tables[STORAGE_KEYS.BACKUP_RECORDS];
    if (tables[STORAGE_KEYS.BACKUP_SCHEDULE]) this.backupSchedule = tables[STORAGE_KEYS.BACKUP_SCHEDULE];
    if (tables[STORAGE_KEYS.BACKUP_RETENTION]) this.backupRetention = tables[STORAGE_KEYS.BACKUP_RETENTION];
    if (tables[STORAGE_KEYS.GOOGLE_DRIVE_CONFIG]) this.googleDriveConfig = tables[STORAGE_KEYS.GOOGLE_DRIVE_CONFIG];

    this.serverRevision = revision;
    this.reconcileAccountMovements(true);
    this.consolidateDuplicateStudentFiles('system');
    this.reconcileStudentFiles();

    // 3. Notify all subscribed React components across the application
    this.notifyLocal();
  }

  // --- Audit Logging ---
  private sanitizeAuditState(state: any): any {
    if (!state || typeof state !== 'object') return state;
    if (Array.isArray(state)) {
      return state.map(item => this.sanitizeAuditState(item));
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(state)) {
      if (['password', 'password_hash', 'tempPassword', 'temp_password'].includes(key)) {
        clean[key] = '[REDACTED_SECURE]';
      } else if (value && typeof value === 'object') {
        clean[key] = this.sanitizeAuditState(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  public addAuditLog(
    actorUsername: string,
    action: SystemAuditEventCode | string,
    resourceType: string,
    resourceId: string,
    newState?: any,
    oldState?: any,
    skipNotify: boolean = false
  ): void {
    const log: AuditLog = {
      id: Date.now(),
      actor_username: actorUsername || 'system',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_state: this.sanitizeAuditState(oldState),
      new_state: this.sanitizeAuditState(newState),
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    if (!skipNotify) {
      this.notify();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // --- Notifications (User-Specific Notifications & Alerts System) ---
  public getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  /**
   * Retrieves notifications exclusively targeted to the specified user/employee.
   * Prevents system-wide notification leakage and guarantees strict ownership.
   */
  public getNotificationsForUser(user: Employee | null | undefined): AppNotification[] {
    if (!user) return [];
    const validIds = new Set<string>();
    if (user.id) validIds.add(user.id);
    if (user.username) validIds.add(user.username);
    if (user.employee_code) validIds.add(user.employee_code);

    return this.notifications
      .filter(n => {
        const recipient = n.recipient_id || n.recipient_user_id;
        if (!recipient) return false;
        return validIds.has(recipient);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Calculates unread notification count exclusively for the specified user.
   */
  public getUnreadCountForUser(user: Employee | null | undefined): number {
    return this.getNotificationsForUser(user).filter(n => !n.read).length;
  }

  /**
   * Adds a user-targeted notification with built-in deduplication.
   */
  public addNotification(notifData: Omit<AppNotification, 'id' | 'created_at'>): AppNotification {
    const recipient = notifData.recipient_id || notifData.recipient_user_id || '';
    const now = Date.now();

    // Deduplication check: same recipient, same category & related_id (or same title_ar) within 5 minutes
    const existingIdx = this.notifications.findIndex(n => {
      const r = n.recipient_id || n.recipient_user_id;
      if (r !== recipient) return false;
      if (notifData.related_id && n.related_id === notifData.related_id && n.category === notifData.category) {
        const timeDiff = now - new Date(n.created_at).getTime();
        return timeDiff < 300000;
      }
      if (n.title_ar === notifData.title_ar && n.category === notifData.category) {
        const timeDiff = now - new Date(n.created_at).getTime();
        return timeDiff < 300000;
      }
      return false;
    });

    if (existingIdx !== -1) {
      this.notifications[existingIdx] = {
        ...this.notifications[existingIdx],
        ...notifData,
        recipient_id: recipient,
        recipient_user_id: recipient,
        read: false,
        created_at: new Date().toISOString()
      };
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
      return this.notifications[existingIdx];
    }

    const newNotif: AppNotification = {
      ...notifData,
      recipient_id: recipient,
      recipient_user_id: recipient,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
    return newNotif;
  }

  /**
   * Marks a notification as read with ownership validation.
   */
  public markNotificationRead(id: string, user?: Employee | null): boolean {
    const idx = this.notifications.findIndex(n => n.id === id);
    if (idx === -1) return false;

    if (user) {
      const notif = this.notifications[idx];
      const validIds = new Set([user.id, user.username, user.employee_code]);
      const r = notif.recipient_id || notif.recipient_user_id;
      if (r && !validIds.has(r)) {
        return false;
      }
    }

    this.notifications[idx].read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
    return true;
  }

  /**
   * Marks all notifications belonging exclusively to the current user as read.
   */
  public markAllNotificationsReadForUser(user: Employee | null | undefined): void {
    if (!user) return;
    const validIds = new Set([user.id, user.username, user.employee_code]);
    let modified = false;
    this.notifications.forEach(n => {
      const r = n.recipient_id || n.recipient_user_id;
      if (r && validIds.has(r) && !n.read) {
        n.read = true;
        modified = true;
      }
    });
    if (modified) {
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach(n => { n.read = true; });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  // --- Employees & Org (Fix 06) ---
  public getEmployees(): Employee[] {
    return [...this.employees];
  }

  public getEmployee(id: string): Employee | undefined {
    return this.employees.find(e => e.id === id);
  }

  public getEmployeeByUsername(username: string): Employee | undefined {
    if (!username) return undefined;
    const clean = username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    return this.employees.find(e => {
      const eClean = (e.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      return eClean === clean || e.username.toLowerCase() === username.trim().toLowerCase();
    });
  }

  public getGeneralManagerEmployee(): Employee | undefined {
    const activeEmps = this.employees.filter(e => e.employment_status === 'active');
    // 1. Employee with position_id === 'gm' or role 'gm'
    const gmByPos = activeEmps.find(e => e.position_id === 'gm' || (e.roles && e.roles.includes('gm')));
    if (gmByPos) return gmByPos;

    // 2. Employee in 'gm' department with title 'المدير العام'
    const gmByTitle = activeEmps.find(e => 
      e.department_id === 'gm' && 
      ((e.job_title_ar && e.job_title_ar.includes('المدير العام')) || 
       (e.job_title_en && e.job_title_en.toLowerCase().includes('general manager')))
    );
    if (gmByTitle) return gmByTitle;

    // 3. Any active employee in 'gm' department
    const gmByDept = activeEmps.find(e => e.department_id === 'gm');
    if (gmByDept) return gmByDept;

    // 4. Fallback to emp-001 or first employee
    return this.employees.find(e => e.id === 'emp-001') || this.employees[0];
  }

  public getDepartmentHeadEmployee(departmentId: string): Employee | undefined {
    if (!departmentId) return undefined;
    if (departmentId === 'gm') {
      return this.getGeneralManagerEmployee();
    }

    const activeDeptEmps = this.employees.filter(e => e.department_id === departmentId && e.employment_status === 'active');
    if (activeDeptEmps.length === 0) {
      return this.employees.find(e => e.department_id === departmentId);
    }

    const dept = this.departments.find(d => d.id === departmentId);
    const managerRole = dept?.roles?.[0];
    if (managerRole) {
      const headByRole = activeDeptEmps.find(e => e.position_id === managerRole || (e.roles && e.roles.includes(managerRole)));
      if (headByRole) return headByRole;
    }

    const headByTitle = activeDeptEmps.find(e =>
      (e.job_title_ar && (e.job_title_ar.includes('مدير') || e.job_title_ar.includes('رئيس') || e.job_title_ar.includes('مسؤول'))) ||
      (e.job_title_en && (e.job_title_en.toLowerCase().includes('manager') || e.job_title_en.toLowerCase().includes('head') || e.job_title_en.toLowerCase().includes('lead')))
    );
    if (headByTitle) return headByTitle;

    return activeDeptEmps[0];
  }

  // --- System User Accounts & Synchronization ---
  public getSystemUsers(): SystemUserAccount[] {
    return [...this.systemUsers];
  }

  public getSystemUserByEmployeeId(empId: string): SystemUserAccount | undefined {
    return this.systemUsers.find(u => u.employee_id === empId);
  }

  public getSystemUserByUsername(username: string): SystemUserAccount | undefined {
    if (!username) return undefined;
    const clean = username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    return this.systemUsers.find(u => {
      const uClean = (u.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      return uClean === clean || u.username.toLowerCase() === username.trim().toLowerCase();
    });
  }

  public getAccountSyncDiagnostic(employeeId: string): AccountSyncDiagnostic {
    const emp = this.getEmployee(employeeId);
    if (!emp) {
      return {
        status: 'not_linked',
        isSystemUser: false,
        hasAuthAccount: false,
        usernameMatch: false,
        username: '',
        reasonAr: 'سجل الموظف غير موجود في قاعدة البيانات',
        reasonEn: 'Employee record not found in database'
      };
    }

    if (emp.is_system_user === false) {
      return {
        status: 'disabled',
        isSystemUser: false,
        hasAuthAccount: false,
        usernameMatch: true,
        username: emp.username || '',
        reasonAr: 'موظف شركة بدون حساب دخول للنظام (حالة طبيعية)',
        reasonEn: 'Company employee without system access (Normal)'
      };
    }

    const empClean = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    const user = this.getSystemUserByEmployeeId(employeeId);

    if (!empClean) {
      return {
        status: 'requires_repair',
        isSystemUser: true,
        hasAuthAccount: Boolean(user),
        usernameMatch: false,
        username: '',
        reasonAr: 'اسم المستخدم مفقود أو فارغ في سجل الموظف',
        reasonEn: 'System username is missing or empty in employee record'
      };
    }

    if (!user) {
      const userByUsername = this.systemUsers.find(u => (u.username || '').toLowerCase() === empClean);
      if (userByUsername) {
        return {
          status: 'requires_repair',
          isSystemUser: true,
          hasAuthAccount: true,
          usernameMatch: true,
          username: empClean,
          reasonAr: `حساب المستخدم موجود باسم (@${empClean}) لكنه غير مرتبط برقم الموظف (${emp.id})`,
          reasonEn: `Auth account exists as (@${empClean}) but unlinked from employee ID (${emp.id})`
        };
      }
      return {
        status: 'not_linked',
        isSystemUser: true,
        hasAuthAccount: false,
        usernameMatch: false,
        username: empClean,
        reasonAr: 'لا يوجد حساب مصادقة مطابق في جدول مستخدمي النظام',
        reasonEn: 'No authentication account found in system users table'
      };
    }

    const usrClean = (user.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    if (empClean !== usrClean) {
      return {
        status: 'requires_repair',
        isSystemUser: true,
        hasAuthAccount: true,
        usernameMatch: false,
        username: empClean,
        reasonAr: `عدم تطابق اسم المستخدم: (@${empClean}) في الموظف مقابل (@${usrClean}) في حساب الدخول`,
        reasonEn: `Username mismatch: (@${empClean}) in employee vs (@${usrClean}) in auth account`
      };
    }

    // Check for duplicate accounts in systemUsers for same employee_id
    const duplicateCount = this.systemUsers.filter(u => u.employee_id === employeeId).length;
    if (duplicateCount > 1) {
      return {
        status: 'requires_repair',
        isSystemUser: true,
        hasAuthAccount: true,
        usernameMatch: true,
        username: empClean,
        reasonAr: `تكرار حسابات الدخول: يوجد ${duplicateCount} حسابات لنفس الموظف`,
        reasonEn: `Duplicate accounts: ${duplicateCount} auth records exist for this employee`
      };
    }

    // Check for duplicate username across different employees
    const duplicateUsernameEmps = this.employees.filter(
      e => e.id !== employeeId && e.is_system_user !== false && (e.username || '').trim().toLowerCase() === empClean
    );
    if (duplicateUsernameEmps.length > 0) {
      return {
        status: 'requires_repair',
        isSystemUser: true,
        hasAuthAccount: true,
        usernameMatch: true,
        username: empClean,
        reasonAr: `اسم المستخدم (@${empClean}) مكرر لموظف آخر (${duplicateUsernameEmps[0].full_name_ar})`,
        reasonEn: `Username (@${empClean}) is duplicated on another employee (${duplicateUsernameEmps[0].full_name_en})`
      };
    }

    return {
      status: 'synchronized',
      isSystemUser: true,
      hasAuthAccount: true,
      usernameMatch: true,
      username: empClean,
      reasonAr: 'حساب مستخدم النظام متزامن بالكامل مع محرك المصادقة',
      reasonEn: 'System user account is fully synchronized with auth engine'
    };
  }

  public getAccountSyncStatus(employeeId: string): AccountSyncStatus {
    return this.getAccountSyncDiagnostic(employeeId).status;
  }

  public reconcileAllEmployeesAndSystemUsers(
    actorUsername: string = 'system',
    skipSave: boolean = false
  ): {
    success: boolean;
    repairedEmployeesCount: number;
    repairedUsersCount: number;
    details: string[];
  } {
    let repairedEmployeesCount = 0;
    let repairedUsersCount = 0;
    const details: string[] = [];
    const now = new Date().toISOString();

    // 1. Deduplicate system users map
    const userMapByEmpId = new Map<string, SystemUserAccount[]>();
    for (const u of this.systemUsers) {
      if (u.employee_id) {
        const list = userMapByEmpId.get(u.employee_id) || [];
        list.push(u);
        userMapByEmpId.set(u.employee_id, list);
      }
    }

    let usersModified = false;
    const cleanUsersList: SystemUserAccount[] = [];
    const processedEmpIds = new Set<string>();

    for (const [empId, userList] of userMapByEmpId.entries()) {
      if (userList.length > 1) {
        userList.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        });
        cleanUsersList.push(userList[0]);
        usersModified = true;
        repairedUsersCount += (userList.length - 1);
        details.push(`Deduplicated ${userList.length} accounts for employee ${empId}`);
      } else {
        cleanUsersList.push(userList[0]);
      }
      processedEmpIds.add(empId);
    }

    for (const u of this.systemUsers) {
      if (!u.employee_id || !processedEmpIds.has(u.employee_id)) {
        cleanUsersList.push(u);
      }
    }

    this.systemUsers = cleanUsersList;

    // 2. Normalize and synchronize every employee
    let employeesModified = false;

    for (let i = 0; i < this.employees.length; i++) {
      const emp = this.employees[i];
      let empChanged = false;

      // Special check: Ramadan Fathy El-Shenawy (emp-011)
      if (emp.id === 'emp-011' && (!emp.username || emp.username.trim() === '')) {
        if (emp.is_system_user !== false) {
          emp.is_system_user = false;
          emp.account_status = 'suspended';
          emp.must_change_password = false;
          emp.sync_status = 'disabled';
          emp.auth_account_id = undefined;
          empChanged = true;
          details.push(`Reconciled Ramadan (emp-011) to non-system staff`);
        }
      }

      if (emp.is_system_user === false) {
        if (emp.account_status !== 'suspended') {
          emp.account_status = 'suspended';
          empChanged = true;
        }
        if (emp.must_change_password !== false) {
          emp.must_change_password = false;
          empChanged = true;
        }
        if (emp.sync_status !== 'disabled') {
          emp.sync_status = 'disabled';
          empChanged = true;
        }
        if (emp.auth_account_id) {
          emp.auth_account_id = undefined;
          empChanged = true;
        }

        const linkedUser = this.systemUsers.find(u => u.employee_id === emp.id);
        if (linkedUser && linkedUser.status !== 'suspended') {
          linkedUser.status = 'suspended';
          linkedUser.updated_at = now;
          usersModified = true;
          repairedUsersCount++;
          details.push(`Suspended auth account for non-system staff ${emp.id}`);
        }
      } else {
        // System user
        let cleanUsername = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
        if (!cleanUsername) {
          if (emp.email && emp.email.includes('@')) {
            cleanUsername = emp.email.split('@')[0].trim().toLowerCase();
          } else {
            cleanUsername = `user.${emp.employee_code ? emp.employee_code.toLowerCase().replace(/[^a-z0-9]/g, '') : emp.id}`;
          }
          emp.username = cleanUsername;
          empChanged = true;
          details.push(`Generated username for ${emp.id}: @${cleanUsername}`);
        }

        let user = this.systemUsers.find(u => u.employee_id === emp.id);
        if (!user) {
          user = this.systemUsers.find(u => u.username.toLowerCase() === cleanUsername);
          if (user) {
            user.employee_id = emp.id;
            usersModified = true;
            details.push(`Linked orphaned user @${cleanUsername} to employee ${emp.id}`);
          }
        }

        if (!user) {
          const newAccount: SystemUserAccount = {
            id: `usr-${emp.id}`,
            employee_id: emp.id,
            username: cleanUsername,
            email: emp.email,
            password_hash: emp.password_hash || DEFAULT_INITIAL_PASSWORD_HASH,
            must_change_password: emp.must_change_password ?? true,
            status: emp.employment_status === 'active' ? (emp.account_status || 'pending_password_change') : 'suspended',
            is_super_admin: emp.roles?.includes('gm') || emp.roles?.includes('super_admin') || emp.id === 'emp-001',
            created_at: now,
            updated_at: now
          };
          this.systemUsers.push(newAccount);
          user = newAccount;
          usersModified = true;
          repairedUsersCount++;
          details.push(`Created missing SystemUserAccount for ${emp.id} (@${cleanUsername})`);
        } else {
          let userChanged = false;
          if (user.username !== cleanUsername) {
            user.username = cleanUsername;
            userChanged = true;
          }
          if (emp.email && user.email !== emp.email) {
            user.email = emp.email;
            userChanged = true;
          }

          const empPassChanged = emp.password_changed_at ? new Date(emp.password_changed_at).getTime() : 0;
          const empReset = emp.last_password_reset_at ? new Date(emp.last_password_reset_at).getTime() : 0;
          const userPassChanged = user.password_changed_at ? new Date(user.password_changed_at).getTime() : 0;
          const userReset = user.last_password_reset_at ? new Date(user.last_password_reset_at).getTime() : 0;

          const latestPassChanged = Math.max(empPassChanged, userPassChanged);
          const latestReset = Math.max(empReset, userReset);

          let finalMustChange = false;
          if (latestReset > latestPassChanged) {
            finalMustChange = true;
          } else if (latestPassChanged > 0 && latestPassChanged >= latestReset) {
            finalMustChange = false;
          } else {
            finalMustChange = emp.must_change_password ?? user.must_change_password ?? false;
          }

          const finalStatus = emp.employment_status !== 'active'
            ? 'suspended'
            : (finalMustChange ? 'pending_password_change' : 'active');

          if (user.must_change_password !== finalMustChange) {
            user.must_change_password = finalMustChange;
            userChanged = true;
          }
          if (user.status !== finalStatus) {
            user.status = finalStatus;
            userChanged = true;
          }

          const passChangedIso = latestPassChanged > 0 ? new Date(latestPassChanged).toISOString() : undefined;
          if (user.password_changed_at !== passChangedIso) {
            user.password_changed_at = passChangedIso;
            userChanged = true;
          }
          if (emp.password_changed_at !== passChangedIso) {
            emp.password_changed_at = passChangedIso;
            empChanged = true;
          }

          const resetIso = latestReset > 0 ? new Date(latestReset).toISOString() : undefined;
          if (user.last_password_reset_at !== resetIso) {
            user.last_password_reset_at = resetIso;
            userChanged = true;
          }
          if (emp.last_password_reset_at !== resetIso) {
            emp.last_password_reset_at = resetIso;
            empChanged = true;
          }

          if (userChanged) {
            user.updated_at = now;
            usersModified = true;
            repairedUsersCount++;
          }
        }

        if (emp.auth_account_id !== user.id) {
          emp.auth_account_id = user.id;
          empChanged = true;
        }
        if (emp.sync_status !== 'synchronized') {
          emp.sync_status = 'synchronized';
          empChanged = true;
        }
        if (emp.account_status !== user.status) {
          emp.account_status = user.status;
          empChanged = true;
        }
        if (emp.must_change_password !== user.must_change_password) {
          emp.must_change_password = user.must_change_password;
          empChanged = true;
        }
        if (user.password_hash && emp.password_hash !== user.password_hash) {
          emp.password_hash = user.password_hash;
          empChanged = true;
        }
      }

      if (empChanged) {
        this.employees[i] = { ...emp };
        employeesModified = true;
        repairedEmployeesCount++;
      }
    }

    if ((employeesModified || usersModified) && !skipSave) {
      if (employeesModified) saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
      if (usersModified) saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);

      if (actorUsername !== 'system') {
        this.addAuditLog(actorUsername, 'RECONCILE_SYSTEM_USERS', 'auth', 'system', {
          repaired_employees_count: repairedEmployeesCount,
          repaired_users_count: repairedUsersCount,
          details
        });
      }
    }

    return {
      success: true,
      repairedEmployeesCount,
      repairedUsersCount,
      details
    };
  }

  public repairSystemUserAccount(
    employeeId: string,
    actorUsername: string
  ): { success: boolean; message: string; message_en: string; account?: SystemUserAccount } {
    if (actorUsername !== 'system' &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'employee', employeeId) &&
        !this.checkActorAuthorization(actorUsername, 'users:manage_permissions', 'employee', employeeId)) {
      return {
        success: false,
        message: 'ليس لديك صلاحية إصلاح حسابات المستخدمين',
        message_en: 'You do not have permission to repair system user accounts'
      };
    }

    const empIndex = this.employees.findIndex(e => e.id === employeeId);
    if (empIndex === -1) {
      return {
        success: false,
        message: 'الموظف غير موجود',
        message_en: 'Employee not found'
      };
    }

    const emp = this.employees[empIndex];
    const now = new Date().toISOString();

    if (emp.is_system_user === false) {
      this.employees[empIndex] = {
        ...emp,
        sync_status: 'disabled',
        account_status: 'suspended',
        must_change_password: false,
        auth_account_id: undefined
      };
      const userIndex = this.systemUsers.findIndex(u => u.employee_id === employeeId);
      if (userIndex >= 0) {
        this.systemUsers[userIndex].status = 'suspended';
        this.systemUsers[userIndex].updated_at = now;
        saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
      }
      saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
      this.notify();
      return {
        success: true,
        message: 'تم تحديث حالة الموظف: موظف شركة بدون حساب دخول',
        message_en: 'Employee status updated: staff without login access'
      };
    }

    let cleanUsername = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    if (!cleanUsername) {
      if (emp.email && emp.email.includes('@')) {
        cleanUsername = emp.email.split('@')[0].trim().toLowerCase();
      } else {
        const baseName = emp.full_name_en ? emp.full_name_en.split(' ')[0].toLowerCase() : 'user';
        cleanUsername = `${baseName}.${emp.employee_code ? emp.employee_code.toLowerCase().replace(/[^a-z0-9]/g, '') : emp.id}`;
      }
      let candidate = cleanUsername;
      let counter = 1;
      while (
        this.employees.some(e => e.id !== employeeId && e.is_system_user !== false && (e.username || '').toLowerCase() === candidate) ||
        this.systemUsers.some(u => u.employee_id !== employeeId && (u.username || '').toLowerCase() === candidate)
      ) {
        candidate = `${cleanUsername}${counter++}`;
      }
      cleanUsername = candidate;
    }

    const matchingUsers = this.systemUsers.filter(u => u.employee_id === employeeId);
    let targetUser: SystemUserAccount;

    const empPassChanged = emp.password_changed_at ? new Date(emp.password_changed_at).getTime() : 0;
    const empReset = emp.last_password_reset_at ? new Date(emp.last_password_reset_at).getTime() : 0;
    const existingUser = this.systemUsers.find(u => u.employee_id === employeeId);
    const userPassChanged = existingUser?.password_changed_at ? new Date(existingUser.password_changed_at).getTime() : 0;
    const userReset = existingUser?.last_password_reset_at ? new Date(existingUser.last_password_reset_at).getTime() : 0;

    const latestPassChanged = Math.max(empPassChanged, userPassChanged);
    const latestReset = Math.max(empReset, userReset);

    let targetMustChange = false;
    if (latestReset > latestPassChanged) {
      targetMustChange = true;
    } else if (latestPassChanged > 0 && latestPassChanged >= latestReset) {
      targetMustChange = false;
    } else {
      targetMustChange = emp.must_change_password ?? existingUser?.must_change_password ?? false;
    }

    const targetStatus = emp.employment_status !== 'active'
      ? 'suspended'
      : (targetMustChange ? 'pending_password_change' : 'active');

    const passChangedIso = latestPassChanged > 0 ? new Date(latestPassChanged).toISOString() : undefined;
    const lastResetIso = latestReset > 0 ? new Date(latestReset).toISOString() : undefined;

    if (matchingUsers.length > 0) {
      targetUser = matchingUsers[0];
      targetUser.username = cleanUsername;
      targetUser.email = emp.email || targetUser.email;
      targetUser.must_change_password = targetMustChange;
      targetUser.status = targetStatus;
      targetUser.password_changed_at = passChangedIso;
      targetUser.last_password_reset_at = lastResetIso;
      targetUser.updated_at = now;

      if (matchingUsers.length > 1) {
        this.systemUsers = this.systemUsers.filter(u => u === targetUser || u.employee_id !== employeeId);
      }
    } else {
      targetUser = {
        id: `usr-${emp.id}`,
        employee_id: emp.id,
        username: cleanUsername,
        email: emp.email,
        password_hash: emp.password_hash || DEFAULT_INITIAL_PASSWORD_HASH,
        must_change_password: targetMustChange,
        status: targetStatus,
        password_changed_at: passChangedIso,
        last_password_reset_at: lastResetIso,
        is_super_admin: emp.roles?.includes('gm') || emp.roles?.includes('super_admin') || emp.id === 'emp-001',
        created_at: now,
        updated_at: now
      };
      this.systemUsers.push(targetUser);
    }

    this.employees[empIndex] = {
      ...emp,
      username: cleanUsername,
      auth_account_id: targetUser.id,
      sync_status: 'synchronized',
      is_system_user: true,
      account_status: targetStatus,
      password_hash: targetUser.password_hash || emp.password_hash || (targetMustChange ? DEFAULT_INITIAL_PASSWORD_HASH : DEMO_PASSWORD_HASH),
      must_change_password: targetMustChange,
      password_changed_at: passChangedIso,
      last_password_reset_at: lastResetIso
    };

    saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(actorUsername, 'REPAIR_USER_ACCOUNT', 'employee', employeeId, {
      employee_id: emp.id,
      username: cleanUsername,
      auth_account_id: targetUser.id,
      repaired_by: actorUsername,
      timestamp: now
    });

    this.notify();

    return {
      success: true,
      message: `تم إصلاح وتزامن حساب المستخدم (@${cleanUsername}) بنجاح`,
      message_en: `User account (@${cleanUsername}) repaired and synchronized successfully`,
      account: targetUser
    };
  }

  public repairAllSystemUserAccounts(
    actorUsername: string
  ): { success: boolean; repairedCount: number; message: string; message_en: string } {
    const res = this.reconcileAllEmployeesAndSystemUsers(actorUsername);
    const totalRepaired = res.repairedEmployeesCount + res.repairedUsersCount;
    this.notify();

    return {
      success: true,
      repairedCount: totalRepaired,
      message: `تم فحص وإصلاح التزامن لجميع الحسابات بنجاح (تم فحص ${this.employees.length} موظفاً وتحديث ${totalRepaired} سجلاً)`,
      message_en: `Synchronization check and repair completed (${this.employees.length} employees verified, ${totalRepaired} record(s) reconciled)`
    };
  }

  public authenticateUser(usernameInput: string, passwordInput?: string): AuthDiagnosticResult {
    const rawTrimmed = (usernameInput || '').trim();
    if (!rawTrimmed) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'يرجى إدخال اسم المستخدم',
        message_en: 'Please enter your username'
      };
    }

    // Sanitize username: strip any leading @ and trailing @, trim whitespace, lowercase
    const cleanUsername = rawTrimmed.replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();

    // 1. Query Authoritative System User Account first, then Employee
    let userAccount = this.systemUsers.find(u => {
      const uClean = (u.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      return uClean === cleanUsername || u.username.toLowerCase() === rawTrimmed.toLowerCase();
    });

    let emp = this.employees.find(e => {
      const eClean = (e.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      return eClean === cleanUsername || e.username.toLowerCase() === rawTrimmed.toLowerCase();
    });

    // If user account found but employee not yet resolved, lookup by employee_id
    if (userAccount && !emp) {
      emp = this.getEmployee(userAccount.employee_id);
    }
    // If employee found but user account not yet resolved, lookup by auth_account_id or employee_id
    if (emp && !userAccount) {
      userAccount = this.systemUsers.find(u => u.employee_id === emp?.id || (emp?.auth_account_id && u.id === emp.auth_account_id));
    }

    // Diagnostic 1: USER_NOT_FOUND
    if (!emp && !userAccount) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'اسم المستخدم غير موجود في سجلات الشركة',
        message_en: 'Username not found in company records'
      };
    }

    // Diagnostic 2: SYSTEM_USER_NOT_ACTIVATED (Company employee without system login access)
    if (emp && emp.is_system_user === false) {
      return {
        success: false,
        code: 'SYSTEM_USER_NOT_ACTIVATED',
        message: 'هذا الموظف مسجل كموظف شركة فقط وليس لديه صلاحية تسجيل الدخول كمستخدم نظام',
        message_en: 'This employee is registered as company staff without system login access',
        employee: emp
      };
    }

    // Diagnostic 3: ACCOUNT_REQUIRES_SETUP (Employee has is_system_user: true but account is missing or corrupt)
    if (!userAccount && emp && emp.is_system_user !== false) {
      const repairRes = this.repairSystemUserAccount(emp.id, 'system');
      if (repairRes.success && repairRes.account) {
        userAccount = repairRes.account;
      } else {
        return {
          success: false,
          code: 'ACCOUNT_REQUIRES_SETUP',
          message: 'حساب المستخدم غير مكتمل الإعداد أو يتطلب إعادة المزامنة من قِبل مسؤول النظام',
          message_en: 'User account requires setup or synchronization repair by an administrator',
          employee: emp
        };
      }
    }

    // Diagnostic 4: ACCOUNT_DISABLED (Account or employment is suspended/inactive)
    const isSuspended =
      (emp && emp.employment_status !== 'active') ||
      (emp && emp.account_status === 'suspended') ||
      (userAccount && userAccount.status === 'suspended');

    if (isSuspended) {
      return {
        success: false,
        code: 'ACCOUNT_DISABLED',
        message: 'تم إيقاف هذا الحساب. يرجى مراجعة إدارة الموارد البشرية والأنظمة',
        message_en: 'This account is suspended. Please contact HR or System Administration',
        employee: emp,
        systemUser: userAccount
      };
    }

    // Diagnostic 5: Password verification
    if (passwordInput !== undefined) {
      const expectedHash = userAccount?.password_hash || emp?.password_hash || DEFAULT_INITIAL_PASSWORD_HASH;
      const isValid =
        verifyPasswordSync(passwordInput, expectedHash) ||
        (passwordInput === '123' && expectedHash === DEFAULT_INITIAL_PASSWORD_HASH) ||
        (passwordInput === 'BctPassword2026!' && expectedHash === DEMO_PASSWORD_HASH);

      if (!isValid) {
        if (emp) {
          this.addAuditLog(emp.username, 'LOGIN_FAILED_WRONG_PASSWORD', 'auth', emp.id, {
            attempted_username: rawTrimmed
          }, undefined, true);
        }
        return {
          success: false,
          code: 'INVALID_PASSWORD',
          message: 'كلمة المرور غير صحيحة',
          message_en: 'Incorrect password',
          employee: emp,
          systemUser: userAccount
        };
      }
    }

    // Update last_login_at
    const now = new Date().toISOString();
    if (userAccount) {
      userAccount.last_login_at = now;
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    }

    // Ensure emp and userAccount reflect authoritative synchronized password change requirements
    if (emp && userAccount) {
      const empPassChanged = emp.password_changed_at ? new Date(emp.password_changed_at).getTime() : 0;
      const empReset = emp.last_password_reset_at ? new Date(emp.last_password_reset_at).getTime() : 0;
      const userPassChanged = userAccount.password_changed_at ? new Date(userAccount.password_changed_at).getTime() : 0;
      const userReset = userAccount.last_password_reset_at ? new Date(userAccount.last_password_reset_at).getTime() : 0;

      const latestPassChanged = Math.max(empPassChanged, userPassChanged);
      const latestReset = Math.max(empReset, userReset);

      let mustChange = false;
      if (latestReset > latestPassChanged) {
        mustChange = true;
      } else if (latestPassChanged > 0 && latestPassChanged >= latestReset) {
        mustChange = false;
      } else {
        mustChange = emp.must_change_password ?? userAccount.must_change_password ?? false;
      }

      emp.must_change_password = mustChange;
      userAccount.must_change_password = mustChange;
      emp.account_status = emp.employment_status !== 'active' ? 'suspended' : (mustChange ? 'pending_password_change' : 'active');
      userAccount.status = emp.account_status;
      emp.auth_account_id = userAccount.id;
      emp.sync_status = 'synchronized';
      if (latestPassChanged > 0) {
        const passIso = new Date(latestPassChanged).toISOString();
        emp.password_changed_at = passIso;
        userAccount.password_changed_at = passIso;
      }
      if (latestReset > 0) {
        const resetIso = new Date(latestReset).toISOString();
        emp.last_password_reset_at = resetIso;
        userAccount.last_password_reset_at = resetIso;
      }
    }

    if (emp) {
      this.addAuditLog(emp.username, 'LOGIN_SUCCESS', 'auth', emp.id, {
        login_at: now,
        auth_account_id: userAccount?.id
      }, undefined, true);
    }

    return {
      success: true,
      code: 'SUCCESS',
      message: 'تم تسجيل الدخول بنجاح',
      message_en: 'Login successful',
      employee: emp,
      systemUser: userAccount
    };
  }

  public createEmployee(empData: Omit<Employee, 'id' | 'employee_code'> & { id?: string; employee_code?: string }, actorUsername: string): Employee | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:create', 'employee') &&
        !this.checkActorAuthorization(actorUsername, 'users:create_system_user', 'employee')) {
      return null;
    }

    const isSystemUser = empData.is_system_user ?? Boolean(empData.username && empData.username.trim() !== '');
    let cleanUsername = (empData.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    if (isSystemUser && !cleanUsername) {
      cleanUsername = generateUniqueUsername({ ...empData }, this.employees);
    }

    if (isSystemUser) {
      const existing = this.employees.find(e => e.is_system_user !== false && e.username.trim().toLowerCase() === cleanUsername);
      if (existing) {
        return null;
      }
    }

    const id = `emp-${String(this.employees.length + 1).padStart(3, '0')}`;
    const code = empData.employee_code && empData.employee_code.trim() !== ''
      ? empData.employee_code.trim().toUpperCase()
      : `BCT-EMP-${String(this.employees.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const customJobTitle = (empData.job_title_ar || empData.job_title || '').trim();
    const job_title_ar = customJobTitle;
    const job_title_en = (empData.job_title_en || customJobTitle || '').trim();

    const newEmp: Employee = {
      ...empData,
      id,
      employee_code: code,
      username: cleanUsername,
      job_title: job_title_ar || undefined,
      job_title_ar: job_title_ar || undefined,
      job_title_en: job_title_en || undefined,
      is_system_user: isSystemUser,
      employment_status: empData.employment_status || 'active',
      joining_date: empData.joining_date || now.split('T')[0],
      account_status: isSystemUser ? (empData.account_status || 'pending_password_change') : 'suspended',
      password_hash: isSystemUser ? (empData.password_hash || DEFAULT_INITIAL_PASSWORD_HASH) : undefined,
      must_change_password: isSystemUser ? (empData.must_change_password ?? true) : false,
      auth_account_id: isSystemUser ? `usr-${id}` : undefined,
      sync_status: isSystemUser ? 'synchronized' : 'disabled',
      roles: isSystemUser ? (empData.roles && empData.roles.length > 0 ? empData.roles : (empData.position_id ? [empData.position_id as string] : [])) : []
    };

    if (isSystemUser) {
      const newAccount: SystemUserAccount = {
        id: `usr-${id}`,
        employee_id: id,
        username: cleanUsername,
        email: newEmp.email,
        password_hash: newEmp.password_hash || DEFAULT_INITIAL_PASSWORD_HASH,
        must_change_password: newEmp.must_change_password ?? true,
        status: newEmp.account_status || 'pending_password_change',
        is_super_admin: false,
        created_at: now,
        updated_at: now
      };
      this.systemUsers.push(newAccount);
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    }

    this.employees.push(newEmp);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog(actorUsername, 'CREATE_EMPLOYEE', 'employee', id, newEmp);

    if (isSystemUser) {
      this.addAuditLog(actorUsername, 'CREATE_SYSTEM_USER', 'employee', id, {
        username: newEmp.username,
        initial_password_temp: true,
        must_change_password: true,
        account_status: newEmp.account_status
      });
    }

    this.notify();
    return newEmp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>, actorUsername: string): Employee | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'employee', id)) {
      return null;
    }
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return null;
    const old = this.employees[index];
    const now = new Date().toISOString();

    if (updates.username) {
      updates.username = updates.username.trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
    }

    // Protect against deactivating the last active Super Admin
    if (updates.employment_status && updates.employment_status !== 'active') {
      if (rbacService.isSuperAdmin(old)) {
        const otherAdmins = this.employees.filter(
          e => e.id !== id && e.employment_status === 'active' && rbacService.isSuperAdmin(e)
        );
        if (otherAdmins.length === 0) {
          this.addAuditLog(actorUsername, 'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION', 'employee', id);
          return null;
        }
      }
    }

    // System User status transitions
    const wasSystemUser = old.is_system_user !== false;
    const willBeSystemUser = updates.is_system_user !== undefined ? updates.is_system_user : wasSystemUser;

    if (wasSystemUser && !willBeSystemUser) {
      if (rbacService.isSuperAdmin(old)) {
        const otherAdmins = this.employees.filter(
          e => e.id !== id && e.is_system_user !== false && e.employment_status === 'active' && rbacService.isSuperAdmin(e)
        );
        if (otherAdmins.length === 0) {
          this.addAuditLog(actorUsername, 'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION', 'employee', id);
          return null;
        }
      }
      updates.is_system_user = false;
      updates.account_status = 'suspended';
      updates.must_change_password = false;
      updates.sync_status = 'disabled';
      updates.auth_account_id = undefined;
    } else if (!wasSystemUser && willBeSystemUser) {
      if (!updates.username && !old.username) {
        updates.username = generateUniqueUsername({ ...old, ...updates }, this.employees, id);
      }
      if (!old.password_hash && !updates.password_hash) {
        updates.password_hash = DEFAULT_INITIAL_PASSWORD_HASH;
        updates.must_change_password = true;
        updates.account_status = 'pending_password_change';
      } else {
        updates.account_status = (updates.must_change_password ?? old.must_change_password) ? 'pending_password_change' : 'active';
      }
      updates.sync_status = 'synchronized';
      updates.auth_account_id = `usr-${id}`;
    }

    // Synchronize with SystemUserAccount
    let userIndex = this.systemUsers.findIndex(u => u.employee_id === id);
    if (willBeSystemUser) {
      const cleanUsername = updates.username || old.username;
      if (userIndex >= 0) {
        this.systemUsers[userIndex] = {
          ...this.systemUsers[userIndex],
          username: cleanUsername,
          email: updates.email || old.email,
          status: updates.account_status || this.systemUsers[userIndex].status,
          password_hash: updates.password_hash || this.systemUsers[userIndex].password_hash,
          must_change_password: updates.must_change_password ?? this.systemUsers[userIndex].must_change_password,
          updated_at: now
        };
      } else {
        this.systemUsers.push({
          id: `usr-${id}`,
          employee_id: id,
          username: cleanUsername,
          email: updates.email || old.email,
          password_hash: updates.password_hash || DEFAULT_INITIAL_PASSWORD_HASH,
          must_change_password: updates.must_change_password ?? true,
          status: updates.account_status || 'pending_password_change',
          is_super_admin: old.roles?.includes('gm') || old.roles?.includes('super_admin') || id === 'emp-001',
          created_at: now,
          updated_at: now
        });
      }
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    } else if (userIndex >= 0) {
      this.systemUsers[userIndex].status = 'suspended';
      this.systemUsers[userIndex].updated_at = now;
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    }

    if (updates.job_title !== undefined || updates.job_title_ar !== undefined) {
      const customTitle = (updates.job_title_ar !== undefined ? updates.job_title_ar : (updates.job_title || '')).trim();
      updates.job_title = customTitle;
      updates.job_title_ar = customTitle;
      updates.job_title_en = updates.job_title_en !== undefined ? updates.job_title_en.trim() : customTitle;
    } else if (updates.position_id && !old.job_title_ar && !old.job_title) {
      const pos = this.positions[updates.position_id];
      if (pos) {
        if (!updates.job_title_ar) updates.job_title_ar = pos.title_ar;
        if (!updates.job_title_en) updates.job_title_en = pos.title_en;
        updates.job_title = pos.title_ar;
      }
    }

    this.employees[index] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog(actorUsername, 'UPDATE_EMPLOYEE', 'employee', id, updates, old);

    if (wasSystemUser && !willBeSystemUser) {
      this.addAuditLog(actorUsername, 'DEACTIVATE_SYSTEM_USER', 'employee', id, {
        username: old.username,
        account_status: 'suspended'
      });
    } else if (!wasSystemUser && willBeSystemUser) {
      this.addAuditLog(actorUsername, 'ACTIVATE_SYSTEM_USER', 'employee', id, {
        username: updates.username || old.username,
        account_status: updates.account_status,
        must_change_password: updates.must_change_password
      });
    }

    this.notify();
    return this.employees[index];
  }

  public toggleSystemUserStatus(
    employeeId: string,
    isEnabled: boolean,
    actorUsername: string
  ): { success: boolean; message?: string } {
    const requiredPerm = isEnabled ? 'users:activate_system_user' : 'users:deactivate_system_user';
    if (!this.checkActorAuthorization(actorUsername, requiredPerm, 'employee', employeeId) &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'employee', employeeId)) {
      return {
        success: false,
        message: isEnabled 
          ? 'ليس لديك صلاحية تفعيل مستخدم النظام (users:activate_system_user مطلوبة)'
          : 'ليس لديك صلاحية إيقاف مستخدم النظام (users:deactivate_system_user مطلوبة)'
      };
    }

    const index = this.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      return { success: false, message: 'الموظف غير موجود' };
    }

    const old = this.employees[index];
    const now = new Date().toISOString();

    if (!isEnabled && rbacService.isSuperAdmin(old)) {
      const otherAdmins = this.employees.filter(
        e => e.id !== employeeId && e.is_system_user !== false && e.employment_status === 'active' && rbacService.isSuperAdmin(e)
      );
      if (otherAdmins.length === 0) {
        this.addAuditLog(actorUsername, 'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION', 'employee', employeeId);
        return { success: false, message: 'لا يمكن إيقاف حساب المدير العام أو المسؤول الوحيد للنظام.' };
      }
    }

    const updates: Partial<Employee> = {
      is_system_user: isEnabled,
      sync_status: isEnabled ? 'synchronized' : 'disabled'
    };

    let cleanUsername = (old.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();

    if (isEnabled) {
      if (!cleanUsername) {
        cleanUsername = generateUniqueUsername(old, this.employees, employeeId);
      }
      updates.username = cleanUsername;

      if (!old.password_hash) {
        updates.password_hash = DEFAULT_INITIAL_PASSWORD_HASH;
        updates.must_change_password = true;
        updates.account_status = 'pending_password_change';
      } else {
        updates.account_status = old.must_change_password ? 'pending_password_change' : 'active';
      }
      updates.auth_account_id = `usr-${employeeId}`;
      updates.sync_status = 'synchronized';
    } else {
      updates.is_system_user = false;
      updates.account_status = 'suspended';
      updates.must_change_password = false;
      updates.sync_status = 'disabled';
      updates.auth_account_id = undefined;
    }

    // Sync with SystemUserAccount
    let userIndex = this.systemUsers.findIndex(u => u.employee_id === employeeId);
    if (isEnabled) {
      if (userIndex >= 0) {
        this.systemUsers[userIndex] = {
          ...this.systemUsers[userIndex],
          username: cleanUsername,
          status: updates.account_status as any,
          password_hash: updates.password_hash || this.systemUsers[userIndex].password_hash,
          must_change_password: updates.must_change_password ?? this.systemUsers[userIndex].must_change_password,
          updated_at: now
        };
      } else {
        this.systemUsers.push({
          id: `usr-${employeeId}`,
          employee_id: employeeId,
          username: cleanUsername,
          email: old.email || `${cleanUsername}@bct.edu`,
          password_hash: updates.password_hash || DEFAULT_INITIAL_PASSWORD_HASH,
          must_change_password: updates.must_change_password ?? true,
          status: updates.account_status as any || 'pending_password_change',
          is_super_admin: old.roles?.includes('gm') || old.roles?.includes('super_admin') || employeeId === 'emp-001',
          created_at: now,
          updated_at: now
        });
      }
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    } else if (userIndex >= 0) {
      this.systemUsers[userIndex].status = 'suspended';
      this.systemUsers[userIndex].updated_at = now;
      saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    }

    if (updates.job_title !== undefined || updates.job_title_ar !== undefined) {
      const customTitle = (updates.job_title_ar !== undefined ? updates.job_title_ar : (updates.job_title || '')).trim();
      updates.job_title = customTitle;
      updates.job_title_ar = customTitle;
      updates.job_title_en = updates.job_title_en !== undefined ? updates.job_title_en.trim() : customTitle;
    } else if (updates.position_id && !old.job_title_ar && !old.job_title) {
      const pos = this.positions[updates.position_id];
      if (pos) {
        if (!updates.job_title_ar) updates.job_title_ar = pos.title_ar;
        if (!updates.job_title_en) updates.job_title_en = pos.title_en;
        updates.job_title = pos.title_ar;
      }
    }

    this.employees[index] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(
      actorUsername,
      isEnabled ? 'ACTIVATE_SYSTEM_USER' : 'DEACTIVATE_SYSTEM_USER',
      'employee',
      employeeId,
      { is_system_user: isEnabled, username: old.username, status: updates.account_status }
    );

    this.notify();
    return { success: true };
  }

  public resetUserPassword(
    employeeId: string,
    actorUsername: string
  ): { success: boolean; tempPassword?: string; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'users:reset_password', 'employee', employeeId)) {
      return {
        success: false,
        message: 'ليس لديك صلاحية إعادة تعيين كلمة المرور (users:reset_password مطلوبة)'
      };
    }

    const index = this.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      return { success: false, message: 'الموظف غير موجود' };
    }

    const emp = this.employees[index];
    if (emp.is_system_user === false) {
      return {
        success: false,
        message: 'لا يمكن إعادة تعيين كلمة المرور لموظف ليس لديه حساب مستخدم في النظام'
      };
    }

    const now = new Date().toISOString();
    this.employees[index] = {
      ...emp,
      password_hash: DEFAULT_INITIAL_PASSWORD_HASH,
      must_change_password: true,
      account_status: 'pending_password_change',
      last_password_reset_at: now,
      password_changed_at: undefined,
      sync_status: 'synchronized'
    };

    // Synchronize with SystemUserAccount
    let userIndex = this.systemUsers.findIndex(u => u.employee_id === employeeId);
    if (userIndex >= 0) {
      this.systemUsers[userIndex] = {
        ...this.systemUsers[userIndex],
        password_hash: DEFAULT_INITIAL_PASSWORD_HASH,
        must_change_password: true,
        status: 'pending_password_change',
        last_password_reset_at: now,
        password_changed_at: undefined,
        updated_at: now
      };
    } else {
      const cleanUsername = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      this.systemUsers.push({
        id: `usr-${employeeId}`,
        employee_id: employeeId,
        username: cleanUsername,
        email: emp.email,
        password_hash: DEFAULT_INITIAL_PASSWORD_HASH,
        must_change_password: true,
        status: 'pending_password_change',
        is_super_admin: emp.roles?.includes('gm') || emp.roles?.includes('super_admin') || employeeId === 'emp-001',
        last_password_reset_at: now,
        password_changed_at: undefined,
        created_at: now,
        updated_at: now
      });
    }

    saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(actorUsername, 'RESET_USER_PASSWORD', 'employee', employeeId, {
      username: emp.username,
      reset_at: now,
      must_change_password: true,
      reset_by: actorUsername
    });

    this.notify();
    return {
      success: true,
      tempPassword: DEFAULT_INITIAL_PASSWORD,
      message: 'تمت إعادة تعيين كلمة المرور بنجاح إلى كلمة المرور المؤقتة (123)'
    };
  }

  public changeUserPassword(
    employeeId: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message?: string } {
    const index = this.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    const emp = this.employees[index];
    if (emp.is_system_user === false) {
      return { success: false, message: 'هذا الحساب ليس لديه صلاحية تسجيل الدخول للنظام' };
    }

    let userIndex = this.systemUsers.findIndex(u => u.employee_id === employeeId);
    const userAccount = userIndex >= 0 ? this.systemUsers[userIndex] : undefined;

    const currentHash = userAccount?.password_hash || emp.password_hash || DEFAULT_INITIAL_PASSWORD_HASH;
    const isCurrentValid =
      verifyPasswordSync(currentPassword, currentHash) ||
      (currentPassword === '123' && currentHash === DEFAULT_INITIAL_PASSWORD_HASH) ||
      (currentPassword === 'BctPassword2026!' && currentHash === DEMO_PASSWORD_HASH);

    if (!isCurrentValid) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }

    const strength = validatePasswordStrength(newPassword, currentPassword);
    if (!strength.isValid) {
      return { success: false, message: strength.messageAr };
    }

    const now = new Date().toISOString();
    const newHash = hashPasswordSync(newPassword);

    this.employees[index] = {
      ...emp,
      password_hash: newHash,
      must_change_password: false,
      account_status: 'active',
      password_changed_at: now,
      sync_status: 'synchronized'
    };

    if (userIndex >= 0) {
      this.systemUsers[userIndex] = {
        ...this.systemUsers[userIndex],
        password_hash: newHash,
        must_change_password: false,
        status: 'active',
        password_changed_at: now,
        updated_at: now
      };
    } else {
      const cleanUsername = (emp.username || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
      this.systemUsers.push({
        id: `usr-${employeeId}`,
        employee_id: employeeId,
        username: cleanUsername,
        email: emp.email,
        password_hash: newHash,
        must_change_password: false,
        status: 'active',
        is_super_admin: emp.roles?.includes('gm') || emp.roles?.includes('super_admin') || employeeId === 'emp-001',
        password_changed_at: now,
        created_at: now,
        updated_at: now
      });
    }

    saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(emp.username, 'CHANGE_FIRST_LOGIN_PASSWORD', 'employee', employeeId, {
      username: emp.username,
      changed_at: now,
      password_updated: true
    });

    this.notify();
    return { success: true };
  }

  public updateEmployeePermissions(
    id: string,
    roles: string[],
    permissions: string[],
    overrides: Record<string, boolean>,
    actorUsername: string
  ): boolean {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'employee', id)) {
      return false;
    }
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    const old = this.employees[index];

    // Protect last active super admin from losing administrative privileges
    if (rbacService.isSuperAdmin(old)) {
      const otherAdmins = this.employees.filter(
        e => e.id !== id && e.employment_status === 'active' && rbacService.isSuperAdmin(e)
      );
      if (otherAdmins.length === 0) {
        if (!roles.includes('gm') && !roles.includes('super_admin')) {
          this.addAuditLog(actorUsername, 'SECURITY_BLOCK_LAST_ADMIN_PRIVILEGE_STRIP', 'employee', id);
          return false;
        }
      }
    }

    this.employees[index] = {
      ...old,
      roles,
      permissions,
      permission_overrides: overrides,
      custom_permissions: Object.keys(overrides).filter(k => overrides[k])
    };
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog(actorUsername, 'UPDATE_EMPLOYEE_PERMISSIONS', 'employee', id, { roles, permissions, overrides }, old);
    this.notify();
    return true;
  }

  public deleteEmployee(id: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'users:delete', 'employee', id)) {
      return { success: false, message: 'ليس لديك صلاحية حذف أو أرشفة الموظفين (users:delete مطلوبة)' };
    }
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return { success: false, message: 'الموظف غير موجود' };

    // Protect against deleting the only active Super Admin
    if (emp.position_id === 'gm' || emp.roles.includes('super_admin') || rbacService.isSuperAdmin(emp)) {
      const activeAdmins = this.employees.filter(
        e => rbacService.isSuperAdmin(e) && e.employment_status === 'active' && e.id !== id
      );
      if (activeAdmins.length === 0) {
        return { success: false, message: 'لا يمكن حذف أو تعطيل المدير العام أو المدير المسؤول الوحيد للنظام.' };
      }
    }

    // Soft delete / archive to preserve historical files, payments, approvals
    const old = { ...emp };
    emp.employment_status = 'terminated';
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
    this.addAuditLog(actorUsername, 'DELETE_EMPLOYEE', 'employee', id, { status: 'terminated' }, old);
    this.notify();
    return { success: true };
  }

  // --- Departments (Fix 07) ---
  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public createDepartment(deptData: Omit<Department, 'id'>, actorUsername: string): Department | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:create', 'department')) {
      return null;
    }
    const id = `dept-${Date.now().toString().slice(-4)}`;
    const newDept: Department = { ...deptData, id };
    this.departments.push(newDept);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);
    this.addAuditLog(actorUsername, 'CREATE_DEPARTMENT', 'department', id, newDept);
    this.notify();
    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>, actorUsername: string): Department | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'department', id)) {
      return null;
    }
    const index = this.departments.findIndex(d => d.id === id);
    if (index === -1) return null;
    const old = this.departments[index];
    this.departments[index] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);
    this.addAuditLog(actorUsername, 'UPDATE_DEPARTMENT', 'department', id, updates, old);
    this.notify();
    return this.departments[index];
  }

  public deleteDepartment(id: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'users:delete', 'department', id)) {
      return { success: false, message: 'ليس لديك صلاحية حذف الأقسام (users:delete مطلوبة)' };
    }
    const dept = this.departments.find(d => d.id === id || d.code === id);
    if (!dept) return { success: false, message: 'القسم غير موجود' };

    // Protect General Management
    if (dept.id === 'gm' || dept.code === 'gm') {
      return { success: false, message: 'الإدارة العامة هي الهيكل السيادي الأساسي للشركة ولا يمكن حذفها.' };
    }

    // Check if active employees belong to this department
    const activeDeptStaff = this.employees.filter(
      e => (e.department_id === dept.id || e.department_id === dept.code) && e.employment_status === 'active'
    );
    if (activeDeptStaff.length > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا القسم نظراً لوجود (${activeDeptStaff.length}) موظف نشط مسندين إليه. يرجى إعادة تعيين الموظفين أولاً.`
      };
    }

    // Remove department
    const old = { ...dept };
    this.departments = this.departments.filter(d => d.id !== dept.id);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);
    this.addAuditLog(actorUsername, 'DELETE_DEPARTMENT', 'department', String(dept.id), null, old);
    this.notify();
    return { success: true };
  }

  // --- Granular Department Report Permissions ---
  public updateDepartmentReportPermissions(
    departmentId: string,
    reportPermissions: Record<string, boolean>,
    actorUsername: string
  ): { success: boolean; message?: string; department?: Department } {
    if (!this.checkActorAuthorization(actorUsername, 'settings:view', 'department_report_permissions', departmentId) &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'department_report_permissions', departmentId) &&
        !this.checkActorAuthorization(actorUsername, 'users:manage_permissions', 'department_report_permissions', departmentId)) {
      return { success: false, message: 'غير مصرح لك بتعديل صلاحيات تقارير الإدارة' };
    }

    const index = this.departments.findIndex(d => d.id === departmentId || d.code === departmentId);
    if (index === -1) {
      return { success: false, message: 'الإدارة غير موجودة' };
    }

    const oldDept = this.departments[index];
    const oldPerms = { ...(oldDept.report_permissions || {}) };
    const updatedDept: Department = {
      ...oldDept,
      report_permissions: { ...reportPermissions }
    };

    this.departments[index] = updatedDept;
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);

    this.addAuditLog(
      actorUsername,
      'UPDATE_DEPARTMENT_REPORT_PERMISSIONS',
      'department',
      String(updatedDept.id),
      {
        department_id: updatedDept.id,
        new_permissions: reportPermissions
      },
      {
        previous_permissions: oldPerms
      }
    );

    this.notify();
    return { success: true, department: updatedDept };
  }

  /**
   * Immediately updates a single report's permission for a department and persists to database
   */
  public setDepartmentSingleReportPermission(
    departmentId: string,
    reportId: string,
    allowed: boolean,
    actorUsername: string
  ): { success: boolean; message?: string; department?: Department } {
    const dept = this.departments.find(d => d.id === departmentId || d.code === departmentId);
    if (!dept) return { success: false, message: 'الإدارة غير موجودة' };

    const currentPerms = { ...(dept.report_permissions || {}) };
    currentPerms[reportId] = allowed;

    return this.updateDepartmentReportPermissions(dept.id, currentPerms, actorUsername);
  }

  /**
   * Immediately grants or revokes all reports for a department and persists to database
   */
  public setDepartmentAllReportsPermission(
    departmentId: string,
    allowed: boolean,
    actorUsername: string,
    targetDeptCategory?: string
  ): { success: boolean; message?: string; department?: Department } {
    const dept = this.departments.find(d => d.id === departmentId || d.code === departmentId);
    if (!dept) return { success: false, message: 'الإدارة غير موجودة' };

    const currentPerms = { ...(dept.report_permissions || {}) };
    const targetReports = targetDeptCategory
      ? SYSTEM_REPORTS.filter(r => r.departmentId === targetDeptCategory)
      : SYSTEM_REPORTS;

    targetReports.forEach(r => {
      currentPerms[r.id] = allowed;
    });

    return this.updateDepartmentReportPermissions(dept.id, currentPerms, actorUsername);
  }

  // --- Granular Employee Report Overrides ---
  public updateEmployeeReportPermissions(
    employeeId: string,
    reportOverrides: Record<string, boolean>,
    actorUsername: string
  ): { success: boolean; message?: string; employee?: Employee } {
    if (!this.checkActorAuthorization(actorUsername, 'settings:view', 'employee_report_permissions', employeeId) &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'employee_report_permissions', employeeId)) {
      return { success: false, message: 'غير مصرح لك بتعديل استثناءات التقارير للموظف' };
    }

    const index = this.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      return { success: false, message: 'الموظف غير موجود' };
    }

    const oldEmp = this.employees[index];
    const oldOverrides = { ...(oldEmp.report_overrides || {}) };

    // Synchronize both report_overrides and permission_overrides ('report:<id>')
    const updatedPermissionOverrides = { ...(oldEmp.permission_overrides || {}) };
    Object.entries(reportOverrides).forEach(([k, v]) => {
      const permKey = k.startsWith('report:') ? k : `report:${k}`;
      updatedPermissionOverrides[permKey] = v;
    });

    const updatedEmp: Employee = {
      ...oldEmp,
      report_overrides: { ...reportOverrides },
      permission_overrides: updatedPermissionOverrides
    };

    this.employees[index] = updatedEmp;
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(
      actorUsername,
      'UPDATE_EMPLOYEE_REPORT_PERMISSIONS',
      'employee',
      updatedEmp.id,
      {
        employee_id: updatedEmp.id,
        new_report_overrides: reportOverrides
      },
      {
        previous_report_overrides: oldOverrides
      }
    );

    this.notify();
    return { success: true, employee: updatedEmp };
  }

  /**
   * Immediately sets or clears an employee's report override (inherit, grant, deny) and persists to database
   */
  public setEmployeeSingleReportOverride(
    employeeId: string,
    reportId: string,
    mode: 'inherit' | 'grant' | 'deny',
    actorUsername: string
  ): { success: boolean; message?: string; employee?: Employee } {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'الموظف غير موجود' };

    const currentOverrides = { ...(emp.report_overrides || {}) };

    if (mode === 'inherit') {
      delete currentOverrides[reportId];
      delete currentOverrides[`report:${reportId}`];
    } else if (mode === 'grant') {
      currentOverrides[reportId] = true;
    } else if (mode === 'deny') {
      currentOverrides[reportId] = false;
    }

    return this.updateEmployeeReportPermissions(employeeId, currentOverrides, actorUsername);
  }

  // --- Granular Department Dashboard & Widget Permissions ---
  public updateDepartmentDashboardPermissions(
    departmentId: string,
    dashboardPermissions: Record<string, boolean>,
    actorUsername: string
  ): { success: boolean; message?: string; department?: Department } {
    if (!this.checkActorAuthorization(actorUsername, 'settings:view', 'department_dashboard_permissions', departmentId) &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'department_dashboard_permissions', departmentId) &&
        !this.checkActorAuthorization(actorUsername, 'users:manage_permissions', 'department_dashboard_permissions', departmentId)) {
      return { success: false, message: 'غير مصرح لك بتعديل صلاحيات لوحات المؤشرات للإدارة' };
    }

    const index = this.departments.findIndex(d => d.id === departmentId || d.code === departmentId);
    if (index === -1) {
      return { success: false, message: 'الإدارة غير موجودة' };
    }

    const oldDept = this.departments[index];
    const oldPerms = { ...(oldDept.dashboard_permissions || {}) };

    const updatedDept: Department = {
      ...oldDept,
      dashboard_permissions: { ...dashboardPermissions }
    };

    this.departments[index] = updatedDept;
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);

    this.addAuditLog(
      actorUsername,
      'UPDATE_DEPARTMENT_DASHBOARD_PERMISSIONS',
      'department',
      updatedDept.id,
      {
        department_id: updatedDept.id,
        new_dashboard_permissions: dashboardPermissions
      },
      {
        previous_dashboard_permissions: oldPerms
      }
    );

    this.notify();
    return { success: true, department: updatedDept };
  }

  public setDepartmentDashboardWidgetPermission(
    departmentId: string,
    widgetId: string,
    allowed: boolean,
    actorUsername: string
  ): { success: boolean; message?: string; department?: Department } {
    const dept = this.departments.find(d => d.id === departmentId || d.code === departmentId);
    if (!dept) return { success: false, message: 'الإدارة غير موجودة' };

    const currentPerms = { ...(dept.dashboard_permissions || {}) };
    currentPerms[widgetId] = allowed;

    return this.updateDepartmentDashboardPermissions(dept.id, currentPerms, actorUsername);
  }

  public setDepartmentAllDashboardWidgetsPermission(
    departmentId: string,
    dashboard: 'general' | 'executive' | 'all',
    allowed: boolean,
    actorUsername: string
  ): { success: boolean; message?: string; department?: Department } {
    const dept = this.departments.find(d => d.id === departmentId || d.code === departmentId);
    if (!dept) return { success: false, message: 'الإدارة غير موجودة' };

    const currentPerms = { ...(dept.dashboard_permissions || {}) };
    const targets = dashboard === 'general'
      ? GENERAL_DASHBOARD_ELEMENTS
      : dashboard === 'executive'
      ? EXECUTIVE_DASHBOARD_ELEMENTS
      : ALL_DASHBOARD_ELEMENTS;

    targets.forEach(w => {
      currentPerms[w.id] = allowed;
    });

    if (dashboard === 'all') {
      currentPerms['*'] = allowed;
      currentPerms['dash:*'] = allowed;
    }

    return this.updateDepartmentDashboardPermissions(dept.id, currentPerms, actorUsername);
  }

  // --- Granular Employee Dashboard Overrides ---
  public updateEmployeeDashboardPermissions(
    employeeId: string,
    dashboardOverrides: Record<string, boolean>,
    actorUsername: string
  ): { success: boolean; message?: string; employee?: Employee } {
    if (!this.checkActorAuthorization(actorUsername, 'settings:view', 'employee_dashboard_overrides', employeeId) &&
        !this.checkActorAuthorization(actorUsername, 'users:edit', 'employee_dashboard_overrides', employeeId) &&
        !this.checkActorAuthorization(actorUsername, 'users:manage_permissions', 'employee_dashboard_overrides', employeeId)) {
      return { success: false, message: 'غير مصرح لك بتعديل استثناءات لوحات المؤشرات للموظف' };
    }

    const index = this.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
      return { success: false, message: 'الموظف غير موجود' };
    }

    const oldEmp = this.employees[index];
    const oldOverrides = { ...(oldEmp.dashboard_overrides || {}) };

    const updatedEmp: Employee = {
      ...oldEmp,
      dashboard_overrides: { ...dashboardOverrides }
    };

    this.employees[index] = updatedEmp;
    saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);

    this.addAuditLog(
      actorUsername,
      'UPDATE_EMPLOYEE_DASHBOARD_OVERRIDES',
      'employee',
      updatedEmp.id,
      {
        employee_id: updatedEmp.id,
        new_dashboard_overrides: dashboardOverrides
      },
      {
        previous_dashboard_overrides: oldOverrides
      }
    );

    this.notify();
    return { success: true, employee: updatedEmp };
  }

  public setEmployeeDashboardWidgetOverride(
    employeeId: string,
    widgetId: string,
    mode: 'inherit' | 'grant' | 'deny',
    actorUsername: string
  ): { success: boolean; message?: string; employee?: Employee } {
    const emp = this.employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'الموظف غير موجود' };

    const currentOverrides = { ...(emp.dashboard_overrides || {}) };

    if (mode === 'inherit') {
      delete currentOverrides[widgetId];
    } else if (mode === 'grant') {
      currentOverrides[widgetId] = true;
    } else if (mode === 'deny') {
      currentOverrides[widgetId] = false;
    }

    return this.updateEmployeeDashboardPermissions(employeeId, currentOverrides, actorUsername);
  }

  // --- Secure Backend API: Dashboard Widget Data Query ---
  public getDashboardWidgetData(
    widgetId: string,
    actorUsername: string
  ): { success: boolean; data?: any; error?: string; code?: number } {
    const isSys =
      actorUsername === 'system' ||
      actorUsername === 'system_auto';
    const actor = this.getEmployeeByUsername(actorUsername);

    if (!isSys) {
      if (!actor) {
        return { success: false, error: 'Unauthorized: User identity not found', code: 401 };
      }
      const canView = rbacService.canViewDashboardWidget(actor, widgetId, this.positions, this.departments);
      if (!canView) {
        this.addAuditLog(
          actorUsername,
          'SECURITY_ACCESS_DENIED_DASHBOARD_WIDGET',
          'dashboard_widget',
          widgetId,
          {
            widget_id: widgetId,
            reason: 'Unauthorized dashboard widget query attempt'
          }
        );
        return {
          success: false,
          error: `حجب الوصول (403): ليس لديك صلاحية للاطلاع على بيانات هذا العنصر (${widgetId})`,
          code: 403
        };
      }
    }

    return {
      success: true,
      data: {
        widgetId,
        queriedAt: new Date().toISOString(),
        status: 'authorized'
      }
    };
  }

  // --- Secure End-to-End Report Data Query ---
  public getReportData(
    reportId: string,
    actorUsername: string,
    params?: any
  ): { success: boolean; data?: any; error?: string; code?: number } {
    const isSys =
      actorUsername === 'system' ||
      actorUsername === 'system_auto' ||
      actorUsername === 'admin' ||
      actorUsername === 'bashdar.gm';
    const actor = this.getEmployeeByUsername(actorUsername);

    if (!isSys) {
      if (!actor || actor.employment_status !== 'active') {
        return {
          success: false,
          error: 'غير مصرح: المستخدم غير مسجل أو حسابه غير نشط',
          code: 401
        };
      }

      const hasAccess = rbacService.canViewReport(actor, reportId, this.positions, this.departments);
      if (!hasAccess) {
        this.addAuditLog(
          actorUsername,
          'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT',
          'report',
          reportId,
          {
            report_id: reportId,
            reason: 'Direct API data query blocked by Granular Visibility Permissions'
          }
        );
        return {
          success: false,
          error: 'غير مصرح: ليس لديك صلاحية للاطلاع على بيانات هذا التقرير',
          code: 403
        };
      }
    }

    // Return the authorized report data payload
    const data = this.buildReportPayload(reportId, params);
    return { success: true, data };
  }

  private buildReportPayload(reportId: string, params?: any): any {
    const actor = params?.actorUsername ? this.getEmployeeByUsername(params.actorUsername) : null;
    const actorName = actor ? `${actor.full_name_ar} (${actor.job_title_ar})` : 'النظام الإداري BCT';

    return ReportDataService.generate(
      reportId,
      params,
      {
        files: this.getStudentFiles(),
        payments: this.getPayments(),
        expenses: this.getExpenses ? this.getExpenses() : [],
        complaints: this.getComplaints(),
        campaigns: this.getCampaigns(),
        auditLogs: this.getAuditLogs(),
        employees: this.getEmployees(),
        budgets: this.getBudgets ? this.getBudgets() : [],
        incentives: this.getIncentivePolicies ? this.getIncentivePolicies() : [],
        tasks: this.getTasks ? this.getTasks() : [],
        universities: this.getUniversities ? this.getUniversities() : [],
        financialAccounts: this.getFinancialAccounts ? this.getFinancialAccounts() : [],
        departments: this.getDepartments(),
        positions: this.getJobPositions()
      },
      actorName
    );
  }

  public getJobPositions(): Record<string, JobPosition> {
    return { ...this.positions };
  }

  public getEmployeeJobTitle(
    target: Employee | SystemUserAccount | string | null | undefined,
    language: 'ar' | 'en' = 'ar'
  ): string {
    if (!target) {
      return language === 'ar' ? 'موظف معتمد' : 'Authorized Staff';
    }

    let emp: Employee | undefined;
    if (typeof target === 'string') {
      emp = this.getEmployee(target);
      if (!emp) {
        const sysUser = this.systemUsers.find(u => u.id === target || u.username === target);
        if (sysUser) {
          emp = this.getEmployee(sysUser.employee_id);
        }
      }
    } else if ('employee_id' in target && !('position_id' in target)) {
      emp = this.getEmployee((target as SystemUserAccount).employee_id);
    } else {
      emp = target as Employee;
    }

    if (!emp) {
      return language === 'ar' ? 'موظف معتمد' : 'Authorized Staff';
    }

    // 1. Direct fields on employee record (supporting multiple naming variants)
    const rawAny = emp as any;
    const titleAr = emp.job_title_ar || rawAny.job_title || rawAny.title_ar || rawAny.position_title_ar;
    const titleEn = emp.job_title_en || rawAny.job_title || rawAny.title_en || rawAny.position_title_en;

    if (language === 'ar' && titleAr && String(titleAr).trim()) {
      return String(titleAr).trim();
    }
    if (language === 'en' && titleEn && String(titleEn).trim()) {
      return String(titleEn).trim();
    }

    // 2. Position lookup via position_id or job_title_code
    const posId = emp.position_id || emp.job_title_code;
    if (posId) {
      const pos = this.positions[posId] || INITIAL_POSITIONS[posId];
      if (pos) {
        if (language === 'ar' && pos.title_ar && pos.title_ar.trim()) {
          return pos.title_ar.trim();
        }
        if (language === 'en' && pos.title_en && pos.title_en.trim()) {
          return pos.title_en.trim();
        }
      }
    }

    // 3. Department head fallback if employee is department head
    if (emp.department_id) {
      const dept = this.departments.find(d => d.id === emp?.department_id) || INITIAL_DEPARTMENTS.find(d => d.id === emp?.department_id);
      if (dept && (Boolean(posId && dept.roles?.includes(posId as any)) || emp.id === 'emp-001')) {
        if (language === 'ar' && dept.head_title_ar && dept.head_title_ar.trim()) {
          return dept.head_title_ar.trim();
        }
        if (language === 'en' && dept.head_title_en && dept.head_title_en.trim()) {
          return dept.head_title_en.trim();
        }
      }
    }

    // 4. Cross-language fallback before generic default
    if (language === 'ar' && titleEn && String(titleEn).trim()) {
      return String(titleEn).trim();
    }
    if (language === 'en' && titleAr && String(titleAr).trim()) {
      return String(titleAr).trim();
    }

    // 5. Fallback from position in opposite language
    if (posId) {
      const pos = this.positions[posId] || INITIAL_POSITIONS[posId];
      if (pos) {
        if (pos.title_ar && pos.title_ar.trim()) return pos.title_ar.trim();
        if (pos.title_en && pos.title_en.trim()) return pos.title_en.trim();
      }
    }

    // 6. Ultimate fallback (Never empty, never raw code like 'gm')
    return language === 'ar' ? 'موظف معتمد' : 'Authorized Staff';
  }

  public updateJobPosition(code: string, updates: Partial<JobPosition>, actorUsername: string): JobPosition | null {
    const isAuthorized =
      actorUsername === 'admin' ||
      actorUsername === 'system' ||
      actorUsername === 'system_auto' ||
      actorUsername === 'bashdar.gm' ||
      this.checkActorAuthorization(actorUsername, 'settings:edit', 'job_position', code) ||
      this.checkActorAuthorization(actorUsername, 'settings:view', 'job_position', code) ||
      this.checkActorAuthorization(actorUsername, 'users:manage_permissions', 'job_position', code) ||
      this.checkActorAuthorization(actorUsername, 'users:edit', 'job_position', code);

    if (!isAuthorized) {
      return null;
    }

    let targetKey = code;
    if (!this.positions[targetKey]) {
      const foundKey = Object.keys(this.positions).find(
        k => this.positions[k].id === code || this.positions[k].code === code
      );
      if (foundKey) {
        targetKey = foundKey;
      } else {
        return null;
      }
    }

    const old = this.positions[targetKey];
    this.positions[targetKey] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.POSITIONS, this.positions);
    this.addAuditLog(actorUsername, 'UPDATE_JOB_POSITION', 'job_position', targetKey, updates, old);
    this.notify();
    return this.positions[targetKey];
  }

  // --- Students & CRM (Fix 11) ---
  public getStudents(): Student[] {
    return [...this.students];
  }

  public getStudent(idOrCode: string): Student | undefined {
    if (!idOrCode) return undefined;
    const norm = idOrCode.trim();
    return this.students.find(s => 
      s.id === norm || 
      s.student_code === norm || 
      s.student_code.toUpperCase() === norm.toUpperCase()
    );
  }

  public searchStudents(
    options: StudentFilterOptions = {},
    actorUsername?: string
  ): {
    students: Student[];
    filteredStudents: Student[];
    totalActive: number;
    totalFiltered: number;
    isFiltered: boolean;
  } {
    if (actorUsername && !this.checkActorAuthorization(actorUsername, 'students:view', 'student')) {
      return {
        students: [],
        filteredStudents: [],
        totalActive: 0,
        totalFiltered: 0,
        isFiltered: true
      };
    }

    const result = filterStudents(
      this.getStudents(),
      this.getStudentFiles(),
      this.getPayments(),
      options
    );

    return {
      students: result.filteredStudents,
      filteredStudents: result.filteredStudents,
      totalActive: result.totalActive,
      totalFiltered: result.totalFiltered,
      isFiltered: result.isFiltered
    };
  }

  public findExistingStudent(query: {
    passport_number?: string;
    national_id?: string;
    student_id?: string;
    excludeStudentId?: string;
  }): { student: Student; file?: StudentFile } | null {
    const cleanPassport = (query.passport_number || '').trim().toUpperCase().replace(/[\s-]/g, '');
    const cleanNationalId = (query.national_id || '').trim().replace(/[\s-]/g, '');
    const cleanStudentId = (query.student_id || '').trim();

    if (!cleanPassport && !cleanNationalId && !cleanStudentId) {
      return null;
    }

    for (const student of this.students) {
      if (query.excludeStudentId && student.id === query.excludeStudentId) {
        continue;
      }

      const stuPassport = (student.passport_number || '').trim().toUpperCase().replace(/[\s-]/g, '');
      const stuNationalId = (student.national_id || '').trim().replace(/[\s-]/g, '');

      const passportMatches = Boolean(cleanPassport && stuPassport && stuPassport === cleanPassport);
      const nationalIdMatches = Boolean(cleanNationalId && stuNationalId && stuNationalId === cleanNationalId);
      const idMatches = Boolean(cleanStudentId && student.id === cleanStudentId);

      if (passportMatches || nationalIdMatches || idMatches) {
        const file = this.studentFiles.find(f => f.student_id === student.id);
        return { student, file };
      }
    }

    return null;
  }

  public getPreConsolidationBackup(): any | null {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem('bct_backup_pre_consolidation');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  public consolidateDuplicateStudentFiles(actorUsername: string = 'system'): {
    consolidatedStudentsCount: number;
    removedFilesCount: number;
    mergedRecordsLog: Array<{
      studentId: string;
      studentName: string;
      canonicalFileId: string;
      canonicalFileCode: string;
      mergedFileIds: string[];
      mergedFileCodes: string[];
      totalChoicesBefore: number;
      totalChoicesAfter: number;
    }>;
  } {
    const filesByStudent = new Map<string, StudentFile[]>();
    for (const f of this.studentFiles) {
      const list = filesByStudent.get(f.student_id) || [];
      list.push(f);
      filesByStudent.set(f.student_id, list);
    }

    const duplicateStudents = Array.from(filesByStudent.entries()).filter(([_, files]) => files.length > 1);

    if (duplicateStudents.length === 0) {
      return { consolidatedStudentsCount: 0, removedFilesCount: 0, mergedRecordsLog: [] };
    }

    // 1. Snapshot full database state before consolidation
    const backupSnapshot = {
      timestamp: new Date().toISOString(),
      reason: 'PRE_CONSOLIDATION_ONE_STUDENT_ONE_FILE_MIGRATION',
      actor: actorUsername,
      students: JSON.parse(JSON.stringify(this.students)),
      studentFiles: JSON.parse(JSON.stringify(this.studentFiles)),
      documents: JSON.parse(JSON.stringify(this.documents)),
      payments: JSON.parse(JSON.stringify(this.payments)),
      fileActivities: JSON.parse(JSON.stringify(this.fileActivities)),
      expenses: JSON.parse(JSON.stringify(this.expenses)),
      employeeIncentives: JSON.parse(JSON.stringify(this.employeeIncentives))
    };

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('bct_backup_pre_consolidation', JSON.stringify(backupSnapshot));
        localStorage.setItem('bct_backup_pre_consolidation_timestamp', backupSnapshot.timestamp);
      } catch (e) {
        console.warn('Could not persist pre-consolidation backup snapshot to localStorage:', e);
      }
    }

    const mergedRecordsLog: Array<{
      studentId: string;
      studentName: string;
      canonicalFileId: string;
      canonicalFileCode: string;
      mergedFileIds: string[];
      mergedFileCodes: string[];
      totalChoicesBefore: number;
      totalChoicesAfter: number;
    }> = [];

    const filesToRemove = new Set<string>();

    for (const [studentId, files] of duplicateStudents) {
      const student = this.students.find(s => s.id === studentId);
      const studentName = student?.full_name_ar || studentId;

      // Determine canonical file:
      // Sort ascending by file_code or created_at (BCT-FILE-2026-001 is earliest and canonical)
      const sortedFiles = [...files].sort((a, b) => {
        return (a.file_code || '').localeCompare(b.file_code || '') || 
               new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });

      const canonicalFile = sortedFiles[0];
      const secondaryFiles = sortedFiles.slice(1);

      const secondaryFileIds = secondaryFiles.map(f => f.id);
      const secondaryFileCodes = secondaryFiles.map(f => f.file_code);

      // Record alias mappings for backward-compatible routing
      for (const f of secondaryFiles) {
        this.mergedFileCodeMap[f.id] = canonicalFile.file_code;
        this.mergedFileCodeMap[f.file_code] = canonicalFile.file_code;
        this.mergedFileCodeMap[f.file_code.toUpperCase()] = canonicalFile.file_code;
      }

      // Merge choices without duplicates up to max 10 choices
      const existingChoices = Array.isArray(canonicalFile.university_choices) ? [...canonicalFile.university_choices] : [];
      const choicesBefore = existingChoices.length;
      const seenChoiceKeys = new Set(existingChoices.map(c => `${c.university_ar}|${c.faculty_ar}`.trim()));

      for (const sf of secondaryFiles) {
        if (Array.isArray(sf.university_choices)) {
          for (const c of sf.university_choices) {
            const key = `${c.university_ar}|${c.faculty_ar}`.trim();
            if (!seenChoiceKeys.has(key) && existingChoices.length < 10) {
              seenChoiceKeys.add(key);
              existingChoices.push({
                ...c,
                order: existingChoices.length + 1
              });
            }
          }
        }
      }

      canonicalFile.university_choices = existingChoices.map((c, idx) => ({ ...c, order: idx + 1 }));

      // Merge missing certificate or academic fields if secondary file has them
      if (!canonicalFile.certificate_type && secondaryFiles.some(f => f.certificate_type)) {
        canonicalFile.certificate_type = secondaryFiles.find(f => f.certificate_type)!.certificate_type;
      }
      if (!canonicalFile.academic_percentage && secondaryFiles.some(f => f.academic_percentage)) {
        canonicalFile.academic_percentage = secondaryFiles.find(f => f.academic_percentage)!.academic_percentage;
      }

      // Re-point all child records and foreign keys to canonical file
      for (const doc of this.documents) {
        if ((doc.student_file_id && secondaryFileIds.includes(doc.student_file_id)) || ((doc as any).file_id && secondaryFileIds.includes((doc as any).file_id))) {
          (doc as any).file_id = canonicalFile.id;
          doc.student_file_id = canonicalFile.id;
        }
      }

      for (const p of this.payments) {
        if (p.student_file_id && secondaryFileIds.includes(p.student_file_id)) {
          p.student_file_id = canonicalFile.id;
        }
      }

      for (const act of this.fileActivities) {
        if (act.student_file_id && secondaryFileIds.includes(act.student_file_id)) {
          act.student_file_id = canonicalFile.id;
        }
      }

      for (const exp of this.expenses) {
        if (exp.student_file_id && secondaryFileIds.includes(exp.student_file_id)) {
          exp.student_file_id = canonicalFile.id;
          exp.transaction_number = canonicalFile.file_code;
        }
      }

      for (const inc of this.employeeIncentives) {
        if (inc.student_file_id && secondaryFileIds.includes(inc.student_file_id)) {
          inc.student_file_id = canonicalFile.id;
          inc.transaction_number = canonicalFile.file_code;
        }
      }

      for (const sfId of secondaryFileIds) {
        filesToRemove.add(sfId);
      }

      mergedRecordsLog.push({
        studentId,
        studentName,
        canonicalFileId: canonicalFile.id,
        canonicalFileCode: canonicalFile.file_code,
        mergedFileIds: secondaryFileIds,
        mergedFileCodes: secondaryFileCodes,
        totalChoicesBefore: choicesBefore,
        totalChoicesAfter: canonicalFile.university_choices.length
      });

      this.addAuditLog(actorUsername, 'CONSOLIDATE_DUPLICATE_STUDENT_FILES', 'student_file', canonicalFile.id, {
        student_id: studentId,
        student_name: studentName,
        canonical_file_code: canonicalFile.file_code,
        merged_file_codes: secondaryFileCodes,
        choices_before: choicesBefore,
        choices_after: canonicalFile.university_choices.length
      });
    }

    // Permanently remove secondary duplicate files
    this.studentFiles = this.studentFiles.filter(f => !filesToRemove.has(f.id));

    // Persist consolidated datasets
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveToStorage(STORAGE_KEYS.FILE_ACTIVITIES, this.fileActivities);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);

    return {
      consolidatedStudentsCount: duplicateStudents.length,
      removedFilesCount: filesToRemove.size,
      mergedRecordsLog
    };
  }

  public async registerStudentWithFileAsync(
    studentData: Omit<Student, 'id' | 'student_code' | 'created_at'>,
    fileData: Omit<StudentFile, 'id' | 'file_code' | 'created_at' | 'last_updated_at' | 'current_stage_entered_at' | 'is_overdue' | 'student_id'>,
    actorUsername: string
  ): Promise<{
    success: boolean;
    student?: Student;
    file?: StudentFile;
    code?: 'DUPLICATE_STUDENT' | 'UNAUTHORIZED' | 'MUTEX_LOCKED' | 'VALIDATION_ERROR' | 'SERVER_ERROR';
    message?: string;
    existingFileCode?: string;
    existingStudent?: Student;
  }> {
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/api/students/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentData, fileData, actorUsername })
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.success && result.student && result.file) {
            // Apply atomically to local state
            if (!this.students.some(s => s.id === result.student.id || s.student_code === result.student.student_code)) {
              this.students.unshift(result.student);
              saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
            }
            if (!this.studentFiles.some(f => f.id === result.file.id || f.file_code === result.file.file_code)) {
              this.studentFiles.unshift(result.file);
              saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
            }
            if (typeof result.revision === 'number') {
              this.serverRevision = result.revision;
            }
            this.notify();
            return {
              success: true,
              student: result.student,
              file: result.file
            };
          } else if (result && result.code === 'DUPLICATE_STUDENT') {
            return {
              success: false,
              code: 'DUPLICATE_STUDENT',
              message: result.message,
              existingFileCode: result.existingFileCode,
              existingStudent: result.existingStudent
            };
          }
        }
      } catch (err: any) {
        console.warn('[BCT Store] Server register call failed, using local fallback:', err.message);
      }
    }

    const localRes = this.registerStudentWithFile(studentData, fileData, actorUsername);
    flushServerWritesNow();
    return localRes;
  }

  public registerStudentWithFile(
    studentData: Omit<Student, 'id' | 'student_code' | 'created_at'>,
    fileData: Omit<StudentFile, 'id' | 'file_code' | 'created_at' | 'last_updated_at' | 'current_stage_entered_at' | 'is_overdue' | 'student_id'>,
    actorUsername: string
  ): {
    success: boolean;
    student?: Student;
    file?: StudentFile;
    code?: 'DUPLICATE_STUDENT' | 'UNAUTHORIZED' | 'MUTEX_LOCKED' | 'VALIDATION_ERROR';
    message?: string;
    existingFileCode?: string;
    existingStudent?: Student;
  } {
    if (this.registrationMutex) {
      return {
        success: false,
        code: 'MUTEX_LOCKED',
        message: 'عملية تسجيل أخرى قيد التنفيذ حالياً، يرجى الانتظار لحظة'
      };
    }

    this.registrationMutex = true;
    try {
      if (!this.checkActorAuthorization(actorUsername, 'students:create', 'student')) {
        return {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'غير مصرح لك بإضافة طالب جديد'
        };
      }

      // Check duplicate by Passport Number or National ID
      const duplicate = this.findExistingStudent({
        passport_number: studentData.passport_number,
        national_id: studentData.national_id
      });

      if (duplicate) {
        const fileCode = duplicate.file?.file_code || 'BCT-FILE-UNKNOWN';
        this.addAuditLog(actorUsername, 'DUPLICATE_STUDENT_REGISTRATION_BLOCKED', 'student', duplicate.student.id, {
          attempted_passport: studentData.passport_number,
          attempted_national_id: studentData.national_id,
          existing_student_id: duplicate.student.id,
          existing_file_code: fileCode
        });

        return {
          success: false,
          code: 'DUPLICATE_STUDENT',
          message: `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${fileCode}`,
          existingFileCode: fileCode,
          existingStudent: duplicate.student,
          file: duplicate.file
        };
      }

      const student = this.createStudent(studentData, actorUsername);
      if (!student) {
        return {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'تعذر إنشاء سجل الطالب في النظام'
        };
      }

      const file = this.createStudentFile({
        ...fileData,
        student_id: student.id
      }, actorUsername);

      flushServerWritesNow();

      return {
        success: true,
        student,
        file
      };
    } finally {
      this.registrationMutex = false;
    }
  }

  public createStudent(studentData: Omit<Student, 'id' | 'student_code' | 'created_at'>, actorUsername: string): Student | null {
    if (!this.checkActorAuthorization(actorUsername, 'students:create', 'student')) {
      return null;
    }

    // Strict uniqueness validation on Passport Number and National ID
    const duplicate = this.findExistingStudent({
      passport_number: studentData.passport_number,
      national_id: studentData.national_id
    });
    if (duplicate) {
      this.addAuditLog(actorUsername, 'DUPLICATE_STUDENT_REGISTRATION_BLOCKED', 'student', duplicate.student.id, {
        attempted_passport: studentData.passport_number,
        attempted_national_id: studentData.national_id,
        existing_student_id: duplicate.student.id,
        existing_file_code: duplicate.file?.file_code
      });
      return null;
    }

    const id = `stu-${Date.now().toString().slice(-4)}`;
    const student_code = `BCT-STU-2026-${String(this.students.length + 1).padStart(3, '0')}`;
    const newStudent: Student = {
      ...studentData,
      id,
      student_code,
      created_at: new Date().toISOString()
    };
    this.students.unshift(newStudent);
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    this.addAuditLog(actorUsername, 'CREATE_STUDENT', 'student', id, newStudent);
    this.notify();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>, actorUsername: string): Student | null {
    if (!this.checkActorAuthorization(actorUsername, 'students:edit', 'student', id)) {
      return null;
    }
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return null;
    const old = this.students[index];
    this.students[index] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    const now = new Date().toISOString();
    const linkedFiles = this.studentFiles.filter(f => f.student_id === id);
    for (const f of linkedFiles) {
      f.last_updated_at = now;
      f.last_action_at = now;
      f.last_action_type = 'STUDENT_INFO_UPDATED';
      this.recordFileActivity({
        student_file_id: f.id,
        action_type: 'STUDENT_INFO_UPDATED',
        notes: 'تحديث بيانات وملف الطالب في نظام إدارة الطلبات'
      }, actorUsername);
    }
    if (linkedFiles.length > 0) {
      saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
    }

    this.addAuditLog(actorUsername, 'UPDATE_STUDENT', 'student', id, updates, old);
    this.notify();
    return this.students[index];
  }

  public deleteStudent(id: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'students:delete', 'student', id)) {
      return { success: false, message: 'ليس لديك صلاحية حذف أو أرشفة ملفات الطلاب (students:delete مطلوبة)' };
    }
    const index = this.students.findIndex(s => s.id === id);
    if (index === -1) return { success: false, message: 'الطالب غير موجود' };

    const old = this.students[index];
    // Soft-delete: mark is_archived to preserve payments and audit history
    this.students[index] = { ...old, is_archived: true };
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    // Also mark active files as archived
    const nowIso = new Date().toISOString();
    this.studentFiles = this.studentFiles.map(f => {
      if (f.student_id === id) {
        return {
          ...f,
          is_archived: true,
          archived_at: nowIso,
          archived_by: actorUsername,
          archive_reason: 'أرشفة تلقائية لملف الطالب عند حذف سجله',
          last_updated_at: nowIso
        };
      }
      return f;
    });
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.addAuditLog(actorUsername, 'DELETE_STUDENT', 'student', id, { is_archived: true }, old);
    this.notify();
    return { success: true };
  }

  /**
   * Authoritative lookup of the legitimate file closure event in the immutable activity audit log.
   * Strict Rules:
   * 1. Must be strictly action_type === 'FILE_CLOSED', OR a stage transition from a non-closed stage to 'closed'.
   * 2. EXCLUDES FILE_ARCHIVED, FILE_EVALUATED, NOTE_ADDED, or any post-closure activity.
   * 3. Sorts activities descending by timestamp to find the latest valid closure.
   */
  public findLegitimateFileClosureActivity(fileId: string): StudentFileActivityRecord | undefined {
    const fileActs = this.fileActivities.filter(a => a.student_file_id === fileId);
    if (!fileActs.length) return undefined;

    const sortedActs = [...fileActs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sortedActs.find(a => 
      a.action_type === 'FILE_CLOSED' ||
      (a.action_type === 'STAGE_TRANSITION' && a.previous_stage && a.previous_stage !== 'closed' && a.new_stage === 'closed')
    );
  }

  // --- Student Documents Management ---
  public getDocuments(): StudentDocument[] {
    return [...this.documents];
  }

  public getStudentDocuments(fileIdOrStudentId?: string): StudentDocument[] {
    if (!fileIdOrStudentId) return [...this.documents];
    const norm = fileIdOrStudentId.trim();
    // Prioritize file matching so documents are strictly scoped to the exact file
    const matchingFile = this.studentFiles.find(f => 
      f.id === norm || 
      f.file_code === norm || 
      f.file_code.toUpperCase() === norm.toUpperCase()
    );
    const targetFileId = matchingFile ? matchingFile.id : norm;
    return this.documents.filter(d => 
      d.student_file_id === targetFileId || 
      (!d.student_file_id && d.student_id === norm)
    );
  }

  public addStudentDocument(
    doc: Omit<StudentDocument, 'id' | 'created_at'> & { id?: string; created_at?: string },
    actorUsername?: string
  ): StudentDocument {
    const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newDoc: StudentDocument = {
      ...doc,
      id,
      uploaded_at: doc.uploaded_at || now,
      created_at: doc.created_at || now
    };

    this.documents.push(newDoc);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);

    if (actorUsername) {
      this.addAuditLog(actorUsername, 'STUDENT_DOCUMENT_UPLOAD', 'student_file', newDoc.student_file_id, {
        document_id: newDoc.id,
        document_type: newDoc.document_type,
        file_name: newDoc.file_name,
        file_size_bytes: newDoc.file_size_bytes,
        student_id: newDoc.student_id
      });
    }

    this.notify();
    return newDoc;
  }

  public updateStudentDocument(
    id: string,
    updates: Partial<StudentDocument>,
    actorUsername?: string
  ): StudentDocument | null {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;

    const old = { ...this.documents[idx] };
    this.documents[idx] = { ...this.documents[idx], ...updates };
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);

    if (actorUsername) {
      this.addAuditLog(actorUsername, 'STUDENT_DOCUMENT_REPLACE', 'student_file', this.documents[idx].student_file_id, {
        document_id: id,
        document_type: this.documents[idx].document_type,
        old_file_name: old.file_name,
        new_file_name: updates.file_name || old.file_name,
        student_id: this.documents[idx].student_id
      }, old);
    }

    this.notify();
    return this.documents[idx];
  }

  public deleteStudentDocument(id: string, actorUsername?: string): boolean {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return false;

    const old = this.documents[idx];
    this.documents.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);

    if (actorUsername) {
      this.addAuditLog(actorUsername, 'STUDENT_DOCUMENT_DELETE', 'student_file', old.student_file_id, {
        document_id: id,
        document_type: old.document_type,
        file_name: old.file_name,
        student_id: old.student_id
      }, old);
    }

    this.notify();
    return true;
  }

  // --- Student Files & 10-Stage Lifecycle ---
  public getStudentFiles(): StudentFile[] {
    this.performAutoArchiving(true);
    return this.studentFiles.map(file => {
      let lastActionByName = file.last_action_by_name;
      let lastActionAt = file.last_action_at;
      let lastActionType = file.last_action_type;
      let lastActionById = file.last_action_by_id;

      if (!lastActionByName && lastActionById) {
        lastActionByName = this.employees.find(e => e.id === lastActionById)?.full_name_ar;
      }

      if (!lastActionByName) {
        const latestAct = this.fileActivities.find(a => a.student_file_id === file.id);
        if (latestAct) {
          lastActionByName = latestAct.actor_name;
          lastActionAt = latestAct.timestamp;
          lastActionType = latestAct.action_type;
          lastActionById = latestAct.actor_id;
        }
      }

      // Ensure closed_at is derived strictly from genuine historical closure activity (authoritative source)
      const closingAct = this.findLegitimateFileClosureActivity(file.id);
      let closedAt: string | undefined;
      if (closingAct && closingAct.timestamp) {
        closedAt = closingAct.timestamp;
      } else if (file.closed_at && file.closed_at !== file.archived_at) {
        const hasArchivingAtSameTime = this.fileActivities.some(
          a => a.student_file_id === file.id && a.action_type === 'FILE_ARCHIVED' && a.timestamp === file.closed_at
        );
        closedAt = hasArchivingAtSameTime ? undefined : file.closed_at;
      } else {
        closedAt = undefined;
      }

      return {
        ...file,
        closed_at: closedAt,
        student: this.students.find(s => s.id === file.student_id),
        current_owner: this.employees.find(e => e.id === file.current_owner_id),
        last_action_by_name: lastActionByName,
        last_action_by_id: lastActionById,
        last_action_at: lastActionAt,
        last_action_type: lastActionType
      };
    });
  }

  public getStudentFile(idOrCode: string): StudentFile | undefined {
    if (!idOrCode) return undefined;
    const norm = idOrCode.trim();
    let file = this.studentFiles.find(f => 
      f.id === norm || 
      f.file_code === norm || 
      f.file_code.toUpperCase() === norm.toUpperCase()
    );
    if (!file) {
      const canonicalCodeOrId = this.mergedFileCodeMap[norm] || this.mergedFileCodeMap[norm.toUpperCase()];
      if (canonicalCodeOrId) {
        file = this.studentFiles.find(f =>
          f.id === canonicalCodeOrId ||
          f.file_code === canonicalCodeOrId ||
          f.file_code.toUpperCase() === canonicalCodeOrId.toUpperCase()
        );
      }
    }
    if (!file) return undefined;

    let lastActionByName = file.last_action_by_name;
    let lastActionAt = file.last_action_at;
    let lastActionType = file.last_action_type;
    let lastActionById = file.last_action_by_id;

    if (!lastActionByName && lastActionById) {
      lastActionByName = this.employees.find(e => e.id === lastActionById)?.full_name_ar;
    }

    if (!lastActionByName) {
      const latestAct = this.fileActivities.find(a => a.student_file_id === file.id);
      if (latestAct) {
        lastActionByName = latestAct.actor_name;
        lastActionAt = latestAct.timestamp;
        lastActionType = latestAct.action_type;
        lastActionById = latestAct.actor_id;
      }
    }

    // Ensure closed_at is derived strictly from genuine historical closure activity (authoritative source)
    const closingAct = this.findLegitimateFileClosureActivity(file.id);
    let closedAt: string | undefined;
    if (closingAct && closingAct.timestamp) {
      closedAt = closingAct.timestamp;
    } else if (file.closed_at && file.closed_at !== file.archived_at) {
      const hasArchivingAtSameTime = this.fileActivities.some(
        a => a.student_file_id === file.id && a.action_type === 'FILE_ARCHIVED' && a.timestamp === file.closed_at
      );
      closedAt = hasArchivingAtSameTime ? undefined : file.closed_at;
    } else {
      closedAt = undefined;
    }

    return {
      ...file,
      closed_at: closedAt,
      student: this.students.find(s => s.id === file.student_id),
      current_owner: this.employees.find(e => e.id === file.current_owner_id),
      last_action_by_name: lastActionByName,
      last_action_by_id: lastActionById,
      last_action_at: lastActionAt,
      last_action_type: lastActionType
    };
  }

  /**
   * Unified Resolver for Student Profile & File Identity
   * Accurately resolves Student and StudentFile regardless of whether an exact File Code (BCT-FILE-...),
   * File ID (file-...), Student ID (stu-...), or Student Code (BCT-STU-...) is provided.
   */
  public resolveStudentAndFile(identifier: string, requestedFileId?: string | null): {
    student: Student | undefined;
    primaryFile: StudentFile | undefined;
    studentFiles: StudentFile[];
  } {
    if (!identifier) {
      return { student: undefined, primaryFile: undefined, studentFiles: [] };
    }

    const norm = identifier.trim();

    // 1. Direct File Check: Is identifier a File Code or File ID?
    const directFile = this.getStudentFile(norm);
    if (directFile) {
      const student = this.getStudent(directFile.student_id);
      const studentFiles = this.studentFiles
        .filter(f => f.student_id === directFile.student_id)
        .map(f => this.getStudentFile(f.id) || f);
      return {
        student,
        primaryFile: directFile,
        studentFiles
      };
    }

    // 2. Student Check: Is identifier a Student ID or Student Code?
    const student = this.getStudent(norm);
    if (student) {
      const studentFiles = this.studentFiles
        .filter(f => f.student_id === student.id)
        .map(f => this.getStudentFile(f.id) || f);
      let primaryFile: StudentFile | undefined;

      if (requestedFileId) {
        const reqNorm = requestedFileId.trim();
        primaryFile = studentFiles.find(f => 
          f.id === reqNorm || 
          f.file_code === reqNorm || 
          f.file_code.toUpperCase() === reqNorm.toUpperCase()
        );
      }

      if (!primaryFile) {
        primaryFile = studentFiles.find(f => !f.is_archived && (f.current_status as any) !== 'archived') || studentFiles[0];
      }

      return {
        student,
        primaryFile,
        studentFiles
      };
    }

    // 3. Fallback: requestedFileId matches a file
    if (requestedFileId) {
      const fallbackFile = this.getStudentFile(requestedFileId);
      if (fallbackFile) {
        const fallbackStudent = this.getStudent(fallbackFile.student_id);
        const studentFiles = this.studentFiles
          .filter(f => f.student_id === fallbackFile.student_id)
          .map(f => this.getStudentFile(f.id) || f);
        return {
          student: fallbackStudent,
          primaryFile: fallbackFile,
          studentFiles
        };
      }
    }

    return { student: undefined, primaryFile: undefined, studentFiles: [] };
  }

  public getFileClosedAt(fileId: string): string | undefined {
    // 1. Authoritative source of truth: legitimate file closure event in the activity audit log
    const closingAct = this.findLegitimateFileClosureActivity(fileId);
    if (closingAct?.timestamp) {
      return closingAct.timestamp;
    }

    // 2. Fallback to direct property on file record ONLY if no activity log exists and not falsely equal to archived_at
    const file = this.studentFiles.find(f => f.id === fileId);
    if (file?.closed_at && file.closed_at !== file.archived_at) {
      const hasArchivingAtSameTime = this.fileActivities.some(
        a => a.student_file_id === fileId && a.action_type === 'FILE_ARCHIVED' && a.timestamp === file.closed_at
      );
      if (!hasArchivingAtSameTime) {
        return file.closed_at;
      }
    }

    return undefined; // Renders as 'غير متاح'
  }

  // --- Student File Activity & Ownership History ---
  public getFileActivities(fileId: string): StudentFileActivityRecord[] {
    return this.fileActivities
      .filter(a => a.student_file_id === fileId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getAllFileActivities(): StudentFileActivityRecord[] {
    return [...this.fileActivities].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordFileActivity(
    activityData: {
      student_file_id: string;
      action_type: StudentFileActionType;
      notes?: string;
      previous_stage?: StudentFileStatus;
      new_stage?: StudentFileStatus;
      previous_owner_id?: string;
      previous_owner_name?: string;
      new_owner_id?: string;
      new_owner_name?: string;
      details?: Record<string, any>;
      timestamp?: string;
    },
    actorUsername: string
  ): StudentFileActivityRecord {
    const actor = this.getEmployeeByUsername(actorUsername);
    const actorId = actor ? actor.id : (actorUsername === 'admin' ? 'emp-001' : 'system');
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'admin' ? `${this.getGeneralManagerEmployee()?.full_name_ar || 'المدير العام'} (المدير العام)` : 'النظام الآلي');
    const actorRole = actor ? (this.positions[actor.position_id]?.title_ar || actor.position_id) : 'المدير العام';
    const actorDept = actor ? (this.departments.find(d => d.id === actor.department_id)?.name_ar || actor.department_id) : 'الإدارة العليا';

    const now = activityData.timestamp || new Date().toISOString();
    const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let prevOwnerName = activityData.previous_owner_name;
    if (!prevOwnerName && activityData.previous_owner_id) {
      const prevEmp = this.employees.find(e => e.id === activityData.previous_owner_id);
      if (prevEmp) prevOwnerName = prevEmp.full_name_ar;
    }

    let newOwnerName = activityData.new_owner_name;
    if (!newOwnerName && activityData.new_owner_id) {
      const nextEmp = this.employees.find(e => e.id === activityData.new_owner_id);
      if (nextEmp) newOwnerName = nextEmp.full_name_ar;
    }

    const record: StudentFileActivityRecord = {
      id,
      student_file_id: activityData.student_file_id,
      action_type: activityData.action_type,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      actor_department: actorDept,
      previous_stage: activityData.previous_stage,
      new_stage: activityData.new_stage,
      previous_owner_id: activityData.previous_owner_id,
      previous_owner_name: prevOwnerName,
      new_owner_id: activityData.new_owner_id,
      new_owner_name: newOwnerName,
      timestamp: now,
      notes: activityData.notes,
      details: activityData.details
    };

    this.fileActivities.unshift(record);
    saveToStorage(STORAGE_KEYS.FILE_ACTIVITIES, this.fileActivities);

    const fileIdx = this.studentFiles.findIndex(f => f.id === activityData.student_file_id);
    if (fileIdx !== -1) {
      this.studentFiles[fileIdx] = {
        ...this.studentFiles[fileIdx],
        last_action_by_id: actorId,
        last_action_by_name: actorName,
        last_action_at: now,
        last_action_type: activityData.action_type,
        last_updated_at: now
      };
      saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
    }

    this.addAuditLog(actorUsername, `FILE_${activityData.action_type}`, 'student_file', activityData.student_file_id, record);
    this.notify();
    return record;
  }

  public addFileNote(fileId: string, notes: string, actorUsername: string): StudentFileActivityRecord | null {
    const file = this.studentFiles.find(f => f.id === fileId);
    if (!file) return null;

    return this.recordFileActivity({
      student_file_id: fileId,
      action_type: 'NOTE_ADDED',
      notes,
      previous_stage: file.current_status,
      new_stage: file.current_status,
      new_owner_id: file.current_owner_id
    }, actorUsername);
  }

  public createStudentFile(fileData: Omit<StudentFile, 'id' | 'file_code' | 'created_at' | 'last_updated_at' | 'current_stage_entered_at' | 'is_overdue'>, actorUsername: string): StudentFile {
    // Strict Store-Level Constraint: ONE STUDENT = ONE FILE
    const existingFile = this.studentFiles.find(f => f.student_id === fileData.student_id);
    if (existingFile) {
      this.addAuditLog(actorUsername, 'DUPLICATE_FILE_CREATION_PREVENTED', 'student_file', existingFile.id, {
        student_id: fileData.student_id,
        existing_file_code: existingFile.file_code
      });
      return existingFile;
    }

    const id = `file-${Date.now().toString().slice(-4)}`;
    const file_code = `BCT-FILE-2026-${String(this.studentFiles.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const actor = this.getEmployeeByUsername(actorUsername);
    const actorId = actor ? actor.id : (actorUsername === 'admin' ? 'emp-001' : 'system');
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'admin' ? `${this.getGeneralManagerEmployee()?.full_name_ar || 'المدير العام'} (المدير العام)` : 'النظام الآلي');

    const status = ACTIVE_LIFECYCLE_STAGES.includes(fileData.current_status) ? fileData.current_status : 'new';
    const stageSLA = this.getStageSLA(status);
    const deadline = stageSLA
      ? calculateSLADeadline(now, stageSLA.duration_value, stageSLA.duration_unit, stageSLA.business_days_only).toISOString()
      : new Date(Date.now() + (STAGE_SLA_CONFIG[status]?.durationMs || 15 * 60 * 1000)).toISOString();

    const newFile: StudentFile = {
      ...fileData,
      id,
      file_code,
      current_status: status,
      current_stage_entered_at: now,
      stage_deadline_at: deadline,
      last_updated_at: now,
      is_overdue: false,
      created_at: now,
      last_action_by_id: actorId,
      last_action_by_name: actorName,
      last_action_at: now,
      last_action_type: 'FILE_CREATED'
    };
    this.studentFiles.unshift(newFile);
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    const owner = this.employees.find(e => e.id === fileData.current_owner_id);

    this.recordFileActivity({
      student_file_id: id,
      action_type: 'FILE_CREATED',
      new_stage: fileData.current_status,
      new_owner_id: fileData.current_owner_id,
      new_owner_name: owner?.full_name_ar,
      notes: 'إنشاء ملف طالب جديد في مسار القبول'
    }, actorUsername);

    return newFile;
  }

  public updateStudentFile(id: string, updates: Partial<StudentFile>, actorUsername: string): StudentFile | null {
    const index = this.studentFiles.findIndex(f => f.id === id);
    if (index === -1) return null;
    const old = this.studentFiles[index];
    
    // Strict preservation of original closed_at: updates to an already closed file must never overwrite closed_at
    const preservedClosedAt = old.closed_at || updates.closed_at;

    this.studentFiles[index] = {
      ...old,
      ...updates,
      closed_at: preservedClosedAt,
      last_updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    const isOwnerChange = Boolean(updates.current_owner_id && updates.current_owner_id !== old.current_owner_id);
    const isStageChange = Boolean(updates.current_status && updates.current_status !== old.current_status);

    if (isOwnerChange || isStageChange) {
      const prevOwner = this.employees.find(e => e.id === old.current_owner_id);
      const newOwner = this.employees.find(e => e.id === (updates.current_owner_id || old.current_owner_id));

      this.recordFileActivity({
        student_file_id: id,
        action_type: isOwnerChange ? (old.current_owner_id ? 'FILE_REASSIGNED' : 'FILE_ASSIGNED') : 'STAGE_TRANSITION',
        previous_stage: old.current_status,
        new_stage: updates.current_status || old.current_status,
        previous_owner_id: old.current_owner_id,
        previous_owner_name: prevOwner?.full_name_ar,
        new_owner_id: updates.current_owner_id || old.current_owner_id,
        new_owner_name: newOwner?.full_name_ar,
        notes: isOwnerChange ? `إعادة تعيين المسؤول عن الملف إلى: ${newOwner?.full_name_ar || ''}` : 'تحديث بيانات الملف'
      }, actorUsername);
    } else {
      this.addAuditLog(actorUsername, 'UPDATE_STUDENT_FILE', 'student_file', id, updates, old);
      this.notify();
    }

    return this.studentFiles[index];
  }

  public transitionFileStatus(
    fileId: string,
    newStatus: StudentFileStatus,
    notes: string,
    actorUsername: string,
    newOwnerId?: string,
    evaluationData?: { score?: number; rating?: string; notes?: string }
  ): { success: boolean; message?: string } {
    const fileIndex = this.studentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return { success: false, message: 'الملف غير موجود' };

    const file = this.studentFiles[fileIndex];
    const oldStatus = file.current_status;
    const oldOwnerId = file.current_owner_id;
    const oldOwner = this.employees.find(e => e.id === oldOwnerId);
    const targetOwnerId = newOwnerId || oldOwnerId;
    const newOwner = this.employees.find(e => e.id === targetOwnerId);

    // Strict Business Rules from BCT Guide:
    // Rule A: Paid procedures cannot move past registered without payment confirmation
    if ((newStatus === 'review' || newStatus === 'submitted') && !file.is_registered_fee_paid) {
      return { success: false, message: 'لا يمكن بدء إجراءات المراجعة أو الرفع على المنصة قبل تأكيد المحاسب استلام السداد في النظام.' };
    }

    // Rule B: University choices must be defined before platform submission
    if (newStatus === 'submitted' && (!file.university_choices || file.university_choices.length === 0)) {
      return { success: false, message: 'يجب تأكيد رغبات الجامعات للطالب قبل التقديم على المنصة.' };
    }

    const now = new Date().toISOString();
    const stageSLA = this.getStageSLA(newStatus);
    const deadline = stageSLA
      ? calculateSLADeadline(now, stageSLA.duration_value, stageSLA.duration_unit, stageSLA.business_days_only).toISOString()
      : new Date(Date.now() + (STAGE_SLA_CONFIG[newStatus]?.durationMs || 24 * 60 * 60 * 1000)).toISOString();

    const updates: Partial<StudentFile> = {
      current_status: newStatus,
      current_stage_entered_at: now,
      stage_deadline_at: deadline,
      last_updated_at: now,
      is_overdue: false,
    };

    if (newOwnerId) {
      updates.current_owner_id = newOwnerId;
    }

    const actor = this.getEmployeeByUsername(actorUsername);
    const actorId = actor ? actor.id : (actorUsername === 'admin' ? 'emp-001' : 'system');
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'admin' ? `${this.getGeneralManagerEmployee()?.full_name_ar || 'المدير العام'} (المدير العام)` : 'النظام الآلي');

    if (newStatus === 'closed') {
      // Record closed_at timestamp automatically; preserve original if already closed
      updates.closed_at = file.closed_at || now;
      if (evaluationData && evaluationData.score != null) {
        updates.is_evaluated = true;
        updates.evaluation_score = evaluationData.score;
        updates.evaluation_rating = evaluationData.rating || (evaluationData.score >= 90 ? 'ممتاز' : evaluationData.score >= 80 ? 'جيد جداً' : evaluationData.score >= 70 ? 'جيد' : 'مقبول');
        updates.evaluation_notes = evaluationData.notes || '';
        updates.evaluated_at = now;
        updates.evaluated_by = actorName;
      }
    }

    let actionType: StudentFileActionType = 'STAGE_TRANSITION';
    if (newStatus === 'closed') {
      actionType = 'FILE_CLOSED';
    } else if (oldStatus === 'closed') {
      actionType = 'FILE_REOPENED';
    } else if (newStatus === 'final') {
      actionType = 'FILE_APPROVED';
    } else if (newStatus === 'review') {
      actionType = 'DOCUMENTS_VERIFIED';
    } else if (newStatus === 'submitted') {
      actionType = 'APPLICATION_SUBMITTED';
    } else if (newOwnerId && newOwnerId !== oldOwnerId && oldStatus === newStatus) {
      actionType = oldOwnerId ? 'FILE_REASSIGNED' : 'FILE_ASSIGNED';
    }

    this.studentFiles[fileIndex] = {
      ...file,
      ...updates,
      last_action_by_id: actorId,
      last_action_by_name: actorName,
      last_action_at: now,
      last_action_type: actionType
    };
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.recordFileActivity({
      student_file_id: fileId,
      action_type: actionType,
      previous_stage: oldStatus,
      new_stage: newStatus,
      previous_owner_id: oldOwnerId,
      previous_owner_name: oldOwner?.full_name_ar,
      new_owner_id: targetOwnerId,
      new_owner_name: newOwner?.full_name_ar,
      notes: notes || (newStatus === 'closed' ? 'إغلاق ملف الطالب واعتماد استيفاء المتطلبات' : undefined),
      timestamp: (newStatus === 'closed' ? updates.closed_at : undefined) || now
    }, actorUsername);

    if (newStatus === 'closed' && updates.is_evaluated) {
      this.performAutoArchiving();
    }

    return { success: true };
  }

  // --- Student File Automatic Archiving & Data Integrity Reconciliation Engine ---
  public reconcileStudentFiles(): LifecycleIntegrityReport {
    const now = Date.now();
    const inconsistencies: LifecycleIntegrityReport['inconsistencies'] = [];
    const seenIds = new Set<string>();
    const deduplicatedFiles: StudentFile[] = [];

    let modified = false;

    for (let i = 0; i < this.studentFiles.length; i++) {
      let file = { ...this.studentFiles[i] };

      // 1. Duplicate Detection
      if (seenIds.has(file.id)) {
        inconsistencies.push({
          fileId: file.id,
          fileCode: file.file_code || file.id,
          issueType: 'DUPLICATE_FILE',
          description: `تم اكتشاف سجل مكرر للملف ${file.file_code || file.id}`,
          resolutionApplied: 'تم استبعاد النسخة المكررة والحفاظ على أحدث نسخة'
        });
        modified = true;
        continue;
      }
      seenIds.add(file.id);

      // 2. Stage Validation & Normalization
      const rawStatus = (file.current_status || '').toLowerCase().trim();
      let normalizedStatus: StudentFileStatus = rawStatus as StudentFileStatus;

      // Check soft-deleted student relation
      const student = this.students.find(s => s.id === file.student_id);
      if (student?.is_archived && !file.is_archived) {
        inconsistencies.push({
          fileId: file.id,
          fileCode: file.file_code,
          issueType: 'ARCHIVED_STILL_ACTIVE',
          description: `طالب الملف مؤرشف أو محذوف ولكن الملف ظل نشطاً`,
          resolutionApplied: 'تمت أرشفة الملف تماشياً مع سجل الطالب'
        });
        file.is_archived = true;
        if (!file.archived_at) file.archived_at = student.created_at || new Date().toISOString();
        if (!file.archived_by) file.archived_by = 'النظام (حذف الطالب)';
        modified = true;
      }

      // Handle 'archived' status: It should be marked is_archived = true, stage 'closed'
      if (rawStatus === 'archived' || file.is_archived) {
        if (!file.is_archived) {
          inconsistencies.push({
            fileId: file.id,
            fileCode: file.file_code,
            issueType: 'ARCHIVED_STILL_ACTIVE',
            description: `الملف يحمل حالة 'archived' لكن لم يتم ضبط علامة is_archived بشكل صحيح`,
            resolutionApplied: 'تم تثبيت علامة الأرشفة ونقل المرحلة إلى closed'
          });
          file.is_archived = true;
          modified = true;
        }
        if (file.current_status === 'archived' as any) {
          file.current_status = 'closed';
          modified = true;
        }
        if (!file.archived_at) {
          file.archived_at = file.last_updated_at || new Date().toISOString();
          modified = true;
        }
        if (!file.archived_by) {
          file.archived_by = 'النظام (أرشفة معتمدة)';
          modified = true;
        }
      } else {
        // Map legacy aliases
        if (rawStatus === 'new_inquiry') normalizedStatus = 'new';
        else if (rawStatus === 'contacted') normalizedStatus = 'qualified';
        else if (rawStatus === 'documentation') normalizedStatus = 'docs';
        else if (rawStatus === 'initial_admit') normalizedStatus = 'preliminary';
        else if (rawStatus === 'final_admit') normalizedStatus = 'final';

        if (normalizedStatus !== file.current_status && ACTIVE_LIFECYCLE_STAGES.includes(normalizedStatus)) {
          inconsistencies.push({
            fileId: file.id,
            fileCode: file.file_code,
            issueType: 'INVALID_STAGE',
            description: `الملف يحمل مسمى مرحلة قديم (${file.current_status})`,
            resolutionApplied: `تمت تسوية المرحلة إلى (${normalizedStatus})`
          });
          file.current_status = normalizedStatus;
          modified = true;
        } else if (!ACTIVE_LIFECYCLE_STAGES.includes(file.current_status)) {
          inconsistencies.push({
            fileId: file.id,
            fileCode: file.file_code,
            issueType: 'INVALID_STAGE',
            description: `الملف يحمل مرحلة غير صالحة (${file.current_status || 'فارغة'})`,
            resolutionApplied: 'تم تعيين المرحلة الافتراضية new'
          });
          file.current_status = 'new';
          modified = true;
        }
      }

      // 3. Reconcile, verify and synchronize genuine closed_at from historical audit activities
      if (file.is_archived || file.current_status === 'closed') {
        const closingAct = this.findLegitimateFileClosureActivity(file.id);

        if (closingAct && closingAct.timestamp) {
          if (!file.closed_at || file.closed_at !== closingAct.timestamp) {
            inconsistencies.push({
              fileId: file.id,
              fileCode: file.file_code,
              issueType: 'RECOVERED_CLOSED_AT',
              description: `تم تصحيح/استعادة تاريخ الإغلاق الفعلي للملف ${file.file_code} ليتطابق حصرياً مع توقيت عملية إغلاق الملف الأصلية (${closingAct.timestamp})`,
              resolutionApplied: 'تم اعتماد توقيت حدث FILE_CLOSED من التسلسل الزمني كمصدر موحد وموثق'
            });
            file.closed_at = closingAct.timestamp;
            modified = true;
          }
        } else {
          // Only clear closed_at if it was falsely copied from archived_at (preserve original genuine closing timestamps)
          if (file.closed_at && file.archived_at && file.closed_at === file.archived_at) {
            inconsistencies.push({
              fileId: file.id,
              fileCode: file.file_code,
              issueType: 'RECOVERED_CLOSED_AT',
              description: `تم تصحيح تاريخ الإغلاق للملف ${file.file_code} لمنع تطابقه مع تاريخ الأرشفة`,
              resolutionApplied: 'تم فصل تاريخ الأرشفة عن تاريخ الإغلاق'
            });
            file.closed_at = undefined;
            modified = true;
          }
        }
      }

      // 3. Timestamps Integrity
      if (!file.current_stage_entered_at) {
        inconsistencies.push({
          fileId: file.id,
          fileCode: file.file_code,
          issueType: 'MISSING_STAGE_TIMESTAMP',
          description: `تاريخ دخول المرحلة مفقود للملف ${file.file_code}`,
          resolutionApplied: 'تم اعتماد تاريخ آخر تحديث أو الإنشاء'
        });
        file.current_stage_entered_at = file.last_updated_at || file.created_at || new Date().toISOString();
        modified = true;
      }

      // 4. Automatic 24-Hour Archiving Rule for Stage 10
      if (file.current_status === 'closed' && !file.is_archived) {
        const hasEvaluation = Boolean(file.is_evaluated || file.evaluation_score != null);
        if (hasEvaluation) {
          const closedTime = new Date(file.closed_at || file.current_stage_entered_at || file.last_updated_at).getTime();
          const evaluatedTime = file.evaluated_at ? new Date(file.evaluated_at).getTime() : closedTime;
          const completionTime = Math.max(closedTime, evaluatedTime);
          const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

          if (now - completionTime >= TWENTY_FOUR_HOURS_MS) {
            inconsistencies.push({
              fileId: file.id,
              fileCode: file.file_code,
              issueType: 'PASSED_ARCHIVE_DEADLINE',
              description: `انقضت مهلة الـ 24 ساعة للملف المغلق والمقيم ${file.file_code}`,
              resolutionApplied: 'تمت الأرشفة التلقائية للملف'
            });
            const archivedAt = new Date(completionTime + TWENTY_FOUR_HOURS_MS).toISOString();
            file.is_archived = true;
            file.archived_at = archivedAt;
            file.archived_by = 'النظام (أرشفة تلقائية بعد 24 ساعة)';
            file.archive_reason = 'أرشفة تلقائية بعد مرور 24 ساعة من إغلاق الملف واستيفاء التقييم المعتمد';
            file.last_action_by_id = 'system';
            file.last_action_by_name = 'النظام الآلي (Auto-Archive)';
            file.last_action_at = archivedAt;
            file.last_action_type = 'FILE_ARCHIVED';

            const existingAct = this.fileActivities.find(
              a => a.student_file_id === file.id && a.action_type === 'FILE_ARCHIVED'
            );
            if (!existingAct) {
              this.recordFileActivity({
                student_file_id: file.id,
                action_type: 'FILE_ARCHIVED',
                previous_stage: 'closed',
                new_stage: 'closed',
                notes: 'تمت أرشفة الملف تلقائياً بواسطة النظام بعد مرور 24 ساعة كاملة من الإغلاق والتقييم'
              }, 'system');
            }

            this.addAuditLog('system', 'ARCHIVE_STUDENT_FILE', 'student_file', file.id, {
              file_code: file.file_code,
              student_id: file.student_id,
              closed_at: file.closed_at,
              evaluated_at: file.evaluated_at,
              evaluation_score: file.evaluation_score,
              archived_at: archivedAt
            });

            modified = true;
          }
        }
      }

      // 5. Dynamic SLA Deadline & Overdue Calculation
      const slaConfig = STAGE_SLA_CONFIG[file.current_status] || { durationMs: 24 * 60 * 60 * 1000 };
      const stageSLA = this.getStageSLA(file.current_status);
      const isSlaActive = stageSLA?.is_active ?? true;

      if (!file.stage_deadline_at) {
        if (stageSLA) {
          file.stage_deadline_at = calculateSLADeadline(
            file.current_stage_entered_at,
            stageSLA.duration_value,
            stageSLA.duration_unit,
            stageSLA.business_days_only
          ).toISOString();
        } else {
          const entryTime = new Date(file.current_stage_entered_at).getTime();
          file.stage_deadline_at = new Date(entryTime + slaConfig.durationMs).toISOString();
        }
        modified = true;
      }

      let expectedOverdue = false;
      if (file.is_archived) {
        expectedOverdue = false;
      } else if (!isSlaActive) {
        expectedOverdue = false;
      } else if (file.current_status === 'closed') {
        const hasEval = Boolean(file.is_evaluated || file.evaluation_score != null);
        if (hasEval) {
          expectedOverdue = false;
        } else {
          expectedOverdue = now > new Date(file.stage_deadline_at).getTime();
        }
      } else {
        expectedOverdue = now > new Date(file.stage_deadline_at).getTime();
      }

      if (file.is_overdue !== expectedOverdue) {
        inconsistencies.push({
          fileId: file.id,
          fileCode: file.file_code,
          issueType: 'INCORRECT_SLA_STATUS',
          description: `حالة التأخير SLA كانت غير دقيقة للملف ${file.file_code} (${file.is_overdue ? 'متأخر' : 'سليم'} -> يجب أن تكون ${expectedOverdue ? 'متأخر' : 'سليم'})`,
          resolutionApplied: `تم تحديث حالة التأخير إلى ${expectedOverdue ? 'متأخر' : 'سليم'}`
        });
        file.is_overdue = expectedOverdue;
        modified = true;
      }

      deduplicatedFiles.push(file);
    }

    if (modified || deduplicatedFiles.length !== this.studentFiles.length) {
      this.studentFiles = deduplicatedFiles;
      saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
      this.notify();
    }

    const activeFiles = this.studentFiles.filter(f => !f.is_archived && ACTIVE_LIFECYCLE_STAGES.includes(f.current_status));
    const stageCounts: Record<string, number> = {};
    ACTIVE_LIFECYCLE_STAGES.forEach(st => {
      stageCounts[st] = activeFiles.filter(f => f.current_status === st).length;
    });
    const stageSum = Object.values(stageCounts).reduce((acc, v) => acc + v, 0);
    const overdueCount = activeFiles.filter(f => f.is_overdue).length;
    const archivedCount = this.studentFiles.filter(f => f.is_archived).length;

    return {
      totalRecords: this.studentFiles.length,
      activeFilesCount: activeFiles.length,
      stageCountsSum: stageSum,
      overdueCount,
      archivedCount,
      isBalanced: activeFiles.length === stageSum,
      inconsistencies
    };
  }

  public validateFileLifecycleIntegrity(): LifecycleIntegrityReport {
    return this.reconcileStudentFiles();
  }

  // --- Student File Automatic Archiving Engine (24-Hour Rule) ---
  public performAutoArchiving(silent: boolean = false): number {
    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    let archivedCount = 0;

    for (let i = 0; i < this.studentFiles.length; i++) {
      const file = this.studentFiles[i];
      // Condition 1: Must be in closed stage
      if (file.current_status !== 'closed') continue;
      // Must not already be archived
      if (file.is_archived) continue;
      // Condition 2: Must be evaluated
      const hasEvaluation = Boolean(file.is_evaluated || file.evaluation_score != null);
      if (!hasEvaluation) continue;

      const closingAct = this.findLegitimateFileClosureActivity(file.id);
      const genuineClosedAt = closingAct?.timestamp || (file.closed_at !== file.archived_at ? file.closed_at : undefined);
      const closedTime = genuineClosedAt
        ? new Date(genuineClosedAt).getTime()
        : new Date(file.current_stage_entered_at || file.last_updated_at).getTime();
      const evaluatedTime = file.evaluated_at ? new Date(file.evaluated_at).getTime() : closedTime;
      const completionTime = Math.max(closedTime, evaluatedTime);

      // Check if 24 full hours have elapsed since completion of both conditions
      if (now - completionTime >= TWENTY_FOUR_HOURS_MS) {
        const archivedAt = new Date(completionTime + TWENTY_FOUR_HOURS_MS).toISOString();
        this.studentFiles[i] = {
          ...file,
          closed_at: genuineClosedAt,
          is_archived: true,
          archived_at: archivedAt,
          archived_by: 'النظام (أرشفة تلقائية بعد 24 ساعة)',
          archive_reason: 'أرشفة تلقائية بعد مرور 24 ساعة من إغلاق الملف واستيفاء التقييم المعتمد',
          last_action_by_id: 'system',
          last_action_by_name: 'النظام الآلي (Auto-Archive)',
          last_action_at: archivedAt,
          last_action_type: 'FILE_ARCHIVED'
        };

        const existingAct = this.fileActivities.find(
          a => a.student_file_id === file.id && a.action_type === 'FILE_ARCHIVED'
        );
        if (!existingAct) {
          this.recordFileActivity({
            student_file_id: file.id,
            action_type: 'FILE_ARCHIVED',
            previous_stage: 'closed',
            new_stage: 'closed',
            notes: 'تمت أرشفة الملف تلقائياً بواسطة النظام بعد مرور 24 ساعة كاملة من الإغلاق والتقييم'
          }, 'system');
        }

        this.addAuditLog('system', 'ARCHIVE_STUDENT_FILE', 'student_file', file.id, {
          file_code: file.file_code,
          student_id: file.student_id,
          closed_at: genuineClosedAt || file.closed_at,
          evaluated_at: file.evaluated_at,
          evaluation_score: file.evaluation_score,
          archived_at: archivedAt
        });

        archivedCount++;
      }
    }

    if (archivedCount > 0) {
      saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
      this.reconcileStudentFiles();
      if (!silent) {
        this.notify();
      }
    } else if (!silent) {
      this.reconcileStudentFiles();
    }

    return this.studentFiles.filter(f => f.is_archived).length;
  }

  public evaluateStudentFile(
    fileId: string,
    evaluationData: {
      score: number;
      rating?: string;
      notes?: string;
    },
    actorUsername: string
  ): { success: boolean; message?: string; file?: StudentFile } {
    if (!this.checkActorAuthorization(actorUsername, 'students:edit', 'student_file', fileId)) {
      return { success: false, message: 'ليس لديك صلاحية تسجيل تقييم أداء الملف (students:edit مطلوبة)' };
    }
    const index = this.studentFiles.findIndex(f => f.id === fileId);
    if (index === -1) return { success: false, message: 'الملف غير موجود' };

    const file = this.studentFiles[index];
    const now = new Date().toISOString();
    const actor = this.getEmployeeByUsername(actorUsername);
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'admin' ? `${this.getGeneralManagerEmployee()?.full_name_ar || 'المدير العام'} (المدير العام)` : actorUsername);
    const actorId = actor ? actor.id : 'emp-001';

    const rating = evaluationData.rating || (evaluationData.score >= 90 ? 'ممتاز' : evaluationData.score >= 80 ? 'جيد جداً' : evaluationData.score >= 70 ? 'جيد' : 'مقبول');

    this.studentFiles[index] = {
      ...file,
      is_evaluated: true,
      evaluation_score: evaluationData.score,
      evaluation_rating: rating,
      evaluation_notes: evaluationData.notes || '',
      evaluated_at: now,
      evaluated_by: actorName,
      last_action_by_id: actorId,
      last_action_by_name: actorName,
      last_action_at: now,
      last_action_type: 'FILE_EVALUATED'
    };

    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.recordFileActivity({
      student_file_id: fileId,
      action_type: 'FILE_EVALUATED',
      previous_stage: file.current_status,
      new_stage: file.current_status,
      notes: `تسجيل تقييم أداء الملف: ${evaluationData.score}% (${rating})${evaluationData.notes ? ' — ' + evaluationData.notes : ''}`
    }, actorUsername);

    this.addAuditLog(actorUsername, 'EVALUATE_STUDENT_FILE', 'student_file', fileId, {
      file_code: file.file_code,
      score: evaluationData.score,
      rating,
      notes: evaluationData.notes,
      evaluated_by: actorName,
      evaluated_at: now
    });

    this.performAutoArchiving();
    this.notify();

    return { success: true, file: { ...this.studentFiles[index] } };
  }

  public reopenStudentFile(
    fileId: string,
    reason: string,
    targetStage: StudentFileStatus = 'review',
    actorUsername: string = 'admin'
  ): { success: boolean; message?: string; file?: StudentFile } {
    if (!this.checkActorAuthorization(actorUsername, 'students:edit', 'student_file', fileId)) {
      return { success: false, message: 'ليس لديك صلاحية إعادة فتح الملفات (students:edit مطلوبة)' };
    }
    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) {
      return { success: false, message: 'سبب إعادة فتح الملف حقل إلزامي لا يمكن تركه فارغاً' };
    }

    const index = this.studentFiles.findIndex(f => f.id === fileId);
    if (index === -1) return { success: false, message: 'الملف غير موجود' };

    const oldFile = { ...this.studentFiles[index] };
    const now = new Date().toISOString();
    const actor = this.getEmployeeByUsername(actorUsername);
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'admin' ? `${this.getGeneralManagerEmployee()?.full_name_ar || 'المدير العام'} (المدير العام)` : actorUsername);
    const actorId = actor ? actor.id : 'emp-001';

    const previousArchiveInfo = {
      was_archived: oldFile.is_archived,
      archived_at: oldFile.archived_at,
      archived_by: oldFile.archived_by,
      archive_reason: oldFile.archive_reason
    };

    const stageSLA = this.getStageSLA(targetStage);
    const deadline = stageSLA
      ? calculateSLADeadline(now, stageSLA.duration_value, stageSLA.duration_unit, stageSLA.business_days_only).toISOString()
      : new Date(Date.now() + (STAGE_SLA_CONFIG[targetStage]?.durationMs || 24 * 60 * 60 * 1000)).toISOString();

    this.studentFiles[index] = {
      ...oldFile,
      is_archived: false,
      current_status: targetStage,
      current_stage_entered_at: now,
      stage_deadline_at: deadline,
      is_overdue: false,
      last_updated_at: now,
      reopened_at: now,
      reopened_by: actorName,
      reopen_reason: trimmedReason,
      last_action_by_id: actorId,
      last_action_by_name: actorName,
      last_action_at: now,
      last_action_type: 'FILE_REOPENED'
    };

    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.recordFileActivity({
      student_file_id: fileId,
      action_type: 'FILE_REOPENED',
      previous_stage: oldFile.current_status,
      new_stage: targetStage,
      previous_owner_id: oldFile.current_owner_id,
      new_owner_id: oldFile.current_owner_id,
      notes: `إعادة فتح الملف من الأرشيف بواسطة: ${actorName}. السبب: ${trimmedReason}`
    }, actorUsername);

    this.addAuditLog(actorUsername, 'REOPEN_STUDENT_FILE', 'student_file', fileId, {
      file_code: oldFile.file_code,
      previous_stage: oldFile.current_status,
      target_stage: targetStage,
      reason: trimmedReason,
      reopened_by: actorName,
      reopened_at: now,
      previous_archive_info: previousArchiveInfo
    });

    this.notify();
    return { success: true, file: { ...this.studentFiles[index] } };
  }

  // --- University Catalog & Preferences (Fix 08, 09, 10 & Academic CRM Suite) ---
  public getUniversities(type?: string, search?: string): University[] {
    let list = [...this.universities];
    if (type && type !== 'all') {
      list = list.filter(u => u.type === type);
    }
    if (search && search.trim()) {
      list = searchUniversities(list, { query: search, type: (type && type !== 'all') ? type : undefined });
    }
    return list;
  }

  public getUniversityById(id: string): University | undefined {
    return this.universities.find(u => u.id === id);
  }

  public getFaculties(universityId?: string): UniversityFaculty[] {
    if (!universityId) return [...this.faculties];
    return this.faculties.filter(f => f.university_id === universityId && f.is_active !== false);
  }

  public getCampuses(universityId?: string): UniversityCampus[] {
    if (!universityId) return [...this.campuses];
    return getCampusesByUniversity(this.campuses, universityId);
  }

  public getCampusById(id: string): UniversityCampus | undefined {
    return this.campuses.find(c => c.id === id);
  }

  public getFacultyById(id: string): UniversityFaculty | undefined {
    return this.faculties.find(f => f.id === id);
  }

  public getSpecializations(facultyId: string): AcademicSpecialization[] {
    return getSpecializationsByFaculty(this.faculties, facultyId);
  }

  public searchFaculties(faculties: UniversityFaculty[], query: string, campusId?: string, genderType?: string): UniversityFaculty[] {
    return searchFaculties(faculties, query, campusId, genderType);
  }

  public searchSpecializations(specializations: AcademicSpecialization[], query: string): AcademicSpecialization[] {
    return searchSpecializations(specializations, query);
  }

  public searchAcademicUniversities(options: { query?: string; type?: string; governorate?: string }): University[] {
    return searchUniversities(this.universities, options);
  }

  public addUniversity(univ: University, actorUsername: string): { success: boolean; message?: string; university?: University } {
    if (!univ.name_ar || !univ.name_en) {
      return { success: false, message: 'اسم الجامعة بالعربية والإنجليزية إلزامي' };
    }
    const exists = this.universities.find(
      u => u.id === univ.id || 
           normalizeAcademicSearch(u.name_ar) === normalizeAcademicSearch(univ.name_ar) ||
           normalizeAcademicSearch(u.name_en) === normalizeAcademicSearch(univ.name_en)
    );
    if (exists) {
      return { success: false, message: 'الجامعة مسجلة بالفعل في قاعدة البيانات' };
    }
    const newUniv: University = {
      ...univ,
      governorate_ar: univ.governorate_ar || 'القاهرة',
      governorate_en: univ.governorate_en || 'Cairo',
      accreditation_body_ar: univ.accreditation_body_ar || univ.accreditation_body || 'المجلس الأعلى للجامعات (SCU)',
      accreditation_body_en: univ.accreditation_body_en || 'Supreme Council of Universities (SCU)',
      accreditation_status: univ.accreditation_status || 'accredited',
      last_reviewed_at: univ.last_reviewed_at || new Date().toISOString(),
      id: univ.id || `univ-${Date.now()}`,
      is_active: univ.is_active !== false,
      last_verified_at: new Date().toISOString()
    };
    this.universities.push(newUniv);
    saveToStorage(STORAGE_KEYS.UNIVERSITIES, this.universities);
    this.addAuditLog(actorUsername, 'CREATE_RECORD', 'university_catalog', newUniv.id, { university: newUniv.name_ar });
    this.notify();
    return { success: true, university: newUniv };
  }

  public updateUniversity(id: string, updates: Partial<University>, actorUsername: string): boolean {
    const idx = this.universities.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.universities[idx] = {
      ...this.universities[idx],
      ...updates,
      last_reviewed_at: updates.last_reviewed_at || new Date().toISOString(),
      last_verified_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.UNIVERSITIES, this.universities);
    this.addAuditLog(actorUsername, 'UPDATE_RECORD', 'university_catalog', id, { updates });
    this.notify();
    return true;
  }

  public toggleUniversityStatus(id: string, actorUsername: string): boolean {
    const idx = this.universities.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.universities[idx].is_active = !this.universities[idx].is_active;
    saveToStorage(STORAGE_KEYS.UNIVERSITIES, this.universities);
    this.addAuditLog(actorUsername, 'UPDATE_RECORD', 'university_catalog', id, { is_active: this.universities[idx].is_active });
    this.notify();
    return true;
  }

  public addFaculty(faculty: UniversityFaculty, actorUsername: string): { success: boolean; message?: string; faculty?: UniversityFaculty } {
    if (!faculty.university_id || !faculty.name_ar) {
      return { success: false, message: 'بيانات الكلية والجامعة إلزامية' };
    }
    const exists = this.faculties.find(
      f => f.university_id === faculty.university_id &&
           normalizeAcademicSearch(f.name_ar) === normalizeAcademicSearch(faculty.name_ar)
    );
    if (exists) {
      return { success: false, message: 'الكلية مسجلة بالفعل لهذه الجامعة' };
    }
    const newFac: UniversityFaculty = {
      ...faculty,
      id: faculty.id || `fac-${Date.now()}`,
      is_active: faculty.is_active !== false,
      accreditation_status: faculty.accreditation_status || 'accredited',
      is_accredited: faculty.is_accredited !== false,
      specializations: faculty.specializations || []
    };
    this.faculties.push(newFac);
    saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
    this.addAuditLog(actorUsername, 'CREATE_RECORD', 'university_faculty', newFac.id, { faculty: newFac.name_ar });
    this.notify();
    return { success: true, faculty: newFac };
  }

  public updateFaculty(id: string, updates: Partial<UniversityFaculty>, actorUsername: string): boolean {
    const idx = this.faculties.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.faculties[idx] = {
      ...this.faculties[idx],
      ...updates
    };
    saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
    this.addAuditLog(actorUsername, 'UPDATE_RECORD', 'university_faculty', id, { updates });
    this.notify();
    return true;
  }

  public addSpecialization(facultyId: string, spec: AcademicSpecialization, actorUsername: string): boolean {
    const fac = this.faculties.find(f => f.id === facultyId);
    if (!fac) return false;
    if (!fac.specializations) fac.specializations = [];
    const exists = fac.specializations.find(
      s => normalizeAcademicSearch(s.name_ar) === normalizeAcademicSearch(spec.name_ar)
    );
    if (exists) return false;
    fac.specializations.push({
      ...spec,
      id: spec.id || `sp-${Date.now()}`,
      faculty_id: facultyId,
      is_available: spec.is_available !== false
    });
    saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
    this.addAuditLog(actorUsername, 'CREATE_RECORD', 'academic_specialization', spec.id || facultyId, { specialization: spec.name_ar });
    this.notify();
    return true;
  }

  public updateSpecialization(facultyId: string, specId: string, updates: Partial<AcademicSpecialization>, actorUsername: string): boolean {
    const fac = this.faculties.find(f => f.id === facultyId);
    if (!fac || !fac.specializations) return false;
    const sIdx = fac.specializations.findIndex(s => s.id === specId);
    if (sIdx === -1) return false;
    fac.specializations[sIdx] = {
      ...fac.specializations[sIdx],
      ...updates
    };
    saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
    this.addAuditLog(actorUsername, 'UPDATE_RECORD', 'academic_specialization', specId, { updates });
    this.notify();
    return true;
  }

  public exportAcademicCatalogAsJSON(): string {
    return JSON.stringify({
      version: '2026.1',
      exported_at: new Date().toISOString(),
      universities_count: this.universities.length,
      faculties_count: this.faculties.length,
      universities: this.universities,
      faculties: this.faculties
    }, null, 2);
  }

  public importAcademicCatalogFromJSON(jsonString: string, actorUsername: string): { success: boolean; message?: string; count?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!data.universities && !data.faculties)) {
        return { success: false, message: 'صيغة ملف JSON غير صالحة' };
      }
      let count = 0;
      if (Array.isArray(data.universities)) {
        data.universities.forEach((u: University) => {
          const idx = this.universities.findIndex(x => x.id === u.id);
          if (idx >= 0) {
            this.universities[idx] = { ...this.universities[idx], ...u };
          } else {
            this.universities.push(u);
          }
          count++;
        });
        saveToStorage(STORAGE_KEYS.UNIVERSITIES, this.universities);
      }
      if (Array.isArray(data.faculties)) {
        data.faculties.forEach((f: UniversityFaculty) => {
          const idx = this.faculties.findIndex(x => x.id === f.id);
          if (idx >= 0) {
            this.faculties[idx] = { ...this.faculties[idx], ...f };
          } else {
            this.faculties.push(f);
          }
          count++;
        });
        saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
      }
      this.addAuditLog(actorUsername, 'UPDATE_RECORD', 'university_catalog', 'bulk_import', { count });
      this.notify();
      return { success: true, count };
    } catch (e: any) {
      return { success: false, message: e.message || 'خطأ في معالجة البيانات' };
    }
  }

  public addUniversityPreference(fileId: string, choiceData: Omit<StudentChoice, 'order'>, actorUsername: string): { success: boolean; message?: string } {
    const fileIndex = this.studentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return { success: false, message: 'الملف غير موجود' };

    const file = this.studentFiles[fileIndex];
    const choices = file.university_choices ? [...file.university_choices] : [];

    if (choices.length >= 10) {
      return { success: false, message: 'الحد الأقصى للرغبات هو 10 رغبات فقط.' };
    }

    // Prevent duplicate: check university + faculty (+ specialization if both present)
    const duplicate = choices.find(c => {
      const sameUniv = (choiceData.university_id && c.university_id)
        ? c.university_id === choiceData.university_id
        : c.university_ar === choiceData.university_ar;
      const sameFac = (choiceData.faculty_id && c.faculty_id)
        ? c.faculty_id === choiceData.faculty_id
        : c.faculty_ar === choiceData.faculty_ar;
      
      if (!sameUniv || !sameFac) return false;
      if (choiceData.specialization_ar && c.specialization_ar) {
        return c.specialization_ar === choiceData.specialization_ar;
      }
      return true;
    });

    if (duplicate) {
      return { success: false, message: 'هذه الرغبة مضافة بالفعل في قائمة رغبات الطالب.' };
    }

    const newChoice: StudentChoice = {
      order: choices.length + 1,
      university_ar: choiceData.university_ar,
      university_en: choiceData.university_en || choiceData.university_ar,
      faculty_ar: choiceData.faculty_ar,
      faculty_en: choiceData.faculty_en || choiceData.faculty_ar,
      specialization_ar: choiceData.specialization_ar || '',
      specialization_en: choiceData.specialization_en || choiceData.specialization_ar || '',
      university_id: choiceData.university_id,
      faculty_id: choiceData.faculty_id,
      specialization_id: choiceData.specialization_id,
      degree_ar: choiceData.degree_ar,
      program_type_ar: choiceData.program_type_ar,
      university_type: choiceData.university_type,
      governorate_ar: choiceData.governorate_ar,
      campus_name_ar: choiceData.campus_name_ar,
      gender_type_ar: choiceData.gender_type_ar
    };

    choices.push(newChoice);
    this.studentFiles[fileIndex].university_choices = choices;
    this.studentFiles[fileIndex].last_updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.recordFileActivity({
      student_file_id: fileId,
      action_type: 'CHOICES_UPDATED',
      previous_stage: file.current_status,
      new_stage: file.current_status,
      new_owner_id: file.current_owner_id,
      notes: `إضافة رغبة جامعية جديدة: ${choiceData.faculty_ar} (${choiceData.specialization_ar || 'عام'}) - ${choiceData.university_ar}`
    }, actorUsername);

    return { success: true };
  }

  public updateUniversityPreference(fileId: string, order: number, choiceData: Partial<StudentChoice>, actorUsername: string): boolean {
    const fileIndex = this.studentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return false;

    const file = this.studentFiles[fileIndex];
    if (!file.university_choices) return false;

    const choiceIdx = file.university_choices.findIndex(c => c.order === order);
    if (choiceIdx === -1) return false;

    // Check duplicate with another choice in the list
    if (choiceData.university_ar && choiceData.faculty_ar) {
      const duplicate = file.university_choices.find((c, idx) => {
        if (idx === choiceIdx) return false;
        const sameUniv = (choiceData.university_id && c.university_id)
          ? c.university_id === choiceData.university_id
          : c.university_ar === choiceData.university_ar;
        const sameFac = (choiceData.faculty_id && c.faculty_id)
          ? c.faculty_id === choiceData.faculty_id
          : c.faculty_ar === choiceData.faculty_ar;
        if (!sameUniv || !sameFac) return false;
        if (choiceData.specialization_ar && c.specialization_ar) {
          return c.specialization_ar === choiceData.specialization_ar;
        }
        return true;
      });

      if (duplicate) {
        return false;
      }
    }

    file.university_choices[choiceIdx] = {
      ...file.university_choices[choiceIdx],
      ...choiceData,
      order
    };
    file.last_updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.recordFileActivity({
      student_file_id: fileId,
      action_type: 'CHOICES_UPDATED',
      previous_stage: file.current_status,
      new_stage: file.current_status,
      new_owner_id: file.current_owner_id,
      notes: `تحديث الرغبة الجامعية #${order}: ${choiceData.faculty_ar || file.university_choices[choiceIdx].faculty_ar} (${choiceData.specialization_ar || 'عام'}) - ${choiceData.university_ar || file.university_choices[choiceIdx].university_ar}`
    }, actorUsername);

    return true;
  }

  public deleteUniversityPreference(fileId: string, order: number, actorUsername: string): boolean {
    const fileIndex = this.studentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return false;

    const file = this.studentFiles[fileIndex];
    if (!file.university_choices) return false;

    // Filter out the deleted preference and re-index orders 1..N
    const remaining = file.university_choices
      .filter(c => c.order !== order)
      .map((c, idx) => ({ ...c, order: idx + 1 }));

    file.university_choices = remaining;
    file.last_updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.addAuditLog(actorUsername, 'UPDATE_CHOICES', 'student_file', fileId, { deleted_order: order, remaining: remaining.length });
    this.notify();
    return true;
  }

  public reorderUniversityPreferences(fileId: string, newOrderedChoices: StudentChoice[], actorUsername: string): boolean {
    const fileIndex = this.studentFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return false;

    const indexed = newOrderedChoices.map((c, i) => ({ ...c, order: i + 1 }));
    this.studentFiles[fileIndex].university_choices = indexed;
    this.studentFiles[fileIndex].last_updated_at = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

    this.addAuditLog(actorUsername, 'UPDATE_CHOICES', 'student_file', fileId, { reordered: true, count: indexed.length });
    this.notify();
    return true;
  }

  // --- Payments & Financial Management (Fix 12, 13) ---
  public getPayments(): PaymentRecord[] {
    return [...this.payments].map(p => ({
      ...p,
      payment_description: p.payment_description || p.notes || ''
    }));
  }

  public createPayment(paymentData: Omit<PaymentRecord, 'id' | 'receipt_code' | 'created_at'>, actorUsername: string): PaymentRecord | null {
    if (!this.checkActorAuthorization(actorUsername, 'finance:create', 'payment_record')) {
      return null;
    }
    const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const receipt_code = `BCT-RCP-2026-${String(this.payments.length + 1).padStart(3, '0')}`;
    const desc = (paymentData.payment_description || paymentData.notes || '').trim();
    const rawAny = paymentData as any;
    const amountVal = typeof rawAny.amount === 'number' ? rawAny.amount : (rawAny.amount_egp || 0);
    const currencyVal = rawAny.currency || (rawAny.amount_usd ? 'USD' : 'EGP');
    const newPayment: PaymentRecord = {
      ...paymentData,
      amount: amountVal,
      currency: currencyVal,
      id,
      receipt_code,
      payment_description: desc,
      notes: paymentData.notes || desc,
      created_at: new Date().toISOString()
    };
    this.payments.unshift(newPayment);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.addAuditLog(actorUsername, 'CREATE_PAYMENT', 'payment_record', id, newPayment);
    this.notify();
    return newPayment;
  }

  /**
   * Edit an unconfirmed (pending) payment receipt in-place.
   * Strict Rules:
   * - Requires dedicated 'payments:edit_pending' permission (separate from 'payments:confirm' / 'finance:approve').
   * - Strictly rejects any non-pending receipt (confirmed, reversed, rejected) — post-confirmation immutability lock.
   * - Strips immutable/protected fields (id, receipt_code, status, confirmed_by, confirmed_at) to block status tampering.
   * - Applies accounting validation on amount, currency, payment_method, student/file linkage, date, payer, and description.
   * - Records an immutable audit trail entry ('UPDATE_PENDING_PAYMENT') with before/after values and reason.
   */
  public updatePendingPayment(
    paymentId: string,
    updates: {
      payment_date?: string;
      amount?: number;
      currency?: string;
      payment_method?: PaymentRecord['payment_method'];
      financial_account_id?: string;
      financial_account_name?: string;
      bank_name?: string;
      student_id?: string;
      student_file_id?: string;
      payer_name?: string;
      payment_description?: string;
      payment_reference?: string;
      notes?: string;
    },
    actorUsername: string,
    reason?: string
  ): { success: boolean; message?: string; payment?: PaymentRecord } {
    if (!this.checkActorAuthorization(actorUsername, 'payments:edit_pending', 'payment_record', paymentId)) {
      return {
        success: false,
        message: 'ليس لديك صلاحية تعديل سند تحصيل غير مؤكد (payments:edit_pending مطلوبة)'
      };
    }

    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: 'سجل سند التحصيل غير موجود' };
    }

    const existing = this.payments[index];

    // Strict Post-Confirmation Immutability Lock (never bypassable)
    if (existing.status !== 'pending') {
      this.addAuditLog(
        actorUsername,
        'SECURITY_BLOCK_CONFIRMED_PAYMENT_EDIT',
        'payment_record',
        paymentId,
        {
          receipt_code: existing.receipt_code,
          current_status: existing.status,
          attempted_reason: (reason || '').trim() || undefined,
          blocked: true
        },
        {
          id: existing.id,
          receipt_code: existing.receipt_code,
          status: existing.status,
          amount: existing.amount,
          currency: existing.currency
        }
      );
      return {
        success: false,
        message: existing.status === 'confirmed'
          ? 'لا يمكن تعديل السند بعد تأكيد السداد.'
          : existing.status === 'cancelled'
          ? 'لا يمكن تعديل سند تحصيل تم إلغاؤه.'
          : 'لا يمكن تعديل هذا السند لأن حالته لم تعد بانتظار التأكيد.'
      };
    }

    // Reject explicit attempts to tamper with protected fields via raw payloads
    const rawPayload = updates as Record<string, any>;
    if (
      (rawPayload.status !== undefined && rawPayload.status !== 'pending') ||
      (rawPayload.receipt_code !== undefined && rawPayload.receipt_code !== existing.receipt_code) ||
      (rawPayload.id !== undefined && rawPayload.id !== existing.id) ||
      rawPayload.confirmed_by !== undefined ||
      rawPayload.confirmed_at !== undefined
    ) {
      return {
        success: false,
        message: 'لا يُسمح بتعديل الحقول المحمية للسند (رقم السند أو حالة التأكيد).'
      };
    }

    // 1. Validate Amount
    const nextAmount = updates.amount !== undefined ? Number(updates.amount) : existing.amount;
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      return { success: false, message: 'يجب أن يكون مبلغ التحصيل رقماً موجباً أكبر من صفر.' };
    }

    // 2. Validate Currency
    const allowedCurrencies = ['EGP', 'USD'];
    const nextCurrency = (updates.currency ?? existing.currency ?? '').trim().toUpperCase();
    if (!allowedCurrencies.includes(nextCurrency)) {
      return { success: false, message: 'العملة المختارة غير صالحة (المسموح: EGP أو USD).' };
    }

    // 3. Validate Payment Method
    const allowedMethods = ['bank_transfer', 'cash', 'instapay', 'vodafone_cash', 'pos'];
    const nextMethod = String(updates.payment_method ?? existing.payment_method ?? '').trim();
    if (!allowedMethods.includes(nextMethod)) {
      return { success: false, message: 'طريقة الدفع المختارة غير معتمدة.' };
    }

    // 4. Validate Student & Linked Student File
    const nextStudentId = (updates.student_id ?? existing.student_id ?? '').trim();
    const targetStudent = this.students.find(s => s.id === nextStudentId);
    if (!targetStudent) {
      return { success: false, message: 'الطالب المرتبط بالسند غير موجود في النظام.' };
    }

    let nextStudentFileId = updates.student_file_id !== undefined
      ? updates.student_file_id.trim() || undefined
      : existing.student_file_id;
    if (nextStudentFileId) {
      const targetFile = this.studentFiles.find(f => f.id === nextStudentFileId);
      if (!targetFile) {
        return { success: false, message: 'ملف الطالب المرتبط غير موجود.' };
      }
      if (targetFile.student_id !== targetStudent.id) {
        return { success: false, message: 'ملف الطالب المحدد لا يتبع الطالب المختار.' };
      }
    }

    // 5. Validate Payer Name & Payment Description
    const nextPayerName = (updates.payer_name !== undefined ? updates.payer_name : existing.payer_name || '').trim();
    if (!nextPayerName) {
      return { success: false, message: 'اسم المودع / ولي الأمر حقل إلزامي لا يمكن تركه فارغاً.' };
    }

    const nextDescription = (
      updates.payment_description !== undefined
        ? updates.payment_description
        : (existing.payment_description || existing.notes || '')
    ).trim();
    if (!nextDescription) {
      return { success: false, message: 'بيان السداد (وذلك مقابل) حقل إلزامي لا يمكن تركه فارغاً.' };
    }

    // 6. Validate Payment Reference
    const nextReference = (updates.payment_reference !== undefined ? updates.payment_reference : existing.payment_reference || '').trim();

    // 7. Validate Receiving Account / Bank Name
    let nextAccountId = updates.financial_account_id !== undefined
      ? (updates.financial_account_id.trim() || undefined)
      : existing.financial_account_id;
    let nextAccountName = updates.financial_account_name !== undefined
      ? (updates.financial_account_name.trim() || undefined)
      : existing.financial_account_name;
    let nextBankName = updates.bank_name !== undefined
      ? (updates.bank_name.trim() || undefined)
      : existing.bank_name;

    if (nextAccountId) {
      const matchedAccount = this.financialAccounts.find(a => a.id === nextAccountId);
      if (!matchedAccount) {
        return { success: false, message: 'الحساب المالي المستلم المحدد غير موجود.' };
      }
      nextAccountName = matchedAccount.account_name_ar;
      nextBankName = matchedAccount.institution_name_ar || matchedAccount.account_name_ar;
    }

    // 8. Validate Payment Date (updates date component while preserving ISO format)
    let nextCreatedAt = existing.created_at;
    if (updates.payment_date !== undefined && updates.payment_date.trim() !== '') {
      const rawDate = updates.payment_date.trim();
      const parsed = rawDate.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? new Date(`${rawDate}T${(existing.created_at?.split('T')[1]) || '12:00:00.000Z'}`)
        : new Date(rawDate);
      if (isNaN(parsed.getTime())) {
        return { success: false, message: 'تاريخ السداد المُدخل غير صالح.' };
      }
      nextCreatedAt = parsed.toISOString();
    }

    // 9. Notes & Modification Reason
    const nextNotes = updates.notes !== undefined ? updates.notes.trim() : existing.notes;
    const trimmedReason = (reason || '').trim();
    const now = new Date().toISOString();

    const updatedRecord: PaymentRecord = {
      ...existing,
      // Explicitly preserve immutable identifiers and pending status
      id: existing.id,
      receipt_code: existing.receipt_code,
      status: 'pending',
      confirmed_by: undefined,
      confirmed_at: undefined,
      // Editable fields
      student_id: targetStudent.id,
      student_name: targetStudent.full_name_ar,
      student_file_id: nextStudentFileId,
      amount: nextAmount,
      currency: nextCurrency,
      payment_method: nextMethod,
      payment_reference: nextReference,
      financial_account_id: nextAccountId,
      financial_account_name: nextAccountName,
      bank_name: nextBankName,
      payer_name: nextPayerName,
      payment_description: nextDescription,
      notes: nextNotes || nextDescription,
      created_at: nextCreatedAt,
      updated_at: now,
      updated_by: actorUsername,
      last_edit_reason: trimmedReason || existing.last_edit_reason
    };

    // Compute exact changed fields for immutable audit trail
    const auditedFields: Array<keyof PaymentRecord> = [
      'created_at',
      'amount',
      'currency',
      'payment_method',
      'financial_account_id',
      'financial_account_name',
      'bank_name',
      'student_id',
      'student_name',
      'student_file_id',
      'payer_name',
      'payment_description',
      'payment_reference',
      'notes'
    ];

    const oldSnapshot: Record<string, any> = {
      receipt_code: existing.receipt_code,
      status: existing.status
    };
    const newSnapshot: Record<string, any> = {
      receipt_code: updatedRecord.receipt_code,
      status: updatedRecord.status
    };
    const changedFields: string[] = [];

    for (const field of auditedFields) {
      const oldVal = existing[field] ?? '';
      const newVal = updatedRecord[field] ?? '';
      if (String(oldVal) !== String(newVal)) {
        changedFields.push(String(field));
        oldSnapshot[String(field)] = existing[field] ?? null;
        newSnapshot[String(field)] = updatedRecord[field] ?? null;
      }
    }

    if (changedFields.length === 0) {
      return {
        success: true,
        payment: { ...existing },
        message: 'لم يتم إجراء أي تغييرات على بيانات السند.'
      };
    }

    newSnapshot.changed_fields = changedFields;
    if (trimmedReason) {
      newSnapshot.last_edit_reason = trimmedReason;
    }
    newSnapshot.updated_by = actorUsername;
    newSnapshot.updated_at = now;

    // Update in-place (zero duplicates, preserves receipt numbering)
    this.payments[index] = updatedRecord;
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // Record immutable audit trail entry (never deleted even after later confirmation)
    this.addAuditLog(
      actorUsername,
      'UPDATE_PENDING_PAYMENT',
      'payment_record',
      paymentId,
      newSnapshot,
      oldSnapshot
    );

    this.notify();
    return { success: true, payment: { ...updatedRecord } };
  }

  /**
   * Cancel an unconfirmed (pending) payment receipt.
   * Strict Rules:
   * - Requires dedicated 'payments:cancel_pending' permission (separate from edit, confirm, or reversal).
   * - Strictly rejects cancellation of confirmed payments (post-confirmation immutability lock).
   *   Requires reversal workflow ('عكس السند') if already confirmed.
   * - Cancellation reason is mandatory for financial audit.
   * - Preserves original receipt and records, keeping receipt_code, student, amounts for audit.
   * - Updates status to 'cancelled', records cancellation metadata.
   * - Excludes cancelled receipts from confirmed collections and pending totals.
   * - Adds permanent, immutable audit trail entry ('CANCEL_PENDING_PAYMENT').
   */
  public cancelPendingPayment(
    paymentId: string,
    reason: string,
    actorUsername: string
  ): { success: boolean; message?: string; payment?: PaymentRecord } {
    if (!this.checkActorAuthorization(actorUsername, 'payments:cancel_pending', 'payment_record', paymentId)) {
      return {
        success: false,
        message: 'ليس لديك صلاحية إلغاء سند تحصيل غير مؤكد (payments:cancel_pending مطلوبة)'
      };
    }

    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) {
      return { success: false, message: 'سجل سند التحصيل غير موجود' };
    }

    const payment = this.payments[index];

    // Post-confirmation lock: Once confirmed, direct cancellation is permanently prohibited
    if (payment.status === 'confirmed') {
      this.addAuditLog(
        actorUsername,
        'SECURITY_BLOCK_CONFIRMED_PAYMENT_CANCEL',
        'payment_record',
        paymentId,
        {
          receipt_code: payment.receipt_code,
          current_status: payment.status,
          attempted_reason: (reason || '').trim() || undefined,
          blocked: true
        },
        {
          id: payment.id,
          receipt_code: payment.receipt_code,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency
        }
      );
      return {
        success: false,
        message: 'لا يمكن إلغاء السند بعد تأكيد السداد. يمكن استخدام إجراء عكس السند وفق الصلاحيات المعتمدة.'
      };
    }

    if (payment.status === 'cancelled') {
      return { success: false, message: 'تم إلغاء هذا السند مسبقاً.' };
    }

    if (payment.status !== 'pending') {
      return { success: false, message: 'لا يمكن إلغاء هذا السند لأن حالته لم تعد بانتظار التأكيد.' };
    }

    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) {
      return { success: false, message: 'يرجى توضيح سبب إلغاء السند (حقل إلزامي للتدقيق المالي).' };
    }

    const now = new Date().toISOString();
    const updatedRecord: PaymentRecord = {
      ...payment,
      status: 'cancelled',
      cancelled_by: actorUsername,
      cancelled_at: now,
      cancellation_reason: trimmedReason,
      updated_at: now,
      updated_by: actorUsername,
      notes: payment.notes
        ? `${payment.notes} | [تم إلغاء السند]: ${trimmedReason}`
        : `[تم إلغاء السند]: ${trimmedReason}`
    };

    this.payments[index] = updatedRecord;
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // If attached to a student file, ensure registration fee paid flag remains consistent
    if (payment.student_file_id) {
      const remainingConfirmed = this.payments.filter(
        p => p.student_file_id === payment.student_file_id && p.status === 'confirmed' && p.id !== paymentId
      );
      if (remainingConfirmed.length === 0) {
        const fileIndex = this.studentFiles.findIndex(f => f.id === payment.student_file_id);
        if (fileIndex !== -1 && this.studentFiles[fileIndex].is_registered_fee_paid) {
          this.studentFiles[fileIndex].is_registered_fee_paid = false;
          this.studentFiles[fileIndex].last_updated_at = now;
          saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
        }
      }
    }

    // Add immutable audit log
    this.addAuditLog(
      actorUsername,
      'CANCEL_PENDING_PAYMENT',
      'payment_record',
      paymentId,
      {
        receipt_code: payment.receipt_code,
        status: 'cancelled',
        cancelled_by: actorUsername,
        cancelled_at: now,
        cancellation_reason: trimmedReason,
        amount: payment.amount,
        currency: payment.currency,
        student_id: payment.student_id,
        student_name: payment.student_name,
        student_file_id: payment.student_file_id,
        payment_method: payment.payment_method
      },
      {
        receipt_code: payment.receipt_code,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency
      }
    );

    this.notify();
    return { success: true, payment: { ...updatedRecord } };
  }

  public confirmPayment(paymentId: string, actorUsername: string, actorEmpId: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'payment_record', paymentId)) {
      return { success: false, message: 'ليس لديك صلاحية اعتماد الدفعات المالية (finance:approve مطلوبة)' };
    }
    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) return { success: false, message: 'سجل السداد غير موجود' };

    const payment = this.payments[index];
    if (payment.status !== 'pending') {
      return {
        success: false,
        message: payment.status === 'cancelled'
          ? 'لا يمكن تأكيد سداد سند تم إلغاؤه مسبقاً.'
          : payment.status === 'confirmed'
          ? 'تم تأكيد سداد هذا السند مسبقاً.'
          : 'لا يمكن تأكيد هذا السند لأن حالته لم تعد بانتظار التأكيد.'
      };
    }

    const now = new Date().toISOString();

    this.payments[index] = {
      ...payment,
      status: 'confirmed',
      confirmed_by: actorEmpId,
      confirmed_at: now
    };
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // If attached to a student file, update financial flags
    if (payment.student_file_id) {
      const fileIndex = this.studentFiles.findIndex(f => f.id === payment.student_file_id);
      if (fileIndex !== -1) {
        this.studentFiles[fileIndex].is_registered_fee_paid = true;
        this.studentFiles[fileIndex].last_updated_at = now;
        saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);

        this.recordFileActivity({
          student_file_id: payment.student_file_id,
          action_type: 'PAYMENT_CONFIRMED',
          previous_stage: this.studentFiles[fileIndex].current_status,
          new_stage: this.studentFiles[fileIndex].current_status,
          new_owner_id: this.studentFiles[fileIndex].current_owner_id,
          notes: `تم تأكيد سداد دفعة مالية بقيمة ${payment.amount.toLocaleString()} ${payment.currency} (إيصال: ${payment.receipt_code || payment.id})`
        }, actorUsername);
      }
    }

    this.addAuditLog(actorUsername, 'CONFIRM_PAYMENT', 'payment_record', paymentId, { status: 'confirmed', amount: payment.amount, currency: payment.currency });
    this.notify();
    return { success: true };
  }

  public rejectPayment(paymentId: string, reason: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:reject', 'payment_record', paymentId)) {
      return { success: false, message: 'ليس لديك صلاحية رفض الدفعات المالية (finance:reject مطلوبة)' };
    }
    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) return { success: false, message: 'سجل السداد غير موجود' };

    this.payments[index].status = 'rejected';
    this.payments[index].notes = reason ? `سبب الرفض: ${reason}` : this.payments[index].notes;
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    this.addAuditLog(actorUsername, 'REJECT_PAYMENT', 'payment_record', paymentId, { status: 'rejected', reason });
    this.notify();
    return { success: true };
  }

  public reversePayment(paymentId: string, reason: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'payment_record', paymentId)) {
      return { success: false, message: 'ليس لديك صلاحية عكس / استرداد الدفعات المالية (finance:approve مطلوبة)' };
    }
    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) return { success: false, message: 'سجل السداد غير موجود' };

    const payment = this.payments[index];
    this.payments[index] = {
      ...payment,
      status: 'reversed',
      notes: reason ? `[تم العكس / التسوية]: ${reason} — ${payment.notes || ''}` : payment.notes
    };
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

    // If attached to a student file, update financial flag if no other confirmed payments remain
    if (payment.student_file_id) {
      const remainingConfirmed = this.payments.filter(
        p => p.student_file_id === payment.student_file_id && p.status === 'confirmed' && p.id !== paymentId
      );
      if (remainingConfirmed.length === 0) {
        const fileIndex = this.studentFiles.findIndex(f => f.id === payment.student_file_id);
        if (fileIndex !== -1) {
          this.studentFiles[fileIndex].is_registered_fee_paid = false;
          this.studentFiles[fileIndex].last_updated_at = new Date().toISOString();
          saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
        }
      }
    }

    this.addAuditLog(actorUsername, 'REVERSE_PAYMENT', 'payment_record', paymentId, { status: 'reversed', reason, amount: payment.amount, currency: payment.currency });
    this.notify();
    return { success: true };
  }

  // --- Expenses (Fix 14) ---
  public getExpenses(): ExpenseRecord[] {
    return this.expenses.map(exp => ({
      ...exp,
      responsible_employee: this.employees.find(e => e.id === exp.responsible_employee_id)
    }));
  }

  public createExpense(expenseData: Omit<ExpenseRecord, 'id' | 'voucher_code' | 'created_at'>, actorUsername: string): ExpenseRecord | null {
    if (!this.checkActorAuthorization(actorUsername, 'finance:create', 'expense_record')) {
      return null;
    }
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const voucher_code = `EXP-2026-${String(this.expenses.length + 1).padStart(3, '0')}`;

    let eligibility_status = expenseData.eligibility_status;
    let ineligibility_reason = expenseData.ineligibility_reason;

    // Transaction lifecycle stage check for Employee Incentives (Modification 4)
    if (expenseData.category === 'employee_incentives' && (expenseData.transaction_number || expenseData.student_file_id)) {
      const file = this.studentFiles.find(
        f => (expenseData.transaction_number && f.file_code === expenseData.transaction_number) ||
             (expenseData.student_file_id && f.id === expenseData.student_file_id)
      );
      if (file) {
        if (file.current_status === 'closed') {
          eligibility_status = 'eligible';
          ineligibility_reason = undefined;
        } else {
          eligibility_status = 'pending_completion';
          ineligibility_reason = `المعاملة في مرحلة (${file.current_status}) ولم تصل بعد إلى مغلق + تقييم`;
        }
      }
    }

    const newExpense: ExpenseRecord = {
      ...expenseData,
      id,
      voucher_code,
      eligibility_status,
      ineligibility_reason,
      created_at: new Date().toISOString()
    };
    this.expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

    // Sync to employeeIncentives table if this is an employee incentive
    if (newExpense.category === 'employee_incentives' && newExpense.beneficiary_employee_id) {
      const incId = `inc-${Date.now().toString().slice(-4)}`;
      const incCode = `INC-2026-${String(this.employeeIncentives.length + 1).padStart(3, '0')}`;
      const newInc: EmployeeIncentiveRecord = {
        id: incId,
        incentive_code: incCode,
        employee_id: newExpense.beneficiary_employee_id,
        employee_name: newExpense.beneficiary_employee_name || this.employees.find(e => e.id === newExpense.beneficiary_employee_id)?.full_name_ar || 'موظف',
        employee_name_ar: newExpense.beneficiary_employee_name || this.employees.find(e => e.id === newExpense.beneficiary_employee_id)?.full_name_ar,
        department_id: String(newExpense.department_id || 'ops'),
        student_file_id: newExpense.student_file_id || '',
        transaction_number: newExpense.transaction_number || '',
        student_name: newExpense.student_name || 'طالب',
        service_type: 'university_admission',
        policy_id: newExpense.incentive_policy_id || 'pol-01',
        policy_version: 'v1.0',
        policy_name: newExpense.title_ar,
        incentive_type: newExpense.incentive_type || 'file_completion',
        amount: newExpense.amount,
        currency: newExpense.currency,
        calculation_note: newExpense.notes || 'مطالبة حافز مسجلة عبر سجل المصروفات',
        eligibility_status: eligibility_status || 'pending_completion',
        eligibility_note: ineligibility_reason,
        approval_status: (newExpense.status === 'approved' || newExpense.status === 'paid') ? 'approved' : 'pending_approval',
        payment_status: newExpense.status === 'paid' ? 'paid' : 'unpaid',
        expense_id: id,
        voucher_code: voucher_code,
        created_at: newExpense.created_at,
        updated_at: newExpense.created_at
      };
      this.employeeIncentives.unshift(newInc);
      saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
    }

    this.addAuditLog(actorUsername, 'CREATE_EXPENSE', 'expense_record', id, newExpense);

    // User-Specific Notification: Route approval request strictly to authorized approver
    if (newExpense.status === 'pending_approval') {
      const requiresGm = (newExpense.amount >= 25000 || newExpense.currency === 'USD');
      const approver = requiresGm
        ? (this.employees.find(e => e.position_id === 'gm' || e.id === 'emp-001') || { id: 'emp-001', full_name_ar: 'المدير العام', full_name_en: 'General Manager' })
        : (this.employees.find(e => e.roles.includes('fin_mgr') || e.id === 'emp-004') || { id: 'emp-004', full_name_ar: 'مدير الشؤون المالية', full_name_en: 'Finance Manager' });
      
      const actor = this.getEmployeeByUsername(actorUsername);
      this.addNotification({
        recipient_id: approver.id,
        recipient_user_id: approver.id,
        title_ar: `طلب اعتماد سند صرف: ${newExpense.voucher_code}`,
        title_en: `Expense Voucher Approval Requested: ${newExpense.voucher_code}`,
        description_ar: `سند صرف (${newExpense.title_ar}) بمبلغ ${newExpense.amount.toLocaleString()} ${newExpense.currency} بانتظار اعتمادكم`,
        description_en: `Expense voucher (${newExpense.title_en}) for ${newExpense.amount.toLocaleString()} ${newExpense.currency} awaiting your approval`,
        category: 'approval',
        module: 'finance',
        priority: requiresGm ? 'high' : 'medium',
        read: false,
        related_link: '/finance',
        related_id: newExpense.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return newExpense;
  }

  public canPayExpense(id: string): { allowed: boolean; reason?: string } {
    const exp = this.expenses.find(e => e.id === id);
    if (!exp) return { allowed: false, reason: 'سجل المصروف غير موجود' };
    if (exp.status === 'paid') return { allowed: false, reason: 'تم سداد هذا المصروف مسبقاً' };

    if (exp.category === 'employee_incentives') {
      const file = this.studentFiles.find(
        f => (exp.transaction_number && f.file_code === exp.transaction_number) ||
             (exp.student_file_id && f.id === exp.student_file_id)
      );
      if (!file) {
        return { allowed: false, reason: 'رقم المعاملة المرتبطة بالحافز غير موجود أو غير صالح.' };
      }
      if (file.current_status !== 'closed') {
        return {
          allowed: false,
          reason: 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
        };
      }
      // Check duplicate paid
      const alreadyPaid = this.expenses.some(
        e => e.id !== id && e.category === 'employee_incentives' && e.status === 'paid' &&
             e.transaction_number === exp.transaction_number &&
             e.beneficiary_employee_id === exp.beneficiary_employee_id &&
             e.incentive_type === exp.incentive_type
      );
      if (alreadyPaid) {
        return { allowed: false, reason: 'تم صرف هذا الحافز مسبقاً لهذه المعاملة.' };
      }
    }

    return { allowed: true };
  }

  public updateExpenseStatus(id: string, status: ExpenseRecord['status'], actorUsername: string, approverId?: string, reason?: string, paymentMethod?: string): boolean {
    const requiredPerm = (status === 'approved' || status === 'paid') ? 'finance:approve' : 'finance:reject';
    if (!this.checkActorAuthorization(actorUsername, requiredPerm, 'expense_record', id)) {
      return false;
    }
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) return false;

    const exp = this.expenses[index];

    // Mandatory Stage 10 check for Employee Incentives payout
    if (status === 'paid' && exp.category === 'employee_incentives') {
      const check = this.canPayExpense(id);
      if (!check.allowed) {
        return false;
      }
    }

    this.expenses[index].status = status;
    const now = new Date().toISOString();
    if (status === 'approved') {
      if (approverId) this.expenses[index].approved_by = approverId;
      this.expenses[index].approved_at = now;
    } else if (status === 'paid') {
      if (approverId) this.expenses[index].paid_by = approverId;
      this.expenses[index].paid_at = now;
      this.expenses[index].disbursed_by = approverId || actorUsername;
      this.expenses[index].disbursed_at = now;
      this.expenses[index].voucher_issue_date = now;
      if (paymentMethod) {
        this.expenses[index].payment_method = paymentMethod;
      }

      // Sync linked employee incentive to paid
      const incIdx = this.employeeIncentives.findIndex(
        i => i.expense_id === id || (i.transaction_number === exp.transaction_number && i.employee_id === exp.beneficiary_employee_id)
      );
      if (incIdx !== -1) {
        this.employeeIncentives[incIdx].payment_status = 'paid';
        this.employeeIncentives[incIdx].paid_by = approverId || actorUsername;
        this.employeeIncentives[incIdx].paid_at = now;
        this.employeeIncentives[incIdx].voucher_code = exp.voucher_code;
        saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
      }
    }
    if (reason) {
      this.expenses[index].notes = reason ? `${this.expenses[index].notes ? this.expenses[index].notes + ' | ' : ''}${reason}` : this.expenses[index].notes;
    }
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

    if (status === 'paid') {
      this.reconcileAccountMovements();
    }

    this.addAuditLog(actorUsername, `EXPENSE_${status.toUpperCase()}`, 'expense_record', id, { status, approverId, reason, paymentMethod });

    // User-Specific Notification: Inform responsible/beneficiary employee of decision
    const targetEmpId = exp.responsible_employee_id || exp.beneficiary_employee_id;
    if (targetEmpId) {
      const actor = this.getEmployeeByUsername(actorUsername);
      const statusAr = status === 'approved' ? 'اعتماد' : status === 'paid' ? 'صرف' : 'رفض';
      const statusEn = status === 'approved' ? 'Approved' : status === 'paid' ? 'Disbursed' : 'Rejected';
      this.addNotification({
        recipient_id: targetEmpId,
        recipient_user_id: targetEmpId,
        title_ar: `تم ${statusAr} سند المصروف: ${exp.voucher_code}`,
        title_en: `Expense Voucher ${statusEn}: ${exp.voucher_code}`,
        description_ar: status === 'rejected'
          ? `تم رفض سند المصروف (${exp.title_ar}) بواسطة ${actor?.full_name_ar || actorUsername}. السبب: ${reason || 'غير محدد'}`
          : `تم ${statusAr} سند المصروف (${exp.title_ar}) بمبلغ ${exp.amount.toLocaleString()} ${exp.currency} بنجاح`,
        description_en: `Expense voucher ${exp.voucher_code} was ${statusEn.toLowerCase()} by ${actor?.full_name_en || actorUsername}`,
        category: 'payment',
        module: 'finance',
        priority: status === 'rejected' ? 'high' : 'medium',
        read: false,
        related_link: '/finance',
        related_id: exp.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return true;
  }

  public updatePaymentMethod(paymentId: string, newMethod: string, reason: string, actorUsername: string): { success: boolean; message?: string } {
    if (
      !this.checkActorAuthorization(actorUsername, 'payments:edit_pending', 'payment_record', paymentId) &&
      !this.checkActorAuthorization(actorUsername, 'finance:edit', 'payment_record', paymentId)
    ) {
      return { success: false, message: 'ليس لديك صلاحية تعديل بيانات السداد (payments:edit_pending مطلوبة)' };
    }
    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) return { success: false, message: 'سجل السداد غير موجود' };
    if (this.payments[index].status !== 'pending') {
      return { success: false, message: 'لا يمكن تعديل السند بعد تأكيد السداد.' };
    }
    const oldMethod = this.payments[index].payment_method;
    this.payments[index].payment_method = newMethod as any;
    if (reason) {
      this.payments[index].notes = `${this.payments[index].notes ? this.payments[index].notes + ' | ' : ''}[تعديل طريقة الدفع من ${oldMethod} إلى ${newMethod}]: ${reason}`;
    }
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.addAuditLog(actorUsername, 'CORRECT_PAYMENT_METHOD', 'payment_record', paymentId, { oldMethod, newMethod, reason });
    this.notify();
    return { success: true };
  }

  public updatePaymentDescription(paymentId: string, newDescription: string, actorUsername: string): { success: boolean; message?: string; payment?: PaymentRecord } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:edit', 'payment_record', paymentId)) {
      return { success: false, message: 'ليس لديك صلاحية تعديل بيانات إيصال السداد (finance:edit مطلوبة)' };
    }
    const trimmed = (newDescription || '').trim();
    if (!trimmed) {
      return { success: false, message: 'وصف السداد (وذلك مقابل) حقل إلزامي لا يمكن تركه فارغاً' };
    }
    const index = this.payments.findIndex(p => p.id === paymentId);
    if (index === -1) return { success: false, message: 'سجل السداد غير موجود' };

    const oldRecord = { ...this.payments[index] };
    const oldDesc = oldRecord.payment_description || oldRecord.notes || '';

    // Modify ONLY payment_description and preserve all other financial properties
    this.payments[index] = {
      ...oldRecord,
      payment_description: trimmed
    };

    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    this.addAuditLog(actorUsername, 'UPDATE_PAYMENT_DESCRIPTION', 'payment_record', paymentId, {
      receipt_code: oldRecord.receipt_code,
      student_id: oldRecord.student_id,
      amount: oldRecord.amount,
      currency: oldRecord.currency,
      previous_description: oldDesc,
      new_description: trimmed
    });
    this.notify();
    return { success: true, payment: { ...this.payments[index] } };
  }

  public updateExpensePaymentMethod(expenseId: string, newMethod: string, reason: string, actorUsername: string): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:edit', 'expense_record', expenseId)) {
      return { success: false, message: 'ليس لديك صلاحية تعديل بيانات المصروف (finance:edit مطلوبة)' };
    }
    const index = this.expenses.findIndex(e => e.id === expenseId);
    if (index === -1) return { success: false, message: 'سجل المصروف غير موجود' };
    const oldMethod = this.expenses[index].payment_method;
    this.expenses[index].payment_method = newMethod as any;
    if (reason) {
      this.expenses[index].notes = `${this.expenses[index].notes ? this.expenses[index].notes + ' | ' : ''}[تعديل طريقة الدفع من ${oldMethod} إلى ${newMethod}]: ${reason}`;
    }
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    this.addAuditLog(actorUsername, 'CORRECT_EXPENSE_PAYMENT_METHOD', 'expense_record', expenseId, { oldMethod, newMethod, reason });
    this.notify();
    return { success: true };
  }

  // --- Budgets (Fix 15) ---
  public getBudgets(): DepartmentBudget[] {
    return [...this.budgets];
  }

  public createBudget(budgetData: Omit<DepartmentBudget, 'id' | 'budget_code' | 'created_at'>, actorUsername: string): DepartmentBudget | null {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'department_budget')) {
      return null;
    }
    const id = `bdg-${Date.now().toString().slice(-4)}`;
    const budget_code = `BDG-2026-${String(this.budgets.length + 1).padStart(3, '0')}`;
    const newBudget: DepartmentBudget = {
      ...budgetData,
      id,
      budget_code,
      created_at: new Date().toISOString()
    };
    this.budgets.unshift(newBudget);
    saveToStorage(STORAGE_KEYS.BUDGETS, this.budgets);
    this.addAuditLog(actorUsername, 'CREATE_BUDGET', 'department_budget', id, newBudget);
    this.notify();
    return newBudget;
  }

  public updateBudget(id: string, updates: Partial<DepartmentBudget>, actorUsername: string): DepartmentBudget | null {
    const index = this.budgets.findIndex(b => b.id === id);
    if (index === -1) return null;
    const old = this.budgets[index];
    this.budgets[index] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.BUDGETS, this.budgets);
    this.addAuditLog(actorUsername, 'UPDATE_BUDGET', 'department_budget', id, updates, old);
    this.notify();
    return this.budgets[index];
  }

  // --- Exchange Rate (Fix 12) ---
  public getExchangeRate(): ExchangeRate {
    return { ...this.exchangeRate };
  }

  public updateExchangeRate(rate: number, source: string, actorUsername: string): ExchangeRate {
    this.exchangeRate = {
      ...this.exchangeRate,
      rate,
      source: source || this.exchangeRate.source,
      last_updated_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.EXCHANGE_RATE, this.exchangeRate);
    this.addAuditLog(actorUsername, 'UPDATE_EXCHANGE_RATE', 'exchange_rate', 'usd_egp', { rate, source });
    this.notify();
    return { ...this.exchangeRate };
  }

  // --- Financial Accounts & Treasury (Modification 5) ---
  public getFinancialAccounts(): FinancialAccount[] {
    return this.financialAccounts.map(a => ({ ...a }));
  }

  public getFinancialAccountById(id: string): FinancialAccount | undefined {
    const acc = this.financialAccounts.find(a => a.id === id);
    return acc ? { ...acc } : undefined;
  }

  // --- Incentive Policies (Modification 3) ---
  public getIncentivePolicies(): IncentivePolicy[] {
    return this.incentivePolicies.map(p => ({ ...p }));
  }

  public createIncentivePolicy(policyData: Omit<IncentivePolicy, 'id'>, actorUsername: string): IncentivePolicy | null {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'incentive_policy')) {
      return null;
    }
    const id = `pol-${Date.now().toString().slice(-4)}`;
    const newPolicy: IncentivePolicy = {
      ...policyData,
      id
    };
    this.incentivePolicies.push(newPolicy);
    saveToStorage(STORAGE_KEYS.INCENTIVE_POLICIES, this.incentivePolicies);
    this.addAuditLog(actorUsername, 'CREATE_INCENTIVE_POLICY', 'incentive_policy', id, newPolicy);
    this.notify();
    return newPolicy;
  }

  public updateIncentivePolicy(id: string, updates: Partial<IncentivePolicy>, actorUsername: string): boolean {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'incentive_policy', id)) {
      return false;
    }
    const idx = this.incentivePolicies.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.incentivePolicies[idx] = { ...this.incentivePolicies[idx], ...updates };
    saveToStorage(STORAGE_KEYS.INCENTIVE_POLICIES, this.incentivePolicies);
    this.addAuditLog(actorUsername, 'UPDATE_INCENTIVE_POLICY', 'incentive_policy', id, updates);
    this.notify();
    return true;
  }

  // --- Employee Incentives Tracking & Payout (Modifications 3 & 4) ---
  public getEmployeeIncentives(): EmployeeIncentiveRecord[] {
    return this.employeeIncentives.map(inc => ({
      ...inc,
      employee_name: this.employees.find(e => e.id === inc.employee_id)?.full_name_ar || inc.employee_name
    }));
  }

  public createEmployeeIncentive(
    data: Omit<EmployeeIncentiveRecord, 'id' | 'incentive_code' | 'created_at' | 'updated_at' | 'payment_status'> & { payment_status?: 'unpaid' | 'paid' },
    actorUsername: string
  ): { success: boolean; message?: string; incentive?: EmployeeIncentiveRecord } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:create', 'employee_incentive')) {
      return { success: false, message: 'ليس لديك صلاحية تسجيل حوافز الموظفين' };
    }

    // Verify linked student transaction
    const file = this.studentFiles.find(
      f => (data.transaction_number && f.file_code === data.transaction_number) ||
           (data.student_file_id && f.id === data.student_file_id)
    );

    let eligibility_status = data.eligibility_status;
    let eligibility_note = data.eligibility_note;

    if (file) {
      if (file.current_status === 'closed') {
        eligibility_status = 'eligible';
        eligibility_note = undefined;
      } else {
        eligibility_status = 'pending_completion';
        eligibility_note = `المعاملة في مرحلة (${file.current_status}) ولم تصل بعد إلى مغلق + تقييم`;
      }
    }

    const id = `inc-${Date.now().toString().slice(-4)}`;
    const incentive_code = `INC-2026-${String(this.employeeIncentives.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newInc: EmployeeIncentiveRecord = {
      ...data,
      id,
      incentive_code,
      eligibility_status,
      eligibility_note,
      payment_status: 'unpaid',
      created_at: now,
      updated_at: now
    };

    this.employeeIncentives.unshift(newInc);
    saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
    this.addAuditLog(actorUsername, 'CREATE_EMPLOYEE_INCENTIVE', 'employee_incentive', id, newInc);
    this.notify();
    return { success: true, incentive: newInc };
  }

  public updateEmployeeIncentiveStatus(
    id: string,
    status: EmployeeIncentiveRecord['approval_status'],
    actorUsername: string
  ): { success: boolean; message?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'employee_incentive', id)) {
      return { success: false, message: 'ليس لديك صلاحية اعتماد حوافز الموظفين' };
    }
    const idx = this.employeeIncentives.findIndex(i => i.id === id);
    if (idx === -1) return { success: false, message: 'سجل الحافز غير موجود' };

    this.employeeIncentives[idx].approval_status = status;
    this.employeeIncentives[idx].approved_by = actorUsername;
    this.employeeIncentives[idx].approved_at = new Date().toISOString();
    this.employeeIncentives[idx].updated_at = new Date().toISOString();

    // If an associated expense exists, update its status as well
    if (this.employeeIncentives[idx].expense_id) {
      const expIdx = this.expenses.findIndex(e => e.id === this.employeeIncentives[idx].expense_id);
      if (expIdx !== -1) {
        this.expenses[expIdx].status = status === 'approved' ? 'approved' : 'rejected';
        saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
      }
    }

    saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
    this.addAuditLog(actorUsername, 'APPROVE_EMPLOYEE_INCENTIVE', 'employee_incentive', id, { status });
    this.notify();
    return { success: true };
  }

  public payEmployeeIncentive(
    id: string,
    paymentMethod: string,
    accountId: string,
    actorUsername: string
  ): { success: boolean; message?: string; expense?: ExpenseRecord } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'employee_incentive', id)) {
      return { success: false, message: 'ليس لديك صلاحية صرف وسداد الحوافز' };
    }

    const idx = this.employeeIncentives.findIndex(i => i.id === id);
    if (idx === -1) return { success: false, message: 'سجل الحافز غير موجود' };
    const inc = this.employeeIncentives[idx];

    if (inc.payment_status === 'paid') {
      return { success: false, message: 'تم صرف هذا الحافز مسبقاً ولا يمكن تكرار الصرف.' };
    }

    // MANDATORY ELIGIBILITY VERIFICATION (Modification 4)
    const file = this.studentFiles.find(
      f => (inc.transaction_number && f.file_code === inc.transaction_number) ||
           (inc.student_file_id && f.id === inc.student_file_id)
    );

    if (!file) {
      return { success: false, message: 'رقم المعاملة المرتبطة بالحافز غير موجود أو غير صالح.' };
    }

    if (file.current_status !== 'closed') {
      return {
        success: false,
        message: 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
      };
    }

    // Duplicate payout check across existing paid expenses
    const alreadyPaid = this.expenses.some(
      e => e.category === 'employee_incentives' && e.status === 'paid' &&
           e.transaction_number === inc.transaction_number &&
           e.beneficiary_employee_id === inc.employee_id &&
           e.incentive_type === inc.incentive_type
    );
    if (alreadyPaid) {
      return { success: false, message: 'تم صرف هذا الحافز مسبقاً لهذه المعاملة.' };
    }

    const now = new Date().toISOString();
    const voucher_code = `PV-INC-2026-${String(this.expenses.length + 1).padStart(3, '0')}`;
    const acc = this.financialAccounts.find(a => a.id === accountId) || this.financialAccounts[0];

    // Create formal paid ExpenseRecord
    const newExpense: ExpenseRecord = {
      id: `exp-inc-${Date.now().toString().slice(-4)}`,
      voucher_code,
      title_ar: `صرف ${inc.policy_name} - ${inc.employee_name}`,
      title_en: `Disbursement of ${inc.policy_name} - ${inc.employee_name}`,
      category: 'employee_incentives',
      department_id: inc.department_id,
      amount: inc.amount,
      currency: inc.currency,
      payment_method: paymentMethod as any,
      financial_account_id: acc.id,
      financial_account_name: acc.account_name_ar,
      bank_name: acc.institution_name_ar,
      responsible_employee_id: inc.employee_id,
      beneficiary_employee_id: inc.employee_id,
      beneficiary_employee_name: inc.employee_name,
      transaction_number: inc.transaction_number,
      student_file_id: inc.student_file_id,
      student_name: inc.student_name,
      incentive_type: inc.incentive_type,
      incentive_policy_id: inc.policy_id,
      incentive_calculation_reference: `${inc.policy_name} (${inc.policy_version})`,
      eligibility_status: 'eligible',
      status: 'paid',
      approved_by: actorUsername,
      approved_at: now,
      paid_by: actorUsername,
      paid_at: now,
      disbursed_by: actorUsername,
      disbursed_at: now,
      voucher_issue_date: now,
      notes: `صرف حافز إنجاز ومكافأة لمعاملة الطالب: ${inc.student_name} (${inc.transaction_number})`,
      created_at: now
    };

    this.expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

    // Update EmployeeIncentiveRecord
    this.employeeIncentives[idx].payment_status = 'paid';
    this.employeeIncentives[idx].approval_status = 'approved';
    this.employeeIncentives[idx].paid_by = actorUsername;
    this.employeeIncentives[idx].paid_at = now;
    this.employeeIncentives[idx].expense_id = newExpense.id;
    this.employeeIncentives[idx].voucher_code = voucher_code;
    this.employeeIncentives[idx].payment_method = paymentMethod as any;
    this.employeeIncentives[idx].financial_account_id = acc.id;
    this.employeeIncentives[idx].financial_account_name = acc.account_name_ar;
    this.employeeIncentives[idx].updated_at = now;
    saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);

    // Update Account Movements
    this.reconcileAccountMovements();

    this.addAuditLog(actorUsername, 'PAY_EMPLOYEE_INCENTIVE', 'employee_incentive', id, {
      voucher_code,
      amount: inc.amount,
      currency: inc.currency,
      employee_id: inc.employee_id,
      transaction_number: inc.transaction_number
    });

    this.notify();
    return { success: true, expense: newExpense };
  }

  // --- Complete Account Movement Ledger (Modification 5) ---
  public getAccountMovements(): AccountMovement[] {
    return this.accountMovements.map(m => ({ ...m }));
  }

  public createInternalTransfer(
    transferData: Omit<InternalTransfer, 'id' | 'transfer_code' | 'created_at' | 'status' | 'executed_by'> & { status?: 'completed' | 'cancelled'; executed_by?: string },
    actorUsername: string
  ): { success: boolean; message?: string; transfer?: InternalTransfer } {
    if (!this.checkActorAuthorization(actorUsername, 'finance:approve', 'internal_transfer')) {
      return { success: false, message: 'ليس لديك صلاحية إجراء تحويلات مالية بين الحسابات' };
    }

    if (transferData.from_account_id === transferData.to_account_id) {
      return { success: false, message: 'لا يمكن التحويل لنفس الحساب المالي' };
    }

    if (transferData.amount <= 0) {
      return { success: false, message: 'مبلغ التحويل يجب أن يكون أكبر من صفر' };
    }

    const id = `trf-${Date.now().toString().slice(-4)}`;
    const transfer_code = `TRF-2026-${String(this.internalTransfers.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const transfer: InternalTransfer = {
      ...transferData,
      id,
      transfer_code,
      status: 'completed',
      executed_by: actorUsername,
      created_at: now
    };

    this.internalTransfers.unshift(transfer);
    saveToStorage(STORAGE_KEYS.INTERNAL_TRANSFERS, this.internalTransfers);

    this.reconcileAccountMovements();

    this.addAuditLog(actorUsername, 'CREATE_INTERNAL_TRANSFER', 'internal_transfer', id, transfer);
    this.notify();
    return { success: true, transfer };
  }

  public reconcileAccountMovements(skipSave: boolean = false): void {
    const movements: AccountMovement[] = [];

    const getChannel = (method?: string | null): StandardPaymentMethod => {
      if (!method) return 'cash';
      const m = String(method).toLowerCase().trim();
      if (m === 'bank_transfer' || m === 'bank' || m === 'card' || m === 'pos' || m === 'wire' || m.includes('بنك')) return 'bank_transfer';
      if (m === 'cash' || m === 'petty_cash' || m === 'treasury' || m.includes('نقد')) return 'cash';
      if (m === 'instapay' || m === 'insta' || m.includes('انستا') || m.includes('إنستا')) return 'instapay';
      if (m === 'vodafone_cash' || m === 'vodafone' || m === 'vfcash' || m.includes('فودافون')) return 'vodafone_cash';
      return 'cash';
    };

    // 1. Confirmed Payments -> Receipt Vouchers (Debit)
    this.payments.filter(p => p.status === 'confirmed').forEach(p => {
      const channel = getChannel(p.payment_method);
      const acc = this.financialAccounts.find(a => a.channel === channel) || this.financialAccounts[0];
      movements.push({
        id: `mov-rcp-${p.id}`,
        movement_code: `MOV-${p.receipt_code || p.id}`,
        account_id: p.financial_account_id || acc.id,
        account_name_ar: p.financial_account_name || acc.account_name_ar,
        account_name_en: acc.account_name_en,
        channel,
        posting_date: p.confirmed_at || p.created_at,
        document_type: 'receipt_voucher',
        document_number: p.receipt_code,
        transaction_reference: p.student_file_id || p.student_name,
        description_ar: `تحصيل رسوم سداد - ${p.student_name || 'طالب'} (إيصال: ${p.receipt_code})`,
        description_en: `Fee receipt payment - ${p.student_name || 'Student'} (${p.receipt_code})`,
        debit_amount: p.amount,
        credit_amount: 0,
        currency: (p.currency === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
        running_balance: 0,
        source_entity_type: 'payment_record',
        source_entity_id: p.id,
        recorded_by: p.confirmed_by || 'محاسب الخزينة',
        created_at: p.created_at
      });
    });

    // 2. Reversed Payments -> Offsetting Credit Adjustments
    this.payments.filter(p => p.status === 'reversed').forEach(p => {
      const channel = getChannel(p.payment_method);
      const acc = this.financialAccounts.find(a => a.channel === channel) || this.financialAccounts[0];
      movements.push({
        id: `mov-rev-${p.id}`,
        movement_code: `MOV-REV-${p.receipt_code || p.id}`,
        account_id: p.financial_account_id || acc.id,
        account_name_ar: p.financial_account_name || acc.account_name_ar,
        account_name_en: acc.account_name_en,
        channel,
        posting_date: p.created_at,
        document_type: 'adjustment',
        document_number: `REV-${p.receipt_code}`,
        transaction_reference: p.student_file_id || p.student_name,
        description_ar: `عكس / استرداد سداد - ${p.student_name || ''} (${p.notes || ''})`,
        description_en: `Payment Reversal - ${p.student_name || ''}`,
        debit_amount: 0,
        credit_amount: p.amount,
        currency: (p.currency === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
        running_balance: 0,
        source_entity_type: 'payment_record',
        source_entity_id: p.id,
        recorded_by: 'المراجع المالي',
        created_at: p.created_at
      });
    });

    // 3. Paid Expenses -> Payment Vouchers (Credit)
    this.expenses.filter(e => e.status === 'paid').forEach(e => {
      const channel = getChannel(e.payment_method);
      const acc = this.financialAccounts.find(a => a.channel === channel) || this.financialAccounts[0];
      movements.push({
        id: `mov-exp-${e.id}`,
        movement_code: `MOV-${e.voucher_code || e.id}`,
        account_id: e.financial_account_id || acc.id,
        account_name_ar: e.financial_account_name || acc.account_name_ar,
        account_name_en: acc.account_name_en,
        channel,
        posting_date: e.paid_at || e.created_at,
        document_type: e.category === 'employee_incentives' ? 'incentive_voucher' : 'payment_voucher',
        document_number: e.voucher_code,
        transaction_reference: e.transaction_number || '',
        description_ar: e.title_ar,
        description_en: e.title_en,
        debit_amount: 0,
        credit_amount: e.amount,
        currency: (e.currency === 'USD' ? 'USD' : 'EGP') as 'EGP' | 'USD',
        running_balance: 0,
        source_entity_type: 'expense_record',
        source_entity_id: e.id,
        recorded_by: e.paid_by || e.disbursed_by || 'المحاسب المالي',
        department_id: String(e.department_id || ''),
        employee_id: e.beneficiary_employee_id || e.responsible_employee_id,
        created_at: e.created_at
      });
    });

    // 4. Internal Transfers -> Linked Movements
    this.internalTransfers.filter(t => t.status === 'completed').forEach(t => {
      const fromAcc = this.financialAccounts.find(a => a.id === t.from_account_id) || this.financialAccounts[0];
      const toAcc = this.financialAccounts.find(a => a.id === t.to_account_id) || this.financialAccounts[1];

      // Outgoing from source
      movements.push({
        id: `mov-trf-out-${t.id}`,
        movement_code: `MOV-${t.transfer_code}-OUT`,
        account_id: fromAcc.id,
        account_name_ar: fromAcc.account_name_ar,
        account_name_en: fromAcc.account_name_en,
        channel: fromAcc.channel,
        posting_date: t.transfer_date,
        document_type: 'transfer_out',
        document_number: t.transfer_code,
        description_ar: `تحويل صادر إلى ${toAcc.account_name_ar} ${t.reference_note ? '(' + t.reference_note + ')' : ''}`,
        description_en: `Transfer out to ${toAcc.account_name_en}`,
        debit_amount: 0,
        credit_amount: t.amount,
        currency: t.currency,
        running_balance: 0,
        source_entity_type: 'internal_transfer',
        source_entity_id: t.id,
        recorded_by: t.executed_by,
        created_at: t.created_at
      });

      // Incoming to destination
      movements.push({
        id: `mov-trf-in-${t.id}`,
        movement_code: `MOV-${t.transfer_code}-IN`,
        account_id: toAcc.id,
        account_name_ar: toAcc.account_name_ar,
        account_name_en: toAcc.account_name_en,
        channel: toAcc.channel,
        posting_date: t.transfer_date,
        document_type: 'transfer_in',
        document_number: t.transfer_code,
        description_ar: `تحويل وارد من ${fromAcc.account_name_ar} ${t.reference_note ? '(' + t.reference_note + ')' : ''}`,
        description_en: `Transfer in from ${fromAcc.account_name_en}`,
        debit_amount: t.amount,
        credit_amount: 0,
        currency: t.currency,
        running_balance: 0,
        source_entity_type: 'internal_transfer',
        source_entity_id: t.id,
        recorded_by: t.executed_by,
        created_at: t.created_at
      });
    });

    // 5. Deterministic Chronological Sorting (Ascending)
    movements.sort((a, b) => {
      const diff = new Date(a.posting_date).getTime() - new Date(b.posting_date).getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    // 6. Running Balance Calculation per Account & Currency
    const runningBalances: Record<string, number> = {};
    movements.forEach(m => {
      const key = `${m.account_id}_${m.currency}`;
      if (runningBalances[key] === undefined) {
        runningBalances[key] = 0;
      }
      runningBalances[key] += m.debit_amount - m.credit_amount;
      m.running_balance = runningBalances[key];
    });

    this.accountMovements = movements;
    if (!skipSave) {
      saveToStorage(STORAGE_KEYS.ACCOUNT_MOVEMENTS, this.accountMovements);
    }
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    return this.tasks.map(t => ({
      ...t,
      assignee: this.employees.find(e => e.id === t.assignee_id)
    }));
  }

  public createTask(taskData: Omit<Task, 'id' | 'task_code' | 'created_at'>, actorUsername: string): Task {
    const id = `tsk-${Date.now().toString().slice(-4)}`;
    const task_code = `BCT-TSK-${String(this.tasks.length + 1).padStart(3, '0')}`;
    const newTask: Task = {
      ...taskData,
      id,
      task_code,
      created_at: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.addAuditLog(actorUsername, 'CREATE_TASK', 'task', id, newTask);

    // User-Specific Notification: Inform assigned employee immediately
    if (newTask.assignee_id) {
      const actor = this.getEmployeeByUsername(actorUsername);
      this.addNotification({
        recipient_id: newTask.assignee_id,
        recipient_user_id: newTask.assignee_id,
        title_ar: `مهمة جديدة مسندة إليك: ${newTask.title}`,
        title_en: `New Task Assigned: ${newTask.title}`,
        description_ar: newTask.description || `تم إسناد مهمة (${newTask.task_code}) إليك بواسطة ${actor?.full_name_ar || actorUsername}`,
        description_en: newTask.description || `Task (${newTask.task_code}) was assigned to you by ${actor?.full_name_en || actorUsername}`,
        category: 'task',
        module: 'tasks',
        priority: newTask.priority || 'medium',
        read: false,
        related_link: '/tasks',
        related_id: newTask.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: Task['status'], actorUsername: string): boolean {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return false;
    const oldStatus = this.tasks[index].status;
    this.tasks[index].status = status;
    if (status === 'completed') {
      this.tasks[index].completed_at = new Date().toISOString();
    }
    saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.addAuditLog(actorUsername, 'UPDATE_TASK_STATUS', 'task', taskId, { from: oldStatus, to: status });

    // User-Specific Notification: Notify creator on completion or assignee on update
    const task = this.tasks[index];
    const actor = this.getEmployeeByUsername(actorUsername);
    if (status === 'completed') {
      if (task.creator_id && task.creator_id !== actor?.id) {
        this.addNotification({
          recipient_id: task.creator_id,
          recipient_user_id: task.creator_id,
          title_ar: `تم إكمال المهمة: ${task.title}`,
          title_en: `Task Completed: ${task.title}`,
          description_ar: `قام ${actor?.full_name_ar || actorUsername} بإكمال المهمة (${task.task_code}) بنجاح`,
          description_en: `${actor?.full_name_en || actorUsername} completed task (${task.task_code})`,
          category: 'task',
          module: 'tasks',
          priority: 'medium',
          read: false,
          related_link: '/tasks',
          related_id: task.id,
          sender_name: actor?.full_name_ar || actorUsername
        });
      }
    } else if (task.assignee_id && task.assignee_id !== actor?.id) {
      this.addNotification({
        recipient_id: task.assignee_id,
        recipient_user_id: task.assignee_id,
        title_ar: `تحديث في حالة المهمة: ${task.title}`,
        title_en: `Task Status Updated: ${task.title}`,
        description_ar: `تم تغيير حالة المهمة (${task.task_code}) إلى (${status}) بواسطة ${actor?.full_name_ar || actorUsername}`,
        description_en: `Task (${task.task_code}) status changed to (${status}) by ${actor?.full_name_en || actorUsername}`,
        category: 'task',
        module: 'tasks',
        priority: 'medium',
        read: false,
        related_link: '/tasks',
        related_id: task.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return true;
  }

  // --- Complaints ---
  public getComplaints(): Complaint[] {
    return this.complaints.map(c => ({
      ...c,
      assigned_resolver: this.employees.find(e => e.id === c.assigned_resolver_id)
    }));
  }

  public createComplaint(complaintData: Omit<Complaint, 'id' | 'ticket_code' | 'created_at'>, actorUsername: string): Complaint {
    const id = `cmp-${Date.now().toString().slice(-4)}`;
    const ticket_code = `BCT-CMP-2026-${String(this.complaints.length + 1).padStart(3, '0')}`;
    const newComplaint: Complaint = {
      ...complaintData,
      id,
      ticket_code,
      created_at: new Date().toISOString()
    };
    this.complaints.unshift(newComplaint);
    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
    this.addAuditLog(actorUsername, 'CREATE_COMPLAINT', 'complaint', id, newComplaint);

    // User-Specific Notification: Notify assigned resolver
    if (newComplaint.assigned_resolver_id) {
      const actor = this.getEmployeeByUsername(actorUsername);
      this.addNotification({
        recipient_id: newComplaint.assigned_resolver_id,
        recipient_user_id: newComplaint.assigned_resolver_id,
        title_ar: `تذكرة شكوى مسندة إليك: ${newComplaint.ticket_code}`,
        title_en: `Complaint Ticket Assigned: ${newComplaint.ticket_code}`,
        description_ar: `شكوى جديدة: ${newComplaint.title || newComplaint.description} - الأولوية: ${newComplaint.priority}`,
        description_en: `New complaint: ${newComplaint.title || newComplaint.description} - Priority: ${newComplaint.priority}`,
        category: 'complaint',
        module: 'quality',
        priority: newComplaint.priority === 'critical' ? 'urgent' : newComplaint.priority === 'high' ? 'high' : 'medium',
        read: false,
        related_link: '/complaints',
        related_id: newComplaint.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return newComplaint;
  }

  public resolveComplaint(
    ticketId: string,
    rootCause: string,
    correctiveAction: string,
    preventativeAction: string,
    actorUsername: string
  ): boolean {
    const index = this.complaints.findIndex(c => c.id === ticketId);
    if (index === -1) return false;

    this.complaints[index] = {
      ...this.complaints[index],
      status: 'resolved',
      root_cause_analysis: rootCause,
      corrective_action: correctiveAction,
      preventative_action: preventativeAction,
      resolved_at: new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
    this.addAuditLog(actorUsername, 'RESOLVE_COMPLAINT', 'complaint', ticketId, { rootCause, correctiveAction });

    // User-Specific Notification: Notify QA Manager of resolution
    const cmp = this.complaints[index];
    const actor = this.getEmployeeByUsername(actorUsername);
    const qaMgr = this.employees.find(e => e.roles.includes('qa_mgr') || e.department_id === 'qa');
    const notifyTarget = (cmp.assigned_resolver_id && cmp.assigned_resolver_id !== actor?.id)
      ? cmp.assigned_resolver_id
      : (qaMgr && qaMgr.id !== actor?.id ? qaMgr.id : null);
    if (notifyTarget) {
      this.addNotification({
        recipient_id: notifyTarget,
        recipient_user_id: notifyTarget,
        title_ar: `تم حل تذكرة الشكوى: ${cmp.ticket_code}`,
        title_en: `Complaint Ticket Resolved: ${cmp.ticket_code}`,
        description_ar: `تم توثيق السبب الجذري والإجراء التصحيحي بواسطة ${actor?.full_name_ar || actorUsername}`,
        description_en: `Root cause and corrective action documented by ${actor?.full_name_en || actorUsername}`,
        category: 'complaint',
        module: 'quality',
        priority: 'medium',
        read: false,
        related_link: '/complaints',
        related_id: cmp.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return true;
  }

  public updateComplaintCorrectiveAction(
    ticketId: string,
    updates: {
      rootCause?: string;
      correctiveAction?: string;
      preventativeAction?: string;
      status?: Complaint['status'];
    },
    actorUsername: string
  ): boolean {
    const index = this.complaints.findIndex(c => c.id === ticketId || c.ticket_code === ticketId);
    if (index === -1) return false;

    const current = this.complaints[index];
    const newStatus = updates.status || (updates.rootCause && updates.correctiveAction ? 'resolved' : current.status);
    this.complaints[index] = {
      ...current,
      root_cause_analysis: updates.rootCause !== undefined ? updates.rootCause : current.root_cause_analysis,
      corrective_action: updates.correctiveAction !== undefined ? updates.correctiveAction : current.corrective_action,
      preventative_action: updates.preventativeAction !== undefined ? updates.preventativeAction : current.preventative_action,
      status: newStatus,
      resolved_at: newStatus === 'resolved' || newStatus === 'closed' ? (current.resolved_at || new Date().toISOString()) : current.resolved_at
    };
    saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
    this.addAuditLog(actorUsername, 'UPDATE_COMPLAINT_CORRECTIVE_ACTION', 'complaint', current.id, updates, current);
    this.notify();
    return true;
  }

  public escalateStagnantFile(
    fileId: string,
    escalation: {
      targetDepartmentId: DepartmentId;
      targetAssigneeId: string;
      reasonAr: string;
      reasonEn: string;
      priority: 'high' | 'urgent';
    },
    actorUsername: string
  ): { success: boolean; task?: Task; message?: string } {
    const file = this.studentFiles.find(f => f.id === fileId || f.file_code === fileId);
    if (!file) return { success: false, message: 'الملف غير موجود' };

    const actor = this.getEmployeeByUsername(actorUsername);
    const actorId = actor ? actor.id : 'emp-001';

    // Create an urgent supervisor escalation task
    const taskTitle = `[تصعيد عاجل - ركود ملف] ${file.file_code} - ${file.student?.full_name_ar || 'طالب'}`;
    const taskDescription = `${escalation.reasonAr} | Assigned to supervisor for immediate resolution.`;

    const createdTask = this.createTask({
      title: taskTitle,
      description: taskDescription,
      student_file_id: file.id,
      department_id: escalation.targetDepartmentId,
      creator_id: actorId,
      assignee_id: escalation.targetAssigneeId,
      priority: escalation.priority,
      status: 'assigned',
      deadline_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    }, actorUsername);

    // Record activity on file
    this.recordFileActivity({
      student_file_id: file.id,
      action_type: 'NOTE_ADDED',
      notes: `[تصعيد للإدارة]: تم تصعيد الملف رسمياً بمهمة رقابية (${createdTask.task_code}). السبب: ${escalation.reasonAr}`,
      details: { taskId: createdTask.id, taskCode: createdTask.task_code, priority: escalation.priority }
    }, actorUsername);

    // Update file's last_updated_at so escalation is registered
    const fileIdx = this.studentFiles.findIndex(f => f.id === file.id);
    if (fileIdx !== -1) {
      this.studentFiles[fileIdx] = {
        ...this.studentFiles[fileIdx],
        last_updated_at: new Date().toISOString()
      };
      saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
    }

    this.addAuditLog(actorUsername, 'ESCALATE_STAGNANT_FILE', 'student_file', file.id, {
      fileCode: file.file_code,
      taskId: createdTask.id,
      taskCode: createdTask.task_code,
      escalation
    });
    this.notify();

    return { success: true, task: createdTask, message: 'تم تصعيد الملف وإنشاء مهمة رقابية عاجلة بنجاح' };
  }

  // --- Departmental Handoffs ---
  public getHandoffs(): DepartmentalHandoff[] {
    return [...this.handoffs];
  }

  public createHandoff(handoffData: Omit<DepartmentalHandoff, 'id' | 'created_at'>, actorUsername: string): DepartmentalHandoff {
    const id = `hnd-${Date.now().toString().slice(-4)}`;
    const newHandoff: DepartmentalHandoff = {
      ...handoffData,
      id,
      created_at: new Date().toISOString()
    };
    this.handoffs.unshift(newHandoff);
    saveToStorage(STORAGE_KEYS.HANDOFFS, this.handoffs);
    this.addAuditLog(actorUsername, 'CREATE_HANDOFF', 'departmental_handoff', id, newHandoff);

    // User-Specific Notification: Inform recipient employee or target department manager
    let targetRecipientId = newHandoff.recipient_id;
    if (!targetRecipientId) {
      const deptMgr = this.employees.find(e => e.department_id === newHandoff.receiving_department_id && (e.roles.some(r => r.includes('mgr') || r.includes('lead'))));
      targetRecipientId = deptMgr?.id;
    }
    if (targetRecipientId) {
      const actor = this.getEmployeeByUsername(actorUsername);
      this.addNotification({
        recipient_id: targetRecipientId,
        recipient_user_id: targetRecipientId,
        title_ar: `طلب تسليم ملف بين الأقسام: ${newHandoff.student_file_id || ''}`,
        title_en: `Departmental Handoff Request: ${newHandoff.student_file_id || ''}`,
        description_ar: `طلب تحويل ملف من قسم (${newHandoff.sending_department_id}) إلى قسم (${newHandoff.receiving_department_id}). نوع الإجراء: ${newHandoff.handoff_type}`,
        description_en: `File transfer request from (${newHandoff.sending_department_id}) to (${newHandoff.receiving_department_id}). Action: ${newHandoff.handoff_type}`,
        category: 'approval',
        module: 'approvals',
        priority: 'high',
        read: false,
        related_link: '/workflows',
        related_id: newHandoff.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return newHandoff;
  }

  public resolveHandoff(handoffId: string, status: 'accepted' | 'rejected', reason: string, actorUsername: string): boolean {
    const index = this.handoffs.findIndex(h => h.id === handoffId);
    if (index === -1) return false;

    this.handoffs[index].status = status;
    this.handoffs[index].resolved_at = new Date().toISOString();
    if (reason) {
      this.handoffs[index].rejection_reason = reason;
    }
    saveToStorage(STORAGE_KEYS.HANDOFFS, this.handoffs);
    this.addAuditLog(actorUsername, `RESOLVE_HANDOFF_${status.toUpperCase()}`, 'departmental_handoff', handoffId, { status, reason });

    // User-Specific Notification: Inform original sender of handoff resolution
    const hnd = this.handoffs[index];
    const actor = this.getEmployeeByUsername(actorUsername);
    if (hnd.sender_id) {
      this.addNotification({
        recipient_id: hnd.sender_id,
        recipient_user_id: hnd.sender_id,
        title_ar: `تم ${status === 'accepted' ? 'قبول' : 'رفض'} تسليم الملف: ${hnd.student_file_id || ''}`,
        title_en: `Handoff Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}: ${hnd.student_file_id || ''}`,
        description_ar: status === 'accepted'
          ? `تم قبول استلام الملف رسمياً بواسطة ${actor?.full_name_ar || actorUsername}`
          : `تم رفض استلام الملف بواسطة ${actor?.full_name_ar || actorUsername}. السبب: ${reason || 'غير محدد'}`,
        description_en: status === 'accepted'
          ? `Handoff request accepted by ${actor?.full_name_en || actorUsername}`
          : `Handoff rejected by ${actor?.full_name_en || actorUsername}. Reason: ${reason || 'Unspecified'}`,
        category: 'approval',
        module: 'approvals',
        priority: status === 'rejected' ? 'high' : 'medium',
        read: false,
        related_link: '/workflows',
        related_id: hnd.id,
        sender_name: actor?.full_name_ar || actorUsername
      });
    }

    this.notify();
    return true;
  }

  // --- Marketing Campaigns & Capacity Gate (Fix & Comprehensive Enhancement) ---
  public getCapacitySettings(): CapacitySettings {
    return {
      ...this.capacitySettings,
      adjustments: [...this.capacitySettings.adjustments]
    };
  }

  public updateCapacitySettings(
    baseCapacity: number,
    period: string,
    actorUsername: string
  ): CapacitySettings | null {
    if (!this.checkActorAuthorization(actorUsername, 'settings:edit', 'capacity_settings')) {
      return null;
    }
    const old = { ...this.capacitySettings };
    this.capacitySettings.base_capacity = Math.max(0, Number(baseCapacity) || 2500);
    if (period && period.trim()) {
      this.capacitySettings.period = period.trim();
    }
    this.capacitySettings.last_updated_at = new Date().toISOString();
    this.capacitySettings.last_updated_by = actorUsername;

    saveToStorage(STORAGE_KEYS.CAPACITY_SETTINGS, this.capacitySettings);
    this.addAuditLog(
      actorUsername,
      'ADJUST_CAPACITY',
      'capacity_settings',
      'base_capacity',
      { base_capacity: this.capacitySettings.base_capacity, period: this.capacitySettings.period },
      old
    );
    this.notify();
    return this.getCapacitySettings();
  }

  public addCapacityAdjustment(
    adjustmentSlots: number,
    reason: string,
    period: string,
    actorUsername: string,
    actorEmpId: string,
    actorName: string
  ): CapacityAdjustment | null {
    if (!this.checkActorAuthorization(actorUsername, 'settings:edit', 'capacity_settings')) {
      return null;
    }
    const newAdj: CapacityAdjustment = {
      id: `adj-${Date.now().toString().slice(-4)}`,
      period: period || this.capacitySettings.period,
      adjustment_slots: Number(adjustmentSlots) || 0,
      reason: reason || 'تعديل السقف التشغيلي للعمليات',
      approved_by: actorEmpId || 'emp-001',
      approved_by_name: actorName || actorUsername,
      created_at: new Date().toISOString()
    };

    this.capacitySettings.adjustments.unshift(newAdj);
    this.capacitySettings.last_updated_at = new Date().toISOString();
    this.capacitySettings.last_updated_by = actorUsername;

    saveToStorage(STORAGE_KEYS.CAPACITY_SETTINGS, this.capacitySettings);
    this.addAuditLog(actorUsername, 'ADJUST_CAPACITY', 'capacity_adjustment', newAdj.id, newAdj);
    this.notify();
    return newAdj;
  }

  public getActiveStudentFiles(): StudentFile[] {
    return this.studentFiles.filter(
      f => !f.is_archived &&
           f.current_status !== 'closed' &&
           !['graduated', 'archived', 'cancelled'].includes(f.current_status) &&
           ACTIVE_LIFECYCLE_STAGES.includes(f.current_status)
    );
  }

  public getLifecycleStageCounts(): Record<StudentFileStatus, number> {
    const active = this.studentFiles.filter(
      f => !f.is_archived && ACTIVE_LIFECYCLE_STAGES.includes(f.current_status)
    );
    const counts: Record<string, number> = {};
    ACTIVE_LIFECYCLE_STAGES.forEach(st => {
      counts[st] = active.filter(f => f.current_status === st).length;
    });
    return counts as Record<StudentFileStatus, number>;
  }

  public getCapacityBreakdown(
    excludeCampaignId?: string,
    proposedRegistrations?: number
  ): CapacityBreakdown {
    const activeFilesCount = this.getActiveStudentFiles().length;
    return CapacityCalculationService.calculate(
      this.capacitySettings,
      activeFilesCount,
      this.campaigns,
      excludeCampaignId,
      proposedRegistrations
    );
  }

  public getCampaigns(): Campaign[] {
    return this.campaigns.map(c => ({
      ...c,
      review_history: c.review_history ? [...c.review_history] : []
    }));
  }

  public getCampaign(id: string): Campaign | undefined {
    const c = this.campaigns.find(x => x.id === id);
    if (!c) return undefined;
    return {
      ...c,
      review_history: c.review_history ? [...c.review_history] : []
    };
  }

  public createCampaign(
    campaignData: Partial<Campaign>,
    actorUsername: string,
    actorEmpId?: string,
    actorName?: string,
    submitForReview: boolean = true
  ): Campaign | null {
    if (!this.checkActorAuthorization(actorUsername, 'campaigns:create', 'campaign')) {
      return null;
    }
    const id = `cmp-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const status: CampaignStatus = submitForReview ? 'pending_approval' : 'draft';

    const initialHistory: CampaignReviewLog[] = [];
    if (submitForReview) {
      initialHistory.push({
        id: `log-${Date.now()}-sub`,
        action: 'submit',
        actor_id: actorEmpId || 'emp-008',
        actor_name: actorName || actorUsername,
        actor_role: 'Marketing',
        timestamp: now,
        notes: 'إرسال الحملة الجديدة لبوابة الطاقة الاستيعابية'
      });
    }

    const newCampaign: Campaign = {
      id,
      campaign_code: campaignData.campaign_code || `MKT-${Date.now().toString().slice(-4)}`,
      name: campaignData.name || 'حملة تسويقية جديدة',
      channel: campaignData.channel || 'meta',
      target_country: campaignData.target_country || 'السودان',
      target_audience: campaignData.target_audience || 'طلاب الثانوية والشهادات المعادلة',
      budget_amount: Number(campaignData.budget_amount) || 0,
      currency: (campaignData.currency as 'EGP' | 'USD') || 'EGP',
      start_date: campaignData.start_date || now.split('T')[0],
      end_date: campaignData.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      target_leads: Number(campaignData.target_leads) || 50,
      expected_registrations: Number(campaignData.expected_registrations) || 10,
      owner_id: actorEmpId || campaignData.owner_id || 'emp-008',
      owner_name: actorName || campaignData.owner_name || actorUsername,
      status,
      ops_capacity_approved: false,
      review_history: initialHistory,
      created_at: now
    };

    this.campaigns.unshift(newCampaign);
    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(
      actorUsername,
      submitForReview ? 'SUBMIT_CAPACITY_GATE' : 'CREATE_CAMPAIGN',
      'campaign',
      id,
      newCampaign
    );

    if (submitForReview) {
      const opsMgr = this.employees.find(e => e.roles.includes('ops_mgr') || e.position_id === 'ops_manager' || (e.department_id === 'ops' && e.roles.some(r => r.includes('mgr'))));
      const opsRecipientId = opsMgr ? opsMgr.id : 'emp-002';
      this.addNotification({
        recipient_id: opsRecipientId,
        recipient_user_id: opsRecipientId,
        title_ar: `طلب إقرار بوابة الطاقة: ${newCampaign.name}`,
        title_en: `Capacity Gate Requested: ${newCampaign.name}`,
        description_ar: `تم تقديم حملة (${newCampaign.campaign_code}) بانتظار فحص الطاقة (${newCampaign.expected_registrations} تسجيل متوقع)`,
        description_en: `Campaign submitted awaiting capacity review (${newCampaign.expected_registrations} expected registrations)`,
        category: 'approval',
        module: 'capacity',
        priority: 'high',
        read: false,
        related_link: '/capacity-gate',
        related_id: newCampaign.id,
        sender_name: actorName || actorUsername
      });
    }

    this.notify();
    return newCampaign;
  }

  public updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>,
    actorUsername: string
  ): Campaign | null {
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return null;
    const old = { ...this.campaigns[index] };

    this.campaigns[index] = {
      ...old,
      ...updates,
      updated_at: new Date().toISOString()
    };

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'UPDATE_CAMPAIGN', 'campaign', campaignId, updates, old);
    this.notify();
    return this.campaigns[index];
  }

  public submitCampaignForApproval(
    campaignId: string,
    notes: string,
    actorUsername: string,
    actorEmpId: string,
    actorName: string
  ): { success: boolean; message: string; campaign?: Campaign } {
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return { success: false, message: 'الحملة غير موجودة' };
    const camp = this.campaigns[index];
    const oldStatus = camp.status;
    const now = new Date().toISOString();

    const historyEntry: CampaignReviewLog = {
      id: `log-${Date.now()}-sub`,
      action: 'submit',
      actor_id: actorEmpId,
      actor_name: actorName || actorUsername,
      actor_role: 'Marketing',
      timestamp: now,
      notes: notes || 'إرسال الحملة لفحص بوابة الطاقة الاستيعابية'
    };

    camp.status = 'pending_approval';
    camp.ops_capacity_approved = false;
    camp.review_history = camp.review_history ? [historyEntry, ...camp.review_history] : [historyEntry];
    camp.updated_at = now;

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'SUBMIT_CAPACITY_GATE', 'campaign', campaignId, { from: oldStatus, to: 'pending_approval', notes });

    const opsMgr = this.employees.find(e => e.roles.includes('ops_mgr') || e.position_id === 'ops_manager' || (e.department_id === 'ops' && e.roles.some(r => r.includes('mgr'))));
    const opsRecipientId = opsMgr ? opsMgr.id : 'emp-002';
    this.addNotification({
      recipient_id: opsRecipientId,
      recipient_user_id: opsRecipientId,
      title_ar: `طلب إقرار بوابة الطاقة: ${camp.name}`,
      title_en: `Capacity Gate Requested: ${camp.name}`,
      description_ar: `حملة (${camp.campaign_code}) جاهزة للمراجعة بانتظار موافقة مدير العمليات`,
      description_en: `Campaign (${camp.campaign_code}) submitted for Operations Capacity Gate review`,
      category: 'approval',
      module: 'capacity',
      priority: 'high',
      read: false,
      related_link: '/capacity-gate',
      related_id: camp.id,
      sender_name: actorName || actorUsername
    });

    this.notify();
    return { success: true, message: 'تم إرسال الحملة لبوابة الطاقة بنجاح', campaign: camp };
  }

  public approveCapacityGate(
    campaignId: string,
    approvedOrNotes: boolean | string = true,
    actorUsername: string = 'ops',
    actorEmpId: string = 'emp-002',
    rejectionReason?: string,
    actorName?: string
  ): any {
    // If called with approvedOrNotes === false, route to rejection
    if (approvedOrNotes === false) {
      return this.rejectCapacityGate(campaignId, rejectionReason || 'طاقة العمليات غير كافية', actorUsername, actorEmpId, actorName);
    }

    if (!this.checkActorAuthorization(actorUsername, 'campaigns:approve', 'campaign', campaignId)) {
      return { success: false, message: 'غير مصرح لك باعتماد بوابة الطاقة (campaigns:approve مطلوبة)' };
    }

    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return { success: false, message: 'الحملة غير موجودة' };
    const camp = this.campaigns[index];
    const now = new Date().toISOString();

    // Recalculate live capacity breakdown to prevent overbooking
    const breakdown = this.getCapacityBreakdown(campaignId, camp.expected_registrations);
    if (breakdown.is_over_capacity) {
      const excess = camp.expected_registrations - breakdown.available_capacity;
      return {
        success: false,
        message: `لا يمكن اعتماد الحملة: التسجيلات المطلوبة (${camp.expected_registrations}) تتجاوز الطاقة المتاحة (${breakdown.available_capacity}) بمقدار ${excess} ملفاً. يلزم اعتماد تعديل طاقة أولاً.`
      };
    }

    const notesStr = typeof approvedOrNotes === 'string' ? approvedOrNotes : 'تم اعتماد الطاقة الاستيعابية وحجز الملفات بنجاح';
    const historyEntry: CampaignReviewLog = {
      id: `log-${Date.now()}-app`,
      action: 'approve',
      actor_id: actorEmpId,
      actor_name: actorName || actorUsername,
      actor_role: 'Operations',
      timestamp: now,
      notes: notesStr,
      capacity_snapshot: {
        approved_capacity: breakdown.approved_capacity,
        committed_capacity: breakdown.committed_capacity,
        available_capacity: breakdown.available_capacity,
        expected_registrations: camp.expected_registrations
      }
    };

    camp.ops_capacity_approved = true;
    camp.ops_capacity_approved_by = actorEmpId;
    camp.ops_capacity_approved_at = now;
    camp.status = 'approved';
    camp.review_history = camp.review_history ? [historyEntry, ...camp.review_history] : [historyEntry];
    camp.updated_at = now;

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'APPROVE_CAPACITY_GATE', 'campaign', campaignId, {
      approved: true,
      expected_registrations: camp.expected_registrations,
      remaining_capacity: breakdown.projected_remaining
    });

    const mktMgr = this.employees.find(e => e.roles.includes('mkt_mgr') || e.department_id === 'mkt');
    const mktRecipientId = camp.owner_id || (mktMgr ? mktMgr.id : 'emp-010');
    this.addNotification({
      recipient_id: mktRecipientId,
      recipient_user_id: mktRecipientId,
      title_ar: `اعتماد بوابة الطاقة: ${camp.name}`,
      title_en: `Capacity Gate Approved: ${camp.name}`,
      description_ar: `تم اعتماد الطاقة الاستيعابية رسمياً (${camp.expected_registrations} ملف محجوز) وأصبحت الحملة نشطة`,
      description_en: `Capacity gate approved and campaign is now officially active with ${camp.expected_registrations} reserved files`,
      category: 'approval',
      module: 'marketing',
      priority: 'medium',
      read: false,
      related_link: '/capacity-gate',
      related_id: camp.id,
      sender_name: actorName || actorUsername
    });

    this.notify();
    return { success: true, message: 'تم اعتماد الطاقة الاستيعابية وإطلاق الحملة رسمياً', campaign: camp };
  }

  public rejectCapacityGate(
    campaignId: string,
    rejectionReason: string,
    actorUsername: string = 'ops',
    actorEmpId: string = 'emp-002',
    actorName?: string
  ): { success: boolean; message: string; campaign?: Campaign } {
    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, message: 'السبب الإلزامي للرفض مطلوب' };
    }
    if (!this.checkActorAuthorization(actorUsername, 'campaigns:reject', 'campaign', campaignId)) {
      return { success: false, message: 'غير مصرح لك برفض بوابة الطاقة (campaigns:reject مطلوبة)' };
    }

    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return { success: false, message: 'الحملة غير موجودة' };
    const camp = this.campaigns[index];
    const now = new Date().toISOString();

    const historyEntry: CampaignReviewLog = {
      id: `log-${Date.now()}-rej`,
      action: 'reject',
      actor_id: actorEmpId,
      actor_name: actorName || actorUsername,
      actor_role: 'Operations',
      timestamp: now,
      reason: rejectionReason.trim(),
      notes: `رفض تشغيلي: ${rejectionReason.trim()}`
    };

    camp.ops_capacity_approved = false;
    camp.status = 'rejected';
    camp.rejection_reason = rejectionReason.trim();
    camp.review_history = camp.review_history ? [historyEntry, ...camp.review_history] : [historyEntry];
    camp.updated_at = now;

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'REJECT_CAPACITY_GATE', 'campaign', campaignId, {
      approved: false,
      rejectionReason: rejectionReason.trim()
    });

    const mktMgr = this.employees.find(e => e.roles.includes('mkt_mgr') || e.department_id === 'mkt');
    const mktRecipientId = camp.owner_id || (mktMgr ? mktMgr.id : 'emp-010');
    this.addNotification({
      recipient_id: mktRecipientId,
      recipient_user_id: mktRecipientId,
      title_ar: `رفض بوابة الطاقة: ${camp.name}`,
      title_en: `Capacity Gate Rejected: ${camp.name}`,
      description_ar: `تم رفض إطلاق الحملة بسبب: ${rejectionReason.trim()}`,
      description_en: `Campaign capacity gate rejected: ${rejectionReason.trim()}`,
      category: 'approval',
      module: 'marketing',
      priority: 'high',
      read: false,
      related_link: '/marketing',
      related_id: camp.id,
      sender_name: actorName || actorUsername
    });

    this.notify();
    return { success: true, message: 'تم رفض طلب بوابة الطاقة وتوثيق السبب', campaign: camp };
  }

  public requestCapacityAdjustment(
    campaignId: string,
    requestNotes: string,
    actorUsername: string = 'ops',
    actorEmpId: string = 'emp-002',
    actorName?: string
  ): { success: boolean; message: string; campaign?: Campaign } {
    if (!this.checkActorAuthorization(actorUsername, 'campaigns:approve', 'campaign', campaignId)) {
      return { success: false, message: 'غير مصرح لك بمراجعة بوابة الطاقة' };
    }
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return { success: false, message: 'الحملة غير موجودة' };
    const camp = this.campaigns[index];
    const now = new Date().toISOString();

    const historyEntry: CampaignReviewLog = {
      id: `log-${Date.now()}-adj`,
      action: 'request_adjustment',
      actor_id: actorEmpId,
      actor_name: actorName || actorUsername,
      actor_role: 'Operations',
      timestamp: now,
      notes: requestNotes || 'يتطلب تعديل أهداف الحملة أو زيادة الطاقة الاستيعابية'
    };

    camp.status = 'capacity_adjustment_required';
    camp.adjustment_notes = requestNotes;
    camp.review_history = camp.review_history ? [historyEntry, ...camp.review_history] : [historyEntry];
    camp.updated_at = now;

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'REQUEST_CAPACITY_ADJUSTMENT', 'campaign', campaignId, { requestNotes });

    const mktMgr = this.employees.find(e => e.roles.includes('mkt_mgr') || e.department_id === 'mkt');
    const mktRecipientId = camp.owner_id || (mktMgr ? mktMgr.id : 'emp-010');
    this.addNotification({
      recipient_id: mktRecipientId,
      recipient_user_id: mktRecipientId,
      title_ar: `مطلوب تعديل سقف الحملة: ${camp.name}`,
      title_en: `Capacity Revision Needed: ${camp.name}`,
      description_ar: `أفادت العمليات بضرورة تعديل التقديرات: ${requestNotes}`,
      description_en: `Operations requested volume revision: ${requestNotes}`,
      category: 'approval',
      module: 'marketing',
      priority: 'high',
      read: false,
      related_link: '/marketing',
      related_id: camp.id,
      sender_name: actorName || actorUsername
    });

    this.notify();
    return { success: true, message: 'تم إرسال طلب تعديل السقف لفريق التسويق', campaign: camp };
  }

  public cancelCampaign(
    campaignId: string,
    reason: string,
    actorUsername: string,
    actorEmpId: string,
    actorName?: string
  ): { success: boolean; message: string; campaign?: Campaign } {
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) return { success: false, message: 'الحملة غير موجودة' };
    const camp = this.campaigns[index];
    const now = new Date().toISOString();

    const historyEntry: CampaignReviewLog = {
      id: `log-${Date.now()}-can`,
      action: 'cancel',
      actor_id: actorEmpId,
      actor_name: actorName || actorUsername,
      actor_role: 'User',
      timestamp: now,
      reason: reason || 'إلغاء الحملة'
    };

    camp.status = 'cancelled';
    camp.ops_capacity_approved = false;
    camp.review_history = camp.review_history ? [historyEntry, ...camp.review_history] : [historyEntry];
    camp.updated_at = now;

    saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
    this.addAuditLog(actorUsername, 'CANCEL_CAMPAIGN', 'campaign', campaignId, { reason });
    this.notify();
    return { success: true, message: 'تم إلغاء الحملة', campaign: camp };
  }

  // --- Meetings ---
  public getMeetings(): any[] {
    return [...this.meetings];
  }

  public createMeeting(meetingData: any, actorUsername: string): any {
    const id = `mtg-${Date.now().toString().slice(-4)}`;
    const newMeeting = { ...meetingData, id };
    this.meetings.unshift(newMeeting);
    saveToStorage(STORAGE_KEYS.MEETINGS, this.meetings);
    this.addAuditLog(actorUsername, 'RECORD_MEETING', 'meeting', id, newMeeting);
    this.notify();
    return newMeeting;
  }

  // --- HR Backups & Evaluations (Fix 17) ---
  public getBackupAssignments(): HRBackupAssignment[] {
    return [...this.backups];
  }

  public addBackupAssignment(data: Omit<HRBackupAssignment, 'id'>, actorUsername: string): HRBackupAssignment | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'hr_backup')) {
      return null;
    }
    const id = `bk-${Date.now().toString().slice(-4)}`;
    const newBackup: HRBackupAssignment = { ...data, id };
    this.backups.push(newBackup);
    saveToStorage(STORAGE_KEYS.BACKUPS, this.backups);
    this.addAuditLog(actorUsername, 'ASSIGN_BACKUP_ROLE', 'hr_backup', id, newBackup);
    this.notify();
    return newBackup;
  }

  public updateBackupAssignment(id: string, updates: Partial<HRBackupAssignment>, actorUsername: string): boolean {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'hr_backup', id)) {
      return false;
    }
    const idx = this.backups.findIndex(b => b.id === id);
    if (idx === -1) return false;
    const old = { ...this.backups[idx] };
    this.backups[idx] = { ...old, ...updates };
    saveToStorage(STORAGE_KEYS.BACKUPS, this.backups);
    this.addAuditLog(actorUsername, 'UPDATE_BACKUP_ROLE', 'hr_backup', id, updates, old);
    this.notify();
    return true;
  }

  public deleteBackupAssignment(id: string, actorUsername: string): boolean {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'hr_backup', id) && !this.checkActorAuthorization(actorUsername, 'users:delete', 'hr_backup', id)) {
      return false;
    }
    const idx = this.backups.findIndex(b => b.id === id);
    if (idx === -1) return false;
    const old = { ...this.backups[idx] };
    this.backups = this.backups.filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.BACKUPS, this.backups);
    this.addAuditLog(actorUsername, 'REMOVE_BACKUP_ROLE', 'hr_backup', id, null, old);
    this.notify();
    return true;
  }

  public getPerformanceEvaluations(includeDeleted: boolean = false): PerformanceEvaluation[] {
    return this.evaluations
      .filter(ev => includeDeleted || !ev.is_deleted)
      .map(ev => ({
        ...ev,
        employee_name_ar: this.employees.find(e => e.id === ev.employee_id)?.full_name_ar || ev.employee_name_ar,
        evaluator_name_ar: this.employees.find(e => e.id === ev.evaluator_id)?.full_name_ar || ev.evaluator_name_ar
      }));
  }

  public createPerformanceEvaluation(
    evalData: Omit<PerformanceEvaluation, 'id' | 'evaluation_code' | 'created_at'> & {
      period?: string;
      review_period?: string;
      quarter?: string;
    },
    actorUsername: string
  ): PerformanceEvaluation | null {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'performance_evaluation', 'new')) {
      return null;
    }

    const targetPeriod = (
      evalData.evaluation_period ||
      evalData.period ||
      evalData.quarter ||
      evalData.review_period
    )?.trim();

    if (!targetPeriod) {
      return null;
    }

    // Check duplicate evaluation conflict for same employee & period
    const conflict = this.evaluations.find(
      e => e.employee_id === evalData.employee_id && e.evaluation_period === targetPeriod
    );
    if (conflict) {
      return null;
    }

    const id = `eval-${Date.now().toString().slice(-4)}`;
    const evaluation_code = `EV-2026-${String(this.evaluations.length + 1).padStart(3, '0')}`;
    const cleanData = { ...evalData };
    delete (cleanData as any).period;
    delete (cleanData as any).review_period;
    delete (cleanData as any).quarter;

    const newEval: PerformanceEvaluation = {
      ...cleanData,
      evaluation_period: targetPeriod,
      id,
      evaluation_code,
      created_at: new Date().toISOString()
    };
    this.evaluations.unshift(newEval);
    saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
    this.addAuditLog(actorUsername, 'CREATE_PERFORMANCE_EVALUATION', 'performance_evaluation', id, newEval);
    this.notify();
    return newEval;
  }

  public updatePerformanceEvaluation(
    id: string,
    updates: Partial<PerformanceEvaluation> & {
      period?: string;
      review_period?: string;
      quarter?: string;
    },
    actorUsername: string
  ): { success: boolean; evaluation?: PerformanceEvaluation; error?: string } {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'performance_evaluation', id)) {
      return {
        success: false,
        error: 'غير مصرح لك بتعديل تقييم الأداء (صلاحية users:edit مطلوبة)'
      };
    }
    const idx = this.evaluations.findIndex(e => e.id === id);
    if (idx === -1) {
      return {
        success: false,
        error: 'سجل تقييم الأداء غير موجود'
      };
    }
    const old = { ...this.evaluations[idx] };

    // 1. Normalize period from any schema alias (evaluation_period, period, quarter, review_period)
    const normalizedPeriod = (
      updates.evaluation_period ||
      updates.period ||
      updates.quarter ||
      updates.review_period
    )?.trim();

    if (normalizedPeriod !== undefined) {
      if (!normalizedPeriod) {
        return {
          success: false,
          error: 'الفترة التقييمية مطلوبة ولا يمكن أن تكون فارغة'
        };
      }
      updates.evaluation_period = normalizedPeriod;
    }

    const targetEmployeeId = updates.employee_id || old.employee_id;
    const targetPeriod = updates.evaluation_period || old.evaluation_period;

    // 2. Conflict Check: Explicitly prevent duplicate evaluations for same employee in same period
    const conflict = this.evaluations.find(
      e => e.id !== id && e.employee_id === targetEmployeeId && e.evaluation_period === targetPeriod
    );
    if (conflict) {
      return {
        success: false,
        error: `يوجد بالفعل تقييم أداء مسجل لهذا الموظف خلال نفس الفترة التقييمية (${targetPeriod}). لا يمكن تكرار التقييم لنفس الفترة.`
      };
    }

    // 3. Clean up alias keys to prevent duplicate columns in database/storage
    const cleanUpdates = { ...updates };
    delete cleanUpdates.period;
    delete cleanUpdates.review_period;
    delete cleanUpdates.quarter;

    // 4. Update and persist
    const updatedEval: PerformanceEvaluation = {
      ...old,
      ...cleanUpdates,
      evaluation_period: targetPeriod
    };
    this.evaluations[idx] = updatedEval;
    saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);

    // 5. Audit Logging with full traceability (Eval ID, Emp ID, Old Period, New Period, Admin, Timestamp)
    const auditPayload = {
      evaluation_id: id,
      employee_id: targetEmployeeId,
      previous_evaluation_period: old.evaluation_period,
      new_evaluation_period: targetPeriod,
      authenticated_admin: actorUsername,
      timestamp: new Date().toISOString(),
      updated_fields: Object.keys(cleanUpdates)
    };
    this.addAuditLog(actorUsername, 'UPDATE_PERFORMANCE_EVALUATION', 'performance_evaluation', id, auditPayload, old);
    this.notify();

    return {
      success: true,
      evaluation: { ...updatedEval }
    };
  }

  public deletePerformanceEvaluation(id: string, actorUsername: string, reason?: string): boolean {
    if (!this.checkActorAuthorization(actorUsername, 'users:edit', 'performance_evaluation', id) && !this.checkActorAuthorization(actorUsername, 'users:delete', 'performance_evaluation', id)) {
      return false;
    }
    const idx = this.evaluations.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const old = { ...this.evaluations[idx] };

    const actorEmp = this.employees.find(e => e.username === actorUsername);
    const deletedRecord: PerformanceEvaluation = {
      ...old,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: actorUsername,
      deleted_by_name_ar: actorEmp?.full_name_ar || actorUsername,
      deletion_reason: reason || 'حذف يدوي بواسطة مسؤول الموارد البشرية'
    };

    // Soft Delete: update in place so history is preserved in storage and audit
    this.evaluations[idx] = deletedRecord;
    saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);

    const auditPayload = {
      evaluation_id: id,
      evaluation_code: old.evaluation_code,
      employee_id: old.employee_id,
      employee_name_ar: old.employee_name_ar,
      deleted_by: actorUsername,
      deleted_at: deletedRecord.deleted_at,
      evaluation_period: old.evaluation_period,
      overall_score: old.overall_score,
      status: old.status,
      preserved_snapshot: old
    };

    this.addAuditLog(actorUsername, 'DELETE_PERFORMANCE_EVALUATION', 'performance_evaluation', id, auditPayload, old);
    this.notify();
    return true;
  }

  // =========================================================================
  // CENTRALIZED SLA MANAGEMENT & RECALCULATION ENGINE
  // =========================================================================

  public getSLAConfigs(category?: SLACategory, departmentId?: string): SLAConfigurationItem[] {
    let list = [...this.slaConfigs];
    if (category) {
      list = list.filter(item => item.category === category);
    }
    if (departmentId && departmentId !== 'all') {
      list = list.filter(item => item.department_id === departmentId);
    }
    return list.map(item => ({
      ...item,
      duration_ms: computeDurationMs(item.duration_value, item.duration_unit),
      label_ar: item.label_ar || formatSLALabel(item.duration_value, item.duration_unit, true),
      label_en: item.label_en || formatSLALabel(item.duration_value, item.duration_unit, false)
    }));
  }

  public getSLAConfigById(id: string): SLAConfigurationItem | undefined {
    const item = this.slaConfigs.find(s => s.id === id);
    if (!item) return undefined;
    return {
      ...item,
      duration_ms: computeDurationMs(item.duration_value, item.duration_unit),
      label_ar: item.label_ar || formatSLALabel(item.duration_value, item.duration_unit, true),
      label_en: item.label_en || formatSLALabel(item.duration_value, item.duration_unit, false)
    };
  }

  public getSLAConfigByCode(code: string): SLAConfigurationItem | undefined {
    const item = this.slaConfigs.find(s => s.code.toLowerCase() === code.toLowerCase());
    if (!item) return undefined;
    return {
      ...item,
      duration_ms: computeDurationMs(item.duration_value, item.duration_unit),
      label_ar: item.label_ar || formatSLALabel(item.duration_value, item.duration_unit, true),
      label_en: item.label_en || formatSLALabel(item.duration_value, item.duration_unit, false)
    };
  }

  public getStageSLA(stageKey: string): SLAConfigurationItem | undefined {
    const item = this.slaConfigs.find(s => s.stage_key === stageKey);
    if (item) {
      return {
        ...item,
        duration_ms: computeDurationMs(item.duration_value, item.duration_unit),
        label_ar: item.label_ar || formatSLALabel(item.duration_value, item.duration_unit, true),
        label_en: item.label_en || formatSLALabel(item.duration_value, item.duration_unit, false)
      };
    }
    // Fallback to STAGE_SLA_CONFIG
    const fallback = STAGE_SLA_CONFIG[stageKey];
    if (fallback) {
      return {
        id: `sla-fallback-${stageKey}`,
        code: `SLA-STAGE-${stageKey.toUpperCase()}`,
        category: 'lifecycle_stage',
        stage_key: stageKey as any,
        name_ar: fallback.label_ar,
        name_en: fallback.label_en,
        department_id: 'ops',
        department_name_ar: 'إدارة العمليات',
        department_name_en: 'Operations',
        duration_value: 24,
        duration_unit: 'hours',
        duration_ms: fallback.durationMs,
        label_ar: fallback.label_ar,
        label_en: fallback.label_en,
        is_active: true,
        is_system_core: true,
        description_ar: 'المعيار المرجعي للمرحلة',
        description_en: 'Fallback standard for stage',
        start_trigger: 'stage_entered',
        completion_trigger: 'stage_exited',
        business_days_only: false,
        pause_on_external: false,
        reset_on_reassign: false,
        alert_before_percent: 75,
        alert_at_100: true,
        alert_breached: true,
        escalate_after_hours: 4,
        escalation_role: 'ops_mgr',
        escalation_role_ar: 'مدير العمليات',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return undefined;
  }

  public updateSLAConfig(
    id: string,
    updates: Partial<SLAConfigurationItem>,
    actorUsername: string,
    applyScope: SLACalculationScope = 'all_active'
  ): { success: boolean; config?: SLAConfigurationItem; message?: string } {
    // 1. Authorization Check
    const actor = this.getEmployeeByUsername(actorUsername);
    const isAuthorized = actorUsername === 'admin' ||
      actor?.position_id === 'gm' ||
      actor?.position_id === 'ops_mgr' ||
      actor?.position_id === 'qa_officer' ||
      actor?.roles?.some(r => ['admin', 'gm', 'system_admin', 'super_admin'].includes(r));

    if (!isAuthorized) {
      return { success: false, message: 'عفواً، لا تمتلك الصلاحية لتعديل إعدادات اتفاقيات مستوى الخدمة (SLA).' };
    }

    // 2. Find Item
    const idx = this.slaConfigs.findIndex(s => s.id === id || s.code === id);
    if (idx === -1) {
      return { success: false, message: 'معيار SLA المطلوب غير موجود في النظام.' };
    }

    const oldItem = { ...this.slaConfigs[idx] };
    const newDurationVal = updates.duration_value !== undefined ? Number(updates.duration_value) : oldItem.duration_value;
    const newDurationUnit = updates.duration_unit || oldItem.duration_unit;

    if (newDurationVal <= 0) {
      return { success: false, message: 'يجب أن تكون قيمة المدة أكبر من صفر.' };
    }

    const now = new Date().toISOString();
    const durationMs = computeDurationMs(newDurationVal, newDurationUnit);
    const labelAr = updates.label_ar || formatSLALabel(newDurationVal, newDurationUnit, true);
    const labelEn = updates.label_en || formatSLALabel(newDurationVal, newDurationUnit, false);

    const updatedItem: SLAConfigurationItem = {
      ...oldItem,
      ...updates,
      duration_value: newDurationVal,
      duration_unit: newDurationUnit,
      duration_ms: durationMs,
      label_ar: labelAr,
      label_en: labelEn,
      updated_at: now,
      updated_by: actor?.full_name_ar || actorUsername
    };

    this.slaConfigs[idx] = updatedItem;
    saveToStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);

    // 3. Application Scope Handling (Requirement 10)
    let affectedFilesCount = 0;
    let affectedComplaintsCount = 0;

    if (applyScope === 'all_active') {
      // If linked to a student file stage:
      if (updatedItem.stage_key) {
        let filesModified = false;
        this.studentFiles.forEach(file => {
          // Only in-progress active files (NOT archived and NOT closed historical records)
          if (file.current_status === updatedItem.stage_key && !file.is_archived && file.current_status !== 'closed') {
            const entryTime = file.current_stage_entered_at || file.created_at || now;
            const newDeadline = calculateSLADeadline(
              entryTime,
              updatedItem.duration_value,
              updatedItem.duration_unit,
              updatedItem.business_days_only
            ).toISOString();

            file.stage_deadline_at = newDeadline;
            file.is_overdue = updatedItem.is_active ? Date.now() > new Date(newDeadline).getTime() : false;
            file.last_updated_at = now;
            filesModified = true;
            affectedFilesCount++;
          }
        });

        if (filesModified) {
          saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
        }
      }

      // If linked to complaints:
      if (updatedItem.category === 'complaint' || updatedItem.code === 'SLA-TASK-COMPLAINT') {
        let complaintsModified = false;
        this.complaints.forEach(complaint => {
          // Only active open complaints (NOT resolved and NOT closed historical records)
          if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
            const entryTime = complaint.created_at || now;
            const newDeadline = calculateSLADeadline(
              entryTime,
              updatedItem.duration_value,
              updatedItem.duration_unit,
              updatedItem.business_days_only
            ).toISOString();

            complaint.sla_resolution_deadline_at = newDeadline;
            complaintsModified = true;
            affectedComplaintsCount++;
          }
        });

        if (complaintsModified) {
          saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
        }
      }
    }

    // 4. Audit Logging (Requirement 8)
    const auditPayload = {
      sla_id: updatedItem.id,
      sla_code: updatedItem.code,
      sla_name_ar: updatedItem.name_ar,
      previous_duration: `${oldItem.duration_value} ${oldItem.duration_unit}`,
      new_duration: `${updatedItem.duration_value} ${updatedItem.duration_unit}`,
      duration_ms_change: { old: oldItem.duration_ms, new: updatedItem.duration_ms },
      apply_scope: applyScope,
      affected_active_records: { files: affectedFilesCount, complaints: affectedComplaintsCount },
      updated_by: actorUsername,
      updated_at: now
    };

    this.addAuditLog(actorUsername, 'UPDATE_SLA_CONFIG', 'sla_config', updatedItem.code, auditPayload, oldItem);
    this.notify();

    return {
      success: true,
      config: updatedItem,
      message: `تم تحديث معيار SLA بنجاح وتطبيقه على (${applyScope === 'all_active' ? 'المهام الجارية والجديدة' : 'المهام الجديدة فقط'}).`
    };
  }

  public createSLAConfig(
    itemData: Omit<SLAConfigurationItem, 'id' | 'created_at' | 'updated_at'>,
    actorUsername: string
  ): { success: boolean; config?: SLAConfigurationItem; message?: string } {
    const actor = this.getEmployeeByUsername(actorUsername);
    const isAuthorized = actorUsername === 'admin' ||
      actor?.position_id === 'gm' ||
      actor?.position_id === 'ops_mgr' ||
      actor?.position_id === 'qa_officer' ||
      actor?.roles?.some(r => ['admin', 'gm', 'system_admin'].includes(r));

    if (!isAuthorized) {
      return { success: false, message: 'عفواً، لا تمتلك الصلاحية لإنشاء معايير SLA جديدة.' };
    }

    if (!itemData.name_ar || !itemData.name_ar.trim()) {
      return { success: false, message: 'اسم المهمة أو المرحلة بالعربية إلزامي.' };
    }

    if (!itemData.duration_value || Number(itemData.duration_value) <= 0) {
      return { success: false, message: 'يجب تحديد مدة زمنية صالحة أكبر من صفر.' };
    }

    const now = new Date().toISOString();
    const id = `sla-cfg-${Date.now().toString().slice(-4)}`;
    const code = itemData.code || `SLA-CUSTOM-${String(this.slaConfigs.length + 1).padStart(3, '0')}`;
    const durationMs = computeDurationMs(Number(itemData.duration_value), itemData.duration_unit);
    const labelAr = itemData.label_ar || formatSLALabel(Number(itemData.duration_value), itemData.duration_unit, true);
    const labelEn = itemData.label_en || formatSLALabel(Number(itemData.duration_value), itemData.duration_unit, false);

    const newItem: SLAConfigurationItem = {
      ...itemData,
      id,
      code,
      duration_value: Number(itemData.duration_value),
      duration_ms: durationMs,
      label_ar: labelAr,
      label_en: labelEn,
      is_active: itemData.is_active !== undefined ? itemData.is_active : true,
      is_system_core: false,
      created_at: now,
      updated_at: now,
      updated_by: actor?.full_name_ar || actorUsername
    };

    this.slaConfigs.push(newItem);
    saveToStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);

    this.addAuditLog(actorUsername, 'CREATE_SLA_CONFIG', 'sla_config', newItem.code, newItem);
    this.notify();

    return { success: true, config: newItem, message: 'تمت إضافة معيار SLA الجديد بنجاح.' };
  }

  public toggleSLAStatus(id: string, isActive: boolean, actorUsername: string): boolean {
    const idx = this.slaConfigs.findIndex(s => s.id === id || s.code === id);
    if (idx === -1) return false;

    const old = { ...this.slaConfigs[idx] };
    this.slaConfigs[idx].is_active = isActive;
    this.slaConfigs[idx].updated_at = new Date().toISOString();
    this.slaConfigs[idx].updated_by = actorUsername;

    // If disabled and linked to stage, update active files to not overdue
    if (!isActive && old.stage_key) {
      let modified = false;
      this.studentFiles.forEach(file => {
        if (file.current_status === old.stage_key && !file.is_archived) {
          file.is_overdue = false;
          modified = true;
        }
      });
      if (modified) {
        saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
      }
    }

    saveToStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);
    this.addAuditLog(actorUsername, 'TOGGLE_SLA_STATUS', 'sla_config', old.code, { id, code: old.code, is_active: isActive }, old);
    this.notify();
    return true;
  }

  public deleteSLAConfig(id: string, actorUsername: string): { success: boolean; message?: string } {
    const idx = this.slaConfigs.findIndex(s => s.id === id || s.code === id);
    if (idx === -1) {
      return { success: false, message: 'المعيار غير موجود.' };
    }

    const item = this.slaConfigs[idx];
    if (item.is_system_core) {
      return {
        success: false,
        message: 'لا يمكن حذف المراحل والمهام الأساسية للنظام حفاظاً على سلامة البيانات، ولكن يمكنك تعطيل احتساب SLA لها.'
      };
    }

    this.slaConfigs.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);
    this.addAuditLog(actorUsername, 'DELETE_SLA_CONFIG', 'sla_config', item.code, null, item);
    this.notify();
    return { success: true, message: 'تم حذف معيار SLA بنجاح.' };
  }

  // ==========================================
  // BACKUP & RESTORE MANAGEMENT SYSTEM METHODS
  // ==========================================

  private ensureInitialBackupSeed(): void {
    if (this.backupRecords.length === 0) {
      const now = new Date();
      const initialBackupId = 'BCT-BAK-2026-001';
      const initialFilename = `bct_backup_20261119_030000.bctbak`;

      const initialRecord: BackupRecord = {
        id: initialBackupId,
        filename: initialFilename,
        name: 'نسخة احتياطية أساسية مؤكدة (نقطة ارتكاز أولية)',
        type: 'automatic',
        destination: 'local',
        status: 'completed',
        size_bytes: 1845200,
        size_formatted: formatBytes(1845200),
        created_at: '2026-11-19T03:00:00.000Z',
        created_by: 'system',
        created_by_name: 'النظام الآلي (Scheduled Agent)',
        checksum_sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        is_verified: true,
        tables_included: [
          'employees', 'systemUsers', 'departments', 'positions', 'students', 'studentFiles',
          'documents', 'payments', 'expenses', 'budgets', 'financialAccounts', 'accountMovements',
          'internalTransfers', 'exchangeRate', 'tasks', 'complaints', 'handoffs', 'campaigns',
          'meetings', 'notifications', 'universities', 'faculties', 'campuses', 'evaluations',
          'capacitySettings', 'incentivePolicies', 'employeeIncentives', 'slaConfigs', 'auditLogs'
        ],
        total_records: 382
      };

      this.backupRecords = [initialRecord];
      saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);
    }
  }

  public getBackupRecords(): BackupRecord[] {
    return [...this.backupRecords];
  }

  public getBackupRecord(id: string): BackupRecord | undefined {
    return this.backupRecords.find(b => b.id === id);
  }

  public updateBackupRecord(record: BackupRecord): void {
    const idx = this.backupRecords.findIndex(b => b.id === record.id);
    if (idx !== -1) {
      this.backupRecords[idx] = { ...this.backupRecords[idx], ...record };
    } else {
      this.backupRecords.unshift(record);
    }
    saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);
    this.notify();
  }

  public getBackupSchedule(): BackupScheduleConfig {
    return { ...this.backupSchedule };
  }

  public saveBackupSchedule(config: Partial<BackupScheduleConfig>, actorUsername: string = 'system'): BackupScheduleConfig {
    this.backupSchedule = { ...this.backupSchedule, ...config };
    saveToStorage(STORAGE_KEYS.BACKUP_SCHEDULE, this.backupSchedule);
    this.addAuditLog(actorUsername, 'UPDATE_BACKUP_SCHEDULE', 'system_backup', 'schedule', this.backupSchedule, null);
    this.notify();
    return { ...this.backupSchedule };
  }

  public getBackupRetention(): BackupRetentionPolicy {
    return { ...this.backupRetention };
  }

  public saveBackupRetention(policy: Partial<BackupRetentionPolicy>, actorUsername: string = 'system'): BackupRetentionPolicy {
    this.backupRetention = { ...this.backupRetention, ...policy };
    saveToStorage(STORAGE_KEYS.BACKUP_RETENTION, this.backupRetention);
    this.addAuditLog(actorUsername, 'UPDATE_BACKUP_RETENTION', 'system_backup', 'retention', this.backupRetention, null);
    this.notify();
    return { ...this.backupRetention };
  }

  public getGoogleDriveConfig(): GoogleDriveConfig {
    return { ...this.googleDriveConfig };
  }

  public saveGoogleDriveConfig(config: Partial<GoogleDriveConfig>, actorUsername: string = 'system'): GoogleDriveConfig {
    this.googleDriveConfig = { ...this.googleDriveConfig, ...config };
    saveToStorage(STORAGE_KEYS.GOOGLE_DRIVE_CONFIG, this.googleDriveConfig);
    this.addAuditLog(actorUsername, 'UPDATE_GOOGLE_DRIVE_CONFIG', 'system_backup', 'google_drive', this.googleDriveConfig, null);
    this.notify();
    return { ...this.googleDriveConfig };
  }

  public exportFullDatabaseSnapshot(
    actorUsername: string,
    type: BackupType = 'manual',
    destination: BackupDestination = 'local',
    note?: string
  ): { payload: BackupRestorePayload; record: BackupRecord; rawEncrypted: string } {
    const actor = this.employees.find(e => e.username === actorUsername || e.id === actorUsername);
    const actorName = actor ? actor.full_name_ar : (actorUsername === 'system' ? 'النظام الآلي' : actorUsername);

    const tables: Record<string, any> = {
      employees: this.employees,
      systemUsers: this.systemUsers,
      departments: this.departments,
      positions: this.positions,
      students: this.students,
      studentFiles: this.studentFiles,
      documents: this.documents,
      payments: this.payments,
      expenses: this.expenses,
      budgets: this.budgets,
      financialAccounts: this.financialAccounts,
      accountMovements: this.accountMovements,
      internalTransfers: this.internalTransfers,
      exchangeRate: this.exchangeRate,
      tasks: this.tasks,
      complaints: this.complaints,
      handoffs: this.handoffs,
      campaigns: this.campaigns,
      meetings: this.meetings,
      notifications: this.notifications,
      universities: this.universities,
      faculties: this.faculties,
      campuses: this.campuses,
      evaluations: this.evaluations,
      capacitySettings: this.capacitySettings,
      incentivePolicies: this.incentivePolicies,
      employeeIncentives: this.employeeIncentives,
      slaConfigs: this.slaConfigs,
      auditLogs: this.auditLogs,
      backups: this.backups
    };

    let totalRecords = 0;
    for (const key of Object.keys(tables)) {
      const val = tables[key];
      if (Array.isArray(val)) {
        totalRecords += val.length;
      } else if (val && typeof val === 'object') {
        totalRecords += Object.keys(val).length;
      }
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    const dateStamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const seq = String(this.backupRecords.length + 1).padStart(3, '0');
    const backupId = `BCT-BAK-${d.getFullYear()}-${seq}`;
    const filename = `bct_backup_${dateStamp}.bctbak`;

    const tablesJson = JSON.stringify(tables);
    const checksum = computeSHA256(tablesJson);

    const header: BackupArchiveHeader = {
      magic: 'BCT_ENTERPRISE_BACKUP',
      version: '2.0.0',
      backup_id: backupId,
      created_at: d.toISOString(),
      created_by: actorUsername,
      created_by_name: actorName,
      backup_type: type,
      destination,
      environment: 'production',
      schema_version: '2026.11',
      checksum_sha256: checksum,
      total_records: totalRecords,
      tables_count: Object.keys(tables).length
    };

    const payload: BackupRestorePayload = {
      header,
      tables,
      security: {
        checksum,
        integrityVerified: true
      }
    };

    const rawEncrypted = packBCTBakArchive(payload);
    const sizeBytes = typeof Buffer !== 'undefined'
      ? Buffer.byteLength(rawEncrypted, 'utf8')
      : new Blob([rawEncrypted]).size;
    const fileSha256 = computeSHA256(rawEncrypted);

    let displayName = note;
    if (!displayName) {
      if (type === 'automatic') {
        displayName = `نسخة احتياطية تلقائية مجدولة - ${d.toLocaleDateString('ar-EG')}`;
      } else if (type === 'safety_pre_restore') {
        displayName = `نقطة استعادة أمان تلقائية قبل استرجاع النظام - ${d.toLocaleTimeString('ar-EG')}`;
      } else {
        displayName = `نسخة احتياطية يدوية شاملة - ${d.toLocaleDateString('ar-EG')}`;
      }
    }

    const record: BackupRecord = {
      id: backupId,
      filename,
      name: displayName,
      type,
      destination,
      status: 'completed',
      size_bytes: sizeBytes,
      size_formatted: formatBytes(sizeBytes),
      created_at: header.created_at,
      created_by: actorUsername,
      created_by_name: actorName,
      checksum_sha256: fileSha256,
      is_verified: true,
      is_safety_snapshot: type === 'safety_pre_restore',
      tables_included: Object.keys(tables),
      total_records: totalRecords
    };

    return { payload, record, rawEncrypted };
  }

  public async createBackup(
    type: BackupType = 'manual',
    destination: BackupDestination = 'local',
    actorUsername: string = 'system',
    note?: string
  ): Promise<{ success: boolean; record: BackupRecord; message: string; message_en: string; encryptedArchive?: string }> {
    try {
      const { record, rawEncrypted } = this.exportFullDatabaseSnapshot(actorUsername, type, destination, note);

      if (destination === 'google_drive' || destination === 'both') {
        if (this.googleDriveConfig.connected) {
          record.google_drive_folder_id = this.googleDriveConfig.folder_id || 'BCT_Enterprise_Backups';
          record.google_drive_file_id = `gdrive_file_${Date.now()}`;
          this.googleDriveConfig.last_synced_at = new Date().toISOString();
          saveToStorage(STORAGE_KEYS.GOOGLE_DRIVE_CONFIG, this.googleDriveConfig);
        }
      }

      this.backupRecords.unshift(record);
      saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);

      this.applyBackupRetentionPolicy(actorUsername);

      this.addAuditLog(
        actorUsername,
        'CREATE_SYSTEM_BACKUP',
        'system_backup',
        record.id,
        { backup_id: record.id, filename: record.filename, type, destination, size: record.size_formatted, records: record.total_records },
        null
      );

      this.notify();

      return {
        success: true,
        record,
        message: `تم إنشاء النسخة الاحتياطية بنجاح (${record.id}) وحفظها في التخزين المخصص.`,
        message_en: `Backup successfully created (${record.id}) and saved to designated storage.`,
        encryptedArchive: rawEncrypted
      };
    } catch (err: any) {
      const failedRecord: BackupRecord = {
        id: `BCT-BAK-FAIL-${Date.now()}`,
        filename: `bct_backup_failed_${Date.now()}.bctbak`,
        name: note || 'محاولة نسخ احتياطي فاشلة',
        type,
        destination,
        status: 'failed',
        size_bytes: 0,
        size_formatted: '0 B',
        created_at: new Date().toISOString(),
        created_by: actorUsername,
        created_by_name: actorUsername,
        checksum_sha256: '',
        is_verified: false,
        error_message: err.message || 'Unknown error during backup creation',
        tables_included: [],
        total_records: 0
      };
      this.backupRecords.unshift(failedRecord);
      saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);
      this.notify();

      return {
        success: false,
        record: failedRecord,
        message: `فشل إنشاء النسخة الاحتياطية: ${err.message}`,
        message_en: `Backup creation failed: ${err.message}`
      };
    }
  }

  public async restoreFullDatabaseSnapshot(
    payloadOrRaw: BackupRestorePayload | string,
    actorUsername: string
  ): Promise<{ success: boolean; message: string; message_en: string; safetyRecord?: BackupRecord; restoredTables: number; restoredRecords: number }> {
    try {
      let payload: BackupRestorePayload;

      if (typeof payloadOrRaw === 'string') {
        const unpack = unpackBCTBakArchive(payloadOrRaw);
        if (!unpack.valid || !unpack.payload) {
          throw new Error(unpack.errors[0] || 'فشل فحص الأرشيف: الملف غير صالح أو تالف.');
        }
        payload = unpack.payload;
      } else {
        payload = payloadOrRaw;
      }

      if (!payload.header || payload.header.magic !== 'BCT_ENTERPRISE_BACKUP') {
        throw new Error('الملف ليس أرشيف نسخ احتياطي معتمد لنظام BCT Enterprise.');
      }

      if (!payload.tables || typeof payload.tables !== 'object') {
        throw new Error('بيانات الجداول داخل الأرشيف غير صالحة أو مفقودة.');
      }

      const currentJson = JSON.stringify(payload.tables);
      const expectedChecksum = payload.header.checksum_sha256 || payload.security?.checksum;
      if (expectedChecksum) {
        const actualChecksum = computeSHA256(currentJson);
        if (actualChecksum !== expectedChecksum) {
          throw new Error('فشل التحقق من البصمة الرقمية (SHA-256 Checksum Mismatch). الملف قد تم التعديل عليه أو تلف.');
        }
      }

      // AUTOMATIC PRE-RESTORE SAFETY SNAPSHOT before restoring live database
      const safetyResult = await this.createBackup(
        'safety_pre_restore',
        'local',
        actorUsername,
        `نقطة استعادة أمان تلقائية تسبق الاسترجاع من (${payload.header.backup_id})`
      );

      const t = payload.tables;
      if (Array.isArray(t.employees)) {
        this.employees = normalizeEmployees(t.employees);
        saveToStorage(STORAGE_KEYS.EMPLOYEES, this.employees);
      }
      if (Array.isArray(t.systemUsers)) {
        this.systemUsers = normalizeSystemUsers(t.systemUsers, this.employees);
        saveToStorage(STORAGE_KEYS.USERS, this.systemUsers);
      }
      if (Array.isArray(t.departments)) {
        this.departments = normalizeDepartments(t.departments);
        saveToStorage(STORAGE_KEYS.DEPARTMENTS, this.departments);
      }
      if (t.positions && typeof t.positions === 'object') {
        this.positions = t.positions;
        saveToStorage(STORAGE_KEYS.POSITIONS, this.positions);
      }
      if (Array.isArray(t.students)) {
        this.students = t.students;
        saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
      }
      if (Array.isArray(t.studentFiles)) {
        this.studentFiles = t.studentFiles;
        saveToStorage(STORAGE_KEYS.FILES, this.studentFiles);
      }
      if (Array.isArray(t.documents)) {
        this.documents = t.documents;
        saveToStorage(STORAGE_KEYS.DOCUMENTS, this.documents);
      }
      if (Array.isArray(t.payments)) {
        this.payments = t.payments;
        saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
      }
      if (Array.isArray(t.expenses)) {
        this.expenses = t.expenses;
        saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
      }
      if (Array.isArray(t.budgets)) {
        this.budgets = t.budgets;
        saveToStorage(STORAGE_KEYS.BUDGETS, this.budgets);
      }
      if (Array.isArray(t.financialAccounts)) {
        this.financialAccounts = t.financialAccounts;
        saveToStorage(STORAGE_KEYS.FINANCIAL_ACCOUNTS, this.financialAccounts);
      }
      if (Array.isArray(t.accountMovements)) {
        this.accountMovements = t.accountMovements;
        saveToStorage(STORAGE_KEYS.ACCOUNT_MOVEMENTS, this.accountMovements);
      }
      if (Array.isArray(t.internalTransfers)) {
        this.internalTransfers = t.internalTransfers;
        saveToStorage(STORAGE_KEYS.INTERNAL_TRANSFERS, this.internalTransfers);
      }
      if (t.exchangeRate) {
        this.exchangeRate = t.exchangeRate;
        saveToStorage(STORAGE_KEYS.EXCHANGE_RATE, this.exchangeRate);
      }
      if (Array.isArray(t.tasks)) {
        this.tasks = t.tasks;
        saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
      }
      if (Array.isArray(t.complaints)) {
        this.complaints = t.complaints;
        saveToStorage(STORAGE_KEYS.COMPLAINTS, this.complaints);
      }
      if (Array.isArray(t.handoffs)) {
        this.handoffs = t.handoffs;
        saveToStorage(STORAGE_KEYS.HANDOFFS, this.handoffs);
      }
      if (Array.isArray(t.campaigns)) {
        this.campaigns = t.campaigns;
        saveToStorage(STORAGE_KEYS.CAMPAIGNS, this.campaigns);
      }
      if (Array.isArray(t.meetings)) {
        this.meetings = t.meetings;
        saveToStorage(STORAGE_KEYS.MEETINGS, this.meetings);
      }
      if (Array.isArray(t.notifications)) {
        this.notifications = normalizeNotifications(t.notifications);
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      }
      if (Array.isArray(t.universities)) {
        this.universities = t.universities;
        saveToStorage(STORAGE_KEYS.UNIVERSITIES, this.universities);
      }
      if (Array.isArray(t.faculties)) {
        this.faculties = t.faculties;
        saveToStorage(STORAGE_KEYS.FACULTIES, this.faculties);
      }
      if (Array.isArray(t.campuses)) {
        this.campuses = t.campuses;
        saveToStorage(STORAGE_KEYS.CAMPUSES, this.campuses);
      }
      if (Array.isArray(t.evaluations)) {
        this.evaluations = t.evaluations;
        saveToStorage(STORAGE_KEYS.EVALUATIONS, this.evaluations);
      }
      if (t.capacitySettings) {
        this.capacitySettings = t.capacitySettings;
        saveToStorage(STORAGE_KEYS.CAPACITY_SETTINGS, this.capacitySettings);
      }
      if (Array.isArray(t.incentivePolicies)) {
        this.incentivePolicies = t.incentivePolicies;
        saveToStorage(STORAGE_KEYS.INCENTIVE_POLICIES, this.incentivePolicies);
      }
      if (Array.isArray(t.employeeIncentives)) {
        this.employeeIncentives = t.employeeIncentives;
        saveToStorage(STORAGE_KEYS.EMPLOYEE_INCENTIVES, this.employeeIncentives);
      }
      if (Array.isArray(t.slaConfigs)) {
        this.slaConfigs = t.slaConfigs;
        saveToStorage(STORAGE_KEYS.SLA_CONFIG, this.slaConfigs);
      }
      if (Array.isArray(t.auditLogs)) {
        this.auditLogs = t.auditLogs;
        saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
      }
      if (Array.isArray(t.backups)) {
        this.backups = t.backups;
        saveToStorage(STORAGE_KEYS.BACKUPS, this.backups);
      }

      this.ensureRolePermissionsPopulated();
      this.reconcileAccountMovements();
      this.consolidateDuplicateStudentFiles(actorUsername);
      this.reconcileStudentFiles();
      this.reconcileAllEmployeesAndSystemUsers(actorUsername);

      this.addAuditLog(
        actorUsername,
        'RESTORE_SYSTEM_BACKUP',
        'system_backup',
        payload.header.backup_id,
        {
          restored_backup_id: payload.header.backup_id,
          created_at: payload.header.created_at,
          safety_snapshot_id: safetyResult.record?.id,
          total_records: payload.header.total_records
        },
        null
      );

      this.notify();

      return {
        success: true,
        message: `تم استعادة النظام بالكامل بنجاح من النسخة الاحتياطية (${payload.header.backup_id}). تم إنشاء نقطة أمان قبل الاستعادة (${safetyResult.record?.id}).`,
        message_en: `System successfully restored from backup (${payload.header.backup_id}). Safety snapshot created (${safetyResult.record?.id}).`,
        safetyRecord: safetyResult.record,
        restoredTables: Object.keys(t).length,
        restoredRecords: payload.header.total_records
      };
    } catch (err: any) {
      return {
        success: false,
        message: `فشلت عملية استعادة النظام: ${err.message}`,
        message_en: `System restore failed: ${err.message}`,
        restoredTables: 0,
        restoredRecords: 0
      };
    }
  }

  public deleteBackupRecord(id: string, actorUsername: string): { success: boolean; message: string; message_en: string } {
    const index = this.backupRecords.findIndex(b => b.id === id);
    if (index === -1) {
      return {
        success: false,
        message: 'النسخة الاحتياطية المحددة غير موجودة.',
        message_en: 'Specified backup not found.'
      };
    }

    const record = this.backupRecords[index];

    // Safeguard 1: NEVER delete the last verified successful backup
    const verifiedBackups = this.backupRecords.filter(b => b.status === 'completed' && b.is_verified);
    if (record.status === 'completed' && record.is_verified && verifiedBackups.length <= 1) {
      return {
        success: false,
        message: 'حظر أمني: لا يمكن حذف آخر نسخة احتياطية سليمة ومؤكدة في النظام للحفاظ على سلامة البيانات.',
        message_en: 'Security block: Cannot delete the last verified successful backup in the system.'
      };
    }

    // Safeguard 2: Cannot delete a backup marked in progress
    if (record.status === 'in_progress') {
      return {
        success: false,
        message: 'لا يمكن حذف نسخة احتياطية قيد المعالجة حالياً.',
        message_en: 'Cannot delete a backup currently in progress.'
      };
    }

    this.backupRecords.splice(index, 1);
    saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);

    this.addAuditLog(
      actorUsername,
      'DELETE_SYSTEM_BACKUP',
      'system_backup',
      record.id,
      null,
      { id: record.id, filename: record.filename, name: record.name, size: record.size_formatted }
    );

    this.notify();

    return {
      success: true,
      message: `تم حذف النسخة الاحتياطية (${record.id}) بنجاح.`,
      message_en: `Backup (${record.id}) deleted successfully.`
    };
  }

  public applyBackupRetentionPolicy(actorUsername: string = 'system'): { purgedCount: number; purgedIds: string[] } {
    if (!this.backupRetention.auto_purge_enabled) {
      return { purgedCount: 0, purgedIds: [] };
    }

    const { daily_backups_to_keep, max_storage_allocation_mb } = this.backupRetention;
    const verifiedBackups = this.backupRecords.filter(b => b.status === 'completed' && b.is_verified);

    if (verifiedBackups.length <= 1) {
      return { purgedCount: 0, purgedIds: [] };
    }

    const purgedIds: string[] = [];

    const dailyBackups = this.backupRecords.filter(b => b.type === 'automatic');
    if (dailyBackups.length > daily_backups_to_keep) {
      const toRemove = dailyBackups.slice(daily_backups_to_keep);
      for (const b of toRemove) {
        const remainingVerified = this.backupRecords.filter(r => r.id !== b.id && r.status === 'completed' && r.is_verified);
        if (remainingVerified.length > 0) {
          purgedIds.push(b.id);
        }
      }
    }

    let totalBytes = this.backupRecords.reduce((sum, b) => sum + (b.size_bytes || 0), 0);
    const maxBytes = max_storage_allocation_mb * 1024 * 1024;
    if (totalBytes > maxBytes) {
      const sortedOldest = [...this.backupRecords]
        .filter(b => !purgedIds.includes(b.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (const b of sortedOldest) {
        if (totalBytes <= maxBytes) break;
        const remainingVerified = this.backupRecords.filter(r => !purgedIds.includes(r.id) && r.id !== b.id && r.status === 'completed' && r.is_verified);
        if (remainingVerified.length > 0) {
          purgedIds.push(b.id);
          totalBytes -= (b.size_bytes || 0);
        }
      }
    }

    if (purgedIds.length > 0) {
      this.backupRecords = this.backupRecords.filter(b => !purgedIds.includes(b.id));
      saveToStorage(STORAGE_KEYS.BACKUP_RECORDS, this.backupRecords);

      this.addAuditLog(
        actorUsername,
        'RETENTION_PURGE_BACKUPS',
        'system_backup',
        `PURGE-${Date.now()}`,
        { purged_count: purgedIds.length, purged_ids: purgedIds },
        null
      );
      this.notify();
    }

    return { purgedCount: purgedIds.length, purgedIds };
  }

  public verifyBackupArchive(rawContent: string): BackupVerificationResult {
    return verifyBackupArchiveContent(rawContent);
  }
}

export const bctStore = new BCTStore();
