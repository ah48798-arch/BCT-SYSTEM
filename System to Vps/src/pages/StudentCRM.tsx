import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Student, StudentFile, LIFECYCLE_STAGE_DEFINITIONS } from '../types/database.types';
import { 
  filterStudentFiles, 
  StudentFilterOptions, 
  CRMTimeRange, 
  StudentDateField,
  CRMStageFilter
} from '../services/studentSearchService';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  UserPlus, 
  Phone, 
  Mail, 
  FileText, 
  ChevronRight, 
  X, 
  Filter, 
  CheckCircle2, 
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  Save,
  Archive,
  Users,
  RotateCcw,
  Clock,
  Hash,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatFileCreationDate, getStudentDateValue, getStudentLastUpdateTimestamp } from '../utils/dateUtils';

export const StudentCRM: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();

  const [students, setStudents] = useState(() => bctStore.getStudents());
  const [studentFiles, setStudentFiles] = useState(() => bctStore.getStudentFiles());
  const [payments, setPayments] = useState(() => bctStore.getPayments());
  const [fileActivities, setFileActivities] = useState(() => bctStore.getAllFileActivities());
  const [auditLogs, setAuditLogs] = useState(() => bctStore.getAuditLogs());
  const [employees, setEmployees] = useState(() => bctStore.getEmployees());

  // Unified Search State (Fix 01)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNationality, setSelectedNationality] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<CRMStageFilter>('all');
  
  // Date Range Filter States (Fix 02)
  const [timeRange, setTimeRange] = useState<CRMTimeRange>('all');
  const [dateField, setDateField] = useState<StudentDateField>('student_reg');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Dynamic Date Sort State (supports registration and last-update date)
  const [sortField, setSortField] = useState<'default' | 'file_created_at' | 'date'>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleToggleCreationDateSort = () => {
    if (sortField !== 'date' && sortField !== 'file_created_at') {
      setSortField('date');
      setSortDirection('desc'); // Newest first
    } else if (sortDirection === 'desc') {
      setSortDirection('asc'); // Oldest first
    } else {
      setSortDirection('desc');
    }
  };

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingFile, setEditingFile] = useState<StudentFile | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Student | null>(null);

  // Duplicate Student Warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    fileCode: string;
    studentName: string;
  } | null>(null);

  // New Student Form
  const [formData, setFormData] = useState({
    full_name_ar: '',
    full_name_en: '',
    nationality: 'سوداني (Sudanese)',
    passport_number: '',
    passport_expiry_date: '',
    phone: '',
    whatsapp: '',
    email: '',
    residence_country: 'السودان',
    service_type: 'university_admission' as const,
    certificate_type: 'الثانوية السودانية',
    graduation_year: 2024,
    academic_percentage: 85.0,
  });

  // Edit Student Form
  const [editFormData, setEditFormData] = useState({
    full_name_ar: '',
    full_name_en: '',
    nationality: '',
    passport_number: '',
    passport_expiry_date: '',
    phone: '',
    whatsapp: '',
    email: '',
    residence_country: '',
    certificate_type: '',
    academic_percentage: 80,
    current_owner_id: '',
  });

  useEffect(() => {
    return bctStore.subscribe(() => {
      setStudents(bctStore.getStudents());
      setStudentFiles(bctStore.getStudentFiles());
      setPayments(bctStore.getPayments());
      setFileActivities(bctStore.getAllFileActivities());
      setAuditLogs(bctStore.getAuditLogs());
      setEmployees(bctStore.getEmployees());
    });
  }, []);

  // Pre-compute per-student file counts in O(N) for fast table rendering
  const fileCountByStudentId = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < studentFiles.length; i++) {
      const sid = studentFiles[i].student_id;
      map.set(sid, (map.get(sid) || 0) + 1);
    }
    return map;
  }, [studentFiles]);

  // Multi-Factor Filter Options (Current Stage + Search + Nationality + Date Range + Sorting)
  const filterOptions: StudentFilterOptions = useMemo(() => ({
    searchQuery,
    nationality: selectedNationality,
    stageFilter: selectedStage,
    timeRange,
    customRange: appliedCustomRange,
    dateField,
    sortBy: sortField,
    sortDirection,
    activities: fileActivities,
    auditLogs
  }), [searchQuery, selectedNationality, selectedStage, timeRange, appliedCustomRange, dateField, sortField, sortDirection, fileActivities, auditLogs]);

  const {
    filteredRows,
    totalFiles,
    activeFilesCount,
    archivedFilesCount,
    totalFiltered,
    isFiltered
  } = useMemo(() => {
    return filterStudentFiles(students, studentFiles, payments, filterOptions);
  }, [students, studentFiles, payments, filterOptions]);

  // Date Filter Actions (Fix 02)
  const handleApplyCustomDate = () => {
    if (!customStart || !customEnd) {
      setDateError(isRtl ? 'يرجى تحديد تاريخ البداية والنهاية' : 'Please select both start and end dates');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setDateError(isRtl ? 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية' : 'Start date must be before or equal to end date');
      return;
    }
    setDateError(null);
    setAppliedCustomRange({ start: customStart, end: customEnd });
    setTimeRange('custom');
    setShowCustomPicker(false);
  };

  const handleResetDateFilter = () => {
    setTimeRange('all');
    setAppliedCustomRange(null);
    setShowCustomPicker(false);
    setDateError(null);
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setCustomStart(d.toISOString().split('T')[0]);
    setCustomEnd(new Date().toISOString().split('T')[0]);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedNationality('all');
    setSelectedStage('all');
    setTimeRange('all');
    setAppliedCustomRange(null);
    setDateField('student_reg');
    setSortField('default');
    setSortDirection('desc');
    setShowCustomPicker(false);
    setDateError(null);
  };

  // Real-time duplicate check when passport number changes
  const handlePassportChange = (val: string) => {
    setFormData(prev => ({ ...prev, passport_number: val }));
    const clean = val.trim();
    if (!clean || clean.length < 3) {
      setDuplicateWarning(null);
      return;
    }
    const match = bctStore.findExistingStudent({ passport_number: clean });
    if (match) {
      const fileCode = match.file?.file_code || 'BCT-FILE-UNKNOWN';
      setDuplicateWarning({
        message: `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${fileCode}`,
        fileCode,
        studentName: match.student.full_name_ar
      });
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name_ar || !formData.passport_number) return;

    // Check duplicate prior to submission
    const existing = bctStore.findExistingStudent({
      passport_number: formData.passport_number
    });

    if (existing) {
      const fileCode = existing.file?.file_code || '';
      setDuplicateWarning({
        message: `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${fileCode}`,
        fileCode,
        studentName: existing.student.full_name_ar
      });
      return;
    }

    const regResult = await bctStore.registerStudentWithFileAsync({
      full_name_ar: formData.full_name_ar,
      full_name_en: formData.full_name_en || formData.full_name_ar,
      nationality: formData.nationality,
      passport_number: formData.passport_number,
      passport_expiry_date: formData.passport_expiry_date || '2028-01-01',
      phone: formData.phone,
      whatsapp: formData.whatsapp || formData.phone,
      email: formData.email,
      residence_country: formData.residence_country,
    }, {
      service_type: formData.service_type,
      academic_year: '2026/2027',
      certificate_type: formData.certificate_type,
      graduation_year: Number(formData.graduation_year),
      academic_percentage: Number(formData.academic_percentage),
      current_status: 'new',
      current_owner_id: currentUser?.id || 'emp-007',
      assigned_consultant_id: currentUser?.id || 'emp-007',
      university_choices: [],
      is_registered_fee_paid: false,
      is_stage2_paid: false,
    }, currentUser?.username || 'admin');

    if (!regResult.success) {
      if (regResult.code === 'DUPLICATE_STUDENT') {
        setDuplicateWarning({
          message: regResult.message || `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${regResult.existingFileCode}`,
          fileCode: regResult.existingFileCode || '',
          studentName: regResult.existingStudent?.full_name_ar || ''
        });
        return;
      }
      alert(regResult.message || (language === 'ar' ? 'فشلت عملية التسجيل' : 'Registration failed'));
      return;
    }

    setIsRegisterModalOpen(false);
    setDuplicateWarning(null);
    setFormData({
      full_name_ar: '',
      full_name_en: '',
      nationality: 'سوداني (Sudanese)',
      passport_number: '',
      passport_expiry_date: '',
      phone: '',
      whatsapp: '',
      email: '',
      residence_country: 'السودان',
      service_type: 'university_admission',
      certificate_type: 'الثانوية السودانية',
      graduation_year: 2024,
      academic_percentage: 85.0,
    });
  };

  const handleOpenEdit = (stu: Student, targetFile?: StudentFile) => {
    const primaryFile = targetFile || studentFiles.find(f => f.student_id === stu.id && !f.is_archived) || studentFiles.find(f => f.student_id === stu.id);
    if (primaryFile?.is_archived) return;
    setEditingStudent(stu);
    setEditingFile(primaryFile || null);
    setEditFormData({
      full_name_ar: stu.full_name_ar,
      full_name_en: stu.full_name_en,
      nationality: stu.nationality,
      passport_number: stu.passport_number,
      passport_expiry_date: stu.passport_expiry_date,
      phone: stu.phone,
      whatsapp: stu.whatsapp,
      email: stu.email || '',
      residence_country: stu.residence_country || 'السودان',
      certificate_type: primaryFile?.certificate_type || 'الثانوية العامة',
      academic_percentage: primaryFile?.academic_percentage || 80,
      current_owner_id: primaryFile?.current_owner_id || '',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Update student details
    bctStore.updateStudent(
      editingStudent.id,
      {
        full_name_ar: editFormData.full_name_ar,
        full_name_en: editFormData.full_name_en,
        nationality: editFormData.nationality,
        passport_number: editFormData.passport_number,
        passport_expiry_date: editFormData.passport_expiry_date,
        phone: editFormData.phone,
        whatsapp: editFormData.whatsapp,
        email: editFormData.email,
        residence_country: editFormData.residence_country,
      },
      currentUser?.username || 'admin'
    );

    // Update academic file details if exists
    if (editingFile) {
      bctStore.updateStudentFile(
        editingFile.id,
        {
          certificate_type: editFormData.certificate_type,
          academic_percentage: Number(editFormData.academic_percentage),
          current_owner_id: editFormData.current_owner_id || editingFile.current_owner_id,
        },
        currentUser?.username || 'admin'
      );
    }

    setEditingStudent(null);
    setEditingFile(null);
  };

  const handleDeleteStudent = () => {
    if (!deleteCandidate) return;
    bctStore.deleteStudent(deleteCandidate.id, currentUser?.username || 'admin');
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-bct-navy">
              {t('nav.studentCrm')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-bct-navy border border-blue-200">
              {language === 'ar'
                ? `إجمالي ملفات الطلاب: ${totalFiles}`
                : `Total Student Files: ${totalFiles}`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {language === 'ar'
                ? `الملفات النشطة: ${activeFilesCount}`
                : `Active Files: ${activeFilesCount}`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedStage(prev => prev === 'archived' ? 'all' : 'archived')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border transition inline-flex items-center gap-1 cursor-pointer ${
                selectedStage === 'archived'
                  ? 'bg-stone-700 text-white border-stone-800 shadow-xs'
                  : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
              }`}
              title={language === 'ar' ? 'انقر لعرض الملفات المؤرشفة فقط' : 'Click to filter Archived Files Only'}
            >
              <Archive className="w-3 h-3" />
              <span>
                {language === 'ar'
                  ? `الملفات المؤرشفة: ${archivedFilesCount}`
                  : `Archived: ${archivedFilesCount}`}
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'إدارة سجلات الطلاب، الملفات الأكاديمية، الرغبات الجامعية، والمتابعة اليومية.'
              : 'Student Relationship Management: Records, Academic Dossiers, Faculty Choices & Follow-ups.'}
          </p>
        </div>

        {hasPermission('students:create') && (
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل طالب جديد' : 'Register Student'}</span>
          </button>
        )}
      </div>

      {/* Search and Filters Toolbar (Fix 01 & Fix 02) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Input (Fix 01: Unified Search across Student Name, Student ID, File ID, Transaction ID, Passport, Phone) */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar'
                ? 'ابحث باسم الطالب، رقم الطالب، رقم الملف، رقم المعاملة أو رقم الجواز...'
                : 'Search by student name, student ID, file ID, transaction number, or passport...'}
              className="w-full ps-9 pe-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-bct-navy focus:ring-1 focus:ring-bct-navy text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 end-2.5 my-auto h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition cursor-pointer"
                title={language === 'ar' ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Nationality Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-bct-navy" />
                <span>{language === 'ar' ? 'الجنسية:' : 'Nationality:'}</span>
              </span>
              {[
                { id: 'all', label_ar: 'الكل', label_en: 'All' },
                { id: 'سوداني', label_ar: 'طلاب السودان', label_en: 'Sudan' },
                { id: 'سعودي', label_ar: 'طلاب السعودية والخليج', label_en: 'Gulf & KSA' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedNationality(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedNationality === f.id
                      ? 'bg-bct-navy text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {language === 'ar' ? f.label_ar : f.label_en}
                </button>
              ))}
            </div>

            {/* Date Range Filter (Fix 02: الفترة الزمنية) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === 'ar' ? 'الفترة الزمنية:' : 'Date Range:'}</span>
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                {[
                  { id: 'all', label_ar: 'جميع الفترات', label_en: 'All Time' },
                  { id: '30d', label_ar: 'آخر 30 يوماً', label_en: 'Last 30 Days' },
                  { id: 'quarter', label_ar: 'الربع الحالي', label_en: 'Current Quarter' },
                  { id: 'custom', label_ar: 'فترة مخصصة', label_en: 'Custom Date Range' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id === 'custom') {
                        setShowCustomPicker(prev => !prev);
                      } else {
                        setTimeRange(p.id as any);
                        setAppliedCustomRange(null);
                        setShowCustomPicker(false);
                        setDateError(null);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      (p.id === 'custom' && (timeRange === 'custom' || showCustomPicker)) || timeRange === p.id
                        ? 'bg-white text-bct-navy font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ar' ? p.label_ar : p.label_en}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Sub-bar: Current Stage Filter, Date Field Selector & Filter Status */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Current Stage Filter + Date Field Selector & Sort Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Current Stage Filter Dropdown (12 Official Options) */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="crm-current-stage-filter" className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3 h-3 text-bct-navy" />
                <span>{language === 'ar' ? 'المرحلة الحالية:' : 'Current Stage:'}</span>
              </label>
              <select
                id="crm-current-stage-filter"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as CRMStageFilter)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-bct-navy cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع المراحل والحالات' : 'All Stages & Statuses'}</option>
                <option value="new">{language === 'ar' ? 'جديد' : 'New'}</option>
                <option value="qualified">{language === 'ar' ? 'مؤهل' : 'Qualified'}</option>
                <option value="registered">{language === 'ar' ? 'مسجل ومسدد' : 'Registered & Paid'}</option>
                <option value="review">{language === 'ar' ? 'مراجعة الأوراق' : 'Document Review'}</option>
                <option value="submitted">{language === 'ar' ? 'على المنصة' : 'Submitted on Platform'}</option>
                <option value="preliminary">{language === 'ar' ? 'قبول مبدئي' : 'Preliminary Admission'}</option>
                <option value="stage2">{language === 'ar' ? 'سداد المرحلة الثانية' : 'Second-Stage Payment'}</option>
                <option value="docs">{language === 'ar' ? 'التوثيق وتسليم الأصول' : 'Documentation & Originals'}</option>
                <option value="final">{language === 'ar' ? 'قبول نهائي' : 'Final Admission'}</option>
                <option value="closed">{language === 'ar' ? 'مغلق وتقييم' : 'Closed & Evaluated'}</option>
                <option value="archived">{language === 'ar' ? 'الملفات المؤرشفة فقط' : 'Archived Files Only'}</option>
              </select>
            </div>

            <span className="hidden sm:inline-block h-4 w-px bg-slate-200" />

            <span className="text-[11px] font-bold text-slate-500">
              {language === 'ar' ? 'تصنيف التاريخ حسب:' : 'Filter date by:'}
            </span>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as any)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-bct-navy cursor-pointer"
            >
              <option value="student_reg">{language === 'ar' ? 'تاريخ تسجيل الطالب (افتراضي)' : 'Student Registration Date (Default)'}</option>
              <option value="last_update">{language === 'ar' ? 'تاريخ آخر تحديث' : 'Last Update Date'}</option>
            </select>
            <span className="text-[11px] text-slate-400 font-medium">
              {dateField === 'student_reg' && (language === 'ar' ? '(تاريخ التسجيل بالنظام)' : '(Registration date)')}
              {dateField === 'last_update' && (language === 'ar' ? '(تاريخ آخر إجراء على الملف)' : '(Last action timestamp)')}
            </span>

            {/* Quick Sort Toggle by Dynamic Date */}
            <button
              type="button"
              onClick={handleToggleCreationDateSort}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                sortField === 'file_created_at' || sortField === 'date'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={
                language === 'ar'
                  ? (dateField === 'last_update'
                      ? 'ترتيب الملفات حسب تاريخ آخر تحديث (تصاعدياً / تنازلياً)'
                      : 'ترتيب الملفات حسب تاريخ تسجيل الطالب (تصاعدياً / تنازلياً)')
                  : (dateField === 'last_update'
                      ? 'Sort files by last update date (Ascending / Descending)'
                      : 'Sort files by student registration date (Ascending / Descending)')
              }
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {language === 'ar' 
                  ? (dateField === 'last_update' ? 'ترتيب بآخر تحديث' : 'ترتيب بتاريخ التسجيل')
                  : (dateField === 'last_update' ? 'Sort by Last Update' : 'Sort by Reg Date')}
              </span>
              {(sortField === 'file_created_at' || sortField === 'date') && (
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-200 text-indigo-900 rounded font-black flex items-center gap-0.5">
                  {sortDirection === 'desc' ? (
                    <>
                      <span>{language === 'ar' ? 'الأحدث' : 'Newest'}</span>
                      <ArrowDown className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>{language === 'ar' ? 'الأقدم' : 'Oldest'}</span>
                      <ArrowUp className="w-3 h-3" />
                    </>
                  )}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters Summary & Clear All */}
          {isFiltered && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-[11px] font-bold text-bct-navy bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {language === 'ar'
                  ? `النتائج: ${totalFiltered} من ${totalFiles}`
                  : `Results: ${totalFiltered} of ${totalFiles}`}
              </span>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                title={language === 'ar' ? 'إعادة ضبط جميع الفلاتر' : 'Reset all filters'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ar' ? 'مسح الفلاتر' : 'Clear All'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Custom Date Range Picker Dropdown / Box */}
        {showCustomPicker && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'من تاريخ:' : 'From Date:'}</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'إلى تاريخ:' : 'To Date:'}</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-3 py-1 bg-bct-navy hover:bg-bct-dark text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {language === 'ar' ? 'تطبيق' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                </button>
              </div>
            </div>

            {dateError && (
              <div className="text-[11px] font-bold text-rose-600 bg-rose-50 p-1.5 rounded border border-rose-200">
                {dateError}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Students Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* A. RESPONSIVE CARDS VIEW FOR SMALL SCREENS (< md) - ZERO HORIZONTAL SCROLLING */}
        <div className="md:hidden space-y-3 p-3">
          {filteredRows.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <div className="font-extrabold text-sm text-slate-700">
                {language === 'ar'
                  ? 'لم يتم العثور على أي ملف طالب يطابق معايير البحث'
                  : 'No student files match your search criteria'}
              </div>
            </div>
          ) : (
            filteredRows.map(({ file, student: stu, isArchived }) => {
              const stageDef = LIFECYCLE_STAGE_DEFINITIONS.find(s => s.key === file.current_status);
              const stageLabel = stageDef
                ? (language === 'ar' ? stageDef.name_ar : stageDef.name_en)
                : t(`statuses.${file.current_status}`);
              const dateInfo = getStudentDateValue(stu, [file], dateField, fileActivities, auditLogs);
              const formattedDate = formatFileCreationDate(dateInfo.isoString || '', language === 'ar');

              return (
                <div key={file.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                  {/* Card Header: Student Name + File Code + Stage Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <Link
                        to={`/students/${file.file_code}`}
                        className="font-extrabold text-slate-900 hover:text-bct-navy text-xs block"
                      >
                        {language === 'ar' ? stu.full_name_ar : stu.full_name_en}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">{file.file_code}</span>
                    </div>
                    {isArchived ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-200 text-stone-800 border border-stone-300 whitespace-nowrap">
                        <Archive className="w-2.5 h-2.5 text-stone-700" />
                        <span>{language === 'ar' ? 'مؤرشف' : 'Archived'}</span>
                      </span>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        stageDef
                          ? `${stageDef.bg_color} ${stageDef.color} ${stageDef.border_color}`
                          : 'bg-bct-surface text-bct-navy border-slate-200'
                      }`}>
                        {stageLabel}
                      </span>
                    )}
                  </div>

                  {/* Card Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'الجنسية والجواز:' : 'Nationality & Passport:'}</span>
                      <div className="font-semibold text-slate-700">{stu.nationality}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{stu.passport_number}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'الاتصال:' : 'Contact:'}</span>
                      <div className="text-slate-700 font-mono text-[11px]">{stu.phone}</div>
                      {stu.email && <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{stu.email}</div>}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'المسار الأكاديمي:' : 'Academic Track:'}</span>
                      <div className="text-slate-600 text-[10px]">{file.certificate_type} ({file.academic_percentage}%)</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {dateField === 'last_update' ? (language === 'ar' ? 'آخر تحديث:' : 'Last Update:') : (language === 'ar' ? 'التسجيل:' : 'Registered:')}
                      </span>
                      <div className="font-mono text-slate-700 tabular-nums text-[10px]">
                        {formattedDate.isValid ? formattedDate.date : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                    <Link
                      to={`/students/${file.file_code}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-bct-navy text-white hover:bg-bct-dark transition"
                    >
                      <span>{language === 'ar' ? 'عرض الملف' : 'Dossier'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {hasPermission('students:edit') && !isArchived && (
                      <button
                        onClick={() => handleOpenEdit(stu, file)}
                        className="p-1 text-slate-500 hover:text-bct-navy hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title={language === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasPermission('students:delete') && !isArchived && (
                      <button
                        onClick={() => setDeleteCandidate(stu)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={language === 'ar' ? 'حذف / أرشفة الطالب' : 'Delete / Archive'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* B. FULL VISIBILITY TABLE FOR DESKTOPS & LAPTOPS (md+) - NO HORIZONTAL SCROLLBAR */}
        <div className="hidden md:block w-full overflow-hidden">
          <table className="w-full text-xs text-start border-collapse table-auto xl:table-fixed">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] xl:text-xs">
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[18%]">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[15%]">{language === 'ar' ? 'الجنسية والجواز' : 'Nationality & Passport'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">{language === 'ar' ? 'الاتصال وواتساب' : 'Contact'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[16%]">{language === 'ar' ? 'الملفات والمعاملات' : 'Files & Transactions'}</th>
                <th 
                  className="py-2.5 px-2 xl:px-2.5 text-start cursor-pointer hover:bg-slate-100/80 transition select-none group whitespace-nowrap w-[12%]"
                  onClick={handleToggleCreationDateSort}
                  title={
                    language === 'ar'
                      ? (sortField === 'file_created_at' || sortField === 'date'
                          ? (sortDirection === 'desc' 
                              ? (dateField === 'last_update' ? 'الترتيب: أحدث تحديث أولاً (انقر للترتيب تصاعدياً)' : 'الترتيب: أحدث تسجيل أولاً (انقر للترتيب تصاعدياً)') 
                              : (dateField === 'last_update' ? 'الترتيب: أقدم تحديث أولاً (انقر للترتيب تنازلياً)' : 'الترتيب: أقدم تسجيل أولاً (انقر للترتيب تنازلياً)'))
                          : (dateField === 'last_update' ? 'انقر لترتيب الملفات حسب تاريخ آخر تحديث' : 'انقر لترتيب الملفات حسب تاريخ تسجيل الطالب'))
                      : (sortField === 'file_created_at' || sortField === 'date'
                          ? (sortDirection === 'desc' ? 'Sorted: Newest first (Click for Ascending)' : 'Sorted: Oldest first (Click for Descending)')
                          : 'Click to sort by date')
                  }
                >
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <span>{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                      <span className="text-[9px] font-normal text-indigo-600 -mt-0.5 whitespace-nowrap">
                        {dateField === 'last_update' 
                          ? (language === 'ar' ? '(آخر تحديث)' : '(Last Update)') 
                          : (language === 'ar' ? '(تسجيل)' : '(Registration)')}
                      </span>
                    </div>
                    <div className={`p-0.5 rounded transition ${(sortField === 'file_created_at' || sortField === 'date') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {(sortField === 'file_created_at' || sortField === 'date') ? (
                        sortDirection === 'desc' ? (
                          <ArrowDown className="w-3 h-3 text-indigo-600" />
                        ) : (
                          <ArrowUp className="w-3 h-3 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </div>
                </th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">{language === 'ar' ? 'المرحلة الحالية' : 'Current Stage'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[11%]">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-slate-100 text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="font-extrabold text-sm text-slate-700">
                        {language === 'ar'
                          ? 'لم يتم العثور على أي ملف طالب يطابق معايير البحث والفلاتر المحددة'
                          : 'No student files match your search or filter criteria'}
                      </div>
                      <p className="text-xs text-slate-400 max-w-md">
                        {language === 'ar'
                          ? 'تأكد من صحة رقم الطالب، رقم الملف (BCT-FILE-...)، رقم المعاملة، أو جرّب توسيع نطاق المرحلة والفترة الزمنية والجنسية.'
                          : 'Check the student ID, file number (BCT-FILE-...), transaction ID, or try expanding the stage, date range, and nationality.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="mt-2 px-4 py-1.5 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-xs cursor-pointer"
                      >
                        {language === 'ar' ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ file, student: stu, isArchived }) => {
                
                const stageDef = LIFECYCLE_STAGE_DEFINITIONS.find(s => s.key === file.current_status);
                const stageLabel = stageDef
                  ? (language === 'ar' ? stageDef.name_ar : stageDef.name_en)
                  : t(`statuses.${file.current_status}`);

                return (
                  <tr key={file.id} className={`transition ${isArchived ? 'bg-stone-50/60 hover:bg-stone-100/70' : 'hover:bg-slate-50/70'}`}>
                    {/* Student Name & Code */}
                    <td className="py-2 px-2 xl:px-2.5">
                      <Link
                        to={`/students/${file.file_code}`}
                        className="font-extrabold text-slate-900 hover:text-bct-navy block text-xs leading-tight"
                        title={language === 'ar' ? `فتح ملف المعاملة ${file.file_code}` : `Open dossier ${file.file_code}`}
                      >
                        {language === 'ar' ? stu.full_name_ar : stu.full_name_en}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {stu.student_code}
                      </span>
                    </td>

                    {/* Nationality & Passport */}
                    <td className="py-2 px-2 xl:px-2.5">
                      <div className="font-semibold text-slate-700 text-[11px] whitespace-nowrap">{stu.nationality}</div>
                      <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {stu.passport_number}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-2 px-2 xl:px-2.5">
                      <div className="flex items-center gap-1 text-slate-700 whitespace-nowrap text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-mono">{stu.phone}</span>
                      </div>
                      {stu.email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px] whitespace-nowrap">
                          {stu.email}
                        </div>
                      )}
                    </td>

                    {/* File Code, Academic Track & Student Files Count */}
                    <td className="py-2 px-2 xl:px-2.5">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Link
                          to={`/students/${file.file_code}`}
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition hover:opacity-80 hover:shadow-xs cursor-pointer whitespace-nowrap ${
                            isArchived
                              ? 'text-stone-700 bg-stone-100 border-stone-300 hover:bg-stone-200'
                              : 'text-bct-navy bg-blue-50 border-blue-200 hover:bg-blue-100'
                          }`}
                          title={language === 'ar' ? `فتح ملف المعاملة ${file.file_code}` : `Open dossier ${file.file_code}`}
                        >
                          {file.file_code}
                        </Link>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px] whitespace-nowrap">
                        {file.certificate_type} ({file.academic_percentage}%)
                      </div>
                    </td>

                    {/* Dynamic Date Column (Registration vs Last Update) */}
                    <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                      {(() => {
                        const dateInfo = getStudentDateValue(stu, [file], dateField, fileActivities, auditLogs);

                        if (dateInfo.isUpdate) {
                          if (!dateInfo.hasRecordedUpdate || !dateInfo.isoString) {
                            return (
                              <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {language === 'ar' ? 'لا يوجد تحديث' : 'No updates'}
                              </span>
                            );
                          }
                          const formatted = formatFileCreationDate(dateInfo.isoString, language === 'ar');
                          if (!formatted.isValid) {
                            return (
                              <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {language === 'ar' ? 'لا يوجد تحديث' : 'No updates'}
                              </span>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-0.5 whitespace-nowrap">
                              <div className="flex items-center gap-1 tabular-nums font-bold text-[11px] text-slate-800">
                                <Calendar className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                <span>{formatted.date}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                                <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{formatted.time}</span>
                              </div>
                            </div>
                          );
                        }

                        if (!dateInfo.isoString) {
                          return (
                            <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {language === 'ar' ? 'غير متوفر' : 'N/A'}
                            </span>
                          );
                        }
                        const formatted = formatFileCreationDate(dateInfo.isoString, language === 'ar');
                        if (!formatted.isValid) {
                          return (
                            <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {language === 'ar' ? 'غير متوفر' : 'N/A'}
                            </span>
                          );
                        }
                        return (
                          <div className="flex flex-col gap-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 tabular-nums font-bold text-[11px] text-slate-800">
                              <Calendar className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                              <span>{formatted.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{formatted.time}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Current Stage & Archived Status */}
                    <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                      {isArchived ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-stone-200 text-stone-800 border border-stone-300 whitespace-nowrap">
                            <Archive className="w-2.5 h-2.5 text-stone-700" />
                            <span>{language === 'ar' ? 'مؤرشف' : 'Archived'}</span>
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[120px]">
                            {stageLabel}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                          stageDef
                            ? `${stageDef.bg_color} ${stageDef.color} ${stageDef.border_color}`
                            : 'bg-bct-surface text-bct-navy border-slate-200'
                        }`}>
                          {stageLabel}
                        </span>
                      )}
                    </td>

                    {/* Actions (View, Edit, Delete/Archive) */}
                    <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/students/${file.file_code}`}
                          className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap ${
                            isArchived
                              ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
                              : 'bg-bct-surface hover:bg-slate-200 text-bct-navy'
                          }`}
                          title={isArchived
                            ? (language === 'ar' ? 'عرض الملف المؤرشف (للقراءة فقط)' : 'View Archived File (Read-Only)')
                            : (language === 'ar' ? 'عرض الملف' : 'View Dossier')}
                        >
                          <span>{language === 'ar' ? 'الملف' : 'Dossier'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>

                        {hasPermission('students:edit') && !isArchived && (
                          <button
                            onClick={() => handleOpenEdit(stu, file)}
                            className="p-1 text-slate-500 hover:text-bct-navy hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title={language === 'ar' ? 'تعديل بيانات الطالب' : 'Edit Student'}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}

                        {hasPermission('students:delete') && !isArchived && (
                          <button
                            onClick={() => setDeleteCandidate(stu)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={language === 'ar' ? 'حذف / أرشفة الطالب' : 'Delete / Archive'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Student File (Fix 11) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-200" />
                  <span>
                    {language === 'ar' ? `تعديل ملف الطالب: ${editingStudent.full_name_ar}` : `Edit Student File: ${editingStudent.full_name_en}`}
                  </span>
                </h3>
                <span className="text-[11px] text-blue-200 font-mono">{editingStudent.student_code}</span>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Personal Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b pb-1">
                  {language === 'ar' ? 'البيانات الشخصية وجواز السفر' : 'Personal & Passport Details'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.full_name_ar}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name_ar: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم بالإنجليزية *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.full_name_en}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name_en: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الجنسية *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.nationality}
                      onChange={(e) => setEditFormData({ ...editFormData, nationality: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">بلد الإقامة *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.residence_country}
                      onChange={(e) => setEditFormData({ ...editFormData, residence_country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الجواز *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.passport_number}
                      onChange={(e) => setEditFormData({ ...editFormData, passport_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تاريخ انتهاء الجواز *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.passport_expiry_date}
                      onChange={(e) => setEditFormData({ ...editFormData, passport_expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b pb-1">
                  {language === 'ar' ? 'بيانات الاتصال' : 'Contact Information'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الواتساب *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.whatsapp}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Academic Info */}
              {editingFile && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 border-b pb-1">
                    {language === 'ar' ? 'البيانات الأكاديمية ومسؤول المتابعة' : 'Academic Dossier Details'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">نوع الشهادة *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.certificate_type}
                        onChange={(e) => setEditFormData({ ...editFormData, certificate_type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">النسبة المئوية (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="100"
                        required
                        value={editFormData.academic_percentage}
                        onChange={(e) => setEditFormData({ ...editFormData, academic_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الموظف المتابع للملف (Operations Owner)</label>
                    <select
                      value={editFormData.current_owner_id}
                      onChange={(e) => setEditFormData({ ...editFormData, current_owner_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name_ar} ({emp.job_title_ar})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete / Archive Confirmation (Fix 11) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Archive className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800">
              {language === 'ar' ? 'تأكيد أرشفة / حذف ملف الطالب' : 'Confirm Student Archive / Deletion'}
            </h3>

            <p className="text-xs text-slate-500 mt-2">
              {language === 'ar' 
                ? `هل أنت متأكد من أرشفة وحذف ملف الطالب (${deleteCandidate.full_name_ar}) من القوائم النشطة؟`
                : `Are you sure you want to archive student (${deleteCandidate.full_name_en})?`}
            </p>

            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-start text-xs text-amber-800">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{language === 'ar' ? 'حماية السجلات المالية والتدقيق:' : 'Audit & Financial Protection:'}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900">
                {language === 'ar'
                  ? 'سيتم الاحتفاظ بكافة الدفعات والإيصالات المحاسبية وسجل الإجراءات في أرشيف الشركة الدائم للرجوع إليها مستقبلاً.'
                  : 'All payment vouchers, receipts, and audit history will remain permanently stored in company archives.'}
              </p>
            </div>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 text-xs flex items-center gap-1.5 shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تأكيد الأرشفة والحذف' : 'Confirm Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Student */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {language === 'ar' ? 'تسجيل طالب جديد وفتح ملف أكاديمي' : 'Register New Student Dossier'}
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="p-5 space-y-4 text-xs overflow-y-auto">
              {duplicateWarning && (
                <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">
                        {duplicateWarning.message}
                      </p>
                      {duplicateWarning.studentName && (
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          {language === 'ar' ? 'بيانات الطالب المسجل:' : 'Registered Student:'} {duplicateWarning.studentName}
                        </p>
                      )}
                    </div>
                  </div>
                  {duplicateWarning.fileCode && (
                    <Link
                      to={`/students/${duplicateWarning.fileCode}`}
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold shrink-0 text-center transition-colors shadow-xs"
                    >
                      {language === 'ar' ? 'فتح ملف الطالب القائم' : 'Open Existing Dossier'}
                    </Link>
                  )}
                </div>
              )}
              
              {/* Personal Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b pb-1">
                  {language === 'ar' ? 'البيانات الشخصية وجواز السفر' : 'Personal & Passport Details'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم رباعي (بالعربية) *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name_ar}
                      onChange={(e) => setFormData({ ...formData, full_name_ar: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                      placeholder="محمد الصادق أحمد البشير"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الاسم بالإنجليزية (حسب الجواز) *</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name_en}
                      onChange={(e) => setFormData({ ...formData, full_name_en: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                      placeholder="Mohamed El-Sadeq Ahmed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الجنسية *</label>
                    <select
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    >
                      <option value="سوداني (Sudanese)">سوداني (Sudanese)</option>
                      <option value="سعودي (Saudi)">سعودي (Saudi)</option>
                      <option value="إماراتي (Emirati)">إماراتي (Emirati)</option>
                      <option value="كويتي (Kuwaiti)">كويتي (Kuwaiti)</option>
                      <option value="مصري (Egyptian)">مصري (Egyptian)</option>
                      <option value="أخرى (Other)">أخرى (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الجواز *</label>
                    <input
                      type="text"
                      required
                      value={formData.passport_number}
                      onChange={(e) => handlePassportChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      placeholder="P01928374"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b pb-1">
                  {language === 'ar' ? 'بيانات الاتصال والمراسلة' : 'Contact Information'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                      placeholder="+249XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الواتساب *</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                      placeholder="+249XXXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 border-b pb-1">
                  {language === 'ar' ? 'البيانات الأكاديمية المبدئية' : 'Initial Academic Details'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نوع الشهادة الثانوية *</label>
                    <input
                      type="text"
                      required
                      value={formData.certificate_type}
                      onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">النسبة المئوية (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="50"
                      max="100"
                      required
                      value={formData.academic_percentage}
                      onChange={(e) => setFormData({ ...formData, academic_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(duplicateWarning)}
                  className={`px-5 py-2 rounded-xl font-bold transition ${
                    duplicateWarning
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-bct-navy text-white hover:bg-bct-dark'
                  }`}
                >
                  {language === 'ar' ? 'تسجيل وحفظ الملف' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
