export type ReportCategory =
  | 'financial'
  | 'operational'
  | 'customer'
  | 'marketing'
  | 'quality'
  | 'executive';

export type ReportSensitivity = 'standard' | 'confidential' | 'restricted';

export interface SystemReportDefinition {
  id: string;
  code: string;
  departmentId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: ReportCategory;
  sensitivity: ReportSensitivity;
  defaultRoles: string[];
}

export const SYSTEM_REPORTS: SystemReportDefinition[] = [
  // --- 1. Finance & Administration (fin) ---
  {
    id: 'rep_fin_collections',
    code: 'FIN-01',
    departmentId: 'fin',
    nameAr: 'تقرير التحصيلات والإيرادات اليومية والشهرية',
    nameEn: 'Daily & Monthly Collections & Revenue Report',
    descriptionAr: 'كشف مفصل بجميع المبالغ المحصلة والعملات وحالات الإيصالات وسجل الدفعات المؤكدة.',
    descriptionEn: 'Detailed statement of collections, currencies, receipts status, and confirmed payments.',
    category: 'financial',
    sensitivity: 'confidential',
    defaultRoles: ['fin_mgr', 'accountant']
  },
  {
    id: 'rep_fin_expenses',
    code: 'FIN-02',
    departmentId: 'fin',
    nameAr: 'تقرير المصروفات التشغيلية والمشتريات',
    nameEn: 'Operational Expenses & Procurement Report',
    descriptionAr: 'بيان نفقات ومشتريات الأقسام، المصروفات الإدارية، وسندات الصرف المعتمدة.',
    descriptionEn: 'Itemized operational and departmental expenditures and approved payment vouchers.',
    category: 'financial',
    sensitivity: 'confidential',
    defaultRoles: ['fin_mgr']
  },
  {
    id: 'rep_fin_net_cash',
    code: 'FIN-03',
    departmentId: 'fin',
    nameAr: 'تقرير التدفقات النقدية وصافي الخزينة',
    nameEn: 'Cash Flow & Treasury Balance Report',
    descriptionAr: 'الموقف المالي للخزينة، الأرصدة البنكية، صافي التدفق، والتسويات النقدية.',
    descriptionEn: 'Treasury balances, bank reconciliations, net cash flow, and liquidity position.',
    category: 'financial',
    sensitivity: 'restricted',
    defaultRoles: ['fin_mgr']
  },
  {
    id: 'rep_fin_budgets',
    code: 'FIN-04',
    departmentId: 'fin',
    nameAr: 'تقرير الموازنات التقديرية ومصروفات الأقسام',
    nameEn: 'Departmental Budget Allocations Report',
    descriptionAr: 'متابعة الصرف الفعلي مقابل الميزانية المعتمدة لكل إدارة ونسب الانحراف.',
    descriptionEn: 'Actual spending against approved budgets per department and deviation ratios.',
    category: 'financial',
    sensitivity: 'confidential',
    defaultRoles: ['fin_mgr']
  },
  {
    id: 'rep_fin_incentives',
    code: 'FIN-05',
    departmentId: 'fin',
    nameAr: 'تقرير حوافز وعمولات الموظفين المعتمدة',
    nameEn: 'Approved Employee Incentives & Commission Report',
    descriptionAr: 'حساب حوافز مبيعات وتسجيل الملفات للمستشارين والمسؤولين وفق لائحة الحوافز.',
    descriptionEn: 'Commission and incentive calculations for student registrations and files.',
    category: 'financial',
    sensitivity: 'restricted',
    defaultRoles: ['fin_mgr']
  },
  {
    id: 'rep_fin_payroll',
    code: 'FIN-06',
    departmentId: 'fin',
    nameAr: 'تقرير مسيرات الرواتب والمستحقات الشهرية',
    nameEn: 'Monthly Payroll & HR Compensation Report',
    descriptionAr: 'مسيرات الرواتب، البدلات، الاستقطاعات، ومستحقات الموظفين الشهرية.',
    descriptionEn: 'Staff monthly payroll, allowances, deductions, and total compensations.',
    category: 'financial',
    sensitivity: 'restricted',
    defaultRoles: ['fin_mgr']
  },

  // --- 2. Operations & Services (ops) ---
  {
    id: 'rep_ops_pipeline',
    code: 'OPS-01',
    departmentId: 'ops',
    nameAr: 'تقرير مسار قبول الطلاب ومراحل التسجيل',
    nameEn: 'Admissions Pipeline & Stage Funnel Report',
    descriptionAr: 'توزيع ملفات الطلاب على مراحل دورة حياة الملف من الاستلام حتى القبول النهائي.',
    descriptionEn: 'Student file lifecycle distribution from intake to final university enrollment.',
    category: 'operational',
    sensitivity: 'standard',
    defaultRoles: ['ops_mgr', 'apply_off', 'cert_off', 'follow_off']
  },
  {
    id: 'rep_ops_sla',
    code: 'OPS-02',
    departmentId: 'ops',
    nameAr: 'تقرير الالتزام باتفاقيات مستوى الخدمة (SLA)',
    nameEn: 'File Processing SLA Compliance Report',
    descriptionAr: 'رصد الملفات المتأخرة، قياس سرعة التنفيذ، ومعدلات الالتزام بالمدد الزمنية للمراحل.',
    descriptionEn: 'Overdue file tracking, stage processing turnaround times, and SLA adherence rate.',
    category: 'operational',
    sensitivity: 'standard',
    defaultRoles: ['ops_mgr']
  },
  {
    id: 'rep_ops_archived',
    code: 'OPS-03',
    departmentId: 'ops',
    nameAr: 'تقرير الملفات المؤرشفة والمغلقة إدارياً',
    nameEn: 'Archived & Closed Files Ledger Report',
    descriptionAr: 'سجل الملفات المكتملة والمؤرشفة وتواريخ الإغلاق الرسمية وأسباب الأرشفة.',
    descriptionEn: 'Register of completed and archived files with official closing dates and reasons.',
    category: 'operational',
    sensitivity: 'standard',
    defaultRoles: ['ops_mgr']
  },
  {
    id: 'rep_ops_capacity',
    code: 'OPS-04',
    departmentId: 'ops',
    nameAr: 'تقرير الطاقة الاستيعابية وتوزيع المقاعد بالجامعات',
    nameEn: 'University Capacity & Seat Allocation Report',
    descriptionAr: 'نسب إشغال المقاعد بالجامعات الشريكة، الحدود القصوى، ومعدلات الإنجاز.',
    descriptionEn: 'Seat utilization across partner universities, admission caps, and fulfillment rates.',
    category: 'operational',
    sensitivity: 'confidential',
    defaultRoles: ['ops_mgr']
  },

  // --- 3. Consultants & Customer Service (cs) ---
  {
    id: 'rep_cs_consultations',
    code: 'CS-01',
    departmentId: 'cs',
    nameAr: 'تقرير الاستشارات وتوزيع الطلاب ومعدل التحويل',
    nameEn: 'Consultations Volume & Conversion Rate Report',
    descriptionAr: 'إحصائيات الجلسات الاستشارية، استجابة المستشارين، ومعدل تحويل الاستشارة إلى تسجيل.',
    descriptionEn: 'Consultation sessions, advisor activity, and conversion into registered applicants.',
    category: 'customer',
    sensitivity: 'standard',
    defaultRoles: ['cs_lead', 'consultant']
  },
  {
    id: 'rep_cs_inbox',
    code: 'CS-02',
    departmentId: 'cs',
    nameAr: 'تقرير سرعة الاستجابة للمحادثات والاستفسارات',
    nameEn: 'Chat Response Time & Inquiry Handling Report',
    descriptionAr: 'زمن أول استجابة على منصات التواصل والواتساب ومعدل إغلاق المحادثات اليومية.',
    descriptionEn: 'First response time across communication channels and closed chats volume.',
    category: 'customer',
    sensitivity: 'standard',
    defaultRoles: ['cs_lead', 'inbox', 'reception']
  },
  {
    id: 'rep_cs_lead_qualification',
    code: 'CS-03',
    departmentId: 'cs',
    nameAr: 'تقرير تأهيل وتصنيف الطلاب المحتملين',
    nameEn: 'Lead Qualification & Intake Quality Report',
    descriptionAr: 'تصنيف الطلاب المحتملين حسب الدول والتخصصات والجاهزية للتقديم الفعلي.',
    descriptionEn: 'Prospect scoring, regional/country distribution, and applicant readiness.',
    category: 'customer',
    sensitivity: 'standard',
    defaultRoles: ['cs_lead']
  },

  // --- 4. Marketing (mkt) ---
  {
    id: 'rep_mkt_campaigns',
    code: 'MKT-01',
    departmentId: 'mkt',
    nameAr: 'تقرير أداء الحملات التسويقية ومعدل العائد (ROI)',
    nameEn: 'Campaign Performance & ROI Analytics Report',
    descriptionAr: 'تكلفة الاستفسار، ميزانيات الإعلانات، النقرات، ومعدل العائد الاستثماري للحملات.',
    descriptionEn: 'Cost per lead, ad spend, impressions, CTR, and campaign return on investment.',
    category: 'marketing',
    sensitivity: 'confidential',
    defaultRoles: ['mkt_mgr', 'ads']
  },
  {
    id: 'rep_mkt_intake',
    code: 'MKT-02',
    departmentId: 'mkt',
    nameAr: 'تقرير قنوات الجذب ومصادر الاستفسارات',
    nameEn: 'Lead Generation Channels & Source Intake Report',
    descriptionAr: 'تحليل مصادر الطلاب (فيسبوك، تيك توك، جوجل، الإحالات، الزيارات المباشرة).',
    descriptionEn: 'Inbound channel attribution (Meta, Google, TikTok, Referrals, Direct visits).',
    category: 'marketing',
    sensitivity: 'standard',
    defaultRoles: ['mkt_mgr', 'content']
  },
  {
    id: 'rep_mkt_conversion',
    code: 'MKT-03',
    departmentId: 'mkt',
    nameAr: 'تقرير تحويل الحملات إلى عقود مسجلة',
    nameEn: 'Marketing Inquiries to Paid Enrollment Report',
    descriptionAr: 'تتبع الرحلة من أول تفاعل مع الإعلان حتى سداد أول دفعة مالية للملف.',
    descriptionEn: 'Attribution funnel tracking lead journey from ad engagement to paid invoice.',
    category: 'marketing',
    sensitivity: 'confidential',
    defaultRoles: ['mkt_mgr']
  },

  // --- 5. Quality & Systems (qa) ---
  {
    id: 'rep_qa_complaints',
    code: 'QA-01',
    departmentId: 'qa',
    nameAr: 'تقرير تذاكر الشكاوى وزمن الإغلاق والتحليل الجذري',
    nameEn: 'Complaints Resolution & Root Cause Report',
    descriptionAr: 'تصنيف الشكاوى الواردة، الإدارات المعنية، الالتزام بزمن الحل (3 أيام)، والإجراءات التصحيحية.',
    descriptionEn: 'Complaint categorization, departmental allocation, 3-day SLA compliance, and root-cause solutions.',
    category: 'quality',
    sensitivity: 'confidential',
    defaultRoles: ['qa_mgr']
  },
  {
    id: 'rep_qa_audit',
    code: 'QA-02',
    departmentId: 'qa',
    nameAr: 'تقرير سجل الحوكمة والاعتمادات الإدارية والرقابية',
    nameEn: 'Institutional Governance & Authorized Approvals Log Report',
    descriptionAr: 'سجل الاعتمادات الإدارية والرقابية المعتمدة وتتبع حوكمة العمليات وصلاحيات المسؤولين.',
    descriptionEn: 'Certified governance records, executive approvals, and cross-departmental authorization logs.',
    category: 'quality',
    sensitivity: 'restricted',
    defaultRoles: ['qa_mgr', 'gm']
  },
  {
    id: 'rep_qa_sla_violations',
    code: 'QA-03',
    departmentId: 'qa',
    nameAr: 'تقرير خروقات بوابات الجودة والتجاوزات الإدارية',
    nameEn: 'Quality Gate Violations & Escalations Report',
    descriptionAr: 'رصد حالات تجاوز بوابات الطاقة الاستيعابية، تأخر المراحل، وتنبيهات الإدارة العليا.',
    descriptionEn: 'Quality gate bypass attempts, stage deadline breaches, and executive escalations.',
    category: 'quality',
    sensitivity: 'restricted',
    defaultRoles: ['qa_mgr']
  },

  // --- 6. General Management (gm) ---
  {
    id: 'rep_gm_executive_summary',
    code: 'GM-01',
    departmentId: 'gm',
    nameAr: 'الملخص التنفيذي ومؤشرات الأداء الاستراتيجية',
    nameEn: 'Executive Master Summary & Strategic KPIs Report',
    descriptionAr: 'لوحة القيادة الاستراتيجية الموحدة للمدير العام: الإيرادات، الطلاب، التحويل، والجودة.',
    descriptionEn: 'Unified strategic cockpit for GM: total revenues, file counts, conversion, and health metrics.',
    category: 'executive',
    sensitivity: 'restricted',
    defaultRoles: ['gm']
  },
  {
    id: 'rep_gm_department_kpis',
    code: 'GM-02',
    departmentId: 'gm',
    nameAr: 'تقرير كفاءة الإدارات ومؤشرات الإنتاجية الشاملة',
    nameEn: 'Departmental Efficiency & Comprehensive Health Report',
    descriptionAr: 'مقارنة أداء الإدارات، سرعة المعالجة، معدلات الإنجاز، والالتزام المؤسسي.',
    descriptionEn: 'Comparative departmental performance, throughput velocity, and corporate compliance.',
    category: 'executive',
    sensitivity: 'restricted',
    defaultRoles: ['gm']
  }
];

export const REPORTS_BY_DEPARTMENT: Record<string, SystemReportDefinition[]> = SYSTEM_REPORTS.reduce(
  (acc, rep) => {
    if (!acc[rep.departmentId]) {
      acc[rep.departmentId] = [];
    }
    acc[rep.departmentId].push(rep);
    return acc;
  },
  {} as Record<string, SystemReportDefinition[]>
);

export type ReportTimePeriod = 'today' | '7_days' | '30_days' | 'month' | 'quarter' | 'all' | 'custom';

export interface ReportKPICard {
  id: string;
  titleAr: string;
  titleEn: string;
  value: string | number;
  formattedValue?: string;
  unitAr?: string;
  unitEn?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  status?: 'optimal' | 'warning' | 'critical' | 'info';
  icon?: string;
}

export interface ReportTableColumn {
  key: string;
  labelAr: string;
  labelEn: string;
  align?: 'left' | 'center' | 'right';
  isCurrency?: boolean;
  currency?: string;
  isDate?: boolean;
  isBadge?: boolean;
}

export interface ReportTableRow {
  id: string | number;
  [key: string]: any;
}

export interface ReportDistributionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  value: number;
  formattedValue?: string;
  percentage: number;
  color?: string;
}

export interface ReportExecutiveSummary {
  headlineAr: string;
  headlineEn: string;
  narrativeAr: string;
  narrativeEn: string;
  keyHighlightsAr: string[];
  keyHighlightsEn: string[];
  recommendationAr?: string;
  recommendationEn?: string;
}

export interface ReportSignaturesMeta {
  preparedBy: {
    nameAr: string;
    nameEn: string;
    titleAr: string;
    titleEn: string;
    employeeCode?: string;
  };
  departmentHead: {
    nameAr: string;
    nameEn: string;
    titleAr: string;
    titleEn: string;
    departmentNameAr: string;
    departmentNameEn: string;
  };
  generalManager: {
    nameAr: string;
    nameEn: string;
    titleAr: string;
    titleEn: string;
    employeeCode?: string;
  };
}

export interface StandardReportPayload {
  reportId: string;
  reportCode: string;
  departmentId: string;
  period: ReportTimePeriod;
  periodLabelAr: string;
  periodLabelEn: string;
  generatedAt: string;
  generatedBy: string;
  referenceNumber: string;
  kpiCards: ReportKPICard[];
  distribution?: {
    titleAr: string;
    titleEn: string;
    items: ReportDistributionItem[];
  };
  table?: {
    titleAr: string;
    titleEn: string;
    columns: ReportTableColumn[];
    rows: ReportTableRow[];
    totalCount: number;
  };
  executiveSummary?: ReportExecutiveSummary;
  signatures?: ReportSignaturesMeta;
}
