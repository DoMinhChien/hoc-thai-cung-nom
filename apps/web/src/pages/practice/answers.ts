import type { Question } from '@nom/core';

/** Đáp án hiển thị khi bỏ qua. */
export function expectedOf(question: Question): string {
  switch (question.kind) {
    case 'choice':
      return question.answer;
    case 'match':
      return '';
    default:
      return question.accepted[0]!;
  }
}

/** Ngôn ngữ của đáp án (chữ Thái có `lang="th"`). */
export function expectedLang(question: Question): 'th' | 'vi' {
  return question.kind === 'choice' ? question.optionsLang : 'th';
}
