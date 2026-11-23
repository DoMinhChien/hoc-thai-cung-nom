# SCR-08 v3 — Chọn nội dung cho Trò chơi (ôn bài đã học)

> Nguồn: phản hồi CAT 2026-11-22: *"Phần trò chơi, thêm option cho chọn nội dung, mục đích cho người học ôn lại nội dung đã học."* Plan §0.16 · ROADMAP **M12.8**.
> Bổ sung SCR-08 v2 (chỉ thay khối **"Nguồn"** trên `/games` + màn kết quả); 8 trò, theme, kỹ năng giữ nguyên. Áp dụng responsive SCR-00 v2.
> Trạng thái: **owner duyệt hướng 2026-11-22** (qua phản hồi). PR là thay đổi UI → owner xem link preview rồi merge (AGENTS 8.1).

## 1. Vấn đề hiện tại

- Chỉ có 2 lựa chọn: "Từ đã học" (mọi thẻ SRS) hoặc **một** chuyên đề (gồm cả từ chưa học).
- "Từ đã học" chưa đủ 6 mục thì **lặng lẽ** chuyển sang Bài 1 — ảnh CAT: *"Từ đã học (0 từ · 0 câu)"* nhưng *"Bạn đang chơi với từ chưa học của Bài 1"* → khó hiểu.
- Không ôn được "bài tuần này", "Bài 9 + 10", hay "các từ tôi hay sai".

## 2. Khối "Nội dung ôn" (thay select "Nguồn")

Nút lớn hiển thị lựa chọn hiện tại + số mục, vd. **"Bài 9, Bài 10 · 34 từ · 21 câu ▸"**. Chạm → mở **bộ chọn nội dung** (desktop: dialog; phone: bottom sheet full-height).

Bộ chọn có 2 phần:

**A. Ôn nhanh** (chip, chọn 1 — số mục hiện ngay trên chip, chip < 6 mục bị mờ + lý do):
| Chip | Nội dung | Dữ liệu |
|---|---|---|
| **Tất cả đã học** | mọi từ/câu có thẻ SRS (như "Từ đã học" cũ) | `progress.listCards()` |
| **Học gần đây** | mục bắt đầu học trong **7 ngày** qua | thẻ SRS `createdAt` / `SessionRecord` |
| **Cần ôn** | mục đang gắn cờ "cần ôn" (sai trong Bài tập / Trò chơi) + thẻ đến hạn hôm nay | `needsReview` + FSRS `due ≤ hôm nay` |
| **Bài vừa học** | bài học hoàn thành gần nhất | `SessionRecord` mới nhất loại lesson |

**B. Chọn theo bài** — danh sách theo lộ trình, 2 nhóm **Giáo trình** (Bài 1–12) rồi **Chuyên đề** (1–15), mỗi nhóm thu gọn được:
- Mỗi dòng: checkbox, "Bài 9 — <tên>", màu chuyên đề, số mục đã học / tổng, vd. *"18/40 từ · 6/30 câu"*. Mở rộng (▸) → checkbox **từng bài học** bên trong.
- Chọn **nhiều** bài / bài học. Nút nhanh: "Chọn các bài đã học", "Bỏ chọn".
- Bộ lọc dưới danh sách (radio): **Chỉ mục đã học** (mặc định — đúng mục tiêu ôn) · **Cả mục chưa học** (để làm quen trước).

Chân bộ chọn (dính đáy): tổng *"34 từ · 21 câu"* + nút **"Chơi với nội dung này"** (tắt khi < 6 mục, kèm câu: *"Cần ít nhất 6 từ hoặc câu — chọn thêm bài hoặc bật 'Cả mục chưa học'"*).

## 3. Quy tắc

- **Bỏ fallback lặng lẽ** sang Bài 1. Người mới (0 mục đã học): mặc định mở chip **"Bài vừa học"** nếu có; không có thì chọn sẵn **Bài 1 + "Cả mục chưa học"** và ghi rõ trên nút *"Bài 1 · mục chưa học"*.
- Kỹ năng (Tất cả / Từ vựng / Câu / Loại từ) lọc **trên** nội dung đã chọn; số ở mỗi tab kỹ năng tính theo nội dung đã chọn. Trò không đủ mục cho nội dung hiện tại: thẻ trò mờ + "Cần ≥ n câu".
- Ưu tiên câu hỏi: trong nội dung đã chọn, mục **cần ôn / đến hạn** được xuất hiện trước (F-10), phần còn lại xáo trộn.
- Nhớ lựa chọn cuối (setting `games.source` — định dạng mới, migrate giá trị cũ `learned` / `unit:<id>`). Kỷ lục cá nhân tính theo **trò** (không theo tổ hợp nội dung) để không bị phân mảnh.
- Trò chơi vẫn **không đổi FSRS** (F-12); mục sai → cờ "cần ôn".

## 4. Lối vào "Chơi để ôn" từ nơi khác

- Màn **hoàn thành bài học**: nút phụ **"🎮 Chơi ôn bài này"** → `/games?source=lesson:<lessonId>`.
- Trang **chi tiết bài / chuyên đề**: nút **"Chơi ôn"** → `/games?source=unit:<unitId>`.
- **Tổng quan**: thẻ "Ôn bằng trò chơi" khi có mục cần ôn → `/games?source=review`.
- Màn **kết quả trò chơi**: giữ "Chơi lại", "Đổi trò", "Chơi với mục sai"; thêm **"Đổi nội dung"** mở bộ chọn.
- URL `?source=` dạng: `learned` · `recent` · `review` · `last-lesson` · `units:b09,b10[;new]` · `lessons:<id>,<id>[;new]` (`;new` = gồm mục chưa học).

## 5. Kiểm thử

- Core (Vitest): hàm chọn nguồn theo từng loại + `;new`, đếm mục, ưu tiên cần ôn, migrate setting cũ, < 6 mục không fallback.
- E2E: mở bộ chọn, chọn Bài 9 + 10 chỉ mục đã học → đếm đúng → chơi Ghép cặp; chip "Cần ôn" sau khi cố tình sai trong Bài tập; nút "Chơi ôn bài này" ở màn hoàn thành bài học; phone (bottom sheet) + desktop; axe; baseline mới.
