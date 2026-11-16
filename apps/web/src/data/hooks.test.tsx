import {
  createMemoryRepositories,
  introduceCard,
  MockAuthService,
  mockUser,
  recordReview,
  type Repositories,
} from '@nom/core';
import { act, render, screen } from '@testing-library/react';
import Dexie from 'dexie';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { dbName, GUEST_KEY } from './db';
import { useMastery, useRepositories } from './hooks';

afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

const ITEMS = ['ko-kai', 'kho-khai', 'kho-khwai'];
const T0 = new Date('2026-03-01T08:00:00.000Z');

let captured: Repositories | null = null;
const capture = (repos: Repositories | null) => {
  captured = repos;
};
function Probe() {
  const repos = useRepositories();
  useEffect(() => capture(repos), [repos]);
  const mastery = useMastery('consonant', ITEMS);
  if (!mastery) return <p data-testid="loading" />;
  const { counts, percent, byItem } = mastery;
  return (
    <p data-testid="summary">
      {`${counts.none}/${counts.learning}/${counts.known}/${counts.mastered} ${percent}% ${byItem.get('ko-kai')}`}
    </p>
  );
}

function renderProbe(auth: MockAuthService, repositories?: Repositories) {
  render(
    <AppProviders authService={auth} repositories={repositories}>
      <Probe />
    </AppProviders>,
  );
}

describe('useMastery / useRepositories (T5.6)', () => {
  it('cập nhật realtime sau một lượt ôn (Dexie liveQuery)', async () => {
    renderProbe(new MockAuthService());
    expect(await screen.findByTestId('summary')).toHaveTextContent('3/0/0/0 0% none');

    const repos = captured!;
    const item = { itemType: 'consonant', itemId: 'ko-kai', cardType: 'th-vi' } as const;
    await act(async () => {
      const card = await introduceCard(repos.progress, item, T0);
      await recordReview(repos, card, 'good', T0);
    });
    expect(await screen.findByText('2/1/0/0 0% learning')).toBeInTheDocument();

    await act(async () => {
      const card = (await repos.progress.findCard('consonant', 'ko-kai', 'th-vi'))!;
      await recordReview(repos, card, 'easy', new Date(card.fsrs.due));
    });
    expect(await screen.findByText(/^2\/0\/1\/0 33% known$/)).toBeInTheDocument();
  });

  it('Guest dùng DB guest; đăng nhập dùng DB theo uid (L-07)', async () => {
    renderProbe(new MockAuthService({ user: mockUser({ uid: 'u42' }) }));
    await screen.findByTestId('summary');
    await act(async () => {
      await introduceCard(
        captured!.progress,
        { itemType: 'word', itemId: 'di', cardType: 'th-vi' },
        T0,
      );
    });
    const names = await Dexie.getDatabaseNames();
    expect(names).toContain(dbName('u42'));
    expect(names).not.toContain(dbName(GUEST_KEY));
  });

  it('override: repository bộ nhớ cho component test', async () => {
    const memory = createMemoryRepositories();
    await introduceCard(
      memory.progress,
      { itemType: 'consonant', itemId: 'kho-khai', cardType: 'th-vi' },
      T0,
    );
    renderProbe(new MockAuthService(), memory);
    expect(await screen.findByTestId('summary')).toHaveTextContent('3/0/0/0');
    expect(captured).toBe(memory);
  });
});
