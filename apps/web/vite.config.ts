import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // G-03 PWA (plan 7.5: vite-plugin-pwa): dùng offline sau lần tải đầu — app shell, font và toàn
    // bộ content JSON được precache; bản build mới tự cập nhật ở lần mở sau.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/*.svg'],
      manifest: {
        name: 'Học Thai cùng Nôm',
        short_name: 'Nôm',
        description: 'Học tiếng Thái cho người Việt: bài học, bài tập, trò chơi.',
        lang: 'vi',
        start_url: '/',
        display: 'standalone',
        background_color: '#fffbf5',
        theme_color: '#3f4aa8',
        icons: [
          { src: '/brand/logo-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,json}'],
        // Content tải theo `?v=<hash>` (content-client) — khớp với bản precache cùng đường dẫn.
        ignoreURLParametersMatching: [/^v$/],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
