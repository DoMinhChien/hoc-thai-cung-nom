import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest } from './helpers';
import { answerAll, loadBundle, readStore, recordSpeech } from './practice-helpers';

/**
 * Bài tập (M9 T9.7, SCR-06) trên content mẫu đã build (Bài 1 mẫu `u01`). Giảm chuyển động để ảnh
 * chụp ổn định.
 */
const DB = 'hoc-thai-nom-guest';

interface Card {
  itemType: string;
  itemId: string;
  cardType: string;
  fsrs: { reps: number; due: string };
}
interface Log {
  rating: string;
}
interface Attempt {
  itemId: string;
  correct: boolean;
  rating: string | null;
}

test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

/** Học bước Từ vựng của Bài 1 mẫu (dạng danh sách) → các từ vào SRS (thẻ mới). */
async function learnVocab(page: Page) {
  await page.goto('/units/u01/u01-l1');
  await page.getByTestId('vocab-mode-list').click();
  await page.getByTestId('step-next').click();
  await expect(page.getByTestId('grammar-point').first()).toBeVisible();
}

/** Chọn "Kiểu bài" và đợi cài đặt được lưu (trước khi rời trang). */
async function chooseFilter(page: Page, filter: string) {
  await page.getByTestId(`practice-filter-${filter}`).check();
  await expect
    .poll(
      async () =>
        (await readStore<{ key: string; value: unknown }>(page, DB, 'settings')).find(
          (s) => s.key === 'practiceFilter',
        )?.value,
    )
    .toBe(filter);
}

async function expectNoSevereViolations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test('Bài tập hôm nay: bắt đầu bằng Enter, trả lời đúng hết bằng bàn phím/chuột → 100%, thẻ chấm Good', async ({
  page,
}) => {
  const u01 = await loadBundle(page, 'u01');
  await page.goto('/practice');
  await expect(page.getByTestId('practice-today-state')).toHaveAttribute(
    'data-state',
    'not-started',
  );

  await learnVocab(page);
  await page.goto('/practice');
  await expect(page.getByTestId('practice-today-state')).toHaveAttribute('data-state', 'ready');
  await expectNoSevereViolations(page);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/practice\/session$/);
  await expectNoSevereViolations(page);

  await answerAll(page, [u01], page.getByTestId('practice-result'));
  await expect(page.getByTestId('result-pct')).toHaveText('100%');
  await expect(page.getByTestId('practice-no-wrong')).toBeVisible();

  // Mọi thẻ đã được chấm (lần đầu, Good); câu của bài đã học vào SRS (thẻ Việt → Thái).
  await expect
    .poll(async () => (await readStore<Card>(page, DB, 'cards')).every((c) => c.fsrs.reps === 1))
    .toBe(true);
  const cards = await readStore<Card>(page, DB, 'cards');
  expect(cards.some((c) => c.itemType === 'sentence' && c.cardType === 'vi-th')).toBe(true);
  const logs = await readStore<Log>(page, DB, 'reviewLogs');
  expect(new Set(logs.map((l) => l.rating))).toEqual(new Set(['good']));

  // Về Bài tập: hôm nay đã xong.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByTestId('practice-today-state')).toHaveAttribute('data-state', 'done');
});

test('Gõ chữ Thái (E-07): sai dấu → "Gần đúng — sai dấu", chấm Hard, bậc dịch lưu theo câu', async ({
  page,
}) => {
  await learnVocab(page);
  await page.goto('/practice');
  await chooseFilter(page, 'typing');
  await page.goto('/practice/session?items=sentence:s-u01-002');
  await expect(page.getByTestId('question')).toHaveAttribute('data-type', 'E-07');
  // ชื่อ thiếu dấu ่ .
  await page.getByRole('textbox').fill('ผมชือสมชาย');
  await page.keyboard.press('Enter');
  const bar = page.getByTestId('feedback-bar');
  await expect(bar).toHaveAttribute('data-tone', 'true');
  await expect(bar).toContainText('Gần đúng — sai dấu');
  await expect(bar.getByTestId('diff-missing').first()).toBeVisible();
  await page.getByTestId('practice-next').click();
  await expect(page.getByTestId('result-count')).toHaveText('1/1 đúng');

  await expect
    .poll(async () => (await readStore<Log>(page, DB, 'reviewLogs')).map((l) => l.rating))
    .toEqual(['hard']);
  const levels = await readStore<{ sentenceId: string; level: number; streak: number }>(
    page,
    DB,
    'sentenceLevels',
  );
  expect(levels).toMatchObject([{ sentenceId: 's-u01-002', level: 2, streak: 1 }]);
});

test('Bỏ qua (S) → đáp án + hỏi lại cuối phiên (không chấm lần 2); kết quả có câu sai, Luyện lại câu sai', async ({
  page,
}) => {
  const u01 = await loadBundle(page, 'u01');
  await learnVocab(page);
  await page.goto('/practice/session?items=sentence:s-u01-003');
  await expect(page.getByTestId('question')).toBeVisible();
  await page.keyboard.press('s');
  await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', 'false');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('practice-retry')).toBeVisible();
  await answerAll(page, [u01], page.getByTestId('practice-result'));
  await expect(page.getByTestId('result-count')).toHaveText('0/1 đúng');
  await expect(page.getByTestId('practice-wrong-list')).toContainText('(bỏ qua)');
  await expectNoSevereViolations(page);

  await expect
    .poll(async () =>
      (await readStore<Attempt>(page, DB, 'exerciseAttempts'))
        .map((a) => [a.correct, a.rating])
        .sort(),
    )
    .toEqual([
      [false, 'again'],
      [true, null],
    ]);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/items=sentence:s-u01-003/);
  await expect(page.getByTestId('question')).toBeVisible();

  // Thoát giữa chừng: hỏi xác nhận.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('practice-stop-dialog')).toBeVisible();
  await page.getByTestId('practice-stop-confirm').click();
  await expect(page).toHaveURL(/\/practice$/);
});

test('baseline: /practice (sau khi học Bài 1 mẫu) + câu sắp xếp E-06', async ({ page }) => {
  await learnVocab(page);
  await page.goto('/practice');
  await expect(page.getByTestId('practice-today-state')).toHaveAttribute('data-state', 'ready');
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('practice.png', { fullPage: true });

  await chooseFilter(page, 'sentences');
  // Bậc 3 → sắp xếp có thẻ nhiễu (E-06).
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('hoc-thai-nom-guest');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = db.transaction('sentenceLevels', 'readwrite');
    tx.objectStore('sentenceLevels').put({
      id: 'e2e-level',
      sentenceId: 's-u01-002',
      level: 3,
      streak: 0,
      updatedAt: '2026-03-01T08:00:00.000Z',
    });
    await new Promise((resolve) => (tx.oncomplete = resolve));
    db.close();
  });
  await page.goto('/practice/session?items=sentence:s-u01-002&seed=1');
  await expect(page.getByTestId('question')).toHaveAttribute('data-type', 'E-06');
  await expectNoSevereViolations(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('practice-arrange.png', { fullPage: true });
});
