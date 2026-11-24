import { Play, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import { Button } from '@/components/ui/button';
import { useRepositories } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { playBlob, stopPlayback } from './playback';
import { SpeakingPanel } from './SpeakingPanel';

interface Line {
  speaker: string;
  th: string;
  vi: string;
}

/**
 * "Nhập vai" ở bước Hội thoại (SCR-10 §2.3): chọn vai → app đọc lượt của vai kia, tới lượt mình thì
 * ghi âm (có "Nghe mẫu lượt này"); hết hội thoại → nghe lại cả đoạn (mẫu + bản ghi xen kẽ).
 */
export function RolePlay({
  lines,
  recordingKey,
  onExit,
}: {
  lines: readonly Line[];
  /** Tiền tố khóa bản ghi, vd. `dialogue:<lessonId>` → `dialogue:<lessonId>:<lượt>`. */
  recordingKey: string;
  onExit: () => void;
}) {
  const audio = useAudio();
  const repos = useRepositories();
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  const [role, setRole] = useState<string | null>(null);
  const [turn, setTurn] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const stopped = useRef(false);
  const keyOf = (i: number) => `${recordingKey}:${i}`;
  const done = role !== null && turn >= lines.length;
  const line = role === null ? undefined : lines[turn];
  const mine = line?.speaker === role;

  useEffect(() => {
    stopped.current = false;
    return () => {
      stopped.current = true;
      stopPlayback();
    };
  }, []);

  // Lượt của vai kia: app đọc rồi tự sang lượt sau.
  useEffect(() => {
    if (!line || mine) return;
    let cancelled = false;
    void audio
      .speak(line.th)
      .catch(() => {})
      .then(() => {
        if (cancelled || stopped.current) return;
        setTurn((n) => n + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [audio, line, mine, turn]);

  const replay = async () => {
    for (let i = 0; i < lines.length && !stopped.current; i++) {
      setPlaying(i);
      const rec = lines[i]!.speaker === role ? await repos?.recordings.get(keyOf(i)) : undefined;
      if (rec) await playBlob(new Blob([rec.audio], { type: rec.mimeType }));
      else await audio.speak(lines[i]!.th).catch(() => {});
    }
    setPlaying(null);
  };

  return (
    <section className="flex flex-col gap-4" data-testid="roleplay">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{t('speaking.roleplay')}</h2>
        <Button variant="ghost" size="sm" data-testid="roleplay-exit" onClick={onExit}>
          <X aria-hidden />
          {t('speaking.roleplayExit')}
        </Button>
      </div>
      {role === null ? (
        <div className="flex flex-col gap-3">
          <p>{t('speaking.roleplayPick')}</p>
          <div className="flex flex-wrap gap-2">
            {speakers.map((s) => (
              <Button
                key={s}
                variant="outline"
                data-testid={`roleplay-role-${s}`}
                onClick={() => setRole(s)}
              >
                {t('speaking.roleplayRole', { speaker: s })}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <ol className="flex flex-col gap-1" data-testid="roleplay-lines">
            {lines.slice(0, done ? lines.length : turn + 1).map((l, i) => (
              <li
                key={i}
                data-mine={l.speaker === role}
                aria-current={i === turn || playing === i ? 'true' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-md px-2 py-2',
                  (playing === i || (!done && i === turn)) && 'bg-secondary',
                  l.speaker === role && 'border-l-4 border-primary',
                )}
              >
                <span className="w-8 shrink-0 pt-1 text-sm text-muted-foreground">{l.speaker}</span>
                <span className="flex flex-col">
                  <span lang="th" className="text-[22px]">
                    {l.th}
                  </span>
                  <span className="text-muted-foreground">{l.vi}</span>
                </span>
              </li>
            ))}
          </ol>
          {!done && mine && line && (
            <div
              className="flex flex-col items-center gap-3 rounded-lg border p-4"
              data-testid="roleplay-turn"
            >
              <p className="font-medium">{t('speaking.roleplayYourTurn')}</p>
              <Button
                variant="secondary"
                size="sm"
                data-testid="roleplay-listen"
                onClick={() => void audio.speak(line.th).catch(() => {})}
              >
                <Volume2 aria-hidden />
                {t('speaking.roleplayListenTurn')}
              </Button>
              <SpeakingPanel
                key={keyOf(turn)}
                size="compact"
                target={{ key: keyOf(turn), text: line.th, accepted: [line.th], tokens: [] }}
              />
              <Button data-testid="roleplay-next" onClick={() => setTurn(turn + 1)}>
                {t('speaking.roleplayNext')}
              </Button>
            </div>
          )}
          {done && (
            <div className="flex flex-col items-start gap-3" data-testid="roleplay-done">
              <p>{t('speaking.roleplayDone')}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  data-testid="roleplay-replay"
                  disabled={playing !== null}
                  onClick={() => void replay()}
                >
                  <Play aria-hidden />
                  {t('speaking.roleplayReplay')}
                </Button>
                <Button
                  variant="outline"
                  data-testid="roleplay-again"
                  onClick={() => {
                    setRole(null);
                    setTurn(0);
                  }}
                >
                  {t('speaking.roleplayAgain')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
