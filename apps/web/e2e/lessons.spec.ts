import { expect, test } from '@playwright/test';
import { chooseGuest, countCards } from './helpers';
import { finishLesson, loadBundle, recordSpeech } from './practice-helpers';

/**
 * Luồng học (M7 T7.7, SCR-04/05) trên nội dung thật đã build (TC.2a: không còn Bài 1 mẫu `u01`):
 * học trọn Chuyên đề 1 (`c01`, 2 bài học) và bước Hội thoại của Bài 12. Giảm chuyển động để ảnh
 * chụp ổn định.
 */
test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

test('luồng học: Bắt đầu → học trọn Chuyên đề 1 (Mẫu câu → Từ vựng → Bài tập) → xong chuyên đề', async ({
  page,
}) => {
  const c01 = await loadBundle(page, 'c01');

  // "Bắt đầu" → bài học đầu của unit đầu lộ trình (nội dung thật thêm dần nên đọc từ units.json).
  const units = (await (await page.request.get('/content/units.json')).json()) as {
    unit_id: string;
    lessons: { lesson_id: string }[];
  }[];
  await page.goto('/units');
  await expect(page.getByTestId('continue-card')).toHaveAttribute('data-kind', 'start');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/units/${units[0]!.unit_id}/${units[0]!.lessons[0]!.lesson_id}`);

  await page.goto('/units/c01/c01-l1');
  await finishLesson(page, c01, 'c01-l1');
  await expect(page.getByTestId('lesson-finished')).toContainText('Xong Bài học 1');
  // Từ đã xem vào SRS (thẻ mới / đã chấm ở bài tập).
  expect(await countCards(page, 'hoc-thai-nom-guest')).toBeGreaterThanOrEqual(
    c01.words.filter((w) => w.lesson_id === 'c01-l1').length,
  );
  await expect(page.getByTestId('lesson-next')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/units\/c01\/c01-l2$/);
  await finishLesson(page, c01, 'c01-l2');
  await expect(page.getByTestId('unit-complete')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/units\/c01$/);
  await expect(page.getByTestId('unit-progress')).toHaveText('✓ Đã xong Chuyên đề 1');

  // Lộ trình: Chuyên đề 1 xong, giữ sau khi tải lại.
  await page.goto('/units');
  await page.reload();
  await expect(page.getByTestId('unit-status-c01')).toHaveText('✓ Xong');
});

test('Hội thoại (Bài 12, bài học 1): tra từ trong câu, rồi bài tập → hoàn thành bài học', async ({
  page,
}) => {
  const b12 = await loadBundle(page, 'b12');
  await page.goto('/units/b12/b12-l1');
  // TC.4a: bài học có từ vựng (từ trong hội thoại) → bước Từ vựng trước, Hội thoại sau.
  await expect(page.getByTestId('flashcard')).toBeVisible();
  await finishLesson(page, b12, 'b12-l1');
  await expect(page.getByTestId('lesson-finished')).toContainText('Xong Bài học 1');

  // "Chơi ôn bài này" (SCR-08 v3 §4) → Trò chơi với nội dung của bài học vừa xong.
  await page.getByTestId('lesson-play').click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.getByTestId('game-source')).toContainText(
    'Bài 12 · Bài học 1 · gồm mục chưa học',
  );
});

test('lộ trình 2 nhánh (plan 0.12 #1): Giáo trình trước Chuyên đề, nhãn "Bài n" / "Chuyên đề n"; Bài 2 (nội dung thật) mở được', async ({
  page,
}) => {
  await page.goto('/units');
  const labels = page.getByTestId('unit-path').getByTestId('unit-label');
  await expect(labels.first()).toBeVisible();
  const all = await labels.allTextContents();
  // Mọi "Bài n" đứng trước mọi "Chuyên đề n".
  const firstTopic = all.findIndex((l) => l.startsWith('Chuyên đề'));
  expect(firstTopic).toBeGreaterThan(0);
  expect(all.slice(firstTopic).every((l) => l.startsWith('Chuyên đề'))).toBe(true);

  await page.getByTestId('units-filter-theme').click();
  await expect(page).toHaveURL(/\?kind=theme$/);
  await expect(page.getByTestId('unit-path').getByTestId('unit-label')).toHaveText(
    all.slice(0, firstTopic),
  );
  await page.getByTestId('units-filter-grammar').click();
  await expect(page.getByTestId('unit-path').getByTestId('unit-label')).toHaveText(
    all.slice(firstTopic),
  );

  await page.goto('/units/b02');
  await expect(page.getByRole('navigation', { name: 'Về Bài học' })).toContainText('Bài 2');
  await expect(page.locator('[data-testid^="lesson-row-b02-"]')).toHaveCount(6);
  await page.getByTestId('lesson-row-b02-l1').click();
  await expect(page).toHaveURL(/\/units\/b02\/b02-l1$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bài 2 · Bài học 1:');
  await expect(page.getByTestId('flashcard')).toBeVisible();
});

test('cấp độ (TC.5): Bài 1–10 A1, Bài 11–12 và Chuyên đề A2 — /units và trang bài', async ({
  page,
}) => {
  await page.goto('/units');
  for (const [unit, level] of [
    ['b01', 'A1'],
    ['b10', 'A1'],
    ['b11', 'A2'],
    ['b12', 'A2'],
    ['c01', 'A2'],
    ['c15', 'A2'],
  ] as const) {
    await expect(
      page.getByTestId(`unit-row-${unit}`).getByText(level, { exact: true }),
    ).toBeVisible();
  }
  await page.goto('/units/b11');
  await expect(page.getByTestId('unit-vocab')).toBeVisible();
  await expect(page.getByText('A2', { exact: true })).toBeVisible();
});

test('baseline: /units, /units/b01, bài học (thẻ từ vựng đầu)', async ({ page }) => {
  for (const [path, name, ready] of [
    ['/units', 'units.png', 'unit-path'],
    ['/units/b01', 'unit.png', 'unit-vocab'],
    ['/units/b01/b01-l1', 'lesson.png', 'flashcard'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByTestId(ready)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(name, { fullPage: true });
  }
});
