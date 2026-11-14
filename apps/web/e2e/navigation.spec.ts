import { expect, test } from '@playwright/test';
import { ROUTE_SAMPLES } from '../src/app/route-samples';

test('điều hướng qua các route rỗng bằng sidebar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('page-dashboard')).toBeVisible();
  await expect(page.getByTestId('app-logo').first()).toBeVisible();

  for (const id of ['alphabet', 'tones', 'vocab', 'review', 'progress', 'settings']) {
    await page.getByTestId(`nav-${id}`).click();
    await expect(page.getByTestId(`page-${id}`)).toBeVisible();
  }
});

test('mở trực tiếp mọi route (deep link)', async ({ page }) => {
  for (const { path, testId } of ROUTE_SAMPLES) {
    await page.goto(path);
    await expect(page.getByTestId(`page-${testId}`)).toBeVisible();
  }
});
