# SCR-00 v2 — Khung responsive: iPhone & iPad

> Nguồn: phản hồi CAT 2026-11-22 (owner gửi ảnh chụp iPhone màn `/games`: sidebar 240px chiếm nửa màn hình, nội dung bị ép còn 1 cột chữ, thẻ trò chơi vỡ). Plan §0.15 · ROADMAP **M12.7**.
> Thay G-04 "desktop-first": từ v7.9 app phải dùng tốt trên **iPhone** (dọc) và **iPad** (dọc + ngang). Desktop giữ nguyên như SCR-00 v1.
> Trạng thái: **owner duyệt hướng 2026-11-22** (qua phản hồi). PR thực hiện = thay đổi UI lớn → **owner thử trên máy thật (link preview) rồi mới merge** (AGENTS 8.1).

## 1. Breakpoint

| Tên | Bề rộng | Thiết bị tham chiếu | Khung điều hướng |
|---|---|---|---|
| **phone** | < 744px | iPhone SE 375, iPhone 15 393, Pro Max 430; iPhone xoay ngang ≤ 932 nhưng thấp → xem §6 | **Thanh trên + thanh tab dưới** |
| **tablet** | 744–1023px | iPad mini dọc 744, iPad 10 dọc 820, iPad Air/Pro 11 dọc 820–834 | **Rail icon 72px** bên trái (icon + nhãn nhỏ dưới icon) |
| **desktop** | ≥ 1024px | iPad Pro 12.9 dọc 1024, mọi iPad ngang (1133–1366), laptop | Sidebar 240px hiện tại (SCR-00 v1) |

Tailwind: thêm screen `tablet: 744px`, giữ `lg: 1024px`. Mobile-first: class gốc = phone.

## 2. Khung phone

- **Thanh trên** (56px + `env(safe-area-inset-top)`, dính đầu trang): logo nhỏ (về `/`), `StreakBadge` dạng gọn (🔥 + số), `OfflineBadge` khi offline, avatar → `/account`.
- **Thanh tab dưới** (56px + `env(safe-area-inset-bottom)`, cố định): 5 tab icon + nhãn 11–12px:
  **Tổng quan · Bài học · Bài tập** (kèm `DueBadge`) **· Trò chơi · Thêm**.
  "Thêm" mở bottom sheet: Sổ từ, Tiến độ, Cài đặt, khối tài khoản (`AccountBlock`). Tab đang ở = màu accent + nền nhạt; `aria-current="page"`.
- **Luồng toàn màn hình ẩn thanh tab** (và thanh trên đổi thành thanh "✕ Thoát + tiến độ"): bài học `/units/:u/:l`, phiên bài tập `/practice/session`, màn chơi `/games/:id`. Thoát có xác nhận như hiện tại.
- Nội dung: padding ngang 16px, 1 cột; `padding-bottom` chừa thanh tab + safe area.

## 3. Khung tablet

Rail 72px (icon 24px + nhãn 11px), streak/offline/avatar dồn xuống đáy rail. Nội dung padding 24px, tối đa 2 cột (lưới Lộ trình 2 cột, thẻ trò chơi 2 cột). Luồng toàn màn hình: ẩn rail như phone.

## 4. Quy tắc nội dung theo màn

| Màn | Phone | Tablet |
|---|---|---|
| `/` Tổng quan | Các khối xếp dọc; "Học tiếp" lên đầu | 2 cột |
| `/units` Lộ trình | Lưới **1 cột**, thẻ ngang (emoji trái, chữ phải) | 2 cột |
| Bài học (4 bước) | Thẻ từ full-width; nút Tiếp dính đáy (trên safe area); hội thoại dạng bong bóng | Như phone, tối đa 640px giữa màn |
| `/practice` + phiên | Đáp án trắc nghiệm xếp dọc, nút ≥ 48px; Xếp câu: token xuống dòng, chạm để chọn/bỏ | Như phone, tối đa 720px |
| `/words` Sổ từ | Bảng → **danh sách thẻ**; bộ lọc thu vào nút "Lọc" (sheet) | Bảng gọn 3 cột |
| `/games` | Nguồn = select full-width; Chủ đề = hàng cuộn ngang; **Kỹ năng = segmented cuộn ngang 1 dòng** (không để chữ xuống dòng từng chữ như ảnh lỗi); thẻ trò **1 cột** (thumbnail 16:9 trên, tên + mô tả dưới) | 2 cột |
| Màn chơi | Xem §5 | Như phone, khung chơi co theo màn |
| `/progress` | Biểu đồ full-width, cuộn dọc; bảng → thẻ | 2 cột |
| `/settings`, `/account`, `/login`, pháp lý | 1 cột, form full-width | tối đa 640px |

Chung: không bao giờ có **cuộn ngang trang** (`scrollWidth ≤ innerWidth` ở mọi route). Tiêu đề trang 24px phone / 28px tablet. Chữ Thái (Sarabun) không nhỏ hơn 20px ở phone khi là nội dung học.

## 5. Trò chơi trên cảm ứng

Mọi trò phải chơi được **chỉ bằng chạm** (giữ nguyên bàn phím cho desktop):
- Ghép cặp, Đúng hay sai?, Đoán loại từ, Đố vui truyền hình: chạm-chọn; nút ≥ 48px.
- Xếp câu tốc độ: chạm token để thêm / chạm ở dòng trả lời để bỏ (không bắt buộc kéo-thả).
- Đập chuột: lưới 3×3 vừa khung (ô ≥ 88px), chạm vào ô.
- Máy bay: **nút ▲ ▼ lớn** ở góc phải dưới + chạm nửa trên/nửa dưới khung để lái.
- Mê cung: **D-pad ảo** dưới khung + vuốt (swipe ≥ 30px) để đi.
- Khung chơi tính theo `100dvh` trừ thanh trên; không dùng hover làm trạng thái duy nhất; `touch-action: manipulation` để bỏ trễ chạm / zoom 2 lần chạm.

## 6. iOS / Safari

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; dùng `env(safe-area-inset-*)` cho thanh trên/dưới (tai thỏ, Dynamic Island, thanh home).
- Chiều cao dùng `dvh` (không `100vh`).
- Ô nhập chữ **font ≥ 16px** (tránh iOS tự zoom). Khi bàn phím hệ thống mở: giữ ô nhập trong tầm nhìn (`visualViewport` resize → cuộn tới ô).
- **Bàn phím Thái:** trên thiết bị cảm ứng mặc định **ẩn bàn phím ảo M8**, dùng bàn phím iOS (người học đã cài bàn phím Thái); có nút "⌨︎ Bàn phím Thái" để bật bàn phím ảo — khi bật thì dock ở đáy, `inputmode="none"` để iOS không mở bàn phím hệ thống chồng lên.
- PWA "Thêm vào MH chính": `apple-touch-icon` 180px, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color` theo nền kem.
- iPhone xoay ngang (cao < 500px): thanh tab dưới vẫn hiện nhưng chỉ icon; màn chơi ưu tiên chiều ngang của khung.

## 7. Truy cập & kiểm thử

- Vùng chạm ≥ 44×44px (WCAG 2.5.8 / Apple HIG). Focus ring, skip link, axe vẫn đạt như desktop.
- Playwright thêm project thiết bị: **WebKit iPhone 15** (393×852), **WebKit iPad mini** dọc (744×1133), **WebKit iPad Pro 11 ngang** (1194×834); Chromium Pixel 7 tuỳ chọn. Test chung "không tràn ngang" cho mọi route, điều hướng qua thanh tab / sheet "Thêm", chơi trọn 1 ván Máy bay + Mê cung bằng chạm, baseline ảnh phone + tablet.
- Owner thử trên **iPhone + iPad thật** qua link preview của PR trước khi merge.
