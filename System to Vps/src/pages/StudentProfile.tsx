import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { getActionEventMeta } from '../services/actionEventService';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { 
  resolveEmployeeDisplayName, 
  resolveActorJobTitle, 
  resolveActorDepartment 
} from '../utils/activityFormatting';
import { 
  searchUniversities, 
  getFacultiesByUniversity, 
  getSpecializationsByFaculty, 
  normalizeAcademicSearch 
} from '../services/universityCatalog';
import { 
  University, 
  UniversityFaculty, 
  StudentChoice, 
  AcademicSpecialization, 
  UniversityType,
  StudentDocument,
  Student,
  StudentFile,
  PaymentRecord,
  LIFECYCLE_STAGE_DEFINITIONS
} from '../types/database.types';
import { formatFileCreationDate } from '../utils/dateUtils';
import {
  REQUIRED_DOCUMENT_CATEGORIES,
  saveDocumentBlob,
  deleteDocumentBlob,
  downloadSingleDocument,
  downloadBlob,
  generateStudentDossierZip,
  downloadStudentDossierZipFromServer,
  formatFileSize,
  formatDocumentDateTime
} from '../services/documentStorageService';
import { 
  GraduationCap, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  User, 
  UserCheck,
  Phone, 
  Mail, 
  BookOpen, 
  Receipt, 
  AlertCircle,
  Plus,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  Building,
  Check,
  AlertTriangle,
  History,
  MessageSquare,
  Send,
  ArrowRightLeft,
  Edit3,
  Globe,
  MapPin,
  Award,
  ExternalLink,
  Loader2,
  Archive,
  Lock,
  Star,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';

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
  FILE_CLOSED: { ar: 'إغلاق الملف والتقييم', en: 'File Closed', color: 'bg-slate-200 text-slate-800 border-slate-300' },
  FILE_EVALUATED: { ar: 'تقييم أداء الملف', en: 'File Evaluated', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  FILE_ARCHIVED: { ar: 'أرشفة تلقائية (نظام)', en: 'File Auto-Archived', color: 'bg-stone-200 text-stone-800 border-stone-300' },
  FILE_REOPENED: { ar: 'إعادة فتح الملف', en: 'File Reopened', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  CHOICES_UPDATED: { ar: 'تحديث الرغبات الجامعية', en: 'Choices Updated', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  NOTE_ADDED: { ar: 'ملاحظة إدارية', en: 'Administrative Note', color: 'bg-amber-50 text-amber-900 border-amber-300' },
  STATUS_UPDATED: { ar: 'تحديث الحالة', en: 'Status Updated', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ADMIN_CORRECTION: { ar: 'تصحيح إداري', en: 'Admin Correction', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  STUDENT_INFO_UPDATED: { ar: 'تحديث بيانات الطالب', en: 'Student Info Updated', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
};

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedFileId = searchParams.get('fileId');
  const navigate = useNavigate();
  const { t, language, isRtl } = useLanguage();
  const { currentUser, hasPermission } = useAuth();

  // Reactive store synchronization
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return bctStore.subscribe(() => setStoreVersion(v => v + 1));
  }, []);

  // Unified resolution of student and file
  const { student, primaryFile, studentFiles: files } = useMemo(() => {
    return bctStore.resolveStudentAndFile(id || '', requestedFileId);
  }, [id, requestedFileId, storeVersion]);

  // Strictly file-scoped payments (isolated per application)
  const payments = useMemo(() => {
    if (!primaryFile) return [];
    return bctStore.getPayments().filter(p => p.student_file_id === primaryFile.id);
  }, [primaryFile, storeVersion]);

  // All payments belonging to this student across all files
  const allStudentPayments = useMemo(() => {
    if (!student) return [];
    return bctStore.getPayments().filter(p => p.student_id === student.id);
  }, [student, storeVersion]);

  const [showAllStudentPayments, setShowAllStudentPayments] = useState(false);

  // Strictly file-scoped documents (isolated per application)
  const documents = useMemo(() => {
    if (!primaryFile) return [];
    return bctStore.getStudentDocuments(primaryFile.id);
  }, [primaryFile, storeVersion]);

  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<StudentDocument | null>(null);
  const [documentActionError, setDocumentActionError] = useState<string | null>(null);
  const [documentActionSuccess, setDocumentActionSuccess] = useState<string | null>(null);
  const downloadLockRef = useRef(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'choices' | 'documents' | 'finance' | 'history'>('overview');
  
  // University Choice Modals & State
  const allUniversities = useMemo(() => bctStore.getUniversities(), [storeVersion]);
  const [isAddChoiceModalOpen, setIsAddChoiceModalOpen] = useState(false);
  const [editingChoiceOrder, setEditingChoiceOrder] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // University catalog cascading state with search debouncing
  const [selectedUnivId, setSelectedUnivId] = useState<string>('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedSpecId, setSelectedSpecId] = useState<string>('');
  const [univSearchQuery, setUnivSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [univTypeFilter, setUnivTypeFilter] = useState<string>('all');
  const [facultySearchQuery, setFacultySearchQuery] = useState('');
  const [facultyGenderFilter, setFacultyGenderFilter] = useState<string>('all');
  const [facultyCampusFilter, setFacultyCampusFilter] = useState<string>('all');
  const [programSearchQuery, setProgramSearchQuery] = useState('');
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [deleteCandidateOrder, setDeleteCandidateOrder] = useState<number | null>(null);

  // Debounce search query to prevent synchronous thread blocking on keystrokes
  useEffect(() => {
    if (univSearchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedSearchQuery(univSearchQuery);
        setIsSearching(false);
      }, 180);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [univSearchQuery, debouncedSearchQuery]);

  const isSelectedFileArchived = Boolean(
    primaryFile && (primaryFile.is_archived || (primaryFile.current_status as any) === 'archived')
  );

  const selectedFileClosedAt = useMemo(() => {
    if (!primaryFile) return undefined;
    return bctStore.getFileClosedAt(primaryFile.id) || primaryFile.closed_at;
  }, [primaryFile, storeVersion]);

  const choices: StudentChoice[] = useMemo(() => primaryFile?.university_choices || [], [primaryFile]);
  const activities = useMemo(() => primaryFile ? bctStore.getFileActivities(primaryFile.id) : [], [primaryFile, storeVersion]);

  const canEditDocuments = !isSelectedFileArchived && (
    hasPermission('students:edit') || 
    currentUser?.roles?.includes('super_admin') || 
    currentUser?.roles?.includes('operations_manager') || 
    currentUser?.roles?.includes('consultant') || 
    currentUser?.roles?.includes('apply_officer') || 
    currentUser?.roles?.includes('branch_general_manager') || 
    currentUser?.username === 'admin'
  );

  const studentDocuments = useMemo(() => {
    if (!primaryFile) return [];
    return documents.filter(d => d.student_file_id === primaryFile.id);
  }, [documents, primaryFile]);

  const uploadedCategoriesCount = useMemo(() => {
    return REQUIRED_DOCUMENT_CATEGORIES.filter(cat => 
      studentDocuments.some(d => d.document_type === cat.key)
    ).length;
  }, [studentDocuments]);

  const totalUploadedFilesCount = studentDocuments.length;

  const handleFileUpload = async (
    categoryKey: string,
    fileList: FileList | null,
    replaceDocId?: string
  ) => {
    if (!fileList || fileList.length === 0 || !primaryFile || !student) return;
    setDocumentActionError(null);
    setDocumentActionSuccess(null);
    setUploadingCategory(categoryKey);

    const categoryDef = REQUIRED_DOCUMENT_CATEGORIES.find(c => c.key === categoryKey);
    const categoryTitle = language === 'ar' ? (categoryDef?.titleAr || categoryKey) : (categoryDef?.titleEn || categoryKey);

    try {
      const allowedExtensions = categoryDef?.allowedFormats || ['.pdf', '.jpg', '.jpeg', '.png'];
      const maxSizeBytes = categoryDef?.maxSizeBytes || 15 * 1024 * 1024;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(ext)) {
          setDocumentActionError(
            language === 'ar'
              ? `صيغة الملف "${file.name}" غير مدعومة. الصيغ المقبولة: ${allowedExtensions.join(', ')}`
              : `File format for "${file.name}" is unsupported. Accepted: ${allowedExtensions.join(', ')}`
          );
          setUploadingCategory(null);
          return;
        }

        if (file.size > maxSizeBytes) {
          setDocumentActionError(
            language === 'ar'
              ? `حجم الملف "${file.name}" يتجاوز الحد الأقصى المسموح به (${formatFileSize(maxSizeBytes)})`
              : `File size for "${file.name}" exceeds maximum allowed limit (${formatFileSize(maxSizeBytes)})`
          );
          setUploadingCategory(null);
          return;
        }

        const docId = replaceDocId || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const storagePath = `storage://bct-files/${student.id}/${primaryFile.file_code}/${categoryKey}/${docId}_${file.name}`;
        await saveDocumentBlob(storagePath, file);

        const uploaderName = currentUser?.full_name_ar || currentUser?.username || 'مستخدم النظام';
        const uploaderUsername = currentUser?.username || 'system';

        if (replaceDocId) {
          const oldDoc = documents.find(d => d.id === replaceDocId);
          bctStore.updateStudentDocument(replaceDocId, {
            file_name: file.name,
            file_storage_path: storagePath,
            file_size_bytes: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_at: new Date().toISOString(),
            uploaded_by: uploaderUsername,
            uploader_name: uploaderName,
            previous_file_name: oldDoc?.file_name,
            is_replaced: true
          }, uploaderUsername);

          bctStore.recordFileActivity({
            student_file_id: primaryFile.id,
            action_type: 'DOCUMENTS_VERIFIED',
            notes: language === 'ar'
              ? `استبدال مستند: تم استبدال "${oldDoc?.file_name}" بالملف الجديد "${file.name}" ضمن ${categoryTitle}`
              : `Document replaced: "${oldDoc?.file_name}" replaced with "${file.name}" under ${categoryTitle}`,
            previous_stage: primaryFile.current_status,
            new_stage: primaryFile.current_status,
            new_owner_id: primaryFile.current_owner_id
          }, uploaderUsername);

          setDocumentActionSuccess(
            language === 'ar'
              ? `تم استبدال المستند بنجاح بالملف "${file.name}"`
              : `Document replaced successfully with "${file.name}"`
          );
        } else {
          bctStore.addStudentDocument({
            id: docId,
            student_file_id: primaryFile.id,
            student_id: student.id,
            document_type: categoryKey,
            title: categoryTitle,
            file_name: file.name,
            file_storage_path: storagePath,
            file_size_bytes: file.size,
            mime_type: file.type || 'application/octet-stream',
            verification_status: 'pending',
            uploaded_by: uploaderUsername,
            uploader_name: uploaderName,
            uploaded_at: new Date().toISOString(),
          }, uploaderUsername);

          bctStore.recordFileActivity({
            student_file_id: primaryFile.id,
            action_type: 'DOCUMENTS_VERIFIED',
            notes: language === 'ar'
              ? `رفع مستند جديد: تم رفع "${file.name}" ضمن ${categoryTitle}`
              : `New document uploaded: "${file.name}" under ${categoryTitle}`,
            previous_stage: primaryFile.current_status,
            new_stage: primaryFile.current_status,
            new_owner_id: primaryFile.current_owner_id
          }, uploaderUsername);

          setDocumentActionSuccess(
            language === 'ar'
              ? `تم رفع المستند "${file.name}" بنجاح وحفظه في السجل`
              : `Document "${file.name}" uploaded successfully`
          );
        }
      }
    } catch (err: any) {
      setDocumentActionError(err?.message || (language === 'ar' ? 'حدث خطأ أثناء رفع المستند' : 'Error uploading document'));
    } finally {
      setUploadingCategory(null);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deleteConfirmDoc || !primaryFile || !student) return;
    const doc = deleteConfirmDoc;
    setDeleteConfirmDoc(null);
    setDocumentActionError(null);
    setDocumentActionSuccess(null);

    try {
      const uploaderUsername = currentUser?.username || 'system';
      await deleteDocumentBlob(doc.file_storage_path);
      bctStore.deleteStudentDocument(doc.id, uploaderUsername);

      const categoryDef = REQUIRED_DOCUMENT_CATEGORIES.find(c => c.key === doc.document_type);
      const categoryTitle = language === 'ar' ? (categoryDef?.titleAr || doc.document_type) : (categoryDef?.titleEn || doc.document_type);

      bctStore.recordFileActivity({
        student_file_id: primaryFile.id,
        action_type: 'DOCUMENTS_VERIFIED',
        notes: language === 'ar'
          ? `حذف مستند: تم حذف المستند "${doc.file_name}" من قسم ${categoryTitle}`
          : `Document deleted: "${doc.file_name}" removed from ${categoryTitle}`,
        previous_stage: primaryFile.current_status,
        new_stage: primaryFile.current_status,
        new_owner_id: primaryFile.current_owner_id
      }, uploaderUsername);

      setDocumentActionSuccess(
        language === 'ar'
          ? `تم حذف المستند "${doc.file_name}" بنجاح وتحديث قائمة الفحص`
          : `Document "${doc.file_name}" deleted successfully`
      );
    } catch (err: any) {
      setDocumentActionError(err?.message || (language === 'ar' ? 'فشل حذف المستند' : 'Failed to delete document'));
    }
  };

  const handleDownloadAllZip = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. Strict synchronous concurrency lock (prevents double-clicks & duplicate download requests)
    if (downloadLockRef.current || isDownloadingArchive) {
      console.warn('ZIP download already in progress. Ignoring duplicate trigger.');
      return;
    }

    if (!primaryFile || !student) return;
    setDocumentActionError(null);
    setDocumentActionSuccess(null);

    const studentDocs = studentDocuments;
    if (studentDocs.length === 0) {
      setDocumentActionError(
        language === 'ar'
          ? 'لا توجد مستندات مرفوعة لهذا الطالب حتى الآن لتنزيلها.'
          : 'No documents have been uploaded for this student yet.'
      );
      return;
    }

    // Lock immediately
    downloadLockRef.current = true;
    setIsDownloadingArchive(true);

    try {
      const uploaderUsername = currentUser?.username || 'system';

      // 2. Request authenticated, same-origin ZIP download from server
      await downloadStudentDossierZipFromServer(
        primaryFile.file_code,
        student.id,
        studentDocs,
        undefined,
        uploaderUsername
      );

      // 3. Record audit log
      bctStore.addAuditLog(
        uploaderUsername,
        'STUDENT_DOCUMENT_DOWNLOAD_ALL',
        'student_file',
        primaryFile.id,
        {
          file_code: primaryFile.file_code,
          student_id: student.id,
          documents_count: studentDocs.length,
          downloaded_at: new Date().toISOString()
        }
      );

      setDocumentActionSuccess(
        language === 'ar'
          ? `تم تجهيز وتنزيل أرشيف المستندات (${primaryFile.file_code}.zip) بنجاح (${studentDocs.length} ملفات)`
          : `Document archive (${primaryFile.file_code}.zip) downloaded successfully (${studentDocs.length} files)`
      );
    } catch (err: any) {
      console.warn('Server download endpoint failed or unavailable, using client-side fallback:', err);
      // Fallback to client-side ZIP generator if server endpoint is offline
      try {
        const { blob, filename, fileCount } = await generateStudentDossierZip(
          primaryFile.file_code,
          studentDocs
        );

        downloadBlob(blob, filename);

        const uploaderUsername = currentUser?.username || 'system';
        bctStore.addAuditLog(
          uploaderUsername,
          'STUDENT_DOCUMENT_DOWNLOAD_ALL',
          'student_file',
          primaryFile.id,
          {
            file_code: primaryFile.file_code,
            student_id: student.id,
            documents_count: fileCount,
            downloaded_at: new Date().toISOString()
          }
        );

        setDocumentActionSuccess(
          language === 'ar'
            ? `تم تجهيز وتنزيل أرشيف المستندات (${filename}) بنجاح (${fileCount} ملفات)`
            : `Document archive (${filename}) downloaded successfully (${fileCount} files)`
        );
      } catch (fallbackErr: any) {
        setDocumentActionError(fallbackErr?.message || (language === 'ar' ? 'فشل إنشاء وتنزيل أرشيف الملفات' : 'Failed to generate and download archive'));
      }
    } finally {
      // Re-enable button and release concurrency lock
      downloadLockRef.current = false;
      setIsDownloadingArchive(false);
    }
  };
  
  const [profileNote, setProfileNote] = useState('');
  const [profileNoteError, setProfileNoteError] = useState('');

  const formatActivityDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
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

  const handleAddProfileNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile || isSelectedFileArchived) return;
    if (!profileNote.trim()) {
      setProfileNoteError(language === 'ar' ? 'يرجى كتابة نص الملاحظة الإدارية' : 'Please enter note text');
      return;
    }
    const created = bctStore.addFileNote(
      primaryFile.id,
      profileNote.trim(),
      currentUser?.username || 'admin'
    );
    if (created) {
      setProfileNote('');
      setProfileNoteError('');
    }
  };

  // Filtered universities based on debounced search and classification
  const filteredUniversities = useMemo(() => {
    return searchUniversities(allUniversities, {
      query: debouncedSearchQuery,
      type: univTypeFilter !== 'all' ? univTypeFilter : undefined
    });
  }, [allUniversities, debouncedSearchQuery, univTypeFilter]);

  // Selected University object
  const currentUniv = useMemo(() => {
    if (selectedUnivId) {
      const match = allUniversities.find((u: University) => u.id === selectedUnivId);
      if (match) return match;
    }
    return filteredUniversities[0] || allUniversities[0];
  }, [allUniversities, selectedUnivId, filteredUniversities]);

  // Available campuses for the selected university
  const availableCampuses = useMemo(() => {
    const targetUnivId = selectedUnivId || currentUniv?.id;
    if (!targetUnivId) return [];
    return bctStore.getCampuses(targetUnivId);
  }, [selectedUnivId, currentUniv?.id]);

  // Available faculties for the selected university (Lazy on-demand querying)
  const availableFaculties = useMemo(() => {
    const targetUnivId = selectedUnivId || currentUniv?.id;
    if (!targetUnivId) return [];
    return bctStore.getFaculties(targetUnivId);
  }, [selectedUnivId, currentUniv?.id]);

  // Filtered faculties according to search query, campus filter, and gender filter
  const filteredFaculties = useMemo(() => {
    return bctStore.searchFaculties(availableFaculties, facultySearchQuery, facultyCampusFilter, facultyGenderFilter);
  }, [availableFaculties, facultySearchQuery, facultyCampusFilter, facultyGenderFilter]);

  // Selected Faculty object
  const currentFaculty = useMemo(() => {
    if (selectedFacultyId) {
      const matchInFiltered = filteredFaculties.find((f: UniversityFaculty) => f.id === selectedFacultyId);
      if (matchInFiltered) return matchInFiltered;
      if (!facultySearchQuery && facultyCampusFilter === 'all' && facultyGenderFilter === 'all') {
        const matchInAvail = availableFaculties.find((f: UniversityFaculty) => f.id === selectedFacultyId);
        if (matchInAvail) return matchInAvail;
      }
    }
    return filteredFaculties[0] || availableFaculties[0];
  }, [availableFaculties, filteredFaculties, selectedFacultyId, facultySearchQuery, facultyCampusFilter, facultyGenderFilter]);

  // Available specializations for the selected faculty (Lazy on-demand querying)
  const availableSpecializations = useMemo(() => {
    const targetFacId = currentFaculty?.id || selectedFacultyId;
    if (!targetFacId) return [];
    return bctStore.getSpecializations(targetFacId);
  }, [selectedFacultyId, currentFaculty?.id]);

  // Filtered specializations according to search query
  const filteredSpecializations = useMemo(() => {
    return bctStore.searchSpecializations(availableSpecializations, programSearchQuery);
  }, [availableSpecializations, programSearchQuery]);

  // Selected Specialization object
  const currentSpecialization = useMemo(() => {
    if (selectedSpecId) {
      const matchInFiltered = filteredSpecializations.find((s: AcademicSpecialization) => s.id === selectedSpecId);
      if (matchInFiltered) return matchInFiltered;
      if (!programSearchQuery) {
        const matchInAvail = availableSpecializations.find((s: AcademicSpecialization) => s.id === selectedSpecId);
        if (matchInAvail) return matchInAvail;
      }
    }
    return filteredSpecializations[0] || availableSpecializations[0];
  }, [availableSpecializations, filteredSpecializations, selectedSpecId, programSearchQuery]);

  // Cascading Selection Handlers - Controlled transitions without cyclic effects
  const handleSelectUniversity = (univId: string) => {
    setSelectedUnivId(univId);
    setFacultySearchQuery('');
    setFacultyGenderFilter('all');
    setFacultyCampusFilter('all');
    setProgramSearchQuery('');
    const facs = bctStore.getFaculties(univId);
    const firstFac = facs[0];
    if (firstFac) {
      setSelectedFacultyId(firstFac.id);
      const specs = bctStore.getSpecializations(firstFac.id);
      setSelectedSpecId(specs[0]?.id || '');
    } else {
      setSelectedFacultyId('');
      setSelectedSpecId('');
    }
    setChoiceError(null);
  };

  const handleSelectFaculty = (facId: string) => {
    setSelectedFacultyId(facId);
    setProgramSearchQuery('');
    const specs = bctStore.getSpecializations(facId);
    setSelectedSpecId(specs[0]?.id || '');
    setChoiceError(null);
  };

  const handleSelectSpecialization = (specId: string) => {
    setSelectedSpecId(specId);
    setChoiceError(null);
  };

  if (!student) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">الملف غير موجود</h3>
        <p className="text-xs text-slate-500 mt-1">تعذر العثور على سجل الطالب المطلوب.</p>
        <Link to="/students" className="mt-4 inline-block text-xs font-bold text-bct-navy hover:underline">
          العودة لدليل الطلاب
        </Link>
      </div>
    );
  }

  const handleOpenAddChoice = () => {
    if (isSelectedFileArchived) return;
    setEditingChoiceOrder(null);
    setChoiceError(null);
    setUnivSearchQuery('');
    setDebouncedSearchQuery('');
    setUnivTypeFilter('all');
    setFacultySearchQuery('');
    setFacultyGenderFilter('all');
    setFacultyCampusFilter('all');
    setProgramSearchQuery('');
    setIsSaving(false);

    if (allUniversities.length > 0) {
      const firstUniv = allUniversities[0];
      setSelectedUnivId(firstUniv.id);
      const facs = bctStore.getFaculties(firstUniv.id);
      const firstFac = facs[0];
      if (firstFac) {
        setSelectedFacultyId(firstFac.id);
        const specs = bctStore.getSpecializations(firstFac.id);
        setSelectedSpecId(specs[0]?.id || '');
      } else {
        setSelectedFacultyId('');
        setSelectedSpecId('');
      }
    }
    setIsAddChoiceModalOpen(true);
  };

  const handleOpenEditChoice = (choice: StudentChoice) => {
    setEditingChoiceOrder(choice.order);
    setChoiceError(null);
    setUnivSearchQuery('');
    setDebouncedSearchQuery('');
    setUnivTypeFilter('all');
    setFacultySearchQuery('');
    setFacultyGenderFilter('all');
    setFacultyCampusFilter('all');
    setProgramSearchQuery('');
    setIsSaving(false);

    const univ = (choice.university_id && allUniversities.find(u => u.id === choice.university_id)) ||
                 allUniversities.find(u => u.name_ar === choice.university_ar || u.name_en === choice.university_en) ||
                 allUniversities[0];

    if (univ) {
      setSelectedUnivId(univ.id);
      const facs = bctStore.getFaculties(univ.id);
      const fac = (choice.faculty_id && facs.find(f => f.id === choice.faculty_id)) ||
                  facs.find(f => f.name_ar === choice.faculty_ar || f.name_en === choice.faculty_en) ||
                  facs[0];
      if (fac) {
        setSelectedFacultyId(fac.id);
        const specs = bctStore.getSpecializations(fac.id);
        const spec = (choice.specialization_id && specs.find(s => s.id === choice.specialization_id)) ||
                     specs.find(s => s.name_ar === choice.specialization_ar || s.name_en === choice.specialization_en) ||
                     specs[0];
        setSelectedSpecId(spec?.id || '');
      } else {
        setSelectedFacultyId('');
        setSelectedSpecId('');
      }
    }
    setIsAddChoiceModalOpen(true);
  };

  const handleSaveChoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!primaryFile) return;

    if (!currentUniv || !currentFaculty) {
      setChoiceError(isRtl ? 'يرجى اختيار الجامعة والكلية' : 'Please select both university and faculty');
      return;
    }

    setIsSaving(true);
    setChoiceError(null);

    // Yield control to let React paint the loading spinner without freezing the browser
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      const specAr = currentSpecialization?.name_ar || currentFaculty.specialization_ar || currentFaculty.name_ar;
      const specEn = currentSpecialization?.name_en || currentFaculty.specialization_en || currentFaculty.name_en;

      // Check duplicate
      const isDuplicate = choices.some(c => {
        if (editingChoiceOrder !== null && c.order === editingChoiceOrder) return false;
        const sameUniv = (currentUniv.id && c.university_id)
          ? c.university_id === currentUniv.id
          : c.university_ar === currentUniv.name_ar;
        const sameFac = (currentFaculty.id && c.faculty_id)
          ? c.faculty_id === currentFaculty.id
          : c.faculty_ar === currentFaculty.name_ar;
        if (!sameUniv || !sameFac) return false;
        if (c.specialization_ar && specAr) {
          return c.specialization_ar === specAr;
        }
        return true;
      });

      if (isDuplicate) {
        setChoiceError(
          isRtl 
            ? 'هذه الرغبة (الجامعة والكلية والتخصص) مضافة بالفعل في قائمة رغبات الطالب'
            : 'This preference is already in the student preference list'
        );
        setIsSaving(false);
        return;
      }

      const choicePayload = {
        university_ar: currentUniv.name_ar,
        university_en: currentUniv.name_en,
        faculty_ar: currentFaculty.name_ar,
        faculty_en: currentFaculty.name_en,
        specialization_ar: specAr,
        specialization_en: specEn,
        university_id: currentUniv.id,
        faculty_id: currentFaculty.id,
        specialization_id: currentSpecialization?.id,
        degree_ar: currentSpecialization?.degree_ar || 'بكالوريوس / ليسانس',
        program_type_ar: currentSpecialization?.program_type_ar || 'برنامج معتمد',
        university_type: currentUniv.type,
        governorate_ar: currentFaculty.governorate_ar || currentUniv.governorate_ar,
        campus_name_ar: currentFaculty.campus_name_ar || '',
        gender_type_ar: currentFaculty.gender_type_ar || (currentFaculty.gender_type === 'male' ? 'بنين' : currentFaculty.gender_type === 'female' ? 'بنات' : 'مشترك')
      };

      if (editingChoiceOrder !== null) {
        const ok = bctStore.updateUniversityPreference(
          primaryFile.id,
          editingChoiceOrder,
          choicePayload,
          currentUser?.username || 'admin'
        );
        if (!ok) {
          setChoiceError(isRtl ? 'تعذر تحديث الرغبة (قد تكون مكررة مع رغبة مسجلة أخرى)' : 'Failed to update preference');
          setIsSaving(false);
          return;
        }
      } else {
        const res = bctStore.addUniversityPreference(
          primaryFile.id,
          choicePayload,
          currentUser?.username || 'admin'
        );
        if (!res.success) {
          setChoiceError(res.message || 'Failed to add choice');
          setIsSaving(false);
          return;
        }
      }

      setIsAddChoiceModalOpen(false);
      setEditingChoiceOrder(null);
      setChoiceError(null);
    } catch (err: any) {
      console.error('Error saving choice:', err);
      setChoiceError(err?.message || (isRtl ? 'حدث خطأ غير متوقع أثناء الحفظ' : 'An unexpected error occurred while saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveChoice = (order: number, direction: 'up' | 'down') => {
    if (!primaryFile) return;
    const current = [...choices];
    const index = current.findIndex(c => c.order === order);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;
    const reordered = current.map((c, i) => ({ ...c, order: i + 1 }));
    bctStore.reorderUniversityPreferences(primaryFile.id, reordered, currentUser?.username || 'admin');
  };

  const handleDeleteChoice = (order: number) => {
    if (!primaryFile || isSelectedFileArchived) return;
    bctStore.deleteUniversityPreference(primaryFile.id, order, currentUser?.username || 'admin');
    setDeleteCandidateOrder(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/students" className="text-xs font-bold text-slate-500 hover:text-bct-navy flex items-center gap-1">
          {language === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{language === 'ar' ? 'العودة لدليل الطلاب' : 'Back to Students CRM'}</span>
        </Link>
      </div>

      {/* Student Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-md ${
            isSelectedFileArchived ? 'bg-stone-700' : 'bg-bct-navy'
          }`}>
            {student.full_name_ar.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">
                {language === 'ar' ? student.full_name_ar : student.full_name_en}
              </h2>
              <span className="font-mono text-[11px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                {student.student_code}
              </span>
              {primaryFile && (
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                  isSelectedFileArchived
                    ? 'bg-stone-100 text-stone-800 border-stone-300'
                    : 'bg-blue-50 text-bct-navy border-blue-200'
                }`}>
                  {primaryFile.file_code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {student.nationality} • {student.residence_country} • {isRtl ? 'الجواز:' : 'Passport:'} <span className="font-mono font-bold text-slate-700">{student.passport_number}</span>
            </p>
          </div>
        </div>

        {/* Primary Stage Badge & Quick Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {primaryFile && (
            <div className="text-end">
              <span className="text-[10px] text-slate-400 block font-medium">
                {isSelectedFileArchived
                  ? (isRtl ? 'الحالة والمرحلة النهائية' : 'Archive Status & Final Stage')
                  : (isRtl ? 'المرحلة الحالية' : 'Current Stage')}
              </span>
              {isSelectedFileArchived ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-900 border border-stone-300 mt-0.5">
                  <Archive className="w-3.5 h-3.5 text-stone-700" />
                  <span>{language === 'ar' ? `مؤرشف • ${t(`statuses.${primaryFile.current_status}`)}` : `Archived • ${t(`statuses.${primaryFile.current_status}`)}`}</span>
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-bct-surface text-bct-navy border border-slate-200 mt-0.5">
                  {t(`statuses.${primaryFile.current_status}`)}
                </span>
              )}
            </div>
          )}

          {isSelectedFileArchived ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-stone-600" />
              <span>{language === 'ar' ? 'للقراءة فقط' : 'Read-Only'}</span>
            </span>
          ) : (
            hasPermission('students:edit') && (
              <Link
                to="/pipeline"
                className="px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm"
              >
                {language === 'ar' ? 'تحديث المسار' : 'Advance Stage'}
              </Link>
            )
          )}
        </div>
      </div>



      {/* Read-Only Archived File Banner */}
      {primaryFile && isSelectedFileArchived && (
        <div className="bg-stone-50 rounded-2xl border border-stone-300 shadow-xs p-4 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
            <div className="flex items-center gap-2 font-extrabold text-stone-900">
              <Archive className="w-4 h-4 text-stone-700 shrink-0" />
              <span>
                {language === 'ar'
                  ? 'ملف مؤرشف — وضع العرض للقراءة فقط (تُحفظ حالة الأرشفة وتواريخ الإغلاق والأرشفة دون تعديل)'
                  : 'Archived File — Read-Only View (Archived status and original timestamps are preserved)'}
              </span>
            </div>
            {primaryFile.evaluation_score != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold shrink-0">
                <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>{primaryFile.evaluation_score}% ({primaryFile.evaluation_rating || 'ممتاز'})</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-white p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 block font-bold">{language === 'ar' ? 'المرحلة النهائية:' : 'Final Stage:'}</span>
              <span className="font-bold text-slate-800">{t(`statuses.${primaryFile.current_status}`)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 block font-bold">{language === 'ar' ? 'تاريخ الإغلاق:' : 'Closing Date:'}</span>
              <span className="font-bold text-slate-800">{formatActivityDateTime(selectedFileClosedAt)}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-500 block font-bold">{language === 'ar' ? 'تاريخ الأرشفة:' : 'Archive Date:'}</span>
              <span className="font-bold text-stone-800">{formatActivityDateTime(primaryFile.archived_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'overview', label_ar: 'البيانات الشخصية والأكاديمية', label_en: 'Academic Overview' },
          { key: 'choices', label_ar: `الرغبات الجامعية (${choices.length}/10)`, label_en: `University Choices (${choices.length}/10)` },
          { key: 'documents', label_ar: 'المستندات وقائمة الفحص', label_en: 'Documents' },
          { key: 'finance', label_ar: `السجل المالي (${payments.length})`, label_en: `Finance (${payments.length})` },
          { key: 'history', label_ar: `سجل العمليات والموظفين (${activities.length})`, label_en: `Activity & Ownership (${activities.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-bct-navy text-bct-navy'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {language === 'ar' ? tab.label_ar : tab.label_en}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Data'}
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">{isRtl ? 'الاسم بالعربية:' : 'Arabic Name:'}</span>
                <span className="font-bold text-slate-800">{student.full_name_ar}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'الاسم بالإنجليزية:' : 'English Name:'}</span>
                <span className="font-bold text-slate-800">{student.full_name_en}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'الجنسية:' : 'Nationality:'}</span>
                <span className="font-bold text-slate-800">{student.nationality}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'بلد الإقامة:' : 'Country of Residence:'}</span>
                <span className="font-bold text-slate-800">{student.residence_country}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'رقم الجواز:' : 'Passport Number:'}</span>
                <span className="font-mono font-bold text-slate-800">{student.passport_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'صلاحية الجواز:' : 'Passport Expiry:'}</span>
                <span className="font-bold text-slate-800">{student.passport_expiry_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'رقم الهاتف:' : 'Phone:'}</span>
                <span className="font-bold text-slate-800">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isRtl ? 'رقم الواتساب:' : 'WhatsApp:'}</span>
                <span className="font-bold text-slate-800">{student.whatsapp}</span>
              </div>
            </div>
          </div>

          {/* Academic File Info Box */}
          {primaryFile && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                {language === 'ar' ? 'المسار الأكاديمي والتقديم' : 'Academic File'}
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'كود المعاملة:' : 'File Code:'}</span>
                  <span className="font-mono font-bold text-slate-800">{primaryFile.file_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'العام الأكاديمي:' : 'Academic Year:'}</span>
                  <span className="font-bold text-slate-800">{primaryFile.academic_year}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'نوع الشهادة:' : 'Certificate Type:'}</span>
                  <span className="font-bold text-slate-800">{primaryFile.certificate_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'النسبة المئوية:' : 'Percentage:'}</span>
                  <span className="font-bold text-bct-navy text-sm">{primaryFile.academic_percentage}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'المالك الحالي للملف:' : 'Current Owner:'}</span>
                  <span className="font-bold text-slate-800">{primaryFile.current_owner?.full_name_ar || 'غير محدد'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'حالة سداد فتح الملف:' : 'Registration Fee:'}</span>
                  <span className={`font-bold ${primaryFile.is_registered_fee_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {primaryFile.is_registered_fee_paid ? (isRtl ? 'مؤكد ومسدد' : 'Paid & Confirmed') : (isRtl ? 'غير مسدد' : 'Unpaid')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isRtl ? 'تاريخ إنشاء الملف:' : 'File Creation Date:'}</span>
                  <span className="font-bold text-slate-800 font-mono text-xs">
                    {formatFileCreationDate(primaryFile.created_at, isRtl).date}{' '}
                    {formatFileCreationDate(primaryFile.created_at, isRtl).time && (
                      <span className="text-[11px] text-slate-500 font-sans font-medium">
                        ({formatFileCreationDate(primaryFile.created_at, isRtl).time})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: University Choices (10 Preferences) */}
      {activeTab === 'choices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-800">
                  {language === 'ar' ? 'ترتيب رغبات الجامعات والكليات المصرية' : 'Egyptian University Faculty Choices'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-bct-navy text-white">
                  {choices.length} / 10
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'ترتيب الرغبات حسب الأولوية للطالب من الجامعات الحكومية والخاصة والأهلية المعتمدة في جمهورية مصر العربية.'
                  : 'Prioritized choices across recognized Egyptian public, private, and national universities.'}
              </p>
            </div>

            {primaryFile && hasPermission('students:edit') && !isSelectedFileArchived && (
              choices.length < 10 ? (
                <button
                  onClick={handleOpenAddChoice}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة رغبة جامعية' : 'Add Choice'}</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {language === 'ar' ? 'تم استيفاء الحد الأقصى (10 رغبات)' : 'Maximum 10 choices reached'}
                </span>
              )
            )}
          </div>

          {/* Choices Ordered List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            {choices.map((choice, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === choices.length - 1;

              return (
                <div key={choice.order || idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-bct-navy text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                      {choice.order || idx + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="font-bold text-xs text-slate-900">
                          {choice.faculty_ar} – {choice.university_ar}
                        </h5>
                        {choice.university_type && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            choice.university_type === 'public' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            choice.university_type === 'private' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            choice.university_type === 'national' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            choice.university_type === 'technological' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            choice.university_type === 'international_branch' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                            'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            {choice.university_type === 'public' ? 'حكومية' :
                             choice.university_type === 'private' ? 'خاصة' :
                             choice.university_type === 'national' ? 'أهلية' :
                             choice.university_type === 'technological' ? 'تكنولوجية' :
                             choice.university_type === 'international_branch' ? 'فرع دولي' : 'طبيعة خاصة'}
                          </span>
                        )}
                        {choice.gender_type_ar && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                            {choice.gender_type_ar}
                          </span>
                        )}
                        {choice.campus_name_ar && (
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{choice.campus_name_ar}</span>
                          </span>
                        )}
                        {choice.governorate_ar && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{choice.governorate_ar}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {choice.faculty_en} – {choice.university_en}
                      </p>
                      {choice.specialization_ar && (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-semibold text-bct-navy bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {isRtl ? 'التخصص / البرنامج:' : 'Program:'} {choice.specialization_ar}
                          </span>
                          {choice.degree_ar && (
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {choice.degree_ar}
                            </span>
                          )}
                          {choice.program_type_ar && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {choice.program_type_ar}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPermission('students:edit') && !isSelectedFileArchived && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Reordering Buttons */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                          onClick={() => handleMoveChoice(choice.order, 'up')}
                          disabled={isFirst}
                          title={isRtl ? 'تحريك لأعلى' : 'Move Up'}
                          className={`p-1 rounded ${isFirst ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-bct-navy'}`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveChoice(choice.order, 'down')}
                          disabled={isLast}
                          title={isRtl ? 'تحريك لأسفل' : 'Move Down'}
                          className={`p-1 rounded ${isLast ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:text-bct-navy'}`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit button */}
                      <button
                        onClick={() => handleOpenEditChoice(choice)}
                        title={isRtl ? 'تعديل الرغبة' : 'Edit Choice'}
                        className="p-1.5 text-slate-500 hover:text-bct-navy hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteCandidateOrder(choice.order)}
                        title={isRtl ? 'حذف الرغبة' : 'Delete Choice'}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {choices.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {language === 'ar'
                  ? 'لم يتم إدخال رغبات الجامعات حتى الآن. اضغط على "إضافة رغبة جامعية" لاختيار الكليات.'
                  : 'No university choices recorded yet. Click "Add Choice" to begin prioritizing faculties.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Documents Checklist & File Management */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'ar' ? 'المستندات وقائمة الفحص المطلوبة' : 'Required Documents & Audit Checklist'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'رفع وإدارة المستندات الستة الإلزامية الخاصة بملف الطالب وتنزيل الأرشيف الكامل بصيغة ZIP.'
                  : 'Upload, manage, and download the 6 mandatory documents for this student file.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                uploadedCategoriesCount === 6
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-300'
              }`}>
                <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${uploadedCategoriesCount === 6 ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span>
                  {language === 'ar'
                    ? `${uploadedCategoriesCount} من 6 مستوفاة`
                    : `${uploadedCategoriesCount} of 6 Uploaded`}
                </span>
              </span>
            </div>
          </div>

          {/* Feedback alerts */}
          {documentActionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{documentActionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocumentActionSuccess(null)}
                className="text-emerald-600 hover:text-emerald-800 font-bold p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {documentActionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{documentActionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocumentActionError(null)}
                className="text-rose-600 hover:text-rose-800 font-bold p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* The Six Document Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {REQUIRED_DOCUMENT_CATEGORIES.map((cat) => {
              const categoryDocs = studentDocuments.filter(d => d.document_type === cat.key);
              const isUploaded = categoryDocs.length > 0;
              const isBusy = uploadingCategory === cat.key;

              return (
                <div
                  key={cat.key}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isUploaded
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50/40'
                  }`}
                >
                  {/* Top: Title & Status Indicator */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="font-extrabold text-xs text-slate-800 leading-snug block">
                          {cat.order}. {language === 'ar' ? cat.titleAr : cat.titleEn}
                        </span>

                        {/* Separate Administrative / Verification Status */}
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span>{language === 'ar' ? 'الحالة الإجرائية:' : 'Attestation:'}</span>
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            cat.key === 'registration_fee'
                              ? (primaryFile?.is_registered_fee_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600')
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cat.key === 'registration_fee'
                              ? (primaryFile?.is_registered_fee_paid
                                  ? (language === 'ar' ? 'مؤكد مع المالية' : 'Confirmed with Finance')
                                  : (language === 'ar' ? 'غير مسدد' : 'Unpaid'))
                              : (language === 'ar' ? cat.defaultVerificationStatus : 'Fulfilled & Attested')}
                          </span>
                        </div>
                      </div>

                      {/* Upload Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap flex items-center gap-1.5 ${
                          isUploaded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <CheckCircle
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isUploaded ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span>
                          {isUploaded
                            ? (language === 'ar'
                                ? (categoryDocs.length > 1 ? `تم رفع المستند (${categoryDocs.length})` : 'تم رفع المستند')
                                : (categoryDocs.length > 1 ? `Uploaded (${categoryDocs.length})` : 'Uploaded'))
                            : (language === 'ar' ? 'لم يتم الرفع' : 'Not Uploaded')}
                        </span>
                      </span>
                    </div>

                    {/* Uploaded Files List */}
                    {isUploaded && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        {categoryDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-bct-navy shrink-0" />
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => downloadSingleDocument(doc)}
                                  title={language === 'ar' ? 'انقر لتنزيل هذا المستند' : 'Click to download this document'}
                                  className="font-bold text-slate-800 hover:text-bct-navy truncate block max-w-[180px] sm:max-w-[240px] text-start underline decoration-dotted"
                                >
                                  {doc.file_name}
                                </button>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{formatFileSize(doc.file_size_bytes)}</span>
                                  <span>•</span>
                                  <span>{formatDocumentDateTime(doc.uploaded_at)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Individual Download */}
                              <button
                                type="button"
                                onClick={() => downloadSingleDocument(doc)}
                                title={language === 'ar' ? 'تنزيل المستند' : 'Download file'}
                                className="p-1.5 text-slate-500 hover:text-bct-navy hover:bg-slate-100 rounded-md transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Replace button */}
                              {canEditDocuments && (
                                <label
                                  title={language === 'ar' ? 'استبدال المستند' : 'Replace file'}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer transition"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept={cat.allowedFormats.join(',')}
                                    onChange={(e) => handleFileUpload(cat.key, e.target.files, doc.id)}
                                  />
                                </label>
                              )}

                              {/* Delete button */}
                              {canEditDocuments && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmDoc(doc)}
                                  title={language === 'ar' ? 'حذف المستند' : 'Delete file'}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar (Upload / Add Page) */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      {language === 'ar'
                        ? 'الصيغ: PDF, JPG, PNG (حد أقصى 15MB)'
                        : 'Formats: PDF, JPG, PNG (Max 15MB)'}
                    </span>

                    {canEditDocuments ? (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition disabled:opacity-50">
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : isUploaded ? (
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {isBusy
                            ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...')
                            : isUploaded
                              ? (language === 'ar' ? 'إضافة صفحة/ملف' : 'Add Page/File')
                              : (language === 'ar' ? 'رفع المستند' : 'Upload Document')}
                        </span>
                        <input
                          type="file"
                          multiple
                          disabled={isBusy}
                          className="hidden"
                          accept={cat.allowedFormats.join(',')}
                          onChange={(e) => handleFileUpload(cat.key, e.target.files)}
                        />
                      </label>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {language === 'ar' ? 'عرض فقط' : 'Read-only'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Bar: Prominent Download Complete File Button */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70 p-4 rounded-xl">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="font-extrabold text-slate-800">
                {language === 'ar' ? 'ملخص مستندات الملف:' : 'Dossier Summary:'}
              </span>
              <span className="font-bold text-bct-navy">
                {language === 'ar'
                  ? `${uploadedCategoriesCount} من 6 متطلبات مستوفاة (${totalUploadedFilesCount} ملفات مرفوعة)`
                  : `${uploadedCategoriesCount} of 6 requirements fulfilled (${totalUploadedFilesCount} files uploaded)`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isDownloadingArchive}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-bct-navy hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingArchive ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Download className="w-4 h-4 shrink-0" />
              )}
              <span>{language === 'ar' ? 'تنزيل الملف' : 'Download Complete File'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Finance Records */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'ar' ? 'سجل المدفوعات والإيصالات المحاسبية' : 'Student Payment Receipts'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRtl 
                  ? (showAllStudentPayments 
                      ? `عرض كافة إيصالات الطالب (${allStudentPayments.length} إيصالات عبر جميع الملفات)`
                      : `عرض إيصالات الملف الحالي ${primaryFile?.file_code} فقط (${payments.length} إيصالات)`)
                  : (showAllStudentPayments
                      ? `Showing all receipts for this student (${allStudentPayments.length} across all files)`
                      : `Showing receipts for file ${primaryFile?.file_code} only (${payments.length})`)}
              </p>
            </div>

            {allStudentPayments.length > payments.length && (
              <button
                type="button"
                onClick={() => setShowAllStudentPayments(prev => !prev)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 text-bct-navy border-slate-200"
              >
                {showAllStudentPayments
                  ? (isRtl ? `عرض إيصالات هذا الملف فقط (${payments.length})` : `Show This File Receipts Only (${payments.length})`)
                  : (isRtl ? `عرض كافة إيصالات الطالب (${allStudentPayments.length})` : `Show All Student Receipts (${allStudentPayments.length})`)}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            {((showAllStudentPayments ? allStudentPayments : payments).length === 0) ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {language === 'ar' 
                  ? 'لا توجد إيصالات سداد مسجلة لهذا الملف الأكاديمي حالياً' 
                  : 'No payment receipts registered for this file yet'}
              </div>
            ) : (
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-600 font-bold">
                    <th className="py-2.5 px-3 text-start">رقم الإيصال</th>
                    {showAllStudentPayments && <th className="py-2.5 px-3 text-start">الملف المعني</th>}
                    <th className="py-2.5 px-3 text-start">المبلغ</th>
                    <th className="py-2.5 px-3 text-start">طريقة السداد</th>
                    <th className="py-2.5 px-3 text-start">اسم المودع</th>
                    <th className="py-2.5 px-3 text-start">الحالة المحاسبية</th>
                    <th className="py-2.5 px-3 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(showAllStudentPayments ? allStudentPayments : payments).map(p => {
                    const paymentFile = files.find(f => f.id === p.student_file_id);
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-bct-navy">
                          <div>{p.receipt_code}</div>
                          <div className="text-[10px] text-slate-500 font-normal truncate max-w-[180px]" title={p.payment_description || p.notes}>
                            {p.payment_description || p.notes || ''}
                          </div>
                        </td>
                        {showAllStudentPayments && (
                          <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-bct-navy">
                            {paymentFile ? paymentFile.file_code : '—'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 font-extrabold text-slate-800">{p.amount.toLocaleString()} {p.currency}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.payment_method}</td>
                        <td className="py-2.5 px-3 text-slate-600">{p.payer_name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {p.status === 'confirmed' ? 'مؤكد ومعتمد' : p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{p.created_at.split('T')[0]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Activity & Ownership History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-bct-navy/5 text-bct-navy">
                  <History className="w-5 h-5" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-800">
                  {language === 'ar' ? 'سجل العمليات وتاريخ ملكية الملف' : 'Activity & Ownership History'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'سجل تدقيق كامل وغير قابل للتعديل يوثق كافة الإجراءات وهوية الموظف المسؤول والتوقيت الدقيق.'
                  : 'Immutable chronological audit log of all transitions, handovers, payments, and notes.'}
              </p>
            </div>

            {primaryFile && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-100 text-bct-navy px-3 py-1 rounded-lg border border-slate-200">
                  {primaryFile.file_code}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-bct-surface text-bct-navy border border-slate-200">
                  {t(`statuses.${primaryFile.current_status}`)}
                </span>
              </div>
            )}
          </div>

          {!primaryFile ? (
            <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
              {language === 'ar' ? 'لا يوجد ملف أكاديمي مسجل لهذا الطالب بعد' : 'No academic file found for this student'}
            </div>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'المسؤول الحالي عن الملف' : 'Current Responsible Owner'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs truncate" title={resolveEmployeeDisplayName(primaryFile.current_owner?.id, primaryFile.current_owner?.full_name_ar, language)}>
                    {resolveEmployeeDisplayName(primaryFile.current_owner?.id, primaryFile.current_owner?.full_name_ar, language)}
                  </div>
                  <span className="text-[10px] text-bct-gold font-bold block truncate">
                    {primaryFile.current_owner
                      ? bctStore.getEmployeeJobTitle(primaryFile.current_owner, language)
                      : (language === 'ar' ? 'غير مسند' : 'Unassigned')}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'آخر إجراء بواسطة' : 'Last Action Performed By'}
                  </span>
                  <div className="font-extrabold text-bct-navy text-xs truncate" title={primaryFile.last_action_by_name}>
                    {primaryFile.last_action_by_name || resolveEmployeeDisplayName(primaryFile.current_owner?.id, primaryFile.current_owner?.full_name_ar, language) || '—'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block truncate">
                    {formatActivityDateTime(primaryFile.last_action_at || primaryFile.last_updated_at)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'إجمالي العمليات الموثقة' : 'Total Audit Actions'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {activities.length} {language === 'ar' ? 'إجراء مسجل' : 'actions'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    {language === 'ar' ? 'سجل غير قابل للحذف' : 'Append-Only Ledger'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {language === 'ar' ? 'تاريخ إنشاء الملف' : 'File Creation Date'}
                  </span>
                  <div className="font-extrabold text-slate-900 text-xs tabular-nums">
                    {formatFileCreationDate(primaryFile.created_at, language === 'ar').date}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {formatFileCreationDate(primaryFile.created_at, language === 'ar').time || (language === 'ar' ? 'غير متوفر' : 'N/A')}
                  </span>
                </div>
              </div>

              {/* Add Note Form (Disabled for Archived Files in Read-Only Mode) */}
              {!isSelectedFileArchived && (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'ar' ? 'إضافة ملاحظة إدارية إلى سجل الملف' : 'Add Administrative Note'}</span>
                  </div>
                  <span className="text-[10px] text-amber-700">
                    {language === 'ar' ? `الموثق: ${currentUser?.full_name_ar || currentUser?.username}` : `Actor: ${currentUser?.username}`}
                  </span>
                </div>

                <form onSubmit={handleAddProfileNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={profileNote}
                    onChange={(e) => {
                      setProfileNote(e.target.value);
                      if (profileNoteError) setProfileNoteError('');
                    }}
                    placeholder={language === 'ar' 
                      ? 'أدخل ملاحظة إدارية أو توثيقاً لحالة الملف...' 
                      : 'Enter administrative audit note...'}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />

                  {profileNoteError && (
                    <p className="text-[11px] text-red-600 font-medium">{profileNoteError}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>{language === 'ar' ? 'حفظ الملاحظة بالسجل' : 'Log Note'}</span>
                    </button>
                  </div>
                </form>
              </div>
              )}

              {/* Timeline Feed */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'ar' ? 'التسلسل الزمني لكافة العمليات' : 'Chronological Timeline'}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {language === 'ar' ? 'مرتب من الأحدث إلى الأقدم' : 'Sorted Newest First'}
                  </span>
                </div>

                <div className="relative border-s-2 border-slate-200 ms-3 space-y-4 ps-5">
                  {activities.map((act) => {
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
                        <span className="absolute -start-[27px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-bct-navy group-hover:scale-125 transition-transform" />

                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${meta.color}`}>
                              {language === 'ar' ? meta.ar : meta.en}
                            </span>

                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatActivityDateTime(act.timestamp)}</span>
                            </span>
                          </div>

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

                  {activities.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                      {language === 'ar' ? 'لا توجد إجراءات مسجلة في تاريخ هذا الملف بعد' : 'No activity records logged for this file yet'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal: Cascading 5-Step Academic Choice (Add / Edit) */}
      {isAddChoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="p-4 bg-bct-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">
                    {editingChoiceOrder !== null 
                      ? (language === 'ar' ? `تعديل الرغبة الجامعية (رغبة رقم ${editingChoiceOrder})` : `Edit University Preference #${editingChoiceOrder}`)
                      : (language === 'ar' ? 'إضافة رغبة جامعية جديدة' : 'Add University Choice')}
                  </h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {editingChoiceOrder !== null
                      ? (language === 'ar' ? 'تعديل بيانات الجامعة والكلية والتخصص الأكاديمي' : 'Update university, faculty, and academic program')
                      : (language === 'ar' ? `رغبة رقم (${choices.length + 1} من 10) - المجلس الأعلى للجامعات` : `Choice #${choices.length + 1} of 10 - Accredited Egyptian Institutions`)}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (isSaving) return;
                  setIsAddChoiceModalOpen(false);
                  setEditingChoiceOrder(null);
                  setChoiceError(null);
                }}
                className={`text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChoice} className="p-5 sm:p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              
              {/* STEP 1: University Classification Filter */}
              <div className="space-y-1.5 pb-1 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    <span className="text-bct-navy font-black me-1">الخطوة 1:</span>
                    {language === 'ar' ? 'تصنيف المؤسسة الجامعية' : 'Institution Classification'}
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {language === 'ar' ? `${filteredUniversities.length} جامعة مطابقة` : `${filteredUniversities.length} matched`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 text-[11px]">
                  {[
                    { id: 'all', labelAr: 'كل الجامعات', labelEn: 'All Types' },
                    { id: 'public', labelAr: 'حكومية', labelEn: 'Public' },
                    { id: 'private', labelAr: 'خاصة', labelEn: 'Private' },
                    { id: 'national', labelAr: 'أهلية', labelEn: 'National' },
                    { id: 'technological', labelAr: 'تكنولوجية', labelEn: 'Tech' },
                    { id: 'international_branch', labelAr: 'فروع دولية', labelEn: 'Intl Branches' },
                    { id: 'special_nature', labelAr: 'طبيعة خاصة', labelEn: 'Special Nature' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setUnivTypeFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border text-xs ${
                        isSaving ? 'opacity-60 cursor-not-allowed ' : ''
                      }${
                        univTypeFilter === tab.id
                          ? 'bg-bct-navy text-white border-bct-navy shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {language === 'ar' ? tab.labelAr : tab.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2: Instant Search & University Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  <span className="text-bct-navy font-black me-1">الخطوة 2:</span>
                  {language === 'ar' ? 'البحث واختيار الجامعة المصرية المعتمدة *' : 'Search & Select Accredited University *'}
                </label>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
                  <input
                    type="text"
                    disabled={isSaving}
                    value={univSearchQuery}
                    onChange={(e) => setUnivSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? 'ابحث فورياً باسم الجامعة بالعربية أو الإنجليزية (مثال: القاهرة، Cairo، الجلالة، النيل، زويل)...' : 'Instant search by Arabic or English university name...'}
                    className={`w-full ps-9 pe-12 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-bct-navy transition ${
                      isSaving ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 end-8 my-auto flex items-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    </div>
                  )}
                  {univSearchQuery && !isSaving && (
                    <button
                      type="button"
                      onClick={() => setUnivSearchQuery('')}
                      className="absolute inset-y-0 end-2.5 my-auto text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* University Selection Dropdown */}
                {filteredUniversities.length > 0 ? (
                  <select
                    disabled={isSaving}
                    value={selectedUnivId}
                    onChange={(e) => handleSelectUniversity(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-bct-navy font-medium ${
                      isSaving ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  >
                    {filteredUniversities.map((u: University) => (
                      <option key={u.id} value={u.id}>
                        {u.name_ar} ({u.name_en}) — [
                          {u.type === 'public' ? 'حكومية' :
                           u.type === 'private' ? 'خاصة' :
                           u.type === 'national' ? 'أهلية' :
                           u.type === 'technological' ? 'تكنولوجية' :
                           u.type === 'international_branch' ? 'فرع دولي' : 'طبيعة خاصة'}
                        ] — [{u.governorate_ar || 'مصر'}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      {language === 'ar' 
                        ? 'لم يتم العثور على جامعات تطابق معايير البحث والتصنيف المحدد. يرجى تجربة كلمات بحث أخرى أو اختيار "كل الجامعات".'
                        : 'No universities match the current search and classification criteria.'}
                    </span>
                  </div>
                )}

                {/* Selected University Details Badge Ribbon */}
                {currentUniv && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{currentUniv.name_ar}</span>
                      <span className="text-slate-400 font-mono text-[10px]">({currentUniv.name_en})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        currentUniv.type === 'public' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        currentUniv.type === 'private' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        currentUniv.type === 'national' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        currentUniv.type === 'technological' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        currentUniv.type === 'international_branch' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-indigo-100 text-indigo-800 border-indigo-200'
                      }`}>
                        {currentUniv.type === 'public' ? 'حكومية' :
                         currentUniv.type === 'private' ? 'خاصة' :
                         currentUniv.type === 'national' ? 'أهلية' :
                         currentUniv.type === 'technological' ? 'تكنولوجية' :
                         currentUniv.type === 'international_branch' ? 'فرع دولي' : 'طبيعة خاصة'}
                      </span>
                      {currentUniv.governorate_ar && (
                        <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{currentUniv.governorate_ar} {currentUniv.city_ar ? `• ${currentUniv.city_ar}` : ''}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{currentUniv.accreditation_body_ar || currentUniv.accreditation_body || 'المجلس الأعلى للجامعات (SCU)'}</span>
                      </span>
                    </div>
                    {(currentUniv.website_url || currentUniv.website) && (
                      <a
                        href={currentUniv.website_url || currentUniv.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-bct-navy hover:underline flex items-center gap-1 font-semibold text-[10px]"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{isRtl ? 'الموقع الرسمي' : 'Official Portal'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 3: Cascading Faculty Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    <span className="text-bct-navy font-black me-1">الخطوة 3:</span>
                    {language === 'ar' ? 'اختيار الكلية / المعهد المعتمد *' : 'Select Faculty / Institute *'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {language === 'ar' 
                        ? `متاح ${availableFaculties.length} كلية ومعهد (${filteredFaculties.length} مطابقة)`
                        : `${availableFaculties.length} faculties (${filteredFaculties.length} matched)`}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Controls for Faculty */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className={availableCampuses.length > 0 ? "sm:col-span-5 relative" : "sm:col-span-7 relative"}>
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute inset-y-0 start-2.5 my-auto" />
                    <input
                      type="text"
                      disabled={isSaving}
                      value={facultySearchQuery}
                      onChange={(e) => setFacultySearchQuery(e.target.value)}
                      placeholder={isRtl ? 'ابحث باسم الكلية أو التخصص أو الفرع...' : 'Search faculty name or campus...'}
                      className="w-full ps-8 pe-7 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-bct-navy placeholder:text-slate-400"
                    />
                    {facultySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFacultySearchQuery('')}
                        className="absolute inset-y-0 end-2 my-auto text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Campus Filter (if university has multiple campuses) */}
                  {availableCampuses.length > 0 && (
                    <div className="sm:col-span-4">
                      <select
                        disabled={isSaving}
                        value={facultyCampusFilter}
                        onChange={(e) => setFacultyCampusFilter(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-bct-navy font-medium text-slate-700"
                      >
                        <option value="all">{isRtl ? 'جميع الفروع والمقرات' : 'All Campuses'}</option>
                        {availableCampuses.map(camp => (
                          <option key={camp.id} value={camp.id}>
                            {camp.name_ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Gender Filter (especially useful for Al-Azhar) */}
                  <div className={availableCampuses.length > 0 ? "sm:col-span-3" : "sm:col-span-5"}>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFacultyGenderFilter('all')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${
                          facultyGenderFilter === 'all' ? 'bg-white text-bct-navy shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isRtl ? 'الكل' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFacultyGenderFilter('male')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${
                          facultyGenderFilter === 'male' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isRtl ? 'بنين' : 'Boys'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFacultyGenderFilter('female')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded transition ${
                          facultyGenderFilter === 'female' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isRtl ? 'بنات' : 'Girls'}
                      </button>
                    </div>
                  </div>
                </div>

                {filteredFaculties.length > 0 ? (
                  <select
                    disabled={isSaving}
                    value={filteredFaculties.some(f => f.id === selectedFacultyId) ? selectedFacultyId : (currentFaculty?.id || '')}
                    onChange={(e) => handleSelectFaculty(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-bct-navy font-medium ${
                      isSaving ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  >
                    {filteredFaculties.map((f: UniversityFaculty) => (
                      <option key={f.id} value={f.id}>
                        {f.name_ar} {f.gender_type_ar ? `[${f.gender_type_ar}]` : ''} {f.campus_name_ar ? `— [${f.campus_name_ar}]` : ''} ({f.name_en})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    {language === 'ar' 
                      ? 'لا توجد كليات تطابق البحث والفلاتر المحددة. يرجى تجربة كلمات بحث أخرى أو اختيار "الكل".' 
                      : 'No faculties match the current search or filters.'}
                  </div>
                )}

                {/* Current Selected Faculty Details Card */}
                {currentFaculty && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800">{currentFaculty.name_ar}</span>
                      {currentFaculty.gender_type_ar && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          currentFaculty.gender_type === 'male' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          currentFaculty.gender_type === 'female' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                          'bg-purple-100 text-purple-800 border-purple-200'
                        }`}>
                          {currentFaculty.gender_type_ar}
                        </span>
                      )}
                      {currentFaculty.campus_name_ar && (
                        <span className="flex items-center gap-1 text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{currentFaculty.campus_name_ar}</span>
                          {currentFaculty.governorate_ar && <span>({currentFaculty.governorate_ar})</span>}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{currentFaculty.source_verification || 'معتمدة من الهيئة القومية NAQAAE'}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 4: Cascading Specialization / Academic Program Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    <span className="text-bct-navy font-black me-1">الخطوة 4:</span>
                    {language === 'ar' ? 'اختيار التخصص الأكاديمي / البرنامج المعتمد *' : 'Select Academic Specialization / Program *'}
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {language === 'ar' 
                      ? `متاح ${availableSpecializations.length} تخصص وبرنامج (${filteredSpecializations.length} مطابقة)`
                      : `${availableSpecializations.length} programs (${filteredSpecializations.length} matched)`}
                  </span>
                </div>

                {/* Program Search input */}
                {availableSpecializations.length > 2 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute inset-y-0 start-2.5 my-auto" />
                    <input
                      type="text"
                      disabled={isSaving}
                      value={programSearchQuery}
                      onChange={(e) => setProgramSearchQuery(e.target.value)}
                      placeholder={isRtl ? 'ابحث عن البرنامج أو الدرجة أو نظام الدراسة...' : 'Search program or study system...'}
                      className="w-full ps-8 pe-7 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-bct-navy placeholder:text-slate-400"
                    />
                    {programSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProgramSearchQuery('')}
                        className="absolute inset-y-0 end-2 my-auto text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {filteredSpecializations.length > 0 ? (
                  <select
                    disabled={isSaving}
                    value={filteredSpecializations.some(s => s.id === selectedSpecId) ? selectedSpecId : (currentSpecialization?.id || '')}
                    onChange={(e) => handleSelectSpecialization(e.target.value)}
                    className={`w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-bct-navy font-medium ${
                      isSaving ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  >
                    {filteredSpecializations.map((s: AcademicSpecialization) => (
                      <option key={s.id} value={s.id}>
                        {s.name_ar} ({s.name_en}) — [الدرجة: {s.degree_ar || 'بكالوريوس'}] [{s.program_type_ar || 'معتمد'}] {s.study_system_ar ? `[${s.study_system_ar}]` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    {language === 'ar' ? 'التخصص الافتراضي: عام وفق لائحة الكلية' : 'General Program according to faculty regulations'}
                  </div>
                )}

                {/* Selected Program Details Card */}
                {currentSpecialization && (
                  <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sky-950">{currentSpecialization.name_ar}</span>
                      <span className="text-sky-700 font-mono text-[10px]">({currentSpecialization.name_en})</span>
                      <span className="bg-white text-slate-700 px-2 py-0.5 rounded border border-sky-200 font-semibold text-[10px]">
                        {currentSpecialization.degree_ar || 'بكالوريوس'}
                      </span>
                      {currentSpecialization.study_system_ar && (
                        <span className="bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[10px]">
                          {currentSpecialization.study_system_ar}
                        </span>
                      )}
                      {currentSpecialization.program_type_ar && (
                        <span className="bg-sky-100 text-bct-navy px-2 py-0.5 rounded font-bold text-[10px]">
                          {currentSpecialization.program_type_ar}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: Summary Preview & Confirmation */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-bct-navy text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-bct-navy" />
                    <span>{language === 'ar' ? 'الخطوة 5: معاينة الرغبة وتأكيد الربط الأكاديمي' : 'Step 5: Preference Preview & Confirmation'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {editingChoiceOrder !== null ? `ORDER #${editingChoiceOrder}` : `ORDER #${choices.length + 1}`}
                  </span>
                </div>
                <div className="text-xs text-slate-800 space-y-1.5 bg-white p-3 rounded-lg border border-blue-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium">{isRtl ? 'الجامعة:' : 'University:'}</span>
                    <span className="font-bold text-slate-900">{currentUniv?.name_ar || '—'}</span>
                    <span className="text-slate-400">({currentUniv?.name_en || '—'})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium">{isRtl ? 'الكلية والمقر:' : 'Faculty & Campus:'}</span>
                    <span className="font-bold text-slate-900">{currentFaculty?.name_ar || '—'}</span>
                    {currentFaculty?.gender_type_ar && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        {currentFaculty.gender_type_ar}
                      </span>
                    )}
                    {currentFaculty?.campus_name_ar && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {currentFaculty.campus_name_ar}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-medium">{isRtl ? 'التخصص / البرنامج:' : 'Specialization:'}</span>
                    <span className="font-bold text-bct-navy">{currentSpecialization?.name_ar || currentFaculty?.specialization_ar || currentFaculty?.name_ar || '—'}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                      {currentSpecialization?.degree_ar || 'بكالوريوس / ليسانس'}
                    </span>
                    {currentSpecialization?.study_system_ar && (
                      <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {currentSpecialization.study_system_ar}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {choiceError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{choiceError}</span>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (isSaving) return;
                    setIsAddChoiceModalOpen(false);
                    setEditingChoiceOrder(null);
                    setChoiceError(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold transition text-xs ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'
                  }`}
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold flex items-center gap-1.5 shadow transition text-xs ${
                    isSaving 
                      ? 'bg-slate-400 cursor-not-allowed opacity-85' 
                      : 'bg-bct-navy hover:bg-bct-dark cursor-pointer'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{language === 'ar' ? 'جاري الحفظ والتسجيل...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {editingChoiceOrder !== null 
                          ? (language === 'ar' ? 'تحديث الرغبة' : 'Update Preference') 
                          : (language === 'ar' ? 'حفظ الرغبة' : 'Save Choice')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Preference Confirmation */}
      {deleteCandidateOrder !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'ar' ? 'تأكيد حذف الرغبة' : 'Confirm Choice Deletion'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar' 
                ? `هل أنت متأكد من حذف الرغبة رقم (${deleteCandidateOrder})؟ سيتم إعادة ترتيب باقي الرغبات تلقائياً.`
                : `Delete choice #${deleteCandidateOrder}? Remaining choices will re-index automatically.`}
            </p>

            <div className="mt-4 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteCandidateOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteChoice(deleteCandidateOrder)}
                className="px-4 py-2 rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700 shadow"
              >
                {language === 'ar' ? 'نعم، حذف' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {language === 'ar' ? 'تأكيد حذف المستند' : 'Confirm Document Deletion'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'ar' ? 'إجراء تدقيقي يتطلب التأكيد' : 'Audited administrative action'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">{language === 'ar' ? 'اسم الملف:' : 'File Name:'}</span>
                <span className="font-bold text-slate-800 font-mono truncate" title={deleteConfirmDoc.file_name}>
                  {deleteConfirmDoc.file_name}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">{language === 'ar' ? 'حجم الملف:' : 'File Size:'}</span>
                <span className="font-medium text-slate-700">{formatFileSize(deleteConfirmDoc.file_size_bytes)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">{language === 'ar' ? 'تاريخ الرفع:' : 'Uploaded At:'}</span>
                <span className="font-medium text-slate-700">{formatDocumentDateTime(deleteConfirmDoc.uploaded_at)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ar'
                ? 'هل أنت متأكد من رغبتك في حذف هذا المستند نهائياً؟ سيتم إلغاء حالة الاستيفاء في قائمة الفحص وتوثيق عملية الحذف في سجل التدقيق.'
                : 'Are you sure you want to permanently delete this document? The checklist completion indicator will be reset and this deletion will be recorded in the audit log.'}
            </p>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
              >
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
