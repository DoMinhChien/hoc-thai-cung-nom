import {
  resultStars,
  saveGameResult,
  setNeedsReview,
  type GameId,
  type GameItemRef,
  type GameStats,
  type GameSummary,
} from '@nom/core';
import { Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { itemKey, ReviewList, useCompletionSound, useKeyShortcut } from '@/components/interactive';
import { formatClock } from '@/components/interactive/format';
import { Button } from '@/components/ui/button';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { formatRecord, gameName } from './catalog';

/** Ít nhất chừng này mục sai mới hiện "Chơi với mục sai" (SCR-08 §C). */
export const MIN_MISTAKES_REPLAY = 4;

const numberFormat = new Intl.NumberFormat('vi-VN');

export interface GameResultProps {
  gameId: GameId;
  summary: GameSummary;
  /** Khóa nguồn để lưu kỷ lục (`learned` / `unit:<id>`). */
  sourceKey: string;
  /** Đủ dữ liệu để chơi lại chỉ với mục sai (nút ẩn khi `false`). */
  canReplayMistakes: boolean;
  onExit: () => void;
  onAgain: () => void;
  onAgainMistakes: (items: GameItemRef[]) => void;
}

/**
 * Kết quả lượt chơi (SCR-08 §C, F-11, F-12): lưu kỷ lục + "cần ôn" một lần khi mở; kỷ lục mới có
 * hiệu ứng mạnh hơn (sao nảy + vòng sáng màu của trò, không confetti); bật/tắt "cần ôn" từng mục.
 */
export function GameResult({
  gameId,
  summary,
  sourceKey,
  canReplayMistakes,
  onExit,
  onAgain,
  onAgainMistakes,
}: GameResultProps) {
  const repos = useRepositories();
  const [record, setRecord] = useState<{ newBest: boolean; previous: GameStats | null }>();
  const [flagged, setFlagged] = useState(() => new Set(summary.mistakes.map(itemKey)));
  const saved = useRef(false);
  useCompletionSound();

  useEffect(() => {
    if (!repos || saved.current) return;
    saved.current = true;
    const now = new Date();
    void saveGameResult(repos.progress, summary, sourceKey, now).then(setRecord);
    // Lượt chơi là một ngày học của chuỗi (M0.5c Q4).
    void repos.sessions.start('game', now).then((s) => repos.sessions.end(s.id, new Date()));
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
  useKeyShortcut('Escape', onExit);
  useKeyShortcut('Enter', onAgain);
  useKeyShortcut('w', () => onAgainMistakes(summary.mistakes), replay);

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
            className="relative flex items-center gap-3 self-start rounded-full bg-game px-5 py-2 text-lg font-semibold text-game-fg motion-safe:animate-pop"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-game opacity-40 motion-safe:animate-ping"
            />
            <Star className="relative size-6 fill-current" aria-hidden />
            <span className="relative">{t('games.newRecord')}</span>
            {record.previous && (
              <span className="relative text-sm font-normal opacity-90">
                {t('games.previous', { value: formatRecord(gameId, record.previous) })}
              </span>
            )}
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
          <Button variant="outline" data-testid="result-other" onClick={onExit}>
            {t('games.other')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t('games.fsrsNote')}</p>
      </div>
    </div>
  );
}

/** 1–3 sao theo tỉ lệ đúng (plan 0.14). */
function Stars({ n }: { n: number }) {
  return (
    <p
      data-testid="result-stars"
      data-stars={n}
      role="img"
      aria-label={t('games.stars', { n })}
      className="flex gap-1"
    >
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={
            i <= n
              ? 'size-9 fill-current text-game motion-safe:animate-pop'
              : 'size-9 text-border-strong'
          }
        />
      ))}
    </p>
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
