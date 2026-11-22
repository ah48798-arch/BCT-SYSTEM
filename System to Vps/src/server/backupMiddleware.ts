import type { Connect } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const WORKSPACE_ROOT = process.cwd();
const DEFAULT_BACKUPS_DIR = path.join(WORKSPACE_ROOT, 'backups');
const LATEST_STATE_FILE = path.join(DEFAULT_BACKUPS_DIR, 'latest_db_state.json');

if (!fs.existsSync(DEFAULT_BACKUPS_DIR)) {
  try { fs.mkdirSync(DEFAULT_BACKUPS_DIR, { recursive: true }); } catch {}
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function handleBackupRequest(req: any, res: any, next: any) {
  const parsedUrl = req.url?.split('?')[0];

  if (!parsedUrl?.startsWith('/api/backups') && !parsedUrl?.startsWith('/api/diagnostic')) {
    return next();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BCT-User');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // GET /api/diagnostic/build
  if (req.method === 'GET' && parsedUrl === '/api/diagnostic/build') {
    let distStats: any = null;
    const distIndexPath = path.join(WORKSPACE_ROOT, 'dist', 'index.html');
    if (fs.existsSync(distIndexPath)) {
      const stat = fs.statSync(distIndexPath);
      distStats = {
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        buildHash: `BCT-BUILD-${Math.round(stat.mtimeMs).toString(36)}`
      };
    }
    let dbSummary: any = {};
    if (fs.existsSync(LATEST_STATE_FILE)) {
      try {
        const raw = fs.readFileSync(LATEST_STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          dbSummary[k] = Array.isArray(v) ? (v as any[]).length : typeof v === 'object' ? Object.keys(v as any).length : 1;
        }
      } catch {}
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'authoritative_active',
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      workingDirectory: WORKSPACE_ROOT,
      nodeVersion: process.version,
      distBuild: distStats,
      serverTime: new Date().toISOString(),
      databaseSummary: dbSummary
    }, null, 2));
  }

  // POST /api/backups/validate-directory
  if (req.method === 'POST' && parsedUrl === '/api/backups/validate-directory') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        const { path: dirPath } = JSON.parse(body || '{}');
        if (!dirPath || typeof dirPath !== 'string') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ valid: false, message: 'مسار المجلد مطلوب', message_en: 'Directory path is required' }));
        }
        const clean = dirPath.trim();
        const resolved = path.resolve(WORKSPACE_ROOT, clean);

        if (!resolved.startsWith(WORKSPACE_ROOT) || clean.includes('..')) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
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

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          valid: true,
          path: clean,
          exists: true,
          writable: true,
          message: `المجلد صالح وموثوق ولديه صلاحيات كتابة كاملة (${clean})`,
          message_en: `Directory validated with full write access (${clean})`
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
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
      const p = path.resolve(WORKSPACE_ROOT, d.path);
      if (!fs.existsSync(p)) {
        try { fs.mkdirSync(p, { recursive: true }); } catch {}
      }
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ directories: defaults }));
  }

  // POST /api/backups/save - Atomically save official .bctbak archive to server storage
  if (req.method === 'POST' && parsedUrl === '/api/backups/save') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { filename, fileContent, targetDirectory } = payload;

        if (!filename || !fileContent) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'اسم الملف والمحتوى مطلوبان لحفظ النسخة الاحتياطية.' }));
        }

        const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!safeFilename.endsWith('.bctbak')) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'صيغة النسخة الاحتياطية الرسمية يجب أن تنتهي بالامتداد .bctbak حصراً.' }));
        }

        const destDir = targetDirectory ? path.resolve(WORKSPACE_ROOT, targetDirectory) : DEFAULT_BACKUPS_DIR;
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        const finalPath = path.join(destDir, safeFilename);
        const tempPath = path.join(destDir, `.${safeFilename}.tmp_${Date.now()}`);

        // Write atomically
        fs.writeFileSync(tempPath, fileContent, 'utf8');
        fs.renameSync(tempPath, finalPath);

        const stats = fs.statSync(finalPath);
        const fileSha256 = crypto.createHash('sha256').update(fileContent, 'utf8').digest('hex');

        // Also update latest_db_state.json if payload contains tables
        try {
          const parsed = JSON.parse(fileContent);
          if (parsed.payload) {
            const rawDecoded = Buffer.from(parsed.payload, 'base64').toString('utf8');
            const inner = JSON.parse(rawDecoded);
            if (inner.tables) {
              fs.writeFileSync(LATEST_STATE_FILE, JSON.stringify(inner.tables, null, 2), 'utf8');
            }
          }
        } catch {}

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          filename: safeFilename,
          full_path: finalPath,
          size_bytes: stats.size,
          size_formatted: formatBytes(stats.size),
          checksum_sha256: fileSha256,
          created_at: stats.mtime.toISOString(),
          message: `تم حفظ النسخة الاحتياطية بنجاح في مجلد الخادم: ${safeFilename}`,
          message_en: `Backup successfully saved to server storage: ${safeFilename}`
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: `فشل حفظ النسخة في الخادم: ${err.message}` }));
      }
    });
    return;
  }

  // GET /api/backups/download/:filename - Stream .bctbak file
  if (req.method === 'GET' && parsedUrl.startsWith('/api/backups/download/')) {
    const rawFilename = parsedUrl.replace('/api/backups/download/', '');
    const cleanFilename = path.basename(decodeURIComponent(rawFilename)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = path.join(DEFAULT_BACKUPS_DIR, cleanFilename);

    if (!fs.existsSync(targetPath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: `ملف النسخة الاحتياطية غير موجود: ${cleanFilename}` }));
    }

    const stat = fs.statSync(targetPath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-cache');

    const stream = fs.createReadStream(targetPath);
    return stream.pipe(res);
  }

  // GET /api/backups - List .bctbak archives
  if (req.method === 'GET' && parsedUrl === '/api/backups') {
    try {
      const files = fs.readdirSync(DEFAULT_BACKUPS_DIR);
      const backupFiles = files.filter(f => f.endsWith('.bctbak')).map(f => {
        const fullPath = path.join(DEFAULT_BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          size: stats.size,
          size_formatted: formatBytes(stats.size),
          created_at: stats.mtime.toISOString(),
          path: fullPath
        };
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, backups: backupFiles }));
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // DELETE /api/backups/:filename
  if (req.method === 'DELETE' && parsedUrl.startsWith('/api/backups/')) {
    const rawFilename = parsedUrl.replace('/api/backups/', '');
    const cleanFilename = path.basename(decodeURIComponent(rawFilename)).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = path.join(DEFAULT_BACKUPS_DIR, cleanFilename);

    try {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, message: `تم حذف النسخة الاحتياطية بنجاح: ${cleanFilename}` }));
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // POST /api/backups/sync-state
  if (req.method === 'POST' && parsedUrl === '/api/backups/sync-state') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (payload.encryptedData) {
          fs.writeFileSync(LATEST_STATE_FILE, payload.encryptedData, 'utf8');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }));
      } catch (err: any) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  return next();
}

export function backupPlugin() {
  return {
    name: 'backup-middleware',
    configureServer(server: any) {
      server.middlewares.use(handleBackupRequest);
    }
  };
}
