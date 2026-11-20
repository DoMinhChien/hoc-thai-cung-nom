import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseGuest } from './helpers';
import { clearTones, readStore, recordTones, tones } from './practice-helpers';

/**
 * Cài đặt âm thanh & giọng đọc (M9.5 T9.5.1–T9.5.2). Danh sách giọng Thái giả cố định (giọng thật
 * khác nhau theo máy) → ảnh chụp ổn định.
 */
const DB = 'hoc-thai-nom-guest';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const voices = [
      'Microsoft Pattara - Thai (Thailand)',
      'Microsoft Premwadee Online (Natural) - Thai (Thailand)',
      'Microsoft Niwat Online (Natural) - Thai (Thailand)',
    ].map((name) => ({ name, lang: 'th-TH', default: false, localService: false, voiceURI: name }));
    synth.getVoices = () => voices as unknown as SpeechSynthesisVoice[];
  });
  await recordTones(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await chooseGuest(page);
});

const setting = async (page: Page, key: string) =>
  (await readStore<{ key: string; value: unknown }>(page, DB, 'settings')).find(
    (s) => s.key === key,
  )?.value;

test('Âm phản hồi + giọng đọc: giọng Natural nữ mặc định, đổi giọng/tốc độ/âm lượng được lưu, axe', async ({
  page,
}) => {
  await page.goto('/settings');
  test.skip(
    !(await page.evaluate(() => 'speechSynthesis' in window && 'AudioContext' in window)),
    'Playwright WebKit trên Windows không có Web Speech / Web Audio',
  );
  const select = page.getByTestId('settings-voice-select');
  await expect(select).toHaveValue('');
  await expect(select.locator('option').first()).toHaveText(
    'Tự động — Microsoft Premwadee Online (Natural) - Thai (Thailand)',
  );
  await expect(page.getByTestId('settings-edge-hint')).toBeHidden();

  // Nghe thử âm sai ở âm lượng mặc định.
  await clearTones(page);
  await page.getByTestId('settings-test-wrong').click();
  await expect.poll(() => tones(page)).toEqual([392, 311]);

  await select.selectOption('Microsoft Niwat Online (Natural) - Thai (Thailand)');
  await page.getByTestId('settings-rate').fill('0.8');
  await page.getByTestId('settings-volume').fill('0');
  await expect.poll(() => setting(page, 'feedbackVolume')).toBe(0);
  await expect.poll(() => setting(page, 'speechRate')).toBe(0.8);
  expect(await setting(page, 'speechVoice')).toBe(
    'Microsoft Niwat Online (Natural) - Thai (Thailand)',
  );
  await expect(page.getByTestId('settings-test-correct')).toBeDisabled();

  await page.reload();
  await expect(page.getByTestId('settings-voice-select')).toHaveValue(
    'Microsoft Niwat Online (Natural) - Thai (Thailand)',
  );
  await expect(page.getByTestId('settings-volume')).toHaveValue('0');
  await expect(page.getByTestId('settings-rate')).toHaveValue('0.8');

  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
});

test('baseline: /settings', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByTestId('settings-voice-test')).toBeVisible();
  await expect(page.getByTestId('settings-volume')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
});
