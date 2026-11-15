/**
 * Đăng nhập (plan mục 4.0, ADR-02). UI chỉ gọi interface này; bản Firebase nằm ở `apps/web/src/auth`.
 * Provider-agnostic: Phase 1 chỉ bật Google, Phase 2 thêm Facebook mà không đổi UI/luồng.
 */
export type AuthProviderId = 'google' | 'facebook';

export const AUTH_PROVIDERS: readonly AuthProviderId[] = ['google', 'facebook'];

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  /** Provider đã liên kết với tài khoản. */
  providers: AuthProviderId[];
  /** L-10: lấy từ `user.metadata` (ISO 8601), không lưu thêm. */
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type SignInResult = {
  user: AuthUser;
  /** Lần đăng nhập đầu tiên (tài khoản vừa được tạo) → hỏi tên hiển thị (L-03). */
  isNewUser: boolean;
};

export type AuthErrorCode =
  'cancelled' | 'popup-blocked' | 'network' | 'provider-disabled' | 'not-signed-in' | 'unknown';

/** Lỗi đã chuẩn hóa để UI chọn thông báo; `detail` là mã gốc (hiện nhỏ để báo lỗi). */
export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly detail?: string,
  ) {
    super(detail ? `${code} (${detail})` : code);
    this.name = 'AuthError';
  }
}

export interface AuthService {
  /** Provider bật theo cấu hình, theo thứ tự hiển thị. */
  readonly providers: readonly AuthProviderId[];
  /** Gọi ngay khi biết trạng thái phiên, rồi mỗi lần đổi. Trả về hàm hủy đăng ký. */
  onUserChanged(callback: (user: AuthUser | null) => void): () => void;
  signIn(provider: AuthProviderId): Promise<SignInResult>;
  signOut(): Promise<void>;
  updateDisplayName(name: string): Promise<AuthUser>;
  /** Xóa user; tự yêu cầu đăng nhập lại nếu phiên đã cũ (L-08). */
  deleteAccount(): Promise<void>;
  link(provider: AuthProviderId): Promise<AuthUser>;
  unlink(provider: AuthProviderId): Promise<AuthUser>;
}

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;

export type DisplayNameCheck =
  { ok: true; value: string } | { ok: false; error: 'too-short' | 'too-long' };

/** Tên hiển thị: bỏ khoảng trắng thừa, 2–30 ký tự (SCR-01 D1, SCR-02). */
export function validateDisplayName(raw: string): DisplayNameCheck {
  const value = raw.trim().replace(/\s+/g, ' ');
  const length = [...value].length;
  if (length < DISPLAY_NAME_MIN) return { ok: false, error: 'too-short' };
  if (length > DISPLAY_NAME_MAX) return { ok: false, error: 'too-long' };
  return { ok: true, value };
}

type MockSignInOutcome = { user?: Partial<AuthUser>; isNewUser?: boolean } | AuthError;

/**
 * Bản giả trong bộ nhớ cho unit/component test.
 * Đặt `nextSignIn` để quyết định kết quả lần `signIn` kế tiếp; assert bằng `calls`.
 */
export class MockAuthService implements AuthService {
  readonly calls: string[] = [];
  readonly providers: readonly AuthProviderId[];
  nextSignIn: MockSignInOutcome = {};
  /** Lỗi ném ra ở lần gọi kế tiếp của `updateDisplayName` / `deleteAccount`. */
  nextError: AuthError | null = null;
  private user: AuthUser | null;
  private readonly listeners = new Set<(user: AuthUser | null) => void>();

  constructor(options: { providers?: AuthProviderId[]; user?: AuthUser | null } = {}) {
    this.providers = options.providers ?? ['google'];
    this.user = options.user ?? null;
  }

  get currentUser(): AuthUser | null {
    return this.user;
  }

  onUserChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.user);
    return () => this.listeners.delete(callback);
  }

  async signIn(provider: AuthProviderId): Promise<SignInResult> {
    this.calls.push(`signIn:${provider}`);
    const outcome = this.nextSignIn;
    this.nextSignIn = {};
    if (outcome instanceof AuthError) throw outcome;
    const user = mockUser({ providers: [provider], ...outcome.user });
    this.setUser(user);
    return { user, isNewUser: outcome.isNewUser ?? false };
  }

  async signOut(): Promise<void> {
    this.calls.push('signOut');
    this.setUser(null);
  }

  async updateDisplayName(name: string): Promise<AuthUser> {
    this.calls.push(`updateDisplayName:${name}`);
    this.throwNextError();
    const user = { ...this.requireUser(), displayName: name };
    this.setUser(user);
    return user;
  }

  async deleteAccount(): Promise<void> {
    this.calls.push('deleteAccount');
    this.throwNextError();
    this.requireUser();
    this.setUser(null);
  }

  async link(provider: AuthProviderId): Promise<AuthUser> {
    this.calls.push(`link:${provider}`);
    const current = this.requireUser();
    const user = { ...current, providers: [...current.providers, provider] };
    this.setUser(user);
    return user;
  }

  async unlink(provider: AuthProviderId): Promise<AuthUser> {
    this.calls.push(`unlink:${provider}`);
    const current = this.requireUser();
    const user = { ...current, providers: current.providers.filter((p) => p !== provider) };
    this.setUser(user);
    return user;
  }

  /** Giả lập Firebase báo đổi phiên (vd. khôi phục phiên khi mở app). */
  setUser(user: AuthUser | null): void {
    this.user = user;
    for (const listener of this.listeners) listener(user);
  }

  private requireUser(): AuthUser {
    if (!this.user) throw new AuthError('not-signed-in');
    return this.user;
  }

  private throwNextError(): void {
    const error = this.nextError;
    this.nextError = null;
    if (error) throw error;
  }
}

/** User mẫu cho test. */
export function mockUser(patch: Partial<AuthUser> = {}): AuthUser {
  return {
    uid: 'user-1',
    displayName: 'Người Học',
    email: 'hoc@example.com',
    photoURL: null,
    providers: ['google'],
    createdAt: '2026-11-15T00:00:00.000Z',
    lastSignInAt: '2026-11-15T00:00:00.000Z',
    ...patch,
  };
}
