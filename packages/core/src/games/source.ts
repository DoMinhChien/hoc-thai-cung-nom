/**
 * Nguồn câu hỏi cho trò chơi (F-10, sửa v7.10 — SCR-08 v3): người học chọn **nội dung ôn** — ôn nhanh
 * (tất cả đã học · học gần đây · cần ôn · bài vừa học) hoặc nhiều bài / bài học, mặc định chỉ mục đã
 * học (`;new` = gồm mục chưa học). Không fallback lặng lẽ: dưới `MIN_SOURCE_ITEMS` thì không chơi được.
 * Bỏ mục draft thiếu nghĩa (từ) / thiếu đáp án (câu).
 */
import { compareUnits, type UnitBundle } from '../content/bundle';
import { createRng, type Rng } from './rng';
import type { GameItemRef } from './game';

export interface GameWord {
  id: string;
  unitId: string;
  lessonId: string;
  thai: string;
  /** Nghĩa tiếng Việt, ≥ 1. */
  meanings: string[];
  classifier?: string;
}

export interface GameSentence {
  id: string;
  unitId: string;
  lessonId: string;
  vi: string;
  th: string;
  /** `th` + `th_alt`. */
  accepted: string[];
  tokens: string[];
}

export interface GameSource {
  /** Khóa nguồn (`?source=`, xem `sourceKey`). */
  key: string;
  words: GameWord[];
  sentences: GameSentence[];
  /** Id mục cần ôn / đến hạn — trò chơi hỏi trước (F-10). */
  priority?: string[];
}

/** Ôn nhanh (SCR-08 v3 §2A). */
export const QUICK_SOURCES = ['learned', 'recent', 'review', 'last-lesson'] as const;
export type QuickSource = (typeof QUICK_SOURCES)[number];

export type SourceSpec =
  { kind: QuickSource } | { kind: 'units' | 'lessons'; ids: string[]; includeNew: boolean };

/** Nội dung cần ít nhất ngần này mục để chơi (SCR-08 v3 §2). */
export const MIN_SOURCE_ITEMS = 6;
/** "Học gần đây": mục bắt đầu học trong ngần này ngày. */
export const RECENT_DAYS = 7;

const isQuick = (s: string): s is QuickSource => (QUICK_SOURCES as readonly string[]).includes(s);

/**
 * `?source=` / setting → nội dung: `learned` · `recent` · `review` · `last-lesson` ·
 * `units:b09,b10[;new]` · `lessons:<id>,<id>[;new]`. Giá trị cũ `unit:<id>` (gồm cả mục chưa học)
 * → `units:<id>;new`; `lesson:<id>` → `lessons:<id>;new`. Không hợp lệ → `null`.
 */
export function parseSourceKey(key: string | null | undefined): SourceSpec | null {
  if (!key) return null;
  if (isQuick(key)) return { kind: key };
  const legacy = /^(unit|lesson):([^,;]+)$/.exec(key);
  if (legacy)
    return { kind: `${legacy[1] as 'unit' | 'lesson'}s`, ids: [legacy[2]!], includeNew: true };
  const m = /^(units|lessons):([^;]+)(;new)?$/.exec(key);
  if (!m) return null;
  const ids = [...new Set(m[2]!.split(',').filter(Boolean))];
  return ids.length ? { kind: m[1] as 'units' | 'lessons', ids, includeNew: !!m[3] } : null;
}

export function sourceKey(spec: SourceSpec): string {
  if (spec.kind === 'units' || spec.kind === 'lessons') {
    return `${spec.kind}:${spec.ids.join(',')}${spec.includeNew ? ';new' : ''}`;
  }
  return spec.kind;
}

/** Những gì người học đã làm — đủ để dựng mọi loại nguồn. */
export interface LearnerSnapshot {
  /** Thẻ SRS của từ / câu (`due` = FSRS). */
  cards: readonly (GameItemRef & { createdAt: string; due: string })[];
  /** Cờ "cần ôn" (Bài tập, Trò chơi, Sổ từ). */
  needsReview: readonly GameItemRef[];
  /** Bài học hoàn thành gần nhất. */
  lastLessonId: string | null;
  now: Date;
}

export function gameWords(bundle: Pick<UnitBundle, 'words'>): GameWord[] {
  return bundle.words
    .filter((w) => w.meaning_vi.length > 0)
    .map((w) => ({
      id: w.id,
      unitId: w.unit_id,
      lessonId: w.lesson_id,
      thai: w.thai,
      meanings: w.meaning_vi,
      ...(w.classifier ? { classifier: w.classifier } : {}),
    }));
}

export function gameSentences(bundle: Pick<UnitBundle, 'sentences'>): GameSentence[] {
  return bundle.sentences.flatMap((s) =>
    s.th
      ? [
          {
            id: s.id,
            unitId: s.unit_id,
            lessonId: s.lesson_id,
            vi: s.vi,
            th: s.th,
            accepted: [s.th, ...s.th_alt],
            tokens: s.tokens,
          },
        ]
      : [],
  );
}

/** Mọi từ / câu của một bài, kể cả chưa học (`units:<id>;new`). */
export function unitSource(bundle: UnitBundle): GameSource {
  return {
    key: sourceKey({ kind: 'units', ids: [bundle.unit.unit_id], includeNew: true }),
    words: gameWords(bundle),
    sentences: gameSentences(bundle),
  };
}

const refKey = (r: GameItemRef) => `${r.itemType}:${r.itemId}`;
const learnedKeys = (learner: Pick<LearnerSnapshot, 'cards'>) => new Set(learner.cards.map(refKey));

/** Mục cần ôn: cờ "cần ôn" + thẻ đến hạn (`due ≤ now`). */
function reviewKeys(learner: LearnerSnapshot): Set<string> {
  const now = learner.now.getTime();
  return new Set([
    ...learner.needsReview.map(refKey),
    ...learner.cards.filter((c) => Date.parse(c.due) <= now).map(refKey),
  ]);
}

function filterSource(
  bundles: readonly UnitBundle[],
  key: string,
  keep: (ref: GameItemRef, scope: { unitId: string; lessonId: string }) => boolean,
): GameSource {
  const units = [...bundles].sort((a, b) => compareUnits(a.unit, b.unit));
  return {
    key,
    words: units.flatMap(gameWords).filter((w) => keep({ itemType: 'word', itemId: w.id }, w)),
    sentences: units
      .flatMap(gameSentences)
      .filter((s) => keep({ itemType: 'sentence', itemId: s.id }, s)),
  };
}

/** Nội dung → từ / câu (theo lộ trình) + mục ưu tiên (cần ôn / đến hạn). */
export function resolveGameSource(
  bundles: readonly UnitBundle[],
  spec: SourceSpec,
  learner: LearnerSnapshot,
): GameSource {
  const key = sourceKey(spec);
  const learned = learnedKeys(learner);
  const review = reviewKeys(learner);
  let source: GameSource;
  switch (spec.kind) {
    case 'learned':
      source = filterSource(bundles, key, (r) => learned.has(refKey(r)));
      break;
    case 'recent': {
      const since = learner.now.getTime() - RECENT_DAYS * 86_400_000;
      const recent = new Set(
        learner.cards.filter((c) => Date.parse(c.createdAt) >= since).map(refKey),
      );
      source = filterSource(bundles, key, (r) => recent.has(refKey(r)));
      break;
    }
    case 'review':
      source = filterSource(bundles, key, (r) => review.has(refKey(r)));
      break;
    case 'last-lesson':
      source = filterSource(bundles, key, (_, s) => s.lessonId === learner.lastLessonId);
      break;
    default: {
      const ids = new Set(spec.ids);
      const field = spec.kind === 'units' ? 'unitId' : 'lessonId';
      source = filterSource(
        bundles,
        key,
        (r, s) => ids.has(s[field]) && (spec.includeNew || learned.has(refKey(r))),
      );
    }
  }
  const priority = [...source.words, ...source.sentences]
    .filter((item) =>
      review.has(refKey({ itemType: 'accepted' in item ? 'sentence' : 'word', itemId: item.id })),
    )
    .map((item) => item.id);
  return priority.length ? { ...source, priority } : source;
}

export const sourceSize = (source: Pick<GameSource, 'words' | 'sentences'>) =>
  source.words.length + source.sentences.length;

/**
 * Nội dung mặc định (SCR-08 v3 §3): đủ mục đã học → "Tất cả đã học"; chưa → "Bài vừa học" nếu có;
 * người mới → bài đầu tiên của lộ trình, gồm mục chưa học.
 */
export function defaultSourceSpec(
  bundles: readonly UnitBundle[],
  learner: LearnerSnapshot,
): SourceSpec {
  const learned = resolveGameSource(bundles, { kind: 'learned' }, learner);
  if (sourceSize(learned) >= MIN_SOURCE_ITEMS) return { kind: 'learned' };
  if (learner.lastLessonId) return { kind: 'last-lesson' };
  const first = [...bundles].sort((a, b) => compareUnits(a.unit, b.unit))[0];
  return first
    ? { kind: 'units', ids: [first.unit.unit_id], includeNew: true }
    : { kind: 'learned' };
}

/** Số từ / câu của một bài hoặc bài học: tổng và đã học (bộ chọn nội dung, SCR-08 v3 §2B). */
export interface ScopeCount {
  words: number;
  sentences: number;
  learnedWords: number;
  learnedSentences: number;
}

/** Đếm theo `unit_id` và `lesson_id` (cùng một Map — id bài và bài học không trùng). */
export function countByScope(
  bundles: readonly UnitBundle[],
  learner: Pick<LearnerSnapshot, 'cards'>,
): Map<string, ScopeCount> {
  const learned = learnedKeys(learner);
  const counts = new Map<string, ScopeCount>();
  const add = (id: string, field: 'words' | 'sentences', isLearned: boolean) => {
    const c = counts.get(id) ?? { words: 0, sentences: 0, learnedWords: 0, learnedSentences: 0 };
    c[field]++;
    if (isLearned) c[field === 'words' ? 'learnedWords' : 'learnedSentences']++;
    counts.set(id, c);
  };
  for (const b of bundles) {
    for (const w of gameWords(b)) {
      const l = learned.has(`word:${w.id}`);
      add(w.unitId, 'words', l);
      add(w.lessonId, 'words', l);
    }
    for (const s of gameSentences(b)) {
      const l = learned.has(`sentence:${s.id}`);
      add(s.unitId, 'sentences', l);
      add(s.lessonId, 'sentences', l);
    }
  }
  return counts;
}

/**
 * RNG của một lượt: như `createRng`, nhưng khi xáo các mục của nguồn (từ, câu hoặc đối tượng có
 * `item.itemId`) thì mục ưu tiên (`source.priority`) ra trước, mỗi nhóm vẫn xáo ngẫu nhiên.
 */
export function sourceRng(seed: number, source: Pick<GameSource, 'priority'>): Rng {
  const rng = createRng(seed);
  if (!source.priority?.length) return rng;
  const first = new Set(source.priority);
  const idOf = (x: unknown): string | undefined => {
    if (typeof x !== 'object' || x === null) return undefined;
    const o = x as { id?: unknown; item?: { itemId?: unknown } };
    const id = o.item?.itemId ?? o.id;
    return typeof id === 'string' ? id : undefined;
  };
  return {
    ...rng,
    shuffle(items) {
      const shuffled = rng.shuffle(items);
      const top = shuffled.filter((x) => first.has(idOf(x) ?? ''));
      if (top.length === 0 || top.length === shuffled.length) return shuffled;
      return [...top, ...shuffled.filter((x) => !first.has(idOf(x) ?? ''))];
    },
  };
}

/** "Chơi với mục sai" (SCR-08 §C): chỉ giữ các mục vừa sai; giữ `key` để "Chơi lại" theo nguồn gốc. */
export function subsetSource(source: GameSource, items: readonly GameItemRef[]): GameSource {
  const ids = new Set(items.map(refKey));
  return {
    key: source.key,
    words: source.words.filter((w) => ids.has(`word:${w.id}`)),
    sentences: source.sentences.filter((s) => ids.has(`sentence:${s.id}`)),
  };
}
