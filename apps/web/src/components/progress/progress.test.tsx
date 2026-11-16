import type { MasteryCounts } from '@nom/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressRing } from './ProgressRing';
import { StackedProgressBar } from './StackedProgressBar';

describe('ProgressRing (P-01)', () => {
  it('progressbar có giá trị + nhãn, số % hiện ở giữa; giới hạn 0–100', () => {
    render(<ProgressRing percent={42.4} label="Cấp A1" />);
    const ring = screen.getByRole('progressbar', { name: 'Cấp A1: hoàn thành 42%' });
    expect(ring).toHaveAttribute('aria-valuenow', '42');
    expect(ring).toHaveTextContent('42%');
  });

  it.each([
    [-5, '0'],
    [130, '100'],
  ])('%s → %s', (percent, now) => {
    render(<ProgressRing percent={percent} label="x" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', now);
  });
});

describe('StackedProgressBar (P-04)', () => {
  const counts: MasteryCounts = { none: 2, learning: 1, known: 1, mastered: 0, total: 4 };

  it('đoạn theo tỉ lệ, bỏ mức 0 và "chưa học"; nhãn tóm tắt đủ 4 mức', () => {
    render(<StackedProgressBar counts={counts} label="Bài 1" />);
    const bar = screen.getByRole('img', {
      name: 'Bài 1: 0 đã thuộc, 1 đang nhớ, 1 đang học, 2 chưa học',
    });
    const segments = bar.querySelectorAll('[data-level]');
    expect(
      [...segments].map((s) => [s.getAttribute('data-level'), (s as HTMLElement).style.width]),
    ).toEqual([
      ['known', '25%'],
      ['learning', '25%'],
    ]);
  });

  it('chú giải có tên + số từng mức (không chỉ màu)', () => {
    render(<StackedProgressBar counts={counts} label="Bài 1" />);
    expect(screen.getByTestId('legend-none')).toHaveTextContent('Chưa học2');
    expect(screen.getByTestId('legend-mastered')).toHaveTextContent('Đã thuộc0');
  });

  it('tổng 0 → thanh rỗng; ẩn chú giải được', () => {
    render(
      <StackedProgressBar
        counts={{ none: 0, learning: 0, known: 0, mastered: 0, total: 0 }}
        label="x"
        showLegend={false}
      />,
    );
    expect(screen.getByRole('img').children).toHaveLength(0);
    expect(screen.queryByTestId('legend-none')).not.toBeInTheDocument();
  });
});
