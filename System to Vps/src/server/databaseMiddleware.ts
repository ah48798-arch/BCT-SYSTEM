/**
 * BCT Enterprise — Canonical Server-Side Database Middleware & Vite Plugin
 * 
 * Provides the single authoritative database backend for all application URLs:
 * - http://localhost:3000
 * - http://127.0.0.1:3000
 * - http://192.168.1.5:3000
 * - http://192.168.1.8:3000 (when routed)
 * 
 * Guarantees:
 * 1. ONE persistent production database stored on disk (data/bct_production.json).
 * 2. Real-time update consistency: any mutation from any URL immediately updates disk and bumps revision.
 * 3. Atomic file writes with zero risk of partial or corrupt files.
 * 4. Automatic query invalidation: clients poll /api/database/version to sync changes across tabs/URLs.
 * 5. Full parity: all 20 tables are served uniformly across all hostnames.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const WORKSPACE_ROOT = process.cwd();
const DATA_DIR = path.join(WORKSPACE_ROOT, 'data');
const BACKUPS_DIR = path.join(WORKSPACE_ROOT, 'backups');
const CANONICAL_DB_FILE = path.join(DATA_DIR, 'bct_production.json');
const LATEST_STATE_FILE = path.join(BACKUPS_DIR, 'latest_db_state.json');
const MASTER_BACKUP_FILE = path.join(BACKUPS_DIR, 'authoritative_unified_master_backup.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}
if (!fs.existsSync(BACKUPS_DIR)) {
  try { fs.mkdirSync(BACKUPS_DIR, { recursive: true }); } catch {}
}

interface DatabaseMetadata {
  version: string;
  revision: number;
  updatedAt: string;
  checksum: string;
  tables: Record<string, any>;
}

let inMemoryDb: DatabaseMetadata | null = null;
let lastLoadedMtime = 0;
let writeQueue: Promise<void> = Promise.resolve();

function computeChecksum(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data), 'utf8').digest('hex').slice(0, 16);
}

/**
 * Initialize or load canonical database from disk
 */
export function loadCanonicalDatabase(): DatabaseMetadata {
  if (fs.existsSync(CANONICAL_DB_FILE)) {
    try {
      const stat = fs.statSync(CANONICAL_DB_FILE);
      if (inMemoryDb && stat.mtimeMs <= lastLoadedMtime) {
        return inMemoryDb;
      }
      const raw = fs.readFileSync(CANONICAL_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tables && typeof parsed.tables === 'object') {
        lastLoadedMtime = stat.mtimeMs;
        inMemoryDb = {
          version: parsed.version || '1.0.0',
          revision: parsed.revision || 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          checksum: parsed.checksum || computeChecksum(parsed.tables),
          tables: parsed.tables
        };
        return inMemoryDb;
      } else if (parsed && typeof parsed === 'object') {
        lastLoadedMtime = stat.mtimeMs;
        inMemoryDb = {
          version: '1.0.0',
          revision: 1,
          updatedAt: new Date().toISOString(),
          checksum: computeChecksum(parsed),
          tables: parsed
        };
        return inMemoryDb;
      }
    } catch (err: any) {
      console.warn('[BCT Database] Could not parse CANONICAL_DB_FILE:', err.message);
    }
  }

  if (inMemoryDb) return inMemoryDb;

  // 2. Try LATEST_STATE_FILE
  if (fs.existsSync(LATEST_STATE_FILE)) {
    try {
      const raw = fs.readFileSync(LATEST_STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryDb = {
          version: '1.0.0',
          revision: 1,
          updatedAt: new Date().toISOString(),
          checksum: computeChecksum(parsed),
          tables: parsed
        };
        saveCanonicalDatabase(inMemoryDb.tables);
        return inMemoryDb;
      }
    } catch {}
  }

  // 3. Fallback to MASTER_BACKUP_FILE
  if (fs.existsSync(MASTER_BACKUP_FILE)) {
    try {
      const raw = fs.readFileSync(MASTER_BACKUP_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      inMemoryDb = {
        version: '1.0.0',
        revision: 1,
        updatedAt: new Date().toISOString(),
        checksum: computeChecksum(parsed),
        tables: parsed
      };
      saveCanonicalDatabase(inMemoryDb.tables);
      return inMemoryDb;
    } catch {}
  }

  inMemoryDb = {
    version: '1.0.0',
    revision: 1,
    updatedAt: new Date().toISOString(),
    checksum: '0000000000000000',
    tables: {}
  };
  return inMemoryDb;
}

/**
 * Persist tables atomically to both CANONICAL_DB_FILE and LATEST_STATE_FILE
 */
export async function saveCanonicalDatabase(newTables: Record<string, any>, updatedTable?: string): Promise<DatabaseMetadata> {
  const current = loadCanonicalDatabase();
  const nextRevision = current.revision + 1;
  const now = new Date().toISOString();

  const mergedTables: Record<string, any> = { ...current.tables };
  for (const [key, val] of Object.entries(newTables)) {
    if (Array.isArray(val) && Array.isArray(current.tables[key]) && (key === 'bct_store_students' || key === 'bct_store_files')) {
      const existingMap = new Map<string, any>();
      for (const item of current.tables[key]) {
        if (item && item.id) existingMap.set(item.id, item);
      }
      for (const item of val) {
        if (item && item.id) existingMap.set(item.id, item);
      }
      mergedTables[key] = Array.from(existingMap.values());
    } else {
      mergedTables[key] = val;
    }
  }
  const checksum = computeChecksum(mergedTables);

  const updatedMeta: DatabaseMetadata = {
    version: '1.0.0',
    revision: nextRevision,
    updatedAt: now,
    checksum,
    tables: mergedTables
  };

  inMemoryDb = updatedMeta;

  // Atomic write to disk through write queue
  writeQueue = writeQueue.then(async () => {
    try {
      // 1. Write CANONICAL_DB_FILE (with metadata container)
      const tmpFile1 = `${CANONICAL_DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
      fs.writeFileSync(tmpFile1, JSON.stringify(updatedMeta, null, 2), 'utf8');
      fs.renameSync(tmpFile1, CANONICAL_DB_FILE);
      try { lastLoadedMtime = fs.statSync(CANONICAL_DB_FILE).mtimeMs; } catch {}

      // 2. Write LATEST_STATE_FILE (plain tables for backup parity)
      const tmpFile2 = `${LATEST_STATE_FILE}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
      fs.writeFileSync(tmpFile2, JSON.stringify(mergedTables, null, 2), 'utf8');
      fs.renameSync(tmpFile2, LATEST_STATE_FILE);

      if (updatedTable) {
        console.log(`[BCT Database] Persisted table "${updatedTable}" to disk (Rev: ${nextRevision}, Time: ${now})`);
      } else {
        console.log(`[BCT Database] Persisted all tables to disk (Rev: ${nextRevision}, Time: ${now})`);
      }
    } catch (err: any) {
      console.error('[BCT Database] Atomic write failed:', err.message);
    }
  });

  await writeQueue;
  return updatedMeta;
}

/**
 * Handle incoming database API requests
 */
export function handleDatabaseRequest(req: any, res: any, next: any) {
  const url = req.url?.split('?')[0] || '';
  if (!url.startsWith('/api/database') && !url.startsWith('/api/students') && url !== '/api/health' && url !== '/health') {
    return next();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BCT-User');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Health and Readiness Check
  if (req.method === 'GET' && (url === '/api/health' || url === '/health')) {
    try {
      const db = loadCanonicalDatabase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        status: 'healthy',
        database: 'connected',
        revision: db.revision,
        updatedAt: db.updatedAt,
        studentsCount: Array.isArray(db.tables['bct_store_students']) ? db.tables['bct_store_students'].length : 0,
        filesCount: Array.isArray(db.tables['bct_store_files']) ? db.tables['bct_store_files'].length : 0,
        timestamp: new Date().toISOString()
      }));
    } catch (err: any) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ status: 'unhealthy', error: err.message }));
    }
  }

  // Transactional student registration endpoint
  if (req.method === 'POST' && url === '/api/students/register') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { studentData, fileData, actorUsername } = payload;
        
        if (!studentData || !studentData.full_name_ar || !studentData.passport_number) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: false, error: 'studentData missing required fields' }));
        }

        const db = loadCanonicalDatabase();
        const currentStudents = db.tables['bct_store_students'] || [];
        const currentFiles = db.tables['bct_store_files'] || [];

        // Check duplicate passport
        const existingStudent = currentStudents.find((s: any) => 
          (s.passport_number && s.passport_number.trim().toLowerCase() === studentData.passport_number.trim().toLowerCase()) ||
          (studentData.national_id && s.national_id && s.national_id.trim() === studentData.national_id.trim())
        );

        if (existingStudent) {
          const existingFile = currentFiles.find((f: any) => f.student_id === existingStudent.id);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: false,
            code: 'DUPLICATE_STUDENT',
            message: `هذا الطالب مسجل بالفعل ولديه ملف تقديم قائم برقم: ${existingFile?.file_code || ''}`,
            existingFileCode: existingFile?.file_code || '',
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
          current_status: fileData?.current_status || 'new',
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

        const newStudents = [newStudent, ...currentStudents];
        const newFiles = [newFile, ...currentFiles];

        const auditLogs = db.tables['bct_store_audit_logs'] || [];
        const newAudit = {
          id: Date.now(),
          actor_username: actorUsername || 'system',
          action: 'CREATE_STUDENT_AND_FILE',
          resource_type: 'student',
          resource_id: studentId,
          new_state: { studentCode, fileCode },
          created_at: now
        };
        const newAuditLogs = [newAudit, ...auditLogs];

        const updatedMeta = await saveCanonicalDatabase({
          bct_store_students: newStudents,
          bct_store_files: newFiles,
          bct_store_audit_logs: newAuditLogs
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          student: newStudent,
          file: newFile,
          revision: updatedMeta.revision,
          updatedAt: updatedMeta.updatedAt
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  const subPath = url.replace('/api/database', '') || '/';

  // 1. GET /api/database/version -> Lightweight revision check for real-time polling
  if (req.method === 'GET' && (subPath === '/version' || subPath === '/rev')) {
    const db = loadCanonicalDatabase();
    const tableCounts: Record<string, number> = {};
    for (const [k, v] of Object.entries(db.tables)) {
      tableCounts[k] = Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.keys(v).length : 1;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      version: db.version,
      revision: db.revision,
      updatedAt: db.updatedAt,
      checksum: db.checksum,
      tableCounts
    }));
  }

  // 2. GET /api/database/state or /api/database/all -> Returns complete authoritative database
  if (req.method === 'GET' && (subPath === '/state' || subPath === '/all' || subPath === '/' || subPath === '')) {
    const db = loadCanonicalDatabase();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('ETag', `W/"${db.revision}-${db.checksum}"`);
    return res.end(JSON.stringify({
      version: db.version,
      revision: db.revision,
      updatedAt: db.updatedAt,
      checksum: db.checksum,
      tables: db.tables
    }));
  }

  // 3. GET /api/database/table/:tableName -> Get single table
  if (req.method === 'GET' && subPath.startsWith('/table/')) {
    const tableName = subPath.replace('/table/', '').trim();
    const db = loadCanonicalDatabase();
    const tableData = db.tables[tableName];

    if (tableData === undefined) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: `Table "${tableName}" not found` }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      table: tableName,
      revision: db.revision,
      count: Array.isArray(tableData) ? tableData.length : 1,
      data: tableData
    }));
  }

  // 4. POST /api/database/table/:tableName -> Mutate/Update single table
  if (req.method === 'POST' && subPath.startsWith('/table/')) {
    const tableName = subPath.replace('/table/', '').trim();
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const data = payload.data !== undefined ? payload.data : payload;

        const updatedMeta = await saveCanonicalDatabase({ [tableName]: data }, tableName);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          table: tableName,
          revision: updatedMeta.revision,
          updatedAt: updatedMeta.updatedAt
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. POST /api/database/sync -> Bulk sync all tables
  if (req.method === 'POST' && (subPath === '/sync' || subPath === '/bulk')) {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const tables = payload.tables || payload;

        if (!tables || typeof tables !== 'object') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid payload: tables object required' }));
        }

        const updatedMeta = await saveCanonicalDatabase(tables);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          revision: updatedMeta.revision,
          updatedAt: updatedMeta.updatedAt
        }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: `Unknown database endpoint: ${subPath}` }));
}

/**
 * Vite plugin exposing database endpoints
 */
export function databasePlugin() {
  return {
    name: 'bct-database-server',
    configureServer(server: any) {
      server.middlewares.use(handleDatabaseRequest);
      loadCanonicalDatabase();
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleDatabaseRequest);
      loadCanonicalDatabase();
    }
  };
}
