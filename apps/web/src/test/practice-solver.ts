import type { MockAudioProvider, UnitBundle } from '@nom/core';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Trả lời ĐÚNG câu hỏi Bài tập đang hiện (component test) bằng đáp án đọc từ bundle — mọi loại
 * E-01..E-09, E-14. E-08 (chỉ nghe) lấy câu vừa được đọc từ `MockAudioProvider`.
 */
export async function answerCurrentQuestion(
  bundles: readonly UnitBundle[],
  audio: MockAudioProvider,
) {
  const words = bundles.flatMap((b) => b.words);
  const sentences = bundles.flatMap((b) => b.sentences.filter((s) => s.th !== undefined));
  const meaning = (w: (typeof words)[number]) => w.meaning_vi.join('; ');
  const qa = new Map(
    bundles.flatMap((b) =>
      b.dialogues.flatMap((d) =>
        d.lines.slice(0, -1).map((l, i) => [l.th, d.lines[i + 1]!.th] as const),
      ),
    ),
  );
  const question = screen.getByTestId('question');
  const type = question.dataset.type!;
  const text = (id: string) => within(question).queryByTestId(id)?.textContent ?? undefined;
  /** Bấm lựa chọn có nội dung là một trong `names` (có thể có từ cùng nghĩa / cùng chữ). */
  const option = async (...names: string[]) => {
    const options = within(screen.getByTestId('question-options')).getAllByRole('button');
    await userEvent.click(options.find((o) => names.includes(o.textContent!.replace(/^\d/, '')))!);
  };
  const arrange = async (tokens: readonly string[]) => {
    const bank = screen.getByTestId('token-bank');
    for (const token of tokens) {
      const chip = within(bank)
        .getAllByRole('button')
        .find((b) => b.textContent?.replace(/^\d/, '') === token)!;
      await userEvent.click(chip);
    }
    await userEvent.click(screen.getByTestId('question-check'));
  };
  const th = text('question-th');
  const vi = text('question-vi');

  switch (type) {
    case 'E-01':
      return option(...words.filter((w) => w.thai === th).map(meaning));
    case 'E-02':
      return option(...words.filter((w) => meaning(w) === vi).map((w) => w.thai));
    case 'E-05':
      return option(...sentences.filter((s) => s.th === th).map((s) => s.vi));
    case 'E-14': {
      const noun = th!.split(' ')[0]!;
      const classifier = words.find((w) => w.thai === noun)!.classifier!;
      if (within(question).queryByRole('textbox')) {
        fireEvent.change(within(question).getByRole('textbox'), { target: { value: classifier } });
        return userEvent.click(screen.getByTestId('question-check'));
      }
      return option(classifier);
    }
    case 'E-04': {
      for (const s of sentences) {
        const i = s.tokens.findIndex(
          (_, j) => s.tokens.map((t, k) => (k === j ? '____' : t)).join('') === th,
        );
        if (i >= 0) return option(s.tokens[i]!);
      }
      throw new Error(`E-04: không tìm thấy câu cho ${th}`);
    }
    case 'E-06':
      return arrange(sentences.find((s) => s.vi === vi)!.tokens);
    case 'E-07': {
      const s = sentences.find((x) => x.vi === vi)!;
      fireEvent.change(within(question).getByRole('textbox'), { target: { value: s.th } });
      return userEvent.click(screen.getByTestId('question-check'));
    }
    case 'E-08': {
      const spoken = audio.spokenTexts.at(-1)!;
      const s = sentences.find((x) => x.th === spoken)!;
      return within(question).queryByTestId('question-options') ? option(s.vi) : arrange(s.tokens);
    }
    case 'E-03':
    case 'E-09': {
      const rightOf = (left: string) =>
        type === 'E-03' ? words.filter((w) => w.thai === left).map(meaning) : [qa.get(left)!];
      for (const left of within(question).getAllByTestId('match-left')) {
        await userEvent.click(left);
        const right = within(question)
          .getAllByTestId('match-right')
          .find((r) => rightOf(left.textContent!).includes(r.textContent!))!;
        await userEvent.click(right);
      }
      return;
    }
    default:
      throw new Error(`Loại câu hỏi chưa hỗ trợ: ${type}`);
  }
}
