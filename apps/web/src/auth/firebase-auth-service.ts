import {
  AuthError,
  type AuthProviderId,
  type AuthService,
  type AuthUser,
  type SignInResult,
} from '@nom/core';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  deleteUser,
  FacebookAuthProvider,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  linkWithPopup,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  unlink,
  updateProfile,
  type Auth,
  type AuthProvider,
  type User,
} from 'firebase/auth';
import type { AuthConfig } from './config';

const FIREBASE_PROVIDER_ID: Record<AuthProviderId, string> = {
  google: 'google.com',
  facebook: 'facebook.com',
};

function firebaseProvider(provider: AuthProviderId): AuthProvider {
  return provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
}

export function toAuthUser(user: User): AuthUser {
  const providers = (Object.keys(FIREBASE_PROVIDER_ID) as AuthProviderId[]).filter((id) =>
    user.providerData.some((p) => p.providerId === FIREBASE_PROVIDER_ID[id]),
  );
  const iso = (time: string | undefined) => (time ? new Date(time).toISOString() : null);
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    providers,
    createdAt: iso(user.metadata.creationTime),
    lastSignInAt: iso(user.metadata.lastSignInTime),
  };
}

/** Chuẩn hóa mã lỗi Firebase cho UI (SCR-01 "Trạng thái"). */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;
  const code =
    typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return new AuthError('cancelled', code);
    case 'auth/popup-blocked':
      return new AuthError('popup-blocked', code);
    case 'auth/network-request-failed':
      return new AuthError('network', code);
    case 'auth/operation-not-allowed':
      return new AuthError('provider-disabled', code);
    default:
      return new AuthError('unknown', code);
  }
}

/** Firebase Auth (popup — plan 4.0 "Kiểu đăng nhập"). Nơi duy nhất gọi `firebase/auth`. */
export class FirebaseAuthService implements AuthService {
  private readonly listeners = new Set<(user: AuthUser | null) => void>();

  constructor(
    private readonly auth: Auth,
    readonly providers: readonly AuthProviderId[],
  ) {
    // Firebase không báo `onAuthStateChanged` khi đổi tên / liên kết → tự phát lại qua `emit`.
    onAuthStateChanged(auth, (user) => this.emit(user));
  }

  onUserChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Chỉ gọi ngay khi Firebase đã khôi phục phiên (tránh chớp sang Guest — SCR-00).
    void this.auth.authStateReady().then(() => {
      if (this.listeners.has(callback)) callback(this.current());
    });
    return () => this.listeners.delete(callback);
  }

  async signIn(provider: AuthProviderId): Promise<SignInResult> {
    try {
      const credential = await signInWithPopup(this.auth, firebaseProvider(provider));
      return {
        user: toAuthUser(credential.user),
        isNewUser: getAdditionalUserInfo(credential)?.isNewUser ?? false,
      };
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async updateDisplayName(name: string): Promise<AuthUser> {
    const user = this.requireUser();
    try {
      await updateProfile(user, { displayName: name });
    } catch (error) {
      throw toAuthError(error);
    }
    this.emit(user);
    return toAuthUser(user);
  }

  async deleteAccount(): Promise<void> {
    const user = this.requireUser();
    try {
      try {
        await deleteUser(user);
      } catch (error) {
        if (!isCode(error, 'auth/requires-recent-login')) throw error;
        // L-08: phiên cũ → đăng nhập lại bằng provider đã liên kết rồi xóa tiếp.
        const provider = toAuthUser(user).providers[0] ?? 'google';
        await reauthenticateWithPopup(user, firebaseProvider(provider));
        await deleteUser(user);
      }
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async link(provider: AuthProviderId): Promise<AuthUser> {
    const user = this.requireUser();
    try {
      const credential = await linkWithPopup(user, firebaseProvider(provider));
      this.emit(credential.user);
      return toAuthUser(credential.user);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  async unlink(provider: AuthProviderId): Promise<AuthUser> {
    try {
      const user = await unlink(this.requireUser(), FIREBASE_PROVIDER_ID[provider]);
      this.emit(user);
      return toAuthUser(user);
    } catch (error) {
      throw toAuthError(error);
    }
  }

  private current(): AuthUser | null {
    return this.auth.currentUser ? toAuthUser(this.auth.currentUser) : null;
  }

  private requireUser(): User {
    if (!this.auth.currentUser) throw new AuthError('not-signed-in');
    return this.auth.currentUser;
  }

  private emit(user: User | null): void {
    const value = user ? toAuthUser(user) : null;
    for (const listener of this.listeners) listener(value);
  }
}

function isCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

/** Khởi tạo Firebase từ cấu hình build; L-05/L-09: phiên lưu trong IndexedDB, mở offline được. */
export function createFirebaseAuthService(config: AuthConfig): FirebaseAuthService {
  const app = initializeApp(config.firebase);
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  auth.languageCode = 'vi';
  if (config.emulatorUrl) connectAuthEmulator(auth, config.emulatorUrl, { disableWarnings: true });
  return new FirebaseAuthService(auth, config.providers);
}
