import { createMemoryRepositories, type Repositories } from '@nom/core';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { RepositoriesContext } from '@/data/repositories-context';
import { Stars } from './celebrate';
import { StreakBadge, StreakCard } from './streak';
import { TopicTile } from './topic';

function withRepos(repos: Repositories) {
  return ({ children }: { children: ReactNode }) => (
    <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>
  );
}

describe('chuỗi ngày học (M0.5c hướng B)', () => {
  it('chip sidebar ẩn khi chưa học ngày nào', async () => {
    const repos = createMemoryRepositories();
    const { container } = render(<StreakBadge />, { wrapper: withRepos(repos) });
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
  });

  it('lượt trò chơi hôm nay (phiên `game`) tính là ngày học', async () => {
    const repos = createMemoryRepositories();
    const s = await repos.sessions.start('game', new Date());
    await repos.sessions.end(s.id, new Date());
    render(<StreakBadge />, { wrapper: withRepos(repos) });
    const badge = await screen.findByTestId('streak-badge');
    expect(badge).toHaveAttribute('data-today', 'true');
    expect(badge).toHaveTextContent('1 ngày');
  });

  it('khối streak: 7 chấm tuần, chưa học hôm nay → lời nhắc giữ chuỗi', () => {
    const week = Array.from({ length: 7 }, (_, i) => ({
      day: `2026-11-${16 + i}`,
      studied: i < 3,
      isToday: i === 3,
    }));
    render(
      <StreakCard
        streak={{ count: 3, today: false, week, milestone: null, longest: 3, days: [] }}
      />,
    );
    const card = screen.getByTestId('streak-card');
    expect(card).toHaveAttribute('data-count', '3');
    expect(card).toHaveTextContent('Học hôm nay để giữ chuỗi');
    expect(screen.getAllByText('đã học')).toHaveLength(3);
  });
});

describe('ô chuyên đề, sao', () => {
  it('Chuyên đề có nhãn "CĐ" (không phân nhánh chỉ bằng màu); màu qua data-topic', () => {
    const { container } = render(<TopicTile unit={{ kind: 'grammar' }} color={4} />);
    expect(container.firstElementChild).toHaveAttribute('data-topic', '4');
    expect(container).toHaveTextContent('🧩');
    expect(container).toHaveTextContent('CĐ');
  });

  it('sao luôn kèm chữ "n/3 sao"', () => {
    render(<Stars n={2} />);
    expect(screen.getByRole('img', { name: '2/3 sao' })).toHaveAttribute('data-stars', '2');
  });
});
