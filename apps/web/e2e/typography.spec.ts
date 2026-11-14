import { expect, test } from '@playwright/test';

test('/dev/typography: font Thái tự host đã tải và dấu không bị cắt', async ({ page }) => {
  await page.goto('/dev/typography');
  // fonts.load chờ tải xong font cho đúng ký tự Thái (fonts.check có race trên WebKit).
  const loadedFaces = await page.evaluate(async () => {
    const faces = await document.fonts.load('40px "Noto Sans Thai Variable"', 'ปู่');
    await document.fonts.ready;
    return faces.map((f) => f.family);
  });
  expect(loadedFaces).toContain('Noto Sans Thai Variable');

  // Dấu chồng không bị cắt: mỗi dòng chữ Thái không tràn theo chiều dọc.
  const clipped = await page
    .getByTestId('typography-th')
    .evaluateAll((els) => els.filter((el) => el.scrollHeight > el.clientHeight + 1).length);
  expect(clipped).toBe(0);

  await expect(page).toHaveScreenshot('typography.png', { fullPage: true });
});
