# ROADMAP — Học Thai cùng Nôm

> Nguồn trạng thái duy nhất của dự án. Agent tự quản lý theo vòng lặp trong `AGENTS.md` mục 5: tick task ngay khi xong, ghi 1 dòng nhật ký cuối mỗi phiên.
> Chi tiết requirement: `hoc-thai-cung-nom-plan.md`. Việc owner làm tay: `SETUP-OWNER.md`.

**Trạng thái:** ⚪ Chưa bắt đầu · 🔵 Đang làm · 🟠 Bị chặn · 🟢 Xong

## Milestone đang mở

> **🔵 M0 — Khung dự án** *(và song song: M0.5a — Thiết kế cho đăng nhập)*

---

## 1. Thứ tự & phụ thuộc (Phase 1)

```
M0 Khung dự án ──────────────┐
M0.5a Design: brief + Login/Account ─┼──► M1 Đăng nhập ──► M2 Core ──► M3 Content ──► M5 Data+SRS ──► M6..M11 ──► M12 Go-live
SETUP S1–S3 (GitHub, Azure) ─┘        ▲                       │
SETUP S4–S6 (Firebase, Google, FB) ───┘                       └──► M4 PDF pipeline (cần S9 + PDF mẫu S10)
M0.5b Design các màn còn lại: làm dần, mỗi màn xong TRƯỚC milestone dùng nó
```

- **M0 không cần thiết kế** (chỉ khung, layout trống) → làm được ngay.
- **M1 cần:** spec `SCR-01 Đăng nhập`, `SCR-02 Tài khoản`, `SCR-00 Layout chung` + tokens cơ bản (M0.5a) và SETUP **S4–S6**.
- **M2 (Tone Engine, logic thuần)** không phụ thuộc UI → có thể làm song song nếu M1 bị chặn chờ owner.

## 2. Bảng milestone Phase 1

| M | Tên | Trạng thái | Cần trước (spec / setup) |
|---|---|---|---|
| M0 | Khung dự án | 🔵 | S0 (máy owner); S1 ✅ repo đã tạo; S2 (chỉ cho bước deploy T0.10) |
| M0.5a | Design: brief, flows, tokens cơ bản, SCR-00/01/02 | 🔵 | Owner duyệt (S11) |
| M1 | Đăng nhập Google/Facebook | ⚪ | M0, M0.5a, S4–S6 |
| M2 | Core: schema, normalize, Tone Engine | ⚪ | M0 |
| M3 | Content pipeline TS + content mẫu | ⚪ | M2; owner duyệt content mẫu (S10) |
| M4 | PDF pipeline Python | ⚪ | M3, S9, PDF mẫu (S10) |
| M0.5b | Design các màn còn lại | ⚪ | Làm dần trước M5–M11 |
| M5 | Data layer + SRS + progress components | ⚪ | M2 |
| M6 | Bảng chữ cái + Tone Trainer (+P-02, P-03) | ⚪ | M5, SCR bảng chữ / Tone Trainer |
| M7 | Từ vựng + Ôn SRS + Dashboard (+P-04, P-05, P-08) | ⚪ | M5, SCR liên quan |
| M8 | Bàn phím ảo Thái + chấm gõ | ⚪ | M5 |
| M9 | Đọc + tra từ (+P-06) | ⚪ | M7, SCR Đọc |
| M10 | Quiz nghe (+P-07) | ⚪ | M5, SCR Quiz nghe |
| M10.5 | Hình & mẹo nhớ + 4 trò chơi (+P-09) | ⚪ | M6, M7, SCR Trò chơi; owner duyệt mẹo nhớ |
| M11 | Báo cáo cá nhân `/progress` | ⚪ | M6–M10.5 |
| M12 | Settings, export/import, PWA, E2E đủ, go-live | ⚪ | S5/S6 go-live, S8 |

Phase 2 (M13–M24) và Phase 3 (M25–M27): xem mục 10 của plan. **Không làm cho tới khi Phase 1 xong.**

---

## 3. Chi tiết milestone đang mở

### M0 — Khung dự án 🔵

**Mục tiêu:** repo chạy được, có đủ khung test & CI/CD, deploy được trang trống lên Azure SWA.

**Task**
- [x] T0.0 Git: nếu thư mục chưa là repo → `git init -b main`, `git remote add origin https://github.com/DoMinhChien/hoc-thai-cung-nom.git`; commit tài liệu hiện có lên `main` (commit đầu tiên, `docs: initial plan`), sau đó làm M0 trên nhánh `m0-scaffold`.
- [x] T0.1 Khởi tạo monorepo pnpm: `apps/web` (Vite + React + TS strict), `packages/core`, `scripts/`, `tools/pdf-pipeline/` (chỉ README, Python làm ở M4).
- [x] T0.2 Tailwind + shadcn/ui; file token tạm `apps/web/src/styles/tokens.css` (màu trung tính + 1 accent placeholder, chờ `tokens.json` từ M0.5a).
- [x] T0.3 React Router với các route rỗng của Phase 1 (mục 9 plan) + layout desktop (sidebar + vùng nội dung) + `<AppLogo />` đọc `public/brand/logo.svg` (placeholder chữ "Nôm").
- [x] T0.4 Font self-host: Inter (hoặc Be Vietnam Pro) + Noto Sans Thai; trang `/dev/typography` hiển thị mẫu chữ Thái có dấu chồng để kiểm tra.
- [x] T0.5 i18n: `apps/web/src/i18n/vi.ts` + helper `t()`.
- [ ] T0.6 Test: Vitest + React Testing Library + `fake-indexeddb`; Playwright (Chromium/Firefox/WebKit, viewport 1280×800 & 1024×768) + `@axe-core/playwright`; 1 test mẫu mỗi loại.
- [ ] T0.7 Firebase Auth Emulator: `firebase.json`, script `pnpm emulators`; Playwright tự khởi động emulator (chưa dùng ở M0, chỉ sẵn sàng).
- [ ] T0.8 Mock `AudioProvider` + interface (mục 7.2 plan), chưa cần implement thật.
- [ ] T0.9 ESLint + Prettier + `pnpm typecheck`; script `pnpm content:check` (tạm thời no-op, có thật ở M3).
- [ ] T0.10 GitHub Actions: lint → typecheck → test → e2e → build → deploy SWA (dùng workflow SWA sinh ra ở bước S2). PR → preview environment.
- [ ] T0.11 `.gitignore`, `.env.example` (liệt kê `VITE_FIREBASE_*`, `VITE_USE_AUTH_EMULATOR`), `README.md` ngắn; cập nhật bảng lệnh trong `AGENTS.md`.
- [ ] T0.12 `staticwebapp.config.json`: SPA fallback.

**Tiêu chí nghiệm thu**
- `pnpm install && pnpm dev` mở được app, điều hướng qua các route rỗng.
- Tất cả lệnh trong `AGENTS.md` mục 10 chạy được và pass.
- PR tạo preview URL trên Azure SWA; merge `main` deploy production.
- Trang `/dev/typography` hiển thị chữ Thái không bị cắt dấu ở 3 trình duyệt.

### M0.5a — Thiết kế tối thiểu cho đăng nhập 🔵

**Thực hiện:** Claude (design) + owner duyệt. Theo mục 7.6.2 plan.

- [ ] D0.1 `docs/design/brief.md` (đối tượng, định hướng tối giản D1–D10, tham khảo).
- [ ] D0.2 `docs/design/flows.md`: sitemap Phase 1 + luồng đăng nhập / Guest / chuyển tiến độ / xóa tài khoản (Mermaid).
- [ ] D0.3 `tokens.json` cơ bản: màu trung tính, accent, 5 màu thanh, 3 sắc độ mức thuộc, font, spacing, radius.
- [ ] D0.4 Screen spec: `SCR-00-layout.md` (khung chung, header, sidebar), `SCR-01-login.md`, `SCR-02-account.md` (kèm `/privacy`, `/terms`, `/account/delete-instructions`).
- [ ] D0.5 Wireframe trắng đen 3 màn trên (Figma) → xuất PNG vào `docs/design/screens/`.
- [ ] D0.6 Owner duyệt → ghi ngày duyệt vào `docs/design/README.md`.

---

## 4. Milestone kế tiếp (chuẩn bị sẵn)

### M1 — Đăng nhập Google/Facebook ⚪

**Cần trước:** M0 🟢, M0.5a 🟢, SETUP **S4, S5, S6** (S6 phần URL pháp lý có thể bổ sung sau khi deploy trang). Requirement: **L-01..L-10**, mục 4.0 plan.

**Task**
- [ ] T1.1 `packages/core` (hoặc `apps/web/src/auth`): interface `AuthService` + `FirebaseAuthService` (popup), `onUserChanged`, `updateDisplayName`, `deleteAccount`, `link/unlink`.
- [ ] T1.2 Kết nối Auth Emulator khi `VITE_USE_AUTH_EMULATOR=true`.
- [ ] T1.3 `/login` theo SCR-01: nút Google, Facebook, "Học không cần đăng nhập".
- [ ] T1.4 Lần đầu đăng nhập: hộp thoại xác nhận **tên hiển thị** (L-03).
- [ ] T1.5 Liên kết tài khoản cùng email (L-04): xử lý lỗi `auth/account-exists-with-different-credential` → hướng dẫn đăng nhập provider cũ rồi `link`.
- [ ] T1.6 Header avatar + tên + menu (L-06); giữ phiên (L-05); offline vẫn vào được (L-09).
- [ ] T1.7 IndexedDB đặt tên theo `uid` / `guest`; hộp thoại "Chuyển tiến độ hiện tại vào tài khoản này?" (L-07).
- [ ] T1.8 `/account` theo SCR-02: đổi tên, liên kết/hủy liên kết provider, xóa tài khoản (đăng nhập lại nếu cần) + xóa IndexedDB (L-08).
- [ ] T1.9 Trang `/privacy`, `/terms`, `/account/delete-instructions` (nội dung bản nháp, owner duyệt).
- [ ] T1.10 E2E **luồng 0** (mục 7.4 plan) trên Auth Emulator; unit test `AuthService` (mock).

**Tiêu chí nghiệm thu**
- Đăng nhập Google & Facebook chạy trên **emulator** (CI) và **thật** trên production (owner smoke test).
- Guest → đăng nhập → chuyển tiến độ → đăng xuất → đăng nhập lại: dữ liệu đúng như luồng 0.
- Xóa tài khoản: user biến mất ở Firebase, IndexedDB của user bị xóa.
- Không component nào import trực tiếp `firebase/auth`.

### M2 → M12
Chi tiết hóa thành task khi milestone trước gần xong (agent đề xuất danh sách task từ requirement IDs trong plan → owner duyệt → ghi vào đây).

---

## 5. Nhật ký

> Mỗi phiên làm việc thêm **1 dòng** (mới nhất ở trên cùng).

| Ngày | Milestone | Xong | Đang dở | Bị chặn | Nhánh / PR |
|---|---|---|---|---|---|
| 2026-11-14 | — | Owner tạo GitHub repo https://github.com/DoMinhChien/hoc-thai-cung-nom (S1) | — | — | — |
| 2026-11-14 | — | Tạo ROADMAP, AGENTS, SETUP-OWNER, CLAUDE.md; plan v6.3; mở M0 + M0.5a | — | — | — |
