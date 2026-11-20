/**
 * Phiên Bài tập (E-10, SCR-06): chọn mục (hôm nay / câu sai 7 ngày / theo unit), chọn loại câu hỏi
 * theo bậc dịch (E-11) và bộ lọc "Kiểu bài", ghi kết quả (FSRS lần trả lời đầu, lượt trả lời, bậc,
 * gỡ cờ "cần ôn") và thống kê cho trang `/practice`.
 */
import { newId } from '../data/memory';
import type {
  CardRecord,
  CardType,
  ExerciseAttemptRecord,
  LessonProgressRecord,
  NeedsReviewRecord,
  SentenceLevelRecord,
} from '../data/records';
import type { ProgressRepository, ReviewRepository } from '../data/repositories';
import { introduceCard, recordReview } from '../data/study';
import { createRng, type Rng } from '../games/rng';
import { isDue, type SrsRating } from '../srs/srs';
import { EXERCISES, type ExerciseType, type Question } from './exercises';
import { LEVEL_EXERCISES, START_LEVEL, updateSentenceLevel } from './ladder';
import type { ExerciseItemRef, ExercisePool } from './pool';

export const PRACTICE_SESSION_SIZE_KEY = 'practiceSessionSize';
export const DEFAULT_PRACTICE_SESSION_SIZE = 20;
/** "Luyện theo chuyên đề", "Luyện thêm", "Luyện lại câu sai" (SCR-06). */
export const SHORT_SESSION_SIZE = 10;
export const MISTAKE_WINDOW_DAYS = 7;
export const ACCURACY_WINDOW_DAYS = 30;
/** Ước tính thời gian (SCR-06 §A "khoảng {n} phút"). */
export const SECONDS_PER_QUESTION = 20;

export const PRACTICE_FILTERS = ['all', 'vocab', 'sentences', 'typing'] as const;
export type PracticeFilter = (typeof PRACTICE_FILTERS)[number];
export const PRACTICE_FILTER_KEY = 'practiceFilter';

/** Loại câu hỏi theo bộ lọc "Kiểu bài" (SCR-06 §A). */
export const FILTER_EXERCISES: Record<PracticeFilter, readonly ExerciseType[]> = {
  all: ['E-01', 'E-02', 'E-03', 'E-04', 'E-05', 'E-06', 'E-07', 'E-08', 'E-09', 'E-14'],
  vocab: ['E-01', 'E-02', 'E-03', 'E-14'],
  sentences: ['E-04', 'E-05', 'E-06', 'E-08', 'E-09'],
  typing: ['E-07', 'E-14'],
};

/** Thẻ SRS của mục bài tập: từ Thái → Việt, câu Việt → Thái. */
export const PRACTICE_CARD_TYPE: Record<'word' | 'sentence', CardType> = {
  word: 'th-vi',
  sentence: 'vi-th',
};

export type PracticeMode =
  | { kind: 'today' }
  | { kind: 'mistakes' }
  | { kind: 'unit'; unitId: string }
  /** Bước Bài tập của một bài học (SCR-05, T9.6). */
  | { kind: 'lesson'; lessonId: string }
  /** Danh sách mục cho sẵn ("Luyện lại câu sai" cuối phiên). */
  | { kind: 'items'; items: ExerciseItemRef[] };

export interface PracticeInput {
  pool: ExercisePool;
  cards: readonly CardRecord[];
  levels: readonly SentenceLevelRecord[];
  needsReview: readonly NeedsReviewRecord[];
  /** Lượt trả lời trong `MISTAKE_WINDOW_DAYS` ngày qua. */
  attempts: readonly ExerciseAttemptRecord[];
  lessons: readonly LessonProgressRecord[];
  mode: PracticeMode;
  filter?: PracticeFilter;
  size?: number;
  /** Có giọng Thái (E-08 cần TTS). */
  voice?: boolean;
  now: Date;
  seed: number;
}

export interface PracticeQuestion {
  question: Question;
  unitId: string;
}

const key = (r: ExerciseItemRef) => `${r.itemType}:${r.itemId}`;

function unitOf(pool: ExercisePool, ref: ExerciseItemRef): string | undefined {
  const list =
    ref.itemType === 'word' ? pool.words : ref.itemType === 'sentence' ? pool.sentences : pool.qa;
  return list.find((i) => i.id === ref.itemId)?.unitId;
}

/** Mục sai gần đây, mới nhất trước, không trùng. */
export function recentMistakes(attempts: readonly ExerciseAttemptRecord[]): ExerciseItemRef[] {
  const seen = new Set<string>();
  const out: ExerciseItemRef[] = [];
  for (const a of [...attempts].sort((x, y) => y.ts.localeCompare(x.ts))) {
    if (a.correct || seen.has(key(a))) continue;
    seen.add(key(a));
    out.push({ itemType: a.itemType, itemId: a.itemId });
  }
  return out;
}

/** Mục của phiên theo thứ tự ưu tiên (chưa cắt theo `size`). */
function candidates(input: PracticeInput, rng: Rng): ExerciseItemRef[] {
  const { pool, mode, now } = input;
  const inPool = (r: ExerciseItemRef) => unitOf(pool, r) !== undefined;
  switch (mode.kind) {
    case 'items':
      return mode.items;
    case 'mistakes':
      return recentMistakes(input.attempts);
    case 'unit':
    case 'lesson': {
      const match = (i: { unitId: string; lessonId: string }) =>
        mode.kind === 'unit' ? i.unitId === mode.unitId : i.lessonId === mode.lessonId;
      const refs: ExerciseItemRef[] = [
        ...pool.words.filter(match).map((w) => ({ itemType: 'word' as const, itemId: w.id })),
        ...pool.sentences
          .filter(match)
          .map((s) => ({ itemType: 'sentence' as const, itemId: s.id })),
        ...pool.qa.filter(match).map((q) => ({ itemType: 'dialogue' as const, itemId: q.id })),
      ];
      return rng.shuffle(refs);
    }
    case 'today': {
      const flagged = input.needsReview.flatMap((f) =>
        f.itemType === 'word' || f.itemType === 'sentence'
          ? [{ itemType: f.itemType, itemId: f.itemId }]
          : [],
      );
      const practiceCards = input.cards.filter(
        (c) =>
          (c.itemType === 'word' || c.itemType === 'sentence') &&
          c.cardType === PRACTICE_CARD_TYPE[c.itemType],
      );
      const toRef = (c: CardRecord): ExerciseItemRef => ({
        itemType: c.itemType as 'word' | 'sentence',
        itemId: c.itemId,
      });
      const due = practiceCards
        .filter((c) => isDue(c.fsrs, now))
        .sort((a, b) => a.fsrs.due.localeCompare(b.fsrs.due))
        .map(toRef);
      // Bù: thẻ mới (từ đã xem trong bài) rồi câu của bài đã học chưa có thẻ.
      const fresh = practiceCards
        .filter((c) => c.fsrs.state === 'new')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(toRef);
      const learnedLessons = new Set(input.lessons.map((l) => l.lessonId));
      const carded = new Set(practiceCards.map((c) => key(toRef(c))));
      const newSentences = pool.sentences
        .filter((s) => learnedLessons.has(s.lessonId) && !carded.has(`sentence:${s.id}`))
        .map((s) => ({ itemType: 'sentence' as const, itemId: s.id }));
      return [
        ...flagged,
        ...recentMistakes(input.attempts),
        ...due,
        ...fresh,
        ...newSentences,
      ].filter((r) => r.itemType !== 'dialogue' && inPool(r));
    }
  }
}

/** Chọn loại câu hỏi cho một mục (theo bộ lọc, bậc dịch, giọng đọc); `undefined` → bỏ mục. */
function pickType(
  ref: ExerciseItemRef,
  input: PracticeInput,
  rng: Rng,
  noMatch = false,
): { type: ExerciseType; mode?: 'typing' } | undefined {
  const allowed = new Set(FILTER_EXERCISES[input.filter ?? 'all']);
  const ok = (t: ExerciseType) =>
    allowed.has(t) &&
    !(noMatch && (t === 'E-03' || t === 'E-09')) &&
    (t !== 'E-08' || input.voice === true) &&
    EXERCISES[t].supports(ref.itemId, input.pool);
  const pick = (types: readonly ExerciseType[]) => {
    const usable = types.filter(ok);
    return usable.length ? usable[rng.int(usable.length)] : undefined;
  };
  switch (ref.itemType) {
    case 'dialogue':
      return ok('E-09') ? { type: 'E-09' } : undefined;
    case 'word': {
      if (input.filter === 'typing')
        return ok('E-14') ? { type: 'E-14', mode: 'typing' } : undefined;
      const type = pick(['E-01', 'E-02', 'E-03', 'E-14']);
      return type && { type };
    }
    case 'sentence': {
      const level = input.levels.find((l) => l.sentenceId === ref.itemId)?.level ?? START_LEVEL;
      // Nghe hiểu thay cho bậc 2–3 khoảng 1/4 số câu (khi có giọng Thái).
      if (level < 4 && ok('E-08') && rng.next() < 0.25) return { type: 'E-08' };
      const byLevel = pick(LEVEL_EXERCISES[level]);
      if (byLevel) return { type: byLevel };
      // Bậc không làm được (thiếu dữ liệu / bị lọc) → loại câu khác được phép.
      const type = pick(['E-05', 'E-04', 'E-06', 'E-08', 'E-07']);
      return type && { type };
    }
  }
}

/**
 * Dựng phiên: tối đa `size` câu hỏi (mặc định 20; theo unit / bài / câu sai: 10), mỗi mục một câu;
 * câu ghép cặp (E-03, E-09) gộp luôn các mục khác của phiên có trong cặp.
 */
export function buildPracticeSession(input: PracticeInput): PracticeQuestion[] {
  const rng = createRng(input.seed);
  const size =
    input.size ??
    (input.mode.kind === 'today' ? DEFAULT_PRACTICE_SESSION_SIZE : SHORT_SESSION_SIZE);
  const covered = new Set<string>();
  const out: PracticeQuestion[] = [];
  for (const ref of candidates(input, rng)) {
    if (out.length >= size) break;
    if (covered.has(key(ref))) continue;
    const unitId = unitOf(input.pool, ref);
    if (!unitId) continue;
    const generate = (noMatch: boolean) => {
      const picked = pickType(ref, input, rng, noMatch);
      return (
        picked &&
        EXERCISES[picked.type].generate(ref.itemId, {
          pool: input.pool,
          rng,
          ...(picked.mode ? { mode: picked.mode } : {}),
        })
      );
    };
    let question = generate(false);
    // Ghép cặp kéo vào mục đã hỏi → đổi sang loại khác (mỗi mục một lần trong phiên).
    if (question?.kind === 'match' && questionItems(question).some((r) => covered.has(key(r)))) {
      question = generate(true);
    }
    if (!question) continue;
    const refs = questionItems(question);
    refs.forEach((r) => covered.add(key(r)));
    out.push({ question, unitId });
  }
  return out;
}

/** Các mục được chấm trong một câu hỏi (ghép cặp: mọi cặp). */
export function questionItems(question: Question): ExerciseItemRef[] {
  return question.kind === 'match' ? question.pairs.map((p) => p.item) : [question.item];
}

export interface PracticeAnswer {
  exerciseType: ExerciseType;
  item: ExerciseItemRef;
  unitId: string;
  correct: boolean;
  /** Lần trả lời đầu của mục trong phiên → chấm FSRS; hỏi lại cuối phiên → `null`. */
  rating: SrsRating | null;
  answer?: string;
}

/**
 * Ghi một câu trả lời: lượt trả lời; lần đầu → FSRS (tạo thẻ nếu chưa có, dòng hội thoại không có
 * thẻ) + bậc dịch của câu; đúng ở lần đầu → gỡ cờ "cần ôn".
 */
export async function recordPracticeAnswer(
  repos: { progress: ProgressRepository; reviews: ReviewRepository },
  answer: PracticeAnswer,
  now: Date,
): Promise<void> {
  const ts = now.toISOString();
  const { item, rating } = answer;
  await repos.reviews.addAttempt({
    id: newId(),
    exerciseType: answer.exerciseType,
    itemType: item.itemType,
    itemId: item.itemId,
    unitId: answer.unitId,
    correct: answer.correct,
    rating,
    ...(answer.answer === undefined ? {} : { answer: answer.answer }),
    ts,
    updatedAt: ts,
  });
  if (rating === null || item.itemType === 'dialogue') return;
  const card = await introduceCard(
    repos.progress,
    { itemType: item.itemType, itemId: item.itemId, cardType: PRACTICE_CARD_TYPE[item.itemType] },
    now,
  );
  await recordReview(repos, card, rating, now);
  if (item.itemType === 'sentence') {
    await updateSentenceLevel(repos.progress, item.itemId, answer.correct, now);
  }
  if (answer.correct) await repos.progress.deleteNeedsReview(item.itemType, item.itemId);
}

export interface PracticeOverview {
  /** Thẻ đến hạn (từ / câu) — badge sidebar, card "Bài tập hôm nay". */
  due: { words: number; sentences: number };
  /** Mục chấm FSRS hôm nay (mục tiêu ngày). */
  doneToday: number;
  /** Mục sai trong 7 ngày qua (card "Luyện câu sai"). */
  mistakes: number;
  /** Tỉ lệ đúng 30 ngày theo unit (lần trả lời đầu); unit chưa làm → không có khóa. */
  accuracy: Record<string, number>;
  /** Thẻ đến hạn trong ngày mai (thông báo "Lần tới: {n} câu vào ngày mai"). */
  dueTomorrow: number;
}

/**
 * Thống kê trang Bài tập. `attempts`: lượt trả lời 30 ngày qua; `dayStart`: 0 giờ hôm nay (giờ máy).
 */
export function practiceOverview(input: {
  cards: readonly CardRecord[];
  attempts: readonly ExerciseAttemptRecord[];
  now: Date;
  dayStart: Date;
}): PracticeOverview {
  const { now, dayStart } = input;
  const practice = input.cards.filter(
    (c) =>
      (c.itemType === 'word' || c.itemType === 'sentence') &&
      c.cardType === PRACTICE_CARD_TYPE[c.itemType],
  );
  const due = practice.filter((c) => isDue(c.fsrs, now));
  const DAY_MS = 24 * 3600_000;
  const dueTomorrow = practice.filter((c) => {
    const at = Date.parse(c.fsrs.due) - dayStart.getTime();
    return c.fsrs.state !== 'new' && at >= DAY_MS && at < 2 * DAY_MS;
  }).length;
  const rated = input.attempts.filter((a) => a.rating !== null);
  const mistakeFrom = new Date(now.getTime() - MISTAKE_WINDOW_DAYS * 24 * 3600_000).toISOString();
  const byUnit = new Map<string, { ok: number; total: number }>();
  for (const a of rated) {
    const u = byUnit.get(a.unitId) ?? { ok: 0, total: 0 };
    u.total++;
    if (a.correct) u.ok++;
    byUnit.set(a.unitId, u);
  }
  return {
    due: {
      words: due.filter((c) => c.itemType === 'word').length,
      sentences: due.filter((c) => c.itemType === 'sentence').length,
    },
    doneToday: rated.filter((a) => a.ts >= dayStart.toISOString()).length,
    mistakes: recentMistakes(input.attempts.filter((a) => a.ts >= mistakeFrom)).length,
    accuracy: Object.fromEntries([...byUnit].map(([u, { ok, total }]) => [u, ok / total])),
    dueTomorrow,
  };
}
