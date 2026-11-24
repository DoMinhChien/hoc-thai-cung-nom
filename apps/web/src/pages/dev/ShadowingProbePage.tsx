import { rankThaiVoices, type UnitBundle } from '@nom/core';
import { Mic, Pause, Play, Repeat, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AUTO_VOICE, useVoicePreferences } from '@/audio/voice-preferences';
import { THAI_LANG } from '@/audio/web-speech-provider';
import { Button } from '@/components/ui/button';
import { useUnit } from '@/content/hooks';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { probeChunks, type ProbeChunk } from '@/speaking/shadowing-probe';
import { pickMimeType, recorderSupported } from '@/speaking/useRecorder';

/**
 * M12.10 bước A (SCR-11 §5) — trang thử khả thi shadowing, KHÔNG phải màn thật: một hội thoại cố định
 * + một chuỗi câu, đọc từng cụm bằng giọng máy, ghi âm khi đang đọc (bậc 5) và ghi log để owner thử
 * trên iPhone. Gọi `speechSynthesis` trực tiếp (không qua `AudioProvider`) để đo `onboundary` /
 * thời gian thật từng cụm. Bước B thay bằng `packages/core/src/speaking/shadowing.ts`.
 */
const UNIT_ID = 'b09';
const DIALOGUE_ID = 'd-b09-l1';
const LESSON_ID = 'b09-l1';
const SPEEDS = [0.6, 0.8, 1] as const;
/** Khoảng dừng sau mỗi cụm; `auto` = bậc 3: thời lượng cụm × 1,2, tối thiểu 1,5 s. */
const GAPS = ['0', '1', '2', 'auto'] as const;
type Gap = (typeof GAPS)[number];

function sourceChunks(bundle: UnitBundle, kind: 'dialogue' | 'sentences'): ProbeChunk[] {
  if (kind === 'dialogue')
    return probeChunks(bundle.dialogues.find((d) => d.id === DIALOGUE_ID)?.lines ?? []);
  return probeChunks(
    bundle.sentences
      .filter((s) => s.lesson_id === LESSON_ID && s.th)
      .slice(0, 8)
      .map((s) => ({ th: s.th!, vi: s.vi, tokens: s.tokens })),
  );
}

interface Timing {
  index: number;
  /** ms tính từ lúc bắt đầu ghi âm. */
  start: number;
  end: number;
}

interface Take {
  url: string;
  mimeType: string;
  echoCancellation: boolean;
  timings: Timing[];
}

const now = () => performance.now();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true;

export function ShadowingProbePage() {
  const unit = useUnit(UNIT_ID);
  const { voice: voicePref } = useVoicePreferences();
  const [kind, setKind] = useState<'dialogue' | 'sentences'>('dialogue');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(0.8);
  const [gap, setGap] = useState<Gap>('0');
  const [showText, setShowText] = useState(true);
  const [repeat, setRepeat] = useState(false);
  const [recording, setRecording] = useState<boolean | null>(null);
  const [take, setTake] = useState<Take | null>(null);
  const [log, setLog] = useState<string[]>(() => [
    `UA: ${navigator.userAgent}`,
    `standalone (MH chính): ${isStandalone()}`,
    `speechSynthesis: ${typeof speechSynthesis !== 'undefined'} · MediaRecorder: ${recorderSupported()} · MIME: ${pickMimeType() ?? '—'}`,
  ]);
  const runId = useRef(0);
  const t0 = useRef(now());
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  // Giá trị mới nhất cho vòng phát đang chạy (đổi tốc độ / lặp cụm giữa chừng).
  const live = useRef({ rate, gap, repeat });
  useEffect(() => {
    live.current = { rate, gap, repeat };
  });

  const chunks = unit.status === 'ready' ? sourceChunks(unit.data, kind) : [];
  const synth = typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis;

  const addLog = (line: string) =>
    setLog((l) => [...l, `${((now() - t0.current) / 1000).toFixed(2)}s ${line}`]);

  useEffect(() => {
    const load = () => {
      voices.current = rankThaiVoices(
        (synth?.getVoices() ?? []).filter((v) => v.lang.replace('_', '-').startsWith('th')),
      );
    };
    load();
    synth?.addEventListener('voiceschanged', load);
    const run = runId;
    return () => {
      synth?.removeEventListener('voiceschanged', load);
      run.current++;
      synth?.cancel();
    };
  }, [synth]);

  const pickVoice = () =>
    voices.current.find((v) => v.name === voicePref && voicePref !== AUTO_VOICE) ??
    voices.current[0];

  /** Đọc một cụm; trả thời gian thật + số lần `onboundary`. Treo quá lâu → huỷ, ghi `timeout`. */
  const speakChunk = (text: string, r: number) =>
    new Promise<{ ms: number; boundaries: number; result: string }>((resolve) => {
      if (!synth) return resolve({ ms: 0, boundaries: 0, result: 'no-synth' });
      const u = new SpeechSynthesisUtterance(text);
      u.lang = THAI_LANG;
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = r;
      let boundaries = 0;
      let started = 0;
      const begin = now();
      const finish = (result: string) => {
        clearTimeout(timer);
        resolve({ ms: Math.round(now() - (started || begin)), boundaries, result });
      };
      const timer = setTimeout(
        () => {
          synth.cancel();
          finish('timeout');
        },
        3000 + (text.length * 350) / r,
      );
      u.onstart = () => (started = now());
      u.onboundary = () => boundaries++;
      u.onend = () => finish(started ? 'end' : 'end-no-start');
      u.onerror = (e) => finish(`error:${e.error}`);
      synth.speak(u);
    });

  /** Phát từ cụm `from`; `onChunk` cho bậc 5 ghi mốc thời gian. Trả `false` nếu bị dừng giữa chừng. */
  const run = async (from: number, onChunk?: (i: number, start: number, end: number) => void) => {
    const id = ++runId.current;
    setPlaying(true);
    addLog(`giọng: ${pickVoice()?.name ?? 'mặc định của máy'}`);
    let i = from;
    while (i < chunks.length && runId.current === id) {
      setIndex(i);
      const chunk = chunks[i]!;
      const r = live.current.rate;
      const start = now();
      const res = await speakChunk(chunk.th, r);
      if (runId.current !== id) break;
      onChunk?.(i, start, now());
      addLog(
        `#${i + 1} ×${r} ${res.ms}ms (${Math.round(res.ms / chunk.th.length)}ms/ký tự) boundary=${res.boundaries} ${res.result}`,
      );
      const g = live.current.gap;
      const pause = g === 'auto' ? Math.max(1500, res.ms * 1.2) : Number(g) * 1000;
      if (pause) await wait(pause);
      if (!live.current.repeat) i++;
    }
    const finished = runId.current === id;
    if (finished) setPlaying(false);
    return finished;
  };

  const stop = () => {
    runId.current++;
    synth?.cancel();
    setPlaying(false);
  };

  const togglePlay = () => {
    if (playing) return stop();
    void run(index >= chunks.length - 1 ? 0 : index);
  };

  /** Bậc 5: vừa phát giọng máy vừa ghi âm (echoCancellation bật / tắt để so). */
  const recordTake = async (echoCancellation: boolean) => {
    stop();
    // iOS chỉ cho đọc khi có thao tác chạm → "mở khoá" ngay trong sự kiện chạm, trước `await`.
    synth?.speak(new SpeechSynthesisUtterance(''));
    setTake((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation } });
    } catch (e) {
      addLog(`getUserMedia lỗi: ${(e as Error).name}`);
      return;
    }
    const track = stream.getAudioTracks()[0];
    addLog(
      `mic mở · echoCancellation yêu cầu=${echoCancellation} thực=${String(track?.getSettings().echoCancellation)}`,
    );
    const mime = pickMimeType();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const parts: Blob[] = [];
    const timings: Timing[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && parts.push(e.data);
    const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.start();
    const recStart = now();
    setRecording(echoCancellation);
    await run(0, (i, start, end) =>
      timings.push({ index: i, start: start - recStart, end: end - recStart }),
    );
    if (rec.state === 'recording') rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
    setRecording(null);
    const type = rec.mimeType || mime || 'audio/webm';
    const blob = new Blob(parts, { type });
    addLog(`bản ghi ${type} ${Math.round(blob.size / 1024)}KB ${timings.length} cụm`);
    setTake({ url: URL.createObjectURL(blob), mimeType: type, echoCancellation, timings });
  };

  /** Phát đoạn [start, end] của bản ghi. */
  const playSegment = (url: string, start: number, end: number) =>
    new Promise<void>((resolve) => {
      const audio = new Audio(url);
      const done = () => {
        audio.pause();
        resolve();
      };
      audio.onloadedmetadata = () => {
        audio.currentTime = start / 1000;
        audio.play().then(() => setTimeout(done, end - start + 300), done);
      };
      audio.onerror = () => {
        addLog('phát bản ghi lỗi');
        done();
      };
    });

  const replayAlternating = async () => {
    if (!take) return;
    const id = ++runId.current;
    setPlaying(true);
    for (const { index: i, start, end } of take.timings) {
      if (runId.current !== id) return;
      setIndex(i);
      await speakChunk(chunks[i]!.th, live.current.rate);
      if (runId.current !== id) return;
      await playSegment(take.url, start, end);
    }
    setPlaying(false);
  };

  const replayMine = () => {
    if (!take) return;
    const audio = new Audio(take.url);
    audio.play().catch(() => addLog('phát bản ghi lỗi'));
  };

  return (
    <div data-testid="page-dev-shadowing" className="flex flex-col gap-6 pb-32">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t('pages.devShadowing')}</h1>
        <p className="text-muted-foreground">{t('devShadowing.intro')}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('devShadowing.source')}>
        {(['dialogue', 'sentences'] as const).map((k) => (
          <Button
            key={k}
            variant={kind === k ? 'default' : 'outline'}
            aria-pressed={kind === k}
            data-testid={`shadow-source-${k}`}
            onClick={() => {
              stop();
              setKind(k);
              setIndex(0);
            }}
          >
            {t(`devShadowing.${k}`)}
          </Button>
        ))}
      </div>

      {unit.status !== 'ready' ? (
        <p role="status">{t('devShadowing.loading')}</p>
      ) : (
        <ol className="flex flex-col gap-2" data-testid="shadow-chunks">
          {chunks.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                data-testid="shadow-chunk"
                data-active={i === index}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => setIndex(i)}
                className={cn(
                  'flex min-h-12 w-full flex-col items-start rounded-lg border px-3 py-2 text-left',
                  i === index ? 'border-primary bg-primary/10' : 'border-border',
                )}
              >
                {c.speaker && <span className="text-xs text-muted-foreground">{c.speaker}</span>}
                {showText ? (
                  <span lang="th" className="text-[22px]">
                    {c.th}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t('devShadowing.hidden', { n: i + 1 })}
                  </span>
                )}
                {showText && c.vi && <span className="text-sm text-muted-foreground">{c.vi}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}

      <section className="flex flex-col gap-3 border-t pt-4">
        <h2 className="font-semibold">{t('devShadowing.level5')}</h2>
        <p className="text-sm text-muted-foreground">{t('devShadowing.level5Hint')}</p>
        <div className="flex flex-wrap gap-2">
          {[true, false].map((ec) => (
            <Button
              key={String(ec)}
              size="lg"
              variant="outline"
              data-testid={`shadow-record-ec-${ec ? 'on' : 'off'}`}
              disabled={recording !== null || unit.status !== 'ready'}
              onClick={() => void recordTake(ec)}
            >
              <Mic aria-hidden />
              {t(ec ? 'devShadowing.recordEcOn' : 'devShadowing.recordEcOff')}
            </Button>
          ))}
        </div>
        {recording !== null && (
          <p role="status" data-testid="shadow-recording">
            {t('devShadowing.recording')}
          </p>
        )}
        {take && (
          <div className="flex flex-wrap gap-2" data-testid="shadow-take">
            <Button
              size="lg"
              data-testid="shadow-replay-alt"
              onClick={() => void replayAlternating()}
            >
              {t('devShadowing.replayAlternating')}
            </Button>
            <Button size="lg" variant="outline" onClick={replayMine}>
              {t('devShadowing.replayMine')}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t pt-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t('devShadowing.log')}</h2>
          <Button
            variant="outline"
            onClick={() => void navigator.clipboard?.writeText(log.join('\n'))}
          >
            {t('devShadowing.copyLog')}
          </Button>
        </div>
        <pre
          data-testid="shadow-log"
          className="max-h-64 overflow-auto rounded-lg border bg-muted p-3 text-xs whitespace-pre-wrap"
        >
          {log.join('\n')}
        </pre>
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-2 border-t bg-surface px-4 py-3"
        data-testid="shadow-controls"
      >
        <Button
          size="lg"
          className="min-h-12 min-w-12"
          data-testid="shadow-play"
          aria-label={t(playing ? 'devShadowing.pause' : 'devShadowing.play')}
          disabled={unit.status !== 'ready' || recording !== null}
          onClick={togglePlay}
        >
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Button>
        <Button
          size="lg"
          className="min-h-12"
          variant={repeat ? 'default' : 'outline'}
          aria-pressed={repeat}
          data-testid="shadow-repeat"
          onClick={() => setRepeat((r) => !r)}
        >
          <Repeat aria-hidden />
          {t('devShadowing.repeat')}
        </Button>
        <Select
          label={t('devShadowing.speed')}
          value={String(rate)}
          options={SPEEDS.map(String)}
          onChange={(v) => setRate(Number(v))}
          testId="shadow-speed"
        />
        <Select
          label={t('devShadowing.gap')}
          value={gap}
          options={[...GAPS]}
          format={(v) => (v === 'auto' ? t('devShadowing.gapAuto') : `${v} s`)}
          onChange={(v) => setGap(v as Gap)}
          testId="shadow-gap"
        />
        <Button
          size="lg"
          className="min-h-12"
          variant={showText ? 'outline' : 'default'}
          aria-pressed={!showText}
          data-testid="shadow-text"
          onClick={() => setShowText((s) => !s)}
        >
          Aa
        </Button>
        {playing && (
          <Button size="lg" className="min-h-12" variant="outline" onClick={stop}>
            <Square aria-hidden />
            {t('devShadowing.stop')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  format = (v) => v,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  options: string[];
  format?: (v: string) => string;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <label className="flex items-center gap-1 text-sm">
      {label}
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 rounded-lg border border-border-strong bg-surface px-2 text-base"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </label>
  );
}
