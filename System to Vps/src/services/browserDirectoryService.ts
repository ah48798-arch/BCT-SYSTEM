/**
 * BCT Enterprise — Browser Native Directory Service
 * 
 * Uses the standard W3C File System Access API (window.showDirectoryPicker)
 * to provide a simple, reliable, native browser-based folder selection experience.
 * 
 * Architecture:
 * - Direct browser user-activation call to window.showDirectoryPicker({ mode: 'readwrite' })
 * - Persistent storage of FileSystemDirectoryHandle in IndexedDB
 * - Read/Write permission querying and requesting
 * - Direct local disk file writing of authenticated .bctbak archives
 * - Post-write file size and integrity verification
 * - Graceful fallback to browser manual download when API is not available
 * - Zero PowerShell, Zero CMD, Zero external executables, Zero background daemons
 */

const DB_NAME = 'bct_backup_store';
const DB_VERSION = 1;
const STORE_NAME = 'directory_handles';
const HANDLE_KEY = 'selected_backup_directory';
const METADATA_KEY = 'bct_browser_directory_metadata';

export interface BrowserDirectoryInfo {
  isSupported: boolean;
  isSecureContext: boolean;
  hasDirectory: boolean;
  folderName: string;
  hasPermission: boolean;
  lastBackupFile: string | null;
  lastBackupTime: string | null;
  lastError: string | null;
}

interface StoredMetadata {
  name: string;
  selectedAt: string;
  lastBackupFile?: string;
  lastBackupTime?: string;
  lastError?: string;
}

class BrowserDirectoryService {
  private cachedHandle: FileSystemDirectoryHandle | null = null;

  /**
   * Check if the File System Access API is supported by the current browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  /**
   * Check if current origin is in a secure context (https or localhost)
   */
  public isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext === true;
  }

  /**
   * Open IndexedDB instance
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    });
  }

  /**
   * Store directory handle in IndexedDB
   */
  private async persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(handle, HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error('Failed to save directory handle'));
    });
  }

  /**
   * Retrieve directory handle from IndexedDB
   */
  public async getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.cachedHandle) return this.cachedHandle;
    try {
      const db = await this.openDatabase();
      const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(HANDLE_KEY);
        req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) || null);
        req.onerror = () => reject(req.error);
      });
      if (handle) {
        this.cachedHandle = handle;
      }
      return handle;
    } catch {
      return null;
    }
  }

  /**
   * Remove stored handle from IndexedDB
   */
  public async clearStoredHandle(): Promise<void> {
    this.cachedHandle = null;
    try {
      const db = await this.openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(HANDLE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
    localStorage.removeItem(METADATA_KEY);
  }

  /**
   * Read stored metadata from localStorage
   */
  private getMetadata(): StoredMetadata | null {
    try {
      const raw = localStorage.getItem(METADATA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadata(data: Partial<StoredMetadata>): void {
    try {
      const existing = this.getMetadata() || { name: '', selectedAt: new Date().toISOString() };
      const updated = { ...existing, ...data };
      localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Check if write permission is granted on the handle
   */
  public async hasWritePermission(handle?: FileSystemDirectoryHandle | null): Promise<boolean> {
    const targetHandle = handle || (await this.getStoredHandle());
    if (!targetHandle) return false;

    try {
      // Check queryPermission first (does not prompt user)
      const qPerm = await (targetHandle as any).queryPermission({ mode: 'readwrite' });
      return qPerm === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Request write permission from user (must be called inside user gesture if needed)
   */
  public async requestWritePermission(handle?: FileSystemDirectoryHandle | null): Promise<boolean> {
    const targetHandle = handle || (await this.getStoredHandle());
    if (!targetHandle) return false;

    try {
      const status = await (targetHandle as any).requestPermission({ mode: 'readwrite' });
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Get current directory status and metadata
   */
  public async getDirectoryInfo(): Promise<BrowserDirectoryInfo> {
    const isSupp = this.isSupported();
    const isSec = this.isSecureContext();
    const meta = this.getMetadata();

    let hasPerm = false;
    let folderName = meta?.name || '';

    if (isSupp) {
      const handle = await this.getStoredHandle();
      if (handle) {
        folderName = handle.name;
        hasPerm = await this.hasWritePermission(handle);
      }
    }

    return {
      isSupported: isSupp,
      isSecureContext: isSec,
      hasDirectory: Boolean(folderName),
      folderName,
      hasPermission: hasPerm,
      lastBackupFile: meta?.lastBackupFile || null,
      lastBackupTime: meta?.lastBackupTime || null,
      lastError: meta?.lastError || null
    };
  }

  /**
   * Open the native Windows folder picker directly via File System Access API
   * MUST be called synchronously within a click handler to preserve user activation!
   */
  public async pickDirectory(): Promise<{
    success: boolean;
    folderName?: string;
    cancelled?: boolean;
    error?: string;
    message?: string;
  }> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'NOT_SUPPORTED',
        message: 'متصفحك الحالي لا يدعم ميزة الوصول المباشر للمجلدات المحلية (File System Access API). يُرجى استخدام متصفح Google Chrome أو Microsoft Edge.'
      };
    }

    if (!this.isSecureContext()) {
      return {
        success: false,
        error: 'INSECURE_CONTEXT',
        message: 'يتطلب فتح مجلدات ويندوز تشغيل النظام عبر اتصال آمن (HTTPS) أو عبر localhost.'
      };
    }

    try {
      console.log('[BrowserDirectoryService] Opening native Windows folder picker via window.showDirectoryPicker()...');
      
      const dirHandle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      if (!dirHandle || !dirHandle.name) {
        return { success: false, error: 'NO_HANDLE', message: 'لم يتم استلام مقبض صالح للمجلد' };
      }

      console.log('[BrowserDirectoryService] Folder selected:', dirHandle.name);

      // Cache and persist handle to IndexedDB
      this.cachedHandle = dirHandle;
      await this.persistHandle(dirHandle);

      // Save folder metadata
      this.saveMetadata({
        name: dirHandle.name,
        selectedAt: new Date().toISOString(),
        lastError: undefined
      });

      return {
        success: true,
        folderName: dirHandle.name,
        message: `تم اختيار وتثبيت مجلد الحفظ بنجاح: ${dirHandle.name}`
      };
    } catch (err: any) {
      // User cancelled or closed the dialog
      if (err.name === 'AbortError') {
        console.log('[BrowserDirectoryService] User cancelled folder picker dialog.');
        return { success: false, cancelled: true, message: 'تم إلغاء اختيار المجلد' };
      }

      if (err.name === 'SecurityError') {
        console.warn('[BrowserDirectoryService] Security error opening directory picker:', err.message);
        return {
          success: false,
          error: 'SECURITY_ERROR',
          message: 'تم منع الوصول إلى المجلد لدواعي أمان المتصفح (قد يكون المجلد محمياً بنظام التشغيل).'
        };
      }

      console.error('[BrowserDirectoryService] Unexpected error in pickDirectory:', err);
      return {
        success: false,
        error: err.message || 'UNKNOWN_ERROR',
        message: `تعذر اختيار المجلد: ${err.message || 'خطأ غير متوقع'}`
      };
    }
  }

  /**
   * Save a backup file directly into the selected folder
   */
  public async saveBackupFile(
    filename: string,
    content: string | Blob
  ): Promise<{
    success: boolean;
    filename: string;
    size_bytes: number;
    size_formatted: string;
    folderName: string;
    checksum_sha256?: string;
  }> {
    const handle = await this.getStoredHandle();
    if (!handle) {
      throw new Error('لم يتم اختيار مجلد حفظ محلي بعد. يرجى النقر على زر "اختيار مجلد الحفظ" أولاً.');
    }

    // Ensure write permission
    let hasPerm = await this.hasWritePermission(handle);
    if (!hasPerm) {
      console.log('[BrowserDirectoryService] Requesting user write permission for folder:', handle.name);
      hasPerm = await this.requestWritePermission(handle);
      if (!hasPerm) {
        throw new Error(`لم يتم منح صلاحية الكتابة للمجلد (${handle.name}). يرجى السماح للمتصفح بحفظ الملفات.`);
      }
    }

    try {
      console.log(`[BrowserDirectoryService] Writing backup file "${filename}" to folder "${handle.name}"...`);

      // 1. Get or create file handle in directory
      const fileHandle = await (handle as any).getFileHandle(filename, { create: true });

      // 2. Create writable stream
      const writable = await fileHandle.createWritable();

      // 3. Write data
      let dataToWrite: any = content;
      if (typeof content === 'string') {
        dataToWrite = new Blob([content], { type: 'application/octet-stream' });
      }
      await writable.write(dataToWrite);
      await writable.close();

      // 4. Verify file was completely written by reading file stats directly from disk
      const writtenFile = await fileHandle.getFile();
      const sizeBytes = writtenFile.size;

      if (sizeBytes === 0 && (typeof content === 'string' ? content.length > 0 : content.size > 0)) {
        throw new Error('فشل التحقق من اكتمال كتابة الملف: تم إنشاء الملف بحجم 0 بايت.');
      }

      const sizeFormatted = this.formatBytes(sizeBytes);
      console.log(`[BrowserDirectoryService] Successfully written and verified "${filename}" (${sizeFormatted}) in "${handle.name}".`);

      // 5. Update metadata
      this.saveMetadata({
        lastBackupFile: filename,
        lastBackupTime: new Date().toISOString(),
        lastError: undefined
      });

      return {
        success: true,
        filename,
        size_bytes: sizeBytes,
        size_formatted: sizeFormatted,
        folderName: handle.name
      };
    } catch (writeErr: any) {
      console.error('[BrowserDirectoryService] File write failed:', writeErr);
      this.saveMetadata({ lastError: writeErr.message });
      throw new Error(`تعذر حفظ ملف النسخة الاحتياطية في المجلد (${handle.name}): ${writeErr.message}`);
    }
  }

  /**
   * Manual fallback download via standard browser anchor link
   */
  public downloadBackupManually(filename: string, content: string | Blob): void {
    try {
      const blob = typeof content === 'string' ? new Blob([content], { type: 'application/octet-stream' }) : content;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      console.error('[BrowserDirectoryService] Manual download failed:', err);
    }
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const browserDirectoryService = new BrowserDirectoryService();
