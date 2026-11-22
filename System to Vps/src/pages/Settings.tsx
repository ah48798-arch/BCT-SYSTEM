import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  SLAConfigurationItem,
  SLAUnit,
  SLACategory,
  SLACalculationScope,
  SLAEscalationRole,
  formatSLALabel,
  computeDurationMs
} from '../types/database.types';
import {
  Settings as SettingsIcon,
  Shield,
  Clock,
  DollarSign,
  FileCheck,
  Bell,
  Users,
  CheckCircle2,
  Save,
  Globe,
  Sliders,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  Building2,
  Sparkles,
  Database
} from 'lucide-react';
import { BackupRestoreManagement } from '../components/settings/BackupRestoreManagement';

export const Settings: React.FC = () => {
  const { isRtl, language, setLanguage } = useLanguage();
  const { currentEmployee, isSuperAdmin } = useAuth();

  // Top level Settings Tab: Policies vs Backup & Restore (defaults to backup_restore or remembered tab)
  const [settingsMainTab, setSettingsMainTab] = useState<'policies' | 'backup_restore'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (hash.includes('backup') || search.includes('backup')) return 'backup_restore';
      if (hash.includes('policies') || search.includes('policies')) return 'policies';
      const saved = localStorage.getItem('bct_settings_active_tab');
      if (saved === 'backup_restore' || saved === 'policies') return saved;
    }
    return 'backup_restore';
  });

  const handleTabChange = (tab: 'policies' | 'backup_restore') => {
    setSettingsMainTab(tab);
    try {
      localStorage.setItem('bct_settings_active_tab', tab);
    } catch {}
  };

  // General System Policies Settings
  const [settings, setSettings] = useState({
    response_sla_minutes: 15,
    document_review_sla_hours: 4,
    payment_review_sla_hours: 2,
    complaint_sla_days: 3,
    inactivity_red_alert_days: 7,
    emergency_reserve_target: 450000,
    emergency_reserve_percentage: 35,
    default_currency: 'EGP',
    small_team_mode: false,
    require_passport_before_submission: true,
    require_payment_before_review: true,
    require_ops_approval_for_campaigns: true,
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Centralized SLA Catalog State
  const [slaConfigs, setSlaConfigs] = useState<SLAConfigurationItem[]>(bctStore.getSLAConfigs());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [editingItem, setEditingItem] = useState<SLAConfigurationItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalApplyScope, setModalApplyScope] = useState<SLACalculationScope>('all_active');

  // Form State for Editing or Creating
  const [formCode, setFormCode] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDeptId, setFormDeptId] = useState<string>('ops');
  const [formCategory, setFormCategory] = useState<SLACategory>('operational_task');
  const [formDurationValue, setFormDurationValue] = useState<number>(4);
  const [formDurationUnit, setFormDurationUnit] = useState<SLAUnit>('hours');
  const [formDescriptionAr, setFormDescriptionAr] = useState('');
  const [formBusinessDaysOnly, setFormBusinessDaysOnly] = useState(false);
  const [formPauseOnExternal, setFormPauseOnExternal] = useState(false);
  const [formResetOnReassign, setFormResetOnReassign] = useState(false);
  const [formAlertBeforePercent, setFormAlertBeforePercent] = useState<number>(75);
  const [formAlertAt100, setFormAlertAt100] = useState(true);
  const [formAlertBreached, setFormAlertBreached] = useState(true);
  const [formEscalateAfterHours, setFormEscalateAfterHours] = useState<number>(4);
  const [formEscalationRole, setFormEscalationRole] = useState<SLAEscalationRole>('ops_mgr');

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<SLAConfigurationItem | null>(null);

  // Sync with Store Updates
  useEffect(() => {
    const unsubscribe = bctStore.subscribe(() => {
      const latest = bctStore.getSLAConfigs();
      setSlaConfigs(latest);

      // Sync the 3 top quick settings
      const inquirySla = latest.find(s => s.code === 'SLA-TASK-INQUIRY');
      const docReviewSla = latest.find(s => s.code === 'SLA-TASK-DOC-REVIEW');
      const complaintSla = latest.find(s => s.code === 'SLA-TASK-COMPLAINT');

      setSettings(prev => ({
        ...prev,
        response_sla_minutes: inquirySla ? inquirySla.duration_value : prev.response_sla_minutes,
        document_review_sla_hours: docReviewSla ? docReviewSla.duration_value : prev.document_review_sla_hours,
        complaint_sla_days: complaintSla ? complaintSla.duration_value : prev.complaint_sla_days
      }));
    });
    return unsubscribe;
  }, []);

  const departments = useMemo(() => bctStore.getDepartments(), []);

  // Filtered SLA items
  const filteredSlaConfigs = useMemo(() => {
    return slaConfigs.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        item.name_ar.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description_ar.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'all' || item.department_id === selectedDept;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' ||
        (selectedStatus === 'active' && item.is_active) ||
        (selectedStatus === 'inactive' && !item.is_active);

      return matchesSearch && matchesDept && matchesCategory && matchesStatus;
    });
  }, [slaConfigs, searchQuery, selectedDept, selectedCategory, selectedStatus]);

  // SLA Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = slaConfigs.length;
    const active = slaConfigs.filter(s => s.is_active).length;
    const stages = slaConfigs.filter(s => s.category === 'lifecycle_stage').length;
    const tasks = slaConfigs.filter(s => s.category === 'operational_task').length;
    return { total, active, stages, tasks };
  }, [slaConfigs]);

  // Open Edit Modal
  const handleOpenEdit = (item: SLAConfigurationItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormNameAr(item.name_ar);
    setFormNameEn(item.name_en);
    setFormDeptId(item.department_id);
    setFormCategory(item.category);
    setFormDurationValue(item.duration_value);
    setFormDurationUnit(item.duration_unit);
    setFormDescriptionAr(item.description_ar || '');
    setFormBusinessDaysOnly(item.business_days_only || false);
    setFormPauseOnExternal(item.pause_on_external || false);
    setFormResetOnReassign(item.reset_on_reassign || false);
    setFormAlertBeforePercent(item.alert_before_percent || 75);
    setFormAlertAt100(item.alert_at_100 !== false);
    setFormAlertBreached(item.alert_breached !== false);
    setFormEscalateAfterHours(item.escalate_after_hours || 4);
    setFormEscalationRole(item.escalation_role || 'ops_mgr');
    setModalApplyScope('all_active');
    setErrorFeedback(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    setFormCode('');
    setFormNameAr('');
    setFormNameEn('');
    setFormDeptId('ops');
    setFormCategory('operational_task');
    setFormDurationValue(4);
    setFormDurationUnit('hours');
    setFormDescriptionAr('');
    setFormBusinessDaysOnly(false);
    setFormPauseOnExternal(false);
    setFormResetOnReassign(false);
    setFormAlertBeforePercent(75);
    setFormAlertAt100(true);
    setFormAlertBreached(true);
    setFormEscalateAfterHours(4);
    setFormEscalationRole('ops_mgr');
    setErrorFeedback(null);
  };

  // Save Modal Form (Edit or Add)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);

    if (!formNameAr.trim()) {
      setErrorFeedback(isRtl ? 'يرجى إدخال اسم المهمة بالعربية.' : 'Please enter the task name in Arabic.');
      return;
    }

    if (formDurationValue <= 0) {
      setErrorFeedback(isRtl ? 'يجب أن تكون قيمة المدة أكبر من صفر.' : 'Duration must be greater than zero.');
      return;
    }

    const deptObj = departments.find(d => d.id === formDeptId);
    const deptNameAr = deptObj ? deptObj.name_ar : 'إدارة العمليات';
    const deptNameEn = deptObj ? deptObj.name_en : 'Operations';

    const escalationRoleTitles: Record<SLAEscalationRole, string> = {
      gm: 'المدير العام',
      ops_mgr: 'مدير العمليات',
      department_head: 'رئيس القسم المسؤول',
      qa_officer: 'مسؤول الجودة والامتثال',
      branch_mgr: 'مدير الفرع'
    };

    const actor = currentEmployee?.username || 'admin';

    if (editingItem) {
      // Update existing item
      const res = bctStore.updateSLAConfig(
        editingItem.id,
        {
          name_ar: formNameAr,
          name_en: formNameEn || formNameAr,
          department_id: formDeptId,
          department_name_ar: deptNameAr,
          department_name_en: deptNameEn,
          duration_value: formDurationValue,
          duration_unit: formDurationUnit,
          description_ar: formDescriptionAr,
          business_days_only: formBusinessDaysOnly,
          pause_on_external: formPauseOnExternal,
          reset_on_reassign: formResetOnReassign,
          alert_before_percent: formAlertBeforePercent,
          alert_at_100: formAlertAt100,
          alert_breached: formAlertBreached,
          escalate_after_hours: formEscalateAfterHours,
          escalation_role: formEscalationRole,
          escalation_role_ar: escalationRoleTitles[formEscalationRole]
        },
        actor,
        modalApplyScope
      );

      if (!res.success) {
        setErrorFeedback(res.message || 'فشل تحديث المعيار.');
        return;
      }

      setFeedback(res.message || (isRtl ? 'تم تحديث معيار SLA بنجاح' : 'SLA benchmark updated successfully'));
      setEditingItem(null);
    } else {
      // Create new item
      const res = bctStore.createSLAConfig(
        {
          code: formCode.trim() || undefined as any,
          category: formCategory,
          name_ar: formNameAr,
          name_en: formNameEn || formNameAr,
          department_id: formDeptId,
          department_name_ar: deptNameAr,
          department_name_en: deptNameEn,
          duration_value: formDurationValue,
          duration_unit: formDurationUnit,
          duration_ms: computeDurationMs(formDurationValue, formDurationUnit),
          label_ar: formatSLALabel(formDurationValue, formDurationUnit, true),
          label_en: formatSLALabel(formDurationValue, formDurationUnit, false),
          is_active: true,
          description_ar: formDescriptionAr,
          description_en: formNameEn,
          start_trigger: formCategory === 'complaint' ? 'ticket_opened' : 'task_created',
          completion_trigger: formCategory === 'complaint' ? 'ticket_resolved' : 'task_completed',
          business_days_only: formBusinessDaysOnly,
          pause_on_external: formPauseOnExternal,
          reset_on_reassign: formResetOnReassign,
          alert_before_percent: formAlertBeforePercent,
          alert_at_100: formAlertAt100,
          alert_breached: formAlertBreached,
          escalate_after_hours: formEscalateAfterHours,
          escalation_role: formEscalationRole,
          escalation_role_ar: escalationRoleTitles[formEscalationRole]
        },
        actor
      );

      if (!res.success) {
        setErrorFeedback(res.message || 'فشل إضافة المعيار.');
        return;
      }

      setFeedback(res.message || (isRtl ? 'تمت إضافة معيار SLA الجديد بنجاح' : 'New SLA benchmark created successfully'));
      setIsAddModalOpen(false);
    }

    setTimeout(() => setFeedback(null), 3500);
  };

  // Toggle SLA active status
  const handleToggleStatus = (item: SLAConfigurationItem) => {
    const actor = currentEmployee?.username || 'admin';
    const newStatus = !item.is_active;
    const ok = bctStore.toggleSLAStatus(item.id, newStatus, actor);
    if (ok) {
      setFeedback(
        isRtl
          ? `تم ${newStatus ? 'تفعيل' : 'تعطيل'} احتساب SLA لـ "${item.name_ar}" بنجاح.`
          : `SLA for "${item.name_en}" ${newStatus ? 'activated' : 'deactivated'}.`
      );
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Execute Deletion
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const actor = currentEmployee?.username || 'admin';
    const res = bctStore.deleteSLAConfig(itemToDelete.id, actor);
    if (!res.success) {
      setErrorFeedback(res.message || 'لا يمكن حذف المعيار.');
      setTimeout(() => setErrorFeedback(null), 4000);
    } else {
      setFeedback(res.message || (isRtl ? 'تم حذف المعيار بنجاح.' : 'SLA deleted.'));
      setTimeout(() => setFeedback(null), 3000);
    }
    setItemToDelete(null);
  };

  // Master Save (Top Save Button)
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const actor = currentEmployee?.username || 'admin';

    // 1. Sync the 3 top benchmark inputs if changed
    const inquiryItem = slaConfigs.find(s => s.code === 'SLA-TASK-INQUIRY');
    if (inquiryItem && inquiryItem.duration_value !== settings.response_sla_minutes) {
      bctStore.updateSLAConfig(inquiryItem.id, { duration_value: settings.response_sla_minutes }, actor, 'all_active');
    }

    const docReviewItem = slaConfigs.find(s => s.code === 'SLA-TASK-DOC-REVIEW');
    if (docReviewItem && docReviewItem.duration_value !== settings.document_review_sla_hours) {
      bctStore.updateSLAConfig(docReviewItem.id, { duration_value: settings.document_review_sla_hours }, actor, 'all_active');
    }

    const complaintItem = slaConfigs.find(s => s.code === 'SLA-TASK-COMPLAINT');
    if (complaintItem && complaintItem.duration_value !== settings.complaint_sla_days) {
      bctStore.updateSLAConfig(complaintItem.id, { duration_value: settings.complaint_sla_days }, actor, 'all_active');
    }

    // 2. Audit log global settings update
    bctStore.addAuditLog(actor, 'UPDATE_SYSTEM_SETTINGS', 'settings', 'global', settings);

    setFeedback(isRtl ? 'تم حفظ وتطبيق كافة الإعدادات والسياسات ومعايير SLA بنجاح' : 'System configuration saved successfully');
    setTimeout(() => setFeedback(null), 3500);
  };

  const getCategoryBadge = (cat: SLACategory) => {
    switch (cat) {
      case 'lifecycle_stage':
        return { label_ar: 'مرحلة ملف', label_en: 'Lifecycle Stage', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'operational_task':
        return { label_ar: 'مهمة تشغيلية', label_en: 'Operational Task', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'complaint':
        return { label_ar: 'شكوى عميل', label_en: 'Grievance', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'inquiry':
        return { label_ar: 'استفسار أولي', label_en: 'Inquiry', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
  };

  const getUnitLabel = (unit: SLAUnit) => {
    switch (unit) {
      case 'minutes':
        return isRtl ? 'دقائق' : 'Minutes';
      case 'hours':
        return isRtl ? 'ساعات' : 'Hours';
      case 'days':
        return isRtl ? 'أيام' : 'Days';
      case 'business_days':
        return isRtl ? 'أيام عمل' : 'Business Days';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'إعدادات النظام والسياسات التشغيلية' : 'System Configuration & Policy Center'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? 'التحكم المركزي في معايير اتفاقيات الخدمة (SLA)، بوابات الأمان، قواعد التداخل، وسياسات الطوارئ'
              : 'Enterprise controls for SLAs, security gates, financial reserves, and operational rules'}
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isRtl ? 'حفظ كافة الإعدادات' : 'Save Configurations'}</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between gap-3 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorFeedback && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-between gap-3 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorFeedback}</span>
          </div>
          <button onClick={() => setErrorFeedback(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Section Navigation: General Policies & SLAs vs Backup & Restore */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          type="button"
          onClick={() => handleTabChange('policies')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            settingsMainTab === 'policies'
              ? 'border-bct-navy text-bct-navy bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{isRtl ? 'السياسات العامة واتفاقيات SLA' : 'General Policies & SLAs'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('backup_restore')}
          className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            settingsMainTab === 'backup_restore'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isRtl ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore'}</span>
          <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full font-semibold">
            {isRtl ? 'مؤمن ومجدول' : 'Automated'}
          </span>
        </button>
      </div>

      {settingsMainTab === 'backup_restore' ? (
        <BackupRestoreManagement />
      ) : (
        <>
          {/* SECTION 1: CENTRALIZED SLA MANAGEMENT SUITE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-bct-navy" />
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isRtl ? 'إدارة اتفاقيات مستوى الخدمة (SLAs) والمدد الزمنية للمهام' : 'Centralized SLA & Operational Timelines Management'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRtl
                ? 'التحكم المركزي في مدد جميع المراحل الـ 10 والمهام التشغيلية، وحدات القياس، أيام العمل، وتنبيهات التصعيد.'
                : 'Configure durations, time units, working-day calculations, and managerial escalations across all stages and tasks.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مهمة SLA جديدة' : 'Add New SLA Task'}</span>
          </button>
        </div>

        {/* Quick Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block">
              {isRtl ? 'إجمالي معايير SLA' : 'Total SLA Benchmarks'}
            </span>
            <span className="text-xl font-black text-slate-800 mt-0.5 block">{summaryMetrics.total}</span>
            <span className="text-[10px] text-slate-400">
              {isRtl ? `${summaryMetrics.active} معيار نشط حالياً` : `${summaryMetrics.active} active`}
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-700 block">
              {isRtl ? 'مراحل دورة الحياة العشرية' : 'Lifecycle Stages'}
            </span>
            <span className="text-xl font-black text-indigo-900 mt-0.5 block">{summaryMetrics.stages}</span>
            <span className="text-[10px] text-indigo-600 font-semibold">
              {isRtl ? '10 مراحل متصلة بـ Pipeline' : '10 Pipeline stages'}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 block">
              {isRtl ? 'المهام التشغيلية والفحوصات' : 'Operational Subtasks'}
            </span>
            <span className="text-xl font-black text-emerald-900 mt-0.5 block">{summaryMetrics.tasks}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {isRtl ? 'مراجعات وتصديقات واعتمادات' : 'Audits & Certifications'}
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 block">
              {isRtl ? 'المرونة التشغيلية' : 'Execution Engine'}
            </span>
            <span className="text-xl font-black text-amber-900 mt-0.5 block">100%</span>
            <span className="text-[10px] text-amber-600 font-semibold">
              {isRtl ? 'تحديث فوري دون كود برمجى' : 'Dynamic no-code sync'}
            </span>
          </div>
        </div>

        {/* 3 Existing Core Benchmark Quick Fields (Preserved per Requirement 9) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-bct-navy" />
              <span className="text-xs font-bold text-slate-700">
                {isRtl ? 'المعايير المعتمدة الثلاثة بدليل بي سي تي للاستشارات التعليمية والتدريب (تعديل سريع)' : 'Three Master BCT Educational Consulting & Training Benchmarks (Quick Controls)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {isRtl ? 'تتزامن تلقائياً مع جدول المعايير المركزي' : 'Synchronized with SLA registry'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {isRtl ? 'زمن أول استجابة للاستفسار (دقيقة)' : 'First Response Time (Minutes)'}
              </label>
              <input
                type="number"
                min={1}
                value={settings.response_sla_minutes}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSettings(prev => ({ ...prev, response_sla_minutes: val }));
                  const item = slaConfigs.find(s => s.code === 'SLA-TASK-INQUIRY');
                  if (item && val > 0) {
                    bctStore.updateSLAConfig(item.id, { duration_value: val }, currentEmployee?.username || 'admin', 'all_active');
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {isRtl ? 'المعيار المعتمد: 15 دقيقة كحد أقصى' : 'BCT Guide Standard: 15 Minutes'}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {isRtl ? 'مراجعة وتدقيق المستندات (ساعات)' : 'Document Review SLA (Hours)'}
              </label>
              <input
                type="number"
                min={1}
                value={settings.document_review_sla_hours}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSettings(prev => ({ ...prev, document_review_sla_hours: val }));
                  const item = slaConfigs.find(s => s.code === 'SLA-TASK-DOC-REVIEW');
                  if (item && val > 0) {
                    bctStore.updateSLAConfig(item.id, { duration_value: val }, currentEmployee?.username || 'admin', 'all_active');
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {isRtl ? 'المعيار المعتمد: 4 ساعات عمل' : 'BCT Standard: Max 4 Hours'}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {isRtl ? 'البت في شكاوى الطلاب (أيام)' : 'Complaint Resolution SLA (Days)'}
              </label>
              <input
                type="number"
                min={1}
                value={settings.complaint_sla_days}
                onChange={e => {
                  const val = Number(e.target.value);
                  setSettings(prev => ({ ...prev, complaint_sla_days: val }));
                  const item = slaConfigs.find(s => s.code === 'SLA-TASK-COMPLAINT');
                  if (item && val > 0) {
                    bctStore.updateSLAConfig(item.id, { duration_value: val }, currentEmployee?.username || 'admin', 'all_active');
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {isRtl ? 'المعيار المعتمد: 3 أيام كحد أقصى' : 'BCT Standard: Max 3 Days'}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pt-2">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
            <input
              type="text"
              placeholder={isRtl ? 'البحث باسم المهمة أو المرحلة أو الكود...' : 'Search by task name, stage or code...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-bct-navy focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-3 my-auto text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter & Category Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Dept Filter */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع الأقسام' : 'All Departments'}</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {isRtl ? d.name_ar : d.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">{isRtl ? 'جميع التصنيفات' : 'All Categories'}</option>
                <option value="lifecycle_stage">{isRtl ? 'مراحل دورة حياة الملف (10)' : 'Lifecycle Stages'}</option>
                <option value="operational_task">{isRtl ? 'مهام تشغيلية وفحوصات' : 'Operational Tasks'}</option>
                <option value="complaint">{isRtl ? 'شكاوى الطلاب' : 'Complaints'}</option>
                <option value="inquiry">{isRtl ? 'استفسارات العملاء' : 'Inquiries'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedStatus === 'all' ? 'bg-bct-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isRtl ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('active')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedStatus === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isRtl ? 'مفعل' : 'Active'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedStatus === 'inactive' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isRtl ? 'معطل' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Main SLA Management Table (Section 7 Requirement) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase">
                  <th className="py-3 px-4 text-start">{isRtl ? 'المهمة / المرحلة' : 'Task / Stage'}</th>
                  <th className="py-3 px-3 text-start">{isRtl ? 'القسم المسؤول' : 'Department'}</th>
                  <th className="py-3 px-3 text-center">{isRtl ? 'المدة' : 'Duration'}</th>
                  <th className="py-3 px-3 text-center">{isRtl ? 'وحدة القياس' : 'Unit'}</th>
                  <th className="py-3 px-4 text-start">{isRtl ? 'التنبيهات والتصعيد' : 'Alerts & Escalation'}</th>
                  <th className="py-3 px-3 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSlaConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {isRtl ? 'لا توجد مهام أو مراحل تطابق معايير البحث والفلترة' : 'No SLA benchmarks match the filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredSlaConfigs.map(item => {
                    const catBadge = getCategoryBadge(item.category);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Task / Stage Name & Code */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {isRtl ? item.name_ar : item.name_en}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge.bg}`}>
                                {isRtl ? catBadge.label_ar : catBadge.label_en}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                              <span>{item.code}</span>
                              {item.business_days_only && (
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {isRtl ? 'أيام عمل فقط' : 'Business days only'}
                                </span>
                              )}
                              {item.pause_on_external && (
                                <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  {isRtl ? 'إيقاف للجهات الخارجية' : 'Pause on external'}
                                </span>
                              )}
                            </div>
                            {item.description_ar && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                                {item.description_ar}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                            {isRtl ? item.department_name_ar : item.department_name_en}
                          </span>
                        </td>

                        {/* Duration Value */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-black text-slate-900 text-sm">
                            {item.duration_value}
                          </span>
                        </td>

                        {/* Duration Unit */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {getUnitLabel(item.duration_unit)}
                          </span>
                          <span className="block text-[10px] font-medium text-slate-400 mt-0.5">
                            {isRtl ? item.label_ar : item.label_en}
                          </span>
                        </td>

                        {/* Alerts & Escalation */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {item.alert_before_percent && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                                {isRtl ? `تنبيه ${item.alert_before_percent}%` : `Alert at ${item.alert_before_percent}%`}
                              </span>
                            )}
                            {item.alert_breached && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                {isRtl ? 'تنبيه تجاوز' : 'Breach alert'}
                              </span>
                            )}
                            {item.escalate_after_hours ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                {isRtl ? `تصعيد خلال ${item.escalate_after_hours} س` : `Escalate +${item.escalate_after_hours}h`}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-[10px] transition-all cursor-pointer shadow-xs ${
                              item.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title={item.is_active ? (isRtl ? 'انقر للتعطيل' : 'Click to disable') : (isRtl ? 'انقر للتفعيل' : 'Click to activate')}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{item.is_active ? (isRtl ? 'مفعل' : 'Active') : (isRtl ? 'معطل' : 'Disabled')}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg bg-bct-navy/10 text-bct-navy hover:bg-bct-navy hover:text-white transition-colors cursor-pointer"
                              title={isRtl ? 'تعديل المعيار' : 'Edit Benchmark'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {item.is_system_core ? (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed"
                                title={isRtl ? 'المراحل الأساسية لا تحذف حفاظاً على تكامل النظام (يمكنك تعطيلها)' : 'Core stages cannot be deleted (can be disabled)'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                title={isRtl ? 'حذف المعيار' : 'Delete Benchmark'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: STRICT BUSINESS GATES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-bct-navy" />
          <h3 className="font-bold text-slate-800 text-base">
            {isRtl ? 'بوابات الأمان والقواعد الإلزامية الخمس' : 'Core Business Gates & Mandatory Rules'}
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          {/* Gate A */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">
                {isRtl ? 'بوابة السداد المالي الإلزامية (Payment Clearance Gate)' : 'Strict Payment Clearance Gate'}
              </span>
              <p className="text-slate-500 mt-0.5">
                {isRtl
                  ? 'منع بدء مراجعة المستندات أو الرفع على منصة التقديمات قبل تأكيد المحاسب لاستلام الرسوم في النظام'
                  : 'Block file movement into review or platform submission before accountant marks fees as confirmed'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.require_payment_before_review}
              onChange={e => setSettings({ ...settings, require_payment_before_review: e.target.checked })}
              className="w-5 h-5 text-bct-navy rounded cursor-pointer"
            />
          </div>

          {/* Gate B */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">
                {isRtl ? 'بوابة الطاقة الاستيعابية لحملات التسويق (Rule 4: Capacity Gate)' : 'Rule 4: Marketing Capacity Gate'}
              </span>
              <p className="text-slate-500 mt-0.5">
                {isRtl
                  ? 'حظر إطلاق أي حملة تسويقية جديدة دون إقرار رسمي من مدير العمليات بتوفر الطاقة الاستيعابية'
                  : 'Prevent launching ad campaigns without formal Operations capacity clearance'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.require_ops_approval_for_campaigns}
              onChange={e => setSettings({ ...settings, require_ops_approval_for_campaigns: e.target.checked })}
              className="w-5 h-5 text-bct-navy rounded cursor-pointer"
            />
          </div>

          {/* Gate C */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 text-sm block">
                {isRtl ? 'اشتراط جواز السفر والشهادة قبل الرفع للمنصة' : 'Passport & Certificate Mandatory Gate'}
              </span>
              <p className="text-slate-500 mt-0.5">
                {isRtl
                  ? 'عدم السماح بنقل الملف إلى مرحلة "مقدم للمنصة" دون إرفاق جواز سفر ساري وصورة الشهادة الموثقة'
                  : 'Block platform submission if passport copy or attested certificate is missing'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.require_passport_before_submission}
              onChange={e => setSettings({ ...settings, require_passport_before_submission: e.target.checked })}
              className="w-5 h-5 text-bct-navy rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: FINANCIAL & SOLVENCY CONFIGURATION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <DollarSign className="w-5 h-5 text-bct-navy" />
          <h3 className="font-bold text-slate-800 text-base">
            {isRtl ? 'السياسات المالية وصندوق الطوارئ' : 'Financial Policies & Emergency Reserve'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">
              {isRtl ? 'المستهدف المالي لصندوق الطوارئ (جنيه مصري)' : 'Emergency Reserve Target (EGP)'}
            </label>
            <input
              type="number"
              value={settings.emergency_reserve_target}
              onChange={e => setSettings({ ...settings, emergency_reserve_target: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-bct-navy focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isRtl ? 'مخصص لتغطية 3 أشهر من النفقات التشغيلية بدون إيرادات جديدة' : '3-Month OpEx buffer'}
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1.5">
              {isRtl ? 'نسبة الاستقطاع المالي للاحتياطي (%)' : 'Reserve Allocation Ratio (%)'}
            </label>
            <input
              type="number"
              value={settings.emergency_reserve_percentage}
              onChange={e => setSettings({ ...settings, emergency_reserve_percentage: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-bct-navy focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {isRtl ? 'نسبة الاستقطاع التلقائي من كل تحصيل مؤكد' : 'Percentage deducted from verified collections'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: BRAND IDENTITY & SMALL TEAM MODE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Sliders className="w-5 h-5 text-bct-navy" />
          <h3 className="font-bold text-slate-800 text-base">
            {isRtl ? 'الهوية المؤسسية ونمط الفرق المصغرة' : 'Branding & Team Consolidation'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block text-sm">
              {isRtl ? 'شعار وهوية بي سي تي للاستشارات التعليمية والتدريب الرسمية' : 'Official BCT Educational Consulting & Training Brand Identity'}
            </span>
            <p className="text-slate-500">
              {isRtl
                ? 'اللون الكحلي الأساسي: #154568 • مسار الشعار الأصلي: public/assets/brand/BCT_Vertical_Mono_Navy.png'
                : 'Primary Navy: #154568 • Master Logo: public/assets/brand/BCT_Vertical_Mono_Navy.png'}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-6 h-6 rounded-md bg-[#154568] inline-block shadow-sm" />
              <span className="font-mono text-slate-700">#154568 (BCT Master Navy)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block text-sm">
                {isRtl ? 'نمط الفرق المصغرة (أقل من 8 موظفين)' : 'Small Team Mode (< 8 Staff)'}
              </span>
              <p className="text-slate-500 mt-0.5">
                {isRtl
                  ? 'دمج الأدوار الـ 18 وفق جدول الدمج المعتمد في الدليل عند نقص الكادر'
                  : 'Activate consolidated job distribution per BCT small-team matrix'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.small_team_mode}
              onChange={e => setSettings({ ...settings, small_team_mode: e.target.checked })}
              className="w-5 h-5 text-bct-navy rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
        </>
      )}

      {/* EDIT / ADD MODAL DIALOG */}
      {(editingItem || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-bct-navy text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingItem
                    ? (isRtl ? `تعديل إعدادات SLA: ${editingItem.name_ar}` : `Edit SLA Benchmark: ${editingItem.name_en}`)
                    : (isRtl ? 'إضافة مهمة SLA جديدة للنظام' : 'Create New SLA Benchmark')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-5 text-xs">
              {errorFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorFeedback}</span>
                </div>
              )}

              {/* Section A: Basic Task Information */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 text-sm block border-b pb-1">
                  {isRtl ? '1. البيانات الأساسية للمهمة أو المرحلة' : '1. Basic Task / Stage Information'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'اسم المهمة / المرحلة (عربي) *' : 'Task / Stage Name (Arabic) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formNameAr}
                      onChange={e => setFormNameAr(e.target.value)}
                      placeholder={isRtl ? 'مثال: فحص وتدقيق الشهادات الثانوية' : 'e.g. Document Audit'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'الاسم بالإنجليزية' : 'Task Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={formNameEn}
                      onChange={e => setFormNameEn(e.target.value)}
                      placeholder="e.g. Secondary School Certificate Audit"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'القسم المسؤول عن التنفيذ *' : 'Responsible Department *'}
                    </label>
                    <select
                      value={formDeptId}
                      onChange={e => setFormDeptId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {isRtl ? d.name_ar : d.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'تصنيف المهمة' : 'Category'}
                    </label>
                    <select
                      disabled={Boolean(editingItem?.stage_key)}
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as SLACategory)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none disabled:bg-slate-100"
                    >
                      <option value="operational_task">{isRtl ? 'مهمة تشغيلية وفحص' : 'Operational Task'}</option>
                      <option value="lifecycle_stage">{isRtl ? 'مرحلة دورة حياة الملف' : 'Lifecycle Stage'}</option>
                      <option value="complaint">{isRtl ? 'شكوى طالب' : 'Complaint'}</option>
                      <option value="inquiry">{isRtl ? 'استفسار أولي' : 'Inquiry'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'وصف مختصر للمدة ومعيار احتسابها' : 'Description & Calculation Criteria'}
                  </label>
                  <textarea
                    rows={2}
                    value={formDescriptionAr}
                    onChange={e => setFormDescriptionAr(e.target.value)}
                    placeholder={isRtl ? 'اكتب معيار البدء، شروط الإنجاز، والوثائق المطلوبة...' : 'Specify trigger, completion criteria...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Section B: Duration & Time Units (Section 3 Requirement) */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 text-sm block border-b pb-1">
                  {isRtl ? '2. المدة الزمنية ووحدة قياس الوقت' : '2. Duration Value & Unit'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'قيمة المدة الزمنية *' : 'Duration Value *'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formDurationValue}
                      onChange={e => setFormDurationValue(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'وحدة قياس المدة *' : 'Duration Unit *'}
                    </label>
                    <select
                      value={formDurationUnit}
                      onChange={e => setFormDurationUnit(e.target.value as SLAUnit)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    >
                      <option value="minutes">{isRtl ? 'دقائق (Minutes)' : 'Minutes'}</option>
                      <option value="hours">{isRtl ? 'ساعات (Hours)' : 'Hours'}</option>
                      <option value="days">{isRtl ? 'أيام عادية (Calendar Days)' : 'Calendar Days'}</option>
                      <option value="business_days">{isRtl ? 'أيام عمل رسمية (Business Days)' : 'Business Days'}</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-700">
                  <span className="font-semibold">
                    {isRtl ? 'النتيجة في واجهة النظام:' : 'System Display Label:'}
                  </span>
                  <span className="font-extrabold text-bct-navy text-sm">
                    {formatSLALabel(formDurationValue, formDurationUnit, isRtl)}
                  </span>
                </div>
              </div>

              {/* Section C: Advanced Time Calculation Settings (Section 4 Requirement) */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 text-sm block border-b pb-1">
                  {isRtl ? '3. إعدادات متقدمة لاحتساب الوقت والتقويم' : '3. Advanced Time & Working Calendar Rules'}
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBusinessDaysOnly}
                      onChange={e => setFormBusinessDaysOnly(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-bct-navy rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? 'احتساب الوقت خلال أيام العمل الرسمية فقط' : 'Count time during official business days only'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isRtl ? 'استثناء أيام العطلات والإجازات الأسبوعية (الجمعة والسبت) من عداد الـ SLA' : 'Excludes official weekend days (Fri & Sat) from SLA calculations'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPauseOnExternal}
                      onChange={e => setFormPauseOnExternal(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-bct-navy rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? 'إمكانية إيقاف مؤقت للعداد عند انتظار جهة خارجية' : 'Allow pause when awaiting external dependencies'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isRtl ? 'إيقاف العداد عند انتظار مستند من الطالب أو إفادة قنصلية/سفارة' : 'Pauses SLA timer while awaiting student documents or embassy stamps'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formResetOnReassign}
                      onChange={e => setFormResetOnReassign(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-bct-navy rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? 'إعادة ضبط عداد SLA عند تغيير الموظف المسؤول' : 'Reset SLA timer upon reassigning employee'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isRtl ? 'إعطاء مهلة كاملة للموظف البديل أو المستلم الجديد' : 'Grants full fresh SLA duration to newly assigned staff'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section D: Alerts & Escalation Thresholds (Section 5 Requirement) */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 text-sm block border-b pb-1">
                  {isRtl ? '4. التنبيهات ومستويات التأخير والتصعيد' : '4. Alerts & Managerial Escalation Thresholds'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAlertBeforePercent > 0}
                      onChange={e => setFormAlertBeforePercent(e.target.checked ? 75 : 0)}
                      className="w-4 h-4 text-bct-navy rounded"
                    />
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'تنبيه مبكر عند الوصول إلى 75% من المدة' : 'Early warning alert at 75% duration'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAlertBreached}
                      onChange={e => setFormAlertBreached(e.target.checked)}
                      className="w-4 h-4 text-bct-navy rounded"
                    />
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'تنبيه فوري عند تجاوز مهلة الـ SLA' : 'Instant red alert on SLA breach'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'تصعيد التأخير إلى المدير بعد (ساعات)' : 'Escalate to Manager After (Hours)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formEscalateAfterHours}
                      onChange={e => setFormEscalateAfterHours(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isRtl ? 'المستوى الإداري المستلم للتصعيد' : 'Escalation Target Role'}
                    </label>
                    <select
                      value={formEscalationRole}
                      onChange={e => setFormEscalationRole(e.target.value as SLAEscalationRole)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-bct-navy focus:outline-none"
                    >
                      <option value="ops_mgr">{isRtl ? 'مدير العمليات وشؤون الطلاب' : 'Operations Manager'}</option>
                      <option value="department_head">{isRtl ? 'رئيس القسم المسؤول' : 'Department Head'}</option>
                      <option value="qa_officer">{isRtl ? 'مسؤول الجودة والامتثال' : 'Quality Officer'}</option>
                      <option value="gm">{isRtl ? 'المدير العام (GM)' : 'General Manager'}</option>
                      <option value="branch_mgr">{isRtl ? 'مدير الفرع' : 'Branch Manager'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section E: Application Scope for In-Progress Tasks (Section 10 Requirement) */}
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="font-extrabold text-amber-900 text-sm block">
                  {isRtl ? '5. نطاق تطبيق التعديل (المهام الجارية مقابل الجديدة)' : '5. Application Scope (In-Progress vs New Tasks)'}
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="apply_scope"
                      value="all_active"
                      checked={modalApplyScope === 'all_active'}
                      onChange={() => setModalApplyScope('all_active')}
                      className="mt-0.5 text-bct-navy"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? 'تطبيق على المهام والملفات الجارية أيضاً (تحديث فوري)' : 'Apply to in-progress active tasks as well (immediate recalculation)'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isRtl ? 'يقوم النظام بإعادة احتساب مواعيد الاستحقاق ومؤشرات التأخير للملفات النشطة في هذه المرحلة فوراً.' : 'Recalculates deadlines and overdue badges for all currently active files in this stage.'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="apply_scope"
                      value="new_only"
                      checked={modalApplyScope === 'new_only'}
                      onChange={() => setModalApplyScope('new_only')}
                      className="mt-0.5 text-bct-navy"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {isRtl ? 'تطبيق على المهام والملفات الجديدة فقط' : 'Apply to newly created tasks only'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isRtl ? 'الاحتفاظ بمواعيد استحقاق المهام الجارية دون تغيير وتطبيق المدة الجديدة فقط على القادم.' : 'Leaves existing in-flight task deadlines intact.'}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-amber-200/80 flex items-center gap-1.5 text-[10px] text-amber-800 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {isRtl
                      ? 'ملاحظة تدقيق إلزامية: السجلات التاريخية والملفات المغلقة/المؤرشفة تظل محفوظة دون تعديل لضمان سلامة التدقيق.'
                      : 'Audit Guarantee: Closed and archived records are strictly preserved without modification.'}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy hover:bg-bct-navy-dark text-white font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? (isRtl ? 'حفظ التعديلات وتطبيقها' : 'Update & Apply') : (isRtl ? 'إضافة المعيار' : 'Create Benchmark')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isRtl ? 'تأكيد حذف معيار SLA' : 'Confirm SLA Benchmark Deletion'}
                </h4>
                <span className="font-mono text-[10px] text-slate-400">{itemToDelete.code}</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              {isRtl
                ? `هل أنت متأكد من حذف معيار "${itemToDelete.name_ar}"؟ لن يتم حذف أي مهام سابقة مرتبطة به، ولكن سيتم إزالته من لوحة معايير SLA.`
                : `Are you sure you want to delete benchmark "${itemToDelete.name_en}"? Existing tasks will not be deleted.`}
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
              >
                {isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
