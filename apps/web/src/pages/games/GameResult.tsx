import {
  gameAvailability,
  resultStars,
  saveGameResult,
  setNeedsReview,
  type AnyGameId,
  type GameItemRef,
  type GameSource,
  type GameStats,
  type GameSummary,
} from '@nom/core';
import { Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Burst, Stars } from '@/components/fun';
import { itemKey, ReviewList, useCompletionSound, useKeyShortcut } from '@/components/interactive';
import { formatClock } from '@/components/interactive/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { formatRecord, GAME_ORDER, gameName, lockReason } from './catalog';
import { Thumbnail } from './Thumbnail';

/** Ít nhất chừng này mục sai mới hiện "Chơi với mục sai" (SCR-08 §C). */
export const MIN_MISTAKES_REPLAY = 4;

const numberFormat = new Intl.NumberFormat('vi-VN');

export interface GameResultProps {
  gameId: AnyGameId;
  summary: GameSummary<AnyGameId>;
  /** Dòng riêng trò (SCR-08 v2 §C), vd. "Đập nhầm 4 lần". */
  detail?: string | null;
  /** Nguồn hiện tại — dialog "Đổi trò" khóa trò không chơi được (giữ nguồn). */
  source?: GameSource;
  /** Khóa nguồn để lưu kỷ lục (`learned` / `unit:<id>`). */
  sourceKey: string;
  /** Đủ dữ liệu để chơi lại chỉ với mục sai (nút ẩn khi `false`). */
  canReplayMistakes: boolean;
  onExit: () => void;
  onAgain: () => void;
  onAgainMistakes: (items: GameItemRef[]) => void;
  /** "Đổi trò" (`G`): mở trò khác với cùng nguồn. */
  onPick?: (id: AnyGameId) => void;
}

/**
 * Kết quả lượt chơi (SCR-08 §C, F-11, F-12): lưu kỷ lục + "cần ôn" một lần khi mở; kỷ lục mới có
 * hiệu ứng mạnh hơn (sao nảy + vòng sáng màu của trò, không confetti); bật/tắt "cần ôn" từng mục.
 */
export function GameResult({
  gameId,
  summary,
  detail,
  source,
  sourceKey,
  canReplayMistakes,
  onExit,
  onAgain,
  onAgainMistakes,
  onPick,
}: GameResultProps) {
  const [picking, setPicking] = useState(false);
  const repos = useRepositories();
  const [record, setRecord] = useState<{ newBest: boolean; previous: GameStats | null }>();
  const [flagged, setFlagged] = useState(() => new Set(summary.mistakes.map(itemKey)));
  const saved = useRef(false);
  useCompletionSound();

  useEffect(() => {
    if (!repos || saved.current) return;
    saved.current = true;
    void saveGameResult(repos.progress, summary, sourceKey, new Date()).then(setRecord);
  }, [repos, summary, sourceKey]);

  const toggle = (item: GameItemRef, on: boolean) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (on) next.add(itemKey(item));
      else next.delete(itemKey(item));
      return next;
    });
    if (repos) void setNeedsReview(repos.progress, item, on, new Date());
  };

  const replay = canReplayMistakes && summary.mistakes.length >= MIN_MISTAKES_REPLAY;
  useKeyShortcut('Escape', onExit, !picking);
  useKeyShortcut('Enter', onAgain, !picking);
  useKeyShortcut('w', () => onAgainMistakes(summary.mistakes), replay && !picking);
  useKeyShortcut('g', () => setPicking(true), !!onPick && !picking);

  const pct = Math.round(summary.accuracy * 100);
  const stars = resultStars(summary);
  return (
    <div data-testid="game-result" className="flex flex-col gap-6">
      <header className="flex items-center border-b pb-3">
        <Button variant="ghost" size="sm" onClick={onExit} aria-keyshortcuts="Escape">
          <X aria-hidden />
          {t('common.close')}
          <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
            Esc
          </kbd>
        </Button>
      </header>
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 motion-safe:animate-enter">
        <h1 className="text-4xl font-bold">{t('games.resultTitle', { game: gameName(gameId) })}</h1>
        {stars > 0 && <Stars n={stars} />}
        <dl className="flex flex-wrap gap-10">
          <Stat
            value={
              gameId === 'match'
                ? formatClock(summary.durationMs, 'up')
                : numberFormat.format(summary.score)
            }
            label={gameId === 'match' ? t('games.statTime') : t('games.statPoints')}
            testId="result-score"
          />
          <Stat
            value={`${summary.correct}/${summary.total}`}
            label={t('games.statCorrect', { pct })}
            testId="result-correct"
          />
          {gameId !== 'match' && gameId !== 'sentence-rush' && (
            <Stat
              value={`×${summary.maxCombo}`}
              label={t('games.statCombo')}
              testId="result-combo"
            />
          )}
        </dl>

        {record?.newBest && (
          <p
            data-testid="result-new-record"
            className="relative flex items-center gap-3 self-start rounded-full bg-highlight px-5 py-2 text-lg font-bold text-foreground motion-safe:animate-fb-complete"
          >
            <Burst record className="text-game" />
            <Trophy className="relative size-6" aria-hidden />
            <span className="relative">{t('games.newRecord')}</span>
            {record.previous && (
              <span className="relative text-sm font-normal">
                {t('games.previous', { value: formatRecord(gameId, record.previous) })}
              </span>
            )}
          </p>
        )}
        {record && !record.newBest && record.previous && (
          <p data-testid="result-best" className="text-muted-foreground">
            {t('games.record', { value: formatRecord(gameId, record.previous) })}
          </p>
        )}
        {detail && (
          <p data-testid="result-detail" className="text-muted-foreground">
            {detail}
          </p>
        )}

        {summary.mistakes.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              {t('games.mistakes', { n: summary.mistakes.length })}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {t('games.mistakesNote')}
              </span>
            </h2>
            <ReviewList mistakes={summary.mistakes} flagged={flagged} onToggle={toggle} />
          </section>
        ) : (
          <p className="text-lg font-medium text-positive">{t('games.perfect')}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            data-testid="result-again"
            className="bg-game text-game-fg hover:bg-game/90"
            aria-keyshortcuts="Enter"
            onClick={onAgain}
          >
            {t('games.again')}
            <kbd aria-hidden className="rounded bg-game-fg/20 px-1.5 font-sans text-xs">
              ↵
            </kbd>
          </Button>
          {replay && (
            <Button
              variant="outline"
              data-testid="result-again-mistakes"
              aria-keyshortcuts="W"
              onClick={() => onAgainMistakes(summary.mistakes)}
            >
              {t('games.againMistakes')}
              <kbd aria-hidden className="rounded bg-muted px-1.5 font-sans text-xs">
                W
              </kbd>
            </Button>
          )}
          {onPick && (
            <Button
              variant="outline"
              data-testid="result-other"
              aria-keyshortcuts="G"
              onClick={() => setPicking(true)}
            >
              {t('games.other')}
              <kbd aria-hidden className="rounded bg-muted px-1.5 font-sans text-xs">
                G
              </kbd>
            </Button>
          )}
          <Button variant="ghost" data-testid="result-list" onClick={onExit}>
            {t('games.toList')}
            <kbd aria-hidden className="font-sans text-xs text-muted-foreground">
              Esc
            </kbd>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('games.fsrsNote')}</p>
      </div>
      {onPick && (
        <ChangeGameDialog
          open={picking}
          current={gameId}
          source={source}
          onClose={() => setPicking(false)}
          onPick={onPick}
        />
      )}
    </div>
  );
}

/** "Đổi trò" (SCR-08 v2 §C): lưới 4×2 thumbnail nhỏ, giữ nguồn, phím `1`–`8`, `Esc` đóng. */
function ChangeGameDialog({
  open,
  current,
  source,
  onClose,
  onPick,
}: {
  open: boolean;
  current: AnyGameId;
  source: GameSource | undefined;
  onClose: () => void;
  onPick: (id: AnyGameId) => void;
}) {
  const reasonOf = (id: AnyGameId) => (source ? lockReason(gameAvailability(id, source)) : null);
  const pick = (id: AnyGameId) => {
    if (reasonOf(id)) return;
    onClose();
    onPick(id);
  };
  useKeyShortcut(
    GAME_ORDER.map((_, i) => String(i + 1)),
    (e) => pick(GAME_ORDER[Number(e.key) - 1]!),
    open,
  );
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="change-game" className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t('games.changeTitle')}</DialogTitle>
          <DialogDescription>{t('games.changeHint')}</DialogDescription>
        </DialogHeader>
        <ul className="grid grid-cols-4 gap-3">
          {GAME_ORDER.map((id, i) => {
            const reason = reasonOf(id);
            return (
              <li key={id} data-game={id}>
                <button
                  type="button"
                  data-testid={`change-game-${id}`}
                  aria-disabled={!!reason}
                  aria-keyshortcuts={String(i + 1)}
                  title={reason ?? undefined}
                  onClick={() => pick(id)}
                  className={cn(
                    'flex w-full flex-col overflow-hidden rounded-lg border bg-surface text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    reason && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <span className="relative">
                    <Thumbnail id={id} locked={!!reason} className="[&>*]:scale-75" />
                    <kbd
                      aria-hidden
                      className="absolute top-1 right-1 rounded bg-surface px-1.5 font-sans text-xs font-semibold"
                    >
                      {i + 1}
                    </kbd>
                  </span>
                  <span className="flex flex-col px-2 py-1.5">
                    <span className="font-medium">{gameName(id)}</span>
                    {id === current && (
                      <span className="text-xs text-muted-foreground">{t('games.justPlayed')}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ value, label, testId }: { value: string; label: string; testId: string }) {
  return (
    <div className="flex flex-col">
      <dd data-testid={testId} className="order-1 text-4xl font-semibold text-game tabular-nums">
        {value}
      </dd>
      <dt className="order-2 text-sm text-muted-foreground">{label}</dt>
    </div>
  );
}
