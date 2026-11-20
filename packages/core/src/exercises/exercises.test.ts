import { describe, expect, it } from 'vitest';
import type { UnitBundle } from '../content/bundle';
import { bundle, CLASSIFIERS, GREETINGS } from '../games/fixtures.test-utils';
import { createRng } from '../games/rng';
import {
  checkAnswer,
  checkMatchPair,
  CHOICE_OPTIONS,
  EXERCISE_TYPES,
  EXERCISES,
  exercisePool,
  gradeAttempt,
  gradeMatchItem,
  EXERCISE_MATCH_PAIRS,
  type ExerciseContext,
  type Question,
} from '.';

/** Hội thoại giả: 4 cặp hỏi ↔ đáp + 1 dòng không phải câu hỏi + 2 câu hỏi liền nhau. */
const DIALOGUE: UnitBundle = {
  ...bundle('u02', 2, []),
  dialogues: [
    {
      id: 'd1',
      lesson_id: 'u02-l1',
      draft: true,
      lines: [
        { speaker: 'A', th: 'คุณชื่ออะไร', vi: 'Bạn tên gì?' },
        { speaker: 'B', th: 'ผมชื่อนิด', vi: 'Tôi tên Nít.' },
        { speaker: 'A', th: 'คุณสบายดีไหม', vi: 'Bạn khỏe không?' },
        { speaker: 'B', th: 'สบายดี', vi: 'Khỏe.' },
        { speaker: 'A', th: 'บ้านอยู่ที่ไหน', vi: 'Nhà ở đâu?' },
        { speaker: 'B', th: 'อยู่ที่ฮานอย', vi: 'Ở Hà Nội.' },
        { speaker: 'A', th: 'กี่โมงแล้ว?', vi: 'Mấy giờ rồi' },
        { speaker: 'B', th: 'สามโมง', vi: 'Ba giờ.' },
        { speaker: 'B', th: 'ไปไหน', vi: 'Đi đâu?' },
        { speaker: 'A', th: 'ไปไหนมา', vi: 'Đi đâu về?' },
        { speaker: 'B', th: 'ไปตลาด', vi: 'Đi chợ.' },
      ],
    },
  ],
};

const pool = exercisePool([GREETINGS, CLASSIFIERS, DIALOGUE]);
const ctx = (seed = 1, extra: Partial<ExerciseContext> = {}): ExerciseContext => ({
  pool,
  rng: createRng(seed),
  ...extra,
});

function asChoice(q: Question) {
  if (q.kind !== 'choice') throw new Error(`expected choice, got ${q.kind}`);
  return q;
}

describe('exercisePool', () => {
  it('bỏ từ thiếu nghĩa và câu thiếu đáp án; nối nghĩa bằng "; "', () => {
    expect(pool.words.map((w) => w.id)).not.toContain('khrap');
    expect(pool.sentences.map((s) => s.id)).not.toContain('s7');
    expect(pool.words.find((w) => w.id === 'sawatdee')?.meaning).toBe('xin chào; tạm biệt');
    expect(pool.sentences.find((s) => s.id === 's1')?.accepted).toEqual(['สวัสดีครับ']);
  });

  it('cặp hỏi ↔ đáp: dòng hỏi ("?" ở bản dịch hoặc câu Thái) + dòng kế tiếp của người khác', () => {
    expect(pool.qa.map((q) => q.id)).toEqual(['d1#0', 'd1#2', 'd1#4', 'd1#6', 'd1#9']);
    expect(pool.qa[0]).toMatchObject({ question: 'คุณชื่ออะไร', answer: 'ผมชื่อนิด', unitId: 'u02' });
  });
});

describe('10 loại bài tập (E-01..E-09, E-14)', () => {
  it('mỗi loại có trong registry, đúng itemType', () => {
    expect(Object.keys(EXERCISES)).toEqual([...EXERCISE_TYPES]);
    expect(EXERCISES['E-01'].itemType).toBe('word');
    expect(EXERCISES['E-05'].itemType).toBe('sentence');
    expect(EXERCISES['E-09'].itemType).toBe('dialogue');
  });

  it('E-01 nghĩa của từ: 4 lựa chọn Việt, có đáp án, nhiễu cùng unit, không trùng', () => {
    const q = asChoice(EXERCISES['E-01'].generate('chue', ctx()));
    expect(q).toMatchObject({ prompt: { th: 'ชื่อ' }, audio: 'ชื่อ', optionsLang: 'vi' });
    expect(q.answer).toBe('tên');
    expect(q.options).toHaveLength(CHOICE_OPTIONS);
    expect(new Set(q.options).size).toBe(CHOICE_OPTIONS);
    expect(q.options).toContain('tên');
    const greetings = pool.words.filter((w) => w.unitId === 'u01').map((w) => w.meaning);
    expect(q.options.every((o) => greetings.includes(o))).toBe(true);
  });

  it('E-02 từ cho nghĩa: đề Việt, lựa chọn Thái', () => {
    const q = asChoice(EXERCISES['E-02'].generate('khun', ctx()));
    expect(q).toMatchObject({ prompt: { vi: 'bạn' }, optionsLang: 'th', answer: 'คุณ' });
    expect(q.options).toContain('คุณ');
  });

  it('cùng seed → cùng đề', () => {
    expect(EXERCISES['E-01'].generate('chue', ctx(7))).toEqual(
      EXERCISES['E-01'].generate('chue', ctx(7)),
    );
  });

  it('E-03 ghép cặp: 5 cặp gồm mục chính, cột phải xáo; checkMatchPair', () => {
    const q = EXERCISES['E-03'].generate('chue', ctx());
    if (q.kind !== 'match') throw new Error();
    expect(q.pairs).toHaveLength(EXERCISE_MATCH_PAIRS);
    expect(q.pairs.map((p) => p.item.itemId)).toContain('chue');
    expect([...q.rightOrder].sort()).toEqual(q.pairs.map((p) => p.right).sort());
    expect(q.lang).toEqual({ left: 'th', right: 'vi' });
    expect(checkMatchPair(q, 'ชื่อ', 'tên')).toBe(true);
    expect(checkMatchPair(q, 'ชื่อ', q.pairs.find((p) => p.left !== 'ชื่อ')!.right)).toBe(false);
  });

  it('E-04 điền chỗ trống: đục từ có trong từ vựng, nhiễu không thuộc câu', () => {
    const q = asChoice(EXERCISES['E-04'].generate('s4', ctx()));
    expect(q.prompt).toEqual({ th: '____สบายดีไหม', vi: 'Bạn khỏe không?' });
    expect(q.answer).toBe('คุณ');
    expect(q.options.filter((o) => ['สบาย', 'ดี', 'ไหม'].includes(o))).toEqual([]);
    expect(EXERCISES['E-04'].supports('s1', pool)).toBe(false); // < 3 thẻ
  });

  it('E-04 không có từ vựng trong câu → đục thẻ dài nhất', () => {
    const p = exercisePool([bundle('u9', 9, [], [['x', 'X', ['กก', 'ขขขข', 'ค']]])]);
    const q = asChoice(
      EXERCISES['E-04'].generate('x', {
        pool: { ...p, words: GREETINGS.words.map((w) => ({ ...pool.words[0]!, thai: w.thai })) },
        rng: createRng(1),
      }),
    );
    expect(q.answer).toBe('ขขขข');
  });

  it('E-05 chọn bản dịch: đề Thái, 4 câu Việt', () => {
    const q = asChoice(EXERCISES['E-05'].generate('s2', ctx()));
    expect(q).toMatchObject({
      prompt: { th: 'ขอบคุณคุณ' },
      optionsLang: 'vi',
      answer: 'Cảm ơn bạn.',
    });
    expect(q.options).toHaveLength(4);
  });

  it('E-06 sắp xếp: ngân hàng = thẻ + thẻ nhiễu; chấm bỏ khoảng trắng, nhận th_alt', () => {
    const p = exercisePool([
      {
        ...GREETINGS,
        sentences: [
          {
            ...GREETINGS.sentences[2]!,
            th_alt: ['ฉันชื่อนิด'],
            distractors: ['คุณ'],
          },
        ],
      },
    ]);
    const q = EXERCISES['E-06'].generate('s3', { pool: p, rng: createRng(2) });
    if (q.kind !== 'arrange') throw new Error();
    expect([...q.bank].sort()).toEqual(['คุณ', 'ชื่อ', 'นิด', 'ผม'].sort());
    expect(checkAnswer(q, ['ผม', 'ชื่อ', 'นิด'])).toMatchObject({ correct: true });
    expect(checkAnswer(q, 'ฉัน ชื่อ นิด').correct).toBe(true);
    expect(checkAnswer(q, ['ชื่อ', 'ผม', 'นิด'])).toEqual({
      correct: false,
      tone: false,
      expected: 'ผมชื่อนิด',
    });
    expect(EXERCISES['E-06'].supports('s3', p)).toBe(true);
  });

  it('E-07 gõ bản dịch: gợi ý = thẻ đầu; sai dấu → đúng + tone; sai chữ → diff', () => {
    const q = EXERCISES['E-07'].generate('s5', ctx());
    if (q.kind !== 'typing') throw new Error();
    expect(q).toMatchObject({ prompt: { vi: 'Tôi khỏe.' }, hint: 'ฉัน', accepted: ['ฉันสบายดี'] });
    expect(checkAnswer(q, 'ฉันสบายดีค่ะ')).toMatchObject({ correct: true, tone: false });
    expect(checkAnswer(q, 'ฉันสบายดี่')).toMatchObject({ correct: true, tone: true });
    const wrong = checkAnswer(q, 'ฉันสบาย');
    expect(wrong).toMatchObject({ correct: false, expected: 'ฉันสบายดี' });
    expect(wrong.typing?.diff.some((d) => d.kind === 'missing')).toBe(true);
  });

  it('E-08 nghe hiểu: chỉ có audio; thiếu câu nhiễu → nghe rồi xếp thẻ', () => {
    const q = asChoice(EXERCISES['E-08'].generate('s1', ctx()));
    expect(q).toMatchObject({ prompt: {}, audio: 'สวัสดีครับ', answer: 'Xin chào.' });
    const solo = exercisePool([{ ...GREETINGS, sentences: [GREETINGS.sentences[0]!] }]);
    const arrange = EXERCISES['E-08'].generate('s1', { pool: solo, rng: createRng(1) });
    expect(arrange).toMatchObject({ kind: 'arrange', audio: 'สวัสดีครับ' });
    expect(EXERCISES['E-05'].supports('s1', solo)).toBe(false);
  });

  it('E-09 hỏi ↔ đáp: cặp từ hội thoại, cả hai cột chữ Thái; < 3 cặp → không hỗ trợ', () => {
    const q = EXERCISES['E-09'].generate('d1#2', ctx());
    if (q.kind !== 'match') throw new Error();
    expect(q.item).toEqual({ itemType: 'dialogue', itemId: 'd1#2' });
    expect(q.pairs).toHaveLength(5);
    expect(q.lang).toEqual({ left: 'th', right: 'th' });
    expect(checkMatchPair(q, 'คุณสบายดีไหม', 'สบายดี')).toBe(true);
    const few = { ...pool, qa: pool.qa.slice(0, 2) };
    expect(EXERCISES['E-09'].supports('d1#0', few)).toBe(false);
    expect(EXERCISES['E-09'].supports('nope', pool)).toBe(false);
  });

  it('E-14 loại từ: chọn (lựa chọn là loại từ khác), cụm "danh từ + số + ___", gõ ở bậc 4', () => {
    const prompts = new Set<string>();
    for (let seed = 1; seed < 10; seed++) {
      const q = asChoice(EXERCISES['E-14'].generate('maeo', ctx(seed)));
      expect(q.answer).toBe('ตัว');
      expect(new Set(q.options)).toEqual(new Set(['ตัว', 'คู่', 'คัน', 'ด้าม']));
      prompts.add(q.prompt.th!);
    }
    expect([...prompts].some((p) => /^แมว [2-5] ___$/.test(p))).toBe(true);
    expect(prompts).toContain('แมว');
    const typed = EXERCISES['E-14'].generate('rot', ctx(1, { mode: 'typing' }));
    expect(typed).toMatchObject({ kind: 'typing', accepted: ['คัน'], hint: 'ค' });
    expect(EXERCISES['E-14'].supports('chue', pool)).toBe(false);
  });

  it('supports: mục đủ dữ liệu → true cho mọi loại', () => {
    const ok: [keyof typeof EXERCISES, string][] = [
      ['E-01', 'chue'],
      ['E-02', 'chue'],
      ['E-03', 'chue'],
      ['E-04', 's4'],
      ['E-05', 's2'],
      ['E-06', 's2'],
      ['E-07', 's1'],
      ['E-08', 's1'],
      ['E-09', 'd1#0'],
      ['E-14', 'maeo'],
    ];
    for (const [type, id] of ok) expect(EXERCISES[type].supports(id, pool), type).toBe(true);
    // E-08 không đủ câu nhiễu nhưng có thẻ → vẫn làm được (nghe rồi xếp).
    const solo = exercisePool([{ ...GREETINGS, sentences: [GREETINGS.sentences[0]!] }]);
    expect(EXERCISES['E-08'].supports('s1', solo)).toBe(true);
  });

  it('pool giữ grammar_id của câu (mẫu câu liên quan khi sai, E-12)', () => {
    const p = exercisePool([
      { ...GREETINGS, sentences: [{ ...GREETINGS.sentences[0]!, grammar_id: 'g1' }] },
    ]);
    expect(p.sentences[0]?.grammarId).toBe('g1');
  });

  it('supports: mục không tồn tại / không đủ nhiễu → false', () => {
    for (const type of EXERCISE_TYPES) expect(EXERCISES[type].supports('nope', pool)).toBe(false);
    const one = exercisePool([
      bundle('u1', 1, [
        ['a', 'ก', ['một']],
        ['b', 'ข', ['hai']],
      ]),
    ]);
    expect(EXERCISES['E-01'].supports('a', one)).toBe(false);
    expect(EXERCISES['E-03'].supports('a', one)).toBe(false);
  });
});

describe('chấm FSRS (lần trả lời đầu)', () => {
  it('đúng ngay = Good, gợi ý / sai dấu = Hard, sai / bỏ qua = Again', () => {
    expect(gradeAttempt({ correct: true })).toBe('good');
    expect(gradeAttempt({ correct: true, hinted: true })).toBe('hard');
    expect(gradeAttempt({ correct: true, tone: true })).toBe('hard');
    expect(gradeAttempt({ correct: false })).toBe('again');
    expect(gradeAttempt({ correct: true, skipped: true })).toBe('again');
  });

  it('ghép cặp chấm theo số lần ghép sai của mục', () => {
    expect([0, 1, 2, 5].map(gradeMatchItem)).toEqual(['good', 'hard', 'again', 'again']);
  });

  it('chọn: so nguyên văn', () => {
    const q = asChoice(EXERCISES['E-01'].generate('chue', ctx()));
    expect(checkAnswer(q, 'tên')).toEqual({ correct: true, tone: false, expected: 'tên' });
    expect(checkAnswer(q, 'bạn').correct).toBe(false);
  });
});
