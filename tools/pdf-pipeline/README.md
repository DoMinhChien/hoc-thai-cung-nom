# tools/pdf-pipeline

Pipeline trích xuất PDF giáo trình → content theo **mẫu nhập liệu plan mục 0.9** (`content/templates/`).

- Ngôn ngữ: **Python 3.12**, quản lý bằng `uv`, test `pytest`, lint `ruff` (plan mục 7.0).
- **Chưa implement** — làm ở **M4** (cần SETUP S9 + PDF mẫu S10).
- Ranh giới với phần TypeScript: 6 file theo plan 0.9 (`units/lessons/words/sentences.<nguồn>.csv`, `grammar/dialogues.<nguồn>.yaml`) + JSON Schema sinh từ Zod (`packages/core/json-schema/`) để validate sơ bộ.
