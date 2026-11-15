import type { AuthProviderId } from '@nom/core';
import type { FirebaseOptions } from 'firebase/app';

export const EMULATOR_PROJECT_ID = 'demo-hoc-thai-nom'; // khớp .firebaserc
export const EMULATOR_URL = 'http://127.0.0.1:9099'; // khớp firebase.json

export type AuthConfig = {
  firebase: FirebaseOptions;
  /** URL Auth Emulator; `null` = Firebase thật. */
  emulatorUrl: string | null;
  providers: AuthProviderId[];
};

type AuthEnv = Pick<
  ImportMetaEnv,
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_APP_ID'
  | 'VITE_USE_AUTH_EMULATOR'
  | 'VITE_ENABLE_FACEBOOK_LOGIN'
>;

/**
 * Đọc cấu hình từ biến build `VITE_*` (plan 4.0 "Config").
 * Emulator dùng project `demo-*` → không cần cấu hình Firebase thật.
 */
export function readAuthConfig(env: AuthEnv): AuthConfig {
  // Phase 1 chỉ Google; Facebook bật bằng flag ở Phase 2 (M12.5).
  const providers: AuthProviderId[] = ['google'];
  if (env.VITE_ENABLE_FACEBOOK_LOGIN === 'true') providers.push('facebook');

  if (env.VITE_USE_AUTH_EMULATOR === 'true') {
    return {
      firebase: {
        apiKey: 'demo-api-key',
        authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
        projectId: EMULATOR_PROJECT_ID,
      },
      emulatorUrl: EMULATOR_URL,
      providers,
    };
  }

  const firebase: FirebaseOptions = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  if (!firebase.apiKey) {
    // Vẫn chạy được ở chế độ Guest; bấm đăng nhập sẽ báo lỗi trong card.
    console.warn(
      'Thiếu VITE_FIREBASE_* — xem .env.example (hoặc đặt VITE_USE_AUTH_EMULATOR=true).',
    );
  }
  return { firebase, emulatorUrl: null, providers };
}
