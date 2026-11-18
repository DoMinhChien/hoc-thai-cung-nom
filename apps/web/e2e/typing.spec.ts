import { expect, test, type Page } from '@playwright/test';

/** Luồng E2E 4 (plan 7.4, G-06) trên trang mẫu `/dev/typing` (câu mẫu ผมมีพี่ชายหนึ่งคน). */
const key = (page: Page, name: string) =>
  page.getByTestId('thai-keyboard').getByRole('button', { name, exact: true });

test('bàn phím ảo: gõ dấu thanh trước nguyên âm trên vẫn chấm đúng', async ({ page }) => {
  await page.goto('/dev/typing');
  const input = page.getByTestId('thai-input');
  await input.click();
  // พ ่ ี và น ่ ึ: dấu thanh bấm TRƯỚC nguyên âm trên.
  const typed = [
    'ผ',
    'ม',
    'ม',
    '◌ี',
    'พ',
    '◌่',
    '◌ี',
    'ช',
    'า',
    'ย',
    'ห',
    'น',
    '◌่',
    '◌ึ',
    'ง',
    'ค',
    'น',
  ];
  for (const name of typed) await key(page, name).click();
  await expect(input).toBeFocused();
  await expect(input).not.toHaveValue('ผมมีพี่ชายหนึ่งคน');
  await page.getByTestId('typing-check').click();
  await expect(page.getByTestId('typing-feedback')).toHaveAttribute('data-verdict', 'correct');
});

test('phím vật lý map Kedmanee, sai dấu thanh → diff; có baseline', async ({ page }) => {
  await page.goto('/dev/typing');
  await page.getByTestId('thai-input').click();
  // ผมมีพี้ชายหนึ่งคน — gõ ้ (KeyH) thay cho ่ (KeyJ) ở พี่.
  const codes =
    'KeyZ Comma Comma KeyU KeyR KeyU KeyH Equal KeyK KeyP KeyS KeyO Digit7 KeyJ Quote Digit8 KeyO';
  for (const code of codes.split(' ')) await page.keyboard.press(code);
  await expect(page.getByTestId('thai-input')).toHaveValue('ผมมีพี้ชายหนึ่งคน');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('typing-feedback')).toHaveAttribute('data-verdict', 'tone');
  await expect(page.getByTestId('diff-extra')).toHaveText('พี้');
  await expect(page.getByTestId('diff-missing')).toHaveText('พี่');

  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('dev-typing.png', { fullPage: true });
});

test('ẩn/hiện bàn phím ảo', async ({ page }) => {
  await page.goto('/dev/typing');
  await page.getByTestId('toggle-keyboard').click();
  await expect(page.getByTestId('thai-keyboard')).toHaveCount(0);
  await page.getByTestId('toggle-keyboard').click();
  await expect(page.getByTestId('thai-keyboard')).toBeVisible();
});
