# Nhập nội dung giáo viên — trạng thái

> Claude Desktop chuyển tay từ PDF trong `sources/` (gitignored, có bản quyền) sang `content/*.csv|yaml` (plan 0.12). Mọi mục `draft: true` cho tới khi **giáo viên duyệt**. Bản dịch Thái của “Bài luyện tập” do Claude soạn → giáo viên duyệt.

Trạng thái: ⬜ chưa làm · 🟡 đã nhập (draft, chờ GV duyệt) · ✅ GV đã duyệt

**Thứ tự nhập (owner chốt 2026-11-20 — số lớn trước):** Giáo trình **Bài 12 → 11 → … → 3**, rồi Chuyên đề **15 → 14 → … → 2** (CĐ 11, 3 chuyển từ mẫu `u11`, `u03` khi tới lượt). Đã xong trước đó: Bài 1, Bài 2, CĐ 1.

## Giáo trình (kind `theme`) — “Tiếng Thái chuyên sâu cấp độ 1 (A1)”

| Bài | unit_id | File | Trang | Từ | Câu | Trạng thái |
|---|---|---|---|---|---|---|
| 1 | `b01` | `บทที่ 1_สรรพนามบุรุษ_bản quyền.pdf` | 22 | 71 | 11 | 🟡 2026-11-20 · 7 bài học · 5 mẫu câu (câu 1, 3, 5 có đáp án của GV) |
| 2 | `b02` | `บทที่ 2_การทักทายและแนะนำตัวเอง_bản quyền.pdf` | 24 | 65 | 29 | 🟡 2026-11-19 · 6 bài học · 2 mẫu câu |
| 3 | `b03` | `บทที่ 3_เลขนับจํานวน_ bản quyền.pdf` | 61 |  |  | ⬜ |
| 4 | `b04` | `บทที่ 4_ลักษณนาม และโครงสร้างการเปรียบเทียบ_bản quyền.pdf` | 54 |  |  | ⬜ |
| 5 | `b05` | `บทที่ 5_วันเดือนปี_bản quyền.pdf` | 64 | 145 | 44 | 🟡 2026-11-21 · 14 bài học · 9 mẫu câu (hỏi/đáp thứ, ngày dương lịch, ngày âm lịch ขึ้น/แรม … ค่ำ, hậu tố tháng คม/ยน/พันธ์ + bỏ hậu tố trong văn nói, hỏi/đáp tháng, tháng âm lịch, năm con giáp, năm พ.ศ./ค.ศ. (ghi chú p24: phật lịch = công lịch + 543), mùa; ví dụ của GV) · 145 từ đều từ bảng, chép nguyên nghĩa của GV (đổi dấu phẩy → `;`, viết thường đầu nghĩa); cột คำอ่าน (thứ, tháng) và คำย่อ (ม.ค.…) ghi vào `note_vi` (“đọc: …; viết tắt: …”). Tháng âm lịch: chỉ เดือนอ้าย, เดือนยี่ thành từ; เดือน ๓ … ๑๒ (chữ số Thái) đưa vào mẫu câu `g-b05-duean-chan`. Cặp từ cùng nghĩa ở hàng riêng (ฤดูร้อน/หน้าร้อน, ฤดูฝน/หน้าฝน, ฤดูหนาว/หน้าหนาว, ฤดูแล้ง/หน้าแล้ง, ภาคเรียน/เทอม, สัปดาห์ = อาทิตย์…) gộp thành 1 từ + `thai_alt`. **Cần GV xem:** (1) chính tả p52 วันคริสมาส → Claude ghi วันคริสต์มาส; (2) p50 วันแรงงานแห่งชาติ (nghĩa đen “ngày lao động quốc gia”) được dịch “Ngày quốc tế lao động” — giữ nguyên nghĩa GV; (3) p5 มะเรื่องนี้ = “Ngày thứ 3 (tính từ ngày hôm nay)” giữ nguyên; (4) p25–27 và p36–37 tiêu đề slide vẫn là “เดือนตามจันทรคติมี๑๒เดือนดังนี้” dù nội dung là tên năm / mùa (lặp tiêu đề); (5) p33 ví dụ trả lời “Năm nay năm phật lịch 2568 ạ?” có dấu hỏi thừa → bỏ; (6) câu 10 tài liệu viết “Tôi sinh này 11 tháng 1” → sửa “ngày”. Bỏ p1–2 (bìa), p55 (trang giới thiệu bài luyện tập). 44 câu luyện dịch (p56–64): Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt); năm viết bằng số (ปีนี้ปีค.ศ. 2020 ครับ — thẻ “ค.ศ. 2020” gộp số vào chữ Thái), “định” dịch ตั้งใจจะ, “thi học kỳ” dịch สอบปลายภาค, “mùng 7” dịch วันที่เจ็ด (dương lịch). Bài 14 chỉ 8 từ |
| 6 | `b06` | `บทที่ 6_เวลา_bản quyền.pdf` | 47 | 88 | 52 | 🟡 2026-11-21 · 9 bài học · 8 mẫu câu (ตี / โมงเช้า / บ่าย…โมง / โมงเย็น / ทุ่ม, giờ + นาที, kiểu quốc tế นาฬิกา, giờ kém อีก…; ví dụ của GV) · 88 từ chép nguyên nghĩa của GV (từ “(ตอน) เช้า”… ghi `thai` = เช้า, `thai_alt` = ตอนเช้า; ยามหนึ่ง/สองยาม/สามยาม lấy từ slide “Điểm cần chú ý” p18). Bỏ p19–22 (bài tập đọc đồng hồ bằng hình, nhãn tiếng Anh). 52 câu luyện dịch: Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt); **câu 16 “Sau khuya một chút” nghĩa chưa rõ** → tạm dịch หลังเที่ยงคืนนิดหน่อย, cần GV xem. Bài 9 chỉ 5 từ |
| 7 | `b07` | `บทที่ 7_การเดินทางและการบอกทาง_bản quyền.pdf` | 45 | 101 | 24 | 🟡 2026-11-21 · 10 bài học · 6 mẫu câu (ไกลจาก…แค่ไหน, จาก…ถึง…ไกลแค่ไหน, ช่วยบอกทาง…หน่อยได้ไหม, ขอถามหน่อย…อยู่ที่ไหน/ไปทางไหน, คุณทราบ/รู้ไหมว่า…, ไม่ทราบ/รู้ว่า…; ví dụ của GV, dạng “ทราบ/รู้” tách thành 2 ví dụ) · 51 từ thẻ hình (p3–19, địa điểm/phương tiện/hướng) **không có nghĩa tiếng Việt trong tài liệu → Claude ghi nghĩa theo hình**, cần GV duyệt (vd. รถราง, รถตู้ส่งของ, เกสต์เฮาส์, โบสถ์); 50 từ bảng (p20–29) chép nguyên nghĩa của GV. 24 câu luyện dịch (nhiều câu là hội thoại hỏi đường / đi xe buýt): Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt) |
| 8 | `b08` | `บทที่ 8_การจองห้องพักโรงแรม_bản quyền.pdf` | 31 | 77 | 19 | 🟡 2026-11-21 · 8 bài học · 4 mẫu câu (อยาก + V, อยากได้ + N, กรุณา … (ให้ฉัน/ให้ผม) ด้วย, อยากขอ … เพิ่ม; ví dụ của GV) · 30 từ thẻ hình (p3–12, phòng/tiện nghi/đồ dùng) **không có nghĩa tiếng Việt trong tài liệu → Claude ghi nghĩa theo hình** (vài nghĩa khớp câu ví dụ của GV: ห้องพัก, เตียงคู่, ผ้าปูเตียง, ผ้าเช็ดตัว), cần GV duyệt; 47 từ bảng (p13–22) chép nghĩa của GV. **Chính tả cần GV xác nhận:** tài liệu viết เคาร์เตอร์บริการส่วนหน้า (p14) và เซ็นต์ชื่อ (p20) → Claude ghi theo chính tả chuẩn เคาน์เตอร์…, เซ็นชื่อ. 19 câu luyện dịch: Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt). Bài 8 chỉ 7 từ |
| 9 | `b09` | `บทที่ 9_การสั่งอาหาร_bản quyền.pdf` | 39 | 91 | 29 | 🟡 2026-11-21 · 10 bài học · 3 mẫu câu (เคย … ไหม/หรือยัง, … ไม่ได้, … ไม่เป็น; ví dụ của GV) · 66 từ thẻ hình (p3–24, món ăn/đồ uống/bát đũa) **không có nghĩa tiếng Việt trong tài liệu → Claude ghi nghĩa theo hình**, cần GV duyệt (vd. ชาเย็น, สาโท, เครื่องดื่มเกลือแร่, พ่อครัว/แม่ครัว/เชฟ); 25 từ bảng (p25–29) chép nguyên nghĩa của GV. 29 câu luyện dịch: Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt). Bài 10 chỉ 5 từ (trang 29) |
| 10 | `b10` | `บทที่ 10_การซื้อขาย_bản quyền.pdf` | 44 | 118 | 20 | 🟡 2026-11-21 · 13 bài học · 1 mẫu câu (Danh từ + ละ = mỗi …, chỉ 1 ví dụ คนละ của GV) · 81 từ thẻ hình (p3–29, quần áo/trái cây/thịt/rau/gia vị) **không có nghĩa tiếng Việt trong tài liệu → Claude ghi nghĩa theo hình**, cần GV duyệt (vd. สาลี่ / ลูกแพร์, ส้มจีน, กวางตุ้ง, ผักชีฝรั่ง); 37 từ bảng (p30–37) chép nguyên nghĩa của GV. 20 câu luyện dịch: Claude dịch Thái + `th_alt` + `tokens` + 1 thẻ nhiễu (chờ GV duyệt). Bài 2, 9, 13 chỉ 6–7 từ (theo nhóm trang) |
| 11 | `b11` | `บทที่ 11 สวมบทสนทนา ตอนที่ 1_bản quyền.pdf` | 21 | 0 | 67 | 🟡 2026-11-21 · 8 bài học = 7 hội thoại nhập vai (BTTH 01 dài 20 lượt → chia 2 bài; tổng 72 lượt, chỉ có tiếng Việt → Claude dịch Thái, chờ GV duyệt), 67 câu luyện dịch (bỏ 5 lượt trùng/quá ngắn: สวัสดีค่ะ, โอเคค่ะ ×2, ขอบคุณมากครับ, ไม่เป็นไรค่ะ lặp lại; `tokens` để build tự tách). Tên riêng phiên âm cần GV xem: เหงียน, เจิ่น, บั๊กนิญ, ไฮฟอง, บางแสน, วัดพระแก้ว, อนุสาวรีย์ชัยสมรภูมิ |
| 12 | `b12` | `บทที่ 12 สวมบทสนทนา ตอนที่ 2_bản quyền.pdf` | 21 | 0 | 59 | 🟡 2026-11-20 · 7 bài học = 5 hội thoại nhập vai (70 lượt, chỉ có tiếng Việt → Claude dịch Thái), 59 câu luyện dịch (`tokens` để build tự tách) |

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
