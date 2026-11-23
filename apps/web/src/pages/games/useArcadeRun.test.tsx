import {
  activeMoles,
  currentWhack,
  MockAudioProvider,
  MOLE_INTERVAL_MS,
  WHACK_DURATION_MS,
  whackAMole,
  type GameSource,
} from '@nom/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import Dexie from 'dexie';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioProviderBoundary } from '@/audio/AudioContext';
import type { FrameScheduler } from '@/components/interactive';
import { NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { RepositoriesContext } from '@/data/repositories-context';
import { useArcadeRun } from './useArcadeRun';

// Content GIẢ LẬP cho test vòng lặp arcade — không phải nội dung học.
const SOURCE: GameSource = {
  key: 'learned',
  words: ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ'].map((thai, i) => ({
    id: `w${i + 1}`,
    unitId: 'u1',
    lessonId: 'u1-l1',
    thai,
    meanings: [`nghĩa ${i + 1}`],
  })),
  sentences: [],
};

/** Bộ lập lịch khung hình giả: `frame(t)` chạy callback đang chờ ở thời điểm `t`. */
function fakeFrames() {
  let pending: ((time: number) => void) | null = null;
  let next = 1;
  const scheduler: FrameScheduler = {
    request: (cb) => {
      pending = cb;
      return next++;
    },
    cancel: () => {
      pending = null;
    },
  };
  return {
    scheduler,
    /** Chạy liên tiếp các khung cách nhau `step` ms tới `to`. */
    run(from: number, to: number, step = 50) {
      for (let t = from; t <= to; t += step) {
        const cb = pending;
        pending = null;
        act(() => cb?.(t));
      }
    },
    get waiting() {
      return pending !== null;
    },
  };
}

const dbs: NomDatabase[] = [];
afterEach(async () => {
  for (const db of dbs.splice(0)) {
    db.close();
    await Dexie.delete(db.name);
  }
});

function setup(name: string) {
  const db = new NomDatabase(name);
  dbs.push(db);
  const repos = createDexieRepositories(db);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <RepositoriesContext.Provider value={repos}>
      <AudioProviderBoundary provider={new MockAudioProvider()}>{children}</AudioProviderBoundary>
    </RepositoriesContext.Provider>
  );
  const frames = fakeFrames();
  const player = vi.fn();
  const hook = renderHook(
    () => useArcadeRun(whackAMole, SOURCE, 7, { frames: frames.scheduler, player }),
    { wrapper },
  );
  return { frames, player, ...hook };
}

describe('useArcadeRun (M9.6)', () => {
  it('chưa bắt đầu: không chạy khung hình, bỏ qua thao tác', async () => {
    const { result, frames } = setup('arcade-idle');
    await waitFor(() => expect(result.current.sound.volume).toBeGreaterThan(0));
    expect(frames.waiting).toBe(false);
    act(() => result.current.input({ hit: 0 }));
    expect(result.current.state.elapsedMs).toBe(0);
    expect(result.current.state.total).toBe(0);
  });

  it('bắt đầu → đồng hồ trò chạy theo khung; đập đúng / sai có âm tương ứng', async () => {
    const { result, frames, player } = setup('arcade-play');
    await waitFor(() => expect(result.current.sound.volume).toBeGreaterThan(0));
    act(() => result.current.start());
    frames.run(0, MOLE_INTERVAL_MS * 3);
    expect(result.current.state.elapsedMs).toBe(MOLE_INTERVAL_MS * 3);

    const answer = currentWhack(result.current.state);
    const visible = (match: boolean) =>
      activeMoles(result.current.state).find((m) => (m.th === answer.th) === match);
    // Chạy tiếp tới khi có con mang đáp án sai đang thò lên (lịch theo seed).
    let t = MOLE_INTERVAL_MS * 3;
    while (!visible(false)) frames.run((t += 50), t);
    const wrong = visible(false);
    act(() => result.current.input({ hit: wrong!.hole }));
    expect(result.current.state.total).toBe(1);
    expect(player).toHaveBeenLastCalledWith('wrong', expect.any(Number));
    while (!visible(true)) frames.run((t += 50), t);
    act(() => result.current.input({ hit: visible(true)!.hole }));
    expect(result.current.state.correct).toBe(1);
    expect(player).toHaveBeenLastCalledWith('correct', expect.any(Number));
  });

  it('hết giờ → finished, vòng lặp dừng, thao tác bị bỏ qua', async () => {
    const { result, frames } = setup('arcade-end');
    await waitFor(() => expect(result.current.sound.volume).toBeGreaterThan(0));
    act(() => result.current.start());
    frames.run(0, WHACK_DURATION_MS + 1000, 100);
    expect(result.current.state.status).toBe('finished');
    expect(frames.waiting).toBe(false);
    const before = result.current.state;
    act(() => result.current.input({ hit: 4 }));
    expect(result.current.state).toBe(before);
  });
});
