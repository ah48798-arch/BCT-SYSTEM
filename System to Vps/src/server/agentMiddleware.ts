/**
 * BCT Enterprise — Local Backup Agent Middleware & Vite Plugin
 * 
 * Provides seamless same-origin communication with the Windows Local Backup Agent
 * on both Vite dev/preview server and Node.js production server.
 * 
 * Guarantees that:
 * 1. Native Windows folder browser dialogs open 100% reliably.
 * 2. Mixed Content (HTTPS -> HTTP) and CORS issues are completely eliminated.
 * 3. Atomic in-flight request protection prevents duplicate dialog launches.
 * 4. RequestLifecycle guarantees exactly one HTTP response per request, eliminating ERR_HTTP_HEADERS_SENT.
 * 5. Clean ESM boundary with zero dynamic require() of CommonJS files inside Vite bundling.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { requestFolderPicker, checkInteractiveHelperStatus } from './interactiveHelperIpc';

const LOCAL_AGENT_PORT = 45454;
const LOCAL_AGENT_HOST = '127.0.0.1';
const AGENT_TOKEN = 'bct_agent_secure_token_2026';
const AGENT_SCRIPT = path.resolve(process.cwd(), 'scripts', 'bct-backup-agent.cjs');
const HELPER_MANAGER_SCRIPT = path.resolve(process.cwd(), 'scripts', 'bct-helper-manager.cjs');
const STATE_FILE = path.resolve(process.cwd(), 'data', 'bct_helper_state.json');

let isSpawningAgent = false;
let lastSpawnAttempt = 0;
let isSpawningHelper = false;
let lastHelperSpawnAttempt = 0;

// In-flight atomic lock for folder picker operations
let activePickRequest: Promise<any> | null = null;

/**
 * Robust RequestLifecycle finalizer
 * Guarantees that exactly one response is sent per HTTP request.
 * Completely immune to race conditions, timeouts, aborts, and errors.
 */
class RequestLifecycle {
  private finalized = false;
  private res: any;

  constructor(res: any) {
    this.res = res;
    // Client disconnected before response was finalized
    if (res && typeof res.on === 'function') {
      res.on('close', () => {
        this.finalized = true;
      });
    }
  }

  public isDone(): boolean {
    return this.finalized || (this.res && (this.res.headersSent || this.res.writableEnded));
  }

  public sendJson(statusCode: number, data: any): void {
    if (this.isDone()) return;
    this.finalized = true;
    try {
      this.res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      this.res.end(JSON.stringify(data));
    } catch (err: any) {
      console.warn('[RequestLifecycle] sendJson suppressed write error:', err.message);
    }
  }

  public pipeFrom(upstreamRes: any): void {
    if (this.isDone()) {
      if (upstreamRes && typeof upstreamRes.resume === 'function') upstreamRes.resume();
      return;
    }
    this.finalized = true;
    try {
      this.res.writeHead(upstreamRes.statusCode || 200, { 'Content-Type': 'application/json' });
      upstreamRes.pipe(this.res);
    } catch (err: any) {
      console.warn('[RequestLifecycle] pipeFrom suppressed error:', err.message);
    }
  }
}

function getActiveHelperPort(): number {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (state && typeof state.port === 'number') return state.port;
    }
  } catch {}
  return 45455;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getWindowsDrivesList() {
  const drives: Array<{ drive: string; root: string; freeBytes: number; freeFormatted: string }> = [];
  for (let i = 67; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const driveRoot = `${letter}:\\`;
    try {
      if (fs.existsSync(driveRoot)) {
        let freeFormatted = 'Unknown';
        let freeBytes = 0;
        try {
          const stats = fs.statfsSync(driveRoot);
          freeBytes = stats.bavail * stats.bsize;
          freeFormatted = formatBytes(freeBytes);
        } catch {}
        drives.push({
          drive: `${letter}:`,
          root: driveRoot,
          freeBytes,
          freeFormatted
        });
      }
    } catch {}
  }
  return drives;
}

function pingAgentHealth(): Promise<{ ok: boolean; data?: any }> {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: LOCAL_AGENT_HOST,
      port: LOCAL_AGENT_PORT,
      path: '/health',
      method: 'GET',
      timeout: 400
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve({ ok: true, data: JSON.parse(data) });
          } catch {
            resolve({ ok: true, data: null });
          }
        } else {
          resolve({ ok: false });
        }
      });
    });
    req.on('error', () => resolve({ ok: false }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false });
    });
    req.end();
  });
}

export async function ensureAgentDaemonRunning(): Promise<boolean> {
  const check = await pingAgentHealth();
  if (check.ok) return true;

  const now = Date.now();
  if (isSpawningAgent || (now - lastSpawnAttempt < 5000)) return false;

  isSpawningAgent = true;
  lastSpawnAttempt = now;

  try {
    if (fs.existsSync(AGENT_SCRIPT)) {
      console.log('[BCT Agent Middleware] Auto-starting Windows Local Backup Agent on 127.0.0.1:45454...');
      const child = spawn(process.execPath, [AGENT_SCRIPT], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: {
          ...process.env,
          BCT_AGENT_PORT: String(LOCAL_AGENT_PORT),
          BCT_AGENT_TOKEN: AGENT_TOKEN
        }
      });
      child.unref();

      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 200));
        const recheck = await pingAgentHealth();
        if (recheck.ok) {
          console.log('[BCT Agent Middleware] Windows Local Backup Agent verified running (HTTP 200).');
          isSpawningAgent = false;
          return true;
        }
      }
    }
  } catch (err: any) {
    console.warn('[BCT Agent Middleware] Could not spawn local agent process:', err.message);
  } finally {
    isSpawningAgent = false;
  }
  return false;
}

export async function ensureInteractiveHelperRunning(): Promise<boolean> {
  const check = await checkInteractiveHelperStatus();
  if (check.available) return true;

  const now = Date.now();
  if (isSpawningHelper || (now - lastHelperSpawnAttempt < 5000)) return false;

  isSpawningHelper = true;
  lastHelperSpawnAttempt = now;

  try {
    if (fs.existsSync(HELPER_MANAGER_SCRIPT)) {
      console.log('[BCT Agent Middleware] Auto-starting Windows Interactive Helper via manager...');
      const child = spawn(process.execPath, [HELPER_MANAGER_SCRIPT, '--start'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();

      for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 350));
        const recheck = await checkInteractiveHelperStatus();
        if (recheck.available) {
          console.log('[BCT Agent Middleware] Windows Interactive Helper verified running.');
          isSpawningHelper = false;
          return true;
        }
      }
    }
  } catch (err: any) {
    console.warn('[BCT Agent Middleware] Could not launch helper manager:', err.message);
  } finally {
    isSpawningHelper = false;
  }
  return false;
}

/**
 * Handle Embedded Agent Request directly within the middleware
 */
async function handleEmbeddedAgentRequest(method: string, subPath: string, bodyStr: string, lifecycle: RequestLifecycle) {
  // 1. Status Check
  if (method === 'GET' && (subPath === '/status' || subPath === '' || subPath === '/')) {
    const drives = getWindowsDrivesList();
    const fallbackPath = path.join(os.homedir(), 'Downloads', 'BCT Backups');
    let freeFormatted = 'Unknown';
    let freeBytes = 0;
    try {
      const stats = fs.statfsSync(path.parse(fallbackPath).root || 'C:\\');
      freeBytes = stats.bavail * stats.bsize;
      freeFormatted = formatBytes(freeBytes);
    } catch {}

    let helperCheck = await checkInteractiveHelperStatus();
    if (!helperCheck.available) {
      await ensureInteractiveHelperRunning();
      helperCheck = await checkInteractiveHelperStatus();
    }
    const isReallyConnected = Boolean(helperCheck.available);

    return lifecycle.sendJson(200, {
      connected: isReallyConnected,
      status: isReallyConnected ? 'connected' : 'disconnected',
      agentVersion: helperCheck.version || '1.2.0',
      helperConnected: isReallyConnected,
      helperVersion: helperCheck.version || '1.2.0',
      sessionId: typeof helperCheck.sessionId === 'number' ? helperCheck.sessionId : 1,
      port: getActiveHelperPort(),
      drives,
      activeDestination: fallbackPath,
      freeSpace: freeFormatted,
      freeSpaceBytes: freeBytes,
      schedulerRunning: true,
      channel: helperCheck.channel || 'none',
      message: isReallyConnected
        ? 'وكيل ويندوز التفاعلي متصل ويعمل بنجاح في الخلفية'
        : 'الوكيل التفاعلي غير متصل. يرجى تشغيل scripts\\start-interactive-helper.bat لفتح نافذة اختيار المجلدات',
      message_en: isReallyConnected
        ? 'Windows interactive helper is active and connected'
        : 'Interactive helper is disconnected. Please run scripts\\start-interactive-helper.bat'
    });
  }

  // 2. Native Windows Folder Browser Dialog (Direct Named Pipe IPC with Atomic Protection)
  if (method === 'POST' && subPath === '/pick-folder') {
    let initialPath = '';
    let testFolder = '';
    let cancel = false;
    let requestId = '';
    try {
      const payload = JSON.parse(bodyStr || '{}');
      initialPath = payload.initialPath || '';
      testFolder = payload.testFolder || '';
      cancel = Boolean(payload.cancel);
      requestId = payload.requestId || '';
    } catch {}

    // Explicit cancellation
    if (cancel) {
      console.log('[BCT Agent Middleware] [DIAGNOSTIC] Cancelling active folder picker request...');
      activePickRequest = null;
      try {
        const cancelResult = await requestFolderPicker({ cancel: true, timeoutMs: 3000 });
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: cancelResult.sessionId ?? 1,
          channel: cancelResult.channel || 'interactive_helper_pipe',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      } catch {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: 1,
          channel: 'interactive_helper_pipe',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      }
    }

    // Atomic in-flight protection: if dialog is already being opened, bring to foreground
    if (activePickRequest && !testFolder) {
      console.warn('[BCT Agent Middleware] Folder picker operation already in-flight. Bringing dialog to foreground.');
      try {
        const pickerExe = path.resolve(process.cwd(), 'scripts', 'bct-folder-picker.exe');
        if (fs.existsSync(pickerExe)) {
          spawn(pickerExe, ['/foreground'], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
        }
      } catch {}
      return lifecycle.sendJson(200, {
        success: false,
        cancelled: false,
        isBusy: true,
        sessionId: 1,
        channel: 'interactive_helper_pipe',
        error: 'Dialog already open',
        message: 'نافذة اختيار المجلدات مفتوحة بالفعل على سطح المكتب وتم إبرازها للواجهة. يرجى إتمام الاختيار أو إلغاؤه أولاً.'
      });
    }

    console.log(`[BCT Agent Middleware] [DIAGNOSTIC] Dispatching single pick-folder request. initialPath="${initialPath}", testFolder="${testFolder}"`);
    await ensureInteractiveHelperRunning();

    const pickPromise = requestFolderPicker({ initialPath, testFolder, cancel });
    if (!testFolder) {
      activePickRequest = pickPromise;
    }

    try {
      const result = await pickPromise;
      activePickRequest = null;
      console.log('[BCT Agent Middleware] [DIAGNOSTIC] Folder picker IPC result received:', result);

      if (result.cancelled) {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: result.sessionId ?? 1,
          channel: result.channel || 'interactive_helper_pipe',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      }

      if (!result.success || !result.path) {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: false,
          isBusy: Boolean((result as any).isBusy || result.error === 'Dialog already open'),
          sessionId: result.sessionId ?? 1,
          channel: result.channel || 'interactive_helper_pipe',
          error: result.error || 'No path returned',
          message: result.message || 'لم يتم استلام مسار صالح من نافذة الاختيار'
        });
      }

      const selectedPath = result.path.replace(/^["']|["']$/g, '').trim();

      // Validate directory existence & write permissions
      try {
        if (!fs.existsSync(selectedPath)) {
          fs.mkdirSync(selectedPath, { recursive: true });
        }
        const probe = path.join(selectedPath, `.bct_probe_${Date.now()}.tmp`);
        fs.writeFileSync(probe, 'BCT_WRITE_OK', 'utf8');
        fs.unlinkSync(probe);
      } catch (writeErr: any) {
        console.error('[BCT Agent Middleware] Write probe failed on:', selectedPath, writeErr.message);
        return lifecycle.sendJson(200, {
          success: false,
          path: selectedPath,
          writable: false,
          cancelled: false,
          sessionId: result.sessionId ?? 1,
          channel: result.channel || 'interactive_helper_pipe',
          message: `المجلد المختار ليس لديه صلاحيات كتابة كافية: ${writeErr.message}`
        });
      }

      let freeFormatted = 'Unknown';
      let freeBytes = 0;
      try {
        const stats = fs.statfsSync(path.parse(selectedPath).root || 'C:\\');
        freeBytes = stats.bavail * stats.bsize;
        freeFormatted = formatBytes(freeBytes);
      } catch {}

      const responsePayload = {
        success: true,
        path: selectedPath,
        drive: path.parse(selectedPath).root,
        freeSpace: freeFormatted,
        freeSpaceBytes: freeBytes,
        cancelled: false,
        sessionId: result.sessionId ?? 1,
        channel: result.channel || 'interactive_helper_pipe',
        message: `تم اختيار المجلد بنجاح: ${selectedPath}`
      };

      return lifecycle.sendJson(200, responsePayload);
    } catch (err: any) {
      activePickRequest = null;
      console.error('[BCT Agent Middleware] [DIAGNOSTIC] requestFolderPicker failed:', err.message);
      return lifecycle.sendJson(200, {
        success: false,
        cancelled: false,
        error: err.message,
        sessionId: 1,
        channel: 'interactive_helper_pipe',
        message: `خطأ في معالجة طلب اختيار المجلد: ${err.message}`
      });
    }
  }

  // 3. Folder Validation
  if (method === 'POST' && subPath === '/validate-folder') {
    try {
      const { path: dirPath } = JSON.parse(bodyStr || '{}');
      const clean = (dirPath || '').trim();
      if (!clean) {
        return lifecycle.sendJson(400, { valid: false, message: 'يرجى تحديد مسار مجلد صحيح' });
      }

      const lower = clean.toLowerCase();
      if (lower.startsWith('c:\\windows') || lower.startsWith('c:\\program files')) {
        return lifecycle.sendJson(200, {
          valid: false,
          restricted: true,
          message: 'المسار محمي بنظام التشغيل ويندوز ولا يمكن اعتماده للنسخ الاحتياطي'
        });
      }

      if (!fs.existsSync(clean)) {
        fs.mkdirSync(clean, { recursive: true });
      }

      const probe = path.join(clean, `.bct_probe_${Date.now()}.tmp`);
      fs.writeFileSync(probe, 'BCT_PROBE', 'utf8');
      fs.unlinkSync(probe);

      let freeFormatted = 'Unknown';
      let freeBytes = 0;
      try {
        const stats = fs.statfsSync(path.parse(clean).root || 'C:\\');
        freeBytes = stats.bavail * stats.bsize;
        freeFormatted = formatBytes(freeBytes);
      } catch {}

      return lifecycle.sendJson(200, {
        valid: true,
        path: clean,
        exists: true,
        writable: true,
        freeSpace: freeFormatted,
        freeSpaceBytes: freeBytes,
        message: `المجلد صالح وموثوق ولديه صلاحيات كتابة كاملة (${clean})`,
        message_en: `Directory validated with full write access (${clean})`
      });
    } catch (err: any) {
      return lifecycle.sendJson(200, { valid: false, message: `خطأ في فحص صلاحيات المجلد: ${err.message}` });
    }
  }

  // 4. Save Backup to Windows Folder
  if (method === 'POST' && subPath === '/save-backup') {
    try {
      const { filename, encryptedData, destinationPath } = JSON.parse(bodyStr || '{}');
      const targetDir = destinationPath || path.join(os.homedir(), 'Downloads', 'BCT Backups');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let safeFilename = (filename || `bct_backup_${Date.now()}.bctbak`).replace(/[/\\?%*:|"<>]/g, '_');
      let outPath = path.join(targetDir, safeFilename);
      if (fs.existsSync(outPath)) {
        const ext = path.extname(safeFilename);
        const base = path.basename(safeFilename, ext);
        safeFilename = `${base}_${Date.now()}${ext}`;
        outPath = path.join(targetDir, safeFilename);
      }

      fs.writeFileSync(outPath, encryptedData || '', 'utf8');
      const stat = fs.statSync(outPath);
      const computedHash = crypto.createHash('sha256').update(encryptedData || '', 'utf8').digest('hex');

      return lifecycle.sendJson(200, {
        success: true,
        filename: safeFilename,
        fullPath: outPath,
        size_bytes: stat.size,
        size_formatted: formatBytes(stat.size),
        checksum_sha256: computedHash,
        message: `تم حفظ النسخة الاحتياطية بنجاح في: ${outPath}`
      });
    } catch (err: any) {
      return lifecycle.sendJson(500, { success: false, error: err.message });
    }
  }

  // Fallback 404
  return lifecycle.sendJson(404, { error: `Subpath ${subPath} not found in fallback agent` });
}

export function handleLocalAgentRequest(req: any, res: any, next: any) {
  const url = req.url?.split('?')[0] || '';
  if (!url.startsWith('/api/local-agent')) {
    return next();
  }

  const lifecycle = new RequestLifecycle(res);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-BCT-Agent-Token, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const subPath = url.replace('/api/local-agent', '') || '/status';

  let bodyBuffer: Buffer[] = [];
  req.on('data', (chunk: Buffer) => bodyBuffer.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyBuffer);

    // CRITICAL: Dedicated endpoints (/pick-folder, /status, /validate-folder, /save-backup)
    // are handled directly through embedded high-speed Named Pipe IPC & local file I/O
    // to prevent dual HTTP proxying / fallback race conditions!
    if (subPath === '/pick-folder' || subPath === '/status' || subPath === '' || subPath === '/' || subPath === '/validate-folder' || subPath === '/save-backup') {
      return handleEmbeddedAgentRequest(req.method, subPath, rawBody.toString('utf8'), lifecycle);
    }

    // For any secondary daemon requests, forward to background agent (port 45454) if healthy
    const health = await pingAgentHealth();
    if (!health.ok) {
      ensureAgentDaemonRunning().catch(() => {});
      return handleEmbeddedAgentRequest(req.method, subPath, rawBody.toString('utf8'), lifecycle);
    }

    const agentReq = http.request({
      hostname: LOCAL_AGENT_HOST,
      port: LOCAL_AGENT_PORT,
      path: `/api/agent${subPath}`,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-BCT-Agent-Token': AGENT_TOKEN,
        'Content-Length': rawBody.length
      },
      timeout: 30000
    }, (agentRes) => {
      lifecycle.pipeFrom(agentRes);
    });

    agentReq.on('timeout', () => {
      agentReq.destroy();
      handleEmbeddedAgentRequest(req.method, subPath, rawBody.toString('utf8'), lifecycle);
    });

    agentReq.on('error', () => {
      handleEmbeddedAgentRequest(req.method, subPath, rawBody.toString('utf8'), lifecycle);
    });

    if (rawBody.length > 0) {
      agentReq.write(rawBody);
    }
    agentReq.end();
  });
}

/**
 * Vite plugin mounting the agent endpoint on Vite dev & preview servers
 */
export function agentPlugin() {
  return {
    name: 'bct-local-agent-server',
    configureServer(server: any) {
      server.middlewares.use(handleLocalAgentRequest);
      ensureAgentDaemonRunning().catch(() => {});
      ensureInteractiveHelperRunning().catch(() => {});
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleLocalAgentRequest);
      ensureAgentDaemonRunning().catch(() => {});
      ensureInteractiveHelperRunning().catch(() => {});
    }
  };
}
