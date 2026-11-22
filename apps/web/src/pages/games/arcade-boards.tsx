import {
  activeMoles,
  airplane,
  BONUS_QUESTIONS,
  cloudSpeed,
  currentFlight,
  currentMaze,
  currentShow,
  currentWhack,
  DOOR,
  gameshow,
  LOOP_STEP_MS,
  MAZE_CORNERS,
  maze,
  PLANE_X,
  setMazeStepMode,
  showTimeLeft,
  whackAMole,
  WHACK_DURATION_MS,
  type ArcadeGameId,
  type ArcadeState,
  type Direction,
  type GameSource,
  type GameSummary,
  type Lifeline,
} from '@nom/core';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, X } from 'lucide-react';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Emoji } from '@/components/fun';
import {
  ChoiceButton,
  CountIn,
  FeedbackBar,
  langOf,
  TimeBar,
  useKeyShortcut,
  useSpeakOnCue,
  type AutoSpeech,
  type ChoiceStatus,
  type FeedbackSound,
  type GameLoop,
  type GameTheme,
} from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t, type MessageKey } from '@/i18n';
import { useBreakpoint, useTouchControls } from '@/lib/useBreakpoint';
import { cn } from '@/lib/utils';
import type { TopBarExtra } from './boards';
import { useArcadeRun } from './useArcadeRun';

/** Phần của lượt arcade mà khung màn chơi cần (thanh trên, tạm dừng, kết quả). */
export interface ArcadeView {
  state: ArcadeState;
  loop: GameLoop;
  sound: FeedbackSound;
  speech: AutoSpeech;
  summary: () => GameSummary<ArcadeGameId>;
  /** Dòng riêng trò ở màn kết quả (SCR-08 v2 §C). */
  detail: () => string | null;
}

export interface ArcadeBoardProps {
  source: GameSource;
  seed: number;
  theme: GameTheme;
  /** `prefers-reduced-motion` → chế độ từng bước (Máy bay, Mê cung). */
  reduced: boolean;
  children: (view: ArcadeView, body: ReactNode, extra: TopBarExtra) => ReactNode;
}

/** Nhân vật theo theme (SCR-08 v2 — emoji Noto). */
const CAST: Record<GameTheme, { mole: string; plane: string; player: string; ghost: string }> = {
  sea: { mole: '🦀', plane: '✈️', player: '🐠', ghost: '🐙' },
  space: { mole: '👽', plane: '🚀', player: '🧑‍🚀', ghost: '👾' },
  garden: { mole: '🐹', plane: '🛩️', player: '🐞', ghost: '🐝' },
};

const fmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** Panel trắng giữa cảnh nền — chữ Thái luôn nằm trên panel (SCR-08 v2 §Lưu ý chữ Thái). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl bg-surface p-5 shadow-md', className)} data-testid="game-panel">
      {children}
    </div>
  );
}

/** Dải phản hồi dưới panel: icon + chữ, `aria-live` (SCR-08 v2 §B.0). */
function FeedbackStrip({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-14" aria-live="polite">
      {children}
    </div>
  );
}

// ───────────────────────── F-15 Đập chuột ─────────────────────────

/** Hố 0–8 (trên-trái → dưới-phải) ↔ phím numpad (hàng trên 7 8 9) và phím chữ thay thế. */
const HOLE_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'] as const;
const HOLE_ALT_KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'] as const;

export function WhackBoard({ source, seed, theme, children }: ArcadeBoardProps) {
  const run = useArcadeRun(whackAMole, source, seed);
  const { state, started, start, input } = run;
  const touch = useTouchControls();
  const q = currentWhack(state);
  const moles = activeMoles(state);
  const fb = state.feedback;
  useKeyShortcut(
    [...HOLE_KEYS, ...HOLE_ALT_KEYS],
    (e) => {
      const key = e.key.toLowerCase();
      const hole = Math.max(
        HOLE_KEYS.indexOf(key as (typeof HOLE_KEYS)[number]),
        HOLE_ALT_KEYS.indexOf(key as (typeof HOLE_ALT_KEYS)[number]),
      );
      if (hole >= 0) input({ hit: hole });
    },
    started,
  );

  const remaining = Math.max(0, WHACK_DURATION_MS - state.elapsedMs);
  const body = !started ? (
    <CountIn onDone={start} hint={touch ? t('games.whackTouchHint') : t('games.whackHint')} />
  ) : (
    <div className="flex flex-col items-center gap-5">
      <Panel className="flex w-full max-w-[560px] flex-col gap-3">
        <p className="flex flex-wrap items-baseline gap-3">
          <span className="text-muted-foreground">{t('games.whackPrompt')}</span>
          <span data-testid="whack-prompt" className="text-[28px] font-semibold">
            {q.vi}
          </span>
        </p>
        <TimeBar totalMs={WHACK_DURATION_MS} remainingMs={remaining} />
      </Panel>
      <div
        role="group"
        aria-label={t('games.name.whack-a-mole')}
        className="grid w-full max-w-[552px] grid-cols-3 gap-2 tablet:gap-4 lg:w-auto lg:max-w-none lg:gap-6"
      >
        {HOLE_KEYS.map((key, hole) => {
          const mole = moles.find((m) => m.hole === hole);
          return (
            <button
              key={hole}
              type="button"
              data-testid={`whack-hole-${hole}`}
              data-mole={mole ? mole.th : undefined}
              aria-keyshortcuts={key}
              onClick={() => input({ hit: hole })}
              className="relative flex h-[112px] w-full min-w-[88px] flex-col items-center justify-end rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring lg:w-[168px]"
            >
              {mole && (
                <span
                  key={mole.key}
                  className="z-10 flex flex-col items-center motion-safe:animate-enter"
                >
                  <span
                    lang="th"
                    className={cn(
                      'rounded-lg bg-surface px-2 py-1.5 text-center font-semibold shadow-md lg:min-w-[140px] lg:px-3 lg:py-2',
                      [...mole.th].length > 8
                        ? 'text-lg tablet:text-2xl'
                        : 'text-[22px] tablet:text-[32px]',
                    )}
                  >
                    {mole.th}
                  </span>
                  <Emoji size="sm" className="-mt-1">
                    {CAST[theme].mole}
                  </Emoji>
                </span>
              )}
              <span
                aria-hidden
                className="absolute bottom-0 h-8 w-full rounded-[50%] bg-scene-ground shadow-inner"
              />
              <kbd className="absolute bottom-1 left-2 z-10 rounded bg-surface/90 px-1.5 font-sans text-xs font-semibold">
                {key}
                <span className="ml-1 text-muted-foreground uppercase">{HOLE_ALT_KEYS[hole]}</span>
              </kbd>
            </button>
          );
        })}
      </div>
      <FeedbackStrip>
        {fb && (
          <FeedbackBar correct={fb.correct} answer={fb.correct ? undefined : fb.expected}>
            {fb.points > 0 && `+${fb.points}`}
          </FeedbackBar>
        )}
      </FeedbackStrip>
    </div>
  );
  return children(
    {
      ...run,
      summary: () => whackAMole.summary(state),
      detail: () => t('games.detail.whack-a-mole', { n: state.total - state.correct }),
    },
    body,
    { timeMs: remaining },
  );
}

// ───────────────────────── F-16 Đố vui truyền hình ─────────────────────────

const LETTERS = ['A', 'B', 'C', 'D'] as const;

export function GameshowBoard({ source, seed, children }: ArcadeBoardProps) {
  const run = useArcadeRun(gameshow, source, seed);
  const { state, started, start, input } = run;
  const q = currentShow(state);
  const fb = state.feedback;
  const answering = state.status === 'playing';
  const left = showTimeLeft(state);
  const last = state.index === state.questions.length - 1;

  useSpeakOnCue(
    started && answering ? (q.prompt.th ?? null) : null,
    `${started}-${state.index}`,
    run.speech,
  );
  const choose = (i: number) => {
    const option = q.options[i];
    if (option !== undefined && !state.removed.includes(option)) input({ answer: option });
  };
  useKeyShortcut(
    [...LETTERS.map((l) => l.toLowerCase()), '1', '2', '3', '4'],
    (e) => {
      const k = e.key.toLowerCase();
      choose(k >= '1' && k <= '4' ? Number(k) - 1 : 'abcd'.indexOf(k));
    },
    started && answering,
  );
  const lifeline = (l: Lifeline) => input({ lifeline: l });
  useKeyShortcut('f', () => lifeline('fifty'), started && answering);
  useKeyShortcut('t', () => lifeline('time'), started && answering);
  useKeyShortcut(['Enter', ' '], () => input({ next: true }), started && !answering);

  const statusOf = (option: string): ChoiceStatus => {
    if (answering || !fb) return 'idle';
    if (option === q.answer) return 'correct';
    return option === fb.given ? 'wrong' : 'idle';
  };
  const bonusFrom = state.questions.length - BONUS_QUESTIONS;

  const body = !started ? (
    <CountIn onDone={start} hint={t('games.showHint')} />
  ) : (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[140px_1fr_168px] lg:gap-5">
      {/* Phone / tablet: ẩn thang câu (đã có "Câu i/n"), trợ giúp thành hàng dưới câu hỏi. */}
      <Panel className="p-3 max-lg:hidden">
        <h2 className="sr-only">{t('games.ladder')}</h2>
        <ol data-testid="show-ladder" className="flex flex-col-reverse gap-1 text-sm tabular-nums">
          {state.questions.map((step, i) => {
            const done = i < state.index || (i === state.index && !answering);
            const past = done
              ? !state.mistakes.some((m) => m.itemId === step.item.itemId)
              : undefined;
            return (
              <li
                key={i}
                aria-current={i === state.index ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-0.5',
                  i === state.index && 'bg-game font-semibold text-game-fg',
                )}
              >
                <span className="w-5 text-right">{i + 1}</span>
                {step.bonus && <span aria-hidden>★ ×2</span>}
                {past === true && (
                  <Check className="ml-auto size-3.5 text-positive" aria-label="✓" />
                )}
                {past === false && (
                  <X className="ml-auto size-3.5 text-destructive" aria-label="✕" />
                )}
              </li>
            );
          })}
        </ol>
      </Panel>
      <div className="flex flex-col gap-4">
        {q.bonus && state.index === bonusFrom && answering && (
          <p
            data-testid="show-bonus"
            className="rounded-xl bg-highlight px-4 py-2 text-center font-bold text-foreground motion-safe:animate-fb-complete"
          >
            {t('games.bonusRound')}
          </p>
        )}
        <Panel className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('games.questionOf', { i: state.index + 1, n: state.questions.length })} ·{' '}
              {t(`games.showType.${q.type}` as MessageKey)}
            </p>
            <span
              role="timer"
              data-testid="show-timer"
              aria-label={t('play.timeLeft')}
              className={cn(
                'flex size-16 items-center justify-center rounded-full border-4 text-xl font-bold tabular-nums',
                left < 5000 && answering
                  ? 'border-destructive text-destructive motion-safe:animate-urgent'
                  : 'border-game text-game',
              )}
            >
              {Math.ceil(left / 1000)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center" data-testid="show-prompt">
            {q.prompt.th && (
              <p
                lang="th"
                className={cn(q.type === 'E-05' ? 'text-th-md' : 'text-[44px] tablet:text-[56px]')}
              >
                {q.prompt.th}
              </p>
            )}
            {q.prompt.vi && (
              <p className="text-[24px] font-medium tablet:text-[28px]">{q.prompt.vi}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((option, i) => {
              const removed = state.removed.includes(option);
              return (
                <ChoiceButton
                  key={option}
                  shortcut={LETTERS[i]}
                  status={statusOf(option)}
                  disabled={!answering || removed}
                  aria-disabled={removed || undefined}
                  data-testid={`show-option-${i}`}
                  data-removed={removed}
                  onSelect={() => choose(i)}
                  className={cn('min-h-[72px]', removed && 'line-through opacity-40')}
                >
                  <span
                    lang={langOf(option)}
                    className={q.optionsLang === 'th' ? 'text-th-sm' : undefined}
                  >
                    {option}
                  </span>
                </ChoiceButton>
              );
            })}
          </div>
        </Panel>
        <FeedbackStrip>
          {fb && !answering && (
            <div className="flex items-center gap-3">
              <FeedbackBar
                className="flex-1"
                correct={fb.correct}
                answer={fb.correct ? undefined : fb.expected}
              >
                {fb.points > 0 ? `+${fb.points}` : fb.given === undefined && t('games.timeUp')}
              </FeedbackBar>
              <Button
                autoFocus
                data-testid="show-next"
                className="bg-game text-game-fg hover:bg-game/90"
                onClick={() => input({ next: true })}
              >
                {last ? t('games.seeResult') : t('games.next')}
                <kbd aria-hidden className="rounded bg-game-fg/20 px-1.5 font-sans text-xs">
                  ↵
                </kbd>
              </Button>
            </div>
          )}
        </FeedbackStrip>
      </div>
      <Panel className="flex flex-col gap-2 p-3 max-lg:flex-row max-lg:flex-wrap max-lg:items-center">
        <h2 className="text-sm font-semibold">{t('games.lifelines')}</h2>
        {(
          [
            ['fifty', 'F', t('games.fifty')],
            ['time', 'T', t('games.extraTime')],
          ] as const
        ).map(([l, key, label]) => {
          const used = state.used.includes(l);
          return (
            <Button
              key={l}
              variant="outline"
              data-testid={`show-lifeline-${l}`}
              disabled={used || !answering}
              aria-keyshortcuts={key}
              onClick={() => lifeline(l)}
              className={cn('justify-between max-lg:min-h-11', used && 'line-through')}
            >
              {label}
              <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
                {used ? t('games.used') : key}
              </kbd>
            </Button>
          );
        })}
      </Panel>
    </div>
  );
  return children(
    {
      ...run,
      summary: () => gameshow.summary(state),
      detail: () =>
        t('games.detail.gameshow', {
          n: state.used.length
            ? state.used
                .map((l) => (l === 'fifty' ? t('games.fifty') : t('games.extraTime')))
                .join(', ')
            : t('games.lifelinesNone'),
        }),
    },
    body,
    {},
  );
}

// ───────────────────────── F-17 Máy bay ─────────────────────────

/** Bề rộng mây (px) — SCR-08 v2 §B.3; phone nhỏ hơn để kịp lái (SCR-00 v2 §5). */
const CLOUD_W = 180;
const CLOUD_W_PHONE = 120;

export function AirplaneBoard({ source, seed, theme, reduced, children }: ArcadeBoardProps) {
  const run = useArcadeRun(airplane, source, seed, { manual: reduced });
  const { state, started, start, input, advanceBy } = run;
  const q = currentFlight(state);
  const fb = state.feedback;
  const lanes = q.clouds.length;
  const touch = useTouchControls();
  const phone = useBreakpoint() === 'phone';
  const cloudW = phone ? CLOUD_W_PHONE : CLOUD_W;
  // Chạm nửa trên / dưới bầu trời để lái (chỉ cảm ứng — chuột trên desktop giữ như SCR-08).
  const steer = (e: PointerEvent<HTMLDivElement>) => {
    if (!started || e.pointerType === 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    input({ move: e.clientY - box.top < box.height / 2 ? -1 : 1 });
  };
  useKeyShortcut(['ArrowUp', 'w'], () => input({ move: -1 }), started);
  useKeyShortcut(['ArrowDown', 's'], () => input({ move: 1 }), started);
  // Từng bước: mây đứng yên, "Bay" cho thời gian trôi đủ để mây chạm máy bay.
  const fly = () =>
    advanceBy(((state.cloudX - PLANE_X) / cloudSpeed(state.correct)) * 1000 + LOOP_STEP_MS);
  useKeyShortcut(['ArrowRight', 'Enter'], fly, started && reduced);

  const body = !started ? (
    <CountIn
      onDone={start}
      hint={
        reduced
          ? t('games.planeStepHint')
          : touch
            ? t('games.planeTouchHint')
            : t('games.planeHint')
      }
    />
  ) : (
    <div className="flex flex-col items-center gap-4">
      <Panel className="flex flex-wrap items-baseline gap-x-3 py-3">
        <span className="text-muted-foreground">{t('games.planePrompt')}</span>
        <span data-testid="plane-prompt" className="text-[24px] font-semibold tablet:text-[28px]">
          {q.vi}
        </span>
      </Panel>
      <div
        data-testid="plane-sky"
        onPointerDown={steer}
        className="relative h-[min(420px,calc(100dvh-300px))] min-h-[300px] w-full max-w-[1040px] overflow-hidden rounded-xl select-none lg:h-[420px]"
      >
        {q.clouds.map((cloud, lane) => (
          <div
            key={lane}
            data-testid={`plane-lane-${lane}`}
            className="absolute inset-x-0 border-b border-hud/20 last:border-b-0"
            style={{ top: `${(lane / lanes) * 100}%`, height: `${100 / lanes}%` }}
          >
            <span
              data-testid={`plane-cloud-${lane}`}
              lang="th"
              className="absolute top-1/2 flex min-h-14 -translate-y-1/2 items-center justify-center rounded-[40px] bg-surface px-3 py-1.5 text-center text-[22px] leading-snug shadow-md tablet:min-h-20 tablet:px-4 tablet:py-2 tablet:text-[28px]"
              // cloudX = 1 → mây sát mép phải (vẫn thấy); chạm máy bay khi tới `PLANE_X`.
              style={{
                width: cloudW,
                left: `calc(${state.cloudX * 100}% - ${state.cloudX * cloudW}px)`,
              }}
            >
              {cloud}
            </span>
          </div>
        ))}
        <span
          data-testid="plane"
          data-lane={state.lane}
          aria-hidden
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 motion-safe:transition-[top] motion-safe:duration-[120ms]',
            state.lifeDelta === -1 && fb && !fb.correct && 'motion-safe:animate-fb-wrong',
          )}
          style={{ left: `${PLANE_X * 100}%`, top: `${((state.lane + 0.5) / lanes) * 100}%` }}
        >
          <Emoji size="lg">{CAST[theme].plane}</Emoji>
        </span>
      </div>
      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <p className="text-sm text-hud">
          {reduced
            ? t('games.planeStepHint')
            : touch
              ? t('games.planeTouchHint')
              : t('games.planeHint')}
        </p>
        {touch && (
          <div role="group" aria-label={t('play.controls')} className="ml-auto flex gap-3">
            <TouchButton testId="plane-up" label={t('play.up')} onPress={() => input({ move: -1 })}>
              <ArrowUp />
            </TouchButton>
            <TouchButton
              testId="plane-down"
              label={t('play.down')}
              onPress={() => input({ move: 1 })}
            >
              <ArrowDown />
            </TouchButton>
          </div>
        )}
        {reduced && (
          <Button data-testid="plane-fly" onClick={fly} className="bg-game text-game-fg">
            {t('games.fly')}
            <kbd aria-hidden className="rounded bg-game-fg/20 px-1.5 font-sans text-xs">
              →
            </kbd>
          </Button>
        )}
      </div>
      <FeedbackStrip>
        {fb && (
          <FeedbackBar correct={fb.correct} answer={fb.correct ? undefined : fb.expected}>
            {fb.points > 0 && `+${fb.points}`}
          </FeedbackBar>
        )}
      </FeedbackStrip>
    </div>
  );
  return children(
    {
      ...run,
      summary: () => airplane.summary(state),
      detail: () => t('games.detail.airplane', { n: state.total }),
    },
    body,
    {
      lives: { count: state.lives, max: 3, delta: state.lifeDelta },
      status: reduced
        ? t('play.stepMode')
        : t('games.speed', { n: fmt.format(cloudSpeed(state.correct) / cloudSpeed(0)) }),
    },
  );
}

// ───────────────────────── F-18 Mê cung ─────────────────────────

const MAZE_STEP_KEY = 'mazeStepMode';
const CELL = 56;
/** Ô mê cung trên phone: 9 ô × 34px + viền vừa iPhone SE 375px (SCR-00 v2 §5). */
const CELL_PHONE = 34;
/** Vuốt tối thiểu (px) để đi một bước. */
const SWIPE_MIN = 30;
const DIR_KEYS: Record<string, Direction> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
};
const CORNER_LABEL = ['A', 'B', 'C', 'D'] as const;

export function MazeBoard({ source, seed, theme, reduced, children }: ArcadeBoardProps) {
  const repos = useRepositories();
  const saved = useRepositoryQuery((r) => r.settings.get(MAZE_STEP_KEY, false), []);
  const run = useArcadeRun(maze, source, seed);
  const { state, started, start, input, update } = run;
  const q = currentMaze(state);
  const fb = state.feedback;
  const [synced, setSynced] = useState(false);

  // Chế độ từng bước: tự bật khi giảm chuyển động, hoặc theo lựa chọn đã nhớ (một lần, khi cài
  // đặt tải xong — cập nhật state trong render, mẫu React chính thức).
  if (saved !== undefined && !synced) {
    setSynced(true);
    if (reduced || saved) update((s) => setMazeStepMode(s, true));
  }
  const toggleStep = () => {
    const next = !state.stepMode;
    update((s) => setMazeStepMode(s, next));
    void repos?.settings.set(MAZE_STEP_KEY, next);
  };
  useKeyShortcut('b', toggleStep, started);
  useKeyShortcut(
    Object.keys(DIR_KEYS),
    (e) => input({ dir: DIR_KEYS[e.key.toLowerCase()]! }),
    started,
  );

  const touch = useTouchControls();
  const breakpoint = useBreakpoint();
  const cell = breakpoint === 'phone' ? CELL_PHONE : CELL;
  // Dưới desktop: đáp án nằm trên / dưới mê cung thay vì hai bên.
  const stacked = breakpoint !== 'desktop';
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const onSwipeStart = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') swipeFrom.current = { x: e.clientX, y: e.clientY };
  };
  const onSwipeEnd = (e: PointerEvent<HTMLDivElement>) => {
    const from = swipeFrom.current;
    swipeFrom.current = null;
    if (!from || !started) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    input({
      dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
    });
  };

  const cast = CAST[theme];
  const { cols, rows, cells } = state.maze;

  const answerCard = (corner: number) => (
    <div
      data-testid={`maze-answer-${corner}`}
      className={cn(
        'flex h-14 items-center gap-2 rounded-xl border-2 bg-surface px-3 shadow-sm',
        stacked ? 'min-w-0 flex-1' : 'w-40',
      )}
    >
      <span className="rounded bg-game px-1.5 text-sm font-bold text-game-fg">
        {CORNER_LABEL[corner]}
      </span>
      <span lang="th" className="text-[28px] leading-none">
        {q.options[corner]}
      </span>
    </div>
  );

  const body = !started ? (
    <CountIn onDone={start} hint={touch ? t('games.mazeTouchHint') : t('games.mazeHint')} />
  ) : (
    <div className="flex flex-col items-center gap-4">
      <Panel className="flex flex-wrap items-baseline gap-x-3 py-3">
        <span className="text-muted-foreground">{t('games.mazePrompt')}</span>
        <span data-testid="maze-prompt" className="text-[24px] font-semibold tablet:text-[28px]">
          {q.vi}
        </span>
      </Panel>
      <div
        className={cn(
          'grid items-center gap-3',
          stacked ? 'w-full max-w-[560px] grid-cols-1' : 'grid-cols-[auto_auto_auto] gap-4',
        )}
      >
        <div className={cn('flex', stacked ? 'gap-3' : 'h-full flex-col justify-between')}>
          {answerCard(0)}
          {answerCard(stacked ? 1 : 2)}
        </div>
        <Panel className="justify-self-center p-3">
          <div
            onPointerDown={onSwipeStart}
            onPointerUp={onSwipeEnd}
            onPointerCancel={() => (swipeFrom.current = null)}
            role="img"
            aria-label={t('games.name.maze')}
            data-testid="maze-grid"
            data-player={`${state.player.x},${state.player.y}`}
            data-ghost={`${state.ghost.x},${state.ghost.y}`}
            className="relative grid touch-none select-none"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
              gridTemplateRows: `repeat(${rows}, ${cell}px)`,
            }}
          >
            {cells.map((doors, i) => {
              const x = i % cols;
              const y = Math.floor(i / cols);
              const corner = MAZE_CORNERS.findIndex((c) => c.x === x && c.y === y);
              const wall = (bit: number) => (doors & bit ? 'transparent' : undefined);
              return (
                <span
                  key={i}
                  className={cn(
                    'relative flex items-center justify-center border-game-theme',
                    cell < CELL ? 'border-[3px]' : 'border-4',
                  )}
                  style={{
                    borderTopColor: wall(DOOR.N),
                    borderRightColor: wall(DOOR.E),
                    borderBottomColor: wall(DOOR.S),
                    borderLeftColor: wall(DOOR.W),
                  }}
                >
                  {corner >= 0 && (
                    <span className="text-sm font-bold text-game">{CORNER_LABEL[corner]}</span>
                  )}
                </span>
              );
            })}
            <Token cell={state.player} size={cell} testId="maze-player">
              {cast.player}
            </Token>
            <Token cell={state.ghost} size={cell} testId="maze-ghost">
              {cast.ghost}
            </Token>
          </div>
        </Panel>
        <div className={cn('flex', stacked ? 'gap-3' : 'h-full flex-col justify-between')}>
          {answerCard(stacked ? 2 : 1)}
          {answerCard(3)}
        </div>
      </div>
      {touch && (
        <div role="group" aria-label={t('play.controls')} className="grid grid-cols-3 gap-2">
          <TouchButton
            testId="maze-up"
            label={t('play.up')}
            onPress={() => input({ dir: 'up' })}
            className="col-start-2"
          >
            <ArrowUp />
          </TouchButton>
          <TouchButton
            testId="maze-left"
            label={t('play.left')}
            onPress={() => input({ dir: 'left' })}
            className="col-start-1"
          >
            <ArrowLeft />
          </TouchButton>
          <TouchButton
            testId="maze-down"
            label={t('play.down')}
            onPress={() => input({ dir: 'down' })}
          >
            <ArrowDown />
          </TouchButton>
          <TouchButton
            testId="maze-right"
            label={t('play.right')}
            onPress={() => input({ dir: 'right' })}
          >
            <ArrowRight />
          </TouchButton>
        </div>
      )}
      <p className="text-sm text-hud">{touch ? t('games.mazeTouchHint') : t('games.mazeHint')}</p>
      <FeedbackStrip>
        {fb && (
          <FeedbackBar
            correct={fb.correct}
            answer={fb.correct || state.lostBy === 'ghost' ? undefined : fb.expected}
          >
            {fb.correct
              ? fb.points > 0 && `+${fb.points}`
              : state.lostBy === 'ghost' && t('games.caught')}
          </FeedbackBar>
        )}
      </FeedbackStrip>
    </div>
  );
  return children(
    {
      ...run,
      summary: () => maze.summary(state),
      detail: () => t('games.detail.maze', { n: state.correct }),
    },
    body,
    {
      lives: { count: state.lives, max: 3, delta: state.lifeDelta },
      status: t('games.mazeStep', {
        state: state.stepMode ? t('games.stepOn') : t('games.stepOff'),
      }),
    },
  );
}

/** Nút điều khiển chạm lớn (≥ 56px) — Máy bay ▲▼, D-pad Mê cung (SCR-00 v2 §5). */
function TouchButton({
  testId,
  label,
  onPress,
  className,
  children,
}: {
  testId: string;
  label: string;
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  // Chạm: phản hồi ngay khi pointerdown (không chờ nhả tay) rồi bỏ qua click theo sau;
  // chuột / bàn phím / trình đọc màn hình đi qua click.
  const touched = useRef(false);
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        touched.current = true;
        onPress();
      }}
      onClick={() => {
        if (touched.current) touched.current = false;
        else onPress();
      }}
      className={cn(
        'flex size-14 items-center justify-center rounded-xl border-2 border-game bg-surface text-game shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-ring active:bg-game active:text-game-fg [&_svg]:size-7',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Token({
  cell,
  size,
  testId,
  children,
}: {
  cell: { x: number; y: number };
  size: number;
  testId: string;
  children: string;
}) {
  return (
    <span
      data-testid={testId}
      aria-hidden
      className="absolute flex items-center justify-center motion-safe:transition-[left,top] motion-safe:duration-150"
      style={{ left: cell.x * size, top: cell.y * size, width: size, height: size }}
    >
      <Emoji size="sm" className={size < CELL ? 'text-2xl' : 'text-[32px]'}>
        {children}
      </Emoji>
    </span>
  );
}
