import type { SpeakOptions } from '@nom/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AudioContext } from './audio-context';
import { useAudio } from './useAudio';
import { useVoicePreferences, withVoicePreferences } from './voice-preferences';

/**
 * Áp Cài đặt giọng đọc cho cả cây component. Provider giữ nguyên danh tính khi cài đặt đổi
 * (không làm `useVoiceStatus` hỏi lại, không dựng lại phiên đang làm).
 */
export function VoicePreferencesBoundary({ children }: { children: ReactNode }) {
  const base = useAudio();
  const { voice, rate } = useVoicePreferences();
  // Hộp giữ cài đặt mới nhất: provider đọc lúc đọc, không cần tạo lại.
  const [latest] = useState(() => new Map<'opts', SpeakOptions>());
  useEffect(() => {
    latest.set('opts', {
      ...(voice ? { voice } : {}),
      ...(typeof rate === 'number' ? { rate } : {}),
    });
  }, [latest, voice, rate]);
  const provider = useMemo(
    () => withVoicePreferences(base, () => latest.get('opts') ?? {}),
    [base, latest],
  );
  return <AudioContext value={provider}>{children}</AudioContext>;
}
