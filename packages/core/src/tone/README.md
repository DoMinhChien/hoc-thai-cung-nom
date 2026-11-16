# Tone Engine — ⛔ ĐÓNG BĂNG (v7, 2026-11-16)

> Plan mục **0.2**: app không dạy và không hiển thị thanh điệu nữa. Code và test ở thư mục này **giữ nguyên** (đã xong ở M2, M2.1) nhưng **đóng băng**.

- **Không UI nào import.** ESLint (`eslint.config.js`, `FROZEN_TONE`) chặn `apps/web` import `computeTone`, `TONE_RULES`, `inherentFinal`, `consonantClass`, các hằng lớp phụ âm, và import thẳng vào `packages/core/src/tone/`.
- **Không phát triển thêm.** Chỉ sửa khi test hiện có hỏng (vd. nâng cấp dependency).
- Còn dùng ở: schema `SyllableAnalysis` (regex phụ âm dẫn) và `content:check` cho file `tone-drills` nếu có (content mẫu đã xóa ở M5.5).
- Muốn dùng lại (vd. Phase 2) → owner quyết định, viết ADR mới, gỡ quy tắc ESLint.

| File | Nội dung |
|---|---|
| `classes.ts` | Lớp phụ âm trung/cao/thấp, phụ âm theo sau อักษรนำ |
| `engine.ts` | `computeTone` 4 bước (plan 6.1), `TONE_RULES` (bảng 6.3) |
| `inherent-final.ts` | ไ– ใ– –ำ เ–า có âm cuối sẵn (plan 6.2) |
| `engine.test.ts` | Bộ test plan 6.3 |
