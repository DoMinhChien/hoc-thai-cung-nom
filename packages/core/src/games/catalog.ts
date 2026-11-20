/**
 * Danh mục 8 trò (plan 0.14, M9.6 T9.6.4): id chung cho trò lượt (`GAMES`) và trò arcade
 * (`ARCADE_GAMES`), nhãn kỹ năng để lọc ở `/games`. Kỷ lục + "cần ôn" lưu chung cho cả hai loại.
 */
import { ARCADE_GAME_IDS, ARCADE_GAMES, type ArcadeGameId } from './arcade';
import { classifierRush } from './classifier-rush';
import { GAME_IDS, type GameAvailability, type GameId } from './game';
import { matchPairs } from './match';
import { sentenceRush } from './sentence-rush';
import type { GameSource } from './source';
import { trueFalse } from './true-false';

/** Danh sách trò lượt (F-14): thêm trò = thêm module + một dòng ở đây. */
export const GAMES = {
  match: matchPairs,
  'true-false': trueFalse,
  'sentence-rush': sentenceRush,
  'classifier-rush': classifierRush,
} as const satisfies Record<GameId, { id: GameId }>;

export type AnyGameId = GameId | ArcadeGameId;

/** Thứ tự mặc định: 4 trò cũ rồi 4 trò arcade. */
export const ALL_GAME_IDS: readonly AnyGameId[] = [...GAME_IDS, ...ARCADE_GAME_IDS];

export const isAnyGameId = (id: string | undefined): id is AnyGameId =>
  (ALL_GAME_IDS as readonly string[]).includes(id ?? '');

export const isArcadeGameId = (id: AnyGameId): id is ArcadeGameId =>
  (ARCADE_GAME_IDS as readonly string[]).includes(id);

/**
 * Nhãn kỹ năng (plan 0.14: Từ vựng / Câu / Loại từ / Nghe). "Nghe" thêm khi có trò ra đề bằng
 * audio.
 */
export const GAME_SKILLS = ['vocab', 'sentence', 'classifier'] as const;
export type GameSkill = (typeof GAME_SKILLS)[number];

/** Kỹ năng mỗi trò luyện — theo nội dung trò thực sự dùng làm đề. */
export const SKILLS_BY_GAME: Record<AnyGameId, readonly GameSkill[]> = {
  match: ['vocab'],
  'true-false': ['vocab'],
  'sentence-rush': ['sentence'],
  'classifier-rush': ['classifier'],
  'whack-a-mole': ['vocab'],
  gameshow: ['vocab', 'sentence', 'classifier'],
  airplane: ['vocab', 'sentence'],
  maze: ['vocab'],
};

/** Trò có kỹ năng `skill` (`null` = mọi trò), giữ thứ tự `ids`. */
export function gamesWithSkill(
  skill: GameSkill | null,
  ids: readonly AnyGameId[] = ALL_GAME_IDS,
): AnyGameId[] {
  return ids.filter((id) => skill === null || SKILLS_BY_GAME[id].includes(skill));
}

/** Trò mở được với nguồn này không (trò khóa kèm lý do, SCR-08 §A). */
export function gameAvailability(id: AnyGameId, source: GameSource): GameAvailability {
  return isArcadeGameId(id)
    ? ARCADE_GAMES[id].availability(source)
    : GAMES[id].availability(source);
}
