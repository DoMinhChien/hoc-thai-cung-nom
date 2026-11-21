# Mẫu nhập liệu nội dung (plan mục 0.9)

Thư mục này chứa **6 file mẫu**. Mỗi file có đủ cột/trường và **một dòng ví dụ**. Muốn thêm nội dung, sao chép file sang thư mục `content/` (cùng tên file) rồi điền tiếp, hoặc gửi file đã điền cho người phụ trách repo.

| File | Một dòng/mục là | Mở bằng |
|---|---|---|
| `units.csv` | một chủ đề (Unit), cấp A1/A2 | Excel / Google Sheets |
| `lessons.csv` | một bài học trong unit | Excel / Google Sheets |
| `words.csv` | một từ vựng | Excel / Google Sheets |
| `sentences.csv` | một câu để luyện dịch | Excel / Google Sheets |
| `grammar.yaml` | một mẫu câu (ngữ pháp) | trình soạn thảo văn bản (Notepad, VS Code) |
| `dialogues.yaml` | một đoạn hội thoại | trình soạn thảo văn bản |

## Mở và lưu CSV đúng cách

- **Google Sheets:** Tệp → Nhập → Tải lên → chọn file. Khi lưu: Tệp → Tải xuống → **CSV**.
- **Excel:** Dữ liệu → Từ văn bản/CSV → chọn **File Origin: 65001 Unicode (UTF-8)**. Nếu mở bằng cách nhấp đúp, chữ Thái/Việt có thể bị lỗi font. Khi lưu: **CSV UTF-8 (Comma delimited)**.
- **Giữ nguyên dòng đầu tiên (tên cột).** Không đổi tên, không xóa cột. Cột tùy chọn được để trống.
- Ô có dấu phẩy `,` thì Excel/Sheets tự thêm ngoặc kép khi lưu, không cần làm gì.

## Ký tự đặc biệt trong một ô

| Ký tự | Dùng ở | Ý nghĩa |
|---|---|---|
| `\|` | `can_do`, `grammar_ids`, `th_alt`, `tokens`, `distractors` | ngăn nhiều mục trong một ô |
| `;` | `meaning_vi`, `tags` (words.csv) | ngăn nhiều nghĩa / nhãn |

## Đặt id

- Chỉ dùng **chữ thường a–z, số và dấu gạch nối**, không dấu, không khoảng trắng: `u01`, `u01-l1`, `sawatdee`, `s-u01-001`.
- Mỗi id là **duy nhất trong file của nó**. Gợi ý: unit `u01`…`u16`; bài `u01-l1`; câu `s-u01-001`; mẫu câu `g-u01-<tên>`; hội thoại `d-u01-l1`.
- Các cột `unit_id`, `lesson_id`, `grammar_id`, `grammar_ids` phải **trỏ tới id đã có** ở file tương ứng.

## Các cột cần chú ý

- **`unit_id` / `order`** (units.csv): nên theo **số chuyên đề** của giáo viên, vd. Bài 3 → `b03`, Chuyên đề 3 → `c03` (`kind: grammar`), `order` = 3. Thứ tự lộ trình trong app theo `order`.
- **`level`**: `A1`, `A2`, `B1` hoặc để trống.
- **`kind`**: `theme` (từ vựng theo chủ đề, mặc định khi để trống) hoặc `grammar` (điểm ngữ pháp / cách dùng, vd. "Các trường hợp của น่า"). Unit `grammar` cho phép bài dài (tối đa 40 từ) và học Mẫu câu trước Từ vựng.
- **`emoji`** (units.csv, tùy chọn — cột có thể không có): 1 emoji minh họa của bài/chuyên đề trên Lộ trình (vd. `📅`). Trống → mặc định 📘 (Giáo trình) / 🧩 (Chuyên đề).
- **`draft`**: `true` = nội dung chưa được duyệt; để trống hoặc `false` khi đã duyệt. Mục `draft: true` **được thiếu** `meaning_vi` (words.csv) và `th` (sentences.csv); bỏ `draft` thì bắt buộc điền.
- **`thai_alt`** (words.csv): cách viết/từ khác cùng nghĩa, ngăn bằng `|` (vd. ภาษิต → `สุภาษิต`).
- **`note_vi`**: ghi chú cách dùng (vd. "dùng cho thuyền lớn", "trong quân sự").
- **`classifier`**: loại từ (ลักษณนาม) đi kèm danh từ khi đếm, vd. แมว → `ตัว`.
- **`phonetic`** (words.csv): tùy chọn, chữ Latin thường không dấu, ngăn âm tiết bằng `-` (vd. `sa-wat-di`). App ẩn phiên âm mặc định.
- **`image`**: emoji Noto `noto:<mã hex>` (vd. `noto:1f44b` = 👋) hoặc file `img/<tên>.svg|png|webp|jpg`.
- **`tokens`** (sentences.csv): tách câu Thái thành các thẻ từ để người học sắp xếp. **Ghép các thẻ lại phải ra đúng `th`** (không tính khoảng trắng). Vd. `th = ผมชื่อสมชาย` → `tokens = ผม|ชื่อ|สมชาย`. Để trống thì app tự tách (có cảnh báo "cần duyệt").
- **`distractors`**: thẻ nhiễu cho bài sắp xếp khó; **không được trùng** thẻ nào trong `tokens`.
- **`th_alt`**: các bản dịch Thái khác cũng được chấp nhận (vd. thêm ครับ/ค่ะ); không trùng `th`.
- **`audio`**: tùy chọn, `audio/<tên>.mp3|m4a|ogg`. Để trống thì app dùng giọng đọc máy (TTS).

## Khuyến nghị (cảnh báo, không chặn)

Mỗi unit 3–4 bài; mỗi bài 8–12 từ (unit `grammar`: tối đa 40); mỗi hội thoại 4–8 câu (plan mục 0.4). Mục draft thiếu nghĩa/đáp án được cảnh báo từng dòng.

## Ánh xạ tài liệu Plern-Pin

Giáo trình "Tiếng Thái Thạc Sĩ Plern-Pin" chia theo chuyên đề đánh số. Mỗi chuyên đề là một dòng `units.csv`; ghi `source` dạng `plernpin-<số chuyên đề>#p<trang>` (vd. `plernpin-03#p1`).

| Trong tài liệu | Ghi vào | Cách điền |
|---|---|---|
| **Bảng loại từ** (cột trái danh từ, có khi kèm `: nghĩa`; cột phải trống) — vd. chuyên đề 3 "Loại từ" | `words.csv`, unit `kind = theme` | `thai` = danh từ; `meaning_vi` = phần sau dấu `:` (không có thì để trống + `draft: true`); `classifier` = loại từ (giáo viên điền đáp án; chưa có thì để trống) |
| **Danh sách cách dùng** `น่า…: nghĩa` — vd. chuyên đề 11 "Các trường hợp của น่า" | `grammar.yaml` (1 mẫu câu: `pattern` = `น่า + động từ`, vài ví dụ) + `words.csv` (mỗi dòng danh sách là một từ), unit `kind = grammar` | Nghĩa có nhiều ý ngăn bằng dấu phẩy → đổi sang `;` (vd. `Đáng yêu, dễ thương` → `đáng yêu; dễ thương`); chú thích trong ngoặc → `note_vi` |
| **"Bài tập vận dụng"** (câu tiếng Việt, dòng `=>` trống) | `sentences.csv` | `vi` = câu tiếng Việt; `th` để trống + `draft: true` khi chưa có đáp án; giáo viên điền `th` (và `th_alt` nếu nhiều cách dịch) rồi bỏ `draft` |
| Header/footer, số Zalo, watermark | — | Bỏ qua |

## Kiểm tra trước khi gửi

```sh
pnpm content:check --input <file hoặc thư mục>
```

Lệnh báo lỗi kèm `file:dòng [cột]`, vd. `sentences.csv:5 lỗi [tokens]: tokens ghép lại là "…", không khớp th "…"`. Dòng 1 là dòng tên cột, nên dòng dữ liệu đầu tiên là dòng 2.

Tên file staging nhận dạng theo phần đầu: `words.<nguồn>.csv`, `sentences.<nguồn>.csv`, `grammar.<nguồn>.yaml`…
