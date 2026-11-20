import { expect, test, type Page } from '@playwright/test';
import { chooseGuest, countCards } from './helpers';
import { answerAll, loadBundle, recordSpeech } from './practice-helpers';

/**
 * Luồng học 1 bài (M7 T7.7, SCR-04/05) trên content mẫu đã build — Bài 1 (`u01`), bài học 1.
 * Giảm chuyển động để ảnh chụp ổn định.
 */
test.beforeEach(async ({ page }) => {
  await recordSpeech(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

async function unit1(page: Page) {
  return loadBundle(page, 'u01');
}

test('luồng học 1 bài: Bắt đầu → Từ vựng → Mẫu câu → Hội thoại → Bài tập → hoàn thành Bài 1', async ({
  page,
}) => {
  const content = await unit1(page);
  const lessonWords = content.words.filter((w) => w.lesson_id === 'u01-l1');

  // "Bắt đầu" → bài học đầu của unit đầu lộ trình (nội dung thật thêm dần nên đọc từ units.json).
  const units = (await (await page.request.get('/content/units.json')).json()) as {
    unit_id: string;
    lessons: { lesson_id: string }[];
  }[];
  await page.goto('/units');
  await expect(page.getByTestId('continue-card')).toHaveAttribute('data-kind', 'start');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`/units/${units[0]!.unit_id}/${units[0]!.lessons[0]!.lesson_id}`);
  // Học trọn Bài 1 mẫu (`u01`, 1 bài học).
  await page.goto('/units/u01/u01-l1');

  // Từ vựng: lật từng thẻ (Space), "Đã biết" (2).
  for (let i = 0; i < lessonWords.length; i++) {
    await expect(page.getByTestId('flashcard')).toBeVisible();
    await page.keyboard.press(' ');
    await expect(page.getByTestId('flashcard-back')).toBeVisible();
    await page.keyboard.press('2');
  }
  await expect(page.getByTestId('vocab-summary')).toContainText(`Đã xem ${lessonWords.length} từ`);
  // Từ đã xem vào SRS (thẻ mới, chưa chấm).
  await expect.poll(() => countCards(page, 'hoc-thai-nom-guest')).toBe(lessonWords.length);
  await page.keyboard.press('Enter');

  // Mẫu câu → Hội thoại.
  await expect(page.getByTestId('grammar-point').first()).toBeVisible();
  await page.keyboard.press('Enter');
  const lines = page.getByTestId('dialogue-lines');
  await expect(lines).toBeVisible();
  await lines.getByTestId('dialogue-word').first().click();
  await expect(page.getByTestId('lookup-panel')).not.toContainText('Chạm vào một từ để tra');
  // Focus đang ở nút từ vừa tra (Enter sẽ bấm lại nút đó) → bấm nút "Tiếp".
  await page.getByTestId('step-next').click();

  // Bài tập đúng hết → hoàn thành bài, xong chuyên đề (1 bài).
  await answerAll(page, [content], page.getByTestId('lesson-finished'));
  await expect(page.getByTestId('lesson-finished')).toContainText('Xong Bài học 1');
  await expect(page.getByTestId('unit-complete')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/units\/u01$/);
  await expect(page.getByTestId('unit-progress')).toHaveText('✓ Đã xong Bài 1');

  // Lộ trình: Bài 1 xong, giữ sau khi tải lại.
  await page.goto('/units');
  await page.reload();
  await expect(page.getByTestId('unit-status-u01')).toHaveText('✓ Xong');
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

test('baseline: /units, /units/u01, bài học (thẻ từ vựng đầu)', async ({ page }) => {
  for (const [path, name, ready] of [
    ['/units', 'units.png', 'unit-path'],
    ['/units/u01', 'unit.png', 'unit-vocab'],
    ['/units/u01/u01-l1', 'lesson.png', 'flashcard'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByTestId(ready)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(name, { fullPage: true });
  }
});
