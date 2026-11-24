import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { SPEAKING_PORT } from '../playwright.config';
import { chooseGuest } from './helpers';

/**
 * M12.9 T12.9.6 — Luyện nói (SCR-10 §8). Chạy trên bản build bật cờ (`e2e/serve.ts`, cổng
 * `SPEAKING_PORT`); bản như production (cờ tắt) chỉ kiểm không có Luyện nói. Micro, MediaRecorder,
 * SpeechRecognition và phát lại đều giả lập (CI không có micro / dịch vụ nhận dạng) — giống nhau trên
 * Chromium, Firefox, WebKit desktop và WebKit iPhone 15.
 */
const SPEAKING_URL = `http://localhost:${SPEAKING_PORT}`;

interface MediaMock {
  /** Từ chối quyền micro. */
  deny?: boolean;
  /** Lời nhận dạng trả về; `null` → trình duyệt không có SpeechRecognition (như Firefox). */
  heard?: string | null;
}

async function mockMedia(page: Page, mock: MediaMock = {}) {
  await page.addInitScript((m: MediaMock) => {
    const w = window as unknown as Record<string, unknown>;
    class FakeRecorder {
      static isTypeSupported = (type: string) => type === 'audio/webm';
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(readonly stream: MediaStream) {}
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['giong-noi'], { type: 'audio/webm' }) });
        setTimeout(() => this.onstop?.());
      }
    }
    w.MediaRecorder = FakeRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          if (m.deny) throw new DOMException('denied', 'NotAllowedError');
          return { getTracks: () => [{ stop() {} }] };
        },
      },
    });
    class FakeRecognition {
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {}
      stop() {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: m.heard }]] });
          this.onend?.();
        });
      }
      abort() {}
    }
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
    if (m.heard !== null) w.webkitSpeechRecognition = FakeRecognition;
    // Giọng mẫu (Web Speech) đọc xong ngay — headless không có giọng Thái.
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
        setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent));
      };
      window.speechSynthesis.cancel = () => {};
    }
    // Bản ghi giả không giải mã được → phát lại xong ngay.
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      setTimeout(() => this.dispatchEvent(new Event('ended')));
      return Promise.resolve();
    };
  }, mock);
}

async function expectNoSevereViolations(page: Page) {
  // Firefox thỉnh thoảng crash khi axe chạy (xem m10.spec) — axe chạy ở Chromium / WebKit.
  if (page.context().browser()?.browserType().name() === 'firefox') return;
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    severe.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

/** Ghi một lượt: bấm ghi (lần đầu: "Cho phép" micro), đợi đang ghi, bấm dừng. */
async function recordOnce(page: Page, { firstTime = false } = {}) {
  const record = page.getByTestId('speaking-record').first();
  await expect(record).toBeEnabled();
  await record.click();
  if (firstTime) await page.getByTestId('mic-allow').click();
  await expect(record).toHaveAttribute('data-status', 'recording');
  await record.click();
  await expect(record).toHaveAttribute('data-status', 'done');
}

test.describe('bản bật Luyện nói', () => {
  test.use({ baseURL: SPEAKING_URL });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('phiên 10 mục: micro + đồng ý Mức 2 → Máy nghe được → tự đánh giá → kết quả → Luyện lại', async ({
    page,
  }) => {
    await mockMedia(page, { heard: 'ผม' });
    await chooseGuest(page);
    await page.goto('/practice');
    await page.getByTestId('practice-speaking-open').click();
    await expect(page.getByTestId('page-speaking')).toBeVisible();
    await expect(page.getByTestId('speaking-source')).toContainText('Bài 1');
    await expectNoSevereViolations(page);
    await page.goto('/practice/speaking/session?seed=1');

    const item = page.getByTestId('speaking-item');
    await expect(item).toBeVisible();
    await expect(page.getByTestId('speaking-count')).toHaveText('Mục 1/10');
    const record = page.getByTestId('speaking-record');
    await expect(record).toBeEnabled();
    await record.click();
    await page.getByTestId('mic-allow').click();
    await page.getByTestId('asr-on').click();
    await expect(record).toHaveAttribute('data-status', 'recording');
    await record.click();
    const asr = page.getByTestId('speaking-asr');
    await expect(asr).toBeVisible();
    await expect(page.getByTestId('speaking-heard')).toHaveText('ผม');
    await expect(asr).not.toContainText('%');
    await expect(page.getByTestId('speaking-mine')).toBeVisible();
    await page.getByTestId('speaking-alternate').click();
    await expect(page.getByTestId('speaking-alternate')).toBeEnabled();
    await expectNoSevereViolations(page);
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('speaking-session.png', { fullPage: true });

    const first = await item.getAttribute('data-item');
    await page.getByTestId('speaking-rate-retry').click();
    for (let n = 2; n <= 10; n++) {
      await expect(page.getByTestId('speaking-count')).toHaveText(`Mục ${n}/10`);
      await page.keyboard.press('1');
    }
    await expect(page.getByTestId('speaking-result')).toBeVisible();
    await expect(page.getByTestId('speaking-result-counts')).toHaveText(
      'Giống 9 · Gần giống 0 · Chưa giống 1',
    );
    await expect(page.getByTestId('speaking-retry-list').locator('li')).toHaveCount(1);
    await expectNoSevereViolations(page);

    await page.getByTestId('speaking-retry').click();
    await expect(page.getByTestId('speaking-count')).toHaveText('Mục 1/1');
    await expect(item).toHaveAttribute('data-item', first!);
    // Không hỏi lại micro / Mức 2.
    await recordOnce(page);
    await expect(page.getByTestId('mic-dialog')).toBeHidden();

    // Tiến độ: dòng Luyện nói tuần này; cài đặt có mục Luyện nói + xóa bản ghi.
    await page.goto('/progress');
    await expect(page.getByTestId('report-speaking')).toHaveText('Luyện nói: 10 mục tuần này');
    await page.goto('/settings');
    await expect(page.getByTestId('settings-speaking-asr')).toBeChecked();
    await page.getByTestId('settings-clear-recordings').click();
    await page.getByTestId('clear-recordings-confirm').click();
    await expect(page.getByTestId('settings-clear-recordings')).toBeDisabled();
  });

  test('tắt Mức 2 + trình duyệt không có nhận dạng → chỉ ghi âm, nghe lại', async ({ page }) => {
    await mockMedia(page, { heard: null });
    await chooseGuest(page);
    await page.goto('/practice/speaking/session?seed=2');
    await page.getByTestId('speaking-record').click();
    await page.getByTestId('mic-allow').click();
    // Không có SpeechRecognition → không hỏi Mức 2.
    await expect(page.getByTestId('speaking-record')).toHaveAttribute('data-status', 'recording');
    await page.getByTestId('speaking-record').click();
    await expect(page.getByTestId('speaking-mine')).toBeVisible();
    await expect(page.getByTestId('speaking-asr')).toBeHidden();
    await page.goto('/settings');
    await expect(page.getByTestId('settings-speaking-asr')).toBeDisabled();
  });

  test('từ chối micro → hướng dẫn bật lại, vẫn nghe mẫu được', async ({ page }) => {
    await mockMedia(page, { deny: true, heard: 'ผม' });
    await chooseGuest(page);
    await page.goto('/practice/speaking/session?seed=3');
    await page.getByTestId('speaking-record').click();
    await page.getByTestId('mic-allow').click();
    await page.getByTestId('asr-off').click();
    await expect(page.getByTestId('speaking-denied')).toBeVisible();
    await expect(page.getByTestId('speaking-listen')).toBeEnabled();
    await expectNoSevereViolations(page);
  });

  test('bài học: Nói theo ở thẻ từ, Nhập vai ở Hội thoại', async ({ page }) => {
    await mockMedia(page, { heard: null });
    await chooseGuest(page);
    await page.goto('/units/b01/b01-l3');
    await page.getByTestId('flashcard').getByTestId('say-after').click();
    await recordOnce(page, { firstTime: true });
    await expect(page.getByTestId('speaking-mine')).toBeVisible();

    await page.getByTestId('step-dialogue').click();
    await page.getByTestId('dialogue-roleplay').click();
    await expect(page.getByTestId('roleplay')).toBeVisible();
    await expectNoSevereViolations(page);
    await page.getByTestId('roleplay-role-Lan').click();
    // Nam đọc trước → tới lượt Lan; 3 lượt của Lan.
    for (let turn = 0; turn < 3; turn++) {
      await expect(page.getByTestId('roleplay-turn')).toBeVisible();
      await recordOnce(page);
      await page.getByTestId('roleplay-next').click();
    }
    await expect(page.getByTestId('roleplay-done')).toBeVisible();
    await page.getByTestId('roleplay-replay').click();
    await expect(page.getByTestId('roleplay-replay')).toBeEnabled();
    await page.getByTestId('roleplay-exit').click();
    await expect(page.getByTestId('dialogue-lines')).toBeVisible();
  });
});

test('bản như production (cờ tắt): không có Luyện nói', async ({ page }) => {
  await chooseGuest(page);
  await page.goto('/practice');
  await expect(page.getByTestId('page-practice')).toBeVisible();
  await expect(page.getByTestId('practice-speaking')).toBeHidden();
  await page.goto('/practice/speaking');
  await expect(page.getByTestId('page-speaking')).toBeHidden();
  await page.goto('/units/b01/b01-l3');
  await expect(page.getByTestId('flashcard')).toBeVisible();
  await expect(page.getByTestId('say-after')).toBeHidden();
  await page.goto('/settings');
  await expect(page.getByTestId('settings-data')).toBeVisible();
  await expect(page.getByTestId('settings-speaking')).toBeHidden();
  await page.goto('/privacy');
  await expect(page.locator('#giong-noi')).toHaveCount(0);
});
