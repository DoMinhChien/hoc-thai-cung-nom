import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { ROUTE_SAMPLES } from '../src/app/route-samples';
import { chooseGuest } from './helpers';
import { chooseGameSource } from './practice-helpers';

/**
 * M12.7 T12.7.6 — iPhone & iPad (SCR-00 v2, plan 0.15). Chỉ chạy ở project thiết bị WebKit
 * (`webkit-iphone15`, `webkit-ipad-mini`, `webkit-ipad-pro11-landscape`, xem playwright.config).
 * Giảm chuyển động → bỏ đếm 3·2·1, Máy bay / Mê cung chạy từng bước (ổn định).
 */
const PATHS = [
  ...ROUTE_SAMPLES.map((r) => r.path),
  '/units/b09',
  '/units/b09/b09-l1',
  ...[
    'match',
    'sentence-rush',
    'classifier-rush',
    'whack-a-mole',
    'quiz-show',
    'airplane',
    'maze',
  ].map((id) => `/games/${id}`),
];

type Frame = 'phone' | 'tablet' | 'desktop';
const frameOf = (page: Page): Frame => {
  const width = page.viewportSize()!.width;
  return width < 744 ? 'phone' : width < 1024 ? 'tablet' : 'desktop';
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

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

/** Không cuộn ngang trang (SCR-00 v2 §4). */
async function expectNoHorizontalScroll(page: Page) {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: document.documentElement.clientWidth,
  }));
  expect(scroll, 'scrollWidth ≤ clientWidth').toBeLessThanOrEqual(width);
}

/** Chọn nguồn Bài 1 cho trò chơi (nội dung đủ cho mọi trò). */
async function useUnitB01(page: Page) {
  await chooseGameSource(page, 'units:b01;new');
}

test('không cuộn ngang ở mọi route', async ({ page }) => {
  test.setTimeout(120_000);
  await useUnitB01(page);
  for (const path of PATHS) {
    await page.goto(path);
    await page.locator('main').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await test.step(path, () => expectNoHorizontalScroll(page));
  }
});

test('điều hướng theo khung: thanh tab + sheet "Thêm" (phone) · rail (tablet)', async ({
  page,
}) => {
  const frame = frameOf(page);
  if (frame === 'phone') {
    await expect(page.getByTestId('tab-bar')).toBeVisible();
    await page.getByTestId('nav-games').tap();
    await expect(page.getByTestId('page-games')).toBeVisible();
    await expect(page.getByTestId('nav-games')).toHaveAttribute('aria-current', 'page');
    await page.getByTestId('nav-more').tap();
    const sheet = page.getByTestId('more-sheet');
    await expect(sheet).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('more-sheet.png');
    await sheet.getByTestId('nav-words').tap();
    await expect(page.getByTestId('page-words')).toBeVisible();
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId('nav-more')).toHaveAttribute('aria-current', 'page');
  } else {
    await expect(page.getByTestId('tab-bar')).toHaveCount(0);
    const nav = page.getByTestId(frame === 'tablet' ? 'nav-rail' : 'nav-words').first();
    await expect(nav).toBeVisible();
    await page.getByTestId('nav-progress').tap();
    await expect(page.getByTestId('page-progress')).toBeVisible();
  }
  // Màn chơi ẩn điều hướng.
  await page.goto('/games/true-false');
  await expect(page.getByTestId('game-top-bar')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
});

for (const path of ['/', '/games', '/words', '/units/b01/b01-l1']) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.locator('main').first().waitFor();
    await expectNoSevereViolations(page);
  });
}

test('baseline: /units, /games', async ({ page }) => {
  for (const [path, name] of [
    ['/units', 'units'],
    ['/games', 'games'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByTestId(`page-${name}`)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  }
});

test('bộ chọn nội dung ôn: bottom sheet (phone / tablet), chọn bài + bật mục chưa học → áp dụng', async ({
  page,
}) => {
  await page.goto('/games');
  await page.getByTestId('game-source').tap();
  const picker = page.getByTestId('source-picker');
  await expect(picker).toBeVisible();
  await picker.getByTestId('picker-clear').tap();
  await picker.getByTestId('picker-unit-b02').tap();
  await picker.getByTestId('picker-include-new').tap();
  await expect(picker.getByTestId('picker-apply')).toBeEnabled();
  // Nút áp dụng dính đáy, luôn trong màn hình.
  await expect(picker.getByTestId('picker-apply')).toBeInViewport();
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  await page.evaluate(() => document.fonts.ready);
  await expectNoSevereViolations(page);
  // Đầu danh sách; số đếm theo nội dung ẩn khỏi ảnh.
  await picker.getByTestId('picker-quick-learned').scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot('source-picker.png', {
    stylePath: path.join(import.meta.dirname, 'hide-counts.css'),
  });
  await picker.getByTestId('picker-apply').tap();
  await expect(picker).toBeHidden();
  await expect(page.getByTestId('game-source')).toContainText('Bài 2 · gồm mục chưa học');
});

test('Máy bay bằng chạm: ▲ ▼, chạm nửa bầu trời, Bay → hết ván', async ({ page }) => {
  test.setTimeout(90_000);
  await useUnitB01(page);
  await page.goto('/games/airplane?seed=5');
  const plane = page.getByTestId('plane');
  await expect(page.getByTestId('plane-up')).toBeVisible();
  const lane = async () => Number(await plane.getAttribute('data-lane'));
  const start = await lane();
  await page.getByTestId('plane-down').tap();
  await expect.poll(lane).toBe(start + 1);
  await page.getByTestId('plane-up').tap();
  await expect.poll(lane).toBe(start);
  // Chạm sát mép trên bầu trời → lên một làn.
  await page.getByTestId('plane-sky').tap({ position: { x: 20, y: 8 } });
  await expect.poll(lane).toBe(Math.max(0, start - 1));
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-airplane.png', { fullPage: true });
  const result = page.getByTestId('game-result');
  for (let i = 0; i < 80 && !(await result.isVisible()); i++) {
    await page.getByTestId('plane-fly').tap();
  }
  await expect(result).toBeVisible();
  await expect(page.getByTestId('result-again')).toBeVisible();
});

test('Mê cung bằng chạm: D-pad + vuốt → hết ván', async ({ page }) => {
  test.setTimeout(120_000);
  await useUnitB01(page);
  await page.goto('/games/maze?seed=11');
  const grid = page.getByTestId('maze-grid');
  await expect(grid).toHaveAttribute('data-player', '4,3');
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-maze.png', { fullPage: true });

  // D-pad: thử từng hướng tới khi đi được.
  for (const dir of ['up', 'down', 'left', 'right']) {
    await page.getByTestId(`maze-${dir}`).tap();
    if ((await grid.getAttribute('data-player')) !== '4,3') break;
  }
  await expect(grid).not.toHaveAttribute('data-player', '4,3');

  // Vuốt trên mê cung (pointer cảm ứng) — đi được ít nhất một hướng.
  const box = (await grid.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const swipe = async (dx: number, dy: number) => {
    const init = { pointerType: 'touch', isPrimary: true, bubbles: true };
    await grid.dispatchEvent('pointerdown', { ...init, clientX: cx, clientY: cy });
    await grid.dispatchEvent('pointerup', { ...init, clientX: cx + dx, clientY: cy + dy });
  };
  const before = await grid.getAttribute('data-player');
  for (const [dx, dy] of [
    [0, -60],
    [0, 60],
    [-60, 0],
    [60, 0],
  ] as const) {
    await swipe(dx, dy);
    if ((await grid.getAttribute('data-player')) !== before) break;
  }
  await expect(grid).not.toHaveAttribute('data-player', before!);

  // Đi về phía con ma (nó đuổi theo mỗi vài bước) → bị bắt 3 lần = hết ván. Hướng chặn tường thì
  // thử hướng kế tiếp.
  const result = page.getByTestId('game-result');
  const cell = async (attr: string) =>
    ((await grid.getAttribute(attr)) ?? '0,0').split(',').map(Number) as [number, number];
  for (let i = 0; i < 400 && !(await result.isVisible()); i++) {
    const [px, py] = await cell('data-player');
    const [gx, gy] = await cell('data-ghost');
    const order = [
      ...(gy < py ? ['up'] : gy > py ? ['down'] : []),
      ...(gx < px ? ['left'] : gx > px ? ['right'] : []),
      'up',
      'left',
      'down',
      'right',
    ];
    for (const dir of order) {
      await page.getByTestId(`maze-${dir}`).tap();
      if ((await result.isVisible()) || (await grid.getAttribute('data-player')) !== `${px},${py}`)
        break;
    }
  }
  await expect(result).toBeVisible();
});
