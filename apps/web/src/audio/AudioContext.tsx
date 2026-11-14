import type { AudioProvider } from '@nom/core';
import type { ReactNode } from 'react';
import { AudioContext } from './audio-context';

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
