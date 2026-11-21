import { compareUnits, GAMES, LEARNED_SOURCE, unitSourceKey, type GameId } from '@nom/core';
import { Lock } from 'lucide-react';
import { useId } from 'react';
import { useNavigate } from 'react-router';
import { useKeyShortcut } from '@/components/interactive';
import { Button } from '@/components/ui/button';
import { unitLabel } from '@/content/labels';
import { useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatRecord, GAME_ICON, GAME_ORDER, gameName, lockReason } from './catalog';
import { useGameSource } from './useGameSource';

/** `/games` — danh sách trò chơi (SCR-08 §A, F-10, P-09). */
export function GamesPage() {
  const { state, choose } = useGameSource();
  const navigate = useNavigate();
  const selectId = useId();
  const records = useRepositoryQuery((r) => r.progress.listGameResults(), []);
  const reviewCount = useRepositoryQuery(
    async (r) => (await r.progress.listNeedsReview()).filter((f) => f.origin === 'game').length,
    [],
  );

  const ready = state.status === 'ready' ? state : null;
  const open = (id: GameId) =>
    ready && navigate(`/games/${id}?source=${encodeURIComponent(ready.source.key)}`);
  const playable = (id: GameId) => !!ready && GAMES[id].availability(ready.source).ok;

  useKeyShortcut(
    GAME_ORDER.map((_, i) => String(i + 1)),
    (e) => {
      const id = GAME_ORDER[Number(e.key) - 1]!;
      if (playable(id)) open(id);
    },
    !!ready,
  );

  return (
    <section data-testid="page-games" className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('pages.games')}</h1>
        <p className="text-muted-foreground">{t('games.intro')}</p>
      </header>

      {state.status === 'loading' && <p className="text-muted-foreground">{t('games.loading')}</p>}
      {state.status === 'error' && (
        <p role="alert" className="text-destructive">
          {t('games.loadError')}
        </p>
      )}

      {ready && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={selectId} className="text-sm text-muted-foreground">
              {t('games.source')}
            </label>
            <select
              id={selectId}
              data-testid="game-source"
              value={ready.fallback ? LEARNED_SOURCE : ready.choice}
              onChange={(e) => void choose(e.target.value)}
              className="h-10 rounded-md border border-border-strong bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <span className="text-sm text-muted-foreground">{t('games.orUnit')}</span>
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

          <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {GAME_ORDER.map((id, i) => {
              const reason = lockReason(GAMES[id].availability(ready.source));
              const best = records?.find((r) => r.gameId === id && r.source === ready.source.key);
              const Icon = GAME_ICON[id];
              return (
                <li
                  key={id}
                  data-game={id}
                  data-testid={`game-card-${id}`}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border-2 border-transparent bg-game-subtle p-5',
                    !reason && 'hover:border-game motion-safe:transition-colors',
                  )}
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-game text-game-fg">
                    {reason ? (
                      <Lock className="size-6" aria-hidden />
                    ) : (
                      <Icon className="size-6" aria-hidden />
                    )}
                  </span>
                  <h2 className="text-lg font-semibold">{gameName(id)}</h2>
                  <p className="text-sm text-muted-foreground">{t(`games.desc.${id}`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`games.duration.${id}`)}</p>
                  <p className="text-sm font-medium" data-testid={`game-record-${id}`}>
                    {best
                      ? t('games.record', { value: formatRecord(id, best.best) })
                      : t('games.notPlayed')}
                  </p>
                  {reason && (
                    <p className="text-sm text-muted-foreground" data-testid={`game-locked-${id}`}>
                      {reason}
                    </p>
                  )}
                  <Button
                    className="mt-auto bg-game text-game-fg hover:bg-game/90"
                    disabled={!!reason}
                    aria-keyshortcuts={String(i + 1)}
                    onClick={() => open(id)}
                  >
                    {t('games.play')}
                    <kbd aria-hidden className="rounded bg-game-fg/20 px-1.5 font-sans text-xs">
                      {i + 1}
                    </kbd>
                  </Button>
                </li>
              );
            })}
          </ul>

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
