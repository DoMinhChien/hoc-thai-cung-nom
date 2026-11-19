# SCR-06 Bài tập: Trang Bài tập, Phiên làm bài, Kết quả — Requirements: plan 0.5 (E-01..E-14), 0.8 (P-05), G-06, 7.2

> Trạng thái: **📝 Chờ owner duyệt** (M0.5b, 2026-11-18). Wireframe: `SCR-06-practice.png`, `SCR-06-session-arrange.png`, `SCR-06-session-typing.png`, `SCR-06-result.png`.
> Component dùng lại từ M8: `ThaiTextInput`, `ThaiKeyboard`, `TypingFeedback`, `gradeThaiTyping`.

---

## A. Trang Bài tập (route: `/practice` · App layout)

### Mục đích
Một chỗ để làm **"Bài tập hôm nay"** (thẻ SRS đến hạn: từ **và** câu), luyện câu sai, hoặc luyện theo chuyên đề.

### Bố cục (max 1040)
```
Bài tập                                                         (H1)
Ôn từ và luyện dịch câu theo lịch nhắc lại.

┌ Bài tập hôm nay ─────────────────────────────────────────────────┐
│ 18 câu đến hạn  ·  12 từ · 6 câu  ·  khoảng 6 phút                 │
│ Mục tiêu ngày ▓▓▓▓▓▓░░░░ 12/20                 [ Bắt đầu  ↵ ]       │
└──────────────────────────────────────────────────────────────────┘

┌ Luyện câu sai ────────────────┐ ┌ Kiểu bài ──────────────────────────┐
│ 7 câu sai trong 7 ngày qua    │ │ (•) Tất cả   ( ) Từ vựng            │
│ [ Luyện câu sai  W ]          │ │ ( ) Dịch câu ( ) Gõ chữ Thái        │
└───────────────────────────────┘ └────────────────────────────────────┘

Luyện theo chuyên đề
┌──────────────────────────────────────────────────────────────────┐
│ 1  Chào hỏi & giới thiệu       24 từ · 12 câu   Đúng 86%  [Luyện] │
│ 3  Loại từ                    120 từ · 30 câu   Đúng 72%  [Luyện] │
│ 11 Các trường hợp của น่า        29 từ · 34 câu   —          [Luyện] │
└──────────────────────────────────────────────────────────────────┘
```
- Card "Bài tập hôm nay": nền `accent-subtle`; là **hành động chính** duy nhất. Số câu mỗi phiên mặc định 20 (Cài đặt), lấy đến hạn trước, thiếu thì bù câu mới đã học trong bài.
- "Kiểu bài": lọc loại câu hỏi cho phiên kế tiếp (Tất cả / Từ vựng = E-01..E-03, E-14 / Dịch câu = E-04..E-06, E-08, E-09 / Gõ chữ Thái = E-07). Nhớ lựa chọn.
- "Luyện theo chuyên đề": chỉ các unit đã học ít nhất 1 bài; tỉ lệ đúng 30 ngày; "Luyện" → phiên 10 câu của unit (không cần đến hạn). Hỗ trợ `/practice?unit=:id` (mở sẵn phiên của unit).
- Sidebar: mục **Bài tập** có badge số câu đến hạn (SCR-00).

### Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Chưa học bài nào | Card chính: "Học bài đầu tiên để có bài tập." + nút "Đến Bài học" |
| Hôm nay đã xong | Card chính: "✓ Xong bài tập hôm nay. Lần tới: {n} câu vào ngày mai." + nút phụ "Luyện thêm 10 câu" |
| Không có câu sai | Ẩn card "Luyện câu sai" |
| Offline / Guest | Hoạt động bình thường (dữ liệu local) |

---

## B. Phiên làm bài (route: `/practice/session` · Focus layout; cũng nhúng trong bước Bài tập của SCR-05)

### Khung
```
[✕ Thoát  Esc]  ▓▓▓▓▓▓▓░░░░░░░░░░░░░  7 / 20                    ✓ 6
┌──────────────────────────────────────────────────────────────────┐
│ Sắp xếp thành câu tiếng Thái                       (14px muted)  │
│                                                                  │
│ (đề bài)                                                         │
│                                                                  │
│ (vùng trả lời)                                                   │
└──────────────────────────────────────────────────────────────────┘
[ Bỏ qua  S ]                                   [ Kiểm tra  ↵ ]
──────────────── sau khi kiểm tra: thanh phản hồi đáy ───────────────
│ ✓ Chính xác!                                     [ Tiếp  ↵ ]      │   nền success-subtle
│ ✕ Chưa đúng · Đáp án: ผีในหนังเรื่องนี้น่ากลัวมาก  [ Tiếp ↵ ]   │   nền danger-subtle
```
- Thanh tiến độ mảnh 4px (P-05), số câu, số đúng. Thoát giữa chừng: dialog "Dừng bài tập? Kết quả các câu đã làm vẫn được lưu." (Tiếp tục / Dừng).
- Phản hồi luôn có **icon + chữ** (không chỉ màu). Phản hồi đúng có âm báo nhẹ (tắt được, F-13).
- Câu sai được **hỏi lại 1 lần** ở cuối phiên (không chấm FSRS lần 2).
- **Chấm FSRS** (lần trả lời đầu): đúng ngay = Good · đúng sau gợi ý hoặc chỉ sai dấu (E-07) = Hard · sai / bỏ qua = Again. Điểm phiên tính "Hard" là đúng.
- Bậc dịch (E-11) chọn loại câu hỏi cho từng câu: bậc 2 → E-05/E-04, bậc 3 → E-06 (có thẻ nhiễu), bậc 4 → E-07.

### Bố cục theo loại câu hỏi
| Loại | Đề bài | Vùng trả lời | Phím |
|---|---|---|---|
| E-01 Nghĩa của từ | Từ Thái 48px + 🔊 | 4 lựa chọn tiếng Việt, xếp dọc, full-width | `1`–`4` |
| E-02 Từ cho nghĩa | Nghĩa Việt 24px | 4 lựa chọn Thái 24px | `1`–`4` |
| E-03 Ghép cặp | — | 2 cột × 5 thẻ (Thái · Việt); chọn trái rồi phải; cặp đúng mờ đi | chuột / `Tab` |
| E-04 Điền chỗ trống | Câu Thái có ô `____` | 4 thẻ từ | `1`–`4` |
| E-05 Chọn bản dịch | Câu Thái 24px + 🔊 | 4 câu Việt | `1`–`4` |
| E-06 Sắp xếp câu | Câu Việt 20px | Dòng trả lời (đường kẻ dưới) + **ngân hàng thẻ từ** (`tokens` + `distractors` xáo trộn); click thẻ → lên dòng; click thẻ trên dòng → trả về | `1`–`9` chọn thẻ, `Backspace` bỏ thẻ cuối |
| E-07 Gõ bản dịch | Câu Việt 20px | `ThaiTextInput` 24px + `ThaiKeyboard` (ẩn/hiện `Ctrl+K`); kết quả bằng `TypingFeedback` (đúng / sai dấu / sai chữ + diff) | `Enter` kiểm tra, `H` gợi ý = hiện 1 từ đầu |
| E-08 Nghe hiểu | Nút ▶ lớn 64px (tự phát 1 lần), "Nghe lại `R`" | Như E-05 hoặc E-06 | `R`, `1`–`4` |
| E-09 Hỏi ↔ đáp | — | Như E-03 (cột câu hỏi · cột trả lời, câu Thái) | chuột / `Tab` |
| E-14 Loại từ | Danh từ Thái 48px, hoặc cụm "แมว 2 ___" | Bậc 1: 4 lựa chọn loại từ; bậc 4: ô gõ + bàn phím | `1`–`4` / `Enter` |

- Mọi chữ Thái trong đáp án/đề `lang="th"`; lựa chọn là `<button>` có số phím ở góc trái.
- Câu draft thiếu `th` **không** dùng làm câu hỏi.
- Không có giọng Thái → bỏ E-08 khỏi phiên; nút 🔊 vô hiệu.

---

## C. Kết quả phiên (cuối `/practice/session`)
```
Xong bài tập                                                   (H1)
  85%            17/20 đúng          6 phút
  ─────────────────────────────────────────
  Câu sai (3)
  ┌──────────────────────────────────────────────────────────┐
  │ Đáp án đúng: ผีในหนังเรื่องนี้น่ากลัวมาก                       │
  │ Bạn trả lời: ผีในหนังนี้น่ากลัวมาก   (diff: thiếu เรื่อง)        │
  │ Đề: Con ma trong phim này đáng sợ lắm.                    │
  └──────────────────────────────────────────────────────────┘
  [ Luyện lại câu sai  ↵ ]        [ Về Bài tập ]   [ Làm thêm 10 câu ]
```
- 3 số lớn (32px): % đúng, x/y, thời gian. Danh sách câu sai: đáp án đúng (Thái 20px), câu trả lời của người học (với E-07 dùng diff `TypingFeedback`), đề; nút 🔊 mỗi câu.
- Không sai câu nào → "✓ Không sai câu nào" và nút chính "Về Bài tập".
- Khi nhúng trong bài học: thêm dòng hoàn thành ≥ 80% theo SCR-05.

## Câu chữ
"Bài tập", "Ôn từ và luyện dịch câu theo lịch nhắc lại.", "Bài tập hôm nay", "{n} câu đến hạn", "khoảng {n} phút", "Mục tiêu ngày", "Bắt đầu", "Luyện câu sai", "{n} câu sai trong 7 ngày qua", "Kiểu bài", "Tất cả", "Từ vựng", "Dịch câu", "Gõ chữ Thái", "Luyện theo chuyên đề", "Đúng {n}%", "Luyện", "Thoát", "Kiểm tra", "Bỏ qua", "Tiếp", "Chính xác!", "Chưa đúng", "Đáp án:", "Gần đúng — sai dấu", "Gợi ý", "Nghe lại", "Chọn nghĩa đúng", "Chọn từ tiếng Thái", "Ghép các cặp", "Điền vào chỗ trống", "Chọn bản dịch đúng", "Sắp xếp thành câu tiếng Thái", "Dịch sang tiếng Thái", "Nghe và chọn nghĩa", "Ghép câu hỏi với câu trả lời", "Loại từ của từ này là gì?", "Dừng bài tập?", "Xong bài tập", "Câu sai", "Bạn trả lời:", "Luyện lại câu sai", "Về Bài tập", "Làm thêm 10 câu", "✓ Xong bài tập hôm nay".

## Lưu ý chữ Thái
Thẻ từ E-06 cao tối thiểu 48px để dấu trên/dưới không bị cắt; `tokens` không tách giữa cụm ký tự; ô gõ dùng `font.family.th` 24px, line-height `th`.

## Ngoài phạm vi
Dịch tự do chấm bằng AI (E-20, Phase 2), XP/leaderboard (Phase 2), giới hạn thời gian mỗi câu (chỉ có trong Trò chơi).
