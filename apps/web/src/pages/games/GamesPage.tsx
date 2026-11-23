import {
  bestGameResult,
  GAME_SKILLS,
  gameAvailability,
  gamesWithSkill,
  MIN_SOURCE_ITEMS,
  parseSourceKey,
  SKILLS_BY_GAME,
  sourceSize,
  type AnyGameId,
  type GameSkill,
} from '@nom/core';
import { Check, ChevronRight, Lock, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Emoji } from '@/components/fun';
import {
  GAME_THEMES,
  useGameTheme,
  useKeyShortcut,
  type GameTheme,
} from '@/components/interactive';
import { Skeleton } from '@/components/ui/skeleton';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatRecord, GAME_ORDER, gameName, lockReason, parseSkill } from './catalog';
import { countLabel, sourceLabel } from './source-label';
import { SourcePicker } from './SourcePicker';
import { Thumbnail } from './Thumbnail';
import { useGameSource } from './useGameSource';

const THEME_EMOJI: Record<GameTheme, string> = { sea: '🌊', space: '🚀', garden: '🌻' };

const SKILL_CYCLE: (GameSkill | null)[] = [null, ...GAME_SKILLS];

/**
 * `/games` — danh sách 8 trò (SCR-08 v2 §A, F-10, P-09, plan 0.14) + "Nội dung ôn" (SCR-08 v3).
 * `?source=` (lối vào "Chơi ôn") được lưu thành lựa chọn; `?pick=1` mở bộ chọn ("Đổi nội dung").
 */
export function GamesPage() {
  const { state, choose } = useGameSource();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const skill = parseSkill(params.get('skill'));
  const picking = params.get('pick') === '1';
  const fromUrl = params.get('source');
  const loaded = state.status === 'ready';
  useEffect(() => {
    // Đợi dữ liệu người dùng sẵn sàng rồi mới lưu, kẻo mất lựa chọn.
    if (fromUrl === null || !loaded) return;
    const spec = parseSourceKey(fromUrl);
    const apply = spec ? choose(spec) : Promise.resolve();
    void apply.then(() =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('source');
          return next;
        },
        { replace: true },
      ),
    );
  }, [fromUrl, loaded, choose, setParams]);
  const setPicking = (open: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (open) next.set('pick', '1');
        else next.delete('pick');
        return next;
      },
      { replace: true },
    );
  const { theme, setTheme } = useGameTheme();
  const records = useRepositoryQuery((r) => r.progress.listGameResults(), []);
  const reviewCount = useRepositoryQuery(
    async (r) => (await r.progress.listNeedsReview()).filter((f) => f.origin === 'game').length,
    [],
  );
  const cards = useRef<(HTMLButtonElement | null)[]>([]);

  const ready = state.status === 'ready' && fromUrl === null ? state : null;
  const shown = gamesWithSkill(skill, GAME_ORDER);
  const reasonOf = (id: AnyGameId) =>
    ready ? lockReason(gameAvailability(id, ready.source)) : null;
  const open = (id: AnyGameId) => {
    if (!ready) return;
    const reason = reasonOf(id);
    if (reason) {
      toast(t('games.lockedToast', { game: gameName(id), reason }));
      return;
    }
    navigate(`/games/${id}?source=${encodeURIComponent(ready.source.key)}`);
  };
  const setSkill = (next: GameSkill | null) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next) p.set('skill', next);
        else p.delete('skill');
        return p;
      },
      { replace: true },
    );
  const playable = (k: GameSkill | null) =>
    gamesWithSkill(k, GAME_ORDER).filter((id) => !ready || !reasonOf(id)).length;

  useKeyShortcut(
    GAME_ORDER.map((_, i) => String(i + 1)),
    (e) => {
      const id = GAME_ORDER[Number(e.key) - 1]!;
      if (shown.includes(id)) open(id);
    },
    !!ready && !picking,
  );
  useKeyShortcut(
    's',
    () => setSkill(SKILL_CYCLE[(SKILL_CYCLE.indexOf(skill) + 1) % SKILL_CYCLE.length]!),
    !!ready && !picking,
  );
  useKeyShortcut(
    't',
    () =>
      theme && void setTheme(GAME_THEMES[(GAME_THEMES.indexOf(theme) + 1) % GAME_THEMES.length]!),
    !!theme && !picking,
  );

  const moveFocus = (from: number, delta: number) => {
    const next = Math.max(0, Math.min(shown.length - 1, from + delta));
    cards.current[next]?.focus();
  };

  return (
    <section data-testid="page-games" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tablet:text-[28px] lg:text-4xl">{t('pages.games')}</h1>
        <p className="text-muted-foreground">{t('games.intro')}</p>
      </header>

      {!ready && state.status !== 'error' && (
        <ul
          className="grid grid-cols-1 gap-4 tablet:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label={t('games.loading')}
        >
          {GAME_ORDER.map((id) => (
            <li key={id}>
              <Skeleton className="aspect-[16/12] rounded-xl" />
            </li>
          ))}
        </ul>
      )}
      {state.status === 'error' && (
        <p role="alert" className="text-destructive">
          {t('games.loadError')}
        </p>
      )}

      {ready && (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-8">
            <div className="flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
              <span className="text-sm text-muted-foreground" id="game-source-label">
                {t('games.source')}
              </span>
              <button
                type="button"
                data-testid="game-source"
                data-source={ready.source.key}
                aria-describedby="game-source-label"
                aria-haspopup="dialog"
                onClick={() => setPicking(true)}
                className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-left text-base font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring lg:h-10 lg:min-h-0 lg:w-auto lg:text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {sourceLabel(ready.spec, ready.bundles)}
                  <span data-testid="game-source-count">
                    {t('games.sourceCountSuffix', { count: countLabel(ready.source) })}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </div>
            {theme && <ThemePicker theme={theme} onChange={(th) => void setTheme(th)} />}
          </div>
          {sourceSize(ready.source) < MIN_SOURCE_ITEMS && (
            <p
              data-testid="game-source-short"
              role="status"
              className="text-sm text-muted-foreground"
            >
              {t('games.sourceShort', { min: MIN_SOURCE_ITEMS })}
            </p>
          )}
          <SourcePicker
            open={picking}
            onOpenChange={setPicking}
            spec={ready.spec}
            bundles={ready.bundles}
            learner={ready.learner}
            counts={ready.counts}
            onApply={(spec) => void choose(spec)}
          />

          <div className="flex flex-col gap-1.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
            <span className="text-sm text-muted-foreground">{t('games.skillLabel')}</span>
            {/* Phone / tablet: 1 dòng cuộn ngang, chữ không xuống dòng (SCR-00 v2 §4). */}
            <div
              role="group"
              aria-label={t('games.skillLabel')}
              className="flex max-w-full self-start overflow-x-auto rounded-lg border bg-surface p-0.5"
            >
              {SKILL_CYCLE.map((k) => (
                <button
                  key={k ?? 'all'}
                  type="button"
                  aria-pressed={skill === k}
                  data-testid={`games-skill-${k ?? 'all'}`}
                  onClick={() => setSkill(k)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring max-lg:min-h-11',
                    skill === k
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(`games.skill.${k ?? 'all'}`)} {playable(k)}
                </button>
              ))}
            </div>
            <kbd className="hidden font-sans text-xs text-muted-foreground lg:inline" aria-hidden>
              S
            </kbd>
          </div>

          {shown.length === 0 ? (
            <p className="text-muted-foreground">{t('games.noSkillGames')}</p>
          ) : (
            <ul
              className="grid grid-cols-1 gap-4 tablet:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-testid="games-grid"
            >
              {shown.map((id, i) => {
                const reason = reasonOf(id);
                const best = records && bestGameResult(records, id);
                const key = GAME_ORDER.indexOf(id) + 1;
                return (
                  <li key={id} data-game={id}>
                    <button
                      ref={(el) => {
                        cards.current[i] = el;
                      }}
                      type="button"
                      data-testid={`game-card-${id}`}
                      aria-disabled={!!reason}
                      aria-keyshortcuts={String(key)}
                      onClick={() => open(id)}
                      onKeyDown={(e) => {
                        const delta = { ArrowLeft: -1, ArrowRight: 1 }[e.key as 'ArrowLeft'];
                        if (delta) {
                          e.preventDefault();
                          moveFocus(i, delta);
                        }
                      }}
                      className={cn(
                        'group flex h-full w-full flex-col overflow-hidden rounded-xl border bg-surface text-left shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        !reason &&
                          'motion-safe:transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 hover:shadow-md',
                        reason && 'cursor-not-allowed',
                      )}
                    >
                      <span className="relative">
                        <Thumbnail id={id} locked={!!reason} />
                        <kbd
                          aria-hidden
                          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-surface font-sans text-sm font-semibold text-foreground shadow-sm"
                        >
                          {key}
                        </kbd>
                      </span>
                      <span className="flex flex-1 flex-col gap-2 p-4">
                        <span className="flex items-center gap-2 text-lg font-semibold">
                          {reason && (
                            <Lock className="size-4" aria-label={t('games.lockedLabel')} />
                          )}
                          {gameName(id)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t(`games.desc.${id}`)}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {SKILLS_BY_GAME[id].map((s) => (
                            <span
                              key={s}
                              data-testid={`game-skill-${id}-${s}`}
                              className="rounded-full border border-game/40 px-2 text-xs font-medium text-game"
                            >
                              {t(`games.skill.${s}`)}
                            </span>
                          ))}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {t(`games.duration.${id}`)}
                          </span>
                        </span>
                        {reason ? (
                          <span
                            className="mt-auto text-sm text-muted-foreground"
                            data-testid={`game-locked-${id}`}
                          >
                            {reason}
                          </span>
                        ) : (
                          <span
                            className="mt-auto flex items-center gap-1.5 text-sm font-medium"
                            data-testid={`game-record-${id}`}
                          >
                            {best && <Trophy className="size-4 text-star-stroke" aria-hidden />}
                            {best
                              ? t('games.record', { value: formatRecord(id, best.best) })
                              : t('games.notPlayed')}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!!reviewCount && (
            <p className="text-sm text-muted-foreground" data-testid="game-review-count">
              {t('games.needsReview', { n: reviewCount })}
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Chọn chủ đề màn chơi (SCR-08 v2 §A): 3 ô tròn, `T` xoay vòng, lưu theo người dùng. */
function ThemePicker({ theme, onChange }: { theme: GameTheme; onChange: (t: GameTheme) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {t('games.themeLabel')}
      </span>
      {/* Phone / tablet: hàng cuộn ngang (SCR-00 v2 §4). */}
      <div
        role="radiogroup"
        aria-label={t('games.themeGroup')}
        className="-mx-1 flex gap-3 overflow-x-auto p-1 lg:mx-0 lg:overflow-visible lg:p-0"
      >
        {GAME_THEMES.map((th) => (
          <button
            key={th}
            type="button"
            role="radio"
            aria-checked={theme === th}
            data-testid={`game-theme-${th}`}
            data-game-theme={th}
            onClick={() => onChange(th)}
            className="flex shrink-0 items-center gap-2 rounded-full pr-2 text-sm whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={cn(
                'relative flex size-10 items-center justify-center rounded-full bg-scene-top',
                theme === th ? 'ring-[3px] ring-primary' : 'ring-1 ring-border',
              )}
            >
              <Emoji size="sm" className="text-xl">
                {THEME_EMOJI[th]}
              </Emoji>
              {theme === th && (
                <Check
                  aria-hidden
                  className="absolute -right-1 -bottom-1 size-4 rounded-full bg-primary p-0.5 text-primary-foreground"
                />
              )}
            </span>
            {t(`games.theme.${th}`)}
          </button>
        ))}
      </div>
      <kbd className="hidden font-sans text-xs text-muted-foreground lg:inline" aria-hidden>
        T
      </kbd>
    </div>
  );
}
