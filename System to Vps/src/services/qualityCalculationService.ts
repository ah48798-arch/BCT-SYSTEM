/**
 * BCT Enterprise - Quality Management & SLA Calculation Service
 *
 * Single Source of Truth for:
 * 1. The 6 Departmental SLA Compliance Benchmarks
 * 2. Overall Operational Quality Score (volume-weighted dynamic formula)
 * 3. 7-Day Inactivity Red Alerts & Overdue Active Files
 * 4. Root Cause Analysis & Corrective Actions Database
 */

import {
  StudentFile,
  Task,
  Complaint,
  DepartmentalHandoff,
  PaymentRecord,
  StudentFileActivityRecord,
  SLAConfigurationItem,
  LIFECYCLE_STAGE_DEFINITIONS
} from '../types/database.types';
import { bctStore } from './store';

export type TimeRangeFilter = 'all' | 'today' | '7days' | '30days';

export interface SLAMetricDetail {
  code: string;
  category: string;
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  nameAr: string;
  nameEn: string;
  targetLimitAr: string;
  targetLimitEn: string;
  targetDurationMs: number;
  completedCount: number;
  onTimeCount: number;
  breachedCount: number;
  pendingCount: number;
  complianceRate: number; // 0 to 100 percentage
  status: 'optimal' | 'warning' | 'critical';
  descriptionAr: string;
  descriptionEn: string;
}

export interface StagnantFileAlert {
  file: StudentFile;
  fileCode: string;
  studentId: string;
  studentNameAr: string;
  studentNameEn: string;
  stageNumber: string;
  stageNameAr: string;
  stageNameEn: string;
  stageKey: string;
  stageBadgeColor: string;
  stageBadgeBg: string;
  ownerNameAr: string;
  ownerNameEn: string;
  daysInactive: number;
  lastActivityDate: string;
  isOverdue: boolean;
  priority: 'critical' | 'high' | 'medium';
}

export interface CorrectiveActionRecord {
  id: string;
  ticketCode: string;
  title: string;
  complainantName: string;
  category: string;
  priority: string;
  status: 'new' | 'investigating' | 'action_pending' | 'resolved' | 'closed';
  rootCauseAnalysis: string;
  correctiveAction: string;
  preventativeAction: string;
  responsibleDepartmentId?: string;
  assignedResolverNameAr?: string;
  assignedResolverNameEn?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface QualityDashboardData {
  overallQualityScore: number;
  totalEligibleCompleted: number;
  totalOnTime: number;
  totalBreached: number;
  totalPending: number;
  slaMetrics: SLAMetricDetail[];
  stagnantFiles: StagnantFileAlert[];
  correctiveActions: CorrectiveActionRecord[];
  calculationTimestamp: string;
}

/**
 * Filter items by date range against a given timestamp ISO string
 */
function isWithinTimeRange(timestamp: string | undefined, timeRange: TimeRangeFilter): boolean {
  if (!timestamp || timeRange === 'all') return true;
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return true;
  const now = Date.now();
  const diffHours = (now - time) / (1000 * 3600);

  switch (timeRange) {
    case 'today':
      return diffHours <= 24;
    case '7days':
      return diffHours <= 24 * 7;
    case '30days':
      return diffHours <= 24 * 30;
    default:
      return true;
  }
}

/**
 * Calculates the 6 Departmental SLA Metrics dynamically from actual database records.
 */
export function calculateSLAMetrics(
  slaConfigs: SLAConfigurationItem[],
  tasks: Task[],
  complaints: Complaint[],
  handoffs: DepartmentalHandoff[],
  payments: PaymentRecord[],
  files: StudentFile[],
  activities: StudentFileActivityRecord[],
  timeRange: TimeRangeFilter = 'all'
): SLAMetricDetail[] {
  // 1. SLA-TASK-INQUIRY: أول استجابة للاستفسار (15 minutes) - Customer Service (cs)
  const inquiryCfg = slaConfigs.find(s => s.code === 'SLA-TASK-INQUIRY');
  const inquiryLimitMs = inquiryCfg?.duration_ms || 15 * 60 * 1000;
  let inquiryCompleted = 0;
  let inquiryOnTime = 0;
  let inquiryBreached = 0;
  let inquiryPending = 0;

  // Evaluate complaints first responses
  complaints
    .filter(c => isWithinTimeRange(c.created_at, timeRange))
    .forEach(c => {
      if (c.first_response_at) {
        inquiryCompleted++;
        const elapsed = new Date(c.first_response_at).getTime() - new Date(c.created_at).getTime();
        if (elapsed <= inquiryLimitMs) {
          inquiryOnTime++;
        } else {
          inquiryBreached++;
        }
      } else if (c.status !== 'resolved' && c.status !== 'closed') {
        const elapsed = Date.now() - new Date(c.created_at).getTime();
        if (elapsed > inquiryLimitMs) {
          inquiryBreached++;
        } else {
          inquiryPending++;
        }
      }
    });

  // Evaluate incoming student files in initial stage
  files
    .filter(f => isWithinTimeRange(f.created_at, timeRange))
    .forEach(f => {
      const fileActs = activities.filter(a => a.student_file_id === f.id && a.action_type !== 'FILE_CREATED');
      if (fileActs.length > 0) {
        // Earliest follow-up action
        const firstActTime = Math.min(...fileActs.map(a => new Date(a.timestamp).getTime()));
        const createdTime = new Date(f.created_at).getTime();
        const elapsed = firstActTime - createdTime;
        inquiryCompleted++;
        if (elapsed <= inquiryLimitMs) {
          inquiryOnTime++;
        } else {
          inquiryBreached++;
        }
      } else if (f.current_status === 'new' && !f.is_archived) {
        const elapsed = Date.now() - new Date(f.created_at).getTime();
        if (elapsed > inquiryLimitMs) {
          inquiryBreached++;
        } else {
          inquiryPending++;
        }
      }
    });

  const inquiryCompliance = inquiryCompleted > 0
    ? Math.round((inquiryOnTime / inquiryCompleted) * 100)
    : (inquiryBreached > 0 ? 0 : 100);

  // 2. SLA-TASK-DOC-REVIEW: مراجعة وتدقيق المستندات (4 working hours) - Operations (ops)
  const docReviewCfg = slaConfigs.find(s => s.code === 'SLA-TASK-DOC-REVIEW');
  const docLimitMs = docReviewCfg?.duration_ms || 4 * 60 * 60 * 1000;
  let docCompleted = 0;
  let docOnTime = 0;
  let docBreached = 0;
  let docPending = 0;

  tasks
    .filter(t => t.department_id === 'ops' || t.title.includes('مراجعة') || t.title.includes('تدقيق') || t.title.toLowerCase().includes('review'))
    .filter(t => isWithinTimeRange(t.created_at, timeRange))
    .forEach(t => {
      if (t.status === 'completed') {
        docCompleted++;
        if (t.deadline_at && t.completed_at) {
          if (new Date(t.completed_at) <= new Date(t.deadline_at)) {
            docOnTime++;
          } else {
            docBreached++;
          }
        } else if (t.completed_at) {
          const elapsed = new Date(t.completed_at).getTime() - new Date(t.created_at).getTime();
          if (elapsed <= docLimitMs) {
            docOnTime++;
          } else {
            docBreached++;
          }
        } else {
          docOnTime++;
        }
      } else if (t.status !== 'cancelled') {
        if (t.deadline_at && Date.now() > new Date(t.deadline_at).getTime()) {
          docBreached++;
        } else {
          docPending++;
        }
      }
    });

  const docCompliance = docCompleted > 0
    ? Math.round((docOnTime / docCompleted) * 100)
    : (docBreached > 0 ? 0 : 100);

  // 3. SLA-TASK-COMPLAINT: البت في شكاوى الطلاب والعملاء (3 days) - Quality & Complaints (qa)
  const complaintCfg = slaConfigs.find(s => s.code === 'SLA-TASK-COMPLAINT');
  const complaintLimitMs = complaintCfg?.duration_ms || 3 * 24 * 60 * 60 * 1000;
  let cmpCompleted = 0;
  let cmpOnTime = 0;
  let cmpBreached = 0;
  let cmpPending = 0;

  complaints
    .filter(c => isWithinTimeRange(c.created_at, timeRange))
    .forEach(c => {
      const deadline = c.sla_resolution_deadline_at
        ? new Date(c.sla_resolution_deadline_at).getTime()
        : new Date(c.created_at).getTime() + complaintLimitMs;

      if (c.status === 'resolved' || c.status === 'closed') {
        cmpCompleted++;
        const resolved = c.resolved_at ? new Date(c.resolved_at).getTime() : new Date().getTime();
        if (resolved <= deadline) {
          cmpOnTime++;
        } else {
          cmpBreached++;
        }
      } else {
        if (Date.now() > deadline) {
          cmpBreached++;
        } else {
          cmpPending++;
        }
      }
    });

  const cmpCompliance = cmpCompleted > 0
    ? Math.round((cmpOnTime / cmpCompleted) * 100)
    : (cmpBreached > 0 ? 0 : 100);

  // 4. SLA-TASK-PASSPORT-VISA: تدقيق جواز السفر والتأشيرة (6 working hours) - Operations (ops)
  const passportCfg = slaConfigs.find(s => s.code === 'SLA-TASK-PASSPORT-VISA');
  const passportLimitMs = passportCfg?.duration_ms || 6 * 60 * 60 * 1000;
  let passportCompleted = 0;
  let passportOnTime = 0;
  let passportBreached = 0;
  let passportPending = 0;

  // Tasks involving passport / visa
  tasks
    .filter(t =>
      t.title.includes('جواز') ||
      t.title.includes('تأشيرة') ||
      t.title.toLowerCase().includes('passport') ||
      t.title.toLowerCase().includes('visa') ||
      Boolean(t.description?.includes('جواز')) ||
      Boolean(t.description?.includes('تأشيرة'))
    )
    .filter(t => isWithinTimeRange(t.created_at, timeRange))
    .forEach(t => {
      if (t.status === 'completed') {
        passportCompleted++;
        if (t.deadline_at && t.completed_at) {
          if (new Date(t.completed_at) <= new Date(t.deadline_at)) {
            passportOnTime++;
          } else {
            passportBreached++;
          }
        } else {
          passportOnTime++;
        }
      } else if (t.status !== 'cancelled') {
        if (t.deadline_at && Date.now() > new Date(t.deadline_at).getTime()) {
          passportBreached++;
        } else {
          passportPending++;
        }
      }
    });

  // Handoffs with passport validation checklist
  handoffs
    .filter(h => h.checklist_payload && h.checklist_payload.passport_valid_6_months !== undefined)
    .filter(h => isWithinTimeRange(h.created_at, timeRange))
    .forEach(h => {
      const deadline = h.sla_deadline_at ? new Date(h.sla_deadline_at).getTime() : new Date(h.created_at).getTime() + passportLimitMs;
      if (h.status === 'accepted' || h.status === 'rejected') {
        passportCompleted++;
        const resolved = h.resolved_at ? new Date(h.resolved_at).getTime() : new Date().getTime();
        if (resolved <= deadline) {
          passportOnTime++;
        } else {
          passportBreached++;
        }
      } else if (h.status === 'pending') {
        if (Date.now() > deadline) {
          passportBreached++;
        } else {
          passportPending++;
        }
      }
    });

  const passportCompliance = passportCompleted > 0
    ? Math.round((passportOnTime / passportCompleted) * 100)
    : (passportBreached > 0 ? 0 : 100);

  // 5. SLA-TASK-PAYMENT-CLEARANCE: اعتماد ومراجعة إيصالات السداد (2 hours) - Finance (fin)
  const paymentCfg = slaConfigs.find(s => s.code === 'SLA-TASK-PAYMENT-CLEARANCE');
  const paymentLimitMs = paymentCfg?.duration_ms || 2 * 60 * 60 * 1000;
  let paymentCompleted = 0;
  let paymentOnTime = 0;
  let paymentBreached = 0;
  let paymentPending = 0;

  payments
    .filter(p => isWithinTimeRange(p.created_at, timeRange))
    .forEach(p => {
      if (p.status === 'confirmed' || p.status === 'rejected') {
        paymentCompleted++;
        const created = new Date(p.created_at).getTime();
        const confirmed = p.confirmed_at ? new Date(p.confirmed_at).getTime() : created;
        const elapsed = confirmed - created;
        if (elapsed <= paymentLimitMs) {
          paymentOnTime++;
        } else {
          paymentBreached++;
        }
      } else if (p.status === 'pending') {
        const elapsed = Date.now() - new Date(p.created_at).getTime();
        if (elapsed > paymentLimitMs) {
          paymentBreached++;
        } else {
          paymentPending++;
        }
      }
    });

  const paymentCompliance = paymentCompleted > 0
    ? Math.round((paymentOnTime / paymentCompleted) * 100)
    : (paymentBreached > 0 ? 0 : 100);

  // 6. SLA-TASK-HANDOFF: البت في قبول أو رفض التسليم بين الأقسام (2 hours) - Operations (ops)
  const handoffCfg = slaConfigs.find(s => s.code === 'SLA-TASK-HANDOFF');
  const handoffLimitMs = handoffCfg?.duration_ms || 2 * 60 * 60 * 1000;
  let handoffCompleted = 0;
  let handoffOnTime = 0;
  let handoffBreached = 0;
  let handoffPending = 0;

  handoffs
    .filter(h => isWithinTimeRange(h.created_at, timeRange))
    .forEach(h => {
      const deadline = h.sla_deadline_at ? new Date(h.sla_deadline_at).getTime() : new Date(h.created_at).getTime() + handoffLimitMs;
      if (h.status === 'accepted' || h.status === 'rejected') {
        handoffCompleted++;
        const resolved = h.resolved_at ? new Date(h.resolved_at).getTime() : new Date().getTime();
        if (resolved <= deadline) {
          handoffOnTime++;
        } else {
          handoffBreached++;
        }
      } else if (h.status === 'pending') {
        if (Date.now() > deadline) {
          handoffBreached++;
        } else {
          handoffPending++;
        }
      }
    });

  const handoffCompliance = handoffCompleted > 0
    ? Math.round((handoffOnTime / handoffCompleted) * 100)
    : (handoffBreached > 0 ? 0 : 100);

  // Helper for badge status
  const getBadgeStatus = (rate: number, breaches: number): 'optimal' | 'warning' | 'critical' => {
    if (rate >= 95 && breaches === 0) return 'optimal';
    if (rate >= 80) return 'warning';
    return 'critical';
  };

  return [
    {
      code: 'SLA-TASK-INQUIRY',
      category: 'inquiry',
      departmentId: 'cs',
      departmentNameAr: inquiryCfg?.department_name_ar || 'إدارة المستشارين وخدمة العملاء',
      departmentNameEn: inquiryCfg?.department_name_en || 'Consultants & Customer Service',
      nameAr: inquiryCfg?.name_ar || 'أول استجابة للاستفسار',
      nameEn: inquiryCfg?.name_en || 'First Inquiry Response',
      targetLimitAr: inquiryCfg?.label_ar || '15 دقيقة',
      targetLimitEn: inquiryCfg?.label_en || '15 min',
      targetDurationMs: inquiryLimitMs,
      completedCount: inquiryCompleted,
      onTimeCount: inquiryOnTime,
      breachedCount: inquiryBreached,
      pendingCount: inquiryPending,
      complianceRate: inquiryCompliance,
      status: getBadgeStatus(inquiryCompliance, inquiryBreached),
      descriptionAr: 'سرعة أول رد تفاعلي مع العميل أو الطالب على قنوات الاستفسار',
      descriptionEn: 'First customer contact response speed across all communication channels'
    },
    {
      code: 'SLA-TASK-DOC-REVIEW',
      category: 'operational_task',
      departmentId: 'ops',
      departmentNameAr: docReviewCfg?.department_name_ar || 'إدارة العمليات والخدمات',
      departmentNameEn: docReviewCfg?.department_name_en || 'Operations & Services',
      nameAr: docReviewCfg?.name_ar || 'مراجعة وتدقيق المستندات',
      nameEn: docReviewCfg?.name_en || 'Document Review & Verification',
      targetLimitAr: docReviewCfg?.label_ar || '4 ساعات عمل',
      targetLimitEn: docReviewCfg?.label_en || '4 work hrs',
      targetDurationMs: docLimitMs,
      completedCount: docCompleted,
      onTimeCount: docOnTime,
      breachedCount: docBreached,
      pendingCount: docPending,
      complianceRate: docCompliance,
      status: getBadgeStatus(docCompliance, docBreached),
      descriptionAr: 'الفحص والتدقيق الفني للشهادات والمستندات قبل الرفع على المنصة',
      descriptionEn: 'Technical audit of certificates and student records prior to submission'
    },
    {
      code: 'SLA-TASK-COMPLAINT',
      category: 'complaint',
      departmentId: 'qa',
      departmentNameAr: complaintCfg?.department_name_ar || 'إدارة الجودة والحوكمة',
      departmentNameEn: complaintCfg?.department_name_en || 'Quality Assurance & Governance',
      nameAr: complaintCfg?.name_ar || 'البت في شكاوى الطلاب والعملاء',
      nameEn: complaintCfg?.name_en || 'Complaint Resolution',
      targetLimitAr: complaintCfg?.label_ar || '3 أيام كحد أقصى',
      targetLimitEn: complaintCfg?.label_en || 'Max 3 days',
      targetDurationMs: complaintLimitMs,
      completedCount: cmpCompleted,
      onTimeCount: cmpOnTime,
      breachedCount: cmpBreached,
      pendingCount: cmpPending,
      complianceRate: cmpCompliance,
      status: getBadgeStatus(cmpCompliance, cmpBreached),
      descriptionAr: 'معالجة الشكوى والتحقيق الجذري فيها وإغلاقها بإجراء وقائي',
      descriptionEn: 'Resolution, root-cause investigation, and preventive closure of grievances'
    },
    {
      code: 'SLA-TASK-PASSPORT-VISA',
      category: 'operational_task',
      departmentId: 'ops',
      departmentNameAr: passportCfg?.department_name_ar || 'إدارة العمليات والخدمات',
      departmentNameEn: passportCfg?.department_name_en || 'Operations & Services',
      nameAr: passportCfg?.name_ar || 'تدقيق جواز السفر والتأشيرة',
      nameEn: passportCfg?.name_en || 'Passport & Visa Review',
      targetLimitAr: passportCfg?.label_ar || '6 ساعات عمل',
      targetLimitEn: passportCfg?.label_en || '6 work hrs',
      targetDurationMs: passportLimitMs,
      completedCount: passportCompleted,
      onTimeCount: passportOnTime,
      breachedCount: passportBreached,
      pendingCount: passportPending,
      complianceRate: passportCompliance,
      status: getBadgeStatus(passportCompliance, passportBreached),
      descriptionAr: 'التحقق من سريان الجواز (6 أشهر) وصلاحية التأشيرات وأختام الدخول',
      descriptionEn: 'Verification of 6-month passport validity, entry stamps, and visas'
    },
    {
      code: 'SLA-TASK-PAYMENT-CLEARANCE',
      category: 'operational_task',
      departmentId: 'fin',
      departmentNameAr: paymentCfg?.department_name_ar || 'الإدارة المالية والحسابات',
      departmentNameEn: paymentCfg?.department_name_en || 'Finance & Accounts',
      nameAr: paymentCfg?.name_ar || 'اعتماد ومراجعة إيصالات السداد',
      nameEn: paymentCfg?.name_en || 'Payment Clearance',
      targetLimitAr: paymentCfg?.label_ar || 'ساعتان للتأكيد',
      targetLimitEn: paymentCfg?.label_en || '2 hours',
      targetDurationMs: paymentLimitMs,
      completedCount: paymentCompleted,
      onTimeCount: paymentOnTime,
      breachedCount: paymentBreached,
      pendingCount: paymentPending,
      complianceRate: paymentCompliance,
      status: getBadgeStatus(paymentCompliance, paymentBreached),
      descriptionAr: 'مطابقة التحويلات البنكية والإيصالات النقدية وإصدار السند المالي',
      descriptionEn: 'Reconciliation of bank receipts, cash vouchers, and financial release'
    },
    {
      code: 'SLA-TASK-HANDOFF',
      category: 'operational_task',
      departmentId: 'ops',
      departmentNameAr: handoffCfg?.department_name_ar || 'إدارة العمليات والخدمات',
      departmentNameEn: handoffCfg?.department_name_en || 'Operations & Services',
      nameAr: handoffCfg?.name_ar || 'البت في قبول أو رفض التسليم بين الأقسام',
      nameEn: handoffCfg?.name_en || 'Departmental Handoff Acceptance',
      targetLimitAr: handoffCfg?.label_ar || 'ساعتان',
      targetLimitEn: handoffCfg?.label_en || '2 hours',
      targetDurationMs: handoffLimitMs,
      completedCount: handoffCompleted,
      onTimeCount: handoffOnTime,
      breachedCount: handoffBreached,
      pendingCount: handoffPending,
      complianceRate: handoffCompliance,
      status: getBadgeStatus(handoffCompliance, handoffBreached),
      descriptionAr: 'استلام وتدقيق مسودة الملف المنقول بين الاستشارات والعمليات رسمياً',
      descriptionEn: 'Interdepartmental verification and formal acceptance of student handoffs'
    }
  ];
}

/**
 * Audit and filter Stagnant / Critical Overdue Files (> 7 Days Inactive).
 * Strictly excludes:
 * - is_archived: true
 * - current_status: 'closed' | 'archived' | 'completed' | 'cancelled' | 'graduated'
 */
export function calculateStagnantFiles(
  files: StudentFile[],
  activities: StudentFileActivityRecord[]
): StagnantFileAlert[] {
  const terminalStatuses = ['closed', 'archived', 'completed', 'cancelled', 'graduated'];

  return files
    .filter(f => {
      // Must not be archived and not in terminal status
      if (f.is_archived) return false;
      if (terminalStatuses.includes(f.current_status)) return false;

      // Find real last activity timestamp
      const fileActs = activities.filter(a => a.student_file_id === f.id);
      const latestActTime = fileActs.length > 0
        ? Math.max(...fileActs.map(a => new Date(a.timestamp).getTime()))
        : 0;

      const lastUpdate = Math.max(
        new Date(f.last_updated_at || f.created_at).getTime(),
        new Date(f.last_action_at || f.created_at).getTime(),
        latestActTime
      );

      const diffDays = (Date.now() - lastUpdate) / (1000 * 3600 * 24);
      return diffDays > 7 || Boolean(f.is_overdue);
    })
    .map(f => {
      const fileActs = activities.filter(a => a.student_file_id === f.id);
      const latestActTime = fileActs.length > 0
        ? Math.max(...fileActs.map(a => new Date(a.timestamp).getTime()))
        : 0;

      const lastUpdate = Math.max(
        new Date(f.last_updated_at || f.created_at).getTime(),
        new Date(f.last_action_at || f.created_at).getTime(),
        latestActTime
      );

      const diffDays = Math.max(0, Math.floor((Date.now() - lastUpdate) / (1000 * 3600 * 24)));
      const stageDef = LIFECYCLE_STAGE_DEFINITIONS.find(s => s.key === f.current_status);

      let priority: 'critical' | 'high' | 'medium' = 'medium';
      if (diffDays > 14 || (f.is_overdue && diffDays > 7)) {
        priority = 'critical';
      } else if (diffDays > 7 || f.is_overdue) {
        priority = 'high';
      }

      return {
        file: f,
        fileCode: f.file_code,
        studentId: f.student_id,
        studentNameAr: f.student?.full_name_ar || 'طالب غير محدد',
        studentNameEn: f.student?.full_name_en || 'Unnamed Student',
        stageNumber: stageDef?.stageNumber || `#${stageDef?.number || '?'}` || '#?',
        stageNameAr: stageDef?.name_ar || f.current_status,
        stageNameEn: stageDef?.name_en || f.current_status,
        stageKey: f.current_status,
        stageBadgeColor: stageDef?.color || 'text-slate-700',
        stageBadgeBg: stageDef?.bg_color || 'bg-slate-100',
        ownerNameAr: f.current_owner?.full_name_ar || 'غير مسند',
        ownerNameEn: f.current_owner?.full_name_en || 'Unassigned',
        daysInactive: diffDays,
        lastActivityDate: new Date(lastUpdate).toISOString(),
        isOverdue: Boolean(f.is_overdue),
        priority
      };
    })
    .sort((a, b) => b.daysInactive - a.daysInactive);
}

/**
 * Extract and structure Root Cause & Corrective Actions database records.
 */
export function extractCorrectiveActions(complaints: Complaint[]): CorrectiveActionRecord[] {
  return complaints
    .filter(c => Boolean(c.root_cause_analysis) || c.status === 'resolved' || c.status === 'action_pending')
    .map(c => ({
      id: c.id,
      ticketCode: c.ticket_code,
      title: c.title || `شكوى ${c.ticket_code}`,
      complainantName: c.complainant_name,
      category: c.category,
      priority: c.priority,
      status: c.status,
      rootCauseAnalysis: c.root_cause_analysis || 'قيد التحليل وتحديد السبب الجذري',
      correctiveAction: c.corrective_action || 'بانتظار اعتماد الإجراء التصحيحي من إدارة الجودة',
      preventativeAction: c.preventative_action || 'توثيق الإجراء الوقائي في دليل المعايير التشغيلية',
      responsibleDepartmentId: c.responsible_department_id,
      assignedResolverNameAr: c.assigned_resolver?.full_name_ar,
      assignedResolverNameEn: c.assigned_resolver?.full_name_en,
      resolvedAt: c.resolved_at,
      createdAt: c.created_at
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Main Aggregator for Quality Management & SLA Monitoring Center.
 */
export function getQualityDashboardData(timeRange: TimeRangeFilter = 'all'): QualityDashboardData {
  const slaConfigs = bctStore.getSLAConfigs();
  const tasks = bctStore.getTasks();
  const complaints = bctStore.getComplaints();
  const handoffs = bctStore.getHandoffs();
  const payments = bctStore.getPayments();
  const files = bctStore.getStudentFiles();
  const activities = bctStore.getAllFileActivities();

  // 1. Calculate SLA metrics
  const slaMetrics = calculateSLAMetrics(
    slaConfigs,
    tasks,
    complaints,
    handoffs,
    payments,
    files,
    activities,
    timeRange
  );

  // 2. Aggregate totals across the 6 departmental indicators
  const totalEligibleCompleted = slaMetrics.reduce((sum, m) => sum + m.completedCount, 0);
  const totalOnTime = slaMetrics.reduce((sum, m) => sum + m.onTimeCount, 0);
  const totalBreached = slaMetrics.reduce((sum, m) => sum + m.breachedCount, 0);
  const totalPending = slaMetrics.reduce((sum, m) => sum + m.pendingCount, 0);

  // 3. Mathematically sound composite Operational Quality Score
  // Volume-weighted formula: (Total On-Time Transactions / Total Eligible Completed Transactions) * 100
  let overallQualityScore = 100.0;
  if (totalEligibleCompleted > 0) {
    overallQualityScore = Math.round((totalOnTime / totalEligibleCompleted) * 1000) / 10;
  } else if (totalBreached > 0) {
    overallQualityScore = 0.0;
  }

  // 4. Stagnant file alerts (> 7 days inactive)
  const stagnantFiles = calculateStagnantFiles(files, activities);

  // 5. Corrective actions database
  const correctiveActions = extractCorrectiveActions(complaints);

  return {
    overallQualityScore,
    totalEligibleCompleted,
    totalOnTime,
    totalBreached,
    totalPending,
    slaMetrics,
    stagnantFiles,
    correctiveActions,
    calculationTimestamp: new Date().toISOString()
  };
}
