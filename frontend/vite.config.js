import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certPath = path.resolve(__dirname, '..', 'certs');
const keyFile = path.join(certPath, 'key.pem');
const certFile = path.join(certPath, 'cert.pem');

const httpsConfig =
  fs.existsSync(keyFile) && fs.existsSync(certFile)
    ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
    : false;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: httpsConfig,
    proxy: {
      '/admin': { target: 'http://localhost:3001', changeOrigin: true },
      '/employees': { target: 'http://localhost:3001', changeOrigin: true },
      '/webauthn': { target: 'http://localhost:3001', changeOrigin: true },
      '/attendance': { target: 'http://localhost:3001', changeOrigin: true },
      '/health': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
