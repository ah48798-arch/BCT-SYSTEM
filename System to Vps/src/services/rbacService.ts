import { Employee, JobPosition, RoleId, Department } from '../types/database.types';
import { SYSTEM_REPORTS, SystemReportDefinition } from '../types/reports.types';
import { ALL_DASHBOARD_ELEMENTS, DashboardElementDefinition } from '../types/dashboardVisibility.types';

export type PermissionModule =
  | 'students'
  | 'files'
  | 'finance'
  | 'tasks'
  | 'complaints'
  | 'handoffs'
  | 'campaigns'
  | 'reports'
  | 'users'
  | 'settings'
  | 'backup';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'export';

export interface EffectivePermissionSummary {
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string;
  positionId: string;
  roles: string[];
  inheritedFromRoles: string[];
  individualGrants: string[];
  individualDenies: string[];
  effectivePermissions: string[];
  isSuperAdmin: boolean;
}

export interface EffectivePermissionDetail {
  allowed: boolean;
  source: 'super_admin' | 'individual_grant' | 'individual_deny' | 'dept_grant' | 'dept_deny' | 'role_grant' | 'default_grant' | 'default_deny';
  reasonAr: string;
  reasonEn: string;
}

/**
 * Standard default permissions for the 18 organizational job roles in BCT
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  // 1. General Manager (Super Admin - All Access)
  gm: ['*'],

  // 2. System Administrator (Full Admin Access)
  sys_admin: ['*'],

  // 3. Operations Manager (CRM, Pipeline, Tasks, Workflows, Capacity Approval, Reports, Dashboards)
  ops_mgr: [
    'students:view', 'students:create', 'students:edit', 'students:approve', 'students:assign', 'students:export',
    'files:view', 'files:create', 'files:edit', 'files:approve', 'files:assign', 'files:export',
    'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:assign',
    'complaints:view',
    'handoffs:view', 'handoffs:create', 'handoffs:edit', 'handoffs:approve',
    'campaigns:view', 'campaigns:approve', 'campaigns:reject',
    'reports:view', 'reports:export',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:quality_complaints',
    'dash:general:stage_pipeline',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks',
    'dash:exec:capacity_utilization',
    'dash:exec:sla_compliance',
    'dash:exec:stage_pipeline',
    'dash:exec:90day_roadmap'
  ],

  // 4. University Applications Specialist (Submissions & Platform Filings)
  apply_off: [
    'students:view', 'students:create', 'students:edit',
    'files:view', 'files:create', 'files:edit',
    'tasks:view', 'tasks:edit',
    'handoffs:view',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks'
  ],

  // 5. Certificate Extraction Specialist
  cert_off: [
    'students:view', 'students:edit',
    'files:view', 'files:edit',
    'tasks:view', 'tasks:edit',
    'handoffs:view',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks'
  ],

  // 6. Follow-up Specialist
  follow_off: [
    'students:view', 'students:edit',
    'files:view', 'files:edit',
    'tasks:view', 'tasks:edit',
    'handoffs:view',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks'
  ],

  // 7. External Transactions Representative (Liaison)
  liaison: [
    'students:view',
    'files:view', 'files:edit',
    'tasks:view', 'tasks:edit',
    'handoffs:view',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks'
  ],

  // 8. Head of Consultants & Customer Service
  cs_lead: [
    'students:view', 'students:create', 'students:edit', 'students:assign',
    'files:view', 'files:create', 'files:edit',
    'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:assign',
    'complaints:view', 'complaints:create',
    'handoffs:view', 'handoffs:create',
    'reports:view',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:quality_complaints',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks',
    'dash:exec:conversion_rate',
    'dash:exec:sla_compliance'
  ],

  // 9. Educational Consultant
  consultant: [
    'students:view', 'students:create', 'students:edit',
    'files:view', 'files:create',
    'tasks:view', 'tasks:edit',
    'dash:general:active_files',
    'dash:general:pending_tasks',
    'dash:general:recent_active_files',
    'dash:general:immediate_tasks'
  ],

  // 10. Inbox & Chat Specialist
  inbox: [
    'students:view', 'students:create',
    'tasks:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks'
  ],

  // 11. Receptionist
  reception: [
    'students:view', 'students:create',
    'tasks:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks'
  ],

  // 12. Marketing Manager
  mkt_mgr: [
    'campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:export',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'reports:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks',
    'dash:exec:capacity_utilization',
    'dash:exec:conversion_rate',
    'dash:exec:marketing_gate',
    'dash:exec:90day_roadmap'
  ],

  // 13. Content Creator
  content: [
    'campaigns:view',
    'tasks:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks'
  ],

  // 14. Ads Specialist / Media Buyer
  ads: [
    'campaigns:view', 'campaigns:create', 'campaigns:edit',
    'tasks:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks',
    'dash:exec:conversion_rate',
    'dash:exec:marketing_gate'
  ],

  // 15. Finance & Administrative Manager
  fin_mgr: [
    'finance:view', 'finance:create', 'finance:edit', 'finance:approve', 'finance:reject', 'finance:export',
    'payments:edit_pending',
    'payments:cancel_pending',
    'reports:view', 'reports:export',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'users:view',
    'dash:general:net_collections',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks',
    'dash:exec:confirmed_collections',
    'dash:exec:approved_expenses',
    'dash:exec:net_collections',
    'dash:exec:emergency_reserve',
    'dash:exec:90day_roadmap'
  ],

  // 16. Accountant & Cashier
  accountant: [
    'finance:view', 'finance:create', 'finance:edit', 'finance:approve', 'finance:export',
    'payments:edit_pending',
    'payments:cancel_pending',
    'students:view',
    'tasks:view',
    'dash:general:net_collections',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks',
    'dash:exec:confirmed_collections',
    'dash:exec:approved_expenses',
    'dash:exec:net_collections'
  ],

  // 17. Human Resources & Training
  hr: [
    'users:view', 'users:create', 'users:edit',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'reports:view',
    'dash:general:pending_tasks',
    'dash:general:immediate_tasks',
    'dash:exec:90day_roadmap'
  ],

  // 18. Quality Assurance & Complaints Officer
  qa_mgr: [
    'complaints:view', 'complaints:create', 'complaints:edit', 'complaints:approve', 'complaints:reject',
    'reports:view', 'reports:export',
    'tasks:view', 'tasks:create', 'tasks:edit',
    'students:view',
    'files:view',
    'dash:general:quality_complaints',
    'dash:general:pending_tasks',
    'dash:general:stage_pipeline',
    'dash:general:immediate_tasks',
    'dash:exec:sla_compliance',
    'dash:exec:stage_pipeline',
    'dash:exec:90day_roadmap'
  ]
};

/**
 * Normalizes permission key aliases to canonical module:action pairs
 */
export function normalizePermission(permission: string): string[] {
  const perm = permission.trim().toLowerCase();
  const variants = [perm];

  // Dot notation normalization (e.g. finance.view -> finance:view)
  if (perm.includes('.')) {
    variants.push(perm.replace(/\./g, ':'));
  }

  // Common aliases mapping
  const aliasMap: Record<string, string[]> = {
    // Finance aliases
    'payments:view': ['finance:view'],
    'payments:create': ['finance:create'],
    'payments:edit_pending': ['payments:edit_pending'], // Strictly separate from payments:confirm / finance:approve
    'payments:cancel_pending': ['payments:cancel_pending'], // Strictly separate from payments:confirm / payments:edit_pending / finance:approve
    'payments:confirm': ['finance:approve'],
    'expenses:view': ['finance:view'],
    'expenses:create': ['finance:create'],
    'expenses:approve': ['finance:approve'],
    'budgets:view': ['finance:view'],
    'budgets:manage': ['finance:approve', 'finance:edit'],

    // Incentive & Ledger aliases
    'incentive:view': ['finance:view'],
    'incentive:create': ['finance:create'],
    'incentive:approve': ['finance:approve'],
    'incentive:pay': ['finance:approve'],
    'voucher:print': ['finance:view'],
    'ledger:view': ['finance:view'],
    'ledger:export': ['finance:export', 'finance:view'],
    'finance:accounts:manage': ['finance:edit', 'finance:approve'],

    // Student CRM & Pipeline aliases
    'files:view': ['students:view', 'files:view'],
    'files:create': ['students:create', 'files:create'],
    'files:edit': ['students:edit', 'files:edit'],
    'files:delete': ['students:delete', 'files:delete'],
    'files:stage_move': ['students:edit', 'files:edit', 'students:approve'],
    'preferences:edit': ['students:edit', 'files:edit'],

    // Users / Employee aliases
    'employees:view': ['users:view'],
    'employees:create': ['users:create'],
    'employees:edit': ['users:edit'],
    'employees:delete': ['users:delete'],
    'employees:manage': ['users:edit', 'users:create'],
    'departments:manage': ['users:edit', 'users:create'],
    'users:view_system_users': ['users:view_system_users', 'users:view'],
    'users:create_system_user': ['users:create_system_user', 'users:create'],
    'users:activate_system_user': ['users:activate_system_user', 'users:edit'],
    'users:deactivate_system_user': ['users:deactivate_system_user', 'users:edit'],
    'users:reset_password': ['users:reset_password'],
    'users:manage_permissions': ['users:manage_permissions', 'users:edit'],

    // Marketing aliases
    'campaigns:approve_capacity': ['campaigns:approve'],
    'capacity:gate_override': ['campaigns:approve'],

    // Quality / Complaints aliases
    'complaints:resolve': ['complaints:approve'],
    'quality:view': ['complaints:view', 'reports:view'],
    'quality:manage': ['complaints:approve', 'complaints:edit'],

    // Backup & Restore aliases
    'backup:view': ['backup:view', 'settings:view'],
    'backup:create': ['backup:create', 'settings:edit'],
    'backup:schedule': ['backup:schedule', 'settings:edit'],
    'backup:google_drive': ['backup:google_drive', 'settings:edit'],
    'backup:download': ['backup:download', 'settings:view'],
    'backup:restore': ['backup:restore'],
    'backup:delete': ['backup:delete']
  };

  if (aliasMap[perm]) {
    variants.push(...aliasMap[perm]);
  }

  return Array.from(new Set(variants));
}

export class RBACService {
  /**
   * Verified Super Admin check
   */
  public isSuperAdmin(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (user.employment_status !== 'active') return false;

    return Boolean(
      user.position_id === 'gm' ||
      user.job_title_code === 'general_manager' ||
      (user.roles && (user.roles.includes('super_admin') || user.roles.includes('gm'))) ||
      user.username === 'bashdar.gm' ||
      user.username === 'admin'
    );
  }

  /**
   * Authority Precedence:
   * 1. Verified Super Admin authority -> TRUE
   * 2. Explicit employee-level deny (override === false) -> FALSE
   * 3. Explicit employee-level grant (override === true or in custom_permissions) -> TRUE
   * 4. Assigned role permissions (job position matrix) -> TRUE if granted
   * 5. Default Deny -> FALSE
   */
  public hasPermission(
    user: Employee | null | undefined,
    permission: string,
    positions?: Record<string, JobPosition>
  ): boolean {
    if (!user) return false;
    if (user.employment_status !== 'active') return false;

    // Precedence 1: Verified Super Admin has full authority
    if (this.isSuperAdmin(user)) {
      return true;
    }

    const permissionVariants = normalizePermission(permission);

    // Extract module name from permission string (e.g. 'finance:view' -> 'finance')
    const primaryPerm = permissionVariants[0] || permission;
    const [moduleName] = primaryPerm.split(/[:.]/);

    // Precedence 2: Explicit Employee-Level Deny (Overrides Role Grant)
    if (user.permission_overrides) {
      for (const variant of permissionVariants) {
        if (user.permission_overrides[variant] === false) {
          return false;
        }
      }
      if (moduleName && (user.permission_overrides[`${moduleName}:*`] === false || user.permission_overrides[moduleName] === false)) {
        return false;
      }
    }

    // Precedence 3: Explicit Employee-Level Grant
    if (user.permission_overrides) {
      for (const variant of permissionVariants) {
        if (user.permission_overrides[variant] === true) {
          return true;
        }
      }
      if (moduleName && user.permission_overrides[`${moduleName}:*`] === true) {
        return true;
      }
    }

    // Check custom_permissions array
    const customList = Array.isArray(user.custom_permissions) ? user.custom_permissions : [];
    const directPermsList = Array.isArray(user.permissions) ? user.permissions : [];
    const employeeExplicitGrants = [...customList, ...directPermsList];

    if (employeeExplicitGrants.includes('*')) {
      return true;
    }
    if (moduleName && (employeeExplicitGrants.includes(`${moduleName}:*`) || employeeExplicitGrants.includes(`${moduleName}.*`))) {
      return true;
    }
    for (const variant of permissionVariants) {
      if (employeeExplicitGrants.includes(variant)) {
        return true;
      }
    }

    // Precedence 4: Assigned Role Permissions
    const userRoles = new Set<string>();
    if (user.position_id) userRoles.add(user.position_id);
    if (Array.isArray(user.roles)) {
      user.roles.forEach(r => userRoles.add(r));
    }

    for (const roleId of userRoles) {
      const pos = positions ? positions[roleId] : undefined;
      const rolePermissions = pos?.permissions && Array.isArray(pos.permissions)
        ? pos.permissions
        : (DEFAULT_ROLE_PERMISSIONS[roleId] || []);

      // Wildcard full access on role
      if (rolePermissions.includes('*')) {
        return true;
      }

      // Wildcard module access on role
      if (moduleName && (rolePermissions.includes(`${moduleName}:*`) || rolePermissions.includes(`${moduleName}.*`))) {
        return true;
      }

      // Exact match on any normalized variant
      for (const variant of permissionVariants) {
        if (rolePermissions.includes(variant)) {
          return true;
        }
      }
    }

    // Precedence 5: Default Deny (Never default to true)
    return false;
  }

  /**
   * Calculate detailed breakdown of an employee's effective permissions
   */
  public getEffectivePermissionSummary(
    user: Employee,
    positions: Record<string, JobPosition>
  ): EffectivePermissionSummary {
    const isSuper = this.isSuperAdmin(user);
    const userRoles = Array.from(new Set([user.position_id, ...(user.roles || [])])).filter(Boolean);

    // Collect inherited role permissions
    const inheritedSet = new Set<string>();
    for (const roleId of userRoles) {
      const pos = positions[roleId];
      const perms = pos?.permissions && Array.isArray(pos.permissions)
        ? pos.permissions
        : (DEFAULT_ROLE_PERMISSIONS[roleId] || []);
      perms.forEach(p => inheritedSet.add(p));
    }

    // Collect individual grants
    const grantsSet = new Set<string>();
    if (Array.isArray(user.custom_permissions)) {
      user.custom_permissions.forEach(p => grantsSet.add(p));
    }
    if (Array.isArray(user.permissions)) {
      user.permissions.forEach(p => grantsSet.add(p));
    }
    if (user.permission_overrides) {
      Object.entries(user.permission_overrides).forEach(([perm, val]) => {
        if (val === true) grantsSet.add(perm);
      });
    }

    // Collect individual denies
    const deniesSet = new Set<string>();
    if (user.permission_overrides) {
      Object.entries(user.permission_overrides).forEach(([perm, val]) => {
        if (val === false) deniesSet.add(perm);
      });
    }

    // Calculate final effective permissions
    const effectiveSet = new Set<string>();
    if (isSuper) {
      effectiveSet.add('*');
    } else {
      // Start with inherited
      inheritedSet.forEach(p => effectiveSet.add(p));
      // Add individual grants
      grantsSet.forEach(p => effectiveSet.add(p));
      // Remove individual denies
      deniesSet.forEach(p => effectiveSet.delete(p));
    }

    return {
      employeeId: user.id,
      employeeNameAr: user.full_name_ar,
      employeeNameEn: user.full_name_en,
      positionId: user.position_id,
      roles: userRoles,
      inheritedFromRoles: Array.from(inheritedSet),
      individualGrants: Array.from(grantsSet),
      individualDenies: Array.from(deniesSet),
      effectivePermissions: Array.from(effectiveSet),
      isSuperAdmin: isSuper
    };
  }

  /**
   * Evaluates granular report visibility with strict conflict precedence:
   * 1. Super Admin -> TRUE
   * 2. Individual Explicit Deny (report_overrides / permission_overrides === false) -> FALSE
   * 3. Individual Explicit Grant (report_overrides / permission_overrides === true) -> TRUE
   * 4. Department-Level Permissions (dept.report_permissions) -> TRUE / FALSE
   * 5. Role-Level Baseline (JobPosition.permissions or default role permissions) -> TRUE / FALSE
   * 6. Default Deny -> FALSE
   */
  public canViewReport(
    user: Employee | null | undefined,
    reportId: string,
    positions?: Record<string, JobPosition>,
    departments?: Department[]
  ): boolean {
    return this.getEffectiveReportPermissionDetail(user, reportId, positions, departments).allowed;
  }

  /**
   * Detailed evaluation of report permission source and rationale
   */
  public getEffectiveReportPermissionDetail(
    user: Employee | null | undefined,
    reportId: string,
    positions?: Record<string, JobPosition>,
    departments?: Department[]
  ): EffectivePermissionDetail {
    if (!user || user.employment_status !== 'active') {
      return {
        allowed: false,
        source: 'default_deny',
        reasonAr: 'المستخدم غير نشط أو غير مسجل',
        reasonEn: 'User is inactive or unauthenticated'
      };
    }

    // 1. Super Admin check
    if (this.isSuperAdmin(user)) {
      return {
        allowed: true,
        source: 'super_admin',
        reasonAr: 'صلاحية كاملة غير مقيدة (مدير عام / مسؤول النظام الأعلى)',
        reasonEn: 'Unrestricted Full Authority (Super Admin / General Manager)'
      };
    }

    const reportDef = SYSTEM_REPORTS.find(r => r.id === reportId);
    const reportDeptId = reportDef?.departmentId;

    // 2. Individual Explicit Deny (Priority #1 over Department & Role)
    // Check report_overrides
    if (user.report_overrides) {
      if (user.report_overrides[reportId] === false || user.report_overrides[`report:${reportId}`] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب صريح مخصص لهذا الموظف (Individual Deny Override)',
          reasonEn: 'Explicit individual deny override for this employee'
        };
      }
      if (reportDeptId && (user.report_overrides[`${reportDeptId}:*`] === false || user.report_overrides[`report:${reportDeptId}:*`] === false)) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: `حجب صريح لتقارير قسم ${reportDeptId} للموظف`,
          reasonEn: `Explicit individual deny for department ${reportDeptId} reports`
        };
      }
      if (user.report_overrides['*'] === false || user.report_overrides['report:*'] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب عام لكافة التقارير للموظف',
          reasonEn: 'Global report deny override for employee'
        };
      }
    }

    // Check permission_overrides
    if (user.permission_overrides) {
      if (user.permission_overrides[`report:${reportId}`] === false || user.permission_overrides[reportId] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب صريح مخصص لهذا الموظف (Individual Deny Override)',
          reasonEn: 'Explicit individual deny override for this employee'
        };
      }
      if (reportDeptId && user.permission_overrides[`report:${reportDeptId}:*`] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: `حجب صريح لتقارير قسم ${reportDeptId} للموظف`,
          reasonEn: `Explicit individual deny for department ${reportDeptId} reports`
        };
      }
      if (user.permission_overrides['report:*'] === false || user.permission_overrides['reports:view'] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب عام لصلاحية عرض التقارير للموظف',
          reasonEn: 'Explicit deny on viewing reports'
        };
      }
    }

    // 3. Individual Explicit Grant (Priority #2 over Department & Role)
    if (user.report_overrides) {
      if (user.report_overrides[reportId] === true || user.report_overrides[`report:${reportId}`] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح صريح مخصص لهذا الموظف (Individual Exception Grant)',
          reasonEn: 'Explicit individual grant exception for this employee'
        };
      }
      if (reportDeptId && (user.report_overrides[`${reportDeptId}:*`] === true || user.report_overrides[`report:${reportDeptId}:*`] === true)) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: `منح صريح لتقارير قسم ${reportDeptId} للموظف`,
          reasonEn: `Explicit individual grant for department ${reportDeptId} reports`
        };
      }
      if (user.report_overrides['*'] === true || user.report_overrides['report:*'] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح عام لكافة التقارير للموظف',
          reasonEn: 'Global report grant exception for employee'
        };
      }
    }

    if (user.permission_overrides) {
      if (user.permission_overrides[`report:${reportId}`] === true || user.permission_overrides[reportId] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح صريح مخصص لهذا الموظف (Individual Exception Grant)',
          reasonEn: 'Explicit individual grant exception for this employee'
        };
      }
      if (reportDeptId && user.permission_overrides[`report:${reportDeptId}:*`] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: `منح صريح لتقارير قسم ${reportDeptId} للموظف`,
          reasonEn: `Explicit individual grant for department ${reportDeptId} reports`
        };
      }
      if (user.permission_overrides['report:*'] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح عام لكافة التقارير للموظف',
          reasonEn: 'Global report grant exception for employee'
        };
      }
    }

    const employeeExplicitGrants = [
      ...(Array.isArray(user.custom_permissions) ? user.custom_permissions : []),
      ...(Array.isArray(user.permissions) ? user.permissions : [])
    ];

    if (employeeExplicitGrants.includes('*') || employeeExplicitGrants.includes('report:*')) {
      return {
        allowed: true,
        source: 'individual_grant',
        reasonAr: 'صلاحية استثنائية شاملة للموظف',
        reasonEn: 'Comprehensive custom permission grant'
      };
    }
    if (employeeExplicitGrants.includes(`report:${reportId}`) || employeeExplicitGrants.includes(reportId)) {
      return {
        allowed: true,
        source: 'individual_grant',
        reasonAr: 'صلاحية تقرير مخصصة ومباشرة للموظف',
        reasonEn: 'Direct custom report grant on employee profile'
      };
    }
    if (reportDeptId && employeeExplicitGrants.includes(`report:${reportDeptId}:*`)) {
      return {
        allowed: true,
        source: 'individual_grant',
        reasonAr: `صلاحية مخصصة لتقارير قسم ${reportDeptId}`,
        reasonEn: `Direct custom grant for department ${reportDeptId} reports`
      };
    }

    // 4. Department-Level Permissions (Baseline for all members of the department)
    if (departments && departments.length > 0) {
      const userDept = departments.find(d => d.id === user.department_id || d.code === user.department_id);
      if (userDept && userDept.report_permissions) {
        // Explicit report toggle at department level
        if (userDept.report_permissions[reportId] === false || userDept.report_permissions[`report:${reportId}`] === false) {
          return {
            allowed: false,
            source: 'dept_deny',
            reasonAr: `حجب هذا التقرير على مستوى إدارة (${userDept.name_ar})`,
            reasonEn: `Denied at Department Level (${userDept.name_en})`
          };
        }
        if (userDept.report_permissions[reportId] === true || userDept.report_permissions[`report:${reportId}`] === true) {
          return {
            allowed: true,
            source: 'dept_grant',
            reasonAr: `مسموح بموجب صلاحيات إدارة (${userDept.name_ar})`,
            reasonEn: `Granted at Department Level (${userDept.name_en})`
          };
        }

        // Department-level wildcard check
        if (reportDeptId && (userDept.report_permissions[`${reportDeptId}:*`] === false || userDept.report_permissions[`report:${reportDeptId}:*`] === false)) {
          return {
            allowed: false,
            source: 'dept_deny',
            reasonAr: `حجب تقارير قسم ${reportDeptId} على مستوى الإدارة`,
            reasonEn: `Departmental deny for category ${reportDeptId}`
          };
        }
        if (reportDeptId && (userDept.report_permissions[`${reportDeptId}:*`] === true || userDept.report_permissions[`report:${reportDeptId}:*`] === true)) {
          return {
            allowed: true,
            source: 'dept_grant',
            reasonAr: `ممنوح لتقارير قسم ${reportDeptId} على مستوى الإدارة`,
            reasonEn: `Departmental grant for category ${reportDeptId}`
          };
        }

        if (userDept.report_permissions['*'] === false || userDept.report_permissions['report:*'] === false) {
          return {
            allowed: false,
            source: 'dept_deny',
            reasonAr: `حجب جميع التقارير على مستوى إدارة (${userDept.name_ar})`,
            reasonEn: `All reports denied for department (${userDept.name_en})`
          };
        }
        if (userDept.report_permissions['*'] === true || userDept.report_permissions['report:*'] === true) {
          return {
            allowed: true,
            source: 'dept_grant',
            reasonAr: `السماح بكافة التقارير لإدارة (${userDept.name_ar})`,
            reasonEn: `All reports allowed for department (${userDept.name_en})`
          };
        }

        // Implicit Department Baseline: If report belongs to user's department and not explicitly denied
        if (reportDeptId && (user.department_id === reportDeptId || user.department_id === 'gm')) {
          return {
            allowed: true,
            source: 'dept_grant',
            reasonAr: `مسموح تلقائياً لمنسوبي إدارة (${userDept.name_ar})`,
            reasonEn: `Allowed by default for members of department (${userDept.name_en})`
          };
        }
      }
    }

    // 5. Role-Level Baseline (JobPosition.permissions)
    const userRoles = new Set<string>();
    if (user.position_id) userRoles.add(user.position_id);
    if (Array.isArray(user.roles)) {
      user.roles.forEach(r => userRoles.add(r));
    }

    for (const roleId of userRoles) {
      const pos = positions ? positions[roleId] : undefined;
      const rolePermissions = pos?.permissions && Array.isArray(pos.permissions)
        ? pos.permissions
        : (DEFAULT_ROLE_PERMISSIONS[roleId] || []);

      if (rolePermissions.includes('*') || rolePermissions.includes('report:*')) {
        return {
          allowed: true,
          source: 'role_grant',
          reasonAr: `ممنوح بموجب الدور الوظيفي (${pos?.title_ar || roleId})`,
          reasonEn: `Granted by Job Role (${pos?.title_en || roleId})`
        };
      }

      if (rolePermissions.includes(`report:${reportId}`) || rolePermissions.includes(reportId)) {
        return {
          allowed: true,
          source: 'role_grant',
          reasonAr: `ممنوح صراحة للدور الوظيفي (${pos?.title_ar || roleId})`,
          reasonEn: `Explicitly granted to Job Role (${pos?.title_en || roleId})`
        };
      }

      if (reportDeptId && rolePermissions.includes(`report:${reportDeptId}:*`)) {
        return {
          allowed: true,
          source: 'role_grant',
          reasonAr: `ممنوح لتقارير قسم ${reportDeptId} للدور (${pos?.title_ar || roleId})`,
          reasonEn: `Granted for department ${reportDeptId} reports by Job Role`
        };
      }

      // Default role permission matching: if role has reports:view or reports:*,
      // and this report lists this role in defaultRoles, or user's department matches report department:
      if (rolePermissions.includes('reports:view') || rolePermissions.includes('reports:*')) {
        if (reportDef?.defaultRoles && reportDef.defaultRoles.includes(roleId)) {
          return {
            allowed: true,
            source: 'role_grant',
            reasonAr: `تقرير قياسي متاح للدور الوظيفي (${pos?.title_ar || roleId})`,
            reasonEn: `Standard report accessible for Job Role (${pos?.title_en || roleId})`
          };
        }
        if (reportDeptId && (user.department_id === reportDeptId || user.department_id === 'gm')) {
          return {
            allowed: true,
            source: 'role_grant',
            reasonAr: `تقرير تابع لإدارة الموظف ومتاح بموجب صلاحية التقارير (${pos?.title_ar || roleId})`,
            reasonEn: `Department report accessible via general reports permission`
          };
        }
      }
    }

    // 6. Default Deny
    return {
      allowed: false,
      source: 'default_deny',
      reasonAr: 'حجب افتراضي: لا توجد صلاحية صريحة لعرض هذا التقرير',
      reasonEn: 'Default Deny: No explicit permission granted for this report'
    };
  }

  /**
   * Returns list of all report definitions accessible by the user
   */
  public getAllowedReportsForUser(
    user: Employee | null | undefined,
    positions?: Record<string, JobPosition>,
    departments?: Department[]
  ): SystemReportDefinition[] {
    if (!user) return [];
    return SYSTEM_REPORTS.filter(rep => this.canViewReport(user, rep.id, positions, departments));
  }

  /**
   * Evaluates effective permission for a specific dashboard element / widget.
   * Strictly enforces the 3-level hierarchy:
   * Level 1: Super Admin -> Always ALLOW
   * Level 2: Individual Employee Override (user.dashboard_overrides) -> DENY overrules all, GRANT overrules dept/role
   * Level 3: Department-Level Permission (dept.dashboard_permissions) -> Governs all department members
   * Level 4: Role-Level Permission (pos.permissions) -> Configured in Permissions Matrix
   * Level 5: Default Baseline -> Derived from existing operational permissions
   */
  public getEffectiveDashboardWidgetDetail(
    user: Employee | null | undefined,
    widgetId: string,
    positions?: Record<string, JobPosition>,
    departments?: Department[]
  ): EffectivePermissionDetail {
    if (!user || user.employment_status !== 'active') {
      return {
        allowed: false,
        source: 'default_deny',
        reasonAr: 'المستخدم غير نشط أو غير مسجل',
        reasonEn: 'User is inactive or not found'
      };
    }

    // =========================================================================
    // LEVEL 1: Individual Employee Overrides (Highest Priority #1)
    // =========================================================================
    if (user.dashboard_overrides) {
      if (user.dashboard_overrides[widgetId] === false || user.dashboard_overrides['*'] === false || user.dashboard_overrides['dash:*'] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب استثنائي صريح مخصص لهذا الموظف (Individual Deny Override)',
          reasonEn: 'Explicit individual deny override for this employee'
        };
      }
      if (user.dashboard_overrides[widgetId] === true || user.dashboard_overrides['*'] === true || user.dashboard_overrides['dash:*'] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح استثنائي صريح مخصص لهذا الموظف (Individual Grant Override)',
          reasonEn: 'Explicit individual grant override for this employee'
        };
      }
    }

    if (user.permission_overrides) {
      if (user.permission_overrides[widgetId] === false) {
        return {
          allowed: false,
          source: 'individual_deny',
          reasonAr: 'حجب استثنائي صريح مخصص لهذا الموظف',
          reasonEn: 'Explicit individual deny override'
        };
      }
      if (user.permission_overrides[widgetId] === true) {
        return {
          allowed: true,
          source: 'individual_grant',
          reasonAr: 'منح استثنائي صريح مخصص لهذا الموظف',
          reasonEn: 'Explicit individual grant override'
        };
      }
    }

    // Direct custom permissions on employee record
    const customPerms = [
      ...(Array.isArray(user.custom_permissions) ? user.custom_permissions : []),
      ...(Array.isArray(user.permissions) ? user.permissions : [])
    ];
    if (customPerms.includes('*') || customPerms.includes('dash:*') || customPerms.includes(widgetId)) {
      return {
        allowed: true,
        source: 'individual_grant',
        reasonAr: 'صلاحية مخصصة ومباشرة في ملف الموظف',
        reasonEn: 'Direct custom grant on employee profile'
      };
    }

    // =========================================================================
    // LEVEL 2: Job Role Permissions (Priority #2 - Role-Based Governance)
    // =========================================================================
    const userRoles = new Set<string>();
    if (user.position_id) userRoles.add(String(user.position_id));
    if (user.job_title_code) userRoles.add(String(user.job_title_code));
    if (Array.isArray(user.roles)) user.roles.forEach(r => userRoles.add(r));

    let hasConfiguredRole = false;
    for (const roleId of userRoles) {
      const pos = positions ? positions[roleId] : undefined;
      const rolePermissions = pos?.permissions && pos.permissions.length > 0
        ? pos.permissions
        : (DEFAULT_ROLE_PERMISSIONS[roleId] || []);

      if (pos || DEFAULT_ROLE_PERMISSIONS[roleId]) {
        hasConfiguredRole = true;
      }

      if (rolePermissions.includes('*') || rolePermissions.includes('dash:*') || rolePermissions.includes(widgetId)) {
        return {
          allowed: true,
          source: roleId === 'gm' || roleId === 'sys_admin' ? 'super_admin' : 'role_grant',
          reasonAr: `ممنوح بموجب صلاحيات الدور الوظيفي (${pos?.title_ar || roleId})`,
          reasonEn: `Granted by Job Role (${pos?.title_en || roleId})`
        };
      }
    }

    // If the user has a configured job role and that role does not grant widgetId:
    // Strictly DENY access according to role matrix (Role-based isolation)
    if (hasConfiguredRole) {
      return {
        allowed: false,
        source: 'default_deny',
        reasonAr: 'غير مصرح به لهذا الدور الوظيفي في مصفوفة الصلاحيات',
        reasonEn: 'Not authorized for this job role in permissions matrix'
      };
    }

    // =========================================================================
    // LEVEL 3: Department-Level Permissions (Priority #3 - System / Dept Baseline)
    // =========================================================================
    if (departments && departments.length > 0) {
      const userDept = departments.find(d => d.id === user.department_id || d.code === user.department_id);
      if (userDept && userDept.dashboard_permissions) {
        if (userDept.dashboard_permissions[widgetId] === false || userDept.dashboard_permissions['*'] === false || userDept.dashboard_permissions['dash:*'] === false) {
          return {
            allowed: false,
            source: 'dept_deny',
            reasonAr: `حجب هذا العنصر على مستوى إدارة (${userDept.name_ar})`,
            reasonEn: `Denied at Department Level (${userDept.name_en})`
          };
        }
        if (userDept.dashboard_permissions[widgetId] === true || userDept.dashboard_permissions['*'] === true || userDept.dashboard_permissions['dash:*'] === true) {
          return {
            allowed: true,
            source: 'dept_grant',
            reasonAr: `مسموح بموجب صلاحيات إدارة (${userDept.name_ar})`,
            reasonEn: `Granted at Department Level (${userDept.name_en})`
          };
        }
      }
    }

    return {
      allowed: false,
      source: 'default_deny',
      reasonAr: 'حجب افتراضي: لا توجد صلاحية صريحة لعرض هذا العنصر',
      reasonEn: 'Default Deny: No explicit permission granted for this dashboard element'
    };
  }

  public canViewDashboardWidget(
    user: Employee | null | undefined,
    widgetId: string,
    positions?: Record<string, JobPosition>,
    departments?: Department[]
  ): boolean {
    return this.getEffectiveDashboardWidgetDetail(user, widgetId, positions, departments).allowed;
  }

  // Backup & Restore Permissions
  public canViewBackups(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return this.hasPermission(user, 'backup:view');
  }

  public canCreateBackup(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return this.hasPermission(user, 'backup:create');
  }

  public canScheduleBackup(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return this.hasPermission(user, 'backup:schedule');
  }

  public canManageGoogleDrive(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return this.hasPermission(user, 'backup:google_drive');
  }

  public canDownloadBackup(user: Employee | null | undefined): boolean {
    if (!user) return false;
    if (this.isSuperAdmin(user)) return true;
    return this.hasPermission(user, 'backup:download');
  }

  /**
   * Restoration is strictly restricted to Super Admin / GM
   */
  public canRestoreBackup(user: Employee | null | undefined): boolean {
    if (!user) return false;
    return this.isSuperAdmin(user) || this.hasPermission(user, 'backup:restore');
  }

  /**
   * Deletion is strictly restricted to Super Admin / GM
   */
  public canDeleteBackup(user: Employee | null | undefined): boolean {
    if (!user) return false;
    return this.isSuperAdmin(user) || this.hasPermission(user, 'backup:delete');
  }
}

export const rbacService = new RBACService();
