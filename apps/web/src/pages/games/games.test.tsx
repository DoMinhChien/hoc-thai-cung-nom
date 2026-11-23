import {
  MockAuthService,
  newSrsState,
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
    lessons: [
      {
        lesson_id: `${id}-l1`,
        unit_id: id,
        order: 1,
        title_vi: `Bài học ${order}`,
        grammar_ids: [],
        draft: true,
        steps: ['vocab'],
      },
    ],
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

/** Bộ chọn nội dung: chỉ chọn `unitId`, gồm mục chưa học, rồi "Chơi với nội dung này". */
async function pickUnit(unitId: string) {
  await userEvent.click(await screen.findByTestId('game-source'));
  const picker = await screen.findByTestId('source-picker');
  await userEvent.click(within(picker).getByTestId('picker-clear'));
  await userEvent.click(within(picker).getByTestId(`picker-unit-${unitId}`));
  await userEvent.click(within(picker).getByTestId('picker-include-new'));
  await userEvent.click(within(picker).getByTestId('picker-apply'));
  await waitFor(() => expect(screen.queryByTestId('source-picker')).toBeNull());
}
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
  it('chưa học gì → Bài 1 gồm mục chưa học (ghi rõ, SCR-08 v3 §3); khóa trò thiếu dữ liệu kèm lý do; đổi nội dung được nhớ', async () => {
    renderAt('/games');
    expect(await screen.findByTestId('game-source')).toHaveTextContent(
      'Bài 1 · gồm mục chưa học · 8 từ · 6 câu',
    );
    expect(screen.getByTestId('game-locked-classifier-rush')).toHaveTextContent(
      'Cần chuyên đề có loại từ',
    );
    expect(screen.queryByTestId('game-locked-match')).toBeNull();
    expect(screen.getByTestId('game-card-match').closest('li')).toHaveAttribute(
      'data-game',
      'match',
    );
    expect(screen.getByTestId('game-record-match')).toHaveTextContent('Chưa chơi');

    await pickUnit('u03');
    await waitFor(() => expect(screen.queryByTestId('game-locked-classifier-rush')).toBeNull());
    expect(screen.getByTestId('game-locked-sentence-rush')).toHaveTextContent(
      'Cần ít nhất 5 câu có thẻ từ (nguồn này có 0)',
    );
    expect(await guestRepos().settings.get('gameSource', null)).toBe('units:u03;new');
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
    expect(router.state.location.search).toBe('?source=units%3Au01%3Bnew');
  });
});

describe('Nội dung ôn (SCR-08 v3)', () => {
  const card = (itemId: string, createdAt = '2026-11-01T00:00:00.000Z') => ({
    id: `c-${itemId}`,
    itemType: 'word' as const,
    itemId,
    cardType: 'th-vi' as const,
    fsrs: { ...newSrsState(new Date('2026-11-01T00:00:00Z')), due: '2099-01-01T00:00:00.000Z' },
    createdAt,
    updatedAt: createdAt,
  });

  it('ôn nhanh: số mục trên chip, < 6 mờ + lý do; chỉ mục đã học chưa đủ → nút chơi tắt kèm lý do', async () => {
    const repos = guestRepos();
    for (const id of ['w1', 'w2', 'w3']) await repos.progress.putCard(card(id));
    renderAt('/games');
    expect(await screen.findByTestId('game-source')).toHaveTextContent('Bài 1 · gồm mục chưa học');
    await userEvent.click(screen.getByTestId('game-source'));
    const picker = await screen.findByTestId('source-picker');
    expect(within(picker).getByTestId('picker-quick-learned')).toHaveTextContent('Tất cả đã học 3');
    expect(within(picker).getByTestId('picker-quick-learned')).toHaveTextContent('Chưa đủ 6 mục');
    expect(within(picker).getByTestId('picker-count-u01')).toHaveTextContent('3/8 từ · 0/6 câu');

    await userEvent.click(within(picker).getByTestId('picker-only-learned'));
    expect(within(picker).getByTestId('picker-total')).toHaveTextContent('3 từ · 0 câu');
    expect(within(picker).getByTestId('picker-apply')).toBeDisabled();
    expect(within(picker).getByTestId('picker-short')).toHaveTextContent('Cần ít nhất 6');

    await userEvent.click(within(picker).getByTestId('picker-include-new'));
    expect(within(picker).getByTestId('picker-total')).toHaveTextContent('8 từ · 6 câu');
    expect(within(picker).getByTestId('picker-apply')).toBeEnabled();
  });

  it('?source= (lối vào "Chơi ôn") được lưu thành lựa chọn; nội dung < 6 mục → báo, không tự đổi', async () => {
    const router = renderAt('/games?source=review');
    expect(await screen.findByTestId('game-source')).toHaveTextContent('Cần ôn · 0 từ · 0 câu');
    expect(router.state.location.search).toBe('');
    expect(screen.getByTestId('game-source-short')).toBeInTheDocument();
    expect(screen.getByTestId('game-card-match')).toHaveAttribute('aria-disabled', 'true');
    expect(await guestRepos().settings.get('gameSource', null)).toBe('review');
  });

  it('?pick=1 mở bộ chọn (từ "Đổi nội dung")', async () => {
    renderAt('/games?pick=1');
    expect(await screen.findByTestId('source-picker')).toBeInTheDocument();
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
    // Kỷ lục theo trò, không theo nội dung (SCR-08 v3 §3).
    expect(record).toMatchObject({ gameId: 'true-false', source: 'all', plays: 1 });
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

/** Giả lập `prefers-reduced-motion: reduce` (chế độ từng bước — SCR-08 v2 §B). */
function reduceMotion() {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

const startGame = async () => {
  expect(await screen.findByTestId('count-in')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: ' ' });
};

describe('/games v2 — 8 trò (SCR-08 v2 §A)', () => {
  it('8 card theo thứ tự phím 1–8, nhãn kỹ năng; S lọc (số không đánh lại), T đổi theme', async () => {
    const router = renderAt('/games');
    expect(await screen.findByTestId('games-grid')).toBeInTheDocument();
    const ids = screen
      .getAllByTestId(/^game-card-/)
      .map((c) => c.getAttribute('data-testid')!.replace('game-card-', ''));
    expect(ids).toEqual([
      'match',
      'true-false',
      'sentence-rush',
      'classifier-rush',
      'whack-a-mole',
      'gameshow',
      'airplane',
      'maze',
    ]);
    expect(screen.getByTestId('game-card-airplane')).toHaveAttribute('aria-keyshortcuts', '7');
    expect(screen.getByTestId('game-skill-gameshow-classifier')).toBeInTheDocument();

    // S: Tất cả → Từ vựng → Câu.
    fireEvent.keyDown(window, { key: 's' });
    await waitFor(() => expect(router.state.location.search).toBe('?skill=vocab'));
    expect(screen.queryByTestId('game-card-sentence-rush')).toBeNull();
    fireEvent.keyDown(window, { key: 's' });
    await waitFor(() => expect(router.state.location.search).toBe('?skill=sentence'));
    expect(screen.getAllByTestId(/^game-card-/)).toHaveLength(3);
    expect(screen.getByTestId('game-card-airplane')).toHaveAttribute('aria-keyshortcuts', '7');
    // Trò bị lọc ẩn: phím số của nó không có tác dụng.
    fireEvent.keyDown(window, { key: '1' });
    expect(router.state.location.pathname).toBe('/games');

    // T: Biển → Không gian (lưu theo người dùng).
    expect(screen.getByTestId('game-theme-sea')).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(window, { key: 't' });
    await waitFor(() =>
      expect(screen.getByTestId('game-theme-space')).toHaveAttribute('aria-checked', 'true'),
    );
    expect(await guestRepos().settings.get('gameTheme', 'sea')).toBe('space');
  });

  it('trò khóa: card aria-disabled + lý do; phím số báo lý do, không mở', async () => {
    const router = renderAt('/games');
    await pickUnit('u03');
    await waitFor(() => expect(screen.queryByTestId('game-locked-classifier-rush')).toBeNull());
    // Unit 3 không có câu: Máy bay vẫn đủ 8 từ; Xếp câu tốc độ khóa.
    expect(screen.getByTestId('game-card-sentence-rush')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.keyDown(window, { key: '3' });
    expect(await screen.findByText(/Xếp câu tốc độ: Cần ít nhất 5 câu/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/games');
    fireEvent.keyDown(window, { key: '5' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/games/whack-a-mole'));
  });
});

describe('/games/:id — 4 trò arcade (SCR-08 v2 §B)', () => {
  it('Đập chuột: phím theo bàn phím số đập con đang thò lên → phản hồi; P tạm dừng, Space tiếp', async () => {
    const router = renderAt('/games/whack-a-mole?source=unit:u01&seed=7');
    await startGame();
    expect(await screen.findByTestId('game-scene')).toBeInTheDocument();
    const prompt = (await screen.findByTestId('whack-prompt')).textContent!;
    const target = WORDS.find(([, , m]) => m === prompt)![1];
    // Con đầu tiên thò lên ngay (lịch theo seed) — đợi tới khi có con đúng rồi đập bằng phím.
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
    const hole = await waitFor(
      () => {
        const el = document.querySelector(`[data-mole="${target}"]`);
        expect(el).not.toBeNull();
        return Number(el!.getAttribute('data-testid')!.replace('whack-hole-', ''));
      },
      { timeout: 8000 },
    );
    fireEvent.keyDown(window, { key: keys[hole]! });
    expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByTestId('game-score')).toHaveTextContent('100');

    fireEvent.keyDown(window, { key: 'p' });
    expect(await screen.findByTestId('game-paused')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: ' ' });
    await waitFor(() => expect(screen.queryByTestId('game-paused')).toBeNull());
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/games'));
    expect(await guestRepos().progress.listGameResults()).toEqual([]);
  }, 15_000);

  it('Đố vui truyền hình: 50:50 bỏ 2 đáp án, chọn → phản hồi + Tiếp; +10 giây dùng một lần', async () => {
    renderAt('/games/gameshow?source=unit:u01&seed=3');
    await startGame();
    expect(await screen.findByTestId('show-prompt')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'f' });
    await waitFor(() =>
      expect(document.querySelectorAll('[data-removed="true"]').length).toBeGreaterThan(0),
    );
    expect(screen.getByTestId('show-lifeline-fifty')).toBeDisabled();
    const left = screen
      .getAllByTestId(/^show-option-/)
      .find((b) => b.getAttribute('data-removed') === 'false')!;
    await userEvent.click(left);
    expect(await screen.findByTestId('feedback-bar')).toBeInTheDocument();
    expect(
      screen.getByTestId('show-ladder').querySelector('[aria-current="step"]'),
    ).toHaveTextContent('1');
    await userEvent.click(screen.getByTestId('show-next'));
    await waitFor(() =>
      expect(
        screen.getByTestId('show-ladder').querySelector('[aria-current="step"]'),
      ).toHaveTextContent('2'),
    );
    // Câu mới: 50:50 không còn, +10 giây vẫn dùng được.
    expect(document.querySelectorAll('[data-removed="true"]')).toHaveLength(0);
    fireEvent.keyDown(window, { key: 't' });
    await waitFor(() => expect(screen.getByTestId('show-lifeline-time')).toBeDisabled());
  });

  it('Máy bay (giảm chuyển động → từng bước): ↑↓ đổi làn, "Bay" chấm làn hiện tại; 3 sai → kết quả', async () => {
    const restore = reduceMotion();
    try {
      renderAt('/games/airplane?source=unit:u01&seed=5');
      // Giảm chuyển động: bỏ màn đếm 3·2·1.
      expect(await screen.findByTestId('game-status')).toHaveTextContent('Từng bước');
      const plane = await screen.findByTestId('plane');
      const lane = Number(plane.getAttribute('data-lane'));
      fireEvent.keyDown(window, { key: 'ArrowUp' });
      await waitFor(() =>
        expect(plane).toHaveAttribute('data-lane', String(Math.max(0, lane - 1))),
      );

      // Luôn bay vào làn sai → mất tim tới hết.
      for (let i = 0; i < 3; i++) {
        const prompt = screen.getByTestId('plane-prompt').textContent!;
        const clouds = screen.getAllByTestId(/^plane-cloud-/).map((c) => c.textContent);
        const right = clouds.findIndex((th) => meaningOf.get(th!) === prompt);
        const wrong = right === 0 ? 1 : 0;
        const current = Number(screen.getByTestId('plane').getAttribute('data-lane'));
        for (let k = 0; k < Math.abs(current - wrong); k++) {
          fireEvent.keyDown(window, { key: current > wrong ? 'ArrowUp' : 'ArrowDown' });
        }
        await waitFor(() =>
          expect(screen.getByTestId('plane')).toHaveAttribute('data-lane', String(wrong)),
        );
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        if (i < 2) {
          await waitFor(() =>
            expect(screen.getByTestId('game-lives')).toHaveAttribute('data-lives', String(2 - i)),
          );
        }
      }
      expect(await screen.findByTestId('game-result')).toBeInTheDocument();
      expect(screen.getByTestId('result-detail')).toHaveTextContent('Bay qua 3 hàng mây');
      await waitFor(async () =>
        expect(await guestRepos().progress.listNeedsReview()).toHaveLength(3),
      );
    } finally {
      restore();
    }
  });

  it('Mê cung: mũi tên đi trong lưới (tường chặn), B bật "Từng bước" và nhớ lựa chọn', async () => {
    renderAt('/games/maze?source=unit:u01&seed=11');
    await startGame();
    const grid = await screen.findByTestId('maze-grid');
    expect(grid).toHaveAttribute('data-player', '4,3');
    expect(screen.getAllByTestId(/^maze-answer-/)).toHaveLength(4);
    const before = grid.getAttribute('data-player');
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      fireEvent.keyDown(window, { key });
      if (grid.getAttribute('data-player') !== before) break;
    }
    expect(grid.getAttribute('data-player')).not.toBe(before);

    expect(screen.getByTestId('game-status')).toHaveTextContent('Từng bước: tắt');
    fireEvent.keyDown(window, { key: 'b' });
    await waitFor(() =>
      expect(screen.getByTestId('game-status')).toHaveTextContent('Từng bước: bật'),
    );
    await waitFor(async () =>
      expect(await guestRepos().settings.get('mazeStepMode', false)).toBe(true),
    );
  });
});

describe('GameResult v2 — Đổi trò, dòng riêng trò (SCR-08 v2 §C)', () => {
  it('G mở dialog 8 trò (trò vừa chơi có nhãn), phím số chọn trò khác', async () => {
    const picked: string[] = [];
    render(
      <AppProviders authService={new MockAuthService()}>
        <GameResult
          gameId="whack-a-mole"
          summary={{
            gameId: 'whack-a-mole',
            score: 300,
            correct: 3,
            total: 5,
            accuracy: 0.6,
            maxCombo: 2,
            durationMs: 60_000,
            mistakes: [],
          }}
          detail="Đập nhầm 2 lần"
          canReplayMistakes={false}
          onExit={() => {}}
          onAgain={() => {}}
          onAgainMistakes={() => {}}
          onPick={(id) => picked.push(id)}
        />
      </AppProviders>,
    );
    expect(screen.getByTestId('result-detail')).toHaveTextContent('Đập nhầm 2 lần');
    expect(screen.getByTestId('result-stars')).toHaveAttribute('data-stars', '2');
    fireEvent.keyDown(window, { key: 'g' });
    const dialog = await screen.findByTestId('change-game');
    expect(within(dialog).getByTestId('change-game-whack-a-mole')).toHaveTextContent('Vừa chơi');
    fireEvent.keyDown(window, { key: '8' });
    expect(picked).toEqual(['maze']);
  });
});
