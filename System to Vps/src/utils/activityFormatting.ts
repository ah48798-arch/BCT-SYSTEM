import { bctStore } from '../services/store';
import { Language } from '../locales';
import { StudentFileActivityRecord, JobPosition } from '../types/database.types';

/**
 * Resolves the bilingual display name of an employee.
 */
export function resolveEmployeeDisplayName(
  empId?: string | null,
  fallbackName?: string | null,
  language: Language = 'ar'
): string {
  if (!empId && !fallbackName) {
    return language === 'ar' ? 'غير مسند' : 'Unassigned';
  }

  let emp = empId ? bctStore.getEmployee(empId) : undefined;
  if (!emp && fallbackName) {
    emp = bctStore.getEmployees().find(
      (e) =>
        e.full_name_ar === fallbackName ||
        e.full_name_en === fallbackName ||
        e.employee_code === fallbackName ||
        e.id === fallbackName
    );
  }

  if (emp) {
    return language === 'ar'
      ? emp.full_name_ar || emp.full_name_en || fallbackName || ''
      : emp.full_name_en || emp.full_name_ar || fallbackName || '';
  }

  return fallbackName || (language === 'ar' ? 'غير مسند' : 'Unassigned');
}

/**
 * Resolves the localized job title for an activity actor or employee.
 */
export function resolveActorJobTitle(
  act: StudentFileActivityRecord,
  language: Language = 'ar'
): string {
  let emp = act.actor_id ? bctStore.getEmployee(act.actor_id) : undefined;
  if (!emp && act.actor_name) {
    emp = bctStore.getEmployees().find(
      (e) =>
        e.full_name_ar === act.actor_name ||
        e.full_name_en === act.actor_name
    );
  }

  if (emp) {
    return bctStore.getEmployeeJobTitle(emp, language);
  }

  if (act.actor_role) {
    const roleStr = act.actor_role.trim();
    const positions: Record<string, JobPosition> = bctStore.getJobPositions();
    
    // Direct code lookup
    if (positions[roleStr]) {
      return language === 'ar' ? positions[roleStr].title_ar : positions[roleStr].title_en;
    }

    // Lookup by matching title_ar or title_en
    const matched = Object.values(positions).find(
      (p: JobPosition) => p.title_ar === roleStr || p.title_en === roleStr
    );
    if (matched) {
      return language === 'ar' ? matched.title_ar : matched.title_en;
    }

    return roleStr;
  }

  return language === 'ar' ? 'موظف معتمد' : 'Authorized Staff';
}

/**
 * Resolves localized department title.
 */
export function resolveActorDepartment(
  deptKey?: string | null,
  language: Language = 'ar',
  t?: (key: string, fallback?: string) => string
): string {
  if (!deptKey) return '';

  if (t) {
    const translated = t(`departments.${deptKey}`, deptKey);
    if (translated && !translated.startsWith('departments.')) {
      return translated;
    }
  }

  const deptObj = bctStore.getDepartments().find(
    (d) => d.id === deptKey || d.name_ar === deptKey || d.name_en === deptKey
  );

  if (deptObj) {
    return language === 'ar' ? deptObj.name_ar : deptObj.name_en;
  }

  return deptKey;
}
