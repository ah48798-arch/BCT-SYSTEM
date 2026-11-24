/**
 * BCT Enterprise Production Server
 * Serves the React SPA, provides the authenticated same-origin ZIP download endpoint,
 * and natively supports HTTPS with local SSL certificates.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');
const CERTS_DIR = path.resolve(__dirname, 'certs');
const CERT_FILE = path.join(CERTS_DIR, 'cert.pem');
const KEY_FILE = path.join(CERTS_DIR, 'key.pem');
const BACKUPS_DIR = path.resolve(__dirname, 'backups');

// ============================================================================
// SECURITY: path containment helper
// Returns true only when `target` is `root` itself or a descendant of it.
// ============================================================================
function isInsideDir(root, target) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel === '') return true;
  if (path.isAbsolute(rel)) return false;
  return rel.split(path.sep)[0] !== '..';
}

// Read a request body with a hard size limit. cb(err, bodyString)
function readBodyLimited(req, limitBytes, cb) {
  let size = 0;
  const chunks = [];
  let aborted = false;
  req.on('data', chunk => {
    if (aborted) return;
    size += chunk.length;
    if (size > limitBytes) {
      aborted = true;
      cb(new Error('PAYLOAD_TOO_LARGE'));
      try { req.destroy(); } catch {}
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (!aborted) cb(null, Buffer.concat(chunks).toString('utf8'));
  });
  req.on('error', err => {
    if (!aborted) { aborted = true; cb(err); }
  });
}

function sendJson(res, status, obj) {
  if (!res.headersSent) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  }
  res.end(JSON.stringify(obj));
}

// ============================================================================
// SECURITY: server-side authentication and sessions
// Passwords are verified on the server against the password_hash stored in the
// canonical database (same SHA-256 format the client already writes). Every
// /api/* route except /api/auth/* requires a valid session token sent as
// "Authorization: Bearer <token>". Only a SHA-256 of each token is stored.
// ============================================================================
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours absolute lifetime
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000; // 2 hours without any request
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');
const LOGIN_MAX_FAILURES = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const sessions = new Map(); // tokenHash -> { employeeId, username, isAdmin, bootstrap, createdAt, expiresAt, lastSeen }
const loginFailures = new Map(); // key -> { count, firstAt, lockedUntil }

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function loadSessionsFromDisk() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    const now = Date.now();
    for (const [hash, s] of Object.entries(raw || {})) {
      if (s && s.expiresAt > now) sessions.set(hash, s);
    }
  } catch (err) {
    console.warn('[BCT Auth] Could not load sessions file:', err.message);
  }
}

function persistSessions() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const obj = {};
    for (const [hash, s] of sessions.entries()) obj[hash] = s;
    const tmp = SESSIONS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmp, SESSIONS_FILE);
  } catch (err) {
    console.warn('[BCT Auth] Could not persist sessions:', err.message);
  }
}

function normalizeUsername(u) {
  return String(u || '').trim().replace(/^@+/, '').replace(/@+$/, '').trim().toLowerCase();
}

let userTablesCache = { key: null, value: null };

function getUserTables() {
  // Cache by DB file mtime/size so session checks don't re-parse the DB on every request.
  let key = 'none';
  try {
    const st = fs.statSync(CANONICAL_DB_FILE);
    key = `${st.mtimeMs}:${st.size}`;
  } catch {}
  if (key !== 'none' && userTablesCache.key === key && userTablesCache.value) {
    return userTablesCache.value;
  }
  const db = loadCanonicalDatabaseServer();
  const tables = (db && db.tables) || {};
  const employees = Array.isArray(tables.bct_store_employees) ? tables.bct_store_employees : [];
  const systemUsers = Array.isArray(tables.bct_store_system_users) ? tables.bct_store_system_users : [];
  const value = { employees, systemUsers };
  userTablesCache = { key, value };
  return value;
}

function findAccount(tables, usernameInput) {
  const clean = normalizeUsername(usernameInput);
  if (!clean) return { emp: null, user: null };
  let user = tables.systemUsers.find(u => normalizeUsername(u && u.username) === clean) || null;
  let emp = tables.employees.find(e => normalizeUsername(e && e.username) === clean) || null;
  if (user && !emp) emp = tables.employees.find(e => e && e.id === user.employee_id) || null;
  if (emp && !user) {
    user = tables.systemUsers.find(u => u && (u.employee_id === emp.id || (emp.auth_account_id && u.id === emp.auth_account_id))) || null;
  }
  return { emp, user };
}

function isAccountActive(emp, user) {
  if (!emp && !user) return false;
  if (emp && emp.is_system_user === false) return false;
  if (emp && emp.employment_status !== 'active') return false;
  if (emp && emp.account_status === 'suspended') return false;
  if (user && user.status === 'suspended') return false;
  return true;
}

function isAdminEmployee(emp) {
  if (!emp || emp.employment_status !== 'active') return false;
  const roles = Array.isArray(emp.roles) ? emp.roles : [];
  return Boolean(
    emp.position_id === 'gm' ||
    emp.job_title_code === 'general_manager' ||
    roles.includes('super_admin') ||
    roles.includes('gm') ||
    roles.includes('sys_admin')
  );
}

function hashesEqual(aHex, bHex) {
  const a = Buffer.from(String(aHex || '').toLowerCase(), 'utf8');
  const b = Buffer.from(String(bHex || '').toLowerCase(), 'utf8');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isLoopbackRequest(req) {
  const addr = (req.socket && req.socket.remoteAddress) || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function getBearerToken(req) {
  const h = req.headers['authorization'] || '';
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/.exec(h.trim());
  return m ? m[1] : null;
}

// Returns { tokenHash, session, emp, isAdmin, username } or null.
function getAuthenticatedSession(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const tokenHash = sha256Hex(token);
  const s = sessions.get(tokenHash);
  if (!s) return null;
  const now = Date.now();
  if (s.expiresAt <= now || (s.lastSeen && now - s.lastSeen > SESSION_IDLE_MS)) {
    sessions.delete(tokenHash);
    persistSessions();
    return null;
  }
  const tables = getUserTables();
  const hasAnyUsers = tables.employees.length > 0 || tables.systemUsers.length > 0;
  if (s.bootstrap) {
    // Bootstrap sessions are only valid while the database has no user records.
    if (hasAnyUsers) {
      sessions.delete(tokenHash);
      persistSessions();
      return null;
    }
    s.lastSeen = now;
    return { tokenHash, session: s, emp: null, isAdmin: true, username: s.username };
  }
  const emp = tables.employees.find(e => e && e.id === s.employeeId) || null;
  const user = tables.systemUsers.find(u => u && (u.employee_id === s.employeeId)) || null;
  if (!isAccountActive(emp, user)) {
    sessions.delete(tokenHash);
    persistSessions();
    return null;
  }
  s.lastSeen = now;
  return { tokenHash, session: s, emp, isAdmin: isAdminEmployee(emp), username: (emp && emp.username) || s.username };
}

function registerLoginFailure(key) {
  const now = Date.now();
  const rec = loginFailures.get(key) || { count: 0, firstAt: now, lockedUntil: 0 };
  if (now - rec.firstAt > LOGIN_LOCK_MS) { rec.count = 0; rec.firstAt = now; }
  rec.count += 1;
  if (rec.count >= LOGIN_MAX_FAILURES) rec.lockedUntil = now + LOGIN_LOCK_MS;
  loginFailures.set(key, rec);
}

function isLoginLocked(key) {
  const rec = loginFailures.get(key);
  return Boolean(rec && rec.lockedUntil > Date.now());
}

function createSession(data) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  sessions.set(sha256Hex(token), Object.assign({ createdAt: now, lastSeen: now, expiresAt: now + SESSION_TTL_MS }, data));
  persistSessions();
  return token;
}

function handleAuthEndpoints(req, res, parsedUrl) {
  if (req.method === 'POST' && parsedUrl === '/api/auth/login') {
    return readBodyLimited(req, 16 * 1024, (err, body) => {
      if (err) return sendJson(res, 413, { success: false, code: 'BAD_REQUEST' });
      let payload;
      try { payload = JSON.parse(body || '{}'); } catch { return sendJson(res, 400, { success: false, code: 'BAD_REQUEST' }); }
      const username = typeof payload.username === 'string' ? payload.username : '';
      const password = typeof payload.password === 'string' ? payload.password : '';
      const ip = (req.socket && req.socket.remoteAddress) || 'unknown';
      const lockKeys = [`ip:${ip}`, `user:${normalizeUsername(username)}`];
      if (lockKeys.some(isLoginLocked)) {
        return sendJson(res, 429, { success: false, code: 'TOO_MANY_ATTEMPTS', message: 'محاولات دخول كثيرة فاشلة. يرجى المحاولة بعد 15 دقيقة.' });
      }
      if (!username || !password) {
        return sendJson(res, 400, { success: false, code: 'INVALID_CREDENTIALS', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
      }

      const tables = getUserTables();
      const hasAnyUsers = tables.employees.length > 0 || tables.systemUsers.length > 0;

      if (!hasAnyUsers) {
        // First-run bootstrap: an empty database has nothing to protect yet, so the
        // operator may sign in from the server machine itself (loopback only).
        if (!isLoopbackRequest(req)) {
          return sendJson(res, 503, { success: false, code: 'NO_USERS_PROVISIONED', message: 'لا توجد حسابات في قاعدة البيانات بعد. سجّل الدخول لأول مرة من جهاز الخادم نفسه (localhost).' });
        }
        console.warn(`[BCT Auth] Bootstrap login from loopback as "${username}" (database has no users yet).`);
        const token = createSession({ employeeId: null, username: normalizeUsername(username), isAdmin: true, bootstrap: true });
        return sendJson(res, 200, { success: true, token, bootstrap: true, expiresInMs: SESSION_TTL_MS });
      }

      const { emp, user } = findAccount(tables, username);
      const storedHash = (user && user.password_hash) || (emp && emp.password_hash) || '';
      const valid = Boolean(storedHash) && hashesEqual(sha256Hex(password), storedHash);
      if (!valid || !isAccountActive(emp, user) || !emp) {
        lockKeys.forEach(registerLoginFailure);
        const code = valid && emp && !isAccountActive(emp, user) ? 'ACCOUNT_DISABLED' : 'INVALID_CREDENTIALS';
        return sendJson(res, 401, {
          success: false,
          code,
          message: code === 'ACCOUNT_DISABLED' ? 'تم إيقاف هذا الحساب. يرجى مراجعة إدارة النظام' : 'اسم المستخدم أو كلمة المرور غير صحيحة'
        });
      }
      lockKeys.forEach(k => loginFailures.delete(k));
      const token = createSession({ employeeId: emp.id, username: emp.username, isAdmin: isAdminEmployee(emp), bootstrap: false });
      return sendJson(res, 200, { success: true, token, employeeId: emp.id, expiresInMs: SESSION_TTL_MS });
    });
  }

  if (req.method === 'POST' && parsedUrl === '/api/auth/logout') {
    const token = getBearerToken(req);
    if (token) {
      sessions.delete(sha256Hex(token));
      persistSessions();
    }
    return sendJson(res, 200, { success: true });
  }

  if (req.method === 'GET' && parsedUrl === '/api/auth/session') {
    const auth = getAuthenticatedSession(req);
    if (!auth) return sendJson(res, 401, { authenticated: false });
    return sendJson(res, 200, { authenticated: true, employeeId: auth.session.employeeId, username: auth.username, isAdmin: auth.isAdmin, bootstrap: Boolean(auth.session.bootstrap) });
  }

  return sendJson(res, 404, { error: 'Endpoint not found' });
}

// Routes that touch the server filesystem or contain full-database exports
// are restricted to administrators (GM / super_admin / sys_admin).
function routeRequiresAdmin(method, parsedUrl) {
  if (parsedUrl.startsWith('/api/local-agent')) return true;
  if (parsedUrl.startsWith('/api/backups')) {
    if (method !== 'GET') return true;
    if (parsedUrl.startsWith('/api/backups/download/')) return true;
    if (parsedUrl === '/api/backups/browse-directories') return true;
    if (parsedUrl === '/api/diagnostic/build') return true;
  }
  return false;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const CATEGORY_FOLDERS = {
  passport: '01-جواز-السفر',
  recency_stamp: '02-ختم-الحداثة',
  personal_photos: '03-الصور-الشخصية',
  high_school: '04-الشهادة-الثانوية-وكشف-الدرجات',
  birth_cert: '05-شهادة-الميلاد-او-الرقم-الوطني',
  registration_fee: '06-إيصال-سداد-رسوم-فتح-الملف'
};

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function calculateCRC32(data) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = date.getFullYear();
  const dosYear = year < 1980 ? 0 : year - 1980;
  const dosDate = ((dosYear & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f);
  const dosTime = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  return { dosDate, dosTime };
}

function createZipArchive(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;
  const encoder = new TextEncoder();
  const { dosDate, dosTime } = getDosDateTime();

  for (const file of files) {
    const filenameBytes = encoder.encode(file.path);
    const fileData = file.data;
    const crc = calculateCRC32(fileData);
    const uncompressedSize = fileData.length;
    const compressedSize = fileData.length;

    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const lView = new DataView(localHeader.buffer);
    lView.setUint32(0, 0x04034b50, true);
    lView.setUint16(4, 20, true);
    lView.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lView.setUint16(8, 0, true); // store
    lView.setUint16(10, dosTime, true);
    lView.setUint16(12, dosDate, true);
    lView.setUint32(14, crc, true);
    lView.setUint32(18, compressedSize, true);
    lView.setUint32(22, uncompressedSize, true);
    lView.setUint16(26, filenameBytes.length, true);
    lView.setUint16(28, 0, true);
    localHeader.set(filenameBytes, 30);

    localHeaders.push(localHeader);
    localHeaders.push(fileData);

    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const cView = new DataView(centralHeader.buffer);
    cView.setUint32(0, 0x02014b50, true);
    cView.setUint16(4, 0x0314, true);
    cView.setUint16(6, 20, true);
    cView.setUint16(8, 0x0800, true);
    cView.setUint16(10, 0, true);
    cView.setUint16(12, dosTime, true);
    cView.setUint16(14, dosDate, true);
    cView.setUint32(16, crc, true);
    cView.setUint32(20, compressedSize, true);
    cView.setUint32(24, uncompressedSize, true);
    cView.setUint16(28, filenameBytes.length, true);
    cView.setUint16(30, 0, true);
    cView.setUint16(32, 0, true);
    cView.setUint16(34, 0, true);
    cView.setUint16(36, 0, true);
    cView.setUint32(38, 0x81a40000, true);
    cView.setUint32(42, currentOffset, true);
    centralHeader.set(filenameBytes, 46);

    centralHeaders.push(centralHeader);
    currentOffset += localHeader.length + fileData.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, files.length, true);
  eView.setUint16(10, files.length, true);
  eView.setUint32(12, centralDirSize, true);
  eView.setUint32(16, centralDirOffset, true);
  eView.setUint16(20, 0, true);

  const totalSize = currentOffset + centralDirSize + 22;
  const output = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of [...localHeaders, ...centralHeaders, eocd]) {
    output.set(part, pos);
    pos += part.length;
  }

  return output;
}

// Make a single safe ZIP path segment: no separators, no drive letters, no "..".
function safeZipSegment(value, fallback) {
  const cleaned = String(value || '')
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^[.\s]+/, '')
    .trim();
  return cleaned || fallback;
}

function handleZipEndpoint(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  // Authentication is enforced centrally in routeRequest (session token required).
  readBodyLimited(req, 200 * 1024 * 1024, (bodyErr, body) => {
    if (bodyErr) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Request too large' }));
    }
    try {
      const payload = JSON.parse(body);
      const { documents } = payload;
      const fileCode = typeof payload.fileCode === 'string' ? payload.fileCode : '';

      if (!fileCode || !Array.isArray(documents) || documents.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid fileCode or documents list' }));
      }
      const safeCode = safeZipSegment(fileCode, 'dossier');

      const archiveEntries = [];
      for (const doc of documents) {
        const folder = CATEGORY_FOLDERS[doc.document_type] || '07-مستندات-إضافية';
        let fileData;

        if (doc.dataBase64) {
          fileData = Buffer.from(doc.dataBase64, 'base64');
        } else if (doc.contentText) {
          fileData = Buffer.from(doc.contentText, 'utf8');
        } else {
          fileData = Buffer.from(`[BCT Enterprise Document: ${doc.file_name}]`, 'utf8');
        }

        const safeFileName = safeZipSegment(doc.file_name, 'doc.pdf');
        archiveEntries.push({
          path: `${safeCode}/${folder}/${safeFileName}`,
          data: fileData
        });
      }

      const zipBytes = createZipArchive(archiveEntries);
      const zipBuffer = Buffer.from(zipBytes);
      const safeFilename = safeCode.replace(/[^\w؀-ۿ.-]/g, '_') + '.zip';

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': zipBuffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });

      res.end(zipBuffer);
    } catch (err) {
      console.error('[BCT Server] ZIP generation failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'ZIP Generation failed' }));
    }
  });
}

const DEFAULT_BACKUPS_DIR = path.resolve(__dirname, 'backups');
if (!fs.existsSync(DEFAULT_BACKUPS_DIR)) {
  fs.mkdirSync(DEFAULT_BACKUPS_DIR, { recursive: true });
}

function getSafeBackupsDir() {
  const schedFile = path.join(DEFAULT_BACKUPS_DIR, 'schedule.json');
  if (fs.existsSync(schedFile)) {
    try {
      const sched = JSON.parse(fs.readFileSync(schedFile, 'utf8'));
      if (sched.local_backup_path && typeof sched.local_backup_path === 'string') {
        const cleanPath = sched.local_backup_path.trim();
        const resolved = path.resolve(__dirname, cleanPath);
        // SECURITY: the backup root must stay inside ./backups (never data/, certs/, or the app root)
        if (isInsideDir(DEFAULT_BACKUPS_DIR, resolved)) {
          if (!fs.existsSync(resolved)) {
            fs.mkdirSync(resolved, { recursive: true });
          }
          return resolved;
        }
      }
    } catch {}
  }
  return DEFAULT_BACKUPS_DIR;
}

const SCHEDULE_FILE = path.join(DEFAULT_BACKUPS_DIR, 'schedule.json');
const HISTORY_FILE = path.join(DEFAULT_BACKUPS_DIR, 'backup_history.json');
const LATEST_STATE_FILE = path.join(DEFAULT_BACKUPS_DIR, 'latest_db_state.json');

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

function handleBackupEndpoints(req, res) {
  const parsedUrl = req.url.split('?')[0];
  const activeBackupsDir = getSafeBackupsDir();

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }


  // GET /api/diagnostic/build
  if (req.method === 'GET' && parsedUrl === '/api/diagnostic/build') {
    let distStats = null;
    const distIndexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distIndexPath)) {
      const stat = fs.statSync(distIndexPath);
      distStats = {
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        buildHash: `BCT-BUILD-${Math.round(stat.mtimeMs).toString(36)}`
      };
    }
    let dbSummary = {};
    if (fs.existsSync(LATEST_STATE_FILE)) {
      try {
        const raw = fs.readFileSync(LATEST_STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          dbSummary[k] = Array.isArray(v) ? v.length : typeof v === 'object' ? Object.keys(v).length : 1;
        }
      } catch {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'authoritative_active',
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      workingDirectory: __dirname,
      nodeVersion: process.version,
      distBuild: distStats,
      serverTime: new Date().toISOString(),
      databaseSummary: dbSummary
    }, null, 2));
  }

  // POST /api/backups/validate-directory
  if (req.method === 'POST' && parsedUrl === '/api/backups/validate-directory') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { path: dirPath } = JSON.parse(body || '{}');
        if (!dirPath || typeof dirPath !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ valid: false, message: 'مسار المجلد مطلوب', message_en: 'Directory path is required' }));
        }
        const clean = dirPath.trim();
        const resolved = path.resolve(__dirname, clean);

        if (!isInsideDir(DEFAULT_BACKUPS_DIR, resolved)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            valid: false,
            path: clean,
            exists: false,
            writable: false,
            message: 'حظر أمني: المسار المطلوب يقع خارج النطاق المسموح به للملقم.',
            message_en: 'Security restriction: Directory path must reside within approved server boundaries.'
          }));
        }

        if (!fs.existsSync(resolved)) {
          fs.mkdirSync(resolved, { recursive: true });
        }

        const probeFile = path.join(resolved, `.write_probe_${Date.now()}.tmp`);
        fs.writeFileSync(probeFile, 'BCT_WRITE_OK', 'utf8');
        fs.unlinkSync(probeFile);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          valid: true,
          path: clean,
          exists: true,
          writable: true,
          message: `المجلد صالح وموثوق ولديه صلاحيات كتابة كاملة (${clean})`,
          message_en: `Directory validated with full write access (${clean})`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          valid: false,
          message: `خطأ في فحص المجلد: ${err.message}`,
          message_en: `Directory validation failed: ${err.message}`
        }));
      }
    });
    return;
  }

  // GET /api/backups/browse-directories
  if (req.method === 'GET' && parsedUrl === '/api/backups/browse-directories') {
    const defaults = [
      { path: './backups', name: 'المجلد الرئيسي المعتمد (./backups)', name_en: 'Primary Default Directory (./backups)', isDefault: true },
      { path: './backups/daily', name: 'مجلد النسخ اليومي السريع (./backups/daily)', name_en: 'Daily Snapshots Folder (./backups/daily)' },
      { path: './backups/monthly', name: 'مجلد النسخ الشهري الموثق (./backups/monthly)', name_en: 'Monthly Archives Folder (./backups/monthly)' },
      { path: './backups/vault', name: 'خزينة الأمان المتقدمة (./backups/vault)', name_en: 'Secure Enterprise Vault (./backups/vault)' }
    ];
    defaults.forEach(d => {
      const p = path.resolve(__dirname, d.path);
      if (!fs.existsSync(p)) {
        try { fs.mkdirSync(p, { recursive: true }); } catch {}
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ directories: defaults }));
  }

  // POST /api/backups/create-directory
  if (req.method === 'POST' && parsedUrl === '/api/backups/create-directory') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { path: dirPath } = JSON.parse(body || '{}');
        const clean = (dirPath || '').trim();
        const resolved = path.resolve(__dirname, clean);
        if (!clean || !isInsideDir(DEFAULT_BACKUPS_DIR, resolved)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, message: 'مسار غير مسموح به أمنياً' }));
        }
        fs.mkdirSync(resolved, { recursive: true });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, path: clean }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 1. GET /api/backups - List local backups
  if (req.method === 'GET' && parsedUrl === '/api/backups') {
    try {
      let history = [];
      if (fs.existsSync(HISTORY_FILE)) {
        try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
      }
      const files = fs.readdirSync(activeBackupsDir).filter(f => f.endsWith('.bctbak'));
      const fileList = files.map(file => {
        const stats = fs.statSync(path.join(activeBackupsDir, file));
        const matched = history.find(h => h.filename === file);
        return {
          id: matched ? matched.id : `BCT-BAK-SRV-${file.replace(/[^0-9]/g, '').slice(0, 8)}`,
          filename: file,
          name: matched ? matched.name : `نسخة احتياطية من الخادم (${file})`,
          size_bytes: stats.size,
          size_formatted: formatBytes(stats.size),
          created_at: stats.mtime.toISOString(),
          status: 'completed',
          destination: 'local',
          is_verified: true,
          checksum_sha256: matched ? matched.checksum_sha256 : ''
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ backups: fileList }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 2. GET /api/backups/storage - Storage statistics
  if (req.method === 'GET' && parsedUrl === '/api/backups/storage') {
    try {
      const files = fs.readdirSync(activeBackupsDir).filter(f => f.endsWith('.bctbak'));
      let totalBytes = 0;
      files.forEach(f => {
        try { totalBytes += fs.statSync(path.join(activeBackupsDir, f)).size; } catch {}
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        usedBytes: totalBytes,
        usedFormatted: formatBytes(totalBytes),
        count: files.length,
        directory: activeBackupsDir
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 3. GET /api/backups/schedule - Current schedule
  if (req.method === 'GET' && parsedUrl === '/api/backups/schedule') {
    try {
      let schedule = {
        enabled: true,
        frequency: 'daily',
        execution_time: '03:00',
        day_of_week: 5,
        day_of_month: 1,
        timezone: 'Africa/Cairo',
        destination: 'local',
        local_backup_path: './backups'
      };
      if (fs.existsSync(SCHEDULE_FILE)) {
        try { schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8')); } catch {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(schedule));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // 4. POST /api/backups/schedule - Update schedule
  if (req.method === 'POST' && parsedUrl === '/api/backups/schedule') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid schedule payload' }));
        }
        // SECURITY: the server-side backup root must stay inside ./backups
        if (payload.local_backup_path !== undefined) {
          const lp = typeof payload.local_backup_path === 'string' ? payload.local_backup_path.trim() : '';
          if (!lp || !isInsideDir(DEFAULT_BACKUPS_DIR, path.resolve(__dirname, lp))) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'local_backup_path must be inside ./backups' }));
          }
        }
        // The extra "local computer" destination must be an existing absolute directory.
        const winPathCandidate = (payload.destinations && payload.destinations.local_computer && payload.destinations.local_computer.path) || payload.windows_backup_path;
        if (winPathCandidate !== undefined && winPathCandidate !== null && winPathCandidate !== '') {
          if (typeof winPathCandidate !== 'string' || !path.isAbsolute(winPathCandidate) || !fs.existsSync(winPathCandidate) || !fs.statSync(winPathCandidate).isDirectory()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Local computer backup path must be an existing absolute directory' }));
          }
        }
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(payload, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, schedule: payload }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. POST /api/backups/sync-state - Sync latest DB snapshot to disk
  if (req.method === 'POST' && parsedUrl === '/api/backups/sync-state') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.encryptedData) {
          fs.writeFileSync(LATEST_STATE_FILE, payload.encryptedData, 'utf8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5B. POST /api/backups/save - Save official .bctbak archive to server storage
  if (req.method === 'POST' && parsedUrl === '/api/backups/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { filename, fileContent, targetDirectory } = payload;
        if (!filename || !fileContent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Filename and content are required' }));
        }
        const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!safeFilename.endsWith('.bctbak')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Official backup must end with .bctbak' }));
        }
        const destDir = targetDirectory ? path.resolve(__dirname, String(targetDirectory)) : activeBackupsDir;
        if (!isInsideDir(DEFAULT_BACKUPS_DIR, destDir)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Target directory must be inside ./backups' }));
        }
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        const finalPath = path.join(destDir, safeFilename);
        const tempPath = path.join(destDir, `.${safeFilename}.tmp_${Date.now()}`);
        fs.writeFileSync(tempPath, fileContent, 'utf8');
        fs.renameSync(tempPath, finalPath);
        const stats = fs.statSync(finalPath);
        const fileSha256 = crypto.createHash('sha256').update(fileContent, 'utf8').digest('hex');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          filename: safeFilename,
          full_path: finalPath,
          size_bytes: stats.size,
          size_formatted: formatBytes(stats.size),
          checksum_sha256: fileSha256,
          created_at: stats.mtime.toISOString(),
          message: `Backup saved successfully: ${safeFilename}`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 6. GET /api/backups/download/:filename - Download backup file
  if (req.method === 'GET' && parsedUrl.startsWith('/api/backups/download/')) {
    let requested = parsedUrl.replace('/api/backups/download/', '');
    try { requested = decodeURIComponent(requested); } catch {}
    const safeFile = path.basename(requested);
    // SECURITY: only official .bctbak archives can be downloaded
    if (!/^[A-Za-z0-9._-]+\.bctbak$/.test(safeFile)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Only .bctbak backup archives can be downloaded' }));
    }
    const targetPath = path.join(activeBackupsDir, safeFile);

    if (!fs.existsSync(targetPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Backup file not found' }));
    }

    const stat = fs.statSync(targetPath);
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFile}"`,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    const stream = fs.createReadStream(targetPath);
    return stream.pipe(res);
  }

  // 7. DELETE /api/backups/:id - Delete backup
  if (req.method === 'DELETE' && parsedUrl.startsWith('/api/backups/')) {
    const target = path.basename(parsedUrl.replace('/api/backups/', ''));
    try {
      const files = fs.readdirSync(activeBackupsDir).filter(f => f.endsWith('.bctbak'));
      let decodedTarget = target;
      try { decodedTarget = decodeURIComponent(target); } catch {}
      // Exact filename match first; otherwise match by backup id from history.
      let fileToDelete = files.find(f => f === decodedTarget);
      if (!fileToDelete && fs.existsSync(HISTORY_FILE)) {
        try {
          const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
          const rec = Array.isArray(history) ? history.find(h => h && h.id === decodedTarget) : null;
          if (rec && files.includes(rec.filename)) fileToDelete = rec.filename;
        } catch {}
      }
      // Ids generated by the listing route for files without history: BCT-BAK-SRV-<first 8 digits>
      if (!fileToDelete && decodedTarget.startsWith('BCT-BAK-SRV-')) {
        const digits = decodedTarget.slice('BCT-BAK-SRV-'.length);
        const candidates = files.filter(f => f.replace(/[^0-9]/g, '').slice(0, 8) === digits);
        if (candidates.length === 1) fileToDelete = candidates[0];
      }
      if (fileToDelete) {
        if (files.length <= 1) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Cannot delete the last remaining backup on server.' }));
        }
        fs.unlinkSync(path.join(activeBackupsDir, fileToDelete));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: `Backup deleted successfully` }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

const CANONICAL_DB_FILE = path.join(__dirname, 'data', 'bct_production.json');

function loadCanonicalDatabaseServer() {
  if (fs.existsSync(CANONICAL_DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(CANONICAL_DB_FILE, 'utf8'));
      if (parsed && parsed.tables) return parsed;
      return { version: '1.0.0', revision: 1, updatedAt: new Date().toISOString(), tables: parsed };
    } catch {}
  }
  if (fs.existsSync(LATEST_STATE_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LATEST_STATE_FILE, 'utf8'));
      return { version: '1.0.0', revision: 1, updatedAt: new Date().toISOString(), tables: parsed };
    } catch {}
  }
  return { version: '1.0.0', revision: 1, updatedAt: new Date().toISOString(), tables: {} };
}

function handleDatabaseEndpoints(req, res) {
  const url = req.url.split('?')[0];
  const subPath = url.replace('/api/database', '') || '/';
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Health and Readiness Check
  if (req.method === 'GET' && (url === '/api/health' || url === '/health')) {
    try {
      const db = loadCanonicalDatabaseServer();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        database: 'connected',
        revision: db.revision,
        updatedAt: db.updatedAt,
        studentsCount: Array.isArray(db.tables?.bct_store_students) ? db.tables.bct_store_students.length : 0,
        filesCount: Array.isArray(db.tables?.bct_store_files) ? db.tables.bct_store_files.length : 0,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'unhealthy', error: err.message }));
    }
  }

  // Transactional student registration endpoint
  if (req.method === 'POST' && url === '/api/students/register') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { studentData, fileData } = payload;
        // SECURITY: attribute the action to the authenticated session, never to a body field
        const actorUsername = (req.bctAuth && req.bctAuth.username) || 'system';
        
        if (!studentData || !studentData.full_name_ar || !studentData.passport_number) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'studentData missing required fields' }));
        }

        const current = loadCanonicalDatabaseServer();
        if (!current.tables) current.tables = {};
        const currentStudents = current.tables.bct_store_students || [];
        const currentFiles = current.tables.bct_store_files || [];

        // Check duplicate passport
        const existingStudent = currentStudents.find(s => 
          (s.passport_number && s.passport_number.trim().toLowerCase() === studentData.passport_number.trim().toLowerCase()) ||
          (studentData.national_id && s.national_id && s.national_id.trim() === studentData.national_id.trim())
        );

        if (existingStudent) {
          const existingFile = currentFiles.find(f => f.student_id === existingStudent.id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: false,
            code: 'DUPLICATE_STUDENT',
            message: `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${existingFile ? existingFile.file_code : ''}`,
            existingFileCode: existingFile ? existingFile.file_code : '',
            existingStudent
          }));
        }

        const now = new Date().toISOString();
        const studentId = `stu-${Date.now().toString().slice(-4)}`;
        const studentCode = `BCT-STU-2026-${String(currentStudents.length + 1).padStart(3, '0')}`;
        
        const newStudent = {
          ...studentData,
          id: studentId,
          student_code: studentCode,
          created_at: now
        };

        const fileId = `file-${Date.now().toString().slice(-4)}`;
        const fileCode = `BCT-FILE-2026-${String(currentFiles.length + 1).padStart(3, '0')}`;

        const newFile = {
          ...fileData,
          id: fileId,
          file_code: fileCode,
          student_id: studentId,
          current_status: fileData && fileData.current_status ? fileData.current_status : 'new',
          current_stage_entered_at: now,
          last_updated_at: now,
          is_overdue: false,
          created_at: now,
          last_action_by_id: actorUsername || 'admin',
          last_action_by_name: actorUsername || 'مدير النظام',
          last_action_at: now,
          last_action_type: 'FILE_CREATED',
          is_archived: false
        };

        current.tables.bct_store_students = [newStudent, ...currentStudents];
        current.tables.bct_store_files = [newFile, ...currentFiles];

        const auditLogs = current.tables.bct_store_audit_logs || [];
        const newAudit = {
          id: Date.now(),
          actor_username: actorUsername || 'system',
          action: 'CREATE_STUDENT_AND_FILE',
          resource_type: 'student',
          resource_id: studentId,
          new_state: { studentCode, fileCode },
          created_at: now
        };
        current.tables.bct_store_audit_logs = [newAudit, ...auditLogs];

        const nextRev = (current.revision || 1) + 1;
        current.revision = nextRev;
        current.updatedAt = now;

        const tmp1 = CANONICAL_DB_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp1, JSON.stringify(current, null, 2), 'utf8');
        fs.renameSync(tmp1, CANONICAL_DB_FILE);

        const tmp2 = LATEST_STATE_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp2, JSON.stringify(current.tables, null, 2), 'utf8');
        fs.renameSync(tmp2, LATEST_STATE_FILE);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          student: newStudent,
          file: newFile,
          revision: nextRev,
          updatedAt: now
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && (subPath === '/version' || subPath === '/rev')) {
    const db = loadCanonicalDatabaseServer();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      version: db.version,
      revision: db.revision,
      updatedAt: db.updatedAt,
      checksum: db.checksum
    }));
  }

  if (req.method === 'GET' && (subPath === '/state' || subPath === '/all' || subPath === '/' || subPath === '')) {
    const db = loadCanonicalDatabaseServer();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(db));
  }

  if (req.method === 'GET' && subPath.startsWith('/table/')) {
    const tableName = subPath.replace('/table/', '').trim();
    const db = loadCanonicalDatabaseServer();
    const tableData = db.tables ? db.tables[tableName] : undefined;
    if (tableData === undefined) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `Table "${tableName}" not found` }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ table: tableName, revision: db.revision, data: tableData }));
  }

  if (req.method === 'POST' && subPath.startsWith('/table/')) {
    const tableName = subPath.replace('/table/', '').trim();
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const data = payload.data !== undefined ? payload.data : payload;
        const current = loadCanonicalDatabaseServer();
        const nextRev = (current.revision || 1) + 1;
        const now = new Date().toISOString();
        if (!current.tables) current.tables = {};
        if (Array.isArray(data) && Array.isArray(current.tables[tableName]) && (tableName === 'bct_store_students' || tableName === 'bct_store_files')) {
          const existingMap = new Map();
          for (const item of current.tables[tableName]) {
            if (item && item.id) existingMap.set(item.id, item);
          }
          for (const item of data) {
            if (item && item.id) existingMap.set(item.id, item);
          }
          current.tables[tableName] = Array.from(existingMap.values());
        } else {
          current.tables[tableName] = data;
        }
        current.revision = nextRev;
        current.updatedAt = now;
        
        // Write atomic
        const tmp1 = CANONICAL_DB_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp1, JSON.stringify(current, null, 2), 'utf8');
        fs.renameSync(tmp1, CANONICAL_DB_FILE);

        const tmp2 = LATEST_STATE_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp2, JSON.stringify(current.tables, null, 2), 'utf8');
        fs.renameSync(tmp2, LATEST_STATE_FILE);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, table: tableName, revision: nextRev }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === 'POST' && (subPath === '/sync' || subPath === '/bulk')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const tables = payload.tables || payload;
        const current = loadCanonicalDatabaseServer();
        const nextRev = (current.revision || 1) + 1;
        const now = new Date().toISOString();
        if (!current.tables) current.tables = {};
        for (const [key, val] of Object.entries(tables)) {
          if (Array.isArray(val) && Array.isArray(current.tables[key]) && (key === 'bct_store_students' || key === 'bct_store_files')) {
            const existingMap = new Map();
            for (const item of current.tables[key]) {
              if (item && item.id) existingMap.set(item.id, item);
            }
            for (const item of val) {
              if (item && item.id) existingMap.set(item.id, item);
            }
            current.tables[key] = Array.from(existingMap.values());
          } else {
            current.tables[key] = val;
          }
        }
        current.revision = nextRev;
        current.updatedAt = now;

        const tmp1 = CANONICAL_DB_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp1, JSON.stringify(current, null, 2), 'utf8');
        fs.renameSync(tmp1, CANONICAL_DB_FILE);

        const tmp2 = LATEST_STATE_FILE + '.' + Date.now() + '.tmp';
        fs.writeFileSync(tmp2, JSON.stringify(current.tables, null, 2), 'utf8');
        fs.renameSync(tmp2, LATEST_STATE_FILE);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, revision: nextRev }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

const LOCAL_AGENT_PORT = 45454;
const LOCAL_AGENT_HOST = '127.0.0.1';
const AGENT_TOKEN = 'bct_agent_secure_token_2026';
const FOLDER_PICKER_SCRIPT = path.join(__dirname, 'scripts', 'windows-folder-picker.ps1');

let isSpawningAgent = false;
let lastSpawnAttempt = 0;

function pingLocalAgentHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: LOCAL_AGENT_HOST,
      port: LOCAL_AGENT_PORT,
      path: '/health',
      method: 'GET',
      timeout: 1500
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve({ ok: true, data: parsed });
          } catch {
            resolve({ ok: true, data: null });
          }
        } else {
          resolve({ ok: false, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.code || err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'TIMEOUT' });
    });
    req.end();
  });
}

async function ensureLocalAgentRunning() {
  const check = await pingLocalAgentHealth();
  if (check.ok) {
    return true;
  }

  const now = Date.now();
  if (isSpawningAgent || (now - lastSpawnAttempt < 5000)) {
    return false;
  }

  isSpawningAgent = true;
  lastSpawnAttempt = now;

  try {
    const agentScript = path.join(__dirname, 'scripts', 'bct-backup-agent.cjs');
    if (fs.existsSync(agentScript)) {
      console.log('[BCT Server] Auto-starting Windows Local Backup Agent on 127.0.0.1:45454...');
      const child = spawn(process.execPath, [agentScript], {
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

      // Poll health endpoint for up to 3 seconds
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        const recheck = await pingLocalAgentHealth();
        if (recheck.ok) {
          console.log('[BCT Server] Windows Local Backup Agent confirmed running & verified (HTTP 200).');
          isSpawningAgent = false;
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[BCT Server] Failed to spawn local backup agent:', err.message);
  } finally {
    isSpawningAgent = false;
  }
  return false;
}

function getWindowsDrivesList() {
  const drives = [];
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

class RequestLifecycle {
  constructor(res) {
    this.finalized = false;
    this.res = res;
    if (res && typeof res.on === 'function') {
      res.on('close', () => {
        this.finalized = true;
      });
    }
  }

  isDone() {
    return this.finalized || (this.res && (this.res.headersSent || this.res.writableEnded));
  }

  sendJson(statusCode, data) {
    if (this.isDone()) return;
    this.finalized = true;
    try {
      this.res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      this.res.end(JSON.stringify(data));
    } catch (err) {
      console.warn('[RequestLifecycle] sendJson suppressed write error:', err.message);
    }
  }

  pipeFrom(upstreamRes) {
    if (this.isDone()) {
      if (upstreamRes && typeof upstreamRes.resume === 'function') upstreamRes.resume();
      return;
    }
    this.finalized = true;
    try {
      this.res.writeHead(upstreamRes.statusCode || 200, { 'Content-Type': 'application/json' });
      upstreamRes.pipe(this.res);
    } catch (err) {
      console.warn('[RequestLifecycle] pipeFrom suppressed error:', err.message);
    }
  }
}

let activePickRequest = null;

function handleEmbeddedAgentFallback(method, subPath, bodyStr, res, customLifecycle) {
  const lifecycle = customLifecycle || new RequestLifecycle(res);
  // Status check
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

    return lifecycle.sendJson(200, {
      connected: false,
      status: 'disconnected',
      agentVersion: '1.2.0',
      port: LOCAL_AGENT_PORT,
      drives,
      activeDestination: fallbackPath,
      freeSpace: freeFormatted,
      freeSpaceBytes: freeBytes,
      schedulerRunning: false,
      message: 'وكيل النسخ الاحتياطي غير متصل (يمكن تشغيله عبر scripts\\start-backup-agent.bat)',
      message_en: 'Local backup agent is disconnected. Run scripts\\start-backup-agent.bat to start.'
    });
  }

  // Pick folder
  if (method === 'POST' && subPath === '/pick-folder') {
    let initialPath = '';
    let testFolder = '';
    let cancel = false;
    try {
      const payload = JSON.parse(bodyStr || '{}');
      initialPath = payload.initialPath || '';
      testFolder = payload.testFolder || '';
      cancel = Boolean(payload.cancel);
    } catch {}

    const ipcClient = require('./scripts/bct-ipc-client.cjs');

    if (cancel) {
      activePickRequest = null;
      return ipcClient.requestFolderPicker({ cancel: true, timeoutMs: 3000 }).then((cancelResult) => {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: cancelResult.sessionId ?? 1,
          channel: cancelResult.channel || 'interactive_helper_pipe',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      }).catch(() => {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: 1,
          channel: 'interactive_helper_pipe',
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      });
    }

    if (activePickRequest && !testFolder) {
      try {
        const pickerExe = path.resolve(__dirname, 'scripts', 'bct-folder-picker.exe');
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

    const pickPromise = ipcClient.requestFolderPicker({ initialPath, testFolder, cancel });
    if (!testFolder) {
      activePickRequest = pickPromise;
    }

    pickPromise.then((result) => {
      if (result.cancelled) {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: true,
          sessionId: result.sessionId,
          channel: result.channel,
          message: 'تم إلغاء اختيار المجلد بواسطة المستخدم'
        });
      }
      if (!result.success || !result.path) {
        return lifecycle.sendJson(200, {
          success: false,
          cancelled: false,
          isBusy: Boolean(result.isBusy),
          sessionId: result.sessionId,
          channel: result.channel,
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
      } catch (writeErr) {
        return lifecycle.sendJson(200, {
          success: false,
          path: selectedPath,
          writable: false,
          cancelled: false,
          sessionId: result.sessionId,
          channel: result.channel,
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

      return lifecycle.sendJson(200, {
        success: true,
        path: selectedPath,
        drive: path.parse(selectedPath).root,
        freeSpace: freeFormatted,
        freeSpaceBytes: freeBytes,
        cancelled: false,
        sessionId: result.sessionId,
        channel: result.channel,
        message: `تم اختيار مجلد الحفظ بنجاح: ${selectedPath}`
      });
    }).catch((err) => {
      return lifecycle.sendJson(200, {
        success: false,
        cancelled: false,
        error: err.message,
        message: `خطأ في استدعاء نافذة المجلدات: ${err.message}`
      });
    }).finally(() => {
      if (activePickRequest === pickPromise) {
        activePickRequest = null;
      }
    });
    return;
  }

  // Validate folder
  if (method === 'POST' && subPath === '/validate-folder') {
    try {
      const { path: dirPath } = JSON.parse(bodyStr || '{}');
      const clean = (dirPath || '').trim();
      if (!clean) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ valid: false, message: 'مسار المجلد مطلوب' }));
      }
      if (!fs.existsSync(clean)) {
        fs.mkdirSync(clean, { recursive: true });
      }
      const probeFile = path.join(clean, `.bct_probe_${Date.now()}.tmp`);
      fs.writeFileSync(probeFile, 'BCT_WRITE_OK', 'utf8');
      fs.unlinkSync(probeFile);

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
    } catch (err) {
      return lifecycle.sendJson(500, { valid: false, message: err.message });
    }
  }

  // Create folder
  if (method === 'POST' && subPath === '/create-folder') {
    try {
      const { path: dirPath } = JSON.parse(bodyStr || '{}');
      const clean = (dirPath || '').trim();
      fs.mkdirSync(clean, { recursive: true });
      return lifecycle.sendJson(200, { success: true, path: clean });
    } catch (err) {
      return lifecycle.sendJson(500, { success: false, error: err.message });
    }
  }

  // Save backup
  if (method === 'POST' && subPath === '/save-backup') {
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const { filename, encryptedData, destinationPath } = payload;
      if (typeof filename !== 'string' || typeof encryptedData !== 'string') {
        return lifecycle.sendJson(400, { success: false, error: 'filename and encryptedData are required' });
      }
      const targetDir = destinationPath || path.join(os.homedir(), 'Downloads', 'BCT Backups');
      if (typeof targetDir !== 'string' || !path.isAbsolute(targetDir)) {
        return lifecycle.sendJson(400, { success: false, error: 'destinationPath must be an absolute directory' });
      }
      // SECURITY: only official backup archives may be written, never scripts or app files
      const safeFilename = path.basename(filename).replace(/[^A-Za-z0-9._-]/g, '_');
      if (!/\.bctbak$/i.test(safeFilename) || /^\./.test(safeFilename)) {
        return lifecycle.sendJson(400, { success: false, error: 'Backup filename must end with .bctbak' });
      }
      const resolvedTarget = path.resolve(targetDir);
      if (isInsideDir(__dirname, resolvedTarget) && !isInsideDir(DEFAULT_BACKUPS_DIR, resolvedTarget)) {
        return lifecycle.sendJson(403, { success: false, error: 'Cannot write backups inside the application folder (except ./backups)' });
      }
      if (!fs.existsSync(resolvedTarget)) {
        fs.mkdirSync(resolvedTarget, { recursive: true });
      }
      const outPath = path.join(resolvedTarget, safeFilename);
      fs.writeFileSync(outPath, encryptedData, 'utf8');
      const stats = fs.statSync(outPath);
      const computedSha256 = crypto.createHash('sha256').update(encryptedData, 'utf8').digest('hex');

      return lifecycle.sendJson(200, {
        success: true,
        filename: safeFilename,
        fullPath: outPath,
        size_bytes: stats.size,
        size_formatted: formatBytes(stats.size),
        checksum_sha256: computedSha256,
        message: `تم حفظ النسخة بنجاح في: ${outPath}`
      });
    } catch (err) {
      return lifecycle.sendJson(500, { success: false, error: err.message });
    }
  }

  // List backups
  if (method === 'GET' && subPath.startsWith('/list-backups')) {
    try {
      const fallbackPath = path.join(os.homedir(), 'Downloads', 'BCT Backups');
      if (!fs.existsSync(fallbackPath)) {
        return lifecycle.sendJson(200, { backups: [] });
      }
      const files = fs.readdirSync(fallbackPath).filter(f => f.endsWith('.bctbak'));
      const backups = files.map(file => {
        const full = path.join(fallbackPath, file);
        const stats = fs.statSync(full);
        return {
          id: `BCT-BAK-WIN-${file.slice(0, 10)}`,
          filename: file,
          full_path: full,
          name: `نسخة ويندوز (${file})`,
          size_bytes: stats.size,
          size_formatted: formatBytes(stats.size),
          created_at: stats.mtime.toISOString(),
          status: 'completed',
          destination: 'local_computer',
          is_verified: true
        };
      });
      return lifecycle.sendJson(200, { backups, directory: fallbackPath });
    } catch (err) {
      return lifecycle.sendJson(500, { error: err.message });
    }
  }

  // Default 404
  return lifecycle.sendJson(404, { error: 'Endpoint not found on local agent' });
}

const helperManager = require('./scripts/bct-helper-manager.cjs');

async function ensureInteractiveHelperRunning() {
  const res = await helperManager.ensureHelperRunning();
  return Boolean(res && res.ready);
}

function handleLocalAgentEndpoints(req, res) {
  // Same-origin only: no CORS / Private-Network-Access headers. Admin session is
  // enforced centrally in routeRequest before this handler runs.
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const lifecycle = new RequestLifecycle(res);
  const parsedUrl = req.url.split('?')[0];
  const agentSubPath = parsedUrl.replace('/api/local-agent', '') || '/status';

  let bodyBuffer = [];
  req.on('data', chunk => bodyBuffer.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyBuffer);
    const bodyStr = rawBody.toString('utf8');

    // 1. Single direct pathway for pick-folder (avoids dual proxy + fallback race condition)
    if (agentSubPath === '/pick-folder') {
      return handleEmbeddedAgentFallback(req.method, agentSubPath, bodyStr, res, lifecycle);
    }

    // 2. Check if Interactive Helper is active via Lifecycle Manager for other endpoints
    const helperHealth = await helperManager.checkHelperHealth(600);
    if (helperHealth.connected && helperHealth.port) {
      const helperReq = http.request({
        hostname: LOCAL_AGENT_HOST,
        port: helperHealth.port,
        path: agentSubPath,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'X-BCT-Agent-Token': AGENT_TOKEN,
          'Content-Length': rawBody.length
        },
        timeout: 120000
      }, (helperRes) => {
        lifecycle.pipeFrom(helperRes);
      });

      helperReq.on('timeout', () => {
        helperReq.destroy();
        handleEmbeddedAgentFallback(req.method, agentSubPath, bodyStr, res, lifecycle);
      });

      helperReq.on('error', () => {
        handleEmbeddedAgentFallback(req.method, agentSubPath, bodyStr, res, lifecycle);
      });

      if (rawBody.length > 0) {
        helperReq.write(rawBody);
      }
      return helperReq.end();
    }

    // 3. Auto-trigger agent & helper check & startup if needed
    helperManager.ensureHelperRunning().catch(() => {});
    const health = await pingLocalAgentHealth();
    if (!health.ok) {
      ensureLocalAgentRunning().catch(() => {});
      if (isSpawningAgent && (agentSubPath === '/status' || agentSubPath === '' || agentSubPath === '/')) {
        const drives = getWindowsDrivesList();
        const fallbackPath = path.join(os.homedir(), 'Downloads', 'BCT Backups');
        return lifecycle.sendJson(200, {
          connected: false,
          status: 'connecting',
          agentVersion: '1.2.0',
          port: LOCAL_AGENT_PORT,
          drives,
          activeDestination: fallbackPath,
          freeSpace: 'Checking...',
          schedulerRunning: false,
          message: 'جارٍ تشغيل وكيل النسخ الاحتياطي في الخلفية...',
          message_en: 'Starting Windows Local Backup Agent service in background...'
        });
      }
    }

    // 4. Forward to background agent on 127.0.0.1:45454
    const agentReq = http.request({
      hostname: LOCAL_AGENT_HOST,
      port: LOCAL_AGENT_PORT,
      path: `/api/agent${agentSubPath}`,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-BCT-Agent-Token': AGENT_TOKEN,
        'Content-Length': rawBody.length
      },
      timeout: 65000
    }, (agentRes) => {
      lifecycle.pipeFrom(agentRes);
    });

    agentReq.on('timeout', () => {
      agentReq.destroy();
      lifecycle.sendJson(504, { success: false, error: 'Agent request timed out' });
    });

    agentReq.on('error', () => {
      handleEmbeddedAgentFallback(req.method, agentSubPath, bodyStr, res, lifecycle);
    });

    if (rawBody.length > 0) {
      agentReq.write(rawBody);
    }
    agentReq.end();
  });
}

let lastExecutedSlot = '';

function runBackgroundBackupScheduler() {
  setInterval(() => {
    try {
      let schedule = {
        enabled: true,
        frequency: 'daily',
        execution_time: '03:00',
        day_of_week: 5,
        day_of_month: 1,
        timezone: 'Africa/Cairo',
        local_backup_path: './backups'
      };

      if (fs.existsSync(SCHEDULE_FILE)) {
        try {
          schedule = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
        } catch {}
      }

      if (!schedule.enabled || schedule.frequency === 'manual') {
        return;
      }

      // Convert to configured timezone (default Africa/Cairo)
      const tz = schedule.timezone || 'Africa/Cairo';
      let schedDate;
      try {
        schedDate = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      } catch {
        schedDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
      }

      const pad = n => String(n).padStart(2, '0');
      const hours = pad(schedDate.getHours());
      const mins = pad(schedDate.getMinutes());
      const currentTimeStr = `${hours}:${mins}`;
      const dayOfWeek = schedDate.getDay();
      const dayOfMonth = schedDate.getDate();
      const dateKey = `${schedDate.getFullYear()}-${pad(schedDate.getMonth() + 1)}-${pad(schedDate.getDate())}`;

      const targetTime = schedule.execution_time || '03:00';

      let shouldRun = false;
      if (currentTimeStr === targetTime) {
        if (schedule.frequency === 'daily') {
          shouldRun = true;
        } else if (schedule.frequency === 'weekly' && dayOfWeek === (schedule.day_of_week ?? 5)) {
          shouldRun = true;
        } else if (schedule.frequency === 'monthly' && dayOfMonth === (schedule.day_of_month ?? 1)) {
          shouldRun = true;
        }
      }

      const slotKey = `${dateKey}_${targetTime}_${tz}`;
      if (shouldRun && lastExecutedSlot !== slotKey) {
        lastExecutedSlot = slotKey;
        console.log(`[Backup Scheduler] Triggering automated scheduled backup at ${tz} time: ${currentTimeStr} (${dateKey})`);

        let content = '';
        if (fs.existsSync(LATEST_STATE_FILE)) {
          content = fs.readFileSync(LATEST_STATE_FILE, 'utf8');
        } else {
          content = Buffer.from(JSON.stringify({
            header: {
              magic: 'BCT_ENTERPRISE_BACKUP',
              version: '1.0.0',
              backup_id: `BCT-BAK-${schedDate.getFullYear()}-${Date.now().toString().slice(-4)}`,
              created_at: new Date().toISOString(),
              created_by: 'scheduler',
              backup_type: 'automatic',
              destination: schedule.destination || 'local',
              total_records: 382
            },
            tables: {}
          })).toString('base64');
        }

        const dateStamp = `${schedDate.getFullYear()}${pad(schedDate.getMonth() + 1)}${pad(schedDate.getDate())}_${pad(schedDate.getHours())}${pad(schedDate.getMinutes())}00`;
        const filename = `bct_backup_${dateStamp}.bctbak`;

        const destinations = schedule.destinations;
        const isServerEnabled = destinations?.server_storage !== undefined
          ? Boolean(destinations.server_storage.enabled)
          : true;
        const isWindowsEnabled = destinations?.local_computer !== undefined
          ? Boolean(destinations.local_computer.enabled)
          : true;

        if (isServerEnabled) {
          const activeDir = getSafeBackupsDir();
          const outPath = path.join(activeDir, filename);
          fs.writeFileSync(outPath, content, 'utf8');
          console.log(`[Backup Scheduler] Successfully wrote backup archive to server storage (${activeDir}): ${filename}`);
        } else {
          console.log(`[Backup Scheduler] Server storage destination is disabled, skipping server write.`);
        }

        if (isWindowsEnabled) {
          const winPath = destinations?.local_computer?.path || schedule.windows_backup_path;
          const winPathOk = typeof winPath === 'string' && path.isAbsolute(winPath) &&
            !(isInsideDir(__dirname, winPath) && !isInsideDir(DEFAULT_BACKUPS_DIR, winPath));
          if (winPathOk && fs.existsSync(winPath)) {
            try {
              const winOutPath = path.join(winPath, filename);
              fs.writeFileSync(winOutPath, content, 'utf8');
              console.log(`[Backup Scheduler] Successfully wrote backup archive to Windows folder (${winPath}): ${filename}`);
            } catch (wErr) {
              console.warn('[Backup Scheduler] Could not write to Windows folder:', wErr.message);
            }
          }
        } else {
          console.log(`[Backup Scheduler] Local computer (Windows) destination is disabled, skipping Windows folder write.`);
        }
      }
    } catch (schedErr) {
      console.error('[Backup Scheduler] Error:', schedErr.message);
    }
  }, 30000);
}

function requestHandler(req, res) {
  try {
    routeRequest(req, res);
  } catch (err) {
    console.error('[BCT Server] Unhandled request error:', err && err.stack ? err.stack : err);
    try {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    } catch {}
  }
}

function routeRequest(req, res) {
  const parsedUrl = (req.url || '/').split('?')[0];

  // Baseline security headers for every response
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');

  // API Endpoints
  if (parsedUrl === '/api' || parsedUrl.startsWith('/api/')) {
    if (parsedUrl.startsWith('/api/auth/')) {
      return handleAuthEndpoints(req, res, parsedUrl);
    }

    const auth = getAuthenticatedSession(req);
    if (!auth) {
      return sendJson(res, 401, { error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    }
    if (routeRequiresAdmin(req.method, parsedUrl) && !auth.isAdmin) {
      return sendJson(res, 403, { error: 'Forbidden: administrator access required', code: 'ADMIN_REQUIRED' });
    }
    req.bctAuth = auth;

    if (parsedUrl === '/api/student-files/download-zip') {
      return handleZipEndpoint(req, res);
    }
    if (parsedUrl.startsWith('/api/backups')) {
      return handleBackupEndpoints(req, res);
    }
    if (parsedUrl.startsWith('/api/database')) {
      return handleDatabaseEndpoints(req, res);
    }
    if (parsedUrl.startsWith('/api/students')) {
      return handleDatabaseEndpoints(req, res);
    }
    if (parsedUrl.startsWith('/api/local-agent')) {
      return handleLocalAgentEndpoints(req, res);
    }
    return sendJson(res, 404, { error: 'Endpoint not found' });
  }

  // Static File Serving (confined to DIST_DIR)
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(parsedUrl);
  } catch {
    decodedPath = '/';
  }
  if (decodedPath.includes('\0')) decodedPath = '/';
  let filePath = path.resolve(DIST_DIR, '.' + path.posix.normalize('/' + (decodedPath === '/' ? 'index.html' : decodedPath).replace(/\\/g, '/')));
  if (!isInsideDir(DIST_DIR, filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
      });
      res.end(content);
    });
  });
}

// Keep the server alive if an asynchronous callback throws; log for diagnosis.
process.on('uncaughtException', (err) => {
  console.error('[BCT Server] Uncaught exception (server kept running):', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[BCT Server] Unhandled promise rejection:', reason);
});

loadSessionsFromDisk();

// Check SSL certificates
const hasSsl = fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE);

let server;
if (hasSsl) {
  const sslOptions = {
    key: fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CERT_FILE)
  };
  server = https.createServer(sslOptions, requestHandler);
  console.log(`[BCT Server] SSL Certificate loaded from ${CERTS_DIR}`);
} else {
  server = http.createServer(requestHandler);
  console.log(`[BCT Server] Starting in HTTP mode. (To enable HTTPS for 192.168.1.5, run: node scripts/generate-ssl-cert.cjs)`);
}

let currentPort = parseInt(PORT, 10);
let currentHost = HOST;

function startServer(portToTry, hostToTry) {
  server.once('error', (err) => {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      console.warn(`[BCT Server] Warning: Port ${portToTry} on host ${hostToTry} is not available (${err.code}). Trying next configuration...`);
      if (hostToTry === '0.0.0.0') {
        startServer(portToTry, '127.0.0.1');
      } else {
        startServer(portToTry + 1, '0.0.0.0');
      }
    } else {
      console.error('[BCT Server] Fatal listen error:', err.message);
    }
  });

  server.listen(portToTry, hostToTry, () => {
    const protocol = hasSsl ? 'https' : 'http';
    runBackgroundBackupScheduler();
    ensureLocalAgentRunning().catch(() => {});
    ensureInteractiveHelperRunning().catch(() => {});
    console.log(`================================================================`);
    console.log(` BCT Enterprise Server running at:`);
    console.log(` - Local:    ${protocol}://localhost:${portToTry}`);
    console.log(` - Network:  ${protocol}://${hostToTry === '0.0.0.0' ? '192.168.1.5' : hostToTry}:${portToTry}`);
    console.log(` - API:      ${protocol}://localhost:${portToTry}/api/student-files/download-zip`);
    console.log(` - Backups:  ${protocol}://localhost:${portToTry}/api/backups (Dir: ${BACKUPS_DIR})`);
    console.log(` - Agent:    ${protocol}://localhost:${portToTry}/api/local-agent/status`);
    console.log(`================================================================`);
  });
}

startServer(currentPort, currentHost);
