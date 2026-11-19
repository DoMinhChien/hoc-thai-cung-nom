# Design brief — Học Thai cùng Nôm

> Trạng thái: **Đã chốt định hướng** (M0.5a · D0.1) — owner đồng ý đề xuất 2026-11-15. Nguồn: plan mục 1, 7.6.1.

## 1. Sản phẩm trong một câu
Web app giúp **người Việt** học tiếng Thái qua **flashcard + trò chơi ngắn**, mỗi chữ/từ gắn **hình ảnh + mẹo nhớ** để "nhìn là nhớ".

## 2. Người dùng
| Nhóm | Bối cảnh | Điều họ cần từ giao diện |
|---|---|---|
| Người mới bắt đầu | Chưa đọc được chữ Thái; học trên laptop, 10–20 phút/ngày | Biết ngay hôm nay học gì; không bị ngợp |
| Người tự học | Nói được ít, muốn đọc được chữ | Thấy rõ tiến độ, ôn đúng lúc |
| Học viên của giáo viên | Học theo giáo trình lớp | Nội dung khớp bài trên lớp |

## 3. Tính cách giao diện
**Tối giản · Bình tĩnh · Tập trung · Ấm áp vừa đủ.**
- Giống một cuốn vở sạch, không giống trò chơi điện tử.
- Phần sinh động nằm ở **hình minh họa nội dung** (emoji Noto) và **cơ chế chơi**, không ở trang trí.
- Không mascot, không confetti, không gradient, không bóng đổ đậm.

## 4. Nguyên tắc (tóm tắt plan 7.6.1)
| # | Nguyên tắc |
|---|---|
| D1 | Nền trung tính, **1 màu nhấn** |
| D2 | Màu chỉ để mang nghĩa: sắc độ mức thuộc + đúng/sai *(v7: bỏ 5 màu thanh điệu)* |
| D2a | Hình minh họa nội dung là ngoại lệ có chủ đích, một phong cách thống nhất |
| D3 | Nội dung là trung tâm, mỗi màn hình **1 hành động chính** |
| D4 | Keyboard-first, phím tắt hiện trên nút |
| D5 | Tiến độ luôn thấy nhưng kín đáo |
| D6 | Focus mode khi học/ôn (ẩn sidebar) |
| D7 | Không giấu thông tin vì thẩm mỹ |
| D8 | Typography là "trang trí" chính (Inter + **Sarabun** cho chữ Thái — kiểu có đầu tròn, phổ thông, giống giáo trình; v7.4), line-height Thái 1.75 |
| D9 | Light mode trước, token đặt theo nghĩa |
| ~~D10~~ | ⛔ Bỏ ở v7 (không còn hiển thị thanh điệu) |

## 5. Khung giao diện (áp dụng mọi màn)
- **Desktop-first:** thiết kế ở 1440×900, kiểm tra ở 1280 và 1024. Chưa làm mobile.
- **2 kiểu layout:**
  - **App layout** — sidebar trái 240px (logo, điều hướng, khối tài khoản ở đáy) + vùng nội dung tối đa 1040px.
  - **Bare layout** — không sidebar, nội dung giữa màn hình, tối đa 720px: dùng cho Đăng nhập & trang pháp lý.
- **Focus layout** (cho Ôn / Trò chơi, thiết kế ở M0.5b): ẩn sidebar, chỉ còn thanh tiến độ + nút thoát.

## 6. Giọng văn (copy)
- Xưng **"bạn"**, câu ngắn, thân thiện, không đùa cợt.
- Nút là **động từ**: "Tiếp tục với Google", "Học ngay", "Lưu".
- Thông báo lỗi nói **chuyện gì xảy ra + làm gì tiếp**.

## 7. Phạm vi đợt này (M0.5a)
| Mã | Màn | Route |
|---|---|---|
| SCR-00 | Khung chung (App layout + Bare layout, header/sidebar, khối tài khoản) | — |
| SCR-01 | Đăng nhập / Chào mừng | `/login` |
| SCR-02 | Tài khoản + 3 trang pháp lý | `/account`, `/privacy`, `/terms`, `/account/delete-instructions` |

**Ngoài phạm vi:** Dashboard và các màn học (M0.5b), mobile, dark mode.

## 8. Quyết định đã chốt (2026-11-15)
1. **Màu nhấn:** **Chàm (indigo) `#3F4AA8`** — xem `tokens.json`.
2. **Lần đầu mở app:** hiện màn **Chào mừng / Đăng nhập** (`/login`) với 3 lựa chọn; người đã chọn "Học không cần đăng nhập" lần sau vào thẳng Dashboard.

## 9. Màu nhấn
- *(v7)* Bỏ 5 màu thanh điệu; `color.tone` đã xóa khỏi `tokens.json` (M5.5).
- Mức thuộc dùng **3 sắc độ của màu chàm** (nhạt → đậm), không thêm màu mới.
- Màu nút Google/Facebook theo **branding guideline của từng hãng** — ngoại lệ duy nhất ngoài tokens.
