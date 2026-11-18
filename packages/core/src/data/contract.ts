/**
 * Bộ test hợp đồng cho mọi bản repository (bộ nhớ, Dexie, Phase 2: Synced).
 * Import qua `@nom/core/testing` — không nằm trong bundle app.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GameId, GameSummary } from '../games/game';
import { saveGameResult } from '../games/results';
import { newSrsState, reviewSrs } from '../srs/srs';
import type { CardRecord, LessonProgressRecord } from './records';
import type { Repositories } from './repositories';
import { completeLessonStep, introduceCard, recordReview, setCanDo } from './study';

const T0 = new Date('2026-03-01T08:00:00.000Z');
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
const DAY = 24 * 60;

function card(id: string, patch: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    itemType: 'consonant',
    itemId: id,
    cardType: 'th-vi',
    fsrs: newSrsState(T0),
    createdAt: T0.toISOString(),
    updatedAt: T0.toISOString(),
    ...patch,
  };
}

/** Thẻ đã ôn 1 lần (Good) → learning, đến hạn sau 10 phút. */
const learned = (id: string, reviewedAt = T0) =>
  card(id, { fsrs: reviewSrs(newSrsState(reviewedAt), 'good', reviewedAt).state });

export function describeRepositories(
  name: string,
  make: () => Promise<Repositories>,
  dispose: () => Promise<void> = async () => {},
) {
  describe(`repository contract: ${name}`, () => {
    let repos: Repositories;
    beforeEach(async () => {
      repos = await make();
    });
    afterEach(dispose);

    describe('ProgressRepository', () => {
      it('put/get/find; bản trả về là bản sao', async () => {
        await repos.progress.putCard(card('a'));
        const got = await repos.progress.getCard('a');
        expect(got).toEqual(card('a'));
        got!.itemId = 'đổi';
        expect((await repos.progress.getCard('a'))!.itemId).toBe('a');
        expect(await repos.progress.findCard('consonant', 'a', 'th-vi')).toEqual(card('a'));
        expect(await repos.progress.findCard('consonant', 'a', 'vi-th')).toBeUndefined();
        expect(await repos.progress.getCard('khong-co')).toBeUndefined();
      });

      it('listCards lọc theo itemType / itemIds', async () => {
        await repos.progress.putCard(card('a'));
        await repos.progress.putCard(card('b', { itemType: 'word', itemId: 'di' }));
        await repos.progress.putCard(card('c', { itemType: 'word', itemId: 'ma' }));
        const ids = async (f?: Parameters<Repositories['progress']['listCards']>[0]) =>
          (await repos.progress.listCards(f)).map((c) => c.id).sort();
        expect(await ids()).toEqual(['a', 'b', 'c']);
        expect(await ids({ itemType: 'word' })).toEqual(['b', 'c']);
        expect(await ids({ itemType: 'word', itemIds: ['ma', 'x'] })).toEqual(['c']);
      });

      it('dueCards: bỏ thẻ mới, chỉ thẻ đến hạn, quá hạn lâu nhất trước, có limit', async () => {
        await repos.progress.putCard(card('moi'));
        await repos.progress.putCard(learned('som', at(0)));
        await repos.progress.putCard(learned('muon', at(5)));
        expect(await repos.progress.dueCards(at(9))).toEqual([]);
        expect((await repos.progress.dueCards(at(20))).map((c) => c.id)).toEqual(['som', 'muon']);
        expect((await repos.progress.dueCards(at(20), 1)).map((c) => c.id)).toEqual(['som']);
      });

      it('countCreatedBetween: khoảng [from, to)', async () => {
        await repos.progress.putCard(card('a', { createdAt: at(0).toISOString() }));
        await repos.progress.putCard(card('b', { createdAt: at(DAY).toISOString() }));
        expect(await repos.progress.countCreatedBetween(at(0), at(DAY))).toBe(1);
        expect(await repos.progress.countCreatedBetween(at(0), at(DAY + 1))).toBe(2);
      });
    });

    describe('ProgressRepository — bài học, can-do (M7)', () => {
      const lesson = (
        lessonId: string,
        unitId: string,
        patch: Partial<LessonProgressRecord> = {},
      ) => ({
        id: `id-${lessonId}`,
        lessonId,
        unitId,
        stepsDone: [],
        bestScore: null,
        completedAt: null,
        updatedAt: T0.toISOString(),
        ...patch,
      });

      it('put/get/list theo unit; ghi lại cùng lessonId thì thay bản cũ', async () => {
        await repos.progress.putLessonProgress(lesson('u01-l1', 'u01'));
        await repos.progress.putLessonProgress(lesson('u01-l2', 'u01'));
        await repos.progress.putLessonProgress(lesson('u02-l1', 'u02'));
        await repos.progress.putLessonProgress(
          lesson('u01-l1', 'u01', { id: 'id-khac', stepsDone: ['vocab'] }),
        );
        expect(await repos.progress.getLessonProgress('u01-l1')).toEqual(
          lesson('u01-l1', 'u01', { id: 'id-khac', stepsDone: ['vocab'] }),
        );
        expect(await repos.progress.getLessonProgress('khong-co')).toBeUndefined();
        const ids = async (unitId?: string) =>
          (await repos.progress.listLessonProgress(unitId)).map((l) => l.lessonId).sort();
        expect(await ids('u01')).toEqual(['u01-l1', 'u01-l2']);
        expect(await ids()).toEqual(['u01-l1', 'u01-l2', 'u02-l1']);
      });

      it('completeLessonStep: bước xong, bài tập < 80% chưa xong, ≥ 80% → hoàn thành', async () => {
        const ref = { lesson_id: 'u01-l1', unit_id: 'u01', steps: ['vocab', 'exercise'] as const };
        let r = await completeLessonStep(repos.progress, ref, 'vocab', at(0));
        expect(r).toMatchObject({ stepsDone: ['vocab'], completedAt: null, bestScore: null });
        r = await completeLessonStep(repos.progress, ref, 'exercise', at(5), 0.7);
        expect(r).toMatchObject({ stepsDone: ['vocab'], bestScore: 0.7, completedAt: null });
        r = await completeLessonStep(repos.progress, ref, 'exercise', at(10), 0.9);
        expect(r).toMatchObject({ stepsDone: ['vocab', 'exercise'], bestScore: 0.9 });
        expect(r.completedAt).toBe(at(10).toISOString());
        r = await completeLessonStep(repos.progress, ref, 'exercise', at(20), 0.5);
        expect(r).toMatchObject({ bestScore: 0.9, completedAt: at(10).toISOString() });
        expect(await repos.progress.getLessonProgress('u01-l1')).toEqual(r);
        expect((await repos.progress.listLessonProgress('u01')).length).toBe(1);
        await expect(completeLessonStep(repos.progress, ref, 'exercise', at(30))).rejects.toThrow();
      });

      it('setCanDo: tick / bỏ tick, một bản ghi mỗi mục, theo unit', async () => {
        const first = await setCanDo(repos.progress, 'u01', 'Chào hỏi', true, at(0));
        await setCanDo(repos.progress, 'u01', 'Giới thiệu tên', true, at(1));
        await setCanDo(repos.progress, 'u02', 'Chào hỏi', true, at(1));
        const again = await setCanDo(repos.progress, 'u01', 'Chào hỏi', false, at(2));
        expect(again.id).toBe(first.id);
        const list = (await repos.progress.listCanDo('u01')).sort((a, b) =>
          a.canDo.localeCompare(b.canDo),
        );
        expect(list.map((c) => [c.canDo, c.checked])).toEqual([
          ['Chào hỏi', false],
          ['Giới thiệu tên', true],
        ]);
        expect(list[0]!.updatedAt).toBe(at(2).toISOString());
      });
    });

    describe('ProgressRepository — kỷ lục trò chơi, cờ "cần ôn" (M7.5)', () => {
      const stats = (score: number, durationMs = 60_000) => ({
        score,
        correct: 5,
        total: 6,
        maxCombo: 3,
        durationMs,
      });
      const summary = (
        gameId: GameId,
        score: number,
        patch: Partial<GameSummary> = {},
      ): GameSummary => ({ gameId, accuracy: 5 / 6, mistakes: [], ...stats(score), ...patch });

      it('kỷ lục: một bản ghi mỗi trò + nguồn', async () => {
        const record = (id: string, gameId: GameId, source: string, score: number) => ({
          id,
          gameId,
          source,
          best: stats(score),
          plays: 1,
          lastPlayedAt: T0.toISOString(),
          updatedAt: T0.toISOString(),
        });
        await repos.progress.putGameResult(record('a', 'true-false', 'learned', 100));
        await repos.progress.putGameResult(record('b', 'true-false', 'unit:u01', 200));
        await repos.progress.putGameResult(record('c', 'true-false', 'learned', 300));
        expect(await repos.progress.getGameResult('true-false', 'learned')).toEqual(
          record('c', 'true-false', 'learned', 300),
        );
        expect(await repos.progress.getGameResult('match', 'learned')).toBeUndefined();
        expect((await repos.progress.listGameResults()).map((r) => r.id).sort()).toEqual([
          'b',
          'c',
        ]);
      });

      it('cờ "cần ôn": một cờ mỗi mục, xóa được', async () => {
        const flag = (id: string, itemId: string, minutes: number) => ({
          id,
          itemType: 'word' as const,
          itemId,
          origin: 'game' as const,
          flaggedAt: at(minutes).toISOString(),
          updatedAt: at(minutes).toISOString(),
        });
        await repos.progress.putNeedsReview(flag('a', 'sawatdee', 0));
        await repos.progress.putNeedsReview(flag('b', 'khrap', 0));
        await repos.progress.putNeedsReview(flag('c', 'sawatdee', 1));
        const ids = async () => (await repos.progress.listNeedsReview()).map((f) => f.id).sort();
        expect(await ids()).toEqual(['b', 'c']);
        await repos.progress.deleteNeedsReview('word', 'khrap');
        await repos.progress.deleteNeedsReview('sentence', 'sawatdee');
        expect(await ids()).toEqual(['c']);
      });

      it('saveGameResult: lượt đầu là kỷ lục, kém hơn giữ kỷ lục cũ, cộng số lượt', async () => {
        const first = await saveGameResult(
          repos.progress,
          summary('true-false', 800),
          'learned',
          at(0),
        );
        expect(first).toMatchObject({ newBest: true, previous: null });
        const worse = await saveGameResult(
          repos.progress,
          summary('true-false', 500),
          'learned',
          at(1),
        );
        expect(worse).toMatchObject({ newBest: false, previous: stats(800) });
        const better = await saveGameResult(
          repos.progress,
          summary('true-false', 900),
          'learned',
          at(2),
        );
        expect(better.newBest).toBe(true);
        expect(await repos.progress.getGameResult('true-false', 'learned')).toEqual({
          id: first.record.id,
          gameId: 'true-false',
          source: 'learned',
          best: stats(900),
          plays: 3,
          lastPlayedAt: at(2).toISOString(),
          updatedAt: at(2).toISOString(),
        });
        // Ghép cặp: nhanh hơn mới là kỷ lục.
        await saveGameResult(
          repos.progress,
          summary('match', 500, { durationMs: 40_000 }),
          'learned',
          at(3),
        );
        const slower = await saveGameResult(
          repos.progress,
          summary('match', 900, { durationMs: 50_000 }),
          'learned',
          at(4),
        );
        expect(slower.newBest).toBe(false);
      });

      it('saveGameResult: mục sai → "cần ôn"; không đổi thẻ SRS, không thêm log (F-12)', async () => {
        const card = await introduceCard(
          repos.progress,
          { itemType: 'word', itemId: 'sawatdee', cardType: 'th-vi' },
          at(0),
        );
        const reviewed = await recordReview(repos, card, 'good', at(1));
        const before = await repos.progress.listCards();
        const logsBefore = await repos.reviews.logsBetween(at(0), at(DAY));
        const mistakes = [
          {
            itemType: 'word',
            itemId: 'sawatdee',
            th: 'สวัสดี',
            expected: 'xin chào',
            given: 'cảm ơn',
          },
          { itemType: 'sentence', itemId: 's-u01-001', th: 'ผมชื่อนิด', expected: 'Tôi tên Nít' },
        ] as const;
        await saveGameResult(
          repos.progress,
          summary('true-false', 300, { mistakes: [...mistakes] }),
          'learned',
          at(5),
        );
        expect(
          (await repos.progress.listNeedsReview())
            .map((f) => [f.itemType, f.itemId, f.origin])
            .sort(),
        ).toEqual([
          ['sentence', 's-u01-001', 'game'],
          ['word', 'sawatdee', 'game'],
        ]);
        expect(await repos.progress.listCards()).toEqual(before);
        expect(await repos.progress.getCard(card.id)).toEqual(reviewed);
        expect(await repos.reviews.logsBetween(at(0), at(DAY))).toEqual(logsBefore);
      });
    });

    describe('ReviewRepository', () => {
      it('logs theo thẻ và theo khoảng thời gian, cũ trước', async () => {
        let c = await introduceCard(
          repos.progress,
          { itemType: 'word', itemId: 'di', cardType: 'th-vi' },
          at(0),
        );
        c = await recordReview(repos, c, 'good', at(1), 1200);
        c = await recordReview(repos, c, 'again', at(30));
        const logs = await repos.reviews.logsForCard(c.id);
        expect(logs.map((l) => [l.rating, l.review])).toEqual([
          ['good', at(1).toISOString()],
          ['again', at(30).toISOString()],
        ]);
        expect(logs[0]).toMatchObject({ durationMs: 1200, state: 'new', cardId: c.id });
        expect((await repos.reviews.logsBetween(at(2), at(60))).map((l) => l.rating)).toEqual([
          'again',
        ]);
      });

      it('listening stats theo khoảng thời gian', async () => {
        for (const [i, correct] of [true, false].entries()) {
          await repos.reviews.addListeningStat({
            id: `s${i}`,
            expectedTone: 'high',
            answeredTone: correct ? 'high' : 'rising',
            correct,
            ts: at(i * DAY).toISOString(),
            updatedAt: at(i * DAY).toISOString(),
          });
        }
        expect(
          (await repos.reviews.listeningStatsBetween(at(0), at(DAY))).map((s) => s.id),
        ).toEqual(['s0']);
      });
    });

    it('SettingsRepository: fallback, ghi đè, giá trị object', async () => {
      expect(await repos.settings.get('newPerDay', 10)).toBe(10);
      await repos.settings.set('newPerDay', 15);
      await repos.settings.set('goal', { cards: 20 });
      expect(await repos.settings.get('newPerDay', 10)).toBe(15);
      expect(await repos.settings.get('goal', {})).toEqual({ cards: 20 });
    });

    it('SessionRepository: start/end/listBetween', async () => {
      const s = await repos.sessions.start('vocab', at(0));
      expect(s).toMatchObject({ module: 'vocab', startedAt: at(0).toISOString(), endedAt: null });
      expect(s.id).toMatch(/^[0-9a-f-]{36}$/);
      await repos.sessions.end(s.id, at(15));
      await repos.sessions.end('khong-co', at(15));
      await repos.sessions.start('alphabet', at(DAY));
      const list = await repos.sessions.listBetween(at(0), at(DAY));
      expect(list).toEqual([
        { ...s, endedAt: at(15).toISOString(), updatedAt: at(15).toISOString() },
      ]);
    });

    it('introduceCard không tạo trùng; recordReview cập nhật lịch', async () => {
      const item = { itemType: 'consonant', itemId: 'ko-kai', cardType: 'th-vi' } as const;
      const first = await introduceCard(repos.progress, item, at(0));
      const again = await introduceCard(repos.progress, item, at(5));
      expect(again.id).toBe(first.id);
      expect(await repos.progress.countCreatedBetween(at(0), at(DAY))).toBe(1);
      const reviewed = await recordReview(repos, first, 'good', at(1));
      expect(reviewed.fsrs.state).toBe('learning');
      expect(await repos.progress.getCard(first.id)).toEqual(reviewed);
    });
  });
}
