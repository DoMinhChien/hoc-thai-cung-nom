/**
 * Máy chủ E2E: bản build như production (`dist`, cờ Luyện nói tắt — baseline các màn hiện có
 * không đổi) ở `port`, và bản bật Luyện nói (`dist-speaking`, M12.9) ở `speakingPort`.
 * Chạy sau `pnpm build` (đã có content). `node e2e/serve.ts <port> <speakingPort>`.
 */
import { build, preview } from 'vite';

const [port, speakingPort] = process.argv.slice(2).map(Number);
if (!port || !speakingPort) throw new Error('Cần <port> <speakingPort>');

process.env.VITE_ENABLE_SPEAKING = 'true';
await build({ logLevel: 'warn', build: { outDir: 'dist-speaking' } });
// Bản Luyện nói lên trước — Playwright chỉ đợi `port`.
await preview({
  build: { outDir: 'dist-speaking' },
  preview: { port: speakingPort, strictPort: true },
});
await preview({ preview: { port, strictPort: true } });
console.log(`E2E: http://localhost:${port} · Luyện nói http://localhost:${speakingPort}`);
