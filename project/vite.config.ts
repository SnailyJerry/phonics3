import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许外部访问，便于手机测试
    port: 5173,
    https: {
      key: './certs/key.pem',
      cert: './certs/cert.pem'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // 确保Service Worker文件名不被hash化
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'sw.js') {
            return 'sw.js';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // PWA相关配置
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});
