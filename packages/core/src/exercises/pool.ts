/**
 * Kho mục làm đề cho Bài tập (plan 0.5, M9): từ có nghĩa, câu có đáp án Thái, cặp hỏi ↔ đáp lấy từ
 * hội thoại. Câu draft thiếu `th` không dùng làm câu hỏi (SCR-06 §B).
 */
import type { UnitBundle } from '../content/bundle';

/** Loại mục được chấm: từ / câu có thẻ SRS; dòng hội thoại (E-09) chỉ ghi lượt trả lời. */
export type ExerciseItemType = 'word' | 'sentence' | 'dialogue';

export interface ExerciseItemRef {
  itemType: ExerciseItemType;
  itemId: string;
}

export interface PoolWord {
  id: string;
  unitId: string;
  lessonId: string;
  thai: string;
  /** Nghĩa hiển thị (các nghĩa nối bằng "; "). */
  meaning: string;
  classifier?: string;
}

export interface PoolSentence {
  id: string;
  unitId: string;
  lessonId: string;
  vi: string;
  th: string;
  /** `th` + `th_alt` (E-07, E-06). */
  accepted: string[];
  tokens: string[];
  distractors: string[];
  grammarId?: string;
}

/** Cặp câu hỏi ↔ câu trả lời liên tiếp trong một hội thoại (E-09). `id` = `<dialogue>#<dòng hỏi>`. */
export interface QaPair {
  id: string;
  unitId: string;
  lessonId: string;
  question: string;
  answer: string;
}

export interface ExercisePool {
  words: PoolWord[];
  sentences: PoolSentence[];
  qa: QaPair[];
}

/** Dòng hỏi: bản dịch kết thúc bằng "?" hoặc câu Thái có "?". */
const isQuestion = (line: { th: string; vi: string }) =>
  line.vi.trim().endsWith('?') || line.th.includes('?');

export function exercisePool(bundles: readonly UnitBundle[]): ExercisePool {
  const pool: ExercisePool = { words: [], sentences: [], qa: [] };
  for (const b of bundles) {
    const unitId = b.unit.unit_id;
    for (const w of b.words) {
      if (w.meaning_vi.length === 0) continue;
      pool.words.push({
        id: w.id,
        unitId,
        lessonId: w.lesson_id,
        thai: w.thai,
        meaning: w.meaning_vi.join('; '),
        ...(w.classifier ? { classifier: w.classifier } : {}),
      });
    }
    for (const s of b.sentences) {
      if (s.th === undefined) continue;
      pool.sentences.push({
        id: s.id,
        unitId,
        lessonId: s.lesson_id,
        vi: s.vi,
        th: s.th,
        accepted: [s.th, ...s.th_alt],
        tokens: s.tokens,
        distractors: s.distractors,
        ...(s.grammar_id ? { grammarId: s.grammar_id } : {}),
      });
    }
    for (const d of b.dialogues) {
      d.lines.forEach((line, i) => {
        const next = d.lines[i + 1];
        if (!next || next.speaker === line.speaker || !isQuestion(line) || isQuestion(next)) return;
        pool.qa.push({
          id: `${d.id}#${i}`,
          unitId,
          lessonId: d.lesson_id,
          question: line.th,
          answer: next.th,
        });
      });
    }
  }
  return pool;
}
