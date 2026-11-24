import {
  createRng,
  pickSpeakingItems,
  saveSpeakingAttempt,
  SELF_RATINGS,
  summarizeSpeaking,
  type SelfRating,
  type SpeakingItem,
} from '@nom/core';
import { Turtle, Volume2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAudio } from '@/audio/useAudio';
import { Emoji } from '@/components/fun';
import { useCompletionSound, useFeedbackSound, useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRepositories, useStudySession } from '@/data';
import { useShowPhonetic } from '@/data/preferences';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakButton } from '@/pages/units/parts';
import { SpeakingPanel } from '@/speaking/SpeakingPanel';
import { useSpeakingSource } from './useSpeakingSource';

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
/** Giọng mẫu chậm (SCR-10 §3). */
const SLOW_RATE = 0.7;

const itemRef = (i: Pick<SpeakingItem, 'itemType' | 'itemId'>) => `${i.itemType}:${i.itemId}`;

interface Rated {
  item: SpeakingItem;
  rating: SelfRating;
  asr: boolean;
}

/**
 * `/practice/speaking/session` (SCR-10 §3, Focus layout): 10 mục của nội dung đã chọn, mục cần ôn
 * trước. `?items=word:a,sentence:b` — "Luyện lại các mục này"; `?seed=` cố định phiên (E2E).
 */
export function SpeakingSessionPage() {
  const { state, pool } = useSpeakingSource();
  const [params] = useSearchParams();
  const location = useLocation();
  let body;
  if (state.status === 'error') body = <Message text={t('speaking.loadError')} />;
  else if (state.status === 'loading') {
    body = <Skeleton className="h-96" role="status" aria-label={t('speaking.loading')} />;
  } else {
    // Mỗi lần điều hướng ("Luyện lại", "Phiên mới" — kể cả cùng URL) → phiên mới.
    body = (
      <Session key={location.key} pool={pool} priority={state.source.priority} params={params} />
    );
  }
  return <section data-testid="page-speaking-session">{body}</section>;
}

/** Mục của phiên chọn một lần lúc vào — lưu lượt / cờ trong phiên không xáo lại. */
function chooseItems(
  pool: readonly SpeakingItem[],
  priority: readonly string[] | undefined,
  params: URLSearchParams,
): SpeakingItem[] {
  const items = params.get('items');
  if (items) return items.split(',').flatMap((ref) => pool.filter((i) => itemRef(i) === ref));
  const seed = params.get('seed');
  return pickSpeakingItems(pool, createRng(seed === null ? randomSeed() : Number(seed)), priority);
}

function Session({
  pool,
  priority,
  params,
}: {
  pool: readonly SpeakingItem[];
  priority: readonly string[] | undefined;
  params: URLSearchParams;
}) {
  const [items] = useState(() => chooseItems(pool, priority, params));
  if (items.length === 0) return <Message text={t('speaking.sourceShort')} />;
  return <Runner items={items} />;
}

function Runner({ items }: { items: SpeakingItem[] }) {
  const navigate = useNavigate();
  const repos = useRepositories();
  const sound = useFeedbackSound();
  const [rated, setRated] = useState<Rated[]>([]);
  const [asrRatio, setAsrRatio] = useState<number | null>(null);
  const finished = rated.length >= items.length;
  const setSummary = useStudySession('speaking', !finished);
  const back = () => navigate('/practice');

  const rate = (rating: SelfRating) => {
    const item = items[rated.length];
    if (!item) return;
    if (repos) void saveSpeakingAttempt(repos, item, rating, asrRatio, new Date());
    sound.play(rating === 'retry' ? 'wrong' : 'correct');
    const next = [...rated, { item, rating, asr: asrRatio !== null }];
    if (next.length >= items.length) setSummary(summarizeSpeaking(next));
    setRated(next);
    setAsrRatio(null);
  };
  useKeyShortcut('Escape', back, !finished);
  useKeyShortcut('1', () => rate('good'), !finished);
  useKeyShortcut('2', () => rate('close'), !finished);
  useKeyShortcut('3', () => rate('retry'), !finished);

  if (finished) return <SpeakingResult rated={rated} />;
  const item = items[rated.length]!;
  return (
    <div className="flex flex-col gap-6" data-testid="speaking-session">
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          data-testid="speaking-exit"
          aria-keyshortcuts="Escape"
          aria-label={t('speaking.exit')}
          onClick={back}
        >
          <X aria-hidden />
        </Button>
        <div
          role="progressbar"
          aria-label={t('speaking.title')}
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={rated.length}
          className="h-1 flex-1 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full bg-primary motion-safe:transition-[width]"
            style={{ width: `${(rated.length / items.length) * 100}%` }}
          />
        </div>
        <span className="text-sm tabular-nums" data-testid="speaking-count">
          {t('speaking.progress', { n: rated.length + 1, total: items.length })}
        </span>
      </header>
      <ItemCard key={itemRef(item)} item={item} onAttempt={setAsrRatio} />
      <div className="flex flex-col items-center gap-3" data-testid="speaking-rate">
        <h2 className="text-base font-semibold">{t('speaking.rateTitle')}</h2>
        <div className="grid w-full max-w-md grid-cols-3 gap-2">
          {SELF_RATINGS.map((r, i) => (
            <Button
              key={r}
              variant="outline"
              data-testid={`speaking-rate-${r}`}
              aria-keyshortcuts={String(i + 1)}
              onClick={() => rate(r)}
              className="h-auto min-h-12 flex-col gap-0.5 whitespace-normal py-2"
            >
              {t(`speaking.ratings.${r}`)}
              <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
                {i + 1}
              </kbd>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Nghĩa + chữ Thái + phiên âm (theo cài đặt), nghe mẫu / chậm, rồi ghi âm (SCR-10 §3). */
function ItemCard({
  item,
  onAttempt,
}: {
  item: SpeakingItem;
  onAttempt: (asrRatio: number | null) => void;
}) {
  const audio = useAudio();
  const phonetic = useShowPhonetic();
  const listen = (rate?: number) =>
    void audio.speak(item.thai, rate ? { rate } : undefined).catch(() => {});
  useKeyShortcut('r', () => listen());
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl border bg-surface p-6 text-center shadow-card motion-safe:animate-enter"
      data-testid="speaking-item"
      data-item={itemRef(item)}
    >
      <p className="text-lg">{item.vi}</p>
      <p lang="th" className="text-th-lg" data-testid="speaking-thai">
        {item.thai}
      </p>
      {phonetic && item.phonetic && <p className="text-muted-foreground">{item.phonetic}</p>}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          data-testid="speaking-listen"
          aria-keyshortcuts="R"
          onClick={() => listen()}
        >
          <Volume2 aria-hidden />
          {t('speaking.listen')}
        </Button>
        <Button variant="secondary" data-testid="speaking-slow" onClick={() => listen(SLOW_RATE)}>
          <Turtle aria-hidden />
          {t('speaking.slow')}
        </Button>
      </div>
      <SpeakingPanel
        target={{
          key: itemRef(item),
          text: item.thai,
          accepted: item.accepted,
          tokens: item.tokens,
        }}
        onAttempt={(a) => onAttempt(a.asrRatio)}
      />
    </div>
  );
}

function SpeakingResult({ rated }: { rated: Rated[] }) {
  const navigate = useNavigate();
  const summary = summarizeSpeaking(rated);
  const retry = rated.filter((r) => r.rating === 'retry');
  useCompletionSound();
  const retryItems = () =>
    navigate(`/practice/speaking/session?items=${retry.map((r) => itemRef(r.item)).join(',')}`);
  useKeyShortcut('Enter', retry.length ? retryItems : () => navigate('/practice/speaking/session'));
  return (
    <section className="flex flex-col gap-6" data-testid="speaking-result">
      <div className="flex items-center gap-5">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-positive-subtle motion-safe:animate-fb-complete">
          <Emoji size="lg">🎙</Emoji>
        </span>
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">
          {t('speaking.resultTitle')}
        </h1>
      </div>
      <p className="text-lg" data-testid="speaking-result-counts">
        {t('speaking.resultCounts', {
          good: summary.good,
          close: summary.close,
          retry: summary.retry,
        })}
      </p>
      {retry.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('speaking.resultRetryList')}</h2>
          <ul className="flex flex-col gap-2" data-testid="speaking-retry-list">
            {retry.map(({ item }) => (
              <li key={itemRef(item)} className="flex items-center gap-3 rounded-lg border p-3">
                <SpeakButton text={item.thai} />
                <span className="flex flex-col">
                  <span lang="th" className="text-th-sm">
                    {item.thai}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.vi}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {retry.length > 0 && (
          <Button data-testid="speaking-retry" aria-keyshortcuts="Enter" onClick={retryItems}>
            {t('speaking.retryItems')} ↵
          </Button>
        )}
        <Button
          variant={retry.length ? 'outline' : 'default'}
          data-testid="speaking-new"
          onClick={() => navigate('/practice/speaking/session')}
        >
          {t('speaking.newSession')}
        </Button>
        <Button variant="outline" data-testid="speaking-back" onClick={() => navigate('/practice')}>
          {t('speaking.backToPractice')}
        </Button>
      </div>
    </section>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-3')} data-testid="speaking-message">
      <p>{text}</p>
      <Link to="/practice/speaking" className="text-primary underline-offset-4 hover:underline">
        {t('speaking.title')}
      </Link>
    </div>
  );
}
