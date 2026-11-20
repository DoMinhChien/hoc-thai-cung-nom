import {
  MockAuthService,
  type GameSummary,
  type Manifest,
  type UnitBundle,
  type UnitSummary,
} from '@nom/core';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { ContentProvider } from '@/content/ContentProvider';
import { accountData } from '@/data';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { GUEST_KEY, NomDatabase } from '@/data/db';
import { fakeContent } from '@/test/content-fixtures';
import { GameResult } from './GameResult';

// Content GIẢ LẬP cho test màn Trò chơi — không phải nội dung học.
const WORDS: [string, string, string, string?][] = [
  ['w1', 'ก', 'một'],
  ['w2', 'ข', 'hai'],
  ['w3', 'ค', 'ba'],
  ['w4', 'ง', 'bốn'],
  ['w5', 'จ', 'năm'],
  ['w6', 'ฉ', 'sáu'],
  ['w7', 'ช', 'bảy'],
  ['w8', 'ซ', 'tám'],
];
const NOUNS: [string, string, string, string][] = [
  ['n1', 'แมว', 'mèo', 'ตัว'],
  ['n2', 'หมา', 'chó', 'ตัว'],
  ['n3', 'เสื้อ', 'áo', 'ตัว'],
  ['n4', 'รองเท้า', 'giày', 'คู่'],
  ['n5', 'ถุงเท้า', 'tất', 'คู่'],
  ['n6', 'ตะเกียบ', 'đũa', 'คู่'],
  ['n7', 'รถ', 'xe', 'คัน'],
  ['n8', 'ร่ม', 'ô', 'คัน'],
];

function unitBundle(id: string, order: number, words: typeof WORDS, sentences = 0): UnitBundle {
  return {
    unit: {
      unit_id: id,
      kind: 'theme',
      order,
      title_vi: `Chủ đề ${order}`,
      can_do: [],
      draft: true,
    },
    lessons: [],
    words: words.map(([wid, thai, meaning, classifier]) => ({
      id: wid,
      unit_id: id,
      lesson_id: `${id}-l1`,
      thai,
      thai_alt: [],
      meaning_vi: [meaning],
      ...(classifier ? { classifier } : {}),
      tags: [],
      draft: true,
    })),
    sentences: Array.from({ length: sentences }, (_, i) => ({
      id: `${id}-s${i}`,
      unit_id: id,
      lesson_id: `${id}-l1`,
      vi: `Câu ${i}`,
      th: `ก${i}ข`,
      th_alt: [],
      tokens: [`ก${i}`, 'ข'],
      distractors: [],
      draft: true,
    })),
    grammar: [],
    dialogues: [],
  };
}

const U1 = unitBundle('u01', 1, WORDS, 6);
const U3 = unitBundle('u03', 3, NOUNS);
const summary = (b: UnitBundle): UnitSummary => ({
  ...b.unit,
  lessons: [],
  words: b.words.length,
  sentences: b.sentences.length,
});
const manifest: Manifest = {
  version: '0000000000000001',
  files: {
    'units.json': { hash: 'aaaaaaaaaaaaaaaa', count: 2 },
    'unit-u01.json': { hash: 'bbbbbbbbbbbbbbbb', count: 14 },
    'unit-u03.json': { hash: 'cccccccccccccccc', count: 8 },
  },
};

function renderAt(path: string) {
  const { client } = fakeContent({
    'manifest.json': manifest,
    'units.json': [summary(U1), summary(U3)],
    'unit-u01.json': U1,
    'unit-u03.json': U3,
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders authService={new MockAuthService()}>
      <ContentProvider client={client}>
        <RouterProvider router={router} />
      </ContentProvider>
    </AppProviders>,
  );
  return router;
}

const guestRepos = () => createDexieRepositories(new NomDatabase(GUEST_KEY));
/** Nghĩa đúng của mọi từ / câu Unit 1 — để biết nghĩa đề xuất đúng hay sai. */
const meaningOf = new Map([
  ...WORDS.map(([, th, m]) => [th, m] as const),
  ...U1.sentences.map((s) => [s.th!, s.vi] as const),
]);

beforeEach(async () => {
  await accountData.setGuestChosen();
});
afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('/games (SCR-08 §A)', () => {
  it('chưa học gì → chơi với Bài 1 (unit đầu lộ trình); khóa trò thiếu dữ liệu kèm lý do; đổi nguồn được nhớ', async () => {
    renderAt('/games');
    expect(await screen.findByTestId('game-fallback')).toHaveTextContent('Bài 1');
    expect(screen.getByTestId('game-locked-classifier-rush')).toHaveTextContent(
      'Cần chuyên đề có loại từ',
    );
    expect(screen.queryByTestId('game-locked-match')).toBeNull();
    expect(screen.getByTestId('game-card-match')).toHaveAttribute('data-game', 'match');
    expect(screen.getByTestId('game-record-match')).toHaveTextContent('Chưa chơi');

    fireEvent.change(screen.getByTestId('game-source'), { target: { value: 'unit:u03' } });
    await waitFor(() => expect(screen.queryByTestId('game-locked-classifier-rush')).toBeNull());
    expect(screen.getByTestId('game-locked-sentence-rush')).toHaveTextContent(
      'Cần ít nhất 5 câu có thẻ từ (nguồn này có 0)',
    );
    expect(await guestRepos().settings.get('gameSource', 'learned')).toBe('unit:u03');
  });

  it('phím 1–4 mở trò (bỏ qua trò bị khóa); hiện số mục "cần ôn" từ trò chơi', async () => {
    const repos = guestRepos();
    await repos.progress.putNeedsReview({
      id: 'f',
      itemType: 'word',
      itemId: 'w1',
      origin: 'game',
      flaggedAt: '2026-11-18T00:00:00.000Z',
      updatedAt: '2026-11-18T00:00:00.000Z',
    });
    const router = renderAt('/games');
    expect(await screen.findByTestId('game-review-count')).toHaveTextContent('1 mục cần ôn');
    fireEvent.keyDown(window, { key: '4' });
    expect(router.state.location.pathname).toBe('/games');
    fireEvent.keyDown(window, { key: '2' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/games/true-false'));
    expect(router.state.location.search).toBe('?source=unit%3Au01');
  });
});

describe('/games/:id (SCR-08 §B–C)', () => {
  it('Đúng hay sai?: hết 3 tim → kết quả, lưu kỷ lục, mục sai "cần ôn", bỏ được; không tạo thẻ SRS', async () => {
    const router = renderAt('/games/true-false?source=unit:u01&seed=7');
    expect(await screen.findByTestId('count-in')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: ' ' });

    // Trả lời đúng 1 câu rồi sai liền 3 câu.
    for (const correct of [true, false, false, false]) {
      const th = (await screen.findByTestId('tf-th')).textContent!;
      const shown = screen.getByTestId('tf-shown').textContent!;
      const isTrue = meaningOf.get(th) === shown;
      await userEvent.click(screen.getByTestId(isTrue === correct ? 'tf-true' : 'tf-false'));
      expect(await screen.findByTestId('feedback-bar')).toHaveAttribute(
        'data-correct',
        String(correct),
      );
      await waitFor(() => expect(screen.queryByTestId('feedback-bar')).toBeNull(), {
        timeout: 2000,
      });
    }

    expect(await screen.findByTestId('game-result')).toBeInTheDocument();
    expect(screen.getByTestId('result-correct')).toHaveTextContent('1/4');
    // 25% đúng → 1 sao (plan 0.14).
    expect(screen.getByTestId('result-stars')).toHaveAttribute('data-stars', '1');
    expect(screen.getByTestId('result-stars')).toHaveAccessibleName('1/3 sao');
    expect(await screen.findByTestId('result-new-record')).toBeInTheDocument();
    const repos = guestRepos();
    const [record] = await repos.progress.listGameResults();
    expect(record).toMatchObject({ gameId: 'true-false', source: 'unit:u01', plays: 1 });
    expect(record!.best.score).toBeGreaterThan(0);
    await waitFor(async () => expect(await repos.progress.listNeedsReview()).toHaveLength(3));

    const list = screen.getByTestId('review-list');
    await userEvent.click(within(list).getAllByRole('button')[0]!);
    await waitFor(async () => expect(await repos.progress.listNeedsReview()).toHaveLength(2));
    expect(await repos.progress.listCards()).toEqual([]);

    // Chơi lại (Enter) → lượt mới; Đổi trò / Esc → /games (giữ nguồn đã chọn).
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(await screen.findByTestId('count-in')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/games'));
  });

  it('Đoán loại từ: 4 lựa chọn phím 1–4, phản hồi đúng/sai', async () => {
    renderAt('/games/classifier-rush?source=unit:u03&seed=3');
    fireEvent.keyDown(await screen.findByTestId('count-in'), { key: ' ' });
    const choices = await screen.findAllByRole('button', { name: /ตัว|คู่|คัน/ });
    expect(choices.length).toBeGreaterThanOrEqual(3);
    fireEvent.keyDown(window, { key: '1' });
    expect(await screen.findByTestId('feedback-bar')).toBeInTheDocument();
  });

  it('Ghép cặp: lưới 12 thẻ úp, Space lật thẻ đang chọn, thanh trên đếm lượt lật', async () => {
    renderAt('/games/match?source=unit:u01&seed=1');
    fireEvent.keyDown(await screen.findByTestId('count-in'), { key: ' ' });
    const cards = await screen.findAllByTestId('match-card');
    expect(cards).toHaveLength(12);
    expect(cards[0]).toHaveAccessibleName('Thẻ 1 (úp)');
    fireEvent.keyDown(window, { key: ' ' });
    expect(cards[0]).toHaveAttribute('data-open', 'true');
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    expect(screen.getByTestId('game-score')).toHaveTextContent('Lượt lật');
    expect(screen.getByTestId('game-score')).toHaveTextContent('1');
  });

  it('Xếp câu tốc độ: chọn thẻ rồi kiểm tra → phản hồi', async () => {
    renderAt('/games/sentence-rush?source=unit:u01&seed=2');
    fireEvent.keyDown(await screen.findByTestId('count-in'), { key: ' ' });
    const bank = await screen.findByTestId('token-bank');
    for (const chip of within(bank).getAllByRole('button')) await userEvent.click(chip);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(await screen.findByTestId('feedback-bar')).toBeInTheDocument();
  });

  it('id lạ hoặc nguồn không đủ dữ liệu → thông báo + link về danh sách', async () => {
    renderAt('/games/khong-co');
    expect(
      await screen.findByText('Trò này chưa chơi được với nguồn đã chọn.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về danh sách trò chơi' })).toHaveAttribute(
      'href',
      '/games',
    );
  });

  it('Đoán loại từ với nguồn không có loại từ → chưa chơi được', async () => {
    renderAt('/games/classifier-rush?source=unit:u01');
    expect(
      await screen.findByText('Trò này chưa chơi được với nguồn đã chọn.'),
    ).toBeInTheDocument();
  });
});

describe('GameResult — sao (M9.6)', () => {
  const result = (summary: Partial<GameSummary> & Pick<GameSummary, 'gameId'>) =>
    render(
      <AppProviders authService={new MockAuthService()}>
        <GameResult
          summary={{
            score: 0,
            correct: 0,
            total: 0,
            accuracy: 0,
            maxCombo: 0,
            durationMs: 30_000,
            mistakes: [],
            ...summary,
          }}
          sourceKey="learned"
          canReplayMistakes={false}
          onExit={() => {}}
          onAgain={() => {}}
          onAgainMistakes={() => {}}
          gameId={summary.gameId}
        />
      </AppProviders>,
    );

  it('chưa trả lời câu nào → không hiện hàng sao', () => {
    result({ gameId: 'true-false' });
    expect(screen.getByTestId('game-result')).toBeInTheDocument();
    expect(screen.queryByTestId('result-stars')).toBeNull();
  });

  it('Ghép cặp không ghép sai thật → 3 sao dù tỉ lệ lật 50%', () => {
    result({ gameId: 'match', correct: 6, total: 12, accuracy: 0.5 });
    expect(screen.getByTestId('result-stars')).toHaveAttribute('data-stars', '3');
  });
});
