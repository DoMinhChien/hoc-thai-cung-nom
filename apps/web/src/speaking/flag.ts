/**
 * Cờ Luyện nói (M12.9, giai đoạn CAT): đọc lúc build. Không đặt `VITE_ENABLE_SPEAKING` → bật khi
 * `pnpm dev`, tắt ở bản build (production). CI: preview PR = `true`, production = `false`.
 */
export function speakingEnabled(
  env: Pick<ImportMetaEnv, 'VITE_ENABLE_SPEAKING' | 'DEV'> = import.meta.env,
) {
  return (env.VITE_ENABLE_SPEAKING ?? (env.DEV ? 'true' : 'false')) === 'true';
}
