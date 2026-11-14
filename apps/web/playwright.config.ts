import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
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
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
