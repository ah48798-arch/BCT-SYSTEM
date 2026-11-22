import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  Campaign,
  CampaignStatus,
  CapacityBreakdown,
  CapacitySettings,
  CapacityAdjustment
} from '../types/database.types';
import {
  Gauge,
  Plus,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Globe,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Filter,
  BarChart2,
  Layers,
  X,
  Users,
  Settings,
  Calendar,
  Clock,
  History,
  FileText,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Info,
  Check,
  Edit2,
  Megaphone,
  Search
} from 'lucide-react';

export const CapacityGateCenter: React.FC = () => {
  const { isRtl, language } = useLanguage();
  const { currentEmployee, hasPermission, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const canApproveGate = isSuperAdmin || hasPermission('campaigns:approve');
  const canRejectGate = isSuperAdmin || hasPermission('campaigns:reject');
  const canManageCapacity = isSuperAdmin || hasPermission('settings:edit');

  const [campaigns, setCampaigns] = useState<Campaign[]>(bctStore.getCampaigns());
  const [files, setFiles] = useState(bctStore.getStudentFiles());
  const [capacitySettings, setCapacitySettings] = useState<CapacitySettings>(bctStore.getCapacitySettings());

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'cleared' | 'rejected' | 'adjustment_required'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Review modal actions state
  const [reviewAction, setReviewAction] = useState<'view' | 'reject' | 'request_adjustment' | 'cancel'>('view');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Settings & Adjustment Form
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_slots: 10,
    reason: '',
  });
  const [baseCapacityInput, setBaseCapacityInput] = useState<number>(60);
  const [periodInput, setPeriodInput] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = bctStore.subscribe(() => {
      setCampaigns([...bctStore.getCampaigns()]);
      setFiles([...bctStore.getStudentFiles()]);
      const s = bctStore.getCapacitySettings();
      setCapacitySettings(s);
      setBaseCapacityInput(s.base_capacity);
      setPeriodInput(s.period);
    });
    return () => unsub();
  }, []);

  // Live General Capacity Breakdown
  const generalBreakdown: CapacityBreakdown = useMemo(() => {
    return bctStore.getCapacityBreakdown();
  }, [campaigns, files, capacitySettings]);

  // Breakdown for the currently reviewed campaign
  const modalBreakdown: CapacityBreakdown = useMemo(() => {
    if (!selectedCampaign) return generalBreakdown;
    return bctStore.getCapacityBreakdown(selectedCampaign.id, selectedCampaign.expected_registrations);
  }, [selectedCampaign, campaigns, files, capacitySettings, generalBreakdown]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (filterStatus === 'pending' && c.status !== 'pending_approval') return false;
      if (filterStatus === 'cleared' && (!c.ops_capacity_approved || c.status !== 'approved')) return false;
      if (filterStatus === 'rejected' && c.status !== 'rejected') return false;
      if (filterStatus === 'adjustment_required' && c.status !== 'adjustment_required') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchCode = c.campaign_code?.toLowerCase().includes(q);
        const matchChannel = c.channel?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchChannel) return false;
      }
      return true;
    });
  }, [campaigns, filterStatus, searchQuery]);

  // Gate Check Handlers
  const handleOpenGateModal = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setReviewAction('view');
    setRejectionReason('');
    setAdjustmentNotes('');
    setCancelReason('');
    setActionError(null);
    setIsGateModalOpen(true);
  };

  const isSelfApprovalBlocked = (camp: Campaign): boolean => {
    if (isSuperAdmin) return false;
    if (!currentEmployee) return false;
    if (camp.owner_id === currentEmployee.id) return true;
    if (camp.owner_name && camp.owner_name.includes(currentEmployee.full_name_ar)) return true;
    if ((currentEmployee.department_id === 'mkt' || (currentEmployee as any).department === 'marketing') && !isSuperAdmin) return true;
    return false;
  };

  const handleApproveGate = () => {
    if (!selectedCampaign) return;

    if (isSelfApprovalBlocked(selectedCampaign)) {
      setActionError(
        isRtl
          ? 'لا يجوز لمسؤول التسويق اعتماد طلبه بنفسه؛ يلزم موافقة مدير العمليات أو الإدارة العليا'
          : 'Marketing owners cannot approve their own requests'
      );
      return;
    }

    const result = bctStore.approveCapacityGate(
      selectedCampaign.id,
      true,
      currentEmployee?.username || 'ops',
      currentEmployee?.id || 'emp-002',
      undefined,
      currentEmployee?.full_name_ar || 'أحمد إبراهيم'
    );

    if (result && result.success) {
      setIsGateModalOpen(false);
      setFeedback({
        type: 'success',
        text: isRtl
          ? 'تم اعتماد الطاقة الاستيعابية وحجز الملفات وتفعيل الحملة رسمياً!'
          : 'Capacity Gate approved. Campaign is now ACTIVE.'
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setActionError(result?.message || (isRtl ? 'فشل اعتماد الحملة' : 'Failed to approve campaign'));
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      setActionError(
        isRtl
          ? 'يرجى كتابة سبب الرفض التشغيلي الإلزامي لإبلاغ فريق التسويق'
          : 'Please provide a mandatory reason for rejection'
      );
      return;
    }
    if (!selectedCampaign) return;

    const result = bctStore.rejectCapacityGate(
      selectedCampaign.id,
      rejectionReason.trim(),
      currentEmployee?.username || 'ops',
      currentEmployee?.id || 'emp-002',
      currentEmployee?.full_name_ar || 'أحمد إبراهيم'
    );

    if (result.success) {
      setIsGateModalOpen(false);
      setFeedback({
        type: 'error',
        text: isRtl
          ? 'تم رفض إطلاق الحملة وتسجيل السبب التشغيلي في سجل التدقيق'
          : 'Capacity Gate rejected. Reason recorded in audit log.'
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setActionError(result.message);
    }
  };

  const handleConfirmRequestAdjustment = () => {
    if (!adjustmentNotes.trim()) {
      setActionError(
        isRtl
          ? 'يرجى توضيح التعديلات المطلوبة (مثال: تقليص الملفات المتوقعة أو تغيير الموعد)'
          : 'Please specify required revisions'
      );
      return;
    }
    if (!selectedCampaign) return;

    const result = bctStore.requestCapacityAdjustment(
      selectedCampaign.id,
      adjustmentNotes.trim(),
      currentEmployee?.username || 'ops',
      currentEmployee?.id || 'emp-002',
      currentEmployee?.full_name_ar || 'أحمد إبراهيم'
    );

    if (result.success) {
      setIsGateModalOpen(false);
      setFeedback({
        type: 'success',
        text: isRtl ? 'تم إرسال طلب تعديل السقف لفريق التسويق' : 'Capacity revision request sent to Marketing'
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setActionError(result.message);
    }
  };

  const handleSaveBaseCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    bctStore.updateCapacitySettings(
      Number(baseCapacityInput),
      periodInput,
      currentEmployee?.username || 'ops'
    );
    setFeedback({
      type: 'success',
      text: isRtl ? 'تم حفظ السقف الاستيعابي الأساسي بنجاح' : 'Base capacity updated successfully'
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.reason.trim()) return;

    bctStore.addCapacityAdjustment(
      Number(adjustmentForm.adjustment_slots),
      adjustmentForm.reason.trim(),
      capacitySettings.period,
      currentEmployee?.username || 'ops',
      currentEmployee?.id || 'emp-002',
      currentEmployee?.full_name_ar || 'أحمد إبراهيم'
    );

    setAdjustmentForm({ adjustment_slots: 10, reason: '' });
    setFeedback({
      type: 'success',
      text: isRtl ? 'تم تسجيل وتوثيق تعديل الطاقة الاستيعابية بنجاح' : 'Capacity adjustment recorded successfully'
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Status Helpers
  const getCapacityGateStatusBadge = (camp: Campaign) => {
    if (camp.ops_capacity_approved && camp.status === 'approved') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: isRtl ? 'معتمد تشغيلياً' : 'Approved Gate',
        icon: ShieldCheck
      };
    }
    if (camp.status === 'rejected') {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        label: isRtl ? 'مرفوض تشغيلياً' : 'Rejected',
        icon: XCircle
      };
    }
    if (camp.status === 'adjustment_required') {
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        label: isRtl ? 'يلزم تعديل السقف' : 'Revision Required',
        icon: AlertTriangle
      };
    }
    if (camp.status === 'draft') {
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        label: isRtl ? 'مسودة' : 'Draft',
        icon: FileText
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      label: isRtl ? 'بانتظار إذن العمليات' : 'Pending Gate',
      icon: Clock
    };
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 ${
          feedback.type === 'success' ? 'bg-emerald-500 text-white shadow-md' : 'bg-rose-500 text-white shadow-md'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRtl ? 'بوابة الطاقة التشغيلية' : 'Operational Capacity Gate'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'حوكمة الطاقة التشغيلية وفق قاعدة التداخل 4 – التحقق من السقف الاستيعابي قبل إطلاق أي حملة تسويقية'
                  : 'Operational Capacity Governance & Overlap Rule 4 – Verify workload limits before campaign release'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Link to Marketing Management */}
          <Link
            to="/marketing"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
          >
            <Megaphone className="w-4 h-4 text-bct-navy" />
            <span>{isRtl ? 'إدارة الحملات والتسويق' : 'Marketing & Campaigns'}</span>
          </Link>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-bct-navy text-white rounded-xl text-xs font-bold hover:bg-bct-navy/90 shadow-sm transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>{isRtl ? 'إعدادات الطاقة والتعديلات' : 'Capacity Settings & Adjustments'}</span>
          </button>
        </div>
      </div>

      {/* Requirement 1: Overlap Rule 4 Compliance Banner */}
      <div className="bg-gradient-to-r from-bct-navy via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-bold border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isRtl ? 'قاعدة التداخل 4 (الموافقة المسبقة للطاقة التشغيلية)' : 'Overlap Rule 4: Mandatory Operational Pre-Approval'}</span>
            </div>
            <h2 className="text-base font-black text-white leading-snug">
              {isRtl
                ? 'لا يجوز لإدارة التسويق إطلاق أي حملة إعلانية أو استقطاب طلاب جدد قبل موافقة رسمية من العمليات'
                : 'Marketing cannot launch ad campaigns without approved operational clearance'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isRtl
                ? 'وفق الدليل التنظيمي المعتمد لشركة BCT: تتحقق هذه البوابة الرقمية من توافق الميزانيات والتسجيلات المستهدفة مع طاقة موظفي المتابعة والتنسيق، لمنع التكدس وتأخر استخراج الشهادات والتأشيرات.'
                : 'Enforces institutional intake ceilings before marketing spend, ensuring zero overload on university admission coordinators.'}
            </p>
          </div>

          {/* Live Capacity State Pill */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[11px] text-slate-300 font-medium">{isRtl ? 'مؤشر الجاهزية التشغيلية:' : 'Live Readiness Status:'}</span>
            <div className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 border ${
              generalBreakdown.is_over_capacity
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : generalBreakdown.available_capacity < 10
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                generalBreakdown.is_over_capacity ? 'bg-rose-400 animate-pulse' : generalBreakdown.available_capacity < 10 ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span>
                {generalBreakdown.is_over_capacity
                  ? (isRtl ? 'تجاوز السقف التشغيلي!' : 'Over Capacity Warning!')
                  : generalBreakdown.available_capacity < 10
                  ? (isRtl ? 'اقتراب من السقف الاستيعابي' : 'Capacity Caution')
                  : (isRtl ? 'ضمن السقف الآمن' : 'Capacity Safe')}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {isRtl ? `الفترة: ${capacitySettings.period}` : `Season: ${capacitySettings.period}`}
            </span>
          </div>
        </div>

        {/* 4 Interactive Capacity Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-300 block font-semibold">
              {isRtl ? 'الطاقة المعتمدة (Approved)' : 'Approved Intake'}
            </span>
            <div className="text-xl font-black text-white mt-1">
              {generalBreakdown.approved_capacity} <span className="text-xs font-normal text-slate-300">{isRtl ? 'ملف' : 'files'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {isRtl ? `الأساس: ${generalBreakdown.base_capacity} + تعديلات: ${generalBreakdown.total_adjustments}` : `Base: ${generalBreakdown.base_capacity} + Adj: ${generalBreakdown.total_adjustments}`}
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-300 block font-semibold">
              {isRtl ? 'المحجوز والملتزم به (Committed)' : 'Committed Registrations'}
            </span>
            <div className="text-xl font-black text-amber-400 mt-1">
              {generalBreakdown.committed_capacity} <span className="text-xs font-normal text-slate-300">{isRtl ? 'ملف' : 'files'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {generalBreakdown.active_approved_campaigns_count} {isRtl ? 'حملات نشطة تحجز ملفات' : 'active campaigns reserving files'}
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-300 block font-semibold">
              {isRtl ? 'الملفات المتاحة (Available)' : 'Available Files'}
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {generalBreakdown.available_capacity} <span className="text-xs font-normal text-slate-300">{isRtl ? 'ملف' : 'files'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {isRtl ? 'متاح للموافقة على حملات جديدة' : 'Available for new campaign clearance'}
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-sky-300 block font-semibold">
              {isRtl ? 'ملفات العمليات النشطة' : 'Active Pipeline Files'}
            </span>
            <div className="text-xl font-black text-sky-400 mt-1">
              {generalBreakdown.active_pipeline_files_count} <span className="text-xs font-normal text-slate-300">{isRtl ? 'ملف نشط' : 'active files'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {isRtl ? 'قيد المعالجة المباشرة بالمكاتب' : 'Currently active in operational pipeline'}
            </span>
          </div>
        </div>

        {/* Real-time Utilization Bar */}
        {(() => {
          const utilPct = generalBreakdown.utilization_rate_pct ?? (generalBreakdown.approved_capacity > 0 ? Math.round((generalBreakdown.committed_capacity / generalBreakdown.approved_capacity) * 100) : 0);
          return (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>{isRtl ? 'نسبة استغلال الطاقة المعتمدة (Capacity Utilization):' : 'Intake Utilization Rate:'}</span>
                <span className="tabular-nums font-bold text-white">{utilPct}%</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    utilPct > 95
                      ? 'bg-rose-500'
                      : utilPct > 75
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, utilPct)}%` }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filter and Queue Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'all' ? 'bg-bct-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'كل الحملات في البوابة' : 'All Campaigns'} ({campaigns.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'بانتظار إذن العمليات' : 'Pending Ops Clearance'} ({campaigns.filter(c => c.status === 'pending_approval').length})
          </button>
          <button
            onClick={() => setFilterStatus('cleared')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'معتمدة تشغيلياً' : 'Ops Cleared'} ({campaigns.filter(c => c.ops_capacity_approved).length})
          </button>
          <button
            onClick={() => setFilterStatus('adjustment_required')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'adjustment_required' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'يلزم تعديل السقف' : 'Needs Revision'} ({campaigns.filter(c => c.status === 'adjustment_required').length})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'مرفوضة تشغيلياً' : 'Rejected'} ({campaigns.filter(c => c.status === 'rejected').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث باسم الحملة أو الكود أو القناة...' : 'Search campaigns...'}
            className="w-full ps-9 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-bct-navy"
          />
        </div>
      </div>

      {/* Campaigns Gate Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Gauge className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            {isRtl ? 'لا توجد حملات تطابق حالة التصفية المحددة' : 'No campaigns in this queue view'}
          </h3>
          <p className="text-xs text-slate-500">
            {isRtl ? 'حدد تصفية أخرى أو راجع إدارة الحملات التسويقية' : 'Choose another status filter or visit Marketing'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map(camp => {
            const badge = getCapacityGateStatusBadge(camp);
            const BadgeIcon = badge.icon;
            const isPending = camp.status === 'pending_approval';

            return (
              <div
                key={camp.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {camp.campaign_code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {camp.name}
                  </h3>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-bold text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.2 rounded">
                      {camp.channel}
                    </span>
                    <span>•</span>
                    <span>{isRtl ? `المسؤول: ${camp.owner_name}` : `Owner: ${camp.owner_name}`}</span>
                  </div>
                </div>

                {/* Workload & Budget Breakdown */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'الميزانية الإعلانية:' : 'Budget:'}</span>
                    <span className="font-black text-bct-navy tabular-nums">
                      {camp.budget_amount.toLocaleString()} {camp.currency}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">{isRtl ? 'الاستفسارات المتوقعة (Leads):' : 'Expected Leads:'}</span>
                    <span className="font-bold text-indigo-700">{camp.target_leads || 50} {isRtl ? 'استفسار' : 'leads'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-700 font-bold">{isRtl ? 'الملفات المحجوزة (Capacity):' : 'Reserved Files:'}</span>
                    <span className="font-black text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                      {camp.expected_registrations || 10} {isRtl ? 'ملف حجز' : 'files reservation'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400">{isRtl ? 'الفترة التشغيلية:' : 'Schedule:'}</span>
                    <span className="font-mono text-slate-600">{camp.start_date} → {camp.end_date}</span>
                  </div>
                </div>

                {/* Operational Review Status Note */}
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  camp.ops_capacity_approved
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : camp.status === 'rejected'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : camp.status === 'adjustment_required'
                    ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                    : camp.status === 'draft'
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-bct-navy" />
                  <div className="min-w-0 flex-1 text-[11px] leading-relaxed">
                    {camp.ops_capacity_approved ? (
                      <span>{isRtl ? `حجز معتمد لـ ${camp.expected_registrations} ملف في سجل الطاقة التشغيلية` : `Approved reservation for ${camp.expected_registrations} files`}</span>
                    ) : camp.status === 'rejected' ? (
                      <span>{isRtl ? `سبب الرفض: ${camp.rejection_reason || 'طاقة العمليات غير كافية'}` : `Reason: ${camp.rejection_reason}`}</span>
                    ) : camp.status === 'adjustment_required' ? (
                      <span>{isRtl ? `ملاحظة العمليات: ${camp.adjustment_notes || 'يلزم تعديل التقديرات'}` : `Notes: ${camp.adjustment_notes}`}</span>
                    ) : (
                      <span>{isRtl ? 'بانتظار إجراء الفحص التشغيلي والمطابقة مع الطاقة المتاحة' : 'Awaiting operational capacity review'}</span>
                    )}
                  </div>
                </div>

                {/* Main Action Button: Check Capacity Gate */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenGateModal(camp)}
                    className="w-full py-2.5 px-4 bg-bct-navy hover:bg-bct-navy/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? 'فحص بوابة الطاقة التشغيلية' : 'Check Capacity Gate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REQUIREMENT 1, 2, 3, 4: CAPACITY REVIEW MODAL */}
      {isGateModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isRtl ? 'فحص بوابة الطاقة التشغيلية للحملة' : 'Operational Capacity Gate Review'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedCampaign.campaign_code} • {selectedCampaign.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsGateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Campaign Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'القناة الإعلانية:' : 'Channel:'}</span>
                <span className="font-bold text-slate-800 uppercase">{selectedCampaign.channel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'المسؤول:' : 'Owner:'}</span>
                <span className="font-bold text-slate-800">{selectedCampaign.owner_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'السوق المستهدف:' : 'Target Country:'}</span>
                <span className="font-bold text-slate-800">{selectedCampaign.target_country}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'الميزانية:' : 'Budget:'}</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {selectedCampaign.budget_amount.toLocaleString()} {selectedCampaign.currency}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{isRtl ? 'الفترة:' : 'Dates:'}</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">
                  {selectedCampaign.start_date} → {selectedCampaign.end_date}
                </span>
              </div>
            </div>

            {/* Inquiries vs Registrations Distinction */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-bct-navy shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-bct-navy block text-xs">
                  {isRtl ? 'التمييز بين الاستفسارات والتسجيلات التشغيلية' : 'Inquiries vs Operational Registrations Distinction'}
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isRtl
                    ? `الاستفسارات المتوقعة (${selectedCampaign.target_leads || 50} استفسار) تمثل إقبالاً تسويقياً أولياً، بينما حجز الطاقة الاستيعابية يحسب حصراً على عدد الطلاب المتوقع تسجيلهم (${selectedCampaign.expected_registrations} ملف)، لمنع حجز الملفات ببيانات غير واقعية.`
                    : `Projected inquiries (${selectedCampaign.target_leads}) represent marketing leads, whereas operational capacity reservation is strictly calculated on expected student registrations (${selectedCampaign.expected_registrations} files).`}
                </p>
              </div>
            </div>

            {/* Centralized Capacity Calculation Breakdown Table */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-bct-navy" />
                  <span>{isRtl ? 'المطابقة الحسابية المركزية للطاقة الاستيعابية' : 'Centralized Capacity Calculation Breakdown'}</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-500">
                  {isRtl ? `الفترة النشطة: ${capacitySettings.period}` : `Season: ${capacitySettings.period}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isRtl ? 'الطاقة المعتمدة:' : 'Approved Capacity:'}</span>
                  <span className="font-black text-slate-800 text-sm">{modalBreakdown.approved_capacity} {isRtl ? 'ملف' : 'files'}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isRtl ? 'المحجوز لحملات أخرى:' : 'Already Committed:'}</span>
                  <span className="font-black text-amber-700 text-sm">{modalBreakdown.committed_capacity} {isRtl ? 'ملف' : 'files'}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isRtl ? 'الطاقة المتاحة الحالية:' : 'Available Capacity:'}</span>
                  <span className="font-black text-emerald-700 text-sm">{modalBreakdown.available_capacity} {isRtl ? 'ملف' : 'files'}</span>
                </div>

                <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200">
                  <span className="text-amber-800 block text-[10px] font-bold">{isRtl ? 'مطلوب لهذه الحملة:' : 'Proposed for Campaign:'}</span>
                  <span className="font-black text-amber-900 text-sm">{selectedCampaign.expected_registrations} {isRtl ? 'ملف' : 'files'}</span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  modalBreakdown.projected_remaining >= 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="block text-[10px] font-bold">{isRtl ? 'المتبقي بعد الاعتماد:' : 'Projected Remaining:'}</span>
                  <span className="font-black text-sm">
                    {modalBreakdown.projected_remaining} {isRtl ? 'ملف' : 'files'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">{isRtl ? 'حالة التوافق:' : 'Capacity Match:'}</span>
                  <span className={`inline-block font-extrabold text-[11px] ${
                    !modalBreakdown.is_over_capacity ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {!modalBreakdown.is_over_capacity
                      ? (isRtl ? 'جاهزية كافية (ضمن السقف)' : 'Capacity Sufficient')
                      : (isRtl ? 'تجاوز السقف التشغيلي' : 'Over Capacity')}
                  </span>
                </div>
              </div>
            </div>

            {/* Over-Capacity Warning Banner */}
            {modalBreakdown.is_over_capacity && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isRtl ? 'تحذير تشغيلي: السقف المتاح لا يسمح باعتماد الحملة' : 'Warning: Capacity Limit Exceeded'}</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed ps-5">
                  {isRtl
                    ? `التسجيلات المتوقعة للحملة (${selectedCampaign.expected_registrations}) تتجاوز الطاقة الاستيعابية المتاحة (${modalBreakdown.available_capacity}) بمقدار ${Math.abs(modalBreakdown.projected_remaining)} ملفاً. تم إيقاف زر الاعتماد تلقائياً لمنع الضغط التشغيلي؛ ويلزم إما تقليص أهداف الحملة أو تسجيل تعديل طاقة استيعابية معتمد من مدير العمليات.`
                    : `The proposed campaign (${selectedCampaign.expected_registrations} files) exceeds available capacity (${modalBreakdown.available_capacity}). Approval is blocked to prevent overbooking.`}
                </p>
              </div>
            )}

            {/* Self-approval prevention notice */}
            {isSelfApprovalBlocked(selectedCampaign) && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isRtl
                    ? 'قاعدة الفصل بين المهام: لا يجوز لمسؤول التسويق اعتماد طلبه بنفسه. يجب الاعتماد بواسطة مدير العمليات.'
                    : 'Separation of duties: Marketing owner cannot approve their own capacity clearance.'}
                </span>
              </div>
            )}

            {/* Previous Review & Audit History Timeline */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <span>{isRtl ? 'سجل القرارات والتدقيق السابق لهذه الحملة' : 'Previous Capacity Review History'}</span>
              </h4>

              {selectedCampaign.review_history && selectedCampaign.review_history.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pe-1">
                  {selectedCampaign.review_history.map(item => (
                    <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.action === 'approve'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.action === 'reject'
                            ? 'bg-rose-100 text-rose-800'
                            : item.action === 'request_adjustment'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {item.action === 'approve' ? (isRtl ? 'اعتماد طاقة' : 'Approved')
                            : item.action === 'reject' ? (isRtl ? 'رفض تشغيلي' : 'Rejected')
                            : item.action === 'request_adjustment' ? (isRtl ? 'طلب تعديل' : 'Revision Requested')
                            : item.action === 'submit' ? (isRtl ? 'إرسال للمراجعة' : 'Submitted')
                            : (isRtl ? 'إلغاء' : 'Cancelled')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900">{item.actor_name}</span> ({item.actor_role}): {item.notes}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                  {isRtl ? 'لا توجد قرارات سابقة مسجلة لهذه الحملة' : 'No previous review history'}
                </div>
              )}
            </div>

            {/* ACTION FORMS */}
            {reviewAction === 'view' && (
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsGateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Reject button */}
                  <button
                    type="button"
                    onClick={() => { setReviewAction('reject'); setActionError(null); }}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition-all"
                  >
                    {isRtl ? 'رفض تشغيلي' : 'Reject'}
                  </button>

                  {/* Request Adjustment */}
                  <button
                    type="button"
                    onClick={() => { setReviewAction('request_adjustment'); setActionError(null); }}
                    className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-bold transition-all"
                  >
                    {isRtl ? 'طلب تعديل السقف' : 'Request Revision'}
                  </button>

                  {/* Approve Gate Button */}
                  <button
                    type="button"
                    disabled={modalBreakdown.is_over_capacity || isSelfApprovalBlocked(selectedCampaign)}
                    onClick={handleApproveGate}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white shadow-sm transition-all ${
                      modalBreakdown.is_over_capacity || isSelfApprovalBlocked(selectedCampaign)
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isRtl ? 'اعتماد الطاقة وحجز الملفات' : 'Approve Capacity Gate'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Form for Rejection */}
            {reviewAction === 'reject' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="font-bold text-rose-700 text-xs">
                  {isRtl ? 'تسجيل رفض تشغيلي رسمي للحملة:' : 'Formal Operational Rejection:'}
                </div>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder={isRtl ? 'سبب الرفض الإلزامي (مثال: جدول التنسيق مكتمل بالكامل ولا طاقة لاستقبال ملفات إضافية)...' : 'Mandatory operational rejection reason...'}
                  className="w-full p-2.5 bg-rose-50/40 border border-rose-300 rounded-xl text-xs focus:bg-white focus:border-rose-500"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewAction('view')}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {isRtl ? 'تراجع' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    {isRtl ? 'تأكيد الرفض التشغيلي' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Form for Requesting Adjustment */}
            {reviewAction === 'request_adjustment' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="font-bold text-purple-700 text-xs">
                  {isRtl ? 'طلب مراجعة أو تعديل السقف الاستيعابي:' : 'Request Capacity Revision / Targets Adjustment:'}
                </div>
                <textarea
                  rows={2}
                  value={adjustmentNotes}
                  onChange={e => setAdjustmentNotes(e.target.value)}
                  placeholder={isRtl ? 'وضح التعديل المطلوب (مثال: تخفيض عدد التسجيلات المتوقعة إلى 8 ملفات أو ترحيل موعد الحملة للأسبوع القادم)...' : 'Specify required revisions for marketing team...'}
                  className="w-full p-2.5 bg-purple-50/40 border border-purple-300 rounded-xl text-xs focus:bg-white focus:border-purple-500"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewAction('view')}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    {isRtl ? 'تراجع' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRequestAdjustment}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    {isRtl ? 'إرسال طلب التعديل للتسويق' : 'Send Revision Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CAPACITY SETTINGS & ADJUSTMENTS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-bct-navy" />
                <span>{isRtl ? 'إعدادات الطاقة الاستيعابية وسجل التعديلات' : 'Capacity Settings & Authorized Adjustments'}</span>
              </h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Form 1: Base Capacity & Period */}
              <form onSubmit={handleSaveBaseCapacity} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs">
                  {isRtl ? 'السقف الاستيعابي الأساسي والفترة التشغيلية' : 'Base Intake Cap & Active Season'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'السقف الاستيعابي الأساسي (ملف) *' : 'Base Intake Capacity (Files) *'}
                    </label>
                    <input
                      type="number"
                      min="10"
                      required
                      value={baseCapacityInput}
                      onChange={e => setBaseCapacityInput(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'الفترة التشغيلية النشطة *' : 'Operational Season / Period *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={periodInput}
                      onChange={e => setPeriodInput(e.target.value)}
                      placeholder="خريف 2026 - الفصل الدراسي الأول"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-bct-navy hover:bg-bct-navy/90 text-white rounded-xl font-bold shadow-xs"
                  >
                    {isRtl ? 'حفظ إعدادات السقف' : 'Save Intake Settings'}
                  </button>
                </div>
              </form>

              {/* Form 2: Add Authorized Adjustment */}
              <form onSubmit={handleAddAdjustment} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-amber-900 text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>{isRtl ? 'تسجيل زيادة أو تعديل استيعابي معتمد' : 'Record Authorized Capacity Adjustment'}</span>
                  </h4>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                    {isRtl ? 'يتطلب موافقة رسمية' : 'Requires Approval'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'مقدار التعديل (ملفات +/-) *' : 'File Adjustment (+/-) *'}
                    </label>
                    <input
                      type="number"
                      required
                      value={adjustmentForm.adjustment_slots}
                      onChange={e => setAdjustmentForm({ ...adjustmentForm, adjustment_slots: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      placeholder="+10 أو -5"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'السبب التشغيلي الإلزامي للتعديل *' : 'Mandatory Adjustment Reason *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={adjustmentForm.reason}
                      onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                      placeholder={isRtl ? 'مثال: تعيين 2 منسقين جدد لمتابعة ملفات الجامعات' : 'e.g. Added 2 admission coordinators'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    {isRtl ? 'توثيق واعتماد التعديل' : 'Record Authorized Adjustment'}
                  </button>
                </div>
              </form>

              {/* Adjustments History */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>{isRtl ? 'سجل التعديلات الاستيعابية المعتمدة' : 'Authorized Adjustments Ledger'}</span>
                </h4>

                {capacitySettings.adjustments && capacitySettings.adjustments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {capacitySettings.adjustments.map(adj => (
                      <div key={adj.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full font-mono font-black text-xs ${
                              adj.adjustment_slots >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {adj.adjustment_slots >= 0 ? `+${adj.adjustment_slots}` : adj.adjustment_slots} {isRtl ? 'ملف' : 'files'}
                            </span>
                            <span className="font-bold text-slate-800">{adj.reason}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{isRtl ? `المعتمد: ${adj.approved_by_name}` : `Approved by: ${adj.approved_by_name}`}</span>
                            <span>•</span>
                            <span className="font-mono">{adj.created_at ? adj.created_at.split('T')[0] : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    {isRtl ? 'لا توجد تعديلات استيعابية إضافية مسجلة' : 'No adjustments recorded'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
