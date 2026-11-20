import { describe, expect, it } from 'vitest';
import { bundle, CLASSIFIERS, GREETINGS } from './fixtures.test-utils';
import {
  BASE_QUESTION_MS,
  BONUS_LIFE_STREAK,
  classifierRush,
  currentQuestion,
  GAME_IDS,
  GAMES,
  MATCH_PAIRS,
  MAX_LIVES,
  MAX_QUESTION_MS,
  matchPairs,
  questionEndsAt,
  questionTimeMs,
  rapidQuestionEndsAt,
  SENTENCE_RUSH_MS,
  sentenceRush,
  START_LIVES,
  trueFalse,
  resultStars,
  unitSource,
  type GameSource,
  type MatchState,
  type RapidState,
  type TrueFalseQuestion,
} from './index';

const greetings = unitSource(GREETINGS);
const classifiers = unitSource(CLASSIFIERS);
const empty: GameSource = { key: 'learned', words: [], sentences: [] };
const T = 1_000_000;

describe('danh sách trò chơi (F-14)', () => {
  it('mỗi GameId có đúng một module', () => {
    expect(Object.keys(GAMES).sort()).toEqual([...GAME_IDS].sort());
    for (const id of GAME_IDS) expect(GAMES[id].id).toBe(id);
  });

  it('khóa khi thiếu dữ liệu, kèm lý do; generateRound throw', () => {
    expect(matchPairs.availability(greetings)).toEqual({ ok: true });
    expect(matchPairs.availability(empty)).toEqual({
      ok: false,
      reason: 'words',
      need: 6,
      have: 0,
    });
    expect(trueFalse.availability(empty)).toMatchObject({ ok: false, reason: 'words' });
    expect(sentenceRush.availability(classifiers)).toMatchObject({
      ok: false,
      reason: 'sentences',
      need: 5,
      have: 0,
    });
    expect(classifierRush.availability(greetings)).toMatchObject({
      ok: false,
      reason: 'classifiers',
      need: 8,
    });
    // Đủ 8 từ nhưng chỉ một loại từ → không có lựa chọn.
    const oneKind = unitSource(
      bundle(
        'u09',
        9,
        Array.from({ length: 8 }, (_, i) => [`w${i}`, `ก${i}`, [`nghĩa ${i}`], 'ตัว']),
      ),
    );
    expect(classifierRush.availability(oneKind)).toMatchObject({ ok: false, have: 0 });
    expect(() => sentenceRush.generateRound(classifiers, 1)).toThrow(/sentences: 0\/5/);
  });

  it('cùng seed → cùng lượt; trò không nhận câu trả lời khi đã kết thúc', () => {
    for (const id of GAME_IDS) {
      const game = GAMES[id];
      const source = id === 'classifier-rush' ? classifiers : greetings;
      expect(game.generateRound(source, 7)).toEqual(game.generateRound(source, 7));
      expect(game.generateRound(source, 7)).not.toEqual(game.generateRound(source, 8));
    }
  });
});

describe('F-01 Ghép cặp', () => {
  const round = matchPairs.generateRound(greetings, 3);
  const pairOf = (state: MatchState, i: number) =>
    state.cards.findIndex((c, j) => j !== i && c.wordId === state.cards[i]!.wordId);
  const wrongOf = (state: MatchState, i: number) =>
    state.cards.findIndex(
      (c, j) =>
        c.face !== state.cards[i]!.face &&
        c.wordId !== state.cards[i]!.wordId &&
        !state.matched.includes(c.wordId) &&
        j !== i,
    );

  it('12 thẻ = 6 từ Thái + 6 nghĩa, không trùng chữ/nghĩa', () => {
    expect(round.cards).toHaveLength(MATCH_PAIRS * 2);
    expect(new Set(round.cards.map((c) => c.text)).size).toBe(12);
    expect(round.cards.filter((c) => c.face === 'th')).toHaveLength(6);
  });

  it('ghép hết → kết thúc, điểm theo thời gian + lượt lật thừa', () => {
    let s = matchPairs.start(round, T);
    // Một lượt sai (thẻ chưa thấy → không tính "cần ôn"), UI gọi next để úp lại.
    const first = 0;
    s = matchPairs.answer(s, first, T + 100);
    expect(s.open).toEqual([first]);
    expect(matchPairs.answer(s, first, T + 150)).toBe(s);
    s = matchPairs.answer(s, wrongOf(s, first), T + 200);
    expect(s).toMatchObject({ status: 'feedback', total: 1, correct: 0, mistakes: [] });
    expect(matchPairs.answer(s, 5, T + 250)).toBe(s);
    s = matchPairs.next(s, T + 1000);
    expect(s).toMatchObject({ status: 'playing', open: [], feedback: null });
    expect(matchPairs.next(s, T + 1000)).toBe(s);

    for (let i = 0; i < s.cards.length; i++) {
      if (s.matched.includes(s.cards[i]!.wordId)) continue;
      expect(matchPairs.answer(s, i, T + 1500).open).toEqual([i]);
      s = matchPairs.answer(matchPairs.answer(s, i, T + 1500), pairOf(s, i), T + 2000);
      expect(matchPairs.answer(s, i, T + 2100)).toBe(s);
    }
    expect(s).toMatchObject({ status: 'finished', finishedAt: T + 2000, correct: 6, total: 7 });
    // 2 giây, 1 lượt thừa: 1000 − 2×5 − 20.
    expect(matchPairs.score(s)).toBe(970);
    expect(matchPairs.tick(s, T + 9000)).toBe(s);
    expect(matchPairs.summary(s)).toMatchObject({ durationMs: 2000, mistakes: [], correct: 6 });
  });

  it('sai khi cả 2 thẻ đã thấy → mục "cần ôn"; chưa kết thúc thì thời gian = 0', () => {
    let s = matchPairs.start(round, T);
    const th = s.cards.findIndex((c) => c.face === 'th');
    const vi = wrongOf(s, th);
    // Lượt 1: thấy cả hai, sai (chưa tính). Lượt 2: lật lại đúng 2 thẻ đó → tính sai.
    s = matchPairs.next(matchPairs.answer(matchPairs.answer(s, th, T), vi, T), T);
    s = matchPairs.answer(matchPairs.answer(s, vi, T), th, T);
    const word = s.cards[th]!;
    expect(s.mistakes).toEqual([
      {
        itemType: 'word',
        itemId: word.wordId,
        th: word.text,
        expected: s.cards[pairOf(s, th)]!.text,
        given: s.cards[vi]!.text,
      },
    ]);
    expect(matchPairs.summary(s).durationMs).toBe(0);
  });

  it('2 thẻ cùng mặt (Thái–Thái) sai không tính "cần ôn"', () => {
    let s = matchPairs.start(round, T);
    const [a, b] = s.cards.flatMap((c, i) => (c.face === 'th' ? [i] : []));
    for (let k = 0; k < 2; k++)
      s = matchPairs.next(matchPairs.answer(matchPairs.answer(s, a!, T), b!, T), T);
    expect(s.mistakes).toEqual([]);
    expect(s.total).toBe(2);
    // Thẻ không tồn tại → bỏ qua.
    expect(matchPairs.answer(s, 99, T)).toBe(s);
  });
});

describe("F-02' Đúng hay sai?", () => {
  const round = trueFalse.generateRound(greetings, 11);

  it('khoảng 50% nghĩa đúng; nghĩa sai lấy từ mục cùng loại; giờ theo độ dài', () => {
    const trues = round.questions.filter((q) => q.isTrue).length;
    expect(trues / round.questions.length).toBeGreaterThan(0.3);
    expect(trues / round.questions.length).toBeLessThan(0.7);
    for (const q of round.questions) {
      if (q.isTrue) expect(q.shown).toBe(q.expected);
      else expect(q.shown).not.toBe(q.expected);
      if (q.item.itemType === 'word') expect(q.timeMs).toBe(BASE_QUESTION_MS);
      if (!q.isTrue && q.item.itemType === 'sentence') {
        expect(greetings.sentences.map((s) => s.vi)).toContain(q.shown);
      }
    }
    // Câu 4 thẻ từ → 6 s.
    expect(round.questions.find((q) => q.item.itemId === 's4')!.timeMs).toBe(6_000);
  });

  it('nghĩa sai không bao giờ là nghĩa khác của cùng chữ Thái (มา "đến" / มา "tới")', () => {
    const homographs = unitSource(
      bundle('u09', 9, [
        ['ma', 'มา', ['đến']],
        ['ma2', 'มา', ['tới']],
        ['khao', 'ข้าว', ['cơm']],
        ['nam', 'น้ำ', ['nước']],
        ['pai', 'ไป', ['đi']],
        ['kin', 'กิน', ['ăn']],
        ['non', 'นอน', ['ngủ']],
      ]),
    );
    for (let seed = 1; seed <= 10; seed++) {
      for (const q of trueFalse.generateRound(homographs, seed).questions) {
        if (q.th === 'มา' && !q.isTrue) expect(['đến', 'tới']).not.toContain(q.shown);
      }
    }
  });

  it('nhận nhầm nghĩa sai là đúng → ghi nghĩa đã nhận; từ chối nghĩa đúng → không có given', () => {
    const falseQ = round.questions.findIndex((q) => !q.isTrue);
    const trueQ = round.questions.findIndex((q) => q.isTrue);
    const at = (index: number) => ({ ...trueFalse.start(round, T), index });
    expect(trueFalse.answer(at(falseQ), true, T).mistakes[0]).toMatchObject({
      given: round.questions[falseQ]!.shown,
      expected: round.questions[falseQ]!.expected,
    });
    expect(trueFalse.answer(at(trueQ), false, T).mistakes[0]).not.toHaveProperty('given');
  });

  it('nguồn chỉ có câu: nghĩa sai lấy từ câu khác', () => {
    const onlySentences = { ...greetings, words: [] };
    const { questions } = trueFalse.generateRound(onlySentences, 2);
    expect(questions.every((q) => q.item.itemType === 'sentence')).toBe(true);
    // Một từ lẻ giữa các câu: nghĩa sai lấy từ câu (không có từ khác cùng loại).
    const oneWord = { ...onlySentences, words: greetings.words.slice(0, 1) };
    const q = trueFalse
      .generateRound(oneWord, 5)
      .questions.find((x) => x.item.itemType === 'word' && !x.isTrue)!;
    expect(greetings.sentences.map((s) => s.vi)).toContain(q.shown);
  });
});

describe('luật "3 tim" (v7.3, Đúng hay sai? + Đoán loại từ)', () => {
  const round = trueFalse.generateRound(greetings, 11);
  const right = (s: RapidState<TrueFalseQuestion>) => currentQuestion(s).isTrue;

  it('questionTimeMs: 5 s, +1 s mỗi 3 thẻ, tối đa 9 s', () => {
    expect(questionTimeMs(1)).toBe(5_000);
    expect(questionTimeMs(3)).toBe(6_000);
    expect(questionTimeMs(7)).toBe(7_000);
    expect(questionTimeMs(30)).toBe(MAX_QUESTION_MS);
  });

  it('đúng: 100 × combo + thưởng tốc độ; sai / hết giờ: mất tim; hết tim → kết thúc', () => {
    let s = trueFalse.start(round, T);
    expect(s).toMatchObject({ lives: START_LIVES, streak: 0, lifeDelta: 0 });
    // Trả lời ngay → +50 tốc độ.
    s = trueFalse.answer(s, right(s), T);
    expect(s.feedback).toMatchObject({ correct: true, points: 150 });
    expect(trueFalse.answer(s, true, T)).toBe(s);
    expect(trueFalse.tick(s, T + 60_000)).toBe(s);
    s = trueFalse.next(s, T + 100);
    // Nửa thời gian → +25, combo ×2.
    const half = currentQuestion(s).timeMs / 2;
    s = trueFalse.next(trueFalse.answer(s, right(s), T + 100 + half), T + 5_000);
    expect(s.score).toBe(150 + 225);
    expect(s.combo).toBe(2);

    // Sai → mất tim.
    s = trueFalse.answer(s, !right(s), T + 5_100);
    expect(s).toMatchObject({ lives: 2, lifeDelta: -1, combo: 0, streak: 0 });
    s = trueFalse.next(s, T + 6_000);
    expect(s.lifeDelta).toBe(0);
    // Hết giờ (tick) → mất tim, không có given.
    const ends = rapidQuestionEndsAt(s);
    expect(trueFalse.tick(s, ends - 1)).toBe(s);
    s = trueFalse.tick(s, ends);
    expect(s).toMatchObject({ lives: 1, lifeDelta: -1 });
    expect(s.feedback).not.toHaveProperty('given');
    s = trueFalse.next(s, ends + 100);
    // Trả lời sau khi hết giờ (chưa kịp tick) → như hết giờ.
    const late = rapidQuestionEndsAt(s) + 10;
    s = trueFalse.answer(s, right(s), late);
    expect(s).toMatchObject({ lives: 0, status: 'feedback' });
    // Hết tim: next → kết thúc.
    s = trueFalse.next(s, late + 500);
    expect(s).toMatchObject({ status: 'finished', finishedAt: late + 500 });
    expect(trueFalse.score(s)).toBe(375);
    expect(trueFalse.summary(s)).toMatchObject({
      correct: 2,
      total: 5,
      durationMs: late + 500 - T,
      maxCombo: 2,
    });
    expect(trueFalse.summary(trueFalse.start(round, T)).durationMs).toBe(0);
  });

  it('đúng 15 câu liền → +1 tim (tối đa 5); chơi lâu thì câu lặp lại', () => {
    let s = trueFalse.start(round, T);
    let gained = 0;
    for (let i = 0; i < BONUS_LIFE_STREAK * 3 + round.questions.length; i++) {
      s = trueFalse.answer(s, right(s), T);
      if (s.lifeDelta === 1) gained++;
      s = trueFalse.next(s, T);
    }
    expect(s.lives).toBe(MAX_LIVES);
    expect(gained).toBe(MAX_LIVES - START_LIVES);
    expect(s.index).toBeGreaterThan(round.questions.length);
    expect(s.status).toBe('playing');
  });
});

describe("F-03' Xếp câu tốc độ", () => {
  const round = sentenceRush.generateRound(greetings, 5);

  it('5 câu có thẻ từ; ngân hàng thẻ đã xáo, đủ thẻ, không thẻ nhiễu', () => {
    expect(round.questions).toHaveLength(5);
    for (const q of round.questions) {
      const s = greetings.sentences.find((x) => x.id === q.item.itemId)!;
      expect([...q.bank].sort()).toEqual([...s.tokens].sort());
      expect(q.bank.join('')).not.toBe(s.th);
    }
  });

  it('đúng = 100 + giây còn lại × 10; sai/hết giờ = 0 + hiện đáp án; 5 câu → kết thúc', () => {
    let s = sentenceRush.start(round, T);
    const tokens = (i: number) =>
      greetings.sentences.find((x) => x.id === round.questions[i]!.item.itemId)!.tokens;

    // Câu 1: đúng sau 4,5 s → còn 15 s.
    s = sentenceRush.answer(s, tokens(0), T + 4_500);
    expect(s.feedback).toMatchObject({ correct: true, points: 250 });
    expect(sentenceRush.answer(s, tokens(0), T + 4_600)).toBe(s);
    expect(sentenceRush.tick(s, T + 60_000)).toBe(s);
    s = sentenceRush.next(s, T + 5_000);
    expect(questionEndsAt(s)).toBe(T + 5_000 + SENTENCE_RUSH_MS);

    // Câu 2: sai thứ tự.
    s = sentenceRush.answer(s, [...tokens(1)].reverse(), T + 6_000);
    expect(s.feedback).toMatchObject({
      correct: false,
      points: 0,
      expected: round.questions[1]!.th,
    });
    s = sentenceRush.next(s, T + 7_000);

    // Câu 3: hết giờ (tick) → sai, không có given.
    expect(sentenceRush.tick(s, T + 26_999)).toBe(s);
    s = sentenceRush.tick(s, T + 27_000);
    expect(s.feedback).toMatchObject({ correct: false });
    expect(s.feedback).not.toHaveProperty('given');
    s = sentenceRush.next(s, T + 28_000);

    // Câu 4: gửi sau khi hết giờ → như hết giờ.
    s = sentenceRush.next(sentenceRush.answer(s, tokens(3), T + 50_000), T + 50_000);
    // Câu 5: đúng (bỏ khoảng trắng khi so).
    s = sentenceRush.answer(s, [tokens(4).join(' ')], T + 51_000);
    expect(s.feedback?.correct).toBe(true);
    s = sentenceRush.next(s, T + 52_000);

    expect(s).toMatchObject({ status: 'finished', finishedAt: T + 52_000, correct: 2, total: 5 });
    expect(sentenceRush.score(s)).toBe(250 + 290);
    expect(sentenceRush.summary(s)).toMatchObject({ durationMs: 52_000 });
    expect(sentenceRush.summary(s).mistakes).toHaveLength(3);
    expect(sentenceRush.summary(sentenceRush.start(round, T)).durationMs).toBe(0);
  });

  it('thẻ giống nhau không xáo được → xoay', () => {
    const same = unitSource(
      bundle(
        'u08',
        8,
        [],
        [
          ['a', 'A', ['ดี', 'ดี']],
          ['b', 'B', ['ดี', 'ดี']],
          ['c', 'C', ['ดี', 'ดี']],
          ['d', 'D', ['ดี', 'ดี']],
          ['e', 'E', ['ดี', 'ดี']],
        ],
      ),
    );
    const r = sentenceRush.generateRound(same, 1);
    expect(r.questions.every((q) => q.bank.join('') === 'ดีดี')).toBe(true);
  });
});

describe("F-04' Đoán loại từ", () => {
  const round = classifierRush.generateRound(classifiers, 9);

  it('mỗi từ: 4 lựa chọn khác nhau gồm đáp án, lấy từ loại từ có trong nguồn; 5 s/từ', () => {
    const all = new Set(classifiers.words.map((w) => w.classifier));
    for (const q of round.questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.expected);
      expect(q.timeMs).toBe(BASE_QUESTION_MS);
      for (const o of q.options) expect(all.has(o)).toBe(true);
    }
  });

  it('chỉ 2 loại từ → 2 lựa chọn', () => {
    const two = {
      ...classifiers,
      words: classifiers.words.filter((w) => w.classifier !== 'คัน' && w.classifier !== 'ด้าม'),
    };
    const extra = [...two.words, ...two.words.map((w) => ({ ...w, id: `${w.id}-2` }))];
    const q = classifierRush.generateRound({ ...two, words: extra }, 1).questions[0]!;
    expect(q.options).toHaveLength(2);
  });

  it('chọn đúng / sai; mục sai ghi loại từ đã chọn, mất tim', () => {
    let s = classifierRush.start(round, T);
    s = classifierRush.next(classifierRush.answer(s, currentQuestion(s).expected, T), T);
    expect(s.score).toBe(150);
    const q = currentQuestion(s);
    const wrong = q.options.find((o) => o !== q.expected)!;
    s = classifierRush.answer(s, wrong, T);
    expect(s.mistakes[0]).toMatchObject({ given: wrong, expected: q.expected });
    expect(s.lives).toBe(START_LIVES - 1);
  });
});

describe('sao kết quả (plan 0.14)', () => {
  it('≥ 90% → 3 sao, ≥ 60% → 2, còn lại 1; chưa trả lời → 0', () => {
    expect(resultStars({ total: 10, accuracy: 0.9 })).toBe(3);
    expect(resultStars({ total: 10, accuracy: 0.6 })).toBe(2);
    expect(resultStars({ total: 10, accuracy: 0.59 })).toBe(1);
    expect(resultStars({ total: 1, accuracy: 0 })).toBe(1);
    expect(resultStars({ total: 0, accuracy: 0 })).toBe(0);
  });
});
