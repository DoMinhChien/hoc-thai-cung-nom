import { defineConfig, devices } from '@playwright/test';

// `E2E_PORT`: chạy song song nhiều bản (vd. nhiều worktree) không dùng chung preview.
const PORT = Number(process.env.E2E_PORT ?? 4173);
/** Bản build bật Luyện nói (M12.9, `e2e/serve.ts`) — `speaking.spec.ts` dùng cổng này. */
export const SPEAKING_PORT = PORT + 1;
const AUTH_EMULATOR_PORT = 9099; // khớp firebase.json
const VIEWPORTS = [
  { name: '1280', viewport: { width: 1280, height: 800 } },
  { name: '1024', viewport: { width: 1024, height: 768 } },
];
/** Thiết bị cảm ứng WebKit (M12.7, SCR-00 v2 §7) — chỉ chạy `responsive.spec.ts`. */
const DEVICES = [
  { name: 'webkit-iphone15', use: devices['iPhone 15'], match: /(responsive|speaking)\.spec\.ts/ },
  {
    name: 'webkit-ipad-mini',
    use: {
      ...devices['iPad Mini'],
      viewport: { width: 744, height: 1133 },
      screen: { width: 744, height: 1133 },
    },
  },
  { name: 'webkit-ipad-pro11-landscape', use: devices['iPad Pro 11 landscape'] },
];
const RESPONSIVE_SPEC = /responsive\.spec\.ts/;
const BROWSERS = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

/** E2E trên bản build (plan 7.4): 3 trình duyệt × 2 viewport desktop + 3 thiết bị iOS (M12.7). */
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
  projects: [
    ...BROWSERS.flatMap((b) =>
      VIEWPORTS.map((v) => ({
        name: `${b.name}-${v.name}`,
        use: { ...b.device, viewport: v.viewport },
        testIgnore: RESPONSIVE_SPEC,
      })),
    ),
    ...DEVICES.map(({ match, ...d }: (typeof DEVICES)[number] & { match?: RegExp }) => ({
      ...d,
      testMatch: match ?? RESPONSIVE_SPEC,
    })),
  ],
  webServer: [
    {
      // Firebase Auth Emulator (cần Java). Sẵn sàng cho E2E đăng nhập ở M1.
      command: 'pnpm --dir ../.. emulators',
      url: `http://127.0.0.1:${AUTH_EMULATOR_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Bản như production (cờ Luyện nói tắt) + bản bật Luyện nói ở SPEAKING_PORT.
      command: `pnpm build && node e2e/serve.ts ${PORT} ${SPEAKING_PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: { VITE_USE_AUTH_EMULATOR: 'true', VITE_ENABLE_SPEAKING: 'false' },
    },
  ],
});
