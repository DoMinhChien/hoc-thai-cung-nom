import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const AUTH_EMULATOR_PORT = 9099; // khớp firebase.json
const VIEWPORTS = [
  { name: '1280', viewport: { width: 1280, height: 800 } },
  { name: '1024', viewport: { width: 1024, height: 768 } },
];
const BROWSERS = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

/** E2E trên bản build (plan 7.4): 3 trình duyệt × 2 viewport desktop. */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Service worker PWA (M12) chặn mặc định để mỗi test tải bản mới; test offline bật riêng.
    serviceWorkers: 'block',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: BROWSERS.flatMap((b) =>
    VIEWPORTS.map((v) => ({
      name: `${b.name}-${v.name}`,
      use: { ...b.device, viewport: v.viewport },
    })),
  ),
  webServer: [
    {
      // Firebase Auth Emulator (cần Java). Sẵn sàng cho E2E đăng nhập ở M1.
      command: 'pnpm --dir ../.. emulators',
      url: `http://127.0.0.1:${AUTH_EMULATOR_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { VITE_USE_AUTH_EMULATOR: 'true' },
    },
  ],
});
