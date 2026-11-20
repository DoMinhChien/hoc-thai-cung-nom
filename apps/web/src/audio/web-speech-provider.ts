import {
  rankThaiVoices,
  type AudioProvider,
  type SpeakOptions,
  type VoiceInfo,
  type VoiceStatus,
} from '@nom/core';

export const THAI_LANG = 'th-TH';
/** Mặc định dễ nghe hơn giọng máy gốc (plan 0.13 #2): chậm hơn một chút, cao hơn một chút. */
export const DEFAULT_SPEECH_RATE = 0.95;
export const DEFAULT_SPEECH_PITCH = 1.05;
/** Chờ `voiceschanged` tối đa (Chrome nạp danh sách giọng bất đồng bộ). */
const VOICES_TIMEOUT_MS = 1000;

/** Phụ thuộc trình duyệt — test truyền bản giả. */
export interface WebSpeechDeps {
  /** Thư mục chứa `audio/…` của content, kết thúc bằng `/`. */
  baseUrl: string;
  synth?: SpeechSynthesis;
  createUtterance?: (text: string) => SpeechSynthesisUtterance;
  createAudio?: (url: string) => HTMLAudioElement;
}

export class SpeechUnavailableError extends Error {
  constructor() {
    super('Trình duyệt không hỗ trợ đọc bằng giọng máy (Web Speech)');
    this.name = 'SpeechUnavailableError';
  }
}

const isThai = (voice: SpeechSynthesisVoice) =>
  voice.lang.replace('_', '-').toLowerCase().startsWith('th');

/**
 * Phase 1 (plan 7.2): đọc tiếng Thái bằng Web Speech (`th-TH`); câu có file audio thì phát file trước.
 * Không chọn giọng → giọng Thái dễ nghe nhất của máy (`rankThaiVoices`, plan 0.13).
 * Mỗi lần đọc huỷ câu đang đọc dở (bấm ▶ liên tiếp không bị xếp hàng).
 */
export class WebSpeechProvider implements AudioProvider {
  private readonly synth: SpeechSynthesis | undefined;
  private readonly createUtterance: (text: string) => SpeechSynthesisUtterance;
  private readonly createAudio: (url: string) => HTMLAudioElement;
  private voices: Promise<SpeechSynthesisVoice[]> | null = null;

  constructor(private readonly deps: WebSpeechDeps) {
    this.synth = 'synth' in deps ? deps.synth : globalThis.speechSynthesis;
    this.createUtterance = deps.createUtterance ?? ((text) => new SpeechSynthesisUtterance(text));
    this.createAudio = deps.createAudio ?? ((url) => new Audio(url));
  }

  async voiceStatus(): Promise<VoiceStatus> {
    if (!this.synth) return 'unsupported';
    return (await this.loadVoices()).some(isThai) ? 'available' : 'missing';
  }

  async thaiVoices(): Promise<VoiceInfo[]> {
    if (!this.synth) return [];
    return rankThaiVoices((await this.loadVoices()).filter(isThai)).map(({ name, lang }) => ({
      name,
      lang,
    }));
  }

  async speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    if (opts.audio) {
      try {
        return await this.playFile(opts.audio);
      } catch {
        // File thiếu/hỏng → đọc bằng TTS.
      }
    }
    const synth = this.synth;
    if (!synth) throw new SpeechUnavailableError();
    const voices = rankThaiVoices((await this.loadVoices()).filter(isThai));
    const utterance = this.createUtterance(text);
    utterance.lang = THAI_LANG;
    const voice = voices.find((v) => v.name === opts.voice) ?? voices[0];
    if (voice) utterance.voice = voice;
    utterance.rate = opts.rate ?? DEFAULT_SPEECH_RATE;
    utterance.pitch = DEFAULT_SPEECH_PITCH;

    synth.cancel();
    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) =>
        // Bị câu sau huỷ không phải lỗi.
        event.error === 'interrupted' || event.error === 'canceled'
          ? resolve()
          : reject(new Error(`Không đọc được: ${event.error}`));
      synth.speak(utterance);
    });
  }

  /** File `audio/<id>.mp3` của content (plan 7.2). */
  playById(id: string): Promise<void> {
    return this.playFile(`audio/${id}.mp3`);
  }

  private async playFile(path: string): Promise<void> {
    const audio = this.createAudio(this.deps.baseUrl + path);
    const ended = new Promise<void>((resolve, reject) => {
      audio.addEventListener('ended', () => resolve(), { once: true });
      audio.addEventListener('error', () => reject(new Error(`Không phát được ${path}`)), {
        once: true,
      });
    });
    ended.catch(() => {}); // play() lỗi trước thì không còn ai chờ `ended`.
    await audio.play();
    await ended;
  }

  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    const synth = this.synth!;
    this.voices ??= new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const now = synth.getVoices();
      if (now.length > 0) return resolve(now);
      const done = () => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', done);
        resolve(synth.getVoices());
      };
      const timer = setTimeout(done, VOICES_TIMEOUT_MS);
      synth.addEventListener('voiceschanged', done);
    }).then((voices) => {
      // Chưa có giọng nào (máy đang nạp/cài) → lần sau hỏi lại.
      if (voices.length === 0) this.voices = null;
      return voices;
    });
    return this.voices;
  }
}
