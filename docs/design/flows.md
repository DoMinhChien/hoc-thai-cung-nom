# Sitemap & luồng — Phase 1

> Trạng thái: **✅ Owner duyệt 2026-11-15** (M0.5a · D0.2). Requirement: L-01..L-10 (plan 4.0).

## 1. Sitemap Phase 1

```mermaid
flowchart LR
  subgraph Bare["Bare layout (không sidebar)"]
    LOGIN["/login<br/>Chào mừng & Đăng nhập"]
    PRIV["/privacy"]
    TERMS["/terms"]
    DEL["/account/delete-instructions"]
  end
  subgraph App["App layout (sidebar)"]
    DASH["/ Dashboard"]
    ALPHA["/alphabet"] --> ALPHAP["/alphabet/practice"]
    TONES["/tones"]
    VOCAB["/vocab"] --> DECK["/vocab/:deckId"]
    REVIEW["/review (focus)"]
    READ["/reading"] --> READD["/reading/:id"]
    LISTEN["/listening"]
    GAMES["/games"] --> GAME["/games/:id (focus)"]
    PROG["/progress"]
    SET["/settings"]
    ACC["/account (cần đăng nhập)"]
  end
  LOGIN --> DASH
  DASH --- ALPHA & TONES & VOCAB & REVIEW & READ & LISTEN & GAMES & PROG & SET & ACC
  LOGIN -.link chân trang.- PRIV & TERMS
  ACC -.-> DEL
```

**Quy tắc truy cập**
| Route | Guest | Đã đăng nhập |
|---|---|---|
| `/login` | ✅ | Chuyển về `/` |
| Mọi route học (`/`, `/alphabet`…) | ✅ (dữ liệu lưu trên trình duyệt này) | ✅ |
| `/account` | Chuyển về `/login?next=/account` | ✅ |
| `/privacy`, `/terms`, `/account/delete-instructions` | ✅ public | ✅ |

## 2. Lần đầu mở app

```mermaid
flowchart TD
  A[Mở app] --> B{Đã từng chọn?}
  B -- Chưa --> L[/login: Chào mừng/]
  B -- Đã đăng nhập --> D[Dashboard]
  B -- Đã chọn Guest --> D
  L -->|Tiếp tục với Google / Facebook| AUTH[Luồng 3]
  L -->|Học không cần đăng nhập| G[Ghi nhớ lựa chọn Guest] --> D
```

## 3. Đăng nhập (Google / Facebook)

```mermaid
flowchart TD
  S[Bấm Tiếp tục với Google/Facebook] --> P[Popup của provider]
  P -->|Đóng popup / huỷ| E1[Toast: Bạn đã huỷ đăng nhập] --> L[/login/]
  P -->|Popup bị chặn| E2[Thông báo: Cho phép popup rồi thử lại] --> L
  P -->|Lỗi mạng| E3[Thông báo: Không kết nối được, thử lại] --> L
  P -->|Email đã dùng với provider khác| LINK[Luồng 4: Liên kết tài khoản]
  P -->|Thành công| F{Lần đầu đăng nhập?}
  F -- Có --> N[Hộp thoại: Xác nhận tên hiển thị - L-03]
  N --> T{Guest có tiến độ?}
  F -- Không --> T
  T -- Có --> M[Hộp thoại: Chuyển tiến độ hiện tại vào tài khoản? - L-07]
  M -->|Chuyển| C[Copy dữ liệu guest → DB của user] --> D[Dashboard / trang next]
  M -->|Không, bắt đầu mới| D
  T -- Không --> D
```

## 4. Liên kết tài khoản cùng email (L-04)

```mermaid
flowchart TD
  A[Đăng nhập Facebook, email trùng tài khoản Google đã có] --> B[Hộp thoại: Email này đã dùng với Google]
  B -->|Đăng nhập bằng Google để liên kết| C[Popup Google] --> D[Liên kết Facebook vào tài khoản] --> E[Toast: Đã liên kết Facebook] --> F[Dashboard]
  B -->|Huỷ| G[/login/]
```

## 5. Đăng xuất

```mermaid
flowchart TD
  A[Menu tài khoản → Đăng xuất] --> B[Hộp thoại xác nhận] --> C[Sign out] --> D[/login/]
  C -.-> N[Dữ liệu của user vẫn giữ trên máy, chỉ hiện lại khi đăng nhập lại]
```

## 6. Xoá tài khoản (L-08)

```mermaid
flowchart TD
  A[/account → Xoá tài khoản/] --> B[Hộp thoại cảnh báo: mất toàn bộ tiến độ, không khôi phục được]
  B --> C[Gõ XOÁ để xác nhận] --> D{Phiên đăng nhập còn mới?}
  D -- Không --> R[Yêu cầu đăng nhập lại] --> E
  D -- Có --> E[Xoá user Firebase + xoá IndexedDB của user]
  E --> F[/login + toast: Đã xoá tài khoản/]
```

## 7. Offline (L-09)
- Đã đăng nhập trước đó + mất mạng → vẫn vào app, header hiện badge **"Ngoại tuyến"**.
- Nút đăng nhập / liên kết / xoá tài khoản bị **vô hiệu** khi offline, kèm giải thích.
