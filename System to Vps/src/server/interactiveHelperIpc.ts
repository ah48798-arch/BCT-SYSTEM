/**
 * BCT Enterprise — Interactive Helper IPC Client Module
 * 
 * Communicates with the BCT Interactive Helper running in the logged-in user's
 * interactive Windows desktop session (Session 1+) via Windows Named Pipe or TCP.
 * 
 * Solves Windows Session 0 Isolation:
 * Allows the background Local Backup Agent / Windows Service (Session 0) or server
 * to delegate GUI modal dialogs (FolderBrowserDialog) directly to the user's desktop!
 */

import net from 'net';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile, execSync } from 'child_process';

const PIPE_NAME = '\\\\.\\pipe\\bct_folder_picker_ipc';
const IPC_TOKEN = process.env.BCT_AGENT_TOKEN || 'bct_agent_secure_token_2026';
const NATIVE_PICKER_EXE = path.resolve(process.cwd(), 'scripts', 'bct-folder-picker.exe');
const STATE_FILE = path.resolve(process.cwd(), 'data', 'bct_helper_state.json');

function getActiveHelperPort(): number {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (state && state.port) return state.port;
    }
  } catch {}
  return 45455;
}

export interface HelperStatus {
  available: boolean;
  sessionId?: number;
  version?: string;
  channel?: 'named_pipe' | 'tcp' | 'session_fallback';
}

export interface FolderPickerIpcResult {
  success: boolean;
  path?: string;
  cancelled?: boolean;
  error?: string;
  message?: string;
  sessionId?: number;
  channel?: 'interactive_helper_pipe' | 'interactive_helper_tcp' | 'session_fallback';
}

function getLocalSessionId(): number {
  try {
    if (fs.existsSync(NATIVE_PICKER_EXE)) {
      const tempOut = path.join(os.tmpdir(), `bct_ts_sess_${Date.now()}.txt`);
      execSync(`"${NATIVE_PICKER_EXE}" /session /out:"${tempOut}"`, {
        encoding: 'utf8',
        timeout: 2000,
        windowsHide: false
      });
      if (fs.existsSync(tempOut)) {
        const out = fs.readFileSync(tempOut, 'utf8').trim();
        fs.unlinkSync(tempOut);
        const m = out.match(/SESSION:(\d+)/);
        if (m && m[1]) return parseInt(m[1], 10);
      }
    }
  } catch {}
  if (process.env.SESSIONNAME && process.env.SESSIONNAME.toLowerCase().includes('console')) {
    return 1;
  }
  return 1;
}

function sendIpcRequest(channelType: 'pipe' | 'tcp', payload: any, timeoutMs: number = 65000): Promise<any> {
  if (channelType === 'pipe') {
    return new Promise((resolve, reject) => {
      const socket = net.connect(PIPE_NAME);
      let buffer = '';
      let isFinished = false;

      const timer = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          socket.destroy();
          reject(new Error(`IPC request timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      socket.on('connect', () => {
        socket.write(JSON.stringify(payload) + '\n');
      });

      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const idx = buffer.indexOf('\n');
        if (idx !== -1) {
          const line = buffer.slice(0, idx).trim();
          if (line && !isFinished) {
            isFinished = true;
            clearTimeout(timer);
            socket.end();
            try {
              resolve(JSON.parse(line));
            } catch (e: any) {
              reject(new Error(`Invalid JSON from IPC: ${e.message}`));
            }
          }
        }
      });

      socket.on('error', (err) => {
        if (!isFinished) {
          isFinished = true;
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  // HTTP bridge fallback for TCP channel
  return new Promise((resolve, reject) => {
    const port = getActiveHelperPort();
    const isStatus = payload.action === 'ping' || payload.action === 'status';
    const endpoint = isStatus ? '/status' : '/pick-folder';
    const postData = isStatus ? '' : JSON.stringify(payload);

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: endpoint,
      method: isStatus ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BCT-Agent-Token': IPC_TOKEN,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (isStatus && parsed.status === 'connected') {
            parsed.status = 'ok';
          }
          if (!parsed.responseTo && payload.requestId) {
            parsed.responseTo = payload.requestId;
          }
          resolve(parsed);
        } catch (e: any) {
          reject(new Error(`Invalid JSON from HTTP bridge: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`HTTP bridge request timeout after ${timeoutMs}ms`));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Check if the Interactive Helper is running in a logged-in Windows desktop session
 */
export async function checkInteractiveHelperStatus(): Promise<HelperStatus> {
  const reqId = `ping_${Date.now()}`;
  const payload = { action: 'ping', requestId: reqId, token: IPC_TOKEN };

  // 1. Try Named Pipe
  try {
    const res = await sendIpcRequest('pipe', payload, 1000);
    if (res && res.status === 'ok') {
      return {
        available: true,
        sessionId: res.sessionId,
        version: res.helperVersion,
        channel: 'named_pipe'
      };
    }
  } catch {}

  // 2. Try TCP fallback
  try {
    const res = await sendIpcRequest('tcp', payload, 1000);
    if (res && res.status === 'ok') {
      return {
        available: true,
        sessionId: typeof res.sessionId === 'number' ? res.sessionId : 1,
        version: res.helperVersion || '1.2.0',
        channel: 'tcp'
      };
    }
  } catch {}

  // 3. Fallback: Check if native GUI picker is available directly in interactive Windows session
  const localSession = getLocalSessionId();
  if (localSession > 0 && fs.existsSync(NATIVE_PICKER_EXE)) {
    return {
      available: true,
      sessionId: localSession,
      version: '1.2.0',
      channel: 'session_fallback'
    };
  }

  return { available: false };
}

/**
 * Request folder picker dialog execution:
 * 1. Delegates to Interactive Helper via IPC (Named Pipe or TCP) running in user's Session 1+
 * 2. If helper is unavailable and current process is in interactive session (Session > 0), uses direct PowerShell
 * 3. If in Session 0 without helper, returns clear guidance instructing to launch the helper
 */
export async function requestFolderPicker(options: {
  initialPath?: string;
  testFolder?: string;
  cancel?: boolean;
  timeoutMs?: number;
}): Promise<FolderPickerIpcResult> {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload = {
    action: 'pick_folder',
    requestId: reqId,
    token: IPC_TOKEN,
    initialPath: options.initialPath || '',
    testFolder: options.testFolder || '',
    cancel: Boolean(options.cancel)
  };

  const timeout = options.timeoutMs || 65000;

  // 1. Try delegating to Interactive Helper via Named Pipe IPC
  try {
    console.log('[BCT IPC Client] [DIAGNOSTIC] Attempting IPC request via Named Pipe:', PIPE_NAME);
    const res = await sendIpcRequest('pipe', payload, timeout);
    if (res && res.responseTo === reqId) {
      const sessId = (typeof res.sessionId === 'number' && res.sessionId >= 0) ? res.sessionId : 1;
      console.log('[BCT IPC Client] [DIAGNOSTIC] Received IPC response from Named Pipe in Session:', sessId);
      return {
        success: Boolean(res.success),
        path: res.path,
        cancelled: Boolean(res.cancelled),
        error: res.error,
        message: res.message,
        sessionId: sessId,
        channel: 'interactive_helper_pipe'
      };
    }
  } catch (pipeErr: any) {
    console.log('[BCT IPC Client] [DIAGNOSTIC] Named pipe IPC unavailable:', pipeErr.message);
  }

  // 2. Try delegating via TCP IPC
  try {
    const port = getActiveHelperPort();
    console.log(`[BCT IPC Client] [DIAGNOSTIC] Attempting IPC request via TCP 127.0.0.1:${port}`);
    const res = await sendIpcRequest('tcp', payload, timeout);
    if (res && res.responseTo === reqId) {
      const sessId = (typeof res.sessionId === 'number' && res.sessionId >= 0) ? res.sessionId : 1;
      console.log('[BCT IPC Client] [DIAGNOSTIC] Received IPC response from TCP in Session:', sessId);
      return {
        success: Boolean(res.success),
        path: res.path,
        cancelled: Boolean(res.cancelled),
        error: res.error,
        message: res.message,
        sessionId: sessId,
        channel: 'interactive_helper_tcp'
      };
    }
  } catch (tcpErr: any) {
    console.log('[BCT IPC Client] [DIAGNOSTIC] TCP IPC unavailable:', tcpErr.message);
  }

  // 3. Fallback: Check if current process is running in an interactive session
  const localSession = getLocalSessionId();
  console.log(`[BCT IPC Client] [DIAGNOSTIC] Helper not detected. Current process SessionId: ${localSession}`);

  if (localSession === 0) {
    // We are in Session 0 (Windows Service)! Cannot display GUI directly.
    console.warn('[BCT IPC Client] [DIAGNOSTIC] Cannot display GUI dialog directly in Session 0.');
    return {
      success: false,
      cancelled: false,
      sessionId: 0,
      error: 'Session 0 Isolation: Interactive Helper required',
      message: 'خدمة النسخ الاحتياطي تعمل في جلسة النظام الخلفية (Session 0). لفتح نافذة اختيار المجلدات على شاشة المستخدم، يرجى تشغيل: scripts\\start-interactive-helper.bat'
    };
  }

  // Local process is in Session > 0 (interactive desktop session): direct native GUI dialog invocation
  console.log('[BCT IPC Client] [DIAGNOSTIC] Local process is in interactive Session', localSession, '- executing native GUI dialog directly.');
  return new Promise((resolve) => {
    const tempOutFile = path.join(os.tmpdir(), `bct_ipc_pick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.txt`);
    const args = [`/out:${tempOutFile}`];
    if (options.initialPath) args.push(`/initial:${options.initialPath}`);
    if (options.testFolder) args.push(`/test:${options.testFolder}`);
    if (options.cancel) args.push('/cancel');

    execFile(NATIVE_PICKER_EXE, args, { timeout, encoding: 'utf8', windowsHide: false }, (error, stdout) => {
      let out = (stdout || '').trim();
      if (fs.existsSync(tempOutFile)) {
        try {
          const fileContent = fs.readFileSync(tempOutFile, 'utf8').trim();
          if (fileContent) out = fileContent;
          fs.unlinkSync(tempOutFile);
        } catch {}
      }

      if (error && !out) {
        const isTimeout = Boolean((error as any).killed && (error as any).signal === 'SIGTERM');
        const userMsg = isTimeout
          ? 'انتهت مهلة انتظار اختيار المجلد. يرجى إعادة المحاولة والنقر داخل نافذة ويندوز فور ظهورها.'
          : 'تعذر فتح نافذة اختيار المجلدات من ويندوز. يرجى التأكد من تشغيل مساعد ويندوز التفاعلي.';
        return resolve({
          success: false,
          cancelled: isTimeout,
          sessionId: localSession,
          channel: 'session_fallback',
          error: error.message,
          message: userMsg
        });
      }

      if (out.includes('CANCELLED')) {
        return resolve({
          success: false,
          cancelled: true,
          sessionId: localSession,
          channel: 'session_fallback',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      }

      if (out.includes('ERROR:')) {
        const errMatch = out.match(/ERROR:(.*)/);
        const errMsg = errMatch ? errMatch[1].trim() : out;
        return resolve({
          success: false,
          cancelled: false,
          sessionId: localSession,
          channel: 'session_fallback',
          error: errMsg,
          message: `تعذر فتح نافذة اختيار المجلدات: ${errMsg}`
        });
      }

      const match = out.match(/SELECTED:(.*)/);
      if (match && match[1]) {
        const rawPath = match[1].trim();
        const selectedPath = rawPath.replace(/^["']|["']$/g, '').trim();
        return resolve({
          success: true,
          path: selectedPath,
          cancelled: false,
          sessionId: localSession,
          channel: 'session_fallback',
          message: `تم اختيار مجلد الحفظ بنجاح: ${selectedPath}`
        });
      }

      return resolve({
        success: false,
        cancelled: false,
        sessionId: localSession,
        channel: 'session_fallback',
        error: 'No path returned',
        message: 'لم يتم استلام مسار صالح من نافذة الاختيار'
      });
    });
  });
}
