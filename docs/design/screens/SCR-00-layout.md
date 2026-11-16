# SCR-00 Khung chung (App layout · Bare layout)  — Requirements: L-06, L-09, G-04

> Trạng thái: **✅ Owner duyệt 2026-11-15** (M0.5a · D0.4). Tokens: `../tokens.json`.

## Mục đích
Khung dùng lại cho mọi màn hình: điều hướng, khối tài khoản, vị trí thông báo. Các màn sau chỉ thiết kế **vùng nội dung**.

## 1. App layout (mọi màn học)

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ [Logo Nôm]   │  (badge Ngoại tuyến – chỉ hiện khi offline)        top-right │
│              │                                                          │
│ HỌC          │   Tiêu đề trang (H1, 30px)              [Hành động chính] │
│ ▸ Tổng quan  │   Mô tả ngắn (fg-muted, 16px)                            │
│   Bài học    │                                                          │
│   Bài tập (12)│   ┌──────────────────────────────────────────────────┐   │
│   Sổ từ      │   │                                                  │   │
│   Trò chơi   │   │            Nội dung trang (max 1040px)           │   │
│              │   │                                                  │   │
│              │   └──────────────────────────────────────────────────┘   │
│              │                                                          │
│              │                                                          │
│ CỦA BẠN      │                                                          │
│   Tiến độ    │                                                          │
│   Cài đặt    │                                                          │
│              │                                                          │
│ ──────────── │                                                          │
│ [Khối tài    │                                                          │
│  khoản]      │                                                          │
└──────────────┴──────────────────────────────────────────────────────────┘
  240px, bg-subtle            padding 40px, nội dung căn giữa
```

**Sidebar (240px, nền `bg-subtle`, viền phải `border`)**
- Trên cùng: `<AppLogo />` → link `/`.
- Nhóm **"Học"**: Tổng quan (`/`), Bài học (`/units`), Bài tập (`/practice`), Sổ từ (`/words`), Trò chơi (`/games`). *(v7 — 2026-11-16: bỏ Bảng chữ cái, Thanh điệu, Đọc, Nghe; "Ôn tập" → "Bài tập".)*
- Nhóm **"Của bạn"**: Tiến độ, Cài đặt.
- Mục **Bài tập** có badge số câu đến hạn (ẩn khi = 0). *(Số liệu có từ M7; ở M1 ẩn badge.)*
- Mục đang chọn: nền `accent-subtle`, chữ `accent`, font medium. Hover: nền `bg`.
- Mỗi mục có icon outline 18px (thư viện `lucide-react`) + nhãn 14px.
- **Không** còn mục "Tài khoản" trong danh sách — chuyển xuống **khối tài khoản** ở đáy.

**Khối tài khoản (đáy sidebar)**
| Trạng thái | Hiển thị | Hành động |
|---|---|---|
| Guest | Avatar chữ "K" (nền `border`) · **"Khách"** · dòng phụ "Tiến độ chỉ lưu trên trình duyệt này" | Nút phụ **"Đăng nhập"** → `/login` |
| Đã đăng nhập | Avatar (ảnh provider, fallback chữ cái đầu) · **tên hiển thị** · email (fg-muted, cắt `…`) | Click → menu: **Tài khoản** (`/account`), **Đăng xuất** |
| Offline | Như trên + badge nhỏ "Ngoại tuyến" | Nút "Đăng nhập" bị vô hiệu, tooltip "Cần kết nối mạng" |

**Vùng nội dung**
- Padding 40px, nội dung tối đa `content-max` 1040px, căn giữa trong vùng còn lại.
- **Page header** chuẩn: H1 30px semibold + mô tả 16px `fg-muted`; hành động chính (nếu có) căn phải cùng hàng H1.
- **Badge "Ngoại tuyến"** (nền `warning-subtle`, chữ `warning`, icon wifi-off) ở góc trên phải khi mất mạng.

## 2. Bare layout (`/login`, trang pháp lý)
- Không sidebar. Logo góc trên trái (link `/`).
- Nội dung căn giữa, tối đa `bare-max` 720px (riêng `/login` dùng bố cục 2 cột — xem SCR-01).
- Chân trang: "Chính sách quyền riêng tư · Điều khoản sử dụng" (14px, `fg-muted`).

## 3. Focus layout (dành chỗ, thiết kế ở M0.5b)
Cho `/practice/session`, `/units/:unitId/:lessonId`, `/games/:id`: ẩn sidebar, thanh trên cùng gồm nút **Thoát (Esc)** + thanh tiến độ mảnh.

## 4. Thành phần dùng chung trong khung
| Thành phần | Quy định |
|---|---|
| **Toast** | Góc dưới phải, tự ẩn sau 4s, tối đa 3 cái; loại: thông tin / thành công / lỗi (icon + chữ) |
| **Dialog** | Giữa màn, rộng 440px, `shadow-md`, radius `lg`; nút chính bên phải, nút huỷ bên trái; `Esc` đóng (trừ dialog bắt buộc) |
| **Nút** | Chính: nền `accent` · Phụ: viền `border-strong` · Nguy hiểm: nền `danger` · Ghost: chỉ chữ. Cao 40px, radius `md` |
| **Focus ring** | 2px `accent`, offset 2px, mọi phần tử tương tác |
| **Skip link** | "Bỏ qua tới nội dung chính" — hiện khi Tab lần đầu |

## Hành động
| Thao tác | Kết quả |
|---|---|
| Click logo | Về `/` |
| Click mục sidebar | Điều hướng; mục đang chọn được tô |
| Click khối tài khoản (đã đăng nhập) | Mở menu Tài khoản / Đăng xuất |
| Đăng xuất | Dialog xác nhận → sign out → `/login` (flows.md §5) |
| `Tab` | Đi qua skip link → sidebar → nội dung |

## Trạng thái
| Trạng thái | Khác biệt |
|---|---|
| Guest | Khối tài khoản dạng Guest |
| Đã đăng nhập | Khối tài khoản có avatar + tên |
| Đang xác định phiên (app vừa mở) | Khối tài khoản hiện skeleton; **không** chớp sang trạng thái Guest |
| Offline | Badge "Ngoại tuyến" + vô hiệu nút cần mạng |
| Màn hình 1024–1279px | Sidebar giữ 240px, padding nội dung giảm còn 24px |

## Câu chữ (tiếng Việt)
- Nhóm nav: "Học", "Của bạn".
- Nav: "Tổng quan", "Bài học", "Bài tập", "Sổ từ", "Trò chơi", "Tiến độ", "Cài đặt".
- Khối tài khoản: "Khách", "Tiến độ chỉ lưu trên trình duyệt này", "Đăng nhập", "Tài khoản", "Đăng xuất".
- Dialog đăng xuất: tiêu đề "Đăng xuất?", nội dung "Tiến độ của bạn vẫn được giữ trên máy này và sẽ hiện lại khi bạn đăng nhập lại.", nút "Huỷ" / "Đăng xuất".
- Badge: "Ngoại tuyến".

## Lưu ý chữ Thái
Khung không chứa chữ Thái. Mọi chữ Thái trong vùng nội dung dùng `font.family.th`, `line-height.th` = 1.75, gắn `lang="th"`.

## Ngoài phạm vi
Mobile / sidebar thu gọn, dark mode, thanh tìm kiếm, thông báo (notification center).
