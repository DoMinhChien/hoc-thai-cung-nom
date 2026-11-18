/**
 * F-01 Ghép cặp (SCR-08 §B): 12 thẻ úp = 6 từ Thái + 6 nghĩa. Lật 2 thẻ: khớp → giữ mở, sai → úp
 * lại (UI chờ `MATCH_MISMATCH_MS` rồi gọi `next`). Đếm lên; điểm theo thời gian + số lượt lật.
 */
import {
  applyAnswer,
  assertAvailable,
  availability,
  finish,
  initialState,
  summarize,
  type Game,
  type GameState,
} from './game';
import { createRng } from './rng';
import type { GameSource, GameWord } from './source';

export const MATCH_PAIRS = 6;
export const MATCH_MISMATCH_MS = 800;
/** Điểm = 1000 − 5/giây − 20/lượt lật thừa (tối thiểu 0). */
const BASE = 1000;
const PER_SECOND = 5;
const PER_EXTRA_TURN = 20;

export interface MatchCard {
  wordId: string;
  face: 'th' | 'vi';
  text: string;
}

export interface MatchRound {
  cards: MatchCard[];
}

export interface MatchState extends GameState {
  cards: MatchCard[];
  /** `wordId` đã ghép xong. */
  matched: string[];
  /** Vị trí thẻ đang mở (0–2). */
  open: number[];
  /** Vị trí thẻ đã thấy ở các lượt lật trước — sai khi cả 2 thẻ đã thấy mới tính là "cần ôn". */
  seen: number[];
}

/** 6 từ khác chữ + khác nghĩa (thẻ không trùng nhau). */
function pickWords(words: readonly GameWord[]): GameWord[] {
  const thai = new Set<string>();
  const meanings = new Set<string>();
  const out: GameWord[] = [];
  for (const w of words) {
    const meaning = w.meanings[0]!;
    if (thai.has(w.thai) || meanings.has(meaning)) continue;
    thai.add(w.thai);
    meanings.add(meaning);
    out.push(w);
  }
  return out;
}

export const matchPairs: Game<MatchRound, number, MatchState> = {
  id: 'match',
  durationMs: null,

  availability: (source: GameSource) =>
    availability('words', MATCH_PAIRS, pickWords(source.words).length),

  generateRound(source, seed) {
    assertAvailable('match', this.availability(source));
    const rng = createRng(seed);
    const words = pickWords(rng.shuffle(source.words)).slice(0, MATCH_PAIRS);
    const cards = words.flatMap((w): MatchCard[] => [
      { wordId: w.id, face: 'th', text: w.thai },
      { wordId: w.id, face: 'vi', text: w.meanings[0]! },
    ]);
    return { cards: rng.shuffle(cards) };
  },

  start: (round, now) => ({
    ...initialState(now),
    cards: round.cards,
    matched: [],
    open: [],
    seen: [],
  }),

  answer(state, index, now) {
    const card = state.cards[index];
    if (
      state.status !== 'playing' ||
      !card ||
      state.matched.includes(card.wordId) ||
      state.open.includes(index)
    ) {
      return state;
    }
    const open = [...state.open, index];
    if (open.length < 2) return { ...state, open };
    const flipped = { ...state, open, seen: [...new Set([...state.seen, ...open])] };

    const [a, b] = open.map((i) => state.cards[i]!) as [MatchCard, MatchCard];
    const correct = a.wordId === b.wordId;
    const th = a.face === 'th' ? a : b;
    const vi = a.face === 'th' ? b : a;
    const word = state.cards.find((c) => c.wordId === th.wordId && c.face === 'vi')!;
    // Lật trúng thẻ đã thấy mà vẫn ghép sai từ Thái ↔ nghĩa → không nhớ nghĩa, không chỉ quên vị trí.
    const knew = th.face !== vi.face && open.every((i) => state.seen.includes(i));
    const next = applyAnswer(
      flipped,
      {
        item: { itemType: 'word', itemId: th.wordId },
        correct,
        expected: word.text,
        ...(correct ? {} : { given: vi.text }),
      },
      th.text,
      () => 0,
    );
    if (!correct) {
      // Chỉ mục sai "thật" (đã thấy cả 2 thẻ) mới vào danh sách sai.
      return knew ? next : { ...next, mistakes: state.mistakes };
    }
    const matched = [...state.matched, a.wordId];
    const played = { ...next, status: 'playing' as const, matched, open: [] };
    if (matched.length < state.cards.length / 2) return played;
    const elapsed = Math.floor((now - state.startedAt) / 1000);
    const extra = Math.max(0, played.total - matched.length);
    return finish(
      { ...played, score: Math.max(0, BASE - elapsed * PER_SECOND - extra * PER_EXTRA_TURN) },
      now,
    );
  },

  tick: (state) => state,

  next: (state) =>
    state.status === 'feedback' ? { ...state, status: 'playing', open: [], feedback: null } : state,

  score: (state) => state.score,

  summary: (state) =>
    summarize('match', state, state.finishedAt === null ? 0 : state.finishedAt - state.startedAt),
};
