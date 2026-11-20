import { useCallback, useEffect, useRef } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';

/** Cài đặt bật/tắt âm phản hồi (F-13) — lưu qua `SettingsRepository`, mặc định bật. */
export const FEEDBACK_SOUND_KEY = 'feedbackSound';
/** Âm lượng âm phản hồi 0–1 (Cài đặt, T9.5.1); 0 = tắt. */
export const FEEDBACK_VOLUME_KEY = 'feedbackVolume';
export const DEFAULT_FEEDBACK_VOLUME = 0.4;
/** Giọng đọc đi sau âm phản hồi chừng này (ms) để không phát chồng (T9.5.1). */
export const FEEDBACK_SPEECH_DELAY_MS = 150;

/** `complete`: xong phiên / bài / lượt chơi. */
export type FeedbackSoundKind = 'correct' | 'wrong' | 'complete';

interface Note {
  /** Hz. */
  freq: number;
  /** Bắt đầu sau (s). */
  at: number;
  /** Dài (s). */
  dur: number;
}

/**
 * Âm phản hồi (plan 0.13 #1): đúng = 3 nốt đi lên (~0,3 s), sai = 2 nốt đi xuống mềm (~0,35 s),
 * hoàn thành = hợp âm rải ~0,8 s. Tổng hợp bằng Web Audio — không cần file, không vướng bản quyền.
 */
export const FEEDBACK_NOTES: Record<FeedbackSoundKind, { wave: OscillatorType; notes: Note[] }> = {
  correct: {
    wave: 'sine',
    notes: [
      { freq: 783.99, at: 0, dur: 0.1 },
      { freq: 1046.5, at: 0.08, dur: 0.1 },
      { freq: 1318.51, at: 0.16, dur: 0.16 },
    ],
  },
  wrong: {
    wave: 'triangle',
    notes: [
      { freq: 392, at: 0, dur: 0.15 },
      { freq: 311.13, at: 0.13, dur: 0.22 },
    ],
  },
  complete: {
    wave: 'sine',
    notes: [
      { freq: 523.25, at: 0, dur: 0.14 },
      { freq: 659.25, at: 0.12, dur: 0.14 },
      { freq: 783.99, at: 0.24, dur: 0.14 },
      { freq: 1046.5, at: 0.36, dur: 0.44 },
    ],
  },
};

/** Phát một âm phản hồi ở âm lượng 0–1. Không có Web Audio → im lặng. */
export type TonePlayer = (kind: FeedbackSoundKind, volume: number) => void;

let context: AudioContext | null = null;

export const webAudioTone: TonePlayer = (kind, volume) => {
  const Ctor =
    globalThis.AudioContext ??
    (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  context ??= new Ctor();
  // Tạo trước lần chạm đầu tiên thì bị trình duyệt treo (autoplay) → đánh thức.
  if (context.state === 'suspended') void context.resume().catch(() => {});
  const { wave, notes } = FEEDBACK_NOTES[kind];
  const t0 = context.currentTime;
  const peak = volume * 0.5;
  for (const { freq, at, dur } of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    const start = t0 + at;
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + dur);
  }
};

export interface FeedbackSound {
  /** `undefined` khi đang tải cài đặt. */
  enabled: boolean | undefined;
  /** 0–1; `undefined` khi đang tải. */
  volume: number | undefined;
  setEnabled(enabled: boolean): Promise<void>;
  setVolume(volume: number): Promise<void>;
  play(kind: FeedbackSoundKind): void;
}

export function useFeedbackSound(player: TonePlayer = webAudioTone): FeedbackSound {
  const repos = useRepositories();
  const enabled = useRepositoryQuery((r) => r.settings.get(FEEDBACK_SOUND_KEY, true), []);
  const volume = useRepositoryQuery(
    (r) => r.settings.get(FEEDBACK_VOLUME_KEY, DEFAULT_FEEDBACK_VOLUME),
    [],
  );
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
  const setVolume = useCallback(
    async (value: number) => {
      await repos?.settings.set(FEEDBACK_VOLUME_KEY, value);
    },
    [repos],
  );
  const play = useCallback(
    (kind: FeedbackSoundKind) => {
      if (enabled && volume) playerRef.current(kind, volume);
    },
    [enabled, volume],
  );
  return { enabled, volume, setEnabled, setVolume, play };
}

/** Phát âm "hoàn thành" một lần khi màn kết quả hiện (`active`) và cài đặt đã tải. */
export function useCompletionSound(active = true, player?: TonePlayer) {
  const sound = useFeedbackSound(player);
  const played = useRef(false);
  const ready = sound.enabled !== undefined && sound.volume !== undefined;
  const { play } = sound;
  useEffect(() => {
    if (!active || !ready || played.current) return;
    played.current = true;
    play('complete');
  }, [active, ready, play]);
}
