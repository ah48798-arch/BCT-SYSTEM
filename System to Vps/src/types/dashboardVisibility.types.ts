/**
 * Centralized Definitions for Dashboard & Report Visibility Governance
 * Covers all actual existing elements in General Dashboard and Executive Dashboard.
 */

export type DashboardType = 'general' | 'executive';

export interface DashboardElementDefinition {
  id: string;
  code: string;
  dashboard: DashboardType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryAr: string;
  categoryEn: string;
  defaultRoles: string[];
  isSensitiveFinance?: boolean;
}

export type DashboardWidgetDefinition = DashboardElementDefinition;

export const GENERAL_DASHBOARD_ELEMENTS: DashboardElementDefinition[] = [
  {
    id: 'dash:general:active_files',
    code: 'DASH-GEN-01',
    dashboard: 'general',
    nameAr: 'الملفات قيد المتابعة',
    nameEn: 'Active Files Under Follow-up',
    descriptionAr: 'بطاقة إجمالي الملفات النشطة قيد المعالجة في مسار القبول (المراحل 1 - 9) مع استبعاد الأرشيف.',
    descriptionEn: 'Active pipeline student files (stages 1-9) excluding archived and closed files.',
    categoryAr: 'مؤشرات الأداء الأساسية (KPIs)',
    categoryEn: 'Core KPIs',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'apply_off', 'cert_off', 'follow_off', 'liaison', 'cs_lead', 'cs_specialist', 'qa_officer']
  },
  {
    id: 'dash:general:net_collections',
    code: 'DASH-GEN-02',
    dashboard: 'general',
    nameAr: 'صافي التحصيلات بعد المصروفات',
    nameEn: 'Net Collections After OpEx',
    descriptionAr: 'بطاقة الإيرادات المؤكدة مطروحاً منها المصروفات التشغيلية المعتمدة مع رصيد الخزائن بالجنيه والدولار.',
    descriptionEn: 'Confirmed inflow minus approved OpEx with cash balances in EGP and USD.',
    categoryAr: 'مؤشرات الأداء الأساسية (KPIs)',
    categoryEn: 'Core KPIs',
    isSensitiveFinance: true,
    defaultRoles: ['gm', 'sys_admin', 'fin_mgr', 'accountant']
  },
  {
    id: 'dash:general:pending_tasks',
    code: 'DASH-GEN-03',
    dashboard: 'general',
    nameAr: 'المهام المعلقة ومناطق التسليم',
    nameEn: 'Pending Operational Tasks',
    descriptionAr: 'بطاقة حصر المهام التشغيلية المفتوحة وقيد المراجعة والمهام المتأخرة عن الموعد المحدد.',
    descriptionEn: 'Count of open, in-review, and overdue operational tasks and handoffs.',
    categoryAr: 'مؤشرات الأداء الأساسية (KPIs)',
    categoryEn: 'Core KPIs',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'fin_mgr', 'cs_lead', 'mkt_mgr', 'qa_officer', 'doc_verifier']
  },
  {
    id: 'dash:general:quality_complaints',
    code: 'DASH-GEN-04',
    dashboard: 'general',
    nameAr: 'مؤشر الجودة والشكاوى',
    nameEn: 'Quality & Grievance Index',
    descriptionAr: 'بطاقة تذاكر الشكاوى المفتوحة ومعدل الامتثال للائحة الـ 3 أيام لحل المشكلات.',
    descriptionEn: 'Open grievance tickets and SLA 3-day resolution compliance rate.',
    categoryAr: 'مؤشرات الأداء الأساسية (KPIs)',
    categoryEn: 'Core KPIs',
    defaultRoles: ['gm', 'sys_admin', 'qa_officer', 'cs_lead', 'ops_mgr']
  },
  {
    id: 'dash:general:stage_pipeline',
    code: 'DASH-GEN-05',
    dashboard: 'general',
    nameAr: 'توزيع الملفات حسب مسار العمليات (10 مراحل)',
    nameEn: '10-Stage Lifecycle Pipeline Distribution',
    descriptionAr: 'لوحة البطاقات التفاعلية لتوزيع جميع ملفات الطلاب النشطة عبر المراحل العشر وتصفيتها بنقرة واحدة.',
    descriptionEn: 'Interactive distribution cards across 10 lifecycle stages with one-click filtering.',
    categoryAr: 'مسار العمليات التشغيلية',
    categoryEn: 'Operational Lifecycle',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'apply_off', 'cert_off', 'follow_off', 'liaison', 'cs_lead', 'qa_officer']
  },
  {
    id: 'dash:general:recent_active_files',
    code: 'DASH-GEN-06',
    dashboard: 'general',
    nameAr: 'أحدث ملفات الطلب النشطة',
    nameEn: 'Recent Active Student Files',
    descriptionAr: 'قائمة أحدث ملفات الطلاب المحدثة مع أسماء الطلاب، المراحل، ونوع الشهادة ومسؤول الملف.',
    descriptionEn: 'List of recently modified student files with stage, certificate type, and owner.',
    categoryAr: 'القوائم التشغيلية الحية',
    categoryEn: 'Live Operational Feeds',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'apply_off', 'cert_off', 'follow_off', 'cs_lead']
  },
  {
    id: 'dash:general:immediate_tasks',
    code: 'DASH-GEN-07',
    dashboard: 'general',
    nameAr: 'المهام والتسليمات العاجلة',
    nameEn: 'Immediate Tasks & Handoffs',
    descriptionAr: 'قائمة المهام العاجلة المرتبة حسب الأولوية والمواعيد النهائية ومسؤول التسليم.',
    descriptionEn: 'Prioritized list of urgent tasks with deadlines and assignees.',
    categoryAr: 'القوائم التشغيلية الحية',
    categoryEn: 'Live Operational Feeds',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'fin_mgr', 'cs_lead', 'mkt_mgr', 'qa_officer']
  }
];

export const EXECUTIVE_DASHBOARD_ELEMENTS: DashboardElementDefinition[] = [
  {
    id: 'dash:exec:confirmed_collections',
    code: 'DASH-EXEC-01',
    dashboard: 'executive',
    nameAr: 'إجمالي التحصيلات المؤكدة',
    nameEn: 'Confirmed Collections',
    descriptionAr: 'المقبوضات المعتمدة بالخزائن والحسابات بالجنيه المصري والدولار وإجمالي الإيصالات المحصلة.',
    descriptionEn: 'Verified treasury and bank inflows in EGP and USD with confirmed receipts count.',
    categoryAr: 'مؤشرات القيادة المالية',
    categoryEn: 'Financial Leadership KPIs',
    isSensitiveFinance: true,
    defaultRoles: ['gm', 'sys_admin', 'fin_mgr', 'accountant']
  },
  {
    id: 'dash:exec:approved_expenses',
    code: 'DASH-EXEC-02',
    dashboard: 'executive',
    nameAr: 'المصروفات التشغيلية المعتمدة',
    nameEn: 'Approved OpEx',
    descriptionAr: 'الالتزامات التشغيلية المعتمدة للصرف وبنود النفقات الموثقة بالعملتين.',
    descriptionEn: 'Committed and approved expenditures with verified expense items.',
    categoryAr: 'مؤشرات القيادة المالية',
    categoryEn: 'Financial Leadership KPIs',
    isSensitiveFinance: true,
    defaultRoles: ['gm', 'sys_admin', 'fin_mgr']
  },
  {
    id: 'dash:exec:net_collections',
    code: 'DASH-EXEC-03',
    dashboard: 'executive',
    nameAr: 'صافي التحصيلات بعد المصروفات (الفائض/العجز)',
    nameEn: 'Net Collections After Expenses',
    descriptionAr: 'الفائض التشغيلي الإيجابي أو العجز وهامش الأرباح والرصيد النقدي الفعلي بالخزينة.',
    descriptionEn: 'Operating surplus/deficit, profit margin percentage, and net available cash.',
    categoryAr: 'مؤشرات القيادة المالية',
    categoryEn: 'Financial Leadership KPIs',
    isSensitiveFinance: true,
    defaultRoles: ['gm', 'sys_admin', 'fin_mgr']
  },
  {
    id: 'dash:exec:capacity_utilization',
    code: 'DASH-EXEC-04',
    dashboard: 'executive',
    nameAr: 'استغلال الطاقة الاستيعابية',
    nameEn: 'Capacity Utilization',
    descriptionAr: 'نسبة استغلال السقف المعتمد لمقاعد الجامعات والملفات الملتزم بها والطاقة المتاحة.',
    descriptionEn: 'Live capacity utilization rate against approved quota and available seats.',
    categoryAr: 'الرقابة التشغيلية والاستيعابية',
    categoryEn: 'Operational Capacity',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'mkt_mgr']
  },
  {
    id: 'dash:exec:conversion_rate',
    code: 'DASH-EXEC-05',
    dashboard: 'executive',
    nameAr: 'معدل التحويل (استفسار ← تسجيل)',
    nameEn: 'Lead Conversion Rate',
    descriptionAr: 'كفاءة قمع تحويل الاستفسارات الواردة إلى تسجيلات مؤهلة ومقارنتها بالمستهدف المؤسسي (≥ 25%).',
    descriptionEn: 'Funnel conversion rate from inquiries to qualified registrations vs 25% benchmark.',
    categoryAr: 'التسويق والأداء التجاري',
    categoryEn: 'Marketing & Growth',
    defaultRoles: ['gm', 'sys_admin', 'mkt_mgr', 'ops_mgr']
  },
  {
    id: 'dash:exec:sla_compliance',
    code: 'DASH-EXEC-06',
    dashboard: 'executive',
    nameAr: 'الالتزام باتفاقيات الخدمة (SLA)',
    nameEn: 'SLA Compliance Rate',
    descriptionAr: 'مؤشر جودة الالتزام بالمواعيد المحددة لإنجاز المهام وإغلاق الشكاوى والمهام المتأخرة.',
    descriptionEn: 'On-time task completion rate and grievance resolution compliance.',
    categoryAr: 'الحوكمة والجودة المؤسسية',
    categoryEn: 'Quality Governance',
    defaultRoles: ['gm', 'sys_admin', 'qa_officer', 'ops_mgr']
  },
  {
    id: 'dash:exec:emergency_reserve',
    code: 'DASH-EXEC-07',
    dashboard: 'executive',
    nameAr: 'صندوق الطوارئ واحتياطي السيولة المؤسسي',
    nameEn: 'Emergency Reserve & Financial Buffer',
    descriptionAr: 'رصيد صندوق الطوارئ (المستهدف: 450,000 ج.م) لتغطية مصاريف 3 أشهر ومساهمة التحصيلات.',
    descriptionEn: '3-month fixed OpEx reserve buffer tracking (Target: 450,000 EGP).',
    categoryAr: 'إدارة المخاطر والسيولة',
    categoryEn: 'Risk & Reserves',
    isSensitiveFinance: true,
    defaultRoles: ['gm', 'sys_admin', 'fin_mgr']
  },
  {
    id: 'dash:exec:stage_pipeline',
    code: 'DASH-EXEC-08',
    dashboard: 'executive',
    nameAr: 'توزيع الملفات النشطة عبر مسار العمليات (10 مراحل)',
    nameEn: 'Active Files across 10-Stage Pipeline',
    descriptionAr: 'العد اللحظي للملفات النشطة في المراحل العشر من استلام الطلب وحتى التخرج والتسليم.',
    descriptionEn: 'Live counts across stages 1 through 10 in the operational lifecycle.',
    categoryAr: 'الرقابة التشغيلية الشاملة',
    categoryEn: 'Operational Oversight',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'qa_officer']
  },
  {
    id: 'dash:exec:90day_roadmap',
    code: 'DASH-EXEC-09',
    dashboard: 'executive',
    nameAr: 'خطة الـ 90 يوماً المؤسسية',
    nameEn: '90-Day Master Roadmap',
    descriptionAr: 'متابعة إنجاز مراحل الخطة الاستراتيجية الثلاث (التأسيس، التدريب والضبط، التقييم والتحسين).',
    descriptionEn: 'Progress tracking for 3-phase strategic roadmap (Foundation, Training, Review).',
    categoryAr: 'التخطيط الاستراتيجي',
    categoryEn: 'Strategic Planning',
    defaultRoles: ['gm', 'sys_admin', 'ops_mgr', 'fin_mgr', 'qa_officer', 'mkt_mgr']
  },
  {
    id: 'dash:exec:marketing_gate',
    code: 'DASH-EXEC-10',
    dashboard: 'executive',
    nameAr: 'حملات التسويق وبوابة الطاقة',
    nameEn: 'Marketing & Capacity Gate',
    descriptionAr: 'حالة الحملات التسويقية وميزانياتها والاعتماد التشغيلي للبوابة لمنع الاختناق وتجاوز الطاقة.',
    descriptionEn: 'Active marketing campaigns, budgets, and operational capacity clearance.',
    categoryAr: 'التسويق وبوابة الطاقة',
    categoryEn: 'Marketing & Capacity Gate',
    defaultRoles: ['gm', 'sys_admin', 'mkt_mgr', 'ops_mgr']
  }
];

export const ALL_DASHBOARD_ELEMENTS: DashboardElementDefinition[] = [
  ...GENERAL_DASHBOARD_ELEMENTS,
  ...EXECUTIVE_DASHBOARD_ELEMENTS
];
