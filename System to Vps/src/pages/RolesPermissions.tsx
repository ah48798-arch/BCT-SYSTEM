import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { JobPosition, Employee, Department } from '../types/database.types';
import { rbacService, DEFAULT_ROLE_PERMISSIONS } from '../services/rbacService';
import { SYSTEM_REPORTS, SystemReportDefinition, REPORTS_BY_DEPARTMENT } from '../types/reports.types';
import {
  GENERAL_DASHBOARD_ELEMENTS,
  EXECUTIVE_DASHBOARD_ELEMENTS,
  DashboardWidgetDefinition
} from '../types/dashboardVisibility.types';
import {
  Shield,
  Key,
  Users,
  Check,
  X,
  Search,
  Lock,
  Plus,
  Copy,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  Eye,
  EyeOff,
  Filter,
  Sparkles,
  LayoutDashboard,
  Gauge
} from 'lucide-react';

const MODULES = [
  { id: 'students', labelAr: 'إدارة الطلاب وسجلات CRM', labelEn: 'Students CRM' },
  { id: 'files', labelAr: 'ملفات الطلاب ومسار القبول', labelEn: 'Student Files & Pipeline' },
  { id: 'finance', labelAr: 'المالية والحسابات والتحصيل', labelEn: 'Finance & Collections' },
  { id: 'tasks', labelAr: 'إدارة المهام والتكليفات', labelEn: 'Tasks & Delegation' },
  { id: 'complaints', labelAr: 'الشكاوى ومتابعة الجودة', labelEn: 'Complaints & Quality' },
  { id: 'handoffs', labelAr: 'التسليمات والتداخل بين الأقسام', labelEn: 'Departmental Handoffs' },
  { id: 'campaigns', labelAr: 'التسويق وبوابة الطاقة الاستيعابية', labelEn: 'Marketing & Capacity Gate' },
  { id: 'reports', labelAr: 'التقارير والمؤشرات التنفيذية', labelEn: 'Reports & Analytics' },
  { id: 'users', labelAr: 'إدارة المستخدمين والهيكل الإداري', labelEn: 'Users & Org Management' },
  { id: 'settings', labelAr: 'إعدادات النظام والسياسات', labelEn: 'System Settings' }
];

const ACTIONS = [
  { id: 'view', labelAr: 'عرض', labelEn: 'View' },
  { id: 'create', labelAr: 'إنشاء', labelEn: 'Create' },
  { id: 'edit', labelAr: 'تعديل', labelEn: 'Edit' },
  { id: 'delete', labelAr: 'حذف', labelEn: 'Delete' },
  { id: 'approve', labelAr: 'اعتماد', labelEn: 'Approve' },
  { id: 'reject', labelAr: 'رفض', labelEn: 'Reject' },
  { id: 'assign', labelAr: 'إسناد', labelEn: 'Assign' },
  { id: 'export', labelAr: 'تصدير', labelEn: 'Export' }
];

// Modern Toggle Switch Component (48px x 26px pill shape with smooth transition & stable identity)
const ModernToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  title?: string;
  isRtl?: boolean;
}> = ({ checked, onChange, disabled = false, title, isRtl = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    title={title}
    disabled={disabled}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      onChange(!checked);
    }}
    className={`relative inline-flex h-[26px] w-[48px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-bct-navy focus:ring-offset-1 select-none ${
      checked ? 'bg-emerald-600' : 'bg-slate-300'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
        checked ? (isRtl ? '-translate-x-[22px]' : 'translate-x-[22px]') : 'translate-x-0'
      }`}
    />
  </button>
);

export const RolesPermissions: React.FC = () => {
  const { isRtl } = useLanguage();
  const { currentEmployee, hasPermission, isSuperAdmin } = useAuth();

  const [positions, setPositions] = useState<Record<string, JobPosition>>(bctStore.getJobPositions());
  const [employees, setEmployees] = useState<Employee[]>(bctStore.getEmployees());
  const [departments, setDepartments] = useState<Department[]>(bctStore.getDepartments());
  const [activeTab, setActiveTab] = useState<'matrix' | 'dept_reports' | 'overrides' | 'roles'>('matrix');

  const [selectedRoleCode, setSelectedRoleCode] = useState<string>('ops_mgr');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-002');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ops');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Accordion open/collapse states
  const [expandedDeptAccordions, setExpandedDeptAccordions] = useState<Record<string, boolean>>({
    ops: true,
    fin: true,
    cs: false,
    mkt: false,
    qa: false,
    gm: false
  });

  const [expandedOverrideDepts, setExpandedOverrideDepts] = useState<Record<string, boolean>>({
    ops: true,
    fin: false,
    cs: false,
    mkt: false,
    qa: false,
    gm: false
  });

  // Accordion state for dashboard widgets sections
  const [expandedDashboardWidgets, setExpandedDashboardWidgets] = useState<{
    matrixGeneral: boolean;
    matrixExec: boolean;
    deptGeneral: boolean;
    deptExec: boolean;
    overrideGeneral: boolean;
    overrideExec: boolean;
  }>({
    matrixGeneral: true,
    matrixExec: true,
    deptGeneral: true,
    deptExec: true,
    overrideGeneral: true,
    overrideExec: true,
  });

  // State for editing role permissions
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    Object.values(positions).forEach(p => {
      const code = p.code || String(p.id);
      if (code) {
        initial[code] = p.permissions && p.permissions.length > 0
          ? [...p.permissions]
          : [...(DEFAULT_ROLE_PERMISSIONS[code] || [])];
      }
    });
    return initial;
  });

  // Keep state updated synchronously on store mutations
  useEffect(() => {
    const unsubscribe = bctStore.subscribe(() => {
      const freshPositions = bctStore.getJobPositions();
      setPositions(freshPositions);
      setEmployees(bctStore.getEmployees());
      setDepartments(bctStore.getDepartments());
      setRolePermissions(prev => {
        const next: Record<string, string[]> = { ...prev };
        Object.entries(freshPositions).forEach(([code, pos]) => {
          if (pos.permissions) {
            next[code] = [...pos.permissions];
          }
        });
        return next;
      });
    });
    return unsubscribe;
  }, []);

  // Selected employee for overrides
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);

  // Helper: check if a report is allowed for a department
  const isReportAllowedForDept = (deptId: string, rep: SystemReportDefinition) => {
    const dept = departments.find(d => d.id === deptId);
    const perms = dept?.report_permissions || {};
    if (perms[rep.id] !== undefined) return perms[rep.id];
    if (perms[`report:${rep.id}`] !== undefined) return perms[`report:${rep.id}`];
    if (perms['*'] !== undefined) return perms['*'];
    return deptId === rep.departmentId || deptId === 'gm';
  };

  // Helper: check if a dashboard widget is allowed for a department
  const isWidgetAllowedForDept = (deptId: string, widgetId: string) => {
    const dept = departments.find(d => d.id === deptId);
    const perms = dept?.dashboard_permissions || {};
    if (perms[widgetId] !== undefined) return perms[widgetId];
    if (perms['*'] !== undefined) return perms['*'];
    if (deptId === 'gm') return true;
    return false;
  };

  // --- Handlers: Department-Level Report Permissions (Atomic & Immediate Save) ---
  const handleToggleDeptReport = (deptId: string, reportId: string, newValue: boolean) => {
    const res = bctStore.setDepartmentSingleReportPermission(
      deptId,
      reportId,
      newValue,
      currentEmployee?.username || 'admin'
    );

    const dept = departments.find(d => d.id === deptId);
    const report = SYSTEM_REPORTS.find(r => r.id === reportId);

    if (res.success) {
      setDepartments(bctStore.getDepartments());
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ${newValue ? 'منح وتفعيل' : 'حجب وإيقاف'} صلاحية [${report?.nameAr || reportId}] لإدارة [${dept?.name_ar || deptId}] وحفظها فورياً في قاعدة البيانات`
          : `Report [${report?.nameEn || reportId}] visibility ${newValue ? 'granted' : 'denied'} for [${dept?.name_en || deptId}]`
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || (isRtl ? 'فشل حفظ الصلاحية' : 'Failed to save permission')
      });
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleGrantAllDeptReports = (deptId: string, targetCategoryDeptId?: string) => {
    const res = bctStore.setDepartmentAllReportsPermission(
      deptId,
      true,
      currentEmployee?.username || 'admin',
      targetCategoryDeptId
    );

    const dept = departments.find(d => d.id === deptId);
    const categoryDept = targetCategoryDeptId ? departments.find(d => d.id === targetCategoryDeptId) : null;

    if (res.success) {
      setDepartments(bctStore.getDepartments());
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم إظهار ومنح جميع التقارير ${categoryDept ? `الخاصة بقسم (${categoryDept.name_ar}) ` : ''}لإدارة [${dept?.name_ar || deptId}] وتطبيقها فوراً على كافة منسوبيها`
          : `All reports granted for department [${dept?.name_en || deptId}]`
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || (isRtl ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions')
      });
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleRevokeAllDeptReports = (deptId: string, targetCategoryDeptId?: string) => {
    const res = bctStore.setDepartmentAllReportsPermission(
      deptId,
      false,
      currentEmployee?.username || 'admin',
      targetCategoryDeptId
    );

    const dept = departments.find(d => d.id === deptId);
    const categoryDept = targetCategoryDeptId ? departments.find(d => d.id === targetCategoryDeptId) : null;

    if (res.success) {
      setDepartments(bctStore.getDepartments());
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم إخفاء وحجب جميع التقارير ${categoryDept ? `الخاصة بقسم (${categoryDept.name_ar}) ` : ''}عن إدارة [${dept?.name_ar || deptId}] ومنع وصول موظفيها إليها فوراً`
          : `All reports denied for department [${dept?.name_en || deptId}]`
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || (isRtl ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions')
      });
    }
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // --- Handlers: Employee-Level Overrides (3-State Atomic Save) ---
  const handleSetEmployeeReportOverride = (reportId: string, state: 'inherit' | 'grant' | 'deny') => {
    if (!selectedEmp) return;

    const res = bctStore.setEmployeeSingleReportOverride(
      selectedEmp.id,
      reportId,
      state,
      currentEmployee?.username || 'admin'
    );

    if (res.success) {
      setEmployees(bctStore.getEmployees());
      const report = SYSTEM_REPORTS.find(r => r.id === reportId);
      const stateAr = state === 'grant' ? 'منح صريح (ALLOW)' : state === 'deny' ? 'حجب صريح (DENY)' : 'موروث تلقائياً (INHERIT)';
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ضبط استثناء تقرير [${report?.nameAr || reportId}] للموظف [${selectedEmp.full_name_ar}] على (${stateAr}) وحفظه فورياً في قاعدة البيانات`
          : `Report override updated immediately for employee`
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleToggleEmployeeActionOverride = (perm: string) => {
    if (!selectedEmp) return;
    const current = selectedEmp.custom_permissions || [];
    const updated = current.includes(perm)
      ? current.filter(p => p !== perm)
      : [...current, perm];

    bctStore.updateEmployee(selectedEmp.id, { custom_permissions: updated }, currentEmployee?.username || 'admin');
    setEmployees(bctStore.getEmployees());
    setFeedbackMsg({
      type: 'success',
      text: isRtl ? 'تم تحديث الاستثناء الفردي للموظف بنجاح' : 'Employee custom override updated successfully'
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // --- Handlers: Dashboard Widgets Governance (Role, Department, Employee) ---
  const getDashboardWidgetTitle = (widgetId: string) => {
    const el = GENERAL_DASHBOARD_ELEMENTS.find(e => e.id === widgetId) ||
               EXECUTIVE_DASHBOARD_ELEMENTS.find(e => e.id === widgetId);
    if (!el) return widgetId;
    return isRtl ? el.nameAr : el.nameEn;
  };

  const handleToggleDashboardWidgetForRole = (
    roleCode: string,
    widgetId: string,
    forcedValue?: boolean
  ) => {
    const rolePos = positions[roleCode];
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleCode] || [];
    const current = rolePermissions[roleCode] || rolePos?.permissions || defaultPerms;

    const currentlyGranted = current.includes('*') || current.includes('dash:*') || current.includes(widgetId);
    const targetState = forcedValue !== undefined ? forcedValue : !currentlyGranted;

    let updated: string[];

    if (!targetState) {
      // Turning OFF
      if (current.includes('*')) {
        // Expand '*' wildcard into all operational actions + all dashboard widgets except widgetId
        const allExpanded = [
          ...MODULES.flatMap(m => ACTIONS.map(a => `${m.id}:${a.id}`)),
          'reports:view',
          'reports:export',
          ...GENERAL_DASHBOARD_ELEMENTS.map(e => e.id),
          ...EXECUTIVE_DASHBOARD_ELEMENTS.map(e => e.id)
        ].filter(p => p !== widgetId);
        updated = Array.from(new Set(allExpanded));
      } else if (current.includes('dash:*')) {
        const allDashKeys = [
          ...GENERAL_DASHBOARD_ELEMENTS.map(e => e.id),
          ...EXECUTIVE_DASHBOARD_ELEMENTS.map(e => e.id)
        ].filter(id => id !== widgetId);
        updated = Array.from(new Set([...current.filter(p => p !== 'dash:*'), ...allDashKeys]));
      } else {
        updated = current.filter(p => p !== widgetId);
      }
    } else {
      // Turning ON
      updated = Array.from(new Set([...current, widgetId]));
    }

    setRolePermissions(prev => ({ ...prev, [roleCode]: updated }));
    setPositions(prev => {
      if (!prev[roleCode]) return prev;
      return {
        ...prev,
        [roleCode]: {
          ...prev[roleCode],
          permissions: updated
        }
      };
    });

    const actor = currentEmployee?.username || 'admin';
    const updatedPos = bctStore.updateJobPosition(
      roleCode,
      { permissions: updated },
      actor
    );

    if (updatedPos) {
      const widgetTitle = getDashboardWidgetTitle(widgetId);
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ${targetState ? 'منح وتفعيل' : 'حجب وإيقاف'} عنصر [${widgetTitle}] للدور الوظيفي [${rolePos?.title_ar || roleCode}] وحفظه فورياً`
          : `Role dashboard widget permission saved immediately`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      // Rollback on failure
      setRolePermissions(prev => ({ ...prev, [roleCode]: current }));
      setPositions(bctStore.getJobPositions());
      setFeedbackMsg({
        type: 'error',
        text: isRtl ? 'فشل حفظ الصلاحيات في قاعدة البيانات' : 'Failed to save permissions to database'
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleBulkRoleDashboardWidgets = (
    roleCode: string,
    target: 'all' | 'general' | 'executive',
    allow: boolean
  ) => {
    const rolePos = positions[roleCode];
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleCode] || [];
    const current = rolePermissions[roleCode] || rolePos?.permissions || defaultPerms;

    const generalIds = GENERAL_DASHBOARD_ELEMENTS.map(e => e.id);
    const execIds = EXECUTIVE_DASHBOARD_ELEMENTS.map(e => e.id);
    const targetIds = target === 'general' ? generalIds : target === 'executive' ? execIds : [...generalIds, ...execIds];
    const targetSet = new Set(targetIds);

    let updated: string[];

    if (allow) {
      updated = Array.from(new Set([...current, ...targetIds]));
    } else {
      if (current.includes('*')) {
        const nonTargetWidgets = (target === 'general' ? execIds : target === 'executive' ? generalIds : []);
        const expandedAll = [
          ...MODULES.flatMap(m => ACTIONS.map(a => `${m.id}:${a.id}`)),
          'reports:view',
          'reports:export',
          ...nonTargetWidgets
        ];
        updated = Array.from(new Set(expandedAll));
      } else if (current.includes('dash:*')) {
        const remainingDash = [
          ...GENERAL_DASHBOARD_ELEMENTS.map(e => e.id),
          ...EXECUTIVE_DASHBOARD_ELEMENTS.map(e => e.id)
        ].filter(id => !targetSet.has(id));
        updated = Array.from(new Set([...current.filter(p => p !== 'dash:*'), ...remainingDash]));
      } else {
        updated = current.filter(p => !targetSet.has(p));
      }
    }

    setRolePermissions(prev => ({ ...prev, [roleCode]: updated }));
    setPositions(prev => {
      if (!prev[roleCode]) return prev;
      return {
        ...prev,
        [roleCode]: {
          ...prev[roleCode],
          permissions: updated
        }
      };
    });

    const actor = currentEmployee?.username || 'admin';
    const updatedPos = bctStore.updateJobPosition(roleCode, { permissions: updated }, actor);

    if (updatedPos) {
      const scopeLabel = target === 'general'
        ? (isRtl ? 'لوحة المؤشرات العامة' : 'General Dashboard')
        : target === 'executive'
        ? (isRtl ? 'اللوحة التنفيذية' : 'Executive Dashboard')
        : (isRtl ? 'كافة لوحات المؤشرات' : 'All Dashboards');

      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ${allow ? 'إظهار وتفعيل' : 'حجب وإخفاء'} عناصر [${scopeLabel}] للدور الوظيفي [${rolePos?.title_ar || roleCode}] وحفظها فورياً`
          : `Group dashboard permissions updated successfully`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else {
      setRolePermissions(prev => ({ ...prev, [roleCode]: current }));
      setPositions(bctStore.getJobPositions());
      setFeedbackMsg({
        type: 'error',
        text: isRtl ? 'فشل حفظ الصلاحيات في قاعدة البيانات' : 'Failed to save permissions to database'
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleToggleDeptDashboardWidget = (deptId: string, widgetId: string, newValue: boolean) => {
    const res = bctStore.setDepartmentDashboardWidgetPermission(
      deptId,
      widgetId,
      newValue,
      currentEmployee?.username || 'admin'
    );
    if (res.success) {
      setDepartments(bctStore.getDepartments());
      const dept = departments.find(d => d.id === deptId);
      const widgetTitle = getDashboardWidgetTitle(widgetId);
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ${newValue ? 'منح وتفعيل' : 'حجب وإيقاف'} عنصر [${widgetTitle}] لإدارة [${dept?.name_ar || deptId}] وحفظها فورياً في قاعدة البيانات`
          : `Department widget visibility saved immediately`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleBulkDeptDashboardWidgets = (deptId: string, group: 'all' | 'general' | 'executive', allow: boolean) => {
    const res = bctStore.setDepartmentAllDashboardWidgetsPermission(
      deptId,
      group,
      allow,
      currentEmployee?.username || 'admin'
    );
    if (res.success) {
      setDepartments(bctStore.getDepartments());
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ${allow ? 'منح وإظهار' : 'حجب وإخفاء'} عناصر ${group === 'general' ? 'لوحة المؤشرات العامة' : group === 'executive' ? 'اللوحة التنفيذية' : 'كافة لوحات المؤشرات'} لإدارة [${departments.find(d => d.id === deptId)?.name_ar || deptId}] فورياً`
          : `Bulk department dashboard widgets updated`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleSetEmployeeDashboardWidgetOverride = (widgetId: string, state: 'inherit' | 'grant' | 'deny') => {
    if (!selectedEmp) return;
    const res = bctStore.setEmployeeDashboardWidgetOverride(
      selectedEmp.id,
      widgetId,
      state,
      currentEmployee?.username || 'admin'
    );
    if (res.success) {
      setEmployees(bctStore.getEmployees());
      const stateAr = state === 'grant' ? 'منح صريح (ALLOW)' : state === 'deny' ? 'حجب صريح (DENY)' : 'موروث تلقائياً (INHERIT)';
      const widgetTitle = getDashboardWidgetTitle(widgetId);
      setFeedbackMsg({
        type: 'success',
        text: isRtl
          ? `تم ضبط استثناء عنصر [${widgetTitle}] للموظف [${selectedEmp.full_name_ar}] على (${stateAr}) وحفظه فورياً`
          : `Employee dashboard widget override updated`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'إدارة الأدوار ومصفوفة الصلاحيات التفصيلية' : 'Roles & Granular Permissions Center'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? 'التحكم المركزي في صلاحيات العمليات، حوكمة ظهور التقارير على مستوى الإدارة والموظف، وضوابط الوصول المشددة'
              : 'RBAC Access control for roles, department & employee report visibility governance, and security audits'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${activeTab === 'matrix' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isRtl ? 'مصفوفة الصلاحيات والأدوار' : 'Permissions Matrix'}
          </button>
          <button
            onClick={() => setActiveTab('dept_reports')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${activeTab === 'dept_reports' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isRtl ? 'صلاحيات تقارير ولوحات الإدارات' : 'Department Dashboards & Reports'}
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${activeTab === 'overrides' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isRtl ? 'استثناءات الموظفين الفردية' : 'Individual Overrides'}
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${activeTab === 'roles' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isRtl ? 'كتالوج الأدوار (18 وظيفة)' : 'Role Catalog (18)'}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all ${feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 1: Department-Level Report Permissions (صلاحيات تقارير الإدارات) */}
      {/* ========================================================================= */}
      {activeTab === 'dept_reports' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-bct-navy" />
                <span>{isRtl ? 'صلاحيات تقارير الإدارات (Department-Level Report Permissions)' : 'Department-Level Report Permissions'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRtl
                  ? 'التحكم في ظهور أو إخفاء كل تقرير داخل كل إدارة. يعمل كل مفتاح بشكل مستقل ويُحفظ مباشرة في قاعدة البيانات، وتطبق التغييرات فوراً على جميع موظفي الإدارة.'
                  : 'Define baseline report visibility per department. Each toggle switch operates independently, persists to database immediately, and applies instantly.'}
              </p>
            </div>

            {/* Department Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">{isRtl ? 'اختر الإدارة للتعديل:' : 'Select Department:'}</label>
              <select
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bct-navy"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {isRtl ? d.name_ar : d.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Overview Banner */}
          {(() => {
            const activeDept = departments.find(d => d.id === selectedDeptId);
            const allReportsAllowedCount = SYSTEM_REPORTS.filter(r => isReportAllowedForDept(selectedDeptId, r)).length;

            return (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: activeDept?.color_hex || '#154568' }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {isRtl ? activeDept?.name_ar : activeDept?.name_en}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isRtl ? activeDept?.description_ar : activeDept?.description_en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-bct-navy/10 text-bct-navy font-bold rounded-full text-xs">
                      {allReportsAllowedCount} / {SYSTEM_REPORTS.length} {isRtl ? 'إجمالي التقارير المصرح بها' : 'Total Reports Allowed'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGrantAllDeptReports(selectedDeptId)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إظهار جميع التقارير' : 'Show All Reports'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeAllDeptReports(selectedDeptId)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إخفاء جميع التقارير' : 'Hide All Reports'}</span>
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* Department Dashboard Widgets Visibility Permissions                       */}
                {/* ========================================================================= */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-bct-navy text-white rounded-xl shadow-xs">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {isRtl ? 'صلاحيات لوحات المؤشرات للإدارة (Dashboard Visibility)' : 'Department Dashboard Visibility'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {isRtl
                            ? 'التحكم في ظهور أو إخفاء عناصر لوحات المؤشرات العامة والتنفيذية لجميع منسوبي هذه الإدارة. تُحفظ فورياً وتطبق بلحظتها.'
                            : 'Control General & Executive dashboard widget visibility for all staff in this department.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleBulkDeptDashboardWidgets(selectedDeptId, 'all', true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إظهار كافة اللوحات' : 'Show All'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkDeptDashboardWidgets(selectedDeptId, 'all', false)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إخفاء كافة اللوحات' : 'Hide All'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-Group 1: General Dashboard (7 Elements) */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => setExpandedDashboardWidgets(p => ({ ...p, deptGeneral: !p.deptGeneral }))}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-bct-navy text-white rounded-lg">
                          <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-800">
                            {isRtl ? '1. لوحة المؤشرات العامة (General Dashboard)' : '1. General Dashboard'}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            {isRtl ? '7 مؤشرات تشغيلية رئيسية' : '7 Core operational widgets'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-bct-navy font-mono">
                          {GENERAL_DASHBOARD_ELEMENTS.filter(e => isWidgetAllowedForDept(selectedDeptId, e.id)).length} / {GENERAL_DASHBOARD_ELEMENTS.length}
                        </span>
                        <div className="p-1 text-slate-400">
                          {expandedDashboardWidgets.deptGeneral ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {expandedDashboardWidgets.deptGeneral && (
                      <div className="p-4 bg-white divide-y divide-slate-100">
                        {GENERAL_DASHBOARD_ELEMENTS.map(el => {
                          const isAllowed = isWidgetAllowedForDept(selectedDeptId, el.id);

                          return (
                            <div key={el.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">
                                    {isRtl ? el.nameAr : el.nameEn}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                                    {isRtl ? el.categoryAr : el.categoryEn}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {isRtl ? el.descriptionAr : el.descriptionEn}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className={`text-xs font-bold ${isAllowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {isAllowed ? (isRtl ? 'مُفعّل (ظاهر)' : 'Visible') : (isRtl ? 'مُعطّل (مخفي)' : 'Hidden')}
                                </span>
                                <ModernToggleSwitch
                                  checked={isAllowed}
                                  isRtl={isRtl}
                                  onChange={(val) => handleToggleDeptDashboardWidget(selectedDeptId, el.id, val)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sub-Group 2: Executive Dashboard (10 Elements) */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div
                      className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => setExpandedDashboardWidgets(p => ({ ...p, deptExec: !p.deptExec }))}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                          <Gauge className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-800">
                            {isRtl ? '2. اللوحة التنفيذية (Executive Dashboard)' : '2. Executive Dashboard'}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            {isRtl ? '10 مؤشرات قيادية واستراتيجية' : '10 Executive & strategic KPIs'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
                          {EXECUTIVE_DASHBOARD_ELEMENTS.filter(e => isWidgetAllowedForDept(selectedDeptId, e.id)).length} / {EXECUTIVE_DASHBOARD_ELEMENTS.length}
                        </span>
                        <div className="p-1 text-slate-400">
                          {expandedDashboardWidgets.deptExec ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {expandedDashboardWidgets.deptExec && (
                      <div className="p-4 bg-white divide-y divide-slate-100">
                        {EXECUTIVE_DASHBOARD_ELEMENTS.map(el => {
                          const isAllowed = isWidgetAllowedForDept(selectedDeptId, el.id);

                          return (
                            <div key={el.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">
                                    {isRtl ? el.nameAr : el.nameEn}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                                    {isRtl ? el.categoryAr : el.categoryEn}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {isRtl ? el.descriptionAr : el.descriptionEn}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className={`text-xs font-bold ${isAllowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {isAllowed ? (isRtl ? 'مُفعّل (ظاهر)' : 'Visible') : (isRtl ? 'مُعطّل (مخفي)' : 'Hidden')}
                                </span>
                                <ModernToggleSwitch
                                  checked={isAllowed}
                                  isRtl={isRtl}
                                  onChange={(val) => handleToggleDeptDashboardWidget(selectedDeptId, el.id, val)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reports Grouped by Originating Department Accordions */}
                <div className="space-y-4">
                  {departments.map(catDept => {
                    const catReports = REPORTS_BY_DEPARTMENT[catDept.id] || [];
                    if (catReports.length === 0) return null;

                    const isOpen = expandedDeptAccordions[catDept.id] ?? (catDept.id === selectedDeptId);
                    const allowedCountInCat = catReports.filter(r => isReportAllowedForDept(selectedDeptId, r)).length;
                    const isOwnDepartment = catDept.id === selectedDeptId;

                    return (
                      <div key={catDept.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        {/* Accordion Header */}
                        <div
                          className={`px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                            isOwnDepartment ? 'bg-blue-50/70 border-b border-blue-200' : 'bg-slate-50/80 hover:bg-slate-100/80'
                          }`}
                          onClick={() => setExpandedDeptAccordions(p => ({ ...p, [catDept.id]: !isOpen }))}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: catDept.color_hex || '#154568' }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-800">
                                  {isRtl ? catDept.name_ar : catDept.name_en}
                                </span>
                                {isOwnDepartment && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                    {isRtl ? 'التقارير الأصلية للإدارة' : 'Own Department Reports'}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 block">
                                {isRtl ? catDept.description_ar : catDept.description_en}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                            {/* Counter Badge */}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              allowedCountInCat === catReports.length ? 'bg-emerald-100 text-emerald-800' : allowedCountInCat > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {allowedCountInCat} / {catReports.length} {isRtl ? 'مسموح' : 'Allowed'}
                            </span>

                            {/* Section Quick Action Buttons */}
                            <div className="flex items-center gap-1 text-xs">
                              <button
                                type="button"
                                onClick={() => handleGrantAllDeptReports(selectedDeptId, catDept.id)}
                                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg font-semibold transition"
                              >
                                {isRtl ? 'إظهار تقارير القسم' : 'Show Section'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeAllDeptReports(selectedDeptId, catDept.id)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 rounded-lg font-semibold transition"
                              >
                                {isRtl ? 'إخفاء تقارير القسم' : 'Hide Section'}
                              </button>
                            </div>

                            {/* Chevron */}
                            <div className="p-1 text-slate-400">
                              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {/* Accordion Body */}
                        {isOpen && (
                          <div className="p-4 bg-white divide-y divide-slate-100">
                            {catReports.map(report => {
                              const isAllowed = isReportAllowedForDept(selectedDeptId, report);

                              return (
                                <div
                                  key={report.id}
                                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-800">
                                        {isRtl ? report.nameAr : report.nameEn}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${report.sensitivity === 'restricted' ? 'bg-rose-100 text-rose-800' : report.sensitivity === 'confidential' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                        {report.sensitivity === 'restricted' ? (isRtl ? 'سري للغاية' : 'Restricted') : report.sensitivity === 'confidential' ? (isRtl ? 'سري' : 'Confidential') : (isRtl ? 'قياسي' : 'Standard')}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      {isRtl ? report.descriptionAr : report.descriptionEn}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <span className={`text-xs font-bold ${isAllowed ? 'text-emerald-700' : 'text-slate-400'}`}>
                                      {isAllowed ? (isRtl ? 'مُفعّل (ظاهر)' : 'Visible') : (isRtl ? 'مُعطّل (مخفي)' : 'Hidden')}
                                    </span>
                                    <ModernToggleSwitch
                                      checked={isAllowed}
                                      isRtl={isRtl}
                                      onChange={(val) => handleToggleDeptReport(selectedDeptId, report.id, val)}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 2: Permissions Matrix (Operational Modules + Role Report Permissions) */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          {/* Role Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                {isRtl ? 'اختر الدور الوظيفي للتعديل' : 'Select Job Role to Edit'}
              </label>
              <select
                value={selectedRoleCode}
                onChange={e => setSelectedRoleCode(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bct-navy"
              >
                {Object.values(positions).map(pos => {
                  const code = pos.code || String(pos.id);
                  return (
                    <option key={code} value={code}>
                      {isRtl ? pos.title_ar : pos.title_en}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[selectedRoleCode] || [];
                  setRolePermissions(prev => ({ ...prev, [selectedRoleCode]: [...defaultPerms] }));
                  bctStore.updateJobPosition(selectedRoleCode, { permissions: [...defaultPerms] }, currentEmployee?.username || 'admin');
                  setPositions(bctStore.getJobPositions());
                  setFeedbackMsg({
                    type: 'success',
                    text: isRtl ? 'تمت استعادة الصلاحيات الافتراضية للدور في قاعدة البيانات فوراً' : 'Reset role permissions to system defaults'
                  });
                  setTimeout(() => setFeedbackMsg(null), 3000);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{isRtl ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
              </button>
            </div>
          </div>

          {/* Core Operational Permissions Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-bct-navy" />
              <span>{isRtl ? 'صلاحيات العمليات والوحدات الأساسية' : 'Core Operational Module Permissions'}</span>
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right rtl:text-right ltr:text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">{isRtl ? 'الوحدة / الموديول' : 'Module'}</th>
                    {ACTIONS.map(action => (
                      <th key={action.id} className="py-3 px-3 text-center">
                        {isRtl ? action.labelAr : action.labelEn}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULES.map(module => (
                    <tr key={module.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span>{isRtl ? module.labelAr : module.labelEn}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                            <button
                              type="button"
                              onClick={() => {
                                const current = new Set(rolePermissions[selectedRoleCode] || []);
                                ACTIONS.forEach(a => current.add(`${module.id}:${a.id}`));
                                const arr = Array.from(current);
                                setRolePermissions(p => ({ ...p, [selectedRoleCode]: arr }));
                                bctStore.updateJobPosition(selectedRoleCode, { permissions: arr }, currentEmployee?.username || 'admin');
                              }}
                              className="hover:text-emerald-700 hover:underline px-1 py-0.5 rounded bg-slate-100 hover:bg-emerald-50"
                            >
                              {isRtl ? 'منح الكل' : 'All'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const current = (rolePermissions[selectedRoleCode] || []).filter(p => !p.startsWith(`${module.id}:`));
                                setRolePermissions(p => ({ ...p, [selectedRoleCode]: current }));
                                bctStore.updateJobPosition(selectedRoleCode, { permissions: current }, currentEmployee?.username || 'admin');
                              }}
                              className="hover:text-rose-700 hover:underline px-1 py-0.5 rounded bg-slate-100 hover:bg-rose-50"
                            >
                              {isRtl ? 'إلغاء' : 'None'}
                            </button>
                          </div>
                        </div>
                      </td>
                      {ACTIONS.map(action => {
                        const permKey = `${module.id}:${action.id}`;
                        const isWildcard = (rolePermissions[selectedRoleCode] || []).includes('*');
                        const isModuleWildcard = (rolePermissions[selectedRoleCode] || []).includes(`${module.id}:*`);
                        const isChecked = isWildcard || isModuleWildcard || (rolePermissions[selectedRoleCode] || []).includes(permKey);

                        return (
                          <td key={action.id} className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isWildcard}
                              onChange={() => {
                                const current = rolePermissions[selectedRoleCode] || [];
                                const updated = current.includes(permKey)
                                  ? current.filter(p => p !== permKey)
                                  : [...current, permKey];
                                setRolePermissions(p => ({ ...p, [selectedRoleCode]: updated }));
                                bctStore.updateJobPosition(selectedRoleCode, { permissions: updated }, currentEmployee?.username || 'admin');
                              }}
                              className="w-4 h-4 text-bct-navy rounded border-slate-300 focus:ring-bct-navy cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dedicated Receipt Actions Permissions (Edit & Cancel Pending - Strictly separate from Payment Confirmation) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isRtl ? 'تعديل سند تحصيل غير مؤكد (Edit Pending Payment Receipt)' : 'Edit Pending Payment Receipt'}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isRtl
                      ? 'صلاحية مستقلة تتيح تعديل بيانات سندات التحصيل قبل التأكيد فقط، ولا تمنح صلاحية تأكيد السداد أو تعديل السندات المؤكدة.'
                      : 'Standalone permission to edit unconfirmed payment receipts only. Does not grant payment confirmation authority or confirmed-receipt editing.'}
                  </p>
                </div>
                {(() => {
                  const currentRolePerms = rolePermissions[selectedRoleCode] || [];
                  const isWildcard = currentRolePerms.includes('*');
                  const isGranted = isWildcard || currentRolePerms.includes('payments:edit_pending');
                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">payments:edit_pending</span>
                      <ModernToggleSwitch
                        checked={isGranted}
                        disabled={isWildcard}
                        isRtl={isRtl}
                        title={isRtl ? 'تعديل سند تحصيل غير مؤكد' : 'Edit Pending Payment Receipt'}
                        onChange={(nextVal) => {
                          const updated = nextVal
                            ? Array.from(new Set([...currentRolePerms, 'payments:edit_pending']))
                            : currentRolePerms.filter(p => p !== 'payments:edit_pending');
                          setRolePermissions(p => ({ ...p, [selectedRoleCode]: updated }));
                          bctStore.updateJobPosition(selectedRoleCode, { permissions: updated }, currentEmployee?.username || 'admin');
                        }}
                      />
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isRtl ? 'إلغاء سند تحصيل غير مؤكد (Cancel Pending Payment Receipt)' : 'Cancel Pending Payment Receipt'}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isRtl
                      ? 'صلاحية مستقلة تتيح إلغاء سندات التحصيل قبل التأكيد فقط، مع الاحتفاظ بالسند في السجلات المالية للتدقيق واستبعاده من التحصيلات المؤكدة.'
                      : 'Standalone permission to cancel unconfirmed payment receipts only. Retains the receipt for audit and excludes it from confirmed collections.'}
                  </p>
                </div>
                {(() => {
                  const currentRolePerms = rolePermissions[selectedRoleCode] || [];
                  const isWildcard = currentRolePerms.includes('*');
                  const isGranted = isWildcard || currentRolePerms.includes('payments:cancel_pending');
                  return (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">payments:cancel_pending</span>
                      <ModernToggleSwitch
                        checked={isGranted}
                        disabled={isWildcard}
                        isRtl={isRtl}
                        title={isRtl ? 'إلغاء سند تحصيل غير مؤكد' : 'Cancel Pending Payment Receipt'}
                        onChange={(nextVal) => {
                          const updated = nextVal
                            ? Array.from(new Set([...currentRolePerms, 'payments:cancel_pending']))
                            : currentRolePerms.filter(p => p !== 'payments:cancel_pending');
                          setRolePermissions(p => ({ ...p, [selectedRoleCode]: updated }));
                          bctStore.updateJobPosition(selectedRoleCode, { permissions: updated }, currentEmployee?.username || 'admin');
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Dashboard Widgets Visibility Permissions (Main Section for Dashboards)    */}
          {/* ========================================================================= */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-bct-navy" />
                  <span>{isRtl ? 'صلاحيات لوحات المؤشرات والتقارير' : 'Dashboard & Report Visibility Permissions'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl
                    ? 'التحكم في ظهور أو إخفاء عناصر ومؤشرات لوحة المؤشرات العامة واللوحة التنفيذية لهذا الدور الوظيفي. يُحفظ التغيير فوراً في قاعدة البيانات.'
                    : 'Control visibility of General and Executive dashboard widgets for this role with instant persistence.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'all', true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إظهار كل اللوحات' : 'Show All Dashboards'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'all', false)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'حجب كل اللوحات' : 'Hide All Dashboards'}</span>
                </button>
              </div>
            </div>

            {/* Sub-Group 1: General Dashboard (7 Elements) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div
                className="bg-slate-50/90 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                onClick={() => setExpandedDashboardWidgets(p => ({ ...p, matrixGeneral: !p.matrixGeneral }))}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-bct-navy text-white rounded-lg">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {isRtl ? '1. لوحة المؤشرات العامة (General Dashboard)' : '1. General Dashboard'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {isRtl ? '7 مؤشرات وعناصر تشغيلية رئيسية' : '7 Core operational widgets and KPIs'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'general', true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold transition flex items-center gap-1 shadow-2xs"
                      title={isRtl ? 'إظهار جميع مؤشرات اللوحة العامة' : 'Show all General Dashboard widgets'}
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">{isRtl ? 'إظهار جميع مؤشرات اللوحة العامة' : 'Show All'}</span>
                      <span className="sm:hidden">{isRtl ? 'إظهار الكل' : 'All'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'general', false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 font-bold transition flex items-center gap-1 shadow-2xs"
                      title={isRtl ? 'حجب جميع مؤشرات اللوحة العامة' : 'Hide all General Dashboard widgets'}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span className="hidden sm:inline">{isRtl ? 'حجب جميع مؤشرات اللوحة العامة' : 'Hide All'}</span>
                      <span className="sm:hidden">{isRtl ? 'حجب الكل' : 'None'}</span>
                    </button>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-bct-navy font-mono">
                    {GENERAL_DASHBOARD_ELEMENTS.filter(e => {
                      const perms = rolePermissions[selectedRoleCode] || positions[selectedRoleCode]?.permissions || DEFAULT_ROLE_PERMISSIONS[selectedRoleCode] || [];
                      return perms.includes('*') || perms.includes('dash:*') || perms.includes(e.id);
                    }).length} / {GENERAL_DASHBOARD_ELEMENTS.length}
                  </span>
                  <div className="p-1 text-slate-400">
                    {expandedDashboardWidgets.matrixGeneral ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {expandedDashboardWidgets.matrixGeneral && (
                <div className="p-4 bg-white divide-y divide-slate-100">
                  {GENERAL_DASHBOARD_ELEMENTS.map(el => {
                    const rolePerms = rolePermissions[selectedRoleCode] || positions[selectedRoleCode]?.permissions || DEFAULT_ROLE_PERMISSIONS[selectedRoleCode] || [];
                    const isGranted = rolePerms.includes('*') || rolePerms.includes('dash:*') || rolePerms.includes(el.id);

                    return (
                      <div key={el.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">
                              {isRtl ? el.nameAr : el.nameEn}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                              {isRtl ? el.categoryAr : el.categoryEn}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {isRtl ? el.descriptionAr : el.descriptionEn}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`text-xs font-bold transition-colors ${isGranted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {isGranted ? (isRtl ? 'مُفعّل (ظاهر)' : 'Visible') : (isRtl ? 'مُعطّل (مخفي)' : 'Hidden')}
                          </span>
                          <ModernToggleSwitch
                            checked={isGranted}
                            isRtl={isRtl}
                            onChange={(nextVal) => handleToggleDashboardWidgetForRole(selectedRoleCode, el.id, nextVal)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-Group 2: Executive Dashboard (10 Elements) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div
                className="bg-slate-50/90 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                onClick={() => setExpandedDashboardWidgets(p => ({ ...p, matrixExec: !p.matrixExec }))}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {isRtl ? '2. اللوحة التنفيذية (Executive Dashboard)' : '2. Executive Dashboard'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {isRtl ? '10 مؤشرات وبطاقات قيادية ومصفوفات استراتيجية' : '10 Strategic KPIs, buffers, and roadmap'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'executive', true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-bold transition flex items-center gap-1 shadow-2xs"
                      title={isRtl ? 'إظهار جميع مؤشرات اللوحة التنفيذية' : 'Show all Executive Dashboard widgets'}
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:inline">{isRtl ? 'إظهار جميع مؤشرات اللوحة التنفيذية' : 'Show All'}</span>
                      <span className="sm:hidden">{isRtl ? 'إظهار الكل' : 'All'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkRoleDashboardWidgets(selectedRoleCode, 'executive', false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-rose-700 hover:bg-rose-50 font-bold transition flex items-center gap-1 shadow-2xs"
                      title={isRtl ? 'حجب جميع مؤشرات اللوحة التنفيذية' : 'Hide all Executive Dashboard widgets'}
                    >
                      <EyeOff className="w-3 h-3" />
                      <span className="hidden sm:inline">{isRtl ? 'حجب جميع مؤشرات اللوحة التنفيذية' : 'Hide All'}</span>
                      <span className="sm:hidden">{isRtl ? 'حجب الكل' : 'None'}</span>
                    </button>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
                    {EXECUTIVE_DASHBOARD_ELEMENTS.filter(e => {
                      const perms = rolePermissions[selectedRoleCode] || positions[selectedRoleCode]?.permissions || DEFAULT_ROLE_PERMISSIONS[selectedRoleCode] || [];
                      return perms.includes('*') || perms.includes('dash:*') || perms.includes(e.id);
                    }).length} / {EXECUTIVE_DASHBOARD_ELEMENTS.length}
                  </span>
                  <div className="p-1 text-slate-400">
                    {expandedDashboardWidgets.matrixExec ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {expandedDashboardWidgets.matrixExec && (
                <div className="p-4 bg-white divide-y divide-slate-100">
                  {EXECUTIVE_DASHBOARD_ELEMENTS.map(el => {
                    const rolePerms = rolePermissions[selectedRoleCode] || positions[selectedRoleCode]?.permissions || DEFAULT_ROLE_PERMISSIONS[selectedRoleCode] || [];
                    const isGranted = rolePerms.includes('*') || rolePerms.includes('dash:*') || rolePerms.includes(el.id);

                    return (
                      <div key={el.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-800">
                              {isRtl ? el.nameAr : el.nameEn}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                              {isRtl ? el.categoryAr : el.categoryEn}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {isRtl ? el.descriptionAr : el.descriptionEn}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`text-xs font-bold transition-colors ${isGranted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {isGranted ? (isRtl ? 'مُفعّل (ظاهر)' : 'Visible') : (isRtl ? 'مُعطّل (مخفي)' : 'Hidden')}
                          </span>
                          <ModernToggleSwitch
                            checked={isGranted}
                            isRtl={isRtl}
                            onChange={(nextVal) => handleToggleDashboardWidgetForRole(selectedRoleCode, el.id, nextVal)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 3: Individual Employee Overrides (User-Level Permissions) */}
      {/* ========================================================================= */}
      {activeTab === 'overrides' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {isRtl ? 'الاستثناءات والصلاحيات المخصصة للموظفين (User-Level Overrides)' : 'Employee-Specific Permission Overrides'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isRtl
                ? 'إمكانية منح موظف معين استثناءً فردياً (منح صريح ALLOW) أو حجبه عنه صراحة (DENY) أو وراثة صلاحية الإدارة (INHERIT). الحجب الصريح يتغلب على كافة الصلاحيات الموروثة.'
                : 'Configure individual exceptions using the 3-state system: INHERIT (inherit from dept/role), ALLOW (explicit grant), or DENY (explicit deny).'}
            </p>
          </div>

          {/* Select Employee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                {isRtl ? 'الموظف المستهدف' : 'Target Employee'}
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-bct-navy"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {isRtl ? emp.full_name_ar : emp.full_name_en} - ({emp.job_title_ar || emp.department_id})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmp && (
              <div className="md:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    {isRtl ? selectedEmp.full_name_ar : selectedEmp.full_name_en}
                  </span>
                  <span className="text-slate-500">
                    {isRtl ? 'الدور الأساسي:' : 'Base Role:'} {selectedEmp.job_title_ar} | {isRtl ? 'الإدارة:' : 'Department:'} {departments.find(d => d.id === selectedEmp.department_id)?.name_ar || selectedEmp.department_id}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-bct-navy text-white rounded-lg font-mono text-xs">
                  {selectedEmp.employee_code}
                </span>
              </div>
            )}
          </div>

          {/* Dashboard Widgets 3-State Overrides Section */}
          {selectedEmp && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-bct-navy" />
                    <span>{isRtl ? 'استثناءات صلاحيات لوحات المؤشرات للموظف (3-State Engine)' : '3-State Dashboard Widget Overrides'}</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isRtl
                      ? 'التحكم الفردي في إظهار أو إخفاء عناصر لوحات المؤشرات لهذا الموظف بالتحديد (منح صريح، حجب صريح، أو وراثة من الإدارة/الدور).'
                      : 'Individual overrides for this employee: Allow, Deny, or Inherit from Department/Role.'}
                  </p>
                </div>
              </div>

              {/* Sub-Group 1: General Dashboard (7 Elements) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div
                  className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  onClick={() => setExpandedDashboardWidgets(p => ({ ...p, overrideGeneral: !p.overrideGeneral }))}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-bct-navy text-white rounded-lg">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-800">
                        {isRtl ? '1. لوحة المؤشرات العامة (General Dashboard)' : '1. General Dashboard'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {isRtl ? '7 عناصر تشغيلية قابلة للتخصيص الفردي' : '7 Customizable operational widgets'}
                      </span>
                    </div>
                  </div>
                  {expandedDashboardWidgets.overrideGeneral ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {expandedDashboardWidgets.overrideGeneral && (
                  <div className="p-4 bg-white divide-y divide-slate-100">
                    {GENERAL_DASHBOARD_ELEMENTS.map(el => {
                      const detail = rbacService.getEffectiveDashboardWidgetDetail(
                        selectedEmp,
                        el.id,
                        positions,
                        departments
                      );
                      const overrideVal = selectedEmp.dashboard_overrides?.[el.id];
                      const currentMode: 'inherit' | 'grant' | 'deny' =
                        overrideVal === true ? 'grant' : overrideVal === false ? 'deny' : 'inherit';

                      const sourceBadge =
                        detail.source === 'super_admin' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            {isRtl ? 'سوبر أدمن' : 'Super Admin'}
                          </span>
                        ) : detail.source === 'individual_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {isRtl ? 'استثناء فردي (منح)' : 'Individual Grant'}
                          </span>
                        ) : detail.source === 'individual_deny' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            {isRtl ? 'استثناء فردي (حجب)' : 'Individual Deny'}
                          </span>
                        ) : detail.source === 'dept_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {isRtl ? 'موروث من الإدارة' : 'Inherited (Dept)'}
                          </span>
                        ) : detail.source === 'dept_deny' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {isRtl ? 'محجوب من الإدارة' : 'Denied (Dept)'}
                          </span>
                        ) : detail.source === 'role_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {isRtl ? 'موروث من الدور' : 'Inherited (Role)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {isRtl ? 'حجب افتراضي' : 'Default Deny'}
                          </span>
                        );

                      return (
                        <div
                          key={el.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {isRtl ? el.nameAr : el.nameEn}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                                {isRtl ? el.categoryAr : el.categoryEn}
                              </span>
                              {sourceBadge}
                            </div>
                            <p className="text-xs text-slate-500">
                              {isRtl ? detail.reasonAr : detail.reasonEn}
                            </p>
                          </div>

                          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'inherit')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'inherit' ? 'bg-white text-slate-800 shadow font-bold' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {isRtl ? 'افتراضي (وراثة)' : 'Inherit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'grant')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'grant' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 hover:text-emerald-700'
                              }`}
                            >
                              {isRtl ? 'منح صريح (ALLOW)' : 'Allow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'deny')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'deny' ? 'bg-rose-600 text-white shadow font-bold' : 'text-slate-500 hover:text-rose-700'
                              }`}
                            >
                              {isRtl ? 'حجب صريح (DENY)' : 'Deny'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sub-Group 2: Executive Dashboard (10 Elements) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div
                  className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                  onClick={() => setExpandedDashboardWidgets(p => ({ ...p, overrideExec: !p.overrideExec }))}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-700 text-white rounded-lg">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-800">
                        {isRtl ? '2. اللوحة التنفيذية (Executive Dashboard)' : '2. Executive Dashboard'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {isRtl ? '10 مؤشرات وبطاقات استراتيجية قابلة للتخصيص الفردي' : '10 Strategic executive widgets'}
                      </span>
                    </div>
                  </div>
                  {expandedDashboardWidgets.overrideExec ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {expandedDashboardWidgets.overrideExec && (
                  <div className="p-4 bg-white divide-y divide-slate-100">
                    {EXECUTIVE_DASHBOARD_ELEMENTS.map(el => {
                      const detail = rbacService.getEffectiveDashboardWidgetDetail(
                        selectedEmp,
                        el.id,
                        positions,
                        departments
                      );
                      const overrideVal = selectedEmp.dashboard_overrides?.[el.id];
                      const currentMode: 'inherit' | 'grant' | 'deny' =
                        overrideVal === true ? 'grant' : overrideVal === false ? 'deny' : 'inherit';

                      const sourceBadge =
                        detail.source === 'super_admin' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            {isRtl ? 'سوبر أدمن' : 'Super Admin'}
                          </span>
                        ) : detail.source === 'individual_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {isRtl ? 'استثناء فردي (منح)' : 'Individual Grant'}
                          </span>
                        ) : detail.source === 'individual_deny' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            {isRtl ? 'استثناء فردي (حجب)' : 'Individual Deny'}
                          </span>
                        ) : detail.source === 'dept_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {isRtl ? 'موروث من الإدارة' : 'Inherited (Dept)'}
                          </span>
                        ) : detail.source === 'dept_deny' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {isRtl ? 'محجوب من الإدارة' : 'Denied (Dept)'}
                          </span>
                        ) : detail.source === 'role_grant' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {isRtl ? 'موروث من الدور' : 'Inherited (Role)'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {isRtl ? 'حجب افتراضي' : 'Default Deny'}
                          </span>
                        );

                      return (
                        <div
                          key={el.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {isRtl ? el.nameAr : el.nameEn}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-100">
                                {isRtl ? el.categoryAr : el.categoryEn}
                              </span>
                              {sourceBadge}
                            </div>
                            <p className="text-xs text-slate-500">
                              {isRtl ? detail.reasonAr : detail.reasonEn}
                            </p>
                          </div>

                          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'inherit')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'inherit' ? 'bg-white text-slate-800 shadow font-bold' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {isRtl ? 'افتراضي (وراثة)' : 'Inherit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'grant')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'grant' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 hover:text-emerald-700'
                              }`}
                            >
                              {isRtl ? 'منح صريح (ALLOW)' : 'Allow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetEmployeeDashboardWidgetOverride(el.id, 'deny')}
                              className={`px-3 py-1.5 rounded-lg transition-colors ${
                                currentMode === 'deny' ? 'bg-rose-600 text-white shadow font-bold' : 'text-slate-500 hover:text-rose-700'
                              }`}
                            >
                              {isRtl ? 'حجب صريح (DENY)' : 'Deny'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employee Report Overrides Section */}
          {selectedEmp && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-bct-navy" />
                <span>{isRtl ? 'استثناءات صلاحيات عرض التقارير للموظف (3-State Engine)' : '3-State Report Visibility Overrides'}</span>
              </h4>

              <div className="space-y-3">
                {departments.map(dept => {
                  const deptReports = REPORTS_BY_DEPARTMENT[dept.id] || [];
                  if (deptReports.length === 0) return null;

                  const isOpen = expandedOverrideDepts[dept.id] ?? false;

                  return (
                    <div key={dept.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <div
                        className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
                        onClick={() => setExpandedOverrideDepts(p => ({ ...p, [dept.id]: !isOpen }))}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: dept.color_hex || '#154568' }}
                          />
                          <span className="font-bold text-sm text-slate-800">
                            {isRtl ? dept.name_ar : dept.name_en}
                          </span>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>

                      {isOpen && (
                        <div className="p-4 bg-white divide-y divide-slate-100">
                          {deptReports.map(report => {
                            const detail = rbacService.getEffectiveReportPermissionDetail(
                              selectedEmp,
                              report.id,
                              positions,
                              departments
                            );

                            const overrideVal = selectedEmp.report_overrides?.[report.id];
                            const currentMode: 'inherit' | 'grant' | 'deny' =
                              overrideVal === true ? 'grant' : overrideVal === false ? 'deny' : 'inherit';

                            const sourceBadge =
                              detail.source === 'super_admin' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                  {isRtl ? 'سوبر أدمن' : 'Super Admin'}
                                </span>
                              ) : detail.source === 'individual_grant' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {isRtl ? 'استثناء فردي (منح)' : 'Individual Grant'}
                                </span>
                              ) : detail.source === 'individual_deny' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  {isRtl ? 'استثناء فردي (حجب)' : 'Individual Deny'}
                                </span>
                              ) : detail.source === 'dept_grant' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                  {isRtl ? 'موروث من الإدارة' : 'Inherited (Dept)'}
                                </span>
                              ) : detail.source === 'dept_deny' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  {isRtl ? 'محجوب من الإدارة' : 'Denied (Dept)'}
                                </span>
                              ) : detail.source === 'role_grant' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                                  {isRtl ? 'موروث من الدور' : 'Inherited (Role)'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {isRtl ? 'حجب افتراضي' : 'Default Deny'}
                                </span>
                              );

                            return (
                              <div
                                key={report.id}
                                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">
                                      {isRtl ? report.nameAr : report.nameEn}
                                    </span>
                                    {sourceBadge}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {isRtl ? detail.reasonAr : detail.reasonEn}
                                  </p>
                                </div>

                                {/* 3-Way Segmented Control with Immediate Persistence */}
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleSetEmployeeReportOverride(report.id, 'inherit')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                                      currentMode === 'inherit' ? 'bg-white text-slate-800 shadow font-bold' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    {isRtl ? 'افتراضي (وراثة)' : 'Inherit'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetEmployeeReportOverride(report.id, 'grant')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                                      currentMode === 'grant' ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 hover:text-emerald-700'
                                    }`}
                                  >
                                    {isRtl ? 'منح صريح (ALLOW)' : 'Allow'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetEmployeeReportOverride(report.id, 'deny')}
                                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                                      currentMode === 'deny' ? 'bg-rose-600 text-white shadow font-bold' : 'text-slate-500 hover:text-rose-700'
                                    }`}
                                  >
                                    {isRtl ? 'حجب صريح (DENY)' : 'Deny'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Operational Actions Overrides */}
          {selectedEmp && (
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800">
                {isRtl ? 'الصلاحيات الإضافية العامة الممنوحة للموظف:' : 'General Operational Overrides:'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { perm: 'payments:edit_pending', labelAr: 'تعديل سند تحصيل غير مؤكد', labelEn: 'Edit Pending Payment Receipt' },
                  { perm: 'payments:cancel_pending', labelAr: 'إلغاء سند تحصيل غير مؤكد', labelEn: 'Cancel Pending Payment Receipt' },
                  { perm: 'finance:approve', labelAr: 'اعتماد المدفوعات والتحصيلات', labelEn: 'Approve Payments' },
                  { perm: 'campaigns:approve_capacity', labelAr: 'إقرار بوابة الطاقة الاستيعابية', labelEn: 'Approve Capacity Gate' },
                  { perm: 'files:reassign_owner', labelAr: 'إعادة إسناد ملكية الملفات لأي موظف', labelEn: 'Reassign File Ownership' },
                  { perm: 'complaints:resolve', labelAr: 'إغلاق واعتماد تسوية الشكاوى', labelEn: 'Resolve Complaints' },
                  { perm: 'reports:export', labelAr: 'تصدير التقارير المالية والتشغيلية', labelEn: 'Export Confidential Reports' },
                  { perm: 'audit:view', labelAr: 'الاطلاع على سجلات التدقيق الإداري', labelEn: 'View System Audit Logs' },
                  { perm: 'users:reset_password', labelAr: 'إعادة تعيين كلمة المرور للمستخدمين', labelEn: 'Reset User Password' },
                  { perm: 'users:manage_permissions', labelAr: 'إدارة صلاحيات مستخدمي النظام', labelEn: 'Manage System User Permissions' }
                ].map(item => {
                  const isOverridden = (selectedEmp.custom_permissions || []).includes(item.perm);
                  return (
                    <div
                      key={item.perm}
                      onClick={() => handleToggleEmployeeActionOverride(item.perm)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isOverridden ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      <div>
                        <span className="text-xs font-bold block text-slate-800">{isRtl ? item.labelAr : item.labelEn}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOverridden ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                        {isOverridden && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab 4: Role Catalog */}
      {/* ========================================================================= */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(positions).map(pos => {
            const roleCode = pos.code || String(pos.id);
            return (
              <div key={roleCode} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-bct-navy/10 text-bct-navy rounded-full text-xs font-bold">
                      {departments.find(d => d.id === pos.department_id)?.[isRtl ? 'name_ar' : 'name_en'] || (isRtl ? 'وظيفة قياسية' : 'Standard Role')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {(pos.permissions || []).length} {isRtl ? 'صلاحيات' : 'permissions'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isRtl ? pos.title_ar : pos.title_en}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                    {pos.description || pos.purpose_ar}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedRoleCode(roleCode);
                      setActiveTab('matrix');
                    }}
                    className="text-xs font-bold text-bct-navy hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تعديل الصلاحيات' : 'Edit Matrix'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
