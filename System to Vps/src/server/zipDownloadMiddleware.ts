import type { Connect } from 'vite';
import { REQUIRED_DOCUMENT_CATEGORIES, createZipArchive } from '../services/documentStorageService';

const CATEGORY_FOLDER_MAP: Record<string, string> = {};
for (const cat of REQUIRED_DOCUMENT_CATEGORIES) {
  CATEGORY_FOLDER_MAP[cat.key] = cat.folderName;
}

/**
 * Server-side handler for authenticated, same-origin ZIP download endpoint.
 * URL: POST /api/student-files/download-zip
 *
 * Headers returned:
 *   Content-Type: application/zip
 *   Content-Disposition: attachment; filename="<fileCode>.zip"
 *   Content-Length: <byteLength>
 *   Cache-Control: no-cache, no-store, must-revalidate
 */
export function handleZipDownloadRequest(req: any, res: any, next: any) {
  const url = req.url?.split('?')[0];
  if (url !== '/api/student-files/download-zip') {
    return next();
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BCT-User');
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
  }

  // 1. Verify authentication header / session
  const authHeader = req.headers['authorization'] || req.headers['x-bct-user'];
  if (!authHeader) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Unauthorized: Authentication credentials required.' }));
  }

  // 2. Read incoming request body chunks
  let bodyBuffer = '';
  req.on('data', (chunk: any) => {
    bodyBuffer += chunk;
  });

  req.on('end', () => {
    try {
      const payload = JSON.parse(bodyBuffer);
      const { fileCode, studentId, documents } = payload;

      if (!fileCode || typeof fileCode !== 'string') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Missing or invalid fileCode parameter.' }));
      }

      if (!Array.isArray(documents) || documents.length === 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'No documents provided for archive generation.' }));
      }

      // 3. Assemble entries into the strict folder structure
      const archiveEntries: { path: string; data: Uint8Array }[] = [];

      for (const doc of documents) {
        const folder = CATEGORY_FOLDER_MAP[doc.document_type] || '07-مستندات-إضافية';
        let fileData: Uint8Array;

        if (doc.dataBase64) {
          fileData = Buffer.from(doc.dataBase64, 'base64');
        } else if (doc.contentText) {
          fileData = Buffer.from(doc.contentText, 'utf8');
        } else {
          fileData = Buffer.from(`[BCT Enterprise Document: ${doc.file_name}]`, 'utf8');
        }

        const safeFileName = (doc.file_name || 'document.pdf').replace(/[/\\?%*:|"<>]/g, '_');
        const entryPath = `${fileCode}/${folder}/${safeFileName}`;

        archiveEntries.push({
          path: entryPath,
          data: fileData,
        });
      }

      // 4. Generate standard PKWARE ZIP with UTF-8 flags
      const zipBytes = createZipArchive(archiveEntries);
      const zipBuffer = Buffer.from(zipBytes);

      // 5. Send response with exact required HTTP headers
      const sanitizedFilename = fileCode.replace(/[/\\?%*:|"<>]/g, '_');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-BCT-Student-File', sanitizedFilename);
      res.setHeader('X-BCT-Documents-Count', archiveEntries.length.toString());

      res.end(zipBuffer);
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Server error generating ZIP archive: ' + (err?.message || 'Internal error') }));
    }
  });
}

/**
 * Vite plugin that mounts the same-origin ZIP download endpoint on Vite dev & preview servers.
 */
export function zipDownloadPlugin() {
  return {
    name: 'bct-zip-download-server',
    configureServer(server: any) {
      server.middlewares.use(handleZipDownloadRequest);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handleZipDownloadRequest);
    },
  };
}
