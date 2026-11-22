export type DepartmentId = 'gm' | 'ops' | 'cs' | 'mkt' | 'fin' | 'qa';

export type RoleId =
  | 'gm'
  | 'ops_mgr'
  | 'apply_off'
  | 'cert_off'
  | 'follow_off'
  | 'liaison'
  | 'cs_lead'
  | 'consultant'
  | 'inbox'
  | 'reception'
  | 'mkt_mgr'
  | 'content'
  | 'ads'
  | 'fin_mgr'
  | 'accountant'
  | 'hr'
  | 'qa_mgr'
  | 'sys_admin';

export type StudentFileStatus =
  | 'new'
  | 'qualified'
  | 'registered'
  | 'review'
  | 'submitted'
  | 'preliminary'
  | 'stage2'
  | 'docs'
  | 'final'
  | 'closed'
  | 'new_inquiry'
  | 'contacted'
  | 'documentation'
  | 'initial_admit'
  | 'final_admit'
  | 'admitted'
  | 'completed'
  | 'cancelled'
  | 'graduated'
  | 'archived';

export const ACTIVE_LIFECYCLE_STAGES: StudentFileStatus[] = [
  'new',
  'qualified',
  'registered',
  'review',
  'submitted',
  'preliminary',
  'stage2',
  'docs',
  'final',
  'closed'
];

export interface LifecycleStageDefinition {
  number: number;
  stageNumber: string; // '#1' to '#10'
  key: StudentFileStatus;
  label_ar: string;
  label_en: string;
  name_ar: string;
  name_en: string;
  color: string;
  bg_color: string;
  border_color: string;
}

export const LIFECYCLE_STAGE_DEFINITIONS: LifecycleStageDefinition[] = [
  {
    number: 1,
    stageNumber: '#1',
    key: 'new',
    label_ar: '1. جديد',
    label_en: '1. New',
    name_ar: 'جديد',
    name_en: 'New',
    color: 'text-blue-700',
    bg_color: 'bg-blue-50/70',
    border_color: 'border-blue-200'
  },
  {
    number: 2,
    stageNumber: '#2',
    key: 'qualified',
    label_ar: '2. مؤهل',
    label_en: '2. Qualified',
    name_ar: 'مؤهل',
    name_en: 'Qualified',
    color: 'text-indigo-700',
    bg_color: 'bg-indigo-50/70',
    border_color: 'border-indigo-200'
  },
  {
    number: 3,
    stageNumber: '#3',
    key: 'registered',
    label_ar: '3. مسجل ومسدد',
    label_en: '3. Registered & Paid',
    name_ar: 'مسجل ومسدد',
    name_en: 'Registered & Paid',
    color: 'text-purple-700',
    bg_color: 'bg-purple-50/70',
    border_color: 'border-purple-200'
  },
  {
    number: 4,
    stageNumber: '#4',
    key: 'review',
    label_ar: '4. مراجعة الأوراق',
    label_en: '4. Document Review',
    name_ar: 'مراجعة الأوراق',
    name_en: 'Document Review',
    color: 'text-amber-700',
    bg_color: 'bg-amber-50/70',
    border_color: 'border-amber-200'
  },
  {
    number: 5,
    stageNumber: '#5',
    key: 'submitted',
    label_ar: '5. على المنصة',
    label_en: '5. Submitted',
    name_ar: 'على المنصة',
    name_en: 'Submitted',
    color: 'text-orange-700',
    bg_color: 'bg-orange-50/70',
    border_color: 'border-orange-200'
  },
  {
    number: 6,
    stageNumber: '#6',
    key: 'preliminary',
    label_ar: '6. قبول مبدئي',
    label_en: '6. Preliminary',
    name_ar: 'قبول مبدئي',
    name_en: 'Preliminary',
    color: 'text-teal-700',
    bg_color: 'bg-teal-50/70',
    border_color: 'border-teal-200'
  },
  {
    number: 7,
    stageNumber: '#7',
    key: 'stage2',
    label_ar: '7. سداد مرحلة 2',
    label_en: '7. Stage 2 Payment',
    name_ar: 'سداد مرحلة 2',
    name_en: 'Stage 2 Payment',
    color: 'text-violet-700',
    bg_color: 'bg-violet-50/70',
    border_color: 'border-violet-200'
  },
  {
    number: 8,
    stageNumber: '#8',
    key: 'docs',
    label_ar: '8. التوثيق والأصول',
    label_en: '8. Docs & Handover',
    name_ar: 'التوثيق والأصول',
    name_en: 'Docs & Handover',
    color: 'text-cyan-700',
    bg_color: 'bg-cyan-50/70',
    border_color: 'border-cyan-200'
  },
  {
    number: 9,
    stageNumber: '#9',
    key: 'final',
    label_ar: '9. قبول نهائي',
    label_en: '9. Final Admission',
    name_ar: 'قبول نهائي',
    name_en: 'Final Admission',
    color: 'text-emerald-700',
    bg_color: 'bg-emerald-50/70',
    border_color: 'border-emerald-200'
  },
  {
    number: 10,
    stageNumber: '#10',
    key: 'closed',
    label_ar: '10. مغلق وتقييم',
    label_en: '10. Closed & NPS',
    name_ar: 'مغلق وتقييم',
    name_en: 'Closed & NPS',
    color: 'text-slate-700',
    bg_color: 'bg-slate-100/70',
    border_color: 'border-slate-300'
  }
];

export interface StageSlaConfig {
  durationMs: number;
  label_ar: string;
  label_en: string;
}

export type SLAUnit = 'minutes' | 'hours' | 'days' | 'business_days';
export type SLACategory = 'lifecycle_stage' | 'operational_task' | 'complaint' | 'inquiry';
export type SLAEscalationRole = 'gm' | 'ops_mgr' | 'department_head' | 'qa_officer' | 'branch_mgr';
export type SLACalculationScope = 'new_only' | 'all_active';

export interface SLAConfigurationItem {
  id: string;
  code: string;
  category: SLACategory;
  stage_key?: StudentFileStatus;
  name_ar: string;
  name_en: string;
  department_id: DepartmentId | string;
  department_name_ar: string;
  department_name_en: string;
  duration_value: number;
  duration_unit: SLAUnit;
  duration_ms: number;
  label_ar: string;
  label_en: string;
  is_active: boolean;
  description_ar: string;
  description_en: string;

  // Advanced calculation rules:
  start_trigger: 'stage_entered' | 'task_created' | 'ticket_opened' | 'assigned';
  completion_trigger: 'stage_exited' | 'task_completed' | 'ticket_resolved' | 'approved';
  business_days_only: boolean;
  weekend_days?: number[];
  pause_on_external: boolean;
  reset_on_reassign: boolean;

  // Alerts & Escalation:
  alert_before_percent: number;
  alert_at_100: boolean;
  alert_breached: boolean;
  escalate_after_hours: number;
  escalation_role: SLAEscalationRole;
  escalation_role_ar: string;

  // Metadata:
  is_system_core?: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export function computeDurationMs(value: number, unit: SLAUnit): number {
  switch (unit) {
    case 'minutes':
      return value * 60 * 1000;
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'business_days':
      return value * 24 * 60 * 60 * 1000;
    case 'days':
    default:
      return value * 24 * 60 * 60 * 1000;
  }
}

export function formatSLALabel(value: number, unit: SLAUnit, isRtl: boolean): string {
  if (isRtl) {
    switch (unit) {
      case 'minutes':
        return value === 1 ? 'دقيقة واحدة' : value === 2 ? 'دقيقتان' : `${value} دقيقة`;
      case 'hours':
        return value === 1 ? 'ساعة واحدة' : value === 2 ? 'ساعتان' : value <= 10 ? `${value} ساعات` : `${value} ساعة`;
      case 'business_days':
        return value === 1 ? 'يوم عمل واحد' : value === 2 ? 'يوما عمل' : value <= 10 ? `${value} أيام عمل` : `${value} يوم عمل`;
      case 'days':
      default:
        return value === 1 ? 'يوم واحد' : value === 2 ? 'يومان' : value <= 10 ? `${value} أيام` : `${value} يوم`;
    }
  } else {
    switch (unit) {
      case 'minutes':
        return `${value} min`;
      case 'hours':
        return `${value} ${value === 1 ? 'hour' : 'hours'}`;
      case 'business_days':
        return `${value} ${value === 1 ? 'business day' : 'business days'}`;
      case 'days':
      default:
        return `${value} ${value === 1 ? 'day' : 'days'}`;
    }
  }
}

export function calculateSLADeadline(
  startDate: Date | string,
  durationValue: number,
  durationUnit: SLAUnit,
  businessDaysOnly: boolean = false
): Date {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return new Date();

  if (!businessDaysOnly && durationUnit !== 'business_days') {
    return new Date(start.getTime() + computeDurationMs(durationValue, durationUnit));
  }

  // Business days calculation:
  // Weekends in Egypt/MENA: Friday (5) and Saturday (6)
  let current = new Date(start.getTime());
  if (durationUnit === 'business_days') {
    let daysRemaining = durationValue;
    while (daysRemaining > 0) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        daysRemaining--;
      }
    }
    return current;
  } else {
    let endMs = start.getTime() + computeDurationMs(durationValue, durationUnit);
    let end = new Date(endMs);
    while (end.getDay() === 5 || end.getDay() === 6) {
      end.setDate(end.getDate() + 1);
    }
    return end;
  }
}

export const STAGE_SLA_CONFIG: Record<string, StageSlaConfig> = {
  new: { durationMs: 15 * 60 * 1000, label_ar: '15 دقيقة', label_en: '15 min' },
  qualified: { durationMs: 24 * 60 * 60 * 1000, label_ar: '24 ساعة', label_en: '24 hours' },
  registered: { durationMs: 2 * 60 * 60 * 1000, label_ar: 'ساعتان للتأكيد', label_en: '2 hours' },
  review: { durationMs: 4 * 60 * 60 * 1000, label_ar: '4 ساعات عمل', label_en: '4 work hrs' },
  submitted: { durationMs: 24 * 60 * 60 * 1000, label_ar: '24 ساعة', label_en: '24 hours' },
  preliminary: { durationMs: 48 * 60 * 60 * 1000, label_ar: 'يومان للإبلاغ', label_en: '2 days' },
  stage2: { durationMs: 72 * 60 * 60 * 1000, label_ar: 'مهلة الجامعة (3 أيام)', label_en: '3 days' },
  docs: { durationMs: 120 * 60 * 60 * 1000, label_ar: 'حسب المسار (5 أيام)', label_en: '5 days' },
  final: { durationMs: 24 * 60 * 60 * 1000, label_ar: 'إبلاغ فوري (24 ساعة)', label_en: '24 hours' },
  closed: { durationMs: 7 * 24 * 60 * 60 * 1000, label_ar: 'خلال أسبوع للتقييم', label_en: 'Within 7d' }
};

export interface LifecycleIntegrityReport {
  totalRecords: number;
  activeFilesCount: number;
  stageCountsSum: number;
  overdueCount: number;
  archivedCount: number;
  isBalanced: boolean;
  inconsistencies: {
    fileId: string;
    fileCode: string;
    issueType: 
      | 'INVALID_STAGE'
      | 'ARCHIVED_STILL_ACTIVE'
      | 'DUPLICATE_FILE'
      | 'MISSING_STAGE_TIMESTAMP'
      | 'RECOVERED_CLOSED_AT'
      | 'PASSED_ARCHIVE_DEADLINE'
      | 'INCORRECT_SLA_STATUS';
    description: string;
    resolutionApplied?: string;
  }[];
}

export interface Department {
  id: DepartmentId | string;
  name_ar: string;
  name_en: string;
  code?: string;
  head_title_ar?: string;
  head_title_en?: string;
  head_employee_id?: string;
  color_hex?: string;
  color?: string;
  description_ar?: string;
  description_en?: string;
  description?: string;
  order_index?: number;
  roles?: RoleId[];
  report_permissions?: Record<string, boolean>;
  dashboard_permissions?: Record<string, boolean>;
}

export interface JobPosition {
  id: RoleId | string;
  code?: string;
  department_id: DepartmentId | string | null;
  title_ar: string;
  title_en: string;
  description?: string;
  reports_to_position_id?: RoleId | string;
  purpose_ar?: string;
  purpose_en?: string;
  duties_ar?: string[];
  duties_en?: string[];
  authority_ar?: string;
  authority_en?: string;
  kpis_ar?: string[];
  kpis_en?: string[];
  skills_ar?: string[];
  skills_en?: string[];
  permissions?: string[];
  is_active?: boolean;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name_ar: string;
  full_name_en: string;
  username: string;
  email: string;
  phone: string;
  whatsapp?: string;
  department_id: DepartmentId | string;
  position_id: RoleId | string;
  job_title?: string;
  job_title_ar?: string;
  job_title_en?: string;
  job_title_code?: string;
  direct_manager_id?: string;
  employment_status: 'active' | 'on_leave' | 'terminated';
  joining_date: string;
  avatar_url?: string;
  roles: string[];
  permissions?: string[];
  custom_permissions?: string[];
  permission_overrides?: Record<string, boolean>;
  report_overrides?: Record<string, boolean>;
  dashboard_overrides?: Record<string, boolean>;
  // System User Management & Password Administration
  is_system_user?: boolean;
  account_status?: 'active' | 'suspended' | 'pending_password_change';
  password_hash?: string;
  must_change_password?: boolean;
  password_changed_at?: string;
  last_password_reset_at?: string;
  auth_account_id?: string;
  sync_status?: AccountSyncStatus;
}

export type AccountSyncStatus = 'synchronized' | 'requires_repair' | 'not_linked' | 'disabled';

export interface AccountSyncDiagnostic {
  status: AccountSyncStatus;
  isSystemUser: boolean;
  hasAuthAccount: boolean;
  usernameMatch: boolean;
  username: string;
  reasonAr: string;
  reasonEn: string;
}

export interface SystemUserAccount {
  id: string;
  employee_id: string;
  username: string;
  email: string;
  password_hash: string;
  must_change_password: boolean;
  status: 'active' | 'suspended' | 'pending_password_change';
  is_super_admin: boolean;
  last_login_at?: string;
  last_password_reset_at?: string;
  password_changed_at?: string;
  created_at: string;
  updated_at: string;
}

export type AuthDiagnosticCode =
  | 'SUCCESS'
  | 'USER_NOT_FOUND'
  | 'SYSTEM_USER_NOT_ACTIVATED'
  | 'ACCOUNT_REQUIRES_SETUP'
  | 'ACCOUNT_DISABLED'
  | 'INVALID_PASSWORD';

export interface AuthDiagnosticResult {
  success: boolean;
  code: AuthDiagnosticCode;
  message: string;
  message_en: string;
  employee?: Employee;
  systemUser?: SystemUserAccount;
}

export interface UserProfile {
  id: string;
  employee_id: string;
  username: string;
  preferred_language: 'ar' | 'en';
  theme_preference: 'light' | 'dark';
  is_super_admin: boolean;
  is_active: boolean;
  last_login_at?: string;
  last_login_ip?: string;
}

export interface StudentChoice {
  order: number;
  university_ar: string;
  university_en: string;
  faculty_ar: string;
  faculty_en: string;
  specialization_ar?: string;
  specialization_en?: string;
  university_id?: string;
  faculty_id?: string;
  specialization_id?: string;
  degree_ar?: string;
  program_type_ar?: string;
  university_type?: string;
  governorate_ar?: string;
  campus_name_ar?: string;
  gender_type_ar?: string;
}

export interface Student {
  id: string;
  student_code: string;
  full_name_ar: string;
  full_name_en: string;
  nationality: string;
  passport_number: string;
  passport_expiry_date: string;
  birth_date?: string;
  gender?: 'male' | 'female';
  national_id?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  residence_country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  created_at: string;
  is_archived?: boolean;
}

export type StudentFileActionType =
  | 'FILE_CREATED'
  | 'FILE_ASSIGNED'
  | 'FILE_REASSIGNED'
  | 'STAGE_TRANSITION'
  | 'DOCUMENTS_VERIFIED'
  | 'DOCUMENTS_REJECTED'
  | 'APPLICATION_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'FILE_APPROVED'
  | 'FILE_REJECTED'
  | 'FILE_CLOSED'
  | 'FILE_REOPENED'
  | 'CHOICES_UPDATED'
  | 'NOTE_ADDED'
  | 'STATUS_UPDATED'
  | 'ADMIN_CORRECTION'
  | 'FILE_ARCHIVED'
  | 'FILE_EVALUATED'
  | 'STUDENT_INFO_UPDATED';

export interface StudentFileActivityRecord {
  id: string;
  student_file_id: string;
  action_type: StudentFileActionType;
  actor_id: string;
  actor_name: string;
  actor_name_ar?: string;
  actor_name_en?: string;
  actor_role?: string;
  actor_department?: string;
  previous_stage?: StudentFileStatus;
  new_stage?: StudentFileStatus;
  previous_owner_id?: string;
  previous_owner_name?: string;
  new_owner_id?: string;
  new_owner_name?: string;
  timestamp: string; // ISO 8601
  notes?: string;
  details?: Record<string, any>;
}

export interface StudentFile {
  id: string;
  file_code: string;
  student_id: string;
  student?: Student;
  service_type: 'university_admission' | 'cert_extraction' | 'attestation' | 're_nomination';
  academic_year: string;
  certificate_type: string;
  graduation_year: number;
  academic_percentage: number;
  current_status: StudentFileStatus;
  current_owner_id: string;
  current_owner?: Employee;
  assigned_consultant_id?: string;
  assigned_ops_specialist_id?: string;
  intake_source?: string;
  campaign_id?: string;
  university_choices: StudentChoice[];
  current_stage_entered_at: string;
  stage_deadline_at?: string;
  last_updated_at: string;
  is_overdue: boolean;
  is_registered_fee_paid: boolean;
  is_stage2_paid: boolean;
  created_at: string;
  // User Activity & Ownership Tracking
  last_action_by_id?: string;
  last_action_by_name?: string;
  last_action_at?: string;
  last_action_type?: StudentFileActionType | string;
  // File Evaluation & Archiving Extensions
  closed_at?: string;
  is_evaluated?: boolean;
  evaluation_score?: number;
  evaluation_rating?: string;
  evaluation_notes?: string;
  evaluated_at?: string;
  evaluated_by?: string;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: string;
  archive_reason?: string;
  reopened_at?: string;
  reopened_by?: string;
  reopen_reason?: string;
}

export interface StudentDocument {
  id: string;
  student_file_id: string;
  student_id?: string;
  document_type: string;
  title: string;
  file_name: string;
  file_storage_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  stamping_stage?: 'education' | 'foreign_affairs' | 'embassy' | 'consulate';
  uploaded_by?: string;
  uploader_name?: string;
  uploaded_at: string;
  created_at: string;
  previous_file_name?: string;
  is_replaced?: boolean;
}

export type StandardPaymentMethod = 'bank_transfer' | 'cash' | 'instapay' | 'vodafone_cash';

export interface FinancialAccount {
  id: string;
  account_code: string;
  account_name_ar: string;
  account_name_en: string;
  channel: StandardPaymentMethod;
  institution_name_ar: string;
  institution_name_en: string;
  account_number?: string;
  currency: 'EGP' | 'USD' | 'multi';
  is_active: boolean;
}

export interface PaymentRecord {
  id: string;
  receipt_code: string;
  student_id: string;
  student_name?: string;
  student_file_id?: string;
  category_id: string;
  amount: number;
  currency: string;
  payment_method: 'bank_transfer' | 'cash' | 'instapay' | 'vodafone_cash' | 'pos' | string;
  payment_reference: string;
  bank_name?: string;
  financial_account_id?: string;
  financial_account_name?: string;
  payer_name: string;
  payment_description?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'reversed' | 'cancelled';
  confirmed_by?: string;
  confirmed_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  last_edit_reason?: string;
}

export interface Task {
  id: string;
  task_code: string;
  title: string;
  description?: string;
  student_file_id?: string;
  department_id?: DepartmentId;
  creator_id: string;
  assignee_id: string;
  assignee?: Employee;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'assigned' | 'in_progress' | 'pending_approval' | 'completed' | 'cancelled';
  deadline_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  ticket_code: string;
  title?: string;
  student_id?: string;
  student_file_id?: string;
  complainant_name: string;
  complainant_phone: string;
  category: 'delay' | 'wrong_choice' | 'financial' | 'attitude' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  responsible_department_id?: DepartmentId;
  assigned_resolver_id?: string;
  assigned_resolver?: Employee;
  first_response_at?: string;
  sla_resolution_deadline_at: string;
  status: 'new' | 'investigating' | 'action_pending' | 'resolved' | 'closed';
  root_cause_analysis?: string;
  corrective_action?: string;
  preventative_action?: string;
  resolved_at?: string;
  created_at: string;
}

export interface DepartmentalHandoff {
  id: string;
  handoff_type: string;
  student_file_id?: string;
  sending_department_id: DepartmentId;
  receiving_department_id: DepartmentId;
  sender_id: string;
  recipient_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  checklist_payload: Record<string, boolean | string>;
  sla_deadline_at: string;
  resolved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: string;
  actor_username: string;
  ip_address?: string;
  user_agent?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_state?: any;
  new_state?: any;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id?: string;
  recipient_user_id?: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  category: 'task' | 'file_update' | 'approval' | 'payment' | 'overdue' | 'complaint' | 'handoff' | 'announcement' | 'request' | 'file' | 'system';
  module?: 'tasks' | 'approvals' | 'crm' | 'finance' | 'quality' | 'capacity' | 'marketing' | 'hr' | 'workflows' | 'system';
  type?: 'info' | 'warning' | 'success' | 'danger';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  related_link?: string;
  related_id?: string;
  related_type?: string;
  sender_id?: string;
  sender_name?: string;
  created_at: string;
}

export type UniversityType = 
  | 'public'               // حكومية
  | 'private'              // خاصة
  | 'national'             // أهلية (منبثقة عن حكومية أو دولية)
  | 'technological'        // تكنولوجية
  | 'international_branch' // فرع جامعة دولية / أجنبية
  | 'special_nature';      // ذات طبيعة خاصة

export type UniversitySector = 
  | 'medical' 
  | 'engineering' 
  | 'science' 
  | 'business' 
  | 'humanities' 
  | 'applied_arts' 
  | 'agriculture' 
  | 'other';

export interface UniversityCampus {
  id: string;
  university_id: string;
  name_ar: string;
  name_en: string;
  governorate_ar: string;
  governorate_en: string;
  city_ar?: string;
  city_en?: string;
  address_ar?: string;
  is_main_campus: boolean;
  is_active?: boolean;
}

export interface AcademicDepartment {
  id: string;
  faculty_id: string;
  name_ar: string;
  name_en: string;
  code?: string;
  specializations?: AcademicSpecialization[];
}

export interface AcademicSpecialization {
  id: string;
  faculty_id: string;
  department_id?: string;
  name_ar: string;
  name_en: string;
  degree_ar: string; // بكالوريوس / ليسانس / ماجستير / دبلوم
  degree_en: string; // Bachelor / Master / Diploma
  program_type: 'general' | 'credit_hours' | 'distinguished' | 'joint_international';
  program_type_ar: string;
  study_system_ar?: string; // ساعات معتمدة / فصلي
  study_system_en?: string;
  language?: 'ar' | 'en' | 'fr' | string;
  is_available: boolean;
  source_verification?: string;
  last_verified_at?: string;
}

export interface University {
  id: string;
  name_ar: string;
  name_en: string;
  type: UniversityType | 'public' | 'private' | 'national' | string;
  governorate_ar: string;
  governorate_en: string;
  city_ar?: string;
  city_en?: string;
  address_ar?: string;
  address_en?: string;
  website_url?: string;
  website?: string;
  accreditation_status: 'accredited' | 'conditionally_accredited' | 'under_review';
  accreditation_body_ar: string;
  accreditation_body_en: string;
  accreditation_body?: string;
  established_year?: number;
  last_reviewed_at: string;
  last_verified_at?: string;
  is_active: boolean;
  notes?: string;
  partnership_nature_ar?: string;
  foreign_partner_name_en?: string;
}

export interface UniversityFaculty {
  id: string;
  university_id: string;
  campus_id?: string;
  campus_name_ar?: string;
  campus_name_en?: string;
  governorate_ar?: string;
  governorate_en?: string;
  gender_type?: 'all' | 'male' | 'female' | 'coeducational';
  gender_type_ar?: string;
  name_ar: string;
  name_en: string;
  code?: string;
  sector?: UniversitySector;
  sector_ar?: string;
  accreditation_status?: 'accredited' | 'under_review' | 'conditionally_accredited';
  is_accredited?: boolean;
  specialization_ar?: string;
  specialization_en?: string;
  is_active: boolean;
  departments?: AcademicDepartment[];
  specializations?: AcademicSpecialization[];
  source_verification?: string;
  last_verified_at?: string;
  established_year?: number;
}

export interface ExpenseRecord {
  id: string;
  voucher_code: string;
  title_ar: string;
  title_en: string;
  category: 'operational' | 'government_fees' | 'marketing' | 'salaries' | 'office' | 'travel' | 'employee_incentives' | string;
  department_id: DepartmentId | string;
  amount: number;
  currency: 'EGP' | 'USD';
  payment_method: 'bank_transfer' | 'cash' | 'instapay' | 'vodafone_cash' | 'card' | 'petty_cash' | string;
  financial_account_id?: string;
  financial_account_name?: string;
  bank_name?: string;
  responsible_employee_id: string;
  responsible_employee?: Employee;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  attachment_url?: string;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  paid_by?: string;
  paid_at?: string;
  created_at: string;

  // Employee Incentive & Detailed Voucher Fields (Modifications 1, 2, 4)
  beneficiary_employee_id?: string;
  beneficiary_employee_name?: string;
  transaction_number?: string; // Student file code e.g. BCT-FILE-2026-001
  student_file_id?: string;
  student_name?: string;
  incentive_type?: 'file_completion' | 'acquisition' | 'excellence' | 'performance' | string;
  incentive_policy_id?: string;
  incentive_calculation_reference?: string;
  eligibility_status?: 'eligible' | 'pending_completion' | 'ineligible';
  ineligibility_reason?: string;
  vendor_name?: string;
  invoice_number?: string;
  description?: string;
  disbursed_by?: string;
  disbursed_at?: string;
  voucher_issue_date?: string;
}

export interface IncentivePolicy {
  id: string;
  code: string;
  title_ar: string;
  title_en: string;
  incentive_type: 'file_completion' | 'acquisition' | 'excellence' | 'performance';
  calc_mode: 'fixed' | 'percentage';
  amount_or_percentage: number;
  currency: 'EGP' | 'USD';
  eligible_roles: string[];
  eligible_services: string[];
  required_stage: 'closed'; // Stage 10: Closed & Evaluated
  required_min_score?: number;
  is_active: boolean;
  version: string;
  effective_from: string;
  effective_to?: string;
  description_ar?: string;
  description_en?: string;
}

export interface EmployeeIncentiveRecord {
  id: string;
  incentive_code: string;
  employee_id: string;
  employee_name: string;
  employee_name_ar?: string;
  employee_name_en?: string;
  department_id: string;
  student_file_id: string;
  transaction_number: string;
  student_name: string;
  service_type: string;
  policy_id: string;
  policy_version: string;
  policy_name: string;
  incentive_type: 'file_completion' | 'acquisition' | 'excellence' | 'performance' | string;
  amount: number;
  currency: 'EGP' | 'USD';
  calculation_note: string;
  eligibility_status: 'eligible' | 'pending_completion' | 'ineligible';
  eligibility_verified_at?: string;
  eligibility_note?: string;
  approval_status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  payment_status: 'unpaid' | 'paid' | 'cancelled';
  expense_id?: string;
  voucher_code?: string;
  payment_method?: StandardPaymentMethod;
  financial_account_id?: string;
  financial_account_name?: string;
  paid_by?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AccountMovement {
  id: string;
  movement_code: string; // MOV-2026-001
  account_id: string; // e.g. acc-bank-01
  account_name_ar: string;
  account_name_en: string;
  channel: StandardPaymentMethod;
  posting_date: string;
  document_type: 'receipt_voucher' | 'payment_voucher' | 'incentive_voucher' | 'transfer_in' | 'transfer_out' | 'adjustment';
  document_number: string; // RCT-2026-001 or EXP-2026-001 or TRF-2026-001
  transaction_reference?: string;
  description_ar: string;
  description_en: string;
  debit_amount: number; // مدين - مقبوضات تزيد رصيد الحساب
  credit_amount: number; // دائن - مدفوعات تخفض رصيد الحساب
  currency: 'EGP' | 'USD';
  running_balance: number;
  source_entity_type: 'payment_record' | 'expense_record' | 'internal_transfer';
  source_entity_id: string;
  recorded_by: string;
  recorded_by_id?: string;
  notes?: string;
  department_id?: string;
  employee_id?: string;
  created_at: string;
}

export interface InternalTransfer {
  id: string;
  transfer_code: string;
  from_account_id: string;
  from_account_name: string;
  to_account_id: string;
  to_account_name: string;
  amount: number;
  currency: 'EGP' | 'USD';
  transfer_date: string;
  reference_note?: string;
  status: 'completed' | 'cancelled';
  executed_by: string;
  created_at: string;
}

export interface DepartmentBudget {
  id: string;
  budget_code: string;
  department_id: DepartmentId | string;
  department_name_ar?: string;
  period_type: 'monthly' | 'quarterly' | 'annual';
  fiscal_period: string;
  allocated_amount: number;
  currency: 'EGP' | 'USD';
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by?: string;
  notes?: string;
  created_at: string;
}

export interface ExchangeRate {
  id: string;
  base_currency: 'USD';
  target_currency: 'EGP';
  rate: number;
  effective_date: string;
  source: string;
  last_updated_at: string;
}

export interface HRBackupAssignment {
  id: string;
  role_id: string;
  role_title_ar: string;
  role_title_en: string;
  primary_employee_id: string;
  primary_employee_name_ar: string;
  backup_employee_id: string;
  backup_employee_name_ar: string;
  backup_employee_role_ar: string;
  readiness_percentage: number;
  notes?: string;
}

export interface PerformanceEvaluation {
  id: string;
  evaluation_code: string;
  employee_id: string;
  employee_name_ar?: string;
  evaluator_id: string;
  evaluator_name_ar?: string;
  evaluation_period: string;
  sla_compliance_score: number;
  task_completion_score: number;
  quality_accuracy_score: number;
  client_satisfaction_score: number;
  overall_score: number;
  strengths?: string;
  areas_for_improvement?: string;
  evaluator_comments?: string;
  status: 'draft' | 'submitted' | 'approved';
  approved_by?: string;
  created_at: string;
  // Soft Delete & Audit Metadata
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deleted_by_name_ar?: string;
  deletion_reason?: string;
}

// --- Operational Capacity Gate & Campaigns (Fix & Enhancements) ---
export type CampaignStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'paused'
  | 'rejected'
  | 'capacity_adjustment_required'
  | 'adjustment_required'
  | 'cancelled';

export interface CampaignReviewLog {
  id: string;
  action: 'submit' | 'approve' | 'reject' | 'request_adjustment' | 'cancel' | 'update';
  actor_id: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  reason?: string;
  notes?: string;
  capacity_snapshot?: {
    approved_capacity: number;
    committed_capacity: number;
    available_capacity: number;
    expected_registrations: number;
  };
}

export interface Campaign {
  id: string;
  campaign_code: string;
  name: string;
  channel: 'meta' | 'google' | 'tiktok' | 'snapchat' | 'direct' | 'referral' | string;
  target_country: string;
  target_audience?: string;
  budget_amount: number;
  currency: 'EGP' | 'USD';
  start_date: string;
  end_date: string;
  target_leads: number; // Expected Inquiries
  expected_registrations: number; // Estimated student registrations
  owner_id?: string;
  owner_name?: string;
  owner_role?: string;
  status: CampaignStatus;
  ops_capacity_approved: boolean;
  ops_capacity_approved_by?: string;
  ops_capacity_approved_at?: string;
  rejection_reason?: string;
  adjustment_notes?: string;
  review_history?: CampaignReviewLog[];
  created_at: string;
  updated_at?: string;
}

export interface CapacityAdjustment {
  id: string;
  period: string;
  adjustment_slots: number; // +/- slots
  reason: string;
  approved_by: string;
  approved_by_name: string;
  created_at: string;
}

export interface CapacitySettings {
  period: string;
  base_capacity: number;
  adjustments: CapacityAdjustment[];
  last_updated_at: string;
  last_updated_by: string;
}

export interface CapacityBreakdown {
  period: string;
  base_capacity: number;
  total_adjustments: number;
  approved_capacity: number;
  active_workload: number;
  reserved_campaign_capacity: number;
  committed_capacity: number;
  available_capacity: number;
  proposed_registrations: number;
  projected_remaining: number;
  is_over_capacity: boolean;
  active_approved_campaigns_count: number;
  active_pipeline_files_count: number;
  utilization_rate_pct: number;
}
