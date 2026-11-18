/** Danh sách trò chơi (F-14): thêm trò = thêm module + một dòng ở đây. */
import { classifierRush } from './classifier-rush';
import type { GameId } from './game';
import { matchPairs } from './match';
import { sentenceRush } from './sentence-rush';
import { trueFalse } from './true-false';

export const GAMES = {
  match: matchPairs,
  'true-false': trueFalse,
  'sentence-rush': sentenceRush,
  'classifier-rush': classifierRush,
} as const satisfies Record<GameId, { id: GameId }>;

export * from './classifier-rush';
export * from './game';
export * from './match';
export * from './rapid';
export * from './results';
export * from './rng';
export * from './sentence-rush';
export * from './source';
export * from './true-false';
