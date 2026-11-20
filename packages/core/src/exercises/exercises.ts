/**
 * 10 loại bài tập Phase 1 (plan 0.5, SCR-06 §B): E-01..E-09, E-14. Mỗi loại là một `Exercise`
 * độc lập (`supports` + `generate`), cùng nguyên tắc với `Game` (F-14); chấm ở `check.ts`.
 * Lựa chọn nhiễu lấy trong kho đã cho (thường cùng unit), xáo theo RNG có seed.
 */
import type { Rng } from '../games/rng';
import type { ExerciseItemRef, ExercisePool, PoolSentence, PoolWord, QaPair } from './pool';

export const EXERCISE_TYPES = [
  'E-01',
  'E-02',
  'E-03',
  'E-04',
  'E-05',
  'E-06',
  'E-07',
  'E-08',
  'E-09',
  'E-14',
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

/** Số lựa chọn tối đa / tối thiểu (gồm đáp án) của câu hỏi chọn. */
export const CHOICE_OPTIONS = 4;
export const MIN_CHOICE_OPTIONS = 3;
/** Số cặp của E-03 / E-09 (tối thiểu 3). */
export const EXERCISE_MATCH_PAIRS = 5;
export const MIN_EXERCISE_MATCH_PAIRS = 3;

export type Question =
  | {
      kind: 'choice';
      type: ExerciseType;
      item: ExerciseItemRef;
      /** Đề: chữ Thái (E-01, E-04, E-05, E-14) hoặc tiếng Việt (E-02); E-08 chỉ nghe `audio`. */
      prompt: { th?: string; vi?: string };
      /** Chữ Thái để nghe (E-08, nút 🔊). */
      audio?: string;
      /** Lựa chọn là chữ Thái (`lang="th"`). */
      optionsLang: 'th' | 'vi';
      options: string[];
      answer: string;
    }
  | {
      kind: 'arrange';
      type: ExerciseType;
      item: ExerciseItemRef;
      vi: string;
      /** E-08: ẩn đề Việt, chỉ nghe câu. */
      audio?: string;
      accepted: string[];
      /** Thẻ đã xáo (gồm thẻ nhiễu nếu có). */
      bank: string[];
    }
  | {
      kind: 'typing';
      type: ExerciseType;
      item: ExerciseItemRef;
      prompt: { th?: string; vi?: string };
      accepted: string[];
      /** Gợi ý `H`: từ đầu tiên của đáp án. */
      hint: string;
    }
  | {
      kind: 'match';
      type: ExerciseType;
      /** Mục chính (đủ dữ liệu) — các mục còn lại nằm trong `pairs`. */
      item: ExerciseItemRef;
      pairs: { item: ExerciseItemRef; left: string; right: string }[];
      /** Cột phải đã xáo (giá trị `right`). */
      rightOrder: string[];
      /** Cột trái / phải là chữ Thái. */
      lang: { left: 'th' | 'vi'; right: 'th' | 'vi' };
    };

export interface ExerciseContext {
  pool: ExercisePool;
  rng: Rng;
  /** E-14: chọn (mặc định) hay gõ (bậc 4). */
  mode?: 'choice' | 'typing';
}

export interface Exercise {
  type: ExerciseType;
  itemType: ExerciseItemRef['itemType'];
  /** Đủ dữ liệu để ra đề cho mục này (kể cả lựa chọn nhiễu). */
  supports(itemId: string, pool: ExercisePool): boolean;
  generate(itemId: string, ctx: ExerciseContext): Question;
}

const uniq = (values: readonly string[]) => [...new Set(values)];
const ref = (itemType: ExerciseItemRef['itemType'], itemId: string): ExerciseItemRef => ({
  itemType,
  itemId,
});

function byId<T extends { id: string }>(items: readonly T[], id: string): T | undefined {
  return items.find((i) => i.id === id);
}

/** Nhiễu = giá trị khác đáp án, ưu tiên cùng unit. */
function distractors<T extends { unitId: string }>(
  items: readonly T[],
  self: T,
  value: (item: T) => string | undefined,
): string[] {
  const answer = value(self);
  const others = (sameUnit: boolean) =>
    items
      .filter((i) => i !== self && (i.unitId === self.unitId) === sameUnit)
      .map(value)
      .filter((v): v is string => !!v && v !== answer);
  return uniq([...others(true), ...others(false)]);
}

function choice(
  rng: Rng,
  answer: string,
  pool: readonly string[],
): { options: string[]; answer: string } {
  // Lấy nhiễu cùng unit trước (pool đã xếp ưu tiên), xáo trong nhóm đầu để đa dạng.
  const picked = rng.shuffle(pool.slice(0, CHOICE_OPTIONS * 2)).slice(0, CHOICE_OPTIONS - 1);
  return { options: rng.shuffle([answer, ...picked]), answer };
}

const enoughChoices = (pool: readonly string[]) => pool.length >= MIN_CHOICE_OPTIONS - 1;

function wordExercise(
  type: ExerciseType,
  ok: (w: PoolWord, pool: ExercisePool) => boolean,
  make: (w: PoolWord, ctx: ExerciseContext) => Question,
): Exercise {
  return {
    type,
    itemType: 'word',
    supports: (id, pool) => {
      const w = byId(pool.words, id);
      return !!w && ok(w, pool);
    },
    generate: (id, ctx) => make(byId(ctx.pool.words, id)!, ctx),
  };
}

function sentenceExercise(
  type: ExerciseType,
  ok: (s: PoolSentence, pool: ExercisePool) => boolean,
  make: (s: PoolSentence, ctx: ExerciseContext) => Question,
): Exercise {
  return {
    type,
    itemType: 'sentence',
    supports: (id, pool) => {
      const s = byId(pool.sentences, id);
      return !!s && ok(s, pool);
    },
    generate: (id, ctx) => make(byId(ctx.pool.sentences, id)!, ctx),
  };
}

const meaningPool = (w: PoolWord, pool: ExercisePool) =>
  distractors(pool.words, w, (x) => x.meaning);
const thaiPool = (w: PoolWord, pool: ExercisePool) => distractors(pool.words, w, (x) => x.thai);
const viPool = (s: PoolSentence, pool: ExercisePool) => distractors(pool.sentences, s, (x) => x.vi);
const classifierPool = (w: PoolWord, pool: ExercisePool) =>
  distractors(pool.words, w, (x) => x.classifier);

/** Từ trong câu có thể đục lỗ (E-04): thẻ có trong từ vựng, không thì thẻ dài nhất. */
function blankIndex(s: PoolSentence, pool: ExercisePool): number {
  const known = new Set(pool.words.map((w) => w.thai));
  const i = s.tokens.findIndex((t) => known.has(t));
  if (i >= 0) return i;
  return s.tokens.reduce((best, t, j) => (t.length > s.tokens[best]!.length ? j : best), 0);
}

function blankPool(s: PoolSentence, pool: ExercisePool): string[] {
  const answer = s.tokens[blankIndex(s, pool)]!;
  const fromWords = [
    ...pool.words.filter((w) => w.unitId === s.unitId),
    ...pool.words.filter((w) => w.unitId !== s.unitId),
  ].map((w) => w.thai);
  const fromTokens = pool.sentences.filter((x) => x !== s).flatMap((x) => x.tokens);
  return uniq([...s.distractors, ...fromWords, ...fromTokens]).filter(
    (t) => t !== answer && !s.tokens.includes(t),
  );
}

/** Cặp ghép: mục chính + các mục khác (ưu tiên cùng unit), khác nhau cả hai vế. */
function matchPartners<T extends { id: string; unitId: string }>(
  items: readonly T[],
  self: T,
  left: (i: T) => string,
  right: (i: T) => string,
): T[] {
  const ordered = [
    self,
    ...items.filter((i) => i !== self && i.unitId === self.unitId),
    ...items.filter((i) => i.unitId !== self.unitId),
  ];
  const picked: T[] = [];
  const lefts = new Set<string>();
  const rights = new Set<string>();
  for (const i of ordered) {
    if (picked.length === EXERCISE_MATCH_PAIRS) break;
    if (lefts.has(left(i)) || rights.has(right(i))) continue;
    picked.push(i);
    lefts.add(left(i));
    rights.add(right(i));
  }
  return picked;
}

function match<T extends { id: string; unitId: string }>(
  type: ExerciseType,
  itemType: ExerciseItemRef['itemType'],
  self: T,
  items: readonly T[],
  left: (i: T) => string,
  right: (i: T) => string,
  lang: { left: 'th' | 'vi'; right: 'th' | 'vi' },
  rng: Rng,
): Question {
  const partners = matchPartners(items, self, left, right);
  // Mục chính luôn có mặt; các mục khác lấy ngẫu nhiên trong nhóm ưu tiên.
  const pairs = [partners[0]!, ...rng.shuffle(partners.slice(1))].map((i) => ({
    item: ref(itemType, i.id),
    left: left(i),
    right: right(i),
  }));
  return {
    kind: 'match',
    type,
    item: ref(itemType, self.id),
    pairs: rng.shuffle(pairs),
    rightOrder: rng.shuffle(pairs.map((p) => p.right)),
    lang,
  };
}

const E01 = wordExercise(
  'E-01',
  (w, pool) => enoughChoices(meaningPool(w, pool)),
  (w, { pool, rng }) => ({
    kind: 'choice',
    type: 'E-01',
    item: ref('word', w.id),
    prompt: { th: w.thai },
    audio: w.thai,
    optionsLang: 'vi',
    ...choice(rng, w.meaning, meaningPool(w, pool)),
  }),
);

const E02 = wordExercise(
  'E-02',
  (w, pool) => enoughChoices(thaiPool(w, pool)),
  (w, { pool, rng }) => ({
    kind: 'choice',
    type: 'E-02',
    item: ref('word', w.id),
    prompt: { vi: w.meaning },
    optionsLang: 'th',
    ...choice(rng, w.thai, thaiPool(w, pool)),
  }),
);

const E03 = wordExercise(
  'E-03',
  (w, pool) =>
    matchPartners(
      pool.words,
      w,
      (x) => x.thai,
      (x) => x.meaning,
    ).length >= MIN_EXERCISE_MATCH_PAIRS,
  (w, { pool, rng }) =>
    match(
      'E-03',
      'word',
      w,
      pool.words,
      (x) => x.thai,
      (x) => x.meaning,
      { left: 'th', right: 'vi' },
      rng,
    ),
);

const E04 = sentenceExercise(
  'E-04',
  (s, pool) => s.tokens.length >= 3 && enoughChoices(blankPool(s, pool)),
  (s, { pool, rng }) => {
    const i = blankIndex(s, pool);
    return {
      kind: 'choice',
      type: 'E-04',
      item: ref('sentence', s.id),
      prompt: { th: s.tokens.map((t, j) => (j === i ? '____' : t)).join(''), vi: s.vi },
      audio: s.th,
      optionsLang: 'th',
      ...choice(rng, s.tokens[i]!, blankPool(s, pool)),
    };
  },
);

const E05 = sentenceExercise(
  'E-05',
  (s, pool) => enoughChoices(viPool(s, pool)),
  (s, { pool, rng }) => ({
    kind: 'choice',
    type: 'E-05',
    item: ref('sentence', s.id),
    prompt: { th: s.th },
    audio: s.th,
    optionsLang: 'vi',
    ...choice(rng, s.vi, viPool(s, pool)),
  }),
);

const E06 = sentenceExercise(
  'E-06',
  (s) => s.tokens.length >= 2,
  (s, { rng }) => ({
    kind: 'arrange',
    type: 'E-06',
    item: ref('sentence', s.id),
    vi: s.vi,
    accepted: s.accepted,
    bank: rng.shuffle([...s.tokens, ...s.distractors]),
  }),
);

const E07 = sentenceExercise(
  'E-07',
  () => true,
  (s) => ({
    kind: 'typing',
    type: 'E-07',
    item: ref('sentence', s.id),
    prompt: { vi: s.vi },
    accepted: s.accepted,
    hint: s.tokens[0] ?? s.th,
  }),
);

/** E-08: nghe câu → chọn nghĩa; thiếu nghĩa nhiễu thì nghe → xếp câu (không thẻ nhiễu). */
const E08 = sentenceExercise(
  'E-08',
  (s, pool) => enoughChoices(viPool(s, pool)) || s.tokens.length >= 2,
  (s, { pool, rng }) =>
    enoughChoices(viPool(s, pool))
      ? {
          kind: 'choice',
          type: 'E-08',
          item: ref('sentence', s.id),
          prompt: {},
          audio: s.th,
          optionsLang: 'vi',
          ...choice(rng, s.vi, viPool(s, pool)),
        }
      : {
          kind: 'arrange',
          type: 'E-08',
          item: ref('sentence', s.id),
          vi: s.vi,
          audio: s.th,
          accepted: s.accepted,
          bank: rng.shuffle(s.tokens),
        },
);

const qaLeft = (q: QaPair) => q.question;
const qaRight = (q: QaPair) => q.answer;
const E09: Exercise = {
  type: 'E-09',
  itemType: 'dialogue',
  supports: (id, pool) => {
    const q = byId(pool.qa, id);
    return !!q && matchPartners(pool.qa, q, qaLeft, qaRight).length >= MIN_EXERCISE_MATCH_PAIRS;
  },
  generate: (id, { pool, rng }) =>
    match(
      'E-09',
      'dialogue',
      byId(pool.qa, id)!,
      pool.qa,
      qaLeft,
      qaRight,
      { left: 'th', right: 'th' },
      rng,
    ),
};

/** E-14: "danh từ" hoặc cụm "danh từ + số + ___"; bậc 4 gõ loại từ. */
const E14 = wordExercise(
  'E-14',
  (w, pool) => !!w.classifier && enoughChoices(classifierPool(w, pool)),
  (w, { pool, rng, mode }) => {
    const th = rng.next() < 0.5 ? w.thai : `${w.thai} ${2 + rng.int(4)} ___`;
    return mode === 'typing'
      ? {
          kind: 'typing',
          type: 'E-14',
          item: ref('word', w.id),
          prompt: { th },
          accepted: [w.classifier!],
          // Gợi ý = ký tự đầu (cả loại từ thường chỉ 1 từ ngắn).
          hint: [...w.classifier!][0]!,
        }
      : {
          kind: 'choice',
          type: 'E-14',
          item: ref('word', w.id),
          prompt: { th },
          audio: w.thai,
          optionsLang: 'th',
          ...choice(rng, w.classifier!, classifierPool(w, pool)),
        };
  },
);

export const EXERCISES: Record<ExerciseType, Exercise> = {
  'E-01': E01,
  'E-02': E02,
  'E-03': E03,
  'E-04': E04,
  'E-05': E05,
  'E-06': E06,
  'E-07': E07,
  'E-08': E08,
  'E-09': E09,
  'E-14': E14,
};
