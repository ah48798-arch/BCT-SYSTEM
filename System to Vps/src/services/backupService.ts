/**
 * BCT Enterprise — Unified Backup & Restore Management Service
 * Orchestrates backup snapshots, schedules, retention, Google Drive, and system restorations.
 */

import {
  BackupRecord,
  BackupScheduleConfig,
  BackupRetentionPolicy,
  GoogleDriveConfig,
  BackupOverviewStats,
  BackupVerificationResult,
  BackupFilter,
  BackupType,
  BackupDestination,
  GoogleDriveFolderItem,
  DirectoryValidationResult,
  ApprovedDirectoryItem,
  LocalAgentStatus,
  BackupDestinationsConfig
} from '../types/backup.types';
import { bctStore } from './store';
import { googleDriveService } from './googleDriveService';
import { localAgentService } from './localAgentService';
import { rbacService } from './rbacService';
import { Employee } from '../types/database.types';
import { formatBytes } from '../utils/backupCrypto';

class BackupService {
  /**
   * Calculate summary KPI overview metrics
   */
  public getOverviewStats(): BackupOverviewStats {
    const allBackups = bctStore.getBackupRecords();
    const completedBackups = allBackups.filter(b => b.status === 'completed');
    const sortedCompleted = [...completedBackups].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastSuccessful = sortedCompleted.length > 0 ? sortedCompleted[0] : null;

    const totalStorageBytes = allBackups.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0);
    const failedAttempts = allBackups.filter(b => b.status === 'failed').length;
    const localCount = allBackups.filter(b => b.destination === 'local' || b.destination === 'both').length;
    const driveCount = allBackups.filter(b => b.destination === 'google_drive' || b.destination === 'both').length;

    const schedule = bctStore.getBackupSchedule();
    const nextScheduled = this.calculateNextScheduledRun(schedule);

    return {
      total_backups: allBackups.length,
      last_successful_backup: lastSuccessful,
      next_scheduled_backup: nextScheduled,
      total_storage_used_bytes: totalStorageBytes,
      total_storage_used_formatted: formatBytes(totalStorageBytes),
      failed_attempts_count: failedAttempts,
      local_backups_count: localCount,
      google_drive_backups_count: driveCount
    };
  }

  /**
   * Filter and search backups list
   */
  public getBackups(filter?: BackupFilter): BackupRecord[] {
    let list = bctStore.getBackupRecords();

    if (!filter) {
      return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      list = list.filter(
        b =>
          b.id.toLowerCase().includes(q) ||
          b.filename.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          (b.created_by_name && b.created_by_name.toLowerCase().includes(q))
      );
    }

    if (filter.type && filter.type !== 'all') {
      list = list.filter(b => b.type === filter.type);
    }

    if (filter.destination && filter.destination !== 'all') {
      list = list.filter(b => b.destination === filter.destination || b.destination === 'both');
    }

    if (filter.status && filter.status !== 'all') {
      list = list.filter(b => b.status === filter.status);
    }

    if (filter.startDate) {
      const startMs = new Date(filter.startDate).getTime();
      list = list.filter(b => new Date(b.created_at).getTime() >= startMs);
    }

    if (filter.endDate) {
      const endMs = new Date(filter.endDate).getTime() + 86400000;
      list = list.filter(b => new Date(b.created_at).getTime() <= endMs);
    }

    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Create a manual or scheduled backup snapshot
   */
  public async createBackup(params: {
    type: BackupType;
    destination: BackupDestination;
    actor: Employee;
    note?: string;
  }): Promise<{ success: boolean; record: BackupRecord; message: string; message_en: string; encryptedArchive?: string }> {
    const { type, destination, actor, note } = params;

    // Check permissions
    if (!rbacService.canCreateBackup(actor)) {
      throw new Error('ليس لديك صلاحية لإنشاء نسخة احتياطية جديدة (Permission Denied: backup:create).');
    }

    // Effective destination enablement
    const schedule = this.getSchedule();
    const destinations = schedule.destinations;

    const isWindowsEnabled = destinations?.local_computer !== undefined
      ? Boolean(destinations.local_computer.enabled)
      : true;

    const isServerEnabled = destinations?.server_storage !== undefined
      ? Boolean(destinations.server_storage.enabled)
      : true;

    const isDriveEnabled = destinations?.google_drive !== undefined
      ? Boolean(destinations.google_drive.enabled)
      : false;

    // Strict validation: Reject operations targeted to disabled destinations
    if (destination === 'local_computer') {
      if (!isWindowsEnabled) {
        throw new Error('وجهة الكمبيوتر المحلي (ويندوز) معطلة حالياً في الإعدادات. يرجى تفعيلها أولاً لإجراء النسخ.');
      }
    }
    if ((destination === 'server' || destination === 'server_storage' || destination === 'local') && !isServerEnabled) {
      throw new Error('وجهة التخزين الداخلي على الخادم معطلة حالياً في الإعدادات. يرجى تفعيلها أولاً لإجراء النسخ.');
    }
    if (destination === 'google_drive' && !isDriveEnabled) {
      throw new Error('وجهة Google Drive معطلة حالياً في الإعدادات أو الحساب غير مرتبط. يرجى تفعيلها وربط الحساب أولاً.');
    }
    if (destination === 'both' && !isServerEnabled && !isDriveEnabled) {
      throw new Error('وجهات النسخ المطلوبة (الخادم وجوجل درايف) كلاهما معطل في الإعدادات.');
    }
    if (destination === 'multi' && !isWindowsEnabled && !isServerEnabled && !isDriveEnabled) {
      throw new Error('جميع وجهات النسخ الاحتياطي معطلة حالياً. يرجى تفعيل وجهة واحدة على الأقل في الإعدادات.');
    }

    // Create snapshot in store
    const result = await bctStore.createBackup(type, destination, actor.username, note);

    if (result.success && result.encryptedArchive) {
      // 1. Local Computer (Windows Folder via Local Agent)
      // When disabled, NEVER write to local computer!
      const shouldWriteWindows = isWindowsEnabled && (
        destination === 'local_computer' || destination === 'multi'
      );
      if (shouldWriteWindows) {
        const winPath = destinations?.local_computer?.path || schedule.windows_backup_path;
        if (winPath) {
          try {
            const agentStatus = await this.getLocalAgentStatus();
            if (agentStatus.connected) {
              const saveRes = await localAgentService.saveBackupToWindowsFolder({
                filename: result.record.filename,
                encryptedData: result.encryptedArchive,
                destinationPath: winPath,
                checksum_sha256: result.record.checksum_sha256,
                header: {
                  backup_id: result.record.id,
                  name: result.record.name,
                  created_by: actor.username
                }
              });

              if (saveRes && saveRes.success) {
                result.record.filename = saveRes.filename;
                result.record.full_path = saveRes.fullPath;
                result.record.size_bytes = saveRes.size_bytes;
                result.record.size_formatted = saveRes.size_formatted;
                result.record.checksum_sha256 = saveRes.checksum_sha256;
                bctStore.updateBackupRecord(result.record);
              }
            }
          } catch (agentErr: any) {
            console.warn('[BackupService] Background agent mirror skipped:', agentErr.message);
          }
        }
      }

      // 2. Google Drive Cloud Vault
      // When disabled, NEVER upload to Google Drive!
      const shouldWriteDrive = isDriveEnabled && (
        destination === 'google_drive' || destination === 'both' || destination === 'multi'
      );
      if (shouldWriteDrive) {
        const driveConfig = googleDriveService.getConfig();
        if (driveConfig.connected) {
          try {
            await googleDriveService.uploadBackupFile(result.record, result.encryptedArchive);
          } catch (driveErr) {
            console.error('[BackupService] Drive upload error:', driveErr);
          }
        }
      }

      // 3. Server Storage
      // When disabled, NEVER save to server storage!
      const shouldWriteServer = isServerEnabled && (
        destination === 'server' || destination === 'server_storage' || destination === 'local' || destination === 'both' || destination === 'multi'
      );
      if (shouldWriteServer) {
        this.saveBackupToServer(result.record.filename, result.encryptedArchive).catch(() => {});
        this.syncStateToServer(result.encryptedArchive).catch(() => {});
      }
    }

    return {
      success: result.success,
      record: result.record,
      encryptedArchive: result.encryptedArchive,
      message: result.message,
      message_en: result.message_en
    };
  }

  /**
   * Save official .bctbak archive to server storage via API
   */
  public async saveBackupToServer(filename: string, fileContent: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/backups/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, fileContent })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Trigger local browser download of .bctbak archive file
   */
  public async downloadBackupFile(backup: BackupRecord): Promise<void> {
    // If running in browser and file is on server, try downloading directly from server endpoint
    if (typeof window !== 'undefined') {
      try {
        const checkRes = await fetch(`/api/backups/download/${encodeURIComponent(backup.filename)}`, { method: 'HEAD' });
        if (checkRes.ok) {
          const a = document.createElement('a');
          a.href = `/api/backups/download/${encodeURIComponent(backup.filename)}`;
          a.download = backup.filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => document.body.removeChild(a), 150);
          return;
        }
      } catch {}
    }

    // Fallback: generate and download fresh snapshot using the standardized bctbak format
    const snapshot = bctStore.exportFullDatabaseSnapshot(backup.created_by, backup.type, backup.destination, backup.name);
    const content = snapshot.rawEncrypted;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backup.filename.endsWith('.bctbak') ? backup.filename : `${backup.filename}.bctbak`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  /**
   * Verify backup archive integrity, magic signature, and SHA-256 checksum
   */
  public async verifyBackupFile(contentOrFile: string | File): Promise<BackupVerificationResult> {
    let rawContent = '';
    if (typeof contentOrFile === 'string') {
      rawContent = contentOrFile;
    } else {
      rawContent = await contentOrFile.text();
    }
    return bctStore.verifyBackupArchive(rawContent);
  }

  /**
   * Restore full system state from local .bctbak file or payload
   * (Strictly restricted to GM / Super Admin)
   */
  public async restoreBackup(
    contentOrFile: string | File,
    actor: Employee
  ): Promise<{
    success: boolean;
    message: string;
    message_en: string;
    safetyRecord?: BackupRecord;
    restoredTables?: number;
    restoredRecords?: number;
  }> {
    // RBAC Security Gate: Restoration strictly restricted to Super Admin / GM
    if (!rbacService.canRestoreBackup(actor)) {
      return {
        success: false,
        message: 'حظر أمني: عملية استعادة النظام بالكامل مقصورة حصراً على المدير العام والمسؤول الأعلى للنظام (Super Admin / GM).',
        message_en: 'Security Block: Full system restoration is strictly restricted to the General Manager and Super Admin.'
      };
    }

    let rawContent = '';
    if (typeof contentOrFile === 'string') {
      rawContent = contentOrFile;
    } else {
      rawContent = await contentOrFile.text();
    }

    const verification = bctStore.verifyBackupArchive(rawContent);
    if (!verification.valid) {
      return {
        success: false,
        message: `فشل التحقق من سلامة ملف النسخة الاحتياطية:\n${verification.errors.join('\n')}`,
        message_en: `Backup archive integrity verification failed:\n${verification.errors.join('\n')}`
      };
    }

    const result = await bctStore.restoreFullDatabaseSnapshot(rawContent, actor.username);

    // Sync restored state to server
    if (result.success) {
      this.syncStateToServer(rawContent).catch(() => {});
    }

    return result;
  }

  /**
   * Restore full system state from Google Drive file
   */
  public async restoreFromGoogleDrive(
    driveFileId: string,
    actor: Employee
  ): Promise<{
    success: boolean;
    message: string;
    message_en: string;
    safetyRecord?: BackupRecord;
    restoredTables?: number;
    restoredRecords?: number;
  }> {
    if (!rbacService.canRestoreBackup(actor)) {
      return {
        success: false,
        message: 'حظر أمني: عملية استعادة النظام بالكامل مقصورة حصراً على المدير العام والمسؤول الأعلى للنظام.',
        message_en: 'Security Block: Full system restoration is strictly restricted to Super Admin / GM.'
      };
    }

    const downloadResult = await googleDriveService.downloadDriveBackup(driveFileId);
    if (!downloadResult.success || !downloadResult.content) {
      return {
        success: false,
        message: `فشل تحميل ملف النسخة الاحتياطية من جوجل درايف: ${downloadResult.message}`,
        message_en: `Failed to download backup file from Google Drive: ${downloadResult.message_en}`
      };
    }

    return this.restoreBackup(downloadResult.content, actor);
  }

  /**
   * Delete a backup record with safety checks
   * (Strictly restricted to GM / Super Admin)
   */
  public async deleteBackup(
    id: string,
    actor: Employee
  ): Promise<{ success: boolean; message: string; message_en: string }> {
    if (!rbacService.canDeleteBackup(actor)) {
      return {
        success: false,
        message: 'حظر أمني: عملية حذف النسخ الاحتياطية مقصورة حصراً على المدير العام والمسؤول الأعلى للنظام.',
        message_en: 'Security Block: Deletion of system backups is strictly restricted to Super Admin / GM.'
      };
    }

    const result = bctStore.deleteBackupRecord(id, actor.username);

    // Try deleting on server if online
    if (result.success && typeof window !== 'undefined') {
      fetch(`/api/backups/${id}`, { method: 'DELETE' }).catch(() => {});
    }

    return result;
  }

  /**
   * Schedule configuration
   */
  public getSchedule(): BackupScheduleConfig {
    return bctStore.getBackupSchedule();
  }

  public saveSchedule(config: Partial<BackupScheduleConfig>, actor: Employee): BackupScheduleConfig {
    if (!rbacService.canScheduleBackup(actor)) {
      throw new Error('ليس لديك صلاحية لتعديل جدولة النسخ الاحتياطي.');
    }
    const saved = bctStore.saveBackupSchedule(config, actor.username);

    // Push schedule to server background runner
    if (typeof window !== 'undefined') {
      fetch('/api/backups/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved)
      }).catch(() => {});
    }

    return saved;
  }

  /**
   * Retention policy configuration
   */
  public getRetentionPolicy(): BackupRetentionPolicy {
    return bctStore.getBackupRetention();
  }

  public saveRetentionPolicy(policy: Partial<BackupRetentionPolicy>, actor: Employee): BackupRetentionPolicy {
    if (!rbacService.canScheduleBackup(actor)) {
      throw new Error('ليس لديك صلاحية لتعديل سياسة الاحتفاظ بالنسخ.');
    }
    return bctStore.saveBackupRetention(policy, actor.username);
  }

  /**
   * Google Drive integration wrappers
   */
  public getGoogleDriveConfig(): GoogleDriveConfig {
    return googleDriveService.getConfig();
  }

  public async connectGoogleDrive(params: {
    email?: string;
    accessToken?: string;
  }): Promise<{ success: boolean; message: string; message_en: string }> {
    const res = await googleDriveService.connectAccount(params);
    if (res.success) {
      const current = this.getSchedule();
      const updatedDestinations: BackupDestinationsConfig = {
        local_computer: current.destinations?.local_computer || {
          enabled: true,
          path: current.windows_backup_path || 'C:\\Users\\AHMED\\Downloads\\BCT Backups'
        },
        server_storage: current.destinations?.server_storage || {
          enabled: true,
          path: current.local_backup_path || './backups'
        },
        google_drive: {
          ...(current.destinations?.google_drive || {
            folder_id: 'gdrive_folder_bct_root',
            folder_name: 'BCT_Enterprise_Backups'
          }),
          enabled: true
        }
      };
      bctStore.saveBackupSchedule({ destinations: updatedDestinations });
    }
    return res;
  }

  public async disconnectGoogleDrive(): Promise<{ success: boolean; message: string; message_en: string }> {
    const res = await googleDriveService.disconnectAccount();
    if (res.success) {
      const current = this.getSchedule();
      const updatedDestinations: BackupDestinationsConfig = {
        local_computer: current.destinations?.local_computer || {
          enabled: true,
          path: current.windows_backup_path || 'C:\\Users\\AHMED\\Downloads\\BCT Backups'
        },
        server_storage: current.destinations?.server_storage || {
          enabled: true,
          path: current.local_backup_path || './backups'
        },
        google_drive: {
          ...(current.destinations?.google_drive || {
            folder_id: 'gdrive_folder_bct_root',
            folder_name: 'BCT_Enterprise_Backups'
          }),
          enabled: false
        }
      };
      bctStore.saveBackupSchedule({ destinations: updatedDestinations });
    }
    return res;
  }

  public async testGoogleDriveConnection(): Promise<{ success: boolean; message: string; message_en: string }> {
    return googleDriveService.testConnection();
  }

  public async listGoogleDriveBackups(): Promise<BackupRecord[]> {
    const all = bctStore.getBackupRecords();
    return googleDriveService.listDriveBackups(all);
  }

  /**
   * Helper: calculate next scheduled execution time in user-selected timezone
   */
  public calculateNextScheduledRun(config: BackupScheduleConfig): string | null {
    if (!config.enabled || config.frequency === 'manual') {
      return null;
    }

    const [hoursStr, minsStr] = (config.execution_time || '03:00').split(':');
    const targetHours = parseInt(hoursStr || '3', 10);
    const targetMins = parseInt(minsStr || '0', 10);

    const tz = config.timezone || 'Africa/Cairo';
    let nowTz: Date;
    try {
      nowTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    } catch {
      nowTz = new Date();
    }

    const nextDate = new Date(nowTz.getTime());
    nextDate.setHours(targetHours, targetMins, 0, 0);

    if (config.frequency === 'daily') {
      if (nextDate.getTime() <= nowTz.getTime()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
    } else if (config.frequency === 'weekly') {
      const targetDay = config.day_of_week ?? 5; // Default Friday
      let daysUntil = (targetDay - nextDate.getDay() + 7) % 7;
      if (daysUntil === 0 && nextDate.getTime() <= nowTz.getTime()) {
        daysUntil = 7;
      }
      nextDate.setDate(nextDate.getDate() + daysUntil);
    } else if (config.frequency === 'monthly') {
      const targetMonthDay = config.day_of_month || 1;
      nextDate.setDate(targetMonthDay);
      if (nextDate.getTime() <= nowTz.getTime()) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    }

    return nextDate.toISOString();
  }

  /**
   * Validate server directory existence, security permissions, and write access
   */
  public async validateLocalDirectory(directoryPath: string): Promise<DirectoryValidationResult> {
    const cleanPath = (directoryPath || '').trim();
    if (!cleanPath) {
      return {
        valid: false,
        path: cleanPath,
        exists: false,
        writable: false,
        message: 'مسار المجلد لا يمكن أن يكون فارغاً.',
        message_en: 'Directory path cannot be empty.'
      };
    }

    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/backups/validate-directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: cleanPath })
        });
        if (response.ok) {
          const res = await response.json();
          return res;
        }
      } catch {
        // Fallback to client-side validation
      }
    }

    // Client/Offline validation fallback
    const isSafe = !cleanPath.includes('..') && !cleanPath.startsWith('/');
    return {
      valid: isSafe,
      path: cleanPath,
      exists: true,
      writable: isSafe,
      message: isSafe ? 'المجلد صالح ومطابق لمعايير الأمان المعتمدة.' : 'المسار غير مسموح به أمنياً.',
      message_en: isSafe ? 'Directory is valid and complies with security standards.' : 'Path is restricted by security policy.'
    };
  }

  /**
   * Get approved server directory candidates
   */
  public async getApprovedDirectories(): Promise<ApprovedDirectoryItem[]> {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/backups/browse-directories');
        if (response.ok) {
          const res = await response.json();
          if (Array.isArray(res.directories)) {
            return res.directories;
          }
        }
      } catch {}
    }

    return [
      { path: './backups', name: 'المجلد الرئيسي المعتمد (./backups)', name_en: 'Primary Default Directory (./backups)', isDefault: true },
      { path: './backups/daily', name: 'مجلد النسخ اليومي السريع (./backups/daily)', name_en: 'Daily Snapshots Folder (./backups/daily)' },
      { path: './backups/monthly', name: 'مجلد النسخ الشهري الموثق (./backups/monthly)', name_en: 'Monthly Archives Folder (./backups/monthly)' },
      { path: './backups/vault', name: 'خزينة الأمان المتقدمة (./backups/vault)', name_en: 'Secure Enterprise Vault (./backups/vault)' }
    ];
  }

  /**
   * Save configured local backup directory path
   */
  public updateLocalBackupPath(path: string, actor: Employee): BackupScheduleConfig {
    if (!rbacService.canScheduleBackup(actor)) {
      throw new Error('ليس لديك صلاحية لتعديل مسار النسخ الاحتياطي.');
    }
    return bctStore.saveBackupSchedule({ local_backup_path: path }, actor.username);
  }

  /**
   * Windows Local Folder & Agent Integration Methods
   */
  public async pickWindowsFolder(params?: {
    initialPath?: string;
    testFolder?: string;
    cancel?: boolean;
  }): Promise<{
    success: boolean;
    path?: string;
    drive?: string;
    freeSpace?: string;
    freeSpaceBytes?: number;
    cancelled?: boolean;
    isBusy?: boolean;
    error?: string;
    message?: string;
  }> {
    return localAgentService.pickWindowsFolder(params);
  }

  public async validateWindowsFolder(dirPath: string): Promise<DirectoryValidationResult & {
    freeSpace?: string;
    freeSpaceBytes?: number;
  }> {
    return localAgentService.validateWindowsFolder(dirPath);
  }

  public async createWindowsFolder(dirPath: string): Promise<{ success: boolean; path?: string; error?: string }> {
    return localAgentService.createWindowsFolder(dirPath);
  }

  public async getLocalAgentStatus(bypassCache: boolean = false): Promise<LocalAgentStatus> {
    return localAgentService.checkStatus(bypassCache);
  }

  public updateWindowsBackupPath(path: string, actor: Employee): BackupScheduleConfig {
    if (!rbacService.canScheduleBackup(actor)) {
      throw new Error('ليس لديك صلاحية لتعديل مسار النسخ الاحتياطي لويندوز.');
    }
    const current = this.getSchedule();
    const updatedDestinations: BackupDestinationsConfig = {
      local_computer: {
        enabled: current.destinations?.local_computer?.enabled ?? true,
        path: path,
        free_space: current.destinations?.local_computer?.free_space
      },
      server_storage: current.destinations?.server_storage || { enabled: true, path: './backups' },
      google_drive: current.destinations?.google_drive || {
        enabled: false,
        folder_id: 'gdrive_folder_bct_root',
        folder_name: 'BCT_Enterprise_Backups'
      }
    };

    const saved = bctStore.saveBackupSchedule({
      windows_backup_path: path,
      destinations: updatedDestinations
    }, actor.username);

    // Sync schedule with background agent
    localAgentService.syncSchedule(saved).catch(() => {});
    return saved;
  }

  public updateDestinationsConfig(destinations: BackupDestinationsConfig, actor: Employee): BackupScheduleConfig {
    if (!rbacService.canScheduleBackup(actor)) {
      throw new Error('ليس لديك صلاحية لتعديل وجهات النسخ الاحتياطي.');
    }
    const current = this.getSchedule();
    const mergedDestinations: BackupDestinationsConfig = {
      local_computer: {
        enabled: destinations.local_computer?.enabled !== false,
        path: destinations.local_computer?.path || current.destinations?.local_computer?.path || current.windows_backup_path || 'C:\\Users\\AHMED\\Downloads\\BCT Backups',
        agent_status: destinations.local_computer?.agent_status || current.destinations?.local_computer?.agent_status
      },
      server_storage: {
        enabled: destinations.server_storage?.enabled !== false,
        path: destinations.server_storage?.path || current.destinations?.server_storage?.path || current.local_backup_path || './backups'
      },
      google_drive: {
        enabled: Boolean(destinations.google_drive?.enabled),
        folder_id: destinations.google_drive?.folder_id || current.destinations?.google_drive?.folder_id || 'gdrive_folder_bct_root',
        folder_name: destinations.google_drive?.folder_name || current.destinations?.google_drive?.folder_name || 'BCT_Enterprise_Backups'
      }
    };

    const saved = bctStore.saveBackupSchedule({
      destinations: mergedDestinations,
      windows_backup_path: mergedDestinations.local_computer.path,
      local_backup_path: mergedDestinations.server_storage.path
    }, actor.username);

    // Sync with agent
    localAgentService.syncSchedule(saved).catch(() => {});
    return saved;
  }

  /**
   * Google Drive folder browsing and management methods
   */
  public async listGoogleDriveFolders(): Promise<{
    success: boolean;
    folders: GoogleDriveFolderItem[];
    message: string;
    message_en: string;
    tokenExpired?: boolean;
  }> {
    return googleDriveService.listFolders();
  }

  public async selectGoogleDriveFolder(folderId: string, folderName: string): Promise<{
    success: boolean;
    message: string;
    message_en: string;
  }> {
    const res = await googleDriveService.selectFolder(folderId, folderName);
    if (res.success) {
      bctStore.saveGoogleDriveConfig(res.config);
    }
    return {
      success: res.success,
      message: res.message,
      message_en: res.message_en
    };
  }

  public async createGoogleDriveFolder(name: string): Promise<{
    success: boolean;
    folder?: GoogleDriveFolderItem;
    message: string;
    message_en: string;
  }> {
    const res = await googleDriveService.createFolder(name);
    if (res.success && res.folder) {
      bctStore.saveGoogleDriveConfig(googleDriveService.getConfig());
    }
    return res;
  }

  /**
   * Synchronize database state to server
   */
  private async syncStateToServer(encryptedData: string): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await fetch('/api/backups/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData })
      });
    } catch {
      // Offline fallback silent
    }
  }
}

export const backupService = new BackupService();
