import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  getQualityDashboardData,
  TimeRangeFilter,
  SLAMetricDetail,
  StagnantFileAlert,
  CorrectiveActionRecord
} from '../services/qualityCalculationService';
import { DepartmentId } from '../types/database.types';
import {
  ShieldCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  BarChart2,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  XCircle,
  PlusCircle,
  X,
  Send,
  Building2,
  ArrowUpRight,
  ShieldAlert,
  Lock
} from 'lucide-react';

export const QualityCenter: React.FC = () => {
  const { isRtl, language } = useLanguage();
  const { currentEmployee, hasPermission, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Permission Checks
  const canView = hasPermission('quality:view') || hasPermission('complaints:view') || isSuperAdmin;
  const canManage = hasPermission('quality:manage') || hasPermission('complaints:approve') || isSuperAdmin;

  // Time range filter
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');

  // Search & Filter states for Corrective Actions
  const [caSearchTerm, setCaSearchTerm] = useState('');
  const [caStatusFilter, setCaStatusFilter] = useState<'all' | 'resolved' | 'action_pending' | 'investigating'>('all');

  // Reactive state from Quality Calculation Service
  const [dashboardData, setDashboardData] = useState(() => getQualityDashboardData('all'));

  // Notification / Toast state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Escalation Modal State
  const [escalationTargetFile, setEscalationTargetFile] = useState<StagnantFileAlert | null>(null);
  const [escalationDept, setEscalationDept] = useState<DepartmentId>('ops');
  const [escalationAssignee, setEscalationAssignee] = useState<string>('emp-002');
  const [escalationReason, setEscalationReason] = useState<string>('');
  const [escalationPriority, setEscalationPriority] = useState<'high' | 'urgent'>('urgent');

  // New Corrective Action Modal State
  const [isCaModalOpen, setIsCaModalOpen] = useState(false);
  const [caSelectedTicketId, setCaSelectedTicketId] = useState('');
  const [caRootCause, setCaRootCause] = useState('');
  const [caCorrectiveAction, setCaCorrectiveAction] = useState('');
  const [caPreventativeAction, setCaPreventativeAction] = useState('');
  const [caNewStatus, setCaNewStatus] = useState<'resolved' | 'action_pending'>('resolved');

  // Available employees for escalation assignment
  const employees = useMemo(() => bctStore.getEmployees(), []);
  const complaints = useMemo(() => bctStore.getComplaints(), []);

  // Sync with bctStore changes in real time
  useEffect(() => {
    const refreshData = () => {
      setDashboardData(getQualityDashboardData(timeRange));
    };

    refreshData();
    const unsubscribe = bctStore.subscribe(refreshData);
    return unsubscribe;
  }, [timeRange]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Escalation Submission
  const handleConfirmEscalation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationTargetFile) return;

    const actorUsername = currentEmployee?.username || 'admin';
    const reasonTextAr = escalationReason.trim() || `تصعيد عاجل لركود الملف لمدة ${escalationTargetFile.daysInactive} يوماً في مرحلة ${escalationTargetFile.stageNameAr}`;
    const reasonTextEn = `Urgent escalation for ${escalationTargetFile.daysInactive} days inactivity at stage ${escalationTargetFile.stageNameEn}`;

    const res = bctStore.escalateStagnantFile(
      escalationTargetFile.file.id,
      {
        targetDepartmentId: escalationDept,
        targetAssigneeId: escalationAssignee,
        reasonAr: reasonTextAr,
        reasonEn: reasonTextEn,
        priority: escalationPriority
      },
      actorUsername
    );

    if (res.success) {
      showToast(isRtl ? 'تم تصعيد الملف بنجاح وتوجيه مهمة عاجلة للمسؤول' : 'File escalated successfully with urgent task dispatched.');
      setEscalationTargetFile(null);
      setEscalationReason('');
    } else {
      showToast(res.message || (isRtl ? 'تعذر تصعيد الملف' : 'Failed to escalate file'), 'error');
    }
  };

  // Handle Corrective Action Submission
  const handleSaveCorrectiveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caSelectedTicketId || !caRootCause.trim() || !caCorrectiveAction.trim()) {
      showToast(isRtl ? 'يرجى ملء جميع الحقول الإلزامية' : 'Please fill all required fields', 'error');
      return;
    }

    const actorUsername = currentEmployee?.username || 'admin';
    const success = bctStore.updateComplaintCorrectiveAction(
      caSelectedTicketId,
      {
        rootCause: caRootCause.trim(),
        correctiveAction: caCorrectiveAction.trim(),
        preventativeAction: caPreventativeAction.trim() || undefined,
        status: caNewStatus
      },
      actorUsername
    );

    if (success) {
      showToast(isRtl ? 'تم حفظ وتوثيق الإجراء التصحيحي والوقائي بنجاح' : 'Corrective action saved and audit-logged successfully.');
      setIsCaModalOpen(false);
      setCaSelectedTicketId('');
      setCaRootCause('');
      setCaCorrectiveAction('');
      setCaPreventativeAction('');
    } else {
      showToast(isRtl ? 'تعذر حفظ الإجراء التصحيحي' : 'Failed to save corrective action', 'error');
    }
  };

  // Filtered Corrective Actions list
  const filteredCorrectiveActions = useMemo(() => {
    return dashboardData.correctiveActions.filter(ca => {
      const matchesSearch =
        caSearchTerm === '' ||
        ca.ticketCode.toLowerCase().includes(caSearchTerm.toLowerCase()) ||
        ca.complainantName.toLowerCase().includes(caSearchTerm.toLowerCase()) ||
        ca.title.toLowerCase().includes(caSearchTerm.toLowerCase()) ||
        ca.rootCauseAnalysis.toLowerCase().includes(caSearchTerm.toLowerCase());

      const matchesStatus =
        caStatusFilter === 'all' ||
        (caStatusFilter === 'resolved' && (ca.status === 'resolved' || ca.status === 'closed')) ||
        (caStatusFilter === 'action_pending' && ca.status === 'action_pending') ||
        (caStatusFilter === 'investigating' && ca.status === 'investigating');

      return matchesSearch && matchesStatus;
    });
  }, [dashboardData.correctiveActions, caSearchTerm, caStatusFilter]);

  // If user lacks permission to view Quality Center
  if (!canView) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {isRtl ? 'غير مصرح بالوصول إلى مركز إدارة الجودة' : 'Access Denied: Quality Assurance Center'}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {isRtl
            ? 'تتطلب هذه الصفحة صلاحيات إدارة الجودة ومراقبة اتفاقيات مستوى الخدمة (quality:view أو complaints:view).'
            : 'You lack required permissions (quality:view or complaints:view) to view operational quality metrics.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 ${
            isRtl ? 'left-6' : 'right-6'
          } z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-bct-navy via-bct-navy-dark to-[#0B2538] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/10 rounded text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isRtl ? 'إدارة الجودة والحوكمة المؤسسية' : 'Quality Assurance & Governance'}
              </span>
              <span className="text-xs text-blue-300">
                {isRtl ? 'نظام الرصد الحي لاتفاقيات الخدمة (SLA)' : 'Live SLA Monitoring Engine'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              {isRtl
                ? 'مركز إدارة الجودة ومراقبة اتفاقيات مستوى الخدمة (SLA)'
                : 'Quality Assurance & SLA Compliance Monitoring Center'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isRtl
                ? 'رصد انحرافات الأداء التشغيلي، تتبع الملفات الراكدة لأكثر من 7 أيام، والتحليل الجذري الموثق للأخطاء وفق المعايير المعتمدة.'
                : 'Real-time monitoring of operational SLA adherence, 7-day inactivity red alerts, and audit-verified root cause analytics.'}
            </p>
          </div>

          {/* Overall Operational Quality Index */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl">
            <div className="text-center sm:text-right rtl:sm:text-right ltr:sm:text-left">
              <span className="text-[11px] text-blue-200 block font-semibold">
                {isRtl ? 'معدل جودة العمليات الإجمالي' : 'Overall Operational Quality'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 justify-center sm:justify-start">
                <span className="text-3xl font-extrabold text-white">
                  {dashboardData.overallQualityScore}%
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  {dashboardData.totalEligibleCompleted > 0
                    ? `(${dashboardData.totalOnTime}/${dashboardData.totalEligibleCompleted})`
                    : (isRtl ? '(لا توجد معاملات منتهية)' : '(Zero completed)')}
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/20 hidden sm:block mx-1" />

            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="bg-emerald-500/20 border border-emerald-400/30 px-2 py-1.5 rounded-lg text-emerald-200 font-bold">
                <div className="text-xs font-extrabold text-white">{dashboardData.totalOnTime}</div>
                <div>{isRtl ? 'ضمن المهلة' : 'On-Time'}</div>
              </div>
              <div className="bg-rose-500/20 border border-rose-400/30 px-2 py-1.5 rounded-lg text-rose-200 font-bold">
                <div className="text-xs font-extrabold text-white">{dashboardData.totalBreached}</div>
                <div>{isRtl ? 'المتجاوز' : 'Breached'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 mt-5 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200 font-semibold">{isRtl ? 'الفترة الزمنية:' : 'Time Period:'}</span>
            <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs">
              {(['all', 'today', '7days', '30days'] as TimeRangeFilter[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    timeRange === t ? 'bg-white text-bct-navy shadow-sm' : 'text-blue-200 hover:text-white'
                  }`}
                >
                  {t === 'all' && (isRtl ? 'الكل' : 'All')}
                  {t === 'today' && (isRtl ? 'اليوم' : 'Today')}
                  {t === '7days' && (isRtl ? 'آخر 7 أيام' : 'Last 7 Days')}
                  {t === '30days' && (isRtl ? 'آخر 30 يوماً' : 'Last 30 Days')}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-blue-300 hidden md:block">
            {isRtl ? 'تحديث حي ومباشر عبر قاعدة البيانات المركزية' : 'Live synced with central database ledger'}
          </div>
        </div>
      </div>

      {/* SLA Benchmarks Section (The 6 Indicators) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-bct-navy" />
              {isRtl ? 'مؤشرات التزام الأقسام باتفاقيات مستوى الخدمة (SLAs)' : 'Departmental SLA Compliance Benchmarks'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRtl
                ? 'احتساب ديناميكي مبني على المعادلة: (المعاملات المنجزة ضمن المهلة ÷ إجمالي المعاملات المكتملة المؤهلة) × 100'
                : 'Formula: (Transactions completed within SLA ÷ Total eligible completed transactions) × 100'}
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg self-start sm:self-auto">
            {isRtl ? '6 مؤشرات معتمدة' : '6 Verified Indicators'}
          </span>
        </div>

        {/* 6 SLA Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.slaMetrics.map((sla, idx) => {
            const isHighCompliance = sla.complianceRate >= 95;
            const isModerateCompliance = sla.complianceRate >= 80;

            const badgeBg = isHighCompliance
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isModerateCompliance
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

            const progressBarColor = isHighCompliance
              ? 'bg-emerald-500'
              : isModerateCompliance
              ? 'bg-amber-500'
              : 'bg-rose-500';

            return (
              <div
                key={sla.code}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {isRtl ? sla.departmentNameAr : sla.departmentNameEn}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {idx + 1}. {isRtl ? sla.nameAr : sla.nameEn}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${badgeBg} shadow-xs whitespace-nowrap`}
                    >
                      {sla.complianceRate}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {isRtl ? sla.descriptionAr : sla.descriptionEn}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>{isRtl ? 'المهلة القصوى:' : 'SLA Limit:'}</span>
                    <span className="font-bold text-bct-navy">
                      {isRtl ? sla.targetLimitAr : sla.targetLimitEn}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, sla.complianceRate))}%` }}
                    />
                  </div>
                </div>

                {/* Granular Counts Breakdown */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200 text-center text-[10px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block">{isRtl ? 'المكتمل' : 'Done'}</span>
                    <span className="font-bold text-slate-800 text-xs">{sla.completedCount}</span>
                  </div>
                  <div className="bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 block">{isRtl ? 'بالمهلة' : 'On-Time'}</span>
                    <span className="font-bold text-emerald-800 text-xs">{sla.onTimeCount}</span>
                  </div>
                  <div className="bg-rose-50/60 p-1.5 rounded-lg border border-rose-100">
                    <span className="text-rose-700 block">{isRtl ? 'متجاوز' : 'Breached'}</span>
                    <span className="font-bold text-rose-800 text-xs">{sla.breachedCount}</span>
                  </div>
                  <div className="bg-blue-50/60 p-1.5 rounded-lg border border-blue-100">
                    <span className="text-blue-700 block">{isRtl ? 'جارٍ' : 'Pending'}</span>
                    <span className="font-bold text-blue-800 text-xs">{sla.pendingCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inactivity Red Alerts (> 7 Days Inactive) Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-base">
                  {isRtl ? 'إنذارات الركود الأحمر (ملفات بلا تحديث > 7 أيام)' : '7-Day Inactivity Red Alerts'}
                </h3>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-extrabold rounded-md text-xs">
                  {dashboardData.stagnantFiles.length} {isRtl ? 'ملفات حرجة' : 'Critical Files'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'ملفات تشغيلية نشطة تتطلب تدخلاً عاجلاً من مديري الأقسام. (يتم استبعاد الملفات المغلقة والمؤرشفة تلقائياً)'
                  : 'Active operational files requiring supervisor escalation. Closed and archived files are strictly excluded.'}
              </p>
            </div>
          </div>
        </div>

        {dashboardData.stagnantFiles.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm">
              {isRtl ? 'ممتاز! لا توجد حالياً أي ملفات راكدة تتجاوز معيار الـ 7 أيام.' : 'Excellent! Zero stagnant files exceeding 7 days.'}
            </h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              {isRtl
                ? 'جميع الملفات التشغيلية النشطة تم تحديثها مؤخراً أو تتبع مهلها الزمنية المعتمدة بصورة منتظمة.'
                : 'All active operational files are actively being serviced within designated SLA time limits.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-3 px-4">{isRtl ? 'رمز الملف' : 'File Code'}</th>
                  <th className="py-3 px-4">{isRtl ? 'اسم الطالب' : 'Student Name'}</th>
                  <th className="py-3 px-4">{isRtl ? 'المرحلة الحالية' : 'Current Stage'}</th>
                  <th className="py-3 px-4">{isRtl ? 'المسؤول الحالي' : 'Assigned Owner'}</th>
                  <th className="py-3 px-4">{isRtl ? 'مدة الركود' : 'Inactivity'}</th>
                  <th className="py-3 px-4">{isRtl ? 'آخر نشاط موثق' : 'Last Activity'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الإجراء التشغيلي' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.stagnantFiles.map(alert => (
                  <tr key={alert.file.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-bct-navy">
                      <button
                        onClick={() => navigate(`/students/${alert.fileCode}`)}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                        title={isRtl ? `عرض ملف المعاملة ${alert.fileCode}` : `View Dossier ${alert.fileCode}`}
                      >
                        {alert.fileCode}
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {isRtl ? alert.studentNameAr : alert.studentNameEn}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${alert.stageBadgeBg} ${alert.stageBadgeColor} border border-slate-200/60`}
                      >
                        <span className="font-bold">{alert.stageNumber}</span>
                        <span>{isRtl ? alert.stageNameAr : alert.stageNameEn}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isRtl ? alert.ownerNameAr : alert.ownerNameEn}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          alert.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.daysInactive} {isRtl ? 'يوماً' : 'days'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(alert.lastActivityDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setEscalationTargetFile(alert);
                          setEscalationReason(
                            isRtl
                              ? `ركود تشغيلي للملف ${alert.fileCode} في مرحلة ${alert.stageNameAr} لمدة ${alert.daysInactive} يوماً`
                              : `Operational stagnation of ${alert.fileCode} at stage ${alert.stageNameEn} for ${alert.daysInactive} days`
                          );
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1 mx-auto"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تصعيد للإدارة' : 'Escalate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Root-Cause & Preventative Actions Database Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-bct-navy" />
              {isRtl ? 'قاعدة بيانات التحليل الجذري والإجراءات التصحيحية المعتمدة' : 'Root Cause & Corrective Actions Database'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isRtl
                ? 'سجل التوثيق المؤسسي للأسباب الجذرية، الحلول المعتمدة، والإجراءات الوقائية لمنع تكرار الانحرافات'
                : 'Enterprise repository of verified root cause investigations and approved preventative actions'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManage && (
              <button
                onClick={() => setIsCaModalOpen(true)}
                className="px-3 py-1.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isRtl ? 'توثيق إجراء تصحيحي جديد' : 'Record Corrective Action'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={caSearchTerm}
              onChange={e => setCaSearchTerm(e.target.value)}
              placeholder={isRtl ? 'بحث برمز التذكرة، الشاكي، أو السبب الجذري...' : 'Search by ticket, complainant, or root cause...'}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bct-navy"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">{isRtl ? 'الحالة:' : 'Status:'}</span>
            <select
              value={caStatusFilter}
              onChange={e => setCaStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-bct-navy"
            >
              <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="resolved">{isRtl ? 'تمت المعالجة والإغلاق' : 'Resolved & Closed'}</option>
              <option value="action_pending">{isRtl ? 'إجراء معلق' : 'Action Pending'}</option>
              <option value="investigating">{isRtl ? 'قيد التحقيق' : 'Investigating'}</option>
            </select>
          </div>
        </div>

        {/* Corrective Actions Cards List */}
        <div className="space-y-3">
          {filteredCorrectiveActions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold">
              {isRtl
                ? 'لا توجد سجلات مطابقة لمعايير البحث في قاعدة بيانات التحليل الجذري.'
                : 'No matching records in the Root Cause & Corrective Actions log.'}
            </div>
          ) : (
            filteredCorrectiveActions.map(ca => {
              const isResolved = ca.status === 'resolved' || ca.status === 'closed';

              return (
                <div
                  key={ca.id}
                  className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-xs space-y-3 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-bct-navy text-xs">{ca.ticketCode}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-slate-800">{ca.title}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{ca.complainantName}</span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          isResolved
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border border-amber-200'
                        }`}
                      >
                        {isResolved
                          ? (isRtl ? 'تمت المعالجة والإغلاق' : 'Resolved & Closed')
                          : (isRtl ? 'إجراء تصحيحي معلق' : 'Action Pending')}
                      </span>

                      {ca.resolvedAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(ca.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Two Cards: Root Cause & Corrective Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
                    <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        {isRtl ? 'السبب الجذري الموثق:' : 'Root Cause Analysis:'}
                      </span>
                      <p className="text-slate-700 leading-relaxed">{ca.rootCauseAnalysis}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200/80 space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {isRtl ? 'الإجراء التصحيحي والوقائي المعتمد:' : 'Corrective & Preventative Action:'}
                      </span>
                      <p className="text-slate-700 leading-relaxed">{ca.correctiveAction}</p>
                      {ca.preventativeAction && (
                        <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {isRtl ? 'الإجراء الوقائي طويل الأمد: ' : 'Preventative Measure: '}
                          </span>
                          {ca.preventativeAction}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      {isRtl ? 'المحقق المسؤول:' : 'Resolver:'}{' '}
                      <strong className="text-slate-600">
                        {isRtl ? ca.assignedResolverNameAr || 'مسؤول الجودة' : ca.assignedResolverNameEn || 'QA Officer'}
                      </strong>
                    </span>

                    <span>
                      {isRtl ? 'تاريخ القيد:' : 'Created:'} {new Date(ca.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Escalation Modal */}
      {escalationTargetFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">
                  {isRtl ? 'تصعيد رقابي للملف الراكد' : 'Escalate Stagnant Student File'}
                </h3>
              </div>
              <button
                onClick={() => setEscalationTargetFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmEscalation} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'رمز الملف:' : 'File Code:'}</span>
                  <strong className="font-mono text-bct-navy">{escalationTargetFile.fileCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'اسم الطالب:' : 'Student Name:'}</span>
                  <strong>{isRtl ? escalationTargetFile.studentNameAr : escalationTargetFile.studentNameEn}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'المرحلة التشغيلية:' : 'Lifecycle Stage:'}</span>
                  <span className="font-semibold text-amber-700">
                    {escalationTargetFile.stageNumber} {isRtl ? escalationTargetFile.stageNameAr : escalationTargetFile.stageNameEn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'مدة الركود الحالية:' : 'Days Inactive:'}</span>
                  <span className="font-extrabold text-rose-700">{escalationTargetFile.daysInactive} {isRtl ? 'يوماً' : 'days'}</span>
                </div>
              </div>

              {/* Department & Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'القسم الموجه إليه التصعيد:' : 'Target Department:'}
                  </label>
                  <select
                    value={escalationDept}
                    onChange={e => setEscalationDept(e.target.value as DepartmentId)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  >
                    <option value="ops">{isRtl ? 'إدارة العمليات والخدمات' : 'Operations'}</option>
                    <option value="gm">{isRtl ? 'الإدارة العامة' : 'General Management'}</option>
                    <option value="cs">{isRtl ? 'إدارة المستشارين' : 'Consultants'}</option>
                    <option value="qa">{isRtl ? 'إدارة الجودة والحوكمة' : 'Quality Assurance'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'المشرف المسؤول:' : 'Assignee:'}
                  </label>
                  <select
                    value={escalationAssignee}
                    onChange={e => setEscalationAssignee(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {isRtl ? emp.full_name_ar : emp.full_name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'درجة الأولوية:' : 'Priority:'}
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="escalationPriority"
                      checked={escalationPriority === 'urgent'}
                      onChange={() => setEscalationPriority('urgent')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-bold text-rose-700">{isRtl ? 'عاجل جداً (24 ساعة)' : 'Urgent (24h)'}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="escalationPriority"
                      checked={escalationPriority === 'high'}
                      onChange={() => setEscalationPriority('high')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-amber-700">{isRtl ? 'أولوية قصوى' : 'High Priority'}</span>
                  </label>
                </div>
              </div>

              {/* Reason */}
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'مبرر وتوجيهات التصعيد الرقابي:' : 'Escalation Directives & Notes:'}
                </label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={e => setEscalationReason(e.target.value)}
                  placeholder={isRtl ? 'اكتب التوجيه الإداري لحل الركود فوراً...' : 'Specify corrective directives for supervisor...'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEscalationTargetFile(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تأكيد وإرسال التصعيد' : 'Confirm & Dispatch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Corrective Action Modal */}
      {isCaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-bct-navy">
                <FileText className="w-5 h-5 text-bct-navy" />
                <h3 className="font-bold text-base">
                  {isRtl ? 'توثيق تحليل جذري وإجراء تصحيحي' : 'Document Root Cause & Corrective Action'}
                </h3>
              </div>
              <button
                onClick={() => setIsCaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrectiveAction} className="p-6 space-y-4 text-xs">
              {/* Select Complaint / Ticket */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'تذكرة الشكوى أو الواقعة الرقابية:' : 'Complaint / Incident Ticket:'}
                </label>
                <select
                  value={caSelectedTicketId}
                  onChange={e => setCaSelectedTicketId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  required
                >
                  <option value="">{isRtl ? '-- اختر التذكرة --' : '-- Select Ticket --'}</option>
                  {complaints.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.ticket_code} - {c.complainant_name} ({c.title || c.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Root cause */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'السبب الجذري للانحراف (Root Cause):' : 'Root Cause Analysis:'}
                </label>
                <textarea
                  rows={2}
                  value={caRootCause}
                  onChange={e => setCaRootCause(e.target.value)}
                  placeholder={isRtl ? 'ما هو السبب الحقيقي لظهور المشكلة أو التأخير؟' : 'Underlying reason for failure or delay...'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  required
                />
              </div>

              {/* Corrective action */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'الإجراء التصحيحي الفوري (Corrective Action):' : 'Immediate Corrective Action:'}
                </label>
                <textarea
                  rows={2}
                  value={caCorrectiveAction}
                  onChange={e => setCaCorrectiveAction(e.target.value)}
                  placeholder={isRtl ? 'ما هو الإجراء الذي تم تنفيذه لعلاج الواقعة الحالية؟' : 'Action taken to resolve current incident...'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                  required
                />
              </div>

              {/* Preventative action */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'الإجراء الوقائي طويل الأمد (Preventative Measure):' : 'Long-term Preventative Measure:'}
                </label>
                <textarea
                  rows={2}
                  value={caPreventativeAction}
                  onChange={e => setCaPreventativeAction(e.target.value)}
                  placeholder={isRtl ? 'تحديث أدلة العمل، إضافة تدريب، أو تعديل إعدادات SLA...' : 'Systemic fix to prevent recurrence...'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'حالة التذكرة بعد المعالجة:' : 'Resolution Status:'}
                </label>
                <select
                  value={caNewStatus}
                  onChange={e => setCaNewStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-bct-navy focus:outline-none"
                >
                  <option value="resolved">{isRtl ? 'معالجة وإغلاق التذكرة (Resolved & Closed)' : 'Resolved & Closed'}</option>
                  <option value="action_pending">{isRtl ? 'إجراء معلق بانتظار استكمال التحقق (Action Pending)' : 'Action Pending'}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCaModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  {isRtl ? 'حفظ وتوثيق الإجراء' : 'Save & Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
