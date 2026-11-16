import { expect, test } from '@playwright/test';

/** Visual baseline component progress (plan 7.4: các màn progress P-02, P-03) — owner xem ảnh. */
test('/dev/progress: component tiến độ hiển thị đủ, có baseline', async ({ page }) => {
  await page.goto('/dev/progress');
  await expect(page.getByTestId('page-dev-progress')).toBeVisible();
  await expect(page.getByTestId('mastery-grid').getByRole('listitem')).toHaveCount(44);
  await expect(page.getByTestId('heatmap-table')).toBeVisible();
  await expect(page.getByTestId('tone-bar-chart').getByRole('listitem')).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('dev-progress.png', { fullPage: true });
});
