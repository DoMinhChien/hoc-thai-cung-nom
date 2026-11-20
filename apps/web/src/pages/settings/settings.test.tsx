import { MockAudioProvider, MockAuthService } from '@nom/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { SPEECH_RATE_KEY, SPEECH_SAMPLE, SPEECH_VOICE_KEY } from '@/audio/voice-preferences';
import { FEEDBACK_SOUND_KEY, FEEDBACK_VOLUME_KEY } from '@/components/interactive';
import { GUEST_KEY, NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { SettingsPage } from './SettingsPage';

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

const v = (name: string) => ({ name, lang: 'th-TH' });
const settings = () => createDexieRepositories(new NomDatabase(GUEST_KEY)).settings;

function renderSettings(audio: MockAudioProvider) {
  render(
    <AppProviders authService={new MockAuthService()} audio={audio}>
      <SettingsPage />
    </AppProviders>,
  );
}

describe('Cài đặt — âm thanh & giọng đọc (T9.5.1, T9.5.2)', () => {
  it('âm phản hồi: mặc định bật 40%; đổi âm lượng / tắt → lưu', async () => {
    renderSettings(new MockAudioProvider());
    const volume = await screen.findByTestId('settings-volume');
    expect(volume).toHaveValue('40');
    expect(volume).toHaveAttribute('aria-valuetext', '40%');
    fireEvent.change(volume, { target: { value: '75' } });
    expect(volume).toHaveValue('75');
    await waitFor(async () => expect(await settings().get(FEEDBACK_VOLUME_KEY, 0)).toBe(0.75));
    // jsdom không có Web Audio → nghe thử im lặng, không lỗi.
    await userEvent.click(screen.getByTestId('settings-test-correct'));
    await userEvent.click(screen.getByTestId('settings-test-wrong'));

    await userEvent.click(screen.getByTestId('settings-sound-enabled'));
    expect(screen.getByTestId('settings-sound-enabled')).not.toBeChecked();
    expect(volume).toBeDisabled();
    expect(screen.getByTestId('settings-test-correct')).toBeDisabled();
    await waitFor(async () => expect(await settings().get(FEEDBACK_SOUND_KEY, true)).toBe(false));
  });

  it('giọng đọc: Tự động = giọng xếp hạng đầu, chọn giọng + tốc độ → lưu, Nghe thử dùng lựa chọn', async () => {
    const audio = new MockAudioProvider('available', [
      v('Microsoft Pattara'),
      v('Microsoft Premwadee Online (Natural) - Thai (Thailand)'),
    ]);
    renderSettings(audio);
    const select = await screen.findByTestId('settings-voice-select');
    const options = [...select.querySelectorAll('option')].map((o) => o.textContent);
    expect(options).toEqual([
      'Tự động — Microsoft Premwadee Online (Natural) - Thai (Thailand)',
      'Microsoft Premwadee Online (Natural) - Thai (Thailand) · tự nhiên',
      'Microsoft Pattara',
    ]);
    expect(screen.queryByTestId('settings-edge-hint')).toBeNull();
    expect(screen.getByTestId('settings-rate')).toHaveValue('0.95');

    await userEvent.selectOptions(select, 'Microsoft Pattara');
    fireEvent.change(screen.getByTestId('settings-rate'), { target: { value: '0.8' } });
    expect(screen.getByTestId('settings-rate')).toHaveAttribute('aria-valuetext', '0,8×');
    await waitFor(async () => expect(await settings().get(SPEECH_RATE_KEY, null)).toBe(0.8));
    expect(await settings().get(SPEECH_VOICE_KEY, '')).toBe('Microsoft Pattara');

    await userEvent.click(screen.getByTestId('settings-voice-test'));
    expect(audio.calls.at(-1)).toEqual({
      kind: 'speak',
      text: SPEECH_SAMPLE,
      opts: { voice: 'Microsoft Pattara', rate: 0.8 },
    });
  });

  it('chỉ có giọng hệ thống → gợi ý dùng Edge', async () => {
    renderSettings(new MockAudioProvider('available', [v('Microsoft Pattara')]));
    expect(await screen.findByTestId('settings-edge-hint')).toBeInTheDocument();
  });

  it('không có giọng Thái → hướng dẫn cài, Nghe thử tắt', async () => {
    renderSettings(new MockAudioProvider('missing'));
    expect(await screen.findByTestId('settings-voice-test')).toBeDisabled();
    expect(screen.queryByTestId('settings-voice-select')).toBeNull();
  });
});
