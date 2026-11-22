import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { StudentFile, StudentFileStatus, StudentFileActivityRecord, STAGE_SLA_CONFIG, LIFECYCLE_STAGE_DEFINITIONS } from '../types/database.types';
import { normalizeArabicText, normalizeIdentifier } from '../services/studentSearchService';
import { 
  GitFork, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  X,
  FileText,
  User,
  UserCheck,
  Filter,
  History,
  MessageSquare,
  Send,
  ArrowRightLeft,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
  RotateCcw,
  Archive,
  Star,
  Award,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  Check,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getActionEventMeta } from '../services/actionEventService';
import { 
  resolveEmployeeDisplayName, 
  resolveActorJobTitle, 
  resolveActorDepartment 
} from '../utils/activityFormatting';

const ACTION_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  FILE_CREATED: { ar: 'إنشاء ملف طالب', en: 'File Created', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  STAGE_TRANSITION: { ar: 'انتقال مرحلة', en: 'Stage Transition', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  FILE_ASSIGNED: { ar: 'تعيين مسؤول', en: 'File Assigned', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  FILE_REASSIGNED: { ar: 'إعادة تعيين مسؤول', en: 'File Reassigned', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  DOCUMENTS_VERIFIED: { ar: 'مراجعة المستندات', en: 'Documents Verified', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  DOCUMENTS_REJECTED: { ar: 'رفض مستندات', en: 'Documents Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  APPLICATION_SUBMITTED: { ar: 'التقديم على المنصة', en: 'Application Submitted', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  PAYMENT_CONFIRMED: { ar: 'تأكيد سداد مالي', en: 'Payment Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FILE_APPROVED: { ar: 'اعتماد القبول النهائي', en: 'Admission Approved', color: 'bg-green-100 text-green-800 border-green-200' },
  FILE_REJECTED: { ar: 'رفض القبول', en: 'Application Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  FILE_CLOSED: { ar: 'إغلاق الملف', en: 'File Closed', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  FILE_EVALUATED: { ar: 'تقييم أداء الملف', en: 'File Evaluated', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  FILE_ARCHIVED: { ar: 'أرشفة تلقائية (نظام)', en: 'File Auto-Archived', color: 'bg-stone-200 text-stone-800 border-stone-300' },
  FILE_REOPENED: { ar: 'إعادة فتح من الأرشيف', en: 'File Reopened', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  CHOICES_UPDATED: { ar: 'تحديث الرغبات الجامعية', en: 'Choices Updated', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  NOTE_ADDED: { ar: 'ملاحظة إدارية', en: 'Administrative Note', color: 'bg-amber-50 text-amber-900 border-amber-300' },
  STATUS_UPDATED: { ar: 'تحديث الحالة', en: 'Status Updated', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ADMIN_CORRECTION: { ar: 'تصحيح إداري', en: 'Admin Correction', color: 'bg-rose-100 text-rose-800 border-rose-200' }
};

export const Pipeline: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser, hasPermission } = useAuth();

  const [files, setFiles] = useState(bctStore.getStudentFiles());
  const employees = bctStore.getEmployees();

  // View state: 'board' (Active Kanban Board) or 'archive' (Archived Files Register)
  const [activeView, setActiveView] = useState<'board' | 'archive'>('board');

  // Search & Filter State
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>(searchParams.get('stage') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'overdue' | 'closed' | 'archived'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedNationality, setSelectedNationality] = useState<string>('all');
  
  // Date Range Filter State
  const [dateField, setDateField] = useState<'created_at' | 'last_updated_at' | 'closed_at' | 'archived_at'>('created_at');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string>('');

  // Modal 1: Transition File Status
  const [selectedFileForTransition, setSelectedFileForTransition] = useState<StudentFile | null>(null);
  const [targetStatus, setTargetStatus] = useState<StudentFileStatus>('qualified');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transitionError, setTransitionError] = useState('');
  // Inline evaluation fields for transition to 'closed'
  const [evalScoreInput, setEvalScoreInput] = useState<string>('');
  const [evalRatingInput, setEvalRatingInput] = useState<string>('ممتاز');
  const [evalNotesInput, setEvalNotesInput] = useState<string>('');

  // Modal 2: Activity & Ownership History Modal
  const [selectedFileForHistory, setSelectedFileForHistory] = useState<StudentFile | null>(null);
  const [historyActivities, setHistoryActivities] = useState<StudentFileActivityRecord[]>([]);
  const [newAdminNote, setNewAdminNote] = useState('');
  const [noteSubmitError, setNoteSubmitError] = useState('');

  // Modal 3: Quick Performance Evaluation Modal (for Stage 10)
  const [fileToEvaluate, setFileToEvaluate] = useState<StudentFile | null>(null);
  const [quickEvalScore, setQuickEvalScore] = useState<number>(95);
  const [quickEvalRating, setQuickEvalRating] = useState<string>('ممتاز');
  const [quickEvalNotes, setQuickEvalNotes] = useState<string>('');
  const [quickEvalError, setQuickEvalError] = useState<string>('');

  // Modal 4: Reopen Archived File Modal
  const [fileToReopen, setFileToReopen] = useState<StudentFile | null>(null);
  const [reopenTargetStage, setReopenTargetStage] = useState<StudentFileStatus>('review');
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenError, setReopenError] = useState<string>('');

  useEffect(() => {
    return bctStore.subscribe(() => {
      const updatedFiles = bctStore.getStudentFiles();
      setFiles(updatedFiles);
      if (selectedFileForHistory) {
        const refreshedFile = updatedFiles.find(f => f.id === selectedFileForHistory.id) || null;
        setSelectedFileForHistory(refreshedFile);
        if (refreshedFile) {
          setHistoryActivities(bctStore.getFileActivities(refreshedFile.id));
        }
      }
    });
  }, [selectedFileForHistory]);

  const getStageSLALabels = (stageKey: StudentFileStatus) => {
    const cfg = bctStore.getStageSLA(stageKey);
    if (cfg) {
      return {
        sla_ar: cfg.label_ar,
        sla_en: cfg.label_en
      };
    }
    const fallback = STAGE_SLA_CONFIG[stageKey];
    return {
      sla_ar: fallback?.label_ar || '—',
      sla_en: fallback?.label_en || '—'
    };
  };

  const STAGES = useMemo(() => {
    return LIFECYCLE_STAGE_DEFINITIONS.map(def => ({
      key: def.key,
      number: def.number,
      stageNumber: def.stageNumber,
      label_ar: def.label_ar,
      label_en: def.label_en,
      name_ar: def.name_ar,
      name_en: def.name_en,
      color: def.color,
      bg_color: def.bg_color,
      border_color: def.border_color,
      ...getStageSLALabels(def.key)
    }));
  }, []);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const formatClosedDateTime = (isoString?: string) => {
    if (!isoString) return language === 'ar' ? 'غير متاح' : 'N/A';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return language === 'ar' ? 'غير متاح' : 'N/A';
      return d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return language === 'ar' ? 'غير متاح' : 'N/A';
    }
  };

  // Extract unique nationalities from student records for filtering
  const nationalities = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.student?.nationality) {
        set.add(f.student.nationality);
      }
    });
    return Array.from(set).sort();
  }, [files]);

  const ACTIVE_STAGE_KEYS = useMemo(() => STAGES.map(s => s.key), [STAGES]);

  useEffect(() => {
    const s = searchParams.get('stage');
    if (s && ACTIVE_STAGE_KEYS.includes(s as StudentFileStatus)) {
      setSelectedStage(s);
    }
  }, [searchParams, ACTIVE_STAGE_KEYS]);

  // Strict backend definition of active file: not archived and belongs to one of the 10 official stages
  const isFileActive = (f: StudentFile): boolean => {
    return !f.is_archived && ACTIVE_STAGE_KEYS.includes(f.current_status);
  };

  // Validate and handle date range
  const handleDateChange = (start: string, end: string) => {
    setDateStart(start);
    setDateEnd(end);
    if (start && end && new Date(start) > new Date(end)) {
      setDateError(language === 'ar' ? 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية' : 'Start date must be before or equal to end date');
    } else {
      setDateError('');
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStage('all');
    setSelectedStatus('all');
    setSelectedEmployee('all');
    setSelectedNationality('all');
    setDateStart('');
    setDateEnd('');
    setDateError('');
    setShowDatePicker(false);
  };

  // Base Multi-Identifier Search & Multi-Factor Filtering (before stage column isolation)
  const baseFilteredFiles = useMemo(() => {
    const payments = bctStore.getPayments();
    const queryNorm = normalizeArabicText(searchQuery);
    const queryIdNorm = normalizeIdentifier(searchQuery);

    return files.filter(file => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const fileCodeNorm = normalizeIdentifier(file.file_code);
        const fileIdNorm = normalizeIdentifier(file.id);
        const stuNameAr = normalizeArabicText(file.student?.full_name_ar);
        const stuNameEn = (file.student?.full_name_en || '').toLowerCase();
        const passportNorm = normalizeIdentifier(file.student?.passport_number);
        const phoneNorm = (file.student?.phone || '').replace(/\D/g, '');
        const whatsappNorm = (file.student?.whatsapp || '').replace(/\D/g, '');
        const ownerAr = normalizeArabicText(file.current_owner?.full_name_ar);
        const ownerEn = (file.current_owner?.full_name_en || '').toLowerCase();
        const actorName = normalizeArabicText(file.last_action_by_name);

        // Check linked transactions and receipts
        const linkedPayments = payments.filter(
          p => p.student_file_id === file.id || p.student_id === file.student_id
        );
        const matchedPayment = linkedPayments.some(p => {
          const rc = normalizeIdentifier(p.receipt_code);
          const pr = normalizeIdentifier(p.payment_reference);
          const tn = normalizeIdentifier((p as any).transaction_number);
          return (
            (rc && rc.includes(queryIdNorm)) ||
            (pr && pr.includes(queryIdNorm)) ||
            (tn && tn.includes(queryIdNorm))
          );
        });

        const queryDigits = searchQuery.replace(/\D/g, '');
        const phoneMatches = queryDigits.length >= 3 && (phoneNorm.includes(queryDigits) || whatsappNorm.includes(queryDigits));

        const matchesQuery = 
          fileCodeNorm.includes(queryIdNorm) ||
          fileIdNorm.includes(queryIdNorm) ||
          stuNameAr.includes(queryNorm) ||
          stuNameEn.includes(searchQuery.toLowerCase()) ||
          passportNorm.includes(queryIdNorm) ||
          phoneMatches ||
          ownerAr.includes(queryNorm) ||
          ownerEn.includes(searchQuery.toLowerCase()) ||
          actorName.includes(queryNorm) ||
          matchedPayment;

        if (!matchesQuery) return false;
      }

      // 2. Status Filter (all, active, overdue, closed, archived)
      if (selectedStatus === 'active') {
        if (!isFileActive(file) || file.is_overdue || file.current_status === 'closed') return false;
      } else if (selectedStatus === 'overdue') {
        if (!file.is_overdue || file.is_archived) return false;
      } else if (selectedStatus === 'closed') {
        if (file.current_status !== 'closed' || file.is_archived) return false;
      } else if (selectedStatus === 'archived') {
        if (!file.is_archived) return false;
      }

      // 3. Assigned Employee Filter
      if (selectedEmployee !== 'all') {
        if (file.current_owner_id !== selectedEmployee) return false;
      }

      // 4. Nationality Filter
      if (selectedNationality !== 'all') {
        if (file.student?.nationality !== selectedNationality) return false;
      }

      // 5. Date Range Filter
      if (dateStart || dateEnd) {
        const rawDate = dateField === 'closed_at' ? bctStore.getFileClosedAt(file.id) : file[dateField];
        if (!rawDate) return false;
        const fileTime = new Date(rawDate).getTime();

        if (dateStart) {
          const startTime = new Date(dateStart + 'T00:00:00.000').getTime();
          if (fileTime < startTime) return false;
        }

        if (dateEnd) {
          const endTime = new Date(dateEnd + 'T23:59:59.999').getTime();
          if (fileTime > endTime) return false;
        }
      }

      return true;
    });
  }, [files, searchQuery, selectedStatus, selectedEmployee, selectedNationality, dateField, dateStart, dateEnd]);

  const filteredFiles = baseFilteredFiles;

  // Active files list strictly defined as not archived and valid stage
  const activeBoardFiles = useMemo(() => {
    return filteredFiles.filter(f => !f.is_archived && isFileActive(f));
  }, [filteredFiles]);

  // Synchronized Statistics: Guaranteed Total Active Files = Sum of all 10 stages
  const totalActiveFiles = activeBoardFiles.length;

  const totalOverdueFiles = useMemo(() => {
    return activeBoardFiles.filter(f => f.is_overdue).length;
  }, [activeBoardFiles]);

  const archivedFiles = useMemo(() => {
    return filteredFiles.filter(f => f.is_archived);
  }, [filteredFiles]);

  const totalArchivedFiles = archivedFiles.length;

  // Active stage counts: strictly sums up to totalActiveFiles
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach(s => {
      counts[s.key] = activeBoardFiles.filter(f => f.current_status === s.key).length;
    });
    return counts;
  }, [activeBoardFiles]);

  // Board files filtered by selectedStage if user has selected a specific stage
  const boardFiles = useMemo(() => {
    const active = filteredFiles.filter(f => !f.is_archived);
    if (selectedStage === 'all') return active.filter(isFileActive);
    return active.filter(f => isFileActive(f) && f.current_status === selectedStage);
  }, [filteredFiles, selectedStage]);

  // Auto-Archiving Countdown Helper for Stage 10 cards
  const getAutoArchiveCountdown = (file: StudentFile) => {
    if (file.current_status !== 'closed') return null;
    if (file.is_archived) return null;
    
    const hasEvaluation = Boolean(file.is_evaluated || file.evaluation_score != null);
    if (!hasEvaluation) {
      return {
        isEvaluated: false,
        messageAr: 'بانتظار التقييم لبدء عداد الـ 24 ساعة',
        messageEn: 'Pending evaluation to start 24h countdown',
        hoursLeft: null
      };
    }

    const closedTime = new Date(bctStore.getFileClosedAt(file.id) || file.current_stage_entered_at || file.last_updated_at).getTime();
    const evaluatedTime = file.evaluated_at ? new Date(file.evaluated_at).getTime() : closedTime;
    const completionTime = Math.max(closedTime, evaluatedTime);
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - completionTime;
    const remainingMs = TWENTY_FOUR_HOURS_MS - elapsed;

    if (remainingMs <= 0) {
      return {
        isEvaluated: true,
        messageAr: 'جاهز للأرشفة التلقائية الآن',
        messageEn: 'Due for auto-archiving now',
        hoursLeft: 0
      };
    }

    const hoursLeft = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
    return {
      isEvaluated: true,
      messageAr: `أرشفة تلقائية خلال ${hoursLeft} ساعة`,
      messageEn: `Auto-archives in ${hoursLeft} hrs`,
      hoursLeft
    };
  };

  // Open Transition Modal
  const handleOpenTransition = (file: StudentFile) => {
    setSelectedFileForTransition(file);
    const currentIndex = STAGES.findIndex(s => s.key === file.current_status);
    const nextStatus = STAGES[Math.min(currentIndex + 1, STAGES.length - 1)].key;
    setTargetStatus(nextStatus);
    setNewOwnerId(file.current_owner_id);
    setTransitionNotes('');
    setTransitionError('');
    setEvalScoreInput(file.evaluation_score ? String(file.evaluation_score) : '95');
    setEvalRatingInput(file.evaluation_rating || 'ممتاز');
    setEvalNotesInput(file.evaluation_notes || '');
  };

  // Execute Transition
  const handleExecuteTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForTransition) return;

    let evalData = undefined;
    if (targetStatus === 'closed' && evalScoreInput) {
      const scoreNum = Number(evalScoreInput);
      if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
        evalData = {
          score: scoreNum,
          rating: evalRatingInput,
          notes: evalNotesInput
        };
      }
    }

    const result = bctStore.transitionFileStatus(
      selectedFileForTransition.id,
      targetStatus,
      transitionNotes,
      currentUser?.username || 'admin',
      newOwnerId,
      evalData
    );

    if (result.success) {
      setSelectedFileForTransition(null);
    } else {
      setTransitionError(result.message || 'فشلت عملية النقل');
    }
  };

  // Open History Modal
  const handleOpenFileHistory = (file: StudentFile) => {
    setSelectedFileForHistory(file);
    setHistoryActivities(bctStore.getFileActivities(file.id));
    setNewAdminNote('');
    setNoteSubmitError('');
  };

  // Add Administrative Note
  const handleAddAdminNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileForHistory) return;
    if (!newAdminNote.trim()) {
      setNoteSubmitError(language === 'ar' ? 'يرجى كتابة نص الملاحظة الإدارية' : 'Please enter note text');
      return;
    }

    const created = bctStore.addFileNote(
      selectedFileForHistory.id,
      newAdminNote.trim(),
      currentUser?.username || 'admin'
    );

    if (created) {
      setNewAdminNote('');
      setNoteSubmitError('');
      setHistoryActivities(bctStore.getFileActivities(selectedFileForHistory.id));
    }
  };

  // Open Quick Evaluation Modal (Stage 10)
  const handleOpenQuickEvaluation = (file: StudentFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFileToEvaluate(file);
    setQuickEvalScore(file.evaluation_score || 95);
    setQuickEvalRating(file.evaluation_rating || 'ممتاز');
    setQuickEvalNotes(file.evaluation_notes || '');
    setQuickEvalError('');
  };

  // Execute Quick Evaluation
  const handleExecuteQuickEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToEvaluate) return;

    if (quickEvalScore < 0 || quickEvalScore > 100) {
      setQuickEvalError(language === 'ar' ? 'درجة التقييم يجب أن تكون بين 0 و 100' : 'Score must be between 0 and 100');
      return;
    }

    const result = bctStore.evaluateStudentFile(
      fileToEvaluate.id,
      {
        score: quickEvalScore,
        rating: quickEvalRating,
        notes: quickEvalNotes
      },
      currentUser?.username || 'admin'
    );

    if (result.success) {
      setFileToEvaluate(null);
    } else {
      setQuickEvalError(result.message || 'فشل تسجيل التقييم');
    }
  };

  // Open Reopen File Modal
  const handleOpenReopenModal = (file: StudentFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFileToReopen(file);
    setReopenTargetStage('review');
    setReopenReason('');
    setReopenError('');
  };

  // Execute Reopen File
  const handleExecuteReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToReopen) return;

    if (!reopenReason.trim()) {
      setReopenError(language === 'ar' ? 'سبب إعادة فتح الملف حقل إلزامي' : 'Reopen reason is mandatory');
      return;
    }

    const result = bctStore.reopenStudentFile(
      fileToReopen.id,
      reopenReason.trim(),
      reopenTargetStage,
      currentUser?.username || 'admin'
    );

    if (result.success) {
      setFileToReopen(null);
      // Switch back to active board to see the restored file
      setActiveView('board');
      setSelectedStage('all');
    } else {
      setReopenError(result.message || 'فشلت عملية إعادة فتح الملف');
    }
  };

  // Toggle stage selection from statistics cards
  const handleStageCardClick = (stageKey: string) => {
    if (selectedStage === stageKey) {
      setSelectedStage('all');
    } else {
      setSelectedStage(stageKey);
      setActiveView('board');
    }
  };

  const isAnyFilterActive = 
    Boolean(searchQuery.trim()) ||
    selectedStage !== 'all' ||
    selectedStatus !== 'all' ||
    selectedEmployee !== 'all' ||
    selectedNationality !== 'all' ||
    Boolean(dateStart) ||
    Boolean(dateEnd);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-bct-navy">
              {t('nav.lifecycle')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-bct-navy/10 text-bct-navy border border-bct-navy/20">
              {totalActiveFiles} {language === 'ar' ? 'ملف نشط' : 'Active Files'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'دورة حياة الملف العشرية الرسمية: نظام أرشفة تلقائية بعد 24 ساعة من الإغلاق والتقييم، وتتبع كامل لسجل العمليات والمسؤوليات.'
              : 'The Official 10-Stage File Lifecycle: 24h auto-archiving post-evaluation, full audit trail, and ownership history.'}
          </p>
        </div>

        {/* View Switcher Tabs & Legend */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-300/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveView('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeView === 'board'
                  ? 'bg-white text-bct-navy shadow-xs font-black'
                  : 'text-slate-600 hover:text-bct-navy'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'لوحة المراحل النشطة' : 'Active Board'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-bct-navy/10 text-bct-navy">
                {totalActiveFiles}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('archive')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeView === 'archive'
                  ? 'bg-white text-bct-navy shadow-xs font-black'
                  : 'text-slate-600 hover:text-bct-navy'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-stone-600" />
              <span>{language === 'ar' ? 'سجل أرشيف الملفات' : 'Archived Files'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-800">
                {totalArchivedFiles}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Statistics Bar: Total Card + 10 Stage Breakdown Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-bct-navy" />
            <span>{language === 'ar' ? 'شريط إحصائيات وتوزيع الملفات على المراحل العشر:' : 'Stage Distribution & Real-time Metrics:'}</span>
          </span>
          {selectedStage !== 'all' && (
            <button
              onClick={() => setSelectedStage('all')}
              className="text-[11px] text-bct-gold hover:underline flex items-center gap-1"
            >
              <span>{language === 'ar' ? 'عرض جميع المراحل' : 'Show All Stages'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
          {/* Card 0: Total Summary Card */}
          <div 
            onClick={() => {
              setSelectedStage('all');
              setSelectedStatus('all');
              setActiveView('board');
            }}
            className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gradient-to-br from-bct-navy to-bct-dark text-white shadow-xs cursor-pointer hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] text-white/80 font-medium block">
                {language === 'ar' ? 'إجمالي الملفات النشطة' : 'Total Active Files'}
              </span>
              <div className="text-2xl font-black mt-0.5">{totalActiveFiles}</div>
            </div>
            <div className="flex items-center justify-between gap-1 text-[9px] pt-2 border-t border-white/20 mt-1">
              <span className="flex items-center gap-1 text-red-200 font-bold" title="متأخرة عن مهلة SLA">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span>{totalOverdueFiles} {language === 'ar' ? 'متأخر' : 'overdue'}</span>
              </span>
              <span className="text-stone-300 font-medium" title="الملفات المؤرشفة">
                {totalArchivedFiles} {language === 'ar' ? 'أرشيف' : 'archived'}
              </span>
            </div>
          </div>

          {/* Cards 1-10: The 10 Lifecycle Stages Breakdown */}
          {STAGES.map((s, idx) => {
            const count = stageCounts[s.key] || 0;
            const isSelected = selectedStage === s.key;
            return (
              <div
                key={s.key}
                onClick={() => handleStageCardClick(s.key)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                  isSelected 
                    ? 'bg-bct-navy text-white border-bct-navy ring-2 ring-bct-gold shadow-md font-extrabold'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-bct-navy/40 shadow-xs'
                }`}
                title={language === 'ar' ? `انقر لتصفية مرحلة ${s.label_ar}` : `Click to filter stage ${s.label_en}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-1 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.stageNumber}
                  </span>
                  <span className={`text-base font-black ${
                    isSelected ? 'text-bct-gold' : count > 0 ? 'text-bct-navy' : 'text-slate-400'
                  }`}>
                    {count}
                  </span>
                </div>
                
                <div className="mt-1">
                  <div className={`text-[11px] font-bold line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-slate-800'
                  }`}>
                    {language === 'ar' ? s.name_ar : s.name_en}
                  </div>
                  <span className={`text-[9px] block truncate ${
                    isSelected ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {language === 'ar' ? s.sla_ar : s.sla_en}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Advanced Search Bar & Filtering Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' 
                ? 'ابحث برقم الملف، اسم الطالب، رقم الجواز، الهاتف/الواتساب، الموظف المسؤول، أو رقم الإيصال والمعاملة...' 
                : 'Search by file code, student name, passport, phone/WhatsApp, owner, or receipt code...'}
              className="w-full ps-9 pe-9 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-bct-navy focus:border-transparent bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Group */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Stage Filter */}
            <div className="flex items-center gap-1">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                <option value="all">{language === 'ar' ? 'جميع المراحل (10)' : 'All Stages (10)'}</option>
                {STAGES.map(s => (
                  <option key={s.key} value={s.key}>
                    {language === 'ar' ? s.label_ar : s.label_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="active">{language === 'ar' ? 'الملفات النشطة فقط' : 'Active Only'}</option>
                <option value="overdue">{language === 'ar' ? 'متأخرة (تجاوز مهلة SLA)' : 'Overdue SLA'}</option>
                <option value="closed">{language === 'ar' ? 'مغلق وتقييم' : 'Closed & NPS'}</option>
                <option value="archived">{language === 'ar' ? 'مؤرشفة' : 'Archived'}</option>
              </select>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-1">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 max-w-[150px]"
              >
                <option value="all">{language === 'ar' ? 'جميع الموظفين' : 'All Employees'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Nationality Filter */}
            {nationalities.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedNationality}
                  onChange={(e) => setSelectedNationality(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 max-w-[130px]"
                >
                  <option value="all">{language === 'ar' ? 'جميع الجنسيات' : 'All Nationalities'}</option>
                  {nationalities.map(nat => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Popover Button */}
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                dateStart || dateEnd 
                  ? 'bg-bct-navy text-white border-bct-navy'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {dateStart || dateEnd 
                  ? `${dateStart || '...'} → ${dateEnd || '...'}`
                  : (language === 'ar' ? 'فلتر الفترة الزمنية' : 'Date Range')}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Reset Filters Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                title={language === 'ar' ? 'إعادة تعيين جميع الفلاتر' : 'Reset Filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إعادة تعيين' : 'Reset'}</span>
              </button>
            )}

          </div>

        </div>

        {/* Date Range Popover Box */}
        {showDatePicker && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1 text-bct-navy">
                <Calendar className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحديد نطاق الفترة الزمنية وتاريخ المقارنة:' : 'Configure Date Range Filter:'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ar' ? 'حقل التاريخ المستهدف:' : 'Target Date Field:'}
                </label>
                <select
                  value={dateField}
                  onChange={(e) => setDateField(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="created_at">{language === 'ar' ? 'تاريخ فتح الملف' : 'File Creation Date'}</option>
                  <option value="last_updated_at">{language === 'ar' ? 'تاريخ آخر حركة وتحديث' : 'Last Action Date'}</option>
                  <option value="closed_at">{language === 'ar' ? 'تاريخ إغلاق الملف' : 'File Closed Date'}</option>
                  <option value="archived_at">{language === 'ar' ? 'تاريخ أرشفة الملف' : 'File Archived Date'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ar' ? 'من تاريخ (تاريخ البداية):' : 'From Date:'}
                </label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => handleDateChange(e.target.value, dateEnd)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {language === 'ar' ? 'إلى تاريخ (تاريخ النهاية):' : 'To Date:'}
                </label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => handleDateChange(dateStart, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            {dateError && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                  setDateError('');
                }}
                className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-200 text-xs font-semibold"
              >
                {language === 'ar' ? 'مسح التواريخ' : 'Clear Dates'}
              </button>
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="px-3.5 py-1 rounded-lg bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark"
              >
                {language === 'ar' ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Kanban Board View */}
      {activeView === 'board' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">
              {language === 'ar' 
                ? `عرض ${boardFiles.length} ملفاً نشطاً عبر المراحل العشر` 
                : `Showing ${boardFiles.length} active files across 10 stages`}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-red-500" />
                <span>{language === 'ar' ? 'الأحمر = تجاوز مهلة SLA' : 'Red = Overdue SLA'}</span>
              </span>
            </div>
          </div>

          {/* Horizontal Scrolling Kanban Board with all 10 stages */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[2800px]">
              {STAGES.map((stage) => {
                // If a stage filter is active, highlight or render only that stage
                if (selectedStage !== 'all' && stage.key !== selectedStage) {
                  return null;
                }

                const stageFiles = boardFiles.filter(f => f.current_status === stage.key);

                return (
                  <div 
                    key={stage.key}
                    className="w-72 shrink-0 bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[78vh]"
                  >
                    {/* Column Header */}
                    <div className="p-2 mb-2 flex items-center justify-between border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">
                          {language === 'ar' ? stage.label_ar : stage.label_en}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {language === 'ar' ? `المهلة: ${stage.sla_ar}` : `SLA: ${stage.sla_en}`}
                        </span>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-white text-bct-navy font-black text-xs flex items-center justify-center shadow-xs border border-slate-200">
                        {stageFiles.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-2.5 overflow-y-auto flex-1 p-0.5">
                      {stageFiles.map((file) => {
                        const countdown = getAutoArchiveCountdown(file);

                        return (
                          <div
                            key={file.id}
                            className={`p-3.5 rounded-xl bg-white border shadow-xs transition hover:shadow-md ${
                              file.is_overdue ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                            } ${hasPermission('students:edit') ? 'cursor-pointer hover:border-bct-navy' : 'cursor-default'}`}
                            onClick={() => {
                              if (hasPermission('students:edit')) {
                                handleOpenTransition(file);
                              }
                            }}
                          >
                            {/* Card Header: Code & Overdue Badge */}
                            <div className="flex items-center justify-between text-[10px] mb-1.5">
                              <span className="font-mono font-bold text-slate-400">
                                {file.file_code}
                              </span>
                              {file.is_overdue && (
                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-red-600" />
                                  <span>{language === 'ar' ? 'متأخر' : 'Overdue'}</span>
                                </span>
                              )}
                            </div>

                            {/* Student Name */}
                            <h5 className="text-xs font-extrabold text-slate-900 line-clamp-1 hover:text-bct-navy">
                              {language === 'ar' ? file.student?.full_name_ar : file.student?.full_name_en}
                            </h5>

                            {/* Track & Percentage */}
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                              <span className="truncate max-w-[130px]">{file.certificate_type}</span>
                              <span className="font-bold text-bct-navy">{file.academic_percentage}%</span>
                            </div>

                            {/* Stage 10 Special Strip: Evaluation Status & 24h Auto-Archive Countdown */}
                            {stage.key === 'closed' && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-[10px]">
                                {file.is_evaluated || file.evaluation_score != null ? (
                                  <>
                                    <div className="flex items-center justify-between font-bold text-amber-900">
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        <span>{language === 'ar' ? 'تقييم الأداء:' : 'Score:'}</span>
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-extrabold">
                                        {file.evaluation_score}% ({file.evaluation_rating || 'ممتاز'})
                                      </span>
                                    </div>

                                    {countdown && (
                                      <div className="flex items-center gap-1 text-[9px] text-amber-800 font-semibold">
                                        <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                        <span>{language === 'ar' ? countdown.messageAr : countdown.messageEn}</span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      <span>{language === 'ar' ? 'لم يقيم بعد' : 'Not Evaluated'}</span>
                                    </span>
                                    {hasPermission('students:edit') && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenQuickEvaluation(file, e)}
                                        className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold transition text-[9px] shadow-2xs"
                                      >
                                        {language === 'ar' ? 'تسجيل التقييم' : 'Evaluate'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Ownership & Activity Strip */}
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px]">
                              {/* Responsible Employee */}
                              <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <User className="w-3 h-3 text-bct-gold shrink-0" />
                                  <span>{language === 'ar' ? 'المسؤول الحالي:' : 'Current Owner:'}</span>
                                </span>
                                <span className="font-bold text-slate-800 truncate max-w-[125px]" title={file.current_owner?.full_name_ar}>
                                  {file.current_owner?.full_name_ar || (language === 'ar' ? 'غير مسند' : 'Unassigned')}
                                </span>
                              </div>

                              {/* Last Action Actor & Time */}
                              <div className="flex items-center justify-between text-slate-500">
                                <span className="flex items-center gap-1 text-slate-400">
                                  <UserCheck className="w-3 h-3 text-bct-navy shrink-0" />
                                  <span>{language === 'ar' ? 'آخر إجراء:' : 'Last Action:'}</span>
                                </span>
                                <span className="font-bold text-bct-navy truncate max-w-[125px]" title={file.last_action_by_name || file.current_owner?.full_name_ar}>
                                  {file.last_action_by_name || file.current_owner?.full_name_ar || '—'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatDateTime(file.last_action_at || file.last_updated_at)}</span>
                                </span>
                              </div>
                            </div>

                            {/* Card Footer: Payment Indicator & History Action Button */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                file.is_registered_fee_paid ? 'text-emerald-600' : 'text-amber-600'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${file.is_registered_fee_paid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span>{file.is_registered_fee_paid ? (language === 'ar' ? 'مسدد' : 'Paid') : (language === 'ar' ? 'غير مسدد' : 'Unpaid')}</span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFileHistory(file);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bct-navy/5 text-bct-navy hover:bg-bct-navy hover:text-white font-bold transition text-[10px] border border-bct-navy/20 cursor-pointer shadow-2xs"
                                title={language === 'ar' ? 'عرض سجل العمليات والموظفين' : 'View Activity & Ownership History'}
                              >
                                <History className="w-3 h-3" />
                                <span>{language === 'ar' ? 'سجل العمليات' : 'History'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {stageFiles.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                          {language === 'ar' ? 'لا توجد ملفات في هذه المرحلة' : 'No files in this stage'}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Archived Files Register View */}
      {activeView === 'archive' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
          
          {/* Archive Table Header */}
          <div className="p-4 bg-stone-100/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-stone-200 text-stone-800">
                  <Archive className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {language === 'ar' ? 'سجل الملفات المؤرشفة تلقائياً' : 'Automated Archived Files Register'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'الملفات المؤرشفة بعد استيفاء مرحلة الإغلاق والتقييم وانقضاء مهلة الـ 24 ساعة. تحفظ السجلات كاملة دون حذف.'
                  : 'Files automatically archived after reaching closed status, evaluation completion, and 24h lapse. Immutable history.'}
              </p>
            </div>

            <div className="text-xs font-bold text-stone-800 bg-stone-200 px-3 py-1.5 rounded-xl">
              {archivedFiles.length} {language === 'ar' ? 'ملف مؤرشف' : 'Archived Files'}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700">
                <tr>
                  <th className="p-3 font-mono">{language === 'ar' ? 'رقم الملف' : 'File Code'}</th>
                  <th className="p-3">{language === 'ar' ? 'اسم صاحب الملف' : 'Student Name'}</th>
                  <th className="p-3">{language === 'ar' ? 'المرحلة النهائية' : 'Final Stage'}</th>
                  <th className="p-3">{language === 'ar' ? 'نسبة التقييم' : 'Evaluation Score'}</th>
                  <th className="p-3">{language === 'ar' ? 'المسؤول عند الإغلاق' : 'Closing Owner'}</th>
                  <th className="p-3">{language === 'ar' ? 'تاريخ الإغلاق' : 'Closed At'}</th>
                  <th className="p-3">{language === 'ar' ? 'تاريخ الأرشفة' : 'Archived At'}</th>
                  <th className="p-3">{language === 'ar' ? 'آخر مستخدم أجرى عملية' : 'Last Action By'}</th>
                  <th className="p-3 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archivedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* 1. File Code */}
                    <td className="p-3 font-mono font-bold text-bct-navy">
                      {file.file_code}
                    </td>

                    {/* 2. Student Name */}
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900">
                        {language === 'ar' ? file.student?.full_name_ar : file.student?.full_name_en}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {file.student?.passport_number || '—'} • {file.student?.nationality || '—'}
                      </span>
                    </td>

                    {/* 3. Final Stage */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-800 border border-slate-300">
                        {language === 'ar' ? '10. مغلق وتقييم' : '10. Closed & NPS'}
                      </span>
                    </td>

                    {/* 4. Evaluation Score */}
                    <td className="p-3">
                      {file.evaluation_score != null ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px]">
                          <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                          <span>{file.evaluation_score}%</span>
                          <span className="text-[10px] text-amber-700">({file.evaluation_rating || 'ممتاز'})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 5. Closing Owner */}
                    <td className="p-3">
                      <div className="font-bold text-slate-800">
                        {file.current_owner
                          ? (language === 'ar' ? (file.current_owner.full_name_ar || file.current_owner.full_name_en) : (file.current_owner.full_name_en || file.current_owner.full_name_ar))
                          : '—'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {file.current_owner ? bctStore.getEmployeeJobTitle(file.current_owner, language) : '—'}
                      </span>
                    </td>

                    {/* 6. Closed Date */}
                    <td className="p-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {formatClosedDateTime(bctStore.getFileClosedAt(file.id))}
                    </td>

                    {/* 7. Archived Date */}
                    <td className="p-3 text-stone-700 text-[11px] whitespace-nowrap">
                      <div className="font-bold">{formatDateTime(file.archived_at)}</div>
                      <span className="text-[9px] text-stone-500 block truncate max-w-[140px]" title={file.archived_by}>
                        {file.archived_by || 'النظام الآلي'}
                      </span>
                    </td>

                    {/* 8. Last Action By */}
                    <td className="p-3">
                      <div className="font-bold text-bct-navy text-[11px]">
                        {file.last_action_by_name || '—'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(file.last_action_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        {/* History Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenFileHistory(file)}
                          className="p-1.5 rounded-lg bg-bct-navy/10 hover:bg-bct-navy hover:text-white text-bct-navy transition cursor-pointer"
                          title={language === 'ar' ? 'عرض السجل الزمني الكامل' : 'View Full History Timeline'}
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Reopen File Button */}
                        {hasPermission('students:edit') && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenReopenModal(file, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 font-bold transition text-[11px] cursor-pointer"
                            title={language === 'ar' ? 'إعادة فتح الملف ونقله للوحة النشطة' : 'Reopen File'}
                          >
                            <RefreshCw className="w-3 h-3 text-orange-700" />
                            <span>{language === 'ar' ? 'إعادة فتح' : 'Reopen'}</span>
                          </button>
                        )}

                        {/* Dossier Link */}
                        <Link
                          to={`/students`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title={language === 'ar' ? 'الانتقال لملف الطالب' : 'View Student'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}

                {archivedFiles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      <Archive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-xs">
                        {language === 'ar' ? 'لا توجد ملفات مؤرشفة تطابق شروط البحث والفلاتر الحالية' : 'No archived files match the current criteria'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Modal 1: Transition File Status */}
      {selectedFileForTransition && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {language === 'ar' ? 'تحديث مرحلة الملف الأكاديمي' : 'Advance Lifecycle Stage'}
                </h3>
                <p className="text-[11px] text-white/80 mt-0.5">
                  {selectedFileForTransition.file_code} • {language === 'ar' ? selectedFileForTransition.student?.full_name_ar : selectedFileForTransition.student?.full_name_en}
                </p>
              </div>
              <button onClick={() => setSelectedFileForTransition(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transitionError && (
              <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{transitionError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransition} className="p-5 space-y-4 text-xs">
              
              {/* Current Status Display */}
              <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block">المرحلة الحالية</span>
                  <span className="font-extrabold text-slate-800 text-xs">
                    {t(`statuses.${selectedFileForTransition.current_status}`)}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 text-[10px] block">المالك الحالي</span>
                  <span className="font-bold text-bct-navy text-xs">
                    {selectedFileForTransition.current_owner?.full_name_ar}
                  </span>
                </div>
              </div>

              {/* Target Status Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'المرحلة المستهدفة الجديدة *' : 'Target Stage *'}
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as StudentFileStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-slate-800"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {language === 'ar' ? s.label_ar : s.label_en} (SLA: {language === 'ar' ? s.sla_ar : s.sla_en})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage 10 Evaluation Fields */}
              {targetStatus === 'closed' && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-xs">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{language === 'ar' ? 'تسجيل تقييم الأداء (مطلوب لبدء مهلة الـ 24 ساعة للأرشفة)' : 'Performance Evaluation (Required for 24h Auto-Archiving)'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        {language === 'ar' ? 'درجة التقييم (0 - 100) *' : 'Score (0 - 100) *'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={evalScoreInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEvalScoreInput(val);
                          const num = Number(val);
                          if (!isNaN(num)) {
                            if (num >= 90) setEvalRatingInput('ممتاز');
                            else if (num >= 80) setEvalRatingInput('جيد جداً');
                            else if (num >= 70) setEvalRatingInput('جيد');
                            else setEvalRatingInput('مقبول');
                          }
                        }}
                        placeholder="95"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        {language === 'ar' ? 'تصنيف التقييم' : 'Rating'}
                      </label>
                      <select
                        value={evalRatingInput}
                        onChange={(e) => setEvalRatingInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        <option value="ممتاز">ممتاز (Excellent)</option>
                        <option value="جيد جداً">جيد جداً (Very Good)</option>
                        <option value="جيد">جيد (Good)</option>
                        <option value="مقبول">مقبول (Acceptable)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      {language === 'ar' ? 'ملاحظات التقييم ورضا الطالب' : 'Evaluation Notes & Feedback'}
                    </label>
                    <textarea
                      rows={2}
                      value={evalNotesInput}
                      onChange={(e) => setEvalNotesInput(e.target.value)}
                      placeholder={language === 'ar' ? 'ملاحظات حول مستوى الخدمة وجودة وسرعة المعاملة...' : 'Notes on service quality and turnaround...'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* New Owner Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'تعيين مسؤول الملف الجديد (قاعدة المسؤول الواحد) *' : 'Assign Responsible Owner *'}
                </label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar} ({emp.position_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transition Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'ملاحظات الانتقال وسجل التدقيق' : 'Transition Audit Notes'}
                </label>
                <textarea
                  rows={2}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل أي ملاحظات تتعلق بسلامة المستندات أو حالة الطالب...' : 'Enter transition notes...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileForTransition(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark cursor-pointer"
                >
                  {language === 'ar' ? 'تأكيد الانتقال وتحديث المالك' : 'Confirm Stage Shift'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Activity & Ownership History Timeline Modal */}
      {selectedFileForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-bct-navy text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-white/10 text-bct-gold">
                    <History className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-extrabold">
                    {language === 'ar' ? 'سجل العمليات والموظفين وتاريخ الملكية' : 'Activity & Ownership History'}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/80">
                  <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white">
                    {selectedFileForHistory.file_code}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-white">
                    {language === 'ar' ? selectedFileForHistory.student?.full_name_ar : selectedFileForHistory.student?.full_name_en}
                  </span>
                  <span>•</span>
                  <span className="text-bct-gold font-medium">
                    {t(`statuses.${selectedFileForHistory.current_status}`)}
                  </span>
                  {selectedFileForHistory.is_archived && (
                    <span className="px-2 py-0.2 rounded-md bg-stone-300 text-stone-900 font-extrabold text-[10px]">
                      {language === 'ar' ? 'مؤرشف' : 'Archived'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/students`}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'ملف الطالب الكامل' : 'Student Dossier'}</span>
                </Link>

                <button 
                  onClick={() => setSelectedFileForHistory(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
                  title={t('actions.close')}
                  aria-label={t('actions.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              
              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'المسؤول الحالي عن الملف' : 'Current Responsible Owner'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs truncate" title={resolveEmployeeDisplayName(selectedFileForHistory.current_owner?.id, selectedFileForHistory.current_owner?.full_name_ar, language)}>
                    {resolveEmployeeDisplayName(selectedFileForHistory.current_owner?.id, selectedFileForHistory.current_owner?.full_name_ar, language)}
                  </div>
                  <span className="text-[9px] text-bct-gold font-bold block truncate">
                    {selectedFileForHistory.current_owner
                      ? bctStore.getEmployeeJobTitle(selectedFileForHistory.current_owner, language)
                      : (language === 'ar' ? 'غير مسند' : 'Unassigned')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'آخر إجراء بواسطة' : 'Last Action Performed By'}
                  </span>
                  <div className="font-extrabold text-bct-navy text-xs truncate" title={selectedFileForHistory.last_action_by_name}>
                    {selectedFileForHistory.last_action_by_name || resolveEmployeeDisplayName(selectedFileForHistory.current_owner?.id, selectedFileForHistory.current_owner?.full_name_ar, language) || '—'}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium block truncate">
                    {formatDateTime(selectedFileForHistory.last_action_at || selectedFileForHistory.last_updated_at)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'إجمالي العمليات المسجلة' : 'Total Audit Actions'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {historyActivities.length} {language === 'ar' ? 'إجراء موثق' : 'actions'}
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold block">
                    {language === 'ar' ? 'سجل غير قابل للتعديل' : 'Immutable Append-Only'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'تاريخ فتح الملف' : 'File Creation Date'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {formatDateTime(selectedFileForHistory.created_at).split(',')[0]}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium block">
                    {selectedFileForHistory.certificate_type} ({selectedFileForHistory.academic_percentage}%)
                  </span>
                </div>
              </div>

              {/* Closed Information Badge if File is Closed but not yet archived */}
              {selectedFileForHistory.current_status === 'closed' && !selectedFileForHistory.is_archived && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">
                      {language === 'ar' ? 'ملف مكتمل ومغلق' : 'Completed & Closed File'}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {language === 'ar' 
                        ? `تاريخ الإغلاق: ${formatClosedDateTime(bctStore.getFileClosedAt(selectedFileForHistory.id))}`
                        : `Closed At: ${formatClosedDateTime(bctStore.getFileClosedAt(selectedFileForHistory.id))}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Archive Information Badge if File is Archived */}
              {selectedFileForHistory.is_archived && (
                <div className="p-3 rounded-xl bg-stone-100 border border-stone-300 text-stone-900 flex items-start gap-2 text-xs">
                  <Archive className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">
                      {language === 'ar' ? 'ملف مؤرشف تلقائياً بواسطة النظام' : 'File Auto-Archived by System'}
                    </span>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      {language === 'ar' 
                        ? `تاريخ الإغلاق: ${formatClosedDateTime(bctStore.getFileClosedAt(selectedFileForHistory.id))} • تاريخ الأرشفة: ${formatDateTime(selectedFileForHistory.archived_at)} • بواسطة: ${selectedFileForHistory.archived_by}`
                        : `Closed At: ${formatClosedDateTime(bctStore.getFileClosedAt(selectedFileForHistory.id))} • Archived At: ${formatDateTime(selectedFileForHistory.archived_at)} • By: ${selectedFileForHistory.archived_by}`}
                    </p>
                    {selectedFileForHistory.archive_reason && (
                      <p className="text-[10px] text-stone-500 italic mt-0.5">
                        "{selectedFileForHistory.archive_reason}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Append-Only Administrative Note Form */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'ar' ? 'إضافة ملاحظة إدارية موثقة إلى سجل الملف' : 'Add Administrative Audit Note'}</span>
                  </div>
                  <span className="text-[10px] text-amber-700">
                    {language === 'ar' ? `الموثق: ${currentUser?.full_name_ar || currentUser?.username}` : `Actor: ${currentUser?.username}`}
                  </span>
                </div>

                <form onSubmit={handleAddAdminNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newAdminNote}
                    onChange={(e) => {
                      setNewAdminNote(e.target.value);
                      if (noteSubmitError) setNoteSubmitError('');
                    }}
                    placeholder={language === 'ar' 
                      ? 'اكتب ملاحظة أو توجيهاً إدارياً أو تحديثاً بخصوص الأوراق والقبول (سيتم تسجيل هويتك والتوقيت بدقة)...' 
                      : 'Write an administrative note or status update (your identity and timestamp will be permanently logged)...'}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />

                  {noteSubmitError && (
                    <p className="text-[11px] text-red-600 font-medium">{noteSubmitError}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>{language === 'ar' ? 'حفظ الملاحظة بالسجل' : 'Log Note in History'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Timeline Header */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'التسلسل الزمني الكامل للعمليات والمسؤوليات' : 'Chronological Activity & Ownership Timeline'}</span>
                </h4>
                <span className="text-[10px] text-slate-400">
                  {language === 'ar' ? 'الأحدث أولاً • هوية حقيقية من قاعدة البيانات' : 'Newest First • Database Authenticated'}
                </span>
              </div>

              {/* Timeline Feed */}
              <div className="relative border-s-2 border-slate-200 ms-3 space-y-4 ps-5">
                {historyActivities.map((act) => {
                  const eventMeta = getActionEventMeta(act.action_type, language);
                  const meta = ACTION_LABELS[act.action_type] || {
                    ar: getActionEventMeta(act.action_type, 'ar').label,
                    en: getActionEventMeta(act.action_type, 'en').label,
                    color: eventMeta.color
                  };

                  const isOwnerHandover = Boolean(
                    act.previous_owner_name && 
                    act.new_owner_name && 
                    act.previous_owner_name !== act.new_owner_name
                  );

                  const isStageChange = Boolean(
                    act.previous_stage && 
                    act.new_stage && 
                    act.previous_stage !== act.new_stage
                  );

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline Bullet */}
                      <span className="absolute -start-[27px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-bct-navy group-hover:scale-125 transition-transform" />

                      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition space-y-2">
                        {/* Top Line: Action Badge + Timestamp */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${meta.color}`}>
                            {language === 'ar' ? meta.ar : meta.en}
                          </span>

                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDateTime(act.timestamp)}</span>
                          </span>
                        </div>

                        {/* Actor Strip */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-slate-400 text-[11px]">
                            {language === 'ar' ? 'بواسطة الموظف:' : 'Performed by:'}
                          </span>
                          <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {resolveEmployeeDisplayName(act.actor_id, act.actor_name, language)}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-bct-navy font-semibold text-[11px]">
                            {resolveActorJobTitle(act, language)}
                          </span>
                          {act.actor_department && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 text-[11px]">
                                {resolveActorDepartment(act.actor_department, language, t)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Stage Transition Diff */}
                        {isStageChange && (
                          <div className="p-2 rounded-lg bg-white border border-purple-100 flex items-center gap-2 text-[11px] text-purple-900 font-medium">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="text-slate-500">{language === 'ar' ? 'انتقال المرحلة:' : 'Stage Shift:'}</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                              {t(`statuses.${act.previous_stage}`)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-purple-400" />
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-extrabold">
                              {t(`statuses.${act.new_stage}`)}
                            </span>
                          </div>
                        )}

                        {/* Ownership Handover Diff */}
                        {isOwnerHandover && (
                          <div className="p-2 rounded-lg bg-white border border-cyan-100 flex items-center gap-2 text-[11px] text-cyan-900 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                            <span className="text-slate-500">{language === 'ar' ? 'تسليم مسؤولية الملف:' : 'Ownership Transfer:'}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              {resolveEmployeeDisplayName(act.previous_owner_id, act.previous_owner_name, language)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-900 font-extrabold border border-cyan-200">
                              {resolveEmployeeDisplayName(act.new_owner_id, act.new_owner_name, language)}
                            </span>
                          </div>
                        )}

                        {/* Notes Box */}
                        {act.notes && (
                          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs italic">
                            <span className="font-bold not-italic text-slate-500 text-[10px] block mb-0.5">
                              {language === 'ar' ? 'ملاحظة الإجراء:' : 'Action Note:'}
                            </span>
                            "{act.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {historyActivities.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                    {language === 'ar' ? 'لا توجد إجراءات مسجلة في تاريخ هذا الملف بعد' : 'No activity records logged for this file yet'}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-400 text-[11px]">
                {language === 'ar' ? 'النظام يسجل كافة حركات النقل تلقائياً وفقاً للائحة الحوكمة BCT' : 'BCT Governance Engine: All state changes are automatically audited'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFileForHistory(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition cursor-pointer"
              >
                {t('actions.close')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: Quick Performance Evaluation Modal (Stage 10) */}
      {fileToEvaluate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-bct-gold fill-bct-gold" />
                <h3 className="text-sm font-extrabold">
                  {language === 'ar' ? 'تسجيل تقييم أداء الملف' : 'Record File Evaluation'}
                </h3>
              </div>
              <button onClick={() => setFileToEvaluate(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickEvalError && (
              <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{quickEvalError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteQuickEvaluation} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-mono text-[10px] text-slate-400 block">{fileToEvaluate.file_code}</span>
                <span className="font-extrabold text-slate-900 text-sm block">
                  {language === 'ar' ? fileToEvaluate.student?.full_name_ar : fileToEvaluate.student?.full_name_en}
                </span>
                <span className="text-[10px] text-bct-navy font-semibold block mt-0.5">
                  {fileToEvaluate.certificate_type} • {fileToEvaluate.academic_percentage}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'درجة التقييم (0 - 100) *' : 'Score (0 - 100) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={quickEvalScore}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setQuickEvalScore(num);
                      if (num >= 90) setQuickEvalRating('ممتاز');
                      else if (num >= 80) setQuickEvalRating('جيد جداً');
                      else if (num >= 70) setQuickEvalRating('جيد');
                      else setQuickEvalRating('مقبول');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'التصنيف' : 'Rating'}
                  </label>
                  <select
                    value={quickEvalRating}
                    onChange={(e) => setQuickEvalRating(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="ممتاز">ممتاز (Excellent)</option>
                    <option value="جيد جداً">جيد جداً (Very Good)</option>
                    <option value="جيد">جيد (Good)</option>
                    <option value="مقبول">مقبول (Acceptable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'ملاحظات التقييم ورضا الطالب' : 'Evaluation Notes'}
                </label>
                <textarea
                  rows={2}
                  value={quickEvalNotes}
                  onChange={(e) => setQuickEvalNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل ملاحظات حول مستوى الخدمة وسرعة الإنجاز...' : 'Enter feedback notes...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-extrabold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'ar' ? 'تنبيه الأرشفة التلقائية بعد 24 ساعة:' : '24-Hour Auto-Archiving Rule:'}</span>
                </span>
                <p className="text-[10px] text-amber-800">
                  {language === 'ar'
                    ? 'بمجرد اعتماد وحفظ التقييم، سيبدأ النظام احتساب مهلة الـ 24 ساعة لأرشفة هذا الملف تلقائياً ونقله إلى سجل الأرشيف.'
                    : 'Saving this evaluation triggers the 24-hour countdown, after which the file will be automatically archived.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFileToEvaluate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {language === 'ar' ? 'حفظ التقييم وبدء عداد الـ 24 ساعة' : 'Save & Start 24h Timer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Reopen Archived File Modal */}
      {fileToReopen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-bct-gold" />
                <h3 className="text-sm font-extrabold">
                  {language === 'ar' ? 'إعادة فتح ملف من الأرشيف' : 'Reopen Archived Student File'}
                </h3>
              </div>
              <button onClick={() => setFileToReopen(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reopenError && (
              <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{reopenError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteReopen} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">{fileToReopen.file_code}</span>
                  <span className="px-2 py-0.2 rounded bg-stone-200 text-stone-800 text-[10px] font-bold">
                    {language === 'ar' ? 'مؤرشف' : 'Archived'}
                  </span>
                </div>
                <span className="font-extrabold text-slate-900 text-sm block mt-1">
                  {language === 'ar' ? fileToReopen.student?.full_name_ar : fileToReopen.student?.full_name_en}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {language === 'ar' ? `تاريخ الأرشفة: ${formatDateTime(fileToReopen.archived_at)}` : `Archived At: ${formatDateTime(fileToReopen.archived_at)}`}
                </span>
              </div>

              {/* Actor Identity Notice */}
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] flex items-center justify-between">
                <span className="text-indigo-700 font-semibold">{language === 'ar' ? 'الموظف المسؤول عن إعادة الفتح:' : 'Authorized Actor:'}</span>
                <span className="font-extrabold text-indigo-950">
                  {currentUser?.full_name_ar || currentUser?.username}
                </span>
              </div>

              {/* Target Stage to Return to */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'المرحلة المستهدفة لعودة الملف *' : 'Target Stage to Reopen Into *'}
                </label>
                <select
                  value={reopenTargetStage}
                  onChange={(e) => setReopenTargetStage(e.target.value as StudentFileStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value="review">{language === 'ar' ? '4. مراجعة الأوراق (موصى به)' : '4. Document Review (Recommended)'}</option>
                  <option value="docs">{language === 'ar' ? '8. التوثيق والأصول' : '8. Docs & Handover'}</option>
                  <option value="submitted">{language === 'ar' ? '5. على المنصة' : '5. Submitted'}</option>
                  <option value="preliminary">{language === 'ar' ? '6. قبول مبدئي' : '6. Preliminary'}</option>
                  <option value="stage2">{language === 'ar' ? '7. سداد مرحلة 2' : '7. Stage 2 Payment'}</option>
                  <option value="final">{language === 'ar' ? '9. قبول نهائي' : '9. Final Admission'}</option>
                  <option value="registered">{language === 'ar' ? '3. مسجل ومسدد' : '3. Registered & Paid'}</option>
                  <option value="qualified">{language === 'ar' ? '2. مؤهل' : '2. Qualified'}</option>
                  <option value="new">{language === 'ar' ? '1. جديد' : '1. New'}</option>
                </select>
              </div>

              {/* Mandatory Reopening Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'سبب إعادة فتح الملف (إلزامي للتدقيق والامتثال) *' : 'Reason for Reopening (Mandatory) *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={reopenReason}
                  onChange={(e) => {
                    setReopenReason(e.target.value);
                    if (reopenError) setReopenError('');
                  }}
                  placeholder={language === 'ar' 
                    ? 'اكتب سبباً تفصيلياً لإعادة فتح الملف (مثال: طلب الطالب تعديل الرغبة الجامعية، وصول مستندات إضافية، تعديل المسار)...' 
                    : 'Detail the reason for reopening this archived file (e.g. choice modification, extra documentation)...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFileToReopen(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  {language === 'ar' ? 'تأكيد إعادة الفتح والعودة للوحة' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
