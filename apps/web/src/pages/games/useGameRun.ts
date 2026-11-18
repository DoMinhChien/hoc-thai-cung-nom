import type { Game, GameSource, GameState } from '@nom/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAutoSpeech,
  useCountdown,
  useFeedbackSound,
  type AutoSpeech,
  type Countdown,
  type FeedbackSound,
} from '@/components/interactive';

export interface GameRun<A, S extends GameState> {
  state: S;
  clock: Countdown;
  sound: FeedbackSound;
  speech: AutoSpeech;
  /** Đã qua màn đếm 3·2·1. */
  started: boolean;
  start: () => void;
  answer: (answer: A) => void;
  /** Rời màn phản hồi sang câu tiếp. */
  advance: () => void;
}

/**
 * Một lượt chơi: tạo lượt theo seed, đồng hồ trò chơi (tạm dừng khi rời tab; trò nhận thời gian
 * đã chạy làm `now`), tick hết giờ, âm phản hồi đúng/sai (kể cả khi hết giờ).
 */
export function useGameRun<R, A, S extends GameState>(
  game: Game<R, A, S>,
  source: GameSource,
  seed: number,
): GameRun<A, S> {
  const [state, setState] = useState(() => game.start(game.generateRound(source, seed), 0));
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  const clock = useCountdown({
    durationMs: game.durationMs,
    running: started && state.status !== 'finished',
    onTick: (elapsed) => setState((s) => game.tick(s, elapsed)),
  });
  const sound = useFeedbackSound();
  const speech = useAutoSpeech();
  const { now } = clock;

  const play = useRef(sound.play);
  useEffect(() => {
    play.current = sound.play;
  });
  useEffect(() => {
    if (state.feedback) play.current(state.feedback.correct);
  }, [state.feedback]);

  const answer = useCallback((a: A) => setState((s) => game.answer(s, a, now())), [game, now]);
  const advance = useCallback(() => setState((s) => game.next(s, now())), [game, now]);
  return { state, clock, sound, speech, started, start, answer, advance };
}
