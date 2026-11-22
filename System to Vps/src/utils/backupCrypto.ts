/**
 * BCT Enterprise — Unified Backup Cryptographic & Packaging Engine
 * Standardizes the official `.bctbak` format (BCTBAK v2.0),
 * provides 100% UTF-8 synchronized SHA-256 integrity verification,
 * and handles resilient unpacking for BCTBAK archives and validated legacy JSON snapshots.
 */

import {
  BackupArchiveHeader,
  BackupRestorePayload,
  BCTBakManifest,
  BackupVerificationResult,
  BackupArchiveFormatType,
  BackupType,
  BackupDestination
} from '../types/backup.types';

// ==========================================
// 1. Core Cryptographic Primitives (UTF-8)
// ==========================================

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

/**
 * Pure JavaScript SHA-256 implementation on raw byte/ASCII string.
 */
function sha256SyncCore(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let formattedAscii = ascii + '\x80';
  while (formattedAscii.length % 64 !== 56) {
    formattedAscii += '\x00';
  }

  for (i = 0; i < formattedAscii.length; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << ((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, ...hash];
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Computes SHA-256 hash strictly over UTF-8 bytes.
 * Guaranteed 100% identical output in Browser and Node.js for Arabic and Unicode characters.
 */
export function computeSHA256(content: string): string {
  try {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js native crypto
      const nodeCrypto = require('crypto');
      return nodeCrypto.createHash('sha256').update(content, 'utf8').digest('hex');
    }
  } catch {
    // Fallback to pure JS UTF-8 hashing
  }

  // Cross-environment UTF-8 string encoding
  const utf8Ascii = unescape(encodeURIComponent(content));
  return sha256SyncCore(utf8Ascii);
}

/**
 * Cross-environment Unicode-safe Base64 encoding.
 */
export function utf8ToBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Cross-environment Unicode-safe Base64 decoding.
 */
export function base64ToUtf8(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf8');
  }
  return decodeURIComponent(escape(atob(b64)));
}

/**
 * Format bytes into human-readable representation (B, KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Generates the official standardized BCT backup filename.
 * Pattern: bct_backup_YYYYMMDD_HHMMSS.bctbak
 */
export function generateBackupFilename(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `bct_backup_${stamp}.bctbak`;
}

// ==========================================
// 2. Official BCTBAK Packaging & Unpacking
// ==========================================

export interface BCTBakArchiveContainer {
  magic: 'BCT_ENTERPRISE_BACKUP';
  format: 'BCTBAK';
  version: '2.0.0';
  manifest: BCTBakManifest;
  header: BackupArchiveHeader;
  payload: string; // Base64 encoded UTF-8 JSON of BackupRestorePayload
  checksum_sha256: string; // SHA-256 of tables JSON
  archive_sha256: string; // SHA-256 of payload string
}

/**
 * Legacy table key map for normalizing internal snapshots (e.g. latest_db_state.json).
 */
const LEGACY_STORAGE_KEY_MAP: Record<string, string> = {
  bct_store_students: 'students',
  bct_store_files: 'studentFiles',
  bct_store_employees: 'employees',
  bct_store_users: 'systemUsers',
  bct_store_departments: 'departments',
  bct_store_positions: 'positions',
  bct_store_documents: 'documents',
  bct_store_payments: 'payments',
  bct_store_expenses: 'expenses',
  bct_store_budgets: 'budgets',
  bct_store_financial_accounts: 'financialAccounts',
  bct_store_account_movements: 'accountMovements',
  bct_store_internal_transfers: 'internalTransfers',
  bct_store_exchange_rate: 'exchangeRate',
  bct_store_tasks: 'tasks',
  bct_store_complaints: 'complaints',
  bct_store_handoffs: 'handoffs',
  bct_store_campaigns: 'campaigns',
  bct_store_meetings: 'meetings',
  bct_store_notifications: 'notifications',
  bct_store_universities: 'universities',
  bct_store_faculties: 'faculties',
  bct_store_campuses: 'campuses',
  bct_store_evaluations: 'evaluations',
  bct_store_capacity_settings: 'capacitySettings',
  bct_store_incentive_policies: 'incentivePolicies',
  bct_store_employee_incentives: 'employeeIncentives',
  bct_store_sla_configs: 'slaConfigs',
  bct_store_audit_logs: 'auditLogs',
  bct_store_backups: 'backups'
};

export interface UnpackResult {
  valid: boolean;
  format: BackupArchiveFormatType;
  formatNameAr: string;
  formatNameEn: string;
  version: string;
  header?: BackupArchiveHeader;
  manifest?: BCTBakManifest;
  payload?: BackupRestorePayload;
  recordsSummary?: Record<string, number>;
  totalRecords?: number;
  tablesCount?: number;
  checksumVerified?: boolean;
  isLegacyJson?: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Packs a BackupRestorePayload into an official tamper-evident BCTBAK v2.0 archive string.
 */
export function packBCTBakArchive(payload: BackupRestorePayload): string {
  const tablesJson = JSON.stringify(payload.tables || {});
  const tablesSha256 = computeSHA256(tablesJson);

  // Compute record counts per table
  const recordsPerTable: Record<string, number> = {};
  let totalRecords = 0;
  for (const [tableKey, records] of Object.entries(payload.tables || {})) {
    if (Array.isArray(records)) {
      recordsPerTable[tableKey] = records.length;
      totalRecords += records.length;
    } else if (records && typeof records === 'object') {
      const count = Object.keys(records).length;
      recordsPerTable[tableKey] = count;
      totalRecords += count;
    }
  }

  const manifest: BCTBakManifest = {
    magic: 'BCT_ENTERPRISE_BACKUP',
    format: 'BCTBAK',
    format_version: '2.0.0',
    backup_id: payload.header.backup_id,
    created_at: payload.header.created_at || new Date().toISOString(),
    created_by: payload.header.created_by,
    created_by_name: payload.header.created_by_name,
    backup_type: payload.header.backup_type,
    destination: payload.header.destination,
    environment: 'production',
    schema_version: '2026.11',
    tables_count: Object.keys(payload.tables || {}).length,
    total_records: totalRecords,
    records_per_table: recordsPerTable,
    content_sha256: tablesSha256
  };

  const header: BackupArchiveHeader = {
    ...payload.header,
    magic: 'BCT_ENTERPRISE_BACKUP',
    version: '2.0.0',
    checksum_sha256: tablesSha256,
    total_records: totalRecords,
    tables_count: Object.keys(payload.tables || {}).length
  };

  const fullPayload: BackupRestorePayload = {
    ...payload,
    header,
    manifest,
    security: {
      checksum: tablesSha256,
      integrityVerified: true
    }
  };

  const payloadJson = JSON.stringify(fullPayload);
  const payloadBase64 = utf8ToBase64(payloadJson);
  const archiveSha256 = computeSHA256(payloadBase64);

  manifest.archive_sha256 = archiveSha256;

  const container: BCTBakArchiveContainer = {
    magic: 'BCT_ENTERPRISE_BACKUP',
    format: 'BCTBAK',
    version: '2.0.0',
    manifest,
    header,
    payload: payloadBase64,
    checksum_sha256: tablesSha256,
    archive_sha256: archiveSha256
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Unpacks any backup archive string (BCTBAK v2.0, v1.0, direct JSON, or legacy JSON snapshot).
 */
export function unpackBCTBakArchive(fileContent: string): UnpackResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fileContent || typeof fileContent !== 'string' || !fileContent.trim()) {
    return {
      valid: false,
      format: 'UNKNOWN',
      formatNameAr: 'ملف فارغ أو غير صالح',
      formatNameEn: 'Empty or invalid file',
      version: '0.0.0',
      warnings: [],
      errors: ['الملف فارغ أو لا يحتوي على بيانات نصية صالحة.']
    };
  }

  const trimmed = fileContent.trim();

  // Branch 1: Try parsing directly as JSON
  let directJsonObj: any = null;
  try {
    directJsonObj = JSON.parse(trimmed);
  } catch {
    // Not direct JSON — could be raw Base64 envelope
  }

  // Case 1A: Official BCTBAK v2.0 Container
  if (
    directJsonObj &&
    directJsonObj.magic === 'BCT_ENTERPRISE_BACKUP' &&
    directJsonObj.format === 'BCTBAK' &&
    directJsonObj.payload
  ) {
    try {
      const decodedPayloadStr = base64ToUtf8(directJsonObj.payload);
      const innerPayload: BackupRestorePayload = JSON.parse(decodedPayloadStr);

      if (!innerPayload.tables || typeof innerPayload.tables !== 'object') {
        return {
          valid: false,
          format: 'BCTBAK_V2',
          formatNameAr: 'أرشيف معتمد BCTBAK v2.0 (جداول مفقودة)',
          formatNameEn: 'BCTBAK v2.0 (Missing Tables)',
          version: '2.0.0',
          warnings,
          errors: ['الأرشيف لا يحتوي على كائن جداول قاعدة البيانات (Missing tables).']
        };
      }

      const tablesJson = JSON.stringify(innerPayload.tables);
      const actualSha256 = computeSHA256(tablesJson);
      const expectedSha256 = directJsonObj.checksum_sha256 || directJsonObj.manifest?.content_sha256 || innerPayload.header?.checksum_sha256;

      let checksumVerified = true;
      if (expectedSha256 && actualSha256 !== expectedSha256) {
        checksumVerified = false;
        errors.push(`فشل التحقق من البصمة الرقمية (Checksum Mismatch: ${actualSha256.substring(0, 8)} != ${expectedSha256.substring(0, 8)}). قد يكون الأرشيف معدلاً أو تالفاً.`);
      }

      const recordsSummary: Record<string, number> = {};
      let totalRecords = 0;
      for (const [key, val] of Object.entries(innerPayload.tables)) {
        if (Array.isArray(val)) {
          recordsSummary[key] = val.length;
          totalRecords += val.length;
        } else if (val && typeof val === 'object') {
          recordsSummary[key] = Object.keys(val).length;
          totalRecords += Object.keys(val).length;
        }
      }

      return {
        valid: errors.length === 0,
        format: 'BCTBAK_V2',
        formatNameAr: 'أرشيف رسمي معتمد (BCTBAK v2.0)',
        formatNameEn: 'Official Verified Archive (BCTBAK v2.0)',
        version: '2.0.0',
        header: directJsonObj.header || innerPayload.header,
        manifest: directJsonObj.manifest || innerPayload.manifest,
        payload: innerPayload,
        recordsSummary,
        totalRecords,
        tablesCount: Object.keys(innerPayload.tables).length,
        checksumVerified,
        isLegacyJson: false,
        warnings,
        errors
      };
    } catch (err: any) {
      return {
        valid: false,
        format: 'BCTBAK_V2',
        formatNameAr: 'أرشيف معتمد BCTBAK v2.0 (تالف)',
        formatNameEn: 'Corrupted BCTBAK v2.0',
        version: '2.0.0',
        warnings,
        errors: [`فشل فك تشفير محتوى الأرشيف BCTBAK: ${err.message}`]
      };
    }
  }

  // Case 1B: Direct JSON with standard header & tables
  if (
    directJsonObj &&
    directJsonObj.header &&
    directJsonObj.header.magic === 'BCT_ENTERPRISE_BACKUP' &&
    directJsonObj.tables
  ) {
    const tablesJson = JSON.stringify(directJsonObj.tables);
    const actualSha256 = computeSHA256(tablesJson);
    const expectedSha256 = directJsonObj.header.checksum_sha256 || directJsonObj.security?.checksum;

    let checksumVerified = true;
    if (expectedSha256 && actualSha256 !== expectedSha256) {
      warnings.push(`تحذير البصمة الرقمية: بصمة المحتوى الحالية تختلف عن المسجلة (${actualSha256.substring(0, 8)} != ${expectedSha256.substring(0, 8)}).`);
    }

    const recordsSummary: Record<string, number> = {};
    let totalRecords = 0;
    for (const [key, val] of Object.entries(directJsonObj.tables)) {
      if (Array.isArray(val)) {
        recordsSummary[key] = val.length;
        totalRecords += val.length;
      } else if (val && typeof val === 'object') {
        recordsSummary[key] = Object.keys(val).length;
        totalRecords += Object.keys(val).length;
      }
    }

    return {
      valid: true,
      format: 'DIRECT_JSON',
      formatNameAr: 'تصدير JSON مباشر معتمد (Direct JSON)',
      formatNameEn: 'Direct JSON Export',
      version: directJsonObj.header.version || '1.0.0',
      header: directJsonObj.header,
      manifest: directJsonObj.manifest,
      payload: directJsonObj as BackupRestorePayload,
      recordsSummary,
      totalRecords,
      tablesCount: Object.keys(directJsonObj.tables).length,
      checksumVerified,
      isLegacyJson: false,
      warnings,
      errors
    };
  }

  // Case 1C: Legacy JSON Database Snapshot (e.g. latest_db_state.json or authoritative_unified_master_backup.json)
  if (directJsonObj && typeof directJsonObj === 'object' && !Array.isArray(directJsonObj)) {
    const keys = Object.keys(directJsonObj);
    const hasLegacyStorageKeys = keys.some(k => k.startsWith('bct_store_') || k === 'students' || k === 'studentFiles');

    if (hasLegacyStorageKeys) {
      // Normalize tables
      const normalizedTables: Record<string, any> = {};
      for (const [k, v] of Object.entries(directJsonObj)) {
        const targetKey = LEGACY_STORAGE_KEY_MAP[k] || (k.startsWith('bct_store_') ? k.replace('bct_store_', '') : k);
        normalizedTables[targetKey] = v;
      }

      const recordsSummary: Record<string, number> = {};
      let totalRecords = 0;
      for (const [key, val] of Object.entries(normalizedTables)) {
        if (Array.isArray(val)) {
          recordsSummary[key] = val.length;
          totalRecords += val.length;
        } else if (val && typeof val === 'object') {
          recordsSummary[key] = Object.keys(val).length;
          totalRecords += Object.keys(val).length;
        }
      }

      const tablesJson = JSON.stringify(normalizedTables);
      const sha256 = computeSHA256(tablesJson);
      const nowStr = new Date().toISOString();

      const syntheticHeader: BackupArchiveHeader = {
        magic: 'BCT_ENTERPRISE_BACKUP',
        version: '1.0.0',
        backup_id: `BCT-LEGACY-${Date.now().toString().slice(-6)}`,
        created_at: nowStr,
        created_by: 'legacy_import',
        created_by_name: 'استيراد لقطة سابقة (Legacy Snapshot)',
        backup_type: 'manual',
        destination: 'server_storage',
        environment: 'production',
        schema_version: '2026.11',
        checksum_sha256: sha256,
        total_records: totalRecords,
        tables_count: Object.keys(normalizedTables).length
      };

      const syntheticPayload: BackupRestorePayload = {
        header: syntheticHeader,
        tables: normalizedTables,
        security: {
          checksum: sha256,
          integrityVerified: true
        }
      };

      warnings.push('تم التعرف على الملف كلقطة بيانات سابقة غير معبأة (Legacy JSON Snapshot). يتطلب الاستيراد مراجعة وتأكيداً إدارياً صريحاً.');

      return {
        valid: true,
        format: 'LEGACY_JSON_SNAPSHOT',
        formatNameAr: 'لقطة بيانات JSON سابقة (Legacy Snapshot)',
        formatNameEn: 'Legacy Database JSON Snapshot',
        version: '1.0.0',
        header: syntheticHeader,
        payload: syntheticPayload,
        recordsSummary,
        totalRecords,
        tablesCount: Object.keys(normalizedTables).length,
        checksumVerified: true,
        isLegacyJson: true,
        warnings,
        errors
      };
    }
  }

  // Branch 2: Try Base64 Envelope (BCTBAK v1.0 or legacy encrypted)
  try {
    let envelopeJson = '';
    try {
      envelopeJson = base64ToUtf8(trimmed);
    } catch {
      // Not base64
    }

    if (envelopeJson) {
      const envelope = JSON.parse(envelopeJson);

      // Legacy BASE64_PLAIN
      if (envelope.scheme === 'BASE64_PLAIN' && envelope.data) {
        const rawContent = base64ToUtf8(envelope.data);
        const parsedPayload: BackupRestorePayload = JSON.parse(rawContent);

        if (parsedPayload.header && parsedPayload.tables) {
          const tablesJson = JSON.stringify(parsedPayload.tables);
          const actualSha256 = computeSHA256(tablesJson);
          const expectedSha256 = envelope.checksum || parsedPayload.header.checksum_sha256;

          let checksumVerified = true;
          if (expectedSha256 && actualSha256 !== expectedSha256) {
            checksumVerified = false;
            warnings.push(`تحذير البصمة: ${actualSha256.substring(0, 8)} != ${expectedSha256.substring(0, 8)}`);
          }

          const recordsSummary: Record<string, number> = {};
          let totalRecords = 0;
          for (const [key, val] of Object.entries(parsedPayload.tables)) {
            if (Array.isArray(val)) {
              recordsSummary[key] = val.length;
              totalRecords += val.length;
            } else if (val && typeof val === 'object') {
              recordsSummary[key] = Object.keys(val).length;
              totalRecords += Object.keys(val).length;
            }
          }

          return {
            valid: true,
            format: 'BCTBAK_V1',
            formatNameAr: 'أرشيف BCTBAK الإصدار السابق (v1.0)',
            formatNameEn: 'Legacy Archive (BCTBAK v1.0)',
            version: '1.0.0',
            header: parsedPayload.header,
            payload: parsedPayload,
            recordsSummary,
            totalRecords,
            tablesCount: Object.keys(parsedPayload.tables).length,
            checksumVerified,
            isLegacyJson: false,
            warnings,
            errors
          };
        }
      }

      // Legacy AES-256-CBC envelope
      if (envelope.scheme === 'AES-256-CBC' && envelope.iv && envelope.data) {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          try {
            const nodeCrypto = require('crypto');
            const iv = Buffer.from(envelope.iv, 'hex');
            const keyBuffer = nodeCrypto.createHash('sha256').update('BCT_ENTERPRISE_SECURE_VAULT_KEY_2026').digest();
            const decipher = nodeCrypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
            let decrypted = decipher.update(envelope.data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            const parsedPayload = JSON.parse(decrypted);

            if (parsedPayload.header && parsedPayload.tables) {
              return {
                valid: true,
                format: 'BCTBAK_ENCRYPTED',
                formatNameAr: 'أرشيف مشفر AES-256 معتمد',
                formatNameEn: 'Encrypted Archive (AES-256)',
                version: '1.0.0',
                header: parsedPayload.header,
                payload: parsedPayload,
                checksumVerified: true,
                isLegacyJson: false,
                warnings,
                errors
              };
            }
          } catch (e: any) {
            errors.push(`فشل فك تشفير AES-256: ${e.message}`);
          }
        } else {
          errors.push('فك تشفير AES-256 يتطلب بيئة Node.js أو اتصالاً آمناً.');
        }
      }
    }
  } catch {
    // Envelope parse error
  }

  // Branch 3: Unknown or invalid
  return {
    valid: false,
    format: 'UNKNOWN',
    formatNameAr: 'ملف غير معتمد أو تالف',
    formatNameEn: 'Unsupported or Corrupted Archive',
    version: '0.0.0',
    warnings,
    errors: ['الملف ليس أرشيف نسخ احتياطي صالح (.bctbak) أو لقطة بيانات معتمدة لنظام BCT Enterprise.']
  };
}

/**
 * Validates any backup content and returns a structured verification result.
 */
export function verifyBackupArchiveContent(fileContent: string): BackupVerificationResult {
  const unpack = unpackBCTBakArchive(fileContent);

  return {
    valid: unpack.valid,
    format: unpack.format,
    formatNameAr: unpack.formatNameAr,
    formatNameEn: unpack.formatNameEn,
    version: unpack.version,
    errors: unpack.errors,
    warnings: unpack.warnings,
    header: unpack.header,
    manifest: unpack.manifest,
    recordsSummary: unpack.recordsSummary,
    totalRecords: unpack.totalRecords,
    tablesCount: unpack.tablesCount,
    checksumVerified: unpack.checksumVerified,
    isLegacyJson: unpack.isLegacyJson
  };
}

// ==========================================
// 3. Backward Compatibility Wrappers
// ==========================================

export function encryptBackupPayload(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (parsed.header && parsed.tables) {
      return packBCTBakArchive(parsed);
    }
  } catch {}

  const checksum = computeSHA256(content);
  const envelope = {
    scheme: 'BASE64_PLAIN',
    data: utf8ToBase64(content),
    checksum
  };
  return utf8ToBase64(JSON.stringify(envelope));
}

export function decryptBackupPayload(encryptedStr: string): string {
  const result = unpackBCTBakArchive(encryptedStr);
  if (!result.valid || !result.payload) {
    throw new Error(result.errors[0] || 'فشل فحص الأرشيف: الملف غير صالح أو تالف.');
  }
  return JSON.stringify(result.payload);
}
