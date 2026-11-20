# SCR-04 Bài học: Lộ trình & Chi tiết chuyên đề — Requirements: plan 0.4, 0.7, 0.8 (P-04, P-10, P-11), 0.11 #1–#3, #8

> Trạng thái: **✅ Owner duyệt 2026-11-19** (M0.5b). Wireframe: `SCR-04-units.png`, `SCR-04-unit-detail.png`.
> **Cập nhật v7.5 (2026-11-19, plan 0.12 #1, TC.1 — chỉ câu chữ/thứ tự, bố cục giữ nguyên):** lộ trình 2 nhánh **Giáo trình** (`kind: theme`, nhãn "Bài {order}") và **Chuyên đề** (`kind: grammar`, nhãn "Chuyên đề {order}"); Giáo trình xếp trước, `order` chỉ duy nhất trong nhánh. Bài con trong unit gọi là **"Bài học {n}"** để không trùng "Bài {n}" của giáo trình.
> Dữ liệu: `units.json` (`UnitSummary[]`), `unit-<id>.json` (`UnitBundle`) qua `useUnits()`/`useUnit(id)`; tiến độ từ `LessonProgressRecord`, `CanDoRecord`, mức thuộc FSRS (T7.2).

---

## A. Lộ trình (route: `/units` · App layout)

### Mục đích
Thấy toàn bộ **giáo trình rồi các chuyên đề** theo thứ tự của giáo viên, biết đang ở đâu và vào học tiếp bằng 1 thao tác.

### Dữ liệu
- Mỗi unit: `order`, `title_vi`, `title_th`, `level` (có thể trống), `kind` (`theme` | `grammar`), số bài, số từ, số câu, `draft`.
- Tiến độ: số bài xong / tổng (P-10: chưa học / đang học / xong), % từ đã thuộc của unit (P-04).
- "Học tiếp": bài **gần nhất đang dở**; không có thì bài chưa học đầu tiên theo thứ tự lộ trình (Giáo trình → Chuyên đề, rồi `order`).

### Bố cục (desktop 1440, vùng nội dung max 1040)
```
Bài học                                                        (H1)
Học giáo trình trước, rồi các chuyên đề — theo thứ tự hoặc chọn bất kỳ.

┌ Học tiếp ───────────────────────────────────────────────────────┐
│ Chuyên đề 3 · Loại từ                                            │
│ Bài học 2: Loại từ của con vật · 2/3 bước   [ Học tiếp  ↵ ]      │
└──────────────────────────────────────────────────────────────────┘

[Tất cả] [Giáo trình] [Chuyên đề]              4 bài & chuyên đề

┌──────────────────────────────────────────────────────────────────┐
│ (◔ 1)  Bài 1 Chào hỏi & giới thiệu ทักทายและแนะนำตัว A1           │
│        3 bài · 24 từ · 12 câu                Đang học · 1/3 bài ›│
├──────────────────────────────────────────────────────────────────┤
│ (○ 2)  Bài 2 Gia đình & con người  ครอบครัว          A1           │
│        3 bài · 20 từ · 10 câu                     Chưa học      ›│
├──────────────────────────────────────────────────────────────────┤
│ (◑ 3)  Chuyên đề 3 Loại từ         ลักษณนาม                       │
│        4 bài · 120 từ · 30 câu               Đang học · 2/4 bài ›│
├──────────────────────────────────────────────────────────────────┤
│ (● 11) Chuyên đề 11 Các trường hợp của น่า                        │
│        1 bài · 29 từ · 34 câu                       ✓ Xong      ›│
└──────────────────────────────────────────────────────────────────┘
Nguồn: giáo trình Tiếng Thái Thạc Sĩ Plern-Pin.                 (fg-subtle 12px)
```
- **Card "Học tiếp"**: nền `accent-subtle`, viền không, radius `lg`, padding 24. Nút chính duy nhất của màn hình (D3).
- **Bộ lọc**: segmented control 3 lựa chọn theo `kind`: "Tất cả" / "Giáo trình" / "Chuyên đề"; ẩn hẳn nếu mọi unit cùng `kind`. Số đếm bên phải theo bộ lọc: "{n} bài & chuyên đề" / "{n} bài" / "{n} chuyên đề".
- **Danh sách (`UnitPath`)**: một card viền `border`, các dòng cách nhau bằng đường kẻ. Mỗi dòng cao ~72px:
  - Trái: `ProgressRing` 40px (tỉ lệ bài xong), số thứ tự `order` ở giữa vòng. Xong → vòng đầy accent + dấu ✓ thay số.
  - Giữa: nhãn nhánh "Bài {order}" / "Chuyên đề {order}" 14px `fg-muted`, `title_vi` 16px medium, `title_th` 16px `fg-muted` (`lang="th"`), nhãn nhỏ `level` (nếu có) dạng badge viền `border`, chữ 12px. Dòng 2: "N bài · N từ · N câu" 14px `fg-muted`.
  - Phải: trạng thái chữ ("Chưa học" / "Đang học · x/y bài" / "✓ Xong") + chevron.
  - Unit `draft`: badge "Bản nháp" `fg-subtle` (bỏ khi owner publish).
- Số thứ tự **giữ nguyên theo giáo trình** (có thể nhảy 3 → 11), không đánh lại.

### Hành động
| Thao tác | Kết quả |
|---|---|
| "Học tiếp" / `Enter` | Mở thẳng bài `/units/:unitId/:lessonId` ở bước đang dở |
| Click dòng / `↑` `↓` chọn + `Enter` | `/units/:unitId` |
| Bộ lọc | Lọc tại chỗ, giữ trong URL `?kind=grammar` |

### Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Lần đầu (chưa học gì) | Card "Học tiếp" đổi thành "Bắt đầu với {Bài n | Chuyên đề n}: {tên}" + nút "Bắt đầu" |
| Đang tải | Skeleton 4 dòng |
| Không có nội dung | "Chưa có bài học nào. Nội dung đang được soạn." |
| Lỗi tải content | Khối `danger-subtle`: "Không tải được bài học." + "Thử lại" |
| Offline | Dùng content đã cache; chưa cache → "Cần kết nối mạng để tải bài học lần đầu." |
| Đã học hết | Card "Học tiếp" → "Bạn đã học xong giáo trình và mọi chuyên đề. Làm bài tập để giữ trí nhớ." + nút "Bài tập" |
| Guest / đã đăng nhập | Giống nhau |

---

## B. Chi tiết Bài / Chuyên đề (route: `/units/:unitId` · App layout)

### Mục đích
Xem các bài trong chuyên đề, mục tiêu cần đạt (can-do) và từ vựng; bắt đầu hoặc học tiếp bài.

### Bố cục (2 cột: nội dung 640 · cột phải 320, cách 40)
```
Bài học / Chuyên đề 3        (breadcrumb 14px; giáo trình: "Bài học / Bài 2")
Loại từ                                                 (H1)
ลักษณนาม                       [A2] [Chuyên đề]         (th 20px muted)
(◑) 2/4 bài xong · 38/120 từ đã thuộc     [ Học tiếp: Bài 3  ↵ ]

Các bài
┌──────────────────────────────────────────────┐   ┌ Mục tiêu ─────────────────┐
│ 1  Loại từ của đồ vật           ✓ Xong · 92% │   │ ☑ Dùng đúng loại từ khi    │
│    Từ vựng · Mẫu câu · Bài tập   30 từ · 8 câu│   │   đếm đồ vật              │
├──────────────────────────────────────────────┤   │ ☐ Hỏi số lượng với กี่ + LT│
│ 2  Loại từ của con vật          ✓ Xong · 85% │   └───────────────────────────┘
├──────────────────────────────────────────────┤   ┌ Từ vựng (120) ─────────────┐
│ 3  Loại từ của người, nghề      Đang học 1/3 │   │ ● ตุ๊กตา   búp bê    ตัว    │
├──────────────────────────────────────────────┤   │ ◐ รองเท้า  giày      คู่    │
│ 4  Loại từ trừu tượng           Chưa học     │   │ ○ ช้อน     thìa      คัน    │
└──────────────────────────────────────────────┘   │ … Xem tất cả trong Sổ từ › │
                                                    └───────────────────────────┘
                                                    Nguồn: Tiếng Thái Thạc Sĩ
                                                    Plern-Pin · bài 3
```
- **Dòng bài**: số bài, `title_vi`, dòng 2 = **chỉ các bước có trong `lesson.steps`** (vd. unit ngữ pháp: "Mẫu câu · Từ vựng · Bài tập") + "N từ · N câu". Phải: "Chưa học" / "Đang học x/y bước" / "✓ Xong · {điểm bài tập}%".
- **Mục tiêu (`CanDoList`)**: checkbox; tự tick khi mọi bài của unit xong (P-11), người học tick/bỏ tick tay được. Tick tự động có chú thích nhỏ "Tự đánh dấu khi xong mọi bài học".
- **Từ vựng**: tối đa 8 dòng: chấm mức thuộc (○ chưa học, ◐ đang học/đang nhớ, ● đã thuộc — sắc độ accent + ký hiệu, không chỉ màu), `thai` (`lang="th"`), `meaning_vi` (nghĩa đầu), `classifier` nếu có. Click từ → popover nhỏ (nghĩa đầy đủ, `note_vi`, nút phát âm). Link "Xem tất cả trong Sổ từ" → `/words?unit=:unitId`.
- **Nguồn** (0.11 #8): 12px `fg-subtle`, câu chữ owner duyệt.

### Hành động
| Thao tác | Kết quả |
|---|---|
| Nút chính / `Enter` | Bài đang dở; không có → bài chưa học đầu tiên; tất cả xong → "Ôn lại bài 1" |
| Click dòng bài (mọi bài, kể cả chưa tới — mở khóa mềm) | `/units/:unitId/:lessonId` |
| Tick can-do | Lưu `CanDoRecord` ngay |
| `Esc` / breadcrumb | Về `/units` |

### Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| unitId không tồn tại | Trang 404 nội bộ: "Không tìm thấy bài hoặc chuyên đề này." + "Về Bài học" |
| Unit không có can-do | Ẩn khối Mục tiêu |
| Từ chưa có nghĩa (draft) | Hiện "—" ở cột nghĩa |
| Đang tải / lỗi / offline | Như mục A |
| Hoàn thành chuyên đề | Dòng trạng thái đầu trang: "✓ Đã xong {Bài n | Chuyên đề n}" + nút chính "Làm bài tập {Bài n | Chuyên đề n}" → `/practice?unit=:unitId` |

## Câu chữ (tiếng Việt)
"Bài học", "Học giáo trình trước, rồi các chuyên đề — theo thứ tự hoặc chọn bất kỳ.", "Học tiếp", "Bắt đầu", "Tất cả", "Giáo trình", "Chuyên đề", "Bài {n}", "Chuyên đề {n}", "Bài học {n}", "{n} bài học · {n} từ · {n} câu", "Chưa học", "Đang học · {x}/{y} bài", "Đang học {x}/{y} bước", "✓ Xong", "Bản nháp", "Các bài", "Mục tiêu", "Tự đánh dấu khi xong mọi bài học", "Từ vựng ({n})", "Xem tất cả trong Sổ từ", "Nguồn: …".

## Lưu ý chữ Thái
- `title_th` và từ Thái luôn `lang="th"`, `font.family.th`, `line-height.th`; không cắt dòng giữa từ (dùng `word-break: keep-all`, tràn → ellipsis ở danh sách, đầy đủ ở tooltip).
- Không hiển thị phiên âm ở màn này.

## Ngoài phạm vi
Khóa cứng bài, sắp xếp lại thứ tự, tìm kiếm chuyên đề, ảnh bìa chuyên đề.
