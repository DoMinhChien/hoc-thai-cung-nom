import { useCallback, useEffect, useRef, useState } from 'react';

/** Tự dừng ghi sau ngần này ms (SCR-10 §3). */
export const MAX_RECORDING_MS = 10_000;

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'done'
  /** Người học / trình duyệt từ chối micro. */
  | 'denied'
  /** Không có `MediaRecorder` / `getUserMedia` hoặc không có micro. */
  | 'unsupported';

export interface Recording {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

/** `audio/mp4` (Safari iOS) nếu được, không thì `audio/webm` (Chrome, Firefox); không rõ → mặc định. */
export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

export const recorderSupported = () =>
  typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

/**
 * Ghi âm trên máy (SCR-10 Mức 1): `getUserMedia` + `MediaRecorder`; chạm bắt đầu / dừng, tự dừng
 * sau 10 s; tắt micro ngay khi dừng. Bản ghi không rời máy.
 */
export function useRecorder(onDone?: (recording: Recording) => void) {
  const [status, setStatus] = useState<RecorderStatus>(() =>
    recorderSupported() ? 'idle' : 'unsupported',
  );
  const [recording, setRecording] = useState<Recording | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (!recorderSupported()) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as { name?: string }).name;
      setStatus(
        name === 'NotFoundError' || name === 'NotSupportedError' ? 'unsupported' : 'denied',
      );
      return;
    }
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = rec.mimeType || mimeType || 'audio/webm';
      const result = {
        blob: new Blob(chunks, { type }),
        mimeType: type,
        durationMs: Date.now() - startedAt,
      };
      recorder.current = null;
      setRecording(result);
      setStatus('done');
      doneRef.current?.(result);
    };
    recorder.current = rec;
    rec.start();
    setStatus('recording');
    timer.current = setTimeout(stop, MAX_RECORDING_MS);
  }, [stop]);

  /** Bỏ bản ghi hiện tại (mục mới). */
  const reset = useCallback(() => {
    stop();
    setRecording(null);
    setStatus((s) => (s === 'unsupported' || s === 'denied' ? s : 'idle'));
  }, [stop]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      const rec = recorder.current;
      if (rec?.state === 'recording') {
        rec.onstop = null;
        rec.stop();
        rec.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  return { status, recording, start, stop, reset, setRecording };
}
