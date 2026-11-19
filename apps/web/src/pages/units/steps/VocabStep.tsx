import { introduceCard, type BuiltLesson, type UnitBundle } from '@nom/core';
import { useRef, useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import { useAutoSpeech, useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakButton } from '../parts';

type Word = UnitBundle['words'][number];

/** Hình minh họa `noto:<codepoint>` (Noto Emoji, D2a) → ký tự emoji. */
function emoji(image: string | undefined): string | null {
  const m = image?.match(/^noto:([0-9a-f]+(?:_[0-9a-f]+)*)$/i);
  return m ? String.fromCodePoint(...m[1]!.split('_').map((h) => parseInt(h, 16))) : null;
}

/**
 * Từ đưa vào SRS khi người học xem nghĩa (B-03/B-04) — không chấm FSRS. Mỗi từ một lần trong bước:
 * từ "Chưa nhớ" được lật lại sẽ gọi lần nữa, và hai lần gọi song song đều chưa thấy thẻ → tạo trùng.
 */
function useIntroduce() {
  const repos = useRepositories();
  const done = useRef(new Set<string>());
  return (w: Word) => {
    if (!repos || done.current.has(w.id)) return;
    done.current.add(w.id);
    void introduceCard(
      repos.progress,
      { itemType: 'word', itemId: w.id, cardType: 'th-vi' },
      new Date(),
    );
  };
}

export interface StepProps {
  bundle: UnitBundle;
  lesson: BuiltLesson;
  nextLabel: string;
  onDone: () => void;
}

/** Bước Từ vựng (SCR-05): flashcard Thái → Việt hoặc danh sách; phiên âm ẩn. */
export function VocabStep({ bundle, lesson, nextLabel, onDone }: StepProps) {
  const words = bundle.words.filter((w) => w.lesson_id === lesson.lesson_id);
  const [mode, setMode] = useState<'cards' | 'list'>(words.length > 15 ? 'list' : 'cards');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div role="group" className="flex rounded-md border p-0.5 text-sm">
          {(['cards', 'list'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              data-testid={`vocab-mode-${m}`}
              onClick={() => setMode(m)}
              className={cn(
                'rounded px-3 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                mode === m
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {m === 'cards' ? t('lesson.modeCards') : t('lesson.modeList')}
            </button>
          ))}
        </div>
      </div>
      {mode === 'cards' ? (
        <Cards words={words} nextLabel={nextLabel} onDone={onDone} />
      ) : (
        <List words={words} onDone={onDone} />
      )}
    </div>
  );
}

function Cards({
  words,
  nextLabel,
  onDone,
}: {
  words: Word[];
  nextLabel: string;
  onDone: () => void;
}) {
  const audio = useAudio();
  const speech = useAutoSpeech();
  const introduce = useIntroduce();
  const [queue, setQueue] = useState(() => words.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phonetic, setPhonetic] = useState(false);
  const [hard, setHard] = useState<Set<number>>(new Set());

  const finished = pos >= queue.length;
  const word = finished ? undefined : words[queue[pos]!];
  const speak = () => word && void audio.speak(word.thai).catch(() => {});

  const reveal = () => {
    if (!word || revealed) return;
    setRevealed(true);
    introduce(word);
    if (speech.enabled && speech.available) speak();
  };
  const advance = (remember: boolean) => {
    if (!word || !revealed) return;
    const i = queue[pos]!;
    if (!remember && !hard.has(i)) {
      // "Chưa nhớ" → về cuối hàng trong bước này (tối đa 1 lần).
      setHard(new Set(hard).add(i));
      setQueue([...queue, i]);
    }
    setPos(pos + 1);
    setRevealed(false);
    setPhonetic(false);
  };

  useKeyShortcut(' ', reveal, !finished && !revealed);
  useKeyShortcut('1', () => advance(false), revealed);
  useKeyShortcut('2', () => advance(true), revealed);
  useKeyShortcut('r', speak, !finished);
  useKeyShortcut('p', () => setPhonetic((p) => !p), revealed);
  useKeyShortcut('Enter', onDone, finished);

  if (finished) {
    return (
      <div data-testid="vocab-summary" className="flex flex-col items-start gap-4">
        <p className="text-lg">{t('lesson.vocabSummary', { n: words.length, hard: hard.size })}</p>
        <Button data-testid="step-next" aria-keyshortcuts="Enter" onClick={onDone}>
          {nextLabel} ↵
        </Button>
      </div>
    );
  }
  const w = word!;
  const icon = emoji(w.image);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-muted-foreground" data-testid="vocab-counter">
        {t('lesson.counter', { n: Math.min(pos + 1, words.length), total: words.length })}
      </p>
      <div
        key={pos}
        data-testid="flashcard"
        data-revealed={revealed}
        className="flex flex-col items-center gap-3 rounded-xl border p-8 shadow-sm motion-safe:animate-enter"
      >
        {icon && (
          <span aria-hidden className="text-6xl">
            {icon}
          </span>
        )}
        <p lang="th" data-testid="flashcard-th" className="text-th-lg">
          {w.thai}
        </p>
        <SpeakButton text={w.thai} />
        {revealed && (
          <div
            className="flex w-full flex-col gap-2 border-t pt-4 text-center"
            data-testid="flashcard-back"
          >
            <p className={cn('text-xl', !w.meaning_vi.length && 'text-muted-foreground')}>
              {w.meaning_vi.join('; ') || t('lesson.noMeaning')}
            </p>
            {w.classifier && (
              <p>
                {t('lesson.classifier')} <span lang="th">{w.classifier}</span>
              </p>
            )}
            {w.note_vi && <p className="text-sm text-muted-foreground">{w.note_vi}</p>}
            {w.example_th && (
              <p>
                <span lang="th">{w.example_th}</span>
                {w.example_vi && <span className="text-muted-foreground"> — {w.example_vi}</span>}
              </p>
            )}
            {w.thai_alt.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t('lesson.alt')} <span lang="th">{w.thai_alt.join(', ')}</span>
              </p>
            )}
            {w.phonetic && (
              <div>
                {phonetic ? (
                  <p className="text-muted-foreground">{w.phonetic}</p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-keyshortcuts="P"
                    onClick={() => setPhonetic(true)}
                  >
                    {t('lesson.phonetic')}{' '}
                    <kbd className="font-sans text-xs text-muted-foreground">P</kbd>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {revealed ? (
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            data-testid="vocab-forgot"
            aria-keyshortcuts="1"
            onClick={() => advance(false)}
          >
            {t('lesson.forgot')} <kbd className="font-sans text-xs text-muted-foreground">1</kbd>
          </Button>
          <Button data-testid="vocab-known" aria-keyshortcuts="2" onClick={() => advance(true)}>
            {t('lesson.known')} <kbd className="font-sans text-xs opacity-80">2</kbd>
          </Button>
        </div>
      ) : (
        <Button
          data-testid="vocab-reveal"
          aria-keyshortcuts="Space"
          className="self-center"
          onClick={reveal}
        >
          {t('lesson.reveal')} <kbd className="font-sans text-xs opacity-80">Space</kbd>
        </Button>
      )}
    </div>
  );
}

function List({ words, onDone }: { words: Word[]; onDone: () => void }) {
  const introduce = useIntroduce();
  const done = () => {
    words.forEach(introduce);
    onDone();
  };
  return (
    <div className="flex flex-col gap-4">
      <table className="w-full text-left text-sm" data-testid="vocab-table">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-2 font-medium">{t('lesson.colThai')}</th>
            <th className="py-2 font-medium">{t('lesson.colMeaning')}</th>
            <th className="py-2 font-medium">{t('lesson.colNote')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {words.map((w) => (
            <tr key={w.id}>
              <td className="py-2">
                <span className="flex items-center gap-1">
                  <span lang="th" className="text-th-sm">
                    {w.thai}
                  </span>
                  <SpeakButton text={w.thai} />
                </span>
              </td>
              <td className={cn('py-2', !w.meaning_vi.length && 'text-muted-foreground')}>
                {w.meaning_vi.join('; ') || t('lesson.noMeaning')}
              </td>
              <td className="py-2 text-muted-foreground">
                {w.classifier && <span lang="th">{w.classifier} </span>}
                {w.note_vi}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button className="self-start" data-testid="step-next" onClick={done}>
        {t('lesson.doneStep')}
      </Button>
    </div>
  );
}
