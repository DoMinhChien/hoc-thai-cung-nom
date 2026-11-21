import type { ArcadeGame, ArcadeState, GameSource } from '@nom/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAutoSpeech,
  useFeedbackSound,
  useGameLoop,
  type AutoSpeech,
  type FeedbackSound,
  type FrameScheduler,
  type GameLoop,
  type TonePlayer,
} from '@/components/interactive';

export interface ArcadeRun<I, S extends ArcadeState> {
  state: S;
  loop: GameLoop;
  sound: FeedbackSound;
  speech: AutoSpeech;
  /** Đã qua màn đếm 3·2·1. */
  started: boolean;
  start: () => void;
  /** Thao tác người chơi — áp ngay (`tick` với 0 ms); bỏ qua khi chưa bắt đầu, tạm dừng, đã xong. */
  input: (input: I) => void;
  /**
   * Cho thời gian trôi `ms` một lần (chế độ từng bước khi giảm chuyển động — SCR-08 v2 §B.3),
   * kèm thao tác nếu có. Cùng điều kiện như `input`.
   */
  advanceBy: (ms: number, input?: I) => void;
  /** Đổi trạng thái ngoài luồng `tick` (vd. bật/tắt chế độ từng bước của Mê cung). */
  update: (fn: (state: S) => S) => void;
}

export interface ArcadeRunOptions {
  /** Test truyền bộ lập lịch khung hình giả / máy phát âm giả. */
  frames?: FrameScheduler;
  player?: TonePlayer;
  /** `true` = không chạy vòng lặp khung hình; thời gian chỉ trôi qua `advanceBy`. */
  manual?: boolean;
}

/**
 * Một lượt trò arcade (M9.6): tạo lượt theo seed, vòng lặp khung hình chạy `tick(state, dtMs)`
 * (tạm dừng khi rời tab), âm phản hồi đúng/sai mỗi khi trò ghi một câu trả lời.
 */
export function useArcadeRun<R, I, S extends ArcadeState>(
  game: ArcadeGame<R, I, S>,
  source: GameSource,
  seed: number,
  { frames, player, manual = false }: ArcadeRunOptions = {},
): ArcadeRun<I, S> {
  const [state, setState] = useState(() => game.start(game.generateRound(source, seed)));
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  const running = started && state.status !== 'finished';
  const loop = useGameLoop({
    running: running && !manual,
    onFrame: (dtMs) => setState((s) => game.tick(s, dtMs)),
    ...(frames ? { frames } : {}),
  });
  const sound = useFeedbackSound(player);
  const speech = useAutoSpeech();

  const play = useRef(sound.play);
  useEffect(() => {
    play.current = sound.play;
  });
  useEffect(() => {
    if (state.feedback) play.current(state.feedback.correct ? 'correct' : 'wrong');
  }, [state.feedback]);

  const active = running && !loop.paused;
  const input = useCallback(
    (i: I) => {
      if (active) setState((s) => game.tick(s, 0, i));
    },
    [game, active],
  );
  const advanceBy = useCallback(
    (ms: number, i?: I) => {
      if (active) setState((s) => game.tick(s, ms, i));
    },
    [game, active],
  );
  return { state, loop, sound, speech, started, start, input, advanceBy, update: setState };
}
