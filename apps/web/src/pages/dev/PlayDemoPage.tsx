import {
  sentenceRush,
  SENTENCE_RUSH_MS,
  questionEndsAt,
  trueFalse,
  type Game,
  type GameSource,
  type GameState,
} from '@nom/core';
import { useEffect, useState } from 'react';
import {
  ChoiceButton,
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
  const clock = useCountdown({
    durationMs: game.durationMs,
    running: state.status !== 'finished',
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
  return { state, clock, sound, answer, advance };
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
    <div data-testid="demo-finished" className="flex flex-col items-start gap-3">
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
  const { state, answer, advance } = run;
  const q = state.questions[state.index % state.questions.length]!;

  useEffect(() => {
    if (state.status !== 'feedback') return;
    const id = window.setTimeout(advance, state.feedback?.correct ? 300 : 600);
    return () => window.clearTimeout(id);
  });

  return (
    <div className="flex flex-col gap-6">
      <TopBar run={run} title={t('devPlay.trueFalse')} onExit={onExit} />
      {state.status === 'finished' ? (
        <Finished state={state} onRestart={onRestart} />
      ) : (
        <>
          <div
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border p-8',
              state.feedback?.correct === false && 'motion-safe:animate-pulse',
            )}
          >
            <p lang="th" className="text-th-xl">
              {q.th}
            </p>
            <p className="text-xl">{q.shown}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ChoiceButton
              shortcut="F"
              extraKeys={['ArrowLeft']}
              disabled={state.status !== 'playing'}
              onSelect={() => answer(false)}
            >
              ← {t('play.wrong')}
            </ChoiceButton>
            <ChoiceButton
              shortcut="J"
              extraKeys={['ArrowRight']}
              disabled={state.status !== 'playing'}
              onSelect={() => answer(true)}
            >
              {t('play.correct')} →
            </ChoiceButton>
          </div>
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

function SentenceRushDemo({ seed, onExit, onRestart }: DemoProps) {
  const run = useRun(sentenceRush, seed);
  const { state, clock, answer, advance } = run;
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
      {state.status === 'finished' ? (
        <Finished state={state} onRestart={onRestart} />
      ) : (
        <>
          <TimeBar totalMs={SENTENCE_RUSH_MS} remainingMs={state.status === 'playing' ? left : 0} />
          <p className="text-sm text-muted-foreground">
            {t('devPlay.sentenceOf', { n: state.index + 1, total: state.questions.length })}
          </p>
          <p className="text-xl font-medium">{q.vi}</p>
          <TokenBank
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
  'true-false': { title: 'devPlay.trueFalse', Component: TrueFalseDemo },
  'sentence-rush': { title: 'devPlay.sentenceRush', Component: SentenceRushDemo },
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
        {(Object.keys(DEMOS) as DemoId[]).map((id, i) => (
          <ChoiceButton
            key={id}
            shortcut={String(i + 1)}
            className="w-64"
            onSelect={() => setDemo(id)}
          >
            {t(DEMOS[id].title)}
          </ChoiceButton>
        ))}
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
