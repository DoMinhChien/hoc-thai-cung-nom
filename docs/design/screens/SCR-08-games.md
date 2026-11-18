# SCR-08 Trò chơi: Danh sách, Màn chơi, Kết quả — Requirements: plan 0.6 (F-01, F-02', F-03', F-04'), F-10..F-14, P-09, 7.2

> Trạng thái: **📝 Chờ owner duyệt** (M0.5b, 2026-11-18). Ưu tiên làm **trước** Bài tập (owner chốt 2026-11-18). Wireframe: `SCR-08-games.png`, `SCR-08-play-match.png`, `SCR-08-play-truefalse.png`, `SCR-08-play-classifier.png`, `SCR-08-result.png`.

## Nguyên tắc chung
- **v7.3 (owner chốt 2026-11-18):** khu Trò chơi sinh động hơn phần còn lại — mỗi trò **một màu riêng** (`color.game.*`: Ghép cặp tím · Đúng hay sai? cam · Xếp câu tốc độ xanh ngọc · Đoán loại từ hồng) cho card ở `/games`, thanh trên, nút, thanh thời gian, màn kết quả; chuyển động phản hồi (đếm 3·2·1, rung/nảy, "+điểm", combo, đồng hồ sắp hết giờ) và **hiệu ứng mạnh hơn khi phá kỷ lục** (vẫn không confetti/mascot). Dòng "không confetti" bên dưới vẫn áp dụng.
- Mỗi lượt **1–3 phút**, chơi được hoàn toàn bằng bàn phím; vui nhờ **cơ chế** (giờ, combo, kỷ lục), không mascot, không confetti (7.6.1).
- **Không đổi lịch FSRS** (F-12). Chỉ lưu: điểm, độ chính xác, kỷ lục cá nhân, và đánh dấu mục sai là **"cần ôn"** (Bài tập M9 sẽ ưu tiên các mục này).
- **Nguồn câu hỏi (F-10, sửa v7.2):** mặc định "Từ đã học" (mục đã có thẻ SRS). Chưa đủ (< 6 mục) → dùng **từ/câu của chuyên đề đang chọn** kể cả chưa học (chơi để làm quen). Không dùng mục `draft` thiếu nghĩa / thiếu đáp án.
- Âm phản hồi ngắn đúng/sai, tắt được (F-13). `prefers-reduced-motion`: bỏ chuyển động, dùng thanh thời gian.
- Rời tab / mất focus → **tự tạm dừng** đồng hồ.

---

## A. Danh sách trò chơi (route: `/games` · App layout)
```
Trò chơi                                                        (H1)
Chơi nhanh 1–3 phút với từ và câu bạn đã học.

Nguồn: [ Từ đã học (86 từ · 24 câu) ▾ ]      (hoặc chọn một chuyên đề)

┌ 1 Ghép cặp ───────────┐ ┌ 2 Đúng hay sai? ─────┐ ┌ 3 Xếp câu tốc độ ────┐ ┌ 4 Đoán loại từ ──────┐
│ Lật thẻ, ghép từ Thái │ │ Từ + nghĩa: đúng hay │ │ Xếp thẻ từ thành câu │ │ Chọn loại từ đúng     │
│ với nghĩa.            │ │ sai? 3 tim.          │ │ trước khi hết giờ.   │ │ cho danh từ. 60 giây. │
│ ~1 phút · 6 cặp       │ │ ~1 phút              │ │ ~2 phút · 5 câu      │ │ ~1 phút               │
│ Kỷ lục: 0:42          │ │ Kỷ lục: 1 240 điểm   │ │ Chưa chơi            │ │ Kỷ lục: 860 điểm      │
│ [ Chơi  1 ]           │ │ [ Chơi  2 ]          │ │ [ Chơi  3 ]          │ │ [ Chơi  4 ]           │
└───────────────────────┘ └──────────────────────┘ └──────────────────────┘ └───────────────────────┘
Từ trò chơi: 6 mục cần ôn — sẽ ưu tiên trong Bài tập.             (fg-muted, ẩn nếu 0)
```
- 4 card cùng kích thước (lưới 4 cột ≥ 1280px, 2 cột ở 1024px). Phím `1`–`4` mở trò tương ứng.
- **Nguồn**: dropdown "Từ đã học" + danh sách chuyên đề; nhớ lựa chọn.
- Card bị khóa khi nguồn không đủ dữ liệu: Xếp câu cần ≥ 5 câu có `tokens`; Đoán loại từ cần ≥ 8 từ có `classifier` → nút vô hiệu + dòng lý do ("Cần chuyên đề có loại từ, vd. Chuyên đề 3").
- Sidebar: mục **Trò chơi** active.

## B. Màn chơi (route: `/games/:id` · Focus layout)
**Thanh trên chung:** `✕ Thoát (Esc)` · tên trò · **đồng hồ** (đếm ngược hoặc đếm lên) · **điểm** · **combo ×n** (chỉ hiện khi ≥ 2). Thoát giữa chừng: không hỏi, không lưu kỷ lục.
Bắt đầu: màn đếm "3 · 2 · 1" (bỏ qua khi reduced-motion) — `Space` bắt đầu ngay.

| Trò | Bố cục | Luật & điểm | Phím |
|---|---|---|---|
| **F-01 Ghép cặp** | Lưới 4 × 3 thẻ úp (6 cặp: 6 từ Thái + 6 nghĩa Việt); thẻ lật hiện chữ; cặp đúng mờ đi và giữ mở | Lật 2 thẻ; khớp → giữ, sai → úp lại sau 0,8 s. Kết thúc khi hết cặp. Điểm = thời gian (thấp hơn tốt hơn) + số lượt lật | Mũi tên + `Space` / click |
| **F-02' Đúng hay sai?** | Thẻ giữa: từ/câu Thái 48px (+ 🔊 tự phát nếu bật) và **một nghĩa Việt** đề xuất (50% đúng); 2 nút lớn **← Sai** · **Đúng →** | **3 tim** (v7.3): mỗi câu có giờ theo độ dài (từ 5 s, câu +1 s / 3 thẻ từ, tối đa 9 s), nền thẻ ngả đỏ dần khi sắp hết giờ; sai hoặc hết giờ **mất 1 tim**; đúng 15 câu liền +1 tim (tối đa 5); hết tim → kết thúc. Đúng +100 × combo (tối đa ×5) + thưởng tốc độ 0..50; sai: combo về 0, rung thẻ, hiện nghĩa đúng 0,9 s | `←` / `→` (hoặc `F` / `J`) |
| **F-03' Xếp câu tốc độ** | Như E-06 (câu Việt + ngân hàng thẻ từ, **không** thẻ nhiễu) + thanh thời gian mỗi câu 20 s | 5 câu; điểm = 100 + giây còn lại × 10; hết giờ = 0 điểm câu đó, hiện đáp án. **Sau mỗi câu — đúng hay sai — đọc cả câu đúng** (khi bật tự đọc), đọc xong mới sang câu tiếp (góp ý owner 2026-11-18) | `1`–`9`, `Backspace`, `Enter` |
| **F-04' Đoán loại từ** | Danh từ Thái 48px (+ nghĩa nhỏ) trên **thanh thời gian 5 s** co dần; 4 nút loại từ (vd. ตัว · คู่ · คัน · อัน) — 1 đúng + 3 loại từ khác có trong dữ liệu | **3 tim** như Đúng hay sai? (5 s/từ, nền ngả đỏ dần); đúng +100 × combo + thưởng tốc độ 0..50; sai / hết giờ mất 1 tim | `1`–`4` |

- Phản hồi luôn có **icon + chữ** ("✓ Đúng" / "✕ Sai — ตัว"), không chỉ màu.
- Mỗi trò là module độc lập theo interface `Game` (`generateRound(source, seed)`, `answer()`, `score()`, `summary()`, F-14).

## C. Kết quả lượt chơi (cuối `/games/:id`)
```
Đoán loại từ — Kết thúc                                         (H1)
  1 120 điểm        18/22 đúng (82%)        Combo cao nhất ×5
  ★ Kỷ lục mới! (trước: 860)                                  (chỉ hiện khi phá kỷ lục, chữ, không hiệu ứng)
  Mục sai (4) — đã đánh dấu "cần ôn" (bấm [🔖 Cần ôn] từng mục để bỏ / thêm lại)
   รองเท้า  giày        đáp án คู่   · bạn chọn ตัว
   ...
  [ Chơi lại  ↵ ]   [ Chơi với mục sai  W ]   [ Trò khác ]
```
- "Chơi với mục sai": lượt mới chỉ gồm các mục vừa sai (nếu ≥ 4 mục, không thì ẩn).
- **v7.3 (tham khảo Memrise):** tự đọc chữ Thái khi hiện câu (Đúng hay sai?, Đoán loại từ) qua `AudioProvider`, nút 🗣 bật/tắt trên thanh trên (cài đặt `gameAutoSpeak`, mặc định bật; không có giọng Thái → nút vô hiệu). Thanh trên của trò "3 tim" hiện ♥ thay đồng hồ.
- Kỷ lục lưu theo **trò + nguồn** (Từ đã học / từng chuyên đề).

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Chưa học gì và chưa chọn chuyên đề | Nguồn tự chọn chuyên đề đầu tiên theo `order`, dòng nhắc "Bạn đang chơi với từ chưa học của Chuyên đề {n}." |
| Không có giọng Thái | Tắt tự phát âm, nút 🔊 vô hiệu; trò vẫn chơi được |
| Offline / Guest | Chơi bình thường (dữ liệu local) |
| Tab ẩn | Tạm dừng, overlay "Đã tạm dừng — Space để tiếp tục" |

## Câu chữ
"Trò chơi", "Chơi nhanh 1–3 phút với từ và câu bạn đã học.", "Nguồn:", "Từ đã học", "Ghép cặp", "Đúng hay sai?", "Xếp câu tốc độ", "Đoán loại từ", "Kỷ lục:", "Chưa chơi", "Chơi", "Cần chuyên đề có loại từ", "{n} mục cần ôn — sẽ ưu tiên trong Bài tập.", "Thoát", "Đúng", "Sai", "Combo", "Đã tạm dừng — Space để tiếp tục", "Kết thúc", "Kỷ lục mới!", "Combo cao nhất", "Mục sai", "đã đánh dấu “cần ôn”", "Chơi lại", "Chơi với mục sai", "Trò khác".

## Lưu ý chữ Thái
Thẻ Ghép cặp tối thiểu 160 × 96 để từ dài (ก๋วยเตี๋ยว) không bị cắt; nút loại từ 64px cao, chữ Thái 28px; line-height `th`.

## Ngoài phạm vi
Leaderboard, XP, thử thách ngày (Phase 2: F-05..F-07, E-01..E-05); âm nhạc nền; hiệu ứng pháo hoa.
