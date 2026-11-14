import type { AudioProvider } from '@nom/core';
import { useContext } from 'react';
import { AudioContext } from './audio-context';

export function useAudio(): AudioProvider {
  const provider = useContext(AudioContext);
  if (!provider) throw new Error('useAudio() phải nằm trong <AudioProviderBoundary>');
  return provider;
}
