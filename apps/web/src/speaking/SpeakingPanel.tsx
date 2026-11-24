import { matchSpeech, newId, type SpeechMatch, type SpeechTarget } from '@nom/core';
import { Mic, Play, Repeat, RotateCcw, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio/useAudio';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRepositories, useRepositoryQuery } from '@/data';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { playBlob, stopPlayback } from './playback';
import { recognitionSupported, startRecognition, type RecognitionSession } from './recognition';
import { useSpeakingSettings } from './settings';
import { useRecorder, type Recording } from './useRecorder';

/** Mục để nói theo: `key` lưu bản ghi mới nhất (`word:<id>`, `sentence:<id>`, …). */
export interface SpeakTarget extends SpeechTarget {
  key: string;
  /** Chữ Thái mẫu (đọc bằng giọng mẫu). */
  text: string;
}

/** Chờ kết quả nhận dạng sau khi dừng ghi tối đa ngần này ms. */
const RECOGNITION_WAIT_MS = 4000;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1;

/**
 * Ghi âm – nghe lại – so với mẫu (SCR-10 §3 bước 3–5): Mức 1 trên máy; Mức 2 (nhận dạng của trình
 * duyệt) chạy song song khi được bật và thiết bị hỗ trợ. `size="large"` cho phiên luyện nói, `compact`
 * cho nút "Nói theo" trong bài học. Đổi mục → đổi `key` của panel.
 */
export function SpeakingPanel({
  target,
  size = 'large',
  onAttempt,
}: {
  target: SpeakTarget;
  size?: 'large' | 'compact';
  /** Sau mỗi lần ghi xong: tỉ lệ thẻ máy nghe được, `null` khi không dùng Mức 2. */
  onAttempt?: (attempt: { asrRatio: number | null }) => void;
}) {
  const audio = useAudio();
  const repos = useRepositories();
  const settings = useSpeakingSettings();
  const recognition = useRef<RecognitionSession | null>(null);
  const [match, setMatch] = useState<SpeechMatch | null | undefined>(undefined);
  const [dialog, setDialog] = useState<'mic' | 'asr' | null>(null);
  const [playing, setPlaying] = useState(false);
  const saved = useRepositoryQuery((r) => r.recordings.get(target.key), [target.key]);
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  });

  const onDone = async (recording: Recording) => {
    const session = recognition.current;
    recognition.current = null;
    let asrRatio: number | null = null;
    if (session) {
      session.stop();
      const heard = await Promise.race([
        session.result,
        new Promise<null>((r) => setTimeout(() => r(null), RECOGNITION_WAIT_MS)),
      ]);
      if (heard) {
        const m = matchSpeech(heard, targetRef.current);
        setMatch(m);
        asrRatio = m?.ratio ?? 0;
      }
    }
    if (repos) {
      const ts = new Date().toISOString();
      void repos.recordings.put({
        id: newId(),
        key: targetRef.current.key,
        audio: await recording.blob.arrayBuffer(),
        mimeType: recording.mimeType,
        durationMs: recording.durationMs,
        createdAt: ts,
        updatedAt: ts,
      });
    }
    onAttempt?.({ asrRatio });
  };
  const recorder = useRecorder((r) => void onDone(r));
  // Mục mới → nơi dùng đổi `key` (gắn lại panel); rời mục thì dừng phát.
  useEffect(() => stopPlayback, []);

  const asrAvailable = recognitionSupported();
  const begin = (asr: boolean) => {
    setMatch(undefined);
    void recorder.start();
    recognition.current = asr && asrAvailable ? startRecognition() : null;
  };
  const onRecord = () => {
    if (recorder.status === 'recording') {
      recorder.stop();
      return;
    }
    if (settings.micIntroSeen === false) setDialog('mic');
    else if (asrAvailable && settings.asr === null) setDialog('asr');
    else begin(settings.asr === true);
  };

  const mine: Blob | null = recorder.recording
    ? recorder.recording.blob
    : saved
      ? new Blob([saved.audio], { type: saved.mimeType })
      : null;
  const play = async (what: 'mine' | 'model' | 'alternate') => {
    setPlaying(true);
    try {
      if (what !== 'mine') await audio.speak(target.text).catch(() => {});
      if (what !== 'model' && mine) await playBlob(mine);
    } finally {
      setPlaying(false);
    }
  };

  const recording = recorder.status === 'recording';
  const busy = recorder.status === 'requesting';
  const large = size === 'large';
  return (
    <div
      className={cn('flex flex-col items-center gap-3', large ? 'gap-4' : 'gap-2')}
      data-testid="speaking-panel"
    >
      {recorder.status === 'denied' && (
        <div
          role="alert"
          data-testid="speaking-denied"
          className="flex flex-col gap-1 rounded-lg bg-caution-subtle p-3 text-sm"
        >
          <p className="font-medium">{t('speaking.micDenied')}</p>
          <p>{isIos() ? t('speaking.micDeniedIos') : t('speaking.micDeniedOther')}</p>
        </div>
      )}
      {recorder.status === 'unsupported' && (
        <p
          role="status"
          data-testid="speaking-unsupported"
          className="rounded-lg bg-muted p-3 text-sm"
        >
          {t('speaking.unsupported')}
        </p>
      )}

      {recorder.status !== 'unsupported' && (
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            data-testid="speaking-record"
            data-status={recorder.status}
            aria-pressed={recording}
            aria-label={recording ? t('speaking.stop') : t('speaking.record')}
            disabled={busy}
            onClick={onRecord}
            className={cn(
              'relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60',
              large ? 'size-20' : 'size-12',
              recording
                ? 'bg-destructive text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover',
            )}
          >
            {recording && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-destructive/40 motion-safe:animate-ping"
              />
            )}
            {recording ? (
              <Square className={large ? 'size-8' : 'size-5'} aria-hidden />
            ) : (
              <Mic className={large ? 'size-9' : 'size-6'} aria-hidden />
            )}
          </button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {recording ? t('speaking.recording') : t('speaking.recordHint')}
          </span>
        </div>
      )}

      {mine && !recording && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="speaking-mine"
            disabled={playing}
            onClick={() => void play('mine')}
          >
            <Play aria-hidden />
            {t('speaking.mine')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="speaking-model"
            disabled={playing}
            onClick={() => void play('model')}
          >
            <Volume2 aria-hidden />
            {t('speaking.model')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="speaking-alternate"
            disabled={playing}
            onClick={() => void play('alternate')}
          >
            <Repeat aria-hidden />
            {t('speaking.alternate')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid="speaking-redo"
            disabled={playing}
            onClick={() => begin(settings.asr === true)}
          >
            <RotateCcw aria-hidden />
            {t('speaking.redo')}
          </Button>
        </div>
      )}

      {match !== undefined && !recording && <AsrResult match={match} />}

      <AlertDialog open={dialog === 'mic'} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent data-testid="mic-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('speaking.micTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('speaking.micBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('speaking.micLater')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="mic-allow"
              onClick={() => {
                void settings.setMicIntroSeen();
                if (asrAvailable && settings.asr === null) {
                  // Hộp thoại kế tiếp mở sau khi hộp này đóng xong.
                  setTimeout(() => setDialog('asr'));
                } else begin(settings.asr === true);
              }}
            >
              {t('speaking.micAllow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'asr'} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent data-testid="asr-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('speaking.asrTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('speaking.asrBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="asr-off"
              onClick={() => {
                void settings.setAsr(false);
                begin(false);
              }}
            >
              {t('speaking.asrOff')}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="asr-on"
              onClick={() => {
                void settings.setAsr(true);
                begin(true);
              }}
            >
              {t('speaking.asrOn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Mức 2: "Máy nghe được: …" + câu mẫu tô theo thẻ (SCR-10 §3 bước 5). Không hiện điểm %. */
function AsrResult({ match }: { match: SpeechMatch | null }) {
  return (
    <div
      data-testid="speaking-asr"
      className="flex w-full max-w-md flex-col gap-2 rounded-lg border bg-surface p-3 text-sm"
    >
      {match === null ? (
        <p>{t('speaking.heardNothing')}</p>
      ) : (
        <>
          <p>
            {t('speaking.heard')}{' '}
            <span lang="th" className="text-th-sm" data-testid="speaking-heard">
              {match.heard}
            </span>
          </p>
          <p lang="th" className="flex flex-wrap gap-x-1 text-th-md">
            {match.tokens.map((token, i) => (
              <span
                key={i}
                data-testid="speaking-asr-token"
                data-matched={match.matched[i]}
                className={cn(
                  match.matched[i]
                    ? 'text-positive'
                    : 'text-muted-foreground underline decoration-dotted underline-offset-4',
                )}
              >
                {token}
                {match.matched[i] && <span aria-hidden>✓</span>}
                <span className="sr-only">
                  {' '}
                  ({match.matched[i] ? t('speaking.tokenHeard') : t('speaking.tokenMissed')})
                </span>
              </span>
            ))}
          </p>
          {match.ratio === 1 && (
            <p className="font-medium text-positive" data-testid="speaking-heard-all">
              {t('speaking.heardAll')}
            </p>
          )}
        </>
      )}
      <p className="text-xs text-muted-foreground">{t('speaking.heardNote')}</p>
    </div>
  );
}
