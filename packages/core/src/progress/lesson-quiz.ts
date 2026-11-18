/**
 * Bước Bài tập của bài học ở M7 (SCR-05): khung + 2 loại có sẵn từ component M7.5 — chọn nghĩa của
 * từ (4 lựa chọn) và xếp thẻ thành câu. Loại bài tập đầy đủ (E-01..E-14) ở M9. Hoàn thành bài khi
 * đạt `LESSON_PASS_SCORE`.
 */
import type { BuiltSentence, UnitBundle } from '../content/bundle';
import { createRng } from '../games/rng';

export const QUIZ_MAX_QUESTIONS = 10;
const WORD_OPTIONS = 4;

export type LessonQuestion =
  | {
      kind: 'meaning';
      itemId: string;
      th: string;
      expected: string;
      /** 2–4 nghĩa đã xáo, gồm đáp án. */
      options: string[];
    }
  | {
      kind: 'arrange';
      itemId: string;
      vi: string;
      th: string;
      accepted: string[];
      /** Thẻ đã xáo (gồm thẻ nhiễu của câu). */
      bank: string[];
    };

type Words = UnitBundle['words'];

const meaning = (w: Words[number]) => w.meaning_vi.join('; ');

/**
 * Câu hỏi của một bài: mỗi từ có nghĩa → chọn nghĩa (nghĩa nhiễu lấy từ các từ khác của unit), mỗi
 * câu có đáp án + ≥ 2 thẻ → xếp câu; xáo theo seed, tối đa `QUIZ_MAX_QUESTIONS` (giữ cả hai loại).
 */
export function buildLessonQuiz(
  bundle: Pick<UnitBundle, 'words' | 'sentences'>,
  lessonId: string,
  seed: number,
): LessonQuestion[] {
  const rng = createRng(seed);
  const pool = bundle.words.filter((w) => w.meaning_vi.length > 0);
  const words: LessonQuestion[] = pool
    .filter((w) => w.lesson_id === lessonId)
    .map((w) => {
      const others = [...new Set(pool.map(meaning))].filter((m) => m !== meaning(w));
      return {
        kind: 'meaning',
        itemId: w.id,
        th: w.thai,
        expected: meaning(w),
        options: rng.shuffle([meaning(w), ...rng.shuffle(others).slice(0, WORD_OPTIONS - 1)]),
      };
    });
  const sentences: LessonQuestion[] = bundle.sentences
    .filter(
      (s): s is BuiltSentence & { th: string } =>
        s.lesson_id === lessonId && s.th !== undefined && s.tokens.length >= 2,
    )
    .map((s) => ({
      kind: 'arrange',
      itemId: s.id,
      vi: s.vi,
      th: s.th,
      accepted: [s.th, ...s.th_alt],
      bank: rng.shuffle([...s.tokens, ...s.distractors]),
    }));
  // Giữ tỉ lệ: câu xếp tối đa một nửa.
  const arrange = rng.shuffle(sentences).slice(0, Math.ceil(QUIZ_MAX_QUESTIONS / 2));
  const meaningQs = rng.shuffle(words).slice(0, QUIZ_MAX_QUESTIONS - arrange.length);
  return rng.shuffle([...meaningQs, ...arrange]);
}

const compact = (text: string) => text.replace(/\s+/g, '');

/** Chấm một câu: chọn nghĩa so khớp nguyên văn; xếp câu bỏ khoảng trắng, nhận cả `th_alt`. */
export function checkLessonAnswer(
  question: LessonQuestion,
  answer: string | readonly string[],
): boolean {
  if (question.kind === 'meaning') return answer === question.expected;
  const given = compact(typeof answer === 'string' ? answer : answer.join(''));
  return question.accepted.some((a) => compact(a) === given);
}
