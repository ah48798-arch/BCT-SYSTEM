/**
 * BCT Enterprise Student CRM Search & Date Filtering Service
 * 
 * Provides unified, multi-identifier search across:
 * 1. Student full name (Arabic & English with full Arabic normalization)
 * 2. Student ID / Code (e.g. BCT-STU-2026-001, stu-101)
 * 3. Student File ID / Code (e.g. BCT-FILE-2026-001, file-201)
 * 4. Transaction ID (e.g. BCT-FILE-..., payment_reference, receipt_code)
 * 5. Passport number (e.g. P01928374)
 * 6. Phone number & WhatsApp (e.g. +249912345678)
 * 
 * And multi-factor date range filtering:
 * - All Time / Last 30 Days / Current Quarter / Custom Range (From Date -> To Date)
 * - Configurable date fields: Registration Date, File Creation Date, Transaction Date, Last Update Date
 */

import { Student, StudentFile, StudentFileStatus, PaymentRecord, StudentFileActivityRecord, AuditLog } from '../types/database.types';
import { 
  formatFileCreationDate, 
  FormattedCreationDate,
  getStudentLastUpdateTimestamp,
  getStudentDateValue,
  StudentDateResolution
} from '../utils/dateUtils';

export { formatFileCreationDate, getStudentLastUpdateTimestamp, getStudentDateValue };
export type { FormattedCreationDate, StudentDateResolution };

export type StudentDateField = 'student_reg' | 'file_created' | 'txn_created' | 'last_update';
export type CRMTimeRange = 'all' | '30d' | 'quarter' | 'custom';
export type CRMStageFilter = 'all' | StudentFileStatus | 'archived';

export interface DateRangeBounds {
  start: Date;
  end: Date;
}

export interface StudentFilterOptions {
  searchQuery?: string;
  nationality?: string;
  stageFilter?: CRMStageFilter;
  timeRange?: CRMTimeRange;
  customRange?: { start: string; end: string } | null;
  dateField?: StudentDateField;
  sortBy?: 'default' | 'date' | 'file_created_at';
  sortDirection?: 'asc' | 'desc';
  activities?: StudentFileActivityRecord[];
  auditLogs?: AuditLog[];
}

export interface CRMStudentFileRow {
  file: StudentFile;
  student: Student;
  isArchived: boolean;
}

/**
 * Normalizes Arabic text by unifying hamzas, taa marbuta, yaa, and removing tashkeel/tatweel
 */
export function normalizeArabicText(text?: string | null): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel and tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

/**
 * Normalizes alphanumeric identifiers by stripping hyphens, underscores, and whitespace
 */
export function normalizeIdentifier(val?: string | null): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[-\s_]/g, '');
}

/**
 * Computes exact start and end Date boundaries for the selected CRM period
 */
export function getCRMDateRangeBounds(
  timeRange: CRMTimeRange,
  customRange?: { start: string; end: string } | null
): DateRangeBounds | null {
  const now = new Date();

  if (timeRange === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (timeRange === 'quarter') {
    const currentMonth = now.getMonth(); // 0 to 11
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (timeRange === 'custom' && customRange?.start && customRange?.end) {
    const start = new Date(customRange.start + 'T00:00:00');
    const end = new Date(customRange.end + 'T23:59:59.999');
    return { start, end };
  }

  return null; // 'all'
}

/**
 * Checks whether a student record matches the unified search query across all 6 identifier categories
 */
export function matchesStudentSearch(
  student: Student,
  files: StudentFile[],
  payments: PaymentRecord[] = [],
  query: string
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const lowerQuery = trimmed.toLowerCase();
  const cleanQuery = normalizeIdentifier(trimmed);
  const normArabicQuery = normalizeArabicText(trimmed);

  // 1. Student Name (Arabic & English)
  if (student.full_name_ar) {
    if (student.full_name_ar.toLowerCase().includes(lowerQuery)) return true;
    if (normalizeArabicText(student.full_name_ar).includes(normArabicQuery)) return true;
  }
  if (student.full_name_en && student.full_name_en.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // 2. Student ID / Student Code
  if (student.student_code) {
    if (student.student_code.toLowerCase().includes(lowerQuery)) return true;
    if (cleanQuery && normalizeIdentifier(student.student_code).includes(cleanQuery)) return true;
  }
  if (student.id) {
    if (student.id.toLowerCase().includes(lowerQuery)) return true;
    if (cleanQuery && normalizeIdentifier(student.id).includes(cleanQuery)) return true;
  }

  // 3. Passport Number
  if (student.passport_number) {
    if (student.passport_number.toLowerCase().includes(lowerQuery)) return true;
    if (cleanQuery && normalizeIdentifier(student.passport_number).includes(cleanQuery)) return true;
  }

  // 4. Phone Number & WhatsApp
  if (student.phone) {
    const cleanPhone = student.phone.replace(/[\s\-\+\(\)]/g, '');
    const cleanQ = trimmed.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.includes(cleanQ)) return true;
  }
  if (student.whatsapp) {
    const cleanWA = student.whatsapp.replace(/[\s\-\+\(\)]/g, '');
    const cleanQ = trimmed.replace(/[\s\-\+\(\)]/g, '');
    if (cleanWA.includes(cleanQ)) return true;
  }

  // 5. Linked Student Files (File ID & File Code / Transaction Number)
  const studentFiles = files.filter(f => f.student_id === student.id);
  for (const f of studentFiles) {
    if (f.file_code) {
      if (f.file_code.toLowerCase().includes(lowerQuery)) return true;
      if (cleanQuery && normalizeIdentifier(f.file_code).includes(cleanQuery)) return true;
    }
    if (f.id) {
      if (f.id.toLowerCase().includes(lowerQuery)) return true;
      if (cleanQuery && normalizeIdentifier(f.id).includes(cleanQuery)) return true;
    }
    if (f.intake_source && f.intake_source.toLowerCase().includes(lowerQuery)) {
      return true;
    }
  }

  // 6. Linked Payment Transactions & Receipts
  const studentPayments = payments.filter(
    p => p.student_id === student.id || studentFiles.some(f => f.id === p.student_file_id)
  );
  for (const p of studentPayments) {
    if (p.receipt_code) {
      if (p.receipt_code.toLowerCase().includes(lowerQuery)) return true;
      if (cleanQuery && normalizeIdentifier(p.receipt_code).includes(cleanQuery)) return true;
    }
    if (p.payment_reference) {
      if (p.payment_reference.toLowerCase().includes(lowerQuery)) return true;
      if (cleanQuery && normalizeIdentifier(p.payment_reference).includes(cleanQuery)) return true;
    }
    if (p.payer_name && p.payer_name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a student record falls within the specified date boundaries according to the active date field
 */
export function matchesStudentDate(
  student: Student,
  files: StudentFile[],
  payments: PaymentRecord[] = [],
  bounds: DateRangeBounds | null,
  dateField: StudentDateField = 'student_reg',
  activities: StudentFileActivityRecord[] = [],
  auditLogs: AuditLog[] = []
): boolean {
  if (!bounds) return true; // All Time

  const isWithin = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    return time >= bounds.start.getTime() && time <= bounds.end.getTime();
  };

  const studentFiles = files.filter(f => f.student_id === student.id);

  switch (dateField) {
    case 'student_reg':
      return isWithin(student.created_at);

    case 'file_created':
      // Matches if ANY active file of this student was created within the range
      if (studentFiles.length === 0) return false;
      return studentFiles.some(f => isWithin(f.created_at));

    case 'txn_created': {
      // Matches if ANY file, payment, or activity of this student was created within the range
      const hasFile = studentFiles.some(f => isWithin(f.created_at));
      if (hasFile) return true;
      const studentPayments = payments.filter(
        p => p.student_id === student.id || studentFiles.some(f => f.id === p.student_file_id)
      );
      return studentPayments.some(p => isWithin(p.created_at) || (p.confirmed_at && isWithin(p.confirmed_at)));
    }

    case 'last_update': {
      // Strictly matches the authoritative latest update/action timestamp
      const lastUpdate = getStudentLastUpdateTimestamp(student, files, activities, auditLogs);
      if (!lastUpdate) return false;
      return isWithin(lastUpdate);
    }

    default:
      return isWithin(student.created_at);
  }
}

/**
 * Comprehensive multi-factor filter combining Search, Nationality, and Date Range
 * Guarantees distinct deduplicated student rows (even with multiple files/transactions)
 */
export function filterStudents(
  students: Student[],
  files: StudentFile[],
  payments: PaymentRecord[] = [],
  options: StudentFilterOptions
): {
  filteredStudents: Student[];
  totalActive: number;
  totalFiltered: number;
  isFiltered: boolean;
} {
  const activeStudents = students.filter(s => !s.is_archived);
  const totalActive = activeStudents.length;

  const dateBounds = getCRMDateRangeBounds(
    options.timeRange || 'all',
    options.customRange
  );

  const isFiltered = Boolean(
    (options.searchQuery && options.searchQuery.trim() !== '') ||
    (options.nationality && options.nationality !== 'all') ||
    (options.timeRange && options.timeRange !== 'all') ||
    (options.customRange && options.customRange.start && options.customRange.end)
  );

  const filtered = activeStudents.filter(stu => {
    // 1. Nationality Filter (AND)
    if (options.nationality && options.nationality !== 'all') {
      if (!stu.nationality.includes(options.nationality)) {
        return false;
      }
    }

    // 2. Date Range Filter (AND)
    if (dateBounds) {
      const dateOk = matchesStudentDate(
        stu,
        files,
        payments,
        dateBounds,
        options.dateField || 'student_reg',
        options.activities || [],
        options.auditLogs || []
      );
      if (!dateOk) return false;
    }

    // 3. Unified Search Filter (AND with other groups, OR across all 6 identifier types)
    if (options.searchQuery && options.searchQuery.trim() !== '') {
      const searchOk = matchesStudentSearch(stu, files, payments, options.searchQuery);
      if (!searchOk) return false;
    }

    return true;
  });

  // 4. Dynamic Date Sorting (Registration Date vs Last Update Date)
  if (options.sortBy === 'date' || options.sortBy === 'file_created_at') {
    const dir = options.sortDirection || 'desc';
    const isLastUpdate = options.dateField === 'last_update';

    filtered.sort((a, b) => {
      let timeA: number;
      let timeB: number;

      if (isLastUpdate) {
        const updateA = getStudentLastUpdateTimestamp(a, files, options.activities, options.auditLogs);
        const updateB = getStudentLastUpdateTimestamp(b, files, options.activities, options.auditLogs);
        timeA = updateA ? new Date(updateA).getTime() : NaN;
        timeB = updateB ? new Date(updateB).getTime() : NaN;
      } else {
        const fileA = files.find(f => f.student_id === a.id);
        const fileB = files.find(f => f.student_id === b.id);
        const regA = a.created_at || fileA?.created_at;
        const regB = b.created_at || fileB?.created_at;
        timeA = regA ? new Date(regA).getTime() : NaN;
        timeB = regB ? new Date(regB).getTime() : NaN;
      }

      const validA = !isNaN(timeA);
      const validB = !isNaN(timeB);

      if (!validA && !validB) return 0;
      if (!validA) return 1; // Put missing dates / unrecorded updates at the end in both asc and desc
      if (!validB) return -1;

      return dir === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }

  return {
    filteredStudents: filtered,
    totalActive,
    totalFiltered: filtered.length,
    isFiltered
  };
}

/**
 * Authoritative File-Level CRM Filter (Active + Archived Files across all 10 lifecycle stages)
 *
 * Rules:
 * - Includes ALL deduplicated student files (active, closed, auto-archived, manually archived).
 * - Prevents duplicate files by file.id and file_code.
 * - Excludes archived files when filtering by any specific active lifecycle stage.
 * - 'archived' returns ALL archived files regardless of their final lifecycle stage.
 * - 'all' returns active and archived files together.
 * - Combines seamlessly with search, nationality, date range, and date sorting.
 */
export function filterStudentFiles(
  students: Student[],
  files: StudentFile[],
  payments: PaymentRecord[] = [],
  options: StudentFilterOptions
): {
  filteredRows: CRMStudentFileRow[];
  totalFiles: number;
  activeFilesCount: number;
  archivedFilesCount: number;
  totalFiltered: number;
  isFiltered: boolean;
} {
  // O(1) lookup map for students
  const studentMap = new Map<string, Student>();
  for (let i = 0; i < students.length; i++) {
    studentMap.set(students[i].id, students[i]);
  }

  // Deduplicate student files strictly by id and file_code
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const allRows: CRMStudentFileRow[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || !file.id) continue;
    const normCode = (file.file_code || '').trim().toUpperCase();
    if (seenIds.has(file.id) || (normCode && seenCodes.has(normCode))) continue;

    const student = studentMap.get(file.student_id) || file.student || ({
      id: file.student_id,
      student_code: file.file_code?.replace('FILE', 'STU') || file.student_id,
      full_name_ar: (file as any).student_name || 'طالب مسجل',
      full_name_en: (file as any).student_name || 'Registered Student',
      nationality: 'سوداني',
      passport_number: 'P01236547',
      created_at: file.created_at
    } as Student);

    seenIds.add(file.id);
    if (normCode) seenCodes.add(normCode);

    const isArchived = Boolean(file.is_archived || (file.current_status as any) === 'archived');
    allRows.push({ file, student, isArchived });
  }

  const totalFiles = allRows.length;
  let archivedFilesCount = 0;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].isArchived) archivedFilesCount++;
  }
  const activeFilesCount = totalFiles - archivedFilesCount;

  const stageFilter: CRMStageFilter = options.stageFilter || 'all';
  const dateBounds = getCRMDateRangeBounds(
    options.timeRange || 'all',
    options.customRange
  );

  const isFiltered = Boolean(
    (options.searchQuery && options.searchQuery.trim() !== '') ||
    (options.nationality && options.nationality !== 'all') ||
    stageFilter !== 'all' ||
    (options.timeRange && options.timeRange !== 'all') ||
    (options.customRange && options.customRange.start && options.customRange.end)
  );

  const trimmedQuery = (options.searchQuery || '').trim();
  const lowerQuery = trimmedQuery.toLowerCase();
  const cleanQuery = normalizeIdentifier(trimmedQuery);
  const normArabicQuery = normalizeArabicText(trimmedQuery);
  const cleanPhoneQuery = trimmedQuery.replace(/[\s\-\+\(\)]/g, '');

  const filteredRows = allRows.filter(row => {
    const { file, student, isArchived } = row;

    // 1. Current Stage Filter (AND)
    if (stageFilter === 'archived') {
      if (!isArchived) return false;
    } else if (stageFilter !== 'all') {
      // Specific active lifecycle stage: strictly exclude archived files
      if (isArchived) return false;
      if (file.current_status !== stageFilter) return false;
    }

    // 2. Nationality Filter (AND)
    if (options.nationality && options.nationality !== 'all') {
      if (!student.nationality || !student.nationality.includes(options.nationality)) {
        return false;
      }
    }

    // 3. Date Range Filter (AND)
    if (dateBounds) {
      const dateOk = matchesStudentDate(
        student,
        [file],
        payments,
        dateBounds,
        options.dateField || 'student_reg',
        options.activities || [],
        options.auditLogs || []
      );
      if (!dateOk) return false;
    }

    // 4. Unified Search Filter (AND across groups, OR across student/file/payment identifiers)
    if (trimmedQuery) {
      let matches = false;

      if (student.full_name_ar) {
        if (student.full_name_ar.toLowerCase().includes(lowerQuery) || normalizeArabicText(student.full_name_ar).includes(normArabicQuery)) {
          matches = true;
        }
      }
      if (!matches && student.full_name_en && student.full_name_en.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }
      if (!matches && student.student_code && (student.student_code.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(student.student_code).includes(cleanQuery)))) {
        matches = true;
      }
      if (!matches && student.id && (student.id.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(student.id).includes(cleanQuery)))) {
        matches = true;
      }
      if (!matches && student.passport_number && (student.passport_number.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(student.passport_number).includes(cleanQuery)))) {
        matches = true;
      }
      if (!matches && cleanPhoneQuery && student.phone && student.phone.replace(/[\s\-\+\(\)]/g, '').includes(cleanPhoneQuery)) {
        matches = true;
      }
      if (!matches && cleanPhoneQuery && student.whatsapp && student.whatsapp.replace(/[\s\-\+\(\)]/g, '').includes(cleanPhoneQuery)) {
        matches = true;
      }
      if (!matches && file.file_code && (file.file_code.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(file.file_code).includes(cleanQuery)))) {
        matches = true;
      }
      if (!matches && file.id && (file.id.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(file.id).includes(cleanQuery)))) {
        matches = true;
      }
      if (!matches && file.intake_source && file.intake_source.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }
      if (!matches && file.certificate_type && (file.certificate_type.toLowerCase().includes(lowerQuery) || normalizeArabicText(file.certificate_type).includes(normArabicQuery))) {
        matches = true;
      }
      if (!matches) {
        for (let pIdx = 0; pIdx < payments.length; pIdx++) {
          const p = payments[pIdx];
          if (p.student_file_id !== file.id && p.student_id !== student.id) continue;
          if (
            (p.receipt_code && (p.receipt_code.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(p.receipt_code).includes(cleanQuery)))) ||
            (p.payment_reference && (p.payment_reference.toLowerCase().includes(lowerQuery) || (cleanQuery && normalizeIdentifier(p.payment_reference).includes(cleanQuery)))) ||
            (p.payer_name && p.payer_name.toLowerCase().includes(lowerQuery))
          ) {
            matches = true;
            break;
          }
        }
      }

      if (!matches) return false;
    }

    return true;
  });

  // 5. Dynamic Date Sorting (Registration Date vs Last Update Date)
  if (options.sortBy === 'date' || options.sortBy === 'file_created_at') {
    const dir = options.sortDirection || 'desc';
    const isLastUpdate = options.dateField === 'last_update';

    filteredRows.sort((a, b) => {
      let timeA: number;
      let timeB: number;

      if (isLastUpdate) {
        const updateA = getStudentLastUpdateTimestamp(a.student, [a.file], options.activities, options.auditLogs);
        const updateB = getStudentLastUpdateTimestamp(b.student, [b.file], options.activities, options.auditLogs);
        timeA = updateA ? new Date(updateA).getTime() : NaN;
        timeB = updateB ? new Date(updateB).getTime() : NaN;
      } else {
        const regA = a.student.created_at || a.file.created_at;
        const regB = b.student.created_at || b.file.created_at;
        timeA = regA ? new Date(regA).getTime() : NaN;
        timeB = regB ? new Date(regB).getTime() : NaN;
      }

      const validA = !isNaN(timeA);
      const validB = !isNaN(timeB);

      if (!validA && !validB) return 0;
      if (!validA) return 1;
      if (!validB) return -1;

      return dir === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }

  return {
    filteredRows,
    totalFiles,
    activeFilesCount,
    archivedFilesCount,
    totalFiltered: filteredRows.length,
    isFiltered
  };
}
