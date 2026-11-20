import { expect, test, type Page } from '@playwright/test';
import { chooseGuest, countCards } from './helpers';

/**
 * Luồng học 1 bài (M7 T7.7, SCR-04/05) trên content mẫu đã build — Bài 1 (`u01`), bài học 1.
 * Giảm chuyển động để ảnh chụp ổn định.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

interface Unit1 {
  words: { thai: string; meaning_vi: string[]; lesson_id: string }[];
  sentences: { vi: string; th?: string; tokens: string[]; lesson_id: string }[];
}

async function unit1(page: Page): Promise<Unit1> {
  return (await (await page.request.get('/content/unit-u01.json')).json()) as Unit1;
}

/** Trả lời đúng mọi câu của bước Bài tập (đáp án đọc từ bundle đã build). */
async function answerExercise(page: Page, content: Unit1) {
  const meanings = new Map(content.words.map((w) => [w.thai, w.meaning_vi.join('; ')]));
  const tokensOf = new Map(content.sentences.map((s) => [s.vi, s.tokens]));
  while (!(await page.getByTestId('lesson-finished').isVisible())) {
    const th = page.getByTestId('exercise-th');
    const vi = page.getByTestId('exercise-vi');
    await expect(th.or(vi).or(page.getByTestId('lesson-finished'))).toBeVisible();
    if (await page.getByTestId('lesson-finished').isVisible()) break;
    if (await th.isVisible()) {
      const expected = meanings.get((await th.textContent())!)!;
      await page.getByTestId('exercise-options').getByRole('button', { name: expected }).click();
    } else {
      const bank = page.getByTestId('token-bank');
      for (const token of tokensOf.get((await vi.textContent())!)!) {
        await bank.getByRole('button', { name: token, exact: true }).first().click();
      }
      await page.getByTestId('exercise-check').click();
    }
    await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    await page.getByTestId('exercise-next').click();
  }
}

test('luồng học 1 bài: Bắt đầu → Từ vựng → Mẫu câu → Hội thoại → Bài tập → hoàn thành Bài 1', async ({
  page,
}) => {
  const content = await unit1(page);
  const lessonWords = content.words.filter((w) => w.lesson_id === 'u01-l1');

  await page.goto('/units');
  await expect(page.getByTestId('continue-card')).toHaveAttribute('data-kind', 'start');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/units\/u01\/u01-l1$/);

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
  await answerExercise(page, content);
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
