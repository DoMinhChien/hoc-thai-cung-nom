import type { AudioProvider } from '@nom/core';
import { createContext, useContext, type ReactNode } from 'react';

const AudioContext = createContext<AudioProvider | null>(null);

/** Cung cấp AudioProvider cho cây component. Test truyền `MockAudioProvider`. */
export function AudioProviderBoundary({
  provider,
  children,
}: {
  provider: AudioProvider;
  children: ReactNode;
}) {
  return <AudioContext value={provider}>{children}</AudioContext>;
}

export function useAudio(): AudioProvider {
  const provider = useContext(AudioContext);
  if (!provider) throw new Error('useAudio() phải nằm trong <AudioProviderBoundary>');
  return provider;
}
