import { introduceCard } from '@nom/core';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakButton } from '../parts';
import type { StepProps } from './VocabStep';

/** Cài đặt bật/tắt bản dịch trong Hội thoại (C-06, nhớ lựa chọn). */
export const TRANSLATION_KEY = 'lessonTranslation';

/** Tách câu Thái thành từ (C-02) — `Intl.Segmenter` giữ nguyên cụm ký tự (dấu đi cùng phụ âm). */
function segment(th: string): { text: string; word: boolean }[] {
  const seg = new Intl.Segmenter('th', { granularity: 'word' });
  return [...seg.segment(th)].map((s) => ({ text: s.segment, word: !!s.isWordLike }));
}

/** Bước Hội thoại (SCR-05): tra từ ở panel phải, bật/tắt bản dịch, phát câu / cả đoạn. */
export function DialogueStep({ bundle, lesson, nextLabel, onDone }: StepProps) {
  const audio = useAudio();
  const repos = useRepositories();
  const lines = bundle.dialogues
    .filter((d) => d.lesson_id === lesson.lesson_id)
    .flatMap((d) => d.lines);
  const showTranslation = useRepositoryQuery((r) => r.settings.get(TRANSLATION_KEY, true), []);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const [lookup, setLookup] = useState<string | null>(null);
  const word = lookup ? bundle.words.find((w) => w.thai === lookup) : undefined;
  const inWords = useRepositoryQuery(
    async (r) => (word ? !!(await r.progress.findCard('word', word.id, 'th-vi')) : false),
    [word?.id],
  );

  const toggleTranslation = () =>
    repos && void repos.settings.set(TRANSLATION_KEY, showTranslation === false);
  const speakLine = (i: number) => void audio.speak(lines[i]!.th).catch(() => {});
  const playAll = async () => {
    for (let i = 0; i < lines.length; i++) {
      setPlaying(i);
      await audio.speak(lines[i]!.th).catch(() => {});
    }
    setPlaying(null);
  };

  useKeyShortcut('t', toggleTranslation);
  useKeyShortcut('ArrowDown', () => setSelected((s) => Math.min(lines.length - 1, s + 1)));
  useKeyShortcut('ArrowUp', () => setSelected((s) => Math.max(0, s - 1)));
  useKeyShortcut('r', () => speakLine(selected));
  useKeyShortcut('Enter', onDone);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              data-testid="dialogue-play-all"
              onClick={() => void playAll()}
            >
              <Play aria-hidden />
              {t('lesson.playAll')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={showTranslation !== false}
              aria-keyshortcuts="T"
              data-testid="dialogue-translation"
              onClick={toggleTranslation}
            >
              {t('lesson.translation')}{' '}
              <kbd className="font-sans text-xs text-muted-foreground">T</kbd>
            </Button>
          </div>
          <ol className="flex flex-col gap-1" data-testid="dialogue-lines">
            {lines.map((line, i) => (
              <li
                key={i}
                aria-current={selected === i ? 'true' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-md px-2 py-2',
                  (playing === i || selected === i) && 'bg-secondary',
                )}
              >
                <span className="w-8 shrink-0 pt-1 text-sm text-muted-foreground">
                  {line.speaker}
                </span>
                <div className="flex flex-1 flex-col">
                  <p lang="th" className="text-[22px]">
                    {segment(line.th).map((part, k) =>
                      part.word ? (
                        <button
                          key={k}
                          type="button"
                          data-testid="dialogue-word"
                          onClick={() => {
                            setSelected(i);
                            setLookup(part.text);
                          }}
                          className={cn(
                            'rounded outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                            bundle.words.some((w) => w.thai === part.text) &&
                              'underline decoration-dotted underline-offset-4',
                          )}
                        >
                          {part.text}
                        </button>
                      ) : (
                        <span key={k}>{part.text}</span>
                      ),
                    )}
                  </p>
                  {showTranslation !== false && <p className="text-muted-foreground">{line.vi}</p>}
                </div>
                <SpeakButton text={line.th} />
              </li>
            ))}
          </ol>
        </section>
        <aside
          className="flex flex-col gap-2 self-start rounded-lg border p-4"
          data-testid="lookup-panel"
        >
          <h2 className="text-sm font-semibold text-muted-foreground">{t('lesson.lookup')}</h2>
          {!lookup ? (
            <p className="text-sm text-muted-foreground">{t('lesson.lookupHint')}</p>
          ) : (
            <>
              <p lang="th" className="text-th-md">
                {lookup}
              </p>
              {word ? (
                <>
                  <p>{word.meaning_vi.join('; ') || t('lesson.noMeaning')}</p>
                  <SpeakButton text={word.thai} />
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="lookup-add"
                    disabled={!!inWords}
                    onClick={() =>
                      repos &&
                      void introduceCard(
                        repos.progress,
                        { itemType: 'word', itemId: word.id, cardType: 'th-vi' },
                        new Date(),
                      )
                    }
                  >
                    {inWords ? t('lesson.inWords') : t('lesson.addWord')}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{t('lesson.notInDict')}</p>
                  <SpeakButton text={lookup} />
                </>
              )}
            </>
          )}
        </aside>
      </div>
      <Button
        className="self-start"
        data-testid="step-next"
        aria-keyshortcuts="Enter"
        onClick={onDone}
      >
        {nextLabel} ↵
      </Button>
    </div>
  );
}
