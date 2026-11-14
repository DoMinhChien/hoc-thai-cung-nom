# AGENTS.md — Hướng dẫn cho AI agent

> **Đọc file này trước tiên.** Đây là điểm vào duy nhất cho mọi agent làm việc trên dự án **Học Thai cùng Nôm**.
> Câu lệnh giao việc chuẩn: *"Đọc `AGENTS.md`, làm milestone đang mở trong `ROADMAP.md`."*

---

## 1. Dự án là gì (tóm tắt 30 giây)

- Web app học tiếng Thái cho **người Việt**, UI **tiếng Việt**, **web desktop-first**.
- Học bằng **flashcard + trò chơi**, mỗi chữ/từ có **hình ảnh + mẹo nhớ**; UI **tối giản**.
- Phase 1: **không backend** — Azure Static Web Apps + **Firebase Auth** (Google/Facebook); tiến độ học lưu **IndexedDB** (local-first).
- Thư mục này là **root của repo**: https://github.com/DoMinhChien/hoc-thai-cung-nom (nhánh chính `main`).

## 2. Thứ tự đọc tài liệu

1. `AGENTS.md` (file này) — quy tắc làm việc.
2. `ROADMAP.md` — **milestone đang mở**, task, tiêu chí nghiệm thu, trạng thái.
3. `hoc-thai-cung-nom-plan.md` — spec đầy đủ. **Chỉ đọc các mục mà milestone tham chiếu** (theo mã requirement như `L-01`, `A-20`, `F-02`…). Các mục luôn áp dụng: **3 (quyết định & ADR)**, **7.1 (stack)**, **7.3 (data layer)**, **7.4 (testing)**, **7.5 (tham chiếu)**, **7.6 (UI & design)**.
4. `docs/design/` — brief, tokens, **screen spec `SCR-xx`** cho màn hình liên quan.
5. `SETUP-OWNER.md` — việc owner làm tay (tài khoản, secrets). **Agent không tự làm các việc này.**

## 3. Phạm vi — làm gì, không làm gì

- ✅ Chỉ làm task thuộc **milestone có trạng thái `🔵 Đang làm`** trong `ROADMAP.md`.
- ❌ Không implement requirement của milestone khác, **đặc biệt Phase 2/3** (sync, database, Azure Functions, leaderboard…), kể cả "tiện tay".
- ❌ Không thay đổi quyết định đã chốt trong mục 3 / ADR của plan. Muốn đề xuất khác → viết `docs/adr/ADR-xx-<tên>.md` trạng thái *Proposed* và **hỏi owner**.
- ❌ Không tự sáng tạo khi đã có tham chiếu (mục 7.5 plan): dùng thư viện/sample đã chỉ định.

## 4. Khi nào PHẢI dừng lại và hỏi owner

| Tình huống | Làm gì |
|---|---|
| Màn hình cần làm **chưa có screen spec** trong `docs/design/screens/` | Dừng phần UI đó; làm phần logic/test không phụ thuộc UI; báo owner |
| Cần **tài khoản, secret, cấu hình cloud** (Firebase, Azure, Facebook, Google, Anthropic) chưa có | Tham chiếu bước trong `SETUP-OWNER.md`, đánh dấu milestone `🟠 Bị chặn`, báo owner |
| Cần **nội dung tiếng Thái mới** (từ vựng, nghĩa, mẹo nhớ, phiên âm) | Chỉ tạo dữ liệu mẫu tối thiểu, gắn `draft: true`; **không** tự soạn nội dung thật — owner duyệt |
| Requirement mâu thuẫn hoặc mơ hồ | Hỏi, kèm 2–3 phương án và đề xuất |
| Test fail không rõ nguyên nhân sau 2 lần thử | Dừng, báo lại kèm log |

## 5. Tự quản lý công việc (vòng lặp mỗi phiên)

Agent tự quản lý tiến độ bằng **`ROADMAP.md`** — không dùng công cụ nào khác.

**Bắt đầu phiên**
1. Đọc `ROADMAP.md` → milestone `🔵 Đang làm` → chọn **task chưa tick đầu tiên** không bị chặn.
2. Kiểm tra "Cần trước" của milestone: thiếu spec / bước SETUP → đánh dấu `🟠 Bị chặn` kèm lý do, chuyển sang task khác không bị chặn (hoặc milestone được phép làm song song theo ROADMAP mục 1).

**Trong phiên**
3. Làm từng task theo mục 6; xong task nào **tick ngay** task đó trong `ROADMAP.md`.
4. Mỗi task = ít nhất 1 commit trên nhánh của milestone.

**Kết thúc phiên** (bắt buộc, kể cả khi dừng giữa chừng)
5. Thêm **1 dòng** vào bảng Nhật ký của `ROADMAP.md` (ngày, milestone, xong, đang dở, bị chặn, nhánh/PR).
6. Cập nhật dòng **"Milestone đang mở"** nếu có thay đổi.

**Khi xong milestone** (đạt DoD mục 9)
7. Đổi trạng thái sang `🟢`, mở PR.
8. Mở milestone kế tiếp theo thứ tự trong ROADMAP: đổi sang `🔵`, **tự chi tiết hóa task** (từ requirement IDs trong plan) + tiêu chí nghiệm thu vào ROADMAP mục 3. Owner xem lại danh sách task trong PR.

**Lệnh `status`** — khi owner gõ *"status"*, trả lời đúng mẫu:
```
Milestone: M<x> — <tên> (<🔵/🟠/🟢>)  ·  Task: <đã xong>/<tổng>
Vừa xong:  <task IDs>
Đang làm:  <task ID — mô tả ngắn>
Bị chặn:   <lý do + bước SETUP/spec cần> | không
Tiếp theo: <task ID>
Nhánh/PR:  <tên nhánh> / <link PR hoặc "chưa mở">
CI:        <xanh/đỏ/chưa chạy>
```

## 6. Quy trình làm một task

1. Đọc task + tiêu chí nghiệm thu trong `ROADMAP.md`, đọc requirement & spec liên quan.
2. Viết kế hoạch ngắn (các file sẽ tạo/sửa).
3. Implement **kèm test** (unit / component / E2E theo mục 7.4 plan).
4. Chạy toàn bộ kiểm tra: `pnpm lint && pnpm typecheck && pnpm test && pnpm content:check` (+ `pnpm test:e2e` nếu có thay đổi UI/luồng).
5. Tick task trong `ROADMAP.md` (nhật ký ghi cuối phiên — mục 5).
6. Commit theo quy ước mục 8.

## 7. Quy ước kỹ thuật (bắt buộc)

- **TypeScript strict**; package manager **pnpm** (monorepo: `apps/web`, `packages/core`, `scripts/`, `tools/pdf-pipeline` (Python)).
- **Auth:** chỉ gọi Firebase qua `AuthService` (không import `firebase/auth` ở component).
- **Dữ liệu người dùng:** chỉ qua repository (`ProgressRepository`, `ReviewRepository`…) trên **Dexie/IndexedDB**. Không dùng `localStorage` cho tiến độ học.
- **Logic thuần** (Tone Engine, normalize, chấm gõ, progress selectors, SRS wrapper) đặt trong `packages/core`, không phụ thuộc React, có unit test.
- **UI:** chỉ dùng component shadcn/ui + design tokens; **không thêm màu ngoài tokens**; logo chỉ qua `<AppLogo />`.
- **Chuỗi hiển thị** đặt trong `apps/web/src/i18n/vi.ts`; text tiếng Thái có `lang="th"`.
- **Selector test** dùng `data-testid` / role, không dùng text tiếng Việt.
- **Không commit secret**. File `.env*` (trừ `.env.example`) nằm trong `.gitignore`. Firebase web config không phải secret nhưng vẫn đọc qua biến `VITE_FIREBASE_*`.
- **Audio** qua `AudioProvider`; trong test luôn dùng mock.
- **Thời gian** trong test SRS/streak dùng đồng hồ giả lập.

## 8. Git & Pull Request

- Không push thẳng `main`. Mỗi milestone một nhánh: `m<số>-<tên-ngắn>` (vd. `m1-auth`).
- Commit theo **Conventional Commits**: `feat(auth): ...`, `fix(core): ...`, `test(e2e): ...`, `docs: ...`, `chore: ...`.
- PR mô tả: milestone, requirement IDs đã làm, ảnh chụp màn hình (nếu có UI), checklist DoD.

## 9. Definition of Done (mỗi milestone)

- [ ] Tất cả task của milestone đã tick, tiêu chí nghiệm thu đạt.
- [ ] `lint`, `typecheck`, unit + component test, `content:check` pass.
- [ ] E2E của luồng liên quan pass (Playwright, Auth Emulator nếu có đăng nhập).
- [ ] Không có lỗi axe mức *serious/critical* trên các route mới.
- [ ] Screenshot baseline mới đã được owner xem.
- [ ] Deploy preview chạy được.
- [ ] `ROADMAP.md` cập nhật trạng thái + nhật ký.

## 10. Lệnh (sẽ được tạo ở M0)

| Lệnh | Tác dụng |
|---|---|
| `pnpm install` | Cài dependency |
| `pnpm dev` | Chạy web app local |
| `pnpm emulators` | Chạy Firebase Auth Emulator |
| `pnpm lint` / `pnpm typecheck` | Kiểm tra code |
| `pnpm test` | Unit + component test (Vitest) |
| `pnpm test:e2e` | E2E (Playwright, tự bật emulator) |
| `pnpm content:check` | Validate nội dung trong `content/` |
| `pnpm build` | Build production |

> Khi M0 xong, agent cập nhật bảng này cho khớp thực tế.

## 11. Báo cáo cuối mỗi phiên làm việc

Ngoài dòng nhật ký trong ROADMAP (mục 5), agent báo ngắn gọn trên terminal:
1. Đã xong gì (task, requirement IDs).
2. Đang dở gì.
3. Bị chặn bởi gì (kèm bước `SETUP-OWNER.md` hoặc spec còn thiếu).
4. Việc tiếp theo đề xuất.
