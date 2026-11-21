# SCR-08 v2 Trò chơi: Danh sách 8 trò, Màn chơi, Kết quả — Requirements: plan 0.14 (F-15..F-18), 0.6 (F-01, F-02', F-03', F-04'), F-10..F-14, P-09, 7.2; ROADMAP T9.6.3–T9.6.6

> Trạng thái: **✅ Duyệt 2026-11-21** cùng hướng B (owner giao làm UI M9.6; câu hỏi mở theo đề xuất). Thay `SCR-08-games.md` (v1); luật chơi 4 trò cũ **không đổi** (xem v1 §B) — v2 chỉ thêm theme, sao, "Đổi trò", thumbnail.
> Wireframe (mid-fi, 1280×800): `SCR-08v2-games.png`, `SCR-08v2-play-whack.png`, `SCR-08v2-play-gameshow.png`, `SCR-08v2-play-airplane.png`, `SCR-08v2-play-maze.png`, `SCR-08v2-result.png`. Chữ Thái trong hình là **mẫu**.
> Khớp code: core `games/catalog.ts` (`ALL_GAME_IDS`, `SKILLS_BY_GAME`, `gameAvailability`), `games/arcade/*` (hằng số trích ở từng trò bên dưới), `results.ts` (`resultStars`), web `useArcadeRun`, `useGameLoop`, `useGameTheme`.
> Hiệu ứng phản hồi `fb-*` và màu `highlight` / sao: `docs/design/M0.5c-directions.md` §2.3–2.5 (dùng chung toàn app).

## Nguyên tắc chung
- Tham khảo **Wordwall** chỉ ở ý tưởng (một nguồn → nhiều trò, thumbnail lớn, theme, sao, "Đổi trò"); **không** dùng tên thương mại, hình, âm của Wordwall.
- **8 trò**, thứ tự = phím tắt `1`–`8` = `ALL_GAME_IDS`: 1 Ghép cặp · 2 Đúng hay sai? · 3 Xếp câu tốc độ · 4 Đoán loại từ · 5 Đập chuột · 6 Đố vui truyền hình · 7 Máy bay · 8 Mê cung.
- **Màu riêng từng trò** (`color.game.*`, v7.3) giữ cho 4 trò cũ, thêm 4 màu (bảng cuối). Màu trò dùng cho: thumbnail, nút chính, thanh thời gian, viền đáp án đang chọn.
- **Theme** (Biển / Không gian / Khu vườn) chỉ đổi **cảnh nền màn chơi** (bầu trời, mặt đất, đồ trang trí, nhân vật) + màu chữ thanh trên. Chữ Thái, nút đáp án luôn nằm trên **bảng trắng** (`panel`) → tương phản không phụ thuộc theme.
- Không đổi FSRS (F-12); mục sai → "cần ôn"; thoát giữa chừng không lưu kỷ lục; tab ẩn → tự tạm dừng (`useGameLoop`).
- Chơi được hoàn toàn bằng bàn phím; phím hiện trên nút/ô.
- Âm: đúng / sai / hoàn thành của M9.5 (`feedback-sound`), đọc chữ Thái sau âm 150 ms (🗣 `gameAutoSpeak`). **Âm nền** theo theme (vòng lặp CC0 ~30 s, âm lượng = 30% âm lượng phản hồi), **mặc định tắt**, nút 🎵 (`M`) trên thanh trên, nhớ theo user.
- Không mascot dẫn chuyện, không confetti. Nhân vật trong trò (chuột, máy bay, ma) là **đồ vật của cơ chế chơi**, không nói chuyện.

---

## A. Danh sách trò chơi (route: `/games` · App layout)

### Mục đích
Chọn trò bằng hình — thấy ngay trò nào luyện gì, bao lâu, kỷ lục; chọn nguồn và theme một lần cho mọi trò.

### Dữ liệu
- `ALL_GAME_IDS`, `SKILLS_BY_GAME`, `gamesWithSkill(skill)`, `gameAvailability(id, source)` (lý do khóa), kỷ lục `GameResultRecord.best` theo **trò + nguồn**, số mục "cần ôn" (`origin: 'game'`).
- Cài đặt: `gameSource` (nguồn), `gameTheme` (`useGameTheme`), bộ lọc kỹ năng (chỉ trong URL `?skill=`).

### Bố cục (max 1040)
```
Trò chơi                                                                  (H1)
Chơi nhanh 1–3 phút với từ và câu bạn đã học.

Nguồn: [ Từ đã học (86 từ · 24 câu) ▾ ]              Chủ đề: (🌊 Biển) (🚀 Không gian) (🌻 Khu vườn)   T
Kỹ năng: [Tất cả 8] [Từ vựng 6] [Câu 3] [Loại từ 2]                                    S

┌ thumbnail 16:10 ─────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  (minh họa trò,      │ │                      │ │                      │ │                      │
│   nền màu trò)    [1]│ │                   [2]│ │                   [3]│ │                   [4]│
├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
│ Ghép cặp             │ │ Đúng hay sai?        │ │ Xếp câu tốc độ       │ │ Đoán loại từ         │
│ Lật thẻ, ghép từ Thái│ │ Từ + nghĩa: đúng hay │ │ Xếp thẻ từ thành câu │ │ Chọn loại từ đúng.   │
│ với nghĩa.           │ │ sai? 3 tim.          │ │ trước khi hết giờ.   │ │ 3 tim.               │
│ [Từ vựng]  ⏱ ~1 phút │ │ [Từ vựng]  ⏱ ~1 phút │ │ [Câu]      ⏱ ~2 phút │ │ [Loại từ]  ⏱ ~1 phút │
│ 🏆 0:42              │ │ 🏆 1 240 điểm        │ │ Chưa chơi            │ │ 🔒 Cần chuyên đề có  │
│                      │ │                      │ │                      │ │    loại từ…          │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
┌ 5 Đập chuột ─────────┐ ┌ 6 Đố vui truyền hình ┐ ┌ 7 Máy bay ───────────┐ ┌ 8 Mê cung ───────────┐
│ ...                  │ │ ...                  │ │ ...                  │ │ ...                  │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
6 mục cần ôn — sẽ ưu tiên trong Bài tập.                                   (fg-muted, ẩn nếu 0)
```
- **Lưới**: 4 cột ≥ 1280px, 3 cột 1024–1279px; card cao bằng nhau; cả card là một nút (click / phím số / `Enter` khi focus).
- **Thumbnail** 16:10 (≈ 236×148 ở 1280): nền `color.game.<id>` + cảnh minh họa đơn giản dựng từ emoji Noto + hình khối CSS/SVG (không cần ảnh raster):
  | Trò | Minh họa |
  |---|---|
  | Ghép cặp | 3 thẻ úp/ngửa xếp quạt, một thẻ có chữ Thái, một thẻ có 🐱 |
  | Đúng hay sai? | Thẻ chữ Thái + hai nút tròn ✓ ✕ |
  | Xếp câu tốc độ | 3 thẻ từ nối nhau + ⏱ |
  | Đoán loại từ | 🐘 + nhãn "ตัว" trong bong bóng |
  | Đập chuột | 3 hố, một con 🐹 thò lên cầm biển chữ Thái, 🔨 |
  | Đố vui truyền hình | Sân khấu: đèn spot, 4 ô A B C D, 🎤 |
  | Máy bay | ✈️ bên trái, 3 đám mây có chữ, đường bay chấm |
  | Mê cung | Lưới tường 5×4, 🙂 ở giữa, 👻 ở góc, ⭐ ở đích |
  Thumbnail **không đổi theo theme** (nhận diện trò ổn định); nếu muốn theo theme → *câu hỏi mở Q2*.
- **Nhãn phím** `[n]` góc phải trên thumbnail (ô trắng 28px, chữ `fg`).
- **Nhãn kỹ năng** (badge viền, chữ 12px): theo `SKILLS_BY_GAME` — Từ vựng (`vocab`), Câu (`sentence`), Loại từ (`classifier`). Hiện tại: Ghép cặp, Đúng hay sai?, Đập chuột, Mê cung = Từ vựng; Xếp câu tốc độ = Câu; Đoán loại từ = Loại từ; Đố vui truyền hình = Từ vựng + Câu + Loại từ; Máy bay = Từ vựng + Câu. "Nghe" chưa có (thêm khi có trò ra đề bằng audio).
- **Thời lượng**: Ghép cặp ~1 phút · Đúng hay sai? ~1 phút · Xếp câu tốc độ ~2 phút · Đoán loại từ ~1 phút · Đập chuột **60 giây** · Đố vui truyền hình ~3 phút · Máy bay ~1–2 phút · Mê cung ~2 phút.
- **Kỷ lục** (🏆 + chữ): Ghép cặp theo thời gian (`0:42`), trò khác theo điểm (`1 240 điểm`). Chưa có → "Chưa chơi". Kỷ lục theo nguồn đang chọn.
- **Bộ lọc kỹ năng** (`gamesWithSkill`): segmented "Tất cả / Từ vựng / Câu / Loại từ" kèm số trò; `S` xoay vòng. Card bị lọc **ẩn**; phím số của trò bị ẩn không hoạt động; số trên card **không đánh lại** (luôn khớp thứ tự 1–8).
- **Theme picker**: 3 ô tròn 40px (emoji 🌊 🚀 🌻 trên nền `theme.scene-top`) + tên; ô đang chọn viền 3px `accent` + ✓. `T` xoay vòng. Có hiệu lực ngay (màn chơi mở sau dùng theme mới), lưu bằng `useGameTheme`. `radiogroup` có nhãn "Chủ đề màn chơi".
- **Trò bị khóa** (`gameAvailability` → `ok: false`): thumbnail giảm bão hòa (lọc `grayscale(0.6)` + lớp trắng 40%), biểu tượng 🔒, dòng lý do thay dòng kỷ lục (chữ `fg-muted` 14px, đủ tương phản); card `aria-disabled`, phím số báo toast "{Tên trò}: {lý do}". Lý do theo core:
  | Trò | Điều kiện (`need`) | Câu chữ |
  |---|---|---|
  | Đập chuột, Mê cung | ≥ 6 chữ Thái khác nhau (từ) | "Cần ít nhất 6 từ có nghĩa (nguồn này có {have})." |
  | Máy bay | ≥ 6 mục: từ + câu ≤ 3 thẻ từ | "Cần ít nhất 6 từ hoặc câu ngắn (nguồn này có {have})." *(cần thêm lý do `items` trong core, hoặc giữ câu "từ")* |
  | Đố vui truyền hình | ≥ 8 mục ra được đề | "Cần ít nhất 8 từ hoặc câu (nguồn này có {have})." |
  | 4 trò cũ | như v1 | như v1 |
- Hover/focus card: nâng 2px + `shadow.md` (bỏ khi reduced-motion; focus ring `accent` luôn hiện).

### Hành động
| Thao tác | Kết quả |
|---|---|
| `1`–`8` / click card | `/games/:id` (giữ nguồn, theme) |
| `S` | Xoay bộ lọc kỹ năng |
| `T` | Xoay theme |
| `Tab` / mũi tên trong lưới | Di chuyển focus giữa card; `Enter` mở |
| Dropdown Nguồn | Như v1 (nhớ lựa chọn) |

---

## B. Màn chơi (route: `/games/:id` · Focus layout, nền theo theme)

### B.0 Khung chung (8 trò)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [✕ Thoát Esc]  Đập chuột   ⏱ 0:42  │ 1 200 điểm │ Combo ×3 │ ♥♥♡ │ 🗣 V  🎵 M  ⏸ P │  ← thanh trên (trong suốt, chữ `theme.hud-fg`)
├──────────────────────────────────────────────────────────────────────────────┤
│                    CẢNH NỀN THEME (trời / mặt đất / trang trí)                │
│                ┌──────── panel trắng radius 16, bóng md ────────┐            │
│                │           nội dung trò (chữ Thái ở đây)         │            │
│                └────────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Thanh trên** cao 56px: Thoát (`Esc`, không hỏi, không lưu) · tên trò · đồng hồ (hoặc ♥ cho trò 3 tim) · điểm · combo (khi ≥ 2, `fb-points` nảy) · 🗣 tự đọc (`V`) · 🎵 âm nền (`M`) · ⏸ tạm dừng (`P`). Chữ/icon `theme.hud-fg`; nút trên nền `panel` 80% để đạt tương phản trên mọi cảnh.
- **Bắt đầu**: overlay "3 · 2 · 1" (bỏ khi reduced-motion); `Space` bắt đầu ngay. Overlay có dòng hướng dẫn phím của trò (vd. "Phím 1–9 theo bàn phím số để đập").
- **Tạm dừng** (`P`, tab ẩn, mất focus cửa sổ): `useArcadeRun` ngừng `tick`; overlay mờ nền 60% + panel: "Đã tạm dừng" · [Tiếp tục  Space] · [Chơi lại  R] · [Thoát  Esc]. Âm nền dừng theo.
- **Reduced-motion** (`prefers-reduced-motion: reduce`): không trôi/thò/đuổi theo thời gian thực ở trò có chuyển động — dùng **chế độ từng bước** (mô tả trong từng trò). Đồng hồ/thanh thời gian vẫn hiện bằng số + thanh tĩnh cập nhật mỗi giây. Hiệu ứng `fb-*` rút về đổi màu + icon + chữ.
- **Phản hồi** luôn có icon + chữ ở "dải phản hồi" dưới panel: "✓ Đúng +200" / "✕ Sai — แมว là con mèo". `aria-live="polite"`.
- 4 trò cũ: giữ bố cục/luật v1 §B; bảng chơi đặt trong `panel` trắng giữa cảnh nền theme; thanh trên chung (thêm 🎵, ⏸).

### B.1 F-15 Đập chuột (`whack-a-mole`) — 60 giây
**Luật (core `whack-a-mole.ts`):** `WHACK_DURATION_MS 60 000`, `WHACK_HOLES 9`, con mới thò mỗi `700 ms`, ở lại `1 400 ms`; mỗi nhóm 3 con có đúng 1 con mang đáp án; đúng +100 × combo → sang đề mới; đập nhầm −50 (không âm), mất combo, mục ghi "cần ôn", con đó lặn. Đập hố trống: không có gì xảy ra.
```
 thanh trên: ⏱ 0:42 · 1 200 điểm · Combo ×3
 ┌──────────── panel đề (trắng) ────────────┐
 │  Đập từ có nghĩa:  con mèo      (vi 28px) │
 │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  (thanh 60 s, màu trò)│
 └──────────────────────────────────────────┘
    ( 7 )          ( 8 )🐹[ แมว ]   ( 9 )
    ( 4 )🐹[ หมา ] ( 5 )            ( 6 )
    ( 1 )          ( 2 )            ( 3 )🐹[ ปลา ]
 dải phản hồi: ✓ Đúng +300
```
- Lưới 3×3 hố (hố 168×112, cách 24); **nhãn phím theo numpad**: hàng trên `7 8 9`, giữa `4 5 6`, dưới `1 2 3` (hố core 0–8 trên-trái → dưới-phải ↔ phím 7,8,9,4,5,6,1,2,3). Phím thay thế cho laptop không có numpad: `Q W E` / `A S D` / `Z X C` (nhãn nhỏ thứ hai dưới số). Click hố cũng được.
- Con vật cầm **biển trắng** chữ Thái 32px (`lang="th"`, tối thiểu 140px rộng; từ dài co còn 24px, không cắt).
- Hiệu ứng: thò lên trượt 160 ms; đúng → con bị "bẹp" + `fb-correct` + `+300` bay; sai → biển rung `fb-wrong` viền `danger`, "−50" đỏ, con lặn.
- **Theme:** Biển = 🦀 thò từ hố cát (nền cát `ground`), Không gian = 👽 từ miệng hố thiên thạch, Khu vườn = 🐹 từ hố đất.
- **Reduced-motion:** con xuất hiện/biến mất tức thì (không trượt/bẹp); lịch thời gian giữ nguyên (core không có chế độ chậm). *Câu hỏi mở Q4:* có cần chế độ "chậm" (×1,5 thời gian ở lại) không.
- Kết thúc khi hết 60 s.

### B.2 F-16 Đố vui truyền hình (`gameshow`) — 12 câu
**Luật (core `gameshow.ts`):** 12 câu (`GAMESHOW_QUESTIONS`), trộn E-01 (nghĩa từ), E-02 (chọn chữ Thái), E-05 (bản dịch câu), E-14 (loại từ); `15 s`/câu; điểm = (100 + thưởng tốc độ 0..100) × (2 ở **3 câu cuối — vòng thưởng**); trợ giúp **50:50** (bỏ tối đa 2 đáp án sai, luôn còn ≥ 1 sai) và **+10 giây**, mỗi loại 1 lần/lượt; hết giờ = sai. Trả lời xong dừng ở màn phản hồi **không tính giờ** tới khi bấm Tiếp.
```
┌ thang câu ┐  ┌──────────── panel sân khấu ───────────────────────┐  ┌ trợ giúp ─────┐
│ 12 ★ ×2   │  │ Câu 4/12 · Chọn nghĩa đúng            (⏱ 11)       │  │ [50:50   F]    │
│ 11 ★ ×2   │  │                                                    │  │ [+10 giây T]   │
│ 10 ★ ×2   │  │               สวัสดี            (th 56px)  🔊 R   │  │ (đã dùng: gạch)│
│  9        │  │                                                    │  └────────────────┘
│  …        │  │ [A  xin chào        ] [B  cảm ơn           ]        │
│▶ 4        │  │ [C  tạm biệt        ] [D  xin lỗi          ]        │
│  3 ✓      │  └────────────────────────────────────────────────────┘
│  2 ✓      │   dải phản hồi: ✓ Đúng +185 · [Tiếp  ↵]
│  1 ✕      │
└───────────┘
```
- **Thang câu** (trái, 160px): 12 bậc từ dưới lên, bậc đã qua có ✓/✕, bậc hiện tại nền màu trò; 3 bậc trên cùng có ★ "×2".
- **Đồng hồ**: vòng tròn 64px quanh số giây; < 5 s vòng chuyển `danger` + nhịp đập nhẹ (tắt khi reduced-motion; vẫn đổi màu + số).
- **Đề** theo loại (nhãn trên đề dùng câu chữ E-xx có sẵn): E-01 "Chọn nghĩa đúng" (đề Thái 56px, đáp án Việt) · E-02 "Chọn từ tiếng Thái" (đề Việt 28px, đáp án Thái 28px) · E-05 "Chọn bản dịch đúng" (câu Thái 32px, đáp án Việt) · E-14 "Loại từ của từ này là gì?" (từ Thái 56px, đáp án Thái 32px). Đề Thái tự đọc (🗣).
- **Đáp án**: lưới 2×2 nút cao 72px, nhãn chữ `A`–`D`; phím `A` `B` `C` `D` **hoặc** `1`–`4`. Câu có 3 lựa chọn → 3 nút (ô thứ 4 bỏ trống). Đáp án bị 50:50 bỏ: nút mờ, gạch ngang, `aria-disabled`, phím không tác dụng.
- **Trợ giúp**: `F` = 50:50, `T` = +10 giây; đã dùng → nút gạch chéo + "Đã dùng".
- **Phản hồi**: đáp án chọn đúng → nền `success-subtle` + ✓ (`fb-correct`); sai/hết giờ → nút chọn `danger-subtle` + ✕, đáp án đúng viền `success` + ✓. Nút **Tiếp** (`Enter` / `Space`) — câu 12 thì "Xem kết quả".
- **Vòng thưởng** (trước câu 10): banner "Vòng thưởng — điểm ×2" 1,2 s trên nền `highlight`, đèn sân khấu đổi sang `highlight` (reduced-motion: banner tĩnh, `Space` để đóng).
- **Theme:** Biển = sân khấu boong tàu, Không gian = trường quay trên trạm vũ trụ (sao), Khu vườn = sân khấu ngoài trời có cờ dây. Panel câu hỏi luôn trắng.
- **Reduced-motion:** không cần chế độ riêng (trò theo lượt); chỉ bỏ hiệu ứng.

### B.3 F-17 Máy bay (`airplane`) — 3 tim
**Luật (core `airplane.ts`):** `AIRPLANE_LANES 4` (có thể ít hơn khi nguồn nhiều mục cùng nghĩa), máy bay ở x = 15% (`PLANE_X`), mỗi hàng mây xuất phát ở mép phải; tốc độ ban đầu 0,25 bề ngang/giây (~3,4 s/hàng), **+6% mỗi câu đúng, tối đa ×2**; mây chạm máy bay → chấm làn hiện tại: đúng +100 × combo, sai −1 tim; 3 tim (`START_LIVES`), hết tim → kết thúc. Mục: từ + câu ≤ 3 thẻ từ.
```
 thanh trên: ♥♥♡ · 800 điểm · Combo ×2 · Tốc độ ×1,3
 ┌──────── panel đề (trắng, giữa trên) ────────┐
 │  Bay vào mây:  con chó          (vi 28px)    │
 └──────────────────────────────────────────────┘
 làn 1 │                                  ☁[ แมว ]
 làn 2 │  ✈️ ← máy bay                      ☁[ หมา ]   ← mây trôi sang trái
 làn 3 │                                  ☁[ ปลา ]
 làn 4 │                                  ☁[ นก  ]
 ↑ / W lên · ↓ / S xuống
```
- Vùng bay 1040×480 trong cảnh theme; 4 làn cao 120px, đường kẻ làn mảnh (`theme.hud-fg` 20%). Máy bay 64px, đổi làn trượt 120 ms.
- **Mây** = khối trắng bo tròn (panel) 180×80, chữ Thái 28px `fg` (câu ngắn tối đa 3 thẻ từ → có thể 2 dòng, 22px).
- **Phím:** `↑`/`W` lên, `↓`/`S` xuống. Click/chạm làn cũng được.
- **Phản hồi:** đúng → mây vỡ thành 6 chấm + `fb-points`; sai → máy bay rung, ♥ vỡ (`fb-wrong`), dải phản hồi "✕ Sai — đúng là หมา" giữ 1,5 s (hàng mây mới vẫn tới — core chuyển hàng ngay).
- **Theme:** Biển = ✈️ trên biển, mây trắng; Không gian = 🚀, "mây" là khối trắng viền sao; Khu vườn = 🛩️ trên cánh đồng hoa. Đề + mây luôn trắng.
- **Reduced-motion — chế độ từng bước:** mây **đứng yên** ở giữa phải; người chơi chọn làn bằng `↑↓` rồi **`→` / `Enter` "Bay"**. UI gọi `tick` với `dtMs` đủ để mây chạm máy bay (không cần đổi core). Không có áp lực thời gian; HUD ghi "Từng bước".

### B.4 F-18 Mê cung (`maze`) — 3 tim
**Luật (core `maze.ts`):** mê cung **9 × 7** hoàn hảo sinh theo seed, cố định cả lượt; người chơi bắt đầu giữa (ô 4,3), ma bắt đầu giữa hàng trên (ô 4,0); **4 góc = 4 đáp án** chữ Thái (trên-trái, trên-phải, dưới-trái, dưới-phải); ma đi theo đường ngắn nhất, 1 ô / 700 ms, nhanh dần 5%/câu đúng (tối thiểu 350 ms); tới góc đúng +100 × combo → câu mới, cả hai về chỗ cũ; góc sai hoặc bị ma bắt → −1 tim, về chỗ cũ, **giữ câu**; 3 tim.
```
 thanh trên: ♥♥♥ · 300 điểm · Combo ×3          [Từng bước: tắt  B]
 ┌──────── panel đề ────────┐
 │  Tìm đường tới: con chim │
 └──────────────────────────┘
  [ A  แมว ] ┌──┬───────────┬──┐ [ B  นก  ]
             │A │   👻       │ B│
             │  │  ┌──┐      │  │      ô 56px × 9 cột × 7 hàng = 504 × 392
             │     │🙂│         │
             │C │  └──┘      │ D│
  [ C  หมา ] └──┴───────────┴──┘ [ D  ปลา ]
 ← ↑ → ↓ / W A S D để đi
```
- Lưới 504×392 (ô 56px, tường 4px `theme.value`) trên panel trắng; **đáp án đặt ngoài lưới** cạnh mỗi góc (thẻ trắng viền, chữ Thái 28px, nhãn A/B/C/D trùng với chữ trong ô góc) — tránh nhét chữ Thái vào ô 56px.
- **Phím:** mũi tên hoặc `W A S D`; giữ phím = lặp mỗi 140 ms. Đâm tường: không đi, ô rung nhẹ.
- Người chơi 40px, ma 40px; đường đã đi để vệt chấm mờ (giúp định hướng).
- **Phản hồi** (theo `lostBy`): góc sai → "✕ Sai — แมว là con mèo"; bị bắt → "✕ Bị ma bắt! Thử lại câu này". Đúng → góc sáng `success` + `fb-correct`, chuyển câu.
- **Theme:** Biển = 🐠 + ma 🐙, tường san hô; Không gian = 🧑‍🚀 + 👾, tường kim loại; Khu vườn = 🐞 + 🐝, tường hàng rào xanh.
- **Chế độ từng bước** (`setMazeStepMode`): tự bật khi reduced-motion, hoặc người chơi bật bằng `B` (nhớ theo user). Ma đi **1 ô sau mỗi 2 bước** của người chơi (`STEP_MODE_RATIO`), không có đồng hồ. HUD hiện "Từng bước: bật".

---

## C. Kết quả lượt chơi (cuối `/games/:id`, nền theme mờ + panel trắng)
```
                 Đập chuột — Kết thúc                              (H1)
                      ★  ★  ☆        2/3 sao                      (sao 56px, highlight + viền)
      2 400 điểm        18/22 đúng (82%)        Combo cao nhất ×6
      🏆 Kỷ lục mới! (trước: 1 900)                   — hoặc —   Kỷ lục: 3 100 điểm
      Riêng trò: Đập nhầm 4 lần
 ─────────────────────────────────────────────────────────────
  Mục sai (4) — đã đánh dấu “cần ôn”
   แมว  con mèo     bạn chọn หมา           [🔖 Cần ôn]
   ...
 ─────────────────────────────────────────────────────────────
  [ Chơi lại  ↵ ]   [ Chơi với mục sai  W ]   [ Đổi trò  G ]   [ Về danh sách  Esc ]
```
- **Sao** (`resultStars`): ≥ 90% đúng → 3 sao, ≥ 60% → 2, còn lại 1 (Ghép cặp: theo số lần ghép sai 0 / ≤ 2). `0` (chưa trả lời câu nào) → ẩn hàng sao. Sao bật lần lượt 150 ms (`fb-record` khi phá kỷ lục, `fb-complete` khi không); luôn kèm chữ "{n}/3 sao".
- **Kỷ lục mới**: dòng 🏆 + `fb-record` + âm hoàn thành; không phá → "Kỷ lục: …" `fg-muted`.
- **Dòng riêng trò** (tùy chọn, chỉ từ dữ liệu `GameSummary` sẵn có): Đập chuột "Đập nhầm {n} lần"; Đố vui "Trợ giúp đã dùng: 50:50, +10 giây"; Máy bay "Bay qua {n} hàng mây"; Mê cung "Qua {n} màn". Không có số → bỏ dòng.
- **Mục sai** + nút "Cần ôn" từng mục: như v1.
- **Đổi trò** (`G`): mở dialog "Đổi trò" — lưới 4×2 thumbnail nhỏ (120×75) của 8 trò, **giữ nguồn hiện tại**, trò hiện tại có nhãn "Vừa chơi", trò khóa mờ + lý do trong tooltip; phím `1`–`8` chọn, `Esc` đóng.
- "Chơi với mục sai" (`W`): như v1 (≥ 4 mục mới hiện). Với trò arcade: lượt mới chỉ từ mục sai nếu đủ điều kiện `availability`, không thì ẩn.

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Nguồn chưa học gì | Như v1 (tự chọn unit đầu, dòng nhắc) |
| Trò bị khóa | Card mờ + 🔒 + lý do; mở bằng URL trực tiếp → về `/games` + toast lý do |
| Bộ lọc không còn trò nào | (Không xảy ra với dữ liệu hiện tại) "Chưa có trò cho kỹ năng này." |
| Đang tải nguồn | Skeleton 8 card (thumbnail xám) |
| Không có giọng Thái | 🗣 vô hiệu; trò vẫn chơi được (Đố vui E-01/E-14 hiển thị chữ đủ để chơi) |
| Âm nền chưa tải được (offline lần đầu) | 🎵 vô hiệu + tooltip "Chưa tải được âm nền" |
| Tab ẩn / mất focus | Tạm dừng, overlay "Đã tạm dừng" |
| Reduced-motion | Chế độ từng bước (Máy bay, Mê cung); hiệu ứng → màu + icon + chữ |
| Offline / Guest | Chơi bình thường (dữ liệu local) |

## Câu chữ
"Trò chơi", "Chơi nhanh 1–3 phút với từ và câu bạn đã học.", "Nguồn:", "Từ đã học", "Chủ đề:", "Chủ đề màn chơi", "Biển", "Không gian", "Khu vườn", "Kỹ năng:", "Tất cả", "Từ vựng", "Câu", "Loại từ", "Ghép cặp", "Đúng hay sai?", "Xếp câu tốc độ", "Đoán loại từ", "Đập chuột", "Đố vui truyền hình", "Máy bay", "Mê cung",
mô tả: "Lật thẻ, ghép từ Thái với nghĩa." · "Từ + nghĩa: đúng hay sai? 3 tim." · "Xếp thẻ từ thành câu trước khi hết giờ." · "Chọn loại từ đúng cho danh từ. 3 tim." · "Đập đúng con mang từ Thái. 60 giây." · "12 câu hỏi, 2 quyền trợ giúp, vòng thưởng ×2." · "Lái máy bay vào đám mây đúng. 3 tim." · "Tìm đường tới đáp án, tránh ma đuổi. 3 tim.",
"~{n} phút", "60 giây", "Kỷ lục:", "Chưa chơi", "{n} mục cần ôn — sẽ ưu tiên trong Bài tập.", "Cần ít nhất {need} từ hoặc câu ngắn (nguồn này có {have}).", "Cần ít nhất {need} từ hoặc câu (nguồn này có {have}).",
"Thoát", "Tạm dừng", "Đã tạm dừng", "Tiếp tục", "Chơi lại", "Âm nền", "Tự đọc", "Đập từ có nghĩa:", "Bay vào mây:", "Tìm đường tới:", "Câu {i}/{n}", "Vòng thưởng — điểm ×2", "50:50", "+10 giây", "Đã dùng", "Tiếp", "Xem kết quả", "Tốc độ ×{n}", "Từng bước", "Bay", "Bị ma bắt! Thử lại câu này", "Đúng", "Sai — {th} là {vi}", "Sai — đúng là {th}",
"Kết thúc", "{n}/3 sao", "Kỷ lục mới!", "Kỷ lục:", "Combo cao nhất", "Mục sai", "đã đánh dấu “cần ôn”", "Chơi với mục sai", "Đổi trò", "Vừa chơi", "Về danh sách", "Đập nhầm {n} lần", "Trợ giúp đã dùng:", "Bay qua {n} hàng mây", "Qua {n} màn".

## Lưu ý chữ Thái
- Chữ Thái luôn trên nền trắng (`panel` / biển / mây / thẻ đáp án), `lang="th"`, line-height `th` 1.75; **không** đặt trực tiếp lên cảnh nền theme.
- Đập chuột: biển ≥ 140×56, chữ 32px (co 24px nếu > 8 ký tự hiển thị); Máy bay: mây 180×80, 28px (câu ngắn 22px, 2 dòng); Mê cung: thẻ đáp án ngoài lưới 160×56, 28px; Đố vui: đề 56px, đáp án Thái 28–32px.
- Dấu trên/dưới (ปู่, ที่) cần padding dọc ≥ 8px trong biển/mây; không `overflow: hidden` theo chiều dọc.
- Từ dài (ก๋วยเตี๋ยว): cho phép co chữ, **không** cắt hoặc ellipsis.

## Theme — token chốt (thay `color.game-theme.*` tạm)
| Token | Biển (`sea`) | Không gian (`space`) | Khu vườn (`garden`) |
|---|---|---|---|
| `value` (nút/tường, chữ trắng trên nó) | `#0B6E8A` (trắng 5.81) | `#5B3CC4` (trắng 7.27) | `#2F6B1F` (trắng 6.47) |
| `subtle` (nền nhạt; `value` trên nó) | `#E2F4F8` (5.13) | `#EEEAFB` (6.16) | `#EAF5E1` (5.75) |
| `fg` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| `scene-top` (trời) | `#BFE8F2` | `#141A3A` | `#DFF3D2` |
| `scene-bottom` (biển / vũ trụ sâu / cỏ) | `#8FD3E6` | `#232B5E` | `#A9D98A` |
| `ground` (cát / thiên thạch / đất — trang trí) | `#F3E3B5` | `#3A3F6E` | `#8B5E34` |
| `hud-fg` (chữ thanh trên, trên `scene-top`·`scene-bottom`) | `#0B2A36` (11.47 · 9.03) | `#FFFFFF` (16.95 · 13.30) | `#17330F` (11.79 · 8.56) |
| `hud-fg-muted` | `#0B2A36` 75% | `#C9CCF2` (10.82) | `#17330F` 75% |
| `panel` | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| Nhân vật (Noto) | 🦀 · ✈️ · 🐠/🐙 | 👽 · 🚀 · 🧑‍🚀/👾 | 🐹 · 🛩️ · 🐞/🐝 |
| Âm nền CC0 | sóng + guitar nhẹ | synth pad | chim + ukulele |

- Cảnh nền = 2 dải màu phẳng (`scene-top` → `scene-bottom`, chuyển 1 đường cong SVG, không gradient mờ) + 3–5 đồ trang trí (Kenney CC0 hoặc emoji) ở mép, **không** sau vùng chữ.
- Asset: bộ **Kenney** CC0 (vd. *Background Elements Redux*, *Space Shooter Redux*, *Fish Pack* — agent kiểm lại giấy phép CC0 trên trang tải) + **Noto Emoji** (Apache 2.0) → `apps/web/public/games/` + `LICENSE.md` (tên bộ, tác giả, URL, giấy phép). Âm nền: vòng lặp **CC0** (vd. OpenGameArt có nhãn CC0 hoặc Kenney audio), OGG ≤ 150 KB mỗi theme, tải lười khi bật 🎵.

## Màu 4 trò mới (`color.game.*`, chỉ khu Trò chơi)
| Token | Trò | `value` | `subtle` | Trắng / `value` | `value` / `subtle` |
|---|---|---|---|---|---|
| `game.whack-a-mole` | Đập chuột — nâu hổ phách | `#9A5B0B` | `#FBF1E1` | 5.42 | 4.84 |
| `game.gameshow` | Đố vui truyền hình — xanh lam | `#1D4ED8` | `#EAF0FD` | 6.70 | 5.87 |
| `game.airplane` | Máy bay — xanh trời | `#0369A1` | `#E5F3FA` | 5.93 | 5.24 |
| `game.maze` | Mê cung — xanh lá | `#15803D` | `#F0F9F3` | 5.02 | 4.67 |
`fg` = `#FFFFFF` cho cả 4. Thêm `color.highlight #FFB627`, `color.star.{fill #FFB627, stroke #A35200}` (M0.5c §2.5).

## Ngoài phạm vi
Bảng xếp hạng chung, XP, thử thách ngày (Phase 2); trò ra đề bằng audio / nhãn "Nghe"; theme thứ 4+ hoặc theme do người dùng tạo; chỉnh tốc độ/độ khó; nhiều người chơi; mobile/cảm ứng tối ưu; pháo hoa/confetti; mascot dẫn chuyện; nhạc nền ngoài 3 vòng lặp CC0.

## Câu hỏi mở cho owner — áp dụng đề xuất (2026-11-21)
| # | Câu hỏi | Đề xuất (= quyết định) |
|---|---|---|
| Q1 | Âm nền mặc định bật hay tắt? | **Tắt** (người học thường học nơi công cộng); nhớ khi bật |
| Q2 | Thumbnail ở `/games` đổi theo theme đang chọn? | Không — nhận diện trò ổn định; theme chỉ cho màn chơi |
| Q3 | Máy bay: thêm lý do khóa `items` trong core để câu chữ chính xác ("từ hoặc câu ngắn")? | Có (nhỏ) |
| Q4 | Đập chuột khi reduced-motion: thêm chế độ chậm (thời gian ở lại ×1,5)? | Chưa — xem phản hồi sau |
| Q5 | "Đổi trò" mở dialog chọn trò (đề xuất) hay về `/games`? | Dialog (giữ nguồn, ít bước) |
