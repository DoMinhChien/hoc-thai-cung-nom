import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../data/memory';
import { GREETINGS } from './fixtures.test-utils';
import {
  ALL_GAME_IDS,
  ARCADE_GAME_IDS,
  ARCADE_GAMES,
  GAME_IDS,
  GAME_SKILLS,
  gameAvailability,
  GAMES,
  gamesWithSkill,
  isAnyGameId,
  isArcadeGameId,
  saveGameResult,
  SKILLS_BY_GAME,
  unitSource,
  type GameSource,
} from './index';

const greetings = unitSource(GREETINGS);
const empty: GameSource = { key: 'learned', words: [], sentences: [] };

describe('danh mục 8 trò (plan 0.14)', () => {
  it('4 trò lượt rồi 4 trò arcade, không trùng id', () => {
    expect(ALL_GAME_IDS).toEqual([...GAME_IDS, ...ARCADE_GAME_IDS]);
    expect(new Set(ALL_GAME_IDS).size).toBe(8);
    expect(ALL_GAME_IDS.filter(isArcadeGameId)).toEqual([...ARCADE_GAME_IDS]);
  });

  it('isAnyGameId nhận đủ 8 id, từ chối id lạ', () => {
    for (const id of ALL_GAME_IDS) expect(isAnyGameId(id)).toBe(true);
    expect(isAnyGameId('pacman')).toBe(false);
    expect(isAnyGameId(undefined)).toBe(false);
  });

  it('mỗi trò có ít nhất một kỹ năng; mỗi kỹ năng có ít nhất một trò', () => {
    for (const id of ALL_GAME_IDS) expect(SKILLS_BY_GAME[id].length).toBeGreaterThan(0);
    for (const skill of GAME_SKILLS) expect(gamesWithSkill(skill).length).toBeGreaterThan(0);
  });

  it('lọc theo kỹ năng giữ thứ tự; null = mọi trò', () => {
    expect(gamesWithSkill(null)).toEqual(ALL_GAME_IDS);
    expect(gamesWithSkill('sentence')).toEqual(['sentence-rush', 'gameshow', 'airplane']);
    expect(gamesWithSkill('classifier')).toEqual(['classifier-rush', 'gameshow']);
    expect(gamesWithSkill('vocab', ['maze', 'sentence-rush', 'match'])).toEqual(['maze', 'match']);
  });

  it('gameAvailability hỏi đúng module của trò', () => {
    for (const id of GAME_IDS) {
      expect(gameAvailability(id, greetings)).toEqual(GAMES[id].availability(greetings));
    }
    for (const id of ARCADE_GAME_IDS) {
      expect(gameAvailability(id, greetings)).toEqual(ARCADE_GAMES[id].availability(greetings));
      expect(gameAvailability(id, empty)).toMatchObject({ ok: false, reason: 'words' });
    }
  });
});

describe('kỷ lục trò arcade', () => {
  it('lưu theo điểm như trò lượt, mục sai → "cần ôn", không đụng SRS', async () => {
    const { progress } = createMemoryRepositories();
    const base = {
      gameId: 'whack-a-mole' as const,
      correct: 3,
      total: 4,
      accuracy: 0.75,
      maxCombo: 2,
      durationMs: 60_000,
      mistakes: [],
    };
    const now = new Date('2026-11-21T08:00:00Z');
    const first = await saveGameResult(
      progress,
      {
        ...base,
        score: 300,
        mistakes: [{ itemType: 'word', itemId: 'w1', th: 'ก', expected: 'gà' }],
      },
      'learned',
      now,
    );
    expect(first.newBest).toBe(true);
    const worse = await saveGameResult(progress, { ...base, score: 100 }, 'learned', now);
    expect(worse).toMatchObject({ newBest: false, record: { plays: 2, best: { score: 300 } } });
    expect(await progress.getGameResult('whack-a-mole', 'learned')).toMatchObject({
      gameId: 'whack-a-mole',
      plays: 2,
    });
    expect(await progress.listNeedsReview()).toEqual([
      expect.objectContaining({ itemType: 'word', itemId: 'w1', origin: 'game' }),
    ]);
    expect(await progress.listCards()).toEqual([]);
  });
});
