# Học Thai cùng Nôm

Web app học tiếng Thái cho người Việt — flashcard + trò chơi, UI tiếng Việt, desktop-first, local-first.

- Kế hoạch & spec: [`hoc-thai-cung-nom-plan.md`](hoc-thai-cung-nom-plan.md)
- Tiến độ: [`ROADMAP.md`](ROADMAP.md) · Quy tắc cho AI agent: [`AGENTS.md`](AGENTS.md) · Việc owner: [`SETUP-OWNER.md`](SETUP-OWNER.md)

## Yêu cầu

Node.js ≥ 22, pnpm 10 (`npm i -g pnpm`), Java 11+ (cho Firebase Auth Emulator). Chi tiết: `SETUP-OWNER.md` S0.

## Bắt đầu

```bash
pnpm install
pnpm --filter @nom/web exec playwright install   # lần đầu, cho E2E
cp .env.example apps/web/.env.local              # điền giá trị Firebase (S4) khi có
pnpm dev                                         # http://localhost:5173
```

Trang kiểm tra font chữ Thái: `/dev/typography`.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `apps/web` | Vite + React + TS strict, Tailwind v4 + shadcn/ui, React Router |
| `packages/core` | Logic thuần (Tone Engine, schema, SRS…), không phụ thuộc React |
| `scripts` | Script Node/TS (`content:check`…) |
| `tools/pdf-pipeline` | Pipeline PDF (Python, làm ở M4) |
| `docs/design` | Brief, flows, tokens, screen spec |

Lệnh: xem `AGENTS.md` mục 10.
