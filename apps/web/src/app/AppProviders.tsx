import {
  MockAudioProvider,
  type AudioProvider,
  type AuthService,
  type Repositories,
} from '@nom/core';
import { useState, type ReactNode } from 'react';
import { AudioProviderBoundary } from '@/audio/AudioContext';
import { AuthProvider } from '@/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RepositoriesProvider } from '@/data/RepositoriesProvider';

/**
 * Provider dùng chung cho app và test (test truyền `MockAuthService`, có thể kèm repository
 * bộ nhớ qua `repositories`). App truyền `WebSpeechProvider`; không truyền `audio` → mock (test).
 */
export function AppProviders({
  authService,
  repositories,
  audio,
  children,
}: {
  authService: AuthService;
  repositories?: Repositories;
  audio?: AudioProvider;
  children: ReactNode;
}) {
  const [fallbackAudio] = useState(() => new MockAudioProvider());
  return (
    <AuthProvider service={authService}>
      <RepositoriesProvider override={repositories}>
        <AudioProviderBoundary provider={audio ?? fallbackAudio}>
          <TooltipProvider>
            {children}
            {/* SCR-00: góc dưới phải, tự ẩn sau 4s, tối đa 3 cái. */}
            <Toaster position="bottom-right" duration={4000} visibleToasts={3} />
          </TooltipProvider>
        </AudioProviderBoundary>
      </RepositoriesProvider>
    </AuthProvider>
  );
}
