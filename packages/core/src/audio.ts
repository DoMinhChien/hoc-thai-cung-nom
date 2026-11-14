/**
 * Phát âm (plan mục 7.2). Mọi phát âm trong app đi qua interface này.
 * Phase 1: WebSpeechProvider (`th-TH`) — làm ở milestone dùng audio. Phase 2: AzureSpeechProvider.
 */
export interface AudioProvider {
  speak(text: string, opts?: SpeakOptions): Promise<void>;
  playById?(id: string): Promise<void>;
}

export type SpeakOptions = {
  rate?: number;
  voice?: string;
};

export type AudioCall =
  | { kind: 'speak'; text: string; opts?: SpeakOptions }
  | { kind: 'playById'; id: string };

/**
 * Bản giả dùng trong test (Web Speech không ổn định trên CI).
 * Assert bằng `calls`, vd. "đã gọi speak với text X".
 */
export class MockAudioProvider implements AudioProvider {
  readonly calls: AudioCall[] = [];

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
