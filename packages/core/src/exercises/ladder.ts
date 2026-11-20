/**
 * Bậc dịch theo câu (E-11): câu mới bắt đầu ở bậc 2, đúng 2 lần liên tiếp → lên bậc kế tiếp, sai →
 * lùi 1 bậc (lưu theo câu). Bậc chọn loại câu hỏi: 2 → E-05 / E-04, 3 → E-06 (có thẻ nhiễu),
 * 4 → E-07 (gõ).
 */
import type { ProgressRepository } from '../data/repositories';
import { newId } from '../data/memory';
import { SENTENCE_LEVELS, type SentenceLevel, type SentenceLevelRecord } from '../data/records';
import type { ExerciseType } from './exercises';

export const START_LEVEL: SentenceLevel = 2;
export const LEVEL_UP_STREAK = 2;

const MIN_LEVEL = SENTENCE_LEVELS[0];
const MAX_LEVEL = SENTENCE_LEVELS[SENTENCE_LEVELS.length - 1]!;

/** Loại câu hỏi của từng bậc, theo thứ tự ưu tiên. */
export const LEVEL_EXERCISES: Record<SentenceLevel, readonly ExerciseType[]> = {
  2: ['E-05', 'E-04'],
  3: ['E-06'],
  4: ['E-07'],
};

export interface LevelState {
  level: SentenceLevel;
  streak: number;
}

/** Bậc sau một lần trả lời (đúng gồm cả "Hard": gợi ý, sai dấu). */
export function nextLevel(current: LevelState | undefined, correct: boolean): LevelState {
  const { level, streak } = current ?? { level: START_LEVEL, streak: 0 };
  if (!correct) return { level: Math.max(MIN_LEVEL, level - 1) as SentenceLevel, streak: 0 };
  if (level === MAX_LEVEL) return { level, streak: Math.min(streak + 1, LEVEL_UP_STREAK) };
  return streak + 1 >= LEVEL_UP_STREAK
    ? { level: (level + 1) as SentenceLevel, streak: 0 }
    : { level, streak: streak + 1 };
}

/** Ghi bậc mới của câu sau một lần trả lời; trả về bản ghi đã lưu. */
export async function updateSentenceLevel(
  progress: Pick<ProgressRepository, 'getSentenceLevel' | 'putSentenceLevel'>,
  sentenceId: string,
  correct: boolean,
  now: Date,
): Promise<SentenceLevelRecord> {
  const existing = await progress.getSentenceLevel(sentenceId);
  const record: SentenceLevelRecord = {
    id: existing?.id ?? newId(),
    sentenceId,
    ...nextLevel(existing, correct),
    updatedAt: now.toISOString(),
  };
  await progress.putSentenceLevel(record);
  return record;
}
