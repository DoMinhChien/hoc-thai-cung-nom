import {
  compareUnits,
  GAME_SKILLS,
  gameAvailability,
  gamesWithSkill,
  LEARNED_SOURCE,
  SKILLS_BY_GAME,
  unitSourceKey,
  type AnyGameId,
  type GameSkill,
} from '@nom/core';
import { Check, Lock, Trophy } from 'lucide-react';
import { useId, useRef } from 'react';
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
import { unitLabel } from '@/content/labels';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatRecord, GAME_ORDER, gameName, lockReason, parseSkill } from './catalog';
import { Thumbnail } from './Thumbnail';
import { useGameSource } from './useGameSource';

const THEME_EMOJI: Record<GameTheme, string> = { sea: '🌊', space: '🚀', garden: '🌻' };

const SKILL_CYCLE: (GameSkill | null)[] = [null, ...GAME_SKILLS];

/** `/games` — danh sách 8 trò (SCR-08 v2 §A, F-10, P-09, plan 0.14). */
export function GamesPage() {
  const { state, choose } = useGameSource();
  const navigate = useNavigate();
  const selectId = useId();
  const [params, setParams] = useSearchParams();
  const skill = parseSkill(params.get('skill'));
  const { theme, setTheme } = useGameTheme();
  const records = useRepositoryQuery((r) => r.progress.listGameResults(), []);
  const reviewCount = useRepositoryQuery(
    async (r) => (await r.progress.listNeedsReview()).filter((f) => f.origin === 'game').length,
    [],
  );
  const cards = useRef<(HTMLButtonElement | null)[]>([]);

  const ready = state.status === 'ready' ? state : null;
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
    setParams(next ? { skill: next } : {}, { replace: true });

  useKeyShortcut(
    GAME_ORDER.map((_, i) => String(i + 1)),
    (e) => {
      const id = GAME_ORDER[Number(e.key) - 1]!;
      if (shown.includes(id)) open(id);
    },
    !!ready,
  );
  useKeyShortcut(
    's',
    () => setSkill(SKILL_CYCLE[(SKILL_CYCLE.indexOf(skill) + 1) % SKILL_CYCLE.length]!),
    !!ready,
  );
  useKeyShortcut(
    't',
    () =>
      theme && void setTheme(GAME_THEMES[(GAME_THEMES.indexOf(theme) + 1) % GAME_THEMES.length]!),
    !!theme,
  );

  const moveFocus = (from: number, delta: number) => {
    const next = Math.max(0, Math.min(shown.length - 1, from + delta));
    cards.current[next]?.focus();
  };

  return (
    <section data-testid="page-games" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('pages.games')}</h1>
        <p className="text-muted-foreground">{t('games.intro')}</p>
      </header>

      {state.status === 'loading' && (
        <ul className="grid grid-cols-3 gap-4 xl:grid-cols-4" aria-label={t('games.loading')}>
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
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor={selectId} className="text-sm text-muted-foreground">
                {t('games.source')}
              </label>
              <select
                id={selectId}
                data-testid="game-source"
                value={ready.fallback ? LEARNED_SOURCE : ready.choice}
                onChange={(e) => void choose(e.target.value)}
                className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={LEARNED_SOURCE}>{t('games.learned', ready.learned)}</option>
                {[...ready.bundles]
                  .sort((a, b) => compareUnits(a.unit, b.unit))
                  .map(({ unit }) => (
                    <option key={unit.unit_id} value={unitSourceKey(unit.unit_id)}>
                      {t('games.unitOption', { unit: unitLabel(unit), title: unit.title_vi })}
                    </option>
                  ))}
              </select>
            </div>
            {theme && <ThemePicker theme={theme} onChange={(th) => void setTheme(th)} />}
          </div>
          {ready.fallback && (
            <p data-testid="game-fallback" className="text-sm text-muted-foreground">
              {t('games.fallback', {
                unit: unitLabel(
                  ready.bundles.find((b) => b.unit.unit_id === ready.source.unitId)!.unit,
                ),
              })}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('games.skillLabel')}</span>
            <div
              role="group"
              aria-label={t('games.skillLabel')}
              className="flex rounded-lg border bg-surface p-0.5"
            >
              {SKILL_CYCLE.map((k) => (
                <button
                  key={k ?? 'all'}
                  type="button"
                  aria-pressed={skill === k}
                  data-testid={`games-skill-${k ?? 'all'}`}
                  onClick={() => setSkill(k)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    skill === k
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {t(`games.skill.${k ?? 'all'}`)} {gamesWithSkill(k, GAME_ORDER).length}
                </button>
              ))}
            </div>
            <kbd className="font-sans text-xs text-muted-foreground" aria-hidden>
              S
            </kbd>
          </div>

          {shown.length === 0 ? (
            <p className="text-muted-foreground">{t('games.noSkillGames')}</p>
          ) : (
            <ul className="grid grid-cols-3 gap-4 xl:grid-cols-4" data-testid="games-grid">
              {shown.map((id, i) => {
                const reason = reasonOf(id);
                const best = records?.find((r) => r.gameId === id && r.source === ready.source.key);
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
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{t('games.themeLabel')}</span>
      <div role="radiogroup" aria-label={t('games.themeGroup')} className="flex gap-3">
        {GAME_THEMES.map((th) => (
          <button
            key={th}
            type="button"
            role="radio"
            aria-checked={theme === th}
            data-testid={`game-theme-${th}`}
            data-game-theme={th}
            onClick={() => onChange(th)}
            className="flex items-center gap-2 rounded-full pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <kbd className="font-sans text-xs text-muted-foreground" aria-hidden>
        T
      </kbd>
    </div>
  );
}
