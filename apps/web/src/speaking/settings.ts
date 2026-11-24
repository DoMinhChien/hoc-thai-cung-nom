import { useCallback } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Nhận dạng giọng nói (Mức 2): `null` = chưa hỏi; mặc định tắt cho tới khi người học đồng ý (§4). */
export const SPEAKING_ASR_KEY = 'speakingAsr';
/** Đã xem hộp thoại "Cho phép dùng micro" (§5). */
export const SPEAKING_MIC_INTRO_KEY = 'speakingMicIntro';

export interface SpeakingSettings {
  /** `undefined` khi đang tải. */
  asr: boolean | null | undefined;
  micIntroSeen: boolean | undefined;
  setAsr(on: boolean): Promise<void>;
  setMicIntroSeen(): Promise<void>;
}

export function useSpeakingSettings(): SpeakingSettings {
  const repos = useRepositories();
  const asr = useRepositoryQuery((r) => r.settings.get<boolean | null>(SPEAKING_ASR_KEY, null), []);
  const micIntroSeen = useRepositoryQuery((r) => r.settings.get(SPEAKING_MIC_INTRO_KEY, false), []);
  const setAsr = useCallback(
    async (on: boolean) => {
      await repos?.settings.set(SPEAKING_ASR_KEY, on);
    },
    [repos],
  );
  const setMicIntroSeen = useCallback(async () => {
    await repos?.settings.set(SPEAKING_MIC_INTRO_KEY, true);
  }, [repos]);
  return { asr, micIntroSeen, setAsr, setMicIntroSeen };
}
