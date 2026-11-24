import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { zipDownloadPlugin } from './src/server/zipDownloadMiddleware';
import { agentPlugin } from './src/server/agentMiddleware';
import { backupPlugin } from './src/server/backupMiddleware';
import { databasePlugin } from './src/server/databaseMiddleware';

const certPath = path.resolve(__dirname, './certs/cert.pem');
const keyPath = path.resolve(__dirname, './certs/key.pem');
const hasSslCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

// SECURITY: the Vite dev/preview middlewares (database, backups, local agent) have
// no authentication, so they listen on this machine only by default.
// Set VITE_DEV_HOST=0.0.0.0 explicitly if you really need LAN access for testing.
const devHost = process.env.VITE_DEV_HOST || '127.0.0.1';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    databasePlugin(),
    backupPlugin(),
    zipDownloadPlugin(),
    agentPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: devHost,
    https: hasSslCert ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : undefined
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: devHost,
    https: hasSslCert ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : undefined
  }
});
