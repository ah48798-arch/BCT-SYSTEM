import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  Campaign,
  CampaignStatus,
} from '../types/database.types';
import {
  Megaphone,
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
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Edit2,
  Search,
  Gauge,
  Send,
  Eye,
  Trash2
} from 'lucide-react';

export const CampaignsManagement: React.FC = () => {
  const { isRtl, language } = useLanguage();
  const { currentEmployee, hasPermission, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const canCreateCampaign = isSuperAdmin || hasPermission('campaigns:create');

  const [campaigns, setCampaigns] = useState<Campaign[]>(bctStore.getCampaigns());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // New Campaign Form State
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    campaign_code: '',
    channel: 'meta' as 'meta' | 'google' | 'tiktok' | 'snapchat' | 'direct',
    target_country: 'السودان',
    target_audience: 'طلاب الثانوية والشهادات المعادلة وأولياء الأمور',
    budget_amount: 50000,
    currency: 'EGP' as 'EGP' | 'USD',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    target_leads: 80,
    expected_registrations: 15,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reactive subscription
  useEffect(() => {
    const unsub = bctStore.subscribe(() => {
      setCampaigns([...bctStore.getCampaigns()]);
    });
    return () => unsub();
  }, []);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (filterStatus === 'approved' && (!c.ops_capacity_approved || c.status !== 'approved')) return false;
      if (filterStatus === 'pending' && c.status !== 'pending_approval') return false;
      if (filterStatus === 'draft' && c.status !== 'draft') return false;
      if (filterStatus === 'rejected' && c.status !== 'rejected') return false;
      if (filterStatus === 'adjustment_required' && c.status !== 'adjustment_required') return false;
      if (filterStatus === 'paused' && c.status !== 'paused') return false;

      if (filterChannel !== 'all' && c.channel !== filterChannel) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchCode = c.campaign_code?.toLowerCase().includes(q);
        const matchCountry = c.target_country?.toLowerCase().includes(q);
        const matchAudience = c.target_audience?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCountry && !matchAudience) return false;
      }
      return true;
    });
  }, [campaigns, filterStatus, filterChannel, searchQuery]);

  // Marketing KPI Aggregates
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'approved' && c.ops_capacity_approved).length;
    const pending = campaigns.filter(c => c.status === 'pending_approval').length;
    const draft = campaigns.filter(c => c.status === 'draft').length;
    const adjustmentRequired = campaigns.filter(c => c.status === 'adjustment_required').length;
    const rejected = campaigns.filter(c => c.status === 'rejected').length;

    const totalEgpBudget = campaigns
      .filter(c => c.currency === 'EGP')
      .reduce((sum, c) => sum + (c.budget_amount || 0), 0);

    const totalUsdBudget = campaigns
      .filter(c => c.currency === 'USD')
      .reduce((sum, c) => sum + (c.budget_amount || 0), 0);

    const totalTargetLeads = campaigns.reduce((sum, c) => sum + (c.target_leads || 0), 0);
    const totalExpectedRegs = campaigns.reduce((sum, c) => sum + (c.expected_registrations || 0), 0);

    return {
      total,
      active,
      pending,
      draft,
      adjustmentRequired,
      rejected,
      totalEgpBudget,
      totalUsdBudget,
      totalTargetLeads,
      totalExpectedRegs
    };
  }, [campaigns]);

  // Channel Distribution Stats
  const channelBreakdown = useMemo(() => {
    const channels = ['meta', 'google', 'tiktok', 'snapchat', 'direct'];
    return channels.map(ch => {
      const chCampaigns = campaigns.filter(c => c.channel === ch);
      const count = chCampaigns.length;
      const budgetEgp = chCampaigns.filter(c => c.currency === 'EGP').reduce((sum, c) => sum + c.budget_amount, 0);
      const budgetUsd = chCampaigns.filter(c => c.currency === 'USD').reduce((sum, c) => sum + c.budget_amount, 0);
      const leads = chCampaigns.reduce((sum, c) => sum + (c.target_leads || 0), 0);
      return {
        id: ch,
        nameAr: ch === 'meta' ? 'ميتا (فيسبوك وانستغرام)' : ch === 'google' ? 'إعلانات جوجل ويوتيوب' : ch === 'tiktok' ? 'تيك توك' : ch === 'snapchat' ? 'سناب شات' : 'تسويق مباشر ومعارض',
        nameEn: ch === 'meta' ? 'Meta (FB & IG)' : ch === 'google' ? 'Google & YouTube' : ch === 'tiktok' ? 'TikTok' : ch === 'snapchat' ? 'Snapchat' : 'Direct & Events',
        count,
        budgetEgp,
        budgetUsd,
        leads
      };
    });
  }, [campaigns]);

  // Actions
  const handleCreateCampaign = (e: React.FormEvent, submitForReview: boolean = false) => {
    e.preventDefault();
    if (!newCampaignData.name.trim()) return;

    const initialStatus: CampaignStatus = submitForReview ? 'pending_approval' : 'draft';

    const created = bctStore.createCampaign({
      name: newCampaignData.name.trim(),
      campaign_code: newCampaignData.campaign_code.trim() || `CMP-${Date.now().toString().slice(-4)}`,
      channel: newCampaignData.channel,
      target_country: newCampaignData.target_country,
      target_audience: newCampaignData.target_audience,
      budget_amount: Number(newCampaignData.budget_amount),
      currency: newCampaignData.currency,
      start_date: newCampaignData.start_date,
      end_date: newCampaignData.end_date,
      target_leads: Number(newCampaignData.target_leads),
      expected_registrations: Number(newCampaignData.expected_registrations),
      status: initialStatus,
      owner_id: currentEmployee?.id || 'emp-008',
      owner_name: currentEmployee?.full_name_ar || 'سارة ممدوح',
      ops_capacity_approved: false
    }, currentEmployee?.username || 'marketing');

    setIsNewModalOpen(false);
    setNewCampaignData({
      name: '',
      campaign_code: '',
      channel: 'meta',
      target_country: 'السودان',
      target_audience: 'طلاب الثانوية والشهادات المعادلة وأولياء الأمور',
      budget_amount: 50000,
      currency: 'EGP',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      target_leads: 80,
      expected_registrations: 15,
    });

    setFeedback({
      type: 'success',
      text: submitForReview
        ? (isRtl ? 'تم إنشاء الحملة وإرسالها مباشرة إلى بوابة الطاقة التشغيلية' : 'Campaign created and submitted to Operational Capacity Gate')
        : (isRtl ? 'تم حفظ الحملة كمسودة بنجاح' : 'Campaign created as draft')
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign({ ...camp });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent, submitForReview: boolean = false) => {
    e.preventDefault();
    if (!editingCampaign) return;

    bctStore.updateCampaign(
      editingCampaign.id,
      {
        name: editingCampaign.name,
        channel: editingCampaign.channel,
        target_country: editingCampaign.target_country,
        target_audience: editingCampaign.target_audience,
        budget_amount: Number(editingCampaign.budget_amount),
        currency: editingCampaign.currency,
        start_date: editingCampaign.start_date,
        end_date: editingCampaign.end_date,
        target_leads: Number(editingCampaign.target_leads),
        expected_registrations: Number(editingCampaign.expected_registrations),
      },
      currentEmployee?.username || 'marketing'
    );

    if (submitForReview) {
      bctStore.submitCampaignForApproval(
        editingCampaign.id,
        'إعادة تقديم الحملة بعد مراجعة وتعديل التقديرات',
        currentEmployee?.username || 'marketing',
        currentEmployee?.id || 'emp-008',
        currentEmployee?.full_name_ar || 'سارة ممدوح'
      );
    }

    setIsEditModalOpen(false);
    setEditingCampaign(null);
    setFeedback({
      type: 'success',
      text: submitForReview
        ? (isRtl ? 'تم تحديث الحملة وإعادة إرسالها لبوابة الطاقة التشغيلية' : 'Campaign updated and resubmitted to Gate')
        : (isRtl ? 'تم حفظ تعديلات الحملة بنجاح' : 'Campaign updated successfully')
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSubmitDraftToGate = (camp: Campaign) => {
    bctStore.submitCampaignForApproval(
      camp.id,
      'تقديم مسودة الحملة للموافقة التشغيلية المسبقة',
      currentEmployee?.username || 'marketing',
      currentEmployee?.id || 'emp-008',
      currentEmployee?.full_name_ar || 'سارة ممدوح'
    );
    setFeedback({
      type: 'success',
      text: isRtl ? 'تم إرسال الحملة إلى بوابة الطاقة التشغيلية للمراجعة والاعتماد' : 'Campaign submitted to Capacity Gate'
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleStatus = (camp: Campaign) => {
    if (!camp.ops_capacity_approved) {
      setFeedback({
        type: 'error',
        text: isRtl ? 'حظر تشغيلي: لا يمكن تفعيل الحملة قبل الحصول على إقرار الطاقة التشغيلية' : 'Campaign cannot be activated before Capacity Gate approval'
      });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const newStatus: CampaignStatus = camp.status === 'approved' ? 'paused' : 'approved';
    bctStore.updateCampaign(camp.id, { status: newStatus }, currentEmployee?.username || 'marketing');
    setFeedback({
      type: 'success',
      text: newStatus === 'approved'
        ? (isRtl ? 'تم تشغيل الحملة بنجاح' : 'Campaign resumed')
        : (isRtl ? 'تم إيقاف الحملة مؤقتاً' : 'Campaign paused')
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCancelCampaign = (camp: Campaign) => {
    const reason = prompt(isRtl ? 'يرجى كتابة سبب إلغاء الحملة:' : 'Reason for cancellation:');
    if (!reason || !reason.trim()) return;

    bctStore.cancelCampaign(
      camp.id,
      reason.trim(),
      currentEmployee?.username || 'marketing',
      currentEmployee?.id || 'emp-008',
      currentEmployee?.full_name_ar || 'سارة ممدوح'
    );
    setFeedback({
      type: 'success',
      text: isRtl ? 'تم إلغاء الحملة وتحرير طاقتها الاستيعابية' : 'Campaign cancelled and capacity released'
    });
    setTimeout(() => setFeedback(null), 4000);
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
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRtl ? 'إدارة التسويق والحملات الإعلانية' : 'Marketing & Campaigns Management'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'إدارة الحملات الإعلانية، القنوات التسويقية، الميزانيات، استهداف الطلاب، ومتابعة الأداء التسويقي'
                  : 'Campaign management, marketing channels, budgets, target audience, and lead performance'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick link to Operational Capacity Gate */}
          <Link
            to="/capacity-gate"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
          >
            <Gauge className="w-4 h-4 text-bct-navy" />
            <span>{isRtl ? 'بوابة الطاقة التشغيلية' : 'Operational Capacity Gate'}</span>
          </Link>

          {/* New Campaign Button */}
          {canCreateCampaign && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-bct-navy text-white rounded-xl text-xs font-bold hover:bg-bct-navy/90 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'حملة تسويقية جديدة' : 'New Marketing Campaign'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Marketing KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'إجمالي الحملات' : 'Total Campaigns'}</span>
            <Megaphone className="w-4 h-4 text-bct-navy" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2 font-semibold">
            <span className="text-emerald-600 font-bold">{stats.active} {isRtl ? 'نشطة' : 'active'}</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{stats.pending} {isRtl ? 'بانتظار البوابة' : 'pending gate'}</span>
            <span>•</span>
            <span className="text-slate-500 font-bold">{stats.draft} {isRtl ? 'مسودة' : 'draft'}</span>
          </div>
        </div>

        {/* Card 2: Marketing Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'الميزانية التسويقية المعتمدة' : 'Total Marketing Budget'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 tabular-nums">
            {stats.totalEgpBudget.toLocaleString()} <span className="text-xs font-bold text-slate-500">EGP</span>
          </div>
          <div className="text-xs tabular-nums font-bold text-slate-500 mt-1">
            + {stats.totalUsdBudget.toLocaleString()} USD
          </div>
        </div>

        {/* Card 3: Target Inquiries (Leads) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'الاستفسارات المستهدفة (Leads)' : 'Target Leads'}</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats.totalTargetLeads}</div>
          <span className="text-[10px] text-slate-400 block mt-2">
            {isRtl ? 'إقبال تسويقي أولي عبر القنوات' : 'Marketing top-of-funnel reach'}
          </span>
        </div>

        {/* Card 4: Expected Registrations (Files Workload) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'التسجيلات المستهدفة (ملفات)' : 'Target Registrations (Files)'}</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">{stats.totalExpectedRegs}</div>
          <span className="text-[10px] text-slate-400 block mt-2">
            {isRtl ? 'ملفات تشغيلية متوقع إدخالها للنظام' : 'Projected operational files for admission'}
          </span>
        </div>
      </div>

      {/* Channel Distribution Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-bct-navy" />
          <span>{isRtl ? 'توزيع القنوات التسويقية المعتمدة' : 'Marketing Channels Distribution'}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {channelBreakdown.map(ch => (
            <div
              key={ch.id}
              onClick={() => setFilterChannel(filterChannel === ch.id ? 'all' : ch.id)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                filterChannel === ch.id
                  ? 'bg-bct-navy text-white border-bct-navy shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="truncate">{isRtl ? ch.nameAr : ch.nameEn}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterChannel === ch.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {ch.count}
                </span>
              </div>
              <div className="text-[11px] font-mono mt-1 opacity-90">
                {ch.leads} {isRtl ? 'استفسار' : 'leads'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'all' ? 'bg-bct-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'الكل' : 'All'} ({campaigns.length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'معتمدة ونشطة' : 'Approved & Active'} ({stats.active})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'بانتظار بوابة الطاقة' : 'Pending Gate'} ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('draft')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'draft' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'مسودات' : 'Drafts'} ({stats.draft})
          </button>
          <button
            onClick={() => setFilterStatus('adjustment_required')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'adjustment_required' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'يتطلب تعديل' : 'Revision Required'} ({stats.adjustmentRequired})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isRtl ? 'مرفوضة' : 'Rejected'} ({stats.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'بحث باسم الحملة أو الكود أو الدولة...' : 'Search campaigns...'}
            className="w-full ps-9 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-bct-navy"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            {isRtl ? 'لا توجد حملات تسويقية تطابق المعايير المحددة' : 'No campaigns match the selected filters'}
          </h3>
          <p className="text-xs text-slate-500">
            {isRtl ? 'يمكنك إنشاء حملة تسويقية جديدة أو تعديل خيارات التصفية' : 'Create a new campaign or reset filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map(camp => {
            const isDraft = camp.status === 'draft';
            const isApproved = camp.ops_capacity_approved && camp.status === 'approved';
            const isPending = camp.status === 'pending_approval';
            const isRejected = camp.status === 'rejected';
            const isAdjustmentNeeded = camp.status === 'adjustment_required';
            const isPaused = camp.status === 'paused';

            return (
              <div
                key={camp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Code, Channel, Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {camp.campaign_code}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                      {camp.channel}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {camp.name}
                  </h3>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{camp.target_country}</span>
                    <span>•</span>
                    <span className="truncate">{camp.target_audience}</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'الميزانية المخصصة:' : 'Budget:'}</span>
                    <span className="font-black text-bct-navy font-mono">
                      {camp.budget_amount.toLocaleString()} {camp.currency}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">{isRtl ? 'الاستفسارات المتوقعة:' : 'Expected Leads:'}</span>
                    <span className="font-bold text-indigo-700">
                      {camp.target_leads || 50} {isRtl ? 'استفسار' : 'leads'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">{isRtl ? 'التسجيلات المتوقعة (ملفات):' : 'Expected Files:'}</span>
                    <span className="font-black text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded text-[11px]">
                      {camp.expected_registrations || 10} {isRtl ? 'ملف حجز' : 'files reservation'}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-400">{isRtl ? 'الفترة:' : 'Duration:'}</span>
                    <span className="font-mono text-slate-600">{camp.start_date} → {camp.end_date}</span>
                  </div>
                </div>

                {/* Operational Capacity Gate Status Pill */}
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : isRejected
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : isAdjustmentNeeded
                    ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                    : isDraft
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : isPaused
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                  <Gauge className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold block">
                        {isApproved
                          ? (isRtl ? 'بوابة الطاقة: معتمد رسمي' : 'Capacity Gate: Approved')
                          : isRejected
                          ? (isRtl ? 'بوابة الطاقة: مرفوض تشغيلياً' : 'Capacity Gate: Rejected')
                          : isAdjustmentNeeded
                          ? (isRtl ? 'بوابة الطاقة: يتطلب تعديل السقف' : 'Capacity Gate: Revision Required')
                          : isDraft
                          ? (isRtl ? 'بوابة الطاقة: مسودة غير مرسلة' : 'Status: Unsubmitted Draft')
                          : (isRtl ? 'بوابة الطاقة: بانتظار إذن العمليات' : 'Capacity Gate: Pending Clearance')}
                      </span>
                    </div>

                    <span className="text-[11px] opacity-85 block mt-0.5">
                      {isApproved
                        ? (isRtl ? `حجز معتمد لـ ${camp.expected_registrations} ملف في سجل الطاقة` : `Approved reservation for ${camp.expected_registrations} files`)
                        : isRejected
                        ? (isRtl ? `السبب: ${camp.rejection_reason || 'طاقة العمليات غير كافية'}` : `Reason: ${camp.rejection_reason || 'Insufficient capacity'}`)
                        : isAdjustmentNeeded
                        ? (isRtl ? `الملاحظات: ${camp.adjustment_notes || 'يلزم تعديل التقديرات'}` : `Notes: ${camp.adjustment_notes || 'Revision required'}`)
                        : isDraft
                        ? (isRtl ? 'يمكنك إرسال الحملة لبوابة الطاقة عند الجاهزية' : 'Submit to Capacity Gate when ready')
                        : (isRtl ? 'لا يجوز الصرف الإعلاني قبل موافقة العمليات' : 'Ad spend locked pending Ops approval')}
                    </span>

                    {/* Direct link to capacity review */}
                    {(!isApproved || isAdjustmentNeeded) && (
                      <Link
                        to="/capacity-gate"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-bct-navy hover:underline mt-1.5"
                      >
                        <span>{isRtl ? 'فحص في بوابة الطاقة التشغيلية' : 'Inspect in Capacity Gate'}</span>
                        {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="p-2 text-slate-500 hover:text-bct-navy hover:bg-slate-100 rounded-lg transition-all"
                      title={isRtl ? 'تعديل بيانات الحملة' : 'Edit Campaign'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Submit Draft to Gate */}
                    {(isDraft || isAdjustmentNeeded) && (
                      <button
                        onClick={() => handleSubmitDraftToGate(camp)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-all"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isRtl ? 'إرسال للبوابة' : 'Submit to Gate'}</span>
                      </button>
                    )}

                    {/* Toggle Active/Pause for Approved */}
                    {isApproved && (
                      <button
                        onClick={() => handleToggleStatus(camp)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                          isPaused
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        <span>{isPaused ? (isRtl ? 'تشغيل' : 'Resume') : (isRtl ? 'إيقاف مؤقت' : 'Pause')}</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleCancelCampaign(camp)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title={isRtl ? 'إلغاء الحملة' : 'Cancel Campaign'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW CAMPAIGN MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-bct-navy" />
                <span>{isRtl ? 'إنشاء حملة تسويقية جديدة' : 'Create New Marketing Campaign'}</span>
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'اسم الحملة الإعلانية *' : 'Campaign Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignData.name}
                    onChange={e => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                    placeholder={isRtl ? 'مثال: حملة طلاب السودان - قبول الجامعات 2026' : 'e.g. Sudan Students Campaign 2026'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'كود الحملة (Campaign Code)' : 'Campaign Code'}
                  </label>
                  <input
                    type="text"
                    value={newCampaignData.campaign_code}
                    onChange={e => setNewCampaignData({ ...newCampaignData, campaign_code: e.target.value })}
                    placeholder="MKT-SUDAN-2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'القناة الإعلانية (Channel) *' : 'Advertising Channel *'}
                  </label>
                  <select
                    value={newCampaignData.channel}
                    onChange={e => setNewCampaignData({ ...newCampaignData, channel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  >
                    <option value="meta">{isRtl ? 'ميتا (فيسبوك / انستغرام)' : 'Meta (FB & IG)'}</option>
                    <option value="google">{isRtl ? 'إعلانات جوجل ويوتيوب' : 'Google & YouTube'}</option>
                    <option value="tiktok">{isRtl ? 'تيك توك (TikTok Ads)' : 'TikTok Ads'}</option>
                    <option value="snapchat">{isRtl ? 'سناب شات (Snapchat Ads)' : 'Snapchat Ads'}</option>
                    <option value="direct">{isRtl ? 'تسويق مباشر ومعارض' : 'Direct & Events'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الدولة المستهدفة *' : 'Target Country *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignData.target_country}
                    onChange={e => setNewCampaignData({ ...newCampaignData, target_country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الجمهور المستهدف *' : 'Target Audience *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignData.target_audience}
                    onChange={e => setNewCampaignData({ ...newCampaignData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الميزانية المخصصة *' : 'Budget *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1000"
                      value={newCampaignData.budget_amount}
                      onChange={e => setNewCampaignData({ ...newCampaignData, budget_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-bct-navy"
                    />
                    <select
                      value={newCampaignData.currency}
                      onChange={e => setNewCampaignData({ ...newCampaignData, currency: e.target.value as any })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="EGP">EGP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'تاريخ البداية والنهاية *' : 'Campaign Schedule *'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      required
                      value={newCampaignData.start_date}
                      onChange={e => setNewCampaignData({ ...newCampaignData, start_date: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="date"
                      required
                      value={newCampaignData.end_date}
                      onChange={e => setNewCampaignData({ ...newCampaignData, end_date: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الاستفسارات المتوقعة (Leads) *' : 'Target Leads *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCampaignData.target_leads}
                    onChange={e => setNewCampaignData({ ...newCampaignData, target_leads: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-bct-navy"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {isRtl ? 'إقبال العملاء المتوقع على منصات الإعلان' : 'Projected inquiries on ad channels'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'التسجيلات المتوقعة (ملفات) *' : 'Expected Files *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCampaignData.expected_registrations}
                    onChange={e => setNewCampaignData({ ...newCampaignData, expected_registrations: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono font-bold text-amber-900 focus:bg-white focus:border-bct-navy"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {isRtl ? 'ملفات القبول المحجوزة فعلياً في العمليات' : 'Files reserved against capacity'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save as Draft OR Submit to Gate */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCreateCampaign(e, false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    {isRtl ? 'حفظ كمسودة' : 'Save as Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleCreateCampaign(e, true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-bct-navy hover:bg-bct-navy/90 text-white rounded-xl font-bold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'إرسال لبوابة الطاقة' : 'Submit to Capacity Gate'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMPAIGN MODAL */}
      {isEditModalOpen && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-bct-navy" />
                <span>{isRtl ? 'تعديل بيانات الحملة الإعلانية' : 'Edit Campaign Details'}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'اسم الحملة الإعلانية *' : 'Campaign Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.name}
                    onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'القناة الإعلانية (Channel) *' : 'Advertising Channel *'}
                  </label>
                  <select
                    value={editingCampaign.channel}
                    onChange={e => setEditingCampaign({ ...editingCampaign, channel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  >
                    <option value="meta">{isRtl ? 'ميتا (فيسبوك / انستغرام)' : 'Meta (FB & IG)'}</option>
                    <option value="google">{isRtl ? 'إعلانات جوجل ويوتيوب' : 'Google & YouTube'}</option>
                    <option value="tiktok">{isRtl ? 'تيك توك (TikTok Ads)' : 'TikTok Ads'}</option>
                    <option value="snapchat">{isRtl ? 'سناب شات (Snapchat Ads)' : 'Snapchat Ads'}</option>
                    <option value="direct">{isRtl ? 'تسويق مباشر ومعارض' : 'Direct & Events'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الدولة المستهدفة *' : 'Target Country *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.target_country}
                    onChange={e => setEditingCampaign({ ...editingCampaign, target_country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الميزانية المخصصة *' : 'Budget *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1000"
                      value={editingCampaign.budget_amount}
                      onChange={e => setEditingCampaign({ ...editingCampaign, budget_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-bct-navy"
                    />
                    <select
                      value={editingCampaign.currency}
                      onChange={e => setEditingCampaign({ ...editingCampaign, currency: e.target.value as any })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      <option value="EGP">EGP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الاستفسارات المتوقعة (Leads) *' : 'Target Leads *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCampaign.target_leads}
                    onChange={e => setEditingCampaign({ ...editingCampaign, target_leads: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'التسجيلات المتوقعة (ملفات) *' : 'Expected Files *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingCampaign.expected_registrations}
                    onChange={e => setEditingCampaign({ ...editingCampaign, expected_registrations: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono font-bold text-amber-900 focus:bg-white focus:border-bct-navy"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'تاريخ البداية والنهاية *' : 'Schedule *'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      required
                      value={editingCampaign.start_date}
                      onChange={e => setEditingCampaign({ ...editingCampaign, start_date: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <input
                      type="date"
                      required
                      value={editingCampaign.end_date}
                      onChange={e => setEditingCampaign({ ...editingCampaign, end_date: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(e, false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(e, true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-bct-navy hover:bg-bct-navy/90 text-white rounded-xl font-bold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'حفظ وإرسال لبوابة الطاقة' : 'Save & Submit to Gate'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
