import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest, countCards } from './helpers';
import { readStore } from './practice-helpers';

/**
 * 4 trò arcade (M9.6 T9.6.6, SCR-08 v2) trên content đã build, nguồn `b01`, seed cố định. Giảm
 * chuyển động → bỏ đếm 3·2·1; Máy bay + Mê cung chạy chế độ từng bước (ảnh chụp ổn định).
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
  await page.goto('/games');
  await page.getByTestId('game-source').selectOption('unit:b01');
  await expect
    .poll(
      async () =>
        (
          await readStore<{ key: string; value: unknown }>(page, 'hoc-thai-nom-guest', 'settings')
        ).find((s) => s.key === 'gameSource')?.value,
    )
    .toBe('unit:b01');
});

async function expectNoSevereViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

/** Kỷ lục + "cần ôn" đã lưu cho trò; FSRS không đổi (F-12). */
async function expectSaved(page: Page, gameId: string) {
  await expect
    .poll(async () =>
      (
        await readStore<{ gameId: string; plays: number }>(
          page,
          'hoc-thai-nom-guest',
          'gameResults',
        )
      )
        .filter((r) => r.gameId === gameId)
        .map((r) => r.plays),
    )
    .toEqual([1]);
  expect(await countCards(page, 'hoc-thai-nom-guest')).toBe(0);
}

test('/games v2: 8 trò, lọc kỹ năng, theme — baseline', async ({ page }) => {
  await expect(page.getByTestId(/^game-card-/)).toHaveCount(8);
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('games-v2.png', { fullPage: true });
  await page.keyboard.press('s');
  await expect(page).toHaveURL(/\?skill=vocab/);
  await expect(page.getByTestId(/^game-card-/)).toHaveCount(6);
});

test('Đập chuột: đập đúng bằng phím, hết 60 giây → kết quả + kỷ lục', async ({
  page,
  browserName,
}) => {
  await page.clock.install();
  await page.goto('/games/whack-a-mole?seed=7');
  const prompt = page.getByTestId('whack-prompt');
  await expect(prompt).toBeVisible();
  const res = await page.request.get('/content/unit-b01.json');
  const unit = (await res.json()) as { words: { thai: string; meaning_vi: string[] }[] };
  const asked = await prompt.textContent();
  const target = unit.words.find((w) => w.meaning_vi.join('; ') === asked)!;
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  // Lịch thò lên theo seed: chạy đồng hồ tới khi con mang đáp án xuất hiện.
  const mole = page.locator(`[data-mole="${target.thai}"]`);
  for (let i = 0; i < 40 && !(await mole.count()); i++) await page.clock.runFor(200);
  const hole = Number((await mole.first().getAttribute('data-testid'))!.replace('whack-hole-', ''));
  await page.keyboard.press(keys[hole]!);
  await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-whack.png', {
    fullPage: true,
    mask: [page.getByTestId('game-clock'), page.locator('[data-mole]')],
  });

  // Đồng hồ giả của Playwright không điều khiển requestAnimationFrame trên WebKit (Windows).
  if (browserName === 'webkit') return;
  await page.clock.runFor(61_000);
  await expect(page.getByTestId('game-result')).toBeVisible();
  await expect(page.getByTestId('result-detail')).toContainText('Đập nhầm');
  await expectSaved(page, 'whack-a-mole');
});

test('Đố vui truyền hình: 12 câu, 50:50, chọn A, Tiếp → kết quả; mục sai "cần ôn"', async ({
  page,
}) => {
  await page.goto('/games/gameshow?seed=3');
  await expect(page.getByTestId('show-prompt')).toBeVisible();
  await page.keyboard.press('f');
  await expect(page.locator('[data-removed="true"]')).toHaveCount(2);
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-gameshow.png', {
    fullPage: true,
    mask: [page.getByTestId('show-timer')],
  });
  for (let i = 0; i < 12; i++) {
    const option = page.locator('[data-testid^="show-option-"][data-removed="false"]').first();
    await option.click();
    await page.getByTestId('show-next').click();
  }
  await expect(page.getByTestId('game-result')).toBeVisible();
  await expect(page.getByTestId('result-detail')).toContainText('50:50');
  await expectSaved(page, 'gameshow');
  const wrong =
    12 - Number((await page.getByTestId('result-correct').textContent())!.split('/')[0]);
  await expect
    .poll(async () => (await readStore(page, 'hoc-thai-nom-guest', 'needsReview')).length)
    .toBe(wrong);
});

test('Máy bay (từng bước): ↑↓ đổi làn, → bay; hết tim → kết quả', async ({ page }) => {
  await page.goto('/games/airplane?seed=5');
  await expect(page.getByTestId('game-status')).toContainText('Từng bước');
  const plane = page.getByTestId('plane');
  // Phím đầu có thể tới trước khi trang nhận focus (WebKit) — bấm lại tới khi máy bay lên làn 0.
  await expect(async () => {
    await page.keyboard.press('ArrowUp');
    await expect(plane).toHaveAttribute('data-lane', '0', { timeout: 500 });
  }).toPass();
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-airplane.png', { fullPage: true });
  for (let i = 0; i < 80 && !(await page.getByTestId('game-result').isVisible()); i++) {
    await page.keyboard.press('ArrowRight');
  }
  await expect(page.getByTestId('game-result')).toBeVisible();
  await expect(page.getByTestId('result-stars')).toBeVisible();
  await expectSaved(page, 'airplane');
});

test('Mê cung (từng bước): đi bằng phím, B tắt/bật, Esc thoát không lưu', async ({ page }) => {
  await page.goto('/games/maze?seed=11');
  const grid = page.getByTestId('maze-grid');
  await expect(grid).toHaveAttribute('data-player', '4,3');
  await expect(page.getByTestId('game-status')).toContainText('bật');
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-maze.png', { fullPage: true });
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
    await page.keyboard.press(key);
    if ((await grid.getAttribute('data-player')) !== '4,3') break;
  }
  await expect(grid).not.toHaveAttribute('data-player', '4,3');
  await page.keyboard.press('b');
  await expect(page.getByTestId('game-status')).toContainText('tắt');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/games$/);
  expect(await readStore(page, 'hoc-thai-nom-guest', 'gameResults')).toEqual([]);
});
