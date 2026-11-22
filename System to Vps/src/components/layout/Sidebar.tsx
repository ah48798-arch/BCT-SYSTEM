import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { rbacService } from '../../services/rbacService';
import { bctStore } from '../../services/store';
import { GENERAL_DASHBOARD_ELEMENTS, EXECUTIVE_DASHBOARD_ELEMENTS } from '../../types/dashboardVisibility.types';
import {
  LayoutDashboard,
  LineChart,
  Network,
  Users,
  ShieldCheck,
  Building2,
  GraduationCap,
  GitFork,
  Workflow,
  CheckSquare,
  ArrowRightLeft,
  TableProperties,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Coins,
  MessageSquare,
  AlertCircle,
  Megaphone,
  Gauge,
  Briefcase,
  Award,
  CalendarCheck,
  BadgeCheck,
  CalendarDays,
  FileText,
  History,
  Settings,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission, canViewDashboardWidget } = useAuth();
  const location = useLocation();

  const navGroups = useMemo(() => [
    {
      title: t('nav.groups.overview'),
      items: [
        { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/executive', label: t('nav.executive'), icon: LineChart, perm: 'reports:view' },
      ]
    },
    {
      title: t('nav.groups.organization'),
      items: [
        { path: '/organization', label: t('nav.orgChart'), icon: Network, perm: 'users:view' },
        { path: '/employees', label: t('nav.employees'), icon: Users, perm: 'users:view' },
        { path: '/roles', label: t('nav.roles'), icon: ShieldCheck, perm: 'settings:view' },
        { path: '/departments', label: t('nav.departments'), icon: Building2, perm: 'users:view' },
      ]
    },
    {
      title: t('nav.groups.operations'),
      items: [
        { path: '/students', label: t('nav.studentCrm'), icon: GraduationCap, perm: 'students:view' },
        { path: '/pipeline', label: t('nav.lifecycle'), icon: GitFork, perm: 'students:view' },
        { path: '/workflows', label: t('nav.workflows'), icon: Workflow, perm: 'handoffs:view' },
        { path: '/tasks', label: t('nav.tasks'), icon: CheckSquare, perm: 'tasks:view' },
        { path: '/handoffs', label: t('nav.handoffs'), icon: ArrowRightLeft, perm: 'handoffs:view' },
        { path: '/raci', label: t('nav.raci'), icon: TableProperties, perm: 'handoffs:view' },
      ]
    },
    {
      title: t('nav.groups.finance'),
      items: [
        { path: '/finance', label: t('nav.finance'), icon: Wallet, perm: 'finance:view' },
        { path: '/finance/payments', label: t('nav.payments'), icon: Receipt, perm: 'finance:view' },
        { path: '/finance/expenses', label: t('nav.expenses'), icon: FileSpreadsheet, perm: 'finance:view' },
        { path: '/finance/budgets', label: t('nav.budget'), icon: Coins, perm: 'finance:view' },
        { path: '/finance/incentives', label: t('nav.incentives'), icon: Award, perm: 'finance:view' },
        { path: '/finance/ledger', label: t('nav.ledger'), icon: BookOpen, perm: 'finance:view' },
      ]
    },
    {
      title: t('nav.groups.customer'),
      items: [
        { path: '/customer-service', label: t('nav.customerService'), icon: MessageSquare, perm: 'students:view' },
        { path: '/complaints', label: t('nav.complaints'), icon: AlertCircle, perm: 'complaints:view' },
        { path: '/marketing', label: t('nav.marketing'), icon: Megaphone, perm: 'campaigns:view' },
        { path: '/capacity-gate', label: t('nav.capacityGate'), icon: Gauge, perm: 'campaigns:view' },
      ]
    },
    {
      title: t('nav.groups.hr'),
      items: [
        { path: '/hr', label: t('nav.hr'), icon: Briefcase, perm: 'users:view' },
        { path: '/hr/skills', label: t('nav.skills'), icon: Award, perm: 'users:view' },
        { path: '/hr/evaluations', label: t('nav.evaluations'), icon: CalendarCheck, perm: 'users:view' },
        { path: '/quality', label: t('nav.quality'), icon: BadgeCheck, perm: 'complaints:view' },
        { path: '/meetings', label: t('nav.meetings'), icon: CalendarDays, perm: 'tasks:view' },
      ]
    },
    {
      title: t('nav.groups.reports'),
      items: [
        { path: '/reports', label: t('nav.reports'), icon: FileText, perm: 'reports:view' },
        { path: '/audit-logs', label: t('nav.auditLogs'), icon: History, perm: 'settings:view' },
        { path: '/settings', label: t('nav.settings'), icon: Settings, perm: 'settings:view' },
      ]
    }
  ], [t, language]);

  // Level 1 RBAC: Filter navigation groups and items by authenticated permissions
  const visibleGroups = useMemo(() => {
    return navGroups
      .map((group: any) => ({
        ...group,
        items: group.items.filter((item: any) => {
          if (item.path === '/' || item.path === '/dashboard') {
            return GENERAL_DASHBOARD_ELEMENTS.some(el => canViewDashboardWidget(el.id));
          }
          if (item.path === '/executive') {
            const hasReportPerm = hasPermission('reports:view') || rbacService.isSuperAdmin(currentUser);
            const canViewAnyExec = EXECUTIVE_DASHBOARD_ELEMENTS.some(el => canViewDashboardWidget(el.id));
            return hasReportPerm && canViewAnyExec;
          }
          if (item.path === '/reports') {
            const allowedReps = rbacService.getAllowedReportsForUser(
              currentUser,
              bctStore.getJobPositions(),
              bctStore.getDepartments()
            );
            return (hasPermission('reports:view') || rbacService.isSuperAdmin(currentUser)) && allowedReps.length > 0;
          }
          if (!item.perm) return true;
          return hasPermission(item.perm);
        })
      }))
      .filter((group: any) => group.items.length > 0);
  }, [navGroups, hasPermission, currentUser, canViewDashboardWidget]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-slate-900 text-slate-300 z-40 flex flex-col transition-all duration-300 ease-in-out border-e border-slate-800 ${
          isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {visibleGroups.map((group: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item: any, itemIdx: number) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      end={item.path === '/finance' || item.path === '/dashboard'}
                      onClick={onClose}
                      className={({ isActive }) => {
                        const path = location.pathname.toLowerCase();
                        let active = isActive;

                        if (item.path === '/hr') {
                          active = path === '/hr' || path === '/hr/backups' || path === '/hr/onboarding';
                        } else if (item.path === '/hr/skills') {
                          active = path.startsWith('/hr/skills');
                        } else if (item.path === '/hr/evaluations') {
                          active = path.startsWith('/hr/evaluations');
                        } else if (item.path === '/finance') {
                          active = path === '/finance';
                        }

                        return `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          active
                            ? 'bg-bct-navy text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`;
                      }}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info: Brand version */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>BCT Enterprise v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Connected" />
        </div>
      </aside>
    </>
  );
};
