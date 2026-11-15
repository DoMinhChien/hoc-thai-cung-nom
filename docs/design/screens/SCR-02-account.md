# SCR-02 Tài khoản & trang pháp lý  — Requirements: L-04, L-05, L-08, L-10; mục 4.0 (yêu cầu Google/Facebook)

> Trạng thái: **✅ Owner duyệt 2026-11-15** (M0.5a · D0.4). Luồng: `../flows.md` §5–§6.
>
> **Phase 1 (2026-11-15):** khối "Phương thức đăng nhập" chỉ có dòng **Google · Đã liên kết** (không nút). Dòng Facebook + nút Liên kết / Huỷ liên kết thuộc **Phase 2 (M12.5)**.

---

## A. Tài khoản  (route: /account · App layout · cần đăng nhập)

### Mục đích
Xem và sửa hồ sơ, quản lý phương thức đăng nhập, đăng xuất, xoá tài khoản.

### Dữ liệu
Firebase user: `displayName`, `email`, `photoURL`, `metadata.creationTime`, danh sách provider đã liên kết. Trạng thái mạng.

### Bố cục (vùng nội dung, max 720px, các khối xếp dọc, cách nhau 32px)

```
Tài khoản                                           (H1)
Quản lý hồ sơ và cách bạn đăng nhập.                (mô tả)

┌ Hồ sơ ─────────────────────────────────────────────┐
│ (Avatar 64)  Tên hiển thị  [ Minh Chiến      ] [Lưu]│
│              Email         chien@…  (chỉ đọc)       │
│              Tham gia      15/11/2026               │
└────────────────────────────────────────────────────┘

┌ Phương thức đăng nhập ─────────────────────────────┐
│ [G] Google     Đã liên kết · chien@…   [Huỷ liên kết]│
│ [f] Facebook   Chưa liên kết           [Liên kết]   │
└────────────────────────────────────────────────────┘

┌ Dữ liệu học tập ───────────────────────────────────┐
│ Tiến độ đang lưu trên trình duyệt này. Đồng bộ     │
│ nhiều thiết bị sẽ có trong bản cập nhật sau.       │
│ Sao lưu / khôi phục: Cài đặt → Xuất dữ liệu  (link)│
└────────────────────────────────────────────────────┘

┌ Phiên đăng nhập ───────────────────────────────────┐
│ [Đăng xuất]                                         │
└────────────────────────────────────────────────────┘

┌ Vùng nguy hiểm (viền danger) ──────────────────────┐
│ Xoá tài khoản                                       │
│ Xoá vĩnh viễn tài khoản và toàn bộ tiến độ trên     │
│ trình duyệt này. Không thể khôi phục. [Xoá tài khoản]│
└────────────────────────────────────────────────────┘
```

- Mỗi khối: card nền `surface`, viền `border`, radius `lg`, padding 24px, tiêu đề khối 16px semibold.
- **Vùng nguy hiểm**: viền `danger`, nút nền `danger`.

### Hành động
| Thao tác | Kết quả |
|---|---|
| Sửa tên → "Lưu" (hoặc `Enter`) | Validate 2–30 ký tự → lưu → toast "Đã lưu tên hiển thị." Nút "Lưu" chỉ bật khi tên thay đổi |
| "Liên kết" (Facebook/Google) | Popup provider → thành công: toast "Đã liên kết {provider}." |
| "Huỷ liên kết" | Dialog xác nhận → huỷ → toast. **Vô hiệu** nếu đây là phương thức duy nhất, tooltip: "Cần ít nhất một cách đăng nhập." |
| "Đăng xuất" | Dialog xác nhận (SCR-00) → `/login` |
| "Xoá tài khoản" | Dialog xoá (bên dưới) |

### Dialog xoá tài khoản (L-08)
- Tiêu đề: "Xoá tài khoản?"
- Nội dung: "Toàn bộ tiến độ học trên trình duyệt này và tài khoản **{tên}** sẽ bị xoá vĩnh viễn. Không thể khôi phục."
- Ô nhập: "Gõ **XOÁ** để xác nhận" — nút xoá chỉ bật khi gõ đúng.
- Nút: "Huỷ" · **"Xoá vĩnh viễn"** (nền `danger`).
- Nếu phiên cũ → popup đăng nhập lại provider → tiếp tục xoá.
- Xong: chuyển `/login`, toast "Đã xoá tài khoản."

### Trạng thái
| Trạng thái | Hiển thị |
|---|---|
| Guest truy cập | Chuyển `/login?next=/account` |
| Đang tải | Skeleton cho khối Hồ sơ |
| Đang lưu / liên kết / xoá | Nút tương ứng hiện spinner, các nút khác trong khối vô hiệu |
| Lỗi | Thông báo trong khối (nền `danger-subtle`) + "Thử lại" |
| Offline | Lưu tên / liên kết / huỷ liên kết / xoá **vô hiệu**, dòng "Cần kết nối mạng". Đăng xuất vẫn dùng được |
| Không có ảnh đại diện | Avatar chữ cái đầu của tên, nền `accent-subtle`, chữ `accent` |

### Câu chữ
"Tài khoản" · "Quản lý hồ sơ và cách bạn đăng nhập." · "Hồ sơ" · "Tên hiển thị" · "Email" · "Tham gia" · "Lưu" · "Phương thức đăng nhập" · "Đã liên kết" · "Chưa liên kết" · "Liên kết" · "Huỷ liên kết" · "Dữ liệu học tập" · "Phiên đăng nhập" · "Đăng xuất" · "Vùng nguy hiểm" · "Xoá tài khoản".
Facebook không trả email → dòng Email hiện "Không có".

---

## B. Trang pháp lý  (Bare layout · public)

Cả 3 trang dùng chung mẫu: H1 + "Cập nhật lần cuối: {ngày}" (`fg-muted`) + nội dung dạng văn bản (16px, line-height 1.6, tối đa 720px) + mục lục neo (anchor) nếu > 4 mục. **Nội dung là bản nháp — owner duyệt trước go-live (M12).**

### B1. `/privacy` — Chính sách quyền riêng tư
Các mục: Chúng tôi thu thập gì (tên, email, ảnh đại diện từ Google/Facebook) · Dùng để làm gì (đăng nhập, hiển thị tên) · Tiến độ học lưu ở đâu (trên trình duyệt của bạn, Phase 1) · Dịch vụ bên thứ ba (Firebase Authentication – Google; Azure Static Web Apps – Microsoft) · Không bán dữ liệu, không quảng cáo, không phân tích hành vi · Quyền của bạn & cách xoá dữ liệu (link B3) · Liên hệ.

### B2. `/terms` — Điều khoản sử dụng
Các mục: Giới thiệu dịch vụ · Tài khoản · Nội dung học (giáo trình được sử dụng với sự đồng ý của giáo viên) · Sử dụng hợp lý · Giới hạn trách nhiệm · Thay đổi điều khoản · Liên hệ.

### B3. `/account/delete-instructions` — Hướng dẫn xoá dữ liệu (yêu cầu của Facebook)
1. Đăng nhập vào Học Thai cùng Nôm.
2. Vào **Tài khoản** → **Vùng nguy hiểm** → **Xoá tài khoản**.
3. Gõ **XOÁ** để xác nhận.
- Nếu không đăng nhập được: liên hệ **dominhchien206@gmail.com** kèm email tài khoản, xử lý trong 30 ngày.
- Gỡ quyền app khỏi Facebook: Cài đặt Facebook → Ứng dụng và trang web → gỡ "Học Thai cùng Nôm".

### Thông tin từ owner
- ✅ **Email liên hệ:** `dominhchien206@gmail.com` — dùng ở mục "Liên hệ" của `/privacy`, `/terms` và hướng dẫn xoá dữ liệu.

## Lưu ý chữ Thái
Không có chữ Thái trên các màn này.

## Ngoài phạm vi
Đổi ảnh đại diện, đổi email, xuất dữ liệu (nằm ở Cài đặt – G-02), đồng bộ (Phase 2), thông báo email.
