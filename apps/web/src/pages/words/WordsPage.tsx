import {
  compareUnits,
  isDue,
  itemMastery,
  matchesWord,
  setNeedsReview,
  type CardRecord,
  type MasteryLevel,
  type UnitBundle,
} from '@nom/core';
import { Bookmark, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAudio } from '@/audio/useAudio';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { Emoji } from '@/components/fun';
import { useKeyShortcut } from '@/components/interactive';
import { MASTERY_BG, MASTERY_FG } from '@/components/progress/levels';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MnemonicBlock } from '@/components/words/MnemonicBlock';
import { useAllUnits } from '@/content/hooks';
import { imageEmoji, unitLabel } from '@/content/labels';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { SpeakButton } from '../units/parts';

type Word = UnitBundle['words'][number];
type Level = MasteryLevel | 'review';
type Sort = 'lesson' | 'recent' | 'review' | 'thai';

const LEVELS: readonly Level[] = ['learning', 'known', 'mastered', 'review'];
const SORTS: readonly Sort[] = ['lesson', 'recent', 'review', 'thai'];
const LEVEL_RANK: Record<MasteryLevel, number> = { none: 0, learning: 1, known: 2, mastered: 3 };
/** Ký hiệu mức thuộc đi kèm màu (SCR-07 §B). */
const LEVEL_SYMBOL: Record<MasteryLevel, string> = {
  none: '○',
  learning: '◐',
  known: '◑',
  mastered: '●',
};
const PAGE = 100;
const thaiCollator = new Intl.Collator('th');

interface Row {
  word: Word;
  unit: UnitBundle['unit'];
  level: MasteryLevel;
  review: boolean;
  cards: CardRecord[];
}

/** `/words` — Sổ từ (SCR-07, P-04, V-02, V-04): tra từ đã học, mẹo nhớ, đánh dấu cần ôn. */
export function WordsPage() {
  const content = useAllUnits();
  const data = useRepositoryQuery(async (r) => {
    const [cards, flags] = await Promise.all([
      r.progress.listCards({ itemType: 'word' }),
      r.progress.listNeedsReview(),
    ]);
    return { cards, flags: flags.filter((f) => f.itemType === 'word') };
  }, []);

  return (
    <section data-testid="page-words" className="flex flex-col gap-6">
      {content.status === 'error' ? (
        <>
          <h1 className="text-4xl font-bold">{t('pages.words')}</h1>
          <p role="alert" className="rounded-xl bg-destructive-subtle p-4">
            {t('words.loadError')}
          </p>
        </>
      ) : content.status === 'loading' || !data ? (
        <>
          <h1 className="text-4xl font-bold">{t('pages.words')}</h1>
          <div className="flex flex-col gap-2" role="status" aria-label={t('words.loading')}>
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </>
      ) : (
        <Book bundles={content.data} cards={data.cards} flagged={data.flags.map((f) => f.itemId)} />
      )}
    </section>
  );
}

function Book({
  bundles,
  cards,
  flagged,
}: {
  bundles: UnitBundle[];
  cards: CardRecord[];
  flagged: string[];
}) {
  const [params, setParams] = useSearchParams();
  const units = useMemo(() => [...bundles].sort((a, b) => compareUnits(a.unit, b.unit)), [bundles]);
  const unitId = params.get('unit');
  const unit = units.find((u) => u.unit.unit_id === unitId) ?? null;
  const q = params.get('q') ?? '';
  const level = (LEVELS as readonly string[]).includes(params.get('level') ?? '')
    ? (params.get('level') as Level)
    : params.get('level') === 'none' && unit
      ? 'none'
      : null;
  const sort = (SORTS as readonly string[]).includes(params.get('sort') ?? '')
    ? (params.get('sort') as Sort)
    : 'lesson';
  const [query, setQuery] = useState(q);
  const [limit, setLimit] = useState(PAGE);
  const [phonetic, setPhonetic] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const update = (next: Record<string, string | null>, keepWord = false) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!keepWord) setLimit(PAGE);
    setParams(p, { replace: true });
  };

  // Gõ tìm → cập nhật URL sau 150 ms (SCR-07 §B).
  useEffect(() => {
    if (query === q) return;
    const id = window.setTimeout(() => update({ q: query || null }), 150);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const cardsBy = useMemo(() => {
    const m = new Map<string, CardRecord[]>();
    for (const c of cards) m.set(c.itemId, [...(m.get(c.itemId) ?? []), c]);
    return m;
  }, [cards]);
  const flags = useMemo(() => new Set(flagged), [flagged]);

  // Mọi từ trong content, thứ tự lộ trình → bài.
  const all = useMemo(() => {
    const mastery = itemMastery(
      units.flatMap((u) => u.words.map((w) => w.id)),
      cards,
    );
    return units.flatMap((u) =>
      u.words.map((word): Row => ({
        word,
        unit: u.unit,
        level: mastery.get(word.id) ?? 'none',
        review: flags.has(word.id),
        cards: cardsBy.get(word.id) ?? [],
      })),
    );
  }, [units, cards, cardsBy, flags]);

  // Phạm vi (Q2 a): chỉ từ đã học; chọn chuyên đề → mọi từ của chuyên đề.
  const scope = unit
    ? all.filter((r) => r.unit.unit_id === unit.unit.unit_id)
    : all.filter((r) => r.cards.length > 0);
  const counts = {
    all: scope.length,
    learning: scope.filter((r) => r.level === 'learning').length,
    known: scope.filter((r) => r.level === 'known').length,
    mastered: scope.filter((r) => r.level === 'mastered').length,
    review: scope.filter((r) => r.review).length,
    none: scope.filter((r) => r.level === 'none').length,
  };
  const matched = scope.filter((r) => matchesWord({ ...r.word, meaning_vi: r.word.meaning_vi }, q));
  const filtered = matched.filter(
    (r) => level === null || (level === 'review' ? r.review : r.level === level),
  );
  const rows = sortRows(filtered, sort);
  const shown = rows.slice(0, limit);
  const selectedId = params.get('word');
  const selected = rows.find((r) => r.word.id === selectedId) ?? rows[0] ?? null;
  const select = (id: string) => update({ word: id }, true);

  useKeyShortcut('/', () => searchRef.current?.focus());
  const listRef = useRef<HTMLDivElement>(null);
  const audio = useAudio();
  const speak = () => selected && void audio.speak(selected.word.thai).catch(() => {});
  useKeyShortcut([' ', 'Enter'], speak, !!selected);
  useKeyShortcut('p', () => setPhonetic((v) => !v), !!selected);
  const repos = useRepositories();
  const toggleReview = () =>
    selected &&
    repos &&
    void setNeedsReview(
      repos.progress,
      { itemType: 'word', itemId: selected.word.id },
      !selected.review,
      new Date(),
      'manual',
    );
  useKeyShortcut('c', toggleReview, !!selected && selected.cards.length > 0);

  // Tự tải thêm khi cuộn tới cuối danh sách (Q3 a).
  const hasMore = rows.length > limit;
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting) setLimit((n) => n + PAGE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  const learnedAll = all.filter((r) => r.cards.length > 0);
  if (!unit && learnedAll.length === 0) return <EmptyBook first={units[0]} />;

  const mastered = scope.filter((r) => r.level === 'mastered').length;
  const unlearnedMatches =
    !unit && q ? all.filter((r) => r.cards.length === 0 && matchesWord(r.word, q)) : [];

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('pages.words')}</h1>
        <p className="text-muted-foreground" data-testid="words-summary">
          {unit
            ? t('words.unitSummary', {
                unit: unitLabel(unit.unit),
                learned: scope.filter((r) => r.cards.length > 0).length,
                total: scope.length,
                mastered,
              })
            : counts.review
              ? t('words.summaryReview', { n: scope.length, m: mastered, k: counts.review })
              : t('words.summary', { n: scope.length, m: mastered })}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex min-w-72 flex-1 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">{t('words.searchLabel')}</span>
            <input
              ref={searchRef}
              type="search"
              data-testid="words-search"
              value={query}
              placeholder={t('words.searchPlaceholder')}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Escape') return;
                if (query) setQuery('');
                else e.currentTarget.blur();
              }}
              className="h-10 w-full rounded-lg border border-border-strong bg-surface pr-10 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <kbd aria-hidden className="absolute right-3 font-sans text-xs text-muted-foreground">
              /
            </kbd>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {t('words.unitLabel')}
            <select
              data-testid="words-unit"
              value={unit?.unit.unit_id ?? ''}
              onChange={(e) =>
                update({
                  unit: e.target.value || null,
                  level: level === 'none' ? null : level,
                  word: null,
                })
              }
              className="h-10 max-w-60 rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t('words.allUnits')}</option>
              {units.map((u) => (
                <option key={u.unit.unit_id} value={u.unit.unit_id}>
                  {unitLabel(u.unit)} · {u.unit.title_vi}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {t('words.sortLabel')}
            <select
              data-testid="words-sort"
              value={sort}
              onChange={(e) =>
                update({ sort: e.target.value === 'lesson' ? null : e.target.value })
              }
              className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`words.sort.${s}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label={t('words.levelLabel')}
            className="flex flex-wrap gap-2"
          >
            {([null, ...LEVELS, ...(unit ? (['none'] as const) : [])] as (Level | null)[]).map(
              (l) => (
                <button
                  key={l ?? 'all'}
                  type="button"
                  role="radio"
                  aria-checked={level === l}
                  data-testid={`words-level-${l ?? 'all'}`}
                  onClick={() => update({ level: l })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    level === l
                      ? 'border-primary bg-accent font-medium text-accent-foreground'
                      : 'bg-surface text-muted-foreground',
                  )}
                >
                  {l === 'review' ? (
                    <Bookmark className="size-3.5" aria-hidden />
                  ) : (
                    l && <span aria-hidden>{LEVEL_SYMBOL[l]}</span>
                  )}
                  {l === null
                    ? t('words.levelAll')
                    : l === 'review'
                      ? t('words.review')
                      : t(`progress.level.${l}`)}{' '}
                  <span className="tabular-nums">{counts[l ?? 'all']}</span>
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            aria-pressed={phonetic}
            data-testid="words-phonetic"
            onClick={() => setPhonetic((v) => !v)}
            className={cn(
              'ml-auto rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
              phonetic ? 'border-primary bg-accent text-accent-foreground' : 'bg-surface',
            )}
          >
            Aa {t('words.phonetic')}
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {t('words.resultCount', { n: rows.length })}
      </p>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-3">
          {rows.length === 0 ? (
            <div
              data-testid="words-empty-result"
              className="flex flex-col items-start gap-3 rounded-xl border bg-surface p-6 shadow-card"
            >
              <p>{q ? t('words.noMatch', { q }) : t('words.noMatchFilter')}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuery('');
                  update({ q: null, level: null });
                }}
              >
                {t('words.clearFilters')}
              </Button>
              {unlearnedMatches.length > 0 && (
                <Link
                  to={`/words?unit=${unlearnedMatches[0]!.unit.unit_id}&q=${encodeURIComponent(q)}`}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t('words.unlearnedHint', {
                    n: unlearnedMatches.length,
                    unit: unitLabel(unlearnedMatches[0]!.unit),
                  })}
                </Link>
              )}
            </div>
          ) : (
            <div
              ref={listRef}
              role="listbox"
              tabIndex={0}
              aria-label={t('words.listLabel')}
              aria-activedescendant={selected ? `word-${selected.word.id}` : undefined}
              data-testid="words-list"
              onKeyDown={(e) => {
                const i = rows.findIndex((r) => r.word.id === selected?.word.id);
                const to =
                  e.key === 'ArrowDown'
                    ? i + 1
                    : e.key === 'ArrowUp'
                      ? i - 1
                      : e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? shown.length - 1
                          : null;
                if (to === null) return;
                e.preventDefault();
                const next = rows[Math.max(0, Math.min(rows.length - 1, to))];
                if (next) {
                  if (to >= limit) setLimit((n) => n + PAGE);
                  select(next.word.id);
                  document
                    .getElementById(`word-${next.word.id}`)
                    ?.scrollIntoView({ block: 'nearest' });
                }
              }}
              className="flex flex-col overflow-hidden rounded-xl border bg-surface shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {shown.map((r, i) => {
                const header =
                  sort === 'lesson' && (i === 0 || shown[i - 1]!.unit.unit_id !== r.unit.unit_id);
                const icon = imageEmoji(r.word.image);
                const active = r.word.id === selected?.word.id;
                return (
                  <div key={r.word.id} role="presentation">
                    {header && (
                      <p
                        role="presentation"
                        className="sticky top-0 z-10 border-b bg-muted px-4 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {unitLabel(r.unit)} · {r.unit.title_vi} ·{' '}
                        {t('words.count', {
                          n: shown.filter((x) => x.unit.unit_id === r.unit.unit_id).length,
                        })}
                      </p>
                    )}
                    <div
                      id={`word-${r.word.id}`}
                      role="option"
                      aria-selected={active}
                      data-testid={`word-row-${r.word.id}`}
                      data-level={r.level}
                      onClick={() => select(r.word.id)}
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-3 border-b px-4 py-1.5 last:border-b-0',
                        active ? 'border-l-2 border-l-primary bg-accent' : 'hover:bg-muted',
                      )}
                    >
                      <LevelDot level={r.level} />
                      <span className="sr-only">
                        {t(`progress.level.${r.level}`)}
                        {r.review && `, ${t('words.review')}`}:{' '}
                      </span>
                      <span className="w-7 text-center">
                        {icon && (
                          <Emoji size="sm" className="text-2xl">
                            {icon}
                          </Emoji>
                        )}
                      </span>
                      <span className="flex min-w-40 flex-col">
                        <span lang="th" className="text-th-sm">
                          {r.word.thai}
                        </span>
                        {phonetic && r.word.phonetic && (
                          <span className="text-xs text-muted-foreground">{r.word.phonetic}</span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {r.word.meaning_vi.length ? r.word.meaning_vi.join('; ') : '—'}
                      </span>
                      {r.word.classifier && (
                        <span lang="th" className="text-sm text-muted-foreground">
                          {r.word.classifier}
                        </span>
                      )}
                      {r.word.draft && (
                        <span className="text-xs text-muted-foreground">{t('units.draft')}</span>
                      )}
                      {r.review && (
                        <Bookmark className="size-4 fill-current text-primary" aria-hidden />
                      )}
                      <span onClick={(e) => e.stopPropagation()} role="presentation">
                        <SpeakButton text={r.word.thai} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {rows.length > limit && (
            <div ref={sentinel}>
              <Button variant="outline" onClick={() => setLimit((n) => n + PAGE)}>
                {t('words.more')}
              </Button>
            </div>
          )}
        </div>
        {selected && (
          <Detail
            key={selected.word.id}
            row={selected}
            phonetic={phonetic}
            onSpeak={speak}
            onTogglePhonetic={() => setPhonetic((v) => !v)}
            onToggleReview={toggleReview}
          />
        )}
      </div>
    </>
  );
}

function sortRows(rows: Row[], sort: Sort): Row[] {
  const created = (r: Row) => Math.max(0, ...r.cards.map((c) => Date.parse(c.createdAt)));
  const due = (r: Row) => Math.min(Infinity, ...r.cards.map((c) => Date.parse(c.fsrs.due)));
  if (sort === 'recent') return [...rows].sort((a, b) => created(b) - created(a));
  if (sort === 'thai')
    return [...rows].sort((a, b) => thaiCollator.compare(a.word.thai, b.word.thai));
  if (sort === 'review')
    return [...rows].sort(
      (a, b) =>
        Number(b.review) - Number(a.review) ||
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        due(a) - due(b),
    );
  return rows;
}

function LevelDot({ level }: { level: MasteryLevel }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none',
        MASTERY_BG[level],
        MASTERY_FG[level],
        level === 'none' && 'border-border-strong',
      )}
    >
      {LEVEL_SYMBOL[level]}
    </span>
  );
}

/** Ngày `dd/MM` theo giờ máy. */
const ddmm = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

function Detail({
  row,
  phonetic,
  onSpeak,
  onTogglePhonetic,
  onToggleReview,
}: {
  row: Row;
  phonetic: boolean;
  onSpeak: () => void;
  onTogglePhonetic: () => void;
  onToggleReview: () => void;
}) {
  const { word, unit, level, review, cards } = row;
  const voice = useVoiceStatus();
  const noVoice = voice === 'missing' || voice === 'unsupported';
  const stats = useRepositoryQuery(
    async (r) => {
      const logs = (await Promise.all(cards.map((c) => r.reviews.logsForCard(c.id)))).flat();
      return { reviews: logs.length, lapses: logs.filter((l) => l.rating === 'again').length };
    },
    [cards.map((c) => c.id).join()],
  );
  const icon = imageEmoji(word.image);
  const len = [...word.thai].length;
  const nextDue = cards.length
    ? cards.reduce((a, c) => (Date.parse(c.fsrs.due) < Date.parse(a.fsrs.due) ? c : a))
    : null;
  return (
    <aside
      data-testid="word-detail"
      aria-label={t('words.detailLabel')}
      className="flex flex-col gap-4 rounded-xl border bg-surface p-6 shadow-card xl:sticky xl:top-10"
    >
      <div aria-live="polite" className="flex flex-col items-center gap-2 text-center">
        {icon && (
          <span
            className="nom-emoji text-[96px] leading-none"
            role="img"
            aria-label={word.meaning_vi[0]}
          >
            {icon}
          </span>
        )}
        <p
          lang="th"
          data-testid="word-detail-th"
          className={len > 14 ? 'text-th-md' : len > 8 ? 'text-5xl' : 'text-th-lg'}
        >
          {word.thai}
        </p>
        <p className="text-xl">
          {word.meaning_vi.length ? word.meaning_vi.join('; ') : '—'}
          {word.pos && <span className="ml-2 text-sm text-muted-foreground">{word.pos}</span>}
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={noVoice}
          title={noVoice ? t('lesson.noVoice') : undefined}
          aria-keyshortcuts="Space"
          onClick={onSpeak}
        >
          {t('words.speak')}
          <kbd className="font-sans text-xs text-muted-foreground">Space</kbd>
        </Button>
        {word.phonetic && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={phonetic}
            aria-keyshortcuts="P"
            onClick={onTogglePhonetic}
          >
            {t('words.phonetic')}
            <kbd className="font-sans text-xs text-muted-foreground">P</kbd>
          </Button>
        )}
      </div>
      {phonetic && word.phonetic && (
        <p className="text-center text-muted-foreground">{word.phonetic}</p>
      )}
      {(word.classifier || word.thai_alt.length > 0 || word.note_vi) && (
        <p className="text-sm text-muted-foreground">
          {[
            word.classifier && (
              <span key="c">
                {t('words.classifier')} <span lang="th">{word.classifier}</span>
              </span>
            ),
            word.thai_alt.length > 0 && (
              <span key="a">
                {t('words.alt')} <span lang="th">{word.thai_alt.join(', ')}</span>
              </span>
            ),
            word.note_vi && <span key="n">{word.note_vi}</span>,
          ]
            .filter(Boolean)
            .flatMap((x, i) => (i ? [' · ', x] : [x]))}
        </p>
      )}
      <MnemonicBlock wordId={word.id} suggested={word.mnemonic_vi} shortcuts />
      {word.example_th && (
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{t('words.example')}</p>
          <p className="flex items-center gap-2">
            <span lang="th" className="text-th-sm">
              {word.example_th}
            </span>
            <SpeakButton text={word.example_th} />
          </p>
          {word.example_vi && <p className="text-sm text-muted-foreground">{word.example_vi}</p>}
        </div>
      )}
      <div className="flex flex-col gap-1 border-t pt-4 text-sm" data-testid="word-detail-mastery">
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">{t('words.masteryLabel')}</span>
          <LevelDot level={level} />
          <span className="font-medium">{t(`progress.level.${level}`)}</span>
        </p>
        {cards.length === 0 ? (
          <p>
            {t('words.notLearned', { unit: unitLabel(unit) })}{' '}
            <Link
              to={`/units/${unit.unit_id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t('words.learnUnit', { unit: unitLabel(unit) })} ›
            </Link>
          </p>
        ) : (
          <>
            {nextDue && nextDue.fsrs.state !== 'new' && (
              <p>
                {isDue(nextDue.fsrs, new Date())
                  ? t('words.dueToday')
                  : t('words.nextReview', { date: ddmm(new Date(nextDue.fsrs.due)) })}
              </p>
            )}
            {stats && <p>{t('words.reviewStats', { n: stats.reviews, m: stats.lapses })}</p>}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {cards.length > 0 && (
          <Button
            variant={review ? 'secondary' : 'outline'}
            size="sm"
            aria-pressed={review}
            aria-keyshortcuts="C"
            data-testid="word-review-toggle"
            title={t('words.reviewHint')}
            onClick={onToggleReview}
            className={cn(review && 'border-primary bg-accent text-accent-foreground')}
          >
            <Bookmark className={cn('size-4', review && 'fill-current')} aria-hidden />
            {t('words.review')}
            <kbd className="font-sans text-xs text-muted-foreground">C</kbd>
          </Button>
        )}
        <Link
          to={`/units/${unit.unit_id}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {t('words.openUnit', { unit: unitLabel(unit) })} ›
        </Link>
      </div>
    </aside>
  );
}

function EmptyBook({ first }: { first: UnitBundle | undefined }) {
  return (
    <>
      <h1 className="text-4xl font-bold">{t('pages.words')}</h1>
      <div
        data-testid="words-empty"
        className="flex flex-col items-center gap-3 rounded-xl border bg-surface p-10 text-center shadow-card"
      >
        <Emoji size="lg">📒</Emoji>
        <h2 className="text-xl font-semibold">{t('words.emptyTitle')}</h2>
        <p className="text-muted-foreground">{t('words.emptyBody')}</p>
        {first && first.lessons[0] && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild>
              <Link to={`/units/${first.unit.unit_id}/${first.lessons[0].lesson_id}`}>
                {t('words.emptyStart')}
              </Link>
            </Button>
            <Link
              to={`/words?unit=${first.unit.unit_id}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {t('words.emptyBrowse', { unit: unitLabel(first.unit) })}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
