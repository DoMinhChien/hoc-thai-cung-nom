/**
 * Phát âm (plan mục 7.2). Mọi phát âm trong app đi qua interface này.
 * Phase 1: `WebSpeechProvider` (`th-TH`, `apps/web/src/audio`). Phase 2: AzureSpeechProvider.
 */
export interface AudioProvider {
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  playById?(id: string): Promise<void>;
  /** Thiết bị có giọng đọc tiếng Thái không — `missing` → UI hướng dẫn cài (plan 7.2). */
  voiceStatus?(): Promise<VoiceStatus>;
}

export type SpeakOptions = {
  rate?: number;
  voice?: string;
  /** File audio của content (`audio/<tên>.mp3`): phát file trước, lỗi thì đọc bằng TTS. */
  audio?: string;
};

/** `unsupported`: trình duyệt không có Web Speech; `missing`: có nhưng không có giọng Thái. */
export type VoiceStatus = 'available' | 'missing' | 'unsupported';

export type AudioCall =
  { kind: 'speak'; text: string; opts?: SpeakOptions } | { kind: 'playById'; id: string };

/**
 * Bản giả dùng trong test (Web Speech không ổn định trên CI).
 * Assert bằng `calls`, vd. "đã gọi speak với text X".
 */
export class MockAudioProvider implements AudioProvider {
  readonly calls: AudioCall[] = [];

  constructor(public status: VoiceStatus = 'available') {}

  async voiceStatus(): Promise<VoiceStatus> {
    return this.status;
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
