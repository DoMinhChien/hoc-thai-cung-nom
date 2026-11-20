/**
 * Chấm bài tập (plan 0.5, SCR-06 §B): kiểm tra câu trả lời và quy ra rating FSRS cho lần trả lời đầu
 * — đúng ngay = Good · đúng sau gợi ý hoặc chỉ sai dấu (E-07) = Hard · sai / bỏ qua = Again.
 */
import type { SrsRating } from '../srs/srs';
import { gradeThaiTyping, type TypingResult } from '../thai/typing';
import type { Question } from './exercises';

export interface CheckResult {
  /** "Sai dấu" vẫn tính đúng (chấm Hard). */
  correct: boolean;
  /** Chỉ sai dấu thanh (E-07, E-14 gõ). */
  tone: boolean;
  /** Đáp án hiển thị khi sai. */
  expected: string;
  /** Kết quả chấm gõ (diff cho `TypingFeedback`). */
  typing?: TypingResult;
}

const compact = (text: string) => text.replace(/\s+/g, '');

/**
 * Chấm một câu hỏi. `choice`: so nguyên văn; `arrange`: nối thẻ, bỏ khoảng trắng, nhận cả `th_alt`;
 * `typing`: `gradeThaiTyping` (NFC, khoảng trắng, ครับ/ค่ะ tùy chọn). `match` chấm từng cặp
 * bằng `checkMatchPair`.
 */
export function checkAnswer(
  question: Exclude<Question, { kind: 'match' }>,
  answer: string | readonly string[],
): CheckResult {
  const text = typeof answer === 'string' ? answer : answer.join('');
  switch (question.kind) {
    case 'choice':
      return { correct: text === question.answer, tone: false, expected: question.answer };
    case 'arrange': {
      const ok = question.accepted.some((a) => compact(a) === compact(text));
      return { correct: ok, tone: false, expected: question.accepted[0]! };
    }
    case 'typing': {
      const typing = gradeThaiTyping(text, question.accepted);
      return {
        correct: typing.verdict !== 'wrong',
        tone: typing.verdict === 'tone',
        expected: typing.answer,
        typing,
      };
    }
  }
}

/** Ghép cặp (E-03, E-09): vế trái `left` có đi với vế phải `right` không. */
export function checkMatchPair(
  question: Extract<Question, { kind: 'match' }>,
  left: string,
  right: string,
): boolean {
  return question.pairs.some((p) => p.left === left && p.right === right);
}

export interface Attempt {
  correct: boolean;
  /** Đã dùng gợi ý (`H`). */
  hinted?: boolean;
  /** Chỉ sai dấu. */
  tone?: boolean;
  skipped?: boolean;
}

/** Rating FSRS cho lần trả lời đầu của một mục. */
export function gradeAttempt(attempt: Attempt): SrsRating {
  if (attempt.skipped || !attempt.correct) return 'again';
  return attempt.hinted || attempt.tone ? 'hard' : 'good';
}

/** Ghép cặp: mỗi mục được chấm theo số lần ghép sai của nó (0 → Good, 1 → Hard, ≥ 2 → Again). */
export function gradeMatchItem(mistakes: number): SrsRating {
  return mistakes === 0 ? 'good' : mistakes === 1 ? 'hard' : 'again';
}
