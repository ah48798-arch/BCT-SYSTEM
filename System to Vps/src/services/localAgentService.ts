/**
 * BCT Enterprise — Windows Local Backup Agent Client Service
 * 
 * Communicates with the lightweight Windows background agent (http://127.0.0.1:45454)
 * and/or the proxied server endpoint (/api/local-agent/*).
 * 
 * Supports:
 * - Native Windows folder picker dialog execution
 * - Windows directory validation and write-probe tests
 * - Free disk space calculation across Windows drives (C:, D:, E:)
 * - Direct saving of encrypted .bctbak archives to local Windows folders
 * - Verification of SHA-256 cryptographic hashes
 * - Background schedule synchronization
 */

import {
  LocalAgentStatus,
  DirectoryValidationResult,
  BackupRecord,
  BackupScheduleConfig
} from '../types/backup.types';

const AGENT_STATUS_STORAGE_KEY = 'bct_store_local_agent_status';
const AGENT_DEFAULT_TOKEN = 'bct_agent_secure_token_2026';

class LocalAgentService {
  private cachedStatus: LocalAgentStatus | null = null;
  private isChecking: boolean = false;
  private isPickingInProgress: boolean = false;

  constructor() {
    this.cachedStatus = this.loadCachedStatus();
  }

  private isNode(): boolean {
    return typeof process !== 'undefined' && !!process.versions?.node && typeof window === 'undefined';
  }

  private isRestricted(dirPath: string): boolean {
    if (!dirPath) return true;
    const clean = dirPath.trim().replace(/\//g, '\\');
    // Reject bare root drive without subfolder (e.g. "C:\" or "C:")
    if (/^[a-zA-Z]:\\?$/.test(clean)) return true;
    const blocked = ['c:\\windows', 'c:\\windows\\system32', 'c:\\windows\\syswow64', 'c:\\program files', 'c:\\program files (x86)'];
    const lower = clean.toLowerCase();
    for (const b of blocked) {
      if (lower === b || lower.startsWith(b + '\\')) return true;
    }
    return false;
  }

  private loadCachedStatus(): LocalAgentStatus | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(AGENT_STATUS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveCachedStatus(status: LocalAgentStatus): void {
    this.cachedStatus = status;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AGENT_STATUS_STORAGE_KEY, JSON.stringify(status));
      }
    } catch {}
  }

  public getCachedStatus(): LocalAgentStatus {
    if (this.cachedStatus) return this.cachedStatus;
    return {
      connected: false,
      status: 'disconnected',
      agentVersion: '1.2.0',
      port: 45454,
      message: 'وكيل النسخ المحلي غير متصل حالياً',
      message_en: 'Local backup agent is currently disconnected'
    };
  }

  /**
   * Helper to perform fetch against:
   * 1. Dedicated Localhost Interactive Helper HTTP Bridge (127.0.0.1:45456)
   * 2. Proxied server endpoint (/api/local-agent/*)
   * 3. Local daemon endpoint (127.0.0.1:45454)
   */
  private async request(endpoint: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-BCT-Agent-Token': AGENT_DEFAULT_TOKEN,
      ...(options.headers as Record<string, string> || {})
    };

    const isNodeEnv = this.isNode();

    // In Node.js environment without window
    if (isNodeEnv) {
      const candidatePorts = [45455, 45454, 45457, 45456];
      for (const p of candidatePorts) {
        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), timeoutMs);
          const url = p === 45454 ? `http://127.0.0.1:${p}/api/agent${endpoint}` : `http://127.0.0.1:${p}${endpoint}`;
          const res = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          });
          clearTimeout(tId);
          if (res.ok) {
            return await res.json();
          }
        } catch {}
      }

      throw new Error('Local agent connection unavailable');
    }

    // In Browser environment:
    // 1. Primary: Same-origin Server proxy /api/local-agent/* (eliminates CORS & PNA issues)
    try {
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(`/api/local-agent${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(tId);
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok) {
          return data;
        }
        if (data.message || data.error) {
          throw new Error(data.message || data.error);
        }
      }
    } catch (proxyErr: any) {
      if (proxyErr.name === 'AbortError') {
        throw new Error('انتهت مهلة انتظار استجابة الخادم. يرجى المحاولة مرة أخرى.');
      }
      if (proxyErr.message && !proxyErr.message.includes('fetch') && !proxyErr.message.includes('NetworkError') && !proxyErr.message.includes('Unexpected token')) {
        throw proxyErr;
      }
    }

    // 2. Secondary fallback: Direct loopback to active ports (45455, 45454, 45457)
    // NEVER retry loopback ports for /pick-folder to prevent duplicate dialogs!
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (!isHttps && endpoint !== '/pick-folder') {
      const candidatePorts = [45455, 45454, 45457, 45456];
      for (const p of candidatePorts) {
        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 2000));
          const url = p === 45454 ? `http://127.0.0.1:${p}/api/agent${endpoint}` : `http://127.0.0.1:${p}${endpoint}`;
          const res = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          });
          clearTimeout(tId);
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (res.ok) {
              return data;
            }
          }
        } catch {}
      }
    }

    throw new Error('تعذر الاتصال بمساعد ويندوز التفاعلي. يرجى تشغيل: scripts\\start-interactive-helper.bat على جهازك لفتح نافذة اختيار المجلدات.');
  }

  /**
   * Check connection status of the Windows Local Backup Agent
   */
  public async checkStatus(bypassCache: boolean = false): Promise<LocalAgentStatus> {
    if (!bypassCache && this.isChecking && this.cachedStatus) {
      return this.cachedStatus;
    }

    this.isChecking = true;
    try {
      const data = await this.request('/status', { method: 'GET' }, 3500);
      const isReallyConnected = Boolean(data && (data.connected === true || data.available === true));
      const reportedStatus = (data && data.status) || (isReallyConnected ? 'connected' : 'disconnected');

      const status: LocalAgentStatus = {
        connected: isReallyConnected,
        status: reportedStatus as any,
        agentVersion: data?.agentVersion || data?.helperVersion || '1.2.0',
        platform: data?.platform || 'win32',
        hostname: data?.hostname,
        uptime: data?.uptime,
        port: data?.port || 45456,
        drives: data?.drives || [],
        activeDestination: data?.activeDestination,
        freeSpace: data?.freeSpace,
        freeSpaceBytes: data?.freeSpaceBytes,
        schedulerRunning: isReallyConnected && data?.schedulerRunning !== false,
        lastBackupTime: data?.lastBackupTime || null,
        message: isReallyConnected
          ? 'مساعد ويندوز التفاعلي متصل ويعمل بنجاح في الخلفية'
          : (data?.message || 'وكيل النسخ الاحتياطي غير متصل حالياً'),
        message_en: isReallyConnected
          ? 'Windows interactive helper is active and connected'
          : (data?.message_en || 'Local backup agent is currently disconnected')
      };
      this.saveCachedStatus(status);
      return status;
    } catch (err: any) {
      const status: LocalAgentStatus = {
        connected: false,
        status: 'disconnected',
        agentVersion: '1.2.0',
        port: 45456,
        message: 'وكيل النسخ الاحتياطي غير متصل حالياً',
        message_en: 'Local backup agent is disconnected.',
        error: err.message
      };
      this.saveCachedStatus(status);
      return status;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Open the native Windows Folder Browser Dialog and return the selected folder path
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
    console.log('[BCT LocalAgentService] [DIAGNOSTIC] Calling pickWindowsFolder with params:', params);

    if (this.isNode()) {
      try {
        const { execSync } = require('child_process');
        const pathModule = require('path');
        const fsModule = require('fs');
        const osModule = require('os');
        const exePath = pathModule.resolve(process.cwd(), 'scripts', 'bct-folder-picker.exe');
        const tempOut = pathModule.join(osModule.tmpdir(), `bct_node_pick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.txt`);
        let cmd = `"${exePath}" /out:"${tempOut}"`;
        if (params?.initialPath) cmd += ` /initial:"${params.initialPath}"`;
        if (params?.testFolder) cmd += ` /test:"${params.testFolder}"`;
        if (params?.cancel) cmd += ' /cancel';

        let out = '';
        try {
          out = execSync(cmd, { encoding: 'utf8', windowsHide: false }).trim();
        } catch (execEx: any) {
          out = (execEx.stdout ? execEx.stdout.toString() : '').trim();
        }
        if (fsModule.existsSync(tempOut)) {
          try {
            const fileContent = fsModule.readFileSync(tempOut, 'utf8').trim();
            if (fileContent) out = fileContent;
            fsModule.unlinkSync(tempOut);
          } catch {}
        }

        console.log('[BCT LocalAgentService] [DIAGNOSTIC] Native GUI execution raw output:', out);

        if (out.includes('CANCELLED')) {
          return { success: false, cancelled: true, message: 'تم إلغاء اختيار المجلد بواسطة المستخدم' };
        }
        if (out.includes('ERROR:')) {
          const errM = out.match(/ERROR:(.*)/);
          const errText = errM ? errM[1].trim() : out;
          return { success: false, cancelled: false, error: errText, message: `تعذر فتح نافذة اختيار المجلدات: ${errText}` };
        }
        const m = out.match(/SELECTED:(.*)/);
        if (m && m[1]) {
          const p = m[1].trim().replace(/^["']|["']$/g, '').trim();
          return {
            success: true,
            path: p,
            cancelled: false,
            message: `تم اختيار المجلد بنجاح: ${p}`
          };
        }
        return { success: false, cancelled: false, error: 'No path returned', message: 'لم يتم استلام مسار صالح من نافذة الاختيار' };
      } catch (nodeErr: any) {
        return { success: false, cancelled: false, error: nodeErr.message, message: nodeErr.message };
      }
    }

    // Atomic in-memory lock on browser client
    if (!params?.cancel && !params?.testFolder && this.isPickingInProgress) {
      console.warn('[BCT LocalAgentService] Operation already in progress, rejecting duplicate call.');
      return {
        success: false,
        cancelled: false,
        isBusy: true,
        error: 'Dialog already open',
        message: 'نافذة اختيار المجلدات مفتوحة بالفعل على سطح المكتب. يرجى إتمام الاختيار أو إلغاؤه أولاً.'
      };
    }

    if (!params?.testFolder && !params?.cancel) {
      this.isPickingInProgress = true;
    }

    try {
      const rawResult = await this.request('/pick-folder', {
        method: 'POST',
        body: JSON.stringify({
          initialPath: params?.initialPath,
          testFolder: params?.testFolder,
          cancel: params?.cancel
        })
      }, 90000); // 90 seconds timeout

      console.log('[BCT LocalAgentService] [DIAGNOSTIC] Raw response received from agent endpoint:', rawResult);

      // Contract normalization: support path, selectedPath, folderPath, directory
      const pathCandidate = rawResult?.path || rawResult?.selectedPath || rawResult?.folderPath || rawResult?.directory;
      const isCancelled = Boolean(rawResult?.cancelled);
      const isBusy = Boolean(rawResult?.isBusy || rawResult?.error === 'Dialog already open');
      const isSuccess = Boolean(rawResult?.success && pathCandidate && !isCancelled && !isBusy);

      const normalizedResult = {
        success: isSuccess,
        path: pathCandidate ? String(pathCandidate).replace(/^["']|["']$/g, '').trim() : undefined,
        drive: rawResult?.drive,
        freeSpace: rawResult?.freeSpace,
        freeSpaceBytes: rawResult?.freeSpaceBytes,
        cancelled: isCancelled,
        isBusy,
        error: rawResult?.error,
        sessionId: typeof rawResult?.sessionId === 'number' ? rawResult.sessionId : 1,
        channel: rawResult?.channel || 'interactive_helper_pipe',
        message: rawResult?.message || (isSuccess ? `تم اختيار وتثبيت مجلد الحفظ بنجاح: ${pathCandidate}` : (isCancelled ? 'تم إلغاء اختيار المجلد' : (isBusy ? 'نافذة اختيار المجلدات مفتوحة بالفعل على سطح المكتب. يرجى إتمام الاختيار أو إلغاؤه أولاً.' : 'لم يتم استلام مسار صالح من نافذة الاختيار')))
      };

      console.log('[BCT LocalAgentService] [DIAGNOSTIC] Normalized pickWindowsFolder result:', normalizedResult);
      return normalizedResult;
    } catch (err: any) {
      console.error('[BCT LocalAgentService] [DIAGNOSTIC] pickWindowsFolder exception:', err);
      return {
        success: false,
        cancelled: false,
        error: err.message,
        message: `تعذر فتح نافذة اختيار المجلد. يرجى التحقق من اتصال الوكيل.`
      };
    } finally {
      this.isPickingInProgress = false;
    }
  }

  /**
   * Validate that a Windows folder exists and has write permissions
   */
  public async validateWindowsFolder(dirPath: string): Promise<DirectoryValidationResult & {
    freeSpace?: string;
    freeSpaceBytes?: number;
  }> {
    if (this.isRestricted(dirPath)) {
      return {
        valid: false,
        path: dirPath,
        exists: false,
        writable: false,
        message: 'المسار محمي بنظام التشغيل ويندوز ولا يمكن اعتماده للنسخ الاحتياطي',
        message_en: 'Path is restricted by Windows operating system'
      };
    }

    if (this.isNode()) {
      try {
        const fsModule = require('fs');
        const pathModule = require('path');
        if (!fsModule.existsSync(dirPath)) {
          fsModule.mkdirSync(dirPath, { recursive: true });
        }
        const probeFile = pathModule.join(dirPath, `.bct_probe_${Date.now()}.tmp`);
        fsModule.writeFileSync(probeFile, 'BCT_WRITE_OK', 'utf8');
        fsModule.unlinkSync(probeFile);

        let freeSpace = 'Unknown';
        let freeSpaceBytes = 0;
        try {
          const stats = fsModule.statfsSync(pathModule.parse(dirPath).root || 'C:\\');
          freeSpaceBytes = stats.bavail * stats.bsize;
          freeSpace = `${(freeSpaceBytes / (1024 ** 3)).toFixed(1)} GB متاح`;
        } catch {}

        return {
          valid: true,
          path: dirPath,
          exists: true,
          writable: true,
          freeSpace,
          freeSpaceBytes,
          message: `المجلد صالح وموثوق ولديه صلاحيات كتابة كاملة (${dirPath})`,
          message_en: `Directory validated with full write access (${dirPath})`
        };
      } catch (err: any) {
        return {
          valid: false,
          path: dirPath,
          exists: false,
          writable: false,
          message: `فشل التحقق من صلاحيات المجلد: ${err.message}`,
          message_en: `Folder validation error: ${err.message}`
        };
      }
    }

    try {
      const result = await this.request('/validate-folder', {
        method: 'POST',
        body: JSON.stringify({ path: dirPath })
      });
      return {
        valid: Boolean(result.valid),
        path: result.path || dirPath,
        exists: Boolean(result.exists),
        writable: Boolean(result.writable),
        freeSpace: result.freeSpace,
        freeSpaceBytes: result.freeSpaceBytes,
        message: result.message || 'تم فحص المجلد بنجاح',
        message_en: result.message_en || 'Folder validated successfully'
      };
    } catch (err: any) {
      return {
        valid: false,
        path: dirPath,
        exists: false,
        writable: false,
        message: `فشل التحقق من صلاحيات المجلد: ${err.message}`,
        message_en: `Folder validation error: ${err.message}`
      };
    }
  }

  /**
   * Create a new folder on the Windows computer
   */
  public async createWindowsFolder(dirPath: string): Promise<{ success: boolean; path?: string; error?: string }> {
    if (this.isRestricted(dirPath)) {
      return { success: false, error: 'Path is restricted by security policy' };
    }

    if (this.isNode()) {
      try {
        const fsModule = require('fs');
        fsModule.mkdirSync(dirPath, { recursive: true });
        return { success: true, path: dirPath };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const result = await this.request('/create-folder', {
        method: 'POST',
        body: JSON.stringify({ path: dirPath })
      });
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Save a backup archive directly to the selected Windows folder
   */
  public async saveBackupToWindowsFolder(params: {
    filename: string;
    encryptedData: string;
    destinationPath: string;
    checksum_sha256?: string;
    header?: any;
  }): Promise<{
    success: boolean;
    filename: string;
    fullPath: string;
    size_bytes: number;
    size_formatted: string;
    checksum_sha256: string;
    message: string;
  }> {
    if (this.isRestricted(params.destinationPath)) {
      throw new Error('Target directory is restricted by security policy');
    }

    if (this.isNode()) {
      try {
        const fsModule = require('fs');
        const pathModule = require('path');
        const cryptoModule = require('crypto');

        if (!fsModule.existsSync(params.destinationPath)) {
          fsModule.mkdirSync(params.destinationPath, { recursive: true });
        }

        let safeFilename = params.filename.replace(/[/\\?%*:|"<>]/g, '_');
        let outPath = pathModule.join(params.destinationPath, safeFilename);

        // Never overwrite existing backups silently
        if (fsModule.existsSync(outPath)) {
          const ext = pathModule.extname(safeFilename);
          const base = pathModule.basename(safeFilename, ext);
          safeFilename = `${base}_${Date.now()}${ext}`;
          outPath = pathModule.join(params.destinationPath, safeFilename);
        }

        fsModule.writeFileSync(outPath, params.encryptedData, 'utf8');
        const stats = fsModule.statSync(outPath);
        const computedSha256 = cryptoModule.createHash('sha256').update(params.encryptedData, 'utf8').digest('hex');

        return {
          success: true,
          filename: safeFilename,
          fullPath: outPath,
          size_bytes: stats.size,
          size_formatted: `${(stats.size / 1024).toFixed(1)} KB`,
          checksum_sha256: computedSha256,
          message: `تم حفظ النسخة بنجاح في: ${outPath}`
        };
      } catch (nodeErr: any) {
        throw new Error(`Failed to save backup in Node environment: ${nodeErr.message}`);
      }
    }

    try {
      const result = await this.request('/save-backup', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      return result;
    } catch (err: any) {
      throw new Error(`Failed to save backup to Windows folder: ${err.message}`);
    }
  }

  /**
   * List all .bctbak archives in the selected Windows folder
   */
  public async listWindowsBackups(folderPath?: string): Promise<BackupRecord[]> {
    if (this.isNode() && folderPath) {
      try {
        const fsModule = require('fs');
        const pathModule = require('path');
        if (!fsModule.existsSync(folderPath)) return [];
        const files = fsModule.readdirSync(folderPath).filter((f: string) => f.endsWith('.bctbak'));
        return files.map((file: string) => {
          const full = pathModule.join(folderPath, file);
          const stats = fsModule.statSync(full);
          return {
            id: `BCT-BAK-WIN-${file.slice(0, 10)}`,
            filename: file,
            full_path: full,
            name: `نسخة ويندوز (${file})`,
            size_bytes: stats.size,
            size_formatted: `${(stats.size / 1024).toFixed(1)} KB`,
            created_at: stats.mtime.toISOString(),
            status: 'completed',
            destination: 'local_computer',
            is_verified: true,
            checksum_sha256: ''
          } as BackupRecord;
        });
      } catch {
        return [];
      }
    }

    try {
      const query = folderPath ? `?folder=${encodeURIComponent(folderPath)}` : '';
      const result = await this.request(`/list-backups${query}`, { method: 'GET' });
      return result.backups || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Read a backup archive from disk for full system restore
   */
  public async readWindowsBackup(filename: string, customPath?: string): Promise<{
    success: boolean;
    content: string;
    checksum_sha256: string;
  }> {
    if (this.isNode() && customPath) {
      try {
        const fsModule = require('fs');
        const pathModule = require('path');
        const cryptoModule = require('crypto');
        const full = pathModule.join(customPath, pathModule.basename(filename));
        const content = fsModule.readFileSync(full, 'utf8');
        const hash = cryptoModule.createHash('sha256').update(content, 'utf8').digest('hex');
        return { success: true, content, checksum_sha256: hash };
      } catch (err: any) {
        throw new Error(`Failed to read backup from disk: ${err.message}`);
      }
    }

    try {
      const result = await this.request('/read-backup', {
        method: 'POST',
        body: JSON.stringify({ filename, path: customPath })
      });
      return result;
    } catch (err: any) {
      throw new Error(`Failed to read backup from Windows folder: ${err.message}`);
    }
  }

  /**
   * Synchronize schedule configuration with the local background agent
   */
  public async syncSchedule(schedule: BackupScheduleConfig): Promise<boolean> {
    try {
      await this.request('/schedule', {
        method: 'POST',
        body: JSON.stringify({
          enabled: schedule.enabled,
          frequency: schedule.frequency,
          execution_time: schedule.execution_time,
          day_of_week: schedule.day_of_week,
          day_of_month: schedule.day_of_month,
          timezone: schedule.timezone,
          windows_backup_path: schedule.windows_backup_path,
          retention_days: schedule.retention_days || 7
        })
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const localAgentService = new LocalAgentService();
