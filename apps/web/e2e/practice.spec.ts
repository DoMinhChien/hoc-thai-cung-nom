import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest } from './helpers';
import {
  answerAll,
  loadBundle,
  readStore,
  recordSpeech,
  clearTones,
  hasWebAudio,
  recordTones,
  tones,
} from './practice-helpers';

/**
 * Bài tập (M9 T9.7, SCR-06) trên nội dung thật đã build (Bài 1 `b01`). Giảm chuyển động để ảnh
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
  await recordTones(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

/** Học Bài 1, bài học 1 (chỉ có Từ vựng, dạng danh sách) → các từ vào SRS (thẻ mới). */
async function learnVocab(page: Page) {
  await page.goto('/units/b01/b01-l1');
  await page.getByTestId('vocab-mode-list').click();
  await page.getByTestId('step-next').click();
  await expect(page.getByTestId('lesson-finished')).toBeVisible();
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
  const b01 = await loadBundle(page, 'b01');
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

  await answerAll(page, [b01], page.getByTestId('practice-result'));
  await expect(page.getByTestId('result-pct')).toHaveText('100%');
  await expect(page.getByTestId('practice-no-wrong')).toBeVisible();

  // Mọi thẻ đã được chấm (lần đầu, Good). Bài học 1 chỉ có từ → thẻ từ Thái → Việt.
  await expect
    .poll(async () => (await readStore<Card>(page, DB, 'cards')).every((c) => c.fsrs.reps === 1))
    .toBe(true);
  const cards = await readStore<Card>(page, DB, 'cards');
  expect(cards.every((c) => c.itemType === 'word' && c.cardType === 'th-vi')).toBe(true);
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
  await page.goto('/practice/session?items=sentence:s-b01-010');
  await expect(page.getByTestId('question')).toHaveAttribute('data-type', 'E-07');
  // เค้า thiếu dấu ้ .
  await page.getByRole('textbox').fill('เคาเป็นคนเลว');
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
  expect(levels).toMatchObject([{ sentenceId: 's-b01-010', level: 2, streak: 1 }]);
});

test('Bỏ qua (S) → đáp án + hỏi lại cuối phiên (không chấm lần 2); kết quả có câu sai, Luyện lại câu sai', async ({
  page,
}) => {
  const b01 = await loadBundle(page, 'b01');
  await learnVocab(page);
  await page.goto('/practice/session?items=sentence:s-b01-011');
  await expect(page.getByTestId('question')).toBeVisible();
  const audible = await hasWebAudio(page);
  await clearTones(page);
  await page.keyboard.press('s');
  await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', 'false');
  // Âm sai (T9.5.1): 2 nốt đi xuống.
  if (audible) await expect.poll(() => tones(page)).toEqual([392, 311]);
  await clearTones(page);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('practice-retry')).toBeVisible();
  await answerAll(page, [b01], page.getByTestId('practice-result'));
  // Âm đúng (3 nốt đi lên) rồi âm hoàn thành ở màn kết quả.
  if (audible) {
    await expect.poll(() => tones(page)).toEqual([784, 1047, 1319, 523, 659, 784, 1047]);
  }
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
  await expect(page).toHaveURL(/items=sentence:s-b01-011/);
  await expect(page.getByTestId('question')).toBeVisible();

  // Thoát giữa chừng: hỏi xác nhận.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('practice-stop-dialog')).toBeVisible();
  await page.getByTestId('practice-stop-confirm').click();
  await expect(page).toHaveURL(/\/practice$/);
});

test('baseline: /practice (sau khi học Bài 1, bài học 1) + câu sắp xếp E-06', async ({ page }) => {
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
      sentenceId: 's-b01-010',
      level: 3,
      streak: 0,
      updatedAt: '2026-03-01T08:00:00.000Z',
    });
    await new Promise((resolve) => (tx.oncomplete = resolve));
    db.close();
  });
  await page.goto('/practice/session?items=sentence:s-b01-010&seed=1');
  await expect(page.getByTestId('question')).toHaveAttribute('data-type', 'E-06');
  await expectNoSevereViolations(page);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('practice-arrange.png', { fullPage: true });
});
