import { describe, expect, it } from 'vitest';
import type { GameResultRecord } from '../data/records';
import { newSrsState } from '../srs/srs';
import {
  accuracyByExerciseType,
  activityByDay,
  dueForecast,
  ESTIMATED_MS_PER_ANSWER,
  gameReport,
  grammarMistakes,
  hardItems,
  lastDays,
  MAX_SESSION_MS,
  retention,
  skillAccuracy,
  studyTime,
} from './report';

const NOW = new Date('2026-11-21T05:00:00Z');
const H = 3_600_000;
const ago = (h: number) => new Date(NOW.getTime() - h * H).toISOString();

const attempt = (
  h: number,
  exerciseType: string,
  correct: boolean,
  extra: Partial<{ rating: 'good' | null; itemType: 'word' | 'sentence'; itemId: string }> = {},
) =>
  ({
    ts: ago(h),
    exerciseType,
    correct,
    rating: 'good' as 'good' | null,
    itemType: 'sentence' as 'word' | 'sentence',
    itemId: 's1',
    ...extra,
  }) as never;

describe('hoạt động & thời gian học (SCR-09 §B)', () => {
  it('30 ngày, ngày trống = 0; đếm bài tập + ôn thẻ + mục mới, riêng lượt chấm', () => {
    const days = activityByDay(
      {
        attempts: [attempt(1, 'E-01', true), attempt(2, 'E-01', false, { rating: null })],
        logs: [{ review: ago(25) }],
        cards: [{ createdAt: ago(1) }, { createdAt: ago(24 * 40) }],
      },
      NOW,
    );
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toEqual({ day: '2026-11-21', count: 3, practiced: 1 });
    expect(days.at(-2)).toMatchObject({ day: '2026-11-20', count: 1, practiced: 0 });
    expect(days[0]!.count).toBe(0);
    expect(lastDays(NOW, 2)).toEqual(['2026-11-20', '2026-11-21']);
  });

  it('phiên đã kết thúc (≤ 60 phút) + ước tính 15 s cho lượt trước phiên đầu', () => {
    const ms = studyTime({
      sessions: [
        { startedAt: ago(10), endedAt: ago(9.5) },
        { startedAt: ago(5), endedAt: ago(1) },
        { startedAt: ago(0.5), endedAt: null },
      ],
      attempts: [{ ts: ago(20) }, { ts: ago(9.8) }],
      logs: [{ review: ago(30) }],
    });
    expect(ms).toBe(0.5 * H + MAX_SESSION_MS + 2 * ESTIMATED_MS_PER_ANSWER);
    expect(studyTime({ sessions: [], attempts: [{ ts: ago(1) }], logs: [] })).toBe(
      ESTIMATED_MS_PER_ANSWER,
    );
  });
});

describe('trí nhớ (SCR-09 §C)', () => {
  it('nhớ đúng: chỉ lượt ôn thẻ ở trạng thái review; < 10 lượt → null', () => {
    const log = (h: number, rating: 'again' | 'good', state = 'review') =>
      ({ review: ago(h), rating, state }) as never;
    const nine = Array.from({ length: 9 }, () => log(1, 'good'));
    expect(retention(nine, NOW, 7)).toBeNull();
    const logs = [...nine, log(2, 'again'), log(3, 'again', 'learning'), log(24 * 8, 'again')];
    expect(retention(logs, NOW, 7)).toBeCloseTo(0.9);
    expect(retention(logs, NOW, 30)).toBeCloseTo(9 / 11);
  });

  it('dự báo 7 ngày: hôm nay gồm cả quá hạn, bỏ thẻ mới; tổng 30 ngày', () => {
    const card = (dueH: number, state = 'review') => ({
      fsrs: { ...newSrsState(NOW), state, due: new Date(NOW.getTime() + dueH * H).toISOString() },
    });
    const f = dueForecast(
      [card(-48), card(1), card(30), card(24 * 10), card(24 * 40), card(0, 'new')] as never,
      NOW,
    );
    expect(f.days.map((d) => d.count)).toEqual([2, 1, 0, 0, 0, 0, 0]);
    expect(f.next30).toBe(4);
  });
});

describe('kỹ năng, lỗi hay gặp, mục khó (SCR-09 §D, §F, §G)', () => {
  it('kỹ năng theo SKILL_GROUPS, chỉ lần trả lời đầu 30 ngày', () => {
    const list = [
      ...Array.from({ length: 8 }, () => attempt(1, 'E-05', true)),
      ...Array.from({ length: 2 }, () => attempt(1, 'E-01', false)),
      attempt(1, 'E-02', true),
      attempt(1, 'E-05', false, { rating: null }),
      attempt(24 * 40, 'E-05', false),
    ];
    const s = skillAccuracy(list, NOW);
    expect(s['th-vi']).toEqual({ correct: 8, total: 10, ratio: 0.8 });
    expect(s['vi-th']).toEqual({ correct: 1, total: 1, ratio: null });
    expect(s.listening.total).toBe(0);
    expect(accuracyByExerciseType(list, NOW).map((a) => a.type)).toEqual(['E-01', 'E-02', 'E-05']);
  });

  it('mẫu câu hay sai: ≥ 3 lượt, có sai, sai nhiều trước', () => {
    const grammarOf = new Map([
      ['s1', 'g1'],
      ['s2', 'g2'],
      ['s3', 'g3'],
    ]);
    const list = [
      ...[false, false, true].map((c) => attempt(1, 'E-06', c, { itemId: 's1' })),
      ...[false, true, true, true].map((c) => attempt(1, 'E-06', c, { itemId: 's2' })),
      ...[false, false].map((c) => attempt(1, 'E-06', c, { itemId: 's3' })),
      attempt(1, 'E-01', false, { itemType: 'word', itemId: 's1' }),
    ];
    expect(grammarMistakes(list, grammarOf, NOW)).toEqual([
      { grammarId: 'g1', wrong: 2, total: 3 },
      { grammarId: 'g2', wrong: 1, total: 4 },
    ]);
  });

  it('mục khó: ≥ 2 lần Quên, gộp theo mục', () => {
    const cards = [
      { id: 'c1', itemType: 'word' as const, itemId: 'w1' },
      { id: 'c2', itemType: 'sentence' as const, itemId: 's1' },
    ];
    const logs = [
      { cardId: 'c1', rating: 'again' as const },
      { cardId: 'c1', rating: 'again' as const },
      { cardId: 'c1', rating: 'good' as const },
      { cardId: 'c2', rating: 'again' as const },
      { cardId: 'x', rating: 'again' as const },
    ];
    expect(hardItems(logs, cards)).toEqual([{ itemType: 'word', itemId: 'w1', lapses: 2 }]);
  });
});

describe('trò chơi (SCR-09 §H)', () => {
  it('gộp mọi nguồn: kỷ lục tốt nhất, cộng lượt; thứ tự 8 trò', () => {
    const rec = (
      gameId: GameResultRecord['gameId'],
      source: string,
      score: number,
      plays: number,
    ) =>
      ({
        gameId,
        source,
        plays,
        best: { score, correct: 1, total: 1, maxCombo: 1, durationMs: 1000 },
      }) as GameResultRecord;
    const r = gameReport([
      rec('maze', 'learned', 100, 2),
      rec('match', 'a', 5, 1),
      rec('maze', 'b', 300, 3),
    ]);
    expect(r.played.map((g) => [g.gameId, g.best.score, g.plays])).toEqual([
      ['match', 5, 1],
      ['maze', 300, 5],
    ]);
    expect(r.unplayed).toHaveLength(6);
  });
});
