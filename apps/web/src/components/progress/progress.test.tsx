import type { Accuracy, MasteryCounts, Tone } from '@nom/core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HeatmapTable } from './HeatmapTable';
import { MasteryGrid } from './MasteryGrid';
import { ProgressRing } from './ProgressRing';
import { StackedProgressBar } from './StackedProgressBar';
import { ToneBarChart } from './ToneBarChart';

const acc = (correct: number, total: number): Accuracy => ({
  correct,
  total,
  ratio: total ? correct / total : null,
});

describe('ProgressRing (P-01)', () => {
  it('progressbar có giá trị + nhãn, số % hiện ở giữa; giới hạn 0–100', () => {
    render(<ProgressRing percent={42.4} label="Bảng chữ cái" />);
    const ring = screen.getByRole('progressbar', { name: 'Bảng chữ cái: hoàn thành 42%' });
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

describe('MasteryGrid (P-02)', () => {
  const items = [
    { id: 'ko-kai', thai: 'ก', name: 'ก ไก่', level: 'mastered' as const },
    { id: 'kho-khai', thai: 'ข', level: 'none' as const },
  ];

  it('mỗi ô: chữ Thái lang="th", nhãn tên + mức, số chấm theo mức', () => {
    render(<MasteryGrid items={items} />);
    expect(screen.getByRole('img', { name: 'ก ไก่: Đã thuộc' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ข: Chưa học' })).toBeInTheDocument();
    const cell = screen.getByTestId('mastery-cell-ko-kai');
    expect(cell.querySelector('[lang="th"]')).toHaveTextContent('ก');
    expect(cell.querySelector('[data-pips]')).toHaveAttribute('data-pips', '3');
    expect(screen.getByTestId('mastery-cell-kho-khai').querySelector('[data-pips]')).toBeNull();
  });

  it('có onSelect → ô là nút, bấm trả id', async () => {
    const onSelect = vi.fn();
    render(<MasteryGrid items={items} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'ข: Chưa học' }));
    expect(onSelect).toHaveBeenCalledWith('kho-khai');
  });
});

describe('HeatmapTable (P-03)', () => {
  const cells: Record<string, Accuracy> = {
    'mid:live': acc(9, 10),
    'mid:ek': acc(1, 4),
    'high:live': acc(0, 0),
  };
  const props = {
    caption: 'Quy tắc',
    rows: [
      { key: 'mid', label: 'Trung' },
      { key: 'high', label: 'Cao' },
    ],
    columns: [
      { key: 'live', label: 'Sống' },
      { key: 'ek', label: 'Mai ek' },
    ],
    getCell: (row: string, col: string) => {
      const rule = `${row}:${col}`;
      return cells[rule] ? { rule, accuracy: cells[rule] } : null;
    },
  };

  it('bảng có tiêu đề hàng/cột; ô ghi % + số lượt; ô "—" khi quy tắc không hợp lệ', () => {
    render(<HeatmapTable {...props} />);
    expect(screen.getByRole('table', { name: 'Quy tắc' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Trung' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Mai ek' })).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-cell-mid-live')).toHaveTextContent('90%9/10 đúng');
    expect(screen.getByTestId('heatmap-cell-high-live')).toHaveTextContent('Chưa có lượt');
    expect(screen.getByTestId('heatmap-cell-high-ek')).toHaveTextContent('—Không dùng');
  });

  it('ô yếu (< 60%) đánh dấu "Cần luyện" + nút luyện trả rule', async () => {
    const onPractice = vi.fn();
    render(<HeatmapTable {...props} onPractice={onPractice} />);
    const weak = screen.getByTestId('heatmap-cell-mid-ek');
    expect(weak).toHaveAttribute('data-weak', 'true');
    expect(weak).toHaveTextContent('Cần luyện');
    expect(screen.getByTestId('heatmap-cell-mid-live')).not.toHaveAttribute('data-weak');
    await userEvent.click(within(weak).getByRole('button', { name: 'Luyện quy tắc này' }));
    expect(onPractice).toHaveBeenCalledWith('mid:ek');
  });

  it('cột nhóm: tiêu đề "Chết" phủ ngắn/dài; ô colSpan phủ cột kế; ô có contour thanh', () => {
    render(
      <HeatmapTable
        caption="Quy tắc"
        rows={[
          { key: 'mid', label: 'Trung' },
          { key: 'low', label: 'Thấp' },
        ]}
        columns={[
          { key: 'live', label: 'Sống' },
          { key: 'dead-short', label: 'ngắn', group: 'Chết' },
          { key: 'dead-long', label: 'dài', group: 'Chết' },
        ]}
        getCell={(row, col) => {
          if (col === 'live') return null;
          if (row === 'mid') return { rule: 'mid:dead', accuracy: acc(1, 1), colSpan: 2 };
          const tone = col === 'dead-short' ? 'high' : 'falling';
          return { rule: `low:${col}`, accuracy: acc(1, 2), tone };
        }}
      />,
    );
    const group = screen.getByRole('columnheader', { name: 'Chết' });
    expect(group).toHaveAttribute('colspan', '2');
    expect(screen.getByRole('columnheader', { name: 'Sống' })).toHaveAttribute('rowspan', '2');
    expect(screen.getByRole('columnheader', { name: 'ngắn' })).toBeInTheDocument();

    expect(screen.getByTestId('heatmap-cell-mid-dead-short')).toHaveAttribute('colspan', '2');
    expect(screen.queryByTestId('heatmap-cell-mid-dead-long')).not.toBeInTheDocument();

    const short = screen.getByTestId('heatmap-cell-low-dead-short');
    expect(short).toHaveAttribute('data-rule', 'low:dead-short');
    expect(short).toHaveTextContent('Cao');
    expect(within(short).getByTestId('tone-contour-high')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-cell-low-dead-long')).toHaveTextContent('Xuống');
  });

  it('không có onPractice → không có nút', () => {
    render(<HeatmapTable {...props} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ToneBarChart (P-07)', () => {
  const data: Record<Tone, Accuracy> = {
    mid: acc(9, 10),
    low: acc(1, 2),
    falling: acc(0, 0),
    high: acc(3, 4),
    rising: acc(0, 5),
  };

  it('5 cột theo thứ tự, mỗi cột có tên + contour thanh + % (D10)', () => {
    render(<ToneBarChart data={data} />);
    const bars = screen.getAllByTestId(/^tone-bar-(?!chart)/);
    expect(bars.map((b) => b.dataset.testid)).toEqual([
      'tone-bar-mid',
      'tone-bar-low',
      'tone-bar-falling',
      'tone-bar-high',
      'tone-bar-rising',
    ]);
    expect(screen.getByTestId('tone-bar-mid')).toHaveTextContent('Ngang: 90%');
    expect(screen.getByTestId('tone-bar-falling')).toHaveTextContent('Xuống: Chưa có lượt');
    const high = screen.getByTestId('tone-bar-high');
    expect(high).toHaveTextContent('Cao');
    expect(within(high).getByTestId('tone-contour-high')).toBeInTheDocument();
  });
});
