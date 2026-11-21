# SCR-03 Tổng quan (route: `/` · App layout) — Requirements: plan 0.7, 0.8 (P-08, P-10), B-06, E-10, R-02' (streak)

> Trạng thái: **Chờ owner duyệt** (M0.5b đợt 2, soạn 2026-11-21). Mở khóa **M10**. Wireframe: `SCR-03-home.png` (đang học), `SCR-03-home-empty.png` (người học mới).
> Màu/không khí: dùng tokens hiện có (D1 — chỉ accent + sắc độ mức thuộc). Đợt **M0.5c** có thể đổi màu/minh họa cho cả app; spec này chốt **bố cục, dữ liệu, câu chữ, hành vi** — M0.5c chỉ "phủ màu" lên, không đổi cấu trúc.

---

## Mục đích
Mở app là biết **hôm nay làm gì** trong ≤ 3 giây: học tiếp bài dở, làm "Bài tập hôm nay", giữ chuỗi ngày học; thấy mình đang ở đâu trên lộ trình. Màn hình có **1 hành động chính** (D3) — xem quy tắc chọn ở §B.

## Dữ liệu
| Phần tử | Nguồn |
|---|---|
| Tên chào | `AuthService` (`displayName`); Guest → không tên |
| "Học tiếp" (bài, bước) | `continueTarget(units, listLessonProgress())` + `resumeStep(lesson.steps, record)` (`packages/core/progress/lessons.ts`); tên bài/unit từ `useAllUnits()` |
| "Bài tập hôm nay" | `practiceOverview({cards, attempts, now, dayStart})` → `due.words`, `due.sentences`, `doneToday`, `dueTomorrow` (dùng chung trang Bài tập — **không tính lại theo cách khác**) |
| Mục tiêu ngày | `doneToday` / cài đặt `PRACTICE_SESSION_SIZE_KEY` (mặc định 20) — giống thanh "Mục tiêu ngày" ở SCR-06 |
| Chuỗi ngày (streak) | **Selector mới** `activityDays()` + `streak()` trong `packages/core/progress` (xem §Quy tắc chuỗi ngày) từ `ReviewLogRecord.review`, `ExerciseAttemptRecord.ts`, `CardRecord.createdAt` |
| Lộ trình (P-10) | `useAllUnits()` (thứ tự Giáo trình → Chuyên đề, rồi `order`) + `unitStatus()` / `unitLessonProgress()` theo `LessonProgressRecord`; `Unit.level` (A1/A2/B1, có thể trống) |
| Tóm tắt (P-08) | `countMastery(wordIds đã có thẻ, cards)`; số câu có thẻ; số bài xong (`completedAt ≠ null`); `listNeedsReview().length` |

### Quy tắc chuỗi ngày (streak) — dùng chung SCR-03 và SCR-09
- **Ngày học** = ngày (giờ máy, như `startOfDay` của Bài tập) có ≥ 1 trong: lượt trả lời bài tập (`ExerciseAttemptRecord`), lượt ôn thẻ (`ReviewLogRecord`), từ mới vào học (`CardRecord.createdAt`, tức là học bước Từ vựng / "Thêm vào Sổ từ").
- **Chuỗi hiện tại** = số ngày học liên tiếp kết thúc ở **hôm nay**, hoặc ở **hôm qua** nếu hôm nay chưa học (chuỗi chưa mất cho tới hết ngày).
- **Chuỗi dài nhất** = chuỗi dài nhất trong toàn bộ lịch sử (SCR-09).
- Trò chơi **chưa** tính (Phase 1 chỉ lưu kỷ lục + `lastPlayedAt`, không có lịch sử từng lượt) — xem Câu hỏi mở #2.
- Selector thuần, nhận `now` + `utcOffsetMinutes` từ ngoài, unit test bằng đồng hồ giả (AGENTS §7).

## Bố cục (desktop 1440, vùng nội dung max 1040)
```
Chào Minh!                                                        (H1; Guest: "Chào bạn!")
Hôm nay học một chút nhé — 10–15 phút là đủ.

┌ Học tiếp ──────────────────────────────── 640 ┐ ┌ Hôm nay ─────────── 360 ┐
│ BÀI 2 · CHÀO HỎI VÀ GIỚI THIỆU BẢN THÂN       │ │  5  ngày liên tiếp       │
│ Bài học 2: Hỏi thăm sức khỏe                   │ │  T2 T3 T4 T5 T6 T7 CN    │
│ Từ vựng ✓ · Mẫu câu ✓ · Hội thoại · Bài tập    │ │  ●  ●  ●  ●  ●  ○  ·     │
│ ▓▓▓▓▓▓▓▓░░░░ 2/4 bước                          │ │ Mục tiêu ngày            │
│                          [ Học tiếp  H ]       │ │ ▓▓▓▓▓▓░░░░ 12/20 câu     │
└────────────────────────────────────────────────┘ └──────────────────────────┘
┌ Bài tập hôm nay ───────────────────────────────────────────────── (accent-subtle) ┐
│ 18 câu đến hạn · 12 từ · 6 câu · khoảng 6 phút            [ Làm bài tập  ↵ ]      │
└──────────────────────────────────────────────────────────────────────────────────┘

Lộ trình của bạn                                              Xem lộ trình ›
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Giáo trình  A1 ──────────────────────────────────────────────────── A2          │
│   ● ● ◐ ○ ○ ○ ○ ○ ○ ○ ○ ○        1/12 bài xong                                  │
│       ▲ Bạn đang ở đây: Bài 2                                                    │
│ Chuyên đề                                                                        │
│   ◐ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○   0/15 chuyên đề xong                            │
└──────────────────────────────────────────────────────────────────────────────────┘

┌ Từ đã thuộc ──────┐ ┌ Câu đã luyện ─────┐ ┌ Bài học xong ─────┐ ┌ Cần ôn ───────────┐
│ 38 / 136          │ │ 24                │ │ 5 / 31            │ │ 6 mục             │
│ ▓▓▒▒░░ (4 mức)    │ │ 18 đã thuộc       │ │                   │ │ từ trò chơi       │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘
                                                                  Xem tiến độ ›
Muốn đổi gió? Chơi một trò 1 phút với từ đã học ›                  (fg-muted 14px)
```

### A. Page header
- H1 "Chào {tên}!" (tên = phần đầu `displayName`, cắt 24 ký tự); Guest: "Chào bạn!". Mô tả theo trạng thái (Câu chữ).
- Không có nút ở hàng H1 (hành động chính nằm trong card).

### B. Hàng 1 — "Học tiếp" (trái, 640) + "Hôm nay" (phải, 360), cao bằng nhau
**Card "Học tiếp"** (viền `border`, radius `lg`, padding 24):
- Dòng nhãn 12px chữ hoa `fg-muted`: "Bài {order} · {title_vi}" / "Chuyên đề {order} · {title_vi}".
- Tên bài 20px semibold: "Bài học {n}: {lesson.title_vi}".
- Dòng bước: chỉ các bước có trong `lesson.steps`, bước xong có "✓" (không chỉ màu); thanh mảnh 4px + "{x}/{y} bước".
- Nút "Học tiếp `H`" → `/units/:unitId/:lessonId` (mở ở `resumeStep`).
- `kind` của `continueTarget`: `continue` → như trên; `next` → nhãn "Bài tiếp theo", nút "Bắt đầu `H`"; `start` → xem trạng thái Lần đầu; `done` → "Bạn đã học xong mọi bài. Làm bài tập để giữ trí nhớ." + nút "Ôn lại {Bài 1}".

**Card "Hôm nay"** (viền `border`):
- Số chuỗi ngày 30px semibold + "ngày liên tiếp"; 0 → "Chưa có chuỗi ngày".
- Dải 7 ngày gần nhất (T2…CN theo lịch tuần hiện tại, hôm nay có viền `accent`): ngày học = chấm đặc `accent` (●), chưa học = chấm rỗng viền `border-strong` (○), ngày tương lai = chấm nhỏ `fg-subtle` (·). Mỗi chấm có `aria-label` "Thứ Hai: đã học" …
- Hôm nay chưa học mà chuỗi > 0: dòng `warning` + icon "Học hôm nay để giữ chuỗi {n} ngày".
- **Mục tiêu ngày**: thanh 8px (`accent` trên nền `bg-subtle`) + "{done}/{goal} câu"; đạt → "✓ Đạt mục tiêu hôm nay" (`success`, icon + chữ). Link nhỏ "Đổi mục tiêu" → `/settings#bai-tap`. *(Khóa `PRACTICE_SESSION_SIZE_KEY` đã có từ M9 nhưng `/settings` **chưa có ô chỉnh** → M10 thêm 1 ô chọn "Số câu mỗi phiên / mục tiêu ngày": 10 · 20 · 30 · 50, mặc định 20.)*

### C. Card "Bài tập hôm nay" (full width, nền `accent-subtle`, như SCR-06)
- "{n} câu đến hạn · {w} từ · {s} câu · khoảng {m} phút" (dùng lại chuỗi `practice.dueLine`).
- Nút "Làm bài tập" → `/practice/session` (phiên "Bài tập hôm nay", giống nút Bắt đầu ở SCR-06).
- 0 câu đến hạn nhưng đã học: "✓ Không còn câu đến hạn. Lần tới: {dueTomorrow} câu vào ngày mai." + nút phụ "Luyện thêm 10 câu".

**Quy tắc hành động chính (D3 — chỉ 1 nút nền `accent`, phím `Enter`):**
| Tình huống | Nút chính (`accent`, `Enter`) | Nút kia |
|---|---|---|
| Có câu đến hạn **và** chưa đạt mục tiêu ngày | "Làm bài tập" | "Học tiếp" thành nút phụ (viền) |
| Còn lại (không đến hạn / đã đạt mục tiêu) | "Học tiếp" / "Bắt đầu" | "Làm bài tập" thành nút phụ |
| Chưa học gì | "Bắt đầu" (bài đầu tiên) | Card Bài tập ẩn nút |

Phím tắt riêng luôn hoạt động bất kể nút nào là chính: `H` Học tiếp, `B` Bài tập (hiện trên nút, D4).

### D. "Lộ trình của bạn" (P-10, compact — bản đầy đủ ở `/units`)
- 2 hàng theo nhánh (ẩn hàng nhánh không có unit): **Giáo trình**, **Chuyên đề**. Mỗi unit là 1 nút tròn 20px theo `unitStatus`: Chưa học ○ (nền `mastery.none`, viền `border`) · Đang học ◐ (`mastery.known`) · Xong ● (`mastery.mastered`) — luôn kèm ký hiệu, không chỉ màu.
- **Nhãn cấp độ**: phía trên hàng Giáo trình, đặt nhãn `A1`, `A2`, `B1` ở **unit đầu tiên của mỗi cấp** (theo `Unit.level`); unit không có `level` không tạo mốc. Không có unit nào có `level` → ẩn nhãn. Đây là "vị trí trên lộ trình A1 → A2".
- **"Bạn đang ở đây"**: mũi tên ▲ + nhãn dưới unit của `continueTarget` (chỉ 1 vị trí trên cả 2 hàng).
- Bên phải mỗi hàng: "{x}/{y} bài xong" / "{x}/{y} chuyên đề xong".
- Hover/focus một nút → tooltip "Bài 3 · Số đếm — Đang học 1/3 bài học"; click → `/units/:unitId`.
- > 20 unit một hàng: nút co còn 14px, vẫn 1 hàng (tối đa ~40 unit ở 1040px); hơn nữa → xuống dòng.
- Link "Xem lộ trình ›" → `/units`.

### E. Tóm tắt nhanh (P-08, B-06) — 4 ô số bằng nhau
| Ô | Số lớn (24px) | Dòng phụ |
|---|---|---|
| Từ đã thuộc | `mastered` / tổng từ đã học (có thẻ) | `StackedProgressBar` 4 mức, cao 6px, có `MasteryLegend` dạng tooltip |
| Câu đã luyện | số câu có thẻ | "{n} đã thuộc" |
| Bài học xong | số bài `completedAt ≠ null` / tổng bài của mọi unit đang hiện ở `/units` (kể cả unit `draft`, như `/units`) | — |
| Cần ôn | `listNeedsReview().length` | "từ trò chơi — ưu tiên trong Bài tập"; 0 → "Không có" |
- Mỗi ô là link: Từ → `/words`, Câu → `/progress#cau`, Bài → `/units`, Cần ôn → `/words?level=review`.
- Link "Xem tiến độ ›" → `/progress`.

### F. Dòng gợi ý trò chơi
"Muốn đổi gió? Chơi một trò 1 phút với từ đã học ›" → `/games`. Ẩn khi chưa học gì (Trò chơi đã có nguồn mặc định, nhưng người mới nên vào bài đầu trước).

## Hành động
| Thao tác | Kết quả |
|---|---|
| `Enter` | Nút chính theo bảng §C |
| `H` / click "Học tiếp" | `/units/:unitId/:lessonId` ở bước đang dở |
| `B` / click "Làm bài tập" | `/practice/session` (Bài tập hôm nay); 0 đến hạn → phiên "Luyện thêm 10 câu" |
| Click nút unit trên lộ trình / `Tab` + `Enter` | `/units/:unitId` |
| Click ô tóm tắt | Điều hướng như §E |
| "Đổi mục tiêu" | `/settings#bai-tap` (cuộn tới ô "Số câu mỗi phiên / mục tiêu ngày") |
- Phím tắt chỉ bắt khi focus không ở ô nhập; hiện trên nút (`<kbd>`).

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| **Lần đầu (chưa học gì)** — `SCR-03-home-empty.png` | Mô tả "Bắt đầu từ bài đầu tiên — mỗi bài 10–15 phút." · Card Học tiếp: "Bắt đầu với Bài 1: {tên}" + nhãn "Bài học 1: {tên bài}" + nút chính "Bắt đầu `Enter`" · Card Hôm nay: "Chưa có chuỗi ngày" + dải 7 ngày rỗng + "Học bài đầu tiên để bắt đầu chuỗi ngày" · Card Bài tập: "Học bài đầu tiên để có bài tập." (không nút) · Lộ trình: mọi nút ○, "Bạn đang ở đây" ở unit đầu · Ô tóm tắt **thay bằng** khối "Cách học với Nôm": 3 bước ngang "1 Học bài (từ vựng → mẫu câu → hội thoại) · 2 Làm bài tập mỗi ngày · 3 Chơi trò chơi để nhớ lâu" · ẩn dòng gợi ý trò chơi |
| Đang tải | Skeleton: 2 card hàng 1, 1 dải Bài tập, 2 dòng lộ trình, 4 ô; không chớp sang trạng thái Lần đầu |
| Không có nội dung | Card Học tiếp: "Chưa có bài học nào. Nội dung đang được soạn."; ẩn Lộ trình |
| Lỗi tải content | Khối `danger-subtle`: "Không tải được bài học." + "Thử lại"; card Hôm nay + Bài tập vẫn hiện (dữ liệu local) |
| Lỗi đọc IndexedDB | Khối `danger-subtle`: "Không đọc được tiến độ trên máy này." + "Tải lại trang" |
| Offline | Badge "Ngoại tuyến" (SCR-00); content đã cache → bình thường |
| Hôm nay đã đạt mục tiêu & hết câu đến hạn | Card Hôm nay "✓ Đạt mục tiêu hôm nay"; card Bài tập dạng "✓ Không còn câu đến hạn…"; nút chính = Học tiếp |
| Đã học hết mọi bài | Card Học tiếp dạng `done`; nút chính = Làm bài tập (nếu có đến hạn) hoặc "Ôn lại Bài 1" |
| Guest | H1 "Chào bạn!"; mọi thứ khác **giống hệt** (dữ liệu local). Không thêm banner — khối tài khoản ở sidebar (SCR-00) đã nhắc "Tiến độ chỉ lưu trên trình duyệt này" |
| Đã đăng nhập | H1 có tên; dữ liệu theo DB của user (account-data-repository) |
| 1024–1279px | Hàng 1 vẫn 2 cột (co 60/40); 4 ô tóm tắt thành lưới 2×2 |

## Câu chữ (tiếng Việt)
"Chào {tên}!", "Chào bạn!", "Hôm nay học một chút nhé — 10–15 phút là đủ.", "Bắt đầu từ bài đầu tiên — mỗi bài 10–15 phút.", "Học tiếp", "Bài tiếp theo", "Bắt đầu", "Bắt đầu với {Bài n | Chuyên đề n}: {tên}", "Bài học {n}: {tên}", "{x}/{y} bước", "Bạn đã học xong mọi bài. Làm bài tập để giữ trí nhớ.", "Ôn lại {Bài 1}", "Hôm nay", "{n} ngày liên tiếp", "Chưa có chuỗi ngày", "Học hôm nay để giữ chuỗi {n} ngày", "Học bài đầu tiên để bắt đầu chuỗi ngày", "Mục tiêu ngày", "{done}/{goal} câu", "✓ Đạt mục tiêu hôm nay", "Đổi mục tiêu", "Bài tập hôm nay", "{n} câu đến hạn · {w} từ · {s} câu · khoảng {m} phút", "Làm bài tập", "✓ Không còn câu đến hạn. Lần tới: {n} câu vào ngày mai.", "Luyện thêm 10 câu", "Học bài đầu tiên để có bài tập.", "Lộ trình của bạn", "Giáo trình", "Chuyên đề", "Bạn đang ở đây", "{x}/{y} bài xong", "{x}/{y} chuyên đề xong", "Xem lộ trình", "Chưa học", "Đang học {x}/{y} bài học", "✓ Xong", "Từ đã thuộc", "Câu đã luyện", "{n} đã thuộc", "Bài học xong", "Cần ôn", "{n} mục", "từ trò chơi — ưu tiên trong Bài tập", "Không có", "Xem tiến độ", "Muốn đổi gió? Chơi một trò 1 phút với từ đã học", "Cách học với Nôm", "Học bài", "Làm bài tập mỗi ngày", "Chơi trò chơi để nhớ lâu", "Không tải được bài học.", "Thử lại", "Không đọc được tiến độ trên máy này.", "Tải lại trang", "Chưa có bài học nào. Nội dung đang được soạn.".
- Thứ trong tuần: "T2", "T3", "T4", "T5", "T6", "T7", "CN"; `aria-label`: "Thứ Hai: đã học" / "…: chưa học" / "…: hôm nay".

## Lưu ý chữ Thái
- Màn này **gần như không có chữ Thái**; tên unit/bài dùng `title_vi`. Nếu `title_vi` chứa chữ Thái (vd. "Các trường hợp của น่า") → bọc đoạn Thái trong `<span lang="th">` (`font.family.th`, line-height `th`) — dùng chung helper tách đoạn Thái của `/units`.
- Tên dài: cắt 1 dòng bằng ellipsis ở card, đầy đủ ở tooltip/`title`.

## A11y
- Landmark: `main` > các `section` có `aria-labelledby` theo tiêu đề card.
- Dải 7 ngày: `role="list"`, mỗi chấm `role="listitem"` + `aria-label`; số chuỗi đọc thành "5 ngày học liên tiếp".
- Thanh mục tiêu / bước: `role="progressbar"` + `aria-valuenow/max` + nhãn chữ bên cạnh.
- Lộ trình: mỗi unit là `<a>` có tên đầy đủ + trạng thái; "Bạn đang ở đây" là `aria-current="step"`.
- Không có lỗi axe serious/critical; tương phản ≥ 4.5:1 (chấm `mastery.known` luôn có ký hiệu ◐).

## Ngoài phạm vi
XP, huy hiệu, bảng xếp hạng, nhắc học qua email/push (Phase 2: E-01..E-06); đồng bộ nhiều thiết bị (Phase 2); widget tùy biến/kéo thả; "đóng băng chuỗi" (streak freeze); thông báo hệ thống; dự báo lịch ôn (ở SCR-09).

## Câu hỏi mở cho owner
1. **Nút chính khi vừa có bài dở vừa có câu đến hạn** — (a) *đề xuất*: Bài tập là chính khi còn đến hạn và chưa đạt mục tiêu ngày, ngược lại Học tiếp; (b) luôn là Học tiếp (bài mới trước); (c) luôn là Bài tập (ôn trước, giống Anki/WaniKani).
2. **Trò chơi có tính là "ngày học" không** — (a) *đề xuất*: chưa tính ở M10 (không có lịch sử lượt chơi); (b) tính — cần thêm bảng `gamePlays` (mỗi lượt một bản ghi) ở M10.
3. **Mục tiêu ngày đo bằng gì** — (a) *đề xuất*: số câu bài tập đã chấm hôm nay / số câu mỗi phiên (đúng như SCR-06 đang hiện); (b) số phút học; (c) số "lượt" gồm cả từ mới của bài học.
