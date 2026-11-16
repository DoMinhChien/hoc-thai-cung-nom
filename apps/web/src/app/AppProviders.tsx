import type { AuthService, Repositories } from '@nom/core';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RepositoriesProvider } from '@/data/RepositoriesProvider';

/**
 * Provider dùng chung cho app và test (test truyền `MockAuthService`, có thể kèm repository
 * bộ nhớ qua `repositories`).
 */
export function AppProviders({
  authService,
  repositories,
  children,
}: {
  authService: AuthService;
  repositories?: Repositories;
  children: ReactNode;
}) {
  return (
    <AuthProvider service={authService}>
      <RepositoriesProvider override={repositories}>
        <TooltipProvider>
          {children}
          {/* SCR-00: góc dưới phải, tự ẩn sau 4s, tối đa 3 cái. */}
          <Toaster position="bottom-right" duration={4000} visibleToasts={3} />
        </TooltipProvider>
      </RepositoriesProvider>
    </AuthProvider>
  );
}
