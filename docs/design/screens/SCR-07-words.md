# SCR-07 Sổ từ (route: `/words` · App layout) — Requirements: plan 0.7, 0.8 (P-04), V-02, V-03, V-04, V-05, V-07, B-02, C-03, F-12 ("cần ôn")

> Trạng thái: **Chờ owner duyệt** (M0.5b đợt 2, soạn 2026-11-21). Mở khóa **M10**. Wireframe: `SCR-07-words.png` (danh sách + chi tiết), `SCR-07-word-detail.png` (chi tiết đang viết mẹo nhớ của tôi).
> Màu: tokens hiện có (D1, mức thuộc = 3 sắc độ accent). M0.5c có thể đổi màu, không đổi bố cục.
> **Cần thay đổi dữ liệu ở M10** (spec dựa vào, chưa có trong code): (1) cột `mnemonic_vi` cho `words.csv` + `WordJsonSchema`; (2) bản ghi mới `WordNoteRecord` (mẹo nhớ của người học); (3) `NeedsReviewRecord.origin` thêm `'manual'`. Chi tiết ở §Dữ liệu.

---

## Mục đích
Một "cuốn sổ" chứa **mọi từ bạn đã học**: tra lại nhanh (gõ Thái hoặc Việt, không cần dấu), nghe lại, xem hình + **mẹo nhớ**, viết mẹo của riêng mình, đánh dấu từ cần ôn.

## Dữ liệu
| Phần tử | Nguồn |
|---|---|
| Danh sách từ | Content: `UnitBundle.words` của mọi unit (`useAllUnits()`), lọc theo phạm vi (dưới) |
| "Từ đã học" | Từ có ≥ 1 `CardRecord` `itemType: 'word'` (`listCards({ itemType: 'word' })`) — tức đã học bước Từ vựng hoặc "Thêm vào Sổ từ" (SCR-05) |
| Mức thuộc | `itemMastery(wordIds, cards)` (`packages/core/progress`) — 4 mức, mục nhiều thẻ lấy mức thấp nhất |
| Lần ôn tới, số lần ôn / quên | `CardRecord.fsrs.due`; `logsForCard(cardId)` → đếm, đếm `rating === 'again'` |
| Cờ "cần ôn" | `listNeedsReview()` (`itemType: 'word'`); bật/tắt tay → `putNeedsReview` / `deleteNeedsReview` với `origin: 'manual'` **(mới)** |
| Hình (V-02, V-05) | `Word.image`: `noto:<hex>` → SVG Noto Emoji self-host; `img/<tên>` → file trong content. Không có → không hiện ô hình |
| Mẹo nhớ gợi ý (V-04, V-07) | **Mới:** `Word.mnemonic_vi` (cột `mnemonic_vi` trong `words.csv`, tùy chọn; owner soạn, Claude có thể đề xuất → `draft`) |
| Mẹo nhớ của tôi (V-04) | **Mới:** `WordNoteRecord { id, itemType: 'word', itemId, mnemonic, updatedAt }` qua `ProgressRepository.getWordNote / putWordNote / deleteWordNote`; Dexie v6 bảng `wordNotes`; có trong export/import (G-02) và chuyển dữ liệu Guest → tài khoản (SCR-01 D2) |
| Phát âm | `AudioProvider` (giọng/tốc độ theo Cài đặt, M9.5) |
| Phiên âm | `Word.phonetic` — **ẩn mặc định** (plan 0.2), theo cài đặt "Hiện phiên âm" + nút bật cho từng từ |

**Phạm vi danh sách**
- Mặc định: **chỉ từ đã học** (có thẻ). Số ở mô tả trang tính trên phạm vi này.
- Khi chọn một chuyên đề (`?unit=` — link "Xem tất cả trong Sổ từ" ở SCR-04 dẫn tới đây): hiện **mọi từ của unit**, từ chưa học có mức "Chưa học" (○), để người học thấy còn bao nhiêu từ.
- Từ `draft` (kể cả thiếu `meaning_vi`) **vẫn hiện** như SCR-04; thiếu nghĩa → "—".

## Bố cục (desktop 1440, vùng nội dung max 1040 · 2 cột: danh sách 600 · chi tiết 400, cách 40)
```
Sổ từ                                                             (H1)
136 từ đã học · 38 đã thuộc · 6 cần ôn

[🔍 Tìm từ Thái hoặc nghĩa tiếng Việt…            /]  [Chuyên đề: Tất cả ▾]  [Sắp xếp: Theo bài ▾]
(Tất cả 136) (Đang học 40) (Đang nhớ 52) (Đã thuộc 38) (🔖 Cần ôn 6)                    [Aa Phiên âm]

┌ danh sách (600) ─────────────────────────────┐   ┌ chi tiết (400, sticky) ─────────────┐
│ BÀI 1 · ĐẠI TỪ NHÂN XƯNG             12 từ   │   │            🐱 (96px)                 │
│ ●  🐱 แมว        con mèo        ตัว  🔖  🔊 │◄  │            แมว    (th-lg 64px)      │
│ ◐  🐶 หมา        con chó        ตัว      🔊 │   │      [🔊 Phát âm  Space]  [Phiên âm P]│
│ ○      สวัสดี      xin chào               🔊 │   │ con mèo                              │
│ BÀI 2 · CHÀO HỎI…                    20 từ   │   │ Loại từ: ตัว · Cũng viết: แมว       │
│ ◐      ขอบคุณ     cảm ơn                 🔊 │   │ ┌ Mẹo nhớ ─────────────────────────┐ │
│ …                                            │   │ │ "แมว" đọc như "meo" — tiếng mèo   │ │
│                                              │   │ │ kêu.                    Mẹo gợi ý │ │
│ [ Hiện thêm 100 từ ]                         │   │ │ [✎ Viết mẹo nhớ của tôi  M]       │ │
└──────────────────────────────────────────────┘   │ └───────────────────────────────────┘ │
                                                   │ Ví dụ: แมวตัวนี้น่ารัก 🔊             │
                                                   │        Con mèo này dễ thương.         │
                                                   │ ── Mức thuộc: ● Đã thuộc              │
                                                   │ Ôn lần tới: 12/12 · Đã ôn 7 lần, quên 1│
                                                   │ [🔖 Cần ôn  C]   Mở Bài 1 ›            │
                                                   └───────────────────────────────────────┘
```

### A. Page header
H1 "Sổ từ" + dòng số "{n} từ đã học · {m} đã thuộc · {k} cần ôn" (`k` = 0 thì bỏ vế). Chọn chuyên đề → "{Bài n | Chuyên đề n}: {learned}/{total} từ đã học · {m} đã thuộc".

### B. Thanh công cụ
- **Ô tìm kiếm** (rộng ~420px, icon kính lúp, `<kbd>/</kbd>` bên phải): tìm **đồng thời** trên `thai`, `thai_alt`, mọi `meaning_vi`, `phonetic`, `note_vi`.
  - Tiếng Việt **không phân biệt dấu & hoa/thường**: chuẩn hóa NFD, bỏ dấu kết hợp, `đ → d`, lower-case ("meo" khớp "con mèo", "cam on" khớp "cảm ơn").
  - Tiếng Thái: chuẩn hóa bằng `normalizeThai()` (`packages/core/thai/normalize.ts`, như chấm gõ) rồi so khớp chuỗi con; bỏ khoảng trắng.
  - Gõ ≥ 1 ký tự là lọc; debounce 150 ms; tô đậm (`<mark>` nền `accent-subtle`) phần khớp ở cột Thái/nghĩa.
  - Hàm tìm là **hàm thuần** `searchWords(words, query)` trong `packages/core` (có unit test, gồm ca không dấu, Thái có dấu thanh, `thai_alt`).
- **Chuyên đề** (dropdown): "Tất cả" + danh sách unit theo thứ tự lộ trình ("Bài 1 · Đại từ nhân xưng", "Chuyên đề 3 · Loại từ"…).
- **Sắp xếp**: "Theo bài" (mặc định, có tiêu đề nhóm theo unit) · "Mới học gần đây" (`CardRecord.createdAt` giảm dần) · "Cần ôn trước" (cờ cần ôn → mức thấp → `due` sớm) · "Theo chữ Thái" (`Intl.Collator('th')`).
- **Chip mức thuộc** (bộ lọc 1 lựa chọn, kèm số): Tất cả · Đang học · Đang nhớ · Đã thuộc · 🔖 Cần ôn · (+ "Chưa học" chỉ khi đã chọn chuyên đề). Mỗi chip có chấm mức (○ ◐ ◑ ●) + chữ, không chỉ màu.
- **Toggle "Phiên âm"** (`Aa`): hiện cột phiên âm trong danh sách; mặc định theo Cài đặt.
- Mọi bộ lọc lưu trong URL: `?q=&unit=&level=learning|known|mastered|review|none&sort=&word=<id>` (link chia sẻ / quay lại giữ trạng thái).

### C. Danh sách từ (cột trái)
- `role="listbox"` (một từ được chọn) — dòng cao 52px, viền dưới `border`:
  `MasteryPips`/chấm mức · hình 24px (nếu có; không có → chừa trống để thẳng cột) · **chữ Thái 20px** (`th-sm`, `lang="th"`) · nghĩa đầu tiên (16px; có nhiều nghĩa → "; …") · loại từ (`classifier`, 14px `fg-muted`, `lang="th"`) · 🔖 nếu cần ôn · nút 🔊 (ghost, 32px).
  - Có phiên âm bật: dòng phụ 12px `fg-subtle` dưới chữ Thái.
  - Từ `draft`: badge "Bản nháp" `fg-subtle`; thiếu nghĩa → "—".
- Sắp "Theo bài": tiêu đề nhóm dính (sticky) "BÀI 1 · ĐẠI TỪ NHÂN XƯNG · 12 từ" (12px chữ hoa `fg-muted`).
- Dòng đang chọn: nền `accent-subtle`, viền trái 2px `accent`. Hover: nền `bg-subtle`.
- **Danh sách lớn** (dự kiến 2 000–3 000 từ khi đủ 27 unit):
  - Lọc/tìm chạy trên mảng trong bộ nhớ (content đã tải + `listCards` một lần, cập nhật bằng live query) — không truy vấn IndexedDB theo từng phím.
  - Hiển thị **100 dòng đầu**, nút "Hiện thêm 100 từ" (và tự tải thêm khi cuộn tới cuối); không thêm thư viện ảo hóa ở Phase 1. Xem Câu hỏi mở #3.
  - Đổi bộ lọc → về đầu danh sách, giữ từ đang chọn nếu còn trong kết quả, không thì chọn từ đầu tiên.
  - Phải tải nội dung **mọi unit** (`useAllUnits`) — hiện skeleton danh sách tới khi xong; unit lỗi tải → bỏ qua + cảnh báo nhỏ "Chưa tải được {n} chuyên đề." + "Thử lại".

### D. Chi tiết từ (cột phải, `sticky top 40`, card viền `border`, radius `lg`, padding 24)
Thứ tự hiện (V-03: **hình → chữ Thái → nghĩa**, nhưng trong Sổ từ hiện **cùng lúc**, không lật):
1. **Hình** 96px giữa (nếu có). Noto Emoji = minh họa, `alt` = nghĩa đầu tiên. Không có hình → bỏ khối, chữ Thái lên đầu (không dùng ảnh giữ chỗ).
2. **Chữ Thái** `th-lg` 64px (từ > 8 ký tự → 48px, > 14 → 32px; không bao giờ cắt), `lang="th"`.
3. Nút **"Phát âm `Space`"** (phụ) · **"Phiên âm `P`"** (ghost, bật/tắt cho từ này; hiện `phonetic` 16px `fg-muted`). Không có giọng Thái → nút vô hiệu + tooltip "Máy chưa có giọng đọc tiếng Thái".
4. **Nghĩa**: mọi `meaning_vi` nối "; " 20px; `pos` nhỏ `fg-muted` nếu có.
5. Dòng phụ 14px: "Loại từ: {classifier}" · "Cũng viết: {thai_alt}" · `note_vi` (`fg-muted`).
6. **Khối "Mẹo nhớ"** (nền `bg-subtle`, radius `md`, padding 16) — V-04 **ưu tiên mẹo của người học**:
   | Có mẹo của tôi | Có mẹo gợi ý | Hiển thị |
   |---|---|---|
   | ✓ | ✓/✗ | Mẹo của tôi (16px) + nhãn "Mẹo của bạn" · nút "Sửa" "Xoá" · link nhỏ "Xem mẹo gợi ý" (mở/thu mẹo content bên dưới, nếu có) |
   | ✗ | ✓ | Mẹo gợi ý + nhãn "Mẹo gợi ý" · nút "✎ Viết mẹo nhớ của tôi `M`" |
   | ✗ | ✗ | "Chưa có mẹo nhớ cho từ này." + nút "✎ Viết mẹo nhớ của tôi `M`" |
   - **Soạn mẹo** (`SCR-07-word-detail.png`): khối đổi thành `Textarea` 3 dòng (tối đa **200 ký tự**, đếm "{n}/200"), placeholder "Liên tưởng của bạn, vd. แมว đọc gần như “meo” — tiếng mèo kêu."; nút "Lưu `Ctrl+Enter`" (chính, trong khối) / "Huỷ `Esc`". Lưu → `putWordNote` ngay, toast "Đã lưu mẹo nhớ". Xoá → hỏi lại bằng dialog nhỏ "Xoá mẹo nhớ của bạn?" (Huỷ / Xoá). Rỗng sau khi trim = xoá.
   - Mẹo là văn bản thuần (không HTML/markdown); đoạn chữ Thái người học gõ được tự bọc `lang="th"`.
7. **Ví dụ** (nếu có): `example_th` 20px `lang="th"` + 🔊 · `example_vi` 14px `fg-muted`.
8. Đường kẻ `border`, rồi **Mức thuộc**: chấm + tên mức; "Ôn lần tới: {ngày}" (hôm nay/quá hạn → "Đến hạn hôm nay"); "Đã ôn {n} lần · quên {m} lần". Chưa học → "Chưa học — có trong {Bài n}." + link "Học {Bài n} ›".
9. Hàng hành động: toggle **"🔖 Cần ôn `C`"** (`aria-pressed`; bật = nền `accent-subtle`, chữ `accent`) · link "Mở {Bài n | Chuyên đề n} ›" → `/units/:unitId`.
   - Bật tay → `putNeedsReview({ origin: 'manual' })`; Bài tập (M9) đã ưu tiên mọi cờ và tự gỡ khi trả lời đúng — giữ nguyên hành vi đó cho cờ tay. Tooltip: "Bài tập sẽ ưu tiên từ này; tự bỏ khi bạn trả lời đúng."

### E. Liên kết với các màn khác (để M10 làm đồng bộ)
- **SCR-05 (flashcard bước Từ vựng)**: V-04 yêu cầu mẹo nhớ ở **mặt sau thẻ** → M10 thêm khối Mẹo nhớ (cùng quy tắc ưu tiên + nút "Viết mẹo nhớ của tôi") vào mặt sau thẻ SCR-05; dùng chung component `MnemonicBlock`.
- **SCR-04 B** khối Từ vựng: click từ → popover hiện thêm mẹo (rút gọn 1 dòng) — tùy chọn.
- **V-03 chế độ "Hình → Thái"**: thuộc flashcard/bài tập, không ở Sổ từ — xem Câu hỏi mở #4.

## Hành động
| Thao tác | Kết quả |
|---|---|
| `/` | Focus ô tìm kiếm |
| `Esc` (trong ô tìm) | Xoá từ khóa; lần 2 → bỏ focus |
| `↑` / `↓` (focus ở danh sách) | Chọn từ trước/sau, chi tiết cập nhật, URL `?word=` (replace, không thêm lịch sử) |
| `Home` / `End` | Từ đầu / cuối (đã tải) |
| `Space` hoặc `Enter` | Phát âm từ đang chọn |
| `P` | Bật/tắt phiên âm của từ đang chọn |
| `M` | Mở ô viết/sửa mẹo nhớ |
| `C` | Bật/tắt "Cần ôn" |
| `Ctrl+Enter` / `Esc` (trong ô mẹo) | Lưu / Huỷ |
| Click 🔊 trên dòng | Phát âm, **không** đổi từ đang chọn |
| Click dòng | Chọn từ |
| Click chip / dropdown | Lọc tại chỗ, cập nhật URL |
- Phím chữ cái chỉ bắt khi focus **không** ở ô nhập.

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| **Chưa học từ nào** | Thay danh sách + chi tiết bằng khối giữa: hình 📒 (Noto 64px), "Sổ từ đang trống", "Từ bạn học trong bài sẽ tự vào đây, kèm hình và mẹo nhớ.", nút chính "Học bài đầu tiên" → bài đầu của `continueTarget`; link phụ "Xem từ của Bài 1" (chọn `?unit=` unit đầu) |
| Không có kết quả tìm/lọc | Trong cột danh sách: "Không tìm thấy từ nào khớp “{q}”." + nút "Xoá bộ lọc"; nếu đang ở "Từ đã học" mà từ có trong content → gợi ý "Có {n} từ chưa học khớp — xem trong {Bài n}" |
| Đang tải | Skeleton 8 dòng + khối chi tiết skeleton |
| Lỗi tải content | Khối `danger-subtle`: "Không tải được danh sách từ." + "Thử lại" |
| Lỗi lưu mẹo | Toast lỗi "Chưa lưu được mẹo nhớ. Thử lại." — giữ nguyên nội dung trong ô |
| Offline | Bình thường (content đã cache, dữ liệu local); Noto SVG self-host nên vẫn có hình |
| Không có giọng Thái | Mọi nút 🔊 vô hiệu + tooltip; phần còn lại bình thường |
| Guest / đã đăng nhập | Giống nhau; mẹo nhớ lưu theo DB của người dùng hiện tại (Phase 2 mới đồng bộ) |
| 1024–1279px | Cột chi tiết thành **Sheet** trượt từ phải (rộng 400, `Esc` đóng) khi chọn từ; danh sách full width |
| `?word=` không tồn tại | Bỏ qua, chọn từ đầu tiên |

## Câu chữ (tiếng Việt)
"Sổ từ", "{n} từ đã học · {m} đã thuộc · {k} cần ôn", "{learned}/{total} từ đã học", "Tìm từ Thái hoặc nghĩa tiếng Việt…", "Chuyên đề:", "Tất cả", "Sắp xếp:", "Theo bài", "Mới học gần đây", "Cần ôn trước", "Theo chữ Thái", "Chưa học", "Đang học", "Đang nhớ", "Đã thuộc", "Cần ôn", "Phiên âm", "Phát âm", "Bản nháp", "Hiện thêm 100 từ", "Loại từ:", "Cũng viết:", "Mẹo nhớ", "Mẹo của bạn", "Mẹo gợi ý", "Xem mẹo gợi ý", "Viết mẹo nhớ của tôi", "Sửa", "Xoá", "Lưu", "Huỷ", "{n}/200", "Liên tưởng của bạn, vd. …", "Đã lưu mẹo nhớ", "Xoá mẹo nhớ của bạn?", "Chưa có mẹo nhớ cho từ này.", "Ví dụ", "Mức thuộc", "Ôn lần tới: {ngày}", "Đến hạn hôm nay", "Đã ôn {n} lần · quên {m} lần", "Chưa học — có trong {Bài n}.", "Học {Bài n}", "Mở {Bài n | Chuyên đề n}", "Bài tập sẽ ưu tiên từ này; tự bỏ khi bạn trả lời đúng.", "Sổ từ đang trống", "Từ bạn học trong bài sẽ tự vào đây, kèm hình và mẹo nhớ.", "Học bài đầu tiên", "Xem từ của Bài 1", "Không tìm thấy từ nào khớp “{q}”.", "Xoá bộ lọc", "Có {n} từ chưa học khớp — xem trong {Bài n}", "Không tải được danh sách từ.", "Chưa tải được {n} chuyên đề.", "Thử lại", "Chưa lưu được mẹo nhớ. Thử lại.", "Máy chưa có giọng đọc tiếng Thái".

## Lưu ý chữ Thái
- Mọi chữ Thái (`thai`, `thai_alt`, `classifier`, `example_th`, đoạn Thái trong mẹo) `lang="th"`, `font.family.th` (Sarabun), line-height `th` 1.75 — dòng danh sách cao 52px để dấu trên/dưới (vd. ญี่ปุ่น, ผู้หญิง) không bị cắt.
- Danh sách: `white-space: nowrap` + ellipsis cho nghĩa; **chữ Thái không cắt** (cột Thái rộng tối thiểu 160px; quá dài → xuống dòng theo `Intl.Segmenter`, không cắt giữa cụm ký tự).
- Ô tìm kiếm nhận được bàn phím Thái của hệ điều hành; **không** gắn bàn phím ảo Kedmanee ở đây (tra cứu, không phải luyện gõ).
- Tô đậm kết quả tìm trong chữ Thái phải bao trọn cụm ký tự (grapheme), không tách dấu thanh khỏi phụ âm.

## A11y
- Danh sách `role="listbox"` + `aria-activedescendant`; mỗi dòng `role="option"` có `aria-label` "{thai}, {nghĩa}, {mức thuộc}{, cần ôn}". Nút 🔊 trong dòng có nhãn "Phát âm {thai}" và nằm ngoài vòng `↑/↓` (chuột / `Tab`).
- Cột chi tiết `aria-live="polite"` chỉ đọc chữ Thái + nghĩa khi đổi từ (không đọc cả khối).
- Hình Noto: `alt` = nghĩa ở chi tiết; trong danh sách `alt=""` (trang trí, nghĩa đã có chữ).
- Chip lọc: `role="radiogroup"`; toggle Cần ôn / Phiên âm: `aria-pressed`.
- Kết quả tìm: vùng `aria-live` đọc "{n} từ".
- Không có lỗi axe serious/critical.

## Ngoài phạm vi
Thêm/sửa/xoá từ của content (Phase 2, Module M); tạo bộ từ riêng / thư mục; xuất CSV/Anki; ảnh do người học tải lên; đồng bộ mẹo nhớ giữa thiết bị (Phase 2); Claude đề xuất mẹo nhớ trong app (V-07 chỉ là script cho owner); luyện riêng một từ từ Sổ từ (dùng "Cần ôn" → Bài tập); chế độ flashcard trong Sổ từ; tra từ ngoài lexicon.

## Câu hỏi mở cho owner
1. **Nguồn mẹo nhớ gợi ý** — (a) *đề xuất*: thêm cột `mnemonic_vi` vào `words.csv` (tùy chọn, `draft` khi Claude đề xuất, owner duyệt); (b) chưa có mẹo content ở M10, chỉ có "mẹo của tôi"; (c) file riêng `mnemonics.csv` (id → mẹo) để không làm rộng `words.csv`.
2. **Sổ từ mặc định hiện gì** — (a) *đề xuất*: chỉ từ đã học, chọn chuyên đề thì hiện cả từ chưa học; (b) luôn hiện mọi từ (chip "Chưa học" luôn có); (c) chỉ từ đã học, không bao giờ hiện từ chưa học.
3. **Danh sách lớn** — (a) *đề xuất*: hiện 100 + "Hiện thêm"/tự tải khi cuộn, không thêm thư viện; (b) ảo hóa bằng `@tanstack/react-virtual` (mượt với 3 000+ từ, thêm 1 dependency); (c) phân trang 50 từ/trang.
4. **V-03 chế độ "Hình → Thái"** (đoán chữ từ hình) — (a) *đề xuất*: làm ở M10 như một tùy chọn thứ tự lớp trên flashcard SCR-05 (hình trước, che chữ Thái) cho từ có hình; (b) thành loại bài tập mới E-15 "Chọn từ cho hình" ở M9 engine; (c) để Phase 2 — hiện chưa có từ nào có `image` trong content.
5. **Cờ "cần ôn" bật tay** — (a) *đề xuất*: thêm `origin: 'manual'`, dùng chung hàng đợi ưu tiên của Bài tập; (b) không cho bật tay (chỉ trò chơi sinh cờ), Sổ từ chỉ hiển thị.
