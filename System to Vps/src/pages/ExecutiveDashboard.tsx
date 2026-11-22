import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { LIFECYCLE_STAGE_DEFINITIONS } from '../types/database.types';
import {
  calculateFinancialSummary,
  getDateRangeBounds,
  FinancialTimeRange,
  EMPTY_FINANCIAL_SUMMARY
} from '../services/financialAggregator';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Award,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  Calendar,
  Filter,
  BarChart3,
  Briefcase,
  Zap,
  ArrowUpRight,
  RotateCcw,
  Check,
  Scale,
  Wallet,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isRtl, t } = useLanguage();
  const { currentEmployee, hasPermission, canViewDashboardWidget } = useAuth();

  // Granular Executive Dashboard Visibility Permission Flags
  const canViewConfirmedCollections = canViewDashboardWidget('dash:exec:confirmed_collections');
  const canViewApprovedExpenses = canViewDashboardWidget('dash:exec:approved_expenses');
  const canViewNetCollections = canViewDashboardWidget('dash:exec:net_collections');
  const canViewCapacityUtilization = canViewDashboardWidget('dash:exec:capacity_utilization');
  const canViewConversionRate = canViewDashboardWidget('dash:exec:conversion_rate');
  const canViewSlaCompliance = canViewDashboardWidget('dash:exec:sla_compliance');
  const canViewEmergencyReserve = canViewDashboardWidget('dash:exec:emergency_reserve');
  const canViewStagePipeline = canViewDashboardWidget('dash:exec:stage_pipeline');
  const canView90DayRoadmap = canViewDashboardWidget('dash:exec:90day_roadmap');
  const canViewMarketingGate = canViewDashboardWidget('dash:exec:marketing_gate');

  // Overall Executive Dashboard Access Gate
  const canViewAnyExecWidget = canViewConfirmedCollections || canViewApprovedExpenses || canViewNetCollections ||
    canViewCapacityUtilization || canViewConversionRate || canViewSlaCompliance || canViewEmergencyReserve ||
    canViewStagePipeline || canView90DayRoadmap || canViewMarketingGate;

  // Visible KPI Tiles Count for Dynamic Auto-Reflow Layout
  const visibleKpiTilesCount = [
    canViewConfirmedCollections,
    canViewApprovedExpenses,
    canViewNetCollections,
    canViewCapacityUtilization,
    canViewConversionRate,
    canViewSlaCompliance
  ].filter(Boolean).length;

  const [files, setFiles] = useState(bctStore.getStudentFiles());
  const [payments, setPayments] = useState(bctStore.getPayments());
  const [expenses, setExpenses] = useState(bctStore.getExpenses());
  const [exchangeRate, setExchangeRate] = useState(bctStore.getExchangeRate());
  const [complaints, setComplaints] = useState(bctStore.getComplaints());
  const [campaigns, setCampaigns] = useState(bctStore.getCampaigns());
  const [capacitySettings, setCapacitySettings] = useState(bctStore.getCapacitySettings());
  const [tasks, setTasks] = useState(bctStore.getTasks());

  // Date range filter state (defaults to 'all' to align with Financial Management)
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all' | 'custom'>('all');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = bctStore.subscribe(() => {
      setFiles(bctStore.getStudentFiles());
      setPayments(bctStore.getPayments());
      setExpenses(bctStore.getExpenses());
      setExchangeRate(bctStore.getExchangeRate());
      setComplaints(bctStore.getComplaints());
      setCampaigns(bctStore.getCampaigns());
      setCapacitySettings(bctStore.getCapacitySettings());
      setTasks(bctStore.getTasks());
    });
    return unsub;
  }, []);

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      setDateError(isRtl ? 'يرجى تحديد تاريخ البداية والنهاية' : 'Please select both start and end dates');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setDateError(isRtl ? 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية' : 'Start date must be before or equal to end date');
      return;
    }
    setDateError(null);
    setAppliedCustomRange({ start: customStart, end: customEnd });
    setTimeRange('custom');
    setShowCustomPicker(false);
  };

  const handleReset = () => {
    setTimeRange('30d');
    setAppliedCustomRange(null);
    setDateError(null);
    setShowCustomPicker(false);
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setCustomStart(d.toISOString().split('T')[0]);
    setCustomEnd(new Date().toISOString().split('T')[0]);
  };

  // Filter items based on timeRange (Requirement 6 & 7: Shared canonical bounds)
  const dateRangeBounds = useMemo(() => {
    const canonicalRange: FinancialTimeRange =
      timeRange === '90d' ? 'quarter' : (timeRange as FinancialTimeRange);
    return getDateRangeBounds(canonicalRange, appliedCustomRange);
  }, [timeRange, appliedCustomRange]);

  // Centralized Financial Aggregation (Strictly guarded by granular permissions)
  const canAnyFinance = canViewConfirmedCollections || canViewApprovedExpenses || canViewNetCollections || canViewEmergencyReserve;
  const financialSummary = useMemo(() => {
    if (!canAnyFinance) {
      return EMPTY_FINANCIAL_SUMMARY;
    }
    return calculateFinancialSummary(payments, expenses, exchangeRate, dateRangeBounds);
  }, [canAnyFinance, payments, expenses, exchangeRate, dateRangeBounds]);

  const filteredPayments = useMemo(() => {
    if (!dateRangeBounds) return payments;
    return payments.filter(p => {
      const pDate = new Date(p.created_at || (p as any).payment_date || Date.now());
      return pDate >= dateRangeBounds.start && pDate <= dateRangeBounds.end;
    });
  }, [payments, dateRangeBounds]);

  const filteredFiles = useMemo(() => {
    if (!dateRangeBounds) return files;
    return files.filter(f => {
      const fDate = new Date(f.created_at || (f as any).last_updated_at || Date.now());
      return fDate >= dateRangeBounds.start && fDate <= dateRangeBounds.end;
    });
  }, [files, dateRangeBounds]);

  const filteredComplaints = useMemo(() => {
    if (!dateRangeBounds) return complaints;
    return complaints.filter(c => {
      const cDate = new Date(c.created_at || Date.now());
      return cDate >= dateRangeBounds.start && cDate <= dateRangeBounds.end;
    });
  }, [complaints, dateRangeBounds]);

  const filteredTasks = useMemo(() => {
    if (!dateRangeBounds) return tasks;
    return tasks.filter(t => {
      const tDate = new Date(t.created_at || Date.now());
      return tDate >= dateRangeBounds.start && tDate <= dateRangeBounds.end;
    });
  }, [tasks, dateRangeBounds]);

  // Emergency Reserve Status (Cumulative Institutional Buffer: 35% of cumulative eligible collections)
  // Target: 450,000 EGP (3 months fixed OpEx buffer)
  const targetEmergencyReserve = 450000;
  const cumulativeConfirmedEGP = useMemo(() => {
    if (!canViewEmergencyReserve) return 0;
    return payments
      .filter(p => p.status === 'confirmed' && p.currency === 'EGP')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [canViewEmergencyReserve, payments]);

  const currentEmergencyReserve = cumulativeConfirmedEGP * 0.35; // 35% statutory allocation policy
  const remainingEmergencyReserve = Math.max(0, targetEmergencyReserve - currentEmergencyReserve);
  const reserveRatio = Math.min(100, Math.round((currentEmergencyReserve / targetEmergencyReserve) * 100));

  // Period-specific reserve allocation contribution
  const periodEmergencyAllocation = (financialSummary.confirmedEGP || 0) * 0.35;

  // Operational Capacity Breakdown (Unified with Capacity Gate Center - Single Source of Truth)
  const capacityBreakdown = useMemo(() => {
    return bctStore.getCapacityBreakdown();
  }, [campaigns, files, capacitySettings]);

  const capacityUtilizationPct = capacityBreakdown.utilization_rate_pct ?? (
    capacityBreakdown.approved_capacity > 0 
      ? Number(((capacityBreakdown.committed_capacity / capacityBreakdown.approved_capacity) * 100).toFixed(2)) 
      : 0
  );

  // Synchronized 10-Stage Lifecycle Counts (Single Source of Truth from bctStore)
  const activeStageCounts = useMemo(() => {
    return bctStore.getLifecycleStageCounts();
  }, [files]);

  // Conversion Funnel: Inquiry-to-Registration
  // Denominator: Eligible Inquiries in the period (all non-archived files entered in period)
  const eligibleInquiries = useMemo(() => {
    return filteredFiles.filter(f => !f.is_archived);
  }, [filteredFiles]);

  const totalInquiriesCount = eligibleInquiries.length;

  // Numerator: Qualified Registrations (files that reached Stage 3 'registered' or beyond)
  const registeredFiles = useMemo(() => {
    return eligibleInquiries.filter(f => !['new', 'new_inquiry', 'qualified', 'contacted'].includes(f.current_status));
  }, [eligibleInquiries]);

  const registeredCount = registeredFiles.length;

  const admittedFiles = useMemo(() => {
    return eligibleInquiries.filter(f => ['preliminary', 'final', 'closed', 'admitted', 'completed'].includes(f.current_status));
  }, [eligibleInquiries]);

  const admittedCount = admittedFiles.length;

  // Formula: Qualified Registrations / Eligible Inquiries * 100
  const inquiryToRegRate = totalInquiriesCount > 0
    ? Math.round((registeredCount / totalInquiriesCount) * 100)
    : 0;

  const regToAdmitRate = registeredCount > 0
    ? Math.round((admittedCount / registeredCount) * 100)
    : 0;

  // SLA Tasks & Complaints Compliance
  const completedTasks = useMemo(() => {
    return filteredTasks.filter(t => t.status === 'completed');
  }, [filteredTasks]);

  const tasksCompletedWithinSLA = useMemo(() => {
    return completedTasks.filter(t => {
      if (!t.deadline_at || !t.completed_at) return true;
      return new Date(t.completed_at) <= new Date(t.deadline_at);
    });
  }, [completedTasks]);

  const overdueOpenTasks = useMemo(() => {
    const now = new Date();
    return filteredTasks.filter(t => t.status !== 'completed' && t.deadline_at && new Date(t.deadline_at) < now);
  }, [filteredTasks]);

  const taskSlaComplianceRate = completedTasks.length > 0
    ? Math.round((tasksCompletedWithinSLA.length / completedTasks.length) * 100)
    : 100;

  const resolvedComplaints = useMemo(() => {
    return filteredComplaints.filter(c => c.status === 'resolved');
  }, [filteredComplaints]);

  const openComplaints = useMemo(() => {
    return filteredComplaints.filter(c => c.status !== 'resolved');
  }, [filteredComplaints]);

  const complaintsResolutionRate = filteredComplaints.length > 0
    ? Math.round((resolvedComplaints.length / filteredComplaints.length) * 100)
    : 100;

  // Composite SLA Compliance: Tasks Completed Within SLA / Eligible Completed Tasks
  const slaCompliance = completedTasks.length > 0 ? taskSlaComplianceRate : complaintsResolutionRate;

  // 90-Day Roadmap Progress (Phase 1: 100%, Phase 2: 70%, Phase 3: 20%)
  const roadmapProgress = 65;

  // Access Guard: If user has 0 allowed widgets on Executive Dashboard, block access
  if (!canViewAnyExecWidget) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">
              {isRtl ? 'تم حظر الوصول إلى اللوحة التنفيذية' : 'Executive Dashboard Access Restricted'}
            </h2>
            <p className="text-sm font-bold text-rose-700 mt-2 bg-rose-50 py-2.5 px-4 rounded-xl border border-rose-100">
              {isRtl ? 'ليس لديك صلاحية لعرض مؤشرات القيادة الاستراتيجية والتنفيذية.' : 'You do not have permission to view executive leadership KPIs.'}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {isRtl ? 'تم حجب هذه اللوحة بالكامل وفق مصفوفة صلاحيات الدور الوظيفي لحسابك.' : 'Access restricted based on your role permissions in the RBAC matrix.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-md"
          >
            {isRtl ? 'العودة إلى لوحة المؤشرات العامة' : 'Return to General Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Filter */}
      <div className="bg-gradient-to-r from-bct-navy via-bct-navy-dark to-[#0B2538] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/10 rounded text-xs font-semibold text-blue-200">
                {isRtl ? 'لوحة القيادة التنفيذية' : 'Executive Dashboard'}
              </span>
              <span className="text-xs text-blue-300">
                {isRtl ? 'الإدارة العامة • ' : 'General Management • '}{t('brand.name')}
              </span>
            </div>
            <h1 className="text-2xl font-bold">
              {isRtl ? 'مؤشرات الأداء المؤسسي الشاملة' : 'Enterprise Performance Intelligence'}
            </h1>
            <p className="text-sm text-blue-100/80 mt-1">
              {isRtl
                ? 'رؤية لحظية لكفاءة العمليات، التدفقات المالية، الطاقة الاستيعابية، ومؤشرات الجودة'
                : 'Real-time oversight of operations, cash flows, capacity, and quality metrics'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15 text-xs flex-wrap gap-1">
              <button
                onClick={() => { setTimeRange('30d'); setShowCustomPicker(false); setAppliedCustomRange(null); }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === '30d' ? 'bg-white text-bct-navy font-bold shadow' : 'text-blue-100 hover:text-white'}`}
              >
                {isRtl ? 'آخر 30 يوماً' : 'Last 30 Days'}
              </button>
              <button
                onClick={() => { setTimeRange('90d'); setShowCustomPicker(false); setAppliedCustomRange(null); }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === '90d' ? 'bg-white text-bct-navy font-bold shadow' : 'text-blue-100 hover:text-white'}`}
              >
                {isRtl ? 'الربع الحالي (90 يوماً)' : 'Quarterly (90 Days)'}
              </button>
              <button
                onClick={() => { setTimeRange('all'); setShowCustomPicker(false); setAppliedCustomRange(null); }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${timeRange === 'all' ? 'bg-white text-bct-navy font-bold shadow' : 'text-blue-100 hover:text-white'}`}
              >
                {isRtl ? 'الكل' : 'All Time'}
              </button>
              <button
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${timeRange === 'custom' ? 'bg-white text-bct-navy font-bold shadow' : 'text-blue-100 hover:text-white'}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {isRtl ? 'تحديد مخصص' : 'Custom'}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker Dropdown / Inline Bar */}
        {showCustomPicker && (
          <div className="relative z-10 mt-4 pt-4 border-t border-white/15 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-blue-200 font-semibold">{isRtl ? 'من تاريخ:' : 'From:'}</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-white text-slate-800 rounded-lg px-3 py-1.5 border border-slate-300 font-sans focus:outline-none focus:ring-2 focus:ring-bct-navy"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-blue-200 font-semibold">{isRtl ? 'إلى تاريخ:' : 'To:'}</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-white text-slate-800 rounded-lg px-3 py-1.5 border border-slate-300 font-sans focus:outline-none focus:ring-2 focus:ring-bct-navy"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleApplyCustom}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isRtl ? 'تطبيق الفلتر' : 'Apply Filter'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>

            {dateError && (
              <div className="mt-2 text-rose-300 text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {dateError}
              </div>
            )}
          </div>
        )}

        {/* Display Active Range Info */}
        {timeRange === 'custom' && appliedCustomRange && (
          <div className="relative z-10 mt-3 flex items-center justify-between text-xs text-blue-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <span>
              {isRtl
                ? `النطاق الزمني النشط: من ${appliedCustomRange.start} إلى ${appliedCustomRange.end}`
                : `Active Range: From ${appliedCustomRange.start} to ${appliedCustomRange.end}`}
            </span>
            <button
              onClick={handleReset}
              className="text-xs text-amber-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              {isRtl ? 'إعادة تعيين (آخر 30 يوماً)' : 'Reset (Last 30 Days)'}
            </button>
          </div>
        )}
      </div>

      {/* Primary KPI Tiles */}
      {visibleKpiTilesCount > 0 && (
        <div className={`grid grid-cols-1 ${
          visibleKpiTilesCount === 1 ? 'max-w-md' :
          visibleKpiTilesCount === 2 ? 'sm:grid-cols-2' :
          visibleKpiTilesCount === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
          visibleKpiTilesCount === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
          visibleKpiTilesCount === 5 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
          'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
        } gap-4`}>
          {/* Metric 1: Confirmed Collections */}
          {canViewConfirmedCollections && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[235px] flex flex-col justify-between hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-500 block leading-tight">
                    {isRtl ? 'إجمالي التحصيلات المؤكدة' : 'Confirmed Collections'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'المقبوضات المعتمدة بالخزائن والحسابات' : 'Verified Treasury & Bank Inflows'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-black text-slate-800 tabular-nums flex items-baseline gap-1">
                  <span>{financialSummary.confirmedEGP.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5 flex items-baseline gap-1 tabular-nums">
                  <span dir="ltr">USD ${financialSummary.confirmedUSD.toLocaleString()}</span>
                </div>

                <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between tabular-nums">
                  <span className="text-slate-400 font-sans">{isRtl ? 'المعادل الإجمالي:' : 'Eq. Total:'}</span>
                  <span dir="ltr" className="font-semibold text-slate-700">
                    {Math.round(financialSummary.totalCollectedInEGP).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{financialSummary.confirmedCount} {isRtl ? 'إيصال معتمد بالخزينة' : 'verified receipts'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Metric 2: Approved OpEx */}
          {canViewApprovedExpenses && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[235px] flex flex-col justify-between hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-500 block leading-tight">
                    {isRtl ? 'المصروفات التشغيلية المعتمدة' : 'Approved OpEx'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'الالتزامات التشغيلية المعتمدة للصرف' : 'Committed & Approved Expenditures'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl font-black text-rose-700 tabular-nums flex items-baseline gap-1">
                  <span>{financialSummary.approvedExpenseEGP.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className="text-sm font-bold text-rose-600 mt-0.5 flex items-baseline gap-1 tabular-nums">
                  <span dir="ltr">USD ${financialSummary.approvedExpenseUSD.toLocaleString()}</span>
                </div>

                <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between tabular-nums">
                  <span className="text-slate-400 font-sans">{isRtl ? 'المعادل الإجمالي:' : 'Eq. Total:'}</span>
                  <span dir="ltr" className="font-semibold text-slate-700">
                    {Math.round(financialSummary.totalApprovedExpenseInEGP).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-2">
                  <span>{financialSummary.approvedExpenseCount} {isRtl ? 'بند مصروف معتمد' : 'approved items'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Metric 3: Net Collections After Expenses */}
          {canViewNetCollections && (
            <div className={`p-5 rounded-2xl border shadow-xs min-h-[235px] flex flex-col justify-between transition-all ${
              financialSummary.netStatus === 'positive'
                ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-300 ring-1 ring-emerald-200/50'
                : financialSummary.netStatus === 'negative'
                ? 'bg-gradient-to-br from-rose-50/60 to-white border-rose-300 ring-1 ring-rose-200/50'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-extrabold text-slate-800 block leading-tight">
                    {isRtl ? 'صافي التحصيلات بعد المصروفات' : 'Net Collections After Expenses'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'التحصيلات المؤكدة − المصروفات المعتمدة' : 'Confirmed Collections − Approved OpEx'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl shrink-0 ${
                  financialSummary.netStatus === 'positive'
                    ? 'bg-emerald-100 text-emerald-800'
                    : financialSummary.netStatus === 'negative'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {financialSummary.netStatus === 'positive' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                  ) : financialSummary.netStatus === 'negative' ? (
                    <TrendingDown className="w-5 h-5 text-rose-700" />
                  ) : (
                    <Scale className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className={`text-xl font-black tabular-nums flex items-baseline gap-1 ${
                  financialSummary.netCollectionsEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  <span>{financialSummary.netCollectionsEGP.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                </div>
                <div className={`text-sm font-black mt-0.5 flex items-baseline gap-1 tabular-nums ${
                  financialSummary.netCollectionsUSD >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  <span dir="ltr">USD ${financialSummary.netCollectionsUSD.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    financialSummary.netStatus === 'positive' ? 'text-emerald-700' : financialSummary.netStatus === 'negative' ? 'text-rose-700' : 'text-slate-500'
                  }`}>
                    <span>
                      {financialSummary.netStatus === 'positive'
                        ? (isRtl ? 'فائض تشغيلي إيجابي' : 'Operating Surplus')
                        : financialSummary.netStatus === 'negative'
                        ? (isRtl ? 'عجز تشغيلي مؤقت' : 'Deficit')
                        : (isRtl ? 'متوازن' : 'Balanced')}
                    </span>
                  </span>
                  <span className="tabular-nums font-bold text-slate-600">
                    {financialSummary.netMarginPercentage}% {isRtl ? 'هامش' : 'margin'}
                  </span>
                </div>

                {/* Bottom slate card matching the reference screenshot */}
                <div className="text-[10px] text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600">{isRtl ? 'المعادل الإجمالي:' : 'Consolidated Total:'}</span>
                    <span dir="ltr" className={`tabular-nums font-bold ${financialSummary.totalNetCollectionsInEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {Math.round(financialSummary.totalNetCollectionsInEGP).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{isRtl ? 'الرصيد النقدي الفعلي بالخزينة:' : 'Net Cash Available:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-bct-navy">
                      {Math.round(financialSummary.totalNetCashInEGP).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric 4: Operational Capacity */}
          {canViewCapacityUtilization && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[235px] flex flex-col justify-between hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-500 block leading-tight">
                    {isRtl ? 'استغلال الطاقة الاستيعابية' : 'Capacity Utilization'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'اللحظة الراهنة • موسم 2026/2027' : 'Live Status • Season 2026/2027'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl shrink-0 ${
                  capacityUtilizationPct > 85 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-bct-navy'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-black text-slate-800 tabular-nums">
                    {capacityUtilizationPct}%
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    capacityBreakdown.is_over_capacity
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : capacityBreakdown.available_capacity < 100
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {capacityBreakdown.is_over_capacity
                      ? (isRtl ? 'تجاوز السقف' : 'Over Limit')
                      : (isRtl ? 'ضمن السقف الآمن' : 'Capacity Safe')}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  ({capacityBreakdown.committed_capacity.toLocaleString()} / {capacityBreakdown.approved_capacity.toLocaleString()} {isRtl ? 'ملف' : 'files'})
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityUtilizationPct > 90
                        ? 'bg-rose-500'
                        : capacityUtilizationPct > 75
                        ? 'bg-amber-500'
                        : 'bg-bct-navy'
                    }`}
                    style={{ width: `${Math.min(100, capacityUtilizationPct)}%` }}
                  />
                </div>

                {/* Bottom slate card matching the reference screenshot */}
                <div className="text-[10px] text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600">{isRtl ? 'الطاقة المتاحة:' : 'Available:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-emerald-600">
                      {capacityBreakdown.available_capacity.toLocaleString()} {isRtl ? 'ملف' : 'files'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{isRtl ? 'ملفات العمليات النشطة:' : 'Active Pipeline:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-sky-600">
                      {capacityBreakdown.active_pipeline_files_count} {isRtl ? 'ملف نشط' : 'files'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric 5: Lead Conversion */}
          {canViewConversionRate && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[235px] flex flex-col justify-between hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-500 block leading-tight">
                    {isRtl ? 'معدل التحويل (استفسار ← تسجيل)' : 'Lead Conversion Rate'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'كفاءة تحويل الاستفسارات لملفات مسددة' : 'Inquiry to Qualified Registration'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-black text-slate-800 tabular-nums">
                    {totalInquiriesCount === 0 ? 'N/A' : `${inquiryToRegRate}%`}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    totalInquiriesCount === 0
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : inquiryToRegRate >= 25
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {totalInquiriesCount === 0
                      ? (isRtl ? 'لا توجد بيانات' : 'N/A')
                      : inquiryToRegRate >= 25
                      ? (isRtl ? 'مستوفٍ للمستهدف' : 'On Target')
                      : (isRtl ? 'أقل من المستهدف' : 'Below Target')}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  ({registeredCount} / {totalInquiriesCount} {isRtl ? 'ملف' : 'files'})
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      inquiryToRegRate >= 25 ? 'bg-indigo-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, inquiryToRegRate)}%` }}
                  />
                </div>

                {/* Bottom slate card matching the reference screenshot */}
                <div className="text-[10px] text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600">{isRtl ? 'تسجيلات مؤهلة:' : 'Qualified Reg:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-indigo-600">
                      {registeredCount} {isRtl ? 'ملف' : 'files'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{isRtl ? 'المستهدف المؤسسي:' : 'Benchmark:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-slate-700">
                      ≥ 25%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metric 6: Quality & SLA Compliance */}
          {canViewSlaCompliance && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-h-[235px] flex flex-col justify-between hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-500 block leading-tight">
                    {isRtl ? 'الالتزام باتفاقيات الخدمة (SLA)' : 'SLA Compliance'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-tight">
                    {isRtl ? 'مؤشر جودة الالتزام بالمواعيد المحددة' : 'Operational Delivery On-Time Rate'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl shrink-0 ${
                  overdueOpenTasks.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-xl font-black text-slate-800 tabular-nums">
                    {completedTasks.length === 0 ? (isRtl ? 'لا توجد بيانات' : 'N/A') : `${slaCompliance}%`}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    completedTasks.length === 0
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : overdueOpenTasks.length > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {completedTasks.length === 0
                      ? (isRtl ? 'لا توجد بيانات كافية' : 'N/A')
                      : overdueOpenTasks.length > 0
                      ? (isRtl ? `${overdueOpenTasks.length} مهام متأخرة` : `${overdueOpenTasks.length} Overdue`)
                      : (isRtl ? 'منضبط بالكامل' : 'Compliant')}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  ({tasksCompletedWithinSLA.length} / {completedTasks.length || 1} {isRtl ? 'مهمة' : 'tasks'})
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      overdueOpenTasks.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${completedTasks.length === 0 ? 0 : slaCompliance}%` }}
                  />
                </div>

                {/* Bottom slate card matching the reference screenshot */}
                <div className="text-[10px] text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-600">{isRtl ? 'مهام متأخرة مفتوحة:' : 'Overdue Open Tasks:'}</span>
                    <span dir="ltr" className={`tabular-nums font-bold ${overdueOpenTasks.length > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                      {overdueOpenTasks.length} {isRtl ? 'مهام' : 'tasks'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{isRtl ? 'شكاوى مفتوحة:' : 'Open Complaints:'}</span>
                    <span dir="ltr" className="tabular-nums font-bold text-slate-700">
                      {openComplaints.length} {isRtl ? 'شكاوى' : 'complaints'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Deep Dive Cards */}
      {(canViewEmergencyReserve || canViewStagePipeline || canView90DayRoadmap || canViewMarketingGate) && (
        <div className={`grid grid-cols-1 ${(canViewEmergencyReserve || canViewStagePipeline) && (canView90DayRoadmap || canViewMarketingGate) ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
          {/* Left Column (2 spans): Emergency Reserve & Conversion Funnel */}
          {(canViewEmergencyReserve || canViewStagePipeline) && (
            <div className={`${(canView90DayRoadmap || canViewMarketingGate) ? 'lg:col-span-2' : ''} space-y-6`}>
              {/* Emergency Reserve & Solvency Guard */}
              {canViewEmergencyReserve && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {isRtl ? 'صندوق الطوارئ واحتياطي السيولة المؤسسي' : 'Emergency Reserve & Financial Buffer'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {isRtl ? 'تغطية مصاريف التشغيل لـ 3 أشهر بدون إيرادات جديدة' : '3-Month OpEx coverage target'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                      {reserveRatio}% {isRtl ? 'مكتمل' : 'Funded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl mb-4">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">{isRtl ? 'الرصيد المخصص الحالي' : 'Allocated Reserve'}</span>
                      <div className="text-lg font-bold text-slate-800 tabular-nums flex items-baseline gap-1">
                        <span dir="ltr">{Math.round(currentEmergencyReserve).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">{isRtl ? 'الهدف المالي المطلوب' : 'Target Threshold'}</span>
                      <div className="text-lg font-bold text-bct-navy tabular-nums flex items-baseline gap-1">
                        <span dir="ltr">{targetEmergencyReserve.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">{isRtl ? 'المتبقي للاكتمال' : 'Deficit / Surplus'}</span>
                      <div className="text-lg font-bold text-amber-600 tabular-nums flex items-baseline gap-1">
                        <span dir="ltr">{Math.max(0, remainingEmergencyReserve).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-500 font-sans">{isRtl ? 'ج.م' : 'EGP'}</span>
                      </div>
                    </div>
                  </div>

                  {periodEmergencyAllocation > 0 && (
                    <div className="mb-3 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <span>{isRtl ? 'مساهمة التحصيلات المؤكدة في الفترة المحددة:' : 'Period Confirmed Collections Contribution:'}</span>
                      <span dir="ltr" className="font-bold tabular-nums">
                        +{Math.round(periodEmergencyAllocation).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'} (35%)
                      </span>
                    </div>
                  )}

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${reserveRatio}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {isRtl
                      ? 'وفقاً لسياسة الشركة المالية: يُحظر السحب من هذا الصندوق إلا بقرار خطي معتمد من المدير العام في حالات الطوارئ القصوى.'
                      : 'BCT Policy: Withdrawals from the reserve require formal written GM authorization for emergencies only.'}
                  </p>
                </div>
              )}

              {/* Student Lifecycle Pipeline Status Breakdown (The 10 Official Stages) */}
              {canViewStagePipeline && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm md:text-base">
                        {isRtl ? 'توزيع الملفات النشطة عبر مسار العمليات (10 مراحل)' : 'Active Files across the 10-Stage Pipeline'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isRtl ? 'العدد الفعلي للملفات النشطة من المرحلة #1 إلى #10 • انقر على أي مرحلة لعرضها في مسار العمليات' : 'Actual active files from stage #1 to #10 • Click any stage card to filter in pipeline'}
                      </p>
                    </div>
                    <Link
                      to="/pipeline"
                      onClick={() => navigate('/pipeline')}
                      className="text-xs font-bold text-bct-navy hover:text-blue-800 hover:underline flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200/50 transition-all cursor-pointer group shadow-2xs"
                      title={isRtl ? 'عرض لوحة مراحل دورة حياة الملف الكاملة' : 'View Full File Lifecycle Pipeline'}
                    >
                      <span>{isRtl ? 'عرض لوحة المراحل الكاملة ←' : 'View Full Pipeline →'}</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {LIFECYCLE_STAGE_DEFINITIONS.map(stage => {
                      const count = activeStageCounts[stage.key] || 0;
                      return (
                        <div
                          key={stage.key}
                          onClick={() => navigate(`/pipeline?stage=${stage.key}`)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:scale-[1.02] select-none ${stage.bg_color} ${stage.border_color}`}
                          title={isRtl ? `انقر لعرض وتصفية ملفات مرحلة ${stage.name_ar} (#${stage.number})` : `Click to view files in stage ${stage.name_en} (#${stage.number})`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded font-extrabold bg-white/90 text-slate-700 shadow-2xs border border-slate-200/60">
                              {stage.stageNumber}
                            </span>
                            <span className={`text-xl font-black ${stage.color}`}>
                              {count}
                            </span>
                          </div>

                          <div className="mt-2">
                            <div className="text-xs font-bold text-slate-800 line-clamp-1">
                              {isRtl ? stage.name_ar : stage.name_en}
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                              {stage.key}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column: Strategic Alignment & Roadmap */}
          {(canView90DayRoadmap || canViewMarketingGate) && (
            <div className="space-y-6">
              {/* 90-Day Roadmap Progress */}
              {canView90DayRoadmap && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">
                      {isRtl ? 'خطة الـ 90 يوماً المؤسسية' : '90-Day Master Roadmap'}
                    </h3>
                    <span className="px-2 py-0.5 bg-bct-navy/10 text-bct-navy rounded text-xs font-bold">
                      {roadmapProgress}%
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Phase 1 */}
                    <div className="border-r-2 rtl:border-r-2 ltr:border-l-2 border-emerald-500 rtl:pr-3 ltr:pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700">
                          {isRtl ? 'المرحلة 1: التأسيس والتنظيم (اليوم 1-30)' : 'Phase 1: Foundation (Day 1-30)'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">100%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {isRtl ? 'اعتماد الهيكل، تفعيل البوابة، وحصر جميع الملفات النشطة' : 'Org structure approved, portal launched, all active files inventoried'}
                      </p>
                    </div>

                    {/* Phase 2 */}
                    <div className="border-r-2 rtl:border-r-2 ltr:border-l-2 border-bct-navy rtl:pr-3 ltr:pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-bct-navy">
                          {isRtl ? 'المرحلة 2: التدريب والضبط (اليوم 31-60)' : 'Phase 2: Training & Control (Day 31-60)'}
                        </span>
                        <span className="text-[10px] font-semibold text-bct-navy bg-bct-navy/10 px-2 py-0.5 rounded">70%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {isRtl ? 'تطبيق اتفاقيات الخدمة، ضبط بوابة التحصيل، وتعيين البدلاء المؤهلين' : 'SLAs enforced, payment clearance gated, backup roles trained'}
                      </p>
                    </div>

                    {/* Phase 3 */}
                    <div className="border-r-2 rtl:border-r-2 ltr:border-l-2 border-slate-300 rtl:pr-3 ltr:pl-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">
                          {isRtl ? 'المرحلة 3: التقييم والتحسين (اليوم 61-90)' : 'Phase 3: Review & Scale (Day 61-90)'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">25%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {isRtl ? 'مراجعة مؤشرات الأداء ربع السنوية وتحديث مصفوفة RACI' : 'Quarterly KPI appraisal and RACI matrix refinement'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Campaigns & Capacity Clearance */}
              {canViewMarketingGate && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-3">
                    {isRtl ? 'حملات التسويق وبوابة الطاقة' : 'Marketing & Capacity Gate'}
                  </h3>
                  <div className="space-y-3">
                    {campaigns.map(camp => (
                      <div key={camp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{camp.name}</span>
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${camp.ops_capacity_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {camp.ops_capacity_approved ? (isRtl ? 'معتمدة تشغيلياً' : 'Capacity Cleared') : (isRtl ? 'في انتظار الإذن' : 'Pending Gate')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-slate-500">
                          <span>{camp.target_country}</span>
                          <span className="font-semibold text-slate-700">{camp.budget_amount.toLocaleString()} {camp.currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
