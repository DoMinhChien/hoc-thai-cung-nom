import type { AudioProvider, VoiceStatus } from '@nom/core';
import { useEffect, useState } from 'react';
import { useAudio } from './useAudio';

/**
 * Thiết bị có giọng Thái không (plan 7.2) — `missing`/`unsupported` → UI hướng dẫn cài giọng.
 * `checking` khi đang hỏi; provider không báo được thì coi như `available`.
 */
export function useVoiceStatus(): VoiceStatus | 'checking' {
  const audio = useAudio();
  const [result, setResult] = useState<{ audio: AudioProvider; status: VoiceStatus }>();

  useEffect(() => {
    let active = true;
    void (audio.voiceStatus?.() ?? Promise.resolve<VoiceStatus>('available')).then((status) => {
      if (active) setResult({ audio, status });
    });
    return () => {
      active = false;
    };
  }, [audio]);

  return result?.audio === audio ? result.status : 'checking';
}
