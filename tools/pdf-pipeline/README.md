# tools/pdf-pipeline

Pipeline trích xuất PDF giáo trình → content (CSV/JSON theo schema mục 5.5 của plan).

- Ngôn ngữ: **Python 3.12**, quản lý bằng `uv`, test `pytest`, lint `ruff` (plan mục 7.0).
- **Chưa implement** — làm ở **M4** (cần SETUP S9 + PDF mẫu S10).
- Ranh giới với phần TypeScript: file CSV/JSON theo schema 5.5 (+ JSON Schema sinh từ Zod để validate sơ bộ).
