import type { AuthService } from '@nom/core';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

/** Provider dùng chung cho app và test (test truyền `MockAuthService`). */
export function AppProviders({
  authService,
  children,
}: {
  authService: AuthService;
  children: ReactNode;
}) {
  return (
    <AuthProvider service={authService}>
      <TooltipProvider>
        {children}
        {/* SCR-00: góc dưới phải, tự ẩn sau 4s, tối đa 3 cái. */}
        <Toaster position="bottom-right" duration={4000} visibleToasts={3} />
      </TooltipProvider>
    </AuthProvider>
  );
}
