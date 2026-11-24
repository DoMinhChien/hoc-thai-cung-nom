# SCR-11 — Shadowing đoạn (trong Luyện nói)

> Nguồn: phản hồi CAT 2026-11-24 *"kĩ thuật shadowing"*. Claude Desktop đề xuất, **owner duyệt 2026-11-24**. Plan §0.18 · ROADMAP **M12.10**.
> Xây trên M12.9 (ghi âm, nghe lại, tự đánh giá, bộ chọn Nội dung ôn) và **cùng cờ `VITE_ENABLE_SPEAKING`** (tắt trên production — giai đoạn CAT). Responsive SCR-00 v2, iPhone là thiết bị chính.
> Làm 2 bước: **A — thử khả thi** (trang thử nội bộ, owner thử iPhone) → **B — làm thật** (chỉ mở sau khi owner báo kết quả bước A).

## 1. Shadowing khác "Nói theo" (M12.9) thế nào

| | Nói theo (M12.9) | Shadowing đoạn (M12.10) |
|---|---|---|
| Đơn vị | 1 từ / 1 câu | 1 hội thoại hoặc 5–8 câu liên tiếp của bài học |
| Cách nói | nghe xong → nói lại | **nói đè theo**, trễ ~0,5 s (bậc 4–5) |
| Luyện | phát âm từng câu | ngữ điệu, nhịp, nối âm, phản xạ |
| Nhận dạng Mức 2 | có | **không** (micro thu cả giọng mẫu) |

## 2. Nội dung

- **Hội thoại**: 31 đoạn / 268 lượt (`dialogues.yaml`) — chọn cả đoạn hoặc **một vai**.
- **Chuỗi câu bài học**: 5–8 câu đầu (theo thứ tự) của một bài học có ≥ 5 câu.
- **Cụm (chunk)**: mỗi lượt thoại / câu = 1 cụm; cụm dài > 9 thẻ → tách theo `tokens` (≈ 4–6 thẻ / cụm). Hàm thuần trong `packages/core/src/speaking/shadowing.ts`.
- **Âm thanh**: ưu tiên file `audio` (giọng người — §6) nếu có; không có → giọng máy (Web Speech, cài đặt M9.5), **phát từng cụm** rồi nối (không đọc liền cả đoạn) để tô sáng + lặp cụm ổn định.

## 3. Thang 5 bậc (mỗi đoạn)

| Bậc | Tên trong app | Làm gì | Chữ Thái | Tốc độ mặc định | Ghi âm |
|---|---|---|---|---|---|
| 1 | Nghe hiểu | Nghe cả đoạn, hiện nghĩa tiếng Việt từng cụm | hiện + nghĩa | 1.0 | — |
| 2 | Nghe theo chữ | Cụm đang phát được tô sáng (karaoke theo cụm) | hiện | 0.8 | — |
| 3 | Nói theo có nghỉ | Sau mỗi cụm dừng (độ dài cụm × 1,2, tối thiểu 1,5 s) để nói lại | hiện | 0.7 → 0.8 | — |
| 4 | Shadowing có chữ | Nói đè theo, không dừng | hiện | 0.8 → 1.0 | — |
| 5 | Shadowing không chữ | Như bậc 4, ẩn chữ (nút "Hiện nghĩa" nếu cần) | ẩn | 1.0 | **có** |

- Hoàn thành bậc → ⭐ (tối đa 5 / đoạn); được nhảy bậc, nhưng sao chỉ tính khi làm lần lượt.
- Sau bậc 5: **nghe lại xen kẽ theo cụm** (mẫu → của tôi, lần lượt), hoặc "Của tôi cả đoạn"; **tự đánh giá cả đoạn** Giống / Gần giống / Chưa giống + chạm chọn cụm khó → cờ **"cần ôn"** (`origin: 'shadowing'`) cho câu / lượt đó.
- Gợi ý **đeo tai nghe** ở đầu bậc 4–5 (1 dòng, đóng được).

## 4. Màn hình

- `/practice/speaking` chia 2 tab: **Từng câu** (M12.9) · **Shadowing đoạn**. Tab Shadowing: danh sách đoạn theo bộ chọn Nội dung ôn (M12.8), mỗi đoạn hiện số cụm, thời lượng ước tính, sao 0–5.
- Bài học — bước Hội thoại: nút **"Shadowing đoạn này"** cạnh "Nhập vai".
- Màn luyện `/practice/speaking/shadow/:id` (toàn màn hình): tiêu đề + bậc hiện tại (stepper 1–5), danh sách cụm (cụm đang phát tô sáng, tự cuộn), thanh điều khiển dính đáy: **▶/⏸**, **↺ Lặp cụm**, **tốc độ 0.6 / 0.8 / 1.0**, **khoảng dừng 0 / 1 / 2 s**, **Aa** (bật/tắt chữ Thái · phiên âm · nghĩa), chọn **vai** (hội thoại). Nút ≥ 48px.

## 5. Bước A — thử khả thi (trang nội bộ)

Route `/dev/shadowing` (chỉ khi cờ bật, không có trong điều hướng). Một hội thoại cố định (vd. `d-b09-l1`) + một chuỗi câu:
1. Phát từng cụm bằng giọng máy, tô sáng cụm, đổi tốc độ, lặp cụm, khoảng dừng.
2. **Bậc 5**: vừa phát giọng máy vừa ghi âm (`getUserMedia` `echoCancellation` bật / tắt — 2 nút để so), rồi nghe lại xen kẽ.
3. Ghi log hiển thị trên trang: thời gian thực của từng cụm, `speechSynthesis` có bị tắt / nhỏ đi khi micro mở không, `onboundary` có chạy không, MIME bản ghi.
Owner thử trên iPhone thật **có và không tai nghe** (+ app trên MH chính), báo: nghe giọng mẫu rõ không khi đang ghi, bản ghi có lẫn giọng mẫu không, độ trễ giữa các cụm có chấp nhận được không. Agent ghi kết quả vào §7 rồi mới làm bước B.

## 6. Audio giọng người (bước C — ngoài code)

- Giáo viên thu **31 hội thoại**, ưu tiên Bài 9–12; mỗi lượt 1 file (hoặc cả đoạn + mốc thời gian).
- Quy ước đề xuất: `apps/web/public/audio/<dialogue_id>/<line_index>.m4a` (AAC mono 64 kbps, ~10–30 KB / lượt), cột / trường `audio` trỏ tới file; câu luyện: `audio/<sentence_id>.m4a`. **Bản quyền**: audio của GV → hỏi GV cho phép dùng; repo private.
- App: có file → dùng file (tô sáng theo lượt, tốc độ bằng `playbackRate` giữ cao độ); không có → giọng máy. Không chặn bước B.

## 7. Kết quả thử thiết bị (agent điền sau bước A)

| Thiết bị | Tai nghe | Giọng mẫu khi ghi | Bản ghi lẫn giọng mẫu | `onboundary` | Ghi chú |
|---|---|---|---|---|---|
| iPhone … Safari | không | | | | |
| iPhone … Safari | có | | | | |
| iPhone … MH chính | | | | | |

## 8. Kiểm thử (bước B)

- Vitest: tách cụm (theo lượt / theo `tokens`), thời lượng khoảng dừng, tiến trình bậc + sao, cờ "cần ôn" theo cụm.
- E2E Chromium (fake media, mock `speechSynthesis` trả sự kiện `end` theo thời gian giả): đi 5 bậc một hội thoại, lặp cụm, đổi tốc độ, ẩn chữ bậc 5, ghi âm + nghe lại xen kẽ, tự đánh giá → cờ "cần ôn"; nút "Shadowing đoạn này" trong bài học; axe; baseline phone + desktop. Cờ tắt → không có tab / nút nào.
