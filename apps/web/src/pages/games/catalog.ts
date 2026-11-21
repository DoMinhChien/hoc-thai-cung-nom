import {
  ALL_GAME_IDS,
  GAME_SKILLS,
  isAnyGameId,
  type AnyGameId,
  type GameAvailability,
  type GameSkill,
} from '@nom/core';
import { t } from '@/i18n';

/** Thứ tự card ở `/games` = phím tắt `1`–`8` (SCR-08 v2 §A) — không đánh lại khi lọc. */
export const GAME_ORDER: readonly AnyGameId[] = ALL_GAME_IDS;

export const isGameId = isAnyGameId;

export const gameName = (id: AnyGameId) => t(`games.name.${id}`);

/** Bộ lọc kỹ năng trong URL (`?skill=`); `null` = tất cả. */
export const parseSkill = (value: string | null): GameSkill | null =>
  (GAME_SKILLS as readonly string[]).includes(value ?? '') ? (value as GameSkill) : null;

/** Lý do khóa trò (SCR-08 v2 §A). */
export function lockReason(result: GameAvailability): string | null {
  if (result.ok) return null;
  const params = { need: result.need, have: result.have };
  if (result.reason === 'sentences') return t('games.lockedSentences', params);
  if (result.reason === 'classifiers') return t('games.lockedClassifiers');
  if (result.reason === 'items') return t('games.lockedItems', params);
  return t('games.lockedWords', params);
}

const minutes = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Kỷ lục hiển thị: Ghép cặp theo thời gian, trò khác theo điểm. */
export function formatRecord(id: AnyGameId, best: { score: number; durationMs: number }): string {
  return id === 'match'
    ? minutes(best.durationMs)
    : t('games.points', { n: new Intl.NumberFormat('vi-VN').format(best.score) });
}

/** Khóa cài đặt nguồn đã chọn ở `/games` (nhớ lựa chọn — SCR-08 §A). */
export const GAME_SOURCE_KEY = 'gameSource';
