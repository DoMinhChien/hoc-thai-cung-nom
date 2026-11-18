import { useCallback, useEffect } from 'react';
import { useAudio } from '@/audio/useAudio';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Cài đặt tự đọc chữ Thái khi hiện câu trong trò chơi (v7.3) — mặc định bật. */
export const AUTO_SPEAK_KEY = 'gameAutoSpeak';

export interface AutoSpeech {
  /** `undefined` khi đang tải cài đặt. */
  enabled: boolean | undefined;
  /** Máy không có giọng Thái → không đọc được (nút vô hiệu, trò vẫn chơi được — SCR-08). */
  available: boolean;
  setEnabled(enabled: boolean): Promise<void>;
}

export function useAutoSpeech(): AutoSpeech {
  const repos = useRepositories();
  const enabled = useRepositoryQuery((r) => r.settings.get(AUTO_SPEAK_KEY, true), []);
  const status = useVoiceStatus();
  const setEnabled = useCallback(
    async (value: boolean) => {
      await repos?.settings.set(AUTO_SPEAK_KEY, value);
    },
    [repos],
  );
  return { enabled, available: status === 'available', setEnabled };
}

/**
 * Đọc `text` (tiếng Thái) qua `AudioProvider` mỗi khi `cue` đổi (câu mới), nếu được bật.
 * Lỗi phát âm bỏ qua — trò vẫn chơi được.
 */
export function useSpeakOnCue(text: string | null, cue: unknown, speech: AutoSpeech) {
  const audio = useAudio();
  const on = speech.enabled === true && speech.available;
  useEffect(() => {
    if (!on || !text) return;
    void audio.speak(text).catch(() => {});
    // Chỉ đọc khi sang câu mới, không đọc lại khi text giữ nguyên.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, on, audio]);
}
