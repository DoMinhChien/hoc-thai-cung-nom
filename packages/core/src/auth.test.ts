import { describe, expect, it } from 'vitest';
import { AuthError, MockAuthService, mockUser, validateDisplayName } from './auth';

describe('validateDisplayName', () => {
  it.each([
    ['  Minh   Chiến ', 'Minh Chiến'],
    ['An', 'An'],
    ['x'.repeat(30), 'x'.repeat(30)],
  ])('hợp lệ: %j → %j', (raw, value) => {
    expect(validateDisplayName(raw)).toEqual({ ok: true, value });
  });

  it.each([
    ['', 'too-short'],
    ['   ', 'too-short'],
    ['A', 'too-short'],
    ['x'.repeat(31), 'too-long'],
  ])('không hợp lệ: %j → %s', (raw, error) => {
    expect(validateDisplayName(raw)).toEqual({ ok: false, error });
  });

  it('đếm theo ký tự, không theo code unit', () => {
    expect(validateDisplayName('😀😀').ok).toBe(true);
  });
});

describe('MockAuthService', () => {
  it('báo trạng thái ngay khi đăng ký và mỗi lần đổi', async () => {
    const auth = new MockAuthService();
    const seen: (string | null)[] = [];
    const off = auth.onUserChanged((u) => seen.push(u?.uid ?? null));
    const { isNewUser } = await auth.signIn('google');
    await auth.signOut();
    off();
    await auth.signIn('google');
    expect(seen).toEqual([null, 'user-1', null]);
    expect(isNewUser).toBe(false);
    expect(auth.calls).toEqual(['signIn:google', 'signOut', 'signIn:google']);
  });

  it('nextSignIn quyết định kết quả rồi tự xóa', async () => {
    const auth = new MockAuthService();
    auth.nextSignIn = new AuthError('cancelled');
    await expect(auth.signIn('google')).rejects.toMatchObject({ code: 'cancelled' });
    auth.nextSignIn = { isNewUser: true, user: { uid: 'u2' } };
    expect(await auth.signIn('google')).toMatchObject({ isNewUser: true, user: { uid: 'u2' } });
    expect((await auth.signIn('google')).isNewUser).toBe(false);
  });

  it('đổi tên, liên kết, xóa tài khoản', async () => {
    const auth = new MockAuthService({ user: mockUser() });
    expect((await auth.updateDisplayName('Lan')).displayName).toBe('Lan');
    expect((await auth.link('facebook')).providers).toEqual(['google', 'facebook']);
    expect((await auth.unlink('google')).providers).toEqual(['facebook']);
    auth.nextError = new AuthError('network');
    await expect(auth.deleteAccount()).rejects.toMatchObject({ code: 'network' });
    await auth.deleteAccount();
    expect(auth.currentUser).toBeNull();
    await expect(auth.updateDisplayName('x')).rejects.toMatchObject({ code: 'not-signed-in' });
  });

  it('AuthError giữ mã gốc trong detail', () => {
    const error = new AuthError('unknown', 'auth/internal-error');
    expect(error.message).toBe('unknown (auth/internal-error)');
    expect(new AuthError('network').message).toBe('network');
  });
});
