import { MockAudioProvider, type AudioProvider } from '@nom/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { NomDatabase } from '@/data/db';
import { createDexieRepositories } from '@/data/dexie-repositories';
import { RepositoriesContext } from '@/data/repositories-context';
import { AudioProviderBoundary } from './AudioContext';
import { useAudio } from './useAudio';
import {
  SPEECH_RATE_KEY,
  SPEECH_VOICE_KEY,
  useVoicePreferences,
  withVoicePreferences,
} from './voice-preferences';
import { VoicePreferencesBoundary } from './VoicePreferencesBoundary';

describe('withVoicePreferences', () => {
  it('thêm giọng/tốc độ đã chọn; tùy chọn truyền trực tiếp thắng; không có gì → speak(text)', async () => {
    const base = new MockAudioProvider();
    let prefs = {};
    const audio = withVoicePreferences(base, () => prefs);
    await audio.speak('ดี');
    prefs = { voice: 'Kanya', rate: 0.8 };
    await audio.speak('ดี');
    await audio.speak('ดี', { rate: 1.1 });
    expect(base.calls).toEqual([
      { kind: 'speak', text: 'ดี' },
      { kind: 'speak', text: 'ดี', opts: { voice: 'Kanya', rate: 0.8 } },
      { kind: 'speak', text: 'ดี', opts: { voice: 'Kanya', rate: 1.1 } },
    ]);
    await audio.playById?.('x');
    expect(await audio.voiceStatus?.()).toBe('available');
    expect(await audio.thaiVoices?.()).toEqual([]);
  });

  it('provider không có hàm tùy chọn → bản bọc cũng không có', () => {
    const audio = withVoicePreferences({ speak: async () => {} }, () => ({}));
    expect(audio.playById).toBeUndefined();
    expect(audio.voiceStatus).toBeUndefined();
    expect(audio.thaiVoices).toBeUndefined();
  });
});

describe('VoicePreferencesBoundary (T9.5.2)', () => {
  it('đọc bằng giọng/tốc độ trong Cài đặt; provider giữ nguyên khi cài đặt đổi', async () => {
    const db = new NomDatabase('voice-prefs');
    const repos = createDexieRepositories(db);
    const base = new MockAudioProvider();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RepositoriesContext.Provider value={repos}>
        <AudioProviderBoundary provider={base}>
          <VoicePreferencesBoundary>{children}</VoicePreferencesBoundary>
        </AudioProviderBoundary>
      </RepositoriesContext.Provider>
    );
    const { result } = renderHook(() => ({ audio: useAudio(), prefs: useVoicePreferences() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.prefs.voice).toBe(''));
    expect(result.current.prefs.rate).toBeNull();
    const first: AudioProvider = result.current.audio;

    await act(() => result.current.prefs.setVoice('Kanya'));
    await act(() => result.current.prefs.setRate(0.8));
    await waitFor(() => expect(result.current.prefs.rate).toBe(0.8));
    expect(await repos.settings.get(SPEECH_VOICE_KEY, '')).toBe('Kanya');
    expect(await repos.settings.get(SPEECH_RATE_KEY, 1)).toBe(0.8);
    expect(result.current.audio).toBe(first);
    await result.current.audio.speak('ดี');
    expect(base.calls.at(-1)).toEqual({
      kind: 'speak',
      text: 'ดี',
      opts: { voice: 'Kanya', rate: 0.8 },
    });
    db.close();
    await NomDatabase.delete('voice-prefs');
  });

  it('chưa có repository: ghi không lỗi, đọc không kèm tùy chọn', async () => {
    const base = new MockAudioProvider();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AudioProviderBoundary provider={base}>
        <VoicePreferencesBoundary>{children}</VoicePreferencesBoundary>
      </AudioProviderBoundary>
    );
    const { result } = renderHook(() => ({ audio: useAudio(), prefs: useVoicePreferences() }), {
      wrapper,
    });
    await act(() => result.current.prefs.setVoice('Kanya'));
    await act(() => result.current.prefs.setRate(1));
    await result.current.audio.speak('ดี');
    expect(base.calls).toEqual([{ kind: 'speak', text: 'ดี' }]);
  });
});
