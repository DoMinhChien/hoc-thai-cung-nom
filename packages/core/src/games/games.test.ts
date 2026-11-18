import { describe, expect, it } from 'vitest';
import { bundle, CLASSIFIERS, GREETINGS } from './fixtures.test-utils';
import {
  CLASSIFIER_QUESTION_MS,
  CLASSIFIER_RUSH_MS,
  classifierQuestionEndsAt,
  classifierRush,
  GAME_IDS,
  GAMES,
  MATCH_PAIRS,
  matchPairs,
  questionEndsAt,
  SENTENCE_RUSH_MS,
  sentenceRush,
  TRUE_FALSE_MS,
  trueFalse,
  unitSource,
  type GameSource,
  type MatchState,
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

  it('khoảng 50% nghĩa đúng; nghĩa sai lấy từ mục cùng loại, khác nghĩa đúng', () => {
    const trues = round.questions.filter((q) => q.isTrue).length;
    expect(trues / round.questions.length).toBeGreaterThan(0.3);
    expect(trues / round.questions.length).toBeLessThan(0.7);
    for (const q of round.questions) {
      if (q.isTrue) expect(q.shown).toBe(q.expected);
      else expect(q.shown).not.toBe(q.expected);
      if (!q.isTrue && q.item.itemType === 'sentence') {
        expect(greetings.sentences.map((s) => s.vi)).toContain(q.shown);
      }
    }
  });

  it('60 s: đúng +100 × combo, sai → combo 0; hết giờ kết thúc', () => {
    let s = trueFalse.start(round, T);
    expect(s.endsAt).toBe(T + TRUE_FALSE_MS);
    const say = (correct: boolean, now: number) => {
      const q = s.questions[s.index]!;
      s = trueFalse.answer(s, correct ? q.isTrue : !q.isTrue, now);
      const fb = s.feedback;
      s = trueFalse.next(s, now);
      return fb;
    };
    expect(say(true, T + 1000)?.points).toBe(100);
    expect(say(true, T + 2000)?.points).toBe(200);
    const wrong = say(false, T + 3000)!;
    expect(wrong).toMatchObject({ correct: false, points: 0 });
    expect(s).toMatchObject({ combo: 0, score: 300, index: 3, status: 'playing' });
    expect(trueFalse.next(s, T + 3000)).toBe(s);

    expect(trueFalse.tick(s, T + 59_999)).toBe(s);
    const ended = trueFalse.tick(s, T + 61_000);
    expect(ended).toMatchObject({ status: 'finished', finishedAt: T + TRUE_FALSE_MS });
    expect(trueFalse.answer(ended, true, T + 61_000)).toBe(ended);
    expect(trueFalse.answer(s, true, T + 60_000).status).toBe('finished');
    expect(trueFalse.score(ended)).toBe(300);
    const summary = trueFalse.summary(ended);
    expect(summary).toMatchObject({ durationMs: TRUE_FALSE_MS, correct: 2, total: 3 });
    expect(summary.mistakes).toHaveLength(1);
    expect(trueFalse.summary(trueFalse.start(round, T)).durationMs).toBe(TRUE_FALSE_MS);
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
    // Trả lời xong lúc hết giờ: next kết thúc lượt.
    expect(trueFalse.next(trueFalse.answer(at(trueQ), true, T), T + TRUE_FALSE_MS).status).toBe(
      'finished',
    );
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

  it('mỗi từ: 4 lựa chọn khác nhau gồm đáp án, lấy từ loại từ có trong nguồn', () => {
    const all = new Set(classifiers.words.map((w) => w.classifier));
    for (const q of round.questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.expected);
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

  it('đúng +100 × combo + thưởng tốc độ; 5 s/từ; 60 s/lượt', () => {
    let s = classifierRush.start(round, T);
    const q = () => s.questions[s.index]!;

    // Trả lời ngay → thưởng đủ 50.
    s = classifierRush.answer(s, q().expected, T);
    expect(s.feedback).toMatchObject({ correct: true, points: 150 });
    s = classifierRush.next(s, T + 500);
    // Sau 2,5 s → thưởng 25, combo ×2.
    s = classifierRush.answer(s, q().expected, T + 3_000);
    expect(s.feedback?.points).toBe(225);
    s = classifierRush.next(s, T + 3_000);
    // Chọn sai.
    const wrong = q().options.find((o) => o !== q().expected)!;
    s = classifierRush.answer(s, wrong, T + 3_100);
    expect(s.mistakes.at(-1)).toMatchObject({
      given: wrong,
      expected: round.questions[2]!.expected,
    });
    expect(s.combo).toBe(0);
    s = classifierRush.next(s, T + 3_200);
    expect(classifierQuestionEndsAt(s)).toBe(T + 3_200 + CLASSIFIER_QUESTION_MS);

    // Hết 5 s (tick) → sai không có given.
    expect(classifierRush.tick(s, T + 8_199)).toBe(s);
    s = classifierRush.tick(s, T + 8_200);
    expect(s.feedback).toMatchObject({ correct: false });
    expect(s.feedback).not.toHaveProperty('given');
    expect(classifierRush.tick(s, T + 8_300)).toBe(s);
    s = classifierRush.next(s, T + 8_300);
    // Trả lời sau 5 s (chưa kịp tick) → như hết giờ.
    s = classifierRush.answer(s, q().expected, T + 13_400);
    expect(s.feedback?.correct).toBe(false);
    expect(classifierRush.answer(s, q().expected, T + 13_500)).toBe(s);

    // Hết lượt.
    expect(classifierRush.next(s, T + CLASSIFIER_RUSH_MS).status).toBe('finished');
    const playing = classifierRush.next(s, T + 14_000);
    expect(classifierRush.answer(playing, 'ตัว', T + 60_000).status).toBe('finished');
    // Giờ từ cuối không vượt quá hết lượt.
    expect(classifierQuestionEndsAt({ ...playing, questionStartedAt: T + 58_000 })).toBe(
      T + CLASSIFIER_RUSH_MS,
    );
    const ended = classifierRush.tick(playing, T + 70_000);
    expect(ended).toMatchObject({ status: 'finished', finishedAt: T + CLASSIFIER_RUSH_MS });
    expect(classifierRush.score(ended)).toBe(375);
    expect(classifierRush.summary(ended)).toMatchObject({
      durationMs: CLASSIFIER_RUSH_MS,
      correct: 2,
      total: 5,
      maxCombo: 2,
    });
    expect(classifierRush.summary(classifierRush.start(round, T)).durationMs).toBe(
      CLASSIFIER_RUSH_MS,
    );
  });
});
