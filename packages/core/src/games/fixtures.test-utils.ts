/**
 * Dữ liệu GIẢ LẬP cho test trò chơi — không phải content thật.
 */
import type { UnitBundle } from '../content/bundle';

type WordInput = [id: string, thai: string, meanings: string[], classifier?: string];
type SentenceInput = [id: string, vi: string, tokens: string[]];

export function bundle(
  unitId: string,
  order: number,
  words: WordInput[],
  sentences: SentenceInput[] = [],
): UnitBundle {
  return {
    unit: {
      unit_id: unitId,
      kind: 'theme',
      order,
      title_vi: `Chuyên đề ${order}`,
      can_do: [],
      draft: true,
    },
    lessons: [],
    words: words.map(([id, thai, meanings, classifier]) => ({
      id,
      unit_id: unitId,
      lesson_id: `${unitId}-l1`,
      thai,
      thai_alt: [],
      meaning_vi: meanings,
      ...(classifier ? { classifier } : {}),
      tags: [],
      draft: true,
    })),
    sentences: sentences.map(([id, vi, tokens]) => ({
      id,
      unit_id: unitId,
      lesson_id: `${unitId}-l1`,
      vi,
      ...(tokens.length ? { th: tokens.join('') } : {}),
      th_alt: [],
      tokens,
      distractors: [],
      draft: true,
    })),
    grammar: [],
    dialogues: [],
  };
}

/** 8 từ có nghĩa + 1 từ draft thiếu nghĩa; 6 câu có thẻ từ + 1 câu thiếu đáp án. */
export const GREETINGS = bundle(
  'u01',
  1,
  [
    ['sawatdee', 'สวัสดี', ['xin chào', 'tạm biệt']],
    ['khopkhun', 'ขอบคุณ', ['cảm ơn']],
    ['chue', 'ชื่อ', ['tên']],
    ['phom', 'ผม', ['tôi (nam)']],
    ['chan', 'ฉัน', ['tôi (nữ)']],
    ['khun', 'คุณ', ['bạn']],
    ['sabai', 'สบาย', ['khỏe']],
    ['mai', 'ไม่', ['không']],
    ['khrap', 'ครับ', []],
  ],
  [
    ['s1', 'Xin chào.', ['สวัสดี', 'ครับ']],
    ['s2', 'Cảm ơn bạn.', ['ขอบคุณ', 'คุณ']],
    ['s3', 'Tôi tên Nít.', ['ผม', 'ชื่อ', 'นิด']],
    ['s4', 'Bạn khỏe không?', ['คุณ', 'สบาย', 'ดี', 'ไหม']],
    ['s5', 'Tôi khỏe.', ['ฉัน', 'สบาย', 'ดี']],
    ['s6', 'Không sao.', ['ไม่', 'เป็นไร']],
    ['s7', 'Câu chưa có đáp án.', []],
  ],
);

/** 9 danh từ có loại từ (4 loại từ khác nhau). */
export const CLASSIFIERS = bundle('u03', 3, [
  ['tukkata', 'ตุ๊กตา', ['búp bê'], 'ตัว'],
  ['maeo', 'แมว', ['mèo'], 'ตัว'],
  ['suea', 'เสื้อ', ['áo'], 'ตัว'],
  ['rongthao', 'รองเท้า', ['giày'], 'คู่'],
  ['thungthao', 'ถุงเท้า', ['tất'], 'คู่'],
  ['takiap', 'ตะเกียบ', ['đũa'], 'คู่'],
  ['rot', 'รถ', ['xe'], 'คัน'],
  ['rom', 'ร่ม', ['ô'], 'คัน'],
  ['pakka', 'ปากกา', ['bút'], 'ด้าม'],
]);
