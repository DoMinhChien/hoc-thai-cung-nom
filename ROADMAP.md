# ROADMAP — Học Thai cùng Nôm

> Nguồn trạng thái duy nhất của dự án. Agent tự quản lý theo vòng lặp trong `AGENTS.md` mục 5: tick task ngay khi xong, ghi 1 dòng nhật ký cuối mỗi phiên.
> Chi tiết requirement: `hoc-thai-cung-nom-plan.md`. Việc owner làm tay: `SETUP-OWNER.md`.

**Trạng thái:** ⚪ Chưa bắt đầu · 🔵 Đang làm · 🟠 Bị chặn · 🟢 Xong

## Milestone đang mở

> **⚠️ Đổi phạm vi v7 (2026-11-16) theo phản hồi demo khách hàng — đọc plan mục 0 trước.** Người học A1–A2 đã đọc được chữ Thái: bỏ Bảng chữ cái, bỏ hẳn thanh điệu, "Ôn tập" → "Bài tập", bỏ `MasteryGrid`/`HeatmapTable`; trọng tâm là từ vựng theo chủ đề + dịch câu.
> **🔵 M7 — Bài học** (nhánh `m7-lessons`, chưa bắt đầu). Phần logic (T7.1–T7.3) làm được ngay; phần UI (T7.4–T7.6) **🟠 chờ SCR-04/05** (M0.5b).
> ⛔ M6 cũ (Bảng chữ cái + Tone Trainer) **hủy**, chưa có code.
> 🟢 M0, M0.5a/TD, M1, M2, M3, M5, M2.1, M5.5, M6, M6.1 xong (Tone Engine giữ nhưng đóng băng).
> ⚪ M0.5b (SCR-03..09 v7) làm song song: Claude Desktop soạn spec + wireframe → owner duyệt. ⚪ M4: PDF mẫu ✅ (`sources/`, plan 0.11 + 5.3 v7.1), còn chờ **S9** (Anthropic key).

---

## 1. Thứ tự & phụ thuộc (Phase 1)

```
M0 Khung dự án ──────────────┐
M0.5a Design: brief + Login/Account ─┼──► M1 Đăng nhập ──► M2 Core ──► M3 Content ──► M5 Data+SRS ──► M2.1 ──► M5.5 Dọn v7 ──► M6 Content v7 ──► M7 Bài học ──► M8 Gõ ──► M9 Bài tập ──► M10 Tổng quan/Tiến độ ──► M10.5 Trò chơi ──► M12 Go-live
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
| M0.5b | Design v7: SCR-03..09 (Tổng quan, Bài học, Bài tập, Sổ từ, Trò chơi, Tiến độ) | ⚪ | Làm dần, mỗi màn trước milestone dùng nó |
| M5 | Data layer + SRS + progress components | 🟢 | M2 ✅, M3 ✅ — PR #8, #9 |
| M2.1 | Bổ sung quy tắc Tone Engine (อักษรนำ, ไ/ใ/ำ/เา) | 🟢 | M5 ✅ — PR #10 |
| M5.5 | **Dọn phạm vi v7**: gỡ chữ cái/thanh điệu khỏi UI, nav mới, schema tùy chọn | 🟢 | M2.1 ✅; plan mục 0 — PR #11 |
| ~~M6 cũ~~ | ~~Bảng chữ cái + Tone Trainer~~ | ⛔ Hủy (v7) | — |
| M6 | Content model v7: Unit/Lesson/Word/Sentence/Grammar/Dialogue + mẫu `content/templates/` + content mẫu Unit 1–2 | 🟢 | M5.5 ✅ — PR #12 |
| M6.1 | Content model theo tài liệu giáo viên (plan 0.11): `kind`, B1, `classifier`, `thai_alt`, `note_vi`, draft được thiếu nghĩa/đáp án | 🟢 | M6 ✅; PDF mẫu ✅ — PR #13 |
| M7 | Bài học: `/units`, chi tiết unit, bài học (bỏ qua bước trống), AudioProvider | 🔵 | M6.1 ✅; UI chờ SCR-04/05 (M0.5b) |
| M8 | Bàn phím ảo Thái + chấm gõ câu (E-07) | ⚪ | M5.5 |
| M9 | Bài tập: E-01..E-14, `/practice`, SRS cho câu | ⚪ | M7, M8, SCR-06 |
| M10 | Tổng quan + Sổ từ + Tiến độ (P-10..P-12, R1 v7) | ⚪ | M9, SCR-03/07/09 |
| M10.5 | Trò chơi F-01, F-02', F-03' + hình/mẹo nhớ cho từ | ⚪ | M9, SCR-08 |
| M12 | Settings, export/import, PWA, E2E đủ, go-live | ⚪ | S5 publish, S8 |

Phase 2 (M13–M24) và Phase 3 (M25–M27): xem mục 10 của plan. **Không làm cho tới khi Phase 1 xong.**

---

## 3. Chi tiết milestone đang mở

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

### M7 — Bài học 🔵

**Requirement:** plan **0.4** (bài học 4 bước, mở khóa mềm, checklist can-do), **0.7** (`/units`, `/units/:unitId`, `/units/:unitId/:lessonId`), **0.8** (P-10 `UnitPath`, P-11 `CanDoList`, P-04 theo unit), **7.2** (AudioProvider), **B-03/B-04** (từ mới vào SRS), **C-02/C-03/C-04/C-06/C-07** (tra từ, toggle bản dịch, phát câu trong bước Hội thoại), 7.3–7.4.

**Cần trước:** M6 ✅. **SCR-04** (lộ trình + chi tiết unit) và **SCR-05** (bài học 4 bước) chưa có → T7.4–T7.6 🟠 chờ M0.5b (AGENTS.md mục 4: làm logic/test trước, báo owner).

**Task**
- [ ] T7.1 Types bundle content (`UnitSummary`, `UnitBundle`, `BuiltLesson` + `steps`, `BuiltSentence` + `auto_tokens`, `Manifest`) chuyển từ `scripts/content/build.ts` vào `packages/core` (web và script dùng chung) + content client trong `apps/web` (`fetch` `manifest.json` → `units.json` / `unit-<id>.json`, cache theo `manifest.version`, validate bằng Zod) + hook `useUnits()`, `useUnit(id)`. Unit test (fetch giả).
- [ ] T7.2 Tiến độ bài học: record `LessonProgressRecord` (bước đã xong 1–4, điểm bài tập, hoàn thành khi ≥ 80%) + `CanDoRecord` (tick tay); Dexie store mới + migration `schemaVersion`; `ProgressRepository` mở rộng (Dexie + memory, contract test); selector core: trạng thái unit chưa học/đang học/xong (P-10), can-do tự tick khi mọi bài xong (P-11), % theo unit (P-04). `ITEM_TYPES` thêm `sentence` (chuẩn bị M9).
- [ ] T7.3 `WebSpeechProvider` (`th-TH`) + ưu tiên file `audio/<id>` khi câu có `audio`; không có giọng Thái → trạng thái để UI hướng dẫn cài. Unit test với mock `speechSynthesis`/`Audio`.
- [ ] T7.4 🟠 `/units` lộ trình theo **chuyên đề giáo viên** (thứ tự `order`, nhãn `level` + `kind`; plan 0.11 #1), `UnitPath` + `ProgressRing` mỗi unit (SCR-04).
- [ ] T7.5 🟠 `/units/:unitId`: danh sách bài, `CanDoList`, từ vựng của unit (SCR-04).
- [ ] T7.6 🟠 `/units/:unitId/:lessonId` focus layout, stepper theo `lesson.steps` (bỏ qua bước không có dữ liệu, plan 0.11 #3), mở khóa mềm: Từ vựng (flashcard Thái → Việt, phiên âm ẩn, từ mới vào SRS), Mẫu câu, Hội thoại (tra từ panel phải, toggle bản dịch, phát câu), Bài tập (khung + chấm ≥ 80% — loại bài tập thật ở M9) (SCR-05).
- [ ] T7.7 E2E luồng học 1 bài (Unit 1 mẫu) + axe + screenshot baseline 3 route mới.

**Tiêu chí nghiệm thu**
- Web đọc được `units.json`/`unit-*.json` do M6 sinh; đổi content → `manifest.version` đổi → client tải lại.
- Học xong 4 bước một bài (bài tập ≥ 80%) → bài "hoàn thành"; mọi bài xong → unit "xong", can-do tự tick; dữ liệu qua repository (Dexie), không `localStorage`.
- Từ mới ở bước Từ vựng có thẻ FSRS; bước Hội thoại tra từ được.
- Audio luôn qua `AudioProvider`; test dùng mock.
- Không lỗi axe serious/critical; baseline mới owner đã xem.

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

### M8 (v7) → M12
Theo plan mục 0 và mục 10 (v7). Chi tiết hóa thành task khi milestone trước gần xong (agent đề xuất danh sách task từ requirement IDs trong plan → owner duyệt → ghi vào đây).

---

## 5. Nhật ký

> Mỗi phiên làm việc thêm **1 dòng** (mới nhất ở trên cùng).

| Ngày | Milestone | Xong | Đang dở | Bị chặn | Nhánh / PR |
|---|---|---|---|---|---|
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
