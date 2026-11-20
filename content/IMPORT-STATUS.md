# Nhập nội dung giáo viên — trạng thái

> Claude Desktop chuyển tay từ PDF trong `sources/` (gitignored, có bản quyền) sang `content/*.csv|yaml` (plan 0.12). Mọi mục `draft: true` cho tới khi **giáo viên duyệt**. Bản dịch Thái của “Bài luyện tập” do Claude soạn → giáo viên duyệt.

Trạng thái: ⬜ chưa làm · 🟡 đã nhập (draft, chờ GV duyệt) · ✅ GV đã duyệt

## Giáo trình (kind `theme`) — “Tiếng Thái chuyên sâu cấp độ 1 (A1)”

| Bài | unit_id | File | Trang | Từ | Câu | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | `b01` | `บทที่ 1_สรรพนามบุรุษ_bản quyền.pdf` | 22 | 71 | 11 | 🟡 2026-11-20 · 7 bài học · 5 mẫu câu (câu 1, 3, 5 có đáp án của GV) |
| 2 | `b02` | `บทที่ 2_การทักทายและแนะนำตัวเอง_bản quyền.pdf` | 24 | 65 | 29 | 🟡 2026-11-19 · 6 bài học · 2 mẫu câu |
| 3 | `b03` | `บทที่ 3_เลขนับจํานวน_ bản quyền.pdf` | 61 |  |  | ⬜ |
| 4 | `b04` | `บทที่ 4_ลักษณนาม และโครงสร้างการเปรียบเทียบ_bản quyền.pdf` | 54 |  |  | ⬜ |
| 5 | `b05` | `บทที่ 5_วันเดือนปี_bản quyền.pdf` | 64 |  |  | ⬜ |
| 6 | `b06` | `บทที่ 6_เวลา_bản quyền.pdf` | 47 |  |  | ⬜ |
| 7 | `b07` | `บทที่ 7_การเดินทางและการบอกทาง_bản quyền.pdf` | 45 |  |  | ⬜ |
| 8 | `b08` | `บทที่ 8_การจองห้องพักโรงแรม_bản quyền.pdf` | 31 |  |  | ⬜ |
| 9 | `b09` | `บทที่ 9_การสั่งอาหาร_bản quyền.pdf` | 39 |  |  | ⬜ |
| 10 | `b10` | `บทที่ 10_การซื้อขาย_bản quyền.pdf` | 44 |  |  | ⬜ |
| 11 | `b11` | `บทที่ 11 สวมบทสนทนา ตอนที่ 1_bản quyền.pdf` | 21 |  |  | ⬜ |
| 12 | `b12` | `บทที่ 12 สวมบทสนทนา ตอนที่ 2_bản quyền.pdf` | 21 |  |  | ⬜ |

## Chuyên đề (kind `grammar`)

| CĐ | unit_id | File | Trang | Từ | Câu | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | `c01` | `1. ĐẠI TỪ NHÂN XƯNG NÂNG CAO_bản quyền.pdf` | 3 | 19 | 6 | 🟡 2026-11-20 · 2 bài học · 3 mẫu câu (6 câu ví dụ lấy từ tài liệu, có sẵn tiếng Thái) — bỏ cặp “ไอ – ยู” (chữ mờ, chờ GV) |
| 2 | `c02` | `2. TỪ ĐỂ HỎI TRONG TIẾNG THÁI_bản quyền.pdf` | 11 |  |  | ⬜ |
| 3 | `c03` | `3. LOẠI TỪ_bản quyền.pdf` | 13 |  |  | ⬜ (mẫu cũ ở `u03`: 12 từ) |
| 4 | `c04` | `4. BÀI TẬP VỀ LOẠI TỪ_bản quyền.pdf` | 4 |  |  | ⬜ |
| 5 | `c05` | `5. ĐẠI TỪ CHỈ ĐỊNH, ĐẠI TỪ SỞ HỮU VÀ ĐẠI TỪ NHẤN MẠNH_bản quyền.pdf` | 6 |  |  | ⬜ |
| 6 | `c06` | `6. CÁCH SỬ DỤNG CỦA การ_bản quyền.pdf` | 5 |  |  | ⬜ |
| 7 | `c07` | `7. CÁCH SỬ DỤNG CỦA ความ_bản quyền.pdf` | 6 |  |  | ⬜ |
| 8 | `c08` | `8. BÀI TẬP VẬN DỤNG CỦA การ VÀ ความ_bản quyền.pdf` | 6 |  |  | ⬜ |
| 9 | `c09` | `9. CÁC TRƯỜNG HỢP CỦA ใจ_bản quyền.pdf` | 3 |  |  | ⬜ |
| 10 | `c10` | `10. CÁC TRƯỜNG HỢP CỦA ขี้_bản quyền.pdf` | 3 |  |  | ⬜ |
| 11 | `c11` | `11-cac-truong-hop-cua-na.pdf` | 6 |  | 34 | 🟡 (đang ở `u11` mẫu: 34 câu đã dịch, 5 từ — chuyển sang `c11` khi nhập) |
| 12 | `c12` | `12. CÁCH SỬ DỤNG CỦA ที่_bản quyền.pdf` | 3 |  |  | ⬜ |
| 13 | `c13` | `13. CÁCH SỬ DỤNG CỦA ว่า VÀ ถูก_bản quyền.pdf` | 6 |  |  | ⬜ |
| 14 | `c14` | `14. CÁCH SỬ DỤNG CỦA TỪ สม_bản quyền.pdf` | 4 |  |  | ⬜ |
| 15 | `c15` | `15. CÁCH SỬ DỤNG CỦA ไป & มา_bản quyền.pdf` | 10 |  |  | ⬜ |

> `03-loai-tu.pdf` trùng CĐ 3. CĐ 11 chỉ có bản mẫu gửi trước (thư mục Drive không có file “11.”).
