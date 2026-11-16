/**
 * Bộ test hợp đồng cho mọi bản repository (bộ nhớ, Dexie, Phase 2: Synced).
 * Import qua `@nom/core/testing` — không nằm trong bundle app.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newSrsState, reviewSrs } from '../srs/srs';
import type { CardRecord } from './records';
import type { Repositories } from './repositories';
import { introduceCard, recordReview } from './study';

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
