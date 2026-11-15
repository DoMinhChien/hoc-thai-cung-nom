import type { AuthService, AuthUser } from '@nom/core';
import { createContext } from 'react';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'guest'; user: null }
  | { status: 'signed-in'; user: AuthUser };

export type AuthContextValue = AuthState & { service: AuthService };

export const AuthContext = createContext<AuthContextValue | null>(null);
