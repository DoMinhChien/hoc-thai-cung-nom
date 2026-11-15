/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_USE_AUTH_EMULATOR?: string;
  /** Phase 2 (M12.5): `true` mới hiện nút Facebook. */
  readonly VITE_ENABLE_FACEBOOK_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
