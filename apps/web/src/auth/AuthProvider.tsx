import type { AuthService } from '@nom/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthState } from './auth-context';

/** Theo dõi phiên qua `AuthService.onUserChanged`. Test truyền `MockAuthService`. */
export function AuthProvider({ service, children }: { service: AuthService; children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  useEffect(
    () =>
      service.onUserChanged((user) =>
        setState(user ? { status: 'signed-in', user } : { status: 'guest', user: null }),
      ),
    [service],
  );

  const value = useMemo(() => ({ ...state, service }), [state, service]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
