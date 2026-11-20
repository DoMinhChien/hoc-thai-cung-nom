import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXERCISES } from '../../exercises/exercises';
import { bundle, CLASSIFIERS, GREETINGS } from '../fixtures.test-utils';
import { START_LIVES } from '../rapid';
import { createRng } from '../rng';
import { unitSource, type GameSource } from '../source';
import {
  activeMoles,
  advance,
  AIRPLANE_LANES,
  airplane,
  ARCADE_GAME_IDS,
  ARCADE_GAMES,
  arcadeInitial,
  BASE_SPEED,
  BONUS_QUESTIONS,
  canMove,
  cloudSpeed,
  currentFlight,
  currentMaze,
  currentShow,
  currentWhack,
  DOOR,
  EXTRA_TIME_MS,
  GAMESHOW_QUESTION_MS,
  GAMESHOW_QUESTIONS,
  gameshow,
  generateMaze,
  GHOST_START,
  GHOST_STEP_MS,
  ghostStepMs,
  LOOP_STEP_MS,
  MAX_SPEED_FACTOR,
  maze,
  MAZE_COLS,
  MAZE_CORNERS,
  MAZE_ROWS,
  MIN_GHOST_STEP_MS,
  MOLE_INTERVAL_MS,
  MOLE_STAY_MS,
  MOLES_PER_CYCLE,
  nextStepToward,
  PLANE_X,
  PLAYER_START,
  promptItems,
  setMazeStepMode,
  showTimeLeft,
  sourcePool,
  STEP_MODE_RATIO,
  WHACK_DURATION_MS,
  WHACK_PENALTY,
  whackAMole,
  wrongOptions,
  type ArcadeState,
  type Direction,
  type Maze,
  type MazeState,
  type WhackState,
} from '.';

const greetings = unitSource(GREETINGS);
const merged: GameSource = {
  key: 'learned',
  words: [...greetings.words, ...unitSource(CLASSIFIERS).words],
  sentences: greetings.sentences,
};
const tiny = unitSource(bundle('u09', 9, [['a', 'ก', ['một']]]));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('khung arcade', () => {
  it('4 trò trong ARCADE_GAMES, id khớp', () => {
    expect(Object.keys(ARCADE_GAMES)).toEqual([...ARCADE_GAME_IDS]);
    for (const id of ARCADE_GAME_IDS) expect(ARCADE_GAMES[id].id).toBe(id);
  });

  it('advance chia dtMs thành bước ≤ LOOP_STEP_MS, dừng khi kết thúc, bỏ dt âm', () => {
    const steps: number[] = [];
    const s = advance(arcadeInitial(), 120, (st, ms) => (steps.push(ms), st));
    expect(steps).toEqual([LOOP_STEP_MS, LOOP_STEP_MS, 20]);
    expect(s.elapsedMs).toBe(120);
    const done = advance(arcadeInitial(), 500, (st) => ({ ...st, status: 'finished' as const }));
    expect(done.elapsedMs).toBe(LOOP_STEP_MS);
    expect(
      advance(arcadeInitial(), -10, () => {
        throw new Error('không chạy');
      }).elapsedMs,
    ).toBe(0);
  });

  it('wrongOptions: bỏ chữ trùng và mục cùng nghĩa với đáp án', () => {
    const items = promptItems(
      unitSource(
        bundle('u09', 9, [
          ['chan', 'ฉัน', ['tôi']],
          ['dichan', 'ดิฉัน', ['tôi']],
          ['khao', 'ข้าว', ['cơm']],
          ['khao2', 'ข้าว', ['gạo']],
        ]),
      ),
    );
    expect(wrongOptions(items, items[0]!)).toEqual(['ข้าว']);
    expect(promptItems(greetings, false, true).every((i) => i.item.itemType === 'sentence')).toBe(
      true,
    );
  });
});

describe('F-15 Đập chuột', () => {
  const round = whackAMole.generateRound(greetings, 7);
  const start = () => whackAMole.start(round);
  const holeOf = (s: WhackState, th: string) => activeMoles(s).find((m) => m.th === th)?.hole;
  /** Chạy tới khi con mang `th` thò lên (≤ 1 chu kỳ). */
  const until = (s: WhackState, pred: (s: WhackState) => boolean) => {
    let x = s;
    for (let i = 0; i < 200 && !pred(x); i++) x = whackAMole.tick(x, 50);
    return x;
  };

  it('khóa khi ít hơn 6 chữ Thái; cùng seed → cùng lượt', () => {
    expect(whackAMole.availability(tiny)).toMatchObject({ ok: false, reason: 'words' });
    expect(() => whackAMole.generateRound(tiny, 1)).toThrow('whack-a-mole');
    expect(whackAMole.generateRound(greetings, 7)).toEqual(round);
  });

  it('lịch: 9 con/chu kỳ, mỗi nhóm 3 có đúng 1 đáp án, không thò liền cùng ô (kể cả nối chu kỳ)', () => {
    for (const q of round.questions.slice(0, 20)) {
      expect(q.moles).toHaveLength(MOLES_PER_CYCLE);
      for (let g = 0; g < 3; g++) {
        expect(q.moles.slice(g * 3, g * 3 + 3).filter((m) => m.th === q.th)).toHaveLength(1);
      }
      q.moles.forEach((m, i) => {
        expect(m.hole).not.toBe(q.moles[(i + 1) % MOLES_PER_CYCLE]!.hole);
        expect(m.at).toBe(i * MOLE_INTERVAL_MS);
      });
    }
  });

  it('activeMoles: con ở lại MOLE_STAY_MS, con cuối chu kỳ trước còn hiện sang chu kỳ sau', () => {
    const s = start();
    expect(activeMoles(s).map((m) => m.key)).toEqual([0]);
    expect(activeMoles({ ...s, elapsedMs: MOLE_INTERVAL_MS }).map((m) => m.key)).toEqual([0, 1]);
    expect(activeMoles({ ...s, elapsedMs: MOLE_STAY_MS }).map((m) => m.key)).toEqual([1, 2]);
    const period = MOLES_PER_CYCLE * MOLE_INTERVAL_MS;
    expect(activeMoles({ ...s, elapsedMs: period + 100 }).map((m) => m.key)).toEqual([
      MOLES_PER_CYCLE,
      MOLES_PER_CYCLE - 1,
    ]);
  });

  it('đập ô trống bỏ qua; đập nhầm trừ điểm (không âm), ẩn con đó, ghi mục sai; đập đúng → đề tiếp + combo', () => {
    let s = start();
    const q = currentWhack(s);
    const empty = [...Array(9).keys()].find((h) => !activeMoles(s).some((m) => m.hole === h))!;
    expect(whackAMole.tick(s, 0, { hit: empty })).toEqual(s);

    s = until(s, (x) => activeMoles(x).some((m) => m.th !== q.th));
    const wrong = activeMoles(s).find((m) => m.th !== q.th)!;
    s = whackAMole.tick(s, 0, { hit: wrong.hole });
    expect(s).toMatchObject({ score: 0, combo: 0, total: 1, status: 'playing' });
    expect(s.mistakes[0]).toMatchObject({ itemId: q.item.itemId, given: wrong.th });
    expect(activeMoles(s).some((m) => m.key === wrong.key)).toBe(false);

    s = until(s, (x) => holeOf(x, q.th) !== undefined);
    s = whackAMole.tick(s, 0, { hit: holeOf(s, q.th)! });
    expect(s).toMatchObject({ score: 100, combo: 1, index: 1, whacked: [] });
    expect(s.questionStartMs).toBe(s.elapsedMs);
    const q2 = currentWhack(s);
    s = until(s, (x) => holeOf(x, q2.th) !== undefined);
    s = whackAMole.tick(s, 0, { hit: holeOf(s, q2.th)! });
    expect(s.score).toBe(300);

    // Đập nhầm khi đã có điểm: trừ WHACK_PENALTY.
    const q3 = currentWhack(s);
    s = until(s, (x) => activeMoles(x).some((m) => m.th !== q3.th));
    s = whackAMole.tick(s, 0, { hit: activeMoles(s).find((m) => m.th !== q3.th)!.hole });
    expect(s.score).toBe(300 - WHACK_PENALTY);
  });

  it('hết 60 s → kết thúc; trạng thái kết thúc giữ nguyên; summary', () => {
    const s = whackAMole.tick(start(), WHACK_DURATION_MS + 500);
    expect(s).toMatchObject({ status: 'finished', finishedAt: WHACK_DURATION_MS });
    expect(whackAMole.tick(s, 100, { hit: 0 })).toBe(s);
    expect(whackAMole.summary(s)).toMatchObject({
      gameId: 'whack-a-mole',
      durationMs: WHACK_DURATION_MS,
      total: 0,
    });
    expect(whackAMole.summary(start()).durationMs).toBe(0);
  });
});

describe('F-16 Đố vui truyền hình', () => {
  const round = gameshow.generateRound(merged, 3);
  const start = () => gameshow.start(round);

  it('khóa khi < 8 mục ra được đề; nguồn → kho Bài tập', () => {
    expect(gameshow.availability(tiny)).toMatchObject({ ok: false, need: 8 });
    expect(() => gameshow.generateRound(tiny, 1)).toThrow('gameshow');
    const pool = sourcePool(merged);
    expect(pool.words.find((w) => w.id === 'sawatdee')?.meaning).toBe('xin chào; tạm biệt');
    expect(pool.words.find((w) => w.id === 'rot')?.classifier).toBe('คัน');
    expect(pool.sentences[0]).toMatchObject({ distractors: [], lessonId: '' });
  });

  it('12 câu trộn E-01/E-02/E-05/E-14, có đáp án trong lựa chọn, 3 câu cuối là vòng thưởng', () => {
    expect(round.questions).toHaveLength(GAMESHOW_QUESTIONS);
    expect(new Set(round.questions.map((q) => q.type)).size).toBeGreaterThanOrEqual(3);
    for (const q of round.questions) expect(q.options).toContain(q.answer);
    expect(round.questions.filter((q) => q.bonus)).toHaveLength(BONUS_QUESTIONS);
    expect(round.questions.at(-1)!.bonus).toBe(true);
    expect(round.questions[0]!.bonus).toBe(false);
  });

  it('đề không phải trắc nghiệm → lỗi rõ ràng', () => {
    vi.spyOn(EXERCISES['E-01'], 'generate').mockReturnValue({
      kind: 'typing',
    } as unknown as ReturnType<(typeof EXERCISES)['E-01']['generate']>);
    vi.spyOn(EXERCISES['E-05'], 'generate').mockReturnValue({
      kind: 'typing',
    } as unknown as ReturnType<(typeof EXERCISES)['E-05']['generate']>);
    vi.spyOn(EXERCISES['E-02'], 'generate').mockReturnValue({
      kind: 'typing',
    } as unknown as ReturnType<(typeof EXERCISES)['E-02']['generate']>);
    vi.spyOn(EXERCISES['E-14'], 'generate').mockReturnValue({
      kind: 'typing',
    } as unknown as ReturnType<(typeof EXERCISES)['E-14']['generate']>);
    expect(() => gameshow.generateRound(merged, 3)).toThrow('không phải trắc nghiệm');
  });

  it('trả lời đúng: 100 + thưởng tốc độ, dừng ở phản hồi (đồng hồ câu không chạy), next → câu sau', () => {
    let s = start();
    s = gameshow.tick(s, GAMESHOW_QUESTION_MS / 2);
    s = gameshow.tick(s, 0, { answer: currentShow(s).answer });
    expect(s).toMatchObject({ status: 'feedback', score: 150, correct: 1 });
    // Trả lời / trợ giúp khi đang ở phản hồi: bỏ qua; giờ không trôi.
    expect(gameshow.tick(s, 0, { answer: 'x' })).toEqual(s);
    expect(gameshow.tick(s, 0, { lifeline: 'time' })).toEqual(s);
    const later = gameshow.tick(s, GAMESHOW_QUESTION_MS * 2);
    expect(later.status).toBe('feedback');
    // next khi đang chơi: bỏ qua.
    expect(gameshow.tick(start(), 0, { next: true })).toEqual(start());
    s = gameshow.tick(later, 0, { next: true });
    expect(s).toMatchObject({ status: 'playing', index: 1, removed: [] });
    expect(showTimeLeft(s)).toBe(GAMESHOW_QUESTION_MS);
  });

  it('sai → ghi lựa chọn; hết giờ → sai không có given', () => {
    let s = start();
    const q = currentShow(s);
    s = gameshow.tick(s, 0, { answer: q.options.find((o) => o !== q.answer)! });
    expect(s.mistakes[0]).toMatchObject({ expected: q.answer, given: expect.any(String) });
    s = gameshow.tick(s, 0, { next: true });
    s = gameshow.tick(s, GAMESHOW_QUESTION_MS);
    expect(s).toMatchObject({ status: 'feedback', total: 2, correct: 0 });
    expect(s.mistakes[1]!.given).toBeUndefined();
  });

  it('50:50 bỏ 2 lựa chọn sai, thêm giờ +10 s; mỗi loại một lần', () => {
    let s = start();
    const q = currentShow(s);
    s = gameshow.tick(s, 0, { lifeline: 'fifty' });
    expect(s.removed).toHaveLength(2);
    expect(s.removed).not.toContain(q.answer);
    s = gameshow.tick(s, 0, { lifeline: 'time' });
    expect(s.timeLimitMs).toBe(GAMESHOW_QUESTION_MS + EXTRA_TIME_MS);
    expect(gameshow.tick(s, 0, { lifeline: 'time' })).toEqual(s);
    expect(s.used).toEqual(['fifty', 'time']);
  });

  it('vòng thưởng ×2; câu cuối + next → kết thúc; summary', () => {
    let s = start();
    for (let i = 0; i < GAMESHOW_QUESTIONS; i++) {
      s = gameshow.tick(s, 0, { answer: currentShow(s).answer });
      if (i === GAMESHOW_QUESTIONS - 1) expect(s.feedback?.points).toBe(200 * 2);
      s = gameshow.tick(s, 0, { next: true });
    }
    expect(s.status).toBe('finished');
    expect(gameshow.tick(s, 10, { next: true })).toBe(s);
    expect(gameshow.summary(s)).toMatchObject({ gameId: 'gameshow', correct: 12, accuracy: 1 });
  });
});

describe('F-17 Máy bay', () => {
  const round = airplane.generateRound(greetings, 5);
  const start = () => airplane.start(round);
  /** ms để hàng mây trôi từ 1 tới máy bay ở tốc độ sau `correct` câu đúng. */
  const flight = (correct: number) => Math.ceil(((1 - PLANE_X) / cloudSpeed(correct)) * 1000);
  const steer = (s: ReturnType<typeof start>, lane: number) => {
    let x = s;
    while (x.lane !== lane) x = airplane.tick(x, 0, { move: x.lane < lane ? 1 : -1 });
    return x;
  };

  it('khóa khi ít mục; câu dài > 3 thẻ từ không vào mây; 4 làn có đúng 1 đáp án', () => {
    expect(airplane.availability(tiny)).toMatchObject({ ok: false });
    expect(() => airplane.generateRound(tiny, 1)).toThrow('airplane');
    expect(round.questions.some((q) => q.item.itemId === 's4')).toBe(false);
    for (const q of round.questions) {
      expect(q.clouds).toHaveLength(AIRPLANE_LANES);
      expect(q.clouds[q.answerLane]).toBe(q.th);
      expect(new Set(q.clouds).size).toBe(AIRPLANE_LANES);
    }
  });

  it('lái lên/xuống trong 4 làn', () => {
    let s = start();
    expect(s.lane).toBe(1);
    s = airplane.tick(s, 0, { move: -1 });
    s = airplane.tick(s, 0, { move: -1 });
    expect(s.lane).toBe(0);
    for (let i = 0; i < 5; i++) s = airplane.tick(s, 0, { move: 1 });
    expect(s.lane).toBe(AIRPLANE_LANES - 1);
  });

  it('mây trôi theo thời gian; vào mây đúng → điểm + nhanh hơn; mây sai → mất tim; hết tim → kết thúc', () => {
    let s = steer(start(), currentFlight(start()).answerLane);
    s = airplane.tick(s, 1000);
    expect(s.cloudX).toBeCloseTo(1 - BASE_SPEED);
    s = airplane.tick(s, flight(0) - 1000);
    expect(s).toMatchObject({ score: 100, correct: 1, index: 1, lifeDelta: 0 });
    expect(s.cloudX).toBeGreaterThan(0.95);

    for (let lost = 1; lost <= START_LIVES; lost++) {
      const q = currentFlight(s);
      s = steer(s, (q.answerLane + 1) % AIRPLANE_LANES);
      s = airplane.tick(s, flight(s.correct));
      expect(s.lives).toBe(START_LIVES - lost);
      expect(s.lifeDelta).toBe(-1);
    }
    expect(s.status).toBe('finished');
    expect(s.mistakes[0]!.given).toBeDefined();
    expect(airplane.tick(s, 100, { move: 1 })).toBe(s);
    expect(airplane.summary(s)).toMatchObject({ gameId: 'airplane', correct: 1, total: 4 });
  });

  it('tốc độ tăng 6% mỗi câu đúng, tối đa ×2', () => {
    expect(cloudSpeed(0)).toBe(BASE_SPEED);
    expect(cloudSpeed(5)).toBeCloseTo(BASE_SPEED * 1.3);
    expect(cloudSpeed(100)).toBe(BASE_SPEED * MAX_SPEED_FACTOR);
  });
});

describe('F-18 Mê cung', () => {
  /** Mê cung không tường trong (mọi ô thông nhau) — đường đi dễ đoán cho test. */
  const open: Maze = {
    cols: MAZE_COLS,
    rows: MAZE_ROWS,
    cells: Array.from({ length: MAZE_COLS * MAZE_ROWS }, (_, i) => {
      const x = i % MAZE_COLS;
      const y = Math.floor(i / MAZE_COLS);
      return (
        (y > 0 ? DOOR.N : 0) |
        (y < MAZE_ROWS - 1 ? DOOR.S : 0) |
        (x > 0 ? DOOR.W : 0) |
        (x < MAZE_COLS - 1 ? DOOR.E : 0)
      );
    }),
  };
  const round = maze.generateRound(greetings, 9);
  const start = (): MazeState => ({ ...maze.start(round), maze: open });
  const BOTTOM_LEFT = 2;
  const BOTTOM_RIGHT = 3;
  /** Đi tới góc `corner` (ma đứng yên vì dt = 0); trả trạng thái ngay khi tới góc. */
  const walkTo = (s: MazeState, corner: number) => {
    let x = s;
    const target = MAZE_CORNERS[corner]!;
    for (;;) {
      const dir = nextStepToward(x.maze, x.player, target)!;
      const before = x.index + x.lives * 1000;
      x = maze.tick(x, 0, { dir });
      if (x.index + x.lives * 1000 !== before || x.status === 'finished') return x;
    }
  };
  const withAnswer = (s: MazeState, corner: number): MazeState => {
    const q = currentMaze(s);
    const options = [...q.options];
    [options[corner], options[q.answerCorner]] = [options[q.answerCorner]!, options[corner]!];
    const questions = [...s.questions];
    questions[s.index % questions.length] = { ...q, options, answerCorner: corner };
    return { ...s, questions };
  };

  it('generateMaze: mê cung hoàn hảo (mọi ô thông nhau, số cửa = số ô − 1, cửa hai chiều)', () => {
    const m = generateMaze(createRng(4));
    let doors = 0;
    m.cells.forEach((c, i) => {
      const x = i % m.cols;
      const y = Math.floor(i / m.cols);
      if (c & DOOR.E) {
        doors++;
        expect(m.cells[i + 1]! & DOOR.W).toBeTruthy();
      }
      if (c & DOOR.S) {
        doors++;
        expect(m.cells[i + m.cols]! & DOOR.N).toBeTruthy();
      }
      expect(nextStepToward(m, { x, y }, PLAYER_START) !== null || (x === 4 && y === 3)).toBe(true);
    });
    expect(doors).toBe(m.cols * m.rows - 1);
    expect(generateMaze(createRng(4))).toEqual(m);
  });

  it('nextStepToward: đã tới → null; không có đường → null; canMove theo tường', () => {
    expect(nextStepToward(open, PLAYER_START, PLAYER_START)).toBeNull();
    expect(nextStepToward(open, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe('right');
    const walled: Maze = { cols: 2, rows: 1, cells: [0, 0] };
    expect(nextStepToward(walled, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
    expect(canMove(open, { x: 0, y: 0 }, 'up')).toBe(false);
    expect(canMove(open, { x: 0, y: 0 }, 'down')).toBe(true);
  });

  it('khóa khi ít từ; 4 góc có đúng 1 đáp án; ma nhanh dần tới mức tối thiểu', () => {
    expect(maze.availability(tiny)).toMatchObject({ ok: false });
    expect(() => maze.generateRound(tiny, 1)).toThrow('maze');
    for (const q of round.questions) {
      expect(q.options).toHaveLength(MAZE_CORNERS.length);
      expect(q.options[q.answerCorner]).toBe(q.th);
    }
    expect(ghostStepMs(0)).toBe(GHOST_STEP_MS);
    expect(ghostStepMs(100)).toBe(MIN_GHOST_STEP_MS);
  });

  it('đâm tường bỏ qua; tới góc đúng → điểm, đề mới, về chỗ cũ; góc sai → mất tim', () => {
    const s0 = start();
    const blocked = { ...s0, player: { x: 0, y: 3 } };
    expect(maze.tick(blocked, 0, { dir: 'left' })).toEqual(blocked);

    let s = walkTo(withAnswer(s0, BOTTOM_LEFT), BOTTOM_LEFT);
    expect(s).toMatchObject({ score: 100, index: 1, player: PLAYER_START, ghost: GHOST_START });

    s = walkTo(withAnswer(s, BOTTOM_LEFT), BOTTOM_RIGHT);
    expect(s).toMatchObject({ lives: START_LIVES - 1, lostBy: 'wrong', lifeDelta: -1, index: 1 });
    expect(s.mistakes[0]!.given).toBe(currentMaze(s).options[BOTTOM_RIGHT]);
    // Bước tiếp theo xóa thông báo mất tim.
    expect(maze.tick(s, 0, { dir: 'down' }).lostBy).toBeNull();
  });

  it('ma đuổi theo thời gian; bị bắt → mất tim; hết tim → kết thúc', () => {
    let s = start();
    s = maze.tick(s, GHOST_STEP_MS - 1);
    expect(s.ghost).toEqual(GHOST_START);
    s = maze.tick(s, 1);
    expect(s.ghost).toEqual({ x: GHOST_START.x, y: GHOST_START.y + 1 });
    for (let i = 0; i < 3 && s.status !== 'finished'; i++) {
      s = maze.tick(s, GHOST_STEP_MS * 4);
      expect(s.lostBy).toBe('ghost');
    }
    expect(s.status).toBe('finished');
    expect(maze.tick(s, 10, { dir: 'up' })).toBe(s);
    expect(maze.summary(s)).toMatchObject({ gameId: 'maze', total: 0 });
  });

  it('người chơi tự đi vào ma → mất tim', () => {
    const s = { ...start(), player: { x: GHOST_START.x, y: GHOST_START.y + 1 } };
    expect(maze.tick(s, 0, { dir: 'up' })).toMatchObject({ lostBy: 'ghost', lives: 2 });
  });

  it('chế độ từng bước: ma đi 1 ô sau mỗi 2 bước người chơi, không theo đồng hồ', () => {
    let s: MazeState = setMazeStepMode(start(), true);
    s = maze.tick(s, 10_000);
    expect(s.ghost).toEqual(GHOST_START);
    expect(s.elapsedMs).toBe(10_000);
    const dirs: Direction[] = ['down', 'down'];
    for (let i = 0; i < STEP_MODE_RATIO - 1; i++) s = maze.tick(s, 0, { dir: dirs[i]! });
    expect(s.ghost).toEqual(GHOST_START);
    s = maze.tick(s, 0, { dir: dirs[1]! });
    expect(s.ghost).not.toEqual(GHOST_START);
    expect(s.pendingSteps).toBe(0);
  });
});

it('ArcadeState bắt đầu ở đồng hồ 0', () => {
  const s: ArcadeState = arcadeInitial();
  expect(s).toMatchObject({ elapsedMs: 0, status: 'playing', score: 0 });
});
