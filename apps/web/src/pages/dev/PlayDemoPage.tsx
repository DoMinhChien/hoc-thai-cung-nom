import {
  sentenceRush,
  SENTENCE_RUSH_MS,
  questionEndsAt,
  trueFalse,
  type Game,
  type GameSource,
  type GameState,
} from '@nom/core';
import { Shuffle, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  ChoiceButton,
  CountIn,
  FeedbackBar,
  GameTopBar,
  PausedOverlay,
  TimeBar,
  TokenBank,
  useCountdown,
  useFeedbackSound,
  type Countdown,
  type FeedbackSound,
} from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Dữ liệu GIẢ LẬP để xem component tương tác (M7.5 T7.5.3) chạy với logic trò chơi trong core —
 * từ/câu lấy từ content mẫu Unit 1–2 (draft), tách thẻ tay. KHÔNG phải màn `/games` (chờ SCR-08).
 */
const SOURCE: GameSource = {
  key: 'demo',
  words: [
    ['sawatdee', 'สวัสดี', 'xin chào'],
    ['phom', 'ผม', 'tôi (nam)'],
    ['chan', 'ฉัน', 'tôi (nữ)'],
    ['khun', 'คุณ', 'bạn'],
    ['chue', 'ชื่อ', 'tên'],
    ['arai', 'อะไร', 'gì'],
    ['pho', 'พ่อ', 'bố'],
    ['mae', 'แม่', 'mẹ'],
    ['nong', 'น้อง', 'em'],
    ['mi', 'มี', 'có'],
  ].map(([id, thai, meaning]) => ({ id: id!, unitId: 'u01', thai: thai!, meanings: [meaning!] })),
  sentences: [
    ['s-u01-001', 'Xin chào (nam nói).', ['สวัสดี', 'ครับ']],
    ['s-u01-002', 'Tôi tên là Somchai.', ['ผม', 'ชื่อ', 'สมชาย']],
    ['s-u01-003', 'Bạn tên là gì?', ['คุณ', 'ชื่อ', 'อะไร']],
    ['s-u02-001', 'Nhà bạn có mấy người?', ['บ้าน', 'คุณ', 'มี', 'กี่', 'คน']],
    ['s-u02-002', 'Tôi có một anh trai.', ['ผม', 'มี', 'พี่ชาย', 'หนึ่ง', 'คน']],
  ].map(([id, vi, tokens]) => ({
    id: id as string,
    unitId: 'u01',
    vi: vi as string,
    th: (tokens as string[]).join(''),
    accepted: [(tokens as string[]).join('')],
    tokens: tokens as string[],
  })),
};

/** Chạy một lượt: đồng hồ trò chơi (tạm dừng khi rời tab) + tick hết giờ. */
function useRun<R, A, S extends GameState>(game: Game<R, A, S>, seed: number) {
  const [state, setState] = useState(() => game.start(game.generateRound(SOURCE, seed), 0));
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), []);
  const clock = useCountdown({
    durationMs: game.durationMs,
    running: started && state.status !== 'finished',
    onTick: (elapsed) => setState((s) => game.tick(s, elapsed)),
  });
  const sound = useFeedbackSound();
  const { now } = clock;

  const answer = (a: A) => {
    const next = game.answer(state, a, now());
    if (next.feedback && next !== state) sound.play(next.feedback.correct);
    setState(next);
  };
  const advance = () => setState((s) => game.next(s, now()));
  return { state, clock, sound, answer, advance, started, start };
}

function TopBar({
  run,
  title,
  onExit,
}: {
  run: { state: GameState; clock: Countdown; sound: FeedbackSound };
  title: string;
  onExit: () => void;
}) {
  const { state, clock, sound } = run;
  return (
    <>
      <GameTopBar
        title={title}
        timeMs={clock.remainingMs ?? clock.elapsedMs}
        clock={clock.remainingMs === null ? 'up' : 'down'}
        score={state.score}
        combo={state.combo}
        onExit={onExit}
        sound={
          sound.enabled === undefined
            ? undefined
            : { enabled: sound.enabled, onToggle: () => void sound.setEnabled(!sound.enabled) }
        }
      />
      {clock.paused && state.status !== 'finished' && <PausedOverlay onResume={clock.resume} />}
    </>
  );
}

function Finished({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  return (
    <div
      data-testid="demo-finished"
      className="flex flex-col items-start gap-4 rounded-xl bg-accent p-6 motion-safe:animate-enter"
    >
      <p className="text-5xl font-semibold text-primary tabular-nums motion-safe:animate-pop">
        {state.score}
      </p>
      <p className="text-lg font-semibold">
        {t('devPlay.finished', {
          score: state.score,
          correct: state.correct,
          total: state.total,
          combo: state.maxCombo,
        })}
      </p>
      {state.mistakes.length > 0 && (
        <ul className="text-sm text-muted-foreground">
          {state.mistakes.map((m, i) => (
            <li key={i}>
              <span lang="th">{m.th}</span> — {t('devPlay.mistake', { expected: m.expected })}
              {m.given ? t('devPlay.given', { given: m.given }) : ''}
            </li>
          ))}
        </ul>
      )}
      <Button onClick={onRestart}>{t('devPlay.restart')}</Button>
    </div>
  );
}

function TrueFalseDemo({ seed, onExit, onRestart }: DemoProps) {
  const run = useRun(trueFalse, seed);
  const { state, answer, advance, started, start } = run;
  const [said, setSaid] = useState<boolean | null>(null);
  const q = state.questions[state.index % state.questions.length]!;
  const fb = state.feedback;

  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(advance, fb?.correct ? 450 : 900);
    return () => window.clearTimeout(id);
  });

  const choose = (value: boolean) => {
    setSaid(value);
    answer(value);
  };
  const statusOf = (value: boolean) =>
    fb && said === value ? (fb.correct ? 'correct' : 'wrong') : 'idle';

  return (
    <div className="flex flex-col gap-6">
      <TopBar run={run} title={t('devPlay.trueFalse')} onExit={onExit} />
      {!started ? (
        <CountIn onDone={start} />
      ) : state.status === 'finished' ? (
        <Finished state={state} onRestart={onRestart} />
      ) : (
        <>
          <div
            key={state.index}
            data-testid="tf-card"
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 p-8 motion-safe:animate-enter motion-safe:transition-colors',
              !fb && 'border-transparent bg-accent/60',
              fb?.correct && 'border-positive bg-positive-subtle',
              fb &&
                !fb.correct &&
                'border-destructive bg-destructive-subtle motion-safe:animate-shake',
            )}
          >
            <p lang="th" className="text-th-xl">
              {q.th}
            </p>
            <p className="rounded-full bg-background px-4 py-1 text-xl font-medium shadow-sm">
              {q.shown}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ChoiceButton
              shortcut="F"
              extraKeys={['ArrowLeft']}
              status={statusOf(false)}
              disabled={state.status !== 'playing'}
              onSelect={() => choose(false)}
            >
              ← {t('play.wrong')}
            </ChoiceButton>
            <ChoiceButton
              shortcut="J"
              extraKeys={['ArrowRight']}
              status={statusOf(true)}
              disabled={state.status !== 'playing'}
              onSelect={() => choose(true)}
            >
              {t('play.correct')} →
            </ChoiceButton>
          </div>
          <div className="min-h-14">
            {fb && (
              <FeedbackBar correct={fb.correct} answer={fb.correct ? undefined : fb.expected}>
                {fb.points > 0 && `+${fb.points}`}
              </FeedbackBar>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SentenceRushDemo({ seed, onExit, onRestart }: DemoProps) {
  const run = useRun(sentenceRush, seed);
  const { state, clock, answer, advance, started, start } = run;
  const [picked, setPicked] = useState<number[]>([]);
  const q = state.questions[Math.min(state.index, state.questions.length - 1)]!;

  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(() => {
      setPicked([]);
      advance();
    }, 1500);
    return () => window.clearTimeout(id);
  });

  const submit = () => answer(picked.map((i) => q.bank[i]!));
  const left = questionEndsAt(state) - clock.elapsedMs;

  return (
    <div className="flex flex-col gap-6">
      <TopBar run={run} title={t('devPlay.sentenceRush')} onExit={onExit} />
      {!started ? (
        <CountIn onDone={start} />
      ) : state.status === 'finished' ? (
        <Finished state={state} onRestart={onRestart} />
      ) : (
        <>
          <TimeBar totalMs={SENTENCE_RUSH_MS} remainingMs={state.status === 'playing' ? left : 0} />
          <p className="text-sm text-muted-foreground">
            {t('devPlay.sentenceOf', { n: state.index + 1, total: state.questions.length })}
          </p>
          <p
            key={state.index}
            className="rounded-xl bg-accent/60 px-5 py-4 text-xl font-medium motion-safe:animate-enter"
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
            className="self-start"
            disabled={state.status !== 'playing' || picked.length === 0}
            onClick={submit}
          >
            {t('devPlay.check')}
          </Button>
          <div className="min-h-14">
            {state.feedback && (
              <FeedbackBar
                correct={state.feedback.correct}
                answer={state.feedback.correct ? undefined : state.feedback.expected}
              >
                {state.feedback.points > 0 && `+${state.feedback.points}`}
              </FeedbackBar>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface DemoProps {
  seed: number;
  onExit: () => void;
  onRestart: () => void;
}

const DEMOS = {
  'true-false': { title: 'devPlay.trueFalse', icon: ThumbsUp, Component: TrueFalseDemo },
  'sentence-rush': { title: 'devPlay.sentenceRush', icon: Shuffle, Component: SentenceRushDemo },
} as const;
type DemoId = keyof typeof DEMOS;

export function PlayDemoPage() {
  const [demo, setDemo] = useState<DemoId | null>(null);
  const [seed, setSeed] = useState(1);

  if (demo) {
    const { Component } = DEMOS[demo];
    return (
      <div data-testid="page-dev-play">
        <Component
          key={seed}
          seed={seed}
          onExit={() => setDemo(null)}
          onRestart={() => setSeed((s) => s + 1)}
        />
      </div>
    );
  }

  return (
    <div data-testid="page-dev-play" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('pages.devPlay')}</h1>
        <p className="text-muted-foreground">{t('devPlay.intro')}</p>
      </header>
      <div className="flex gap-4">
        {(Object.keys(DEMOS) as DemoId[]).map((id, i) => {
          const Icon = DEMOS[id].icon;
          return (
            <ChoiceButton
              key={id}
              shortcut={String(i + 1)}
              className="w-64 flex-col py-6"
              onSelect={() => setDemo(id)}
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              {t(DEMOS[id].title)}
            </ChoiceButton>
          );
        })}
      </div>
      <section className="flex flex-col gap-3 border-t pt-4">
        <h2 className="font-semibold">{t('devPlay.states')}</h2>
        <div className="grid max-w-xl grid-cols-4 gap-3">
          {['ตัว', 'คู่', 'คัน', 'อัน'].map((c, i) => (
            <ChoiceButton
              key={c}
              status={i === 1 ? 'correct' : i === 0 ? 'wrong' : 'idle'}
              disabled
              onSelect={() => {}}
            >
              <span lang="th" className="text-th-md">
                {c}
              </span>
            </ChoiceButton>
          ))}
        </div>
        <FeedbackBar correct={false} answer="คู่" />
        <TimeBar totalMs={5000} remainingMs={800} className="max-w-xl" />
      </section>
    </div>
  );
}
