import { expect, test, type Page } from '@playwright/test';
import { chooseGuest } from './helpers';
import { answerAll, loadBundle, readStore } from './practice-helpers';

/**
 * Luồng E2E go-live (M12, plan 7.4 "Luồng E2E tối thiểu" viết lại theo bài học / bài tập v7):
 * 1 + 3 người mới học bài → bài tập → Tổng quan / Tiến độ cập nhật → tua đồng hồ → câu đến hạn;
 * 7 xuất → xoá → nhập tiến độ; 8 offline sau lần tải đầu (PWA).
 */
const DB = 'hoc-thai-nom-guest';
const T0 = new Date('2026-11-21T03:00:00Z');
const DAY = 24 * 3600_000;

async function learnVocab(page: Page) {
  await page.goto('/units/b01/b01-l1');
  await page.getByTestId('vocab-mode-list').click();
  await page.getByTestId('step-next').click();
  await expect(page.getByTestId('lesson-finished')).toBeVisible();
}

const cardCount = async (page: Page) => (await readStore(page, DB, 'cards')).length;

test.describe('học & tiến độ', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: T0 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await chooseGuest(page);
  });

  test('luồng 1 + 3: học bài 1 → bài tập 100% → Tổng quan, Tiến độ cập nhật → 4 ngày sau có câu đến hạn', async ({
    page,
  }) => {
    const b01 = await loadBundle(page, 'b01');
    await learnVocab(page);
    const words = await cardCount(page);
    expect(words).toBeGreaterThan(0);

    await page.goto('/practice');
    await expect(page.getByTestId('practice-today-state')).toHaveAttribute('data-state', 'ready');
    await page.keyboard.press('Enter');
    await answerAll(page, [b01], page.getByTestId('practice-result'));
    await expect(page.getByTestId('result-pct')).toHaveText('100%');

    await page.goto('/');
    await expect(page.getByTestId('home-continue')).toHaveAttribute('data-kind', 'next');
    await expect(page.getByTestId('home-sum-lessons')).toContainText('1/');
    await expect(page.getByTestId('streak-card')).toHaveAttribute('data-count', '1');
    await page.goto('/progress');
    await expect(page.getByTestId('report-activity-line')).toContainText('1/30 ngày có học');
    await expect(page.getByTestId('report-words')).toContainText(`/${words}`);

    // Luồng 3: vài ngày sau thẻ đến hạn → Bài tập là việc chính ở Tổng quan.
    await page.clock.setSystemTime(new Date(T0.getTime() + 4 * DAY));
    await page.goto('/practice');
    await expect(page.getByTestId('practice-today-state')).toHaveAttribute('data-state', 'ready');
    await page.goto('/');
    await expect(page.getByTestId('home-practice-button')).toHaveAttribute(
      'aria-keyshortcuts',
      'Enter B',
    );
    // Hôm qua và hôm kia không học → chuỗi về 0, ngày học cũ vẫn còn trong tuần.
    await expect(page.getByTestId('streak-card')).toHaveAttribute('data-count', '0');
  });

  test('luồng 7: xuất tệp → xoá tiến độ → nhập lại → tiến độ khôi phục', async ({ page }) => {
    await learnVocab(page);
    const before = await cardCount(page);
    await page.goto('/settings');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('settings-export').click(),
    ]);
    expect(download.suggestedFilename()).toBe('hoc-thai-cung-nom-2026-11-21.json');
    const file = await download.path();

    await page.getByTestId('settings-clear').click();
    await page.getByTestId('clear-confirm').click();
    await expect.poll(() => cardCount(page)).toBe(0);
    await page.goto('/words');
    await expect(page.getByTestId('words-empty')).toBeVisible();

    // Tệp sai → báo lỗi, không đổi gì.
    await page.goto('/settings');
    await page.getByTestId('settings-import-file').setInputFiles({
      name: 'sai.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"a":1}'),
    });
    await expect(page.getByText('không phải tệp tiến độ')).toBeVisible();

    await page.getByTestId('settings-import-file').setInputFiles(file);
    await expect(page.getByTestId('import-dialog')).toContainText(`${before} từ`);
    await page.getByTestId('import-confirm').click();
    await expect.poll(() => cardCount(page)).toBe(before);
    await page.goto('/words');
    await expect(page.getByTestId('words-list').getByRole('option')).toHaveCount(before);
  });
});

test.describe('PWA', () => {
  test.use({ serviceWorkers: 'allow' });

  test('luồng 8: tải app một lần → mất mạng → vẫn mở bài học, học từ, Sổ từ, Tiến độ', async ({
    page,
    context,
  }) => {
    await chooseGuest(page);
    // Đợi service worker cài xong (precache app + content) và điều khiển trang.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.goto('/units/b01/b01-l1');
    await expect(page.getByTestId('flashcard')).toBeVisible();
    await page.getByTestId('vocab-mode-list').click();
    await page.getByTestId('step-next').click();
    await expect(page.getByTestId('lesson-finished')).toBeVisible();
    expect(await cardCount(page)).toBeGreaterThan(0);
    await page.goto('/words');
    await expect(page.getByTestId('words-list')).toBeVisible();
    await page.goto('/progress');
    await expect(page.getByTestId('report-activity')).toBeVisible();
    await page.goto('/units/c01');
    await expect(page.getByTestId('page-unit')).toBeVisible();
    await context.setOffline(false);
  });
});
