# Học Thai cùng Nôm — Product & Technical Plan

> **Mục đích tài liệu:** Spec để AI agent (hoặc dev) implement theo phase. Quyết định đã chốt ở mục 1–10. Điểm còn mở ở **mục 11 – Open Questions**, mỗi điểm có *default* — nếu chưa được trả lời, agent dùng default.
>
> **Bộ tài liệu:** `AGENTS.md` (điểm vào cho agent) · `ROADMAP.md` (trạng thái milestone, task chi tiết) · `SETUP-OWNER.md` (việc owner làm tay) · file này (spec đầy đủ).
>
> **Trạng thái:** Draft **v7.4** (2026-11-18: font Thái → Sarabun) · v7.2 (2026-11-18: **ưu tiên Trò chơi trước Bài tập**, xem 0.6) · v7.1 (2026-11-17: đã nhận PDF mẫu, xem 0.11) — **đổi phạm vi theo phản hồi khách hàng: xem mục 0 trước tiên.** Trước đó (v6.5): ADR-01 & ADR-02 **đã duyệt** (Firebase Auth, Phase 1 không database). Còn chờ: PDF mẫu (Q#1), ADR-03 chọn database ở đầu Phase 2
> **Owner:** John Do
> **Cập nhật:** 2026-11-16

---

## 0. Thay đổi phạm vi v7 (2026-11-16): **có hiệu lực cao nhất**

> **Agent đọc mục này trước.** Phần nào ở mục 1–12 mâu thuẫn với mục 0 thì **mục 0 thắng**. Các requirement bị bỏ vẫn giữ trong tài liệu (gạch tên, gắn ⛔) để truy vết, **không implement**.

### 0.1 Lý do & người học mục tiêu
- Phản hồi từ demo khách hàng (2026-11-16). **Người học đã đọc thành thạo chữ Thái**, trình độ **A1–A2 (CEFR)**, tương đương *Novice* theo khung CU-TFL. Mục tiêu hiện tại: **từ vựng theo chủ đề** và **dịch câu, nâng dần độ khó**.
- Định vị mới: app **từ vựng + mẫu câu + dịch câu theo chủ đề A1–A2**. Không dạy chữ cái, **không dạy và không hiển thị thanh điệu** (bỏ hẳn).

### 0.2 Bỏ khỏi Phase 1 (⛔)
| Bỏ | Ghi chú |
|---|---|
| Module A: Bảng chữ cái & Tone Trainer (A-01..A-24), routes `/alphabet`, `/tones` | Người học đã đọc được |
| Module D: Quiz nghe thanh điệu (D-01..D-04), route `/listening` | Thay bằng bài tập nghe hiểu câu (E-08) |
| P-02 `MasteryGrid`, P-03 `HeatmapTable`, P-07 `ToneBarChart`, `ToneContour`, `ToneTag`, màu 5 thanh trong tokens, nguyên tắc D10 | Theo yêu cầu khách hàng |
| R-04 thống kê thanh điệu | Thay bằng R-04' "lỗi hay gặp theo mẫu câu" |
| F-02 Phân loại lớp phụ âm, F-03 Ghép âm tiết, F-04 Săn thanh điệu | Thay bằng trò chơi từ & câu (0.6) |
| V-01 mẹo nhớ hình dạng phụ âm, V-06 pitch contour; minh họa 44 phụ âm (Phase 2) | — |
| B-07 "học chữ cái trước"; phiên âm hiện mặc định | **Phiên âm ẩn mặc định**, bật được trong Cài đặt / từng thẻ |
| M24 Tone Trainer văn bản tự do (Phase 2) | — |

**Tone Engine (`packages/core/tone`)**: giữ nguyên code và test (đã xong, không tốn chi phí) nhưng **đóng băng**: không UI nào import, không phát triển thêm. Trong schema, `syllables`/`tones` chuyển thành **tùy chọn**; `content:check` không bắt buộc nữa.

### 0.3 Khung nội dung: 16 chủ đề A1–A2
Tham chiếu: chỉ báo *can-do* CEFR A1/A2, chủ đề trong giáo trình tiếng Thái cơ bản (CU-TFL, các khóa Thai 1–2 đại học). Owner/giáo viên có thể đổi tên, thứ tự, thêm bớt chủ đề trong content, **không cần sửa code**.

| # | Cấp | Chủ đề (Unit) | Mẫu câu trọng tâm (gợi ý) | Can-do (ví dụ) |
|---|---|---|---|---|
| 1 | A1 | Chào hỏi & giới thiệu | ครับ/ค่ะ, ชื่อ…, เป็นคน… | Giới thiệu tên, quốc tịch, nghề |
| 2 | A1 | Gia đình & con người | มี…, …กี่คน | Nói về thành viên gia đình |
| 3 | A1 | Số, giờ, ngày tháng | กี่โมง, วันที่… | Hỏi/nói giờ, ngày, tuổi |
| 4 | A1 | Ăn uống & gọi món | ขอ…, เอา…, …ไหม | Gọi món, hỏi có/không |
| 5 | A1 | Mua sắm & giá cả | …เท่าไร, ลดได้ไหม | Hỏi giá, mặc cả đơn giản |
| 6 | A1 | Nhà cửa & sinh hoạt hằng ngày | ตื่น/กิน/ไป… + เวลา | Kể lịch sinh hoạt một ngày |
| 7 | A1 | Hỏi đường & phương tiện | …อยู่ที่ไหน, ไป…ยังไง | Hỏi đường, đi taxi/tàu |
| 8 | A1 | Sở thích & cuối tuần | ชอบ…, ไม่ค่อย… | Nói thích/không thích |
| 9 | A2 | Công việc & học tập | ทำงานที่…, ต้อง… | Mô tả công việc, nghĩa vụ |
| 10 | A2 | Sức khỏe & cơ thể | เจ็บ…, ควร… | Mô tả triệu chứng, lời khuyên |
| 11 | A2 | Thời tiết & mùa | …กว่า…, …ที่สุด | So sánh, mô tả thời tiết |
| 12 | A2 | Du lịch & khách sạn | อยากจะ…, จองได้ไหม | Đặt phòng, hỏi dịch vụ |
| 13 | A2 | Dịch vụ: ngân hàng, bưu điện, sửa chữa | ช่วย…หน่อย, ได้ไหม | Nhờ vả, yêu cầu lịch sự |
| 14 | A2 | Hẹn gặp & điện thoại | ว่างไหม, …แล้วจะ… | Hẹn, đổi lịch, gọi điện |
| 15 | A2 | Kể chuyện đã qua | เคย…, …แล้ว, เมื่อ… | Kể trải nghiệm, việc đã làm |
| 16 | A2 | Kế hoạch & ý kiến | จะ…, ถ้า…ก็…, เพราะ… | Nói dự định, lý do, điều kiện |

### 0.4 Cấu trúc một bài học
Mỗi Unit có **3–4 bài (Lesson)**, mỗi bài **10–15 phút**, gồm 4 bước theo thứ tự, mở khóa mềm (được bỏ qua):
1. **Từ vựng**: 8–12 từ, flashcard Thái → Việt (chữ Thái là chính, hình nếu có, phiên âm ẩn). Từ mới vào SRS.
2. **Mẫu câu**: 1–2 điểm ngữ pháp (`pattern` + giải thích tiếng Việt + 3–5 ví dụ có audio).
3. **Hội thoại**: 4–8 câu thoại ngắn; chạm từ để tra (giữ C-02, C-03); bật/tắt bản dịch.
4. **Bài tập**: 8–12 câu, độ khó tăng dần (0.5). Đạt ≥ 80% → bài hoàn thành.

Unit có **checklist can-do**: tự tick khi mọi bài của unit hoàn thành; người học tự tick bổ sung được.

### 0.5 Module E — Bài tập (thay "Ôn tập")
Mọi loại bài tập là module độc lập theo interface `Exercise` (`generate(item, ctx)`, `check(answer)`, `grade()` → Again/Hard/Good cho FSRS), cùng nguyên tắc với `Game` (F-14).

| ID | Loại | Bậc dịch | Phase |
|---|---|---|---|
| E-01 | Chọn nghĩa Việt cho từ Thái | 1 – từ | 1 |
| E-02 | Chọn từ Thái cho nghĩa Việt | 1 – từ | 1 |
| E-03 | Ghép cặp từ ↔ nghĩa (5 cặp) | 1 – từ | 1 |
| E-04 | Điền từ vào chỗ trống (chọn từ) | 2 – cụm/câu | 1 |
| E-05 | Chọn bản dịch Việt đúng cho câu Thái | 2 – câu | 1 |
| E-06 | Sắp xếp thẻ từ thành câu Thái (Việt → Thái); bậc 3 có **thẻ nhiễu** | 2–3 – câu | 1 |
| E-07 | **Gõ bản dịch Thái** cho câu Việt; chấm theo danh sách đáp án chấp nhận (`th` + `th_alt`) sau chuẩn hóa (NFC, bỏ khoảng trắng, ครับ/ค่ะ/คะ tùy chọn), bàn phím ảo G-06 | 4 – câu tự do | 1 |
| E-08 | Nghe câu (TTS) → chọn nghĩa / sắp xếp câu nghe được | 2–3 – nghe hiểu | 1 |
| E-09 | Ghép câu hỏi ↔ câu trả lời (từ hội thoại) | 2 – hội thoại | 1 |
| E-14 | **Loại từ (ลักษณนาม)**: danh từ → chọn/gõ loại từ; điền `danh từ + số + ___` (0.11) | 1 / 4 | 1 |
| E-20 | Dịch tự do Việt ↔ Thái, **Claude chấm** + giải thích lỗi tiếng Việt | 5 | 2 |

- **E-10 "Bài tập hôm nay"**: trộn thẻ đến hạn FSRS (từ **và** câu) + mục sai gần đây; mặc định 20 câu, chỉnh trong Cài đặt.
- **E-11** Bậc dịch tăng theo độ thuộc: câu mới bắt đầu ở bậc 2, đúng 2 lần liên tiếp → lên bậc kế tiếp, sai → lùi 1 bậc (lưu theo câu).
- **E-12** Sai → hiện đáp án đúng + diff (với E-07) + mẫu câu liên quan; cuối phiên: tóm tắt + "Luyện lại câu sai".
- **E-13** Trò chơi vẫn **không** đổi lịch FSRS (F-12 giữ nguyên).

### 0.6 Trò chơi Phase 1 (thay F-02..F-04)
F-01 **Ghép cặp** từ ↔ nghĩa/hình · F-02' **Đúng hay sai?** (từ/câu + nghĩa, **3 tim** — v7.3, combo) · F-03' **Xếp câu tốc độ** (E-06 có giờ) · **F-04' Đoán loại từ** (danh từ → chọn ลักษณนาม, 5 s/từ, **3 tim** — v7.2/v7.3, dùng `Word.classifier`). F-05..F-07 giữ ở Phase 2. Spec: `docs/design/screens/SCR-08-games.md`.

**v7.2 (2026-11-18) — owner chốt làm Trò chơi trước Bài tập:** milestone **M7.5 Trò chơi** (thay M10.5) làm ngay sau M7, trước M9. Hệ quả:
- **F-10 sửa:** nguồn câu hỏi = mục đã học; chưa đủ (< 6) → từ/câu của **chuyên đề người học chọn** (kể cả chưa học). Bỏ yêu cầu "chỉ mục đã học".
- Trò chơi vẫn **không đổi FSRS** (F-12); mục sai lưu cờ **"cần ôn"** để M9 ưu tiên.
- Component tương tác dùng chung (nút lựa chọn có phím số, thẻ từ / ngân hàng thẻ, thanh phản hồi, đồng hồ) **xây ở M7.5**, M9 dùng lại.

### 0.7 Điều hướng & màn hình
Sidebar (nhóm Học): **Tổng quan · Bài học · Bài tập · Sổ từ · Trò chơi · Tiến độ**; cuối: **Cài đặt**, menu tài khoản.

| Route | Màn hình | Spec |
|---|---|---|
| `/` | Tổng quan: "Học tiếp" (bài dở), "Bài tập hôm nay" (số câu đến hạn), streak + mục tiêu ngày, vị trí trên lộ trình A1 → A2 | SCR-03 |
| `/units` | Bài học: lộ trình 16 unit chia A1/A2, mỗi unit có `ProgressRing` + số bài xong | SCR-04 |
| `/units/:unitId` | Chi tiết unit: danh sách bài, checklist can-do, từ vựng của unit | SCR-04 |
| `/units/:unitId/:lessonId` | Bài học 4 bước (stepper), focus layout | SCR-05 |
| `/practice` | Bài tập: "Bài tập hôm nay", luyện theo unit, luyện câu sai | SCR-06 |
| `/practice/session` | Phiên làm bài (focus layout) + màn kết quả | SCR-06 |
| `/words` | Sổ từ: mọi từ đã học, lọc theo unit/mức thuộc, tìm kiếm, phát âm | SCR-07 |
| `/games`, `/games/:id` | Trò chơi | SCR-08 |
| `/progress` | Tiến độ & báo cáo cá nhân | SCR-09 |
| `/settings`, `/account`, `/login`, trang pháp lý | Giữ nguyên | SCR-00..02 |

### 0.8 Tiến độ (thay 4.9 phần bị bỏ)
- Giữ: 4 mức thuộc FSRS, `ProgressRing`, `StackedProgressBar`, P-01, P-04 (theo unit), P-05, P-08.
- Mới: **P-10 Lộ trình A1 → A2** (`UnitPath`: 16 unit, trạng thái chưa học/đang học/xong), **P-11 Checklist can-do** (`CanDoList`), **P-12 Kỹ năng** (4 thanh: Từ vựng = % từ đã thuộc; Dịch Thái → Việt; Dịch Việt → Thái; Nghe hiểu = tỉ lệ đúng 30 ngày theo nhóm bài tập).
- `/progress`: R-01' (từ đã thuộc, câu đã luyện, unit/bài xong), R-02' (streak + **biểu đồ cột** lượt học 30 ngày, không dùng heatmap), R-03, R-04' (**lỗi hay gặp theo mẫu câu** và theo loại bài tập), R-05, R-06 (thêm "câu khó"), R-07 (theo unit).

### 0.9 Content: mẫu nhập liệu
Đặt trong `content/templates/` (CSV mở bằng Excel/Google Sheets; giáo viên có biểu mẫu riêng thì pipeline map sang các cột này).

| File | Cột |
|---|---|
| `units.csv` | `unit_id, level (A1/A2/B1), kind (theme/grammar), order, title_vi, title_th, can_do` (nhiều mục tách bằng `|`) *(v7.1: thêm `kind`, B1)* |
| `lessons.csv` | `lesson_id, unit_id, order, title_vi, grammar_ids` |
| `words.csv` | `id, unit_id, lesson_id, thai, thai_alt, meaning_vi, note_vi, classifier, pos, phonetic` (tùy chọn)`, example_th, example_vi, image, tags, source` *(v7.1: thêm `thai_alt`, `note_vi`, `classifier`)* |
| `sentences.csv` | `id, unit_id, lesson_id, vi, th, th_alt` (bản dịch chấp nhận khác, `|`)`, tokens` (tách từ cho E-06, `|`)`, distractors` (thẻ nhiễu, `|`)`, grammar_id, audio, source` |
| `grammar.yaml` | `id, unit_id, title_vi, pattern, explain_vi, examples[{th, vi}]` |
| `dialogues.yaml` | `id, lesson_id, lines[{speaker, th, vi}]` |

Schema Zod mới: `Unit`, `Lesson`, `Word` (bỏ bắt buộc `syllables`), `Sentence`, `Grammar`, `Dialogue`. M4 (PDF pipeline) xuất ra đúng các file này.

### 0.11 Tài liệu giáo viên: đã nhận mẫu (2026-11-17)

Nguồn: giáo trình **"Tiếng Thái Thạc Sĩ Plern-Pin"**, chia theo **chuyên đề đánh số**. Mẫu đã nhận (lưu ở `sources/`, **không commit**; có bản quyền, giáo viên đã đồng ý cho dùng, Open Q #5):

| File | Trang | Dạng | Nội dung |
|---|---|---|---|
| `sources/03-loai-tu.pdf` | 13 | **Bảng 2 cột**: cột trái = danh từ Thái, *có khi* kèm `: nghĩa Việt`; cột phải **để trống** cho người học điền **loại từ (ลักษณนาม)** | ~300 danh từ, chỉ ~45% có nghĩa Việt; không có đáp án loại từ |
| `sources/11-cac-truong-hop-cua-na.pdf` | 6 | **Danh sách** `thai: nghĩa Việt` của một **điểm ngữ pháp** (น่า + động từ), sau đó **"Bài tập vận dụng"**: 34 câu tiếng Việt, dòng `=>` để trống cho người học dịch sang Thái | 29 cụm từ có nghĩa; 34 câu dịch **chưa có đáp án Thái** |

**Đặc điểm kỹ thuật:** PDF **không có lớp text** (ảnh trang, xuất bằng iLovePDF), có **watermark chéo** (logo, số Zalo) và header/footer lặp lại ở mọi trang → bắt buộc nhận dạng bằng ảnh; bỏ watermark/header/footer khi trích xuất.

**Quyết định (v7.1):**
1. **Lộ trình = chuyên đề của giáo viên** theo số thứ tự (vd. Unit 3 "Loại từ", Unit 11 "Các trường hợp của น่า"). 16 chủ đề ở 0.3 chỉ còn là **khung gợi ý** khi giáo viên chưa có chuyên đề tương ứng; không bắt buộc.
2. `Unit.kind`: `theme` (từ vựng theo chủ đề) | `grammar` (điểm ngữ pháp / cách dùng). `Unit.level`: `A1 | A2 | B1` (tài liệu thật trải rộng hơn A2, vd. กระทรวง, ราชวงศ์), tùy chọn.
3. Bài học **bỏ qua bước không có nội dung**: unit `grammar` thường là Mẫu câu → Từ vựng → Bài tập (không có Hội thoại).
4. `Word` thêm: `classifier` (ลักษณนาม, tùy chọn), `thai_alt` (biến thể, `|`; vd. ภาษิต = สุภาษิต, ไม้แจว / ไม้พาย), `note_vi` (ghi chú dùng, vd. "dùng cho thuyền lớn", "trong quân sự"). `meaning_vi` **được trống khi `draft: true`**, bắt buộc khi publish.
5. `Sentence`: `th` **được trống khi `draft: true`** (bài tập giáo viên chưa có đáp án); `tokens` để trống thì build tự tách bằng `Intl.Segmenter` và gắn cảnh báo cần duyệt.
6. Bài tập mới **E-14 Loại từ**: cho danh từ → chọn (bậc 1) hoặc gõ (bậc 4) ลักษณนาม đúng; mở rộng: điền vào cụm `danh từ + số + loại từ` (vd. แมว 2 ___ → ตัว). Implement ở M9.
7. **Phần còn thiếu** (đáp án loại từ, nghĩa Việt còn trống, bản dịch Thái của 34 câu): pipeline M4 có bước **`--suggest`**: Claude đề xuất, ghi `suggested_by: claude`, `confidence`, giữ `draft: true` → **giáo viên/owner duyệt** trước khi publish. Ưu tiên đáp án gốc nếu giáo viên cung cấp (SETUP S10).
8. Ghi nguồn: `source = "plernpin-03#p<trang>"`; hiển thị dòng ghi công giáo trình ở chi tiết unit (câu chữ do owner duyệt).

### 0.10 Milestone Phase 1 sau thay đổi
Xem mục 10 (đã cập nhật) và `ROADMAP.md`.

---

## 1. Tổng quan

> ⚠️ **v7:** định vị mới ở mục 0.1 (A1–A2, từ vựng theo chủ đề + dịch câu, không chữ cái, không thanh điệu). Mô tả bên dưới là bản v6, giữ để tham khảo.

**Học Thai cùng Nôm** là web app học tiếng Thái **dành cho người Việt**, giao diện **tiếng Việt**. Tập trung vào 3 điểm khó nhất của tiếng Thái: **chữ viết, thanh điệu, đọc văn bản viết liền**. Nội dung gốc lấy từ **giáo trình PDF do giáo viên biên soạn**.

**Ý tưởng cốt lõi:** học bằng **flashcard** và **trò chơi vui nhộn**, với tiêu chí **dễ tượng hình**: mỗi chữ cái / từ đều gắn với **hình ảnh + mẹo nhớ (mnemonic)** để người học "nhìn là nhớ". Giao diện (khung, điều hướng) **tối giản**; phần sinh động nằm ở **hình minh họa nội dung và cơ chế chơi**, không nằm ở trang trí.

### 1.1 Giá trị khác biệt
- **Tượng hình & mẹo nhớ:** mỗi phụ âm gắn với hình của từ khóa truyền thống (ก ไก่ = 🐔 con gà) + câu mẹo nhớ tiếng Việt liên hệ **hình dạng chữ** với hình ảnh; người học tự viết mẹo nhớ riêng được.
- **Flashcard + trò chơi:** luyện bằng các trò chơi ngắn (ghép cặp, phân loại nhanh, ghép âm tiết, săn thanh điệu…) bên cạnh ôn SRS.
- Giải thích, nghĩa, phiên âm hoàn toàn bằng tiếng Việt.
- **Tone Trainer**: suy luận thanh điệu từng bước (nhóm phụ âm → âm tiết sống/chết → dấu thanh → kết quả).
- Lộ trình mở khóa dần kiểu WaniKani: chữ → từ → câu → bài đọc.
- Đọc văn bản, chạm vào từ để tra và đưa vào SRS (kiểu LingQ).
- Nội dung bám sát giáo trình của giáo viên, giáo viên/admin bổ sung từ vựng được (Phase 2).

### 1.2 Tổng quan phase

| Phase | Chủ đề | Backend | Nội dung chính |
|---|---|---|---|
| **1** | **Đăng nhập** + MVP học | **Không backend**: Static Web Apps + Firebase Auth | **Đăng nhập Google (làm đầu tiên)**, Bảng chữ cái, Tone Trainer, Từ vựng + SRS, Đọc + tra từ, Quiz nghe, **Hình ảnh & mẹo nhớ, 4 trò chơi lõi**, Gõ chữ Thái, Progress visualization, Báo cáo cá nhân, Pipeline PDF → nội dung. Tiến độ học vẫn lưu local |
| **2** | Mở rộng học & quản trị | Azure đầy đủ | **Đăng nhập Facebook**, Đồng bộ tiến độ, phân quyền Editor/Admin, Import từ vựng, Báo cáo admin, **Leaderboard**, XP & huy hiệu, nhắc học, TTS Azure, chấm phát âm, AI tutor, parse âm tiết tự động |
| **3** | Lớp học / nhóm | Azure | Giáo viên tạo lớp, mời học viên, giao bài, báo cáo & leaderboard theo lớp (mục 4.12) |

> Thứ tự milestone từng phase xem mục 10.

---

## 2. Người dùng & vai trò

| Vai trò | Có từ phase | Mô tả | Quyền |
|---|---|---|---|
| **Guest** | 1 | Chưa đăng nhập | Học & ôn, tiến độ chỉ ở trình duyệt hiện tại |
| **Learner** | 1 | Đã đăng nhập Google (Facebook từ Phase 2) | Như Guest + hồ sơ cá nhân; Phase 2: đồng bộ, leaderboard |
| **Content Owner** | 1 | Owner (John Do) | Chạy pipeline PDF → content, commit vào repo |
| **Editor** | 2 | Giáo viên / người được cấp quyền | Import & chỉnh sửa từ vựng, gửi duyệt |
| **Admin** | 2 | Quản trị | Duyệt & publish nội dung, quản lý user/role, xem báo cáo admin |

> Phase 1: có đăng nhập, nhưng tiến độ học vẫn lưu local (IndexedDB, tách theo user). Đồng bộ tiến độ lên server ở Phase 2 (xem Open Q #8).

---

## 3. Quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Tên app | **Học Thai cùng Nôm** — logo: **placeholder** (owner bổ sung sau, mục 7.6) |
| Nền tảng UI | **Web desktop trước** (Phase 1–3). Chưa làm giao diện mobile; layout không vỡ trên màn hình nhỏ nhưng không tối ưu |
| Đối tượng | Người Việt, UI tiếng Việt |
| Kiến trúc Phase 1 | Static site (PWA) trên Azure SWA + **Firebase Auth** (Google; Facebook ở Phase 2). **Không database, không Azure Functions.** Tiến độ học **local-first** (ADR-01, ADR-02) |
| Database | **Phase 2** mới có; chọn ở đầu Phase 2 giữa Neon Postgres và Azure SQL (ADR-03) |
| LLM | **Claude API** (trích xuất PDF, AI tutor), qua interface `LlmProvider` |
| Đăng nhập | **Phase 1: Google** (milestone đầu tiên, mục 4.0). **Facebook chuyển sang Phase 2** (quyết định owner 2026-11-15) |
| Leaderboard | **Phase 2** |
| Số phase | **3** — Phase 3 chỉ gồm Lớp học / nhóm |
| Giáo trình | **Đã có sự đồng ý của giáo viên** để dùng trong app |
| Cloud | **Azure** (xem mục 8) |
| Repo & CI/CD | **GitHub** + **GitHub Actions** → Azure Static Web Apps |
| Nguồn nội dung | Giáo trình PDF của giáo viên → pipeline AI trích xuất → owner duyệt (mục 5) |
| Phiên âm | Phiên âm **không dấu**, thanh điệu hiển thị bằng **màu + ký hiệu riêng** |
| Audio Phase 1 | **Web Speech API** (`th-TH`) |
| Gõ chữ Thái | **Có** ở Phase 1, kèm bàn phím ảo |
| Analytics hành vi | **Không** (báo cáo admin ở Phase 2 chỉ dựa trên dữ liệu trong DB của app) |
| Import từ vựng bởi Editor | **Phase 2**, từ import dùng chung cho mọi học viên |
| Reporting | Learner: **Phase 1** (local). Admin: **Phase 2** |
| Progress visualization | **Mỗi module** có hiển thị tiến độ riêng (mục 4.9), Phase 1 |
| Ngôn ngữ | **TypeScript** cho app, API, validator, Tone Engine. **Python** chỉ cho pipeline trích xuất PDF (mục 7.0) |
| Testing | Vitest (unit/component) + **Playwright** (e2e, visual, a11y) — mục 7.4 |

### 3.1 Tiêu chí quyết định (áp dụng cho mọi lựa chọn kỹ thuật)

Mọi lựa chọn công nghệ/dịch vụ đánh giá theo 3 tiêu chí, theo thứ tự ưu tiên:

| # | Tiêu chí | Ý nghĩa cụ thể |
|---|---|---|
| **C1** | **Tối ưu chi phí** | Phase 1–2 mục tiêu ~$0/tháng (dùng free tier); chi phí khi tăng người dùng phải dự đoán được; không có phí cố định nếu chưa cần |
| **C2** | **Dễ phát triển thêm tính năng** | Thêm tính năng mới (sync, leaderboard, import, báo cáo, **lớp học Phase 3**, AI…) mà **không phải thiết kế lại** dữ liệu hay kiến trúc; truy vấn kiểu mới không đòi hỏi migrate dữ liệu lớn |
| **C3** | **Dễ maintain bằng AI agent** | Công nghệ phổ biến (nhiều ví dụ), cấu hình bằng code (IaC) thay vì bấm portal, có emulator/local để agent tự chạy test, lỗi được phát hiện sớm (type, constraint, test) |

Mỗi quyết định ghi thành ADR trong `docs/adr/` với: bối cảnh, phương án, chấm điểm C1–C3, quyết định, hệ quả.

### 3.2 Quyết định kiến trúc (ADR)

#### ADR-01 — Database: ✅ ĐÃ DUYỆT — Phase 1 không dùng database

- **Bối cảnh:** Phase 1 chỉ cần thông tin user (tên hiển thị, email, avatar, ngày tạo, lần đăng nhập cuối, provider đã liên kết). Firebase Auth đã lưu toàn bộ. Tiến độ học lưu local (IndexedDB).
- **Quyết định:** Phase 1 **không có database và không có Azure Functions**.
- **Hệ quả:** C1 = $0, không có server cần maintain; quyết định database hoãn tới khi yêu cầu Phase 2 (sync, leaderboard, import, báo cáo) rõ ràng → linh hoạt nhất (C2).

#### ADR-03 — Database Phase 2: ⏳ chốt ở đầu Phase 2 (M13)

Dữ liệu Phase 2–3 có nhiều quan hệ: user ↔ role; user ↔ thẻ ↔ log ôn; batch import ↔ item ↔ audit; lớp ↔ thành viên ↔ bài giao; báo cáo nhiều chiều.

| | **Neon Postgres** (free, có Azure Native Integration) | **Azure SQL** (serverless, free offer) | Cosmos DB (free tier) |
|---|---|---|---|
| **C1 Chi phí** | Free: 1 GB/project, 100 CU-giờ/tháng; tự tạm dừng sau 5 phút rảnh | Free trong giới hạn vCore-giây/tháng; tạm dừng → request đầu chậm vài chục giây | Free 1000 RU/s + 25 GB, không tạm dừng |
| **C2 Phát triển thêm** | **Tốt nhất**: quan hệ + JSONB | Tốt: quan hệ | Phải thiết kế trước theo mẫu truy vấn |
| **C3 AI maintain** | **Tốt nhất**: Postgres phổ biến nhất, ORM Drizzle/Prisma, test bằng container Postgres | Tốt | Trung bình |
| **Đề xuất sơ bộ** | ✅ Ưu tiên | Dự phòng nếu bắt buộc dịch vụ native Azure | Không đề xuất |

> Kiểm tra lại giá/free tier tại thời điểm chốt. Mọi truy cập DB qua repository + ORM có migration.

#### ADR-02 — Đăng nhập Google / Facebook: ✅ ĐÃ DUYỆT — Firebase Authentication

| | A. Microsoft Entra External ID | B. SWA Standard (auth tích hợp) | **C. Firebase Authentication** |
|---|---|---|---|
| **C1 Chi phí** | $0 tới 50.000 MAU | Phí cố định gói Standard | **$0** (Google/Facebook miễn phí tới 50.000 MAU, gói Spark không cần thẻ) |
| **C2 Phát triển thêm** | Tốt | Hạn chế: không liên kết tài khoản | **Tốt**: thêm Email link, Apple…; liên kết tài khoản |
| **C3 AI maintain** | Kém: cấu hình portal nhiều, MSAL phức tạp | Code đơn giản | **Tốt nhất**: SDK phổ biến, **Auth Emulator** để test E2E |
| **Cấu hình Azure** | Tenant external, app registration, user flow, IdP… | Gói Standard + custom provider | **Gần như không**: chỉ thêm config Firebase vào biến build của SWA |
| **Khác** | 100% Azure | 100% Azure | Ngoài Azure (Google) — chấp nhận |

- **Nguyên tắc:** Firebase **chỉ xác thực danh tính**. Từ Phase 2, **role, lớp học, quyền** lưu trong database của app (key = Firebase `uid`), không lưu trong custom claims → có thể đổi auth provider sau này.
- Phase 1 chỉ có Google; Guest mode cho người không muốn đăng nhập. Từ Phase 2 thêm Facebook → người học không bắt buộc có tài khoản Google. Chỉ owner cần tài khoản Google để quản lý Firebase project.

#### ADR-04 — LLM: ✅ ĐÃ CHỐT — Claude API

- Dùng **Claude API (Anthropic)** cho trích xuất PDF (vision: text + ảnh trang) và AI tutor Phase 2, qua interface `LlmProvider` (đổi được).
- API key: Phase 1 lưu ở máy owner (`.env`, không commit); Phase 2 lưu trong Azure Key Vault, chỉ Azure Functions gọi Claude (không gọi từ trình duyệt).
- Kiểm soát chi phí: giới hạn số trang/batch, cache kết quả trích xuất theo hash trang PDF, giới hạn lượt AI tutor/user/ngày.

---

## 4. Functional Requirements

Mỗi requirement có ID và phase. Agent chỉ implement requirement thuộc phase đang làm.

### 4.0 Module L — Đăng nhập (Phase 1: **Google**, ưu tiên số 1 · Phase 2: **Facebook**)

> **Quyết định 2026-11-15:** Facebook Login (và việc tạo Facebook App — SETUP S6) **chuyển sang Phase 2**. Code vẫn viết theo `AuthService` provider-agnostic để thêm Facebook không phải sửa UI/luồng. Các requirement chỉ liên quan Facebook ghi **(Phase 2)**.

#### Chức năng
- **L-01** Màn hình đăng nhập với nút **"Tiếp tục với Google"** (theo branding guideline Google). Nút **"Tiếp tục với Facebook"** thêm ở **Phase 2**, bật bằng feature flag `VITE_ENABLE_FACEBOOK_LOGIN` (Phase 1 = `false`, nút ẩn hoàn toàn).
- **L-02** Nút **"Học không cần đăng nhập"** (chế độ Guest) — không bắt buộc đăng nhập để học.
- **L-03** Lần đăng nhập đầu tiên Firebase tự tạo tài khoản (`name`, `email`, `photoURL` từ provider); người dùng xác nhận **tên hiển thị** → lưu bằng `updateProfile({ displayName })` (dùng cho leaderboard Phase 2).
- **L-04** **(Phase 2 — cần ≥ 2 provider)** **Liên kết tài khoản:** bật chế độ Firebase *"One account per email address"* → Google và Facebook cùng email được gộp (Firebase yêu cầu đăng nhập provider cũ để liên kết — UI hướng dẫn người dùng). `/account` cho liên kết / hủy liên kết provider (`linkWithPopup`, `unlink`). Facebook không trả email → vẫn tạo được tài khoản.
- **L-05** Phiên đăng nhập duy trì giữa các lần mở app (`browserLocalPersistence`); nút **Đăng xuất**.
- **L-06** Header hiển thị avatar + tên; menu: Tài khoản, Đăng xuất.
- **L-07** **Dữ liệu local tách theo user:** IndexedDB đặt tên theo Firebase `uid` (Guest dùng `guest`). Khi Guest đăng nhập lần đầu → hỏi "Chuyển tiến độ hiện tại vào tài khoản này?" → copy dữ liệu `guest` sang DB của user.
- **L-08** Trang `/account`: hồ sơ, provider đã liên kết, đổi tên hiển thị, **xóa tài khoản** (`user.delete()`, yêu cầu đăng nhập lại nếu phiên cũ) + xóa IndexedDB của user.
- **L-09** Offline: user đã đăng nhập trước đó vẫn vào app offline (Firebase cache phiên trong IndexedDB).
- **L-10** Ngày tạo & lần đăng nhập cuối lấy từ `user.metadata` của Firebase — Phase 1 không lưu thêm dữ liệu nào.

#### Yêu cầu bắt buộc từ Google / Facebook (phải làm trước khi go-live)
- **Trang Chính sách quyền riêng tư** (`/privacy`) và **Điều khoản** (`/terms`) public.
- **Facebook (Phase 2):** khai báo **Data Deletion Instructions URL** → trang `/account/delete-instructions` (Phase 1 không có backend nên dùng trang hướng dẫn, không dùng callback); App phải chuyển sang chế độ **Live**; chỉ xin quyền `public_profile`, `email` (không cần App Review cho 2 quyền này, nhưng cần **Business/App verification** theo yêu cầu hiện hành của Meta — kiểm tra khi đăng ký).
- **Google:** cấu hình **OAuth consent screen**, scope chỉ `openid email profile`; publish ở trạng thái *In production*.
- **Redirect URI** khai báo với Google & Facebook: `https://<firebase-project>.firebaseapp.com/__/auth/handler` (domain của Google → **chưa cần domain riêng**).
- **Phase 1** dùng domain mặc định `*.azurestaticapps.net`; consent screen Google **không upload logo** (tránh bắt buộc brand verification với domain không sở hữu); chỉ dùng scope cơ bản `openid email profile`. **Phase 2** mua domain riêng → cập nhật redirect URI, authorized domains, URL privacy/terms trên Google & Meta.
- Facebook App và Google Cloud project đứng tên **tài khoản cá nhân** của owner.

#### Kỹ thuật
- **Auth:** **Firebase Authentication** (gói Spark). Phase 1 bật provider **Google**; **Facebook** bật ở Phase 2 (nhập App ID/Secret của Facebook App vào Firebase console).
- **Frontend:** Firebase JS SDK v9+ (modular, `firebase/auth`); bọc trong `AuthService` interface (`signInWithGoogle`, `signInWithFacebook`, `signOut`, `onUserChanged`, `updateDisplayName`, `deleteAccount`, `link/unlink`) → UI không gọi Firebase trực tiếp, đổi provider sau này chỉ sửa 1 chỗ.
- **Kiểu đăng nhập:** **`signInWithPopup`** ở Phase 1 (luồng redirect dễ lỗi trên trình duyệt chặn third-party storage khi app và `firebaseapp.com` khác domain). Phase 2 có domain riêng → cân nhắc **tự host file helper `/__/auth/`** trên SWA rồi chuyển sang redirect.
- **Authorized domains (Firebase):** domain production `*.azurestaticapps.net` của app + `localhost`. Preview theo PR có domain thay đổi → **không** đăng nhập thật trên preview; dùng Auth Emulator.
- **Config:** Firebase web config (apiKey, authDomain, projectId…) **không phải secret** → biến build `VITE_FIREBASE_*`. Giới hạn API key theo HTTP referrer trong Google Cloud Console.
- **Phase 2 (API):** Azure Functions xác thực request bằng `firebase-admin` `verifyIdToken()` (chỉ cần `projectId`); bảng `users` dùng Firebase `uid` làm khóa.
- **Firebase project & Google Cloud project:** đứng tên tài khoản Google **cá nhân** của owner.

### 4.1 ⛔ Module A — Bảng chữ cái & Tone Trainer (BỎ ở v7, xem 0.2)

> ⛔ **Không implement.** Giữ để truy vết.

#### Học chữ
- **A-01** 44 phụ âm, nhóm theo lớp (Trung / Cao / Thấp); mỗi chữ: chữ Thái, tên chữ (vd. ก ไก่), âm đầu, âm cuối, phiên âm, nghĩa từ khóa, audio.
- **A-02** Nguyên âm (ngắn/dài), vị trí quanh phụ âm, dùng placeholder `–`.
- **A-03** 4 dấu thanh (่ ้ ๊ ๋) và 5 thanh (mid, low, falling, high, rising) kèm đường cao độ (SVG tĩnh). Mỗi thanh có **màu + ký hiệu** cố định dùng xuyên suốt app.
- **A-04** Ghi chú so sánh gần đúng với thanh tiếng Việt (nội dung do owner soạn).
- **A-05** Chạm để phát audio.

#### Luyện chữ
- **A-10** Flashcard: chữ → âm/lớp; âm → chữ.
- **A-11** Quiz phân loại lớp phụ âm.
- **A-12** Thẻ chữ cái đưa vào SRS chung.

#### Tone Trainer
- **A-20** Input: âm tiết **đã được phân tích sẵn** trong content (không parse văn bản tự do).
- **A-21** Hiển thị từng bước: lớp phụ âm (xét ห นำ / อ นำ) → sống/chết → dấu thanh → kết quả.
- **A-22** Chế độ luyện: người học chọn đáp án từng bước, sai bước nào báo bước đó.
- **A-23** Bảng quy tắc tham chiếu nhanh.
- **A-24** Engine là pure function, unit test đầy đủ (mục 6).

### 4.2 Module B — Từ vựng & SRS (Phase 1)

> **v7:** bộ từ = từ của Unit/Lesson (0.3, 0.4); bỏ trường thanh/âm tiết bắt buộc; "Ôn tập" đổi thành **Bài tập** (Module E, 0.5) — thẻ gồm cả **từ và câu**; B-07 bỏ; phiên âm ẩn mặc định.
- **B-01** Bộ từ theo chủ đề / theo bài của giáo trình, thứ tự do owner định nghĩa.
- **B-02** Mỗi từ: chữ Thái, phiên âm, âm tiết, thanh từng âm tiết, nghĩa Việt, loại từ, câu ví dụ (tùy chọn), audio, tags, `source` (bài/trang trong giáo trình).
- **B-03** Học N từ mới/ngày (mặc định 10).
- **B-04** Ôn tập bằng **FSRS** (`ts-fsrs`), 4 nút Again / Hard / Good / Easy.
- **B-05** Loại thẻ:
  - Thai → nghĩa Việt (trắc nghiệm hoặc tự đánh giá)
  - Nghĩa Việt → Thai (trắc nghiệm **hoặc gõ chữ Thái** — xem G-06)
  - Audio → nghĩa
  - Audio → **gõ chữ Thái** (chính tả)
- **B-06** Dashboard: thẻ đến hạn, thẻ mới, streak.
- **B-07** Mở khóa mềm: gợi ý học chữ cái trước, nhưng cho phép mở thủ công.

### 4.3 Module C — Đọc & tra từ (Phase 1)

> **v7:** không có route `/reading` riêng ở Phase 1; tra từ (C-02, C-03, C-04, C-06, C-07) dùng trong bước **Hội thoại** của bài học. Bài đọc dài theo cấp độ → Phase 2.
- **C-01** Bài đọc theo cấp độ (1–5).
- **C-02** Tách từ bằng `Intl.Segmenter('th', { granularity: 'word' })`; override bằng `|` trong content.
- **C-03** Click từ → **panel bên phải** (desktop, không che văn bản): chữ Thái, phiên âm, nghĩa, thanh, audio, "Thêm vào SRS". Giới hạn số từ mới thêm vào SRS từ mỗi bài (mặc định 10, chỉnh trong Settings) để hàng đợi ôn không phình to.
- **C-04** Từ ngoài lexicon → "Chưa có trong từ điển".
- **C-05** Tô màu theo trạng thái: chưa học / đang học / đã thuộc.
- **C-06** Toggle phiên âm, toggle bản dịch câu.
- **C-07** Phát audio cả câu.

### 4.4 ⛔ Module D — Quiz nghe thanh điệu (BỎ ở v7; nghe hiểu câu = E-08)

> ⛔ **Không implement.**
- **D-01** Nghe 1 âm tiết → chọn 1 trong 5 thanh.
- **D-02** Cặp tối thiểu: nghe → chọn từ đúng trong 2–4 từ chỉ khác thanh.
- **D-03** Chính tả: nghe → chọn chữ đúng, hoặc **gõ** (G-06).
- **D-04** Lưu tỉ lệ đúng theo thanh (dùng cho R-04).

### 4.5 Module R — Reporting

#### R1. Báo cáo cá nhân cho Learner (Phase 1, dữ liệu local)

> **v7:** dùng R-01', R-02', R-04' theo mục 0.8; ⛔ R-04 thanh điệu bỏ.
- **R-01** Tổng quan: số chữ cái đã thuộc / 44, số từ đã học / tổng, số bài đọc đã hoàn thành.
- **R-02** Hoạt động: heatmap số lượt ôn theo ngày (kiểu GitHub contribution), streak hiện tại & dài nhất, tổng thời gian học (ước tính theo phiên).
- **R-03** Trí nhớ: tỉ lệ nhớ đúng (retention) 7/30 ngày, phân bố thẻ theo trạng thái FSRS (New / Learning / Review / Relearning).
- **R-04** Thanh điệu: tỉ lệ đúng theo từng thanh (Quiz nghe + Tone Trainer), "thanh hay nhầm nhất", ma trận nhầm lẫn (nghe A chọn B).
- **R-05** Dự báo: số thẻ đến hạn 7/30 ngày tới.
- **R-06** Từ khó: top 20 từ có số lần "Again" cao nhất, có nút ôn riêng nhóm này.
- **R-07** Tiến độ theo giáo trình: % hoàn thành từng bài/bộ từ.
- Yêu cầu kỹ thuật: tính toán từ `reviewLogs`, `listeningStats`, `sessions` trong IndexedDB; không gửi dữ liệu ra ngoài.

#### R2. Báo cáo Admin (Phase 2, dữ liệu server)
- **R-20** Số học viên: tổng đăng ký, mới theo ngày/tuần/tháng.
- **R-21** Học viên hoạt động: DAU / WAU / MAU (định nghĩa "hoạt động" = có ≥ 1 lượt ôn/học trong kỳ).
- **R-22** Retention cohort: % học viên còn hoạt động sau 1 / 7 / 30 ngày kể từ đăng ký.
- **R-23** Phân bố tiến độ: số học viên theo mốc (đang học chữ cái / đã xong chữ cái / > 100 từ / > 300 từ…).
- **R-24** Nội dung: từ bị sai nhiều nhất toàn hệ thống, bộ từ/bài đọc ít được học (giúp giáo viên điều chỉnh).
- **R-25** Bộ lọc thời gian, xuất CSV.
- Chỉ role **Admin** truy cập. Không hiển thị thông tin cá nhân chi tiết của từng học viên ở dashboard tổng (xem Open Q #4).

### 4.6 Module M — Quản lý nội dung & Import từ vựng (Phase 2)
- **M-01** Editor upload file **CSV/XLSX** theo template chuẩn (tải template từ app).
- **M-02** Editor upload **PDF** → hệ thống trích xuất tự động (mục 5.3) → ra danh sách từ ở trạng thái *Draft*.
- **M-03** Màn hình review: bảng có thể sửa từng ô, highlight lỗi validate (thiếu trường, thanh không khớp Tone Engine, **trùng từ đã có**).
- **M-04** Xử lý trùng: với từ trùng chữ Thái đã có → chọn *Bỏ qua* / *Gộp nghĩa* / *Ghi đè* (Ghi đè chỉ Admin).
- **M-05** Workflow: `Draft` → `Pending review` → `Published` (Admin duyệt) hoặc `Rejected`. Admin có thể tự publish.
- **M-06** Chỉ từ `Published` mới hiển thị cho Learner; từ mới xuất hiện trong bộ từ tương ứng ở lần mở app kế tiếp.
- **M-07** Audit log: ai import, khi nào, file nguồn nào, thay đổi gì.
- **M-08** Unpublish / rollback một batch import.
- **M-09** Nội dung gốc (Phase 1, trong repo) và nội dung import (Phase 2, trong DB) được **merge** theo `id`; DB ưu tiên khi trùng.

### 4.7 Module U — Phân quyền & đồng bộ (Phase 2)
> Đăng nhập, Guest mode và xóa tài khoản đã chuyển lên Phase 1 (mục 4.0).
- **U-02** Phân quyền Learner / Editor / Admin; Admin gán role (lưu bảng `user_roles` trong database, API tra role theo Firebase `uid` — không dùng custom claims).
- **U-03** Đồng bộ tiến độ đa thiết bị; vẫn dùng được offline, sync khi có mạng (last-write-wins theo `updatedAt` cho từng record).
- **U-04** Lần sync đầu tiên: đẩy toàn bộ dữ liệu local của user lên server; nếu server đã có dữ liệu từ thiết bị khác → merge theo `updatedAt`.

### 4.10 Module E — Engagement & Leaderboard (Phase 2)
- **E-01** **XP**: cộng điểm theo hoạt động (vd. ôn 1 thẻ = 1 XP, học từ mới = 2 XP, hoàn thành bài đọc = 10 XP, quiz nghe đúng = 1 XP). Bảng điểm cấu hình trong `packages/core`.
- **E-02** **Leaderboard**: xếp hạng theo XP **tuần** (reset thứ Hai 00:00 giờ Việt Nam) và **toàn thời gian**; hiển thị top 50 + vị trí của bản thân.
- **E-03** Chỉ user đã đăng nhập mới lên bảng; dùng **tên hiển thị + avatar**, không hiển thị email.
- **E-04** **Opt-out**: user có thể ẩn khỏi leaderboard trong `/account`.
- **E-05** Chống gian lận cơ bản: XP tính **trên server** từ review log đã sync (không tin số XP client gửi); giới hạn XP/ngày hợp lý; bỏ qua log có timestamp bất thường.
- **E-06** Huy hiệu (badge): hoàn thành bảng chữ cái, streak 7/30/100 ngày, 100/500 từ đã thuộc…
- **E-07** Nhắc học: Web Push (người dùng cho phép) theo giờ chọn trong Settings.
- Phụ thuộc: **U-03 (sync)** phải xong trước E-02.

### 4.11 Module S — Nói, AI & nâng cao (Phase 2)
- **S-01** TTS Azure AI Speech: sinh mp3 sẵn cho toàn bộ từ/câu, lưu Blob + CDN; `AzureSpeechProvider`.
- **S-02** Chấm phát âm (Azure Pronunciation Assessment `th-TH`): ghi âm từ/câu, chấm điểm, chỉ ra âm tiết sai.
- **S-03** AI tutor hội thoại theo tình huống (đi chợ, taxi, gọi món), sửa lỗi và giải thích bằng tiếng Việt; gọi LLM qua Azure Function proxy.
- **S-04** Sinh bài đọc theo vốn từ người học (chỉ dùng từ đã học + ít từ mới).
- **S-05** Tone Trainer nhận văn bản tự do: parse âm tiết tự động (PyThaiNLP / quy tắc), người học nhập từ bất kỳ.

### 4.12 Module K — Lớp học / nhóm (Phase 3)
- **K-01** Role **Teacher** (có thể trùng Editor): tạo lớp (tên, mô tả, giáo trình/bộ từ áp dụng).
- **K-02** Mời học viên bằng **mã lớp / link mời**; học viên tham gia nhiều lớp được; giáo viên duyệt hoặc tự động chấp nhận.
- **K-03** Giao bài: chọn bộ từ / bài đọc / quiz nghe + hạn hoàn thành; học viên thấy mục "Bài được giao" trên Dashboard.
- **K-04** Báo cáo theo lớp: tiến độ từng học viên trong lớp (mức thuộc, % hoàn thành bài giao, hoạt động 7 ngày), từ cả lớp hay sai. Học viên được thông báo rằng giáo viên của lớp xem được tiến độ của mình khi tham gia lớp.
- **K-05** Leaderboard theo lớp (dùng lại E-02, lọc theo lớp).
- **K-06** Rời lớp / xóa học viên khỏi lớp; lưu trữ (archive) lớp đã kết thúc.
- Phụ thuộc: U-02 (roles), U-03 (sync), E-02 (leaderboard), R-20.. (hạ tầng báo cáo).
- Dữ liệu: `classes`, `class_members (class_id, user_id, role, joined_at)`, `class_assignments`, `class_invites`.

### 4.13 Module V — Hình ảnh & mẹo nhớ (Phase 1)

> **v7:** ⛔ V-01, V-06 và minh họa 44 phụ âm (V-05 Phase 2) bị bỏ. V-02..V-04, V-07 giữ cho **từ vựng**.

Nguyên tắc: **mọi thẻ học đều có hình** (khi có thể) và **mẹo nhớ**. Hình là phần "tượng hình" chính của app.

- **V-01** Mỗi phụ âm hiển thị: chữ, **hình từ khóa** (vd. ก ไก่ → con gà, ข ไข่ → quả trứng, ค ควาย → con trâu), **mẹo nhớ hình dạng** bằng tiếng Việt (vd. "ก giống cổ con gà cong xuống").
- **V-02** Mỗi từ vựng có thể có hình (owner chọn trong content); từ trừu tượng không bắt buộc có hình.
- **V-03** Flashcard có 3 lớp, hiện dần: **hình → chữ Thái → nghĩa/phiên âm**; chế độ "Hình → Thai" cho phép đoán chữ từ hình.
- **V-04** Mẹo nhớ hiển thị ở mặt sau thẻ; nút **"Viết mẹo nhớ của tôi"** → lưu local (Phase 2 sync), ưu tiên hiển thị mẹo của người học.
- **V-05** Hình minh họa dùng **một phong cách thống nhất**:
  - **Phase 1:** bộ emoji/icon **Noto Emoji** (Google, giấy phép Apache 2.0, self-host SVG) cho các đối tượng cụ thể (con vật, đồ vật, đồ ăn…). Chi phí $0, đồng bộ phong cách.
  - **Phase 2:** bộ minh họa riêng cho 44 phụ âm (vẽ lồng hình dạng chữ vào hình ảnh), tạo bằng AI theo cùng style guide rồi owner duyệt; lưu Blob Storage.
- **V-06** Thanh điệu cũng "tượng hình": **đường cao độ (pitch contour)** cho từng thanh, kèm ví dụ liên tưởng tiếng Việt (A-04).
- **V-07** Nội dung hình & mẹo nhớ do owner soạn trong content (mục 5.5: trường `image`, `mnemonic_vi`); Claude có thể **đề xuất mẹo nhớ** để owner duyệt (script tùy chọn, dùng Claude API).

### 4.14 Module F — Trò chơi (Phase 1: 3 trò lõi; Phase 2: thêm)

> **v7:** ⛔ F-02, F-03, F-04 bỏ; Phase 1 = F-01 + F-02' + F-03' (mục 0.6). F-10..F-14 giữ nguyên, nguồn câu hỏi là từ **và câu** đã học.

Mục tiêu: **vui nhờ cơ chế chơi** (thời gian, combo, âm thanh phản hồi, kỷ lục cá nhân), không nhờ hoạt hình/mascot. Mỗi lượt chơi **1–3 phút**, chơi được bằng bàn phím.

| ID | Trò chơi | Luyện gì | Phase |
|---|---|---|---|
| **F-01** | **Ghép cặp (Memory)**: lật thẻ tìm cặp chữ ↔ hình / chữ ↔ âm | Nhận diện chữ cái, từ | 1 |
| **F-02** | **Phân loại nhanh**: chữ rơi xuống, bấm `←` `↓` `→` để đưa vào nhóm Trung / Cao / Thấp trong thời gian giới hạn | Lớp phụ âm (nền tảng của thanh điệu) | 1 |
| **F-03** | **Ghép âm tiết**: kéo/chọn phụ âm + nguyên âm + dấu thanh để tạo âm tiết được đọc lên | Cấu tạo âm tiết, thanh điệu | 1 |
| **F-04** | **Săn thanh điệu**: nghe → chọn thanh (`1–5`), chuỗi đúng liên tiếp tăng combo | Nghe thanh | 1 |
| F-05 | Gõ nhanh: từ hiện ra, gõ bằng bàn phím Thái (ảo/vật lý) | Gõ & chính tả | 2 |
| F-06 | Bingo đọc: nghe từ, tìm trên bảng 4×4 | Đọc nhanh | 2 |
| F-07 | Thử thách ngày: 1 lượt chơi hỗn hợp mỗi ngày, cùng đề cho mọi người (gắn leaderboard) | Tổng hợp | 2 |

- **F-10** Nguồn câu hỏi lấy từ **những gì người học đã học** (chữ/từ đã mở khóa), ưu tiên mục đang yếu (theo SRS & thống kê).
- **F-11** Kết thúc lượt: điểm, độ chính xác, **kỷ lục cá nhân**, danh sách mục sai → nút "Ôn các mục sai".
- **F-12** **Trò chơi không thay đổi lịch ôn FSRS** (tránh làm sai dữ liệu SRS); chỉ ghi thống kê, đánh dấu mục sai là "cần ôn" và (Phase 2) tính XP.
- **F-13** Âm thanh phản hồi ngắn, nhẹ (bật/tắt trong Settings); hiệu ứng chuyển động tối thiểu, tôn trọng `prefers-reduced-motion`.
- **F-14** Mỗi trò chơi là **module độc lập** theo cùng interface `Game` (`generateRound`, `score`, `summary`) → thêm trò mới không sửa phần khác (C2).

### 4.8 Chung
- **G-01** Settings: số từ mới/ngày, hiện phiên âm mặc định, tốc độ audio, giọng TTS, bật/tắt loại thẻ gõ.
- **G-02** Export / Import tiến độ ra JSON (Phase 1; vẫn giữ ở Phase 2).
- **G-03** PWA, dùng offline sau lần tải đầu.
- **G-04** **Desktop-first**: thiết kế & test cho màn hình ≥ 1280px; hỗ trợ tối thiểu 1024px. Mobile chưa nằm trong scope (chỉ đảm bảo không vỡ layout nghiêm trọng).
- **G-05** Font Thái self-host **Sarabun** (v7.4: kiểu chữ Thái **có đầu tròn** phổ thông, giống giáo trình/sách; không dùng kiểu không đầu tròn như Noto Sans Thai), dấu hiển thị đúng vị trí.
- **G-06** **Gõ chữ Thái** (Phase 1):
  - Bàn phím ảo layout **Kedmanee** (chuẩn Thái), có thể ẩn/hiện; trên desktop hiển thị dưới ô nhập, hỗ trợ cả click chuột và bàn phím vật lý (map phím theo layout Kedmanee khi người dùng chưa cài bàn phím Thái).
  - Vẫn nhận input từ bàn phím Thái của hệ điều hành nếu người dùng đã cài.
  - **Chuẩn hóa trước khi so sánh**: Unicode NFC; quy đổi `ํ + า` ↔ `ำ`; sắp xếp lại thứ tự nguyên âm trên/dưới và dấu thanh (người dùng có thể gõ dấu thanh trước nguyên âm trên).
  - Chấm điểm: đúng hoàn toàn / sai dấu thanh / sai chữ — hiển thị chỗ sai (diff theo ký tự).

### 4.9 Module P — Progress visualization theo module (Phase 1)

> **v7:** ⛔ P-02 `MasteryGrid`, P-03 `HeatmapTable`, P-07 `ToneBarChart`, màu 5 thanh bị bỏ. P-06 chuyển Phase 2. Thêm P-10..P-12 (mục 0.8). Component còn dùng: `ProgressRing`, `StackedProgressBar`, + mới `UnitPath`, `CanDoList`, `SkillBars`.

Mỗi module hiển thị tiến độ **ngay trong module** (không chỉ ở trang `/progress`). Dùng chung bộ component và một định nghĩa mức độ thuộc.

#### Định nghĩa mức độ thuộc (dùng thống nhất toàn app)
| Mức | Điều kiện (dựa trên FSRS) | Màu |
|---|---|---|
| Chưa học | Chưa có card | nền trống, viền xám |
| Đang học | state = Learning / Relearning | accent sắc độ 1 (rất nhạt) |
| Đang nhớ | state = Review, stability < 21 ngày | accent sắc độ 2 |
| Đã thuộc | state = Review, stability ≥ 21 ngày | accent sắc độ 3 (đậm) |

> Ngưỡng 21 ngày cấu hình được trong `packages/core`. Các item không dùng SRS (bài đọc, quiz) có định nghĩa riêng bên dưới.

#### Theo module
| ID | Module | Hiển thị |
|---|---|---|
| **P-01** | Header mọi module | Vòng tròn % hoàn thành của module + số item theo 4 mức |
| **P-02** | Bảng chữ cái | **Lưới 44 phụ âm / nguyên âm / dấu**, mỗi ô tô màu theo mức thuộc; chạm ô → lịch sử ôn của chữ đó |
| **P-03** | Tone Trainer | **Bảng quy tắc (mục 6.3) dạng heatmap**: mỗi ô = tỉ lệ đúng của người học với quy tắc đó; ô yếu có nút "Luyện quy tắc này" |
| **P-04** | Từ vựng | Mỗi bộ từ có **thanh tiến độ xếp chồng** (4 mức); trang bộ từ có danh sách từ kèm chấm màu trạng thái |
| **P-05** | Ôn SRS | Trong phiên: thanh "còn X thẻ"; cuối phiên: tóm tắt đúng/sai, số thẻ chuyển mức |
| **P-06** | Đọc | Mỗi bài: trạng thái (chưa đọc / đã đọc / đã hoàn thành) + **% từ trong bài đã biết**; cấp độ có thanh tiến độ |
| **P-07** | Quiz nghe | **Biểu đồ cột tỉ lệ đúng theo 5 thanh** (màu theo thanh) + xu hướng 7 ngày |
| **P-09** | Trò chơi | Kỷ lục cá nhân từng trò, độ chính xác theo nhóm chữ/thanh, số mục "cần ôn" sinh ra từ trò chơi |
| **P-08** | Dashboard | Tổng hợp các vòng tròn module + mục tiêu ngày (vd. 20 thẻ) dạng thanh tiến độ |

#### Yêu cầu kỹ thuật
- Component dùng chung: `ProgressRing`, `StackedProgressBar`, `MasteryGrid`, `HeatmapTable`, `ToneBarChart` (trong `apps/web/src/components/progress/`).
- Mọi số liệu tiến độ tính bằng **selector thuần** trong `packages/core/progress` (input: cards, logs, content → output: số liệu), có unit test.
- Màu 5 thanh và 4 mức thuộc lấy từ một file design token duy nhất; đảm bảo phân biệt được với người mù màu (kèm ký hiệu/nhãn, không chỉ màu).
- Cập nhật realtime sau mỗi lượt ôn (Dexie live query).

---

## 5. Content — Nguồn PDF & định dạng

### 5.1 Thực tế nguồn
- Giáo trình **PDF do giáo viên biên soạn**, format không cố định nhưng có thể nhận diện (bài học, bảng từ, ví dụ).
- Rủi ro chính với PDF tiếng Thái:
  1. **PDF scan (ảnh)** → cần OCR, OCR tiếng Thái hay sai dấu thanh/nguyên âm trên-dưới.
  2. **PDF dùng font Thái cũ (non-Unicode)** → copy text ra bị ký tự rác hoặc dấu sai thứ tự.
  3. **Bảng biểu bị vỡ** khi trích text (cột Thái / phiên âm / nghĩa lẫn vào nhau).
  4. Phiên âm của giáo viên có thể khác quy ước của app.
- **Bản quyền:** cần sự đồng ý của giáo viên để dùng giáo trình trong app (đặc biệt khi public).

### 5.2 Gợi ý để PDF dễ cho AI xử lý (gửi giáo viên nếu được)
Theo thứ tự hiệu quả giảm dần:
1. **Tốt nhất:** xin **file gốc** (Word / Google Docs / Excel) thay vì PDF.
2. Nếu chỉ có PDF: PDF **xuất từ Word** (text chọn được), không phải bản scan; dùng font Unicode (Sarabun, Noto Sans Thai, Tahoma, Leelawadee…).
3. Mỗi bài có **tiêu đề nhất quán**, vd. `Bài 3: Gia đình`.
4. Từ vựng đặt trong **bảng** với cột cố định: `Thai | Phiên âm | Nghĩa | Ghi chú`.
5. Câu ví dụ đặt ngay dưới từ hoặc trong bảng riêng có tiêu đề `Ví dụ`.
6. Không gộp ô (merge cell), không đặt chữ Thái trong ảnh.

> **Bước tiếp theo:** owner gửi 1–2 trang PDF mẫu để đánh giá loại PDF (text hay scan, font) và chốt prompt trích xuất.

### 5.3 Pipeline trích xuất PDF → content

> **v7.1 (theo PDF mẫu, 0.11):** PDF giáo viên là **ảnh, không có text** → luôn đi nhánh 2b: render trang PNG 200 dpi (`pypdfium2`) → **Claude vision** trích xuất theo schema v7 (prompt nêu rõ: bỏ watermark chéo, logo, header/footer "Tiếng Thái Thạc Sĩ Plern-Pin / ZALO…"; giữ nguyên chữ Thái; tách `thai: nghĩa`; nhận diện 2 bố cục `table-classifier` và `list-grammar+exercise`). **Không cần Document Intelligence** (C1). Bước 5 **bỏ Tone Engine** (đóng băng), chỉ `content:check`. Output: `staging/words.<nguồn>.csv`, `staging/sentences.<nguồn>.csv`, `staging/grammar.<nguồn>.yaml` + report. Bước tùy chọn `--suggest` (0.11 #7) điền nghĩa/loại từ/bản dịch còn thiếu, đánh dấu `suggested_by: claude`. Chi phí ước tính: 19 trang mẫu ~ vài chục cent (Sonnet). Golden test: chạy local trên `sources/` (CI không có PDF) + CI dùng **response Claude ghi sẵn** cho 1 trang mỗi bố cục.


**Phase 1 — chạy local bằng script Python (owner chạy), thư mục `tools/pdf-pipeline/`**
```
PDF ──► [1. Detect] text-based hay scan?
          │ text-based               │ scan
          ▼                          ▼
   [2a. Extract text + layout]  [2b. Render trang → ảnh]
          │                          │
          └──────────┬───────────────┘
                     ▼
   [3. LLM structured extraction]  (text + ảnh trang → JSON theo schema 5.5)
                     ▼
   [4. Normalize] Unicode NFC, sửa thứ tự dấu, chuẩn phiên âm
                     ▼
   [5. Validate] Zod + Tone Engine + check trùng
                     ▼
   [6. Xuất staging/words.<pdf>.csv + report lỗi] ──► owner review trong Excel ──► merge vào content/
```
- Bước 1–4, 6 viết bằng **Python** (PyMuPDF / pdfplumber, PyThaiNLP để hỗ trợ tách âm tiết & chuẩn hóa). Bước 5 **gọi validator TypeScript** (`pnpm content:check --input staging/...`) để Tone Engine chỉ có một bản implement duy nhất.
- Bước 3 gửi **cả text lẫn ảnh trang** cho model đa phương thức (vision) để tự đối chiếu, giảm lỗi dấu thanh. Model: **Claude** (qua Anthropic API, hỗ trợ ảnh) — ADR-04.
- Có thể thay bước 2 bằng **Azure AI Document Intelligence** (model *Layout*) để lấy bảng chuẩn, rồi mới đưa vào LLM.
- Mỗi dòng output có `source: "<file>#p<page>"` và `confidence` (low/medium/high); dòng low được đánh dấu để owner kiểm tra trước.
- Tone Engine tự tính thanh cho từng âm tiết: **nếu khác với dữ liệu trích xuất → gắn cờ** (bắt lỗi OCR/LLM rất hiệu quả).
- Script idempotent: chạy lại cùng PDF không tạo bản trùng (key = chữ Thái + nghĩa chính).

**Phase 2 —** cùng pipeline, chạy trên **Azure Functions (Python runtime, Function App riêng)** khi Editor upload PDF; bước validate gọi API validate của Function App TypeScript (M-02); kết quả vào bảng `import_items` trạng thái `Draft`.

### 5.4 Cấu trúc thư mục content (Phase 1)
> **v7 (M6):** thay bằng **mục 0.9**. `content/` gồm 6 file ở gốc (`units.csv`, `lessons.csv`, `words.csv`, `sentences.csv`, `grammar.yaml`, `dialogues.yaml`), mẫu + hướng dẫn ở `content/templates/`. Cây thư mục dưới đây (alphabet/, vocab/, readings/, listening/) đã bỏ.

```
content/
  alphabet/   consonants.yaml  vowels.yaml  tone-marks.yaml  tones.yaml  tone-drills.yaml
  vocab/      decks.yaml  words.csv
  readings/   lvl1-001-chao-hoi.yaml ...
  listening/  minimal-pairs.yaml
  audio/      (tùy chọn) <id>.mp3
sources/      (gitignore) PDF gốc
staging/      (gitignore) output của pipeline chờ review
scripts/      content-check.ts  build-content.ts
tools/pdf-pipeline/   (Python) extract.py  normalize.py  prompts/  tests/
```

### 5.5 Schema (implement bằng Zod, dùng chung cho Phase 1 build và Phase 2 API)
> **v7 (M6):** schema dùng là `Unit`, `Lesson`, `Word`, `Sentence`, `Grammar`, `Dialogue` (mục 0.9, `packages/core/src/schema/`). Bảng `words.csv` cũ dưới đây (`deck`, `syllables`, `tones`) và Reading/MinimalPair đã bỏ; schema chữ cái chỉ còn cho Tone Engine đóng băng.


**Word (`words.csv`)**

| cột | bắt buộc | ví dụ | ghi chú |
|---|---|---|---|
| id | ✔ | `sawatdee` | duy nhất, ascii kebab |
| thai | ✔ | `สวัสดี` | |
| phonetic | ✔ | `sa-wat-di` | không dấu (quy ước app) |
| syllables | ✔ | `ส\|วัส\|ดี` | |
| tones | ✔ | `low\|low\|mid` | = số âm tiết |
| meaning_vi | ✔ | `xin chào` | nhiều nghĩa ngăn `;` |
| pos | | `interj` | |
| deck | ✔ | `bai-01` | id trong decks.yaml |
| example_th / example_vi | | | |
| tags | | `polite;common` | |
| source | | `giao-trinh-a.pdf#p12` | truy vết |
| image | | `noto:1f44b` hoặc `img/sawatdee.svg` | emoji Noto (mã Unicode) hoặc file hình |
| mnemonic_vi | | | mẹo nhớ (tùy chọn) |

**Consonant, Syllable analysis, Reading** — giữ như sau:
```yaml
# consonant
- { id: ko-kai, char: ก, name: ก ไก่, class: mid, initial: k, final: k, phonetic: "k", keyword_vi: "con gà", image: "noto:1f414", mnemonic_vi: "ก giống cổ con gà cong xuống", order: 1 }

# syllable analysis (tone-drills.yaml)
- { id: mai-1, thai: ไม่, initial_char: ม, leading: null, vowel_length: short,
    final_sound: y, tone_mark: ek, expected_tone: falling }   # ไ– = a ngắn + y (6.2)
- { id: sawat-2, thai: วัส, initial_char: ว, leading: ส, vowel_length: short,
    final_sound: t, tone_mark: null, expected_tone: low }      # อักษรนำ: ว theo lớp của ส (6.1)

# reading
id: lvl1-001
title_vi: "Chào hỏi"
level: 1
sentences:
  - { th: "สวัสดี|ครับ", vi: "Xin chào (nam nói)" }
```

### 5.6 Validator (`npm run content:check`, chạy trong CI)
> **v7 (M6):** quy tắc hiện hành ở ROADMAP T6.4: id duy nhất, khóa ngoại unit/lesson/grammar, `tokens` ghép = `th`, `distractors` ∉ `tokens`, `th_alt` ≠ `th`, ký tự ngoài bảng Thái (lỗi); cảnh báo cấu trúc bài (0.4) và `draft`. Kiểm tra Tone Engine/lexicon bài đọc dưới đây đã bỏ.

- Schema, id duy nhất, `deck` tồn tại, `syllables`/`tones` cùng độ dài.
- `computeTone()` khớp `expected_tone` / `tones`.
- Cảnh báo: ký tự ngoài bảng Thai Unicode (U+0E00–U+0E7F) trong trường `thai`; từ trong bài đọc chưa có trong lexicon.

---

## 6. Tone Engine — Spec

> **v7: đóng băng.** Code + test giữ nguyên trong `packages/core`, không UI nào dùng, không phát triển thêm (mục 0.2).

Pure TypeScript, dùng chung frontend, scripts và (Phase 2) Azure Functions.

### 6.1 Lớp phụ âm
- **Mid (9):** ก จ ฎ ฏ ด ต บ ป อ
- **High (11):** ข ฃ ฉ ฐ ถ ผ ฝ ศ ษ ส ห
- **Low (24):** còn lại
- **ห นำ** (ห + ง ญ น ม ย ร ล ว) → **High**. **อ นำ** (อย่า, อยู่, อย่าง, อยาก) → **Mid**.
- **อักษรนำ tổng quát** *(bổ sung 2026-11-16)*: phụ âm **cao hoặc trung** (vd. ส ข ต จ ก ป ผ ฉ ถ) đứng trước phụ âm **thấp đơn** (ง ญ ณ น ม ย ร ล ว ฬ) và **giữa hai chữ có nguyên âm อะ ẩn** → đọc thành 2 âm tiết:
  1. Âm tiết 1 = phụ âm dẫn + อะ ẩn → âm tiết **chết, ngắn** → thanh theo lớp phụ âm dẫn (thường **low**).
  2. Âm tiết 2 (bắt đầu bằng phụ âm thấp đơn) **tính thanh theo lớp của phụ âm dẫn**, không theo lớp thấp của chính nó.
  - Ví dụ: สวัสดี *sà-wàt-dii* (วัส theo ส → high, chết ngắn → **low**); สนุก *sà-nùk* (→ **low**); ขนม *khà-nǒm* (นม theo ข → high, sống → **rising**); ตลาด *tà-làat* (ลาด theo ต → mid, chết → **low**); อร่อย *à-ròi* (ร่อย theo อ → mid + ่ → **low**).
  - ห นำ và อ นำ là **trường hợp đặc biệt** của quy tắc này (không tách thành âm tiết riêng).
  - **Ngoại lệ** (từ mượn, đọc tách thường): content ghi `leading: null` và có thể kèm `note`; validator không gắn cờ khi có `tone_override: true`.

### 6.2 Sống / chết
- **Sống:** nguyên âm dài, hoặc âm cuối vang (m, n, ng, y, w).
- **Nguyên âm có âm cuối sẵn** *(bổ sung 2026-11-16)*: các nguyên âm sau là **ngắn** nhưng mang sẵn âm cuối vang → âm tiết **sống**:
  | Nguyên âm | Phân tích | Ví dụ |
  |---|---|---|
  | ไ– , ใ– | a ngắn + **y** | ไม่ (falling), ใหม่ (low), ไหม (rising) |
  | –ำ | a ngắn + **m** | ทำ (mid), น้ำ* |
  | เ–า | a ngắn + **w** | เขา (rising) |
  Content ghi `vowel_length: short` + `final_sound: y|m|w` (**không** ghi `long` để "lách" quy tắc — Tone Trainer bước 2 sẽ giải thích sai). *น้ำ đọc nguyên âm dài trong thực tế — để làm ví dụ ngoại lệ phát âm, không ảnh hưởng thanh.
- **Chết:** nguyên âm ngắn không âm cuối, hoặc âm cuối tắc (k, t, p).

### 6.3 Bảng quy tắc

| Lớp | Không dấu – sống | Không dấu – chết | ่ (ek) | ้ (tho) | ๊ (tri) | ๋ (chattawa) |
|---|---|---|---|---|---|---|
| Mid | mid | low | low | falling | high | rising |
| High | rising | low | low | falling | — | — |
| Low | mid | ngắn: **high** / dài: **falling** | falling | high | — | — |

- "—" = không hợp lệ → trả lỗi. Output `{ tone, steps }`.
- Test: mỗi ô ≥ 2 case, thêm case ห นำ, อ นำ, nguyên âm ngắn + âm cuối vang (วัน).
- Test bổ sung (M2.1): **สวัสดี** (low·low·mid), **สนุก** (low·low), **ขนม** (low·rising), **ตลาด** (low·low), **อร่อย** (low·low), **ไม่** (falling), **ใหม่** (low), **ไหม** (rising), **ทำ** (mid), **เขา** (rising).

---

## 7. Technical Requirements

### 7.0 Lựa chọn ngôn ngữ: TypeScript là chính, Python cho PDF

AI agent viết tốt cả Python lẫn TypeScript, nên chọn ngôn ngữ dựa trên kiến trúc:

| Tiêu chí | Kết luận |
|---|---|
| App chạy trong trình duyệt, local-first, offline | Bắt buộc JS/TS ở frontend → Tone Engine, SRS, normalize, chấm gõ chữ **phải chạy trên trình duyệt** |
| Một nguồn logic duy nhất | Viết Tone Engine / schema bằng TS dùng chung cho web + validator + API. Nếu backend Python thì phải viết **2 bản** → dễ lệch |
| Agent tự kiểm lỗi | `tsc --strict` + Zod giúp agent bắt lỗi kiểu ngay khi build, giảm vòng sửa |
| Xử lý PDF, OCR, NLP tiếng Thái | Hệ sinh thái **Python mạnh hơn** (PyMuPDF, pdfplumber, PyThaiNLP) → dùng Python ở đây |

**Quyết định:**
- `apps/web`, `packages/core`, `scripts/`, `apps/api` (Phase 2): **TypeScript**.
- `tools/pdf-pipeline` (Phase 1 local, Phase 2 Azure Function riêng): **Python 3.12**, quản lý bằng `uv`, test bằng `pytest`, lint `ruff`.
- Ranh giới giữa hai bên là **file CSV/JSON theo schema 5.5** (và JSON Schema sinh từ Zod để Python validate sơ bộ).

### 7.1 Frontend stack (Phase 1)

| Lớp | Lựa chọn |
|---|---|
| Build | Vite + React + TypeScript (strict) |
| Routing | React Router |
| Styling | Tailwind CSS |
| State | Zustand + Dexie live queries |
| Storage | IndexedDB qua **Dexie.js** |
| SRS | `ts-fsrs` |
| Validation | Zod (shared package) |
| Charts (Reporting) | Recharts (hoặc tương đương nhẹ) |
| PWA | `vite-plugin-pwa` |
| Test | Vitest + Playwright |
| Monorepo | pnpm workspaces: `apps/web`, `packages/core` (tone engine, schema, normalize, SRS helpers, progress selectors), `scripts/`; `tools/pdf-pipeline` (Python); Phase 2 thêm `apps/api` |

### 7.2 Audio
```ts
interface AudioProvider {
  speak(text: string, opts?: { rate?: number; voice?: string }): Promise<void>;
  playById?(id: string): Promise<void>;
}
```
- Phase 1: `WebSpeechProvider` (`th-TH`); ưu tiên file `audio/<id>.mp3` nếu có. Thiết bị không có giọng Thái → hướng dẫn cài.
- Phase 2: `AzureSpeechProvider` (mp3 sinh sẵn, lưu Blob/CDN) — S-01.

### 7.3 Data layer
- Truy cập dữ liệu người dùng **chỉ qua repository interface** (`ProgressRepository`, `ReviewRepository`, `SettingsRepository`, `SessionRepository`).
- Phase 1: Dexie. Phase 2: thêm `SyncedRepository` (Dexie + đồng bộ API), UI không đổi.
- Mọi record có UUID + `updatedAt`; IndexedDB có `schemaVersion` và migration.
- Tên database IndexedDB: `hoc-thai-nom-<userId>` (Guest: `hoc-thai-nom-guest`) — xem L-07.

| Store | Nội dung |
|---|---|
| `cards` | `{ id, itemType, itemId, cardType, fsrs, updatedAt }` |
| `reviewLogs` | log từng lần ôn |
| `listeningStats` | `{ expectedTone, answeredTone, correct, ts }` (dùng cho ma trận nhầm lẫn R-04) |
| `sessions` | `{ id, startedAt, endedAt, module }` (dùng cho R-02) |
| `settings`, `meta` | cấu hình, schemaVersion, streak |

### 7.4 Testing strategy (cho Testing Agent)

| Tầng | Công cụ | Phạm vi | Chạy khi |
|---|---|---|---|
| Unit | **Vitest** | `packages/core`: Tone Engine, normalize, chấm gõ chữ, SRS wrapper, progress selectors | Mỗi commit |
| Content | `content:check` | Toàn bộ `content/` và file staging | Mỗi commit |
| Component | **Vitest + React Testing Library** + `fake-indexeddb` | Popover tra từ, bàn phím ảo, flashcard, component progress | Mỗi commit |
| Python | **pytest** | `tools/pdf-pipeline`: parse, normalize; golden test trên vài trang PDF mẫu (LLM được mock bằng response ghi sẵn) | Khi đổi pipeline |
| E2E | **Playwright** (Chromium, Firefox, WebKit — viewport desktop 1280×800 và 1024×768) | Luồng người dùng thật trên bản build | PR + trước deploy |
| Visual regression | Playwright `toHaveScreenshot` | Bảng chữ cái, Tone Trainer, các màn progress (P-02, P-03), render dấu Thái | PR |
| Accessibility | `@axe-core/playwright` | Mọi route | PR |
| API (Phase 2) | Vitest + gọi HTTP vào Functions chạy local; Auth Emulator; DB test bằng container theo ADR-03 | Endpoint sync, import, report, phân quyền | PR |

**Vì sao Playwright:** chạy headless trong CI và trong môi trường của agent, test được IndexedDB, PWA offline (`context.setOffline(true)`), nhiều trình duyệt desktop, chụp screenshot để agent tự nhìn kết quả UI. Agent cũng có thể dùng **Playwright MCP** để thử nghiệm khám phá (exploratory) trước khi viết test.

**Quy ước để test ổn định:**
- **Đồng hồ giả lập** (`vi.useFakeTimers` / `page.clock`) cho mọi test liên quan lịch ôn SRS, streak.
- **Mock AudioProvider** trong test (Web Speech không ổn định trên CI); assert là "đã gọi speak với text X".
- **Seed dữ liệu** qua fixture: helper `seedProgress(page, scenario)` nạp sẵn IndexedDB (người mới / đã học 50 từ / đã thuộc hết chữ cái).
- Selector theo `data-testid` hoặc role, không theo text tiếng Việt (để đổi copy không vỡ test).
- Font Thái self-host để screenshot giống nhau giữa máy.

**Test đăng nhập:** CI và agent dùng **Firebase Auth Emulator** (`firebase emulators:start --only auth`, frontend gọi `connectAuthEmulator` khi `VITE_USE_AUTH_EMULATOR=true`). Emulator giả lập đăng nhập Google/Facebook mà không gọi provider thật → test được luồng đăng nhập thật của SDK. Smoke test đăng nhập Google/Facebook thật chạy **thủ công** trên production trước mỗi release.

**Luồng E2E tối thiểu (Phase 1):**
0. Auth: Guest học 3 thẻ → đăng nhập (mock Google) → đặt tên hiển thị → chọn chuyển tiến độ → dữ liệu còn nguyên → đăng xuất → về Guest rỗng → đăng nhập lại → dữ liệu user quay lại. Xóa tài khoản → user biến mất trong emulator, IndexedDB của user bị xóa.
1. Người mới: học 5 phụ âm → ôn → lưới P-02 đổi màu.
2. Tone Trainer: làm sai bước 2 → báo đúng bước sai → heatmap P-03 cập nhật.
3. Học 10 từ → tua đồng hồ 1 ngày → thẻ đến hạn xuất hiện → ôn xong → P-04 cập nhật.
4. Gõ chữ Thái bằng bàn phím ảo, gõ dấu thanh trước nguyên âm trên → vẫn chấm đúng.
5. Đọc bài → chạm từ → thêm vào SRS → % từ đã biết (P-06) tăng.
6. Quiz nghe 10 câu → biểu đồ P-07 hiển thị.
7. Export → xóa dữ liệu → Import → tiến độ khôi phục.
8. Offline: tải app → `setOffline` → vẫn học và ôn được.

**Definition of Done cho mỗi milestone:** unit + component + content check pass; E2E của luồng liên quan pass; không có lỗi axe mức serious/critical; screenshot baseline được review khi thay đổi.

### 7.5 Tham chiếu & tái sử dụng (không tự sáng tạo)

Nguyên tắc cho agent: **mỗi thành phần phải bám theo một tham chiếu có sẵn** dưới đây. Lệch khỏi tham chiếu thì ghi lý do vào ADR (`docs/adr/`).

#### Sản phẩm/dự án tương tự đã tham khảo
| Dự án | Stack | Điểm áp dụng cho app này |
|---|---|---|
| **LibreLingo** (open source, kiểu Duolingo) | Web: **Svelte + PouchDB** (local-first + sync); content **YAML → JSON** bằng package Python; visual regression test (Percy) | Mô hình gần nhất: content YAML có validate → JSON tĩnh; dữ liệu học local-first rồi sync; visual test |
| **Anki** (open source, SRS) | Core **Rust**, desktop Python + Qt, UI web **TypeScript/Svelte**, Protobuf giữa các tầng | Thuật toán **FSRS** (Anki dùng FSRS; app này dùng `ts-fsrs` cùng tổ chức open-spaced-repetition); tách logic lõi khỏi UI và chia sẻ kiểu dữ liệu giữa các ngôn ngữ |
| **Lute v3 / LingQ-style readers** | Python (Flask) + SQLite | Luồng đọc: tách từ → chạm tra → trạng thái từ (chưa biết / đang học / đã biết) → tô màu |
| **Duolingo** (thương mại) | Backend chủ yếu Scala (một phần Python), hạ tầng AWS | Chỉ tham khảo UX (bài ngắn, streak, XP, leaderboard tuần) — quy mô quá lớn, **không** tham chiếu kiến trúc |

#### Thành phần → tham chiếu dùng lại
| Thành phần | Dùng lại thay vì tự viết |
|---|---|
| Khung frontend + deploy | Template chính thức **Vite + React (TS)** + workflow GitHub Actions do **Azure Static Web Apps** sinh |
| Đăng nhập | **Tài liệu & ví dụ chính thức của Firebase Auth** cho Web (Google, Facebook, account linking, Auth Emulator) |
| API (Phase 2) | Cấu trúc Azure Functions theo tài liệu chính thức; xác thực bằng `firebase-admin` `verifyIdToken` theo docs Firebase |
| LLM | **Anthropic SDK** chính thức (Python cho pipeline PDF, TypeScript cho Functions) |
| SRS | `ts-fsrs` (không tự viết thuật toán lịch ôn) |
| Local DB | Dexie.js (theo docs chính thức, kể cả `dexie-react-hooks`) |
| Tách từ Thái | `Intl.Segmenter` (chuẩn trình duyệt); Python: **PyThaiNLP** |
| PDF | PyMuPDF / pdfplumber, **Azure AI Document Intelligence** (model Layout) |
| Content YAML → JSON | Học theo cách tổ chức của **LibreLingo** (loader + export + validate) |
| PWA | `vite-plugin-pwa` (cấu hình mẫu của plugin) |
| Hình minh họa | **Noto Emoji** SVG (Apache 2.0), self-host |
| Trò chơi | Thư viện kéo-thả `dnd-kit`; animation `motion` (Framer Motion) mức tối thiểu |
| Bàn phím Thái | Layout **Kedmanee** chuẩn (TIS 820-2538); dùng thư viện bàn phím ảo có sẵn (vd. `simple-keyboard` có layout Thai) thay vì tự dựng |
| UI component | Thư viện có sẵn (vd. shadcn/ui + Radix) thay vì tự viết dialog, popover, tabs |
| Biểu đồ | Recharts (ví dụ chính thức) |
| Test | Cấu hình mẫu của Vitest, Playwright, `@axe-core/playwright` |

#### Thành phần **buộc phải tự viết** (không có thư viện sẵn phù hợp)
- **Tone Engine** — làm theo quy tắc ngữ pháp chuẩn (mục 6), không phải phát minh; test đối chiếu với bảng quy tắc trong giáo trình.
- **Chuẩn hóa & chấm điểm gõ chữ Thái** — logic nhỏ, có test.
- **Prompt trích xuất PDF** — phụ thuộc định dạng giáo trình.

### 7.6 UI & Design (nguồn thiết kế cho agent)

> **v7:** bỏ 5 màu thanh điệu và nguyên tắc D10; màu chỉ còn accent + sắc độ mức thuộc + màu trạng thái đúng/sai. Màn hình mới theo mục 0.7.

#### 7.6.1 Định hướng: tối giản, tập trung học

Mong đợi của người học: **UI tối giản, hạn chế màu mè**. Không mascot, không confetti, không hiệu ứng thừa. Màu chỉ dùng khi **mang nghĩa**.

> **v7.3 (owner chốt 2026-11-18, phương án B) — ngoại lệ cho khu Trò chơi:** `/games`, màn chơi và kết quả được **sinh động hơn**: mỗi trò **một màu riêng** thay accent (token `color.game.*`: Ghép cặp tím, Đúng hay sai? cam, Xếp câu tốc độ xanh ngọc, Đoán loại từ hồng; tương phản ≥ 4.5:1) và **chuyển động phản hồi rõ** (đếm 3·2·1, rung khi sai, nảy khi đúng, "+điểm" bay lên, combo nảy, đồng hồ cảnh báo khi sắp hết giờ, hiệu ứng mạnh hơn khi **phá kỷ lục**). Vẫn không mascot; mọi chuyển động tắt khi `prefers-reduced-motion`. Bài học, Bài tập, Tổng quan… giữ nguyên D1/D2 (chỉ accent).

**Nguyên tắc**
| # | Nguyên tắc | Cụ thể |
|---|---|---|
| D1 | **Nền trung tính, 1 màu nhấn** | Nền trắng / xám rất nhạt, chữ xám đậm; **1 màu chủ đạo** (accent) cho nút chính, link, trạng thái active |
| D2a | **Hình minh họa là ngoại lệ có chủ đích** | Khung giao diện tối giản, nhưng **nội dung được minh họa** (hình từ khóa, mẹo nhớ, đường cao độ). Hình theo **một phong cách thống nhất** (Phase 1: Noto Emoji), đặt trên nền trung tính, không thêm khung/viền màu |
| D2 | **Màu chỉ để mang nghĩa** | Chỉ 2 nhóm màu có nghĩa: **5 màu thanh điệu** (tông trầm, độ bão hòa thấp) và **mức thuộc** (các sắc độ của **chính màu accent**, không dùng 4 màu khác nhau). Đúng/sai dùng xanh lá/đỏ nhạt + icon + chữ |
| D3 | **Nội dung là trung tâm** | Chữ Thái cỡ lớn, nhiều khoảng trắng; **mỗi màn hình 1 hành động chính** |
| D4 | **Keyboard-first (desktop)** | Phím tắt cho mọi thao tác học; **hiển thị phím tắt ngay trên nút** (vd. `1 Quên` `2 Khó` `3 Được` `4 Dễ`, `Space` lật thẻ / phát âm) |
| D5 | **Tiến độ luôn thấy nhưng kín đáo** | Thanh tiến độ mảnh khi ôn; số tổng (tổng thẻ, tổng từ) luôn hiển thị, không giấu |
| D6 | **Focus mode khi học/ôn** | Ẩn sidebar/điều hướng, chỉ còn thẻ + tiến độ + nút thoát |
| D7 | **Không vì thẩm mỹ mà giấu thông tin** | Dashboard ít khối nhưng đủ số liệu; thông tin quan trọng không phải click mới thấy |
| D8 | **Typography là "trang trí" chính** | Font Việt: *Inter* hoặc *Be Vietnam Pro*; font Thái: **Sarabun** (v7.4, owner chốt — có đầu tròn; phương án phụ *Noto Sans Thai Looped*) (self-host); line-height chữ Thái 1.6–1.8 để dấu trên/dưới không bị cắt |
| D9 | **Light mode trước, token sẵn cho dark mode** | Phase 1 chỉ light; tokens đặt theo nghĩa (`bg`, `fg`, `accent`…) để thêm dark mode không sửa component |
| D10 | **Thanh điệu không chỉ dựa vào màu** | Mỗi thanh có **ký hiệu đường cao độ nhỏ** (mini contour) + tên, để người mù màu vẫn phân biệt |

**Tham khảo từ các web app học (lấy ý tưởng, không sao chép giao diện)**
| App | Lấy gì | Tránh gì (theo phản hồi người dùng) |
|---|---|---|
| **WaniKani** | **Mẹo nhớ (mnemonic) cho từng chữ**; dashboard dạng khối (widget): tiến độ level, phân bố item theo giai đoạn, **dự báo lịch ôn**; mở khóa dần | Dự báo theo giờ phải click mới thấy; khối tiến độ chiếm quá nhiều chỗ; không có dark mode chính thức |
| **Mochi** (flashcard) | Giao diện sạch; **phím tắt hiện trên nút**; tính năng có sẵn thay vì add-on | Thanh tiến độ khi ôn quá mờ; thiếu tổng số thẻ; trang thống kê quá sơ sài |
| **Anki** | Thuật toán FSRS, số liệu thống kê đầy đủ | Giao diện rối, nhiều tùy chọn kỹ thuật |
| **LingQ / Lute** (đọc) | Trạng thái từ ngay trong văn bản: chưa biết / đang học / đã biết (đã biết = không tô); thấy số từ chưa biết giảm dần rất có động lực | Hàng đợi ôn phình to (hàng trăm từ sau 1 bài) → **giới hạn số từ mới thêm từ mỗi bài**, gợi ý ôn theo nhóm nhỏ |
| **Duolingo** | Ý tưởng streak, mục tiêu ngày, **bài ngắn dạng trò chơi** | Màu mè, mascot, hoạt hình — **không theo** |

**Áp dụng vào màn hình chính**
| Màn hình | Ý tưởng |
|---|---|
| Dashboard | 1 nút chính "Ôn X thẻ" / "Học tiếp"; các khối: tiến độ module (vòng/ thanh mảnh), **dự báo 7 ngày hiển thị luôn**, heatmap hoạt động, tổng số từ/chữ |
| Ôn SRS | Focus mode; thẻ ở giữa, chữ Thái rất lớn; thanh tiến độ mảnh ở trên; 4 nút có phím tắt |
| Bảng chữ cái | Lưới chữ, mỗi ô có chữ + hình từ khóa nhỏ + nền theo sắc độ mức thuộc; chi tiết hiện ở panel bên phải |
| Tone Trainer | Stepper 4 bước dạng văn bản, heatmap quy tắc ở cột phải, màu chỉ ở kết quả thanh |
| Đọc | Văn bản ở giữa (cột đọc ~ 680px), từ chưa biết **gạch chân mảnh**, đang học **nền accent rất nhạt**, đã biết không tô; tra từ ở **panel bên phải** (desktop đủ rộng, không dùng popover che chữ) |
| Trò chơi | Màn chơi toàn màn hình kiểu focus mode; điểm/thời gian/combo ở thanh trên; phản hồi bằng chuyển động ngắn + âm thanh nhẹ, không mascot |
| Quiz nghe | Nút phát lớn, 5 lựa chọn thanh có mini contour + phím tắt `1–5` |

#### 7.6.2 Quy trình thiết kế (từ ý tưởng đến code)

Thiết kế theo **nấc, từ thô đến chi tiết** — không vẽ hi-fi sớm. Agent cần **spec rõ (trạng thái, dữ liệu, hành động, câu chữ)** hơn là hình đẹp.

| Nấc | Nội dung | Thực hiện | Đầu ra |
|---|---|---|---|
| 1 | **Brief** (đối tượng, định hướng 7.6.1, tham khảo) | Claude soạn → owner duyệt | `docs/design/brief.md` |
| 2 | **Sitemap & luồng chính** | Claude (Mermaid) → owner duyệt | `docs/design/flows.md` |
| 3 | **Screen spec bằng chữ** cho từng màn hình (template 7.6.3) | Claude soạn → owner duyệt | `docs/design/screens/SCR-xx-*.md` |
| 4 | **Wireframe trắng đen** (chỉ bố cục) | Claude vẽ trong Figma → owner góp ý | Figma page `Wireframes` |
| 5 | **Tokens + component** | Claude trong Figma | `tokens.json`, `components.md` |
| 6 | **Hi-fi cho 3–4 màn hình mẫu** (Dashboard, Ôn SRS, Tone Trainer, Đọc) | Claude trong Figma → owner duyệt | PNG trong `screens/` |
| 7 | **Prototype bằng code, dữ liệu giả** | Coding agent (đầu mỗi milestone UI) | Owner bấm thử trên trình duyệt trước khi nối logic |

- Các màn hình còn lại **không cần hi-fi**: agent ghép từ component + wireframe + spec.
- Mỗi screen spec có mã `SCR-xx` gắn với mã requirement (A-xx, B-xx, P-xx…); milestone nào thì agent đọc đúng các spec liên quan.

#### 7.6.3 Template screen spec

```markdown
# SCR-xx <Tên màn hình>  (route: /...)  — Requirements: <ID>
## Mục đích            — 1–2 câu
## Dữ liệu             — hiển thị gì, lấy từ đâu
## Bố cục (desktop 1440) — các vùng chính, tỉ lệ cột
## Hành động           — click / phím tắt → kết quả
## Trạng thái          — lần đầu (rỗng) | đang tải | bình thường | lỗi | offline | Guest vs đã đăng nhập | hoàn thành
## Câu chữ (tiếng Việt) — tiêu đề, nút, thông báo, empty state
## Lưu ý chữ Thái      — cỡ chữ, line-height, từ dài, dấu chồng
## Ngoài phạm vi       — những gì KHÔNG làm ở màn hình này
```
> Những thứ agent hay tự chế khi spec bỏ trống: trạng thái rỗng/lỗi/offline, Guest vs đăng nhập, câu chữ, xử lý chữ Thái dài → spec **bắt buộc** có các mục này.

#### 7.6.4 Repo & Figma

- **Nền tảng:** web **desktop-first** (≥ 1280px, tối thiểu 1024px). Chưa thiết kế mobile.
- **Nguồn thiết kế duy nhất trong repo:**
```
docs/design/
  brief.md
  flows.md                 # Mermaid: sitemap + luồng chính
  screens/SCR-01-login.md  # screen spec
  screens/SCR-01-login.png # wireframe hoặc hi-fi xuất từ Figma
  components.md            # danh sách component + khi nào dùng
  tokens.json
  README.md                # link Figma, ngày duyệt từng đợt
```
- **Công cụ thiết kế (đã chốt):** **Claude** tạo thiết kế trực tiếp vào **Figma qua Figma MCP**; owner review/chỉnh trên Figma.
- **Figma workspace:** team cá nhân **"chiend's team"** (gói Starter, seat Full). Không đặt file ở team công ty.
  - 1 file `Học Thai cùng Nôm — UI`, các page: `Tokens & Styles`, `Components`, `Wireframes`, `Screens – Desktop`, `Archive`.
  - Dùng **Figma Variables** cho tokens và text styles cho font Thái/Việt.
- **Giới hạn gói Starter:** tool **đọc** của Figma MCP chỉ ~**20 lượt/tháng** →
  - Claude tạo/sửa theo từng đợt; chỉ khi owner **duyệt** mới đọc/xuất PNG + tokens vào repo.
  - **Coding agent đọc thiết kế từ repo, không đọc trực tiếp Figma.**
  - Cần agent đọc Figma thường xuyên → cân nhắc nâng seat Dev/Full gói Professional.
  - Thay đổi thiết kế sau này: sửa ở Figma trước → xuất lại → agent cập nhật code.
- **Logo placeholder:** component `<AppLogo />` duy nhất, đọc `apps/web/public/brand/logo.svg` (+ `logo-mark.svg`, `favicon.ico`). Placeholder: chữ "Nôm" trong khối tròn màu trung tính. Thay logo thật = **chỉ thay file trong `public/brand/`**.
- **Quy tắc cho agent (ghi trong `AGENTS.md`):** chỉ dùng component shadcn/ui + tokens; không tự tạo kiểu UI mới; không thêm màu ngoài tokens; màn hình chưa có spec → dừng lại và hỏi.
- Playwright visual test so sánh màn hình đã build với mockup (review thủ công khi lệch).

### 7.7 Khác
- Chuỗi UI trong `src/i18n/vi.ts`.
- Accessibility cơ bản, `lang="th"` cho text Thái.
- Không analytics bên thứ ba.

---

## 8. Cloud services đề xuất

> Free tier / giá thay đổi theo thời gian — **kiểm tra lại trang pricing** trước khi tạo resource.

| Service | Phase | Dùng cho | Ghi chú |
|---|---|---|---|
| **Azure Static Web Apps** (Free) | 1 | Host frontend (PWA), preview theo PR | Đủ cho Phase 1–2 |
| **Firebase Authentication** (Spark, Google) | 1 | Đăng nhập Google (Facebook thêm ở Phase 2) | $0 tới 50.000 MAU (ADR-02) |
| **Anthropic Claude API** | 1 | Trích xuất PDF (chạy ở máy owner); Phase 2: AI tutor, pipeline trên Azure | Trả theo token; có giới hạn chi phí (ADR-04) |
| **Azure AI Document Intelligence** | 1–2 | (Tùy chọn) Trích bảng/OCR từ PDF scan | Tier F0 miễn phí số trang giới hạn |
| **Azure Functions** (Consumption / Flex) | 2 | API: sync, leaderboard, import, báo cáo, proxy Claude | Pipeline PDF (Python) tách Function App riêng |
| **Database** (ADR-03: Neon Postgres / Azure SQL) | 2 | Users (key = Firebase `uid`), roles, progress, XP, import, audit, báo cáo; Phase 3 lớp học | Chốt ở M13 |
| **Azure Blob Storage** | 2 | PDF upload, CSV import, export báo cáo, audio mp3 | Rất rẻ |
| **Azure Queue Storage** | 2 | Hàng đợi job PDF | |
| **Azure Key Vault** | 2 | Claude API key, connection string DB, Firebase service account (nếu cần) | Functions đọc qua Managed Identity |
| **Azure AI Speech** | 2 | TTS mp3, Pronunciation Assessment `th-TH` | Tier F0 |
| **Application Insights** | 2 | Log & lỗi kỹ thuật của API | Sampling + giới hạn retention |
| **Custom domain** | 2 | Domain riêng | Mua ở Phase 2 |
| **Azure Budget alert** | 1 | Cảnh báo chi phí (vd. $5 / $20 mỗi tháng) | Bật ngay từ đầu |

### 8.0 Kiến trúc Phase 1
```
[Web app - Azure Static Web Apps] ──popup──► [Firebase Auth] ──► Google (Facebook: Phase 2)
        │
        └── Tiến độ học: IndexedDB trên trình duyệt (theo Firebase uid)
Không có backend / database.

Máy owner: [tools/pdf-pipeline (Python)] ──► [Claude API] ──► staging CSV ──► content:check ──► content/ (commit)
```

### 8.1 Kiến trúc Phase 2
```
[Web app - SWA] ──► [Firebase Auth]  (ID token)
        │  /api/*  (Authorization: Bearer <Firebase ID token>)
        ▼
[Azure Functions (TS)] ── verifyIdToken ──► [Database (ADR-03)]
        │        ──► [Blob Storage]
        │        ──► [Claude API]  (AI tutor)
        │        ──► [Queue] ──► [Function App Python: PDF pipeline] ──► [Document Intelligence] + [Claude API]
        └── secrets via Managed Identity ──► [Key Vault]
```

### 8.2 Bảng dữ liệu chính (Phase 2, DB theo ADR-03)
`users` (id = Firebase `uid`, display_name, created_at…), `user_roles`, `user_cards`, `user_review_logs`, `user_sessions`, `user_xp_events`, `leaderboard_weekly` (tính định kỳ), `user_badges`, `push_subscriptions`, `words`, `decks`, `import_batches`, `import_items`, `audit_logs`, `daily_stats`. Phase 3: `classes`, `class_members`, `class_assignments`, `class_invites`.

### 8.3 CI/CD
- GitHub repo, GitHub Actions: lint → test → `content:check` → build → deploy SWA (workflow do SWA sinh sẵn).
- Phase 2: deploy Functions + migration DB (vd. Prisma Migrate / DbUp) trong pipeline; môi trường `dev` và `prod` tách resource group.
- Infrastructure as Code bằng **Bicep** (khuyến nghị) để tái tạo môi trường.

---

## 9. Màn hình

> **v7:** route Phase 1 theo **mục 0.7** (bảng dưới là bản v6; các dòng `/alphabet`, `/tones`, `/review`, `/vocab`, `/reading`, `/listening` ⛔ thay thế). Phase 2 giữ nguyên.

| Route | Màn hình | Phase | Requirement |
|---|---|---|---|
| `/login` | Đăng nhập Google / Học không cần đăng nhập (Facebook: Phase 2) | 1 | L-01..L-03 |
| `/account` | Hồ sơ, provider liên kết, tên hiển thị, xóa tài khoản | 1 | L-04, L-08 |
| `/privacy`, `/terms`, `/account/delete-instructions` | Trang pháp lý bắt buộc cho Google/Facebook | 1 | 4.0 |
| `/` | Dashboard | 1 | B-06 |
| `/alphabet`, `/alphabet/practice` | Bảng chữ cái, luyện chữ | 1 | A-01..A-12 |
| `/tones` | Tone Trainer | 1 | A-20..A-23 |
| `/vocab`, `/vocab/:deckId` | Bộ từ, học từ mới | 1 | B-01..B-03, B-07 |
| `/review` | Ôn SRS (gồm thẻ gõ chữ) | 1 | B-04, B-05, G-06 |
| `/reading`, `/reading/:id` | Đọc + tra từ | 1 | C-01..C-07 |
| `/listening` | Quiz nghe | 1 | D-01..D-04 |
| `/games`, `/games/:id` | Danh sách trò chơi, màn chơi | 1 | F-01..F-04, F-10..F-14 |
| `/progress` | **Báo cáo cá nhân** | 1 | R-01..R-07 |
| `/settings` | Cài đặt, export/import tiến độ | 1 | G-01, G-02 |
| `/leaderboard` | Bảng xếp hạng tuần / toàn thời gian | 2 | E-02..E-04 |
| `/badges` | Huy hiệu | 2 | E-06 |
| `/speak`, `/tutor` | Luyện phát âm, AI tutor | 2 | S-02, S-03 |
| `/admin/import` | Upload CSV/PDF, danh sách batch | 2 | M-01, M-02, M-08 |
| `/admin/import/:batchId` | Review & sửa draft, xử lý trùng | 2 | M-03..M-05 |
| `/admin/content` | Quản lý từ đã publish | 2 | M-06, M-09 |
| `/admin/reports` | **Báo cáo admin** | 2 | R-20..R-25 |
| `/admin/users` | Quản lý user & role | 2 | U-02 |

---

## 10. Milestones (thứ tự implement cho AI agent)

Mỗi milestone kết thúc khi đạt Definition of Done trong `AGENTS.md`. **Trạng thái và task chi tiết nằm ở `ROADMAP.md`** (bảng dưới chỉ là tóm tắt phạm vi).

**Thứ tự khởi động:** M0 (khung, không cần thiết kế) làm ngay, song song **M0.5a** (brief, flows, tokens cơ bản, spec Layout/Đăng nhập/Tài khoản). M1 mở khi M0 + M0.5a xong và owner hoàn tất SETUP S4–S6. **M0.5b** (thiết kế các màn còn lại) làm dần, mỗi màn xong trước milestone dùng nó. M2 (logic thuần) có thể làm song song nếu M1 bị chặn.

### Phase 1 (v7)
| M | Nội dung |
|---|---|
| **M0, M0.5a, M1, M2, M3, M5, M2.1** | 🟢 Xong (giữ nguyên; Tone Engine đóng băng theo 0.2) |
| **M5.5** | **Dọn phạm vi v7**: gỡ route/nav/màn Bảng chữ cái, Thanh điệu, Nghe; xóa component `MasteryGrid`, `HeatmapTable`, `ToneBarChart`, `ToneContour`, `ToneTag` (+ `/dev/progress` phần liên quan), màu thanh trong tokens; nav mới (0.7, "Ôn tập" → "Bài tập"); schema: `syllables`/`tones` tùy chọn; gỡ content mẫu chữ cái/thanh; thẻ ví dụ trang Login đổi sang thẻ từ vựng |
| **M0.5b** | Design v7: SCR-03 Tổng quan, SCR-04 Bài học (lộ trình + chi tiết unit), SCR-05 Bài học 4 bước, SCR-06 Bài tập (hub + phiên + kết quả), SCR-07 Sổ từ, SCR-08 Trò chơi, SCR-09 Tiến độ; owner duyệt (làm dần, mỗi màn trước milestone dùng nó) |
| **M6** | **Content model v7** (0.9): schema `Unit/Lesson/Word/Sentence/Grammar/Dialogue` + JSON Schema, `build-content`/`content:check` mới, `content/templates/`, content mẫu Unit 1–2 (draft) |
| **M7** | **Bài học**: AudioProvider (TTS), `/units`, `/units/:unitId`, bài học 4 bước (Từ vựng, Mẫu câu, Hội thoại + tra từ), hoàn thành bài, can-do |
| **M7.5** | **Trò chơi (ưu tiên, v7.2)**: interface `Game`, F-01, F-02', F-03', F-04', `/games` + màn chơi + kết quả, kỷ lục, cờ "cần ôn"; component tương tác dùng chung cho M9 (SCR-08) |
| **M8** | Bàn phím ảo Thái + chấm gõ câu (G-06, E-07: chuẩn hóa, đáp án chấp nhận, diff) |
| **M9** | **Bài tập**: interface `Exercise`, E-01..E-09, E-10..E-13, bước 4 của bài học, `/practice` + phiên + kết quả, SRS cho câu |
| **M10** | **Tổng quan + Sổ từ + Tiến độ**: `/`, `/words`, `/progress` (P-08, P-10..P-12, R-01'..R-07) |
| ~~M10.5~~ | → chuyển lên **M7.5** (v7.2); hình & mẹo nhớ cho từ (V-02..V-04) gộp vào M10 |
| **M4** | PDF pipeline Python → xuất đúng mẫu 0.9 (chờ S9 + PDF/biểu mẫu của giáo viên) |
| **M12** | Settings (phiên âm mặc định ẩn, số câu bài tập/ngày), export/import, PWA offline; E2E đủ (luồng 1–2 viết lại theo bài học/bài tập) + visual baseline; go-live checklist đăng nhập |

> M11 cũ (báo cáo `/progress`) gộp vào M10.

### Phase 2 (toàn bộ phần còn lại — theo thứ tự ưu tiên)
| M | Nội dung |
|---|---|
| **M12.5** | **Đăng nhập Facebook** (đầu Phase 2): owner làm SETUP S6 (Facebook App, Firebase provider, Valid OAuth Redirect URIs, URL pháp lý, chuyển app *Live*); bật `VITE_ENABLE_FACEBOOK_LOGIN`; nút Facebook trên `/login`; **liên kết tài khoản cùng email (L-04)** + dialog D3; liên kết/huỷ liên kết ở `/account`; E2E trên Auth Emulator |
| **M13** | **Chốt ADR-03 (database)**; dựng Azure Functions (TS) + DB + Key Vault + Bicep; xác thực `verifyIdToken`; **Mua & gắn domain riêng**, cập nhật cấu hình OAuth Google/Meta; roles Learner/Editor/Admin (U-02), `/admin/users` |
| **M14** | **Sync tiến độ** (`SyncedRepository`, U-03, U-04) — tiền đề cho leaderboard |
| **M15** | **XP + Leaderboard** tuần/toàn thời gian, opt-out, chống gian lận (E-01..E-05) |
| **M16** | Content API: từ `Published` + merge nội dung gốc (M-06, M-09) |
| **M17** | Import CSV/XLSX + review + duyệt + audit + rollback (M-01, M-03..M-08) |
| **M18** | Import PDF trên Azure (Queue + Python Function App + Document Intelligence + LLM) (M-02) |
| **M19** | Báo cáo admin (`daily_stats` + `/admin/reports`, R-20..R-25) |
| **M20** | Trò chơi F-05..F-07; bài đọc dài theo cấp độ (Module C, P-06); Huy hiệu + nhắc học Web Push (E-06, E-07) |
| **M21** | Azure TTS mp3 sinh sẵn (S-01) |
| **M22** | Chấm phát âm `th-TH` (S-02) |
| **M23** | AI tutor + sinh bài đọc theo vốn từ (S-03, S-04) + **E-20 dịch tự do Claude chấm** |
| ~~M24~~ | ⛔ Bỏ ở v7 (Tone Trainer văn bản tự do) |

### Phase 3 — Lớp học / nhóm
| M | Nội dung |
|---|---|
| **M25** | Role Teacher, tạo lớp, mã/link mời, tham gia/rời lớp (K-01, K-02, K-06) |
| **M26** | Giao bài + mục "Bài được giao" (K-03) |
| **M27** | Báo cáo theo lớp + leaderboard theo lớp (K-04, K-05) |

---

## 11. Open Questions

> Agent dùng **Default** nếu owner chưa trả lời.

| # | Câu hỏi | Default |
|---|---|---|
| 1 | ~~PDF mẫu~~ | **Đã nhận 2026-11-17** (mục 0.11): PDF **ảnh, không có text**, có watermark → Claude vision; 2 dạng bố cục (bảng loại từ, danh sách + bài tập dịch) |
| 2 | ~~LLM~~ | **Đã chốt:** Claude API (ADR-04) |
| 3 | ~~Provider đăng nhập~~ | **Đã chốt:** Firebase Auth (ADR-02). **Phase 1: Google. Phase 2: Facebook** (M12.5) |
| 4 | Báo cáo admin có cần **xem chi tiết từng học viên** (tên, email, tiến độ cá nhân) hay chỉ số liệu tổng hợp? | Chỉ tổng hợp ở v2; chi tiết từng học viên để sau, cần chính sách quyền riêng tư |
| 5 | ~~Sự đồng ý của giáo viên~~ | **Đã chốt:** có sự đồng ý |
| 6 | Logo & màu chủ đạo | **Đã chốt tạm:** dùng logo placeholder; owner bổ sung logo sau. Màu chủ đạo trung tính cho tới khi có logo |
| 12 | ~~Công cụ tạo mockup~~ | **Đã chốt:** **Claude + Figma MCP** (mục 7.6) |
| 7 | ~~Lớp học / nhóm~~ | **Đã chốt:** Phase 3 (mục 4.12) |
| 8 | ~~Đồng bộ tiến độ~~ | **Đã chốt:** Phase 2 (M14) |
| 9 | ~~Domain~~ | **Đã chốt:** Phase 1 dùng domain mặc định `*.azurestaticapps.net`; **mua domain riêng ở Phase 2** |
| 10 | ~~Chủ tài khoản Facebook App / Google Cloud~~ | **Đã chốt:** tài khoản **cá nhân** của owner |
| 11 | ~~ADR-01 / ADR-02~~ | **Đã duyệt:** Firebase Auth; Phase 1 không database. ADR-03 (DB Phase 2) chốt ở M13 |

---

## 12. Changelog
- **v7.4 (2026-11-18):** Owner yêu cầu **font chữ phổ thông** (ảnh mẫu sách tập viết, chữ Thái có đầu tròn) → font Thái **Sarabun** thay Noto Sans Thai (G-05, D8, `tokens.json`); tiếng Việt giữ Inter.
- **v7.3 (2026-11-18):** Khu **Trò chơi** sinh động hơn (7.6.1 ngoại lệ, phương án B): màu riêng từng trò (`color.game.*` trong `tokens.json`) + chuyển động phản hồi; các khu khác giữ tối giản. Tham khảo **Memrise Speed Review**: F-02' và F-04' chơi theo **3 tim** (giờ mỗi câu theo độ dài 5–9 s, sai/hết giờ mất tim, 15 câu đúng liền +1 tim), nền thẻ ngả đỏ dần khi sắp hết giờ, thưởng tốc độ, tự đọc chữ Thái, màn kết quả bật/tắt "cần ôn" từng mục.
- **v7.2 (2026-11-18):** **Trò chơi trước Bài tập**: M10.5 → **M7.5**; thêm **F-04' Đoán loại từ**; F-10 cho phép chơi với từ chưa học của chuyên đề đã chọn; spec SCR-04/05/06/08.
- **v7.1 (2026-11-17):** Nhận 2 PDF mẫu của giáo viên (mục 0.11): lộ trình theo **chuyên đề giáo viên**, `Unit.kind`/`level` B1, `Word.classifier`/`thai_alt`/`note_vi`, `meaning_vi`/`Sentence.th` được trống khi draft, bài tập **E-14 Loại từ**, pipeline M4 dùng Claude vision + `--suggest`; Open Q #1 đóng; milestone **M6.1**.
- **v7 (2026-11-16):** **Đổi phạm vi theo phản hồi demo khách hàng** (mục 0): người học A1–A2 đã đọc được → bỏ Module A (chữ cái, Tone Trainer), Module D (quiz thanh), thanh điệu khỏi UI (Tone Engine đóng băng), `MasteryGrid`, `HeatmapTable`, `ToneBarChart`; "Ôn tập" → **Bài tập** (Module E, dịch câu nâng dần bậc); 16 chủ đề A1–A2 + bài học 4 bước; nav, routes, tiến độ (P-10..P-12), mẫu content (0.9); milestone Phase 1 mới M5.5, M6–M10.5.
- **v6.5 (2026-11-16):** Tone Engine: thêm quy tắc **อักษรนำ tổng quát** (6.1) và **nguyên âm có âm cuối sẵn** ไ– ใ– –ำ เ–า (6.2); `leading` nhận mọi phụ âm cao/trung; test bổ sung; milestone **M2.1** (sau M5, trước M6 & M4).
- **v6.4 (2026-11-15):** **Facebook Login chuyển sang Phase 2** (M12.5): Phase 1 chỉ Google + Guest; L-04 (liên kết tài khoản) sang Phase 2; feature flag `VITE_ENABLE_FACEBOOK_LOGIN`; SETUP S6 dời sang Phase 2.
- **v6.3 (2026-11-14):** Thêm bộ tài liệu cho agent: `AGENTS.md`, `ROADMAP.md`, `SETUP-OWNER.md`. Tách M0.5 thành M0.5a (trước M1) và M0.5b (làm dần); M0 làm ngay không chờ thiết kế.
- **v6.2 (2026-11-14):** Ý tưởng cốt lõi: học bằng **flashcard + trò chơi**, tiêu chí **tượng hình** (mục 1). Thêm Module V Hình ảnh & mẹo nhớ (4.13) và Module F Trò chơi (4.14, 4 trò lõi Phase 1); schema thêm `image`, `mnemonic_vi`; nguyên tắc D2a; route `/games`; M10.5.
- **v6.1 (2026-11-14):** Định hướng UI **tối giản** (mục 7.6.1: nguyên tắc D1–D10, tham khảo WaniKani / Mochi / Anki / LingQ / Duolingo); quy trình thiết kế 7 nấc + template screen spec (7.6.2–7.6.3); màu mức thuộc đổi thành sắc độ của màu accent; tách M0.5 thành các bước.
- **v6 (2026-11-14):** Duyệt ADR-01 (Phase 1 không database/Functions) và ADR-02 (Firebase Auth); thêm ADR-03 (DB Phase 2: Neon Postgres ưu tiên / Azure SQL) và ADR-04 (Claude API); viết lại 4.0 Kỹ thuật, test bằng Firebase Auth Emulator, mục 8 cloud services & kiến trúc, M1, M13; chốt Open Q #2, #11.
- **v5.3 (2026-11-14):** Chốt công cụ thiết kế: Claude + Figma MCP, workspace cá nhân (Starter); quy trình tiết kiệm lượt đọc MCP, coding agent đọc thiết kế từ repo (mục 7.6, M0.5, Open Q #12).
- **v5.2 (2026-11-14):** UI **web desktop-first**, chưa làm mobile (G-04, test viewport, bàn phím ảo); logo placeholder qua `<AppLogo />` + `public/brand/`; thêm mục 7.6 UI & Design (nguồn thiết kế trong repo, Figma không bắt buộc), M0.5, Open Q #12.
- **v5.1 (2026-11-14):** Chốt Open Q #8 (sync ở Phase 2), #9 (domain riêng mua ở Phase 2, Phase 1 dùng `*.azurestaticapps.net`), #10 (tài khoản cá nhân); sửa #3 cho khớp ADR-02.
- **v5 (2026-11-14):** Thêm 3 tiêu chí quyết định C1 Chi phí / C2 Dễ phát triển thêm tính năng / C3 Dễ maintain bằng AI agent (mục 3.1); ADR-01 Database và ADR-02 Auth ở trạng thái chờ duyệt (mục 3.2); thêm Phase 3 Lớp học / nhóm (mục 4.12, M25–M27); chốt Open Q #5 (giáo viên đồng ý) và #7.
- **v4.1 (2026-11-14):** Thêm mục 7.5 Tham chiếu & tái sử dụng: so sánh stack các app tương tự (LibreLingo, Anki, Lute, Duolingo) và map từng thành phần sang thư viện/sample có sẵn.
- **v4 (2026-11-14):** Gộp còn 2 phase (mọi việc ngoài Phase 1 vào Phase 2); **đăng nhập Google/Facebook** lên Phase 1, milestone M1 (mục 4.0); thêm Leaderboard/XP/huy hiệu (mục 4.10) và Nói & AI (mục 4.11) vào Phase 2; cập nhật kiến trúc Azure Phase 1, test mock auth, open questions #8–#10.
- **v3 (2026-11-14):** Thêm Progress visualization theo từng module (mục 4.9, P-01..P-08) và định nghĩa mức thuộc; thêm Testing strategy (mục 7.4, Vitest + Playwright + axe + pytest); chốt TypeScript là chính, Python cho PDF pipeline (mục 7.0); sắp xếp lại milestones.
- **v2 (2026-11-14):** Đổi tên "Học Thai cùng Nôm"; nguồn content từ PDF + pipeline trích xuất; thêm gõ chữ Thái (G-06); thêm Reporting (R1 Phase 1, R2 Phase 2); thêm Import từ vựng có phân quyền (Phase 2); đề xuất Azure services; repo GitHub.
- **v1 (2026-11-14):** Draft đầu tiên.
