import { expect, test } from '@playwright/test';

/** Visual baseline component progress còn giữ ở v7 (plan 0.8: P-01, P-04) — owner xem ảnh. */
test('/dev/progress: component tiến độ hiển thị đủ, có baseline', async ({ page }) => {
  await page.goto('/dev/progress');
  await expect(page.getByTestId('page-dev-progress')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('dev-progress.png', { fullPage: true });
});
