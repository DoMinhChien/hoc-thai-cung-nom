# SCR-05 Bài học (route: `/units/:unitId/:lessonId` · Focus layout) — Requirements: plan 0.4, 0.11 #3, B-03/B-04, C-02/C-03/C-04/C-06/C-07, V-02/V-03, 7.2

> Trạng thái: **✅ Owner duyệt 2026-11-19** (M0.5b). Wireframe: `SCR-05-lesson-vocab.png`, `SCR-05-lesson-dialogue.png`.

## Mục đích
Học một bài 10–15 phút qua các bước **có trong `lesson.steps`** (thứ tự do build quyết định: unit `theme` = Từ vựng → Mẫu câu → Hội thoại → Bài tập; unit `grammar` = Mẫu câu → Từ vựng → Bài tập). Không có dữ liệu cho bước nào thì bước đó **không hiện**.

## Dữ liệu
`UnitBundle` của unit (lesson, words, sentences, grammar, dialogues lọc theo `lesson_id`); `LessonProgressRecord` (bước đã xong, điểm); thẻ SRS của từ; `voiceStatus` (T7.3); Cài đặt "hiện phiên âm" (mặc định tắt).

## Khung chung (focus layout, D6)
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [✕ Thoát  Esc]   Chuyên đề 3 · Bài 1: Loại từ của đồ vật                    │
│                  ① Từ vựng ✓ ── ② Mẫu câu ── ③ Hội thoại ── ④ Bài tập        │
├───────────────────────────────────────────────────────────────────────────┤
│                         (nội dung bước, max 720, căn giữa)                 │
└───────────────────────────────────────────────────────────────────────────┘
```
- **Stepper**: chỉ các bước có dữ liệu, đánh số lại 1..n. Bước xong có ✓; bước hiện tại chữ `accent` medium + gạch dưới 2px. **Mở khóa mềm**: click bước nào cũng được. Phím `[` / `]` chuyển bước trước/sau.
- Không có sidebar, không có nav. Thoát → về `/units/:unitId`; tiến độ đã lưu theo **bước đã xong** nên không cần hỏi xác nhận.
- Banner (nếu `voiceStatus = none`): nền `warning-subtle`, "Máy chưa có giọng đọc tiếng Thái — nút nghe sẽ không phát được." + link "Cách cài" (mở hướng dẫn ngắn trong dialog). Chỉ hiện 1 lần mỗi phiên.

## Bước Từ vựng
```
                                   3 / 10                      [Thẻ | Danh sách]
            ┌───────────────────────────────────────────────┐
            │                     🧸                          │
            │                  ตุ๊กตา                 (th-xl) │
            │                  [🔊 R]                         │
            │ ─────────────────────────────────────────────── │
            │  búp bê                               (20px)    │
            │  Loại từ: ตัว                                   │
            │  ฉันมีตุ๊กตาสองตัว — Tôi có hai con búp bê.        │
            │  [Phiên âm  P]                                  │
            └───────────────────────────────────────────────┘
              [ Chưa nhớ  1 ]                 [ Đã biết  2 ]
                        (trước khi lật: [ Hiện nghĩa  Space ])
```
- **Mặt trước**: hình (nếu có, Noto Emoji 64px), từ Thái `th-xl`, nút nghe. **Mặt sau** (Space / click): `meaning_vi` (các nghĩa nối bằng "; "), "Loại từ: {classifier}" (nếu có), `note_vi` (nhỏ, `fg-muted`), câu ví dụ `example_th` — `example_vi`, `thai_alt` ("Cũng viết: …"). Phiên âm **ẩn**, bấm "Phiên âm" (P) để hiện cho thẻ này.
- Lật thẻ **tự phát âm** nếu bật trong Cài đặt (mặc định bật).
- "Đã biết" → thẻ tiếp. "Chưa nhớ" → thẻ quay lại cuối hàng trong bước này (tối đa 1 lần).
- Mọi từ xem xong được **đưa vào SRS** (`introduceCard`, B-03/B-04); nút 1/2 chỉ đổi thứ tự trong bước, **không** chấm FSRS.
- **Chế độ Danh sách** (dùng cho bài nhiều từ, vd. unit ngữ pháp ~30 từ): bảng 3 cột Thai · Nghĩa · Loại từ/ghi chú, mỗi dòng có nút nghe; nút "Xong bước này".
- Kết thúc: màn tóm tắt nhỏ "Đã xem 10 từ · 3 từ cần chú ý" + nút **"Tiếp: Mẫu câu ↵"**.
- Từ draft thiếu nghĩa: mặt sau hiện "Chưa có nghĩa" `fg-subtle`.

## Bước Mẫu câu
- Mỗi điểm ngữ pháp một khối: tiêu đề `title_vi` (H2 20px), **khung mẫu** nền `bg-subtle`, radius `md`, chữ 24px (`pattern`, vd. "น่า + động từ"), `explain_vi` 16px, danh sách ví dụ: từ/câu Thái 20px + nghĩa Việt `fg-muted` + nút nghe.
- Nhiều điểm ngữ pháp → xếp dọc, cách 40px. Nút cuối **"Tiếp: … ↵"**.

## Bước Hội thoại
```
┌ Hội thoại (640) ─────────────────────────────┐  ┌ Tra từ (320) ───────────┐
│ [▶ Phát cả đoạn]           [Bản dịch  T: Bật]│  │ คุณ                       │
│                                              │  │ bạn, anh, chị (ngôi 2)  │
│ A  สวัสดีครับ                          [🔊]    │  │ [🔊]                     │
│    Xin chào.                                 │  │ [+ Thêm vào Sổ từ]       │
│ B  สวัสดีค่ะ                           [🔊]    │  │                         │
│    Xin chào.                                 │  │ (chưa chọn: "Chạm vào   │
│ A  คุณ|ชื่อ|อะไร|ครับ                   [🔊]    │  │  một từ để tra")        │
│    Bạn tên là gì?                            │  └─────────────────────────┘
└──────────────────────────────────────────────┘
```
- Mỗi lượt thoại: nhãn người nói (A/B, 14px `fg-muted`, cột 32px), câu Thái 22px, bản dịch 16px `fg-muted` dưới. **Không bong bóng chat màu**.
- Câu Thái tách từ (C-02, `Intl.Segmenter` / `|`); từ có trong bài **gạch chân chấm** mảnh; hover nền `accent-subtle`; click → panel phải (C-03). Từ ngoài lexicon: "Chưa có trong từ điển" (C-04).
- "Thêm vào Sổ từ" → `introduceCard`; đã có → nút thành "✓ Trong Sổ từ" (vô hiệu).
- `T` bật/tắt bản dịch (C-06, nhớ lựa chọn), "Phát cả đoạn" đọc lần lượt, dòng đang đọc nền `bg-subtle` (C-07). `↑` `↓` chọn dòng, `R` nghe dòng đang chọn.

## Bước Bài tập
- Nhúng **phiên bài tập** của SCR-06 (cùng component, cùng phím tắt) với câu hỏi sinh từ từ + câu của bài này (8–12 câu). Ở M7: khung + các loại có sẵn; loại đầy đủ ở M9.
- Kết thúc → màn kết quả SCR-06 §C, thêm dòng: **≥ 80%** → "✓ Hoàn thành bài" + nút chính "Bài tiếp theo ↵" (hoặc "Về chuyên đề" nếu là bài cuối); **< 80%** → "Cần đạt 80% để hoàn thành bài" + nút chính "Làm lại câu sai ↵", phụ "Để sau".

## Màn hoàn thành bài
Sau bước cuối (≥ 80%): tiêu đề "Xong Bài {n}: {tên}", 3 số (từ đã học · câu đã luyện · điểm), nếu unit vừa xong: dòng "✓ Bạn đã hoàn thành chuyên đề {tên}" + các can-do vừa tick. Không confetti, không âm thanh ăn mừng.

## Phím tắt (hiện ngay trên nút, D4)
`Esc` thoát · `[` `]` đổi bước · `Space` lật / hiện nghĩa · `1` `2` chưa nhớ / đã biết · `R` nghe lại · `P` phiên âm · `T` bản dịch · `Enter` nút chính.

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Bài không tồn tại | "Không tìm thấy bài học." + "Về chuyên đề" |
| Đang tải | Skeleton thẻ |
| Không có giọng Thái | Banner (trên), nút nghe vô hiệu kèm tooltip |
| Offline | Học bình thường nếu content đã cache |
| Quay lại bài đã xong | Mở bước 1, mọi bước có ✓; làm lại không giảm điểm cũ (lưu điểm cao nhất) |
| Draft | Badge "Bản nháp" cạnh tên bài |

## Câu chữ
"Thoát", "Từ vựng", "Mẫu câu", "Hội thoại", "Bài tập", "Hiện nghĩa", "Chưa nhớ", "Đã biết", "Phiên âm", "Loại từ:", "Cũng viết:", "Chưa có nghĩa", "Thẻ", "Danh sách", "Xong bước này", "Tiếp: {bước}", "Phát cả đoạn", "Bản dịch", "Tra từ", "Chạm vào một từ để tra", "Thêm vào Sổ từ", "✓ Trong Sổ từ", "Chưa có trong từ điển", "Hoàn thành bài", "Bài tiếp theo", "Cần đạt 80% để hoàn thành bài", "Làm lại câu sai", "Để sau", "Máy chưa có giọng đọc tiếng Thái…".

## Lưu ý chữ Thái
`th-xl` cho từ trên thẻ (≥ 64px), câu thoại 22px, line-height `th`; vùng chứa đủ cao cho dấu trên/dưới (không `overflow: hidden` theo chiều dọc). Tách từ không được làm vỡ cụm ký tự (dấu luôn đi cùng phụ âm).

## Ngoài phạm vi
Ghi âm/chấm phát âm (Phase 2), bài đọc dài (Phase 2), thanh điệu (bỏ ở v7), hiệu ứng lật 3D.
