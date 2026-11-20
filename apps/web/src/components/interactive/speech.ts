import { useCallback, useEffect, useRef } from 'react';
import { useAudio } from '@/audio/useAudio';
import { useVoiceStatus } from '@/audio/useVoiceStatus';
import { useRepositories, useRepositoryQuery } from '@/data';
import { FEEDBACK_SPEECH_DELAY_MS } from './feedback-sound';

/** Cài đặt tự đọc chữ Thái khi hiện câu trong trò chơi (v7.3) — mặc định bật. */
export const AUTO_SPEAK_KEY = 'gameAutoSpeak';

export interface AutoSpeech {
  /** `undefined` khi đang tải cài đặt. */
  enabled: boolean | undefined;
  /** Máy không có giọng Thái → không đọc được (nút vô hiệu, trò vẫn chơi được — SCR-08). */
  available: boolean;
  setEnabled(enabled: boolean): Promise<void>;
}

export function useAutoSpeech(): AutoSpeech {
  const repos = useRepositories();
  const enabled = useRepositoryQuery((r) => r.settings.get(AUTO_SPEAK_KEY, true), []);
  const status = useVoiceStatus();
  const setEnabled = useCallback(
    async (value: boolean) => {
      await repos?.settings.set(AUTO_SPEAK_KEY, value);
    },
    [repos],
  );
  return { enabled, available: status === 'available', setEnabled };
}

/**
 * Đọc `text` (tiếng Thái) qua `AudioProvider` mỗi khi `cue` đổi (câu mới), nếu được bật.
 * Lỗi phát âm bỏ qua — trò vẫn chơi được.
 */
export function useSpeakOnCue(text: string | null, cue: unknown, speech: AutoSpeech) {
  const audio = useAudio();
  const on = speech.enabled === true && speech.available;
  useEffect(() => {
    if (!on || !text) return;
    void audio.speak(text).catch(() => {});
    // Chỉ đọc khi sang câu mới, không đọc lại khi text giữ nguyên.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, on, audio]);
}

export interface FeedbackPauseOptions {
  /** Đang ở màn phản hồi. */
  active: boolean;
  /** Câu tiếng Thái đọc lại trong lúc dừng (vd. câu vừa xếp đúng); `null` = không đọc. */
  speakText: string | null;
  speech: AutoSpeech;
  /** Dừng ít nhất chừng này (ms) dù không đọc. */
  minMs: number;
  onDone: () => void;
}

/**
 * Dừng ở màn phản hồi rồi gọi `onDone`: nếu có `speakText` và đang bật tự đọc thì đọc lại câu,
 * chờ đọc xong (và đủ `minMs`) mới sang câu tiếp — người học nghe lại câu vừa làm đúng.
 */
export function useFeedbackPause({
  active,
  speakText,
  speech,
  minMs,
  onDone,
}: FeedbackPauseOptions) {
  const audio = useAudio();
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const on = speech.enabled === true && speech.available;
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const wait = new Promise<void>((resolve) => window.setTimeout(resolve, minMs));
    // Âm phản hồi phát trước, đọc sau một nhịp (không chồng nhau).
    const said =
      on && speakText
        ? new Promise((resolve) => window.setTimeout(resolve, FEEDBACK_SPEECH_DELAY_MS)).then(() =>
            cancelled ? undefined : audio.speak(speakText).catch(() => {}),
          )
        : Promise.resolve();
    void Promise.all([wait, said]).then(() => {
      if (!cancelled) done.current();
    });
    return () => {
      cancelled = true;
    };
  }, [active, speakText, on, minMs, audio]);
}
