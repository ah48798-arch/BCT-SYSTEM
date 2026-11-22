import { StudentDocument } from '../types/database.types';

export interface DocumentCategoryDefinition {
  key: string;
  order: number;
  folderName: string;
  titleAr: string;
  titleEn: string;
  defaultVerificationStatus: 'مستوفى وموثق' | 'مستوفى' | 'مؤكد مع المالية';
  allowedFormats: string[];
  maxSizeBytes: number;
}

export const REQUIRED_DOCUMENT_CATEGORIES: DocumentCategoryDefinition[] = [
  {
    key: 'passport',
    order: 1,
    folderName: '01-جواز-السفر',
    titleAr: 'جواز سفر ساري المفعول (لا تقل صلاحيته عن 6 أشهر) أو الكرت الأصفر',
    titleEn: 'Valid Passport (min. 6 months validity) or Yellow Card',
    defaultVerificationStatus: 'مستوفى وموثق',
    allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 15 * 1024 * 1024,
  },
  {
    key: 'recency_stamp',
    order: 2,
    folderName: '02-ختم-الحداثة',
    titleAr: 'ختم الحداثة (الدفعتين 2023 و2024)',
    titleEn: 'Recency Stamp (2023 & 2024 cohorts)',
    defaultVerificationStatus: 'مستوفى',
    allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 15 * 1024 * 1024,
  },
  {
    key: 'personal_photos',
    order: 3,
    folderName: '03-الصور-الشخصية',
    titleAr: 'الصور الشخصية للطالب (خلفية بيضاء)',
    titleEn: 'Personal Passport Photos (White Background)',
    defaultVerificationStatus: 'مستوفى',
    allowedFormats: ['.jpg', '.jpeg', '.png'],
    maxSizeBytes: 10 * 1024 * 1024,
  },
  {
    key: 'high_school',
    order: 4,
    folderName: '04-الشهادة-الثانوية-وكشف-الدرجات',
    titleAr: 'شهادة الثانوية العامة / كشف الدرجات الأصلي',
    titleEn: 'General Secondary Certificate / Original Transcript',
    defaultVerificationStatus: 'مستوفى وموثق',
    allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 15 * 1024 * 1024,
  },
  {
    key: 'birth_cert',
    order: 5,
    folderName: '05-شهادة-الميلاد-او-الرقم-الوطني',
    titleAr: 'شهادة الميلاد أو الرقم الوطني',
    titleEn: 'Birth Certificate or National ID',
    defaultVerificationStatus: 'مستوفى',
    allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 15 * 1024 * 1024,
  },
  {
    key: 'registration_fee',
    order: 6,
    folderName: '06-إيصال-سداد-رسوم-فتح-الملف',
    titleAr: 'إيصال سداد رسوم فتح الملف',
    titleEn: 'File Opening Fee Receipt',
    defaultVerificationStatus: 'مؤكد مع المالية',
    allowedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeBytes: 15 * 1024 * 1024,
  },
];

// In-Memory cache fallback for node tests and environments without IndexedDB
const memoryBlobStorage = new Map<string, Uint8Array>();

const DB_NAME = 'bct_enterprise_doc_store';
const STORE_NAME = 'blobs';
let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIDBDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e: any) => resolve(e.target.result as IDBDatabase);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function saveDocumentBlob(storagePath: string, data: Uint8Array | ArrayBuffer | Blob): Promise<void> {
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) {
    bytes = data;
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else {
    bytes = new Uint8Array(await data.arrayBuffer());
  }

  // Always keep in memory store
  memoryBlobStorage.set(storagePath, bytes);

  const db = await getIDBDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(bytes, storagePath);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getDocumentBlob(storagePath: string): Promise<Uint8Array | null> {
  if (memoryBlobStorage.has(storagePath)) {
    return memoryBlobStorage.get(storagePath)!;
  }

  const db = await getIDBDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(storagePath);
      req.onsuccess = () => {
        const result = req.result;
        if (result instanceof Uint8Array) {
          memoryBlobStorage.set(storagePath, result);
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          const u = new Uint8Array(result);
          memoryBlobStorage.set(storagePath, u);
          resolve(u);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteDocumentBlob(storagePath: string): Promise<void> {
  memoryBlobStorage.delete(storagePath);

  const db = await getIDBDatabase();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(storagePath);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// CRC32 table for ZIP checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

export function calculateCRC32(data: Uint8Array): number {
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

/**
 * Creates a standard PKWARE ZIP archive using Store (method 0) with UTF-8 filename encoding (bit 11: 0x0800).
 * Natively readable by Windows Explorer, macOS Archive Utility, Linux, and all standard ZIP archivers.
 */
export function createZipArchive(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let currentOffset = 0;
  const encoder = new TextEncoder();
  const { dosDate, dosTime } = getDosDateTime();

  for (const file of files) {
    const filenameBytes = encoder.encode(file.path);
    const fileData = file.data;
    const crc = calculateCRC32(fileData);
    const uncompressedSize = fileData.length;
    const compressedSize = fileData.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const lView = new DataView(localHeader.buffer);
    lView.setUint32(0, 0x04034b50, true); // PK\x03\x04
    lView.setUint16(4, 20, true); // version 2.0
    lView.setUint16(6, 0x0800, true); // UTF-8 filename encoding
    lView.setUint16(8, 0, true); // compression 0 (store)
    lView.setUint16(10, dosTime, true);
    lView.setUint16(12, dosDate, true);
    lView.setUint32(14, crc, true);
    lView.setUint32(18, compressedSize, true);
    lView.setUint32(22, uncompressedSize, true);
    lView.setUint16(26, filenameBytes.length, true);
    lView.setUint16(28, 0, true); // extra length
    localHeader.set(filenameBytes, 30);

    localHeaders.push(localHeader);
    localHeaders.push(fileData);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const cView = new DataView(centralHeader.buffer);
    cView.setUint32(0, 0x02014b50, true); // PK\x01\x02
    cView.setUint16(4, 0x0314, true); // version made by
    cView.setUint16(6, 20, true); // version needed
    cView.setUint16(8, 0x0800, true); // UTF-8 encoding
    cView.setUint16(10, 0, true); // compression 0
    cView.setUint16(12, dosTime, true);
    cView.setUint16(14, dosDate, true);
    cView.setUint32(16, crc, true);
    cView.setUint32(20, compressedSize, true);
    cView.setUint32(24, uncompressedSize, true);
    cView.setUint16(28, filenameBytes.length, true);
    cView.setUint16(30, 0, true); // extra field
    cView.setUint16(32, 0, true); // comment length
    cView.setUint16(34, 0, true); // disk start
    cView.setUint16(36, 0, true); // internal attrs
    cView.setUint32(38, 0x81a40000, true); // regular file permissions
    cView.setUint32(42, currentOffset, true); // local header offset
    centralHeader.set(filenameBytes, 46);

    centralHeaders.push(centralHeader);
    currentOffset += localHeader.length + fileData.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true); // PK\x05\x06
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

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || !window.document) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    } catch {
      // safe cleanup fallback
    }
  }, 2000);
}

/**
 * Requests the server to build and return the authenticated ZIP archive from the same origin.
 * Sets Content-Type: application/zip, Content-Disposition: attachment; filename="<fileCode>.zip"
 */
export async function downloadStudentDossierZipFromServer(
  fileCode: string,
  studentId: string,
  documents: StudentDocument[],
  token?: string,
  username?: string
): Promise<{ success: boolean; filename: string; fileCount: number }> {
  // 1. Prepare base64 document payloads
  const docPayloads = await Promise.all(
    documents.map(async (doc) => {
      let bytes = await getDocumentBlob(doc.file_storage_path);
      if (!bytes) {
        const encoder = new TextEncoder();
        bytes = encoder.encode(`[BCT Enterprise Document: ${doc.title} - ${doc.file_name}]`);
      }
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const dataBase64 = btoa(binary);

      return {
        id: doc.id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_size_bytes: doc.file_size_bytes || bytes.length,
        dataBase64
      };
    })
  );

  // 2. Call authenticated same-origin endpoint
  const response = await fetch('/api/student-files/download-zip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : 'BCT-Session',
      'X-BCT-User': username || 'system'
    },
    body: JSON.stringify({
      fileCode,
      studentId,
      documents: docPayloads
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server download error (${response.status}): ${errorText}`);
  }

  // 3. Read Content-Disposition attachment filename if present
  let resolvedFilename = `${fileCode}.zip`;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      resolvedFilename = match[1];
    }
  }

  // 4. Receive authenticated blob and trigger single clean download
  const blob = await response.blob();
  downloadBlob(blob, resolvedFilename);

  return {
    success: true,
    filename: resolvedFilename,
    fileCount: documents.length
  };
}

export async function downloadSingleDocument(doc: StudentDocument): Promise<void> {
  let bytes = await getDocumentBlob(doc.file_storage_path);
  if (!bytes) {
    // Generate minimal fallback content if missing from raw storage
    const encoder = new TextEncoder();
    bytes = encoder.encode(`[BCT Enterprise Document Record: ${doc.title} - ${doc.file_name}]`);
  }
  const blob = new Blob([bytes as any], { type: doc.mime_type || 'application/octet-stream' });
  downloadBlob(blob, doc.file_name);
}

/**
 * Builds and downloads a structured ZIP dossier for the specified student file code.
 * Structure:
 * <FileCode>/
 *   01-جواز-السفر/
 *   02-ختم-الحداثة/
 *   03-الصور-الشخصية/
 *   04-الشهادة-الثانوية-وكشف-الدرجات/
 *   05-شهادة-الميلاد-او-الرقم-الوطني/
 *   06-إيصال-سداد-رسوم-فتح-الملف/
 */
export async function generateStudentDossierZip(
  fileCode: string,
  documents: StudentDocument[]
): Promise<{ blob: Blob; filename: string; fileCount: number }> {
  const categoryFolderMap: Record<string, string> = {};
  for (const cat of REQUIRED_DOCUMENT_CATEGORIES) {
    categoryFolderMap[cat.key] = cat.folderName;
  }

  const archiveEntries: { path: string; data: Uint8Array }[] = [];

  for (const doc of documents) {
    const folder = categoryFolderMap[doc.document_type] || '07-مستندات-إضافية';
    let bytes = await getDocumentBlob(doc.file_storage_path);
    if (!bytes) {
      const encoder = new TextEncoder();
      bytes = encoder.encode(`[BCT Enterprise Stored Document: ${doc.title} - ${doc.file_name}]`);
    }

    const archiveFilePath = `${fileCode}/${folder}/${doc.file_name}`;
    archiveEntries.push({
      path: archiveFilePath,
      data: bytes,
    });
  }

  const zipBytes = createZipArchive(archiveEntries);
  const blob = new Blob([zipBytes as any], { type: 'application/zip' });
  const filename = `${fileCode}.zip`;

  return {
    blob,
    filename,
    fileCount: archiveEntries.length,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDocumentDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}
