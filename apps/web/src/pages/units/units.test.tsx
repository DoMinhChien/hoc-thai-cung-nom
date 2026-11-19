import { MockAuthService, type Manifest, type UnitBundle, type UnitSummary } from '@nom/core';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/routes';
import { ContentProvider } from '@/content/ContentProvider';
import { accountData } from '@/data';
import { GUEST_KEY, NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { fakeContent } from '@/test/content-fixtures';

// Content GIẢ LẬP cho test màn Bài học — không phải nội dung học.
const lesson = (
  id: string,
  unitId: string,
  order: number,
  steps: UnitBundle['lessons'][number]['steps'],
  grammar: string[] = [],
) => ({
  lesson_id: id,
  unit_id: unitId,
  order,
  title_vi: `Bài ${order} của ${unitId}`,
  grammar_ids: grammar,
  draft: true,
  steps,
});
const word = (id: string, thai: string, meaning: string, lessonId = 'u01-l1') => ({
  id,
  unit_id: lessonId.slice(0, 3),
  lesson_id: lessonId,
  thai,
  thai_alt: [],
  meaning_vi: [meaning],
  tags: [],
  draft: true,
});

const U1: UnitBundle = {
  unit: {
    unit_id: 'u01',
    level: 'A1',
    kind: 'theme',
    order: 1,
    title_vi: 'Chào hỏi',
    title_th: 'ทักทาย',
    can_do: ['Chào hỏi lịch sự'],
    draft: true,
  },
  lessons: [lesson('u01-l1', 'u01', 1, ['vocab', 'grammar', 'dialogue', 'exercise'], ['g1'])],
  words: [word('w1', 'สวัสดี', 'xin chào'), word('w2', 'คุณ', 'bạn'), word('w3', 'ชื่อ', 'tên')],
  sentences: [
    {
      id: 's1',
      unit_id: 'u01',
      lesson_id: 'u01-l1',
      vi: 'Bạn tên gì?',
      th: 'คุณชื่ออะไร',
      th_alt: [],
      tokens: ['คุณ', 'ชื่อ', 'อะไร'],
      distractors: [],
      draft: true,
    },
  ],
  grammar: [
    {
      id: 'g1',
      unit_id: 'u01',
      title_vi: 'Hỏi tên',
      pattern: 'คุณชื่ออะไร',
      explain_vi: 'Hỏi tên người khác.',
      examples: [{ th: 'คุณชื่ออะไร', vi: 'Bạn tên gì?' }],
      draft: true,
    },
  ],
  dialogues: [
    {
      id: 'd1',
      lesson_id: 'u01-l1',
      lines: [
        { speaker: 'A', th: 'สวัสดีคุณ', vi: 'Chào bạn.' },
        { speaker: 'B', th: 'สวัสดี', vi: 'Xin chào.' },
      ],
      draft: true,
    },
  ],
};
const U11: UnitBundle = {
  unit: { unit_id: 'u11', kind: 'grammar', order: 11, title_vi: 'น่า', can_do: [], draft: false },
  lessons: [lesson('u11-l1', 'u11', 1, ['vocab'])],
  words: [word('w9', 'น่ารัก', 'đáng yêu', 'u11-l1')],
  sentences: [],
  grammar: [],
  dialogues: [],
};
const summary = (b: UnitBundle): UnitSummary => ({
  ...b.unit,
  lessons: b.lessons.map((l) => ({ ...l, words: 1, sentences: 1 })),
  words: b.words.length,
  sentences: b.sentences.length,
});
const manifest: Manifest = {
  version: '0000000000000001',
  files: {
    'units.json': { hash: 'aaaaaaaaaaaaaaaa', count: 2 },
    'unit-u01.json': { hash: 'bbbbbbbbbbbbbbbb', count: 9 },
    'unit-u11.json': { hash: 'cccccccccccccccc', count: 1 },
  },
};

function renderAt(path: string) {
  const { client } = fakeContent({
    'manifest.json': manifest,
    'units.json': [summary(U1), summary(U11)],
    'unit-u01.json': U1,
    'unit-u11.json': U11,
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
const repos = () => createDexieRepositories(new NomDatabase(GUEST_KEY));

beforeEach(async () => {
  await accountData.setGuestChosen();
});
afterEach(async () => {
  for (const name of await Dexie.getDatabaseNames()) await Dexie.delete(name);
});

describe('/units (SCR-04 §A)', () => {
  it('lộ trình theo order, nhãn level/kind/bản nháp, "Bắt đầu" → bài đầu; lọc theo loại trong URL', async () => {
    const router = renderAt('/units');
    expect(await screen.findByTestId('continue-card')).toHaveAttribute('data-kind', 'start');
    expect(screen.getByTestId('continue-card')).toHaveTextContent(
      'Bắt đầu với Chuyên đề 1: Chào hỏi',
    );
    const rows = within(screen.getByTestId('unit-path')).getAllByRole('link');
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual([
      'unit-row-u01',
      'unit-row-u11',
    ]);
    expect(rows[0]).toHaveTextContent('A1');
    expect(rows[0]).toHaveTextContent('Bản nháp');
    expect(rows[1]).toHaveTextContent('Ngữ pháp');
    expect(screen.getByTestId('unit-status-u01')).toHaveTextContent('Chưa học');

    await userEvent.click(screen.getByTestId('units-filter-grammar'));
    expect(router.state.location.search).toBe('?kind=grammar');
    expect(within(screen.getByTestId('unit-path')).getAllByRole('link')).toHaveLength(1);

    fireEvent.keyDown(rows[1]!, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/units/u01/u01-l1'));
  });

  it('đang học → "Học tiếp" bài dở + trạng thái x/y bài', async () => {
    await repos().progress.putLessonProgress({
      id: 'p',
      lessonId: 'u01-l1',
      unitId: 'u01',
      stepsDone: ['vocab'],
      bestScore: null,
      completedAt: null,
      updatedAt: '2026-11-19T00:00:00.000Z',
    });
    renderAt('/units');
    expect(await screen.findByTestId('continue-card')).toHaveAttribute('data-kind', 'continue');
    expect(screen.getByTestId('continue-card')).toHaveTextContent('1/4 bước');
    expect(screen.getByTestId('unit-status-u01')).toHaveTextContent('Đang học · 0/1 bài');
  });
});

describe('/units/:unitId (SCR-04 §B)', () => {
  it('bài theo các bước có dữ liệu, mục tiêu tick được, từ vựng + chi tiết từ', async () => {
    renderAt('/units/u01');
    expect(await screen.findByRole('heading', { name: 'Chào hỏi' })).toBeInTheDocument();
    const row = screen.getByTestId('lesson-row-u01-l1');
    expect(row).toHaveTextContent('Từ vựng · Mẫu câu · Hội thoại · Bài tập');
    expect(row).toHaveTextContent('Chưa học');
    expect(screen.getByTestId('unit-primary')).toHaveTextContent('Học tiếp: Bài 1');

    await userEvent.click(within(screen.getByTestId('can-do-list')).getByRole('checkbox'));
    await waitFor(async () =>
      expect(await repos().progress.listCanDo('u01')).toMatchObject([
        { canDo: 'Chào hỏi lịch sự', checked: true },
      ]),
    );

    const vocab = screen.getByTestId('unit-vocab');
    expect(vocab).toHaveTextContent('Từ vựng (3)');
    await userEvent.click(within(vocab).getByRole('button', { name: /คุณ/ }));
    expect(within(vocab).getByRole('button', { name: 'Nghe คุณ' })).toBeInTheDocument();
  });

  it('chuyên đề không tồn tại → thông báo + link về Bài học', async () => {
    renderAt('/units/u99');
    expect(await screen.findByText('Không tìm thấy chuyên đề.')).toBeInTheDocument();
  });
});

describe('/units/:unitId/:lessonId (SCR-05)', () => {
  it('học trọn 1 bài: từ vựng → mẫu câu → hội thoại (tra từ, thêm Sổ từ) → bài tập ≥ 80% → hoàn thành', async () => {
    const router = renderAt('/units/u01/u01-l1');
    expect(await screen.findByTestId('flashcard')).toBeInTheDocument();
    expect(screen.getByTestId('step-vocab')).toHaveAttribute('aria-current', 'step');

    // Từ vựng: Space hiện nghĩa, 1 chưa nhớ (quay lại cuối hàng 1 lần), 2 đã biết.
    fireEvent.keyDown(window, { key: ' ' });
    expect(screen.getByTestId('flashcard-back')).toHaveTextContent('xin chào');
    fireEvent.keyDown(window, { key: '1' });
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(window, { key: ' ' });
      fireEvent.keyDown(window, { key: '2' });
    }
    expect(await screen.findByTestId('vocab-summary')).toHaveTextContent(
      'Đã xem 3 từ · 1 từ cần chú ý',
    );
    await waitFor(async () =>
      expect(await repos().progress.listCards({ itemType: 'word' })).toHaveLength(3),
    );
    fireEvent.keyDown(window, { key: 'Enter' });

    // Mẫu câu.
    expect(await screen.findByTestId('grammar-point')).toHaveTextContent('Hỏi tên');
    fireEvent.keyDown(window, { key: 'Enter' });

    // Hội thoại: tra từ, bật/tắt bản dịch.
    const lines = await screen.findByTestId('dialogue-lines');
    expect(lines).toHaveTextContent('Chào bạn.');
    fireEvent.keyDown(window, { key: 't' });
    await waitFor(() => expect(lines).not.toHaveTextContent('Chào bạn.'));
    await userEvent.click(within(lines).getAllByTestId('dialogue-word')[0]!);
    const panel = screen.getByTestId('lookup-panel');
    expect(panel).toHaveTextContent('xin chào');
    // Từ đã vào SRS ở bước Từ vựng → nút thành "✓ Trong Sổ từ" (đọc thẻ bất đồng bộ).
    await waitFor(() =>
      expect(within(panel).getByTestId('lookup-add')).toHaveTextContent('✓ Trong Sổ từ'),
    );
    fireEvent.keyDown(window, { key: 'Enter' });

    // Bài tập: trả lời đúng mọi câu.
    const meanings = new Map(U1.words.map((w) => [w.thai, w.meaning_vi[0]!]));
    const nextScreen = () =>
      waitFor(() => {
        const el =
          screen.queryByTestId('lesson-finished') ??
          screen.queryByTestId('exercise-th') ??
          screen.queryByTestId('token-bank');
        expect(el).not.toBeNull();
        return el!;
      });
    for (
      let el = await nextScreen();
      el.dataset.testid !== 'lesson-finished';
      el = await nextScreen()
    ) {
      if (el.dataset.testid === 'exercise-th') {
        await userEvent.click(
          within(screen.getByTestId('exercise-options')).getByRole('button', {
            name: new RegExp(meanings.get(el.textContent!)!),
          }),
        );
      } else {
        for (const token of ['คุณ', 'ชื่อ', 'อะไร']) {
          await userEvent.click(within(el).getByRole('button', { name: new RegExp(token) }));
        }
        await userEvent.click(screen.getByTestId('exercise-check'));
      }
      expect(await screen.findByTestId('feedback-bar')).toHaveAttribute('data-correct', 'true');
      await userEvent.click(screen.getByTestId('exercise-next'));
    }

    expect(screen.getByTestId('lesson-finished')).toHaveTextContent('Xong Bài 1');
    expect(await screen.findByTestId('unit-complete')).toHaveTextContent(
      'Bạn đã hoàn thành chuyên đề Chào hỏi',
    );
    const [record] = await repos().progress.listLessonProgress('u01');
    expect(record).toMatchObject({
      bestScore: 1,
      stepsDone: ['vocab', 'grammar', 'dialogue', 'exercise'],
    });
    expect(record!.completedAt).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Enter' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/units/u01'));
  });

  it('mở khóa mềm: bấm bước bất kỳ, phím [ ] đổi bước; Esc về chuyên đề', async () => {
    const router = renderAt('/units/u01/u01-l1');
    await userEvent.click(await screen.findByTestId('step-dialogue'));
    expect(await screen.findByTestId('dialogue-lines')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '[' });
    expect(await screen.findByTestId('grammar-point')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: ']' });
    fireEvent.keyDown(window, { key: ']' });
    expect(await screen.findByTestId('exercise')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/units/u01'));
  });

  it('bài không tồn tại → thông báo', async () => {
    renderAt('/units/u01/khong-co');
    expect(await screen.findByText('Không tìm thấy bài học.')).toBeInTheDocument();
  });
});
