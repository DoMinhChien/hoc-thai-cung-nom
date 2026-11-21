import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest, countCards } from './helpers';
import { readStore } from './practice-helpers';

/**
 * Luồng Trò chơi (M7.5 T7.5.6, SCR-08) trên content mẫu đã build. Chọn nguồn rõ ràng (`b01`, `u03`)
 * thay vì dựa vào unit đầu lộ trình — nội dung thật (`b01`…) thêm dần sẽ đổi unit đầu. Giảm chuyển động → bỏ đếm 3·2·1 và hiệu ứng (ảnh chụp ổn định).
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

/** Nghĩa đúng của từ / câu Bài 1 (đọc từ bundle đã build) — để biết nghĩa đề xuất đúng hay sai. */
async function meaningsOfUnit1(page: Page): Promise<Map<string, string>> {
  const res = await page.request.get('/content/unit-b01.json');
  const unit = (await res.json()) as {
    words: { thai: string; meaning_vi: string[] }[];
    sentences: { th?: string; vi: string }[];
  };
  return new Map([
    ...unit.words.map((w) => [w.thai, w.meaning_vi.join('; ')] as const),
    ...unit.sentences.flatMap((s) => (s.th ? [[s.th, s.vi] as const] : [])),
  ]);
}

/** Chọn nguồn trò chơi và đợi cài đặt được lưu (trước khi rời trang). */
async function chooseSource(page: Page, source: string) {
  await page.getByTestId('game-source').selectOption(source);
  await expect
    .poll(
      async () =>
        (
          await readStore<{ key: string; value: unknown }>(page, 'hoc-thai-nom-guest', 'settings')
        ).find((s) => s.key === 'gameSource')?.value,
    )
    .toBe(source);
}

async function expectNoSevereViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test('Đúng hay sai?: hết 3 tim → kết quả, kỷ lục lưu, bỏ "cần ôn" một mục, FSRS không đổi', async ({
  page,
}) => {
  const meanings = await meaningsOfUnit1(page);
  await page.goto('/games');
  await chooseSource(page, 'unit:b01');
  await page.goto('/games/true-false?seed=11');
  await expect(page.getByTestId('game-lives')).toHaveAttribute('data-lives', '3');

  // Đúng 1 câu rồi cố ý sai tới khi hết tim.
  let correct = true;
  while (!(await page.getByTestId('game-result').isVisible())) {
    const th = await page.getByTestId('tf-th').textContent();
    const shown = await page.getByTestId('tf-shown').textContent();
    const isTrue = meanings.get(th!) === shown;
    await page.keyboard.press(isTrue === correct ? 'ArrowRight' : 'ArrowLeft');
    await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', String(correct));
    correct = false;
    await expect(
      page.getByTestId('feedback-bar').or(page.getByTestId('game-result')),
    ).toBeVisible();
    await page.waitForFunction(
      () =>
        !document.querySelector('[data-testid="feedback-bar"]') ||
        document.querySelector('[data-testid="game-result"]'),
    );
  }

  await expect(page.getByTestId('result-correct')).toHaveText('1/4');
  // 25% đúng → 1 sao (M9.6).
  await expect(page.getByTestId('result-stars')).toHaveAttribute('data-stars', '1');
  await expect(page.getByTestId('result-new-record')).toBeVisible();
  const score = (await page.getByTestId('result-score').textContent())!;
  await expectNoSevereViolations(page);

  const toggles = page.getByTestId('review-list').getByRole('button');
  await expect(toggles).toHaveCount(3);
  await toggles.first().click();
  await expect(toggles.first()).toHaveAttribute('aria-pressed', 'false');

  // Về danh sách: kỷ lục + số mục "cần ôn" còn sau khi tải lại.
  await page.getByTestId('result-list').click();
  await expect(page).toHaveURL(/\/games$/);
  await page.reload();
  await expect(page.getByTestId('game-record-true-false')).toHaveText(`Kỷ lục: ${score} điểm`);
  await expect(page.getByTestId('game-review-count')).toContainText('2 mục cần ôn');
  // Trò chơi không đụng lịch FSRS (F-12): Guest vẫn chưa có thẻ nào.
  expect(await countCards(page, 'hoc-thai-nom-guest')).toBe(0);
});

test('Đoán loại từ trên Chuyên đề 3: chọn nguồn (được nhớ), trả lời bằng phím 1–4, hết tim → kết quả', async ({
  page,
}) => {
  // Bài 1 (không có loại từ) → trò bị khóa kèm lý do.
  await page.goto('/games');
  await page.getByTestId('game-source').selectOption('unit:b01');
  await expect(page.getByTestId('game-locked-classifier-rush')).toContainText(
    'Cần chuyên đề có loại từ',
  );
  await chooseSource(page, 'unit:u03');
  await expect(page.getByTestId('game-locked-classifier-rush')).toBeHidden();
  await page.reload();
  await expect(page.getByTestId('game-source')).toHaveValue('unit:u03');

  const res = await page.request.get('/content/unit-u03.json');
  const unit = (await res.json()) as { words: { thai: string; classifier?: string }[] };
  const classifierOf = new Map(unit.words.map((w) => [w.thai, w.classifier]));

  await page.keyboard.press('4');
  await expect(page).toHaveURL(/\/games\/classifier-rush\?source=unit%3Au03/);
  // Đúng 1 câu rồi cố ý sai tới khi hết tim.
  let correct = true;
  while (!(await page.getByTestId('game-result').isVisible())) {
    const th = (await page.getByTestId('cr-th').textContent())!;
    const options = await page.getByTestId('cr-options').getByRole('button').allTextContents();
    const right = options.findIndex((o) => o.endsWith(classifierOf.get(th)!));
    const pick = correct ? right : (right + 1) % options.length;
    await page.keyboard.press(String(pick + 1));
    await expect(page.getByTestId('feedback-bar')).toHaveAttribute('data-correct', String(correct));
    correct = false;
    await page.waitForFunction(
      () =>
        !document.querySelector('[data-testid="feedback-bar"]') ||
        document.querySelector('[data-testid="game-result"]'),
    );
  }
  await expect(page.getByTestId('result-correct')).toHaveText('1/4');
  // Mục sai ghi loại từ đã chọn, chữ Thái có lang="th".
  await expect(page.getByTestId('review-list').locator('del[lang="th"]')).toHaveCount(3);
  await expectNoSevereViolations(page);
});

test('/games và màn Ghép cặp: baseline', async ({ page }) => {
  await page.goto('/games');
  await expect(page.getByTestId('game-card-match')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('games.png', { fullPage: true });

  await page.keyboard.press('1');
  await expect(page.getByTestId('match-card')).toHaveCount(12);
  await page.goto('/games/match?seed=5');
  await expect(page.getByTestId('match-card')).toHaveCount(12);
  await page.keyboard.press(' ');
  await expect(page.getByTestId('match-card').first()).toHaveAttribute('data-open', 'true');
  await expectNoSevereViolations(page);
  await expect(page).toHaveScreenshot('game-match.png', {
    fullPage: true,
    mask: [page.getByTestId('game-clock')],
  });
});
