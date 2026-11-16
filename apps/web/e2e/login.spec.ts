import { expect, test } from '@playwright/test';

/** Visual baseline `/login` (SCR-01 v7: thẻ ví dụ từ vựng) — owner xem ảnh. */
test('/login: thẻ ví dụ từ vựng, chữ Thái không bị cắt, có baseline', async ({ page }) => {
  await page.goto('/login');
  const card = page.getByTestId('login-example-card');
  await expect(card).toBeVisible();
  await expect(page.getByTestId('sign-in-google')).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);

  const clipped = await card
    .locator('[lang="th"]')
    .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).length);
  expect(clipped).toBe(0);

  await expect(page).toHaveScreenshot('login.png', { fullPage: true });
});
