# SCR-10 — Luyện nói (Mức 1 + Mức 2)

> Nguồn: phản hồi CAT 2026-11-24 *"muốn thêm phần luyện nói"*. Owner chọn **Mức 1 (nghe – nói theo – nghe lại, tự đánh giá) + Mức 2 (nhận dạng giọng nói của trình duyệt, nếu thiết bị hỗ trợ)**. Mức 3 (Azure Pronunciation Assessment, chấm điểm) **không** thuộc M12.9 — thử nghiệm sau CAT (plan §0.17).
> Plan §0.17 · ROADMAP **M12.9**. Áp dụng responsive SCR-00 v2 (iPhone là thiết bị chính).
> Trạng thái: **owner duyệt hướng 2026-11-24**. PR UI → owner thử trên iPhone thật qua link preview rồi merge (AGENTS 8.1).

## 1. Nguyên tắc

- **Không backend, không tốn phí.** Ghi âm bằng `MediaRecorder` trên máy; bản ghi **không rời máy** ở Mức 1.
- **Mức 2 là phần thêm**: chỉ hiện khi trình duyệt có `SpeechRecognition` / `webkitSpeechRecognition` hỗ trợ `th-TH`. Không có → dùng Mức 1, không báo lỗi.
- **Nói rõ giới hạn**: Mức 2 chỉ cho biết *"máy nghe ra chữ gì"*, **không chấm thanh điệu / phát âm**. Câu chữ trong UI: *"Máy nghe được"*, không dùng *"Phát âm đúng"*.
- Không đổi lịch FSRS (như F-12); tự đánh giá "Chưa giống" → cờ **"cần ôn"** (dùng lại cơ chế `needsReview`, `origin: 'speaking'`).

## 2. Lối vào

1. **`/practice` (Bài tập)**: thẻ mới **"🎙 Luyện nói"** cạnh các chế độ hiện có → `/practice/speaking`. Chọn nội dung bằng **bộ chọn "Nội dung ôn" của M12.8** (dùng lại component; mặc định "Bài vừa học"). Không thêm tab điều hướng mới.
2. **Bài học — bước Từ vựng / Mẫu câu**: mỗi thẻ từ / câu ví dụ có nút **🎙 Nói theo** (mở panel ghi âm gọn ngay trong thẻ).
3. **Bài học — bước Hội thoại**: nút **"Nhập vai"**: chọn vai A hoặc B → app phát lượt của vai kia, đến lượt mình thì ghi âm (có nút "Nghe mẫu lượt này"); hết hội thoại → nghe lại cả đoạn (mẫu + bản ghi của mình xen kẽ).
4. **Tổng quan**: không thêm khối (tránh rối); thống kê ở Tiến độ (§6).

## 3. Phiên luyện nói `/practice/speaking/session`

- 10 mục / phiên (từ + câu ngắn ≤ 9 thẻ; ưu tiên mục "cần ôn" như M12.8). Thanh tiến độ, nút ✕ thoát (luồng toàn màn hình, ẩn tab dưới).
- Mỗi mục, từ trên xuống:
  1. Nghĩa tiếng Việt + chữ Thái (Sarabun, lớn) + phiên âm (theo cài đặt).
  2. **▶ Nghe mẫu** (tốc độ thường) · **🐢 Chậm** (0,7×). Giọng đọc theo cài đặt M9.5.
  3. **🎙 Nút ghi âm lớn** (≥ 72px, giữa đáy): chạm để bắt đầu, chạm lần nữa để dừng; tự dừng sau 10 s; vòng sóng âm khi đang ghi. Lần đầu: hỏi quyền micro (§5).
  4. Sau khi ghi: **▶ Của tôi** · **▶ Mẫu** · **⇄ Xen kẽ** (mẫu → của tôi) · **↻ Ghi lại**.
  5. **Mức 2** (nếu có): khung *"Máy nghe được: …"* + câu mẫu tô màu theo thẻ (`tokens`): thẻ khớp = xanh + ✓, không khớp = xám gạch dưới. Dòng nhỏ: *"Chỉ để tham khảo — máy không chấm thanh điệu."*
  6. **Tự đánh giá** (bắt buộc để sang mục tiếp): **😀 Giống** · **🙂 Gần giống** · **😕 Chưa giống**.
- Màn kết quả: số mục theo 3 mức, danh sách "Chưa giống" → **"Luyện lại các mục này"**, "Phiên mới", "Về Bài tập". Âm phản hồi + hiệu ứng `fb-*` như M9.5.

## 4. Mức 2 — so khớp

- Hàm thuần `packages/core/src/speaking/match.ts`: chuẩn hóa chuỗi Thái (bỏ khoảng trắng, dấu câu, ZWSP; `ๆ` giữ nguyên), so với `th` và mọi `th_alt`; căn theo `tokens` (thẻ có trong kết quả nhận dạng theo thứ tự) → `matchedTokens[]`, `ratio`. Lấy bản `th`/`th_alt` có `ratio` cao nhất. Từ đơn: khớp nguyên từ hoặc `thai_alt`.
- Hiển thị "Máy nghe được trọn câu ✓" khi `ratio = 1`; không đưa ra điểm số %.
- `SpeechRecognition`: `lang = 'th-TH'`, `interimResults = false`, `maxAlternatives = 3` (lấy alternative khớp tốt nhất). Chạy **song song** với `MediaRecorder` trong cùng lần ghi; nếu thiết bị không cho chạy song song (một số bản iOS) → ưu tiên ghi âm, bỏ nhận dạng lần đó.
- Cài đặt: **"Nhận dạng giọng nói"** (bật / tắt) trong `/settings`, mặc định **tắt cho tới khi người học đồng ý** ở hộp thoại lần đầu (§5).

## 5. Quyền riêng tư & quyền micro

- Lần đầu vào Luyện nói: hộp thoại ngắn — *"Cần micro để ghi giọng bạn. Bản ghi chỉ lưu trên máy này."* → **Cho phép** (gọi `getUserMedia`). Bị từ chối → hướng dẫn bật lại (iPhone: Cài đặt → Safari → Micro; app đã "Thêm vào MH chính": Cài đặt → tên app) + vẫn cho nghe mẫu.
- Mức 2, lần đầu: *"Nhận dạng giọng nói dùng dịch vụ của trình duyệt (Apple / Google) — giọng bạn được gửi tới họ để chuyển thành chữ. Bật?"* → Bật / Không. Lưu lựa chọn.
- Cập nhật `/privacy`: mục ghi âm (lưu cục bộ, xóa được) + mục nhận dạng giọng nói của trình duyệt.
- Bản ghi: lưu **bản mới nhất mỗi mục** trong IndexedDB (Dexie bảng `recordings`, tối đa 200 bản, cũ nhất bị xóa trước); **không** đưa vào tệp xuất tiến độ JSON; nút **"Xóa mọi bản ghi giọng nói"** ở `/settings` → Dữ liệu tiến độ. "Xóa tiến độ" cũng xóa bản ghi.

## 6. Dữ liệu & tiến độ

- `SessionRecord` loại `speaking` (số mục, 3 mức tự đánh giá, có dùng Mức 2 hay không) → tính chuỗi ngày học; `/progress` thêm dòng "Luyện nói: n mục tuần này".
- Bản ghi + `SpeakingAttempt` (itemType, itemId, selfRating, asrRatio?, at) — Dexie version mới, migration không mất dữ liệu cũ.

## 7. Hỗ trợ thiết bị

| | Mức 1 (ghi âm) | Mức 2 (nhận dạng) |
|---|---|---|
| iPhone / iPad Safari ≥ 14.5, app trên MH chính | ✅ (`audio/mp4`) | ✅ khi bật Siri & Dictation — kiểm tra thực tế |
| Chrome Android / desktop | ✅ (`audio/webm`) | ✅ |
| Edge | ✅ | ✅ |
| Firefox | ✅ | ❌ → chỉ Mức 1 |
| Không có `MediaRecorder` / micro | Thông báo + chỉ nghe mẫu | — |

## 8. Kiểm thử

- Vitest: `match.ts` (khớp đủ / thiếu thẻ / dùng `th_alt` / dấu câu / từ đơn `thai_alt`), chọn mục phiên, ghi `SessionRecord` + cờ "cần ôn", giới hạn 200 bản ghi.
- E2E Chromium (`--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`) + **mock `SpeechRecognition`** (trả câu khớp / thiếu): phiên 10 mục → kết quả → "Luyện lại"; nút Nói theo trong bài học; Nhập vai hội thoại; từ chối quyền micro; tắt Mức 2; axe; baseline phone + desktop. WebKit iPhone 15: mock `getUserMedia` + `MediaRecorder`.
- Owner thử **iPhone thật**: quyền micro, ghi / nghe lại, Mức 2 có chạy không (báo kết quả để ghi vào bảng §7).
