import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../data/memory';
import { createRng } from '../games/rng';
import { bundle } from '../games/fixtures.test-utils';
import { unitSource } from '../games/source';
import { matchSpeech, normalizeSpeech, segmentThai, variantTokens } from './match';
import {
  pickSpeakingItems,
  saveSpeakingAttempt,
  SPEAKING_MAX_TOKENS,
  SPEAKING_SESSION_SIZE,
  speakingPool,
  summarizeSpeaking,
} from './session';

const NAME = {
  accepted: ['ผมชื่อมินห์ครับ', 'ฉันชื่อมินห์ค่ะ'],
  tokens: ['ผม', 'ชื่อ', 'มินห์', 'ครับ'],
};

describe('normalizeSpeech', () => {
  it('bỏ khoảng trắng, dấu câu, ZWSP; giữ ๆ', () => {
    expect(normalizeSpeech('ผม ชื่อ​มินห์ ครับ.')).toBe('ผมชื่อมินห์ครับ');
    expect(normalizeSpeech('เด็กๆ!')).toBe('เด็กๆ');
  });
});

describe('matchSpeech (SCR-10 §4)', () => {
  it('khớp đủ thẻ (kể cả có khoảng trắng / dấu câu) → ratio 1', () => {
    const m = matchSpeech(['ผม ชื่อ มินห์ ครับ'], NAME)!;
    expect(m).toMatchObject({ variant: 'ผมชื่อมินห์ครับ', ratio: 1 });
    expect(m.matched).toEqual([true, true, true, true]);
  });

  it('thiếu thẻ → đánh dấu đúng thẻ nghe được, theo thứ tự', () => {
    const m = matchSpeech(['ผมชื่อครับ'], NAME)!;
    expect(m.matched).toEqual([true, true, false, true]);
    expect(m.ratio).toBe(0.75);
    // Sai thứ tự: thẻ đứng trước thẻ đã khớp không tính.
    expect(matchSpeech(['ครับผม'], NAME)!.matched).toEqual([true, false, false, false]);
  });

  it('dùng th_alt khi khớp hơn; thẻ của biến thể cắt theo thẻ của th', () => {
    expect(variantTokens('ฉันชื่อมินห์ค่ะ', NAME.tokens)).toEqual(['ฉัน', 'ชื่อ', 'มินห์', 'ค่ะ']);
    const m = matchSpeech(['ฉันชื่อมินห์ค่ะ'], NAME)!;
    expect(m).toMatchObject({
      variant: 'ฉันชื่อมินห์ค่ะ',
      tokens: ['ฉัน', 'ชื่อ', 'มินห์', 'ค่ะ'],
      ratio: 1,
    });
  });

  it('chọn alternative khớp tốt nhất', () => {
    const m = matchSpeech(['ผมชื่อมิน', 'ผมชื่อมินห์ครับ', 'ชื่อ'], NAME)!;
    expect(m).toMatchObject({ ratio: 1, heard: 'ผมชื่อมินห์ครับ' });
  });

  it('từ đơn: khớp nguyên từ hoặc thai_alt', () => {
    const word = { accepted: ['ไม้พาย', 'ไม้แจว'], tokens: ['ไม้พาย'] };
    expect(matchSpeech(['ไม้แจว'], word)).toMatchObject({ variant: 'ไม้แจว', ratio: 1 });
    expect(matchSpeech(['ไม้'], word)!.ratio).toBe(0);
  });

  it('không có tokens → tự tách theo từ', () => {
    expect(segmentThai('ฉันกินข้าว')).toEqual(['ฉัน', 'กิน', 'ข้าว']);
    expect(matchSpeech(['ฉันกินข้าว'], { accepted: ['ฉันกินข้าว'], tokens: [] })!.ratio).toBe(1);
  });

  it('không nghe được gì → null', () => {
    expect(matchSpeech([], NAME)).toBeNull();
    expect(matchSpeech([' ', '.'], NAME)).toBeNull();
  });
});

const U = bundle(
  'u01',
  1,
  [
    ['sawatdee', 'สวัสดี', ['xin chào', 'tạm biệt']],
    ['khopkhun', 'ขอบคุณ', ['cảm ơn']],
    ['nomeaning', 'ไม่มี', []],
  ],
  [
    ['s1', 'Tôi tên Minh.', ['ผม', 'ชื่อ', 'มินห์', 'ครับ']],
    ['s-long', 'Câu dài.', Array.from({ length: SPEAKING_MAX_TOKENS + 1 }, (_, i) => `ก${i}`)],
    ['s-empty', 'Chưa có đáp án.', []],
  ],
);
U.words[1]!.thai_alt = ['ขอบใจ'];
U.words[1]!.phonetic = 'khop-khun';

describe('phiên luyện nói (SCR-10 §3)', () => {
  it('pool: từ có nghĩa (+ thai_alt, phiên âm), câu có th và ≤ 9 thẻ', () => {
    const pool = speakingPool(unitSource(U), [U]);
    expect(pool.map((i) => i.itemId)).toEqual(['sawatdee', 'khopkhun', 's1']);
    expect(pool[1]).toMatchObject({
      accepted: ['ขอบคุณ', 'ขอบใจ'],
      tokens: ['ขอบคุณ'],
      vi: 'cảm ơn',
      phonetic: 'khop-khun',
    });
    expect(pool[2]).toMatchObject({ itemType: 'sentence', thai: 'ผมชื่อมินห์ครับ' });
  });

  it(`chọn tối đa ${SPEAKING_SESSION_SIZE} mục, mục cần ôn trước`, () => {
    const many = bundle(
      'u02',
      2,
      Array.from(
        { length: 15 },
        (_, i) => [`w${i}`, `ก${i}`, [`nghĩa ${i}`]] as [string, string, string[]],
      ),
    );
    const source = { ...unitSource(many), priority: ['w14', 'w13'] };
    const items = pickSpeakingItems(speakingPool(source, [many]), createRng(7), source.priority);
    expect(items).toHaveLength(SPEAKING_SESSION_SIZE);
    expect(new Set(items.slice(0, 2).map((i) => i.itemId))).toEqual(new Set(['w14', 'w13']));
    expect(pickSpeakingItems(speakingPool(source, [many]), createRng(1), [], 3)).toHaveLength(3);
  });

  it('lưu lượt: không đụng FSRS; chỉ "Chưa giống" bật cờ cần ôn', async () => {
    const repos = createMemoryRepositories();
    const now = new Date('2026-11-24T08:00:00Z');
    await saveSpeakingAttempt(repos, { itemType: 'sentence', itemId: 's1' }, 'close', 0.5, now);
    expect(await repos.progress.listNeedsReview()).toEqual([]);
    await saveSpeakingAttempt(repos, { itemType: 'sentence', itemId: 's1' }, 'retry', null, now);
    expect(await repos.progress.listNeedsReview()).toMatchObject([
      { itemId: 's1', origin: 'speaking' },
    ]);
    expect(await repos.progress.listCards()).toEqual([]);
  });

  it('tóm tắt phiên', () => {
    expect(
      summarizeSpeaking([
        { rating: 'good', asr: false },
        { rating: 'retry', asr: true },
        { rating: 'good', asr: false },
      ]),
    ).toEqual({ items: 3, good: 2, close: 0, retry: 1, asr: true });
  });
});
