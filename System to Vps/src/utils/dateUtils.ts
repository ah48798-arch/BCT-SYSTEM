/**
 * BCT Enterprise Date Formatting & Authoritative Timestamp Utilities
 * Standardizes registration dates, last-update timestamps, and datetime displays.
 */

import { Student, StudentFile, StudentFileActivityRecord, AuditLog } from '../types/database.types';

export interface FormattedCreationDate {
  isValid: boolean;
  date: string;       // Uniform DD-MM-YYYY format or fallback "غير متوفر" / "N/A"
  time: string;       // Formatted time with period (e.g. "10:00 ص" / "10:00 AM") or empty if invalid
  display: string;    // Full formatted string e.g. "01-10-2026 (10:00 ص)" or "غير متوفر"
  isoString?: string; // Original ISO string if valid
}

/**
 * Formats a file creation timestamp strictly in DD-MM-YYYY format with clear time display.
 * If the input is missing, empty, or invalid, returns "غير متوفر" (Arabic) or "N/A" (English).
 *
 * @param isoString The ISO 8601 string from student_file.created_at
 * @param isRtl Whether the current UI context is RTL / Arabic
 */
export function formatFileCreationDate(
  isoString?: string | null,
  isRtl: boolean = true
): FormattedCreationDate {
  const fallbackText = isRtl ? 'غير متوفر' : 'N/A';

  if (!isoString || typeof isoString !== 'string' || !isoString.trim()) {
    return {
      isValid: false,
      date: fallbackText,
      time: '',
      display: fallbackText,
    };
  }

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return {
      isValid: false,
      date: fallbackText,
      time: '',
      display: fallbackText,
    };
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const isPm = hours >= 12;
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const hoursStr = String(displayHours).padStart(2, '0');
  const period = isRtl ? (isPm ? 'م' : 'ص') : (isPm ? 'PM' : 'AM');
  const timeStr = `${hoursStr}:${minutes} ${period}`;

  return {
    isValid: true,
    date: dateStr,
    time: timeStr,
    display: `${dateStr} (${timeStr})`,
    isoString,
  };
}

/**
 * Resolves the authoritative latest modification or action timestamp for a student's file.
 * Evaluates:
 * 1. File activities (excluding initial FILE_CREATED)
 * 2. File last_action_at and last_updated_at (if strictly after creation or non-FILE_CREATED)
 * 3. Stage transition timestamps (if current_status !== 'new')
 * 4. Relevant audit logs for modifications on student or files
 *
 * If no legitimate updates or post-creation actions exist, returns null (no fallback guessing).
 */
export function getStudentLastUpdateTimestamp(
  student: Student,
  files: StudentFile[],
  activities: StudentFileActivityRecord[] = [],
  auditLogs: AuditLog[] = []
): string | null {
  const studentFiles = files.filter(f => f.student_id === student.id);
  const fileIds = new Set(studentFiles.map(f => f.id));
  const candidateTimes: number[] = [];

  // A. File Activities (excluding initial FILE_CREATED record)
  const relevantActivities = activities.filter(a => fileIds.has(a.student_file_id));
  for (const act of relevantActivities) {
    if (act.action_type === 'FILE_CREATED') continue;
    if (act.timestamp) {
      const t = new Date(act.timestamp).getTime();
      if (!isNaN(t)) candidateTimes.push(t);
    }
  }

  // B. File Fields
  for (const file of studentFiles) {
    const tCreated = file.created_at ? new Date(file.created_at).getTime() : NaN;

    if (file.last_action_at) {
      const tAction = new Date(file.last_action_at).getTime();
      if (!isNaN(tAction)) {
        if (file.last_action_type !== 'FILE_CREATED' || (!isNaN(tCreated) && tAction > tCreated)) {
          candidateTimes.push(tAction);
        }
      }
    }

    if (file.last_updated_at) {
      const tUpdate = new Date(file.last_updated_at).getTime();
      if (!isNaN(tUpdate)) {
        if (!isNaN(tCreated) ? tUpdate > tCreated : true) {
          candidateTimes.push(tUpdate);
        }
      }
    }

    if (file.current_status !== 'new' && file.current_stage_entered_at) {
      const tStage = new Date(file.current_stage_entered_at).getTime();
      if (!isNaN(tStage)) {
        if (!isNaN(tCreated) ? tStage > tCreated : true) {
          candidateTimes.push(tStage);
        }
      }
    }

    if (file.closed_at) {
      const tClosed = new Date(file.closed_at).getTime();
      if (!isNaN(tClosed)) candidateTimes.push(tClosed);
    }

    if (file.evaluated_at) {
      const tEval = new Date(file.evaluated_at).getTime();
      if (!isNaN(tEval)) candidateTimes.push(tEval);
    }

    if (file.archived_at) {
      const tArch = new Date(file.archived_at).getTime();
      if (!isNaN(tArch)) candidateTimes.push(tArch);
    }
  }

  // C. Audit Logs for student and file modifications
  for (const log of auditLogs) {
    const isStudentTarget = log.resource_type === 'student' && log.resource_id === student.id;
    const isFileTarget = log.resource_type === 'student_file' && fileIds.has(log.resource_id || '');
    if (isStudentTarget || isFileTarget) {
      const act = log.action || '';
      if (
        act.startsWith('UPDATE') ||
        act.includes('EDIT') ||
        act.includes('STAGE') ||
        act.includes('PAYMENT') ||
        act.includes('ASSIGN') ||
        act.includes('NOTE') ||
        act.includes('CHOICE') ||
        act.includes('ESCALATE') ||
        act.includes('CORRECTION')
      ) {
        const tLog = new Date(log.created_at).getTime();
        const tReg = student.created_at ? new Date(student.created_at).getTime() : NaN;
        if (!isNaN(tLog) && (!isNaN(tReg) ? tLog > tReg : true)) {
          candidateTimes.push(tLog);
        }
      }
    }
  }

  if (candidateTimes.length === 0) {
    return null;
  }

  const latestTime = Math.max(...candidateTimes);
  return new Date(latestTime).toISOString();
}

export interface StudentDateResolution {
  isoString: string | null;
  isUpdate: boolean;
  hasRecordedUpdate: boolean;
}

/**
 * Resolves the date value to be presented according to the active date filter
 */
export function getStudentDateValue(
  student: Student,
  files: StudentFile[],
  dateField: string = 'student_reg',
  activities: StudentFileActivityRecord[] = [],
  auditLogs: AuditLog[] = []
): StudentDateResolution {
  if (dateField === 'last_update') {
    const lastUpdateIso = getStudentLastUpdateTimestamp(student, files, activities, auditLogs);
    return {
      isoString: lastUpdateIso,
      isUpdate: true,
      hasRecordedUpdate: Boolean(lastUpdateIso),
    };
  }

  // Default: student_reg
  const primaryFile = files.find(f => f.student_id === student.id);
  const regIso = student.created_at || primaryFile?.created_at || null;
  return {
    isoString: regIso,
    isUpdate: false,
    hasRecordedUpdate: true,
  };
}
