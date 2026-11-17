import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeechUnavailableError, WebSpeechProvider } from './web-speech-provider';

const voice = (name: string, lang: string) => ({ name, lang }) as SpeechSynthesisVoice;

type FakeUtterance = {
  text: string;
  lang?: string;
  voice?: SpeechSynthesisVoice;
  rate?: number;
  onend?: () => void;
  onerror?: (e: { error: string }) => void;
};

/** `speechSynthesis` giả: đọc xong ngay (hoặc lỗi `fail`), giọng nạp sau `voiceschanged`. */
class FakeSynth extends EventTarget {
  spoken: FakeUtterance[] = [];
  cancel = vi.fn();
  fail: string | null = null;
  constructor(public voices: SpeechSynthesisVoice[] = []) {
    super();
  }
  getVoices() {
    return this.voices;
  }
  speak(u: FakeUtterance) {
    this.spoken.push(u);
    queueMicrotask(() => (this.fail ? u.onerror?.({ error: this.fail }) : u.onend?.()));
  }
  loadVoices(voices: SpeechSynthesisVoice[]) {
    this.voices = voices;
    this.dispatchEvent(new Event('voiceschanged'));
  }
}

/** `Audio` giả: `outcome` quyết định play() lỗi, phát lỗi, hay phát hết. */
function fakeAudio(outcome: 'ended' | 'error' | 'reject') {
  const urls: string[] = [];
  const createAudio = (url: string) => {
    urls.push(url);
    const el = new EventTarget() as EventTarget & { play(): Promise<void> };
    el.play = async () => {
      if (outcome === 'reject') throw new DOMException('NotAllowedError');
      queueMicrotask(() => el.dispatchEvent(new Event(outcome)));
    };
    return el as unknown as HTMLAudioElement;
  };
  return { urls, createAudio };
}

const THAI = voice('Kanya', 'th-TH');
const make = (synth: FakeSynth | undefined, audio = fakeAudio('ended')) =>
  new WebSpeechProvider({
    baseUrl: '/content/',
    synth: synth as unknown as SpeechSynthesis | undefined,
    createUtterance: (text) => ({ text }) as unknown as SpeechSynthesisUtterance,
    createAudio: audio.createAudio,
  });

afterEach(() => {
  vi.useRealTimers();
});

describe('WebSpeechProvider (T7.3, plan 7.2)', () => {
  it('đọc th-TH bằng giọng Thái, huỷ câu đang đọc, truyền rate', async () => {
    const synth = new FakeSynth([voice('Alex', 'en-US'), THAI]);
    await make(synth).speak('สวัสดี', { rate: 0.8 });
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(synth.spoken).toEqual([
      expect.objectContaining({ text: 'สวัสดี', lang: 'th-TH', voice: THAI, rate: 0.8 }),
    ]);
  });

  it('chọn giọng theo tên nếu có; giọng th_TH (Android) cũng nhận', async () => {
    const other = voice('Narisa', 'th_TH');
    const synth = new FakeSynth([THAI, other]);
    await make(synth).speak('ดี', { voice: 'Narisa' });
    expect(synth.spoken[0]?.voice).toBe(other);
  });

  it('voiceStatus: available / missing / unsupported', async () => {
    expect(await make(new FakeSynth([THAI])).voiceStatus()).toBe('available');
    expect(await make(new FakeSynth([voice('Alex', 'en-US')])).voiceStatus()).toBe('missing');
    expect(await make(undefined).voiceStatus()).toBe('unsupported');
  });

  it('giọng nạp muộn (voiceschanged); hết giờ chờ mà chưa có giọng → missing, lần sau hỏi lại', async () => {
    vi.useFakeTimers();
    const late = new FakeSynth();
    const status = make(late).voiceStatus();
    late.loadVoices([THAI]);
    expect(await status).toBe('available');

    const none = new FakeSynth();
    const provider = make(none);
    const first = provider.voiceStatus();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await first).toBe('missing');
    none.voices = [THAI];
    expect(await provider.voiceStatus()).toBe('available');
  });

  it('không có giọng Thái vẫn đọc với lang th-TH (trình duyệt tự chọn)', async () => {
    const synth = new FakeSynth([voice('Alex', 'en-US')]);
    await make(synth).speak('ดี');
    expect(synth.spoken[0]).toMatchObject({ lang: 'th-TH' });
    expect(synth.spoken[0]?.voice).toBeUndefined();
  });

  it('lỗi đọc → reject; bị huỷ (interrupted) → coi như xong', async () => {
    const synth = new FakeSynth([THAI]);
    synth.fail = 'synthesis-failed';
    await expect(make(synth).speak('ดี')).rejects.toThrow('synthesis-failed');
    synth.fail = 'interrupted';
    await expect(make(synth).speak('ดี')).resolves.toBeUndefined();
  });

  it('không có Web Speech → SpeechUnavailableError', async () => {
    await expect(make(undefined).speak('ดี')).rejects.toBeInstanceOf(SpeechUnavailableError);
  });

  it('câu có audio → phát file, không đọc TTS', async () => {
    const synth = new FakeSynth([THAI]);
    const audio = fakeAudio('ended');
    await make(synth, audio).speak('ดี', { audio: 'audio/di.mp3' });
    expect(audio.urls).toEqual(['/content/audio/di.mp3']);
    expect(synth.spoken).toEqual([]);
  });

  it.each(['error', 'reject'] as const)('file audio lỗi (%s) → đọc bằng TTS', async (outcome) => {
    const synth = new FakeSynth([THAI]);
    await make(synth, fakeAudio(outcome)).speak('ดี', { audio: 'audio/di.mp3' });
    expect(synth.spoken.map((u) => u.text)).toEqual(['ดี']);
  });

  it('playById phát audio/<id>.mp3', async () => {
    const audio = fakeAudio('ended');
    await make(new FakeSynth(), audio).playById('s-u01-001');
    expect(audio.urls).toEqual(['/content/audio/s-u01-001.mp3']);
    await expect(make(new FakeSynth(), fakeAudio('error')).playById('x')).rejects.toThrow();
  });
});
