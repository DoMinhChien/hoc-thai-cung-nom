import type { Auth, User } from 'firebase/auth';
import * as fb from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readAuthConfig } from './config';
import { FirebaseAuthService, toAuthError } from './firebase-auth-service';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  getAdditionalUserInfo: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  deleteUser: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  linkWithPopup: vi.fn(),
  unlink: vi.fn(),
  GoogleAuthProvider: class {
    providerId = 'google.com';
  },
  FacebookAuthProvider: class {
    providerId = 'facebook.com';
  },
}));

const mocked = vi.mocked(fb);

function fakeUser(patch: Partial<User> = {}): User {
  return {
    uid: 'u1',
    displayName: 'An',
    email: 'an@example.com',
    photoURL: null,
    providerData: [{ providerId: 'google.com' }],
    metadata: { creationTime: 'Sun, 15 Nov 2026 01:02:03 GMT', lastSignInTime: undefined },
    ...patch,
  } as unknown as User;
}

function setup(currentUser: User | null = null) {
  const auth = { currentUser, authStateReady: () => Promise.resolve() } as unknown as Auth;
  return { auth, service: new FirebaseAuthService(auth, ['google']) };
}

const firebaseError = (code: string) => Object.assign(new Error(code), { code });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FirebaseAuthService', () => {
  it('signIn: popup Google, trả isNewUser và user đã chuẩn hóa (L-03, L-10)', async () => {
    const { service } = setup();
    mocked.signInWithPopup.mockResolvedValue({ user: fakeUser() } as fb.UserCredential);
    mocked.getAdditionalUserInfo.mockReturnValue({ isNewUser: true } as fb.AdditionalUserInfo);

    const result = await service.signIn('google');

    expect(mocked.signInWithPopup.mock.calls[0]?.[1]).toMatchObject({ providerId: 'google.com' });
    expect(result).toEqual({
      isNewUser: true,
      user: {
        uid: 'u1',
        displayName: 'An',
        email: 'an@example.com',
        photoURL: null,
        providers: ['google'],
        createdAt: '2026-11-15T01:02:03.000Z',
        lastSignInAt: null,
      },
    });
  });

  it.each([
    ['auth/popup-closed-by-user', 'cancelled'],
    ['auth/cancelled-popup-request', 'cancelled'],
    ['auth/popup-blocked', 'popup-blocked'],
    ['auth/network-request-failed', 'network'],
    ['auth/operation-not-allowed', 'provider-disabled'],
    ['auth/internal-error', 'unknown'],
  ])('signIn: lỗi %s → %s', async (code, expected) => {
    const { service } = setup();
    mocked.signInWithPopup.mockRejectedValue(firebaseError(code));
    await expect(service.signIn('google')).rejects.toMatchObject({ code: expected, detail: code });
  });

  it('toAuthError: lỗi không có code → unknown', () => {
    expect(toAuthError(new Error('x'))).toMatchObject({ code: 'unknown', detail: undefined });
  });

  it('onUserChanged: báo sau khi Firebase khôi phục phiên, và mỗi lần Firebase đổi', async () => {
    const { service } = setup(fakeUser());
    const seen: (string | null)[] = [];
    service.onUserChanged((u) => seen.push(u?.uid ?? null));
    await Promise.resolve();
    expect(seen).toEqual(['u1']);

    const firebaseListener = mocked.onAuthStateChanged.mock.calls[0]?.[1] as (
      u: User | null,
    ) => void;
    firebaseListener(null);
    expect(seen).toEqual(['u1', null]);
  });

  it('updateDisplayName: lưu bằng updateProfile và phát lại cho listener', async () => {
    const user = fakeUser();
    const { service } = setup(user);
    const seen: (string | null)[] = [];
    service.onUserChanged((u) => seen.push(u?.displayName ?? null));
    mocked.updateProfile.mockImplementation(async (u, { displayName }) => {
      Object.assign(u, { displayName });
    });

    await service.updateDisplayName('Bình');

    expect(mocked.updateProfile).toHaveBeenCalledWith(user, { displayName: 'Bình' });
    expect(seen).toContain('Bình');
  });

  it('chưa đăng nhập → not-signed-in', async () => {
    const { service } = setup(null);
    await expect(service.updateDisplayName('x')).rejects.toMatchObject({ code: 'not-signed-in' });
    await expect(service.deleteAccount()).rejects.toMatchObject({ code: 'not-signed-in' });
  });

  it('deleteAccount: phiên cũ → đăng nhập lại bằng provider đã liên kết rồi xóa (L-08)', async () => {
    const user = fakeUser();
    const { service } = setup(user);
    mocked.deleteUser
      .mockRejectedValueOnce(firebaseError('auth/requires-recent-login'))
      .mockResolvedValueOnce();

    await service.deleteAccount();

    expect(mocked.reauthenticateWithPopup).toHaveBeenCalledOnce();
    expect(mocked.reauthenticateWithPopup.mock.calls[0]?.[1]).toMatchObject({
      providerId: 'google.com',
    });
    expect(mocked.deleteUser).toHaveBeenCalledTimes(2);
  });

  it('deleteAccount: huỷ popup đăng nhập lại → cancelled, không xóa', async () => {
    const { service } = setup(fakeUser());
    mocked.deleteUser.mockRejectedValueOnce(firebaseError('auth/requires-recent-login'));
    mocked.reauthenticateWithPopup.mockRejectedValue(firebaseError('auth/popup-closed-by-user'));

    await expect(service.deleteAccount()).rejects.toMatchObject({ code: 'cancelled' });
    expect(mocked.deleteUser).toHaveBeenCalledOnce();
  });

  it('link / unlink provider', async () => {
    const user = fakeUser();
    const { service } = setup(user);
    const linked = fakeUser({
      providerData: [
        { providerId: 'google.com' },
        { providerId: 'facebook.com' },
      ] as User['providerData'],
    });
    mocked.linkWithPopup.mockResolvedValue({ user: linked } as fb.UserCredential);
    mocked.unlink.mockResolvedValue(user);

    expect((await service.link('facebook')).providers).toEqual(['google', 'facebook']);
    expect((await service.unlink('facebook')).providers).toEqual(['google']);
    expect(mocked.unlink).toHaveBeenCalledWith(user, 'facebook.com');
  });

  it('signOut', async () => {
    const { auth, service } = setup(fakeUser());
    await service.signOut();
    expect(mocked.signOut).toHaveBeenCalledWith(auth);
  });
});

describe('readAuthConfig', () => {
  it('Phase 1: chỉ Google; Facebook khi bật flag', () => {
    expect(readAuthConfig({}).providers).toEqual(['google']);
    expect(readAuthConfig({ VITE_ENABLE_FACEBOOK_LOGIN: 'false' }).providers).toEqual(['google']);
    expect(readAuthConfig({ VITE_ENABLE_FACEBOOK_LOGIN: 'true' }).providers).toEqual([
      'google',
      'facebook',
    ]);
  });

  it('emulator: project demo, không cần biến Firebase thật', () => {
    const config = readAuthConfig({ VITE_USE_AUTH_EMULATOR: 'true' });
    expect(config.emulatorUrl).toBe('http://127.0.0.1:9099');
    expect(config.firebase.projectId).toBe('demo-hoc-thai-nom');
  });

  it('production: đọc VITE_FIREBASE_*', () => {
    const config = readAuthConfig({
      VITE_FIREBASE_API_KEY: 'k',
      VITE_FIREBASE_AUTH_DOMAIN: 'p.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'p',
      VITE_FIREBASE_APP_ID: 'a',
    });
    expect(config).toEqual({
      firebase: { apiKey: 'k', authDomain: 'p.firebaseapp.com', projectId: 'p', appId: 'a' },
      emulatorUrl: null,
      providers: ['google'],
    });
  });
});
