/**
 * F-18 Mê cung (plan 0.14, mẫu "maze chase"): đề nghĩa tiếng Việt; 4 góc mê cung mỗi góc một đáp án
 * chữ Thái. Đi bằng mũi tên tới góc đúng, tránh "ma" đuổi theo đường ngắn nhất. Góc sai hoặc bị ma
 * bắt → mất 1 tim, về chỗ cũ; hết 3 tim → kết thúc. Chế độ từng bước (reduced-motion): ma chỉ đi
 * khi người chơi đi (2 bước người → 1 bước ma), không có đồng hồ.
 */
import { availability, assertAvailable, cycle, type GameItemRef } from '../game';
import { START_LIVES } from '../rapid';
import { createRng, type Rng } from '../rng';
import {
  advance,
  arcadeAnswer,
  arcadeInitial,
  arcadeSummary,
  finishArcade,
  promptItems,
  wrongOptions,
  type ArcadeGame,
  type ArcadeState,
} from './arcade';

export const MAZE_COLS = 9;
export const MAZE_ROWS = 7;
export const MAZE_MIN_WORDS = 6;
/** Ma đi một ô mỗi chừng này ms; nhanh dần 5% mỗi câu đúng, không dưới `MIN_GHOST_STEP_MS`. */
export const GHOST_STEP_MS = 700;
export const MIN_GHOST_STEP_MS = 350;
/** Chế độ từng bước: ma đi 1 ô sau mỗi chừng này bước của người chơi. */
export const STEP_MODE_RATIO = 2;
const POINTS = 100;
const QUESTIONS = 40;

/** Bit cửa mở của một ô. */
export const DOOR = { N: 1, E: 2, S: 4, W: 8 } as const;
export type Direction = 'up' | 'down' | 'left' | 'right';

const MOVES: Record<Direction, { bit: number; back: number; dx: number; dy: number }> = {
  up: { bit: DOOR.N, back: DOOR.S, dx: 0, dy: -1 },
  down: { bit: DOOR.S, back: DOOR.N, dx: 0, dy: 1 },
  left: { bit: DOOR.W, back: DOOR.E, dx: -1, dy: 0 },
  right: { bit: DOOR.E, back: DOOR.W, dx: 1, dy: 0 },
};

export interface Cell {
  x: number;
  y: number;
}

/** 4 góc đáp án: trên trái, trên phải, dưới trái, dưới phải. */
export const MAZE_CORNERS: readonly Cell[] = [
  { x: 0, y: 0 },
  { x: MAZE_COLS - 1, y: 0 },
  { x: 0, y: MAZE_ROWS - 1 },
  { x: MAZE_COLS - 1, y: MAZE_ROWS - 1 },
];
export const PLAYER_START: Cell = { x: Math.floor(MAZE_COLS / 2), y: Math.floor(MAZE_ROWS / 2) };
export const GHOST_START: Cell = { x: Math.floor(MAZE_COLS / 2), y: 0 };

export interface Maze {
  cols: number;
  rows: number;
  /** `cells[y * cols + x]` = tổ hợp bit `DOOR` các cửa mở. */
  cells: number[];
}

export interface MazeQuestion {
  item: GameItemRef;
  th: string;
  vi: string;
  /** Đáp án ở 4 góc (`MAZE_CORNERS`). */
  options: string[];
  answerCorner: number;
}

export interface MazeRound {
  maze: Maze;
  questions: MazeQuestion[];
}

export interface MazeState extends ArcadeState {
  maze: Maze;
  questions: MazeQuestion[];
  index: number;
  player: Cell;
  ghost: Cell;
  /** ms ma đã chờ từ bước trước. */
  ghostClock: number;
  /** Bước người chơi chưa "trả" cho ma (chế độ từng bước). */
  pendingSteps: number;
  stepMode: boolean;
  lives: number;
  lifeDelta: -1 | 0;
  /** Lý do mất tim gần nhất (UI hiện chữ). */
  lostBy: 'wrong' | 'ghost' | null;
}

export interface MazeInput {
  dir: Direction;
}

export const currentMaze = (state: MazeState) =>
  state.questions[state.index % state.questions.length]!;

const at = (maze: Maze, c: Cell) => maze.cells[c.y * maze.cols + c.x]!;
const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** Đi được từ `c` theo hướng `dir` (không có tường)? */
export function canMove(maze: Maze, c: Cell, dir: Direction): boolean {
  return (at(maze, c) & MOVES[dir].bit) !== 0;
}

function step(c: Cell, dir: Direction): Cell {
  return { x: c.x + MOVES[dir].dx, y: c.y + MOVES[dir].dy };
}

/** Mê cung hoàn hảo (mọi ô nối nhau, đúng một đường giữa hai ô) — DFS quay lui có seed. */
export function generateMaze(rng: Rng, cols = MAZE_COLS, rows = MAZE_ROWS): Maze {
  const cells = Array<number>(cols * rows).fill(0);
  const seen = new Set<number>([0]);
  const stack: Cell[] = [{ x: 0, y: 0 }];
  while (stack.length > 0) {
    const c = stack[stack.length - 1]!;
    const options = (Object.keys(MOVES) as Direction[]).filter((d) => {
      const n = step(c, d);
      return n.x >= 0 && n.y >= 0 && n.x < cols && n.y < rows && !seen.has(n.y * cols + n.x);
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const d = options[rng.int(options.length)]!;
    const n = step(c, d);
    cells[c.y * cols + c.x]! |= MOVES[d].bit;
    cells[n.y * cols + n.x]! |= MOVES[d].back;
    seen.add(n.y * cols + n.x);
    stack.push(n);
  }
  return { cols, rows, cells };
}

/** Bước đầu tiên trên đường ngắn nhất từ `from` tới `to` (BFS); `null` khi đã tới. */
export function nextStepToward(maze: Maze, from: Cell, to: Cell): Direction | null {
  if (same(from, to)) return null;
  const key = (c: Cell) => c.y * maze.cols + c.x;
  const firstDir = new Map<number, Direction>([[key(from), 'up']]);
  const queue: Cell[] = [from];
  while (queue.length > 0) {
    const c = queue.shift()!;
    for (const d of Object.keys(MOVES) as Direction[]) {
      if (!canMove(maze, c, d)) continue;
      const n = step(c, d);
      if (firstDir.has(key(n))) continue;
      const first = same(c, from) ? d : firstDir.get(key(c))!;
      if (same(n, to)) return first;
      firstDir.set(key(n), first);
      queue.push(n);
    }
  }
  // Mê cung hoàn hảo luôn có đường; giữ để an toàn khi dữ liệu hỏng.
  return null;
}

export const ghostStepMs = (correct: number) =>
  Math.max(MIN_GHOST_STEP_MS, Math.round(GHOST_STEP_MS * 0.95 ** correct));

/** Mất tim, về chỗ cũ (cùng đề nếu chọn sai / bị bắt). */
function loseLife(state: MazeState, by: 'wrong' | 'ghost'): MazeState {
  const lives = state.lives - 1;
  const next: MazeState = {
    ...state,
    lives,
    lifeDelta: -1,
    lostBy: by,
    player: PLAYER_START,
    ghost: GHOST_START,
    ghostClock: 0,
    pendingSteps: 0,
  };
  return lives <= 0 ? finishArcade(next) : next;
}

function caught(state: MazeState): MazeState {
  return same(state.player, state.ghost) ? loseLife(state, 'ghost') : state;
}

function moveGhost(state: MazeState): MazeState {
  const dir = nextStepToward(state.maze, state.ghost, state.player);
  return caught(dir ? { ...state, ghost: step(state.ghost, dir) } : state);
}

/** Người chơi tới một góc: chấm đáp án ở góc đó. */
function reachCorner(state: MazeState, corner: number): MazeState {
  const q = currentMaze(state);
  const correct = corner === q.answerCorner;
  const given = q.options[corner]!;
  const s = arcadeAnswer(
    state,
    { item: q.item, correct, expected: q.th, ...(correct ? {} : { given }) },
    q.th,
    (combo) => POINTS * combo,
  );
  if (!correct) return loseLife(s, 'wrong');
  return {
    ...s,
    index: s.index + 1,
    player: PLAYER_START,
    ghost: GHOST_START,
    ghostClock: 0,
    pendingSteps: 0,
    lifeDelta: 0,
    lostBy: null,
  };
}

/** Bật/tắt chế độ từng bước (reduced-motion) — UI gọi sau `start`. */
export function setMazeStepMode(state: MazeState, stepMode: boolean): MazeState {
  return { ...state, stepMode, ghostClock: 0, pendingSteps: 0 };
}

export const maze: ArcadeGame<MazeRound, MazeInput, MazeState> = {
  id: 'maze',

  availability: (source) =>
    availability(
      'words',
      MAZE_MIN_WORDS,
      new Set(promptItems(source, true, false).map((i) => i.th)).size,
    ),

  generateRound(source, seed) {
    assertAvailable(this.id, this.availability(source));
    const rng = createRng(seed);
    const items = promptItems(source, true, false);
    return {
      maze: generateMaze(rng),
      questions: cycle(rng, items, QUESTIONS).map((target) => {
        const wrong = rng.shuffle(wrongOptions(items, target)).slice(0, MAZE_CORNERS.length - 1);
        const options = rng.shuffle([target.th, ...wrong]);
        return { ...target, options, answerCorner: options.indexOf(target.th) };
      }),
    };
  },

  start: (round) => ({
    ...arcadeInitial(),
    maze: round.maze,
    questions: round.questions,
    index: 0,
    player: PLAYER_START,
    ghost: GHOST_START,
    ghostClock: 0,
    pendingSteps: 0,
    stepMode: false,
    lives: START_LIVES,
    lifeDelta: 0,
    lostBy: null,
  }),

  tick(state, dtMs, input) {
    if (state.status === 'finished') return state;
    let s = state;
    if (input && canMove(s.maze, s.player, input.dir)) {
      s = { ...s, player: step(s.player, input.dir), lifeDelta: 0, lostBy: null };
      const corner = MAZE_CORNERS.findIndex((c) => same(c, s.player));
      const q = currentMaze(s);
      if (corner >= 0 && corner < q.options.length) s = reachCorner(s, corner);
      else {
        s = caught(s);
        if (s.stepMode && s.status === 'playing' && s.lifeDelta === 0) {
          const pending = s.pendingSteps + 1;
          s =
            pending >= STEP_MODE_RATIO
              ? moveGhost({ ...s, pendingSteps: 0 })
              : { ...s, pendingSteps: pending };
        }
      }
    }
    if (s.stepMode) return { ...s, elapsedMs: s.elapsedMs + Math.max(0, dtMs) };
    return advance(s, dtMs, (next, ms) => {
      const clock = next.ghostClock + ms;
      if (clock < ghostStepMs(next.correct)) return { ...next, ghostClock: clock };
      return moveGhost({ ...next, ghostClock: 0 });
    });
  },

  summary: (state) => arcadeSummary('maze', state),
};
