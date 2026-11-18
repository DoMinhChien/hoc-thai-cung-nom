import { gradeThaiTyping } from '@nom/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TypingFeedback } from './TypingFeedback';

describe('TypingFeedback (G-06, E-12)', () => {
  it('đúng: không hiện diff', () => {
    render(<TypingFeedback result={gradeThaiTyping('ดี', ['ดี'])} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-verdict', 'correct');
    expect(screen.queryByTestId('diff-typed')).toBeNull();
  });

  it('sai dấu thanh / sai chữ: dòng bài làm đánh dấu phần thừa, dòng đáp án đánh dấu phần thiếu', () => {
    const { rerender } = render(<TypingFeedback result={gradeThaiTyping('พี้', ['พี่'])} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-verdict', 'tone');

    rerender(<TypingFeedback result={gradeThaiTyping('ผมมีน้องชาย', ['ผมมีพี่ชาย'])} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-verdict', 'wrong');
    expect(screen.getByTestId('diff-typed')).toHaveTextContent('ผมมีน้องชาย');
    expect(screen.getByTestId('diff-extra').tagName).toBe('DEL');
    expect(screen.getByTestId('diff-extra')).toHaveTextContent('น้อง');
    expect(screen.getByTestId('diff-expected')).toHaveTextContent('ผมมีพี่ชาย');
    expect(screen.getByTestId('diff-missing').tagName).toBe('INS');
    expect(screen.getByTestId('diff-missing')).toHaveTextContent('พี่');
  });
});
