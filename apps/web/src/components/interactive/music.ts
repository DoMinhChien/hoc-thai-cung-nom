import { useCallback, useEffect, useRef } from 'react';
import { useRepositories, useRepositoryQuery } from '@/data';
import { DEFAULT_FEEDBACK_VOLUME, FEEDBACK_VOLUME_KEY } from './feedback-sound';
import type { GameTheme } from './game-theme';

/** Âm nền màn chơi — mặc định tắt (SCR-08 v2 Q1), nhớ theo người dùng. */
export const GAME_MUSIC_KEY = 'gameMusic';
/** Âm lượng âm nền = 30% âm lượng phản hồi (SCR-08 v2 §Nguyên tắc chung). */
export const MUSIC_VOLUME_RATIO = 0.3;

/** Mỗi theme một vòng nốt nhẹ (Hz), lặp mỗi `LOOP_MS`. */
export const MUSIC_LOOPS: Record<GameTheme, { wave: OscillatorType; notes: number[] }> = {
  sea: { wave: 'sine', notes: [392, 494, 587, 494, 440, 523, 659, 523] },
  space: { wave: 'triangle', notes: [220, 330, 262, 392, 247, 370, 294, 440] },
  garden: { wave: 'sine', notes: [523, 659, 784, 659, 587, 698, 880, 698] },
};
const NOTE_MS = 480;

/** Phát một vòng (test truyền bộ phát giả). `stop()` dừng ngay. */
export type MusicPlayer = (theme: GameTheme, volume: number) => { stop(): void };

let context: AudioContext | null = null;

/**
 * Vòng nhạc tổng hợp bằng Web Audio (không cần file âm thanh → không lo giấy phép). Mỗi nốt có
 * đường bao mềm; lặp tới khi `stop()`.
 */
export const webAudioMusic: MusicPlayer = (theme, volume) => {
  const Ctor = typeof window === 'undefined' ? undefined : window.AudioContext;
  if (!Ctor || volume <= 0) return { stop: () => {} };
  context ??= new Ctor();
  const ctx = context;
  void ctx.resume();
  const { wave, notes } = MUSIC_LOOPS[theme];
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  let i = 0;
  const playNote = () => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const t0 = ctx.currentTime;
    osc.type = wave;
    osc.frequency.value = notes[i % notes.length]!;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.5, t0 + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, t0 + NOTE_MS / 1000);
    osc.connect(env).connect(gain);
    osc.start(t0);
    osc.stop(t0 + NOTE_MS / 1000);
    i++;
  };
  playNote();
  const id = window.setInterval(playNote, NOTE_MS);
  return {
    stop: () => {
      window.clearInterval(id);
      gain.disconnect();
    },
  };
};

export interface BackgroundMusic {
  /** `undefined` khi đang tải cài đặt. */
  enabled: boolean | undefined;
  toggle(): void;
}

/** Âm nền theo theme: chỉ phát khi bật và `playing` (đang chơi, không tạm dừng). */
export function useBackgroundMusic(
  theme: GameTheme,
  playing: boolean,
  player: MusicPlayer = webAudioMusic,
): BackgroundMusic {
  const repos = useRepositories();
  const enabled = useRepositoryQuery((r) => r.settings.get(GAME_MUSIC_KEY, false), []);
  const volume = useRepositoryQuery(
    (r) => r.settings.get(FEEDBACK_VOLUME_KEY, DEFAULT_FEEDBACK_VOLUME),
    [],
  );
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  });
  const on = !!enabled && playing && volume !== undefined && volume > 0;
  useEffect(() => {
    if (!on) return;
    const loop = playerRef.current(theme, (volume ?? 0) * MUSIC_VOLUME_RATIO);
    return () => loop.stop();
  }, [on, theme, volume]);

  const toggle = useCallback(() => {
    void repos?.settings.set(GAME_MUSIC_KEY, !enabled);
  }, [repos, enabled]);
  return { enabled, toggle };
}
