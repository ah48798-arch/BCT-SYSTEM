import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { bctStore } from '../services/store';
import { 
  StudentFile, 
  Task, 
  Complaint, 
  PaymentRecord, 
  ExpenseRecord, 
  FinancialAccount,
  ExchangeRate,
  LIFECYCLE_STAGE_DEFINITIONS 
} from '../types/database.types';
import { 
  calculateFinancialSummary, 
  EMPTY_FINANCIAL_SUMMARY,
  DateRangeBounds 
} from '../services/financialAggregator';
import { 
  GraduationCap, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Users, 
  Wallet, 
  FileCheck,
  ChevronRight,
  ShieldAlert,
  Lock,
  Layers,
  ArrowRight,
  AlertCircle,
  Calendar,
  Sparkles,
  Banknote,
  ShieldCheck,
  Activity,
  CheckSquare
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission, canViewDashboardWidget } = useAuth();
  const navigate = useNavigate();

  // Primary Canonical Store States
  const [files, setFiles] = useState<StudentFile[]>(() => bctStore.getStudentFiles());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => bctStore.getPayments());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => bctStore.getExpenses());
  const [tasks, setTasks] = useState<Task[]>(() => bctStore.getTasks());
  const [complaints, setComplaints] = useState<Complaint[]>(() => bctStore.getComplaints());
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(() => bctStore.getFinancialAccounts());
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>(() => bctStore.getExchangeRate());

  // Coordinated Time Range Filter State
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Real-Time Store Subscription (Coalesced via requestAnimationFrame to avoid render spikes)
  useEffect(() => {
    let frameId: number | null = null;
    return bctStore.subscribe(() => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(() => {
        setFiles(bctStore.getStudentFiles());
        setPayments(bctStore.getPayments());
        setExpenses(bctStore.getExpenses());
        setTasks(bctStore.getTasks());
        setComplaints(bctStore.getComplaints());
        setFinancialAccounts(bctStore.getFinancialAccounts());
        setExchangeRate(bctStore.getExchangeRate());
        frameId = null;
      });
    });
  }, []);

  // Departmental Permission Flags
  const canViewStudents = hasPermission('students:view') || isSuperAdmin;
  const canViewFinance = hasPermission('finance:view') || isSuperAdmin;
  const canViewTasks = hasPermission('tasks:view') || isSuperAdmin;
  const canViewQuality = hasPermission('quality:view') || isSuperAdmin;

  // Granular Dashboard Visibility Permission Flags
  const canViewActiveFiles = canViewDashboardWidget('dash:general:active_files');
  const canViewNetCollections = canViewDashboardWidget('dash:general:net_collections');
  const canViewPendingTasks = canViewDashboardWidget('dash:general:pending_tasks');
  const canViewQualityComplaints = canViewDashboardWidget('dash:general:quality_complaints');
  const canViewStagePipeline = canViewDashboardWidget('dash:general:stage_pipeline');
  const canViewRecentFiles = canViewDashboardWidget('dash:general:recent_active_files');
  const canViewImmediateTasks = canViewDashboardWidget('dash:general:immediate_tasks');

  // Overall General Dashboard Access Gate
  const canViewAnyGeneralWidget = canViewActiveFiles || canViewNetCollections || canViewPendingTasks ||
    canViewQualityComplaints || canViewStagePipeline || canViewRecentFiles || canViewImmediateTasks;

  // Visible KPI Cards Count for Dynamic Layout Auto-Reflow
  const visibleKpiCount = [canViewActiveFiles, canViewNetCollections, canViewPendingTasks, canViewQualityComplaints].filter(Boolean).length;

  // Time Range Bounds Calculation
  const dateRangeBounds = useMemo<DateRangeBounds | null>(() => {
    if (timeRange === 'all') return null;
    const now = new Date();
    const start = new Date();
    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      start.setDate(now.getDate() - 30);
    }
    return { start, end: now };
  }, [timeRange]);

  // =========================================================================
  // 1. ACTIVE STUDENT FILES (Single Source of Truth: CRM & File Lifecycle)
  // =========================================================================
  const activeStudentFiles = useMemo(() => {
    return bctStore.getActiveStudentFiles();
  }, [files]);

  const activeFilesCount = activeStudentFiles.length;
  const totalFiles = files.length;
  const closedOrArchivedCount = useMemo(() => {
    return files.filter(f => f.is_archived || f.current_status === 'closed' || f.current_status === 'archived').length;
  }, [files]);

  // =========================================================================
  // 2. FINANCIAL HEALTH & NET COLLECTIONS (Single Source of Truth: Financial Management)
  // =========================================================================
  const financialSummary = useMemo(() => {
    if (!canViewFinance || !canViewNetCollections) {
      return EMPTY_FINANCIAL_SUMMARY;
    }
    return calculateFinancialSummary(payments, expenses, exchangeRate, dateRangeBounds);
  }, [canViewFinance, canViewNetCollections, payments, expenses, exchangeRate, dateRangeBounds]);

  // Reconciled Available Cash Balance in Vaults & Bank Accounts (Ledger Parity)
  const availableCashInEGP = financialSummary.totalNetCashInEGP;

  // =========================================================================
  // 3. PENDING & OVERDUE TASKS (Single Source of Truth: Tasks Center)
  // =========================================================================
  const pendingTasksList = useMemo(() => {
    return tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  }, [tasks]);

  const overdueTasksList = useMemo(() => {
    const now = new Date();
    return pendingTasksList.filter(t => t.deadline_at && new Date(t.deadline_at) < now);
  }, [pendingTasksList]);

  const inReviewTasksList = useMemo(() => {
    return pendingTasksList.filter(t => t.status === 'pending_approval' || t.status === 'in_progress');
  }, [pendingTasksList]);

  // =========================================================================
  // 4. QUALITY & SLA COMPLAINTS (Single Source of Truth: Quality & Complaints Center)
  // =========================================================================
  const openComplaintsList = useMemo(() => {
    return complaints.filter(c => c.status !== 'closed' && c.status !== 'resolved');
  }, [complaints]);

  // Strictly exclude closed/resolved complaints from overdue calculations
  const overdueComplaintsList = useMemo(() => {
    const now = new Date();
    return openComplaintsList.filter(c => c.sla_resolution_deadline_at && new Date(c.sla_resolution_deadline_at) < now);
  }, [openComplaintsList]);

  const resolvedComplaintsList = useMemo(() => {
    return complaints.filter(c => c.status === 'closed' || c.status === 'resolved');
  }, [complaints]);

  const complaintsSlaCompliance = useMemo(() => {
    if (resolvedComplaintsList.length === 0) {
      return overdueComplaintsList.length === 0 ? 100 : Math.max(0, Math.round((1 - overdueComplaintsList.length / Math.max(1, complaints.length)) * 100));
    }
    const onTimeResolved = resolvedComplaintsList.filter(c => {
      if (!c.resolved_at || !c.sla_resolution_deadline_at) return true;
      return new Date(c.resolved_at) <= new Date(c.sla_resolution_deadline_at);
    }).length;
    return Math.round((onTimeResolved / resolvedComplaintsList.length) * 100);
  }, [complaints, resolvedComplaintsList, overdueComplaintsList]);

  // =========================================================================
  // 5. 10-STAGE PIPELINE DISTRIBUTION (Single Source of Truth: File Lifecycle Stages)
  // =========================================================================
  const activeStageCounts = useMemo(() => {
    return bctStore.getLifecycleStageCounts();
  }, [files]);

  // =========================================================================
  // 6. RECENT ACTIVE STUDENT FILES (Sorted by actual last updated timestamp)
  // =========================================================================
  const recentActiveFiles = useMemo(() => {
    if (!canViewRecentFiles) return [];
    return [...activeStudentFiles]
      .sort((a, b) => {
        const timeA = new Date(a.last_updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.last_updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [canViewRecentFiles, activeStudentFiles]);

  // =========================================================================
  // 7. IMMEDIATE TASKS & HANDOFFS (Priority & Deadline Ordered)
  // =========================================================================
  const immediateTasks = useMemo(() => {
    if (!canViewImmediateTasks) return [];
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1
    };
    return [...pendingTasksList]
      .sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        const timeA = a.deadline_at ? new Date(a.deadline_at).getTime() : Infinity;
        const timeB = b.deadline_at ? new Date(b.deadline_at).getTime() : Infinity;
        return timeA - timeB;
      })
      .slice(0, 5);
  }, [canViewImmediateTasks, pendingTasksList]);

  // Helper to format ISO timestamp
  const formatTimeAgo = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // Strictly Guarded: If no General Dashboard elements are authorized for this user, block access
  if (!canViewAnyGeneralWidget) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-800">
              {language === 'ar' ? 'تم حظر الوصول إلى لوحة المؤشرات العامة' : 'General Dashboard Access Restricted'}
            </h2>
            <p className="text-sm font-bold text-rose-700 mt-2 bg-rose-50 py-2.5 px-4 rounded-xl border border-rose-100">
              {language === 'ar' 
                ? 'ليس لديك صلاحية لعرض أي من مؤشرات أو عناصر هذه اللوحة.' 
                : 'You do not have permission to view any elements of this dashboard.'}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {language === 'ar'
                ? 'تم حجب هذه اللوحة بالكامل وفق مصفوفة صلاحيات الدور الوظيفي لحسابك. يرجى مراجعة إدارة النظام لتحديث الصلاحيات.'
                : 'Access to this dashboard is restricted based on your role permissions in the RBAC matrix.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/pipeline')}
            className="w-full py-3 px-4 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-md"
          >
            {language === 'ar' ? 'الانتقال إلى الأقسام المصرح بها' : 'Navigate to Authorized Modules'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Live Operational Banner */}
      <div className="bg-gradient-to-r from-bct-navy via-bct-dark to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('brand.name')} • {t('departments.' + (currentUser?.department_id || 'gm'))}</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 font-medium">
                {language === 'ar' ? 'مزامنة حية ولحظية' : 'Real-Time Sync Active'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold">
              {language === 'ar' 
                ? `مرحباً بك، ${currentUser?.full_name_ar || 'المشرف الإداري'}` 
                : `Welcome, ${currentUser?.full_name_en || 'Administrator'}`}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ar'
                ? 'لوحة المؤشرات التشغيلية المركزية: قراءات دقيقة مستمدة مباشرة من قواعد بيانات الإدارات، مع تحديث فوري لكافة المؤشرات عند حدوث أي إجراء.'
                : 'Central Operational Dashboard: Real-time, verified KPIs derived strictly from departmental databases with instant synchronization.'}
            </p>
          </div>

          {/* Temporal Filter Selector & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Time Filter Buttons */}
            <div className="bg-white/10 p-1 rounded-2xl flex items-center gap-1 backdrop-blur-sm border border-white/15">
              {[
                { id: 'all', label_ar: 'الكل', label_en: 'All-Time' },
                { id: 'today', label_ar: 'اليوم', label_en: 'Today' },
                { id: '7days', label_ar: '7 أيام', label_en: '7 Days' },
                { id: '30days', label_ar: '30 يوماً', label_en: '30 Days' },
              ].map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeRange(tf.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    timeRange === tf.id
                      ? 'bg-white text-bct-navy shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {language === 'ar' ? tf.label_ar : tf.label_en}
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2">
              <Link
                to="/students"
                className="px-3.5 py-2 rounded-xl bg-white text-bct-navy font-bold text-xs shadow-md hover:bg-slate-100 transition flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4 text-bct-navy" />
                <span>{language === 'ar' ? 'تسجيل طالب' : 'Register Student'}</span>
              </Link>

              <Link
                to="/pipeline"
                className="px-3.5 py-2 rounded-xl bg-sky-500/30 hover:bg-sky-500/50 text-white font-bold text-xs border border-white/20 backdrop-blur-sm transition flex items-center gap-1.5"
              >
                <span>{t('nav.lifecycle')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid (4 Top Pillars with Dynamic Auto-Reflow Layout) */}
      {visibleKpiCount > 0 && (
        <div className={`grid grid-cols-1 ${
          visibleKpiCount === 1 ? 'max-w-md' :
          visibleKpiCount === 2 ? 'md:grid-cols-2' :
          visibleKpiCount === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-4'
        } gap-4`}>
          
          {/* KPI 1: Active Files Under Follow-up */}
          {canViewActiveFiles && (
            <div
              onClick={() => {
                if (canViewStudents) navigate('/pipeline');
              }}
              className={`bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all select-none ${
                canViewStudents ? 'cursor-pointer hover:shadow-md hover:border-sky-300 group' : 'opacity-80'
              }`}
              title={canViewStudents ? (language === 'ar' ? 'انتقال إلى مسار دورة حياة الملف' : 'View Lifecycle Pipeline') : ''}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    {language === 'ar' ? 'الملفات قيد المتابعة' : 'Active Files in Pipeline'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'إدارة الطلب ومسار القبول' : 'CRM & Admission Pipeline'}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                {canViewStudents ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tabular-nums text-bct-navy">
                        {activeFilesCount}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {language === 'ar' ? 'ملفاً نشطاً' : 'active files'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{language === 'ar' ? 'قيد المعالجة (مراحل 1 - 9):' : 'In Processing (Stages 1-9):'}</span>
                        <span className="tabular-nums font-bold text-sky-700">{activeFilesCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>{language === 'ar' ? 'المؤرشفة والمغلقة (مستبعدة):' : 'Archived & Closed (Excluded):'}</span>
                        <span className="tabular-nums">{closedOrArchivedCount}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-slate-400 text-xs">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{language === 'ar' ? 'عرض البيانات مقيد بالصلاحيات' : 'Access Restricted'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI 2: Net Collections After Operational Expenses */}
          {canViewNetCollections && (
            <div
              onClick={() => {
                if (canViewFinance) navigate('/finance');
              }}
              className={`bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all select-none ${
                canViewFinance ? 'cursor-pointer hover:shadow-md hover:border-emerald-300 group' : 'opacity-80'
              }`}
              title={canViewFinance ? (language === 'ar' ? 'انتقال إلى الإدارة المالية' : 'View Financial Management') : ''}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    {language === 'ar' ? 'صافي التحصيلات بعد المصروفات' : 'Net Collections (After OpEx)'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'التحصيلات المؤكدة - المصروف المعتمد' : 'Confirmed Inflow - Approved OpEx'}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                {canViewFinance ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5" dir="ltr">
                        <span className={`text-2xl font-black tabular-nums ${
                          financialSummary.totalNetCollectionsInEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {financialSummary.totalNetCollectionsInEGP >= 0 ? '+' : ''}
                          {Math.round(financialSummary.totalNetCollectionsInEGP).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-500">EGP</span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        financialSummary.netStatus === 'positive' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {financialSummary.netMarginPercentage}% {language === 'ar' ? 'هامش' : 'margin'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{language === 'ar' ? 'صافي العملات المنفصل:' : 'Segregated Currencies:'}</span>
                        <span dir="ltr" className="tabular-nums font-bold text-slate-700 text-[10px]">
                          {financialSummary.netCollectionsEGP.toLocaleString()} EGP
                          {financialSummary.netCollectionsUSD !== 0 && ` | $${financialSummary.netCollectionsUSD.toLocaleString()} USD`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>{language === 'ar' ? 'الرصيد النقدي المتاح بالخزائن:' : 'Available Cash in Vaults:'}</span>
                        <span dir="ltr" className="tabular-nums font-bold text-emerald-700">
                          {availableCashInEGP.toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-slate-400 text-xs">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{language === 'ar' ? 'عرض البيانات مقيد بالصلاحيات' : 'Access Restricted'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI 3: Pending Operational Tasks */}
          {canViewPendingTasks && (
            <div
              onClick={() => {
                if (canViewTasks) navigate('/tasks?filter=pending');
              }}
              className={`bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all select-none ${
                canViewTasks ? 'cursor-pointer hover:shadow-md hover:border-amber-300 group' : 'opacity-80'
              }`}
              title={canViewTasks ? (language === 'ar' ? 'انتقال إلى مركز المهام' : 'View Tasks Center') : ''}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    {language === 'ar' ? 'المهام المعلقة' : 'Pending Tasks'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'مركز المهام ومناطق التسليم' : 'Task Operations & SLAs'}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                {canViewTasks ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tabular-nums text-amber-600">
                        {pendingTasksList.length}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {language === 'ar' ? 'مهمة مفتوحة' : 'open tasks'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{language === 'ar' ? 'متأخرة عن الموعد:' : 'Overdue Tasks:'}</span>
                        <span className={`tabular-nums font-bold ${overdueTasksList.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {overdueTasksList.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>{language === 'ar' ? 'قيد المراجعة والتنفيذ:' : 'In Review / Progress:'}</span>
                        <span className="tabular-nums text-slate-600">{inReviewTasksList.length}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-slate-400 text-xs">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{language === 'ar' ? 'عرض البيانات مقيد بالصلاحيات' : 'Access Restricted'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI 4: Quality & Grievance Index */}
          {canViewQualityComplaints && (
            <div
              onClick={() => {
                if (canViewQuality) navigate('/complaints?status=open');
              }}
              className={`bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all select-none ${
                canViewQuality ? 'cursor-pointer hover:shadow-md hover:border-purple-300 group' : 'opacity-80'
              }`}
              title={canViewQuality ? (language === 'ar' ? 'انتقال إلى مركز الشكاوى والجودة' : 'View Complaints Center') : ''}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    {language === 'ar' ? 'مؤشر الجودة والشكاوى' : 'Quality & Grievances'}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {language === 'ar' ? 'مركز الجودة وامتثال SLA' : 'Quality Assurance & SLAs'}
                  </span>
                </div>
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  overdueComplaintsList.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'
                }`}>
                  {overdueComplaintsList.length > 0 ? <AlertTriangle className="w-5 h-5 text-rose-600" /> : <ShieldCheck className="w-5 h-5 text-purple-600" />}
                </div>
              </div>

              <div className="mt-3">
                {canViewQuality ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black tabular-nums ${
                          overdueComplaintsList.length > 0 ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {openComplaintsList.length}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {language === 'ar' ? 'شكوى مفتوحة' : 'open tickets'}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        overdueComplaintsList.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {complaintsSlaCompliance}% SLA
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>{language === 'ar' ? 'متجاوزة لمهلة SLA:' : 'SLA Breached:'}</span>
                        <span className={`tabular-nums font-bold ${overdueComplaintsList.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {overdueComplaintsList.length} {language === 'ar' ? 'شكوى' : 'tickets'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>{language === 'ar' ? 'شكاوى تم إغلاقها بنجاح:' : 'Resolved & Closed:'}</span>
                        <span className="tabular-nums">{resolvedComplaintsList.length}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-slate-400 text-xs">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>{language === 'ar' ? 'عرض البيانات مقيد بالصلاحيات' : 'Access Restricted'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. Ten-Stage File Lifecycle Pipeline Distribution (Strict Canonical Single Source of Truth) */}
      {canViewStagePipeline && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="p-1.5 bg-bct-navy text-white rounded-lg">
                  <Layers className="w-4 h-4" />
                </span>
                <span>
                  {language === 'ar' 
                    ? 'توزيع الملفات النشطة عبر مسار العمليات (10 مراحل)' 
                    : 'Active Files Distribution Across 10 Lifecycle Stages'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'انقر على أي مرحلة للانتقال مباشرة إلى لوحة مسار العمليات واستعراض ملفات تلك المرحلة بالتحديد.'
                  : 'Click any stage card to navigate directly to the lifecycle pipeline filtered by that stage.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold tabular-nums">
                {language === 'ar' ? `إجمالي النشطة: ${activeFilesCount}` : `Total Active: ${activeFilesCount}`}
              </span>

              <Link
                to="/pipeline"
                className="text-xs font-bold text-bct-navy hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <span>{language === 'ar' ? 'عرض لوحة المراحل الكاملة' : 'View Full Pipeline'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* 10 Canonical Stage Cards with Interactive Drill-Down */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {LIFECYCLE_STAGE_DEFINITIONS.map(stage => {
              const count = activeStageCounts[stage.key] || 0;
              return (
                <div 
                  key={stage.key}
                  onClick={() => navigate(`/pipeline?stage=${stage.key}`)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:scale-[1.03] select-none ${
                    count > 0 
                      ? `${stage.bg_color} ${stage.border_color} shadow-xs` 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                  title={language === 'ar' ? `انتقال لمرحلة: ${stage.name_ar}` : `View ${stage.name_en}`}
                >
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] tabular-nums font-bold bg-white/80 text-slate-600 shadow-2xs mb-1">
                      {stage.stageNumber}
                    </span>
                    <div className="text-[11px] font-bold text-slate-800 line-clamp-1" title={language === 'ar' ? stage.name_ar : stage.name_en}>
                      {language === 'ar' ? stage.name_ar : stage.name_en}
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className={`text-xl font-black tabular-nums block ${
                      count > 0 ? (stage.color || 'text-bct-navy') : 'text-slate-300'
                    }`}>
                      {count}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {language === 'ar' ? 'ملف' : 'files'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Two-Column Live Operational Lists */}
      {(canViewRecentFiles || canViewImmediateTasks) && (
        <div className={`grid grid-cols-1 ${canViewRecentFiles && canViewImmediateTasks ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
          
          {/* Left Column: Recent Active Student Applications (Ordered by actual last modification) */}
          {canViewRecentFiles && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">
                      {language === 'ar' ? 'أحدث ملفات الطلب النشطة' : 'Recent Active Student Files'}
                    </h3>
                  </div>

                  <Link 
                    to="/pipeline" 
                    className="text-xs font-bold text-bct-navy hover:text-sky-700 transition-colors flex items-center gap-1"
                  >
                    <span>{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentActiveFiles.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      {language === 'ar' ? 'لا توجد ملفات نشطة حالياً' : 'No active student files'}
                    </div>
                  ) : (
                    recentActiveFiles.map(file => {
                      const stageDef = LIFECYCLE_STAGE_DEFINITIONS.find(s => s.key === file.current_status);
                      return (
                        <div 
                          key={file.id} 
                          onClick={() => navigate(`/students/${file.file_code}`)}
                          className="py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors px-2.5 rounded-xl cursor-pointer group"
                          title={language === 'ar' ? `فتح ملف المعاملة ${file.file_code}` : `Open dossier ${file.file_code}`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-3">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-bold text-xs text-slate-800 group-hover:text-bct-navy transition-colors truncate">
                                {language === 'ar' 
                                  ? (file.student?.full_name_ar || 'طالب') 
                                  : (file.student?.full_name_en || file.student?.full_name_ar || 'Student')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span className="font-mono font-bold text-bct-navy">{file.file_code}</span>
                              <span>•</span>
                              <span className="truncate">{file.certificate_type || '—'}</span>
                              <span>•</span>
                              <span className="text-[10px] text-slate-400">
                                {formatTimeAgo(file.last_updated_at || file.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="text-end shrink-0 space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              stageDef?.bg_color || 'bg-slate-100'
                            } ${stageDef?.border_color || 'border-slate-200'} ${stageDef?.color || 'text-slate-700'}`}>
                              {stageDef?.stageNumber} {language === 'ar' ? (stageDef?.name_ar || file.current_status) : (stageDef?.name_en || file.current_status)}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {file.current_owner?.full_name_ar || '—'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link 
                  to="/pipeline" 
                  className="text-xs font-bold text-bct-navy hover:text-sky-700 hover:underline flex items-center justify-center gap-1.5"
                >
                  <span>{language === 'ar' ? 'إدارة مسار الملفات الكاملة عبر الكانبان' : 'Manage Full Pipeline in Kanban'}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {/* Right Column: Immediate Tasks & Operational Handoffs */}
          {canViewImmediateTasks && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                      <CheckSquare className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">
                      {language === 'ar' ? 'المهام والتسليمات العاجلة' : 'Immediate Tasks & Handoffs'}
                    </h3>
                  </div>

                  <Link 
                    to="/tasks" 
                    className="text-xs font-bold text-bct-navy hover:text-sky-700 transition-colors flex items-center gap-1"
                  >
                    <span>{language === 'ar' ? 'عرض مركز المهام' : 'View Tasks Center'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {immediateTasks.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      {language === 'ar' ? 'لا توجد مهام عاجلة معلقة حالياً' : 'Zero urgent pending tasks'}
                    </div>
                  ) : (
                    immediateTasks.map(task => {
                      const isOverdue = task.deadline_at && new Date(task.deadline_at) < new Date();
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => navigate('/tasks')}
                          className="p-3.5 rounded-2xl border border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/60 transition-all flex items-start justify-between gap-3 cursor-pointer group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                task.priority === 'urgent' 
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {task.task_code}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-bct-navy transition-colors">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {task.description}
                            </p>
                          </div>

                          <div className="text-end shrink-0 space-y-1">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              {task.assignee?.full_name_ar ? task.assignee.full_name_ar.split(' ')[0] : '—'}
                            </span>
                            {task.deadline_at && (
                              <span className={`text-[10px] tabular-nums block ${
                                isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                              }`}>
                                {isOverdue && '⚠️ '}
                                {formatTimeAgo(task.deadline_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link 
                  to="/handoffs" 
                  className="text-xs font-bold text-bct-navy hover:text-sky-700 hover:underline flex items-center justify-center gap-1.5"
                >
                  <span>{language === 'ar' ? 'مراجعة قواعد تسليم الملفات الثمانية' : 'Review 8 Department Handoff Rules'}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
