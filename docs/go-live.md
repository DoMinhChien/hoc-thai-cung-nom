# Go-live checklist — Phase 1 (M12)

> Nguồn: plan mục 4.0 (Yêu cầu bắt buộc từ Google trước khi go-live), 7.4 (luồng E2E), `SETUP-OWNER.md` S1, S5, S8.
> Agent tick phần **đã kiểm tra tự động**; phần **owner làm tay** ghi ở ROADMAP mục "Việc chờ owner" và tick ở đây khi xong.

## A. Agent đã kiểm tra (mỗi PR, CI)

- [x] `lint`, `typecheck`, unit + component test, `content:check` (0 lỗi) — CI job `check`.
- [x] E2E 3 trình duyệt × 2 viewport (Playwright + Auth Emulator), axe không có lỗi serious/critical trên mọi route (`a11y.spec.ts`) — CI job `e2e`.
- [x] Luồng tối thiểu (plan 7.4, viết lại theo v7):
  - 0 đăng nhập / chuyển tiến độ Guest → tài khoản / đăng xuất / xoá tài khoản — `auth.spec.ts`;
  - 1 + 3 người mới học bài → bài tập → Tổng quan, Tiến độ cập nhật → vài ngày sau có câu đến hạn — `golive.spec.ts`;
  - 4 gõ chữ Thái (bàn phím ảo, sai dấu vẫn chấm đúng thứ tự) — `typing.spec.ts`, `practice.spec.ts`;
  - 7 xuất → xoá → nhập tiến độ — `golive.spec.ts`;
  - 8 offline sau lần tải đầu (PWA) — `golive.spec.ts`.
- [x] Trang pháp lý public: `/privacy`, `/terms`, `/account/delete-instructions` (có email liên hệ S12).
- [x] Không có secret trong repo; Firebase web config đọc qua `VITE_FIREBASE_*` (GitHub Variables).
- [x] Đăng nhập Facebook tắt (`VITE_ENABLE_FACEBOOK_LOGIN=false`, Phase 2).
- [x] PWA: `manifest.webmanifest`, service worker precache app + font + content; cập nhật tự động khi có bản build mới.

## B. Owner làm tay (trước khi công bố link)

| # | Việc | Ở đâu | Xong |
|---|---|---|---|
| B1 | Bảo vệ nhánh `main`: bắt buộc PR + CI (`check`, `e2e`) xanh, **không** bắt buộc review (AGENTS 8.1) | GitHub → Settings → Branches (S1) | ☐ |
| B2 | Dọn môi trường preview cũ của Static Web App (giới hạn số staging environment) | Azure Portal → Static Web App → Environments | ☐ |
| B3 | Xác nhận domain production `*.azurestaticapps.net` nằm trong **Authorized domains** | Firebase → Authentication → Settings (S4) | ☐ |
| B4 | Google OAuth consent screen: điền link `/privacy`, `/terms` (domain production), scope chỉ `openid email profile`, **không** upload logo → **Publish app / In production** | Google Cloud Console (S5 bước 3) | ☐ |
| B5 | Giới hạn Firebase API key theo **HTTP referrers**: domain production + `localhost` | Google Cloud → Credentials (S8) | ☐ |
| B6 | Bật Budget alert Azure ($5 / $20) | Azure → Cost Management (S3) | ☐ |
| B7 | Quyết định công bố khi nội dung còn `draft` (mọi bài hiện nhãn "Bản nháp") hay chờ giáo viên duyệt | `content/IMPORT-STATUS.md` (S10) | ☐ |
| B8 | Duyệt câu ghi công giáo trình hiển thị ở `/units` ("Nguồn: giáo trình Tiếng Thái Thạc Sĩ Plern-Pin.") | S10 | ☐ |
| B9 | Xem lại `/privacy` (đoạn mới về tệp xuất tiến độ) | `apps/web/src/i18n/legal.vi.ts` | ☐ |

## C. Smoke test thủ công trên production (sau B1–B5, mỗi lần release)

1. Mở link production trong cửa sổ ẩn danh → màn Chào mừng → "Học không cần đăng nhập" → học Bài 1, bài học 1.
2. "Tiếp tục với Google" bằng tài khoản thật → đặt tên hiển thị → chọn **chuyển tiến độ** → Tổng quan còn dữ liệu.
3. Đăng xuất → về Guest rỗng → đăng nhập lại → dữ liệu quay lại.
4. Cài đặt → Xuất tiến độ → mở tệp JSON (có `"format": "hoc-thai-cung-nom/progress"`).
5. Tải lại trang, tắt mạng (DevTools → Offline) → mở `/units/b01/b01-l1`, `/words` vẫn chạy.
6. Tài khoản thử: `/account` → Xoá tài khoản → không còn trong Firebase → Users.

Ghi kết quả + ngày vào ROADMAP nhật ký ("go-live smoke test").
