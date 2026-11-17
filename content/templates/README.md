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

- **`level`**: `A1` hoặc `A2`. **`order`**: số thứ tự 1, 2, 3…
- **`draft`**: `true` = nội dung chưa được duyệt; để trống hoặc `false` khi đã duyệt.
- **`phonetic`** (words.csv): tùy chọn, chữ Latin thường không dấu, ngăn âm tiết bằng `-` (vd. `sa-wat-di`). App ẩn phiên âm mặc định.
- **`image`**: emoji Noto `noto:<mã hex>` (vd. `noto:1f44b` = 👋) hoặc file `img/<tên>.svg|png|webp|jpg`.
- **`tokens`** (sentences.csv): tách câu Thái thành các thẻ từ để người học sắp xếp. **Ghép các thẻ lại phải ra đúng `th`** (không tính khoảng trắng). Vd. `th = ผมชื่อสมชาย` → `tokens = ผม|ชื่อ|สมชาย`.
- **`distractors`**: thẻ nhiễu cho bài sắp xếp khó; **không được trùng** thẻ nào trong `tokens`.
- **`th_alt`**: các bản dịch Thái khác cũng được chấp nhận (vd. thêm ครับ/ค่ะ); không trùng `th`.
- **`audio`**: tùy chọn, `audio/<tên>.mp3|m4a|ogg`. Để trống thì app dùng giọng đọc máy (TTS).

## Khuyến nghị (cảnh báo, không chặn)

Mỗi unit 3–4 bài; mỗi bài 8–12 từ; mỗi hội thoại 4–8 câu (plan mục 0.4).

## Kiểm tra trước khi gửi

```sh
pnpm content:check --input <file hoặc thư mục>
```

Lệnh báo lỗi kèm `file:dòng [cột]`, vd. `sentences.csv:5 lỗi [tokens]: tokens ghép lại là "…", không khớp th "…"`. Dòng 1 là dòng tên cột, nên dòng dữ liệu đầu tiên là dòng 2.

Tên file staging nhận dạng theo phần đầu: `words.<nguồn>.csv`, `sentences.<nguồn>.csv`, `grammar.<nguồn>.yaml`…
