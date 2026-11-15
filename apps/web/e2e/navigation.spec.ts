import { expect, test } from '@playwright/test';
import { ROUTE_SAMPLES } from '../src/app/route-samples';
import { chooseGuest } from './helpers';

test('lần đầu mở app → màn Chào mừng /login (flows §2)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('page-login')).toBeVisible();
});

test('điều hướng qua các route rỗng bằng sidebar', async ({ page }) => {
  await chooseGuest(page);
  await expect(page.getByTestId('app-logo').first()).toBeVisible();

  for (const id of ['alphabet', 'tones', 'vocab', 'review', 'progress', 'settings']) {
    await page.getByTestId(`nav-${id}`).click();
    await expect(page.getByTestId(`page-${id}`)).toBeVisible();
  }
});

test('mở trực tiếp mọi route (deep link)', async ({ page }) => {
  await chooseGuest(page);
  for (const { path, testId } of ROUTE_SAMPLES) {
    await page.goto(path);
    await expect(page.getByTestId(`page-${testId}`)).toBeVisible();
  }
});
