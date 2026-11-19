import { GAME_IDS, type GameAvailability, type GameId } from '@nom/core';
import { ArrowLeftRight, Layers, Shuffle, ThumbsUp, type LucideIcon } from 'lucide-react';
import { t } from '@/i18n';

/** Thứ tự card ở `/games` = phím tắt `1`–`4` (SCR-08 §A). */
export const GAME_ORDER: readonly GameId[] = GAME_IDS;

export const GAME_ICON: Record<GameId, LucideIcon> = {
  match: Layers,
  'true-false': ThumbsUp,
  'sentence-rush': Shuffle,
  'classifier-rush': ArrowLeftRight,
};

export const isGameId = (id: string | undefined): id is GameId =>
  (GAME_IDS as readonly string[]).includes(id ?? '');

export const gameName = (id: GameId) => t(`games.name.${id}`);

/** Lý do khóa trò (SCR-08 §A). */
export function lockReason(result: GameAvailability): string | null {
  if (result.ok) return null;
  const params = { need: result.need, have: result.have };
  if (result.reason === 'sentences') return t('games.lockedSentences', params);
  if (result.reason === 'classifiers') return t('games.lockedClassifiers');
  return t('games.lockedWords', params);
}

const minutes = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Kỷ lục hiển thị: Ghép cặp theo thời gian, trò khác theo điểm. */
export function formatRecord(id: GameId, best: { score: number; durationMs: number }): string {
  return id === 'match'
    ? minutes(best.durationMs)
    : t('games.points', { n: new Intl.NumberFormat('vi-VN').format(best.score) });
}

/** Khóa cài đặt nguồn đã chọn ở `/games` (nhớ lựa chọn — SCR-08 §A). */
export const GAME_SOURCE_KEY = 'gameSource';
