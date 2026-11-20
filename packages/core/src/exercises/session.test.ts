import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../data/memory';
import type {
  CardRecord,
  ExerciseAttemptRecord,
  LessonProgressRecord,
  NeedsReviewRecord,
} from '../data/records';
import { bundle, CLASSIFIERS, GREETINGS } from '../games/fixtures.test-utils';
import { newSrsState, reviewSrs } from '../srs/srs';
import {
  buildPracticeSession,
  exercisePool,
  practiceOverview,
  questionItems,
  recentMistakes,
  recordPracticeAnswer,
  type PracticeInput,
} from '.';

const T0 = new Date('2026-03-10T08:00:00.000Z');
const DAY = 24 * 3600_000;
const at = (ms: number) => new Date(T0.getTime() + ms);

const DIALOGUE = {
  ...bundle('u02', 2, []),
  dialogues: [
    {
      id: 'd1',
      lesson_id: 'u02-l1',
      draft: true,
      lines: [
        { speaker: 'A', th: 'ชื่ออะไร', vi: 'Tên gì?' },
        { speaker: 'B', th: 'ชื่อนิด', vi: 'Tên Nít.' },
        { speaker: 'A', th: 'สบายดีไหม', vi: 'Khỏe không?' },
        { speaker: 'B', th: 'สบายดี', vi: 'Khỏe.' },
        { speaker: 'A', th: 'ไปไหน', vi: 'Đi đâu?' },
        { speaker: 'B', th: 'ไปตลาด', vi: 'Đi chợ.' },
      ],
    },
  ],
};
const pool = exercisePool([GREETINGS, CLASSIFIERS, DIALOGUE]);

/** Thẻ đã ôn (Good) lúc `reviewedAt` — đến hạn sau 10 phút (learning). */
function card(
  itemType: 'word' | 'sentence',
  itemId: string,
  opts: { reviewedAt?: Date; cardType?: CardRecord['cardType']; createdAt?: Date } = {},
): CardRecord {
  const created = opts.createdAt ?? T0;
  const fsrs = opts.reviewedAt
    ? reviewSrs(newSrsState(opts.reviewedAt), 'good', opts.reviewedAt).state
    : newSrsState(created);
  return {
    id: `${itemType}-${itemId}`,
    itemType,
    itemId,
    cardType: opts.cardType ?? (itemType === 'word' ? 'th-vi' : 'vi-th'),
    fsrs,
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
  };
}

const attempt = (
  itemId: string,
  correct: boolean,
  ts: Date,
  patch: Partial<ExerciseAttemptRecord> = {},
): ExerciseAttemptRecord => ({
  id: `${itemId}-${ts.getTime()}`,
  exerciseType: 'E-05',
  itemType: 'sentence',
  itemId,
  unitId: 'u01',
  correct,
  rating: 'good',
  ts: ts.toISOString(),
  updatedAt: ts.toISOString(),
  ...patch,
});

const lesson = (lessonId: string): LessonProgressRecord => ({
  id: lessonId,
  lessonId,
  unitId: lessonId.split('-')[0]!,
  stepsDone: ['vocab'],
  bestScore: null,
  completedAt: null,
  updatedAt: T0.toISOString(),
});

const flag = (itemType: NeedsReviewRecord['itemType'], itemId: string): NeedsReviewRecord => ({
  id: itemId,
  itemType,
  itemId,
  origin: 'game',
  flaggedAt: T0.toISOString(),
  updatedAt: T0.toISOString(),
});

function input(patch: Partial<PracticeInput>): PracticeInput {
  return {
    pool,
    cards: [],
    levels: [],
    needsReview: [],
    attempts: [],
    lessons: [],
    mode: { kind: 'today' },
    now: T0,
    seed: 1,
    ...patch,
  };
}

const items = (session: ReturnType<typeof buildPracticeSession>) =>
  session.flatMap((q) => questionItems(q.question).map((r) => `${r.itemType}:${r.itemId}`));

describe('buildPracticeSession — Bài tập hôm nay (E-10)', () => {
  it('chưa học gì → phiên rỗng', () => {
    expect(buildPracticeSession(input({}))).toEqual([]);
  });

  it('ưu tiên: "cần ôn" → sai gần đây → đến hạn (quá hạn lâu trước) → thẻ mới → câu của bài đã học', () => {
    const session = buildPracticeSession(
      input({
        filter: 'all',
        cards: [
          card('word', 'khun', { reviewedAt: at(-2 * DAY) }),
          card('word', 'chue', { reviewedAt: at(-3 * DAY) }),
          card('word', 'sabai', { createdAt: at(-DAY) }),
          card('word', 'chan', { createdAt: at(-2 * DAY) }),
          card('word', 'mai', { reviewedAt: at(0) }), // chưa đến hạn
          card('word', 'phom', { reviewedAt: at(-DAY), cardType: 'vi-th' }), // không phải thẻ bài tập
        ],
        needsReview: [flag('word', 'maeo'), flag('consonant', 'ko-kai')],
        attempts: [attempt('s2', false, at(-DAY))],
        lessons: [lesson('u01-l1')],
        size: 30,
      }),
    );
    const order = session.map((q) => `${q.question.item.itemType}:${q.question.item.itemId}`);
    expect(order.slice(0, 6)).toEqual([
      'word:maeo',
      'sentence:s2',
      'word:chue',
      'word:khun',
      'word:chan',
      'word:sabai',
    ]);
    // Câu của bài đã học chưa có thẻ được bù; mục không có thẻ bài tập / chưa đến hạn thì không.
    expect(order).toContain('sentence:s1');
    expect(order).not.toContain('word:mai');
    expect(order).not.toContain('word:phom');
    expect(order).not.toContain('sentence:s7'); // thiếu đáp án
    expect(session.find((q) => q.question.item.itemId === 'maeo')?.unitId).toBe('u03');
  });

  it('mặc định 20 câu; size giới hạn; mỗi mục một lần (ghép cặp gộp mục khác)', () => {
    const cards = GREETINGS.words.map((w) => card('word', w.id, { reviewedAt: at(-DAY) }));
    const lessons = [lesson('u01-l1')];
    const small = buildPracticeSession(input({ cards, lessons, size: 3 }));
    expect(small).toHaveLength(3);
    for (let seed = 1; seed < 20; seed++) {
      const all = items(buildPracticeSession(input({ cards, lessons, seed })));
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('bậc dịch chọn loại câu hỏi: 2 → E-05/E-04, 3 → E-06, 4 → E-07; không giọng → không E-08', () => {
    const ids = ['s1', 's2', 's3', 's4', 's5', 's6'];
    const cards = ids.map((id) => card('sentence', id, { reviewedAt: at(-DAY) }));
    const typesAt = (level: 2 | 3 | 4) =>
      new Set(
        buildPracticeSession(
          input({
            cards,
            levels: ids.map((sentenceId) => ({
              id: sentenceId,
              sentenceId,
              level,
              streak: 0,
              updatedAt: T0.toISOString(),
            })),
          }),
        ).map((q) => q.question.type),
      );
    expect([...typesAt(2)].every((t) => t === 'E-05' || t === 'E-04')).toBe(true);
    expect(typesAt(3)).toEqual(new Set(['E-06']));
    expect(typesAt(4)).toEqual(new Set(['E-07']));
  });

  it('có giọng Thái → khoảng 1/4 câu bậc 2–3 là nghe hiểu (E-08)', () => {
    const cards = ['s1', 's2', 's3', 's4', 's5', 's6'].map((id) =>
      card('sentence', id, { reviewedAt: at(-DAY) }),
    );
    const types = Array.from({ length: 20 }, (_, seed) =>
      buildPracticeSession(input({ cards, voice: true, seed })).map((q) => q.question.type),
    ).flat();
    expect(types).toContain('E-08');
    expect(types.filter((t) => t === 'E-08').length).toBeLessThan(types.length / 2);
  });

  it('bộ lọc "Kiểu bài": Từ vựng / Dịch câu / Gõ chữ Thái', () => {
    const cards = [
      ...['chue', 'khun', 'maeo', 'rot'].map((id) => card('word', id, { reviewedAt: at(-DAY) })),
      ...['s1', 's4'].map((id) => card('sentence', id, { reviewedAt: at(-DAY) })),
    ];
    const types = (filter: PracticeInput['filter']) =>
      new Set(buildPracticeSession(input({ cards, filter })).map((q) => q.question.type));
    for (const t of types('vocab')) expect(['E-01', 'E-02', 'E-03', 'E-14']).toContain(t);
    for (const t of types('sentences')) expect(['E-04', 'E-05', 'E-06']).toContain(t);
    const typing = buildPracticeSession(input({ cards, filter: 'typing' }));
    expect(new Set(typing.map((q) => q.question.type))).toEqual(new Set(['E-07', 'E-14']));
    expect(
      typing.filter((q) => q.question.type === 'E-14').every((q) => q.question.kind === 'typing'),
    ).toBe(true);
    // Từ không có loại từ bị bỏ khi chỉ gõ.
    expect(items(typing)).not.toContain('word:chue');
  });

  it('bậc không làm được (bị lọc) → loại câu khác được phép', () => {
    const cards = [card('sentence', 's4', { reviewedAt: at(-DAY) })];
    const level = { id: 'x', sentenceId: 's4', level: 4 as const, streak: 0, updatedAt: '' };
    const session = buildPracticeSession(input({ cards, levels: [level], filter: 'sentences' }));
    expect(['E-04', 'E-05', 'E-06']).toContain(session[0]?.question.type);
    // Không loại nào dùng được → bỏ mục.
    const none = buildPracticeSession(
      input({ cards: [card('word', 'chue', { reviewedAt: at(-DAY) })], filter: 'sentences' }),
    );
    expect(none).toEqual([]);
  });
});

describe('buildPracticeSession — câu sai / theo unit / bài / danh sách', () => {
  it('câu sai: mục sai gần đây, mới nhất trước, không trùng, tối đa 10', () => {
    const session = buildPracticeSession(
      input({
        mode: { kind: 'mistakes' },
        attempts: [
          attempt('s1', false, at(-3 * DAY)),
          attempt('s2', false, at(-DAY)),
          attempt('s1', false, at(-2 * DAY)),
          attempt('s3', true, at(-DAY)),
        ],
      }),
    );
    expect(session.map((q) => q.question.item.itemId)).toEqual(['s2', 's1']);
  });

  it('theo unit: từ + câu + cặp hội thoại của unit (không cần đến hạn), 10 câu', () => {
    const u01 = buildPracticeSession(input({ mode: { kind: 'unit', unitId: 'u01' }, seed: 3 }));
    expect(u01).toHaveLength(10);
    expect(u01.every((q) => q.unitId === 'u01')).toBe(true);
    const u02 = buildPracticeSession(input({ mode: { kind: 'unit', unitId: 'u02' } }));
    expect(u02.map((q) => q.question.type)).toEqual(['E-09']);
  });

  it('theo bài học và theo danh sách cho sẵn ("Luyện lại câu sai")', () => {
    const lessonQs = buildPracticeSession(input({ mode: { kind: 'lesson', lessonId: 'u03-l1' } }));
    expect(lessonQs.length).toBeGreaterThan(0);
    expect(lessonQs.every((q) => q.unitId === 'u03')).toBe(true);
    const listed = buildPracticeSession(
      input({
        mode: {
          kind: 'items',
          items: [
            { itemType: 'sentence', itemId: 's5' },
            { itemType: 'word', itemId: 'nope' },
          ],
        },
      }),
    );
    expect(listed.map((q) => q.question.item.itemId)).toEqual(['s5']);
  });
});

describe('recordPracticeAnswer', () => {
  it('lần đầu: lượt trả lời + tạo thẻ + chấm FSRS + bậc dịch + gỡ "cần ôn" khi đúng', async () => {
    const repos = createMemoryRepositories();
    await repos.progress.putNeedsReview(flag('sentence', 's1'));
    const answer = {
      exerciseType: 'E-05' as const,
      item: { itemType: 'sentence' as const, itemId: 's1' },
      unitId: 'u01',
      correct: true,
      rating: 'good' as const,
    };
    await recordPracticeAnswer(repos, answer, T0);
    const c = await repos.progress.findCard('sentence', 's1', 'vi-th');
    expect(c?.fsrs.reps).toBe(1);
    expect(await repos.reviews.logsForCard(c!.id)).toHaveLength(1);
    expect(await repos.progress.getSentenceLevel('s1')).toMatchObject({ level: 2, streak: 1 });
    expect(await repos.progress.listNeedsReview()).toEqual([]);
    expect(await repos.reviews.attemptsBetween(at(-DAY), at(DAY))).toMatchObject([
      { itemId: 's1', correct: true, rating: 'good', exerciseType: 'E-05' },
    ]);
  });

  it('hỏi lại (rating null): chỉ ghi lượt trả lời; sai lần đầu giữ cờ "cần ôn"', async () => {
    const repos = createMemoryRepositories();
    await repos.progress.putNeedsReview(flag('word', 'chue'));
    const base = {
      exerciseType: 'E-01' as const,
      item: { itemType: 'word' as const, itemId: 'chue' },
      unitId: 'u01',
    };
    await recordPracticeAnswer(
      repos,
      { ...base, correct: false, rating: 'again', answer: 'bạn' },
      T0,
    );
    await recordPracticeAnswer(repos, { ...base, correct: true, rating: null }, at(60_000));
    const c = await repos.progress.findCard('word', 'chue', 'th-vi');
    expect(c?.fsrs.reps).toBe(1);
    expect(await repos.progress.listNeedsReview()).toHaveLength(1);
    expect(await repos.progress.getSentenceLevel('chue')).toBeUndefined();
    const logged = await repos.reviews.attemptsBetween(at(-DAY), at(DAY));
    expect(logged.map((a) => [a.correct, a.rating, a.answer])).toEqual([
      [false, 'again', 'bạn'],
      [true, null, undefined],
    ]);
  });

  it('dòng hội thoại (E-09): chỉ lượt trả lời, không có thẻ', async () => {
    const repos = createMemoryRepositories();
    await recordPracticeAnswer(
      repos,
      {
        exerciseType: 'E-09',
        item: { itemType: 'dialogue', itemId: 'd1#0' },
        unitId: 'u02',
        correct: true,
        rating: 'good',
      },
      T0,
    );
    expect(await repos.progress.listCards()).toEqual([]);
    expect(await repos.reviews.attemptsBetween(at(-DAY), at(DAY))).toHaveLength(1);
  });
});

describe('practiceOverview', () => {
  it('đến hạn theo loại, đã làm hôm nay, câu sai 7 ngày, đúng % theo unit, đến hạn ngày mai', () => {
    const dayStart = new Date('2026-03-10T00:00:00.000Z');
    const tomorrow = {
      ...card('word', 'mai'),
      fsrs: { ...newSrsState(T0), state: 'review' as const, due: '2026-03-11T09:00:00.000Z' },
    };
    const overview = practiceOverview({
      cards: [
        card('word', 'chue', { reviewedAt: at(-DAY) }),
        card('sentence', 's1', { reviewedAt: at(-DAY) }),
        card('sentence', 's2', { reviewedAt: at(-DAY) }),
        card('word', 'khun'), // thẻ mới: không đến hạn
        tomorrow,
      ],
      attempts: [
        attempt('s1', true, at(-3600_000)),
        attempt('s2', false, at(-10 * 3600_000)), // hôm qua theo dayStart
        attempt('s2', true, at(-20 * DAY), { unitId: 'u02', rating: null }),
        attempt('s3', false, at(-20 * DAY), { unitId: 'u02' }),
      ],
      now: T0,
      dayStart,
    });
    expect(overview).toEqual({
      due: { words: 1, sentences: 2 },
      doneToday: 1,
      mistakes: 1,
      accuracy: { u01: 0.5, u02: 0 },
      dueTomorrow: 1,
    });
  });

  it('recentMistakes bỏ lượt đúng', () => {
    expect(recentMistakes([attempt('s1', true, T0)])).toEqual([]);
  });
});
