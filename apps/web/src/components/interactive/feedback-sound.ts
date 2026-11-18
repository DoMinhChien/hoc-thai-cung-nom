import { useCallback, useEffect, useRef } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Cài đặt bật/tắt âm phản hồi (F-13) — lưu qua `SettingsRepository`, mặc định bật. */
export const FEEDBACK_SOUND_KEY = 'feedbackSound';

/** Phát một tiếng ngắn: đúng = cao, sai = trầm. Không có Web Audio → im lặng. */
export type TonePlayer = (correct: boolean) => void;

let context: AudioContext | null = null;

/** Tiếng bíp ~0,12 s bằng Web Audio (không cần file âm thanh). */
export const webAudioTone: TonePlayer = (correct) => {
  const Ctor = globalThis.AudioContext;
  if (!Ctor) return;
  context ??= new Ctor();
  const osc = context.createOscillator();
  const gain = context.createGain();
  const t0 = context.currentTime;
  osc.frequency.value = correct ? 880 : 220;
  gain.gain.setValueAtTime(0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  osc.connect(gain).connect(context.destination);
  osc.start(t0);
  osc.stop(t0 + 0.12);
};

export interface FeedbackSound {
  /** `undefined` khi đang tải cài đặt. */
  enabled: boolean | undefined;
  setEnabled(enabled: boolean): Promise<void>;
  play(correct: boolean): void;
}

export function useFeedbackSound(player: TonePlayer = webAudioTone): FeedbackSound {
  const repos = useRepositories();
  const enabled = useRepositoryQuery((r) => r.settings.get(FEEDBACK_SOUND_KEY, true), []);
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  });

  const setEnabled = useCallback(
    async (value: boolean) => {
      await repos?.settings.set(FEEDBACK_SOUND_KEY, value);
    },
    [repos],
  );
  const play = useCallback(
    (correct: boolean) => {
      if (enabled) playerRef.current(correct);
    },
    [enabled],
  );
  return { enabled, setEnabled, play };
}
