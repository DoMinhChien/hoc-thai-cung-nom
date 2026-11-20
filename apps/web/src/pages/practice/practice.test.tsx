import {
  createRng,
  EXERCISES,
  exercisePool,
  MockAuthService,
  newSrsState,
  reviewSrs,
  type CardRecord,
  type ExerciseType,
  type Manifest,
  type PracticeQuestion,
  type UnitBundle,
  type UnitSummary,
} from '@nom/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { ContentProvider } from '@/content/ContentProvider';
import { accountData } from '@/data';
import { GUEST_KEY, NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { fakeContent } from '@/test/content-fixtures';
import { PracticeRunner, type PracticeSummary } from './PracticeRunner';

// Content GIẢ LẬP cho test Bài tập — không phải nội dung học.
const words: [string, string, string, string?][] = [
  ['w1', 'สวัสดี', 'xin chào'],
  ['w2', 'คุณ', 'bạn'],
  ['w3', 'ชื่อ', 'tên'],
  ['w4', 'แมว', 'mèo', 'ตัว'],
  ['w5', 'รถ', 'xe', 'คัน'],
  ['w6', 'ร่ม', 'ô', 'คัน'],
  ['w7', 'ปากกา', 'bút', 'ด้าม'],
];
const sentences: [string, string, string[]][] = [
  ['s1', 'Bạn tên gì?', ['คุณ', 'ชื่อ', 'อะไร']],
  ['s2', 'Tôi khỏe.', ['ฉัน', 'สบาย', 'ดี']],
  ['s3', 'Cảm ơn bạn.', ['ขอบคุณ', 'คุณ']],
];
const U1: UnitBundle = {
  unit: { unit_id: 'u01', kind: 'theme', order: 1, title_vi: 'Chào hỏi', can_do: [], draft: true },
  lessons: [
    {
      lesson_id: 'u01-l1',
      unit_id: 'u01',
      order: 1,
      title_vi: 'Bài 1',
      grammar_ids: [],
      draft: true,
      steps: ['vocab', 'exercise'],
    },
  ],
  words: words.map(([id, thai, meaning, classifier]) => ({
    id,
    unit_id: 'u01',
    lesson_id: 'u01-l1',
    thai,
    thai_alt: [],
    meaning_vi: [meaning],
    ...(classifier ? { classifier } : {}),
    tags: [],
    draft: true,
  })),
  sentences: sentences.map(([id, vi, tokens]) => ({
    id,
    unit_id: 'u01',
    lesson_id: 'u01-l1',
    vi,
    th: tokens.join(''),
    th_alt: [],
    tokens,
    distractors: [],
    draft: true,
  })),
  grammar: [],
  dialogues: [],
};
const pool = exercisePool([U1]);
const manifest: Manifest = {
  version: '0000000000000001',
  files: {
    'units.json': { hash: 'aaaaaaaaaaaaaaaa', count: 1 },
    'unit-u01.json': { hash: 'bbbbbbbbbbbbbbbb', count: 10 },
  },
};
const summary: UnitSummary = {
  ...U1.unit,
  lessons: U1.lessons.map((l) => ({ ...l, words: 7, sentences: 3 })),
  words: 7,
  sentences: 3,
};

const repos = () => createDexieRepositories(new NomDatabase(GUEST_KEY));

function question(type: ExerciseType, itemId: string, mode?: 'typing'): PracticeQuestion {
  return {
    question: EXERCISES[type].generate(itemId, {
      pool,
      rng: createRng(1),
      ...(mode ? { mode } : {}),
    }),
    unitId: 'u01',
  };
}

function renderRunner(questions: PracticeQuestion[]) {
  const onExit = vi.fn();
  const onFinish = vi.fn<(s: PracticeSummary) => void>();
  render(
    <AppProviders authService={new MockAuthService()}>
      <PracticeRunner questions={questions} voice={false} onExit={onExit} onFinish={onFinish} />
    </AppProviders>,
  );
  return { onExit, onFinish };
}

function renderAt(path: string) {
  const { client } = fakeContent({
    'manifest.json': manifest,
    'units.json': [summary],
    'unit-u01.json': U1,
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

const reps = async (itemType: 'word' | 'sentence', itemId: string) =>
  (await repos().progress.findCard(itemType, itemId, itemType === 'word' ? 'th-vi' : 'vi-th'))?.fsrs
    .reps;

beforeEach(async () => {
  await accountData.setGuestChosen();
});
afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('PracticeRunner (SCR-06 §B)', () => {
  it('chọn đúng bằng phím số → "Chính xác!", Enter sang câu, thẻ được chấm Good; kết quả', async () => {
    const q = question('E-01', 'w3');
    const { onFinish } = renderRunner([q]);
    const answer = q.question.kind === 'choice' ? q.question : null;
    const index = answer!.options.indexOf('tên');
    fireEvent.keyDown(window, { key: String(index + 1) });
    expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByTestId('feedback-bar')).toHaveTextContent('Chính xác!');
    expect(screen.getByTestId('practice-correct')).toHaveTextContent('1');
    await waitFor(async () => expect(await reps('word', 'w3')).toBe(1));
    const logs = await repos().reviews.logsBetween(new Date(0), new Date(Date.now() + 1000));
    expect(logs.map((l) => l.rating)).toEqual(['good']);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ total: 1, correct: 1, wrong: [] }),
    );
  });

  it('sai → đáp án + hỏi lại cuối phiên (không chấm FSRS lần 2)', async () => {
    const q = question('E-05', 's1');
    const { onFinish } = renderRunner([q]);
    const opts = within(screen.getByTestId('question-options')).getAllByRole('button');
    await userEvent.click(opts.find((b) => !b.textContent?.includes('Bạn tên gì?'))!);
    const bar = await screen.findByTestId('feedback-bar');
    expect(bar).toHaveAttribute('data-correct', 'false');
    expect(screen.getByTestId('feedback-answer')).toHaveTextContent('Bạn tên gì?');
    expect(screen.getByTestId('feedback-answer')).toHaveAttribute('lang', 'vi');
    await userEvent.click(screen.getByTestId('practice-next'));

    expect(screen.getByTestId('practice-retry')).toBeInTheDocument();
    const again = within(screen.getByTestId('question-options')).getByRole('button', {
      name: /Bạn tên gì\?/,
    });
    await userEvent.click(again);
    await userEvent.click(await screen.findByTestId('practice-next'));
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ total: 1, correct: 0 }));
    expect(onFinish.mock.calls[0]![0].wrong).toHaveLength(1);
    await waitFor(async () => expect(await reps('sentence', 's1')).toBe(1));
    const attempts = await repos().reviews.attemptsBetween(
      new Date(0),
      new Date(Date.now() + 1000),
    );
    expect(attempts.map((a) => [a.correct, a.rating])).toEqual([
      [false, 'again'],
      [true, null],
    ]);
    expect(await repos().progress.getSentenceLevel('s1')).toMatchObject({ level: 2, streak: 0 });
  });

  it('xếp thẻ (E-06): phím số chọn thẻ, Enter kiểm tra', async () => {
    renderRunner([question('E-06', 's2')]);
    const bank = screen.getByTestId('token-bank');
    for (const token of ['ฉัน', 'สบาย', 'ดี']) {
      await userEvent.click(within(bank).getByRole('button', { name: new RegExp(token) }));
    }
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    await waitFor(async () => expect(await reps('sentence', 's2')).toBe(1));
  });

  it('gõ (E-07): sai dấu → "Gần đúng — sai dấu" + diff, chấm Hard; gợi ý điền từ đầu', async () => {
    renderRunner([question('E-07', 's2'), question('E-07', 's3')]);
    const input = screen.getByRole('textbox', { name: 'Gõ câu tiếng Thái' });
    fireEvent.change(input, { target: { value: 'ฉันสบายดี่' } });
    await userEvent.click(screen.getByTestId('question-check'));
    const bar = await screen.findByTestId('feedback-bar');
    expect(bar).toHaveAttribute('data-tone', 'true');
    expect(bar).toHaveTextContent('Gần đúng — sai dấu');
    await waitFor(async () => {
      const logs = await repos().reviews.logsBetween(new Date(0), new Date(Date.now() + 1000));
      expect(logs.map((l) => l.rating)).toEqual(['hard']);
    });
    await userEvent.click(screen.getByTestId('practice-next'));

    await userEvent.click(screen.getByTestId('question-hint'));
    expect(screen.getByRole('textbox', { name: 'Gõ câu tiếng Thái' })).toHaveValue('ขอบคุณ');
    expect(screen.getByTestId('question-hint')).toBeDisabled();
  });

  it('ghép cặp (E-03): ghép sai một lần → mục đó Hard, các mục khác Good', async () => {
    const q = question('E-03', 'w1');
    renderRunner([q]);
    const match = q.question.kind === 'match' ? q.question : null;
    const lefts = screen.getAllByTestId('match-left');
    const rights = () => screen.getAllByTestId('match-right');
    const pairs = match!.pairs;
    // Sai một lần với cặp đầu.
    await userEvent.click(lefts[0]!);
    await userEvent.click(rights().find((r) => r.textContent !== pairs[0]!.right)!);
    for (const [i, p] of pairs.entries()) {
      await userEvent.click(lefts[i]!);
      await userEvent.click(rights().find((r) => r.textContent === p.right)!);
    }
    expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'false');
    await waitFor(async () => {
      const logs = await repos().reviews.logsBetween(new Date(0), new Date(Date.now() + 1000));
      expect(logs).toHaveLength(pairs.length);
      expect(logs.filter((l) => l.rating === 'hard')).toHaveLength(1);
    });
  });

  it('Bỏ qua (S) → Again + đáp án; Esc → hỏi "Dừng bài tập?" → Dừng', async () => {
    const { onExit } = renderRunner([question('E-02', 'w2'), question('E-01', 'w1')]);
    fireEvent.keyDown(window, { key: 's' });
    expect(await screen.findByTestId('feedback-bar')).toHaveTextContent('Chưa đúng');
    expect(screen.getByTestId('feedback-answer')).toHaveTextContent('คุณ');
    await waitFor(async () => expect(await reps('word', 'w2')).toBe(1));
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(await screen.findByTestId('practice-stop-dialog')).toHaveTextContent('Dừng bài tập?');
    await userEvent.click(screen.getByTestId('practice-stop-confirm'));
    expect(onExit).toHaveBeenCalled();
  });

  it('E-14 gõ loại từ', async () => {
    renderRunner([question('E-14', 'w5', 'typing')]);
    expect(screen.getByTestId('question-title')).toHaveTextContent('Loại từ của từ này là gì?');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'คัน' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
    await waitFor(async () => expect(await reps('word', 'w5')).toBe(1));
  });
});

describe('/practice/session (SCR-06 §B–C)', () => {
  it('không có gì để luyện → thông báo + link về Bài tập', async () => {
    renderAt('/practice/session');
    expect(await screen.findByTestId('practice-message')).toHaveTextContent(
      'Không có câu nào để luyện lúc này.',
    );
  });

  it('thẻ đến hạn → phiên hôm nay; làm hết → kết quả, "Luyện lại câu sai" mở phiên các mục sai', async () => {
    const reviewed = new Date(Date.now() - 2 * 24 * 3600_000);
    const due = (itemId: string): CardRecord => ({
      id: itemId,
      itemType: 'word',
      itemId,
      cardType: 'th-vi',
      fsrs: reviewSrs(newSrsState(reviewed), 'good', reviewed).state,
      createdAt: reviewed.toISOString(),
      updatedAt: reviewed.toISOString(),
    });
    await repos().progress.putCard(due('w4'));
    const router = renderAt('/practice/session?seed=3');
    expect(await screen.findByTestId('practice-session')).toBeInTheDocument();
    expect(screen.getByTestId('practice-count')).toHaveTextContent('1 / 1');
    fireEvent.keyDown(window, { key: 's' });
    await screen.findByTestId('feedback-bar');
    fireEvent.keyDown(window, { key: 'Enter' });
    // Hỏi lại câu bỏ qua.
    expect(await screen.findByTestId('practice-retry')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 's' });
    await screen.findByTestId('feedback-bar');
    fireEvent.keyDown(window, { key: 'Enter' });

    const result = await screen.findByTestId('practice-result');
    expect(within(result).getByTestId('result-pct')).toHaveTextContent('0%');
    expect(within(result).getByTestId('result-count')).toHaveTextContent('0/1 đúng');
    expect(screen.getByTestId('practice-wrong-list')).toHaveTextContent('(bỏ qua)');
    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => expect(router.state.location.search).toMatch(/^\?items=.*word:w4/));
    expect(await screen.findByTestId('practice-session')).toBeInTheDocument();
  });
});
