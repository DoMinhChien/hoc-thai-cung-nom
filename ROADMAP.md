# ROADMAP — Học Thai cùng Nôm

> Nguồn trạng thái duy nhất của dự án. Agent tự quản lý theo vòng lặp trong `AGENTS.md` mục 5: tick task ngay khi xong, ghi 1 dòng nhật ký cuối mỗi phiên.
> Chi tiết requirement: `hoc-thai-cung-nom-plan.md`. Việc owner làm tay: `SETUP-OWNER.md`.

**Trạng thái:** ⚪ Chưa bắt đầu · 🔵 Đang làm · 🟠 Bị chặn · 🟢 Xong

## Milestone đang mở

> **📥 Nội dung thật (cập nhật 2026-11-22, plan 0.12):** **27/27 file** trong `sources/` (12 bài giáo trình + 15 chuyên đề) đã nhập vào `content/` — 27 unit, 158 bài học, 1563 từ, 856 câu, 128 mẫu câu, 21 hội thoại; tất cả **`draft: true`, chờ giáo viên duyệt** (chi tiết + điểm cần GV xem ở **`content/IMPORT-STATUS.md`**). Agent: TC.1 ✅, TC.3 ✅.

> **🟢 M9 — Bài tập** (7/7 task, xong 2026-11-20, nhánh `m9-practice` — PR #20): `/practice`, `/practice/session`, 10 loại câu hỏi E-01..E-09, E-14, FSRS cho từ **và** câu, bậc dịch E-11, bước Bài tập của bài học dùng chung engine. Kế tiếp: **M10** (cần SCR-03/07/09 — đợt M0.5b-2).

> **🟢 M9.5 — Phản hồi người học** (3/3 task trong phạm vi — T9.5.1, T9.5.2, **T9.5.4 ✅ 2026-11-21** hướng B; T9.5.3 ⏸ **tạm loại** (owner 2026-11-21)): âm đúng/sai rõ ở mọi nơi, giọng đọc dễ nghe, giao diện **"Nắng nhiệt đới"** (nền kem, màu chuyên đề, Lộ trình lưới, chuỗi ngày học, hiệu ứng `fb-*`). T9.5.4 trên nhánh `m9.6-games` (PR #25).

> **🟢 M9.6 — Trò chơi mở rộng** (6/6 task, xong 2026-11-21; **PR #25 đã merge** vào `main`, gồm cả #27): `/games` 8 trò theo SCR-08 v2, 4 màn arcade, 3 theme có cảnh nền, sao + "Đổi trò", E2E + baseline. **Kế tiếp: M10**.

> **🟢 M10 — Tổng quan + Sổ từ + Tiến độ** (6/6 task, mở + xong 2026-11-21; nhánh `m10-home` → PR mới vào `main`): `/` Tổng quan (SCR-03), `/words` Sổ từ + mẹo nhớ của người học (SCR-07), `/progress` Tiến độ (SCR-09), ghi `SessionRecord`, Dexie v6. Owner duyệt + cho merge **#32** (2026-11-21).

> **🟢 CAT M12 — Cài đặt, xuất/nhập, PWA offline, E2E đủ, go-live** (T12.1–T12.5 ✅, T12.6 ⏸; PR #34 đã merge): Cài đặt phiên âm mặc định (G-01), xuất / nhập / xoá tiến độ JSON (G-02), PWA offline (G-03), E2E luồng go-live, `docs/go-live.md`. Production là bản **CAT** (khách hàng nghiệm thu, owner 2026-11-21). **Công bố chính thức** chờ B1, B4–B7, B9 + smoke test + GV duyệt nội dung (mục "Việc chờ owner").

> **🟢 M12.7 — Responsive iPhone & iPad** (7/7 task, mở + xong 2026-11-22, phản hồi CAT, plan 0.15, spec `docs/design/screens/SCR-00-responsive.md`; nhánh `m12.7-responsive` → **PR #38**): phone = thanh tab dưới + sheet "Thêm", tablet = rail, desktop giữ nguyên; trang 1 cột, Sổ từ dạng thẻ, 8 trò bằng chạm, nhập liệu iOS, meta PWA iOS. **Owner duyệt UI mobile trên iPhone thật 2026-11-22**; iPad theo dõi thêm trong CAT.

> **🔵 M12.8 — Trò chơi: chọn nội dung để ôn** (mở 2026-11-22, phản hồi CAT, plan 0.16): spec **`docs/design/screens/SCR-08-source.md`** (owner duyệt hướng 2026-11-22). Agent làm ngay; PR UI → owner xem link preview rồi merge (không tự merge).

> **🟢 TC.4 — Làm đầy đủ các bài còn lại** (mở 2026-11-23, owner; **xong 2026-11-23** — TC.4a–h, chờ merge chuỗi PR #43 → TC.4h): đưa `b01`–`b08`, `b11`, `b12` và các chuyên đề thiếu câu lên chuẩn TC.3 (hình, loại từ, ví dụ, ≥ 5 câu / bài học, hội thoại). Thứ tự `b11` → `b12` → `b08` … `b01` → `c03`, `c06`, `c07` … 8 PR nhỏ (TC.4a–h), tự merge (8.1). Chi tiết mục TC.

> **⏳ Việc chờ owner (cập nhật 2026-11-22)** — agent không tự làm, tick khi xong:
> - [x] **PR M12.7 #38 — T12.7.7:** owner thử UI mobile trên **iPhone thật** ✅ (2026-11-22) → cho merge. **iPad:** theo dõi thêm trong CAT (báo agent nếu lỗi).
> - [x] **Merge** #21, #22, #23 và **#24 (`m9.6-games` → `main`, 2026-11-21)** — M9.6 phần logic đã lên `main`. Còn 1 commit `docs(agents)` (PR luôn base `main`) trên `m9.6-games` → đi kèm PR kế tiếp.
> - [x] ~~**Azure SWA hết chỗ preview:**~~ đã dọn 2026-11-21 (B2). deploy preview của #23 lỗi *"maximum number of staging environments"*. Merge/đóng PR cũ (preview tự xóa khi PR đóng) hoặc xóa environment cũ ở Azure Portal → Static Web App → Environments, rồi chạy lại CI.
> - [ ] ⏸ *(tạm loại 2026-11-21 — owner bật lại khi cần)* **SETUP S13** (Azure AI Speech F0) cho **T9.5.3**: tạo resource Speech (Southeast Asia, F0), ghi `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` vào `.env.local` (không commit, không gửi chat), nghe thử Premwadee / Achara → báo agent "S13 xong, giọng: …".
> - [ ] **Xem baseline:** mới `settings-*`; đổi theo nội dung thật `units-*`, `unit-*`, `lesson-*`, `practice-*`, `practice-arrange-*` (Windows đã commit; Linux lấy từ artifact CI `screenshot-baselines-linux`).
> - [x] **M0.5c / SCR-08 v2** — owner chọn **B** (Q1–Q4 theo đề xuất), SCR-08 v2 làm theo đề xuất (2026-11-21). **#25 merge 2026-11-21** (gồm cả #27, #27 cũng đã đóng ở trạng thái merged).
> - [ ] **Xem baseline hướng B** (đã vào `main` qua #25): `units-*`, `unit-*`, `practice-*`, `games-*`, `game-match-*` đổi; mới `games-v2`, `game-whack` (che lưới hố), `game-gameshow`, `game-airplane`, `game-maze`; Linux lấy từ artifact CI `screenshot-baselines-linux`.
> - [ ] **E2E chập chờn trên WebKit (Linux CI):** `settings.spec` — ô chọn giọng có lúc không hiện trong 5 s (giọng giả nạp chậm); `auth.spec` popup emulator. Không chặn merge khi chạy lại xanh; agent sẽ xem lại khi có thời gian.
> - [x] **SCR-03 / SCR-07 / SCR-09** — owner duyệt 2026-11-21 (câu trả lời ghi trong spec), **#26 đã merge** → M10 mở và làm xong.
> - [x] **PR M10 (#32)** — owner duyệt 2026-11-21.
> - [ ] **Go-live (M12 T12.6)** — **2026-11-21: owner chốt giai đoạn CAT (Customer Acceptance Testing)** — bỏ qua B1, B4–B7, B9 và smoke test tới khi công bố chính thức (**⏸ CAT**); B8 ✅. Chi tiết `docs/go-live.md` mục B:
>   - [ ] ⏸ CAT — B1 Bảo vệ `main`: bắt buộc PR + CI (`check`, `e2e`), **không** bắt buộc review (SETUP S1).
>   - [x] B2 Dọn môi trường preview cũ của Static Web App (giới hạn staging environment — deploy preview lỗi).
>   - [x] B3 Firebase Authorized domains có domain production `*.azurestaticapps.net` (S4).
>   - [ ] ⏸ CAT — B4 Google OAuth consent screen: link `/privacy`, `/terms` production → **Publish / In production** (SETUP S5 bước 3).
>   - [ ] ⏸ CAT — B5 Giới hạn Firebase API key theo HTTP referrer: domain production + `localhost` (SETUP S8).
>   - [ ] ⏸ CAT — B6 Budget alert Azure (SETUP S3).
>   - [ ] ⏸ CAT — B7 Quyết định công bố khi nội dung còn `draft` (nhãn "Bản nháp") hay chờ giáo viên duyệt.
>   - [x] B8 Duyệt câu ghi công (owner duyệt 2026-11-21 — giữ “Nguồn: giáo trình Tiếng Thái Thạc Sĩ Plern-Pin.”) giáo trình ở `/units` (S10).
>   - [ ] ⏸ CAT — B9 Xem đoạn mới ở `/privacy` (tệp xuất tiến độ nằm trên máy người dùng).
>   - [ ] ⏸ CAT — Sau B1–B5: smoke test thủ công trên production (`docs/go-live.md` mục C) → báo agent ghi nhật ký.
> - [x] **PR M12 (#34)** — owner merge 2026-11-21. ~~(`m12-golive`): xem baseline đổi (`settings-*` — thêm khối Hiển thị, Dữ liệu tiến độ) + PWA (`staticwebapp`/service worker) — không tự merge (8.1: đụng cấu hình build/PWA, nhiều màn).~~
> - [x] **Chuyên đề 15 → 2 (#31)** tự merge 2026-11-21 (8.1); **TC.2b (#33)** xoá `u03`/`u11`, tự merge. GV còn duyệt nội dung draft — xem dòng dưới.
> - [ ] **Nội dung (giáo viên duyệt):** Bài 11 → 6 (**#28**) và Bài 5 → 3 (**#29**) **đã merge 2026-11-21** (draft) — giáo trình Bài 1–12 đủ; GV xem từ thẻ hình / số đếm Claude ghi nghĩa, chính tả (b08, b05, b04), tên riêng; còn CĐ 15 → 2; khi có `c03`, `c11` → agent làm **TC.2b**.

> **⚠️ Đổi phạm vi v7 (2026-11-16) theo phản hồi demo khách hàng — đọc plan mục 0 trước.** Người học A1–A2 đã đọc được chữ Thái: bỏ Bảng chữ cái, bỏ hẳn thanh điệu, "Ôn tập" → "Bài tập", bỏ `MasteryGrid`/`HeatmapTable`; trọng tâm là từ vựng theo chủ đề + dịch câu.
> **🟢 M8 — Bàn phím ảo Thái + chấm gõ câu** (nhánh `m8-thai-keyboard`, làm song song M7 — owner chốt 2026-11-17): xong — PR #15 đã merge. M9 kế tiếp chờ M7 + SCR-06.
> **🟢 M7.5 — Trò chơi** (10/10 task, **PR #16 đã merge vào `m7-lessons` 2026-11-19**; vào `main` cùng PR #14) — xong 2026-11-19: `/games` + 4 trò (Ghép cặp, Đúng hay sai?, Xếp câu tốc độ, Đoán loại từ) + kết quả, màu/chuyển động khu Trò chơi + cơ chế kiểu Memrise (v7.3), font Sarabun (v7.4). Chờ owner: xem baseline mới, content mẫu chưa có chuyên đề nào ≥ 5 câu nên Xếp câu tốc độ đang khóa trên content thật. **Không còn milestone mở được**: M7 UI chờ SCR-04/05, M9 chờ M7 + SCR-06.
> **🟢 M7 — Bài học** (7/7 task, xong 2026-11-19; nhánh `m7-lessons-ui` tách từ `m7-lessons`, PR xếp chồng lên #14): `/units` lộ trình + Học tiếp, `/units/:unitId` chi tiết + can-do, `/units/:unitId/:lessonId` bài học 4 bước + bài tập ≥ 80% + màn hoàn thành; E2E luồng học 1 bài. **Kế tiếp: M9 Bài tập** — cần owner duyệt **SCR-06**.
> ⛔ M6 cũ (Bảng chữ cái + Tone Trainer) **hủy**, chưa có code.
> 🟢 M0, M0.5a/TD, M1, M2, M3, M5, M2.1, M5.5, M6, M6.1 xong (Tone Engine giữ nhưng đóng băng).
> ⚪ M0.5b (SCR-03..09 v7) làm song song: Claude Desktop soạn spec + wireframe → owner duyệt. ⚪ M4: PDF mẫu ✅ (`sources/`, plan 0.11 + 5.3 v7.1), còn chờ **S9** (Anthropic key).

---

## 1. Thứ tự & phụ thuộc (Phase 1)

```
M0 Khung dự án ──────────────┐
M0.5a Design: brief + Login/Account ─┼──► M1 Đăng nhập ──► M2 Core ──► M3 Content ──► M5 Data+SRS ──► M2.1 ──► M5.5 Dọn v7 ──► M6 Content v7 ──► M7 Bài học ──► M8 Gõ ──► M9 Bài tập ──► M10 Tổng quan/Tiến độ ──► M12 Go-live   (v7.2: M7.5 Trò chơi chen sau M7, trước M9)
SETUP S1–S3 (GitHub, Azure) ─┘        ▲                       │
SETUP S4–S6 (Firebase, Google, FB) ───┘                       └──► M4 PDF pipeline (cần S9 + PDF mẫu S10)
M0.5b Design các màn còn lại: làm dần, mỗi màn xong TRƯỚC milestone dùng nó
```

- **M0 không cần thiết kế** (chỉ khung, layout trống) → làm được ngay.
- **M1 cần:** spec `SCR-01 Đăng nhập`, `SCR-02 Tài khoản`, `SCR-00 Layout chung` + tokens cơ bản (M0.5a) và SETUP **S4–S6**.
- **M2 (Tone Engine, logic thuần)** không phụ thuộc UI → có thể làm song song nếu M1 bị chặn chờ owner.

## 2. Bảng milestone Phase 1

| M | Tên | Trạng thái | Cần trước (spec / setup) |
|---|---|---|---|
| M0 | Khung dự án | 🟢 | S1.2 ✅, S2 ✅, S7 (secret) ✅ — PR #1 |
| M0.5a | Design: brief, flows, tokens cơ bản, SCR-00/01/02 | 🟢 | ✅ Owner duyệt 2026-11-15 |
| M1 | Đăng nhập Google (Facebook → Phase 2) | 🟢 | M0 ✅, M0.5a ✅, S4 ✅, S5 ✅, S7 ✅, S12 ✅ — PR #5; smoke test production OK |
| M2 | Core: schema, normalize, Tone Engine | 🟢 | M0 ✅ — PR #3 |
| M3 | Content pipeline TS + content mẫu | 🟢 | M2 ✅; S10 content mẫu ✅ — PR #7 |
| M4 | PDF pipeline Python (Claude vision, `--suggest`) | ⚪ | M6.1, **S9**; PDF mẫu ✅ (`sources/`) |
| M0.5c | **Làm mới giao diện** theo feedback người học (Claude Desktop: 2–3 hướng hi-fi → owner chọn) + **SCR-08 v2 Trò chơi** (thumbnail, 3 theme, 4 màn mới — tham khảo Wordwall) | ⚪ | Trước M9.6 UI và M10; cùng SCR-03/07/09 |
| M0.5b | Design v7: SCR-03..09 (Tổng quan, Bài học, Bài tập, Sổ từ, Trò chơi, Tiến độ) | 🔵 | SCR-04/05/06 + wireframe ✅ soạn 2026-11-18, **chờ owner duyệt**; SCR-03/07/08/09 làm trước M10/M10.5 |
| M5 | Data layer + SRS + progress components | 🟢 | M2 ✅, M3 ✅ — PR #8, #9 |
| M2.1 | Bổ sung quy tắc Tone Engine (อักษรนำ, ไ/ใ/ำ/เา) | 🟢 | M5 ✅ — PR #10 |
| M5.5 | **Dọn phạm vi v7**: gỡ chữ cái/thanh điệu khỏi UI, nav mới, schema tùy chọn | 🟢 | M2.1 ✅; plan mục 0 — PR #11 |
| ~~M6 cũ~~ | ~~Bảng chữ cái + Tone Trainer~~ | ⛔ Hủy (v7) | — |
| M6 | Content model v7: Unit/Lesson/Word/Sentence/Grammar/Dialogue + mẫu `content/templates/` + content mẫu Unit 1–2 | 🟢 | M5.5 ✅ — PR #12 |
| M6.1 | Content model theo tài liệu giáo viên (plan 0.11): `kind`, B1, `classifier`, `thai_alt`, `note_vi`, draft được thiếu nghĩa/đáp án | 🟢 | M6 ✅; PDF mẫu ✅ — PR #13 |
| M7 | Bài học: `/units`, chi tiết unit, bài học (bỏ qua bước trống), AudioProvider | 🟢 | SCR-04/05 ✅ — PR #14 (logic) + PR `m7-lessons-ui` (UI) |
| M7.5 | **Trò chơi** F-01, F-02', F-03', F-04' + component tương tác dùng chung (ưu tiên, v7.2) | 🟢 | SCR-08 ✅ — PR #16 ✅ merge vào `m7-lessons` 2026-11-19 |
| M8 | Bàn phím ảo Thái + chấm gõ câu (G-06, E-07) | 🟢 | M5.5 ✅; song song M7 (owner chốt) |
| M9 | Bài tập: E-01..E-14, `/practice`, SRS cho câu (dùng lại component M7.5, ưu tiên mục "cần ôn") | 🟢 | M7, M7.5, M8 ✅, SCR-06 |
| M9.5 | **Phản hồi người học**: âm đúng/sai, giọng đọc, giao diện sinh động | 🟢 | M9 ✅; T9.5.3 ⏸ tạm loại (S13); T9.5.4 ✅ hướng B — PR #25 |
| M9.6 | **Trò chơi mở rộng** (Wordwall): +4 trò (Đập chuột, Đố vui truyền hình, Máy bay, Mê cung), theme, sao, "Đổi trò" | 🟢 | M9.5 ✅, SCR-08 v2 ✅ — PR #25 |
| M10 | Tổng quan + Sổ từ + Tiến độ (P-09..P-12, R1 v7) + hình & mẹo nhớ cho từ (V-02..V-04) | 🟢 | M9 ✅, SCR-03/07/09 ✅ (#26) — PR `m10-home` |
| ~~M10.5~~ | → chuyển lên M7.5 (v7.2) | — | — |
| M12 | Settings, export/import, PWA, E2E đủ, go-live | 🟢 CAT | M10 ✅; công bố chính thức cần owner B1, B4–B7, B9 + smoke test |
| M12.7 | **Responsive iPhone & iPad** (phản hồi CAT, plan 0.15) | 🟢 | SCR-00 v2 ✅ — PR #38 |

Phase 2 (M13–M24) và Phase 3 (M25–M27): xem mục 10 của plan. **Không làm cho tới khi Phase 1 xong.**

---

## 3. Chi tiết milestone đang mở

### TC — Hỗ trợ nội dung thật (plan 0.12) 🔵

- [x] TC.1 `/units` theo 0.12 #1: bộ lọc **"Giáo trình" / "Chuyên đề"** (theo `kind`), nhãn "Bài n" / "Chuyên đề n", sắp xếp Giáo trình → Chuyên đề; chi tiết unit + breadcrumb dùng cùng nhãn; cập nhật SCR-04 (câu chữ) + E2E/baseline. Kiểm tra `content:check` / `content:build` với unit `b02` (65 từ, 29 câu, 6 bài học) — sửa nếu có lỗi, **không** sửa nội dung Thái (báo Claude Desktop).
  - *Kết quả:* core `compareUnits` (theme → grammar → `order` → id) dùng ở `content:build`, `/units`, nguồn Trò chơi; nhãn `unitLabel` ("Bài n" / "Chuyên đề n") ở lộ trình, card Học tiếp, breadcrumb, tiêu đề bài, màn hoàn thành, `/games`. Bài con trong unit đổi thành **"Bài học n"** (tránh "Bài 2 · Bài 2"). `b02`: sửa YAML (ví dụ có dấu phẩy chưa bọc ngoặc kép), bỏ tiền tố "Bài 2 · " khỏi `title_vi` (UI tự thêm nhãn); mẫu `u03` → `kind: grammar` (= CĐ 3). SCR-04/05/08 cập nhật câu chữ; E2E 2 nhánh + mở Bài 2, axe `/units/b02`, `/units/b02/b02-l1`; baseline `units-*` mới.
- [x] TC.2a Xóa content mẫu `u01`, `u02` ngay (đã có `b01`, `b02` thật); chuyển test/E2E dùng `u01` sang `b01`/`b02`.
  - *Kết quả (2026-11-20, nhánh `m9.5-feedback`):* xóa `u01`, `u02` (2 unit, 2 bài học, 15 từ, 5 câu, 2 mẫu câu, 2 hội thoại); `content:check` 361 mục, 0 lỗi. E2E bài học học trọn **Chuyên đề 1** + bước Hội thoại **Bài 12**; Bài tập/Trò chơi dùng **Bài 1** thật. Chuyển sang nội dung thật lộ ra lỗi engine: **phương án nhiễu trùng đề** (Bài 1 có nhiều đại từ cùng nghĩa "tôi" → E-02 có 2 đáp án đúng; Đúng hay sai? có thể đề xuất nghĩa khác của cùng chữ làm "nghĩa sai") → đã sửa trong core + test.
- [x] TC.2b (2026-11-21, sau PR #31) xóa `u03`, `u11` (2 unit, 2 bài học, 17 từ, 36 câu, 1 mẫu câu mẫu cũ); E2E Đoán loại từ chuyển sang `c03`; baseline `/units` (27 bài & chuyên đề).
- [x] **TC.3 Rà soát & làm đầy đủ Bài 9 (`b09` Gọi món) và Bài 10 (`b10` Mua bán) — ƯU TIÊN, làm trước mọi việc khác** (owner 2026-11-21: người học đang học 2 bài này trên lớp). Hiện trạng (Claude Desktop kiểm tra trên `main`): b09 91 từ / 29 câu / 3 mẫu câu (đều ở bài học cuối) / 0 hội thoại; b10 118 từ / 20 câu / 1 mẫu câu / 0 hội thoại; **0 từ có hình**, 0 từ có ví dụ; bài học 1–9 (b09) và 1–12 (b10) **không có câu nào** → bước Bài tập và trò chơi theo bài chỉ có từ.
  1. Đọc lại `sources/บทที่ 9_…pdf` (39 tr) và `บทที่ 10_…pdf` (44 tr) **từng trang**, đối chiếu từng từ / nghĩa / chính tả; sửa sai; từ thẻ hình Claude tự ghi nghĩa → kiểm lại theo hình, từ nào không chắc ghi `note_vi: "cần GV xác nhận"`. Bổ sung phần trong PDF chưa nhập (nếu có).
  2. `image` (Noto Emoji, dạng `noto:<codepoint>` như content mẫu) cho mọi danh từ cụ thể có emoji phù hợp: món ăn, đồ uống, bát đĩa, trái cây, thịt/hải sản, rau, quần áo, phụ kiện — mục tiêu ≥ 70% danh từ cụ thể. Không có emoji đúng nghĩa thì để trống, **không** dùng emoji gần đúng gây hiểu sai.
  3. `classifier` cho danh từ đếm được (vd. món: จาน / ชาม / ถ้วย; đồ uống: แก้ว / ขวด / กระป๋อง; trái cây: ลูก / ผล; quần áo: ตัว; giày, tất: คู่; túi: ใบ) — để Đoán loại từ dùng được 2 bài này.
  4. Câu luyện: mỗi bài học **≥ 5 câu** (`vi`, `th`, `th_alt` ผม/ฉัน + ครับ/ค่ะ, `tokens` ≤ 9, 1 thẻ nhiễu) dùng đúng từ của bài học đó và mẫu câu của bài: gọi món (ขอ… / เอา… + loại từ, …หนึ่งที่, ไม่เผ็ด), hỏi giá (…เท่าไร, ราคา…บาท), mặc cả (ลดได้ไหม), hỏi cỡ/màu/loại (มีไซส์…ไหม, มีสีอื่นไหม), thanh toán (จ่ายด้วยบัตรได้ไหม, เก็บเงินด้วย).
  5. Hội thoại: b09 ≥ 2 (vào nhà hàng – gọi món; gọi đồ uống – tính tiền), b10 ≥ 3 (mua quần áo – thử đồ – trả giá; mua trái cây ở chợ; siêu thị – thanh toán – giao hàng), mỗi đoạn 6–8 lượt, gắn vào bài học tương ứng.
  6. Mẫu câu: rải về đúng bài học có liên quan (không dồn hết vào bài cuối); b10 thêm 3–5 mẫu câu thông dụng của chủ đề mua bán (ghi rõ "Claude soạn" trong `explain_vi` nếu không có trong PDF).
  7. `example_th` / `example_vi` cho ít nhất các từ khóa của mỗi bài học (≥ 3 từ / bài học).
  8. Toàn bộ giữ `draft: true`; `content:check` 0 lỗi; cập nhật `content/IMPORT-STATUS.md` (dòng b09, b10: những gì đã bổ sung, những gì cần GV xác nhận); baseline nếu đổi; tự merge theo 8.1 (loại nội dung).
  - *Kết quả (2026-11-21, nhánh `content-b09-b10`):* đọc lại 83 trang PDF. **b09:** 91 từ (40 có hình, 48 loại từ, 36 ví dụ), câu 29 → 77 (≥ 6 / bài học), mẫu câu 3 → 11 (rải từng bài học, 8 Claude soạn), 2 hội thoại 8 lượt; sửa nghĩa พุดดิ้ง, เหล้า, rút 2 câu > 9 thẻ. **b10:** 118 từ (43 có hình, 72 loại từ theo quy ước GV ở c03, 48 ví dụ), câu 20 → 80 (≥ 5 / bài học), mẫu câu 1 → 6 (5 Claude soạn), 4 hội thoại; bổ sung 5 nghĩa (กระโปรง, หมวก, เข็มขัด, ผักกาดฮ่องเต้, น้ำมันพืช). **Hình chưa đạt 70%** (b09 ~56%, b10 ~49% danh từ cụ thể): không có emoji đúng nghĩa (ผัดไทย, ส้มตำ, đu đủ, phần lớn rau, gia vị…) → để trống theo yêu cầu. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (108 câu, 6 hội thoại, 13 mẫu câu, ví dụ, loại từ), 12 từ ghi "cần GV xác nhận" (chi tiết `content/IMPORT-STATUS.md`); đồ uống / vài trái cây có nhiều loại từ → trò Đoán loại từ đôi khi có phương án nhiễu cũng đúng.

- [x] **TC.4 Làm đầy đủ các bài còn lại theo chuẩn TC.3** (owner 2026-11-23) — **xong 2026-11-23 (TC.4a–h):** mọi bài học của 27 unit ≥ 5 câu (trừ `b01-l1` cố ý, xem TC.4e), ví dụ từ ≥ 3 / bài học ở mọi bài học có từ; toàn bộ draft, chờ GV duyệt; PR #43–#47 + TC.4h merge theo thứ tự. 27/27 file đã nhập (draft) nhưng chỉ `b09`, `b10` đạt chuẩn TC.3. Hiện trạng trên `main` (Claude Desktop đếm 2026-11-23 — bài học < 5 câu / tổng bài học):

  | Unit | Bài học | Từ | Hình | Loại từ | Ví dụ từ | Câu | Bài học < 5 câu | Việc chính |
  |---|---|---|---|---|---|---|---|---|
  | `b11` | 8 | **0** | 0 | 0 | 0 | 67 | 2 | Rút **từ vựng** từ hội thoại (8–12 từ / bài học), câu bù cho bài thiếu |
  | `b12` | 7 | **0** | 0 | 0 | 0 | 59 | 0 | Rút **từ vựng** từ hội thoại (8–12 từ / bài học) |
  | `b08` | 8 | 77 | 0 | 0 | 0 | 19 | 7 | hình, loại từ, ví dụ, câu, 1–2 hội thoại (đặt phòng – nhận phòng – yêu cầu dịch vụ) |
  | `b07` | 10 | 101 | 0 | 0 | 0 | 24 | 8 | hình, loại từ, ví dụ, câu, 2 hội thoại (hỏi đường; đi taxi / xe buýt) |
  | `b06` | 9 | 88 | 0 | 0 | 0 | 52 | 5 | ví dụ, câu, 1 hội thoại (hẹn giờ) |
  | `b05` | 14 | 145 | 0 | 0 | 0 | 44 | 10 | ví dụ, câu, 1 hội thoại (ngày sinh / lịch hẹn) |
  | `b04` | 5 | 45 | 0 | 38 | 38 | 19 | 4 | hình, câu (đếm + so sánh), 1 hội thoại |
  | `b03` | 9 | 90 | 0 | 0 | 0 | 11 | 9 | ví dụ, câu (giá, số điện thoại, tuổi), 1 hội thoại |
  | `b02` | 6 | 65 | 0 | 0 | 0 | 29 | 2 | hình, ví dụ, câu, 1 hội thoại (chào – giới thiệu) |
  | `b01` | 7 | 71 | 0 | 0 | 0 | 11 | 6 | hình (người/gia đình), ví dụ, câu |
  | `c03` | 13 | 310 | 0 | 310 | 0 | **0** | 13 | câu "danh từ + số + loại từ" ≥ 5 / bài học, ví dụ từ |
  | `c06`, `c07` | 4, 5 | 66, 72 | — | — | 0 | **3, 3** | 4, 5 | câu ≥ 5 / bài học theo từng mẫu การ / ความ, ví dụ từ |
  | `c01`, `c09`, `c13` | 2, 3, 4 | 19, 32, 34 | — | — | 0 | 6, 13, 32 | 1 mỗi unit | câu bù, ví dụ từ |
  | `c02`, `c04`, `c05`, `c08`, `c10`–`c12`, `c14`, `c15` | | | | | | | 0 | chỉ thêm `example_th/vi` (≥ 3 / bài học) nếu thiếu — không cần thêm câu |

  **Chuẩn (giống TC.3):**
  1. Đọc lại PDF **từng trang**, đối chiếu từ / nghĩa / chính tả; nghĩa Claude ghi từ thẻ hình → kiểm lại theo hình, không chắc → `note_vi: "cần GV xác nhận"`.
  2. Giáo trình: `image` Noto cho danh từ cụ thể có emoji đúng nghĩa (mục tiêu ≥ 70%, không dùng emoji gần đúng); `classifier` cho danh từ đếm được. Chuyên đề: không cần hình.
  3. Mỗi bài học **≥ 5 câu** (`th_alt` ผม/ฉัน + ครับ/ค่ะ, `tokens` ≤ 9, 1 thẻ nhiễu), dùng đúng từ + mẫu câu của bài học đó; câu Claude soạn ghi `source: claude-<unit>`.
  4. `example_th`/`example_vi` ≥ 3 từ khóa / bài học.
  5. Giáo trình `b01`–`b08`: ≥ 1 hội thoại 6–8 lượt / unit (b07, b08: 2), gắn vào bài học liên quan. Mẫu câu rải đúng bài học; thiếu thì thêm mẫu thông dụng (ghi "Claude soạn" trong `explain_vi`).
  6. `b11`, `b12`: thêm từ vựng rút từ hội thoại (nghĩa theo ngữ cảnh lượt thoại, `example_th` = câu trong hội thoại).
  7. Giữ `draft: true`; `content:check` 0 lỗi; cập nhật dòng unit trong `content/IMPORT-STATUS.md` (đã bổ sung gì, cần GV xem gì); baseline nếu đổi.

  **Thứ tự** (theo lộ trình người học — đang ở Bài 9–10): **`b11` → `b12`** (bài sắp học) → **`b08` → `b01`** (ôn) → **`c03` → `c06` → `c07`** (thiếu câu nhiều nhất) → `c13` → `c09` → `c01` → các chuyên đề còn lại (chỉ ví dụ từ).
  **Cách làm:** mỗi PR 1–2 unit, nhánh `content-tc4-<unit>`, base `main`, **tự merge theo 8.1** (nội dung draft). Không chặn M12.8 — làm xen kẽ hoặc sau M12.8.
  - [x] TC.4a `b11`, `b12`
    - *Kết quả (2026-11-23, nhánh `content-tc4-b11-b12`):* đọc lại 42 trang PDF (chỉ có tiếng Việt) — 15 hội thoại / 126 câu khớp nguồn, không thấy lỗi rõ ràng nên không sửa. **Từ vựng rút từ hội thoại:** `b11` 0 → **76 từ** (8–11 / bài học), `b12` 0 → **63 từ** (8–10 / bài học); nghĩa theo lượt thoại, **139/139 có `example_th`/`example_vi`** = lượt thoại (rút gọn khi dài); `image` 6 từ (ตั๋ว 🎫, ธนาคาร 🏦, รถเมล์ 🚌, เตียง 🛏️, รถแท็กซี่ 🚕, โรงแรม 🏨 — hội thoại ít danh từ cụ thể, không có emoji đúng nghĩa cho chùa, chợ nổi, quán cà phê, thư viện, điều hòa… → để trống); `classifier` 20 từ (b11 12, b12 8); ưu tiên từ chưa có ở unit khác, chỉ lặp từ cốt lõi của bài (vd. จังหวัด, วัด, ธนาคาร, รถเมล์, โรงแรม). **Câu bù:** b11-l4 3 → 6, b11-l5 4 → 7 (`s-b11-071…076`, `claude-b11`, ผม/ฉัน + ครับ/ค่ะ, ≤ 9 thẻ, 1 thẻ nhiễu) → mọi bài học ≥ 5 câu. E2E `lessons.spec` (Hội thoại Bài 12): bài học 1 giờ có bước Từ vựng trước Hội thoại → sửa bước chờ đầu. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn; 5 từ `note_vi` "cần GV xác nhận" (ไปทำงาน = đi công tác, เรียกรถ, ห้องเตียงใหญ่, ห้องเตียงคู่, ห้องคู่) — **เตียงคู่**: khách sạn Thái thường hiểu là 2 giường đơn (twin), Bài 8 đang ghi "giường đôi".
  - [x] TC.4b `b08`, `b07`
    - *Kết quả (2026-11-23, nhánh `content-tc4-b08-b07`):* đọc lại 76 trang PDF — từ, mẫu câu, câu của GV khớp nguồn, không sửa. **b08:** 77 từ (17 có hình, 39 loại từ, 42 ví dụ), câu 19 → **59** (6–9 / bài học), mẫu câu 4 → 9 (5 Claude soạn, mỗi bài học ≥ 1), **2 hội thoại** (đặt – nhận phòng `b08-l6`; yêu cầu dịch vụ – trả phòng `b08-l8`). **b07:** 101 từ (29 có hình, 49 loại từ, 52 ví dụ), câu 24 → **77** (6–11 / bài học), mẫu câu 6 → 11 (5 Claude soạn, mỗi bài học ≥ 1), **2 hội thoại** (đi taxi `b07-l7`; hỏi đường `b07-l8`). **Hình chưa đạt 70%** (b08 ≈ 47%, b07 ≈ 61% danh từ thẻ hình) — không có emoji đúng nghĩa (khăn tắm, gối, hộ chiếu, sân bay, chùa, bảo tàng…) → để trống. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (93 câu, 10 mẫu câu, 4 hội thoại, 94 ví dụ, loại từ); `note_vi` “cần GV xác nhận”: **เตียงคู่** (hình p5 = giường đôi như GV ghi, nhưng khách sạn Thái thường hiểu = 2 giường đơn; xung đột với Bài 12 — chưa đổi nghĩa), รถราง, รถตู้ส่งของ (hình khác nghĩa chữ).
  - [x] TC.4c `b06`, `b05`
    - *Kết quả (2026-11-23, nhánh `content-tc4-b06-b05`):* đọc lại 111 trang PDF — từ, mẫu câu, câu luyện dịch khớp nguồn, không sửa nội dung GV (s-b05-037 chỉ gộp thẻ 10 → 9). **b06:** 88 từ (5 có hình, 3 loại từ, 53 ví dụ), câu 52 → **80** (7–13 / bài học), mẫu câu 8 → 15 (7 Claude soạn, mỗi bài học ≥ 1), **1 hội thoại** hẹn giờ (`b06-l8`). **b05:** 145 từ (2 có hình, 64 ví dụ), câu 44 → **95** (6–7 / bài học), mẫu câu 9 → 16 (7 Claude soạn, mỗi bài học ≥ 1), **1 hội thoại** ngày sinh – mời sinh nhật (`b05-l10`). Từ chỉ thời gian / ngày lễ trừu tượng → ít hình, không gán emoji gần đúng. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (79 câu, 14 mẫu câu, 2 hội thoại, 117 ví dụ); câu phụ thuộc năm hiện tại (ปีนี้ปีมะเมีย, ปีหน้าเป็นปีมะแม); loại từ ปฏิทิน để trống; các điểm cũ (b06 câu 16, b05 (1)–(6)) vẫn chờ.
  - [x] TC.4d `b04`, `b03`
    - *Kết quả (2026-11-23, nhánh `content-tc4-b04-b03`):* đọc lại 115 trang PDF — từ, mẫu câu, câu luyện dịch khớp nguồn, không sửa nội dung GV. **b04:** 45 từ (29 có hình ≈ 69% danh từ — còn lại không có emoji đúng nghĩa, 43 loại từ, 45 ví dụ), câu 19 → **46** (7–18 / bài học, +5 câu so sánh), mẫu câu 6 → 9 (3 Claude soạn, mỗi bài học ≥ 1), **1 hội thoại** mua văn phòng phẩm – đếm, so sánh (`b04-l4`). **b03:** 90 từ (3 có hình, 2 loại từ, 65 ví dụ), câu 11 → **62** (6–8 / bài học: giá, số điện thoại, tuổi, số nhà, phần trăm, phép tính), mẫu câu 12 → 18 (6 Claude soạn, mỗi bài học ≥ 1), **1 hội thoại** hỏi tuổi – số điện thoại (`b03-l9`). **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (78 câu, 9 mẫu câu, 2 hội thoại, 72 ví dụ); cách đọc số điện thoại; các điểm cũ (b04 (1)–(4), b03 (1)–(3)) vẫn chờ.
  - [x] TC.4e `b02`, `b01`
    - *Kết quả (2026-11-23, nhánh `content-tc4-b02-b01`):* đọc lại 46 trang PDF — từ, mẫu câu, câu luyện dịch khớp nguồn; chỉ sửa chính tả ghi chú กู (“xuồng xã” → “suồng sã”) và gộp thẻ s-b01-007 (12 → 8). **b02:** 65 từ (4 có hình — chỉ 6 danh từ cụ thể, không có emoji đúng cho bạn / công ty / trường đại học / kỹ sư; 9 loại từ, 61 ví dụ), câu 29 → **56** (8–11 / bài học), mẫu câu 2 → 7 (5 Claude soạn, mỗi bài học ≥ 1), **1 hội thoại** chào – tên – quê – nghề (`b02-l6`). **b01:** 71 từ (17 có hình ≈ 70% danh từ cụ thể, 21 loại từ, 66 ví dụ), câu 11 → **40** (l2–l7: 6–7 / bài học), mẫu câu 5 → 9 (4 Claude soạn), **1 hội thoại** giới thiệu gia đình (`b01-l3`). **`b01-l1` cố ý chưa có câu / mẫu câu:** E2E `practice.spec`, `golive.spec` học bài này và chờ “xong” sau bước Từ vựng — thêm câu cần sửa 3 E2E (đề xuất làm riêng nếu owner muốn). Bài 1 có loại từ → mở trò Đoán loại từ; E2E `games.spec` ca “khóa” chuyển sang `c01`. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (56 câu, 9 mẫu câu, 2 hội thoại, 127 ví dụ); câu thân mật นายจะไปไหน (không ครับ/ค่ะ).
  - [x] TC.4f `c03`
    - *Kết quả (2026-11-23, nhánh `content-tc4-c03`):* đọc lại 13 trang PDF (bảng 2 cột, cột loại từ để trống) — 310 từ / nghĩa khớp nguồn, không sửa; giữ nguyên 310 loại từ. **Câu 0 → 96** (7–8 / bài học, `claude-c03`, ผม/ฉัน + ครับ/ค่ะ, ≤ 9 thẻ, thẻ nhiễu = loại từ sai) dùng đúng danh từ của từng bài học: số + loại từ, นี้/นั้น, กี่ + loại từ, loại từ + tính từ / màu. **Ví dụ từ** 87 (6–8 / bài học). **Mẫu câu** 1 → 4 (3 Claude soạn: g-c03-nee, g-c03-kee, g-c03-adj) → mỗi bài học có mẫu câu. E2E: không ca nào dựa vào c03 0 câu (`games.spec` chỉ dùng c03 cho Đoán loại từ; ca “Xếp câu tốc độ khóa” chỉ có ở unit test với dữ liệu giả `u03`) → không sửa; baseline `/units` có thể đổi (thẻ c03 “96 câu”). **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (96 câu, 3 mẫu câu, 87 ví dụ); loại từ có cách nói khẩu ngữ khác (หลอดไฟ ดวง / หลอด, เทียน เล่ม / แท่ง, สลากกินแบ่ง ฉบับ / ใบ, ช้าง เชือก / ตัว, แปรงสีฟัน อัน / ด้าม, ยา ขนาน — viên thuốc nói เม็ด) — thẻ nhiễu đã tránh các loại từ này; บันได อัน vẫn chờ GV.
  - [x] TC.4g `c06`, `c07`
    - *Kết quả (2026-11-23, nhánh `content-tc4-c06-c07`):* đọc lại 11 trang PDF (scan) — 138 từ / nghĩa khớp nguồn, không sửa; s-c07-003 gộp thẻ 13 → 9. **c06:** câu 3 → **31** (7–10 / bài học, `claude-c06`): การ + động từ hành động / tình cảm, การ + danh từ (การบ้าน, การเมือง…), hậu tố (โครงการ, กรรมการ, กิจการ); ví dụ 19. **c07:** câu 3 → **37** (7–9 / bài học, `claude-c07`): ความ một mình (ชนะความ, ย่อความ), ความ + động từ tâm lý / tính từ, ความ + danh từ (ความแพ่ง, ความอาญา), ความ + phủ định; ví dụ 24. Thẻ nhiễu = đổi การ ↔ ความ (có thẻ không phải từ chuẩn, cố ý, như c08). Mỗi bài học đã có mẫu câu → không thêm. E2E không có ca nào dựa vào c06/c07 → không sửa. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (62 câu, 43 ví dụ); ความเมือง chưa đặt câu (từ cổ); câu pháp lý ความแพ่ง / ความอาญา, ชนะความ; câu การ + động từ tình cảm có thẻ nhiễu ความ… cũng là từ thật (phân biệt theo nghĩa).
  - [x] TC.4h `c13`, `c09`, `c01` + ví dụ từ cho các chuyên đề còn lại
    - *Kết quả (2026-11-23, nhánh `content-tc4-c13-c09-c01`):* đọc lại 12 trang PDF (scan) — c13, c09, c01 khớp nguồn, không sửa nội dung GV (gộp thẻ s-c13-027, s-c13-029 → ≤ 9; c01 “ไอ – ยู” vẫn chờ GV). **Câu +32** (`claude-<unit>`): c13 32 → **40** (l2 3 → 8, l1 5 → 8), c09 13 → **27** (8–10 / bài học), c01 6 → **16** (l1 9, **l2 0 → 7** xưng hô với nhà sư; câu thân mật không ครับ/ค่ะ) → mọi bài học của 3 chuyên đề ≥ 7 câu. **Ví dụ từ 120:** c13 22, c09 15, c01 10, c02 15, c04 5, c05 14, c10 12, c11 11, c12 10, c14 6 (≥ 3 / bài học; trừ `c13-l4` chỉ 2 từ, `c04-l2` và `c08` không có từ; c15 đã đủ). E2E `lessons.spec` học trọn c01: l2 có thêm bước Bài tập — đã kiểm bộ giải (không trùng `vi`, không câu điền chỗ trống trùng mẫu, không thẻ lặp); không đổi id cũ, không bỏ từ. **GV xác nhận:** toàn bộ tiếng Thái Claude soạn (32 câu, 120 ví dụ); cách nói với sư (นิมนต์, กราบ, ดิฉัน/หนู); สีกา (p3) chưa thêm; ถูกชะตา ví dụ dịch “hợp duyên”.


### M0 — Khung dự án 🟢

**Mục tiêu:** repo chạy được, có đủ khung test & CI/CD, deploy được trang trống lên Azure SWA.

**Task**
- [x] T0.0 Git: nếu thư mục chưa là repo → `git init -b main`, `git remote add origin https://github.com/DoMinhChien/hoc-thai-cung-nom.git`; commit tài liệu hiện có lên `main` (commit đầu tiên, `docs: initial plan`), sau đó làm M0 trên nhánh `m0-scaffold`.
- [x] T0.1 Khởi tạo monorepo pnpm: `apps/web` (Vite + React + TS strict), `packages/core`, `scripts/`, `tools/pdf-pipeline/` (chỉ README, Python làm ở M4).
- [x] T0.2 Tailwind + shadcn/ui; file token tạm `apps/web/src/styles/tokens.css` (màu trung tính + 1 accent placeholder, chờ `tokens.json` từ M0.5a).
- [x] T0.3 React Router với các route rỗng của Phase 1 (mục 9 plan) + layout desktop (sidebar + vùng nội dung) + `<AppLogo />` đọc `public/brand/logo.svg` (placeholder chữ "Nôm").
- [x] T0.4 Font self-host: Inter (hoặc Be Vietnam Pro) + Noto Sans Thai; trang `/dev/typography` hiển thị mẫu chữ Thái có dấu chồng để kiểm tra.
- [x] T0.5 i18n: `apps/web/src/i18n/vi.ts` + helper `t()`.
- [x] T0.6 Test: Vitest + React Testing Library + `fake-indexeddb`; Playwright (Chromium/Firefox/WebKit, viewport 1280×800 & 1024×768) + `@axe-core/playwright`; 1 test mẫu mỗi loại.
- [x] T0.7 Firebase Auth Emulator: `firebase.json`, script `pnpm emulators`; Playwright tự khởi động emulator (chưa dùng ở M0, chỉ sẵn sàng).
- [x] T0.8 Mock `AudioProvider` + interface (mục 7.2 plan), chưa cần implement thật.
- [x] T0.9 ESLint + Prettier + `pnpm typecheck`; script `pnpm content:check` (tạm thời no-op, có thật ở M3).
- [x] T0.10 GitHub Actions: lint → typecheck → test → e2e → build → deploy SWA (dùng workflow SWA sinh ra ở bước S2). PR → preview environment.
  - ✅ `.github/workflows/ci.yml` chạy xanh trên PR #1 (check, e2e, deploy); preview https://ashy-tree-0524a9b03-1.westeurope.6.azurestaticapps.net. Production deploy khi merge `main`.
- [x] T0.11 `.gitignore`, `.env.example` (liệt kê `VITE_FIREBASE_*`, `VITE_USE_AUTH_EMULATOR`), `README.md` ngắn; cập nhật bảng lệnh trong `AGENTS.md`.
- [x] T0.12 `staticwebapp.config.json`: SPA fallback.

**Tiêu chí nghiệm thu**
- `pnpm install && pnpm dev` mở được app, điều hướng qua các route rỗng.
- Tất cả lệnh trong `AGENTS.md` mục 10 chạy được và pass.
- PR tạo preview URL trên Azure SWA; merge `main` deploy production.
- Trang `/dev/typography` hiển thị chữ Thái không bị cắt dấu ở 3 trình duyệt.

### M0.5a — Thiết kế tối thiểu cho đăng nhập 🟢

**Thực hiện:** Claude (design) + owner duyệt. Theo mục 7.6.2 plan.

- [x] D0.1 `docs/design/brief.md` (đối tượng, định hướng tối giản D1–D10, tham khảo).
- [x] D0.2 `docs/design/flows.md`: sitemap Phase 1 + luồng đăng nhập / Guest / chuyển tiến độ / xóa tài khoản (Mermaid).
- [x] D0.3 `tokens.json` cơ bản: màu trung tính, accent, 5 màu thanh, 3 sắc độ mức thuộc, font, spacing, radius.
- [x] D0.4 Screen spec: `SCR-00-layout.md` (khung chung, header, sidebar), `SCR-01-login.md`, `SCR-02-account.md` (kèm `/privacy`, `/terms`, `/account/delete-instructions`).
- [x] D0.5 Wireframe trắng đen 3 màn trên (Figma) → xuất PNG vào `docs/design/screens/`.
- [x] D0.6 Owner duyệt → ghi ngày duyệt vào `docs/design/README.md`.

---

### TD — Dọn dẹp sau M0.5a 🟢
- [x] TD.1 Thư mục `docs/design/` (brief, flows, tokens.json, 3 spec, 7 PNG) đang **chưa commit** trên working tree. Tạo nhánh `m0.5a-design` (từ `main` nếu PR #1 đã merge, nếu chưa thì từ `m0-scaffold`), commit `docs(design): M0.5a brief, flows, tokens, SCR-00/01/02 + wireframes`, push, mở PR. Cập nhật `ROADMAP.md` cùng PR.
- [x] TD.2 Thay token tạm `apps/web/src/styles/tokens.css` bằng giá trị từ `docs/design/tokens.json` (accent chàm `#3F4AA8`, màu thanh, mức thuộc…) — giữ tên biến theo nghĩa; cập nhật visual baseline nếu đổi. *(Có thể gộp vào đầu M1.)*

### M2 — Core: schema, normalize, Tone Engine 🟢

**Requirement:** plan mục **5.5** (schema), **5.6** (validator), **6** (Tone Engine), **G-06** phần chuẩn hoá Unicode. Logic thuần trong `packages/core`, không phụ thuộc UI.

**Task** (chi tiết hóa 2026-11-15 — owner xem lại trong PR)
- [x] T2.0 Hạ tầng `packages/core`: thêm `zod` (v4), `@vitest/coverage-v8` với ngưỡng ≥ 90% cho `tone/` + `thai/normalize`; ESLint chặn import `react`/`react-dom` trong `packages/core` (lib không có DOM sẵn từ M0).
- [x] T2.1 Zod schema (`packages/core/src/schema/`), theo plan 5.5:
  - enum dùng chung: `Tone` (mid/low/falling/high/rising), `ToneMark` (ek/tho/tri/chattawa), `ConsonantClass` (mid/high/low), `id` ascii kebab, `image` (`noto:<hex>` hoặc `img/…`), `mnemonic_vi`, `draft` (mặc định `false`).
  - `Consonant`, `Vowel` (dạng có placeholder `–`, ngắn/dài), `ToneMarkEntry`, `ToneEntry`, `SyllableAnalysis` (tone-drills), `WordRow` (CSV: tách `|` / `;`, `syllables` và `tones` cùng độ dài), `Deck`, `Reading` (level 1–5), `MinimalPair` (2–4 từ, thanh khác nhau).
  - Test: mẫu hợp lệ trong plan 5.5 parse được; từng lỗi (id sai, thiếu trường, độ dài lệch, thanh/level ngoài miền) bị bắt. Dữ liệu test chỉ là mẫu tối thiểu từ plan.
- [x] T2.2 JSON Schema từ Zod (`z.toJSONSchema`, dạng input) → `packages/core/json-schema/*.schema.json` qua `pnpm --filter @nom/core schema:export`; test kiểm tra file đã commit khớp schema hiện tại (CI bắt quên export).
- [x] T2.3 `normalizeThai()` (`packages/core/src/thai/normalize.ts`, phần chuẩn hóa của G-06): NFC; bỏ ký tự vô hình (ZWSP, ZWJ, ZWNJ, BOM); `ํ` + (dấu thanh) + `า` → (dấu thanh) + `ำ`; sắp xếp lại cụm dấu sau mỗi phụ âm: nguyên âm trên/dưới → dấu thanh → `์`. Idempotent. Chấm điểm gõ (diff) **để M8**.
- [x] T2.4 Tone Engine (`packages/core/src/tone/`): `consonantClass(char)` (44 phụ âm, 6.1); `computeTone(syllable)` → `{ ok: true, tone, steps }` | `{ ok: false, error, steps }`; `steps` = 4 bước A-21 (lớp — có xét ห นำ/อ นำ, sống/chết — kèm lý do, dấu thanh, kết quả) để Tone Trainer (A-22) so từng bước. Lỗi: ô "—" của bảng 6.3, ห/อ นำ không hợp lệ, phụ âm không có.
- [x] T2.5 Unit test Tone Engine: mỗi ô bảng 6.3 ≥ 2 case (gồm 4 ô "—" → lỗi), ห นำ, อ นำ (4 từ), nguyên âm ngắn + âm cuối vang (วัน), âm cuối tắc với nguyên âm dài; đủ 44 phụ âm đúng lớp. Coverage ≥ 90%.

**Tiêu chí nghiệm thu**
- `pnpm test` pass, coverage `packages/core` ≥ 90% cho tone engine & normalize.
- Không có import React / DOM trong `packages/core`.

### M3 — Content pipeline TS + content mẫu 🟢

**Requirement:** plan **5.4** (thư mục content), **5.5** (schema — đã có ở M2), **5.6** (validator), bước 5 của **5.3** (`content:check --input staging/...`). Học theo cách tổ chức loader/export/validate của **LibreLingo** (7.5). **Cần owner:** duyệt content mẫu `draft: true` (S10).

**Task** (chi tiết hóa 2026-11-15 — owner xem lại trong PR)
- [x] T3.1 Loader `scripts/content/load.ts`: đọc YAML (`yaml`) + CSV (`csv-parse`) theo cấu trúc 5.4, chuẩn hóa chữ Thái bằng `normalizeThai`, parse bằng schema M2; lỗi kèm **file + dòng/vị trí + trường**.
- [x] T3.2 `pnpm content:check` thật (5.6): schema; id duy nhất (theo loại); `deck` tồn tại; `syllables`/`tones` cùng độ dài; `computeTone()` khớp `expected_tone` (tone-drills); lớp phụ âm trong consonants.yaml khớp `consonantClass()`; **cảnh báo**: ký tự ngoài U+0E00–U+0E7F trong trường Thái, từ trong bài đọc chưa có trong lexicon (tách bằng `|` / `Intl.Segmenter`), mục `draft: true`. Lỗi → exit 1; cảnh báo → exit 0.
- [x] T3.3 `--input <file|thư mục>` để validate file staging của pipeline Python (M4); output JSON tùy chọn (`--json`) cho Python đọc.
- [x] T3.4 `pnpm content:build` → `apps/web/public/content/*.json` (hoặc module import) + `manifest.json` có hash; build web chạy `content:build` trước.
- [x] T3.5 Content mẫu **tối thiểu, `draft: true`** (AGENTS mục 4): vài phụ âm (đủ 3 lớp), vài nguyên âm, 4 dấu thanh, 5 thanh, ~5 tone-drills, 1 deck ~5 từ, 1 bài đọc ngắn, 1 cặp tối thiểu — **chỉ để chạy pipeline; owner thay/duyệt (S10)**.
- [x] T3.6 Test: fixture hợp lệ/không hợp lệ cho từng quy tắc 5.6 (thông báo lỗi có file/dòng), `--input`, `--json`, build idempotent; CI chạy `content:check` (đã có).

**Tiêu chí nghiệm thu**
- `pnpm content:check` pass trên content mẫu; mỗi loại lỗi trong 5.6 có fixture làm fail với thông báo chỉ rõ file/dòng/trường.
- `pnpm content:build` sinh JSON ổn định (chạy 2 lần không đổi); web build dùng được.
- Content mẫu đều `draft: true`, owner đã xem (S10). ✅ Owner cho đóng M3 2026-11-16.

### M5 — Data layer + SRS + progress components 🟢

**Requirement:** plan **7.3** (data layer), **B-04** (FSRS `ts-fsrs`, 4 nút), **4.9** (định nghĩa mức thuộc + yêu cầu kỹ thuật progress), **L-07** (DB theo `uid`/`guest` — đã có từ M1), 7.4 (unit SRS/selectors với đồng hồ giả lập; component test với `fake-indexeddb`). Màn hình dùng các phần này làm ở M6+.

**Task** (chi tiết hóa 2026-11-16 — owner xem lại trong PR)
- [x] T5.1 Schema IndexedDB đầy đủ theo 7.3 (`cards`, `reviewLogs`, `listeningStats`, `sessions`, `settings`, `meta`): mọi record có UUID + `updatedAt`; `schemaVersion` trong `meta`; khung migration Dexie (`version(n).upgrade`) + test nâng cấp từ DB v1 của M1 không mất dữ liệu.
- [x] T5.2 `packages/core`: type record + **interface** `ProgressRepository`, `ReviewRepository`, `SettingsRepository`, `SessionRepository` (không phụ thuộc Dexie) + bản in-memory cho test.
- [x] T5.3 `apps/web/src/data`: bản Dexie của 4 repository, mở DB theo người dùng hiện tại (`uid`/`guest`, nối với `AccountDataRepository` của M1); test với `fake-indexeddb`.
- [x] T5.4 SRS wrapper `packages/core/srs` trên `ts-fsrs`: tạo card, `review(card, rating, now)` → card mới + log, danh sách đến hạn, thẻ mới/ngày (B-03, mặc định 10); test bằng đồng hồ giả lập.
- [x] T5.5 `packages/core/progress`: `masteryLevel(card)` theo bảng 4.9 (ngưỡng 21 ngày cấu hình được) + selector thuần: đếm 4 mức theo module/deck, % hoàn thành, tỉ lệ đúng theo quy tắc thanh (P-03), theo 5 thanh (P-07); unit test.
- [x] T5.6 Hook React đọc dữ liệu realtime (Dexie `liveQuery`) cho cards/selectors; component test cập nhật sau một lượt ôn.
- [x] T5.7 Component dùng chung `apps/web/src/components/progress/`: `ProgressRing`, `StackedProgressBar`, `MasteryGrid`, `HeatmapTable`, `ToneBarChart` — màu chỉ từ token (`mastery-*`, `tone-*`), có nhãn/ký hiệu ngoài màu (người mù màu), component test + axe; trang `/dev/progress` để xem. ✅ Owner duyệt 2026-11-16, kèm 2 sửa đã làm: thanh hiển thị bằng component SVG `ToneContour`/`ToneTag` (D10, dùng chung mọi nơi — thay ký hiệu Chao), heatmap tách ô Thấp × Chết thành **ngắn → high** / **dài → falling** (cột nhóm, ô có contour thanh kết quả).

**Tiêu chí nghiệm thu**
- Component không truy cập Dexie trực tiếp — chỉ qua repository/hook.
- DB của M1 nâng cấp lên schema mới không mất dữ liệu; chuyển tiến độ Guest → user (L-07) vẫn đúng với store mới.
- SRS và selector có unit test với thời gian giả lập; coverage `packages/core` srs/progress ≥ 90%.
- Component progress không có lỗi axe serious/critical; phân biệt được mức/thanh không chỉ bằng màu.

### M2.1 — Bổ sung quy tắc Tone Engine 🟢

**Bối cảnh:** owner review content mẫu 2026-11-16 phát hiện 2 lỗ hổng spec (không phải lỗi code): thiếu quy tắc **อักษรนำ tổng quát** và mô hình sai **ไ– ใ– –ำ เ–า** (đang ghi `long` để lách quy tắc). Spec mới: plan **6.1, 6.2, 6.3 (test bổ sung), 5.5** (ví dụ `sawat-2`).

**Task**
- [x] T2.1.1 Schema syllable analysis: `leading` nhận **mọi phụ âm cao/trung** (không chỉ ห/อ); thêm `tone_override?: boolean`, `note?: string`; xuất lại JSON Schema.
- [x] T2.1.2 Tone Engine: áp lớp của phụ âm dẫn cho âm tiết sau (อักษรนำ); `steps` ghi rõ bước "phụ âm dẫn X → tính theo lớp Y" (để Tone Trainer giải thích).
- [x] T2.1.3 Nguyên âm có âm cuối sẵn: vowel content có `inherent_final: y|m|w`; engine coi ไ/ใ/ำ/เา là ngắn + âm cuối vang → sống.
- [x] T2.1.4 Validator (`content:check`): **cảnh báo** khi âm tiết dùng ไ/ใ/ำ/เา mà ghi `vowel_length: long` hoặc thiếu `final_sound`; bỏ qua khi `tone_override: true`.
- [x] T2.1.5 Sửa content mẫu: `tone-drills.yaml` (ไม่, ไม้ → short + y; thêm วัส của สวัสดี, ใหม่, ไหม, ทำ, เขา, ขนม/นม), `vowels.yaml` (thêm ไ– ใ– –ำ เ–า với `inherent_final`). Vẫn `draft: true`.
- [x] T2.1.6 Test bổ sung đúng danh sách plan 6.3 (สวัสดี, สนุก, ขนม, ตลาด, อร่อย, ไม่, ใหม่, ไหม, ทำ, เขา); giữ coverage ≥ 90%.

**Tiêu chí nghiệm thu**
- Toàn bộ test plan 6.3 (cũ + bổ sung) pass; `content:check` content mẫu không lỗi, không còn âm tiết ไ/ใ ghi `long`.
- `steps` của วัส trong สวัสดี có bước giải thích phụ âm dẫn ส.
- ✅ Kết quả: bước `class` của วัส = `{ value: high, reason: leading, leading: ส, ownClass: low }`; ไ/ใ/ำ/เา cho bước `liveness` lý do `inherent-final`; `content:check` 43 mục, 0 lỗi, không cảnh báo plan 6.2; coverage core 100% lines.

### M5.5 — Dọn phạm vi v7 🟢

**Requirement:** plan **mục 0.2** (danh sách bỏ), **0.7** (nav), **0.9** (schema tùy chọn). Không thêm tính năng mới.

**Cần trước:** M2.1 ✅. Spec: `docs/design/screens/SCR-00-layout.md`, `SCR-01-login.md` (đã sửa v7), `brief.md`.

**Task**
- [x] T5.5.1 Nav + routes theo SCR-00 v7: "Tổng quan · Bài học · Bài tập · Sổ từ · Trò chơi · Tiến độ · Cài đặt"; route `/units`, `/practice`, `/words` là trang trống "Sắp có"; gỡ `/alphabet`, `/tones`, `/review`, `/vocab`, `/reading`, `/listening` (nếu đã có), redirect cũ → mới.
- [x] T5.5.2 Xóa `MasteryGrid`, `HeatmapTable`, `ToneBarChart`, `ToneContour`, `ToneTag` + test/visual baseline; xóa phần tương ứng trên `/dev/progress`; xóa selector chỉ phục vụ chúng (theo quy tắc/thanh) trong `packages/core/progress`. Giữ `ProgressRing`, `StackedProgressBar`.
- [x] T5.5.3 Xóa `color.tone` trong `docs/design/tokens.json` và mọi nơi sinh/dùng token đó (CSS vars, Tailwind).
- [x] T5.5.4 `/login`: thẻ ví dụ từ vựng + câu chữ mới theo SCR-01 v7; cập nhật baseline.
- [x] T5.5.5 Schema core: `syllables`/`tones` của Word → tùy chọn; `content:check` không bắt buộc thanh; xóa content mẫu chữ cái/thanh (`consonants`, `vowels`, `tone-*`, `tones`, `minimal-pairs`, `readings`); xuất lại JSON Schema.
- [x] T5.5.6 Tone Engine đóng băng: thêm ghi chú trong README của `packages/core/tone`; ESLint `no-restricted-imports` cấm `apps/web` import module tone.
- [x] T5.5.7 E2E luồng 0 + axe + baseline cập nhật; CI xanh.

**Tiêu chí nghiệm thu**
- Không còn chữ "Bảng chữ cái", "Thanh điệu", "Ôn tập", "Nghe" trên UI; nav khớp SCR-00 v7.
- Không còn file/import của 5 component đã xóa; `grep -ri tone apps/web/src` chỉ còn kết quả không liên quan (hoặc rỗng).
- `pnpm test`, `pnpm e2e`, `content:check` pass.
- ✅ Kết quả: nav 7 mục đúng thứ tự SCR-00 v7 (test); URL cũ `/alphabet`, `/tones`, `/vocab*`, `/reading*` → `/units`, `/review`, `/listening` → `/practice`; `grep -ri tone apps/web/src` chỉ còn redirect `/tones` và `Notice.tone` (cảnh báo/lỗi Login, không liên quan); ESLint chặn import Tone Engine (đã thử); `content:check` 6 mục, 0 lỗi; E2E 162/162 local (win32), baseline mới `/login` + `/dev/progress` (owner xem).

### M6.1 — Content model theo tài liệu giáo viên 🟢

**Requirement:** plan **0.11** (quyết định 2–6, 8), 0.9 (cột mới). Không có UI.

**Cần trước:** M6 ✅. PDF mẫu ở `sources/` (gitignored) — **chỉ đọc để hiểu bố cục**, không chép nội dung vào repo ngoài vài dòng content mẫu `draft: true`.

**Task**
- [x] T6.1.1 Schema: `Unit.kind` (`theme`|`grammar`, mặc định `theme`), `Unit.level` thêm `B1`; `Word.classifier`, `Word.thai_alt` (`|`), `Word.note_vi`; `meaning_vi` và `Sentence.th` cho phép rỗng **chỉ khi** `draft: true`; xuất lại JSON Schema; unit test.
- [x] T6.1.2 `content:check`: `classifier`/`thai_alt` chỉ chứa chữ Thái; lỗi khi item không draft thiếu `meaning_vi`/`th`; cảnh báo "thiếu nghĩa", "thiếu đáp án", "tokens tự tách — cần duyệt"; unit `grammar` không áp cảnh báo 8–12 từ/bài (thay bằng cảnh báo > 40 từ/bài).
- [x] T6.1.3 `content:build`: `tokens` rỗng → tách bằng `Intl.Segmenter('th')`, ghi cờ `auto_tokens`; bundle unit có `kind`, `level`; lesson có `steps` = các bước có dữ liệu (`vocab`, `grammar`, `dialogue`, `exercise`).
- [x] T6.1.4 `content/templates/`: cột mới + README thêm mục **"Ánh xạ tài liệu Plern-Pin"** (bảng loại từ → `words.csv` + `classifier`; danh sách น่า → `grammar.yaml` + `words.csv`; "Bài tập vận dụng" → `sentences.csv` với `vi`, `th` trống, `draft: true`).
- [x] T6.1.5 Content mẫu: thêm **Unit 3 "Loại từ"** (`theme`) và **Unit 11 "Các trường hợp của น่า"** (`grammar`), mỗi unit ≤ 5 từ + ≤ 3 câu, gồm 1 từ thiếu nghĩa và 1 câu thiếu `th` (draft) để chạy đủ kiểm tra; `source` theo 0.11 #8.

**Tiêu chí nghiệm thu**
- `content:check` báo lỗi khi bỏ `draft` ở item thiếu nghĩa/đáp án; cảnh báo đúng loại khi còn draft.
- Build ổn định 2 lần cùng hash; bundle có `kind`, `steps`.
- Coverage core giữ nguyên; CI pass.

**Kết quả (2026-11-17):** schema + JSON Schema v7.1; `content:check` 48 mục, 0 lỗi, 18 cảnh báo (1 từ thiếu nghĩa, 3 câu thiếu đáp án, 2 câu tokens tự tách — đúng thiết kế); `content:build` thêm `unit-u03.json`, `unit-u11.json`, `steps` (u11 `grammar`: Mẫu câu → Từ vựng → Bài tập), chạy lại "không đổi". Tests: core 258 (coverage lines 100%), scripts 72, web 156. Content mẫu lấy vài dòng từ trang 1/4 của 2 PDF; 2 câu (s-u03-001, bản dịch s-u11-017) do agent soạn — cần duyệt.

### M8 — Bàn phím ảo Thái + chấm gõ câu 🟢

**Requirement:** plan **G-06** (bàn phím ảo Kedmanee ẩn/hiện, click + phím vật lý, nhận bàn phím Thái của hệ điều hành, chuẩn hóa, chấm đúng / sai dấu thanh / sai chữ + diff), **0.5 E-07** (đáp án chấp nhận `th` + `th_alt`, bỏ khoảng trắng, ครับ/ค่ะ/คะ tùy chọn), **E-12** (diff khi sai), 7.4 (luồng E2E 4), 7.5 (Kedmanee TIS 820-2538, `simple-keyboard`).

**Cần trước:** M5.5 ✅ (`normalizeThai` có từ M2). Mở song song khi M7 chờ SCR-04/05. **Chưa có screen spec** cho ô gõ/bàn phím → làm như M5: component dùng tokens + trang mẫu `/dev/typing` (dữ liệu giả lập), owner xem baseline; màn thật (bài tập E-07) ở M9 theo SCR-06.

**Task**
- [x] T8.1 Layout **Kedmanee TIS 820-2538** trong `packages/core` (`KeyboardEvent.code` → ký tự thường/Shift, 4 hàng) + `kedmaneeChar(code, shift)`. Unit test: đủ phụ âm ก–ฮ, nguyên âm, dấu thanh, chữ số Thái; không ký tự nào trùng.
- [x] T8.2 Chấm gõ câu `gradeThaiTyping(input, accepted)` trong core: chuẩn hóa (`normalizeThai`, bỏ khoảng trắng + dấu câu, ครับ/ค่ะ/คะ tùy chọn cuối mỗi cụm), kết quả `correct` / `tone` (chỉ sai dấu thanh) / `wrong`, diff theo cụm ký tự (grapheme) với đáp án gần nhất; `acceptedAnswers(sentence)` = `th` + `th_alt`. Unit test gồm gõ dấu thanh trước nguyên âm trên, `ํ`+`า`.
- [x] T8.3 Web `ThaiKeyboard` (`simple-keyboard`, layout từ core, Shift/Caps, nút `<button>`, bấm không làm mất focus ô nhập, CSS theo tokens) + `ThaiTextInput` (chèn tại con trỏ, phím vật lý ra chữ Latin → map Kedmanee, bàn phím Thái của hệ điều hành/IME giữ nguyên, nút ẩn/hiện bàn phím). Component test.
- [x] T8.4 Web `TypingFeedback`: kết quả đúng / sai dấu thanh / sai chữ + diff (thiếu/thừa) + đáp án đúng, `lang="th"`. Component test.
- [x] T8.5 `/dev/typing` (trang mẫu, câu mẫu draft của content) + E2E luồng 4 plan 7.4 (bàn phím ảo, dấu thanh trước nguyên âm trên → đúng; phím vật lý map Kedmanee) + axe + screenshot baseline.

**Tiêu chí nghiệm thu**
- Gõ `พ` `่` `ี` (dấu thanh trước nguyên âm trên) hay `ค` `ํ` `า` vẫn chấm **đúng**; sai mỗi dấu thanh → **sai dấu thanh**; còn lại → **sai chữ** kèm diff.
- Câu có `th_alt` / thiếu hoặc thừa ครับ/ค่ะ/คะ / khác khoảng trắng → vẫn đúng.
- Bàn phím ảo bấm bằng chuột không mất con trỏ; chưa cài bàn phím Thái vẫn gõ được bằng phím vật lý; đã cài thì nhận nguyên.
- Logic thuần trong core, coverage 100% lines; không lỗi axe serious/critical; baseline `/dev/typing` owner đã xem.

**Kết quả (2026-11-17):** core `KEDMANEE_ROWS`/`kedmaneeChar`, `gradeThaiTyping`/`diffThai`/`acceptedAnswers`; web `ThaiKeyboard` (`simple-keyboard` 3.8.205, theme `hg-theme-nom` chỉ dùng tokens — không nạp CSS mặc định), `ThaiTextInput`, `TypingFeedback`, `/dev/typing`. Tests: core 280 (coverage lines 100%), scripts 72, web 166; E2E `typing.spec.ts` + axe `/dev/typing` xanh 3 trình duyệt × 2 viewport; baseline Windows `dev-typing-*-win32.png` (Linux do CI sinh). Ghi chú: ครับ/ค่ะ/คะ tùy chọn ở cuối mỗi cụm của đáp án (gõ liền vẫn nhận); dấu câu ASCII/ngoặc kép bị bỏ khi chấm (giữ ฯ ๆ).

### M7.5 — Trò chơi 🟢 (ưu tiên, v7.2)

**Requirement:** plan **0.6** (F-01, F-02', F-03', F-04'; F-10 sửa v7.2), **F-11..F-14**, **P-09** (kỷ lục), 7.2 (audio), 7.4. Spec **`docs/design/screens/SCR-08-games.md`** + 5 wireframe `SCR-08-*.png`.

**Cần trước:** M7 T7.1–T7.3 ✅ (content client, tiến độ, audio). SCR-08 ✅ duyệt 2026-11-18.

**Task**
- [x] T7.5.1 Core: interface `Game` (`generateRound(source, seed)`, `answer`, `score`, `summary`) + `GameSource` (mục đã học ∪ từ/câu của unit đã chọn, bỏ draft thiếu nghĩa/đáp án; kiểm tra đủ dữ liệu từng trò) + RNG có seed. Record `GameResultRecord` (kỷ lục theo trò + nguồn) và cờ `needsReview` theo item; Dexie migration + `ProgressRepository` (contract test). **Không** gọi `recordReview` (F-12) — test khẳng định.
- [x] T7.5.2 Core: 4 trò — `matchPairs` (6 cặp, điểm theo thời gian + lượt lật), `trueFalse` (50% nghĩa đúng, combo ×1..×5, 60 s), `sentenceRush` (5 câu, `tokens` không thẻ nhiễu, 20 s/câu), `classifierRush` (đáp án + 3 loại từ khác có trong dữ liệu, 5 s/từ, thưởng tốc độ). Đồng hồ là tham số (test bằng đồng hồ giả). Unit test.
- [x] T7.5.3 Web component tương tác **dùng chung (M9 dùng lại)**: `ChoiceButton` (phím số), `TokenChip`/`TokenBank`, `FeedbackBar` (icon + chữ), `GameTopBar` (đồng hồ, điểm, combo), hook `useCountdown` (tạm dừng khi tab ẩn), âm phản hồi bật/tắt (F-13), tôn trọng `prefers-reduced-motion`. Component test.
- [x] T7.5.3b **Khu Trò chơi sinh động (owner chốt phương án B, plan 7.6.1 v7.3)**: token `color.game.*` (Ghép cặp tím `#7C3AED`, Đúng hay sai? cam `#C2410C`, Xếp câu tốc độ xanh ngọc `#0F766E`, Đoán loại từ hồng `#BE185D`; tương phản ≥ 4.5:1) trong `tokens.json` + `tokens.css`, utility `bg-game`/`text-game`/`bg-game-subtle` theo `data-game` (ngoài khu Trò chơi = accent); chuyển động phản hồi (`animate-shake`/`pop`/`rise`/`enter`/`urgent`, `CountIn` 3·2·1) — tắt khi reduced-motion; trang mẫu `/dev/play`.
- [x] T7.5.3c **Cơ chế kiểu Memrise Speed Review (owner chọn "cả gói", v7.3)**: core `rapidGame` — Đúng hay sai? + Đoán loại từ chơi **3 tim** (giờ mỗi câu `questionTimeMs` 5–9 s theo độ dài, sai/hết giờ mất tim, 15 đúng liền +1 tim tối đa 5, điểm = 100 × combo + tốc độ 0..50), `setNeedsReview` (bật/tắt "cần ôn" từng mục); web `UrgencyCard` (nền ngả đỏ dần), tim trên `GameTopBar`, `useAutoSpeech`/`useSpeakOnCue` (tự đọc qua `AudioProvider`, cài đặt `gameAutoSpeak`), `ReviewList`; **Xếp câu tốc độ: sau mỗi câu (đúng hay sai) đọc cả câu đúng** rồi mới sang câu (`useFeedbackPause`, góp ý owner); `/dev/play` cập nhật. SCR-08 + plan 0.6 sửa theo.
- [x] T7.5.3d **Đổi font Thái → Sarabun (owner yêu cầu 2026-11-18, plan v7.4 G-05/D8)**: thay `@fontsource-variable/noto-sans-thai` bằng `@fontsource/sarabun` (subset `thai`, weight 400/500/600, self-host); `tokens.css` theo `docs/design/tokens.json` (đã sửa); `index.css` comment; kiểm tra dấu trên/dưới không bị cắt ở mọi cỡ `th-*` (line-height 1.75), thẻ từ ≥ 48px; cập nhật toàn bộ visual baseline; ghi chú trong `docs/design/README.md`.
- [x] T7.5.4 `/games` theo SCR-08 §A: chọn nguồn, 4 card (kỷ lục, khóa khi thiếu dữ liệu + lý do), phím `1`–`4`; **mỗi card màu của trò** (`data-game`).
- [x] T7.5.5 `/games/:id` 4 màn chơi + màn kết quả theo SCR-08 §B–C (màu + chuyển động của trò, **hiệu ứng mạnh hơn khi phá kỷ lục** — không confetti; kỷ lục mới, mục sai → `needsReview`, "Chơi với mục sai").
- [x] T7.5.7 **Content mẫu loại từ cho Unit 3** (Claude Desktop soạn 2026-11-19, `draft: true`, giáo viên duyệt sau — S10): điền `classifier` cho 5 từ hiện có — ตุ๊กตา **ตัว**, ถุงเท้า **คู่**, รองเท้า **คู่**, ตะเกียบ **คู่**, ช้อน **คัน** (giữ ช้อน thiếu nghĩa để test cảnh báo) — và thêm 7 từ từ `sources/03-loai-tu.pdf` vào `u03-l1` (tổng 12, không vượt cảnh báo 8–12 từ/bài): ร่ม (ô, dù) **คัน** · แก้ว (cốc, ly) **ใบ** · จาน (đĩa) **ใบ** · หนังสือ (sách) **เล่ม** · ปากกา (bút bi) **ด้าม** · รถ (xe) **คัน** · ไข่ (trứng) **ฟอง**; `source = plernpin-03#p<trang>`. Kết quả: 11 từ dùng được (≥ 8) với 7 loại từ khác nhau → Đoán loại từ mở khóa. Sửa test/fixture phụ thuộc số từ Unit 3 nếu có.
- [x] T7.5.6 E2E: Đúng hay sai? với seed cố định → điểm + kỷ lục lưu, hết 3 tim → kết quả, bỏ "cần ôn" một mục; Đoán loại từ trên Unit 3 mẫu; khẳng định lịch FSRS không đổi; axe; baseline `/games` + 1 màn chơi.

**Tiêu chí nghiệm thu**
- Chơi được 4 trò hoàn toàn bằng bàn phím trên content mẫu (Unit 1–3, 11); trò thiếu dữ liệu bị khóa có lý do.
- Kỷ lục theo trò + nguồn đúng sau reload; mục sai có cờ "cần ôn".
- Không thẻ SRS nào đổi `due`/`stability` sau khi chơi.
- Coverage core giữ nguyên; CI pass.

**Kết quả (2026-11-19):** core `games/` (`Game`, `rapidGame` 3 tim, 4 trò, nguồn F-10 v7.2, `subsetSource`, `saveGameResult`/`setNeedsReview` — không đụng FSRS), Dexie v4 (`gameResults`, `needsReview`); web `components/interactive` (dùng lại ở M9), `/games`, `/games/:id` (Focus layout), token `color.game.*`, font Sarabun. Content mẫu Unit 3: 12 từ, 11 có loại từ (7 loại). Tests: core 328 (coverage lines 100%), scripts 73, web 251; E2E 201 pass + 3 chập chờn (popup Auth Emulator, chạy lại pass) trên 3 trình duyệt × 2 viewport. Tiêu chí "chơi được 4 trò trên content mẫu": 3/4 — **Xếp câu tốc độ khóa đúng có lý do** vì chưa chuyên đề nào có ≥ 5 câu có thẻ từ (đã test bằng content giả); cần owner thêm câu mẫu. Baseline mới: `games-*`, `game-match-*`, `typography-*` (Windows đã commit; Linux do CI sinh).

### M7 — Bài học 🟢

**Requirement:** plan **0.4** (bài học 4 bước, mở khóa mềm, checklist can-do), **0.7** (`/units`, `/units/:unitId`, `/units/:unitId/:lessonId`), **0.8** (P-10 `UnitPath`, P-11 `CanDoList`, P-04 theo unit), **7.2** (AudioProvider), **B-03/B-04** (từ mới vào SRS), **C-02/C-03/C-04/C-06/C-07** (tra từ, toggle bản dịch, phát câu trong bước Hội thoại), 7.3–7.4.

**Cần trước:** M6 ✅, M6.1 ✅. **SCR-04, SCR-05 ✅ owner duyệt 2026-11-19** (`docs/design/screens/`). Dùng lại component tương tác của M7.5 (bước Bài tập trong bài học) và font Sarabun.

**Task**
- [x] T7.1 Types bundle content (`UnitSummary`, `UnitBundle`, `BuiltLesson` + `steps`, `BuiltSentence` + `auto_tokens`, `Manifest`) chuyển từ `scripts/content/build.ts` vào `packages/core` (web và script dùng chung) + content client trong `apps/web` (`fetch` `manifest.json` → `units.json` / `unit-<id>.json`, cache theo `manifest.version`, validate bằng Zod) + hook `useUnits()`, `useUnit(id)`. Unit test (fetch giả).
- [x] T7.2 Tiến độ bài học: record `LessonProgressRecord` (bước đã xong 1–4, điểm bài tập, hoàn thành khi ≥ 80%) + `CanDoRecord` (tick tay); Dexie store mới + migration `schemaVersion`; `ProgressRepository` mở rộng (Dexie + memory, contract test); selector core: trạng thái unit chưa học/đang học/xong (P-10), can-do tự tick khi mọi bài xong (P-11), % theo unit (P-04). `ITEM_TYPES` thêm `sentence` (chuẩn bị M9).
- [x] T7.3 `WebSpeechProvider` (`th-TH`) + ưu tiên file `audio/<id>` khi câu có `audio`; không có giọng Thái → trạng thái để UI hướng dẫn cài. Unit test với mock `speechSynthesis`/`Audio`.
- [x] T7.4 `/units` lộ trình theo **chuyên đề giáo viên** (thứ tự `order`, nhãn `level` + `kind`; plan 0.11 #1), `UnitPath` + `ProgressRing` mỗi unit (SCR-04).
- [x] T7.5 `/units/:unitId`: danh sách bài, `CanDoList`, từ vựng của unit (SCR-04).
- [x] T7.6 `/units/:unitId/:lessonId` focus layout, stepper theo `lesson.steps` (bỏ qua bước không có dữ liệu, plan 0.11 #3), mở khóa mềm: Từ vựng (flashcard Thái → Việt, phiên âm ẩn, từ mới vào SRS), Mẫu câu, Hội thoại (tra từ panel phải, toggle bản dịch, phát câu), Bài tập (khung + chấm ≥ 80% — loại bài tập thật ở M9) (SCR-05).
- [x] T7.7 E2E luồng học 1 bài (Unit 1 mẫu) + axe + screenshot baseline 3 route mới.

**Tiêu chí nghiệm thu**
- Web đọc được `units.json`/`unit-*.json` do M6 sinh; đổi content → `manifest.version` đổi → client tải lại.
- Học xong 4 bước một bài (bài tập ≥ 80%) → bài "hoàn thành"; mọi bài xong → unit "xong", can-do tự tick; dữ liệu qua repository (Dexie), không `localStorage`.
- Từ mới ở bước Từ vựng có thẻ FSRS; bước Hội thoại tra từ được.
- Audio luôn qua `AudioProvider`; test dùng mock.
- Không lỗi axe serious/critical; baseline mới owner đã xem.

**Kết quả (2026-11-19):** core `continueTarget`/`resumeStep` (Học tiếp, bước dở dang), `buildLessonQuiz`/`checkLessonAnswer` (bước Bài tập ở M7: chọn nghĩa + xếp câu, dùng component M7.5; loại đầy đủ ở M9); web `UnitsPage` (lọc `?kind=`, `↑↓` + Enter), `UnitPage` (can-do tick tay / tự tick, từ vựng + mức thuộc, chi tiết từ), `LessonPage` (Focus layout, stepper mở khóa mềm `[` `]`, Từ vựng thẻ/danh sách → `introduceCard` mỗi từ một lần, Mẫu câu, Hội thoại tách từ `Intl.Segmenter` + panel tra từ + bản dịch `T` (nhớ lựa chọn) + phát cả đoạn, Bài tập ≥ 80% → `completeLessonStep`, màn hoàn thành), banner thiếu giọng Thái + hướng dẫn cài; `ProgressRing` nhận nội dung giữa vòng. Tests: core 333 (coverage lines 100%), web 260; E2E `lessons.spec.ts` (luồng học trọn Bài 1 Unit 1 → xong chuyên đề, thẻ SRS được tạo) + axe 3 route + baseline `units`/`unit`/`lesson`; E2E đầy đủ 225 pass + 1 chập chờn (Auth Emulator). Lệch spec có chủ đích: chi tiết từ ở `/units/:unitId` mở rộng tại chỗ thay popover (chưa có component popover); tự đọc khi lật thẻ dùng chung cài đặt `gameAutoSpeak`.

### M6 — Content model v7 🟢

**Requirement:** plan **mục 0.9** (mẫu nhập liệu), 0.3 (16 chủ đề, cấp A1/A2), 0.4 (cấu trúc bài học: 8–12 từ, 1–2 mẫu câu, 4–8 câu thoại), 0.5 (E-04, E-06, E-07 cần `tokens`, `distractors`, `th_alt`), 5.4–5.6 (loader/validator/build — giữ cách làm M3).

**Cần trước:** M5.5 ✅. Không có UI → không cần screen spec. Nội dung thật: owner/giáo viên (S10); agent chỉ tạo content mẫu tối thiểu `draft: true`.

**Bố cục `content/` mới** (khớp `content/templates/`): `units.csv`, `lessons.csv`, `words.csv`, `sentences.csv`, `grammar.yaml`, `dialogues.yaml`. File cũ `vocab/decks.yaml` + `vocab/words.csv` (deck) chuyển sang mẫu mới rồi xóa.

**Task**
- [x] T6.1 Schema Zod (`packages/core/src/schema/`): `Unit` (`unit_id`, `level` A1/A2, `order`, `title_vi`, `title_th`, `can_do` tách `|`), `Lesson` (`grammar_ids` tách `|`), `Word` v7 (`unit_id`, `lesson_id`, `phonetic` tùy chọn, không còn `syllables`/`tones`/`deck`), `Sentence` (`th_alt`, `tokens`, `distractors` tách `|`, `grammar_id`, `audio`), `Grammar` (`pattern`, `explain_vi`, `examples[{th, vi}]`), `Dialogue` (`lines[{speaker, th, vi}]`); `draft`. Xóa `Deck`, `WordRow` cũ, `Reading`, `MinimalPair` khỏi export (schema chữ cái giữ cho Tone Engine đóng băng). Unit test + xuất JSON Schema.
- [x] T6.2 `content/templates/`: 4 CSV (chỉ header + 1 dòng ví dụ) + 2 YAML có chú thích từng trường + `README.md` hướng dẫn giáo viên (mở bằng Excel/Google Sheets, UTF-8, ký tự `|`/`;`, cách đặt id). Test: header template khớp schema.
- [x] T6.3 Loader v7 (`scripts/content/load.ts`): đọc 6 file mới, lỗi kèm file:dòng:cột [trường]; `--input` nhận diện loại theo tên (`words.<nguồn>.csv`, `sentences.<nguồn>.csv`…) cho M4.
- [x] T6.4 `content:check` v7: id duy nhất theo loại; khóa ngoại (`lesson.unit_id`, `word.unit_id/lesson_id`, `sentence.grammar_id`, `lesson.grammar_ids`, `dialogue.lesson_id`, `grammar.unit_id`); `tokens` ghép lại = `th` (sau `normalizeThai`, bỏ khoảng trắng); `distractors` không trùng `tokens`; `th_alt` khác `th`; ký tự ngoài bảng Thái ở trường Thái. Cảnh báo: lesson ngoài 8–12 từ, unit ngoài 3–4 bài, câu thoại ngoài 4–8, `draft: true`. Bỏ kiểm tra tone-drills/lexicon bài đọc.
- [x] T6.5 `content:build` v7: `units.json` (lộ trình: unit + lesson + số từ/câu) + `unit-<id>.json` (lesson, words, sentences, grammar, dialogues của unit) + `manifest.json` (hash, idempotent); xóa output cũ (consonants, tones, readings…).
- [x] T6.6 Content mẫu **Unit 1 (A1 Chào hỏi) + Unit 2 (A1 Gia đình)**, mỗi unit 1 lesson, tối thiểu đủ chạy mọi kiểm tra (vài từ, vài câu có `tokens`/`distractors`, 1 grammar, 1 dialogue), tất cả `draft: true` — owner/giáo viên thay (S10).
- [x] T6.7 Tài liệu: AGENTS.md mục 10 (lệnh content), plan 5.4 trỏ sang 0.9, SETUP-OWNER S10 (dùng `content/templates/`).

**Tiêu chí nghiệm thu**
- Mở `content/templates/*.csv` bằng Excel ra đúng cột của plan 0.9; điền theo mẫu → `pnpm content:check --input <file>` báo lỗi đúng dòng/cột.
- `content:check` bắt được: khóa ngoại sai, `tokens` không ghép ra `th`, id trùng.
- `content:build` sinh `units.json` + `unit-*.json` ổn định (chạy 2 lần cùng hash); content mẫu 0 lỗi.
- Coverage core 100% lines giữ nguyên; `pnpm test`, `content:check`, CI pass.

**Kết quả (2026-11-17):** schema v7 + JSON Schema 6 file (`packages/core/json-schema/`); `content/` mới 6 file, content mẫu Unit 1–2 (`draft`, 28 mục, 0 lỗi, 9 cảnh báo); `content/templates/` + README giáo viên; `content:build` → `units.json`, `unit-u01.json`, `unit-u02.json`, `manifest.json` (chạy lại: "không đổi"). Tests: core 253 (coverage lines 100%), scripts 64, web 156.

### ~~M6 cũ — Bảng chữ cái + Tone Trainer~~ ⛔ Hủy 2026-11-16 (v7)
T6.1–T6.9 cũ bị hủy, chưa có code. M6 mới = Content model v7 (chi tiết ở trên).

## 4. Milestone kế tiếp (chuẩn bị sẵn)

### M1 — Đăng nhập Google 🟢

> **Phạm vi đã đổi (2026-11-15):** chỉ Google + Guest. Facebook, liên kết tài khoản (L-04) và dialog D3 → **Phase 2, M12.5**. Nút Facebook ẩn sau flag `VITE_ENABLE_FACEBOOK_LOGIN=false`. Viết `AuthService` provider-agnostic để Phase 2 chỉ cần thêm provider.

**Cần trước:** M0 🟢, M0.5a 🟢, SETUP **S4 ✅, S5 ✅, S7 ✅, S12 ✅**. Requirement: **L-01, L-02, L-03, L-05..L-10** (L-04 → Phase 2), mục 4.0 plan.

**Task**
- [x] T1.1 `packages/core` (hoặc `apps/web/src/auth`): interface `AuthService` **provider-agnostic** (`signIn(provider)`, danh sách provider bật theo config) + `FirebaseAuthService` (popup, Phase 1 chỉ Google), `onUserChanged`, `updateDisplayName`, `deleteAccount`, `link/unlink`.
- [x] T1.2 Kết nối Auth Emulator khi `VITE_USE_AUTH_EMULATOR=true`.
- [x] T1.3 `/login` theo SCR-01: nút Google, "Học không cần đăng nhập"; nút Facebook render chỉ khi `VITE_ENABLE_FACEBOOK_LOGIN=true` (Phase 1 = false).
- [x] T1.4 Lần đầu đăng nhập: hộp thoại xác nhận **tên hiển thị** (L-03).
- [x] ~~T1.5 Liên kết tài khoản cùng email (L-04)~~ → **dời sang Phase 2 (M12.5)**.
- [x] T1.6 Header avatar + tên + menu (L-06); giữ phiên (L-05); offline vẫn vào được (L-09).
- [x] T1.7 IndexedDB đặt tên theo `uid` / `guest`; hộp thoại "Chuyển tiến độ hiện tại vào tài khoản này?" (L-07).
- [x] T1.8 `/account` theo SCR-02: đổi tên, khối "Phương thức đăng nhập" **chỉ hiển thị Google (không có nút liên kết/huỷ ở Phase 1)**, xóa tài khoản (đăng nhập lại nếu cần) + xóa IndexedDB (L-08).
- [x] T1.9 Trang `/privacy`, `/terms`, `/account/delete-instructions` (nội dung bản nháp theo SCR-02 mục B, email liên hệ `dominhchien206@gmail.com`, owner duyệt).
- [x] T1.10 E2E **luồng 0** (mục 7.4 plan) trên Auth Emulator; unit test `AuthService` (mock).

**Tiêu chí nghiệm thu**
- Đăng nhập **Google** chạy trên **emulator** (CI) và **thật** trên production (owner smoke test bằng tài khoản trong Test users).
- Không có nút Facebook khi flag = false.
- Guest → đăng nhập → chuyển tiến độ → đăng xuất → đăng nhập lại: dữ liệu đúng như luồng 0.
- Xóa tài khoản: user biến mất ở Firebase, IndexedDB của user bị xóa.
- Không component nào import trực tiếp `firebase/auth`.
- ✅ Owner smoke test Google thật trên production 2026-11-16.

### M9 — Bài tập 🟢 (mở 2026-11-20, xong 2026-11-20)

**Requirement:** plan **0.5** (E-01..E-14, E-10..E-13), 0.8 (P-05), G-06. Spec **`docs/design/screens/SCR-06-practice.md` ✅ owner duyệt 2026-11-20** + 4 wireframe `SCR-06-*.png`. Dùng lại component tương tác M7.5 (`ChoiceButton`, `TokenBank`, `FeedbackBar`, `GameTopBar`, `useCountdown`) + M8 (`ThaiTextInput`, `ThaiKeyboard`, `TypingFeedback`, `gradeThaiTyping`) + cờ "cần ôn" của trò chơi (ưu tiên trong Bài tập hôm nay). Bước Bài tập trong bài học (M7, `buildLessonQuiz`) chuyển sang cùng engine.

**Cần trước:** M7 ✅, M7.5 ✅, M8 ✅, SCR-06 ✅ (2026-11-20).

**Quyết định kỹ thuật (agent, theo plan 0.5 + SCR-06):**
- Thẻ câu: `itemType: 'sentence'`, `cardType: 'vi-th'` (một thẻ/câu, vào SRS khi làm bài tập lần đầu); thẻ từ giữ `th-vi`.
- Bậc dịch E-11 lưu riêng theo câu (`sentenceLevels`: bậc 2–4 + chuỗi đúng); lượt trả lời lưu `exerciseAttempts` (loại bài, item, unit, đúng/sai, rating, câu trả lời) — nguồn cho "câu sai 7 ngày", "Đúng {n}%" 30 ngày, P-12 sau này. Dexie v5.
- Chấm FSRS **chỉ lần trả lời đầu** của item trong phiên (Good / Hard = gợi ý hoặc sai dấu / Again = sai, bỏ qua); hỏi lại cuối phiên không chấm. E-03/E-09 chấm từng item theo số lần ghép sai.
- E-09 lấy cặp câu liên tiếp trong `dialogues` (dòng kết thúc bằng `?`/ไหม/หรือ… → dòng kế tiếp); không đủ cặp → bỏ loại này.

**Task**
- [x] T9.1 Core `exercises/`: interface `Exercise` (`generate(item, ctx)`, `check(question, answer)`, `grade(attempt)` → `SrsRating`), 10 loại E-01..E-09, E-14 (lựa chọn nhiễu cùng unit, RNG có seed; câu draft thiếu `th` bị loại; E-07 dùng `gradeThaiTyping` + `acceptedAnswers`, gợi ý = từ đầu; E-14 chọn/gõ). Unit test từng loại.
- [x] T9.2 Core: bậc dịch E-11 (`nextLevel`, chọn loại câu hỏi theo bậc: 2 → E-05/E-04, 3 → E-06 có thẻ nhiễu, 4 → E-07), record `SentenceLevelRecord` + `ExerciseAttemptRecord`, Dexie v5 + repository (contract test, chuyển dữ liệu Guest → tài khoản).
- [x] T9.3 Core: dựng phiên E-10 `buildPracticeSession` — "hôm nay" (thẻ đến hạn từ + câu, ưu tiên "cần ôn" + sai gần đây, thiếu thì bù mục đã học chưa có thẻ; mặc định 20 = cài đặt `practiceSessionSize`), "câu sai 7 ngày", "theo unit" (10 câu), lọc "Kiểu bài" (Tất cả / Từ vựng / Dịch câu / Gõ chữ Thái), bỏ E-08 khi không có giọng Thái; `recordPracticeAnswer` (FSRS lần đầu + attempt + bậc dịch + gỡ cờ "cần ôn" khi đúng); thống kê trang (đến hạn, câu sai 7 ngày, đúng % 30 ngày theo unit, đã xong hôm nay). Unit test với đồng hồ giả.
- [x] T9.4 Web `/practice/session` (Focus layout) theo SCR-06 §B–C: khung (thanh tiến độ, x/y, ✓), 10 renderer câu hỏi dùng `ChoiceButton`/`TokenBank`/`FeedbackBar`/`ThaiTextInput`/`ThaiKeyboard`/`TypingFeedback`, Bỏ qua `S`, gợi ý `H`, nghe lại `R`, hỏi lại câu sai cuối phiên, dialog thoát, màn kết quả (3 số, câu sai + diff, Luyện lại câu sai / Về Bài tập / Làm thêm 10 câu). Component test.
- [x] T9.5 Web `/practice` theo SCR-06 §A: card "Bài tập hôm nay" (đến hạn, phút ước tính, mục tiêu ngày), "Luyện câu sai" (`W`), "Kiểu bài" (nhớ lựa chọn), "Luyện theo chuyên đề" + `?unit=`; trạng thái chưa học / đã xong hôm nay; **badge số câu đến hạn** ở sidebar.
- [x] T9.6 Bước Bài tập của bài học (SCR-05) chạy cùng engine (phiên của bài, ≥ 80% → hoàn thành; thay `buildLessonQuiz`), câu của bài vào SRS.
- [x] T9.7 E2E: phiên "hôm nay" làm bằng bàn phím trên content đã build (đúng → Good, sai → hỏi lại, kết quả), E-07 gõ có sai dấu → Hard, thẻ câu được tạo + `due` đổi, Trò chơi vẫn không đổi FSRS; axe `/practice`, `/practice/session`; baseline `/practice` + 1 câu E-06.

**Tiêu chí nghiệm thu**
- Làm trọn "Bài tập hôm nay" chỉ bằng bàn phím; mọi loại E-01..E-09, E-14 hiển thị đúng khi có dữ liệu, loại thiếu dữ liệu tự bỏ.
- FSRS chỉ đổi theo lần trả lời đầu; câu lên/xuống bậc đúng E-11 sau reload.
- Mục "cần ôn" từ Trò chơi được ưu tiên vào phiên hôm nay.
- Coverage core giữ 100% dòng; CI pass; axe sạch.

**Kết quả (2026-11-20):**
- **Core** `exercises/`:
  - `Exercise` + 10 loại câu hỏi, `exercisePool` (cặp hỏi ↔ đáp lấy từ hội thoại).
  - Chấm: `checkAnswer` / `gradeAttempt` / `gradeMatchItem`.
  - Bậc dịch E-11 (`nextLevel`, `updateSentenceLevel`).
  - `buildPracticeSession` (hôm nay / câu sai / unit / bài / danh sách), `recordPracticeAnswer`, `practiceOverview`, `byDifficulty`.
- **Dữ liệu:** Dexie v5 thêm `sentenceLevels`, `exerciseAttempts`; chuyển dữ liệu Guest → tài khoản.
- **Web:**
  - `/practice`: hôm nay, câu sai, Kiểu bài, theo chuyên đề, badge sidebar.
  - `/practice/session`: Focus layout; ghi kết quả tuần tự, màn kết quả chỉ hiện sau khi ghi xong.
  - Bước Bài tập của bài học chạy cùng engine; bỏ `buildLessonQuiz` của M7.
- **Lỗi tìm ra khi làm E2E (đã sửa):**
  - Radio "Kiểu bài" nhảy về giá trị cũ khi bấm (ghi cài đặt bất đồng bộ).
  - "Luyện lại câu sai" về đúng URL hiện tại không mở phiên mới.
  - Câu cuối trả lời lại được trong lúc chờ ghi kết quả.
  - Skeleton có `aria-label` mà không có role (axe).
- **Test:**
  - Unit: core 374 (lines 100%), scripts 74, web 278.
  - E2E local: practice + lessons 42/42; a11y + navigation + games 180/180.
  - Baseline mới: `practice-*`, `practice-arrange-*`.
- **Đổi hành vi cần owner biết:**
  - Badge Bài tập ở sidebar đọc DB của tài khoản ngay khi vào trang, nên DB có thể được tạo (rỗng). Test đăng nhập đổi sang kiểm tra "không chuyển thẻ".
  - Settings chưa có ô chỉnh "số câu mỗi phiên"; khóa `practiceSessionSize` đã có, mặc định 20, UI ở M12.

### M9.5 — Phản hồi người học 🟢 (mở 2026-11-20, xong 2026-11-21, plan 0.13; T9.5.3 ⏸ tạm loại)

**Nguồn:** feedback người học sau khi dùng Bài học / Bài tập / Trò chơi (owner chuyển, 2026-11-20). Claude Desktop đã review code hiện tại:
- Âm đúng/sai **đã có** (`webAudioTone`, F-13) nhưng chỉ là tiếng bíp 0,12 s, âm lượng 0,08 (rất nhỏ); **Bài tập chỉ phát khi đúng** (`PracticeRunner`: `if (ok) sound.play(true)`) — sai không có âm.
- Giọng đọc: `WebSpeechProvider` lấy **giọng Thái đầu tiên** của máy (`voices[0]`) — trên Windows thường là giọng nam trầm; không ưu tiên giọng tự nhiên (Edge "… Online (Natural)", Chrome "Google ไทย"), không có chọn giọng / nghe thử.
- Giao diện: ngoài khu Trò chơi (v7.3), toàn app vẫn theo định hướng tối giản 7.6.1 → người học thấy đơn điệu.

**Task**
- [x] T9.5.1 **Âm phản hồi rõ ràng, ở mọi nơi chấm đúng/sai.** Thay bíp bằng âm dễ chịu, dễ phân biệt: **đúng** = 2–3 nốt đi lên (chime, ~0,3 s), **sai** = 2 nốt đi xuống mềm (không chói, ~0,3 s), **hoàn thành** (xong phiên/bài/lượt chơi, phá kỷ lục) = đoạn ngắn ~0,8 s. Ưu tiên file âm thanh **CC0** (ghi nguồn + giấy phép trong `apps/web/public/sounds/LICENSE.md`), fallback Web Audio. Âm lượng mặc định ~0,4 + thanh **Âm lượng** trong Cài đặt (0 = tắt), mặc định **bật**. Phát ở: phiên Bài tập (**cả khi sai** — sửa lỗi hiện tại), bước Bài tập của bài học, 4 trò chơi, màn kết quả. Không phát chồng lên giọng đọc (phát âm phản hồi trước, đọc sau ~150 ms). Unit test (player giả) + E2E spy.
- [x] T9.5.2 **Giọng đọc dễ nghe hơn (làm ngay, không cần tài khoản).** Xếp hạng giọng Thái: (1) tên chứa `Natural`/`Online`/`Neural` (Edge: *Premwadee*, *Niwat*), (2) `Google ไทย`, (3) giọng nữ, (4) còn lại; mặc định `rate` 0,95, `pitch` 1,05. Cài đặt **Giọng đọc**: danh sách giọng Thái có trên máy + nút **Nghe thử** (câu mẫu `สวัสดีค่ะ ยินดีที่ได้รู้จัก`) + tốc độ (0,7–1,2), lưu theo user. Nếu chỉ có giọng hệ thống kém: dòng gợi ý "Dùng Microsoft Edge để có giọng đọc tự nhiên". Test với danh sách giọng giả.
- [ ] T9.5.3 ⏸ **Tạm loại khỏi phạm vi (owner 2026-11-21)** — không chặn M9.5; làm lại khi owner bật lại + xong S13. **Giọng đọc chất lượng cao, giống nhau trên mọi máy (cần SETUP S13).** Sinh sẵn mp3 bằng **Azure AI Speech** giọng neural nữ `th-TH-PremwadeeNeural` (dự phòng `th-TH-AcharaNeural`): script `pnpm audio:build` (đọc `content/`, sinh cho từ, câu, ví dụ mẫu câu, lượt thoại; cache theo hash văn bản + giọng; chỉ sinh phần mới), mp3 mono 24–32 kbps → `content/audio/<hash>.mp3` (commit; ước tính < 30 MB cho toàn bộ giáo trình), `content:build` gắn đường dẫn audio; `AudioProvider` đã ưu tiên file (T7.3), fallback Web Speech. Key chỉ ở `.env.local` (không commit, không gửi chat). Chi phí: gói **F0 miễn phí** (0,5 triệu ký tự/tháng) đủ cho toàn bộ nội dung. Đưa S-01 từ Phase 2 lên Phase 1.
  - *Chi tiết (agent chốt 2026-11-21):* mp3 sinh **một lần trên máy owner** (lệnh đọc `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` từ biến môi trường), app không gọi Azure lúc chạy → **CI và web không cần key**. Tên file = hash(văn bản + giọng) → câu trùng không sinh hai lần, sửa câu chỉ sinh lại câu đó; lần chạy sau gần như không tốn ký tự.
  - Phạm vi: `words.thai`, `sentences.th`, `grammar.examples[].th`, `dialogues.lines[].th`. Câu chưa có mp3 vẫn đọc bằng Web Speech (giọng + tốc độ trong Cài đặt T9.5.2).
  - `content:check` thêm **cảnh báo** mục chưa có audio → mỗi lần Claude Desktop nhập bài mới, owner chạy lại `pnpm audio:build` rồi commit mp3.
  - Budget alert $5 / $20 (S3) phòng trường hợp lỡ dùng gói trả phí. "Tắt mạng vẫn phát" chỉ đạt khi có PWA cache (M12).
- [x] T9.5.4 **Giao diện sinh động hơn toàn app** — owner chọn **hướng B** (M0.5c, 2026-11-21) (Claude Desktop đề xuất 2–3 hướng hi-fi cho Lộ trình, Bài học, Bài tập, Tổng quan → owner chọn → cập nhật tokens/spec). Sau khi chốt: agent áp dụng (màu theo nhánh/chuyên đề, thẻ có minh họa emoji lớn, hiệu ứng phản hồi + hoàn thành dùng chung với khu Trò chơi, chuỗi ngày học nổi bật…), cập nhật baseline.

**Tiêu chí nghiệm thu**
- Trả lời đúng và sai ở Bài tập, bài học, trò chơi đều có âm khác nhau, nghe rõ ở âm lượng máy bình thường; tắt được trong Cài đặt.
- Trên Edge, giọng mặc định là giọng Natural (nữ) nếu máy có; đổi giọng / tốc độ trong Cài đặt có hiệu lực ngay.
- (T9.5.3) Mọi từ / câu của Bài 1, Bài 2 phát bằng mp3 neural; tắt mạng vẫn phát (đã cache PWA ở M12).

**Kết quả T9.5.1–T9.5.2 (2026-11-20, nhánh `m9.5-feedback`):**
- **Âm phản hồi** (`feedback-sound.ts`): tổng hợp bằng Web Audio, không dùng file (không vướng bản quyền, không tăng dung lượng) — đúng = 3 nốt đi lên ~0,3 s, sai = 2 nốt đi xuống (sóng tam giác, mềm) ~0,35 s, hoàn thành = 4 nốt ~0,8 s; âm lượng mặc định 0,4 (trước 0,08).
  - Phát ở: phiên Bài tập và bước Bài tập của bài học (**cả khi sai** — sửa lỗi cũ), 4 trò chơi, màn kết quả Bài tập / hoàn thành bài học / kết quả trò chơi.
  - Đọc câu sau âm phản hồi 150 ms (trò chơi). Context bị trình duyệt treo → tự đánh thức.
- **Giọng đọc:** core `rankThaiVoices` (Natural/Online/Neural nữ → Natural nam → Google → giọng nữ → còn lại); `WebSpeechProvider` mặc định giọng xếp đầu, rate 0,95, pitch 1,05, thêm `thaiVoices()`. Cài đặt giọng/tốc độ áp cho mọi lần đọc qua `VoicePreferencesBoundary` (provider giữ nguyên danh tính → không dựng lại phiên đang làm).
- **`/settings`** (owner cho agent làm khi chưa có SCR, 2026-11-20): mục Âm phản hồi (bật/tắt, âm lượng 0–100%, nghe âm đúng/sai) + Giọng đọc tiếng Thái (chọn giọng, "Tự động — <giọng tốt nhất>", tốc độ 0,7–1,2, Nghe thử `สวัสดีค่ะ ยินดีที่ได้รู้จัก`, gợi ý dùng Edge khi máy chỉ có giọng hệ thống, hướng dẫn cài khi không có giọng Thái). Phần còn lại của Cài đặt ở M12.
- **Test:** unit (player giả, danh sách giọng giả), E2E spy Web Audio (âm sai 392→311 Hz, âm đúng + hoàn thành), `settings.spec` (giọng giả cố định, lưu sau reload, axe), baseline `settings-*` mới. Playwright WebKit trên Windows không có Web Audio / Web Speech → các kiểm tra âm/giọng bỏ qua trên webkit.
- **Còn lại:** T9.5.3 ⏸ tạm loại (owner 2026-11-21; khi bật lại cần **SETUP S13**).

**Kết quả T9.5.4 (2026-11-21, hướng B "Nắng nhiệt đới", nhánh `m9.6-games`):**
- **Token:** nền kem `#FFFBF5`, sidebar `#FBF3E8`, viền ấm; `topic.1..8`, `highlight`, `streak`, `star`, `radius.xl` 16, `shadow.card`, H1 32px bold, motion `slow/celebrate/easing-bounce`, `illustration.size`. Mọi màn có H1 dùng cỡ mới.
- **Core:** `topicColors` (Q1 — màu theo vị trí trong lộ trình đầy đủ, hai unit liền nhau không trùng màu), `unitEmoji` + cột **tùy chọn** `emoji` trong `units.csv` (Q3; mẫu + README cập nhật, chưa điền cho unit nào → mặc định 📘 / 🧩), `studyStreak` (Q4 — ngày có bài tập / ôn thẻ / bước bài học / lượt trò chơi; tuần T2–CN; mốc 3/7/30/100).
- **Web:** Lộ trình **lưới 2 cột** (dải màu chuyên đề 88px + emoji, thanh tiến độ màu chuyên đề; ←→↑↓); thẻ Học tiếp và header Chi tiết chuyên đề nền `topic.subtle` + emoji lớn; thẻ từ trong vòng `topic.subtle`, stepper màu chuyên đề; chip 🔥 ở sidebar + khối chuỗi ngày (7 chấm tuần) đầu trang Bài tập; nút lựa chọn bo 16px, nảy khi đúng / rung khi sai; kết quả Bài tập có vòng hoàn thành + chấm tỏa. Lượt trò chơi ghi phiên `game` để tính chuỗi ngày.
- **Chưa làm (thuộc M10):** khối streak + "Học tiếp" ở **Tổng quan** (SCR-03 chưa duyệt); hiệu ứng mốc streak `fb-record` chỉ có ở khối streak.

### M9.6 — Trò chơi mở rộng (tham khảo Wordwall) 🟢 (plan 0.14, xong 2026-11-21)

**Nguồn:** phản hồi người học "ít trò, giao diện trò chơi chưa thu hút"; owner chọn thêm 3–4 trò, UI tham khảo Wordwall (2026-11-20).

**Cần trước:** M9.5 ✅ (âm phản hồi dùng chung). UI (T9.6.4–T9.6.6) **🟠 chờ SCR-08 v2** (Claude Desktop, đợt M0.5c). T9.6.1–T9.6.3 làm được ngay sau M9.5.

**Task**
- [x] T9.6.1 Core: vòng lặp game thuần (`tick(state, dtMs, input)`, đồng hồ/seed là tham số) dùng chung cho trò có chuyển động; **F-15 Đập chuột** (lịch xuất hiện 9 ô, combo, phạt đập nhầm) và **F-16 Đố vui truyền hình** (trộn câu hỏi từ engine Bài tập E-01/E-02/E-05/E-14, trợ giúp 50:50 + thêm giờ, vòng thưởng, điểm). Unit test.
- [x] T9.6.2 Core: **F-17 Máy bay** (làn, tốc độ tăng dần, va chạm mây, 3 tim — dùng `rapidGame`) và **F-18 Mê cung** (sinh mê cung có seed, 4 ô đáp án, "ma đuổi" theo đường ngắn nhất, chế độ từng bước khi reduced-motion). Unit test.
- [x] T9.6.3 Hạ tầng web: hook `useGameLoop` (rAF, tạm dừng khi tab ẩn — dùng lại `useCountdown`), **theme trò chơi** (token `game.theme.*`: nền minh họa, màu, âm nền tắt được; 3 theme), bộ asset CC0 + `LICENSE.md`, **sao kết quả 1–3** + nút **"Đổi trò"** (giữ nguồn) cho cả 4 trò cũ.
- [x] T9.6.4 `/games` theo **SCR-08 v2**: lưới thumbnail minh họa lớn cho 8 trò, nhãn kỹ năng, lọc theo kỹ năng, kỷ lục, chọn theme, trò bị khóa có lý do.
- [x] T9.6.5 4 màn chơi mới + áp theme/sao cho 4 màn cũ theo SCR-08 v2 (bàn phím đầy đủ, âm M9.5, reduced-motion).
- [x] T9.6.6 E2E mỗi trò mới (seed cố định → điểm/kỷ lục, mục sai "cần ôn", FSRS không đổi), axe, baseline `/games` + 4 màn.

**Tiêu chí nghiệm thu**
- `/games` có **8 trò**, mỗi trò thumbnail riêng, chơi được với nguồn "Từ đã học" và từng chuyên đề (trò thiếu dữ liệu bị khóa có lý do).
- Chơi trọn 4 trò mới chỉ bằng bàn phím; reduced-motion vẫn chơi được (chế độ từng bước).
- Màn kết quả có sao + "Đổi trò"; đổi theme có hiệu lực ngay và được nhớ.
- Không thêm thư viện game engine; bundle trang `/games/:id` tăng < 150 KB gzip (trừ ảnh).

**Kết quả T9.6.1–T9.6.2 + một phần T9.6.3 (2026-11-20, nhánh `m9.6-games`):**
- **Core `games/arcade/`** (chưa vào `GAMES` / `/games` — chờ UI T9.6.4):
  - Khung `ArcadeGame` với `tick(state, dtMs, input)` chạy theo bước cố định ≤ 50 ms (`advance`), nên máy nhanh hay chậm cho cùng kết quả.
  - Đáp án nhiễu không trùng chữ, không cùng nghĩa với đáp án (`wrongOptions`).
  - `GameSummary` có thêm tham số kiểu cho id trò.
- **F-15 Đập chuột:** 9 ô, lịch xuất hiện sinh theo seed (mỗi nhóm 3 con có đúng 1 đáp án, không thò liền cùng ô), 60 s, combo; đập nhầm −50 điểm và ghi "cần ôn".
- **F-16 Đố vui truyền hình:** 12 câu lấy từ engine Bài tập (E-01/E-02/E-05/E-14), 15 s/câu, 50:50, +10 s, 3 câu cuối ×2; màn phản hồi không tính giờ.
- **F-17 Máy bay:** 4 làn, mây trôi nhanh dần 6%/câu đúng (tối đa ×2), luật 3 tim; câu > 3 thẻ từ không đưa vào mây.
- **F-18 Mê cung:** mê cung 9×7 hoàn hảo sinh theo seed, đáp án ở 4 góc, ma đuổi theo đường BFS và nhanh dần; chế độ từng bước (reduced-motion): ma đi 1 ô sau mỗi 2 bước của người chơi.
- **T9.6.3 (một phần):**
  - Hook `useGameLoop` (rAF, cắt khung > 100 ms, tạm dừng khi tab ẩn — chung logic với `useCountdown`).
  - Token `color.game-theme.{sea,space,garden}` + `data-game-theme` + cài đặt `useGameTheme`. **Màu tạm**, chờ SCR-08 v2.
  - Core `resultStars` (≥ 90% → 3 sao, ≥ 60% → 2, còn lại 1); màn kết quả 4 trò cũ có hàng sao; nút "Trò khác" đổi tên thành **"Đổi trò"** (giữ nguồn).
  - **Chưa làm:** bộ asset CC0 + `LICENSE.md` và âm nền — cần chọn hình/âm theo SCR-08 v2 (M0.5c).
- **Test:** core 407 (lines 100%), web 302; E2E Trò chơi 18/18 (thêm kiểm tra sao).

**Logic sẵn cho T9.6.4–T9.6.5 (2026-11-21, chưa có UI — chờ SCR-08 v2):**
- Core `games/catalog.ts`: `ALL_GAME_IDS` (8 trò), `AnyGameId`, `gameAvailability(id, source)` (lý do khóa cho cả trò arcade), nhãn kỹ năng `SKILLS_BY_GAME` (Từ vựng / Câu / Loại từ — "Nghe" thêm khi có trò ra đề bằng audio) + `gamesWithSkill` (lọc ở `/games`). `GAMES` chuyển từ `index.ts` sang đây.
- Kỷ lục + "cần ôn": `GameResultRecord.gameId`, repository và `saveGameResult` nhận cả id trò arcade (kỷ lục theo điểm); không đổi schema IndexedDB.
- Web `useArcadeRun(game, source, seed)`: lượt theo seed, vòng lặp `useGameLoop` → `tick(state, dtMs)`, thao tác người chơi áp ngay (bỏ qua khi chưa bắt đầu / tạm dừng / đã xong), âm đúng/sai M9.5.
- **Test:** core 417, web 307.

**Kết quả T9.6.3 (phần còn lại) – T9.6.6 (2026-11-21, SCR-08 v2):**
- **`/games`:** 8 card thumbnail 16:10 (emoji + khối CSS, nền màu trò, không đổi theo theme — Q2), phím `1`–`8`, nhãn kỹ năng, lọc `S` (`?skill=`, số trên card không đánh lại, trò ẩn không nhận phím), chọn theme `T` (3 ô tròn, lưu), kỷ lục 🏆, trò khóa: mờ + 🔒 + lý do, phím số báo toast. Lý do khóa mới `items` cho Máy bay / Đố vui (Q3).
- **Màn chơi:** cảnh nền theo theme (2 dải màu + đường cong SVG + đồ trang trí emoji), panel trắng cho mọi chữ Thái; thanh trên có ⏸ `P`, 🎵 `M`, trạng thái ("Từng bước", "Tốc độ ×1,3"); lớp tạm dừng **Tiếp tục / Chơi lại / Thoát**; đếm 3·2·1 có dòng hướng dẫn phím. 4 trò cũ đặt trong panel trên cảnh nền.
- **4 trò mới:** Đập chuột (phím numpad `7 8 9 / 4 5 6 / 1 2 3` + `QWE/ASD/ZXC`, click), Đố vui truyền hình (thang 12 câu, đồng hồ vòng, `A–D`/`1–4`, 50:50 `F`, +10 giây `T`, banner vòng thưởng, Tiếp `Enter`), Máy bay (`↑↓`/`WS`; giảm chuyển động → từng bước, `→`/Enter "Bay"), Mê cung (mũi tên/WASD, `B` bật/tắt từng bước — nhớ theo user, tự bật khi giảm chuyển động).
- **Kết quả:** sao 1–3 tô `highlight` + viền, bật lần lượt; kỷ lục mới = huy hiệu `highlight` + chấm tỏa (fb-record); dòng riêng trò (Đập nhầm n lần, Trợ giúp đã dùng, Bay qua n hàng mây, Qua n màn); **"Đổi trò" `G`** mở dialog 8 trò (giữ nguồn, trò khóa mờ + lý do, "Vừa chơi", phím `1`–`8`) — Q5.
- **Khác spec (cần owner biết):** âm nền là **vòng nhạc tổng hợp Web Audio** (như âm phản hồi M9.5) thay cho file OGG CC0, mặc định tắt (Q1), âm lượng = 30% âm phản hồi; cảnh nền và nhân vật dùng **emoji + CSS/SVG**, không dùng bộ Kenney → không có file asset, không cần `LICENSE.md`. Đập chuột khi giảm chuyển động: con hiện/ẩn tức thì, không có chế độ chậm (Q4).
- **Test:** core 427, web 381 (thêm 8 test component cho `/games` v2 + 4 trò + Đổi trò); E2E `arcade.spec.ts` 5 test × 6 project (seed cố định → kỷ lục, "cần ôn", FSRS không đổi, axe, baseline `/games` + 4 màn).

### M10 — Tổng quan + Sổ từ + Tiến độ 🟢 (mở + xong 2026-11-21; plan 0.7, 0.8, 4.9, 4.13)

**Cần trước:** M9 ✅; SCR-03 / SCR-07 / SCR-09 ✅ (owner duyệt 2026-11-21, #26 — SCR-03 Q1 a, Q2 b, Q3 a · SCR-07 Q1 a, Q2 a, Q3 a, Q4 c, Q5 a · SCR-09 Q1 a, Q2 a+b, Q3 a).

**Task**
- [x] T10.1 Dữ liệu: `WordNoteRecord` + Dexie v6 `wordNotes` (repository, chuyển Guest → tài khoản), `NeedsReviewRecord.origin` thêm `'manual'` (Q5), cột tùy chọn `mnemonic_vi` trong `words.csv` (Q1), ghi `SessionRecord` cho bài học / phiên bài tập / lượt chơi (SCR-09 Q2 b — dùng chung cho thời gian học và chuỗi ngày, SCR-03 Q2 b), chuỗi dài nhất.
- [x] T10.2 Core selector báo cáo (thuần, đồng hồ giả): hoạt động 30 ngày, thời gian học (phiên + ước tính dữ liệu cũ), nhớ đúng 7/30 ngày (R-05), dự báo đến hạn (P-04), kỹ năng `SKILL_GROUPS` (P-12, Q1 a), lỗi hay gặp theo mẫu câu / loại bài (R-04'), từ & câu khó (R-06), trò chơi (P-09); `searchWords` không dấu (SCR-07 §B).
- [x] T10.3 `/` Tổng quan (SCR-03): Học tiếp (bước, `H`), Hôm nay (chuỗi ngày 7 chấm + mục tiêu ngày), Bài tập hôm nay (nút chính theo Q1 a, `B`), lộ trình gọn có "Bạn đang ở đây" + nhãn cấp độ, tóm tắt 4 ô, trạng thái người học mới; Cài đặt "Số câu mỗi phiên / mục tiêu ngày" (`/settings#bai-tap`, Q3 a).
- [x] T10.4 `/words` Sổ từ (SCR-07): tìm Thái / Việt không dấu (`/`), lọc chuyên đề + mức thuộc + cần ôn, 4 cách sắp xếp, 100 dòng + tải thêm (Q3 a), danh sách `listbox` (↑↓ Home End), chi tiết (phát âm `Space`, phiên âm `P`, ví dụ, mức thuộc, lần ôn tới, số lần ôn/quên), **mẹo nhớ của tôi** (`M`, Ctrl+Enter, xoá có hỏi lại) ưu tiên hơn mẹo gợi ý — dùng chung ở mặt sau thẻ từ SCR-05; cần ôn bật tay (`C`). V-03 "Hình → Thái" để Phase 2 (Q4 c).
- [x] T10.5 `/progress` Tiến độ (SCR-09): 5 ô tổng quan, hoạt động 30 ngày (biểu đồ cột tự vẽ — plan 7.1 "Recharts hoặc tương đương nhẹ", không thêm dependency — tooltip chuột + bàn phím, đường mục tiêu, "Xem dạng bảng" nhớ lựa chọn), trí nhớ + dự báo 7 ngày, kỹ năng P-12 (link "Luyện ›" đặt Kiểu bài), lộ trình & mục tiêu, lỗi hay gặp (`W`), từ & câu khó ("Luyện nhóm này" `?items=`, Q3 a), trò chơi.
- [x] T10.6 E2E `m10.spec.ts` (người học mới; dữ liệu giả lập + đồng hồ cố định → số liệu chính xác, phím tắt, mẹo nhớ + cần ôn ghi đúng IndexedDB, axe) + baseline `home`, `home-empty`, `words`, `progress`.

**Tiêu chí nghiệm thu**
- Mở `/` biết ngay hôm nay làm gì: đúng 1 nút chính theo quy tắc Q1 a; chuỗi ngày tính cả trò chơi.
- Sổ từ tìm được "cam on" → ขอบคุณ, ขอบใจ (thai_alt); mẹo nhớ của tôi lưu theo user, có ở mặt sau thẻ từ.
- Tiến độ đọc được bằng bàn phím (tooltip cột, bảng), không lỗi axe serious/critical.

**Kết quả (2026-11-21, nhánh `m10-home`):**
- Test: core 440, web 382 (+ E2E M10 4 test × 6 project; full E2E 344 pass). Sửa test chập chờn `useFeedbackPause` (chờ cài đặt tự đọc nạp xong). Baseline `settings-*` đổi vì thêm khối Bài tập. `/` `/words` `/progress` thay trang tạm (`PlaceholderPage` đã xoá).
- **Khác spec (owner xem):** biểu đồ cột tự vẽ bằng CSS (không Recharts); chuỗi ngày **không** tính "từ mới vào học" (`CardRecord.createdAt`) như bản nháp SCR-03 cũ — tính bài tập, ôn thẻ, bước bài học, phiên học, lượt chơi (đã ghi trong spec); 1024–1279px: chi tiết từ xếp dưới danh sách (chưa làm Sheet trượt).

### M12 — Cài đặt, xuất/nhập, PWA offline, E2E đủ, go-live 🟢 CAT (T12.1–T12.5 ✅, T12.6 ⏸) (mở 2026-11-21; plan 4.12 G-01..G-03, 4.0 go-live, 7.4)

**Cần trước:** M10 ✅ (#32). Không cần spec màn mới (Cài đặt là trang có sẵn, owner cho agent làm từ M9.5). Go-live cần owner: SETUP S1, S3, S4, S5 bước 3, S8.

**Task**
- [x] T12.1 Cài đặt (G-01): **Hiện phiên âm Latin mặc định** (mặc định tắt, plan 0.2) áp cho thẻ từ bài học + Sổ từ, `P` vẫn đổi từng từ; "Số câu mỗi phiên / mục tiêu ngày" đã có từ M10; giọng / tốc độ / âm lượng từ M9.5. *Không làm "số từ mới mỗi ngày"*: v7 đưa từ mới vào theo bài học, `newCardsRemaining` không còn chỗ dùng.
- [x] T12.2 Xuất / nhập tiến độ JSON (G-02): core `createBackup` / `parseBackup` / `summarizeBackup` (định dạng `hoc-thai-cung-nom/progress` v1, kiểm tra store + phiên bản schema), Cài đặt › Dữ liệu tiến độ: Xuất tệp, Nhập (hỏi lại kèm tóm tắt, **thay** toàn bộ tiến độ), Xoá tiến độ trên máy; theo người dùng hiện tại (Guest / tài khoản).
- [x] T12.3 PWA offline (G-03): `vite-plugin-pwa` (plan 7.5), manifest (`Nôm`, màu chàm, nền kem, icon `logo-mark.svg`), service worker precache app + font + **toàn bộ content JSON** (`?v=` khớp precache), tự cập nhật bản mới; E2E chặn service worker mặc định, test offline bật riêng.
- [x] T12.4 E2E đủ (plan 7.4 viết lại theo v7): `golive.spec.ts` — luồng 1 + 3 (học bài → bài tập 100% → Tổng quan / Tiến độ cập nhật → 4 ngày sau có câu đến hạn), 7 (xuất → xoá → nhập, tệp sai báo lỗi), 8 (tải một lần → offline vẫn học, Sổ từ, Tiến độ); luồng 0 (`auth.spec`), 4 (`typing.spec`, `practice.spec`) đã có; baseline đổi `settings-*`.
- [x] T12.5 Checklist go-live `docs/go-live.md`: A (agent kiểm tra tự động) · B (owner làm tay B1–B9) · C (smoke test production); `/privacy` thêm đoạn về tệp xuất.
- **Vấn đề còn mở:** Firefox (Playwright) thỉnh thoảng crash (`Page crashed`) khi axe chạy trên Tổng quan trong `m10.spec` (~1/8–1/3 lần khi máy tải nặng, cả CI Linux). Đã dò: không do đồng hồ giả, luật `color-contrast`, hoạt ảnh. Tạm bỏ bước axe của `m10.spec` trên Firefox; `/` vẫn được axe kiểm trên Firefox ở `a11y.spec`.
- [ ] T12.6 Go-live: owner xong B1–B9 + smoke test production → agent ghi nhật ký, đóng Phase 1. **⏸ Giai đoạn CAT (owner 2026-11-21):** bản hiện tại trên production dùng cho khách hàng nghiệm thu; B8 ✅, các mục còn lại làm trước khi công bố chính thức. Lưu ý CAT: Google OAuth vẫn **Testing** → chỉ tài khoản trong *Test users* đăng nhập Google được, người thử khác dùng **"Học không cần đăng nhập"** (hoặc owner thêm Gmail của họ vào Test users).

**Tiêu chí nghiệm thu**
- Xuất → xoá → nhập khôi phục đủ thẻ, bài học, kỷ lục, cài đặt; tệp lạ / bản mới hơn bị từ chối có lời nhắn.
- Tải app một lần rồi tắt mạng: mở bài học bất kỳ, học từ, Sổ từ, Tiến độ vẫn chạy; bản build mới tự cập nhật.
- Smoke test production đăng nhập Google thật qua (B4 xong).

### M12.7 — Responsive iPhone & iPad 🟢 (mở + xong 2026-11-22, phản hồi CAT; plan 0.15, spec SCR-00 v2 responsive)

Nhánh gợi ý `m12.7-responsive` (base `main`). Có thể chia 2 PR: (1) khung + trang, (2) trò chơi + E2E thiết bị.
- [x] T12.7.1 Spec `docs/design/screens/SCR-00-responsive.md` (Claude Desktop) — owner duyệt hướng 2026-11-22.
- [x] T12.7.2 Khung: breakpoint `tablet: 744px` / `lg: 1024px`; phone = thanh trên + **thanh tab dưới** 5 tab + sheet "Thêm"; tablet = rail icon 72px; desktop giữ sidebar 240px; ẩn điều hướng trong bài học / phiên bài tập / màn chơi; safe area (`viewport-fit=cover`, `env(safe-area-inset-*)`), `dvh`.
- [x] T12.7.3 Các trang theo bảng §4 của spec: `/`, `/units`, unit, bài học, `/practice` + phiên, `/words` (bảng → thẻ), `/progress`, `/settings`, `/account`, `/login`, pháp lý — 1 cột ở phone, không tràn ngang, vùng chạm ≥ 44px.
- [x] T12.7.4 Trò chơi: `/games` (select nguồn full-width, chủ đề + kỹ năng cuộn ngang 1 dòng, thẻ 1 cột / 2 cột) + 8 màn chơi điều khiển bằng chạm (Máy bay ▲▼, Mê cung D-pad + vuốt, Đập chuột ô ≥ 88px, Xếp câu chạm-chọn); `touch-action: manipulation`.
- [x] T12.7.5 Nhập liệu iOS: font ô nhập ≥ 16px; giữ ô nhập trong tầm nhìn khi bàn phím mở (`visualViewport`); bàn phím ảo Thái mặc định ẩn trên thiết bị cảm ứng + nút bật (dock đáy, `inputmode="none"`); meta PWA iOS (`apple-touch-icon` 180, status bar, `theme-color`).
- [x] T12.7.6 E2E: project WebKit **iPhone 15**, **iPad mini dọc**, **iPad Pro 11 ngang**; test "không tràn ngang" mọi route, điều hướng tab + sheet, 1 ván Máy bay + Mê cung bằng chạm, axe; baseline ảnh phone/tablet. Giữ nguyên test desktop.
- [x] T12.7.7 Owner thử iPhone + iPad thật qua link preview → merge. Agent ghi nhật ký, cập nhật baseline cần xem. — **Owner duyệt UI mobile trên iPhone thật 2026-11-22**, cho merge #38; iPad theo dõi thêm trong CAT.

### M12.8 — Trò chơi: chọn nội dung để ôn 🔵 (mở 2026-11-22, phản hồi CAT; plan 0.16, spec SCR-08 v3)

Nhánh gợi ý `m12.8-game-source` (base `main`).
- [x] T12.8.1 Spec `docs/design/screens/SCR-08-source.md` (Claude Desktop) — owner duyệt hướng 2026-11-22.
- [ ] T12.8.2 Core `packages/core/src/games/source.ts`: nguồn `learned` · `recent` (7 ngày) · `review` (cần ôn + FSRS đến hạn) · `last-lesson` · `units:…` / `lessons:…` nhiều mục, cờ `;new`; đếm mục; ưu tiên cần ôn/đến hạn; **bỏ fallback lặng lẽ** (< 6 → không chơi được + lý do); migrate setting cũ `learned` / `unit:<id>`. Vitest.
- [ ] T12.8.3 UI `/games`: nút "Nội dung ôn" + bộ chọn (dialog desktop / bottom sheet phone): chip Ôn nhanh, danh sách Giáo trình / Chuyên đề → bài học (checkbox, số đã học / tổng), lọc chỉ-mục-đã-học, chân tổng + "Chơi với nội dung này"; tab kỹ năng + thẻ trò đếm theo nội dung đã chọn.
- [ ] T12.8.4 Lối vào: "Chơi ôn bài này" ở màn hoàn thành bài học, "Chơi ôn" ở trang bài / chuyên đề, thẻ "Ôn bằng trò chơi" ở Tổng quan, "Đổi nội dung" ở màn kết quả; `?source=` theo spec §4.
- [ ] T12.8.5 E2E + axe + baseline (phone + desktop) theo spec §5.
- [ ] T12.8.6 Owner xem link preview → merge. Agent ghi nhật ký.

### Sau M12
Phase 1 xong → Phase 2 (plan mục 10): M12.5 Đăng nhập Facebook (SETUP S6) đầu Phase 2. Không làm trước khi owner mở.

---

## 5. Nhật ký

> Mỗi phiên làm việc thêm **1 dòng** (mới nhất ở trên cùng).

| Ngày | Milestone | Xong | Đang dở | Bị chặn | Nhánh / PR |
|---|---|---|---|---|---|
| 2026-11-23 | TC.4h | **TC.4h** `c13`, `c09`, `c01`: rà lại 12 trang PDF (không sửa; gộp thẻ s-c13-027, s-c13-029 → ≤ 9), câu +32 (c13 32 → 40, c09 13 → 27, c01 6 → 16 — `c01-l2` 0 → 7) → mọi bài học ≥ 7 câu; ví dụ từ 120 cho 10 chuyên đề (c13, c09, c01, c02, c04, c05, c10, c11, c12, c14). **TC.4 xong.** PR gồm cả #43, #44, #45, #46, #47 (merge sau #47); E2E không chạy local — CI chạy (`lessons.spec` học trọn c01 giờ có Bài tập ở l2) | — | GV duyệt tiếng Thái Claude soạn | `content-tc4-c13-c09-c01` → PR |
| 2026-11-23 | TC.4g | **TC.4g** `c06`, `c07`: rà lại 11 trang PDF (không sửa; s-c07-003 gộp thẻ 13 → 9), câu c06 3 → 31, c07 3 → 37 (mọi bài học ≥ 7 câu theo mẫu การ / ความ, thẻ nhiễu đổi การ ↔ ความ), ví dụ 43; mẫu câu đã đủ. PR gồm cả #43, #44, #45, #46 (merge sau #46); E2E không chạy local — CI chạy | TC.4h | GV duyệt tiếng Thái Claude soạn | `content-tc4-c06-c07` → PR |
| 2026-11-23 | TC.4f | **TC.4f** `c03`: rà lại 13 trang PDF (không sửa), câu 0 → 96 (mọi bài học 7–8 câu danh từ + số + loại từ / นี้ / กี่ / tính từ), ví dụ 87, +3 mẫu câu Claude soạn (mỗi bài học có mẫu câu); E2E không cần sửa (không ca nào dựa vào c03 0 câu). PR gồm cả #41, #43, #44, #45 (merge sau #45); E2E không chạy local — CI chạy | TC.4g | GV duyệt tiếng Thái Claude soạn | `content-tc4-c03` → PR |
| 2026-11-23 | TC.4e | **TC.4e** `b02`, `b01`: rà lại 46 trang PDF (chỉ sửa chính tả ghi chú กู, gộp thẻ s-b01-007), hình 21, loại từ 30, ví dụ 127, câu +56 (b02 29 → 56, b01 11 → 40) → mọi bài học ≥ 6 câu trừ `b01-l1` (giữ chỉ Từ vựng vì E2E practice/golive), +9 mẫu câu Claude soạn, +2 hội thoại (chào – giới thiệu; gia đình); E2E `games.spec` ca khóa Đoán loại từ → `c01`. PR gồm cả #41, #43, #44 (merge sau #44); E2E không chạy local — CI chạy | TC.4f | GV duyệt tiếng Thái Claude soạn | `content-tc4-b02-b01` → PR |
| 2026-11-23 | TC.4d | **TC.4d** `b04`, `b03`: rà lại 115 trang PDF (không sửa nội dung GV), hình 32, loại từ +7, ví dụ +72, câu +78 (b04 19 → 46, b03 11 → 62) → mọi bài học ≥ 6 câu, +9 mẫu câu Claude soạn (mỗi bài học có mẫu câu), +2 hội thoại (mua văn phòng phẩm; hỏi tuổi – số điện thoại). PR gồm cả #41, #43 (merge sau #43); E2E không chạy local — CI chạy | TC.4e | GV duyệt tiếng Thái Claude soạn | `content-tc4-b04-b03` → PR |
| 2026-11-23 | TC.4c | **TC.4c** `b06`, `b05`: rà lại 111 trang PDF (không sửa nội dung GV), hình 7, loại từ 3, ví dụ 117, câu +79 (b06 52 → 80, b05 44 → 95) → mọi bài học ≥ 6 câu, +14 mẫu câu Claude soạn (mỗi bài học có mẫu câu), +2 hội thoại (hẹn giờ; ngày sinh). PR gồm cả #41 (merge sau #41); E2E không chạy local — CI chạy | TC.4d | GV duyệt tiếng Thái Claude soạn | `content-tc4-b06-b05` → PR |
| 2026-11-23 | TC.4b | **TC.4b** `b08`, `b07`: rà lại 76 trang PDF (không sửa nội dung GV; 3 từ “cần GV xác nhận”: เตียงคู่, รถราง, รถตู้ส่งของ), hình 46, loại từ 88, ví dụ 94, câu +93 (b08 19 → 59, b07 24 → 77) → mọi bài học ≥ 6 câu, +10 mẫu câu Claude soạn, +4 hội thoại. PR gồm cả #39, #40 (merge sau #40); E2E không chạy local (`playwright.config.ts` trên nhánh còn cố định cổng 4173) — CI chạy | TC.4c | GV duyệt tiếng Thái Claude soạn | `content-tc4-b08-b07` → PR |
| 2026-11-23 | TC.4a | **TC.4a** `b11`, `b12`: rà lại 42 trang PDF (không sửa hội thoại), thêm từ vựng rút từ hội thoại (b11 76, b12 63; 139 ví dụ, 6 hình, 20 loại từ), câu bù b11-l4/l5 (+6) → mọi bài học ≥ 5 câu; sửa E2E Hội thoại Bài 12 (bước Từ vựng đi trước). PR gồm cả commit docs của #39 (TC.4 chưa lên `main`) | TC.4b | GV duyệt tiếng Thái Claude soạn | `content-tc4-b11-b12` → PR |
| 2026-11-23 | TC.4 mở | Owner: làm đầy đủ các bài còn lại theo chuẩn TC.3. Claude Desktop đếm hiện trạng: chỉ b09, b10 đạt; b11/b12 0 từ, c03 0 câu, c06/c07 3 câu, b01–b08 không hình/ví dụ, 78/158 bài học < 5 câu. Chia TC.4a–h | TC.4a–h (agent), M12.8 (agent) | — | — (docs chưa commit) |
| 2026-11-22 | M12.8 mở | Phản hồi CAT: Trò chơi cần chọn nội dung để ôn bài đã học. Plan v7.10 §0.16 (sửa F-10), spec `SCR-08-source.md`, milestone M12.8 (T12.8.1 ✅) | T12.8.2–T12.8.6 (agent) | — | — (docs chưa commit) |
| 2026-11-22 | M12.7 🟢 | T12.7.7: owner duyệt UI mobile trên iPhone thật → M12.7 xong (7/7), merge #38 (owner cho phép) → production có bản responsive. iPad theo dõi trong CAT. Dọn "Milestone đang mở": nội dung 27/27 file đã nhập (draft chờ GV duyệt), M12 → 🟢 CAT. CI #38 lần trước: `settings.spec` giọng đọc flaky trên WebKit, chạy lại xanh | — | Công bố chính thức: B1, B4–B7, B9, smoke test, GV duyệt nội dung | `m12.7-responsive` → #38 |
| 2026-11-22 | M12.7 | **Tự merge #37** (docs M12.7: plan v7.9, SCR-00 v2, 8.1 theo lệnh owner). T12.7.2 khung phone (thanh trên + tab dưới + sheet "Thêm") / tablet (rail 72px) / desktop giữ nguyên · T12.7.3 trang 1 cột, Sổ từ dạng thẻ + sheet lọc/chi tiết, chữ Thái thu nhỏ ở phone · T12.7.4 `/games` 1–2 cột, 8 trò bằng chạm (▲▼ Máy bay, D-pad + vuốt Mê cung, ô Đập chuột ≥ 88px) · T12.7.5 ô nhập ≥ 16px, bàn phím Thái ảo ẩn mặc định trên cảm ứng (dock đáy + `inputmode=none`), `visualViewport`, meta PWA iOS + icon 180 · T12.7.6 E2E WebKit iPhone 15 / iPad mini dọc / iPad Pro 11 ngang (27 test). Baseline desktop không đổi | T12.7.7 | Owner thử máy thật + merge | `m12.7-responsive` → #38 |
| 2026-11-22 | M12.7 mở | Phản hồi CAT: UI vỡ trên iPhone (sidebar 240px ép nội dung). Plan v7.9 §0.15 (thay G-04 desktop-first), spec `SCR-00-responsive.md`, milestone M12.7 (T12.7.1 ✅) | T12.7.2–T12.7.7 (agent) | — | — (docs chưa commit) |
| 2026-11-21 | M12 → CAT | Owner: production hiện tại là bản **CAT** (khách hàng nghiệm thu). **B8 duyệt** (giữ câu ghi công). B1, B4–B7, B9, smoke test **⏸ hoãn** tới công bố chính thức. Phase 1 code hoàn tất (M0 → M12 T12.5, TC.3) | — | Công bố chính thức chờ B1, B4–B7, B9 + smoke test + GV duyệt nội dung | — (docs chưa commit) |
| 2026-11-21 | Nội dung (TC.3) | **TC.3** Bài 9, 10 làm đầy đủ: rà PDF, hình, loại từ, ví dụ, câu luyện (≥ 5 / bài học: b09 77, b10 80), mẫu câu rải theo bài học, 6 hội thoại — tự merge theo 8.1 (nội dung `draft`) | — | GV duyệt tiếng Thái Claude soạn | `content-b09-b10` → PR |
| 2026-11-21 | Go-live + Nội dung | Owner: **B2** dọn preview, **merge #34 (M12)**, **B3** Firebase authorized domains OK. Yêu cầu **TC.3** rà soát & làm đầy đủ Bài 9, 10 (người học đang học) — ưu tiên số 1 | TC.3 | — | — (ROADMAP chưa commit) |
| 2026-11-21 | M10 → M12 + TC.2b | Owner duyệt M10: sửa lỗi axe (nút 🔊 lồng trong `option` Sổ từ) rồi merge #32. **Tự merge #31** (nội dung Chuyên đề 15 → 2, 8.1). **TC.2b** xoá `u03`/`u11` (#33, tự merge 8.1). Mở **M12**: T12.1–T12.5 xong (phiên âm mặc định, xuất/nhập/xoá tiến độ, PWA offline, E2E go-live, checklist). Firefox thỉnh thoảng crash khi axe chạy trên Tổng quan (~1/10, không do đồng hồ giả / luật contrast — đã dò); CI tự chạy lại → flaky | T12.6 go-live | B1–B9 việc tay owner (`docs/go-live.md`) | #32 ✅, #31 ✅, #33 ✅, `m12-golive` → #34 |
| 2026-11-21 | M10 + Nội dung | Owner duyệt SCR-03/07/09 → ghi câu trả lời vào spec, **merge #26** (theo yêu cầu owner), tự merge #30 (8.1). **M10** T10.1–T10.6 xong (Tổng quan, Sổ từ + mẹo nhớ, Tiến độ, SessionRecord, Dexie v6, E2E). Nhập **Chuyên đề 15 → 2** (PR #31). Sửa test chập chờn `useFeedbackPause` | — | PR #32 chờ owner xem giao diện; TC.2b sau #31 | `m10-home` → #32; `content-c02-c15` → #31 |
| 2026-11-21 | Quy trình + Nội dung | Owner merge #25 (gồm #27). **Tự merge #28, #29 (loại nội dung `draft`, AGENTS 8.1, owner đồng ý lần này)** — rebase lên `main`, sinh lại baseline `/units` trên giao diện B, CI xanh. Sửa ảnh `game-whack` không ổn định (che lưới hố; bỏ trên WebKit) | #30 (docs 8.1 + sửa test) chờ CI | M10 chờ owner duyệt #26 (không tự merge: spec thiết kế + câu hỏi cho owner) | #28, #29 đã merge; `docs-auto-merge` → #30 |
| 2026-11-21 | Quy trình | Owner đồng ý **agent tự merge PR** theo `AGENTS.md` mục 8.1 (CI xanh, không conflict, base `main`; loại PR được phép / phải chờ owner). SETUP S1: bảo vệ `main` không bắt buộc review | — | — | — (docs chưa commit) |
| 2026-11-21 | M9.5 + M9.6 + Nội dung | Owner chọn **hướng B** (Q1–Q4 theo đề xuất). **T9.5.4** giao diện "Nắng nhiệt đới" (token, màu chuyên đề, Lộ trình lưới, chuỗi ngày học, `fb-*`); **T9.6.3–T9.6.6** `/games` 8 trò + 4 màn arcade + theme + sao + Đổi trò + E2E; nhập **Bài 5 → 3** (PR #29) | — | M10 chờ owner duyệt SCR-03/07/09 (#26) | `m9.6-games` → PR #25; `content-b03-b05` → PR #29 |
| 2026-11-21 | M0.5b-2 / M0.5c / Nội dung | Owner giao cho agent: soạn **SCR-03/07/09** + wireframe (PR #26), **M0.5c** 3 hướng giao diện + **SCR-08 v2** + mockup (PR #27), nhập **Bài 11 → 6** (PR #28; 0 lỗi content:check, baseline `/units`) | Nhập Bài 5 → 3 | M10, T9.5.4, UI M9.6 chờ owner duyệt #26 / #27 | `m0.5b-scr-03-07-09`, `m0.5c-design`, `content-b06-b11` |
| 2026-11-21 | M9.6 (+ M9.5) | Owner tạm loại **T9.5.3** (Azure Speech). Sửa 8 điểm review PR #23. Logic chờ UI: danh mục 8 trò + nhãn kỹ năng + lọc, kỷ lục / "cần ôn" cho trò arcade, hook `useArcadeRun` | — | T9.5.4, T9.6.3 phần còn lại, T9.6.4–T9.6.6 chờ SCR-08 v2 (M0.5c); M10 chờ SCR-03/07/09 | `m9.6-games` → PR mới vào `main` (#23 đã merge vào `m9.5-feedback`) |
| 2026-11-20 | M9.6 | **T9.6.1** khung arcade + Đập chuột + Đố vui truyền hình, **T9.6.2** Máy bay + Mê cung (core, seed + đồng hồ giả, coverage 100%); T9.6.3 một phần: `useGameLoop`, token 3 theme + `useGameTheme`, sao kết quả + "Đổi trò" cho 4 trò cũ | T9.6.3 (asset CC0 + âm nền) | T9.6.3 phần còn lại + T9.6.4–T9.6.6 chờ SCR-08 v2 (M0.5c) | `m9.6-games` (xếp chồng trên `m9.5-feedback`) |
| 2026-11-20 | M9.5 + TC.2a | **T9.5.1** âm phản hồi mới ở mọi nơi (cả khi sai), **T9.5.2** xếp hạng giọng Thái + `/settings` âm lượng / giọng / tốc độ / nghe thử (owner cho làm khi chưa có SCR); **TC.2a** xóa `u01`/`u02`, test chuyển sang `b01`/`c01`/`b12`; sửa engine: phương án nhiễu trùng đề (từ cùng nghĩa); merge `content-b12` vào nhánh (tránh xung đột `dialogues.yaml`) | M9.6 T9.6.1–T9.6.3 | T9.5.3 chờ S13; T9.5.4 + UI M9.6 chờ M0.5c | `m9.5-feedback` |
| 2026-11-20 | M9.6 (plan 0.14) | Owner: người học thấy **ít trò, UI trò chơi chưa thu hút** → tham khảo Wordwall, thêm 3–4 trò. Claude Desktop: plan v7.7 mục 0.14 (F-15 Đập chuột, F-16 Đố vui truyền hình, F-17 Máy bay, F-18 Mê cung; thumbnail, 3 theme, sao, "Đổi trò"), milestone **M9.6** (T9.6.1–T9.6.6), SCR-08 v2 vào M0.5c | — | UI M9.6 chờ SCR-08 v2 | `m9.5-feedback` |
| 2026-11-20 | Nội dung | Claude Desktop nhập **Bài 12** (`b12`: nhập vai hội thoại phần 2 — 7 bài học, 5 hội thoại / 70 lượt thoại dịch Thái, 59 câu luyện dịch, không có bảng từ); bọc ngoặc kép `th`/`vi` trong `dialogues.yaml`. Kế tiếp: Bài 11 | — | — | `content-b12` |
| 2026-11-20 | M9.5 + Nội dung (plan 0.13) | Owner chuyển **feedback người học** (âm đúng/sai, giọng trầm, giao diện đơn điệu). Claude Desktop review code → mở **M9.5** (T9.5.1–T9.5.4), thêm M0.5c (làm mới giao diện), SETUP **S13** (Azure Speech F0); TC.2 tách 2a (xóa `u01`/`u02` ngay) / 2b. Thứ tự nhập tài liệu đổi sang **số lớn trước** (Bài 12 → 3, CĐ 15 → 2) | M9.5 | T9.5.3 chờ S13; T9.5.4 chờ M0.5c | `content-b12` |
| 2026-11-20 | M9 → 🟢 | T9.1–T9.7: core bài tập (10 loại, chấm FSRS lần đầu, bậc dịch E-11, phiên E-10), Dexie v5, `/practice` + `/practice/session` + badge, bước Bài tập của bài học dùng chung engine, E2E + axe + baseline. Sửa trong lúc làm: radio Kiểu bài nhảy lại, "Luyện lại câu sai" cùng URL không mở phiên mới, trả lời lại câu cuối khi đang ghi, Skeleton thiếu role | — | M10 cần SCR-03/07/09 (đợt M0.5b-2); baseline Linux từ CI | `m9-practice` PR #20 |
| 2026-11-20 | M9 mở + Nội dung | Owner: merge PR #18 (TC.1 + Bài 2), **duyệt SCR-06** → mở **M9 Bài tập** 🔵 (agent chi tiết hóa task). Claude Desktop nhập **Bài 1** (`b01`: 7 bài học, 71 từ, 5 mẫu câu, 11 câu — 3 câu có đáp án gốc của GV) và **Chuyên đề 1** (`c01`: 2 bài học, 19 từ, 3 mẫu câu, 6 câu ví dụ gốc); YAML: bọc ngoặc kép `th`/`vi` trong `examples` (dấu `?`) | M9 | — | `content-b01-c01` (E2E trò chơi/bài học chọn `u01`/`u03` rõ ràng thay vì unit đầu lộ trình; baseline `units-*`, `games-*`) |
| 2026-11-19 | TC (plan 0.12) | **TC.1** lộ trình 2 nhánh Giáo trình → Chuyên đề, nhãn "Bài n" / "Chuyên đề n" / "Bài học n"; commit content Bài 2 + docs v7.5; sửa YAML `b02`; E2E + axe + baseline `units-*` | — | TC.2 chờ đủ Bài 1–3, CĐ 3, 11; baseline Linux từ CI | `content-teacher` PR #18 |
| 2026-11-19 | Nội dung (plan 0.12) | Owner đưa 27 PDF giáo viên vào `sources/`, chọn lộ trình 2 nhánh + Claude Desktop nhập tay + Claude dịch bài luyện tập (GV duyệt). Claude Desktop: nhập **Bài 2** (`b02`: 6 bài học, 65 từ, 2 mẫu câu, 29 câu luyện dịch, draft); tạo `content/IMPORT-STATUS.md`; thêm TC.1–TC.2 | TC.1 | — | `content-teacher` |
| 2026-11-19 | M7 → 🟢 | Owner chọn tách `m7-lessons-ui` từ `m7-lessons` (PR #14 chưa merge vào `main`). T7.4 `/units`, T7.5 `/units/:unitId`, T7.6 bài học 4 bước + bài tập + hoàn thành, T7.7 E2E + axe + baseline. Sửa trong lúc làm: thẻ SRS bị tạo trùng khi lật lại từ "Chưa nhớ" (gọi `introduceCard` song song) → mỗi từ một lần/bước; axe `label-content-name-mismatch` ở danh sách từ. Đóng M7 → 🟢 | — | M9 chờ duyệt SCR-06; baseline Linux mới từ CI | `m7-lessons-ui` PR #17 |
| 2026-11-19 | M7 (mở khóa) | Owner: **merge PR #16** (M7.5 vào `m7-lessons`; `main` còn chờ PR #14), **duyệt SCR-04/05**. Claude Desktop: content mẫu Chuyên đề 11 thêm **31 câu** từ "Bài tập vận dụng của น่า" (`sources/11-…pdf` p2–p6) — bản dịch Thái + `tokens` + 1 thẻ nhiễu mỗi câu, `draft: true` chờ giáo viên duyệt → mở khóa **Xếp câu tốc độ** (≥ 5 câu). Giữ nguyên s-u11-016/019 (thiếu đáp án, phục vụ test cảnh báo) | T7.4–T7.7 | — | `m7-lessons-ui` (tách từ `m7-lessons`) |
| 2026-11-19 | M7.5 → 🟢 | T7.5.7 content mẫu Unit 3: `classifier` cho 5 từ + 7 từ mới (ร่ม, แก้ว, จาน, หนังสือ, ปากกา, รถ, ไข่; trang PDF đã tra: p1/p4/p6), `content:check` 0 lỗi; T7.5.6 E2E Đoán loại từ trên Chuyên đề 3 (chọn nguồn được nhớ, phím 1–4, hết tim → kết quả, mục sai `lang="th"`, axe). E2E đầy đủ 201 pass + 3 chập chờn (Auth Emulator). Đóng M7.5 → 🟢 | — | Xếp câu tốc độ cần chuyên đề có ≥ 5 câu (content); baseline Linux từ CI; M7 chờ SCR-04/05, M9 chờ M7 + SCR-06 | `m7.5-games` PR #16 |
| 2026-11-19 | M7.5 (plan) | Claude Desktop: thêm **T7.5.7** — danh sách loại từ cho content mẫu Unit 3 (12 từ, 7 loại từ: ตัว คู่ คัน ใบ เล่ม ด้าม ฟอง) để mở khóa Đoán loại từ và hoàn tất T7.5.6 | T7.5.7 | — | — (chưa commit) |
| 2026-11-18 | M7.5 | Owner **duyệt SCR-08** (README, SETUP S11). T7.5.4 `/games` (chọn nguồn + nhớ, "Từ đã học" → Chuyên đề 1 khi chưa đủ, 4 card màu trò, kỷ lục, khóa có lý do, phím 1–4, số mục "cần ôn"); T7.5.5 `FocusLayout` + `/games/:id` (`?source=`, `?seed=`): Ghép cặp (lưới 4×3, mũi tên + Space), Đúng hay sai?, Xếp câu tốc độ, Đoán loại từ, kết quả (lưu kỷ lục + "cần ôn" một lần, kỷ lục mới có sao + vòng sáng, bật/tắt "cần ôn", Chơi lại ↵ / Chơi với mục sai W / Trò khác); core `subsetSource`; bỏ `/dev/play`. T7.5.6 `games.spec.ts`: Đúng hay sai? hết 3 tim → kỷ lục sau reload, bỏ "cần ôn", không có thẻ SRS; Đoán loại từ bị khóa có lý do (content chưa có loại từ); axe; baseline `/games` + Ghép cặp. Sửa: axe (lưới thiếu role row, chữ `fg-subtle` thiếu tương phản), phím tắt gắn bằng layout effect (WebKit bấm sớm bị mất phím → câu hết giờ). Test: core 328, web 251; E2E games + a11y liên quan xanh; lần chạy E2E đầy đủ cuối bị dừng do máy hết bộ nhớ (CI chạy lại) | — | Đoán loại từ trên Unit 3 chờ content `classifier`; baseline Linux `games-*` từ CI | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 | T7.5.3d: `@fontsource/sarabun` 5.3.0 (subset `thai`, 400/500/600) thay `@fontsource-variable/noto-sans-thai`; `tokens.css` khớp `tokens.json` (test); E2E `typography` kiểm tra Sarabun đã tải + dấu không bị cắt; E2E 186/186 (3 trình duyệt × 2 viewport); baseline Windows `typography-*` cập nhật, baseline Linux `typography-*` xoá để CI sinh lại (owner xem artifact) | — | T7.5.4–T7.5.6 chờ duyệt SCR-08; content mẫu chưa có `classifier` | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 (plan) | Owner: dùng **font chữ phổ thông** (mẫu sách tập viết, chữ Thái có đầu tròn) → plan v7.4: font Thái **Sarabun** (G-05, D8, `tokens.json`, `brief.md`); thêm **T7.5.3d** (làm ngay, không chờ duyệt) | — | — | `m7.5-games` (docs `acd4f0e`) |
| 2026-11-18 | M7.5 | Góp ý owner: Xếp câu tốc độ — sau mỗi câu (xếp đúng, và theo owner đồng ý: cả khi sai / hết giờ) **đọc cả câu đúng** để người học nhớ. `useFeedbackPause` (đọc qua `AudioProvider` khi bật tự đọc, chờ đọc xong và ≥ 1,5 s mới sang câu); SCR-08 F-03' cập nhật; test | — | T7.5.4–T7.5.6 chờ duyệt SCR-08; content mẫu chưa có `classifier` | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 | Owner: tham khảo Memrise → chọn **cả gói** (v7.3). T7.5.3c: `rapidGame` (3 tim, giờ theo độ dài 5–9 s, +1 tim / 15 đúng liền, combo + tốc độ) cho Đúng hay sai? + Đoán loại từ; `setNeedsReview`; `UrgencyCard`, tim trên thanh trên, tự đọc chữ Thái (`gameAutoSpeak`), `ReviewList` bật/tắt "cần ôn"; sửa lỗi demo không tự sang câu (hẹn giờ bị đặt lại mỗi lần render); SCR-08 + plan 0.6/changelog | — | T7.5.4–T7.5.6 chờ duyệt SCR-08; content mẫu chưa có `classifier` | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 | Owner xem `/dev/play`: "thiếu màu, không animation" → **chốt phương án B** (plan 7.6.1 v7.3, SCR-08, `docs/design/README.md`). T7.5.3b: token `color.game.*` 4 màu (AA), `data-game` → `bg-game`/`text-game`; chuyển động phản hồi (rung/nảy/+điểm/combo/đếm 3·2·1/đồng hồ sắp hết giờ, theo token motion, tắt khi reduced-motion); trang mẫu `/dev/play` (Đúng hay sai?, Xếp câu tốc độ chạy logic core) + test route + axe | — | T7.5.4–T7.5.6 chờ duyệt SCR-08; content mẫu chưa có `classifier` | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 | T7.5.1 core `Game` (trạng thái thuần, `now` là tham số), nguồn F-10 v7.2 (`selectGameSource`: đã học ≥ 6 mục, không thì chuyên đề), RNG seed, `GameResultRecord` + `NeedsReviewRecord` (Dexie v4, chuyển Guest), `saveGameResult` không đụng FSRS (contract test); T7.5.2 `matchPairs`, `trueFalse`, `sentenceRush`, `classifierRush` (coverage lines 100%); T7.5.3 `components/interactive`: `ChoiceButton`, `TokenBank`/`TokenChip`, `FeedbackBar`, `GameTopBar`/`TimeBar`/`PausedOverlay`, `useCountdown` (tạm dừng khi tab ẩn/mất focus), `useKeyShortcut`, `useReducedMotion`, `useFeedbackSound` (Web Audio, cài đặt qua `SettingsRepository`) | — | T7.5.4–T7.5.6 chờ duyệt SCR-08; content mẫu chưa có `classifier` (Unit 3) → Đoán loại từ bị khóa | `m7.5-games` PR #16 (draft) |
| 2026-11-18 | M7.5 (plan) | Owner chốt **Trò chơi trước Bài tập** (plan v7.2): M10.5 → **M7.5**, thêm F-04' Đoán loại từ, F-10 cho chơi với từ chưa học của chuyên đề; Claude Desktop soạn `SCR-08-games.md` + 5 wireframe. Mở M7.5 🔵 (T7.5.1–T7.5.6) | — | UI M7.5 chờ duyệt SCR-08; UI M7 chờ duyệt SCR-04/05 | — (chưa commit) |
| 2026-11-18 | M0.5b | Claude Desktop: spec `SCR-04-units.md` (Lộ trình + Chi tiết chuyên đề), `SCR-05-lesson.md` (bài học theo `lesson.steps`, flashcard, Mẫu câu, Hội thoại + panel tra từ), `SCR-06-practice.md` (trang Bài tập, phiên E-01..E-14, kết quả, quy tắc chấm FSRS) + 8 wireframe PNG; `docs/design/README.md` | — | Owner duyệt SCR-04/05/06 → mở khóa M7 T7.4–T7.7 | — (chưa commit, trên nhánh `m7-lessons`) |
| 2026-11-17 | M8 | Mở M8 song song M7 (owner chốt), chi tiết hóa T8.1–T8.5. T8.1 layout Kedmanee TIS 820-2538 trong core; T8.2 `gradeThaiTyping` (chuẩn hóa, `th_alt`, ครับ/ค่ะ/คะ tùy chọn, sai dấu thanh, diff grapheme); T8.3 `ThaiKeyboard` (`simple-keyboard`, CSS tokens) + `ThaiTextInput` (map phím vật lý, ẩn/hiện); T8.4 `TypingFeedback`; T8.5 `/dev/typing` + E2E luồng 4 + axe + baseline. M8 → 🟢 | — | Owner xem baseline `/dev/typing`; M9 chờ M7 (SCR-04/05) + SCR-06 | `m8-thai-keyboard` PR #15 |
| 2026-11-17 | M7 | T7.1 types/schema bundle content vào core + content client web (manifest no-cache, cache theo hash) + `useUnits`/`useUnit`; T7.2 `LessonProgressRecord`/`CanDoRecord`, Dexie v3, `completeLessonStep` (≥ 80%), selector P-04/P-10/P-11, `ITEM_TYPES` + `sentence`; T7.3 `WebSpeechProvider` th-TH + file audio + `voiceStatus` | — | T7.4–T7.7 chờ SCR-04/05 (M0.5b); `content:build` chưa chép `content/audio/` (chưa có file audio) | `m7-lessons` PR #14 (draft) |
| 2026-11-17 | M6.1 → M7 | Commit docs v7.1 (plan 0.11). T6.1.1–T6.1.5: `Unit.kind` + level B1/tùy chọn, `Word.classifier`/`thai_alt`/`note_vi`, nghĩa/đáp án được trống khi draft (JSON Schema xuất lại); `content:check` cảnh báo thiếu nghĩa/đáp án/tokens tự tách, unit `grammar` ≤ 40 từ/bài; build tự tách `tokens` (`auto_tokens`) + `lesson.steps`; templates + README ánh xạ Plern-Pin; content mẫu Unit 3 + Unit 11 (draft). Đóng M6.1 → 🟢, M7 🔵 | — | M7 UI chờ SCR-04/05; owner duyệt content mẫu Unit 3/11 | `m6.1-teacher-content` PR #13 |
| 2026-11-17 | M6.1 (plan) | Owner gửi 2 PDF mẫu giáo viên (`sources/03-loai-tu.pdf`, `sources/11-cac-truong-hop-cua-na.pdf`, gitignored). Plan v7.1 mục 0.11: PDF ảnh + watermark → Claude vision; lộ trình theo chuyên đề giáo viên; schema thêm `kind`, B1, `classifier`, `thai_alt`, `note_vi`; E-14 Loại từ. Mở **M6.1** 🔵 trước M7 | — | M4 chờ S9 | — |
| 2026-11-17 | M6 → M7 | T6.1–T6.7: schema `Unit`/`Lesson`/`Word` v7/`Sentence`/`Grammar`/`Dialogue` (bỏ `Deck`/`WordRow`/`Reading`/`MinimalPair`, JSON Schema 6 file), loader 6 file + `--input` theo tên, `content:check` v7 (khóa ngoại, `tokens` = `th`, `distractors`, `th_alt`, ký tự Thái; cảnh báo 3–4 bài/8–12 từ/4–8 câu thoại), `content:build` `units.json` + `unit-<id>.json`, `content/templates/` + README, content mẫu Unit 1–2 (draft), docs (AGENTS 10, plan 5.4–5.6, SETUP S10). Đóng M6 → 🟢, mở M7 🔵 (T7.1–T7.7) | — | M7 UI (T7.4–T7.6) chờ SCR-04/05; owner duyệt content mẫu Unit 1–2 + task M7 | `m6-content-v7` PR #12 |
| 2026-11-16 | M5.5 → M6 | Commit docs v7. T5.5.1–T5.5.7: nav + route v7 (`/units`, `/practice`, `/words`; URL cũ redirect), xóa `MasteryGrid`/`HeatmapTable`/`ToneBarChart`/`ToneContour`/`ToneTag` + selector `ruleAccuracy`/`toneAccuracy`, xóa `color.tone` (tokens.json, CSS, Tailwind), `/login` thẻ từ vựng ก๋วยเตี๋ยว + câu chữ v7, Word `syllables`/`tones` tùy chọn + xóa content chữ cái/thanh/bài đọc/minimal pairs (JSON Schema xuất lại), Tone Engine đóng băng (README + ESLint), sitemap flows.md v7; E2E 162/162 + baseline mới. Đóng M5.5 → 🟢, mở M6 🔵 (T6.1–T6.7) | — | Owner: xem baseline `/login`, `/dev/progress`; duyệt task M6 | `m5.5-scope-v7` PR #11 |
| 2026-11-16 | v7 (plan) | Owner chốt đổi phạm vi theo phản hồi demo: A1–A2, bỏ chữ cái + thanh điệu, Ôn tập → Bài tập, bỏ MasteryGrid/HeatmapTable; plan v7 mục 0 (16 chủ đề, bài học 4 bước, Module E bài tập dịch câu, mẫu content); hủy M6 cũ, mở **M5.5** 🔵; milestone M6–M10.5 định nghĩa lại | — | — | — |
| 2026-11-16 | M2.1 → M6 | T2.1.1–T2.1.6: schema `leading` mọi phụ âm cao/trung + `tone_override`/`note`, vowel `inherent_final` (JSON Schema xuất lại); Tone Engine อักษรนำ tổng quát (bước `class` ghi phụ âm dẫn + lớp riêng) và ไ/ใ/ำ/เา → sống (`inherent-final`); validator cảnh báo ไ/ใ/ำ/เา ghi `long`/thiếu âm cuối, bỏ qua `tone_override`; content mẫu sửa + thêm (43 mục, draft); test plan 6.3 bổ sung. Đóng M2.1 → 🟢, mở M6 🔵 (T6.1–T6.9) | — | M6 UI chờ owner duyệt SCR-03/04/05 (T6.1) | `m2.1-tone-rules` PR #10 |
| 2026-11-16 | M5 → M2.1 | Owner duyệt `/dev/progress` + 2 sửa: `ToneContour`/`ToneTag` SVG theo số Chao (D10; thay ký hiệu Chao ở ToneBarChart, heatmap, thẻ ví dụ Login), heatmap tách Thấp × Chết thành ngắn (high) / dài (falling) + `TONE_RULES` trong core. Đóng M5 → 🟢, mở M2.1 🔵 | — | — | `m5-followup` PR #9 |
| 2026-11-16 | M5 | T5.1–T5.7: core — record + interface 4 repository + bản bộ nhớ + contract test, SRS wrapper `ts-fsrs` (đồng hồ giả lập), selector 4.9 (mức thuộc, %, tỉ lệ đúng theo quy tắc/thanh/ngày; coverage 100% lines); web — IndexedDB v2 + migration từ v1, repository Dexie qua cùng contract test, `RepositoriesProvider` theo uid/guest, hook `liveQuery` (cập nhật sau một lượt ôn), chuyển tiến độ gộp thẻ trùng; 5 component progress + `/dev/progress` (axe sạch, baseline) | — | Owner: duyệt screenshot `/dev/progress` | `m5-data-srs` PR #8 |
| 2026-11-16 | M2.1 (plan) | Owner duyệt: thêm **M2.1 — bổ sung quy tắc Tone Engine** (อักษรนำ tổng quát, ไ/ใ/ำ/เา) — làm ngay sau M5; chặn M6, M4. Plan v6.5 mục 6.1/6.2/6.3/5.5 | — | — | — |
| 2026-11-16 | M3 → M5 | Owner cho đóng M3 → 🟢. Mở M5 🔵, chi tiết hóa T5.1–T5.7 | — | — | `m3-content` PR #7 |
| 2026-11-16 | M3 | Đóng M1 (owner smoke test Google thật OK). M3: T3.1–T3.6 — loader YAML/CSV (lỗi file:dòng:cột [trường]), `content:check` thật (id, deck, Tone Engine, lớp phụ âm; cảnh báo ký tự ngoài Thái, lexicon, draft), `--input`/`--json`, `content:build` + manifest (idempotent, chạy trước web build), content mẫu 33 mục `draft: true` | — | Owner: xem content mẫu (S10) | `m3-content` PR #7 |
| 2026-11-16 | — (CI) | Sửa CI: sự kiện PR `closed` có `github.ref` = `main` nên trùng nhóm concurrency và huỷ mọi run deploy production (production chưa từng deploy). Concurrency theo số PR. Preview `-5` 404 là do PR #5 đã merge (môi trường preview được đóng) | — | Owner: merge PR #6 → production deploy M0.5a+M2+M1 | `fix-ci-prod-deploy` PR #6 |
| 2026-11-16 | M1 | T1.1–T1.4, T1.6–T1.10: `AuthService` provider-agnostic + Firebase (popup), emulator, `/login` (Google + Guest, D1, D2), khối tài khoản + menu + đăng xuất, offline, IndexedDB theo uid + chuyển tiến độ, `/account` (đổi tên, xoá tài khoản), 3 trang pháp lý; E2E luồng 0 xanh 3 trình duyệt × 2 viewport. M3 chưa có task dở → làm M1 trước | — | Owner: merge PR #4 rồi #5; smoke test Google thật trên production; kiểm tra Firebase Authorized domains có domain production; duyệt nội dung pháp lý (bản nháp) | `m1-auth` PR #5 |
| 2026-11-15 | M1 | Owner: S4 ✅, S5 ✅ (Testing + test user), S7 ✅, S12 ✅ email. **Quyết định: Facebook → Phase 2 (M12.5)**. M1 mở 🔵 (chỉ Google) | — | — | — |
| 2026-11-15 | TD, M2 | TD.1 (PR #2 design), TD.2 (tokens.css theo tokens.json + test đồng bộ); M2 T2.0–T2.5: Zod schema + JSON Schema, normalizeThai, Tone Engine (161 test, coverage 100%) → M2 🟢; chi tiết hóa M3 → 🔵 | — | M1 chờ S4–S6, S12; M3 cần owner duyệt content mẫu (S10) | `m0.5a-design` PR #2, `m2-core` PR #3 |
| 2026-11-15 | M0.5a | **Owner duyệt** flows, tokens, SCR-00/01/02, wireframe → M0.5a 🟢. Mở M2 song song; M1 🟠 chờ S4–S6, S12 | TD.1 commit `docs/design/` | — | `m0.5a-design` (chưa tạo) |
| 2026-11-15 | M0.5a | D0.5 wireframe Figma (SCR-00/01/02 + 4 dialog + trang pháp lý) → PNG trong `docs/design/screens/`; https://www.figma.com/design/iYEX3wxXphmrjDCxtiSuPD | — | D0.6 owner duyệt; email liên hệ | chưa commit (đề xuất `m0.5a-design`) |
| 2026-11-15 | M0.5a | D0.1 brief (chốt accent chàm + màn Chào mừng), D0.2 flows, D0.3 tokens.json, D0.4 SCR-00/01/02 (draft) — làm ở Claude Desktop | D0.5 wireframe Figma | Owner duyệt flows/tokens/spec; email liên hệ cho trang pháp lý | chưa commit (đề xuất nhánh `m0.5a-design`) |
| 2026-11-15 | M0 | Owner xong S1.2/S2/S7 → push, PR #1, CI xanh, preview chạy, commit baseline Linux; T0.10 ✅ | — | S1.3 (bảo vệ `main`) làm sau merge | `m0-scaffold` / https://github.com/DoMinhChien/hoc-thai-cung-nom/pull/1 |
| 2026-11-15 | M0 | T0.0–T0.9, T0.11, T0.12 (lint/typecheck/test/content:check/E2E 138 pass trên Windows) | T0.10 CI viết xong, chưa chạy | Push GitHub (S1.2), S2, S7; pnpm chưa cài toàn cục (S0) | `m0-scaffold` (local) / chưa mở PR |
| 2026-11-14 | — | Owner tạo GitHub repo https://github.com/DoMinhChien/hoc-thai-cung-nom (S1) | — | — | — |
| 2026-11-14 | — | Tạo ROADMAP, AGENTS, SETUP-OWNER, CLAUDE.md; plan v6.3; mở M0 + M0.5a | — | — | — |
