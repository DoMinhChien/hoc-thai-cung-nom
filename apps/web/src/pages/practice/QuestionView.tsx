import { checkAnswer, checkMatchPair, type CheckResult, type Question } from '@nom/core';
import { Lightbulb, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import { ChoiceButton, TokenBank, useKeyShortcut } from '@/components/interactive';
import { ThaiTextInput } from '@/components/typing';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';

type Choice = Extract<Question, { kind: 'choice' }>;
type Arrange = Extract<Question, { kind: 'arrange' }>;
type Typing = Extract<Question, { kind: 'typing' }>;
type Match = Extract<Question, { kind: 'match' }>;

/** Kết quả một câu hỏi (SCR-06 §B) — phiên quy ra rating FSRS + danh sách câu sai. */
export interface Answered extends CheckResult {
  /** Câu trả lời của người học (chữ / thẻ nối lại); bỏ qua → không có. */
  given?: string;
  hinted?: boolean;
  skipped?: boolean;
  /** Ghép cặp: số lần ghép sai theo `itemId`. */
  mistakes?: Record<string, number>;
}

export interface QuestionViewProps {
  question: Question;
  /** Đã trả lời → khóa câu hỏi, hiện đúng/sai. */
  answered: Answered | null;
  onAnswer: (result: Answered) => void;
  /** Có giọng Thái (nút 🔊, E-08). */
  voice: boolean;
}

/** Đề + vùng trả lời của một câu hỏi, theo loại (bảng "Bố cục theo loại câu hỏi" SCR-06 §B). */
export function QuestionView(props: QuestionViewProps) {
  const { question } = props;
  const title =
    question.type === 'E-08' && question.kind === 'arrange'
      ? t('practice.listenArrange')
      : t(`practice.prompt.${question.type}`);
  return (
    <div className="flex flex-col gap-6" data-testid="question" data-type={question.type}>
      <p className="text-sm text-muted-foreground" data-testid="question-title">
        {title}
      </p>
      {question.kind === 'choice' ? (
        <ChoiceQuestion {...props} question={question} />
      ) : question.kind === 'arrange' ? (
        <ArrangeQuestion {...props} question={question} />
      ) : question.kind === 'typing' ? (
        <TypingQuestion {...props} question={question} />
      ) : (
        <MatchQuestion {...props} question={question} />
      )}
    </div>
  );
}

/** Nút nghe; `auto` → phát 1 lần khi hiện câu (E-08); phím `R` nghe lại. */
function Listen({
  text,
  auto,
  voice,
  big,
}: {
  text: string;
  auto?: boolean;
  voice: boolean;
  big?: boolean;
}) {
  const audio = useAudio();
  const speak = () => void audio.speak(text).catch(() => {});
  const played = useRef(false);
  useEffect(() => {
    if (auto && voice && !played.current) {
      played.current = true;
      void audio.speak(text).catch(() => {});
    }
  }, [audio, auto, text, voice]);
  useKeyShortcut(['r', 'R'], speak, voice);
  return (
    <Button
      type="button"
      variant={big ? 'secondary' : 'ghost'}
      size={big ? 'lg' : 'icon-sm'}
      disabled={!voice}
      aria-label={t('practice.replay')}
      aria-keyshortcuts="R"
      data-testid="question-listen"
      className={cn(big && 'size-16 rounded-full')}
      onClick={speak}
    >
      <Volume2 aria-hidden className={cn(big && 'size-8')} />
    </Button>
  );
}

function ChoiceQuestion({
  question,
  answered,
  onAnswer,
  voice,
}: QuestionViewProps & { question: Choice }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const { prompt } = question;
  return (
    <>
      {question.type === 'E-08' ? (
        <div className="flex flex-col items-center gap-2">
          <Listen text={question.audio!} auto voice={voice} big />
          <span className="text-sm text-muted-foreground">
            {t('practice.replay')} <kbd className="font-sans text-xs">R</kbd>
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          {prompt.th && (
            <p
              lang="th"
              data-testid="question-th"
              className={cn(
                question.type === 'E-04' || question.type === 'E-05' ? 'text-th-lg' : 'text-th-xl',
              )}
            >
              {prompt.th}
            </p>
          )}
          {prompt.vi && (
            <p
              data-testid="question-vi"
              className={cn(prompt.th ? 'text-muted-foreground' : 'text-2xl font-medium')}
            >
              {prompt.vi}
            </p>
          )}
          {question.audio && <Listen text={question.audio} voice={voice} />}
        </div>
      )}
      <div
        className={cn('grid gap-3', question.optionsLang === 'vi' ? 'grid-cols-1' : 'grid-cols-2')}
        data-testid="question-options"
      >
        {question.options.map((option, i) => (
          <ChoiceButton
            key={option}
            shortcut={String(i + 1)}
            lang={question.optionsLang}
            className={cn(question.optionsLang === 'th' ? 'text-th-md' : 'justify-start text-left')}
            status={
              !answered
                ? 'idle'
                : option === question.answer
                  ? 'correct'
                  : option === chosen
                    ? 'wrong'
                    : 'idle'
            }
            disabled={!!answered}
            onSelect={() => {
              setChosen(option);
              onAnswer({ ...checkAnswer(question, option), given: option });
            }}
          >
            {option}
          </ChoiceButton>
        ))}
      </div>
    </>
  );
}

function ArrangeQuestion({
  question,
  answered,
  onAnswer,
  voice,
}: QuestionViewProps & { question: Arrange }) {
  const [picked, setPicked] = useState<number[]>([]);
  const submit = () => {
    const tokens = picked.map((i) => question.bank[i]!);
    onAnswer({ ...checkAnswer(question, tokens), given: tokens.join('') });
  };
  return (
    <>
      {question.audio ? (
        <div className="flex flex-col items-center gap-2">
          <Listen text={question.audio} auto voice={voice} big />
        </div>
      ) : (
        <p data-testid="question-vi" className="rounded-xl bg-accent px-5 py-4 text-xl font-medium">
          {question.vi}
        </p>
      )}
      <TokenBank
        tokens={question.bank}
        value={picked}
        onChange={setPicked}
        onSubmit={submit}
        disabled={!!answered}
      />
      {!answered && (
        <Button
          className="self-end"
          data-testid="question-check"
          aria-keyshortcuts="Enter"
          disabled={picked.length === 0}
          onClick={submit}
        >
          {t('practice.check')} ↵
        </Button>
      )}
    </>
  );
}

function TypingQuestion({
  question,
  answered,
  onAnswer,
}: QuestionViewProps & { question: Typing }) {
  const [value, setValue] = useState('');
  const [hinted, setHinted] = useState(false);
  const submit = () => {
    if (answered || !value.trim()) return;
    onAnswer({ ...checkAnswer(question, value), given: value, hinted });
  };
  const hint = () => {
    if (answered) return;
    setHinted(true);
    if (!value.startsWith(question.hint)) setValue(question.hint);
  };
  useKeyShortcut(['h', 'H'], hint, !answered && !hinted);
  const { prompt } = question;
  return (
    <>
      <div className="flex flex-col items-center gap-1 text-center">
        {prompt.th && (
          <p lang="th" data-testid="question-th" className="text-th-xl">
            {prompt.th}
          </p>
        )}
        {prompt.vi && (
          <p data-testid="question-vi" className="text-xl font-medium">
            {prompt.vi}
          </p>
        )}
      </div>
      <ThaiTextInput
        value={value}
        onChange={setValue}
        onSubmit={submit}
        disabled={!!answered}
        aria-label={t('practice.typeHere')}
      />
      {!answered && (
        <div className="flex justify-between gap-3">
          <Button
            variant="ghost"
            data-testid="question-hint"
            aria-keyshortcuts="H"
            disabled={hinted}
            onClick={hint}
          >
            <Lightbulb aria-hidden />
            {t('practice.hint')} <kbd className="font-sans text-xs text-muted-foreground">H</kbd>
          </Button>
          <Button
            data-testid="question-check"
            aria-keyshortcuts="Enter"
            disabled={!value.trim()}
            onClick={submit}
          >
            {t('practice.check')} ↵
          </Button>
        </div>
      )}
    </>
  );
}

/**
 * Ghép cặp (E-03, E-09): chọn ô trái rồi ô phải; đúng → cặp mờ đi, sai → ô rung và tính một lần sai
 * cho mục bên trái. Xong khi ghép hết.
 */
function MatchQuestion({ question, answered, onAnswer }: QuestionViewProps & { question: Match }) {
  const [left, setLeft] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const pairOf = (l: string) => question.pairs.find((p) => p.left === l)!;

  const pickRight = (right: string) => {
    if (answered || left === null) return;
    if (checkMatchPair(question, left, right)) {
      const next = new Set(done).add(left);
      setDone(next);
      setLeft(null);
      setWrong(null);
      if (next.size === question.pairs.length) {
        const ok = Object.values(mistakes).every((n) => n === 0);
        onAnswer({ correct: ok, tone: false, expected: '', mistakes });
      }
    } else {
      const id = pairOf(left).item.itemId;
      setMistakes({ ...mistakes, [id]: (mistakes[id] ?? 0) + 1 });
      setWrong(right);
    }
  };
  const matchedRight = new Set(question.pairs.filter((p) => done.has(p.left)).map((p) => p.right));
  const cell =
    'min-h-14 rounded-lg border-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default motion-safe:transition-colors';
  return (
    <div className="grid grid-cols-2 gap-4" data-testid="match-board">
      <div role="group" aria-label={t('practice.matchLeft')} className="flex flex-col gap-2">
        {question.pairs.map((p) => (
          <button
            key={p.left}
            type="button"
            lang={question.lang.left}
            data-testid="match-left"
            aria-pressed={left === p.left}
            disabled={done.has(p.left) || !!answered}
            onClick={() => {
              setLeft(p.left);
              setWrong(null);
            }}
            className={cn(
              cell,
              question.lang.left === 'th' && 'text-th-sm',
              done.has(p.left)
                ? 'border-positive/40 bg-positive-subtle opacity-60'
                : left === p.left
                  ? 'border-primary bg-accent'
                  : 'border-border-strong hover:bg-secondary',
            )}
          >
            {p.left}
          </button>
        ))}
      </div>
      <div role="group" aria-label={t('practice.matchRight')} className="flex flex-col gap-2">
        {question.rightOrder.map((r) => (
          <button
            key={r}
            type="button"
            lang={question.lang.right}
            data-testid="match-right"
            disabled={matchedRight.has(r) || !!answered}
            onClick={() => pickRight(r)}
            className={cn(
              cell,
              question.lang.right === 'th' && 'text-th-sm',
              matchedRight.has(r)
                ? 'border-positive/40 bg-positive-subtle opacity-60'
                : wrong === r
                  ? 'border-destructive bg-destructive-subtle motion-safe:animate-shake'
                  : 'border-border-strong hover:bg-secondary',
            )}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
