import {
  currentQuestion,
  rapidQuestionEndsAt,
  sentenceRush,
  SENTENCE_RUSH_MS,
  START_LIVES,
  questionEndsAt,
  trueFalse,
  type Game,
  type GameItemRef,
  type GameSource,
  type GameState,
} from '@nom/core';
import { Shuffle, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChoiceButton,
  CountIn,
  FeedbackBar,
  GameTopBar,
  itemKey,
  PausedOverlay,
  ReviewList,
  TimeBar,
  TokenBank,
  UrgencyCard,
  useAutoSpeech,
  useCountdown,
  useFeedbackPause,
  useFeedbackSound,
  useSpeakOnCue,
  type AutoSpeech,
  type Countdown,
  type FeedbackSound,
} from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

/**
 * Dữ liệu GIẢ LẬP để xem component tương tác (M7.5) chạy với logic trò chơi trong core — từ/câu lấy
 * từ content mẫu Unit 1–2 (draft), tách thẻ tay. KHÔNG phải màn `/games` (chờ SCR-08).
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

/** Chạy một lượt: đồng hồ trò chơi (tạm dừng khi rời tab) + tick hết giờ + âm phản hồi. */
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
  const speech = useAutoSpeech();
  const { now } = clock;

  // Âm đúng/sai cho cả câu trả lời lẫn hết giờ (tick).
  const play = useRef(sound.play);
  useEffect(() => {
    play.current = sound.play;
  });
  useEffect(() => {
    if (state.feedback) play.current(state.feedback.correct);
  }, [state.feedback]);

  const answer = (a: A) => setState(game.answer(state, a, now()));
  const advance = useCallback(() => setState((s) => game.next(s, now())), [game, now]);
  return { state, clock, sound, speech, answer, advance, started, start };
}

function TopBar({
  run,
  title,
  onExit,
  lives,
}: {
  run: { state: GameState; clock: Countdown; sound: FeedbackSound; speech?: AutoSpeech };
  title: string;
  onExit: () => void;
  lives?: { count: number; max: number; delta?: -1 | 0 | 1 };
}) {
  const { state, clock, sound, speech } = run;
  return (
    <>
      <GameTopBar
        title={title}
        timeMs={lives ? undefined : (clock.remainingMs ?? clock.elapsedMs)}
        clock={clock.remainingMs === null ? 'up' : 'down'}
        score={state.score}
        combo={state.combo}
        lives={lives}
        onExit={onExit}
        sound={
          sound.enabled === undefined
            ? undefined
            : { enabled: sound.enabled, onToggle: () => void sound.setEnabled(!sound.enabled) }
        }
        speech={
          speech?.enabled === undefined
            ? undefined
            : {
                enabled: speech.enabled,
                disabled: !speech.available,
                onToggle: () => void speech.setEnabled(!speech.enabled),
              }
        }
      />
      {clock.paused && state.status !== 'finished' && <PausedOverlay onResume={clock.resume} />}
    </>
  );
}

function Finished({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  // Demo: cờ "cần ôn" chỉ giữ trong trang (màn thật ghi qua `setNeedsReview`).
  const [flagged, setFlagged] = useState(() => new Set(state.mistakes.map(itemKey)));
  const toggle = (item: GameItemRef, on: boolean) =>
    setFlagged((prev) => {
      const next = new Set(prev);
      if (on) next.add(itemKey(item));
      else next.delete(itemKey(item));
      return next;
    });
  return (
    <div
      data-testid="demo-finished"
      className="flex flex-col items-start gap-4 rounded-xl bg-game-subtle p-6 motion-safe:animate-enter"
    >
      <p className="text-5xl font-semibold text-game tabular-nums motion-safe:animate-pop">
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
        <ReviewList mistakes={state.mistakes} flagged={flagged} onToggle={toggle} />
      )}
      <Button className="bg-game text-game-fg hover:bg-game/90" onClick={onRestart}>
        {t('devPlay.restart')}
      </Button>
    </div>
  );
}

function TrueFalseDemo({ seed, onExit, onRestart }: DemoProps) {
  const run = useRun(trueFalse, seed);
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
    // Đồng hồ render lại mỗi 100 ms — chỉ đặt hẹn giờ khi vào màn phản hồi.
  }, [state.status, state.index, fb?.correct, advance]);

  const choose = (value: boolean) => {
    setSaid(value);
    answer(value);
  };
  const statusOf = (value: boolean) =>
    fb && said === value ? (fb.correct ? 'correct' : 'wrong') : 'idle';

  return (
    <div className="flex flex-col gap-6">
      <TopBar
        run={run}
        title={t('devPlay.trueFalse')}
        onExit={onExit}
        lives={{ count: state.lives, max: START_LIVES, delta: state.lifeDelta }}
      />
      {!started ? (
        <CountIn onDone={start} />
      ) : state.status === 'finished' ? (
        <Finished state={state} onRestart={onRestart} />
      ) : (
        <>
          <TimeBar totalMs={q.timeMs} remainingMs={left} />
          <UrgencyCard
            key={state.index}
            elapsed={used / q.timeMs}
            feedback={fb ? (fb.correct ? 'correct' : 'wrong') : null}
          >
            <p lang="th" className="text-th-xl">
              {q.th}
            </p>
            <p className="rounded-full bg-background px-4 py-1 text-xl font-medium shadow-sm">
              {q.shown}
            </p>
          </UrgencyCard>
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
  const { state, clock, answer, advance, started, start, speech } = run;
  const [picked, setPicked] = useState<number[]>([]);
  const q = state.questions[Math.min(state.index, state.questions.length - 1)]!;

  // Xếp đúng → đọc lại cả câu cho người học nhớ (góp ý owner 2026-11-18), đọc xong mới sang câu.
  useFeedbackPause({
    active: state.status === 'feedback',
    speakText: state.feedback?.correct ? q.th : null,
    speech,
    minMs: 1500,
    onDone: () => {
      setPicked([]);
      advance();
    },
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
      <div data-testid="page-dev-play" data-game={demo}>
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
              data-game={id}
              shortcut={String(i + 1)}
              className="w-64 flex-col py-6"
              onSelect={() => setDemo(id)}
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-game text-game-fg">
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
