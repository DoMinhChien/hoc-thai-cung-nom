# docs/design — Nguồn thiết kế cho agent

> Quy trình: plan mục 7.6.2. Coding agent **chỉ đọc thiết kế từ thư mục này**, không đọc trực tiếp Figma.

| File | Nội dung | Trạng thái |
|---|---|---|
| `brief.md` | Định hướng, tính cách, phạm vi | ✅ Chốt định hướng (accent chàm, màn Chào mừng) |
| `flows.md` | Sitemap + luồng đăng nhập / Guest / xoá tài khoản | ✅ Duyệt 2026-11-15 |
| `tokens.json` | Màu, font, spacing, radius | ✅ Duyệt 2026-11-15 |
| `screens/SCR-00-layout.md` | Khung chung | ✅ Duyệt 2026-11-15 |
| `screens/SCR-01-login.md` | Đăng nhập | ✅ Duyệt 2026-11-15 |
| `screens/SCR-02-account.md` | Tài khoản + trang pháp lý | ✅ Duyệt 2026-11-15 |

**Figma:** https://www.figma.com/design/iYEX3wxXphmrjDCxtiSuPD (team cá nhân "chiend's team", gói Starter — tối đa 3 page: `Wireframes`, `Components & Tokens`, `Archive`)

## Wireframe (lo-fi, trắng đen) — `screens/*.png`
| File | Màn |
|---|---|
| `SCR-00-layout.png` | Khung chung (Guest) |
| `SCR-01-login.png` | Chào mừng & Đăng nhập |
| `SCR-01-dialog-D1-ten-hien-thi.png` · `-D2-chuyen-tien-do.png` · `-D3-lien-ket.png` | Hộp thoại sau đăng nhập |
| `SCR-02-account.png` | Tài khoản (đã đăng nhập) |
| `SCR-02-dialog-xoa-tai-khoan.png` | Xoá tài khoản |

> Wireframe chỉ chốt **bố cục**. Màu/typography lấy từ `tokens.json`; nút Facebook ở bản thật dùng `#1877F2`. Trang pháp lý (`/privacy` mẫu) xem trong Figma.

## Lịch sử duyệt
| Ngày | Đợt | Nội dung | Người duyệt |
|---|---|---|---|
| 2026-11-15 | M0.5a | Chốt brief: accent chàm `#3F4AA8`, lần đầu mở app → màn Chào mừng | Owner |
| 2026-11-15 | M0.5a | Duyệt flows, tokens.json, SCR-00/01/02 + wireframe | Owner |
