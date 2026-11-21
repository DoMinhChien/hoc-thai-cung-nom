# SCR-09 Tiến độ (route: `/progress` · App layout) — Requirements: plan 0.8 (P-01, P-04, P-05, P-08, P-10, P-11, P-12), P-09, R1 v7 (R-01', R-02', R-03, R-04', R-05, R-06, R-07)

> Trạng thái: **✅ Owner duyệt 2026-11-21** — Q1 **a**, Q2 **a + b**, Q3 **a** (§Câu hỏi đã chốt). Mở khóa **M10**. Wireframe: `SCR-09-progress.png` (trang đầy đủ, cuộn dọc).
> ⛔ Không làm (plan 0.2, 4.9 v7): `MasteryGrid`, `HeatmapTable` / heatmap kiểu GitHub, `ToneBarChart`, R-04 thanh điệu, P-09 "độ chính xác theo nhóm chữ/thanh", R-01 "chữ cái / 44", P-06 (Phase 2).
> Màu: hướng B M0.5c cho card/nền; biểu đồ theo §Quy tắc biểu đồ (chỉ accent + mastery).

---

## Mục đích
Báo cáo cá nhân **tính hoàn toàn trên máy** (không gửi dữ liệu ra ngoài): mình học đều chưa, nhớ được bao nhiêu, kỹ năng nào yếu, hay sai ở mẫu câu nào — và mỗi điểm yếu có **1 nút để luyện ngay**.

## Dữ liệu (mọi số là selector thuần trong `packages/core/progress`, input = records + content + `now`, có unit test với đồng hồ giả)
| Khối | Số liệu | Nguồn |
|---|---|---|
| A. Tổng quan (R-01') | Từ đã thuộc / đã học; câu đã luyện; bài học xong / tổng; chuyên đề xong / tổng; mục tiêu can-do đạt / tổng | `listCards()` + `countMastery()`; `listLessonProgress()`; `canDoChecklist()` (`progress/lessons.ts`) + `listCanDo()` |
| B. Hoạt động (R-02') | Lượt học mỗi ngày 30 ngày; chuỗi hiện tại & dài nhất; số ngày học trong 30 ngày; thời gian ước tính | `attemptsBetween()`, `logsBetween()` (30 ngày; chuỗi dài nhất: toàn lịch sử), `CardRecord.createdAt`; quy tắc "ngày học" & chuỗi **dùng chung SCR-03** |
| C. Trí nhớ (R-03, R-05, P-04) | Phân bố 4 mức thuộc (từ / câu); tỉ lệ nhớ 7 & 30 ngày; dự báo đến hạn 7 ngày + tổng 30 ngày | `itemMastery()`; `logsBetween()` — retention = lượt ôn thẻ đang ở `review` **không** `again` / tổng lượt ôn thẻ `review`; dự báo từ `CardRecord.fsrs.due` |
| D. Kỹ năng (P-12, `SkillBars`) | 4 thanh % | Từ vựng = % từ đã học ở mức Đã thuộc; 3 thanh còn lại = tỉ lệ đúng **lần trả lời đầu** (`rating ≠ null`) 30 ngày theo nhóm `exerciseType` (bảng dưới) |
| E. Lộ trình (P-10, P-11, R-07) | Mỗi unit: trạng thái, bài xong, % từ thuộc, can-do | `useAllUnits()` + `unitLessonProgress()`, `unitStatus()`, `countMastery()` theo unit, `canDoChecklist()` |
| F. Lỗi hay gặp (R-04') | Top mẫu câu sai nhiều nhất; tỉ lệ đúng theo loại bài | `attemptsBetween()` 30 ngày, câu → `Sentence.grammar_id` → `Grammar.title_vi` / `pattern`; nhóm theo `exerciseType` |
| G. Từ & câu khó (R-06) | Top 10 mục có nhiều lần "Quên" | `logsBetween()` toàn lịch sử, đếm `rating === 'again'` theo `cardId` → `CardRecord.itemType/itemId` |
| H. Trò chơi (P-09) | Kỷ lục mỗi trò, số lượt, mục "cần ôn" từ trò chơi | `listGameResults()` (gộp mọi `source`: lấy kỷ lục tốt nhất, cộng `plays`); `listNeedsReview()` `origin: 'game'`; tên trò từ `games/catalog.ts` (`ALL_GAME_IDS`) |

**Nhóm kỹ năng P-12** (đặt thành hằng số `SKILL_GROUPS` trong core để dễ chỉnh):
| Thanh | Loại bài tính vào |
|---|---|
| Từ vựng | Không theo lượt — % từ Đã thuộc (mức `mastered`) trên số từ đã học |
| Dịch Thái → Việt | E-01, E-04, E-05, E-09 |
| Dịch Việt → Thái | E-02, E-06, E-07, E-14 |
| Nghe hiểu | E-08 |
- < 10 lượt trong 30 ngày → thanh xám, chữ "Chưa đủ dữ liệu ({n} lượt)" thay cho %.

**Thời gian học** (R-02, owner Q2 = **a + b**): từ M10 mỗi lượt **bài học / bài tập / trò chơi** ghi một `SessionRecord` (`start` khi vào, `end` khi xong hoặc rời trang) — dùng chung cho thời gian học và chuỗi ngày (SCR-03 Q2 b). Thời gian = tổng thời lượng các phiên đã kết thúc (mỗi phiên tối đa 60 phút, phiên chưa `end` không tính) **+ ước tính** cho dữ liệu cũ trước phiên đầu tiên: 15 s × số lượt bài tập / ôn thẻ không thuộc phiên nào. Luôn hiển thị "khoảng {n} giờ {m} phút".

## Bố cục (desktop 1440, vùng nội dung max 1040 · trang cuộn dọc, các khối là card viền `border`, radius `lg`, padding 24, cách nhau 24)
```
Tiến độ                                                          (H1)
Số liệu tính trên máy này, cập nhật sau mỗi lượt học.

A ┌ 38/136 ────┐ ┌ 24 ────────┐ ┌ 5/31 ──────┐ ┌ 1/27 ──────┐ ┌ 7/23 ──────┐
  │ từ đã thuộc│ │ câu đã luyện│ │ bài học xong│ │ bài & c.đề │ │ mục tiêu   │
  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘

B ┌ Hoạt động 30 ngày ──────────────────────────────── 5 ngày liên tiếp · dài nhất 12 ┐
  │ 40┤                                         ▆                                    │
  │   ┤- - - - - - - - - - - - - - - - - - - - -│- - - - - - - Mục tiêu 20 - - - -     │
  │ 20┤      ▃ ▅      ▂ ▆ ▇   ▅      ▃ ▅ ▆ ▅ ▇  █ ▃ ▅ ▆ ▇ ▅                          │
  │  0┼──────────────────────────────────────────────────────── (hôm nay đậm hơn)    │
  │    22/10                     6/11                          21/11                  │
  │ 19/30 ngày có học · 612 lượt · khoảng 4 giờ 10 phút              [Xem dạng bảng] │
  └────────────────────────────────────────────────────────────────────────────────────┘

C ┌ Trí nhớ ──────────────────────────────┐ D ┌ Kỹ năng ────────────────────────────┐
  │ Từ  ▓▓▓▓▒▒▒▒░░░░  136                 │   │ Từ vựng          ▓▓▓▓░░░░░░  28%    │
  │     ○12 ◐40 ◑46 ●38                    │   │ Dịch Thái → Việt ▓▓▓▓▓▓▓▓░░  82%    │
  │ Câu ▓▓▓▒▒░░░░░░░   24                 │   │ Dịch Việt → Thái ▓▓▓▓▓░░░░░  61%    │
  │ Nhớ đúng: 7 ngày 88% · 30 ngày 84%    │   │ Nghe hiểu        Chưa đủ dữ liệu (4)│
  │ Đến hạn 7 ngày tới: ▂▅▃▁▂▄▂  (tổng 41)│   │ Theo lần trả lời đầu, 30 ngày qua.  │
  │ 30 ngày tới: 156 câu                   │   └─────────────────────────────────────┘
  └───────────────────────────────────────┘

E ┌ Lộ trình & mục tiêu ───────────────────────────── [Tất cả|Giáo trình|Chuyên đề] ┐
  │ ● Bài 1  Đại từ nhân xưng          3/3 bài   ▓▓▓▓▓▓▓░ 72% từ thuộc   4/4 mục tiêu │
  │ ◐ Bài 2  Chào hỏi và giới thiệu…   1/4 bài   ▓▓░░░░░░ 18%            1/5         │
  │ ○ Bài 12 Nhập vai hội thoại (2)    0/5 bài   ░░░░░░░░ —              0/5         │
  │ ◐ Chuyên đề 1 Đại từ nâng cao      1/2 bài   ▓▓▓░░░░░ 31%            0/2         │
  └────────────────────────────────────────────────────────────────────────────────────┘

F ┌ Lỗi hay gặp (30 ngày) ────────────────┐ G ┌ Từ & câu khó ───────────────────────┐
  │ Theo mẫu câu                           │   │ ขอบคุณ   cảm ơn            Quên 4 lần│
  │ … ชื่ออะไร (hỏi tên)       sai 5/12     │   │ แมว      con mèo           Quên 3 lần│
  │ … อยู่ที่ไหน (hỏi nơi chốn) sai 3/9      │   │ ผมชื่อ…  Tôi tên là…        Quên 3 lần│
  │ Theo loại bài                          │   │ …                                    │
  │ Gõ bản dịch 54% · Sắp xếp câu 71% …    │   │ [ Luyện nhóm này ]                   │
  │ [ Luyện câu sai  W ]                   │   └─────────────────────────────────────┘
  └───────────────────────────────────────┘

H ┌ Trò chơi ───────────────────────────────────────────────────────────────────────────┐
  │ Ghép cặp 0:42 · 9 lượt   Đúng hay sai? 1 240 điểm · 14 lượt   Xếp câu tốc độ Chưa chơi│
  │ Đoán loại từ 860 điểm · 3 lượt   …(8 trò)                6 mục cần ôn từ trò chơi › │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

### A. Tổng quan (R-01') — 5 ô số
Số 24px semibold + nhãn 14px `fg-muted`. Ô "từ đã thuộc" có `ProgressRing` 32px (P-01). Ô là link: từ → `/words?level=mastered`, câu → khối C, bài → `/units`, mục tiêu → khối E.

### B. Hoạt động 30 ngày (R-02') — biểu đồ cột (shadcn `Chart` / Recharts, plan 7.5)
- 30 cột = 30 ngày (cũ → mới, cột cuối là hôm nay). Giá trị = **số lượt** trong ngày (lượt bài tập + lượt ôn thẻ + từ mới vào học).
- Một chuỗi số liệu → **không có chú giải**; tiêu đề card gọi tên số liệu.
- **Đường mục tiêu**: nét đứt 1px `fg-subtle` tại mục tiêu ngày, nhãn chữ "Mục tiêu {n}" ở đầu phải đường.
- Góc phải tiêu đề: "{n} ngày liên tiếp · dài nhất {m}" (0 → "Chưa có chuỗi ngày").
- Dòng dưới: "{d}/30 ngày có học · {n} lượt · khoảng {t}" + nút ghost "Xem dạng bảng" (bật bảng Ngày | Lượt | Đạt mục tiêu ✓).
- **Hover/focus cột** → tooltip "T5, 21/11: 38 lượt · ✓ đạt mục tiêu"; cột 0 lượt vẫn có vùng hover cao full chart.

### C. Trí nhớ (R-03, R-05, P-04)
- 2 `StackedProgressBar` (cao 12px): **Từ**, **Câu** — 4 mức (none/learning/known/mastered = 3 sắc độ accent + nền trống), khe 2px giữa đoạn; dưới mỗi thanh là `MasteryLegend` có **ký hiệu + số** (○ 12 · ◐ 40 · ◑ 46 · ● 38) — không dựa chỉ vào màu.
- "Nhớ đúng: 7 ngày {a}% · 30 ngày {b}%" (< 10 lượt → "—").
- **Dự báo**: biểu đồ cột mini 7 ngày tới (cao 48px, nhãn trục T2…CN, giá trị trên tooltip) + "30 ngày tới: {n} câu". Hôm nay gồm cả mục quá hạn.

### D. Kỹ năng (P-12, `SkillBars`)
- 4 thanh ngang 8px, nền `bg-subtle`, phần đầy `accent`; nhãn trái, **% chữ ở phải** (chữ màu `fg`, không màu accent). Ghi chú cuối: "Theo lần trả lời đầu, 30 ngày qua." Thanh yếu nhất (≥ 10 lượt, < 60%) có link "Luyện ›" → `/practice` với Kiểu bài tương ứng (Từ vựng / Dịch câu / Gõ chữ Thái) — Nghe hiểu → Kiểu bài "Tất cả".

### E. Lộ trình & mục tiêu (P-10, P-11, R-07)
- Bảng gọn, mỗi unit một dòng (thứ tự lộ trình), bộ lọc nhánh như `/units` (ẩn nếu chỉ 1 nhánh). Cột: trạng thái (○ ◐ ● + chữ ẩn cho screen reader) · "Bài n / Chuyên đề n" + `title_vi` · "{x}/{y} bài" · thanh mảnh % từ thuộc + số · "{x}/{y} mục tiêu".
- Mặc định hiện unit **đã bắt đầu** + unit kế tiếp; nút "Hiện cả {n} bài & chuyên đề chưa học".
- Click dòng → `/units/:unitId` (danh sách can-do đầy đủ ở SCR-04 B; ở đây chỉ số).

### F. Lỗi hay gặp (R-04', 30 ngày)
- **Theo mẫu câu**: top 5 `grammar` có số lần sai (lần trả lời đầu) nhiều nhất, tối thiểu 3 lượt: `pattern` (chữ Thái, `lang="th"`) + `title_vi` + "sai {x}/{y}". Click → `/units/:unitId` của mẫu câu.
- **Theo loại bài**: tối đa 10 loại có lượt, dạng chữ "Gõ bản dịch 54% · Sắp xếp câu 71% · …" (tên loại = tiêu đề câu hỏi ở SCR-06), sắp % tăng dần.
- Nút "Luyện câu sai `W`" → `/practice/session?mode=mistakes` (cùng phiên với SCR-06). Không có lỗi → "✓ Không có lỗi lặp lại trong 30 ngày qua." và ẩn nút.

### G. Từ & câu khó (R-06)
- Top 10 mục (từ **và** câu) có ≥ 2 lần "Quên": chữ Thái (`lang="th"`, câu cắt 1 dòng) · nghĩa / câu Việt · "Quên {n} lần" · 🔊.
- Nút "Luyện nhóm này" → `/practice/session?items=…` (tham số `items` **đã có** từ M9 — dùng `encodeItems` như nút "Luyện lại câu sai" của SCR-06), tối đa 20 mục. Ít hơn 3 mục → ẩn khối.

### H. Trò chơi (P-09)
- Lưới card nhỏ cho **mọi trò đã chơi** (theo thứ tự `ALL_GAME_IDS`): tên trò + chấm màu `color.game.*` (ngoại lệ khu Trò chơi cho phép; trò arcade chưa có màu riêng → không chấm) · kỷ lục (định dạng như SCR-08: Ghép cặp = thời gian, còn lại = điểm) · "{n} lượt" · "Đúng {x}%" của lượt kỷ lục. Trò chưa chơi gộp 1 dòng "Chưa chơi: Xếp câu tốc độ, Mê cung…".
- Cuối khối: "{n} mục cần ôn từ trò chơi ›" → `/words?level=review`. Chưa chơi trò nào → "Bạn chưa chơi trò nào." + link "Chơi thử ›" → `/games`.

## Quy tắc biểu đồ (áp dụng mọi biểu đồ ở màn này và SCR-03)
1. **Chỉ tokens**: cột/đoạn đầy `color.accent`; cột hôm nay `color.accent-hover`; cột ngày khác có thể dùng `mastery.known` nếu M0.5c muốn nhạt hơn — không thêm màu. Lưới & trục `color.border`; nhãn trục 12px `fg-muted`; giá trị & nhãn luôn màu chữ (`fg` / `fg-muted`), **không** tô chữ bằng màu số liệu. Mức thuộc chỉ dùng `color.mastery.*` (1 sắc độ, nhạt → đậm). Màu đúng/sai (`success`/`danger`) **không** dùng trong biểu đồ.
2. **Hình dạng**: cột mảnh (khoảng cách giữa cột ≥ 2px), đầu cột bo 4px, chân cột bám đường 0; trục y bắt đầu từ 0, tối đa 3 vạch lưới ngang; **không** biểu đồ 2 trục y, không 3D, không tròn/donut cho phân bố (dùng thanh xếp chồng).
3. **Một chuỗi = không chú giải**; ≥ 2 chuỗi (chỉ thanh mức thuộc) = luôn có chú giải ký hiệu + chữ + số.
4. **Tương tác**: mọi cột có tooltip khi hover **và** khi focus bàn phím (`←` `→` di chuyển giữa cột khi biểu đồ có focus); vùng bắt chuột cao full biểu đồ.
5. **A11y**: biểu đồ là `role="img"` + `aria-label` tóm tắt ("30 ngày qua: 19 ngày có học, trung bình 20 lượt mỗi ngày, cao nhất 38 vào 21/11"); luôn có **"Xem dạng bảng"** (bảng HTML thật). Không truyền đạt thông tin chỉ bằng màu.
6. `prefers-reduced-motion`: tắt animation vẽ cột của Recharts (`isAnimationActive={false}`); mặc định animation ≤ `motion.base`.
7. Số định dạng `Intl.NumberFormat('vi-VN')` (1 240), ngày `dd/MM`, thứ "T2…CN".

## Hành động
| Thao tác | Kết quả |
|---|---|
| Click ô tổng quan | Điều hướng như §A |
| "Xem dạng bảng" | Bật/tắt bảng số liệu dưới biểu đồ (nhớ lựa chọn trong settings `progressShowTable`) |
| `Tab` vào biểu đồ, `←` `→` | Tooltip từng ngày |
| "Luyện ›" ở Kỹ năng | `/practice` với Kiểu bài tương ứng |
| `W` / "Luyện câu sai" | `/practice/session?mode=mistakes` |
| "Luyện nhóm này" | Phiên bài tập với các mục khó |
| Click dòng lộ trình / mẫu câu | `/units/:unitId` |
| "{n} mục cần ôn từ trò chơi" | `/words?level=review` |
- Trang không có hành động chính nền `accent` (báo cáo); các nút luyện là nút phụ.

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| **Chưa học gì** | Thay toàn bộ khối B–H bằng khối giữa: "Chưa có số liệu", "Học bài đầu tiên — tiến độ, biểu đồ và điểm yếu của bạn sẽ hiện ở đây.", nút chính "Học bài đầu tiên"; khối A vẫn hiện với số 0 |
| Mới học vài ngày | Biểu đồ vẫn đủ 30 cột (ngày trống = 0); khối nào thiếu dữ liệu tự ẩn hoặc ghi "Chưa đủ dữ liệu" (D: < 10 lượt; F: không có lỗi; G: < 3 mục; H: chưa chơi) |
| Đang tải | Skeleton theo từng khối (số liệu local, thường < 300 ms); không chớp trạng thái rỗng |
| Lỗi tải content | Khối A–D, H vẫn hiện (chỉ cần records) nhưng tên unit/mẫu câu hiện "—"; banner `danger-subtle` "Không tải được nội dung bài học — một số tên có thể thiếu." + "Thử lại" |
| Lỗi đọc IndexedDB | "Không đọc được tiến độ trên máy này." + "Tải lại trang" |
| Offline | Bình thường (toàn bộ local) |
| Guest | Giống đã đăng nhập; dòng mô tả thêm "· Bạn chưa đăng nhập: tiến độ chỉ ở trình duyệt này." |
| Đã đăng nhập | Mô tả chuẩn; số liệu theo DB của tài khoản trên máy này |
| 1024–1279px | Các cặp khối C|D và F|G xếp dọc 1 cột; ô tổng quan 3 + 2 |

## Câu chữ (tiếng Việt)
"Tiến độ", "Số liệu tính trên máy này, cập nhật sau mỗi lượt học.", "Bạn chưa đăng nhập: tiến độ chỉ ở trình duyệt này.", "từ đã thuộc", "câu đã luyện", "bài học xong", "bài & chuyên đề xong", "mục tiêu đã đạt", "Hoạt động 30 ngày", "{n} ngày liên tiếp", "dài nhất {m}", "Chưa có chuỗi ngày", "Mục tiêu {n}", "{d}/30 ngày có học", "{n} lượt", "khoảng {h} giờ {m} phút", "Xem dạng bảng", "Ẩn bảng", "Ngày", "Lượt", "Đạt mục tiêu", "{thứ}, {dd/MM}: {n} lượt", "✓ đạt mục tiêu", "Trí nhớ", "Từ", "Câu", "Chưa học", "Đang học", "Đang nhớ", "Đã thuộc", "Nhớ đúng: 7 ngày {a}% · 30 ngày {b}%", "Đến hạn 7 ngày tới", "30 ngày tới: {n} câu", "Kỹ năng", "Từ vựng", "Dịch Thái → Việt", "Dịch Việt → Thái", "Nghe hiểu", "Chưa đủ dữ liệu ({n} lượt)", "Theo lần trả lời đầu, 30 ngày qua.", "Luyện", "Lộ trình & mục tiêu", "Tất cả", "Giáo trình", "Chuyên đề", "{x}/{y} bài", "{n}% từ thuộc", "{x}/{y} mục tiêu", "Hiện cả {n} bài & chuyên đề chưa học", "Lỗi hay gặp (30 ngày)", "Theo mẫu câu", "sai {x}/{y}", "Theo loại bài", "Luyện câu sai", "✓ Không có lỗi lặp lại trong 30 ngày qua.", "Từ & câu khó", "Quên {n} lần", "Luyện nhóm này", "Trò chơi", "Kỷ lục:", "{n} lượt", "Đúng {x}%", "Chưa chơi:", "{n} mục cần ôn từ trò chơi", "Bạn chưa chơi trò nào.", "Chơi thử", "Chưa có số liệu", "Học bài đầu tiên — tiến độ, biểu đồ và điểm yếu của bạn sẽ hiện ở đây.", "Học bài đầu tiên", "Không tải được nội dung bài học — một số tên có thể thiếu.", "Không đọc được tiến độ trên máy này.", "Tải lại trang", "Thử lại".
- Tên loại bài ở khối F dùng lại tiêu đề câu hỏi của SCR-06 (vd. "Dịch sang tiếng Thái" → nhãn ngắn "Gõ bản dịch"); danh sách nhãn ngắn đặt trong `vi.ts` (`progress.exerciseShort.E-0x`).

## Lưu ý chữ Thái
- Chữ Thái chỉ xuất hiện ở F (`pattern`), G (từ/câu khó) và tên unit có chữ Thái: `lang="th"`, Sarabun, line-height `th`; dòng danh sách cao ≥ 44px.
- Câu dài ở G: cắt 1 dòng bằng ellipsis, câu đầy đủ ở tooltip + đọc được bằng 🔊; không cắt giữa cụm ký tự.
- Biểu đồ **không** có chữ Thái (nhãn trục là ngày).

## A11y
- Mỗi khối là `section` + tiêu đề `h2`; thứ tự Tab theo thứ tự đọc (A → H).
- Biểu đồ: xem Quy tắc biểu đồ #5; `SkillBars` và thanh % dùng `role="meter"` (`aria-valuenow`, `aria-valuetext` "82 phần trăm" / "Chưa đủ dữ liệu").
- Ký hiệu mức thuộc luôn có chữ ẩn (`sr-only`) đi kèm.
- Không có lỗi axe serious/critical; tương phản chữ ≥ 4.5:1, phần đầy thanh/cột ≥ 3:1 với nền.

## Ngoài phạm vi
Heatmap ngày kiểu GitHub, `MasteryGrid`, thống kê thanh điệu (⛔ v7); so sánh với người khác / bảng xếp hạng / XP / huy hiệu (Phase 2); báo cáo admin R-20..R-25 (Phase 2); xuất PDF/CSV báo cáo (G-02 export JSON nằm ở Cài đặt); đồng bộ nhiều thiết bị (Phase 2); bộ chọn khoảng thời gian tùy ý (cố định 7/30 ngày ở Phase 1); P-06 Đọc (Phase 2).

## Câu hỏi đã chốt (owner 2026-11-21)
1. **Nhóm kỹ năng P-12** — **chọn (a)**: theo bảng `SKILL_GROUPS`. Các phương án: (a) theo bảng trên (bài chọn từ/nghĩa chia theo hướng dịch, E-14 vào Việt → Thái); (b) chỉ tính bài **câu** cho 2 thanh dịch (E-04..E-07, E-09), bài từ chỉ ảnh hưởng thanh Từ vựng; (c) thêm thanh thứ 5 "Loại từ" (E-14) cho nhóm chuyên đề loại từ.
2. **Thời gian học** — **chọn (a + b)**: ước tính cho dữ liệu cũ, ghi `SessionRecord` từ M10 (dùng chung cho lượt chơi / chuỗi ngày). Các phương án: (a) ước tính từ thời lượng trả lời (ghi chữ "khoảng"); (b) M10 bắt đầu ghi `SessionRecord` (bài học, bài tập, trò chơi) để có số chính xác hơn từ nay về sau; (c) bỏ số thời gian khỏi Phase 1.
3. **"Luyện nhóm này" (R-06)** — **chọn (a)**: làm ở M10 bằng `?items=`. Các phương án: (a) làm ở M10 (dùng lại `?items=` của phiên bài tập, gần như không tốn thêm); (b) thay bằng đánh dấu "cần ôn" cả nhóm (dùng hàng đợi sẵn có, không cần phiên mới); (c) chỉ hiển thị danh sách, không có nút.
