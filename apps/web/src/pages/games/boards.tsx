import {
  classifierRush,
  currentQuestion,
  MATCH_MISMATCH_MS,
  matchPairs,
  questionEndsAt,
  rapidQuestionEndsAt,
  SENTENCE_RUSH_MS,
  sentenceRush,
  trueFalse,
  type GameSource,
  type GameState,
} from '@nom/core';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ChoiceButton,
  CountIn,
  FeedbackBar,
  langOf,
  TimeBar,
  TokenBank,
  UrgencyCard,
  useFeedbackPause,
  useKeyShortcut,
  useSpeakOnCue,
  type ChoiceStatus,
} from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { useGameRun, type GameRun } from './useGameRun';

/** Mỗi bảng chơi báo lên màn chơi: lượt (để vẽ thanh trên) và khi kết thúc. */
export interface BoardProps {
  source: GameSource;
  seed: number;
  /** Khung màn chơi (thanh trên, kết quả) quanh phần thân của bảng. */
  children: (run: RunView, body: ReactNode, extra: TopBarExtra) => ReactNode;
}

/** Phần của lượt chơi mà khung màn chơi cần (mọi trò dùng chung). */
export type RunView = Pick<GameRun<unknown, GameState>, 'state' | 'clock' | 'sound' | 'speech'>;

export interface TopBarExtra {
  lives?: { count: number; max: number; delta?: -1 | 0 | 1 };
  /** Ghép cặp: thanh trên hiện số lượt lật thay điểm. */
  scoreLabel?: string;
  scoreValue?: number;
  /** Trò arcade: đồng hồ đếm ngược riêng (ms). */
  timeMs?: number;
  /** Dòng trạng thái cạnh tên trò ("Từng bước", "Tốc độ ×1,3"). */
  status?: string;
}

function Feedback({ state }: { state: GameState }) {
  const fb = state.feedback;
  return (
    <div className="min-h-14">
      {fb && (
        <FeedbackBar correct={fb.correct} answer={fb.correct ? undefined : fb.expected}>
          {fb.points > 0 && `+${fb.points}`}
        </FeedbackBar>
      )}
    </div>
  );
}

const START_LIVES = 3;
const COLS = 4;

/** F-01 Ghép cặp: lưới 4 × 3, mũi tên + Space để lật. */
export function MatchBoard({ source, seed, children }: BoardProps) {
  const run = useGameRun(matchPairs, source, seed);
  const { state, answer, advance, started, start } = run;
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(advance, MATCH_MISMATCH_MS);
    return () => window.clearTimeout(id);
  }, [state.status, state.total, advance]);

  const move = (key: string) =>
    setCursor((c) => {
      const n = state.cards.length;
      if (key === 'ArrowLeft') return (c + n - 1) % n;
      if (key === 'ArrowRight') return (c + 1) % n;
      if (key === 'ArrowUp') return (c + n - COLS) % n;
      return (c + COLS) % n;
    });
  useKeyShortcut(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], (e) => move(e.key), started);
  useKeyShortcut(' ', () => answer(cursor), started && state.status === 'playing');

  const pairsLeft = state.cards.length / 2 - state.matched.length;
  const body = !started ? (
    <CountIn onDone={start} />
  ) : (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">{t('games.matchLeft', { n: pairsLeft })}</p>
      <div role="group" aria-label={t('games.name.match')} className="grid grid-cols-4 gap-4">
        {state.cards.map((card, i) => {
          const matched = state.matched.includes(card.wordId);
          const open = matched || state.open.includes(i);
          const wrong = state.status === 'feedback' && state.open.includes(i);
          return (
            <button
              key={i}
              type="button"
              data-testid="match-card"
              data-open={open}
              data-matched={matched}
              tabIndex={cursor === i ? 0 : -1}
              aria-label={open ? card.text : t('games.cardHidden', { n: i + 1 })}
              disabled={matched}
              onClick={() => {
                setCursor(i);
                answer(i);
              }}
              className={cn(
                'flex h-24 w-40 items-center justify-center rounded-xl border-2 px-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-[background-color,border-color,opacity,transform] motion-safe:duration-200',
                !open &&
                  'border-transparent bg-game-subtle hover:border-game enabled:hover:-translate-y-0.5',
                open && !matched && 'border-game bg-background motion-safe:animate-pop',
                matched && 'border-positive/40 bg-positive-subtle opacity-60',
                wrong && 'border-destructive bg-destructive-subtle motion-safe:animate-shake',
                cursor === i && 'ring-2 ring-game ring-offset-2',
              )}
            >
              {open && (
                <span
                  lang={langOf(card.text)}
                  className={card.face === 'th' ? 'text-th-md' : 'text-lg font-medium'}
                >
                  {card.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t('games.matchHint')}</p>
    </div>
  );
  return children(run, body, {
    scoreLabel: t('games.flips'),
    scoreValue: state.total,
  });
}

/** F-02' Đúng hay sai? — 3 tim, nền ngả đỏ dần, tự đọc chữ Thái. */
export function TrueFalseBoard({ source, seed, children }: BoardProps) {
  const run = useGameRun(trueFalse, source, seed);
  const { state, clock, answer, advance, started, start, speech } = run;
  const [said, setSaid] = useState<boolean | null>(null);
  const q = currentQuestion(state);
  const fb = state.feedback;
  const used = Math.max(0, clock.elapsedMs - state.questionStartedAt);
  const left = state.status === 'playing' ? rapidQuestionEndsAt(state) - clock.elapsedMs : 0;

  useSpeakOnCue(
    started && state.status === 'playing' ? q.th : null,
    `${started}-${state.index}`,
    speech,
  );
  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(advance, fb?.correct ? 450 : 900);
    return () => window.clearTimeout(id);
  }, [state.status, state.index, fb?.correct, advance]);

  const choose = (value: boolean) => {
    setSaid(value);
    answer(value);
  };
  const statusOf = (value: boolean): ChoiceStatus =>
    fb && said === value ? (fb.correct ? 'correct' : 'wrong') : 'idle';

  const body = !started ? (
    <CountIn onDone={start} />
  ) : (
    <div className="flex flex-col gap-6">
      <TimeBar totalMs={q.timeMs} remainingMs={left} />
      <UrgencyCard
        key={state.index}
        elapsed={used / q.timeMs}
        feedback={fb ? (fb.correct ? 'correct' : 'wrong') : null}
      >
        <p lang="th" data-testid="tf-th" className="text-th-lg">
          {q.th}
        </p>
        <p
          data-testid="tf-shown"
          className="rounded-full bg-background px-4 py-1 text-xl font-medium shadow-sm"
        >
          {q.shown}
        </p>
      </UrgencyCard>
      <div className="grid grid-cols-2 gap-4">
        <ChoiceButton
          shortcut="F"
          extraKeys={['ArrowLeft']}
          status={statusOf(false)}
          disabled={state.status !== 'playing'}
          data-testid="tf-false"
          onSelect={() => choose(false)}
        >
          ← {t('play.wrong')}
        </ChoiceButton>
        <ChoiceButton
          shortcut="J"
          extraKeys={['ArrowRight']}
          status={statusOf(true)}
          disabled={state.status !== 'playing'}
          data-testid="tf-true"
          onSelect={() => choose(true)}
        >
          {t('play.correct')} →
        </ChoiceButton>
      </div>
      <Feedback state={state} />
    </div>
  );
  return children(run, body, {
    lives: { count: state.lives, max: START_LIVES, delta: state.lifeDelta },
  });
}

/** F-03' Xếp câu tốc độ — 5 câu × 20 s; sau mỗi câu đọc câu đúng (góp ý owner). */
export function SentenceRushBoard({ source, seed, children }: BoardProps) {
  const run = useGameRun(sentenceRush, source, seed);
  const { state, clock, answer, advance, started, start, speech } = run;
  const [picked, setPicked] = useState<number[]>([]);
  const q = state.questions[Math.min(state.index, state.questions.length - 1)]!;

  useFeedbackPause({
    active: state.status === 'feedback',
    speakText: q.th,
    speech,
    minMs: 1500,
    onDone: () => {
      setPicked([]);
      advance();
    },
  });

  const submit = () => answer(picked.map((i) => q.bank[i]!));
  const left = questionEndsAt(state) - clock.elapsedMs;

  const body = !started ? (
    <CountIn onDone={start} />
  ) : (
    <div className="flex flex-col gap-6">
      <TimeBar totalMs={SENTENCE_RUSH_MS} remainingMs={state.status === 'playing' ? left : 0} />
      <p className="text-sm text-muted-foreground">
        {t('games.sentenceOf', { n: state.index + 1, total: state.questions.length })}
      </p>
      <p
        key={state.index}
        className="rounded-xl bg-game-subtle px-5 py-4 text-xl font-medium motion-safe:animate-enter"
      >
        {q.vi}
      </p>
      <TokenBank
        key={`bank-${state.index}`}
        tokens={q.bank}
        value={picked}
        onChange={setPicked}
        onSubmit={submit}
        disabled={state.status !== 'playing'}
      />
      <Button
        className="self-start bg-game text-game-fg hover:bg-game/90"
        disabled={state.status !== 'playing' || picked.length === 0}
        onClick={submit}
      >
        {t('games.check')} ↵
      </Button>
      <Feedback state={state} />
    </div>
  );
  return children(run, body, {});
}

/** F-04' Đoán loại từ — 3 tim, 5 s/từ, phím `1`–`4`. */
export function ClassifierBoard({ source, seed, children }: BoardProps) {
  const run = useGameRun(classifierRush, source, seed);
  const { state, clock, answer, advance, started, start, speech } = run;
  const [chosen, setChosen] = useState<string | null>(null);
  const q = currentQuestion(state);
  const fb = state.feedback;
  const used = Math.max(0, clock.elapsedMs - state.questionStartedAt);
  const left = state.status === 'playing' ? rapidQuestionEndsAt(state) - clock.elapsedMs : 0;

  useSpeakOnCue(
    started && state.status === 'playing' ? q.th : null,
    `${started}-${state.index}`,
    speech,
  );
  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(advance, fb?.correct ? 450 : 900);
    return () => window.clearTimeout(id);
  }, [state.status, state.index, fb?.correct, advance]);

  const statusOf = (option: string): ChoiceStatus => {
    if (!fb) return 'idle';
    if (option === q.expected) return 'correct';
    return option === chosen ? 'wrong' : 'idle';
  };

  const body = !started ? (
    <CountIn onDone={start} />
  ) : (
    <div className="flex flex-col gap-6">
      <TimeBar totalMs={q.timeMs} remainingMs={left} />
      <UrgencyCard
        key={state.index}
        elapsed={used / q.timeMs}
        feedback={fb ? (fb.correct ? 'correct' : 'wrong') : null}
      >
        <p className="text-sm text-muted-foreground">{t('games.classifierPrompt')}</p>
        <p lang="th" data-testid="cr-th" className="text-th-lg">
          {q.th}
        </p>
        <p className="text-lg text-muted-foreground">{q.meaning}</p>
      </UrgencyCard>
      <div data-testid="cr-options" className="grid grid-cols-4 gap-3">
        {q.options.map((option, i) => (
          <ChoiceButton
            key={`${state.index}-${option}`}
            shortcut={String(i + 1)}
            status={statusOf(option)}
            disabled={state.status !== 'playing'}
            onSelect={() => {
              setChosen(option);
              answer(option);
            }}
          >
            <span lang="th" className="text-th-md">
              {option}
            </span>
          </ChoiceButton>
        ))}
      </div>
      <Feedback state={state} />
    </div>
  );
  return children(run, body, {
    lives: { count: state.lives, max: START_LIVES, delta: state.lifeDelta },
  });
}
