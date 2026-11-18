import { describe, expect, it } from 'vitest';
import { bundle, CLASSIFIERS, GREETINGS } from './fixtures.test-utils';
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
  gameSentences,
  gameWords,
  LEARNED_SOURCE,
  learnedSource,
  MIN_LEARNED_ITEMS,
  selectGameSource,
  unitSourceKey,
} from './source';

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

describe('nguồn câu hỏi (F-10 v7.2)', () => {
  it('bỏ từ thiếu nghĩa, câu thiếu đáp án; câu nhận cả th_alt', () => {
    expect(gameWords(GREETINGS).map((w) => w.id)).not.toContain('khrap');
    expect(gameWords(GREETINGS)).toHaveLength(8);
    expect(gameWords(CLASSIFIERS)[0]).toEqual({
      id: 'tukkata',
      unitId: 'u03',
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
        vi: 'Xin chào.',
        th: 'สวัสดีครับ',
        accepted: ['สวัสดีครับ', 'สวัสดีค่ะ'],
        tokens: ['สวัสดี', 'ครับ'],
      },
    ]);
    expect(gameSentences(GREETINGS).map((s) => s.id)).not.toContain('s7');
  });

  it('"Từ đã học" = mục có thẻ, trên mọi chuyên đề', () => {
    const source = learnedSource(
      [GREETINGS, CLASSIFIERS],
      [
        { itemType: 'word', itemId: 'sawatdee' },
        { itemType: 'word', itemId: 'rot' },
        { itemType: 'sentence', itemId: 's2' },
        { itemType: 'word', itemId: 's1' },
        { itemType: 'word', itemId: 'khrap' },
      ],
    );
    expect(source.key).toBe(LEARNED_SOURCE);
    expect(source.words.map((w) => w.id)).toEqual(['sawatdee', 'rot']);
    expect(source.sentences.map((s) => s.id)).toEqual(['s2']);
  });

  it('đủ mục đã học → dùng mục đã học', () => {
    const learned = gameWords(GREETINGS)
      .slice(0, MIN_LEARNED_ITEMS)
      .map((w) => ({ itemType: 'word' as const, itemId: w.id }));
    const { source, fallback } = selectGameSource([CLASSIFIERS, GREETINGS], learned);
    expect(fallback).toBe(false);
    expect(source.key).toBe(LEARNED_SOURCE);
    expect(source.words).toHaveLength(MIN_LEARNED_ITEMS);
  });

  it('chưa đủ mục đã học → chuyên đề đầu tiên theo order (fallback)', () => {
    const learned = [{ itemType: 'word' as const, itemId: 'rot' }];
    const { source, fallback } = selectGameSource([CLASSIFIERS, GREETINGS], learned);
    expect(fallback).toBe(true);
    expect(source).toMatchObject({ key: unitSourceKey('u01'), unitId: 'u01' });
    expect(source.sentences).toHaveLength(6);
  });

  it('chọn một chuyên đề → từ/câu của chuyên đề đó, kể cả chưa học', () => {
    const { source, fallback } = selectGameSource([GREETINGS, CLASSIFIERS], [], 'unit:u03');
    expect(fallback).toBe(false);
    expect(source.key).toBe('unit:u03');
    expect(source.words).toHaveLength(9);
    // Chuyên đề không còn (content đổi) → quay về "Từ đã học".
    expect(selectGameSource([GREETINGS], [], 'unit:u99').source.key).toBe('unit:u01');
    expect(selectGameSource([], [], LEARNED_SOURCE)).toEqual({
      source: { key: LEARNED_SOURCE, words: [], sentences: [] },
      fallback: false,
    });
    expect(bundle('u05', 5, []).words).toEqual([]);
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
