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
| `screens/SCR-04-units.md` | Bài học: Lộ trình + Chi tiết chuyên đề (M7) | 📝 Chờ duyệt (M0.5b, 2026-11-18) |
| `screens/SCR-05-lesson.md` | Bài học nhiều bước: Từ vựng, Mẫu câu, Hội thoại, Bài tập (M7) | 📝 Chờ duyệt (M0.5b, 2026-11-18) |
| `screens/SCR-06-practice.md` | Bài tập: trang, phiên làm bài (E-01..E-14), kết quả (M9) | 📝 Chờ duyệt (M0.5b, 2026-11-18) |
| `screens/SCR-08-games.md` | Trò chơi: danh sách, 4 màn chơi, kết quả (M7.5 — ưu tiên) | 📝 Chờ duyệt (M0.5b, 2026-11-18) |

**Figma:** https://www.figma.com/design/iYEX3wxXphmrjDCxtiSuPD (team cá nhân "chiend's team", gói Starter — tối đa 3 page: `Wireframes`, `Components & Tokens`, `Archive`)

## Wireframe (lo-fi, trắng đen) — `screens/*.png`
| File | Màn |
|---|---|
| `SCR-00-layout.png` | Khung chung (Guest) |
| `SCR-01-login.png` | Chào mừng & Đăng nhập |
| `SCR-01-dialog-D1-ten-hien-thi.png` · `-D2-chuyen-tien-do.png` · `-D3-lien-ket.png` | Hộp thoại sau đăng nhập |
| `SCR-02-account.png` | Tài khoản (đã đăng nhập) |
| `SCR-02-dialog-xoa-tai-khoan.png` | Xoá tài khoản |
| `SCR-04-units.png` · `SCR-04-unit-detail.png` | Lộ trình · Chi tiết chuyên đề (Figma) |
| `SCR-05-lesson-vocab.png` (Figma) · `SCR-05-lesson-dialogue.png` (HTML) | Bài học: bước Từ vựng · bước Hội thoại + tra từ |
| `SCR-06-practice.png` · `-session-arrange.png` · `-session-typing.png` · `-result.png` (HTML) | Bài tập: trang · phiên E-06 · phiên E-07 + phản hồi · kết quả |
| `SCR-08-games.png` · `-play-match.png` · `-play-truefalse.png` · `-play-classifier.png` · `-result.png` (HTML) | Trò chơi: danh sách · Ghép cặp · Đúng hay sai? · Đoán loại từ · kết quả |

> **2026-11-18:** Figma MCP gói Starter hết lượt gọi giữa đợt M0.5b → 3 wireframe đầu vẽ trong Figma (page `Wireframes`, hàng y = 2500), 5 wireframe còn lại dựng bằng HTML cùng phong cách lo-fi rồi chụp PNG. Spec `.md` vẫn là nguồn chính.

> Wireframe chỉ chốt **bố cục**. Màu/typography lấy từ `tokens.json`; nút Facebook ở bản thật dùng `#1877F2`. Trang pháp lý (`/privacy` mẫu) xem trong Figma.

## Lịch sử duyệt
| Ngày | Đợt | Nội dung | Người duyệt |
|---|---|---|---|
| 2026-11-15 | M0.5a | Chốt brief: accent chàm `#3F4AA8`, lần đầu mở app → màn Chào mừng | Owner |
| 2026-11-15 | M0.5a | Duyệt flows, tokens.json, SCR-00/01/02 + wireframe | Owner |
| — | M0.5b | SCR-04/05/06/08 + 13 wireframe (chờ duyệt) | Owner |
| 2026-11-18 | M7.5 | Phương án B: khu Trò chơi có màu riêng từng trò (`color.game.*`, plan 7.6.1 v7.3) + chuyển động phản hồi; khu khác giữ tối giản | Owner |
