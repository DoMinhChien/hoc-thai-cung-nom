import type { AudioProvider } from '@nom/core';
import { createContext } from 'react';

export const AudioContext = createContext<AudioProvider | null>(null);
