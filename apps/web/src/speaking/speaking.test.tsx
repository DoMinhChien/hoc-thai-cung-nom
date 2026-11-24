import { MockAudioProvider, MockAuthService } from '@nom/core';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { GUEST_KEY, NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { speakingEnabled } from './flag';
import { SPEAKING_ASR_KEY, SPEAKING_MIC_INTRO_KEY } from './settings';
import { SpeakingPanel } from './SpeakingPanel';

const repos = () => createDexieRepositories(new NomDatabase(GUEST_KEY));

/** MediaRecorder / getUserMedia / SpeechRecognition giả (jsdom không có). */
let heard = 'ผมชื่อครับ';
let denyMic = false;
class FakeRecorder {
  static isTypeSupported = (type: string) => type === 'audio/webm';
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(readonly stream: { getTracks(): { stop(): void }[] }) {}
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['giọng'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}
class FakeRecognition {
  lang = '';
  interimResults = true;
  maxAlternatives = 1;
  continuous = true;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start() {}
  stop() {
    setTimeout(() => {
      this.onresult?.({ results: [[{ transcript: heard }]] });
      this.onend?.();
    });
  }
  abort() {}
}

beforeEach(() => {
  heard = 'ผมชื่อครับ';
  denyMic = false;
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        if (denyMic) throw Object.assign(new Error('denied'), { name: 'NotAllowedError' });
        return { getTracks: () => [{ stop() {} }] };
      },
    },
  });
});
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

const TARGET = {
  key: 'sentence:s1',
  text: 'ผมชื่อมินห์ครับ',
  accepted: ['ผมชื่อมินห์ครับ'],
  tokens: ['ผม', 'ชื่อ', 'มินห์', 'ครับ'],
};

function renderPanel(onAttempt = vi.fn()) {
  const audio = new MockAudioProvider();
  render(
    <AppProviders authService={new MockAuthService()} audio={audio}>
      <SpeakingPanel target={TARGET} onAttempt={onAttempt} />
    </AppProviders>,
  );
  return { audio, onAttempt };
}

describe('cờ VITE_ENABLE_SPEAKING (M12.9, CAT)', () => {
  it('không đặt → bật khi dev, tắt khi build; đặt rõ thì theo giá trị', () => {
    expect(speakingEnabled({ DEV: true })).toBe(true);
    expect(speakingEnabled({ DEV: false })).toBe(false);
    expect(speakingEnabled({ DEV: false, VITE_ENABLE_SPEAKING: 'true' })).toBe(true);
    expect(speakingEnabled({ DEV: true, VITE_ENABLE_SPEAKING: 'false' })).toBe(false);
  });

  it('tắt cờ → Cài đặt không có mục Luyện nói / Xóa bản ghi', async () => {
    vi.stubEnv('VITE_ENABLE_SPEAKING', 'false');
    render(
      <AppProviders authService={new MockAuthService()} audio={new MockAudioProvider()}>
        <SettingsPage />
      </AppProviders>,
    );
    await screen.findByTestId('settings-data');
    expect(screen.queryByTestId('settings-speaking')).toBeNull();
    expect(screen.queryByTestId('settings-clear-recordings')).toBeNull();
  });
});

describe('SpeakingPanel (SCR-10 §3–5)', () => {
  it('lần đầu: hỏi micro rồi Mức 2 → ghi, dừng → Máy nghe được + tô thẻ, lưu bản ghi', async () => {
    const { onAttempt, audio } = renderPanel();
    const record = await screen.findByTestId('speaking-record');
    await waitFor(() => expect(record).toBeEnabled());
    await userEvent.click(record);
    await userEvent.click(await screen.findByTestId('mic-allow'));
    await userEvent.click(await screen.findByTestId('asr-on'));
    await waitFor(() => expect(record).toHaveAttribute('data-status', 'recording'));
    await userEvent.click(record);

    const asr = await screen.findByTestId('speaking-asr');
    expect(screen.getByTestId('speaking-heard')).toHaveTextContent('ผมชื่อครับ');
    const tokens = screen.getAllByTestId('speaking-asr-token');
    expect(tokens.map((t) => t.dataset.matched)).toEqual(['true', 'true', 'false', 'true']);
    expect(asr).not.toHaveTextContent('%');
    expect(screen.queryByTestId('speaking-heard-all')).toBeNull();
    expect(onAttempt).toHaveBeenCalledWith({ asrRatio: 0.75 });
    await waitFor(async () => expect(await repos().recordings.count()).toBe(1));
    expect(await repos().settings.get(SPEAKING_ASR_KEY, null)).toBe(true);
    expect(await repos().settings.get(SPEAKING_MIC_INTRO_KEY, false)).toBe(true);

    // Nghe mẫu đọc bằng giọng mẫu.
    await userEvent.click(screen.getByTestId('speaking-model'));
    expect(audio.calls).toContainEqual({ kind: 'speak', text: TARGET.text });
  });

  it('nói trọn câu → "Máy nghe được trọn câu"', async () => {
    heard = 'ผม ชื่อ มินห์ ครับ';
    await repos().settings.set(SPEAKING_MIC_INTRO_KEY, true);
    await repos().settings.set(SPEAKING_ASR_KEY, true);
    renderPanel();
    const record = await screen.findByTestId('speaking-record');
    await waitFor(() => expect(record).toBeEnabled());
    await userEvent.click(record);
    await waitFor(() => expect(record).toHaveAttribute('data-status', 'recording'));
    await userEvent.click(record);
    expect(await screen.findByTestId('speaking-heard-all')).toBeInTheDocument();
  });

  it('tắt Mức 2 → chỉ ghi âm, không có khung nhận dạng', async () => {
    await repos().settings.set(SPEAKING_MIC_INTRO_KEY, true);
    await repos().settings.set(SPEAKING_ASR_KEY, false);
    const { onAttempt } = renderPanel();
    const record = await screen.findByTestId('speaking-record');
    await waitFor(() => expect(record).toBeEnabled());
    await userEvent.click(record);
    await waitFor(() => expect(record).toHaveAttribute('data-status', 'recording'));
    await userEvent.click(record);
    await screen.findByTestId('speaking-mine');
    expect(screen.queryByTestId('speaking-asr')).toBeNull();
    expect(onAttempt).toHaveBeenCalledWith({ asrRatio: null });
  });

  it('từ chối micro → hướng dẫn bật lại', async () => {
    denyMic = true;
    await repos().settings.set(SPEAKING_MIC_INTRO_KEY, true);
    await repos().settings.set(SPEAKING_ASR_KEY, false);
    renderPanel();
    const record = await screen.findByTestId('speaking-record');
    await waitFor(() => expect(record).toBeEnabled());
    await userEvent.click(record);
    expect(await screen.findByTestId('speaking-denied')).toBeInTheDocument();
  });

  it('không có MediaRecorder → báo, không có nút ghi', async () => {
    vi.stubGlobal('MediaRecorder', undefined);
    renderPanel();
    expect(await screen.findByTestId('speaking-unsupported')).toBeInTheDocument();
    expect(screen.queryByTestId('speaking-record')).toBeNull();
  });
});

describe('Cài đặt Luyện nói', () => {
  it('bật / tắt nhận dạng; Xóa mọi bản ghi giọng nói', async () => {
    const ts = new Date().toISOString();
    await repos().recordings.put({
      id: 'r1',
      key: 'word:a',
      audio: new ArrayBuffer(4),
      mimeType: 'audio/webm',
      durationMs: 1,
      createdAt: ts,
      updatedAt: ts,
    });
    render(
      <AppProviders authService={new MockAuthService()} audio={new MockAudioProvider()}>
        <SettingsPage />
      </AppProviders>,
    );
    const asr = await screen.findByTestId('settings-speaking-asr');
    expect(asr).not.toBeChecked();
    await userEvent.click(asr);
    await waitFor(async () =>
      expect(await repos().settings.get(SPEAKING_ASR_KEY, null)).toBe(true),
    );

    const clear = await screen.findByTestId('settings-clear-recordings');
    await waitFor(() => expect(clear).toBeEnabled());
    await userEvent.click(clear);
    await userEvent.click(await screen.findByTestId('clear-recordings-confirm'));
    await waitFor(async () => expect(await repos().recordings.count()).toBe(0));
  });
});
