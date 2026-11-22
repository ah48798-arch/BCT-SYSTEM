import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Employee, HRBackupAssignment, PerformanceEvaluation, JobPosition, Department } from '../types/database.types';
import {
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  Award,
  BookOpen,
  AlertCircle,
  FileText,
  UserPlus,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Check,
  Star,
  Activity,
  Search,
  SlidersHorizontal,
  TrendingUp,
  BarChart3,
  Target,
  Sparkles,
  Filter,
  RotateCcw
} from 'lucide-react';

interface OnboardingTask {
  day: number;
  taskAr: string;
  taskEn: string;
  completed: boolean;
}

// Searchable Employee Select Dropdown
interface SearchableEmployeeSelectProps {
  label: string;
  selectedId: string;
  onChange: (employeeId: string) => void;
  employees: Employee[];
  excludeId?: string;
  isRtl: boolean;
  required?: boolean;
}

const SearchableEmployeeSelect: React.FC<SearchableEmployeeSelectProps> = ({
  label,
  selectedId,
  onChange,
  employees,
  excludeId,
  isRtl,
  required
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeEmployees = employees.filter(e => e.employment_status === 'active' && e.id !== excludeId);
  const selected = employees.find(e => e.id === selectedId);

  const filtered = activeEmployees.filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (e.full_name_ar && e.full_name_ar.toLowerCase().includes(q)) ||
      (e.full_name_en && e.full_name_en.toLowerCase().includes(q)) ||
      (e.employee_code && e.employee_code.toLowerCase().includes(q)) ||
      (e.job_title_ar && e.job_title_ar.toLowerCase().includes(q)) ||
      (e.job_title_en && e.job_title_en.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-1 relative" ref={ref}>
      <label className="block font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Selected Card / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs cursor-pointer flex items-center justify-between hover:border-bct-navy focus:ring-1 focus:ring-bct-navy transition-all shadow-2xs"
      >
        {selected ? (
          <div className="flex items-center gap-2 truncate text-start">
            <div className="w-6 h-6 rounded-full bg-bct-navy/10 text-bct-navy font-black text-[10px] flex items-center justify-center shrink-0">
              {selected.full_name_ar ? selected.full_name_ar.slice(0, 1) : 'م'}
            </div>
            <div className="truncate text-start">
              <span className="font-bold text-slate-800 block truncate leading-tight">
                {isRtl ? selected.full_name_ar : selected.full_name_en}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {selected.employee_code} • {isRtl ? selected.job_title_ar : selected.job_title_en}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400">{isRtl ? 'اختر موظفاً من القائمة...' : 'Select an employee...'}</span>
        )}
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ms-2" />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث بالاسم أو الكود أو الوظيفة...' : 'Search by name, code or title...'}
                className="w-full ps-8 pe-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:border-bct-navy outline-none"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-400">
                {isRtl ? 'لا يوجد موظف نشط يطابق البحث' : 'No matching active employee'}
              </div>
            ) : (
              filtered.map(emp => {
                const isSelected = emp.id === selectedId;
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onChange(emp.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      isSelected ? 'bg-bct-navy/10 text-bct-navy font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="truncate text-start">
                      <div className="font-bold truncate">
                        {isRtl ? emp.full_name_ar : emp.full_name_en}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.employee_code} • {isRtl ? emp.job_title_ar : emp.job_title_en}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-bct-navy shrink-0 ms-1" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HRCenter: React.FC = () => {
  const { t, isRtl, language } = useLanguage();
  const { currentEmployee, hasPermission, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canManageHR = isSuperAdmin || hasPermission('users:edit') || currentEmployee?.department_id === 'gm' || currentEmployee?.job_title_code === 'hr';
  const canDeleteEval = canManageHR || hasPermission('users:delete');

  // Unified single source of truth for HR navigation
  const activeTab: 'backups' | 'skills' | 'evaluations' | 'onboarding' = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/hr/evaluations')) return 'evaluations';
    if (path.includes('/hr/skills')) return 'skills';
    if (path.includes('/hr/onboarding')) return 'onboarding';
    if (path.includes('/hr/backups')) return 'backups';
    return 'backups';
  }, [location.pathname]);

  const handleTabChange = (targetTab: 'backups' | 'skills' | 'evaluations' | 'onboarding') => {
    if (targetTab === 'backups') {
      navigate('/hr');
    } else {
      navigate(`/hr/${targetTab}`);
    }
  };
  
  const [employees, setEmployees] = useState<Employee[]>(bctStore.getEmployees());
  const [backupAssignments, setBackupAssignments] = useState<HRBackupAssignment[]>(bctStore.getBackupAssignments());
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>(bctStore.getPerformanceEvaluations());
  const [positions, setPositions] = useState<Record<string, JobPosition>>(bctStore.getJobPositions());
  const [departments, setDepartments] = useState<Department[]>(bctStore.getDepartments());

  // Skills filter state
  const [skillsFilterDept, setSkillsFilterDept] = useState<string>('all');
  const [skillsSearch, setSkillsSearch] = useState<string>('');

  // Add Backup Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupCandidate, setBackupCandidate] = useState<HRBackupAssignment | null>(null);
  const [backupForm, setBackupForm] = useState({
    primary_employee_id: '',
    backup_employee_id: '',
    role_title: '',
    readiness_percentage: 85,
    notes: '',
  });
  const [backupError, setBackupError] = useState<string | null>(null);

  // Edit Backup Modal State
  const [isEditBackupModalOpen, setIsEditBackupModalOpen] = useState(false);
  const [editingBackup, setEditingBackup] = useState<HRBackupAssignment | null>(null);
  const [editBackupForm, setEditBackupForm] = useState({
    id: '',
    primary_employee_id: '',
    backup_employee_id: '',
    role_title: '',
    readiness_percentage: 85,
    notes: '',
  });
  const [editBackupError, setEditBackupError] = useState<string | null>(null);

  // Toast notification feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Evaluation modal state & filters
  const [evalSearch, setEvalSearch] = useState('');
  const [evalFilterPeriod, setEvalFilterPeriod] = useState<string>('all');
  const [evalFilterStatus, setEvalFilterStatus] = useState<string>('all');
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<PerformanceEvaluation | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Date Range Filter States (من تاريخ - إلى تاريخ)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  // Soft Delete Confirmation Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<PerformanceEvaluation | null>(null);
  const [evalForm, setEvalForm] = useState<{
    id: string;
    employee_id: string;
    period: string;
    sla_compliance_score: number | '';
    quality_score: number | '';
    speed_score: number | '';
    strengths: string;
    development_areas: string;
    evaluator_comments: string;
    status: PerformanceEvaluation['status'];
  }>({
    id: '',
    employee_id: '',
    period: 'Q4 2026',
    sla_compliance_score: 90,
    quality_score: 95,
    speed_score: 85,
    strengths: '',
    development_areas: '',
    evaluator_comments: '',
    status: 'draft',
  });
  const [evalError, setEvalError] = useState<string | null>(null);

  // Onboarding tasks
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    { day: 1, taskAr: 'تسليم دليل الهيكل التنظيمي والتعريف برؤية وقيم بي سي تي للاستشارات التعليمية والتدريب', taskEn: 'Deliver Org Guide and orient on BCT Educational Consulting & Training mission & values', completed: true },
    { day: 2, taskAr: 'إنشاء حسابات النظام وتعيين صلاحيات الدور الوظيفي', taskEn: 'Create ERP accounts and assign RBAC permissions', completed: true },
    { day: 4, taskAr: 'تدريب تفصيلي على مصفوفة RACI وقواعد التداخل الثماني', taskEn: 'In-depth training on RACI matrix & 8 Overlap Rules', completed: true },
    { day: 7, taskAr: 'مرافقة عملية (Shadowing) للموظف البديل أو المشرف المباشر', taskEn: 'Practical shadowing with assigned backup role or supervisor', completed: false },
    { day: 10, taskAr: 'اختبار عملي في محاكاة نظام التقديمات والتعامل مع شكاوى الطلاب', taskEn: 'Practical simulation on pipeline handling & complaints SLA', completed: false },
    { day: 14, taskAr: 'جلسة تقييم نهاية فترة التهيئة واعتماد الجاهزية التشغيلية المستقلة', taskEn: 'Induction review meeting and sign-off on independent readiness', completed: false },
  ]);

  useEffect(() => {
    return bctStore.subscribe(() => {
      setEmployees(bctStore.getEmployees());
      setBackupAssignments(bctStore.getBackupAssignments());
      setEvaluations(bctStore.getPerformanceEvaluations());
      setPositions(bctStore.getJobPositions());
      setDepartments(bctStore.getDepartments());
    });
  }, []);

  const handleToggleOnboarding = (idx: number) => {
    setOnboardingTasks(prev => {
      const copy = [...prev];
      copy[idx].completed = !copy[idx].completed;
      return copy;
    });
  };

  // Open Backup Assignment Modal
  const handleOpenAddBackup = () => {
    setBackupCandidate(null);
    setBackupError(null);
    setBackupForm({
      primary_employee_id: employees[0]?.id || '',
      backup_employee_id: employees[1]?.id || '',
      role_title: employees[0]?.job_title_ar || 'أخصائي العمليات',
      readiness_percentage: 85,
      notes: '',
    });
    setIsBackupModalOpen(true);
  };

  const handleSaveBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupForm.primary_employee_id || !backupForm.backup_employee_id) {
      setBackupError(isRtl ? 'يرجى اختيار الموظف الأصيل والموظف البديل' : 'Please select both primary and backup employees');
      return;
    }

    // Validation: Cannot be own backup (Fix 17)
    if (backupForm.primary_employee_id === backupForm.backup_employee_id) {
      setBackupError(isRtl ? 'لا يمكن للموظف أن يكون بديلاً لنفسه! يرجى اختيار موظف بديل آخر.' : 'An employee cannot be their own backup!');
      return;
    }

    const primary = employees.find(e => e.id === backupForm.primary_employee_id);
    const backup = employees.find(e => e.id === backupForm.backup_employee_id);

    // Validation: Duplicate active assignment check
    const duplicate = backupAssignments.find(b => 
      b.primary_employee_id === backupForm.primary_employee_id &&
      b.backup_employee_id === backupForm.backup_employee_id
    );
    if (duplicate) {
      setBackupError(
        isRtl
          ? 'يوجد بالفعل تكليف بديل مسجل بين هذين الموظفين'
          : 'An active backup assignment already exists for these employees'
      );
      return;
    }

    bctStore.addBackupAssignment({
      role_id: primary?.position_id || 'ops_specialist',
      role_title_ar: backupForm.role_title || primary?.job_title_ar || '',
      role_title_en: primary?.job_title_en || 'Operations Specialist',
      primary_employee_id: backupForm.primary_employee_id,
      primary_employee_name_ar: primary?.full_name_ar || '',
      backup_employee_id: backupForm.backup_employee_id,
      backup_employee_name_ar: backup?.full_name_ar || '',
      backup_employee_role_ar: backup?.job_title_ar || '',
      readiness_percentage: Number(backupForm.readiness_percentage),
      notes: backupForm.notes,
    }, currentEmployee?.username || 'admin');

    setIsBackupModalOpen(false);
    setBackupError(null);
    setToast({
      type: 'success',
      message: isRtl ? 'تم تعيين الموظف البديل المعتمد بنجاح' : 'Backup assignment created successfully'
    });
    setTimeout(() => setToast(null), 3500);
  };

  // Open Edit Backup Assignment Modal
  const handleOpenEditBackup = (assignment: HRBackupAssignment) => {
    if (!canManageHR) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بتعديل تكليفات البدلاء (صلاحية users:edit مطلوبة)' : 'Unauthorized to edit backup assignments (users:edit required)'
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setEditingBackup(assignment);
    setEditBackupError(null);
    setEditBackupForm({
      id: assignment.id,
      primary_employee_id: assignment.primary_employee_id,
      backup_employee_id: assignment.backup_employee_id,
      role_title: assignment.role_title_ar || assignment.role_title_en,
      readiness_percentage: assignment.readiness_percentage,
      notes: assignment.notes || '',
    });
    setIsEditBackupModalOpen(true);
  };

  // Save Edit Backup Assignment
  const handleSaveEditBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBackup) return;

    if (!canManageHR) {
      setEditBackupError(isRtl ? 'غير مصرح لك بتعديل التكليف' : 'Unauthorized to edit assignment');
      return;
    }

    if (!editBackupForm.primary_employee_id || !editBackupForm.backup_employee_id) {
      setEditBackupError(isRtl ? 'يرجى اختيار الموظف الأصيل والموظف البديل' : 'Please select both primary and backup employees');
      return;
    }

    // Validation: Cannot be own backup
    if (editBackupForm.primary_employee_id === editBackupForm.backup_employee_id) {
      setEditBackupError(isRtl ? 'لا يمكن للموظف أن يكون بديلاً لنفسه! يرجى اختيار موظف بديل آخر.' : 'An employee cannot be their own backup!');
      return;
    }

    // Validation: Duplicate active assignment check
    const duplicate = backupAssignments.find(b => 
      b.id !== editingBackup.id &&
      b.primary_employee_id === editBackupForm.primary_employee_id &&
      b.backup_employee_id === editBackupForm.backup_employee_id
    );
    if (duplicate) {
      setEditBackupError(
        isRtl
          ? 'يوجد بالفعل تكليف بديل مسجل بين هذين الموظفين لنفس الدور الوظيفي'
          : 'An active backup assignment already exists for these employees'
      );
      return;
    }

    const primary = employees.find(e => e.id === editBackupForm.primary_employee_id);
    const backup = employees.find(e => e.id === editBackupForm.backup_employee_id);

    const success = bctStore.updateBackupAssignment(
      editingBackup.id,
      {
        role_id: primary?.position_id || editingBackup.role_id,
        role_title_ar: editBackupForm.role_title.trim() || primary?.job_title_ar || editingBackup.role_title_ar,
        role_title_en: primary?.job_title_en || editingBackup.role_title_en,
        primary_employee_id: editBackupForm.primary_employee_id,
        primary_employee_name_ar: primary?.full_name_ar || editingBackup.primary_employee_name_ar,
        backup_employee_id: editBackupForm.backup_employee_id,
        backup_employee_name_ar: backup?.full_name_ar || editingBackup.backup_employee_name_ar,
        backup_employee_role_ar: backup?.job_title_ar || editingBackup.backup_employee_role_ar,
        readiness_percentage: Number(editBackupForm.readiness_percentage),
        notes: editBackupForm.notes.trim(),
      },
      currentEmployee?.username || 'admin'
    );

    if (success) {
      setIsEditBackupModalOpen(false);
      setEditingBackup(null);
      setEditBackupError(null);
      setToast({
        type: 'success',
        message: isRtl ? 'تم حفظ وتحديث تكليف البديل بنجاح' : 'Backup assignment updated successfully'
      });
      setTimeout(() => setToast(null), 3500);
    } else {
      setEditBackupError(isRtl ? 'فشل تحديث التكليف. يرجى التحقق من الصلاحيات' : 'Failed to update assignment. Please check permissions.');
    }
  };

  const handleDeleteBackup = (id: string) => {
    if (!canManageHR) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بإلغاء تكليفات البدلاء (users:edit أو users:delete مطلوبة)' : 'Unauthorized to delete backup assignment'
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const confirmed = window.confirm(
      isRtl ? 'هل أنت متأكد من إلغاء تعيين هذا الموظف البديل؟' : 'Are you sure you want to remove this backup assignment?'
    );
    if (!confirmed) return;

    const success = bctStore.deleteBackupAssignment(id, currentEmployee?.username || 'admin');
    if (success) {
      setToast({
        type: 'success',
        message: isRtl ? 'تم إلغاء تعيين البديل بنجاح' : 'Backup assignment removed successfully'
      });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Open Create Performance Evaluation Modal
  const handleOpenCreateEval = () => {
    if (!canManageHR) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بإنشاء تقييمات الأداء (صلاحية users:edit مطلوبة)' : 'Unauthorized to create appraisals (users:edit required)'
      });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setEditingEval(null);
    setEvalError(null);
    setShowClearConfirm(false);
    setEvalForm({
      id: '',
      employee_id: employees[0]?.id || '',
      period: 'Q4 2026',
      sla_compliance_score: 90,
      quality_score: 95,
      speed_score: 85,
      strengths: '',
      development_areas: '',
      evaluator_comments: '',
      status: 'draft',
    });
    setIsEvalModalOpen(true);
  };

  // Open Edit Performance Evaluation Modal
  const handleOpenEditEval = (ev: PerformanceEvaluation) => {
    if (!canManageHR) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بتعديل تقييمات الأداء (صلاحية users:edit مطلوبة)' : 'Unauthorized to edit appraisals (users:edit required)'
      });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setEditingEval(ev);
    setEvalError(null);
    setShowClearConfirm(false);
    setEvalForm({
      id: ev.id,
      employee_id: ev.employee_id,
      period: ev.evaluation_period,
      sla_compliance_score: ev.sla_compliance_score ?? '',
      quality_score: ev.quality_accuracy_score ?? '',
      speed_score: ev.task_completion_score ?? '',
      strengths: ev.strengths || '',
      development_areas: ev.areas_for_improvement || '',
      evaluator_comments: ev.evaluator_comments || '',
      status: ev.status,
    });
    setIsEvalModalOpen(true);
  };

  // Fix 02: Clear Values (مسح القيم) Handlers
  const handleRequestClearValues = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClearValues = () => {
    setEvalForm(prev => ({
      ...prev,
      sla_compliance_score: '',
      quality_score: '',
      speed_score: '',
      strengths: '',
      development_areas: '',
      evaluator_comments: '',
      // employee_id and period are preserved
    }));
    setShowClearConfirm(false);
    setEvalError(null);
    setToast({
      type: 'success',
      message: isRtl
        ? 'تم مسح القيم من النموذج محلياً. لن تتغير البيانات المحفوظة إلا بعد الضغط على حفظ.'
        : 'Form values cleared locally. Saved data will remain unchanged until you save.'
    });
    setTimeout(() => setToast(null), 3500);
  };

  // Save Performance Evaluation (Create or Edit)
  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageHR) {
      setEvalError(isRtl ? 'غير مصرح لك بحفظ التقييم' : 'Unauthorized to save appraisal');
      return;
    }

    if (!evalForm.employee_id) {
      setEvalError(isRtl ? 'يرجى اختيار الموظف المعني بالتقييم' : 'Please select an employee');
      return;
    }

    if (!evalForm.period || !evalForm.period.trim()) {
      setEvalError(isRtl ? 'يرجى تحديد الفترة التقييمية' : 'Please select an evaluation period');
      return;
    }

    // Required criteria scores validation (Fix 02: Incomplete criteria must not be submitted)
    const isSlaEmpty = evalForm.sla_compliance_score === '' || evalForm.sla_compliance_score === null;
    const isQualityEmpty = evalForm.quality_score === '' || evalForm.quality_score === null;
    const isSpeedEmpty = evalForm.speed_score === '' || evalForm.speed_score === null;

    if (isSlaEmpty || isQualityEmpty || isSpeedEmpty) {
      setEvalError(
        isRtl
          ? 'يرجى إدخال جميع درجات المعايير التقييمية المطلوبة (الالتزام، الجودة، السرعة) قبل الحفظ.'
          : 'Please enter all required evaluation criteria scores (SLA, Quality, Speed) before saving.'
      );
      return;
    }

    const sla = Number(evalForm.sla_compliance_score);
    const quality = Number(evalForm.quality_score);
    const speed = Number(evalForm.speed_score);

    if (
      isNaN(sla) || sla < 0 || sla > 100 ||
      isNaN(quality) || quality < 0 || quality > 100 ||
      isNaN(speed) || speed < 0 || speed > 100
    ) {
      setEvalError(
        isRtl
          ? 'يجب أن تكون جميع الدرجات التقييمية أرقاماً بين 0 و 100.'
          : 'All criteria scores must be numbers between 0 and 100.'
      );
      return;
    }

    const overall = Math.round((sla + quality + speed) / 3);
    const emp = employees.find(e => e.id === evalForm.employee_id);

    if (editingEval) {
      const result = bctStore.updatePerformanceEvaluation(editingEval.id, {
        employee_id: evalForm.employee_id,
        employee_name_ar: emp?.full_name_ar,
        evaluation_period: evalForm.period.trim(),
        sla_compliance_score: sla,
        quality_accuracy_score: quality,
        task_completion_score: speed,
        overall_score: overall,
        strengths: evalForm.strengths,
        areas_for_improvement: evalForm.development_areas,
        evaluator_comments: evalForm.evaluator_comments,
        status: evalForm.status,
      }, currentEmployee?.username || 'admin');

      if (result.success) {
        setIsEvalModalOpen(false);
        setEditingEval(null);
        setEvalError(null);
        setShowClearConfirm(false);
        setToast({
          type: 'success',
          message: isRtl ? 'تم تحديث سجل تقييم الأداء بنجاح' : 'Performance appraisal updated successfully'
        });
        setTimeout(() => setToast(null), 3500);
      } else {
        setEvalError(result.error || (isRtl ? 'فشل تحديث التقييم. يرجى التحقق من الصلاحيات' : 'Failed to update appraisal'));
      }
    } else {
      const created = bctStore.createPerformanceEvaluation({
        employee_id: evalForm.employee_id,
        employee_name_ar: emp?.full_name_ar,
        evaluator_id: currentEmployee?.id || 'emp-001',
        evaluator_name_ar: currentEmployee?.full_name_ar || bctStore.getGeneralManagerEmployee()?.full_name_ar || 'خليل محمد عثمان',
        evaluation_period: evalForm.period.trim(),
        sla_compliance_score: sla,
        quality_accuracy_score: quality,
        task_completion_score: speed,
        client_satisfaction_score: 95,
        overall_score: overall,
        strengths: evalForm.strengths,
        areas_for_improvement: evalForm.development_areas,
        evaluator_comments: evalForm.evaluator_comments,
        status: evalForm.status,
      }, currentEmployee?.username || 'admin');

      if (created) {
        setIsEvalModalOpen(false);
        setEditingEval(null);
        setEvalError(null);
        setShowClearConfirm(false);
        setToast({
          type: 'success',
          message: isRtl ? 'تم إنشاء تقييم الأداء بنجاح' : 'Performance appraisal created successfully'
        });
        setTimeout(() => setToast(null), 3500);
      } else {
        setEvalError(isRtl ? 'فشل إنشاء التقييم (قد يوجد تقييم مسجل بالفعل لهذا الموظف خلال نفس الفترة أو الصلاحيات غير كافية)' : 'Failed to create appraisal (duplicate period or insufficient permissions)');
      }
    }
  };

  // Quick Approve Evaluation
  const handleQuickApproveEval = (ev: PerformanceEvaluation) => {
    if (!canManageHR) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك باعتماد التقييم' : 'Unauthorized to approve appraisal'
      });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    const result = bctStore.updatePerformanceEvaluation(ev.id, {
      status: 'approved',
      approved_by: currentEmployee?.id || 'emp-001'
    }, currentEmployee?.username || 'admin');

    if (result.success) {
      setToast({
        type: 'success',
        message: isRtl ? 'تم اعتماد تقييم الأداء رسمياً' : 'Appraisal officially approved'
      });
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast({
        type: 'error',
        message: result.error || (isRtl ? 'فشل اعتماد التقييم' : 'Failed to approve appraisal')
      });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Delete Evaluation Handlers (Soft Delete with Audit Confirmation Modal)
  const handleRequestDeleteEval = (ev: PerformanceEvaluation) => {
    if (!canDeleteEval) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بحذف تقييم الأداء' : 'Unauthorized to delete appraisal'
      });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setDeleteCandidate(ev);
  };
  const handleDeleteEval = handleRequestDeleteEval;

  const handleConfirmDeleteEval = () => {
    if (!deleteCandidate) return;
    if (!canDeleteEval) {
      setToast({
        type: 'error',
        message: isRtl ? 'غير مصرح لك بحذف تقييم الأداء' : 'Unauthorized to delete appraisal'
      });
      setTimeout(() => setToast(null), 3500);
      return;
    }

    const success = bctStore.deletePerformanceEvaluation(
      deleteCandidate.id,
      currentEmployee?.username || 'admin',
      isRtl ? 'استبعاد وأرشفة تدقيقية لسجل التقييم' : 'Audit soft delete and archival of performance appraisal'
    );

    if (success) {
      setToast({
        type: 'success',
        message: isRtl
          ? 'تم استبعاد تقييم الأداء من السجلات النشطة وأرشفته بنجاح'
          : 'Appraisal excluded from active records and archived successfully'
      });
      setTimeout(() => setToast(null), 3500);
      setDeleteCandidate(null);
    } else {
      setToast({
        type: 'error',
        message: isRtl ? 'فشل حذف التقييم. تحقق من الصلاحيات' : 'Failed to delete appraisal'
      });
      setTimeout(() => setToast(null), 3500);
    }
  };

  // Date Range Filter Handlers (من تاريخ - إلى تاريخ)
  const handleApplyDateRange = () => {
    setDateRangeError(null);
    if (dateStart && dateEnd && dateStart > dateEnd) {
      setDateRangeError(
        isRtl
          ? 'تاريخ البداية يجب أن يكون قبل أو مساوياً لتاريخ النهاية.'
          : 'Start date must be before or equal to end date.'
      );
      return;
    }
    setAppliedDateRange({ start: dateStart, end: dateEnd });
  };

  const handleClearDateRange = () => {
    setDateStart('');
    setDateEnd('');
    setAppliedDateRange({ start: '', end: '' });
    setDateRangeError(null);
  };

  const handleResetAllFilters = () => {
    setEvalSearch('');
    setEvalFilterPeriod('all');
    setEvalFilterStatus('all');
    setDateStart('');
    setDateEnd('');
    setAppliedDateRange({ start: '', end: '' });
    setDateRangeError(null);
    setShowDateRangePicker(false);
  };

  const isFilterActive = Boolean(
    evalSearch.trim() !== '' ||
    evalFilterPeriod !== 'all' ||
    evalFilterStatus !== 'all' ||
    appliedDateRange.start !== '' ||
    appliedDateRange.end !== ''
  );

  // Filtered positions for Skills tab
  const filteredPositions = useMemo(() => {
    return Object.entries(positions).filter(([code, pos]) => {
      if (skillsFilterDept !== 'all' && pos.department_id !== skillsFilterDept) {
        return false;
      }
      if (!skillsSearch.trim()) return true;
      const q = skillsSearch.toLowerCase();
      const inTitle = (pos.title_ar && pos.title_ar.toLowerCase().includes(q)) || (pos.title_en && pos.title_en.toLowerCase().includes(q));
      const inCode = code.toLowerCase().includes(q);
      const inSkills = (pos.skills_ar || []).some(s => s.toLowerCase().includes(q)) || (pos.skills_en || []).some(s => s.toLowerCase().includes(q));
      return inTitle || inCode || inSkills;
    });
  }, [positions, skillsFilterDept, skillsSearch]);

  // Available evaluation periods (Standard Quarters + Any distinct recorded periods)
  const availablePeriods = useMemo(() => {
    const standard = ['Q4 2026', 'Q3 2026', 'Q2 2026', 'Q1 2026', 'Annual 2026'];
    const custom = evaluations.map(e => e.evaluation_period).filter(Boolean);
    return Array.from(new Set([...standard, ...custom]));
  }, [evaluations]);

  // Scores completeness & calculated overall score (Fix 02)
  const areScoresComplete = useMemo(() => {
    return (
      evalForm.sla_compliance_score !== '' &&
      evalForm.sla_compliance_score !== null &&
      evalForm.quality_score !== '' &&
      evalForm.quality_score !== null &&
      evalForm.speed_score !== '' &&
      evalForm.speed_score !== null
    );
  }, [evalForm.sla_compliance_score, evalForm.quality_score, evalForm.speed_score]);

  const calculatedOverallScore = useMemo(() => {
    if (!areScoresComplete) return null;
    const sla = Number(evalForm.sla_compliance_score);
    const quality = Number(evalForm.quality_score);
    const speed = Number(evalForm.speed_score);
    return Math.round((sla + quality + speed) / 3);
  }, [areScoresComplete, evalForm.sla_compliance_score, evalForm.quality_score, evalForm.speed_score]);

  // Filtered evaluations for Performance Evaluation tab
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      // 1. Exclude soft-deleted records
      if (ev.is_deleted) return false;

      // 2. Evaluation Period filter
      if (evalFilterPeriod !== 'all' && ev.evaluation_period !== evalFilterPeriod) {
        return false;
      }

      // 3. Status filter
      if (evalFilterStatus !== 'all' && ev.status !== evalFilterStatus) {
        return false;
      }

      // 4. Date Range Filter (created_at: from start date, to end date, or between)
      if (appliedDateRange.start || appliedDateRange.end) {
        const evalDate = (ev.created_at || '').split('T')[0];
        if (appliedDateRange.start && evalDate < appliedDateRange.start) {
          return false;
        }
        if (appliedDateRange.end && evalDate > appliedDateRange.end) {
          return false;
        }
      }

      // 5. Search filter
      if (!evalSearch.trim()) return true;
      const q = evalSearch.toLowerCase();
      const emp = employees.find(e => e.id === ev.employee_id);
      const inName = (ev.employee_name_ar && ev.employee_name_ar.toLowerCase().includes(q)) ||
                     (emp?.full_name_ar && emp.full_name_ar.toLowerCase().includes(q)) ||
                     (emp?.full_name_en && emp.full_name_en.toLowerCase().includes(q)) ||
                     (emp?.employee_code && emp.employee_code.toLowerCase().includes(q));
      const inCode = ev.evaluation_code && ev.evaluation_code.toLowerCase().includes(q);
      return inName || inCode;
    });
  }, [evaluations, evalFilterPeriod, evalFilterStatus, appliedDateRange, evalSearch, employees]);

  // Performance Evaluation summary stats (Active non-deleted only)
  const evalStats = useMemo(() => {
    const activeEvals = evaluations.filter(e => !e.is_deleted);
    const total = activeEvals.length;
    const avgScore = total > 0 ? Math.round(activeEvals.reduce((acc, ev) => acc + (ev.overall_score || 0), 0) / total) : 0;
    const approved = activeEvals.filter(e => e.status === 'approved').length;
    const drafts = activeEvals.filter(e => e.status === 'draft').length;
    return { total, avgScore, approved, drafts };
  }, [evaluations]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold transition-all shadow-md animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'الموارد البشرية، المهارات، ومصفوفة البدلاء' : 'HR, Skills & Backup Readiness Center'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? 'مصفوفة البدلاء المؤهلين، بطاقات المهارات والكفاءات، ومؤشرات تقييم الأداء ربع السنوية'
              : 'Trained backup assignments, Competency skill cards, and Quarterly KPI appraisals'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => handleTabChange('backups')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'backups' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600'}`}
          >
            {isRtl ? `مصفوفة البدلاء (${backupAssignments.length})` : `Backups (${backupAssignments.length})`}
          </button>
          <button
            onClick={() => handleTabChange('skills')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'skills' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600'}`}
          >
            {isRtl ? `بطاقة المهارات والبدائل (${Object.keys(positions).length})` : `Skills & Roles (${Object.keys(positions).length})`}
          </button>
          <button
            onClick={() => handleTabChange('evaluations')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'evaluations' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600'}`}
          >
            {isRtl ? `تقييم الأداء (${evaluations.length})` : `Appraisals (${evaluations.length})`}
          </button>
          <button
            onClick={() => handleTabChange('onboarding')}
            className={`px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'onboarding' ? 'bg-white text-bct-navy shadow font-bold' : 'text-slate-600'}`}
          >
            {isRtl ? 'برنامج التهيئة (14 يوماً)' : '14-Day Induction'}
          </button>
        </div>
      </div>

      {/* Tab 1: Trained Backups (Fix 17) */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-bct-navy flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block text-sm">
                  {isRtl ? 'سياسة استمرارية العمل وعدم تعطيل العمليات' : 'BCT Continuity Policy: Zero Single-Point-of-Failure'}
                </span>
                <p>
                  {isRtl
                    ? 'تلزم لوائح بي سي تي للاستشارات التعليمية والتدريب بتعيين وتدريب موظف بديل لكل وظيفة حساسة، بحيث يمتلك صلاحية تفويضية معتمدة عند غياب الأصيل.'
                    : 'Mandatory trained secondary roles for every operational post at BCT Educational Consulting & Training, ensuring no file stalls due to leave or absence.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddBackup}
              className="px-4 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors self-start md:self-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isRtl ? 'تعيين بديل جديد' : 'Assign Backup'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {backupAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-bct-navy">
                    {isRtl ? assignment.role_title_ar : assignment.role_title_en}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                      {assignment.readiness_percentage}% {isRtl ? 'جاهزية' : 'Readiness'}
                    </span>
                    <button
                      onClick={() => handleOpenEditBackup(assignment)}
                      className="p-1 text-bct-navy hover:bg-slate-100 rounded transition-colors"
                      title={isRtl ? 'تعديل التكليف' : 'Edit Assignment'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(assignment.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title={isRtl ? 'إلغاء تعيين البديل' : 'Remove Assignment'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{isRtl ? 'الموظف الأصيل' : 'Primary Holder'}</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{assignment.primary_employee_name_ar}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{isRtl ? 'البديل المعتمد' : 'Trained Backup'}</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{assignment.backup_employee_name_ar}</span>
                  </div>
                </div>

                {assignment.notes && (
                  <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-bct-navy shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{assignment.notes}</span>
                  </div>
                )}

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                    style={{ width: `${assignment.readiness_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Skills & Competency Cards (بطاقة المهارات والبدائل) */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Header Policy Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-bct-navy flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block text-sm">
                  {isRtl ? 'دليل بطاقات المهارات والكفاءات ومطابقة البدلاء' : 'BCT Job Competencies, Skill Cards & Backup Readiness'}
                </span>
                <p>
                  {isRtl
                    ? 'توثيق المهارات الإلزامية لكل دور وظيفي، وربطها بمؤشرات الأداء الأساسية (KPIs) والموظفين الأصلاء والبدلاء المعتمدين.'
                    : 'Documented core skills for every role, mapped directly to performance KPIs, primary occupants, and certified backups.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleOpenAddBackup}
                className="px-3.5 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isRtl ? 'تعيين تكليف بديل' : 'Assign Backup'}</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <button
                onClick={() => setSkillsFilterDept('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  skillsFilterDept === 'all'
                    ? 'bg-bct-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isRtl ? 'جميع الإدارات' : 'All Departments'}
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSkillsFilterDept(dept.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    skillsFilterDept === dept.id
                      ? 'bg-bct-navy text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isRtl ? dept.name_ar : dept.name_en}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={skillsSearch}
                onChange={(e) => setSkillsSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث بالوظيفة أو المهارة...' : 'Search role or skill...'}
                className="w-full ps-9 pe-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-bct-navy"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPositions.map(([code, pos]) => {
              const dept = departments.find(d => d.id === pos.department_id);
              const primaryEmp = employees.find(e => e.position_id === code || e.job_title_ar === pos.title_ar);
              const backup = backupAssignments.find(b => b.role_id === code || b.role_title_ar === pos.title_ar);
              const reportsToPos = pos.reports_to_position_id ? positions[pos.reports_to_position_id] : null;

              return (
                <div key={code} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                  <div className="space-y-3">
                    {/* Top Row: Department & Code */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {code}
                      </span>
                      {dept && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-bct-navy border border-blue-100">
                          {isRtl ? dept.name_ar : dept.name_en}
                        </span>
                      )}
                    </div>

                    {/* Role Title */}
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {isRtl ? pos.title_ar : pos.title_en}
                      </h4>
                      {reportsToPos && (
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                          {isRtl ? `يتبع إدارياً: ${reportsToPos.title_ar}` : `Reports to: ${reportsToPos.title_en}`}
                        </span>
                      )}
                    </div>

                    {/* Purpose */}
                    {(pos.purpose_ar || pos.purpose_en) && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {isRtl ? pos.purpose_ar : pos.purpose_en}
                      </p>
                    )}

                    {/* Skills Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        {isRtl ? 'بطاقة المهارات المطلوبة:' : 'Competencies & Skills:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {((isRtl ? pos.skills_ar : pos.skills_en) || []).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-blue-50/80 text-bct-navy border border-blue-100 rounded-lg text-[11px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Key KPIs */}
                    {pos.kpis_ar && pos.kpis_ar.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {isRtl ? 'مؤشرات الأداء الرئيسية (KPIs):' : 'Key Performance Indicators:'}
                        </span>
                        <ul className="text-[11px] text-slate-600 space-y-0.5">
                          {(isRtl ? pos.kpis_ar : pos.kpis_en || []).slice(0, 2).map((kpi, kIdx) => (
                            <li key={kIdx} className="flex items-center gap-1.5 truncate">
                              <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                              <span className="truncate">{kpi}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Primary & Backup Mapping Footer */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">{isRtl ? 'الأصيل' : 'Primary'}</span>
                        <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
                          {primaryEmp ? (isRtl ? primaryEmp.full_name_ar : primaryEmp.full_name_en) : (isRtl ? 'غير محدد' : 'Unassigned')}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">{isRtl ? 'البديل المعتمد' : 'Backup'}</span>
                        {backup ? (
                          <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
                            {backup.backup_employee_name_ar}
                          </span>
                        ) : (
                          <span className="text-amber-600 text-xs font-semibold block mt-0.5">
                            {isRtl ? 'غير معين' : 'None'}
                          </span>
                        )}
                      </div>
                    </div>

                    {backup ? (
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          {backup.readiness_percentage}% {isRtl ? 'جاهزية' : 'Readiness'}
                        </span>
                        <button
                          onClick={() => handleOpenEditBackup(backup)}
                          className="text-bct-navy hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{isRtl ? 'تعديل التكليف' : 'Edit Backup'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setBackupForm({
                            primary_employee_id: primaryEmp?.id || employees[0]?.id || '',
                            backup_employee_id: employees[1]?.id || '',
                            role_title: pos.title_ar,
                            readiness_percentage: 80,
                            notes: '',
                          });
                          setIsBackupModalOpen(true);
                        }}
                        className="w-full py-1 text-center text-xs font-bold text-bct-navy bg-blue-50/50 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
                      >
                        + {isRtl ? 'تعيين بديل لهذه الوظيفة' : 'Assign Backup'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Performance Evaluations (تقييم الأداء) */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 block">{isRtl ? 'إجمالي سجلات التقييم' : 'Total Appraisals'}</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{evalStats.total}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 block">{isRtl ? 'متوسط الدرجة العامة' : 'Average Score'}</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{evalStats.avgScore}%</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 block">{isRtl ? 'تقييمات معتمدة رسمياً' : 'Approved Appraisals'}</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{evalStats.approved}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 block">{isRtl ? 'مسودات قيد المراجعة' : 'Pending Drafts'}</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{evalStats.drafts}</span>
            </div>
          </div>

          {/* Action & Filter Bar (التعديل الثاني: شريط الفلاتر وفلتر الفترة الزمنية) */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                  <input
                    type="text"
                    value={evalSearch}
                    onChange={(e) => setEvalSearch(e.target.value)}
                    placeholder={isRtl ? 'ابحث بالموظف أو كود التقييم...' : 'Search employee or code...'}
                    className="w-full ps-9 pe-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-bct-navy"
                  />
                  {evalSearch && (
                    <button
                      type="button"
                      onClick={() => setEvalSearch('')}
                      className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Period Filter (Fix 01) */}
                <select
                  value={evalFilterPeriod}
                  onChange={(e) => setEvalFilterPeriod(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-bct-navy"
                >
                  <option value="all">{isRtl ? 'جميع الفترات' : 'All Periods'}</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>
                      {p === 'Q4 2026' ? (isRtl ? 'الربع الرابع (Q4 2026)' : 'Fourth Quarter (Q4 2026)') :
                       p === 'Q3 2026' ? (isRtl ? 'الربع الثالث (Q3 2026)' : 'Third Quarter (Q3 2026)') :
                       p === 'Q2 2026' ? (isRtl ? 'الربع الثاني (Q2 2026)' : 'Second Quarter (Q2 2026)') :
                       p === 'Q1 2026' ? (isRtl ? 'الربع الأول (Q1 2026)' : 'First Quarter (Q1 2026)') :
                       p === 'Annual 2026' ? (isRtl ? 'السنوي الشامل (Annual 2026)' : 'Annual (Annual 2026)') :
                       p}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={evalFilterStatus}
                  onChange={(e) => setEvalFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-bct-navy"
                >
                  <option value="all">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="approved">{isRtl ? 'معتمد رسمي' : 'Approved'}</option>
                  <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                </select>

                {/* Date Range Filter Button (التعديل الثاني) */}
                <button
                  type="button"
                  onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    appliedDateRange.start || appliedDateRange.end
                      ? 'bg-blue-50 text-bct-navy border-blue-300 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                  title={isRtl ? 'تصفية حسب الفترة الزمنية' : 'Filter by Date Range'}
                >
                  <Calendar className="w-3.5 h-3.5 text-bct-navy" />
                  <span>{isRtl ? 'الفترة الزمنية' : 'Date Range'}</span>
                  {(appliedDateRange.start || appliedDateRange.end) && (
                    <span className="w-2 h-2 rounded-full bg-bct-navy"></span>
                  )}
                </button>

                {/* Reset All Filters Button */}
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title={isRtl ? 'إعادة تعيين جميع الفلاتر' : 'Reset All Filters'}
                  >
                    <X className="w-3 h-3" />
                    <span>{isRtl ? 'إعادة تعيين الكل' : 'Reset All'}</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleOpenCreateEval}
                className="w-full md:w-auto px-4 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'إنشاء تقييم أداء جديد' : 'New Appraisal'}</span>
              </button>
            </div>

            {/* Interactive Date Range Picker Box (من تاريخ - إلى تاريخ) */}
            {showDateRangePicker && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">{isRtl ? 'من تاريخ:' : 'From:'}</span>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => {
                        setDateStart(e.target.value);
                        setDateRangeError(null);
                      }}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-mono outline-none focus:border-bct-navy"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">{isRtl ? 'إلى تاريخ:' : 'To:'}</span>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => {
                        setDateEnd(e.target.value);
                        setDateRangeError(null);
                      }}
                      className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-mono outline-none focus:border-bct-navy"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyDateRange}
                      className="px-3.5 py-1 bg-bct-navy hover:bg-bct-dark text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تطبيق' : 'Apply'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDateRange}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {isRtl ? 'مسح الفترة' : 'Clear Range'}
                    </button>
                  </div>
                </div>

                {dateRangeError && (
                  <div className="text-[11px] font-bold text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{dateRangeError}</span>
                  </div>
                )}

                {/* Active Range Summary Badge */}
                {(appliedDateRange.start || appliedDateRange.end) && !dateRangeError && (
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                    <span>{isRtl ? 'الفترة المطبقة حالياً (تاريخ التقييم):' : 'Applied Range (Appraisal Date):'}</span>
                    <span className="font-mono text-bct-navy font-bold">
                      {appliedDateRange.start ? appliedDateRange.start : (isRtl ? 'البداية' : 'Start')}
                      {' '}{isRtl ? 'إلى' : 'to'}{' '}
                      {appliedDateRange.end ? appliedDateRange.end : (isRtl ? 'الآن' : 'Present')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evaluations Grid */}
          {filteredEvaluations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm">{isRtl ? 'لا توجد سجلات تقييم تطابق خيارات التصفية' : 'No performance appraisals match criteria'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvaluations.map((ev) => {
                const emp = employees.find(e => e.id === ev.employee_id);

                return (
                  <div key={ev.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border">
                            {ev.evaluation_code || ev.id}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {ev.evaluation_period}
                          </span>
                        </div>
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                          ev.overall_score >= 90
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : ev.overall_score >= 75
                            ? 'text-blue-700 bg-blue-50 border-blue-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}>
                          {ev.overall_score}%
                        </span>
                      </div>

                      {/* Employee Info */}
                      <h3 className="font-bold text-slate-900 text-sm">
                        {emp ? (isRtl ? emp.full_name_ar : emp.full_name_en) : ev.employee_name_ar}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-semibold">
                        <span>{emp?.job_title_ar || emp?.job_title_en}</span>
                        {ev.evaluator_name_ar && (
                          <span className="text-[10px] text-slate-500">
                            {isRtl ? `المقيّم: ${ev.evaluator_name_ar}` : `Evaluator: ${ev.evaluator_name_ar}`}
                          </span>
                        )}
                      </div>

                      {/* Criteria Score Box */}
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span>{isRtl ? 'الالتزام باتفاقية SLA:' : 'SLA Compliance:'}</span>
                          <span className="font-bold text-slate-800">{ev.sla_compliance_score || 90}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{isRtl ? 'دقة وجودة العمليات:' : 'Quality & Accuracy:'}</span>
                          <span className="font-bold text-slate-800">{ev.quality_accuracy_score || 95}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{isRtl ? 'سرعة الاستجابة والإنجاز:' : 'Task Completion:'}</span>
                          <span className="font-bold text-slate-800">{ev.task_completion_score || 88}%</span>
                        </div>
                      </div>

                      {/* Notes / Strengths */}
                      {ev.strengths && (
                        <div className="mt-3 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700 block">{isRtl ? 'أبرز نقاط القوة:' : 'Strengths:'}</span>
                          <p className="text-slate-500 mt-0.5 line-clamp-2">{ev.strengths}</p>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {ev.areas_for_improvement && (
                        <div className="mt-2 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700 block">{isRtl ? 'فرص التحسين والتطوير:' : 'Development Areas:'}</span>
                          <p className="text-slate-500 mt-0.5 line-clamp-2">{ev.areas_for_improvement}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          ev.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ev.status === 'approved' ? (isRtl ? 'معتمد رسمي' : 'Approved') : (isRtl ? 'مسودة' : 'Draft')}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{ev.created_at?.split('T')[0]}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {ev.status === 'draft' && (
                          <button
                            onClick={() => handleQuickApproveEval(ev)}
                            className="p-1 px-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-200 transition-colors"
                            title={isRtl ? 'اعتماد فوري' : 'Quick Approve'}
                          >
                            {isRtl ? 'اعتماد' : 'Approve'}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditEval(ev)}
                          className="p-1 text-bct-navy hover:bg-slate-100 rounded transition-colors"
                          title={isRtl ? 'تعديل التقييم' : 'Edit Appraisal'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDeleteEval && (
                          <button
                            onClick={() => handleRequestDeleteEval(ev)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={isRtl ? 'حذف التقييم' : 'Delete Appraisal'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 14-Day Induction Program */}
      {activeTab === 'onboarding' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">
                {isRtl ? 'مسار التهيئة والتأهيل الإلزامي للموظفين الجدد (14 يوماً)' : '14-Day Induction Program'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl ? 'خطوات التحاق الموظف الجديد لضمان استيعاب سياسات بي سي تي للاستشارات التعليمية والتدريب ومعايير الجودة' : 'Standard onboarding stages for BCT Educational Consulting & Training staff'}
              </p>
            </div>
            <span className="px-3 py-1 bg-bct-navy/10 text-bct-navy rounded-lg text-xs font-bold">
              {onboardingTasks.filter(t => t.completed).length} / {onboardingTasks.length} {isRtl ? 'مكتمل' : 'Completed'}
            </span>
          </div>

          <div className="space-y-3">
            {onboardingTasks.map((task, idx) => (
              <div
                key={idx}
                onClick={() => handleToggleOnboarding(idx)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${task.completed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${task.completed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {task.day}د
                  </span>
                  <div>
                    <span className="font-bold text-xs block">
                      {isRtl ? task.taskAr : task.taskEn}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isRtl ? `مقرر اليوم رقم ${task.day}` : `Scheduled for Day ${task.day}`}
                    </span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${task.completed ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                  {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Backup Assignment (Fix 17) */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'ar' ? 'تعيين موظف بديل معتمد' : 'Assign Backup Role'}
              </h3>
              <button onClick={() => setIsBackupModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBackup} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف الأصيل (Primary Employee) *</label>
                <select
                  required
                  value={backupForm.primary_employee_id}
                  onChange={(e) => {
                    const emp = employees.find(em => em.id === e.target.value);
                    setBackupForm({
                      ...backupForm,
                      primary_employee_id: e.target.value,
                      role_title: emp?.job_title_ar || '',
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar} - {emp.job_title_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الموظف البديل المعتمد (Backup Employee) *</label>
                <select
                  required
                  value={backupForm.backup_employee_id}
                  onChange={(e) => setBackupForm({ ...backupForm, backup_employee_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar} - {emp.job_title_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المسمى الوظيفي للدور *</label>
                <input
                  type="text"
                  required
                  value={backupForm.role_title}
                  onChange={(e) => setBackupForm({ ...backupForm, role_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نسبة الجاهزية التشغيلية (%): {backupForm.readiness_percentage}%</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={backupForm.readiness_percentage}
                  onChange={(e) => setBackupForm({ ...backupForm, readiness_percentage: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              {backupError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark shadow"
                >
                  {language === 'ar' ? 'اعتماد التعيين' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Backup Assignment (تعديل تكليف البديل) */}
      {isEditBackupModalOpen && editingBackup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {language === 'ar' ? 'تعديل تكليف البديل' : 'Edit Backup Assignment'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {editingBackup.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditBackupModalOpen(false);
                  setEditingBackup(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBackup} className="space-y-4">
              {/* Job Position / Critical Role */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'المسمى الوظيفي / الوظيفة الحساسة *' : 'Job Position / Critical Role *'}
                </label>
                <input
                  type="text"
                  required
                  value={editBackupForm.role_title}
                  onChange={(e) => setEditBackupForm({ ...editBackupForm, role_title: e.target.value })}
                  placeholder={isRtl ? 'مثال: مدير العمليات والخدمات' : 'e.g. Operations Manager'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:border-bct-navy outline-none"
                />
              </div>

              {/* Primary Employee (Searchable Dropdown) */}
              <SearchableEmployeeSelect
                label={isRtl ? 'الموظف الأصيل (Primary Employee)' : 'Primary Employee'}
                selectedId={editBackupForm.primary_employee_id}
                onChange={(id) => {
                  const emp = employees.find(e => e.id === id);
                  setEditBackupForm({
                    ...editBackupForm,
                    primary_employee_id: id,
                    role_title: editBackupForm.role_title || emp?.job_title_ar || ''
                  });
                }}
                employees={employees}
                isRtl={isRtl}
                required
              />

              {/* Backup Employee (Searchable Dropdown, excludes Primary) */}
              <SearchableEmployeeSelect
                label={isRtl ? 'الموظف البديل المعتمد (Backup Employee)' : 'Assigned Backup Employee'}
                selectedId={editBackupForm.backup_employee_id}
                onChange={(id) => setEditBackupForm({ ...editBackupForm, backup_employee_id: id })}
                employees={employees}
                excludeId={editBackupForm.primary_employee_id}
                isRtl={isRtl}
                required
              />

              {/* Readiness Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    {isRtl ? 'نسبة الجاهزية التشغيلية (%)' : 'Readiness Percentage (%)'}
                  </label>
                  <span className="font-mono font-black text-xs text-bct-navy px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                    {editBackupForm.readiness_percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editBackupForm.readiness_percentage}
                    onChange={(e) => setEditBackupForm({ ...editBackupForm, readiness_percentage: Number(e.target.value) })}
                    className="flex-1 accent-bct-navy cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editBackupForm.readiness_percentage}
                    onChange={(e) => setEditBackupForm({ ...editBackupForm, readiness_percentage: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات التكليف وخطة التفويض' : 'Assignment Notes & Handover Scope'}
                </label>
                <textarea
                  rows={2}
                  value={editBackupForm.notes}
                  onChange={(e) => setEditBackupForm({ ...editBackupForm, notes: e.target.value })}
                  placeholder={isRtl ? 'سجل أي تفويضات خاصة أو شروط تشغيلية للتكليف...' : 'Special authorizations or handover details...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-bct-navy outline-none"
                />
              </div>

              {/* Error Alert */}
              {editBackupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editBackupError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditBackupModalOpen(false);
                    setEditingBackup(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy hover:bg-bct-navy/90 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Appraisal */}
      {isEvalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold">
                  {editingEval ? <Edit2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingEval
                      ? (isRtl ? `تعديل تقييم الأداء (${editingEval.evaluation_code || editingEval.id})` : `Edit Performance Appraisal (${editingEval.evaluation_code || editingEval.id})`)
                      : (isRtl ? 'إنشاء تقييم أداء ربع سنوي جديد' : 'New Performance Appraisal')}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isRtl ? 'قياس الالتزام باتفاقيات SLA، الجودة، وسرعة الإنجاز' : 'Evaluation of SLA compliance, quality & task completion'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEvalModalOpen(false);
                  setEditingEval(null);
                  setEvalError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'الموظف المعني بالتقييم *' : 'Target Employee *'}
                </label>
                <select
                  required
                  value={evalForm.employee_id}
                  onChange={(e) => setEvalForm({ ...evalForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-bold outline-none focus:border-bct-navy"
                >
                  <option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
                  {employees.filter(e => e.employment_status === 'active').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {isRtl ? emp.full_name_ar : emp.full_name_en} ({isRtl ? emp.job_title_ar : emp.job_title_en} - {emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Evaluation Period & Status (Fix 01) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'الفترة التقييمية *' : 'Evaluation Period *'}
                  </label>
                  <select
                    value={evalForm.period}
                    onChange={(e) => setEvalForm({ ...evalForm, period: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold outline-none focus:border-bct-navy"
                  >
                    {availablePeriods.map(p => (
                      <option key={p} value={p}>
                        {p === 'Q4 2026' ? (isRtl ? 'الربع الرابع (Q4 2026)' : 'Fourth Quarter (Q4 2026)') :
                         p === 'Q3 2026' ? (isRtl ? 'الربع الثالث (Q3 2026)' : 'Third Quarter (Q3 2026)') :
                         p === 'Q2 2026' ? (isRtl ? 'الربع الثاني (Q2 2026)' : 'Second Quarter (Q2 2026)') :
                         p === 'Q1 2026' ? (isRtl ? 'الربع الأول (Q1 2026)' : 'First Quarter (Q1 2026)') :
                         p === 'Annual 2026' ? (isRtl ? 'السنوي الشامل (Annual 2026)' : 'Annual (Annual 2026)') :
                         p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'حالة الاعتماد' : 'Appraisal Status'}
                  </label>
                  <select
                    value={evalForm.status}
                    onChange={(e) => setEvalForm({ ...evalForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold outline-none focus:border-bct-navy"
                  >
                    <option value="approved">{isRtl ? 'معتمد رسمي' : 'Approved'}</option>
                    <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                  </select>
                </div>
              </div>

              {/* Calculated Overall Score Preview Banner (Fix 02: Incomplete criteria handling) */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-bct-navy block">
                    {isRtl ? 'الدرجة الإجمالية المحتسبة:' : 'Calculated Overall Score:'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {calculatedOverallScore !== null
                      ? (isRtl ? 'متوسط معايير الالتزام والجودة والسرعة' : 'Average of SLA, Quality & Speed criteria')
                      : (isRtl ? 'يرجى إدخال جميع درجات المعايير لاحتساب الدرجة الإجمالية' : 'Please complete all criteria to calculate overall score')}
                  </span>
                </div>
                <span className={`text-base font-black px-3 py-1 rounded-lg border shadow-2xs tabular-nums ${
                  calculatedOverallScore !== null
                    ? 'bg-white text-bct-navy border-blue-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  {calculatedOverallScore !== null ? `${calculatedOverallScore}%` : '—'}
                </span>
              </div>

              {/* Criteria Score Sliders + Inputs (Fix 02: Support empty/cleared states) */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-extrabold text-slate-800 block text-xs">
                  {isRtl ? 'درجات المعايير التقييمية (0 - 100):' : 'Evaluation Criteria Scores (0 - 100):'}
                </span>

                {/* Criterion 1: SLA Compliance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{isRtl ? '1. الالتزام باتفاقيات SLA والمهل الزمنية' : '1. SLA Compliance & Deadlines'}</span>
                    <span className={`tabular-nums font-bold ${evalForm.sla_compliance_score !== '' ? 'text-bct-navy' : 'text-slate-400'}`}>
                      {evalForm.sla_compliance_score !== '' ? `${evalForm.sla_compliance_score}%` : (isRtl ? 'غير محدد' : 'Not set')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={evalForm.sla_compliance_score === '' ? 0 : evalForm.sla_compliance_score}
                      onChange={(e) => setEvalForm({ ...evalForm, sla_compliance_score: Number(e.target.value) })}
                      className="flex-1 accent-bct-navy cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={evalForm.sla_compliance_score}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEvalForm({ ...evalForm, sla_compliance_score: '' });
                        } else {
                          const n = Number(val);
                          setEvalForm({ ...evalForm, sla_compliance_score: isNaN(n) ? '' : Math.min(100, Math.max(0, n)) });
                        }
                      }}
                      placeholder="—"
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Criterion 2: Quality & Accuracy */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{isRtl ? '2. دقة وجودة العمليات والتوثيق' : '2. Quality & Accuracy of Processing'}</span>
                    <span className={`tabular-nums font-bold ${evalForm.quality_score !== '' ? 'text-bct-navy' : 'text-slate-400'}`}>
                      {evalForm.quality_score !== '' ? `${evalForm.quality_score}%` : (isRtl ? 'غير محدد' : 'Not set')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={evalForm.quality_score === '' ? 0 : evalForm.quality_score}
                      onChange={(e) => setEvalForm({ ...evalForm, quality_score: Number(e.target.value) })}
                      className="flex-1 accent-bct-navy cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={evalForm.quality_score}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEvalForm({ ...evalForm, quality_score: '' });
                        } else {
                          const n = Number(val);
                          setEvalForm({ ...evalForm, quality_score: isNaN(n) ? '' : Math.min(100, Math.max(0, n)) });
                        }
                      }}
                      placeholder="—"
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Criterion 3: Task Speed & Agility */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{isRtl ? '3. سرعة الإنجاز والاستجابة التشغيلية' : '3. Task Completion Speed & Agility'}</span>
                    <span className={`tabular-nums font-bold ${evalForm.speed_score !== '' ? 'text-bct-navy' : 'text-slate-400'}`}>
                      {evalForm.speed_score !== '' ? `${evalForm.speed_score}%` : (isRtl ? 'غير محدد' : 'Not set')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={evalForm.speed_score === '' ? 0 : evalForm.speed_score}
                      onChange={(e) => setEvalForm({ ...evalForm, speed_score: Number(e.target.value) })}
                      className="flex-1 accent-bct-navy cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={evalForm.speed_score}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEvalForm({ ...evalForm, speed_score: '' });
                        } else {
                          const n = Number(val);
                          setEvalForm({ ...evalForm, speed_score: isNaN(n) ? '' : Math.min(100, Math.max(0, n)) });
                        }
                      }}
                      placeholder="—"
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Strengths */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'أبرز نقاط القوة والتميز' : 'Key Strengths'}
                </label>
                <textarea
                  rows={2}
                  value={evalForm.strengths}
                  onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-bct-navy"
                  placeholder={isRtl ? 'مثال: التزام تام بمواعيد المراجعة، دقة عالية في فحص المستندات...' : 'e.g. Consistent punctuality, high attention to detail...'}
                />
              </div>

              {/* Areas for Improvement */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'مجالات وفرص التطوير والتحسين' : 'Areas for Improvement & Development'}
                </label>
                <textarea
                  rows={2}
                  value={evalForm.development_areas}
                  onChange={(e) => setEvalForm({ ...evalForm, development_areas: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-bct-navy"
                  placeholder={isRtl ? 'مثال: تعزيز التنسيق مع الموظف البديل وتوثيق خطوات العمل بانتظام...' : 'e.g. Improve coordination with backup role...'}
                />
              </div>

              {/* Error Alert */}
              {evalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{evalError}</span>
                </div>
              )}

              {/* Actions Footer (Fix 02: Clear Values Button added) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Fix 02: Clear Values Button */}
                <button
                  type="button"
                  onClick={handleRequestClearValues}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={isRtl ? 'مسح القيم المدخلة في النموذج' : 'Clear entered form values'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isRtl ? 'مسح القيم' : 'Clear Values'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEvalModalOpen(false);
                      setEditingEval(null);
                      setEvalError(null);
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-bct-navy hover:bg-bct-navy/90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingEval ? (isRtl ? 'تحديث التقييم' : 'Update Appraisal') : (isRtl ? 'حفظ واعتماد التقييم' : 'Save Appraisal')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Values (Fix 02) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isRtl ? 'تأكيد مسح القيم' : 'Confirm Clear Values'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {isRtl
                    ? 'هل تريد مسح القيم المدخلة في نموذج التقييم؟ لن تتغير البيانات المحفوظة إلا بعد الضغط على حفظ.'
                    : 'Clear the entered evaluation values? Saved data will remain unchanged until you save.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmClearValues}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'مسح القيم' : 'Clear Values'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Soft Delete Appraisal (التعديل الأول) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900">
                  {isRtl ? 'تأكيد حذف تقييم الأداء' : 'Confirm Delete Performance Appraisal'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isRtl
                    ? 'هل أنت متأكد من حذف تقييم الأداء الخاص بهذا الموظف؟ سيتم استبعاد التقييم من السجلات النشطة والتقارير، مع الاحتفاظ بسجل العملية لأغراض المراجعة والتدقيق.'
                    : "Are you sure you want to delete this employee's performance appraisal? The appraisal will be excluded from active records and reports, while retaining the operation log for auditing purposes."}
                </p>
              </div>
            </div>

            {/* Appraisal Summary Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">{isRtl ? 'الموظف المعني:' : 'Target Employee:'}</span>
                <span className="font-extrabold text-slate-900">
                  {employees.find(e => e.id === deleteCandidate.employee_id)?.full_name_ar || deleteCandidate.employee_name_ar}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">{isRtl ? 'كود التقييم:' : 'Appraisal Code:'}</span>
                <span className="font-mono font-bold text-slate-700">{deleteCandidate.evaluation_code || deleteCandidate.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">{isRtl ? 'الفترة والدرجة:' : 'Period & Score:'}</span>
                <span className="font-semibold text-bct-navy">
                  {deleteCandidate.evaluation_period} ({deleteCandidate.overall_score}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">{isRtl ? 'حالة التقييم:' : 'Status:'}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  deleteCandidate.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {deleteCandidate.status === 'approved' ? (isRtl ? 'معتمد رسمي' : 'Approved') : (isRtl ? 'مسودة' : 'Draft')}
                </span>
              </div>
            </div>

            {/* Approved Appraisal Special Audit Notice */}
            {deleteCandidate.status === 'approved' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {isRtl
                    ? 'تنبيه تدقيقي: هذا التقييم معتمد رسمياً. سيتم أرشفة السجل بصيغة Soft Delete مع الاحتفاظ ببيانات المراجعة والتدقيق الإداري دون حذف نهائي.'
                    : 'Audit Notice: This appraisal is officially approved. It will be soft-deleted and archived for administrative audit purposes.'}
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEval}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
