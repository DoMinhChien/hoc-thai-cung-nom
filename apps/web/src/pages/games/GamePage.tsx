import { GAMES, subsetSource, summarize, type GameId, type GameItemRef } from '@nom/core';
import { useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { GameTopBar, PausedOverlay } from '@/components/interactive';
import { t } from '@/i18n';
import {
  ClassifierBoard,
  MatchBoard,
  SentenceRushBoard,
  TrueFalseBoard,
  type BoardProps,
} from './boards';
import { gameName, isGameId } from './catalog';
import { GameResult } from './GameResult';
import { useGameSource } from './useGameSource';

const BOARDS: Record<GameId, ComponentType<BoardProps>> = {
  match: MatchBoard,
  'true-false': TrueFalseBoard,
  'sentence-rush': SentenceRushBoard,
  'classifier-rush': ClassifierBoard,
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * `/games/:id` — màn chơi (SCR-08 §B–C, Focus layout). Nguồn lấy từ `?source=`, `?seed=` cố định
 * lượt (E2E). Thoát giữa chừng: không hỏi, không lưu kỷ lục.
 */
export function GamePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useGameSource(params.get('source'));
  const fixedSeed = params.get('seed');
  const [round, setRound] = useState(() => ({
    n: 0,
    seed: fixedSeed === null ? randomSeed() : Number(fixedSeed),
    only: null as GameItemRef[] | null,
  }));

  const exit = () => navigate('/games');
  const message = (text: string) => (
    <div className="flex flex-col items-start gap-3">
      <p>{text}</p>
      <Link to="/games" className="text-primary underline-offset-4 hover:underline">
        {t('games.back')}
      </Link>
    </div>
  );

  let content;
  if (!isGameId(id)) content = message(t('games.unavailable'));
  else if (state.status === 'loading')
    content = <p className="text-muted-foreground">{t('games.loading')}</p>;
  else if (state.status === 'error') content = message(t('games.loadError'));
  else {
    const game = GAMES[id];
    const source = round.only ? subsetSource(state.source, round.only) : state.source;
    if (!game.availability(source).ok) content = message(t('games.unavailable'));
    else {
      const Board = BOARDS[id];
      const next = (only: GameItemRef[] | null) =>
        setRound((r) => ({ n: r.n + 1, seed: randomSeed(), only }));
      content = (
        <Board key={round.n} source={source} seed={round.seed}>
          {(run, body, extra) => {
            const { state: s, clock, sound, speech } = run;
            if (s.status === 'finished') {
              const summary = summarize(id, s, (s.finishedAt ?? s.startedAt) - s.startedAt);
              return (
                <GameResult
                  gameId={id}
                  summary={summary}
                  sourceKey={state.source.key}
                  canReplayMistakes={
                    game.availability(subsetSource(state.source, summary.mistakes)).ok
                  }
                  onExit={exit}
                  onAgain={() => next(null)}
                  onAgainMistakes={(items) => next(items)}
                />
              );
            }
            return (
              <div className="flex flex-col gap-6">
                <GameTopBar
                  title={gameName(id)}
                  timeMs={extra.lives ? undefined : (clock.remainingMs ?? clock.elapsedMs)}
                  clock={clock.remainingMs === null ? 'up' : 'down'}
                  score={extra.scoreValue ?? s.score}
                  scoreLabel={extra.scoreLabel}
                  combo={s.combo}
                  lives={extra.lives}
                  onExit={exit}
                  sound={
                    sound.enabled === undefined
                      ? undefined
                      : {
                          enabled: sound.enabled,
                          onToggle: () => void sound.setEnabled(!sound.enabled),
                        }
                  }
                  speech={
                    speech.enabled === undefined || id === 'match'
                      ? undefined
                      : {
                          enabled: speech.enabled,
                          disabled: !speech.available,
                          onToggle: () => void speech.setEnabled(!speech.enabled),
                        }
                  }
                />
                {body}
                {clock.paused && <PausedOverlay onResume={clock.resume} />}
              </div>
            );
          }}
        </Board>
      );
    }
  }

  return (
    <section data-testid="page-game" data-game={isGameId(id) ? id : undefined}>
      {content}
    </section>
  );
}
