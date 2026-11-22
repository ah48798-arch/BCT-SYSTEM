import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { AuditLog } from '../types/database.types';
import { AuditDetailModal } from '../components/audit/AuditDetailModal';
import { getActionEventMeta } from '../services/actionEventService';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Database,
  ArrowRight,
  Eye,
  CheckCircle2,
  Lock,
  Layers,
  X,
  CreditCard,
  ShieldCheck,
  Calendar,
  RotateCcw,
  GitCompare,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Hash,
  Activity,
  AlertCircle
} from 'lucide-react';

const ACTION_COLOR_MAP: Record<string, string> = {
  // Student & Academic Lifecycle
  'CREATE_STUDENT': 'bg-blue-50 text-blue-700 border-blue-200',
  'UPDATE_STUDENT': 'bg-blue-50 text-blue-700 border-blue-200',
  'DELETE_STUDENT': 'bg-rose-50 text-rose-700 border-rose-200',
  'CREATE_STUDENT_FILE': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'UPDATE_STUDENT_FILE': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'ARCHIVE_STUDENT_FILE': 'bg-slate-100 text-slate-700 border-slate-300',
  'REOPEN_STUDENT_FILE': 'bg-orange-50 text-orange-700 border-orange-300',
  'EVALUATE_STUDENT_FILE': 'bg-purple-50 text-purple-700 border-purple-200',
  'UPDATE_CHOICES': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'ADD_PREFERENCE': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'REORDER_PREFERENCES': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'DELETE_PREFERENCE': 'bg-rose-50 text-rose-700 border-rose-200',
  'LIFECYCLE_TRANSITION': 'bg-blue-50 text-blue-700 border-blue-200',

  // File Activity Audit Trail
  'FILE_ACTIVITY_FILE_CREATED': 'bg-blue-50 text-blue-700 border-blue-200',
  'FILE_ACTIVITY_STAGE_TRANSITION': 'bg-purple-50 text-purple-700 border-purple-200',
  'FILE_ACTIVITY_FILE_ASSIGNED': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'FILE_ACTIVITY_FILE_REASSIGNED': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'FILE_ACTIVITY_DOCUMENTS_VERIFIED': 'bg-amber-50 text-amber-700 border-amber-200',
  'FILE_ACTIVITY_APPLICATION_SUBMITTED': 'bg-teal-50 text-teal-700 border-teal-200',
  'FILE_ACTIVITY_PAYMENT_CONFIRMED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'FILE_ACTIVITY_FILE_APPROVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'FILE_ACTIVITY_FILE_CLOSED': 'bg-slate-100 text-slate-700 border-slate-200',
  'FILE_ACTIVITY_FILE_REOPENED': 'bg-orange-50 text-orange-700 border-orange-200',
  'FILE_ACTIVITY_CHOICES_UPDATED': 'bg-sky-50 text-sky-700 border-sky-200',
  'FILE_CHOICES_UPDATED': 'bg-sky-50 text-sky-700 border-sky-200',
  'FILE_ACTIVITY_NOTE_ADDED': 'bg-amber-50 text-amber-800 border-amber-300',

  // Financial & Collections
  'CREATE_PAYMENT': 'bg-amber-50 text-amber-700 border-amber-200',
  'UPDATE_PAYMENT_DESCRIPTION': 'bg-amber-50 text-amber-700 border-amber-200',
  'CONFIRM_PAYMENT': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PAYMENT_CONFIRMATION': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'REJECT_PAYMENT': 'bg-rose-50 text-rose-700 border-rose-200',
  'REVERSE_PAYMENT': 'bg-rose-50 text-rose-700 border-rose-200',
  'CORRECT_PAYMENT_METHOD': 'bg-amber-50 text-amber-700 border-amber-200',
  'PRINT_PAYMENT_VOUCHER': 'bg-slate-100 text-slate-700 border-slate-200',
  'CREATE_INTERNAL_TRANSFER': 'bg-blue-50 text-blue-700 border-blue-200',
  'POST_ACCOUNT_MOVEMENT': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'CREATE_BUDGET': 'bg-purple-50 text-purple-700 border-purple-200',
  'UPDATE_BUDGET': 'bg-purple-50 text-purple-700 border-purple-200',
  'UPDATE_EXCHANGE_RATE': 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Expenses
  'CREATE_EXPENSE': 'bg-rose-50 text-rose-700 border-rose-200',
  'UPDATE_EXPENSE_STATUS': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'EXPENSE_APPROVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'EXPENSE_REJECTED': 'bg-rose-50 text-rose-700 border-rose-200',
  'EXPENSE_PAID': 'bg-blue-50 text-blue-700 border-blue-200',
  'EXPENSE_CANCELLED': 'bg-slate-100 text-slate-700 border-slate-200',
  'CORRECT_EXPENSE_PAYMENT_METHOD': 'bg-amber-50 text-amber-700 border-amber-200',

  // Incentives
  'CREATE_EMPLOYEE_INCENTIVE': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'APPROVE_EMPLOYEE_INCENTIVE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'PAY_EMPLOYEE_INCENTIVE': 'bg-teal-50 text-teal-700 border-teal-200',

  // Campaigns & Capacity Gate
  'CREATE_CAMPAIGN': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'UPDATE_CAMPAIGN': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'SUBMIT_CAPACITY_GATE': 'bg-amber-50 text-amber-700 border-amber-200',
  'APPROVE_CAPACITY_GATE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CAPACITY_GATE_APPROVAL': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'REJECT_CAPACITY_GATE': 'bg-rose-50 text-rose-700 border-rose-200',
  'REQUEST_CAPACITY_ADJUSTMENT': 'bg-amber-50 text-amber-700 border-amber-200',
  'ADJUST_CAPACITY': 'bg-sky-50 text-sky-700 border-sky-200',
  'CANCEL_CAMPAIGN': 'bg-slate-100 text-slate-700 border-slate-200',

  // HR, Users & Permissions
  'CREATE_EMPLOYEE': 'bg-blue-50 text-blue-700 border-blue-200',
  'UPDATE_EMPLOYEE': 'bg-blue-50 text-blue-700 border-blue-200',
  'DELETE_EMPLOYEE': 'bg-rose-50 text-rose-700 border-rose-200',
  'UPDATE_PERMISSIONS': 'bg-purple-50 text-purple-700 border-purple-200',
  'UPDATE_EMPLOYEE_PERMISSIONS': 'bg-purple-50 text-purple-700 border-purple-200',
  'CREATE_DEPARTMENT': 'bg-teal-50 text-teal-700 border-teal-200',
  'UPDATE_DEPARTMENT': 'bg-teal-50 text-teal-700 border-teal-200',
  'DELETE_DEPARTMENT': 'bg-rose-50 text-rose-700 border-rose-200',
  'UPDATE_JOB_POSITION': 'bg-teal-50 text-teal-700 border-teal-200',
  'ASSIGN_BACKUP': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'ASSIGN_BACKUP_ROLE': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'UPDATE_BACKUP_ROLE': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'DELETE_BACKUP_ASSIGNMENT': 'bg-rose-50 text-rose-700 border-rose-200',
  'REMOVE_BACKUP_ROLE': 'bg-rose-50 text-rose-700 border-rose-200',
  'CREATE_EVALUATION': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CREATE_PERFORMANCE_EVALUATION': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'UPDATE_PERFORMANCE_EVALUATION': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'DELETE_PERFORMANCE_EVALUATION': 'bg-rose-50 text-rose-700 border-rose-200',

  // Security & Authentication
  'LOGIN_SUCCESS': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'LOGOUT': 'bg-slate-100 text-slate-700 border-slate-200',
  'SWITCH_ACCOUNT': 'bg-purple-50 text-purple-700 border-purple-200',
  'SESSION_TIMEOUT_INACTIVITY': 'bg-amber-50 text-amber-700 border-amber-200',
  'AUTH_DENIED_UNKNOWN_USER': 'bg-rose-50 text-rose-700 border-rose-200',
  'AUTH_DENIED_INACTIVE_USER': 'bg-rose-50 text-rose-700 border-rose-200',
  'UNAUTHORIZED_ACCESS_DENIED': 'bg-rose-50 text-rose-700 border-rose-200',
  'SECURITY_BLOCK_LAST_ADMIN_DEACTIVATION': 'bg-rose-50 text-rose-700 border-rose-200',
  'SECURITY_BLOCK_LAST_ADMIN_PRIVILEGE_STRIP': 'bg-rose-50 text-rose-700 border-rose-200',

  // System, SLAs & Academic Catalog
  'UPDATE_SYSTEM_SETTINGS': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'SYSTEM_INITIALIZATION': 'bg-blue-50 text-blue-700 border-blue-200',
  'UPDATE_SLA_CONFIG': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'TOGGLE_SLA_STATUS': 'bg-amber-50 text-amber-700 border-amber-200',
  'CREATE_RECORD': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'UPDATE_RECORD': 'bg-blue-50 text-blue-700 border-blue-200',
  'DELETE_RECORD': 'bg-rose-50 text-rose-700 border-rose-200',
  'CUSTOMER_HANDOVER_TO_CONSULTANT': 'bg-teal-50 text-teal-700 border-teal-200',

  // System User Administration & Password Management
  'ACTIVATE_SYSTEM_USER': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'DEACTIVATE_SYSTEM_USER': 'bg-rose-50 text-rose-700 border-rose-200',
  'CREATE_SYSTEM_USER': 'bg-blue-50 text-blue-700 border-blue-200',
  'RESET_USER_PASSWORD': 'bg-amber-50 text-amber-700 border-amber-200',
  'REPAIR_USER_ACCOUNT': 'bg-teal-50 text-teal-700 border-teal-200',
  'CHANGE_FIRST_LOGIN_PASSWORD': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'LOGIN_FAILED_WRONG_PASSWORD': 'bg-rose-50 text-rose-700 border-rose-200',
  'RECONCILE_SYSTEM_USERS': 'bg-purple-50 text-purple-700 border-purple-200',

  // Incentive Policies, Complaints & Stagnant Files
  'CREATE_INCENTIVE_POLICY': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'UPDATE_INCENTIVE_POLICY': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'CREATE_COMPLAINT': 'bg-rose-50 text-rose-700 border-rose-200',
  'RESOLVE_COMPLAINT': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'UPDATE_COMPLAINT_CORRECTIVE_ACTION': 'bg-purple-50 text-purple-700 border-purple-200',
  'CREATE_TASK': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'UPDATE_TASK_STATUS': 'bg-sky-50 text-sky-700 border-sky-200',
  'CREATE_HANDOFF': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'RESOLVE_HANDOFF_APPROVED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RESOLVE_HANDOFF_REJECTED': 'bg-rose-50 text-rose-700 border-rose-200',
  'RECORD_MEETING': 'bg-purple-50 text-purple-700 border-purple-200',
  'CREATE_SLA_CONFIG': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'DELETE_SLA_CONFIG': 'bg-rose-50 text-rose-700 border-rose-200',
  'ESCALATE_STAGNANT_FILE': 'bg-amber-50 text-amber-700 border-amber-200'
};

export const AuditLogViewer: React.FC = () => {
  const { language, isRtl, t } = useLanguage();
  const { currentEmployee } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>(bctStore.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const unsub = bctStore.subscribe(() => {
      setLogs([...bctStore.getAuditLogs()]);
    });
    return unsub;
  }, []);

  const getActionColor = (action: string) => {
    return getActionEventMeta(action, language).color || ACTION_COLOR_MAP[action] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getActionCategory = (action: string): string => {
    const meta = getActionEventMeta(action, language);
    if (meta.category && meta.category !== 'general') return meta.category;
    if (action.includes('STUDENT') || action.includes('PREFERENCE') || action.includes('CHOICES')) return 'student';
    if (action.includes('FILE')) return 'file';
    if (action.includes('PAYMENT') || action.includes('TRANSFER') || action.includes('EXCHANGE') || action.includes('BUDGET')) return 'finance';
    if (action.includes('EXPENSE')) return 'expense';
    if (action.includes('EMPLOYEE') || action.includes('DEPARTMENT') || action.includes('EVALUATION') || action.includes('POSITION') || action.includes('BACKUP')) return 'hr';
    if (action.includes('CAMPAIGN') || action.includes('CAPACITY')) return 'campaign';
    if (action.includes('AUTH') || action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('SECURITY') || action.includes('SETTINGS') || action.includes('SLA')) return 'security';
    return 'general';
  };

  const getActorDisplayName = (username: string): string => {
    const employees = bctStore.getEmployees();
    const emp = employees.find(e => e.username === username);
    if (emp) {
      if (language === 'ar' && emp.full_name_ar) return emp.full_name_ar;
      if (language === 'en' && emp.full_name_en) return emp.full_name_en;
      return emp.full_name_ar || emp.full_name_en || username;
    }
    return username;
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const todayCount = logs.filter(l => {
      try {
        return new Date(l.created_at).toDateString() === todayStr;
      } catch {
        return false;
      }
    }).length;

    const financialCount = logs.filter(l => {
      const isFinResource = ['payment', 'payment_record', 'expense', 'expense_record', 'department_budget', 'financial_account', 'internal_transfer'].includes(l.resource_type);
      const isFinAction = l.action.includes('PAYMENT') || l.action.includes('EXPENSE') || l.action.includes('TRANSFER') || l.action.includes('BUDGET');
      return isFinResource || isFinAction;
    }).length;

    const securityCount = logs.filter(l => {
      const isSecResource = ['auth', 'settings', 'employee', 'sla'].includes(l.resource_type);
      const isSecAction = l.action.includes('AUTH') || l.action.includes('PERMISSION') || l.action.includes('LOGIN') || l.action.includes('SECURITY');
      return isSecResource || isSecAction;
    }).length;

    return {
      total: logs.length,
      today: todayCount,
      financial: financialCount,
      security: securityCount
    };
  }, [logs]);

  // Filtering Logic
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return logs.filter(log => {
      const meta = getActionEventMeta(log.action, language);
      const actionLabel = meta.label;
      const actionDesc = meta.description;
      const resourceLabel = t(`audit.resources.${log.resource_type}`, log.resource_type);
      const actorName = getActorDisplayName(log.actor_username);

      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.actor_username.toLowerCase().includes(searchLower) ||
        actorName.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        actionLabel.toLowerCase().includes(searchLower) ||
        actionDesc.toLowerCase().includes(searchLower) ||
        (log.resource_id || '').toLowerCase().includes(searchLower) ||
        log.resource_type.toLowerCase().includes(searchLower) ||
        resourceLabel.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Action Filter
      if (filterAction !== 'all' && log.action !== filterAction) {
        return false;
      }

      // Category Filter
      if (filterCategory !== 'all') {
        const cat = meta.category;
        const macro = meta.macroCategory;
        const res = log.resource_type;

        const isFin = ['payment', 'payment_record', 'expense', 'expense_record', 'department_budget', 'financial_account', 'internal_transfer', 'incentive_policy', 'employee_incentive'].includes(res) || macro === 'financial' || cat === 'finance' || cat === 'expense';
        const isAcad = ['student', 'student_file', 'university_catalog', 'university_faculty', 'academic_specialization', 'task', 'departmental_handoff'].includes(res) || macro === 'management_operations' || cat === 'student' || cat === 'file' || cat === 'task';
        const isHr = ['employee', 'department', 'job_position', 'backup_role', 'evaluation', 'performance_evaluation', 'hr_backup'].includes(res) || macro === 'hr' || cat === 'hr';
        const isCap = ['campaign', 'marketing_campaign', 'capacity_settings', 'capacity_adjustment'].includes(res) || cat === 'campaign';
        const isQuality = ['complaint', 'sla', 'sla_config'].includes(res) || macro === 'quality_complaints' || cat === 'complaint' || cat === 'sla';
        const isSec = ['auth', 'settings', 'organization'].includes(res) || macro === 'system_security' || cat === 'security';

        if (filterCategory === 'financial' && !isFin) return false;
        if (filterCategory === 'academic' && !isAcad) return false;
        if (filterCategory === 'hr' && !isHr) return false;
        if (filterCategory === 'capacity' && !isCap) return false;
        if (filterCategory === 'quality' && !isQuality) return false;
        if (filterCategory === 'security' && !isSec) return false;
      }

      // Date Filter
      if (filterDate !== 'all') {
        try {
          const logTime = new Date(log.created_at).getTime();
          const diffMs = now - logTime;

          if (filterDate === 'today') {
            const isToday = new Date(log.created_at).toDateString() === new Date().toDateString();
            if (!isToday) return false;
          } else if (filterDate === '7days') {
            if (diffMs > 7 * oneDayMs) return false;
          } else if (filterDate === '30days') {
            if (diffMs > 30 * oneDayMs) return false;
          }
        } catch {
          // Keep log if date fails
        }
      }

      return true;
    });
  }, [logs, searchTerm, filterAction, filterCategory, filterDate, language]);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setFilterCategory('all');
    setFilterDate('all');
  };

  const hasActiveFilters = searchTerm !== '' || filterAction !== 'all' || filterCategory !== 'all' || filterDate !== 'all';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#154568] text-white rounded-2xl shadow-sm">
              <ShieldAlert className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t('audit.title')}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('audit.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-800 shadow-sm">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>{t('audit.appendOnly')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 px-3.5 py-2 rounded-2xl text-xs font-mono text-slate-700">
            <Database className="w-4 h-4 text-[#154568]" />
            <span>{logs.length} {t('audit.loggedOperations')}</span>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('audit.kpis.total')}
            </span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums mt-1 block">
              {metrics.total.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#154568] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('audit.kpis.today')}
            </span>
            <span className="text-xl font-extrabold text-emerald-600 tabular-nums mt-1 block">
              {metrics.today.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Financial Logs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('audit.kpis.financial')}
            </span>
            <span className="text-xl font-extrabold text-amber-600 tabular-nums mt-1 block">
              {metrics.financial.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">
              {t('audit.kpis.security')}
            </span>
            <span className="text-xl font-extrabold text-purple-600 tabular-nums mt-1 block">
              {metrics.security.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Main Search Input */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder={t('audit.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 text-xs focus:ring-2 focus:ring-[#154568] focus:outline-none transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#154568] focus:outline-none text-slate-700"
            >
              <option value="all">{t('audit.filters.allCategories')}</option>
              <option value="academic">{t('audit.filters.categoryAcademic')}</option>
              <option value="hr">{t('audit.filters.categoryHr')}</option>
              <option value="financial">{t('audit.filters.categoryFinancial')}</option>
              <option value="quality">{t('audit.filters.categoryQuality')}</option>
              <option value="capacity">{t('audit.filters.categoryCapacity')}</option>
              <option value="security">{t('audit.filters.categorySecurity')}</option>
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="md:col-span-2">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#154568] focus:outline-none text-slate-700 truncate"
            >
              <option value="all">{t('audit.filters.allActions')}</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {getActionEventMeta(action, language).label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-2">
            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#154568] focus:outline-none text-slate-700"
            >
              <option value="all">{t('audit.filters.allDates')}</option>
              <option value="today">{t('audit.filters.today')}</option>
              <option value="7days">{t('audit.filters.last7Days')}</option>
              <option value="30days">{t('audit.filters.last30Days')}</option>
            </select>
          </div>
        </div>

        {/* Filter stats & Reset button */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {t('audit.filters.showingCount', { count: filteredLogs.length, total: logs.length })}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#154568] hover:text-sky-700 font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('audit.filters.resetFilters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4 w-[16%]">{t('audit.table.colTimestamp')}</th>
                <th className="py-3.5 px-4 w-[18%]">{t('audit.table.colActor')}</th>
                <th className="py-3.5 px-4 w-[26%]">{t('audit.table.colAction')}</th>
                <th className="py-3.5 px-4 w-[16%]">{t('audit.table.colResource')}</th>
                <th className="py-3.5 px-4 w-[14%]">{t('audit.table.colResourceId')}</th>
                <th className="py-3.5 px-4 w-[10%] text-center">{t('audit.table.colDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-600">
                      {t('audit.filters.noResults')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('audit.filters.noResultsHint')}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 px-4 py-2 bg-[#154568] text-white rounded-xl text-xs font-bold hover:bg-[#0f3450] transition-colors"
                      >
                        {t('audit.filters.resetFilters')}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const meta = getActionEventMeta(log.action, language);
                  const color = meta.color;
                  const actionText = meta.label;
                  const resourceText = t(`audit.resources.${log.resource_type}`, log.resource_type);
                  const actorText = getActorDisplayName(log.actor_username);
                  const categoryText = t(`audit.actionCategories.${meta.category}`, meta.category);

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        <div className="flex flex-col gap-0.5" dir="ltr">
                          <span className="font-bold text-slate-700">
                            {new Date(log.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-white text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200">
                            {actorText.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="truncate block font-bold text-slate-800">{actorText}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate" dir="ltr">
                              {log.actor_username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1 max-w-[280px]">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${color} truncate max-w-full`}>
                            {actionText}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-full font-normal">
                            {meta.description}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-semibold">
                              {meta.departmentLabel}
                            </span>
                            <span>•</span>
                            <span>{meta.macroCategoryLabel}</span>
                          </div>
                        </div>
                      </td>

                      {/* Resource */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <span className="block text-slate-800 font-semibold truncate">
                          {resourceText}
                        </span>
                        {language === 'en' ? (
                          <span className="text-[10px] font-mono text-slate-400 block truncate" dir="ltr">
                            {log.resource_type}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block truncate font-medium">
                            {t('audit.shortTitle')}
                          </span>
                        )}
                      </td>

                      {/* Resource ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#154568]">
                        <span
                          className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] border border-slate-200 block truncate max-w-[140px]"
                          dir="ltr"
                        >
                          {log.resource_id || '—'}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-2 hover:bg-white text-[#154568] group-hover:shadow-sm rounded-xl transition-all border border-transparent group-hover:border-slate-200"
                          title={t('audit.table.colInspect')}
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgraded Audit Details Modal */}
      {selectedLog && (
        <AuditDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          isRtl={isRtl}
          actionMeta={{
            ar: getActionEventMeta(selectedLog.action, 'ar').label,
            en: getActionEventMeta(selectedLog.action, 'en').label,
            color: getActionEventMeta(selectedLog.action, language).color
          }}
          resourceMeta={{
            ar: t(`audit.resources.${selectedLog.resource_type}`, selectedLog.resource_type),
            en: t(`audit.resources.${selectedLog.resource_type}`, selectedLog.resource_type)
          }}
        />
      )}
    </div>
  );
};
