import {
  gameAvailability,
  isArcadeGameId,
  subsetSource,
  summarize,
  type AnyGameId,
  type ArcadeGameId,
  type GameId,
  type GameItemRef,
  type GameSummary,
} from '@nom/core';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  DEFAULT_GAME_THEME,
  GameTopBar,
  PausedOverlay,
  useBackgroundMusic,
  useGameTheme,
  useReducedMotion,
  type AutoSpeech,
  type FeedbackSound,
  type GameTheme,
} from '@/components/interactive';
import { useStudySession } from '@/data';
import { t } from '@/i18n';
import {
  AirplaneBoard,
  GameshowBoard,
  MazeBoard,
  Panel,
  WhackBoard,
  type ArcadeBoardProps,
} from './arcade-boards';
import {
  ClassifierBoard,
  MatchBoard,
  SentenceRushBoard,
  TrueFalseBoard,
  type BoardProps,
  type TopBarExtra,
} from './boards';
import { gameName, isGameId } from './catalog';
import { GameResult } from './GameResult';
import { GameStage } from './GameStage';
import { useGameSource } from './useGameSource';

const BOARDS: Record<GameId, ComponentType<BoardProps>> = {
  match: MatchBoard,
  'true-false': TrueFalseBoard,
  'sentence-rush': SentenceRushBoard,
  'classifier-rush': ClassifierBoard,
};

const ARCADE_BOARDS: Record<ArcadeGameId, ComponentType<ArcadeBoardProps>> = {
  'whack-a-mole': WhackBoard,
  gameshow: GameshowBoard,
  airplane: AirplaneBoard,
  maze: MazeBoard,
};

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/**
 * `/games/:id` — màn chơi 8 trò (SCR-08 v2 §B–C, Focus layout, nền theo theme). Nguồn lấy từ
 * `?source=`, `?seed=` cố định lượt (E2E). Thoát giữa chừng: không hỏi, không lưu kỷ lục.
 */
export function GamePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useGameSource(params.get('source'));
  const { theme: savedTheme } = useGameTheme();
  const theme = savedTheme ?? DEFAULT_GAME_THEME;
  const reduced = useReducedMotion();
  const fixedSeed = params.get('seed');
  const [round, setRound] = useState(() => ({
    n: 0,
    seed: fixedSeed === null ? randomSeed() : Number(fixedSeed),
    only: null as GameItemRef[] | null,
  }));

  const exit = () => navigate('/games');
  const message = (text: string) => (
    <Panel className="flex flex-col items-start gap-3">
      <p>{text}</p>
      <Link to="/games" className="text-primary underline-offset-4 hover:underline">
        {t('games.back')}
      </Link>
    </Panel>
  );

  let content;
  if (!isGameId(id)) content = message(t('games.unavailable'));
  else if (state.status === 'loading')
    content = (
      <Panel>
        <p className="text-muted-foreground">{t('games.loading')}</p>
      </Panel>
    );
  else if (state.status === 'error') content = message(t('games.loadError'));
  else {
    const source = round.only ? subsetSource(state.source, round.only) : state.source;
    if (!gameAvailability(id, source).ok) content = message(t('games.unavailable'));
    else {
      const next = (only: GameItemRef[] | null) =>
        setRound((r) => ({ n: r.n + 1, seed: randomSeed(), only }));
      const result = (summary: GameSummary<AnyGameId>, detail: string | null) => (
        <Panel className="p-6">
          <GameResult
            gameId={id}
            summary={summary}
            source={state.source}
            detail={detail}
            canReplayMistakes={
              gameAvailability(id, subsetSource(state.source, summary.mistakes)).ok
            }
            onExit={exit}
            onAgain={() => next(null)}
            onAgainMistakes={(items) => next(items)}
            onChangeSource={() => navigate('/games?pick=1')}
            onPick={(g) =>
              navigate(`/games/${g}?source=${encodeURIComponent(state.source.key)}`, {
                replace: true,
              })
            }
          />
        </Panel>
      );
      const frame = {
        id,
        theme,
        exit,
        restart: () => next(round.only),
      };
      if (isArcadeGameId(id)) {
        const Board = ARCADE_BOARDS[id];
        content = (
          <Board
            key={`${id}-${round.n}`}
            source={source}
            seed={round.seed}
            theme={theme}
            reduced={reduced}
          >
            {(view, body, extra) =>
              view.state.status === 'finished' ? (
                result(view.summary(), view.detail())
              ) : (
                <PlayFrame
                  {...frame}
                  score={view.state.score}
                  combo={view.state.combo}
                  extra={extra}
                  sound={view.sound}
                  speech={id === 'whack-a-mole' ? undefined : view.speech}
                  paused={view.loop.paused}
                  onPause={view.loop.pause}
                  onResume={view.loop.resume}
                >
                  {body}
                </PlayFrame>
              )
            }
          </Board>
        );
      } else {
        const Board = BOARDS[id];
        content = (
          <Board key={`${id}-${round.n}`} source={source} seed={round.seed}>
            {(run, body, extra) => {
              const { state: s, clock } = run;
              if (s.status === 'finished') {
                return result(summarize(id, s, (s.finishedAt ?? s.startedAt) - s.startedAt), null);
              }
              return (
                <PlayFrame
                  {...frame}
                  score={extra.scoreValue ?? s.score}
                  combo={s.combo}
                  extra={{
                    ...extra,
                    timeMs: extra.lives ? undefined : (clock.remainingMs ?? clock.elapsedMs),
                  }}
                  clock={clock.remainingMs === null ? 'up' : 'down'}
                  sound={run.sound}
                  speech={id === 'match' ? undefined : run.speech}
                  paused={clock.paused}
                  onPause={clock.pause}
                  onResume={clock.resume}
                >
                  <Panel>{body}</Panel>
                </PlayFrame>
              );
            }}
          </Board>
        );
      }
    }
  }

  return (
    <section data-testid="page-game" data-game={isGameId(id) ? id : undefined}>
      <GameStage theme={theme}>{content}</GameStage>
    </section>
  );
}

/** Thanh trên + nội dung + lớp tạm dừng; âm nền chạy khi đang chơi (SCR-08 v2 §B.0). */
function PlayFrame({
  id,
  theme,
  exit,
  restart,
  score,
  combo,
  extra,
  clock = 'down',
  sound,
  speech,
  paused,
  onPause,
  onResume,
  children,
}: {
  id: AnyGameId;
  theme: GameTheme;
  exit: () => void;
  restart: () => void;
  score: number;
  combo: number;
  extra: TopBarExtra;
  clock?: 'down' | 'up';
  sound: FeedbackSound;
  speech: AutoSpeech | undefined;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  children: ReactNode;
}) {
  const music = useBackgroundMusic(theme, !paused);
  // Lượt chơi = một phiên học (thời gian học + chuỗi ngày, SCR-09 Q2 b).
  useStudySession('game');
  return (
    <div className="flex flex-col gap-6">
      <GameTopBar
        title={gameName(id)}
        timeMs={extra.timeMs}
        clock={clock}
        score={score}
        scoreLabel={extra.scoreLabel}
        combo={combo}
        lives={extra.lives}
        status={extra.status}
        onExit={exit}
        onPause={onPause}
        music={
          music.enabled === undefined
            ? undefined
            : { enabled: music.enabled, onToggle: music.toggle }
        }
        sound={
          sound.enabled === undefined
            ? undefined
            : { enabled: sound.enabled, onToggle: () => void sound.setEnabled(!sound.enabled) }
        }
        speech={
          !speech || speech.enabled === undefined
            ? undefined
            : {
                enabled: speech.enabled,
                disabled: !speech.available,
                onToggle: () => void speech.setEnabled(!speech.enabled),
              }
        }
      />
      {children}
      {paused && <PausedOverlay onResume={onResume} onRestart={restart} onExit={exit} />}
    </div>
  );
}
