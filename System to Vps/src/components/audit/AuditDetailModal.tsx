import React, { useState, useEffect, useMemo } from 'react';
import { AuditLog } from '../../types/database.types';
import { useLanguage } from '../../context/LanguageContext';
import { bctStore } from '../../services/store';
import { getActionEventMeta } from '../../services/actionEventService';
import {
  computeDiff,
  getDiffStats,
  formatDiffValue,
  DiffNode
} from '../../utils/auditDiff';
import {
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  User,
  Clock,
  Layers,
  Hash,
  Database,
  ArrowRight,
  ArrowLeft,
  Search,
  GitCompare,
  FileText,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Calendar,
  Activity
} from 'lucide-react';

interface AuditDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
  isRtl: boolean;
  actionMeta: { ar: string; en: string; color: string };
  resourceMeta?: { ar: string; en: string };
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  log,
  onClose,
  isRtl,
  actionMeta,
  resourceMeta
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'metadata' | 'diff'>('metadata');
  const [showAllFields, setShowAllFields] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!log) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [log, onClose]);

  // Compute diff and stats internally
  const diffNodes = useMemo(() => {
    if (!log) return [];
    return computeDiff(log.old_state, log.new_state);
  }, [log]);

  const stats = useMemo(() => {
    return getDiffStats(diffNodes);
  }, [diffNodes]);

  // Auto-expand modified nodes initially
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    const traverse = (nodes: DiffNode[]) => {
      for (const node of nodes) {
        if (node.isNested && node.children) {
          const hasChange = node.children.some(c => c.type !== 'unchanged');
          if (hasChange) {
            initialExpanded[node.path] = true;
          }
          traverse(node.children);
        }
      }
    };
    traverse(diffNodes);
    setExpandedNodes(initialExpanded);
  }, [diffNodes]);

  const toggleExpand = (path: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
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

  if (!log) return null;

  // Filter diff nodes based on search and showAllFields
  const filterNode = (node: DiffNode): boolean => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      node.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.labelAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(node.oldValue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(node.newValue || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (!showAllFields && node.type === 'unchanged') {
      return false;
    }

    return true;
  };

  const filteredNodes = diffNodes.filter(filterNode);
  const totalChanges = stats.added + stats.modified + stats.removed;

  const actionMetaResolved = getActionEventMeta(log.action, language);
  const actionDisplay = actionMetaResolved.label || t(`audit.actions.${log.action}`, actionMeta[language] || log.action);
  const resourceDisplay = t(`audit.resources.${log.resource_type}`, resourceMeta ? resourceMeta[language] : log.resource_type);
  const actorDisplay = getActorDisplayName(log.actor_username);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="bg-[#154568] text-white p-5 sm:p-6 sticky top-0 z-20 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 bg-white/10 rounded-lg text-white">
                  <ShieldCheck className="w-5 h-5 text-sky-300" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {actionDisplay}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/15 text-blue-100 border border-white/20 font-bold font-mono" dir="ltr">
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-1">
                {actionMetaResolved.description}
              </p>
              <p className="text-xs text-blue-200/90 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[11px] font-semibold text-white">
                  {actionMetaResolved.departmentLabel}
                </span>
                <span className="opacity-40">•</span>
                <span>{actionMetaResolved.macroCategoryLabel}</span>
                <span className="opacity-40">•</span>
                <span>{t('audit.modal.auditId')}: #{log.id}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
              title={`${t('audit.modal.footer.close')} (Esc)`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metadata Pill Strip */}
          <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Actor */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <User className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] text-blue-200 font-medium">
                  {t('audit.table.colActor')}
                </span>
                <span className="font-bold text-white truncate block">
                  {actorDisplay}
                </span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] text-blue-200 font-medium">
                  {t('audit.table.colTimestamp')}
                </span>
                <span className="font-mono text-[11px] text-white truncate block" dir="ltr">
                  {new Date(log.created_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            </div>

            {/* Affected Resource */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <Layers className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="truncate">
                <span className="block text-[10px] text-blue-200 font-medium">
                  {t('audit.table.colResource')}
                </span>
                <span className="font-bold text-white truncate block">
                  {resourceDisplay}
                </span>
              </div>
            </div>

            {/* Resource ID */}
            <div className="flex items-center justify-between gap-2 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-purple-300 shrink-0" />
                <div className="truncate">
                  <span className="block text-[10px] text-blue-200 font-medium">
                    {t('audit.table.colResourceId')}
                  </span>
                  <span className="font-mono font-bold text-white truncate block" dir="ltr">
                    {log.resource_id || '—'}
                  </span>
                </div>
              </div>
              {log.resource_id && (
                <button
                  type="button"
                  onClick={() => handleCopy(log.resource_id || '', 'header_resource_id')}
                  className="p-1 hover:bg-white/15 rounded text-white/80 hover:text-white transition-colors"
                  title={t('audit.modal.footer.copyEntry')}
                >
                  {copiedKey === 'header_resource_id' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs (2 Clean Tabs: Security & Audit Card + Field Comparison Diff) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('metadata')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'metadata'
                  ? 'bg-[#154568] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('audit.modal.tabs.security')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'diff'
                  ? 'bg-[#154568] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{t('audit.modal.tabs.diff')}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'diff'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {totalChanges}
              </span>
            </button>
          </div>

          {activeTab === 'diff' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllFields(!showAllFields)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all flex items-center gap-1.5 ${
                  showAllFields
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {showAllFields
                    ? t('audit.modal.toggle.showAll', { count: diffNodes.length })
                    : t('audit.modal.toggle.showModified', { count: totalChanges })}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(92vh-190px)] space-y-6">
          {/* PRIMARY TAB: SECURITY & AUDIT CARD */}
          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* 1. Operation Detailed Overview Cards */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Activity className="w-5 h-5 text-[#154568]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t('audit.modal.security.opOverview')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Actor / Employee */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <User className="w-4 h-4 text-sky-600" />
                      <span>{t('audit.modal.security.actorTitle')}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 text-sm">{actorDisplay}</div>
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]" dir="ltr">
                        <span>@{log.actor_username}</span>
                        {log.actor_id && (
                          <>
                            <span>•</span>
                            <span>ID: {log.actor_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action & Category */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>{t('audit.modal.security.actionTitle')}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${actionMetaResolved.color}`}>
                          {actionDisplay}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400" dir="ltr">
                          ({log.action})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[11px] font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {actionMetaResolved.departmentLabel}
                        </span>
                        <span>•</span>
                        <span>{actionMetaResolved.macroCategoryLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Affected Resource */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>{t('audit.modal.security.resourceTitle')}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 text-sm">{resourceDisplay}</div>
                      <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]" dir="ltr">
                        <span>Ref: {log.resource_id || '—'}</span>
                        <span>•</span>
                        <span>Type: {log.resource_type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{t('audit.modal.security.timestampTitle')}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {new Date(log.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]" dir="ltr">
                        {new Date(log.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                        <span className="text-slate-400 text-[10px] ml-2">({log.created_at})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Operational Description & Integrity Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t('audit.modal.security.title')}
                  </h3>
                </div>

                {/* Operational Description Banner */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase">
                    {t('audit.modal.security.descriptionTitle')}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {actionMetaResolved.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Immutability & Status */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                    <span className="font-bold text-emerald-900 block">
                      {t('audit.modal.security.statusTitle')}
                    </span>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t('audit.modal.security.immutable')}</span>
                    </div>
                    <p className="text-emerald-800/80 text-[11px] leading-relaxed">
                      {t('audit.modal.security.immutableDesc')}
                    </p>
                  </div>

                  {/* Network & Host Environment */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block">
                      {t('audit.modal.security.networkTitle')}
                    </span>
                    <div className="space-y-1.5 font-mono text-[11px] text-slate-600" dir="ltr">
                      <div className="truncate">IP: {log.ip_address || '127.0.0.1 / Local Secure'}</div>
                      <div className="truncate">Client: {log.user_agent || 'BCT Enterprise App'}</div>
                      <div>Audit ID: #{log.id}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Administrative Changes Summary & Diff CTA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {t('audit.modal.security.changesSummaryTitle')}
                    </h3>
                  </div>
                  {totalChanges > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('diff')}
                      className="text-xs font-bold text-[#154568] hover:text-[#0f3450] flex items-center gap-1 transition-colors"
                    >
                      <span>{t('audit.modal.security.viewDiffBtn')}</span>
                      {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Diff Stats Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      +
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-800 block">
                        {t('audit.modal.stats.added')}
                      </span>
                      <span className="text-base font-extrabold text-emerald-950 tabular-nums">
                        {stats.added}
                      </span>
                    </div>
                  </div>

                  <div className="bg-sky-50 border border-sky-200/80 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      ✎
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-sky-800 block">
                        {t('audit.modal.stats.modified')}
                      </span>
                      <span className="text-base font-extrabold text-sky-950 tabular-nums">
                        {stats.modified}
                      </span>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      -
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-rose-800 block">
                        {t('audit.modal.stats.removed')}
                      </span>
                      <span className="text-base font-extrabold text-rose-950 tabular-nums">
                        {stats.removed}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      =
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600 block">
                        {t('audit.modal.stats.unchanged')}
                      </span>
                      <span className="text-base font-extrabold text-slate-800 tabular-nums">
                        {stats.unchanged}
                      </span>
                    </div>
                  </div>
                </div>

                {totalChanges > 0 ? (
                  <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-sky-900 font-medium">
                      {t('audit.modal.security.viewDiffPrompt', { count: totalChanges })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('diff')}
                      className="px-4 py-2 bg-[#154568] hover:bg-[#0f3450] text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>{t('audit.modal.security.viewDiffBtn')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-500 text-center font-medium">
                    {t('audit.modal.security.noChangesNotice')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL DIFF (FIELD-BY-FIELD COMPARISON TABLE - ZERO RAW JSON) */}
          {activeTab === 'diff' && (
            <div className="space-y-5">
              {/* Diff Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Added - Green */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    +
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 block">
                      {t('audit.modal.stats.added')}
                    </span>
                    <span className="text-lg font-extrabold text-emerald-950 tabular-nums">
                      {stats.added}
                    </span>
                  </div>
                </div>

                {/* Modified - Blue */}
                <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    ✎
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-sky-800 block">
                      {t('audit.modal.stats.modified')}
                    </span>
                    <span className="text-lg font-extrabold text-sky-950 tabular-nums">
                      {stats.modified}
                    </span>
                  </div>
                </div>

                {/* Removed - Red */}
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    -
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-rose-800 block">
                      {t('audit.modal.stats.removed')}
                    </span>
                    <span className="text-lg font-extrabold text-rose-950 tabular-nums">
                      {stats.removed}
                    </span>
                  </div>
                </div>

                {/* Unchanged - Gray */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    =
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      {t('audit.modal.stats.unchanged')}
                    </span>
                    <span className="text-lg font-extrabold text-slate-800 tabular-nums">
                      {stats.unchanged}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diff Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 rtl:right-3.5 ltr:left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('audit.modal.searchDiffPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 text-xs focus:ring-2 focus:ring-[#154568] focus:outline-none"
                />
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right rtl:text-right ltr:text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                        <th className="py-3 px-4 w-[28%]">{t('audit.modal.colField')}</th>
                        <th className="py-3 px-4 w-[32%] bg-rose-50/40 text-rose-900 border-x border-slate-200/60">
                          {t('audit.modal.colOldState')}
                        </th>
                        <th className="py-3 px-4 w-[32%] bg-emerald-50/40 text-emerald-900">
                          {t('audit.modal.colNewState')}
                        </th>
                        <th className="py-3 px-4 w-[8%] text-center">{t('audit.modal.colType')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredNodes.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-bold text-sm text-slate-600">
                              {t('audit.filters.noResults')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {t('audit.filters.noResultsHint')}
                            </p>
                            {!showAllFields && stats.unchanged > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowAllFields(true)}
                                className="mt-3 px-4 py-1.5 bg-[#154568] text-white rounded-xl text-xs font-bold hover:bg-[#0f3450] transition-colors"
                              >
                                {t('audit.modal.toggle.showAll', { count: diffNodes.length })}
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredNodes.map(node => (
                          <DiffRowRenderer
                            key={node.path}
                            node={node}
                            language={language}
                            expandedNodes={expandedNodes}
                            onToggleExpand={toggleExpand}
                            showAllFields={showAllFields}
                            t={t}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-4 sticky bottom-0 z-20">
          <div className="text-xs text-slate-500 font-medium">
            {t('audit.modal.footer.summary', {
              total: totalChanges,
              added: stats.added,
              modified: stats.modified,
              removed: stats.removed
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#154568] hover:bg-[#0f3450] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              {t('audit.modal.footer.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sub-component for rendering each diff row (Visual comparison table with zero raw JSON)
 */
interface DiffRowRendererProps {
  node: DiffNode;
  language: 'ar' | 'en';
  expandedNodes: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
  showAllFields: boolean;
  depth?: number;
  t: (key: string, paramsOrFallback?: any) => string;
}

const DiffRowRenderer: React.FC<DiffRowRendererProps> = ({
  node,
  language,
  expandedNodes,
  onToggleExpand,
  showAllFields,
  depth = 0,
  t
}) => {
  const isExpanded = !!expandedNodes[node.path];
  const isRtl = language === 'ar';

  let rowBg = 'hover:bg-slate-50';
  let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
  let badgeLabel = t('audit.modal.badges.unchanged');

  if (node.type === 'added') {
    rowBg = 'bg-emerald-50/40 hover:bg-emerald-50/70';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    badgeLabel = t('audit.modal.badges.added');
  } else if (node.type === 'removed') {
    rowBg = 'bg-rose-50/40 hover:bg-rose-50/70';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    badgeLabel = t('audit.modal.badges.removed');
  } else if (node.type === 'modified') {
    rowBg = 'bg-sky-50/40 hover:bg-sky-50/70';
    badgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    badgeLabel = t('audit.modal.badges.modified');
  }

  const paddingLeft = isRtl ? undefined : `${depth * 1.5 + 1}rem`;
  const paddingRight = isRtl ? `${depth * 1.5 + 1}rem` : undefined;

  const fieldLabel = language === 'ar' ? node.labelAr : node.labelEn;

  return (
    <>
      <tr className={`transition-colors ${rowBg}`}>
        {/* Field Name & Label */}
        <td
          className="py-3 px-4 align-top"
          style={{ paddingLeft, paddingRight }}
        >
          <div className="flex items-start gap-2">
            {node.isNested && node.children && node.children.length > 0 && (
              <button
                type="button"
                onClick={() => onToggleExpand(node.path)}
                className="p-1 hover:bg-slate-200/70 rounded text-slate-500 mt-0.5 transition-colors"
                title={isExpanded ? t('actions.cancel') : t('actions.view')}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : isRtl ? (
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            <div className="min-w-0 flex-1">
              <span className="font-bold text-slate-900 block truncate">
                {fieldLabel}
              </span>
              {language === 'en' ? (
                <span className="font-mono text-[10px] text-slate-400 block truncate" dir="ltr">
                  {node.key}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-slate-400 block truncate" dir="ltr">
                  {node.key}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Old Value */}
        <td className="py-3 px-4 align-top border-x border-slate-200/60 bg-rose-50/20 font-mono text-[11px] text-slate-700">
          {node.type === 'added' ? (
            <span className="text-slate-400 italic font-sans text-xs">
              {t('audit.modal.values.didNotExist')}
            </span>
          ) : (
            <div className="break-all whitespace-pre-wrap">
              {formatDiffValue(node.oldValue, language)}
            </div>
          )}
        </td>

        {/* New Value */}
        <td className="py-3 px-4 align-top bg-emerald-50/20 font-mono text-[11px] text-slate-700">
          {node.type === 'removed' ? (
            <span className="text-slate-400 italic font-sans text-xs">
              {t('audit.modal.values.deleted')}
            </span>
          ) : (
            <div className="break-all whitespace-pre-wrap font-bold text-slate-900">
              {formatDiffValue(node.newValue, language)}
            </div>
          )}
        </td>

        {/* Status Badge */}
        <td className="py-3 px-4 align-top text-center">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}
          >
            {badgeLabel}
          </span>
        </td>
      </tr>

      {/* Render Nested Children if Expanded */}
      {node.isNested && isExpanded && node.children && (
        <>
          {node.children
            .filter(child => showAllFields || child.type !== 'unchanged')
            .map(child => (
              <DiffRowRenderer
                key={child.path}
                node={child}
                language={language}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
                showAllFields={showAllFields}
                depth={depth + 1}
                t={t}
              />
            ))}
        </>
      )}
    </>
  );
};
