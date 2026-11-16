# SCR-01 Chào mừng & Đăng nhập  (route: /login)  — Requirements: L-01, L-02, L-03, L-04, L-07, L-09

> Trạng thái: **✅ Owner duyệt 2026-11-15** (M0.5a · D0.4). Luồng: `../flows.md` §2–§4.
>
> **Phase 1 (2026-11-15): chỉ nút Google.** Nút Facebook và dialog **D3 (liên kết tài khoản)** thuộc **Phase 2 (M12.5)** — ẩn sau flag `VITE_ENABLE_FACEBOOK_LOGIN`. Khi ẩn, card chỉ còn: tiêu đề → nút Google → "hoặc" → nút Guest.

## Mục đích
Màn đầu tiên người mới thấy: hiểu app làm gì trong 5 giây và chọn **đăng nhập** hoặc **học ngay không cần tài khoản**.

## Dữ liệu
- Trạng thái phiên (Firebase `onUserChanged`): đã đăng nhập → chuyển hướng `/` (hoặc `?next=`).
- Trạng thái mạng (online/offline).
- Có tiến độ Guest hay không (để quyết định hiện hộp thoại chuyển tiến độ sau đăng nhập).

## Bố cục (desktop 1440, Bare layout biến thể 2 cột)

```
┌───────────────────────────────────────────────────────────────────────┐
│ [Logo Nôm]                                                            │
│                                                                       │
│   Học tiếng Thái,                     ┌───────────────────────────┐   │
│   nhìn là nhớ.            (H1 40px)   │  Bắt đầu học              │   │
│                                       │                           │   │
│   Mỗi chữ cái gắn với một hình ảnh    │  [G  Tiếp tục với Google ]│   │
│   và mẹo nhớ. Học bằng flashcard và   │  [f  Tiếp tục với Facebook]│   │
│   trò chơi ngắn mỗi ngày.             │                           │   │
│                                       │  ───────── hoặc ─────────  │   │
│   ┌────────────────┐                  │                           │   │
│   │  🐔            │  ← thẻ ví dụ     │  [ Học không cần đăng nhập ]│  │
│   │  ก             │    (tĩnh,        │  Tiến độ chỉ lưu trên      │   │
│   │  ko kai · con gà│    minh họa)    │  trình duyệt này.          │   │
│   │  ˧ Ngang       │                  │                           │   │
│   └────────────────┘                  └───────────────────────────┘   │
│                                                                       │
│              Chính sách quyền riêng tư · Điều khoản sử dụng           │
└───────────────────────────────────────────────────────────────────────┘
   Cột trái ~55%                         Cột phải: card 400px, viền border
```

- **Cột trái:** H1 40px semibold, đoạn mô tả 18px `fg-muted` (tối đa 2 dòng), **thẻ ví dụ** tĩnh: emoji Noto 🐔 (48px), chữ ก (`th-lg` 64px), dòng "ko kai · con gà", nhãn thanh `<ToneTag tone="mid">` (contour SVG + "Ngang", D10) màu `tone.mid`. Thẻ chỉ để minh họa, không tương tác.
- **Cột phải:** card nền `surface`, viền `border`, radius `lg`, padding 32px:
  - Tiêu đề "Bắt đầu học" (20px semibold).
  - Nút **Google** (theo branding Google: nền trắng, viền `#747775`, logo G màu), cao 44px, full-width.
  - Nút **Facebook** (nền `#1877F2`, chữ trắng, logo f), cao 44px, full-width.
  - Đường kẻ "hoặc".
  - Nút phụ **"Học không cần đăng nhập"** (viền `border-strong`), full-width + chú thích 14px `fg-muted`.
- Chân trang: link `/privacy`, `/terms`.

## Hành động
| Thao tác | Kết quả |
|---|---|
| "Tiếp tục với Google" | Mở popup Google (flows §3) |
| "Tiếp tục với Facebook" | Mở popup Facebook (flows §3) |
| "Học không cần đăng nhập" | Ghi nhớ lựa chọn Guest → `/` |
| `Enter` khi focus nút | Như click |
| Đăng nhập thành công, lần đầu | Dialog **Tên hiển thị** → (nếu có tiến độ Guest) Dialog **Chuyển tiến độ** → `/` hoặc `next` |
| Đăng nhập thành công, không phải lần đầu | (nếu có tiến độ Guest) Dialog **Chuyển tiến độ** → `/` |
| Email trùng provider khác | Dialog **Liên kết tài khoản** (flows §4) |

## Dialog đi kèm

**D1 — Tên hiển thị (L-03)**
- Tiêu đề: "Chào mừng bạn!" · Nội dung: "Tên này sẽ hiển thị trong ứng dụng. Bạn có thể đổi sau trong Tài khoản."
- Ô nhập, điền sẵn tên từ Google/Facebook; 2–30 ký tự, không để trống.
- Nút: **"Tiếp tục"** (không có nút huỷ; `Esc` không đóng).

**D2 — Chuyển tiến độ (L-07)**
- Tiêu đề: "Chuyển tiến độ vào tài khoản?" · Nội dung: "Bạn đã học một ít khi chưa đăng nhập trên trình duyệt này. Chuyển tiến độ đó vào tài khoản **{tên}**?"
- Nút: "Bắt đầu mới" (phụ) · **"Chuyển tiến độ"** (chính).
- Sau khi chuyển: toast "Đã chuyển tiến độ vào tài khoản."

**D3 — Liên kết tài khoản (L-04) — Phase 2**
- Tiêu đề: "Email này đã được dùng" · Nội dung: "**{email}** đã đăng nhập bằng **{provider cũ}**. Đăng nhập bằng {provider cũ} để liên kết {provider mới} vào cùng tài khoản."
- Nút: "Huỷ" · **"Đăng nhập bằng {provider cũ}"**.
- Thành công: toast "Đã liên kết {provider mới}."

## Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Như bố cục |
| Đang xác định phiên | Card hiện skeleton 3 nút (không chớp nội dung) |
| Đang đăng nhập (popup mở) | Nút vừa bấm hiện spinner + "Đang mở…"; 2 nút còn lại vô hiệu |
| Huỷ đăng nhập (đóng popup) | Toast thông tin: "Bạn đã huỷ đăng nhập." |
| Popup bị chặn | Thông báo trong card (nền `warning-subtle`): "Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup cho trang này rồi thử lại." |
| Lỗi mạng / lỗi khác | Thông báo trong card (nền `danger-subtle`): "Không đăng nhập được. Kiểm tra kết nối mạng rồi thử lại." + mã lỗi nhỏ để báo cáo |
| Offline | 2 nút Google/Facebook vô hiệu + dòng "Cần kết nối mạng để đăng nhập". Nút Guest vẫn dùng được |
| Đã đăng nhập | Không hiển thị màn này → chuyển `/` (hoặc `next`) |

## Câu chữ (tiếng Việt)
- H1: "Học tiếng Thái, nhìn là nhớ."
- Mô tả: "Mỗi chữ cái gắn với một hình ảnh và mẹo nhớ. Học bằng flashcard và trò chơi ngắn mỗi ngày."
- Card: "Bắt đầu học" · "Tiếp tục với Google" · "Tiếp tục với Facebook" · "hoặc" · "Học không cần đăng nhập" · "Tiến độ chỉ lưu trên trình duyệt này."
- Chân trang: "Chính sách quyền riêng tư" · "Điều khoản sử dụng".

## Lưu ý chữ Thái
- Thẻ ví dụ: ก cỡ 64px, `font.family.th`, `line-height.th`, `lang="th"`.
- Phiên âm "ko kai" dùng font Việt, không dấu (quy ước plan mục 3).

## Ngoài phạm vi
Đăng nhập email/mật khẩu, Apple, "Ghi nhớ tôi", chọn ngôn ngữ, onboarding nhiều bước, ảnh minh họa lớn.
