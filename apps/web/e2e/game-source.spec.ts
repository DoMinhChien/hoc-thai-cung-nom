import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { chooseGuest } from './helpers';
import { loadBundle } from './practice-helpers';

/**
 * Nội dung ôn của Trò chơi (M12.8, SCR-08 v3 §5) trên content đã build: bộ chọn (dialog desktop),
 * chọn Bài 9 + 10 chỉ mục đã học → chơi Ghép cặp; chip "Cần ôn" + thẻ "Ôn bằng trò chơi" ở Tổng
 * quan; "Chơi ôn" ở trang bài. Phone (bottom sheet) ở `responsive.spec.ts`.
 */
const DB = 'hoc-thai-nom-guest';
const AT = '2026-11-01T08:00:00.000Z';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

async function putRows(page: Page, store: string, rows: object[]) {
  await page.evaluate(
    async ({ store, rows, name }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(name);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction(store, 'readwrite');
      for (const row of rows) tx.objectStore(store).put(row);
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { store, rows, name: DB },
  );
}

/** Thẻ SRS "đã học" (chưa đến hạn) cho các mục. */
const cards = (itemType: 'word' | 'sentence', ids: string[]) =>
  ids.map((itemId) => ({
    id: `e2e-${itemType}-${itemId}`,
    itemType,
    itemId,
    cardType: 'th-vi',
    fsrs: {
      due: '2099-01-01T00:00:00.000Z',
      stability: 30,
      difficulty: 5,
      scheduled_days: 30,
      learning_steps: 0,
      reps: 3,
      lapses: 0,
      state: 'review',
      last_review: AT,
    },
    createdAt: AT,
    updatedAt: AT,
  }));

/** `scope`: chỉ quét phần này (Playwright Firefox hay crash khi axe quét cả trang có dialog lớn). */
async function expectNoSevereViolations(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page });
  const { violations } = await (scope ? builder.include(scope) : builder).analyze();
  expect(
    violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

/** Thẻ "đã học": 5 từ Bài 9, 4 từ + 3 câu Bài 10; mở `/games`. */
async function seedB09B10(page: Page) {
  const [b09, b10] = [await loadBundle(page, 'b09'), await loadBundle(page, 'b10')];
  const words = (b: typeof b09) =>
    (b as unknown as { words: { id: string; meaning_vi: string[] }[] }).words.filter(
      (w) => w.meaning_vi.length > 0,
    );
  const w09 = words(b09)
    .slice(0, 5)
    .map((w) => w.id);
  const w10 = words(b10)
    .slice(0, 4)
    .map((w) => w.id);
  const s10 = b10.sentences
    .filter((s) => s.th)
    .slice(0, 3)
    .map((s) => s.id);
  await page.goto('/games');
  await putRows(page, 'cards', [...cards('word', [...w09, ...w10]), ...cards('sentence', s10)]);
  await page.reload();
  return { b09Words: words(b09).length };
}

/** Mở bộ chọn, chỉ chọn Bài 9 + Bài 10 (chỉ mục đã học). */
async function pickB09B10(page: Page) {
  await page.getByTestId('game-source').click();
  const picker = page.getByTestId('source-picker');
  await expect(picker).toBeVisible();
  await picker.getByTestId('picker-unit-b09').check();
  await picker.getByTestId('picker-unit-b10').check();
  await expect(picker.getByTestId('picker-only-learned')).toBeChecked();
  await expect(picker.getByTestId('picker-total')).toHaveText('Tổng: 9 từ · 3 câu');
  return picker;
}

test('bộ chọn nội dung (dialog): số mục, chọn Bài 9 + Bài 10, mở rộng bài học, axe, baseline', async ({
  page,
  browserName,
}) => {
  const { b09Words } = await seedB09B10(page);
  // Đủ mục đã học → mặc định "Tất cả đã học".
  await expect(page.getByTestId('game-source')).toHaveText('Tất cả đã học · 9 từ · 3 câu');
  const picker = await pickB09B10(page);
  await expect(picker.getByTestId('picker-quick-learned')).toContainText('Tất cả đã học 12');
  await expect(picker.getByTestId('picker-count-b09')).toContainText(`5/${b09Words} từ`);
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  // Đầu danh sách; số đếm theo nội dung (đổi khi thêm content) ẩn khỏi ảnh.
  await picker.getByTestId('picker-quick-learned').scrollIntoViewIfNeeded();
  await expect(picker).toHaveScreenshot('picker.png', {
    stylePath: path.join(import.meta.dirname, 'hide-counts.css'),
  });
  // Mở rộng Bài 10 → từng bài học có checkbox.
  await picker.getByTestId('picker-expand-b10').click();
  await expect(picker.getByTestId('picker-lesson-b10-l1')).toBeChecked();
  // Playwright Firefox (Windows) crash tiến trình trang khi axe quét dialog này → axe ở Chromium / WebKit.
  if (browserName !== 'firefox') {
    await expectNoSevereViolations(page, '[data-testid="source-picker"]');
  }
});

test('chọn Bài 9 + Bài 10, chỉ mục đã học → chơi Ghép cặp; lựa chọn được nhớ', async ({ page }) => {
  await seedB09B10(page);
  const picker = await pickB09B10(page);
  await picker.getByTestId('picker-apply').click();
  await expect(picker).toBeHidden();
  await expect(page.getByTestId('game-source')).toHaveText('Bài 9, Bài 10 · 9 từ · 3 câu');
  await page.reload();
  await expect(page.getByTestId('game-source')).toHaveText('Bài 9, Bài 10 · 9 từ · 3 câu');

  await page.keyboard.press('1');
  await expect(page).toHaveURL(/\/games\/match\?source=units%3Ab09%2Cb10$/);
  await expect(page.getByTestId('match-card')).toHaveCount(12);
});

test('"Cần ôn": thẻ ở Tổng quan → chip Cần ôn; ít hơn 6 mục → nút chơi tắt kèm lý do', async ({
  page,
}) => {
  const b01 = (await loadBundle(page, 'b01')) as unknown as { words: { id: string }[] };
  const ids = b01.words.slice(0, 8).map((w) => w.id);
  await page.goto('/');
  await putRows(page, 'cards', cards('word', ids));
  await putRows(
    page,
    'needsReview',
    ids.slice(0, 6).map((itemId) => ({
      id: `e2e-flag-${itemId}`,
      itemType: 'word',
      itemId,
      origin: 'game',
      flaggedAt: AT,
      updatedAt: AT,
    })),
  );
  await page.reload();
  await page.getByTestId('home-review-game-button').click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.getByTestId('game-source')).toHaveText('Cần ôn · 6 từ · 0 câu');

  // Chỉ mục đã học của Chuyên đề 1 (chưa học gì) → 0 mục, không tự đổi nguồn.
  await page.getByTestId('game-source').click();
  const picker = page.getByTestId('source-picker');
  await expect(picker.getByTestId('picker-quick-review')).toHaveAttribute('aria-checked', 'true');
  await picker.getByTestId('picker-unit-c01').check();
  await picker.getByTestId('picker-only-learned').check();
  await expect(picker.getByTestId('picker-total')).toHaveText('Tổng: 0 từ · 0 câu');
  await expect(picker.getByTestId('picker-apply')).toBeDisabled();
  await expect(picker.getByTestId('picker-short')).toContainText('Cần ít nhất 6 từ hoặc câu');
  await picker.getByTestId('picker-include-new').check();
  await expect(picker.getByTestId('picker-apply')).toBeEnabled();
});

test('"Chơi ôn" ở trang bài → Trò chơi với bài đó; "Đổi nội dung" ở màn kết quả mở bộ chọn', async ({
  page,
}) => {
  await page.goto('/units/b01');
  await page.getByTestId('unit-play').click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.getByTestId('game-source')).toContainText('Bài 1 · gồm mục chưa học');

  await page.goto('/games/true-false?seed=11');
  await expect(page.getByTestId('game-lives')).toHaveAttribute('data-lives', '3');
  // Sai liên tục tới khi hết tim → kết quả (phím bấm lúc đang hiện phản hồi bị bỏ qua).
  const result = page.getByTestId('game-result');
  await expect(async () => {
    if (!(await result.isVisible())) await page.keyboard.press('ArrowLeft');
    await expect(result).toBeVisible({ timeout: 700 });
  }).toPass({ timeout: 60_000 });
  await page.getByTestId('result-change-source').click();
  await expect(page).toHaveURL(/\/games\?pick=1$/);
  await expect(page.getByTestId('source-picker')).toBeVisible();
});
