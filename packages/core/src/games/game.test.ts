import { describe, expect, it } from 'vitest';
import { CLASSIFIERS, GREETINGS } from './fixtures.test-utils';
import {
  applyAnswer,
  finish,
  initialState,
  isBetterResult,
  MAX_COMBO,
  summarize,
  type GameState,
} from './game';
import { createRng } from './rng';
import {
  countByScope,
  defaultSourceSpec,
  gameSentences,
  gameWords,
  MIN_SOURCE_ITEMS,
  parseSourceKey,
  resolveGameSource,
  sourceKey,
  sourceRng,
  subsetSource,
  unitSource,
  type LearnerSnapshot,
} from './source';

const NOW = new Date('2026-11-23T10:00:00Z');
const DAY = 86_400_000;
const card = (
  itemType: 'word' | 'sentence',
  itemId: string,
  createdDaysAgo = 30,
  dueInDays = 3,
) => ({
  itemType,
  itemId,
  createdAt: new Date(NOW.getTime() - createdDaysAgo * DAY).toISOString(),
  due: new Date(NOW.getTime() + dueInDays * DAY).toISOString(),
});
const learner = (over: Partial<LearnerSnapshot> = {}): LearnerSnapshot => ({
  cards: [],
  needsReview: [],
  lastLessonId: null,
  now: NOW,
  ...over,
});
/** GREETINGS chia 2 bài học: 4 từ đầu + câu s1–s3 ở `u01-l1`, còn lại ở `u01-l2`. */
const TWO_LESSONS = {
  ...GREETINGS,
  words: GREETINGS.words.map((w, i) => ({ ...w, lesson_id: i < 4 ? 'u01-l1' : 'u01-l2' })),
  sentences: GREETINGS.sentences.map((x, i) => ({ ...x, lesson_id: i < 3 ? 'u01-l1' : 'u01-l2' })),
};
const ids = (src: { words: { id: string }[]; sentences: { id: string }[] }) => [
  ...src.words.map((w) => w.id),
  ...src.sentences.map((x) => x.id),
];

describe('createRng', () => {
  it('cùng seed → cùng dãy; khác seed → khác dãy', () => {
    const seq = (seed: number) => Array.from({ length: 5 }, createRng(seed).next);
    expect(seq(42)).toEqual(seq(42));
    expect(seq(42)).not.toEqual(seq(43));
    for (const x of seq(7)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('int trong [0, max); shuffle giữ đủ phần tử, không sửa mảng gốc', () => {
    const rng = createRng(1);
    for (let i = 0; i < 100; i++) expect(rng.int(4)).toBeLessThan(4);
    const items = [1, 2, 3, 4, 5, 6];
    const shuffled = createRng(1).shuffle(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(createRng(1).shuffle(items)).toEqual(shuffled);
  });
});

describe('nguồn câu hỏi (F-10 v7.10, SCR-08 v3)', () => {
  it('bỏ từ thiếu nghĩa, câu thiếu đáp án; câu nhận cả th_alt', () => {
    expect(gameWords(GREETINGS).map((w) => w.id)).not.toContain('khrap');
    expect(gameWords(GREETINGS)).toHaveLength(8);
    expect(gameWords(CLASSIFIERS)[0]).toEqual({
      id: 'tukkata',
      unitId: 'u03',
      lessonId: 'u03-l1',
      thai: 'ตุ๊กตา',
      meanings: ['búp bê'],
      classifier: 'ตัว',
    });
    const sentences = gameSentences({
      sentences: [{ ...GREETINGS.sentences[0]!, th_alt: ['สวัสดีค่ะ'] }],
    });
    expect(sentences).toEqual([
      {
        id: 's1',
        unitId: 'u01',
        lessonId: 'u01-l1',
        vi: 'Xin chào.',
        th: 'สวัสดีครับ',
        accepted: ['สวัสดีครับ', 'สวัสดีค่ะ'],
        tokens: ['สวัสดี', 'ครับ'],
      },
    ]);
    expect(gameSentences(GREETINGS).map((s) => s.id)).not.toContain('s7');
  });

  it('khóa nguồn: đọc / ghi, giá trị cũ unit:<id> → units:<id>;new, sai → null', () => {
    for (const key of [
      'learned',
      'recent',
      'review',
      'last-lesson',
      'units:b09,b10',
      'lessons:b09-l1;new',
    ]) {
      expect(sourceKey(parseSourceKey(key)!)).toBe(key);
    }
    expect(parseSourceKey('units:b09,b10;new')).toEqual({
      kind: 'units',
      ids: ['b09', 'b10'],
      includeNew: true,
    });
    expect(parseSourceKey('unit:u03')).toEqual({ kind: 'units', ids: ['u03'], includeNew: true });
    expect(parseSourceKey('lesson:b09-l2')).toEqual({
      kind: 'lessons',
      ids: ['b09-l2'],
      includeNew: true,
    });
    for (const bad of [null, '', 'abc', 'units:', 'units:;new', 'lessons']) {
      expect(parseSourceKey(bad)).toBeNull();
    }
  });

  it('Tất cả đã học = mục có thẻ, trên mọi bài, theo lộ trình', () => {
    const src = resolveGameSource(
      [CLASSIFIERS, GREETINGS],
      { kind: 'learned' },
      learner({
        cards: [
          card('word', 'rot'),
          card('word', 'sawatdee'),
          card('sentence', 's2'),
          card('word', 'khrap'),
        ],
      }),
    );
    expect(src.key).toBe('learned');
    expect(ids(src)).toEqual(['sawatdee', 'rot', 's2']);
    expect(src.priority).toBeUndefined();
  });

  it('Học gần đây = thẻ tạo trong 7 ngày', () => {
    const src = resolveGameSource(
      [GREETINGS],
      { kind: 'recent' },
      learner({
        cards: [card('word', 'sawatdee', 2), card('word', 'chue', 6.9), card('word', 'phom', 8)],
      }),
    );
    expect(ids(src)).toEqual(['sawatdee', 'chue']);
  });

  it('Cần ôn = cờ "cần ôn" + thẻ đến hạn; cũng là mục ưu tiên', () => {
    const l = learner({
      cards: [card('word', 'sawatdee', 30, -1), card('word', 'chue'), card('sentence', 's1')],
      needsReview: [{ itemType: 'sentence', itemId: 's2' }],
    });
    const src = resolveGameSource([GREETINGS], { kind: 'review' }, l);
    expect(ids(src)).toEqual(['sawatdee', 's2']);
    expect(src.priority).toEqual(['sawatdee', 's2']);
    // Trong "Tất cả đã học", mục đến hạn được ưu tiên.
    expect(resolveGameSource([GREETINGS], { kind: 'learned' }, l).priority).toEqual(['sawatdee']);
  });

  it('Bài vừa học = mọi mục của bài học hoàn thành gần nhất', () => {
    const src = resolveGameSource(
      [TWO_LESSONS],
      { kind: 'last-lesson' },
      learner({ lastLessonId: 'u01-l2' }),
    );
    expect(src.words.every((w) => w.lessonId === 'u01-l2')).toBe(true);
    expect(src.words).toHaveLength(4);
    expect(resolveGameSource([TWO_LESSONS], { kind: 'last-lesson' }, learner()).words).toEqual([]);
  });

  it('nhiều bài / bài học: mặc định chỉ mục đã học, ;new gồm cả mục chưa học', () => {
    const l = learner({
      cards: [card('word', 'sawatdee'), card('word', 'rot'), card('sentence', 's5')],
    });
    const units = resolveGameSource([GREETINGS, CLASSIFIERS], parseSourceKey('units:u01,u03')!, l);
    expect(ids(units)).toEqual(['sawatdee', 'rot', 's5']);
    const all = resolveGameSource([GREETINGS, CLASSIFIERS], parseSourceKey('units:u03;new')!, l);
    expect(all.words).toHaveLength(9);
    const lesson = resolveGameSource([TWO_LESSONS], parseSourceKey('lessons:u01-l1;new')!, l);
    expect(lesson.words.map((w) => w.lessonId)).toEqual(['u01-l1', 'u01-l1', 'u01-l1', 'u01-l1']);
    expect(lesson.sentences).toHaveLength(3);
    expect(ids(resolveGameSource([TWO_LESSONS], parseSourceKey('lessons:u01-l1')!, l))).toEqual([
      'sawatdee',
    ]);
    // Bài không còn (content đổi) → rỗng, không tự chuyển nguồn khác.
    expect(ids(resolveGameSource([GREETINGS], parseSourceKey('units:u99;new')!, l))).toEqual([]);
  });

  it('mặc định: đủ mục đã học → Tất cả đã học; chưa → Bài vừa học; người mới → bài đầu tiên + chưa học', () => {
    const six = gameWords(GREETINGS)
      .slice(0, MIN_SOURCE_ITEMS)
      .map((w) => card('word', w.id));
    expect(defaultSourceSpec([CLASSIFIERS, GREETINGS], learner({ cards: six }))).toEqual({
      kind: 'learned',
    });
    expect(
      defaultSourceSpec([GREETINGS], learner({ cards: six.slice(1), lastLessonId: 'u01-l1' })),
    ).toEqual({ kind: 'last-lesson' });
    expect(defaultSourceSpec([CLASSIFIERS, GREETINGS], learner())).toEqual({
      kind: 'units',
      ids: ['u01'],
      includeNew: true,
    });
    expect(defaultSourceSpec([], learner())).toEqual({ kind: 'learned' });
  });

  it('đếm theo bài và bài học: tổng / đã học', () => {
    const counts = countByScope(
      [TWO_LESSONS, CLASSIFIERS],
      learner({ cards: [card('word', 'sawatdee'), card('sentence', 's5')] }),
    );
    expect(counts.get('u01')).toEqual({
      words: 8,
      sentences: 6,
      learnedWords: 1,
      learnedSentences: 1,
    });
    expect(counts.get('u01-l1')).toEqual({
      words: 4,
      sentences: 3,
      learnedWords: 1,
      learnedSentences: 0,
    });
    expect(counts.get('u03')?.words).toBe(9);
  });

  it('sourceRng: mục ưu tiên ra trước, mỗi nhóm vẫn xáo; không ưu tiên → như createRng', () => {
    const words = gameWords(GREETINGS);
    const rng = sourceRng(5, { priority: ['phom', 'chue'] });
    const out = rng.shuffle(words).map((w) => w.id);
    expect(out.slice(0, 2).sort()).toEqual(['chue', 'phom']);
    expect([...out].sort()).toEqual(words.map((w) => w.id).sort());
    // Đối tượng có `item.itemId` (câu hỏi của trò arcade) cũng được ưu tiên.
    const prompts = words.map((w) => ({ item: { itemType: 'word', itemId: w.id } }));
    expect(rng.shuffle(prompts)[0]!.item.itemId).toMatch(/^(phom|chue)$/);
    expect(sourceRng(9, {}).shuffle(words)).toEqual(createRng(9).shuffle(words));
    expect(rng.shuffle([3, 1, 2]).sort()).toEqual([1, 2, 3]);
  });
});

describe('subsetSource ("Chơi với mục sai")', () => {
  it('chỉ giữ mục được chọn, giữ key nguồn', () => {
    const sub = subsetSource(unitSource(GREETINGS), [
      { itemType: 'word', itemId: 'chue' },
      { itemType: 'sentence', itemId: 's2' },
      { itemType: 'sentence', itemId: 'chue' },
    ]);
    expect(sub.key).toBe('units:u01;new');
    expect(sub.words.map((w) => w.id)).toEqual(['chue']);
    expect(sub.sentences.map((s) => s.id)).toEqual(['s2']);
  });
});

describe('điểm & combo', () => {
  const item = { itemType: 'word' as const, itemId: 'chue' };
  const answer = (state: GameState, correct: boolean) =>
    applyAnswer(
      state,
      { item, correct, expected: 'tên', ...(correct ? {} : { given: 'bạn' }) },
      'ชื่อ',
      (combo) => 100 * combo,
    );

  it('đúng: combo +1 tới ×5, điểm × combo; sai: combo về 0 + ghi mục sai', () => {
    let s = initialState(0);
    for (let i = 0; i < 6; i++) s = answer(s, true);
    expect(s.combo).toBe(MAX_COMBO);
    expect(s.score).toBe(100 * (1 + 2 + 3 + 4 + 5 + 5));
    expect(s.feedback).toEqual({ item, correct: true, expected: 'tên', points: 500 });
    s = answer(s, false);
    expect(s).toMatchObject({ combo: 0, maxCombo: 5, correct: 6, total: 7, status: 'feedback' });
    expect(s.feedback?.points).toBe(0);
    expect(s.mistakes).toEqual([{ ...item, th: 'ชื่อ', expected: 'tên', given: 'bạn' }]);
    expect(answer(s, true).feedback?.points).toBe(100);
  });

  it('summarize: độ chính xác, mỗi mục sai một lần; finish chỉ một lần', () => {
    let s = initialState(1000);
    expect(summarize('true-false', s, 0).accuracy).toBe(0);
    s = answer(answer(answer(s, false), true), false);
    const done = finish(s, 5000);
    expect(done).toMatchObject({ status: 'finished', finishedAt: 5000, feedback: null });
    expect(finish(done, 9000)).toBe(done);
    const summary = summarize('true-false', done, 4000);
    expect(summary).toMatchObject({ correct: 1, total: 3, durationMs: 4000, maxCombo: 1 });
    expect(summary.accuracy).toBeCloseTo(1 / 3);
    expect(summary.mistakes).toHaveLength(1);
  });

  it('kỷ lục: Ghép cặp nhanh hơn (bằng giờ → điểm cao hơn); trò khác điểm cao hơn', () => {
    const s = (score: number, durationMs: number) => ({
      score,
      durationMs,
      correct: 6,
      total: 6,
      maxCombo: 0,
    });
    expect(isBetterResult('match', s(100, 40_000), s(900, 50_000))).toBe(true);
    expect(isBetterResult('match', s(900, 50_000), s(100, 40_000))).toBe(false);
    expect(isBetterResult('match', s(600, 40_000), s(500, 40_000))).toBe(true);
    expect(isBetterResult('true-false', s(600, 60_000), s(500, 60_000))).toBe(true);
    expect(isBetterResult('classifier-rush', s(500, 60_000), s(500, 60_000))).toBe(false);
  });
});
