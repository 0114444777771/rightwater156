// vite.config.js (النسخة النهائية والنظيفة)

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// هذا هو ملف الإعدادات الموصى به لعملية الـ deploy
export default defineConfig({
  plugins: [react()],
  
  // 🔥🔥 هذا هو أهم جزء لحل مشكلة الصفحة البيضاء 🔥🔥
  // يضمن أن الكود النهائي لا يحتوي على حروف عربية قد تسبب أخطاء.
  build: {
    esbuild: {
      charset: 'ascii',
    },
  },
  
  // إعدادات المسارات المختصرة (alias)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // إعدادات السيرفر المحلي (للتطوير)
  server: {
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
});
