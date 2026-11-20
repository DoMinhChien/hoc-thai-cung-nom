/** Trò arcade M9.6 (plan 0.14) — chưa vào `GAMES` / `/games` cho tới khi có UI (SCR-08 v2, T9.6.4). */
import { airplane } from './airplane';
import type { ArcadeGameId } from './arcade';
import { gameshow } from './gameshow';
import { maze } from './maze';
import { whackAMole } from './whack-a-mole';

export const ARCADE_GAMES = {
  'whack-a-mole': whackAMole,
  gameshow,
  airplane,
  maze,
} as const satisfies Record<ArcadeGameId, { id: ArcadeGameId }>;

export * from './airplane';
export * from './arcade';
export * from './gameshow';
export * from './maze';
export * from './whack-a-mole';
