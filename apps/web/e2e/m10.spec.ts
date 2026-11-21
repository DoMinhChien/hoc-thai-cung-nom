import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest } from './helpers';
import { loadBundle, readStore } from './practice-helpers';

/**
 * M10 (SCR-03 Tổng quan, SCR-07 Sổ từ, SCR-09 Tiến độ) trên content đã build. Đồng hồ cố định
 * (21/11/2026) + dữ liệu học GIẢ LẬP ghi thẳng vào IndexedDB → số liệu và ảnh chụp ổn định.
 */
const NOW = new Date('2026-11-21T03:00:00Z');
const DB = 'hoc-thai-nom-guest';
const H = 3_600_000;
const at = (hoursAgo: number) => new Date(NOW.getTime() - hoursAgo * H).toISOString();

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: NOW });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

async function expectNoSevereViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

async function putRows(page: Page, store: string, rows: object[]) {
  await page.evaluate(
    async ({ store, rows, db: name }) => {
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
    { store, rows, db: DB },
  );
}

const fsrs = (state: string, stability: number, dueHours: number) => ({
  due: new Date(NOW.getTime() + dueHours * H).toISOString(),
  stability,
  difficulty: 5,
  scheduled_days: Math.round(stability),
  learning_steps: 0,
  reps: 3,
  lapses: 0,
  state,
  last_review: at(30),
});

/** Đã học Bài 1: bài học 1–2 xong, bài 3 dở; 20 từ có thẻ (đủ 3 mức), log ôn, lượt bài tập, 1 lượt chơi. */
async function seedLearner(page: Page) {
  const b01 = await loadBundle(page, 'b01');
  // Bundle đã build có `id` cho từ (kiểu `loadBundle` chỉ khai báo trường cần cho Bài tập).
  const words = (b01.words as unknown as { id: string; thai: string }[]).slice(0, 20);
  await page.goto('/settings');
  await putRows(
    page,
    'cards',
    words.map((w, i) => ({
      id: `card-${w.id}`,
      itemType: 'word',
      itemId: w.id,
      cardType: 'th-vi',
      fsrs:
        i < 5
          ? fsrs('review', 40, 24 * 20)
          : i < 15
            ? fsrs('review', 5, i < 10 ? -2 : 24 * (i - 9))
            : fsrs('learning', 0.5, -1),
      createdAt: at(24 * (6 - (i % 5))),
      updatedAt: at(24),
    })),
  );
  await putRows(
    page,
    'reviewLogs',
    words.slice(0, 4).flatMap((w, i) =>
      [0, 1, 2].map((k) => ({
        id: `log-${w.id}-${k}`,
        cardId: `card-${w.id}`,
        rating: i < 3 && k < 2 ? 'again' : 'good',
        state: 'review',
        due: at(48),
        stability: 5,
        difficulty: 5,
        scheduled_days: 1,
        learning_steps: 0,
        review: at(24 * (k + 1) + i),
        updatedAt: at(24),
      })),
    ),
  );
  await putRows(
    page,
    'exerciseAttempts',
    Array.from({ length: 14 }, (_, i) => ({
      id: `att-${i}`,
      exerciseType: i % 2 ? 'E-01' : 'E-02',
      itemType: 'word',
      itemId: words[i]!.id,
      unitId: 'b01',
      correct: i % 4 !== 0,
      rating: i % 4 !== 0 ? 'good' : 'again',
      ts: at(1 + 24 * (i % 3)),
      updatedAt: at(1),
    })),
  );
  await putRows(page, 'lessons', [
    {
      id: 'lp-1',
      lessonId: 'b01-l1',
      unitId: 'b01',
      stepsDone: ['vocab'],
      bestScore: null,
      completedAt: at(48),
      updatedAt: at(48),
    },
    {
      id: 'lp-2',
      lessonId: 'b01-l2',
      unitId: 'b01',
      stepsDone: ['vocab'],
      bestScore: null,
      completedAt: at(26),
      updatedAt: at(26),
    },
    {
      id: 'lp-3',
      lessonId: 'b01-l3',
      unitId: 'b01',
      stepsDone: ['vocab'],
      bestScore: null,
      completedAt: null,
      updatedAt: at(2),
    },
  ]);
  await putRows(page, 'sessions', [
    { id: 's1', module: 'practice', startedAt: at(2), endedAt: at(1.5), updatedAt: at(1.5) },
  ]);
  await putRows(page, 'gameResults', [
    {
      id: 'g1',
      gameId: 'maze',
      source: 'unit:b01',
      best: { score: 300, correct: 3, total: 4, maxCombo: 2, durationMs: 60_000 },
      plays: 2,
      lastPlayedAt: at(5),
      updatedAt: at(5),
    },
  ]);
  return words;
}

test('người học mới: Tổng quan "Bắt đầu", Sổ từ trống, Tiến độ chưa có số liệu', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chào bạn!');
  await expect(page.getByTestId('home-continue')).toHaveAttribute('data-kind', 'start');
  await expect(page.getByTestId('home-practice-state')).toHaveText(
    'Học bài đầu tiên để có bài tập.',
  );
  await expect(page.getByTestId('home-games')).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('home-empty.png', { fullPage: true });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/units\/[a-z0-9]+\/[a-z0-9-]+$/);

  await page.goto('/words');
  await expect(page.getByTestId('words-empty')).toBeVisible();
  await page.getByRole('link', { name: /Xem từ của/ }).click();
  await expect(page).toHaveURL(/\/words\?unit=/);
  await expect(page.getByTestId('words-list')).toBeVisible();

  await page.goto('/progress');
  await expect(page.getByTestId('report-empty')).toBeVisible();
  await expect(page.getByTestId('report-words')).toContainText('0/0');
});

test('Tổng quan khi đang học: Học tiếp Bài 1, Bài tập là nút chính, chuỗi ngày, tóm tắt — baseline', async ({
  page,
}) => {
  await seedLearner(page);
  await page.goto('/');
  await expect(page.getByTestId('home-continue')).toHaveAttribute('data-kind', 'continue');
  await expect(page.getByTestId('home-continue')).toContainText('Bài học 3');
  // Có câu đến hạn, chưa đạt mục tiêu → "Làm bài tập" là nút chính (owner Q1 a).
  await expect(page.getByTestId('home-practice-button')).toHaveAttribute(
    'aria-keyshortcuts',
    'Enter B',
  );
  await expect(page.getByTestId('streak-card')).toHaveAttribute('data-count', '4');
  await expect(page.getByTestId('home-sum-words')).toContainText('5/20');
  await expect(page.getByTestId('home-path-b01')).toHaveAttribute('aria-current', 'step');
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  await page.keyboard.press('h');
  await expect(page).toHaveURL(/\/units\/b01\/b01-l3$/);
});

test('Sổ từ: tìm không dấu, chi tiết, mẹo nhớ của tôi, cần ôn bật tay — baseline', async ({
  page,
}) => {
  const words = await seedLearner(page);
  await page.goto('/words');
  await expect(page.getByTestId('words-summary')).toHaveText('20 từ đã học · 5 đã thuộc');
  await expect(page.getByTestId('words-list').getByRole('option')).toHaveCount(20);
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('words.png', { fullPage: true });

  // Tìm "toi" (không dấu) khớp nghĩa "tôi".
  await page.keyboard.press('/');
  await page.keyboard.type('toi');
  await expect(page).toHaveURL(/q=toi/);
  const options = page.getByTestId('words-list').getByRole('option');
  await expect(options.first()).toBeVisible();
  for (const label of await options.allTextContents()) {
    expect(label).toMatch(/tôi/);
  }

  // Chọn từ đầu, viết mẹo nhớ (M → Ctrl+Enter), bật "Cần ôn" (C).
  const first = words[0]!;
  await page.goto(`/words?word=${first.id}`);
  await expect(page.getByTestId('word-detail-th')).toHaveText(first.thai);
  // Phím M chỉ bật khi đã đọc xong mẹo hiện có.
  await expect(page.getByTestId('mnemonic-write')).toBeVisible();
  await page.keyboard.press('m');
  await page.getByTestId('mnemonic-input').fill('Mẹo thử ฉัน');
  await page.keyboard.press('Control+Enter');
  await expect(page.getByTestId('mnemonic')).toHaveAttribute('data-source', 'mine');
  await expect(page.getByTestId('mnemonic-text')).toHaveText('Mẹo thử ฉัน');
  await page.getByTestId('words-list').focus();
  await page.keyboard.press('c');
  await expect(page.getByTestId('word-review-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(async () =>
      (await readStore<{ itemId: string; origin: string }>(page, DB, 'needsReview')).map(
        (f) => `${f.itemId}:${f.origin}`,
      ),
    )
    .toEqual([`${first.id}:manual`]);
  expect(
    (await readStore<{ itemId: string; mnemonic: string }>(page, DB, 'wordNotes')).map(
      (n) => n.mnemonic,
    ),
  ).toEqual(['Mẹo thử ฉัน']);
  await page.getByTestId('words-level-review').click();
  await expect(page.getByTestId('words-list').getByRole('option')).toHaveCount(1);
});

test('Tiến độ: tổng quan, biểu đồ 30 ngày (bàn phím + bảng), kỹ năng, mục khó, trò chơi — baseline', async ({
  page,
}) => {
  await seedLearner(page);
  await page.goto('/progress');
  await expect(page.getByTestId('report-words')).toContainText('5/20');
  await expect(page.getByTestId('report-lessons')).toContainText('2/');
  await expect(page.getByTestId('report-streak')).toContainText('4 ngày liên tiếp');
  await expect(page.getByTestId('report-hard')).toContainText('Quên 2 lần');
  await expect(page.getByTestId('report-game-maze')).toContainText('300 điểm');
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('progress.png', { fullPage: true });

  const chart = page.getByTestId('report-chart').getByRole('img');
  await chart.focus();
  await expect(page.getByTestId('report-chart-tooltip')).toContainText('21/11');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('report-chart-tooltip')).toContainText('20/11');
  await page.getByRole('button', { name: 'Xem dạng bảng' }).click();
  await expect(page.getByTestId('report-table').locator('tbody tr')).toHaveCount(30);
  await page.getByTestId('report-hard-practice').click();
  await expect(page).toHaveURL(/\/practice\/session\?items=word:/);
});
