import type { AudioProvider, SpeakOptions } from '@nom/core';
import { useCallback } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Cài đặt giọng đọc (plan 0.13 #2, T9.5.2) — lưu theo người dùng qua `SettingsRepository`. */
export const SPEECH_VOICE_KEY = 'speechVoice';
export const SPEECH_RATE_KEY = 'speechRate';
/** `''` = tự chọn giọng dễ nghe nhất của máy. */
export const AUTO_VOICE = '';
export const SPEECH_RATE_MIN = 0.7;
export const SPEECH_RATE_MAX = 1.2;
/** Câu mẫu của nút "Nghe thử". */
export const SPEECH_SAMPLE = 'สวัสดีค่ะ ยินดีที่ได้รู้จัก';

export interface VoicePreferences {
  /** `undefined` khi đang tải; `AUTO_VOICE` = tự chọn. */
  voice: string | undefined;
  /** `null` = mặc định của provider. */
  rate: number | null | undefined;
  setVoice(voice: string): Promise<void>;
  setRate(rate: number): Promise<void>;
}

export function useVoicePreferences(): VoicePreferences {
  const repos = useRepositories();
  const voice = useRepositoryQuery((r) => r.settings.get(SPEECH_VOICE_KEY, AUTO_VOICE), []);
  const rate = useRepositoryQuery((r) => r.settings.get<number | null>(SPEECH_RATE_KEY, null), []);
  const setVoice = useCallback(
    async (value: string) => {
      await repos?.settings.set(SPEECH_VOICE_KEY, value);
    },
    [repos],
  );
  const setRate = useCallback(
    async (value: number) => {
      await repos?.settings.set(SPEECH_RATE_KEY, value);
    },
    [repos],
  );
  return { voice, rate, setVoice, setRate };
}

/** Thêm giọng/tốc độ đã chọn vào mỗi lần đọc (tùy chọn truyền trực tiếp vẫn thắng). */
export function withVoicePreferences(
  base: AudioProvider,
  current: () => SpeakOptions,
): AudioProvider {
  const provider: AudioProvider = {
    speak: (text, opts) => {
      const merged = { ...current(), ...opts };
      return Object.keys(merged).length > 0 ? base.speak(text, merged) : base.speak(text);
    },
  };
  if (base.playById) provider.playById = base.playById.bind(base);
  if (base.voiceStatus) provider.voiceStatus = base.voiceStatus.bind(base);
  if (base.thaiVoices) provider.thaiVoices = base.thaiVoices.bind(base);
  return provider;
}
