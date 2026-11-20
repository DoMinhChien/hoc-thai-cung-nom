/**
 * Phát âm (plan mục 7.2). Mọi phát âm trong app đi qua interface này.
 * Phase 1: `WebSpeechProvider` (`th-TH`, `apps/web/src/audio`). Phase 2: AzureSpeechProvider.
 */
export interface AudioProvider {
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  playById?(id: string): Promise<void>;
  /** Thiết bị có giọng đọc tiếng Thái không — `missing` → UI hướng dẫn cài (plan 7.2). */
  voiceStatus?(): Promise<VoiceStatus>;
  /** Giọng Thái có trên máy, giọng dễ nghe nhất trước (`rankThaiVoices`) — Cài đặt giọng đọc. */
  thaiVoices?(): Promise<VoiceInfo[]>;
}

export type SpeakOptions = {
  rate?: number;
  /** Tên giọng (`VoiceInfo.name`); không có trên máy → giọng xếp hạng đầu. */
  voice?: string;
  /** File audio của content (`audio/<tên>.mp3`): phát file trước, lỗi thì đọc bằng TTS. */
  audio?: string;
};

/** `unsupported`: trình duyệt không có Web Speech; `missing`: có nhưng không có giọng Thái. */
export type VoiceStatus = 'available' | 'missing' | 'unsupported';

/** Một giọng đọc của máy (Web Speech `SpeechSynthesisVoice` rút gọn). */
export interface VoiceInfo {
  name: string;
  lang: string;
}

/** `natural`: giọng neural (Edge "… Online (Natural)"); `google`: Chrome "Google ไทย"; còn lại `system`. */
export type VoiceQuality = 'natural' | 'google' | 'system';

const NATURAL_VOICE = /natural|online|neural/i;
const GOOGLE_VOICE = /google/i;
/** Giọng nữ Thái hay gặp: Edge Premwadee/Achara, macOS Kanya/Narisa. */
const FEMALE_VOICE = /premwadee|achara|kanya|narisa|female|หญิง/i;

export function voiceQuality(name: string): VoiceQuality {
  if (NATURAL_VOICE.test(name)) return 'natural';
  if (GOOGLE_VOICE.test(name)) return 'google';
  return 'system';
}

const voiceRank = (name: string) => {
  const female = FEMALE_VOICE.test(name);
  switch (voiceQuality(name)) {
    case 'natural':
      return female ? 0 : 1;
    case 'google':
      return 2;
    default:
      return female ? 3 : 4;
  }
};

/**
 * Xếp giọng Thái dễ nghe nhất trước (plan 0.13 #2): giọng Natural/Online/Neural (nữ trước) →
 * Google → giọng nữ → còn lại; cùng hạng giữ thứ tự của máy.
 */
export function rankThaiVoices<T extends { name: string }>(voices: readonly T[]): T[] {
  return voices
    .map((voice, i) => ({ voice, i, rank: voiceRank(voice.name) }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.voice);
}

export type AudioCall =
  { kind: 'speak'; text: string; opts?: SpeakOptions } | { kind: 'playById'; id: string };

/**
 * Bản giả dùng trong test (Web Speech không ổn định trên CI).
 * Assert bằng `calls`, vd. "đã gọi speak với text X".
 */
export class MockAudioProvider implements AudioProvider {
  readonly calls: AudioCall[] = [];

  constructor(
    public status: VoiceStatus = 'available',
    public voices: VoiceInfo[] = [],
  ) {}

  async voiceStatus(): Promise<VoiceStatus> {
    return this.status;
  }

  async thaiVoices(): Promise<VoiceInfo[]> {
    return rankThaiVoices(this.voices);
  }

  async speak(text: string, opts?: SpeakOptions): Promise<void> {
    this.calls.push(opts ? { kind: 'speak', text, opts } : { kind: 'speak', text });
  }

  async playById(id: string): Promise<void> {
    this.calls.push({ kind: 'playById', id });
  }

  /** Các text đã được `speak`, theo thứ tự. */
  get spokenTexts(): string[] {
    return this.calls.flatMap((c) => (c.kind === 'speak' ? [c.text] : []));
  }

  reset(): void {
    this.calls.length = 0;
  }
}
