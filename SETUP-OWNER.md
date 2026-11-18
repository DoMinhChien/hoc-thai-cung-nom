# SETUP-OWNER — Việc owner (John) làm tay

> Agent **không** làm các bước này (cần đăng nhập tài khoản cá nhân, thanh toán, hoặc secret).
> Làm xong bước nào → tick ✅ và điền mục **"Đầu ra cho agent"** (giá trị không bí mật) hoặc ghi chỗ lưu (giá trị bí mật).
> Giao diện các trang quản trị (Azure, Firebase, Meta, Google) có thể thay đổi; tên menu dưới đây là gần đúng.

## Tổng quan

| # | Việc | Cần trước | Thời gian ước tính | Trạng thái |
|---|---|---|---|---|
| S0 | Cài công cụ trên máy | M0 | 20 phút | ☐ |
| S1 | Tạo GitHub repo | M0 (deploy) | 5 phút | ◐ Đã tạo repo + đẩy code — còn: bảo vệ `main` |
| S2 | Azure: resource group + Static Web App | M0 (deploy) | 15 phút | ✅ |
| S3 | Azure Budget alert | M0 | 5 phút | ☐ |
| S4 | Firebase project + Authentication | M1 | 15 phút | ✅ project `hoc-thai-cung-nom` (2026-11-15) |
| S5 | Google sign-in + OAuth consent screen | M1 (bật), M12 (publish) | 15 phút | ◐ Bật Google, Branding, Audience (Testing) + test user ✅ — còn: publish ở M12 |
| S6 | Facebook App + Facebook Login | **Phase 2 — M12.5** | 30 phút + thời gian Meta duyệt | ⏸ Dời sang Phase 2 (2026-11-15) |
| S7 | GitHub Variables / Secrets | M0–M1 | 5 phút | ✅ Secret SWA + 4 Variables Firebase (2026-11-15) |
| S8 | Giới hạn Firebase API key | M12 | 5 phút | ☐ |
| S9 | Anthropic API key + giới hạn chi tiêu | M4 | 10 phút | ☐ |
| S10 | Nội dung: PDF mẫu, duyệt content mẫu, nội dung thật 16 unit | M3, M4, M6+ | — | ◐ content mẫu M3 ✅, PDF mẫu ✅ (2026-11-17) — còn đáp án + danh sách chuyên đề từ giáo viên, duyệt content mẫu M6/M6.1, nội dung thật |
| S11 | Duyệt thiết kế từng đợt | M0.5a, M0.5b | — | ◐ M0.5a ✅ duyệt 2026-11-15 — còn M0.5b |
| S12 | Email liên hệ cho trang pháp lý, Google consent screen, Facebook App | M1 | 2 phút | ✅ `dominhchien206@gmail.com` |

---

## S0 — Cài công cụ trên máy (trước khi giao M0)
| Công cụ | Ghi chú |
|---|---|
| **Node.js LTS** | Kiểm tra: `node -v` |
| **pnpm** | `npm i -g pnpm` (hoặc `corepack enable`) |
| **Git** | Kiểm tra: `git --version` |
| **Java JDK 11+** | **Bắt buộc** cho Firebase Auth Emulator. Kiểm tra: `java -version` |
| **Firebase CLI** | `npm i -g firebase-tools` |
| **GitHub CLI `gh`** (tùy chọn) | Để agent tự tạo PR: `gh auth login` |
| **Python 3.12 + uv** | Chỉ cần trước **M4** (pipeline PDF) |

> Trình duyệt cho Playwright do agent tự cài ở M0 (`pnpm exec playwright install`).

## S1 — GitHub repo
1. Tạo repo **private** (vd. `hoc-thai-cung-nom`) trên tài khoản cá nhân.
2. Đẩy nội dung thư mục này lên (`AGENTS.md`, `ROADMAP.md`, `SETUP-OWNER.md`, plan).
3. Settings → Branches: bảo vệ `main` (bắt buộc PR, bắt buộc CI pass).

**Đầu ra cho agent:** URL repo: https://github.com/DoMinhChien/hoc-thai-cung-nom

- [x] 1. Tạo repo
- [x] 2. Đẩy nội dung thư mục lên (agent làm được ở M0 nếu máy owner đã `gh auth login` / có quyền push)
- [ ] 3. Bảo vệ `main` (làm sau khi CI ở M0 chạy được, để chọn đúng check bắt buộc)

## S2 — Azure Static Web Apps
1. Tạo Resource Group, vd. `rg-hoc-thai-nom` (region gần: Southeast Asia / East Asia).
2. Tạo **Static Web App**, plan **Free**, **Deployment source: Other** (repo đã có workflow riêng `.github/workflows/ci.yml`; chọn GitHub sẽ sinh thêm workflow trùng).
3. Overview → **Manage deployment token** → copy → dán vào GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN` (S7).

**Đầu ra cho agent:** domain production `https://<tên>.azurestaticapps.net`: **https://ashy-tree-0524a9b03.6.azurestaticapps.net**

## S3 — Azure Budget alert
Cost Management → Budgets → tạo budget cho subscription/resource group: ngưỡng cảnh báo **$5** và **$20**/tháng, gửi email cho owner.

## S4 — Firebase project
1. https://console.firebase.google.com → tạo project bằng **tài khoản Google cá nhân**, gói **Spark** (không cần thẻ). Có thể tắt Google Analytics.
2. Project settings → **Add app → Web** → lấy config (`apiKey`, `authDomain`, `projectId`, `appId`…). *Các giá trị này không phải secret.*
3. Authentication → **Get started**.
4. Authentication → Settings → **User account linking**: chọn *"Link accounts that use the same email"* (một tài khoản cho mỗi email).
5. Authentication → Settings → **Authorized domains**: thêm domain SWA ở S2 (giữ `localhost`).

**Đầu ra cho agent:** điền vào GitHub Variables (S7) và `.env.local` của owner:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

## S5 — Google sign-in
1. Firebase → Authentication → Sign-in method → **Google** → Enable (Firebase tự tạo OAuth client trong Google Cloud).
2. Google Cloud Console (cùng project) → **OAuth consent screen**: tên app "Học Thai cùng Nôm", email hỗ trợ, scope mặc định (`openid`, `email`, `profile`). **Không upload logo** ở Phase 1.
3. **Ở M12 (go-live):** điền link `/privacy`, `/terms` → chuyển trạng thái **In production**.

## S6 — Facebook Login  ⏸ **Phase 2 (M12.5)** — không làm ở Phase 1
1. https://developers.facebook.com → **Create App** bằng tài khoản Facebook cá nhân, chọn use case liên quan **Facebook Login / xác thực người dùng**.
2. Lấy **App ID** và **App Secret** → Firebase → Sign-in method → **Facebook** → Enable, dán App ID/Secret.
3. Copy **OAuth redirect URI** Firebase hiển thị (`https://<project>.firebaseapp.com/__/auth/handler`) → Facebook Login → Settings → **Valid OAuth Redirect URIs**.
4. Quyền chỉ cần `public_profile`, `email`.
5. **Sau khi M1 deploy:** App settings → Basic: điền **Privacy Policy URL** (`/privacy`), **Terms of Service URL** (`/terms`), **User data deletion → Data deletion instructions URL** (`/account/delete-instructions`), icon app (có thể dùng logo placeholder).
6. **Ở M12:** chuyển app sang **Live**. Nếu Meta yêu cầu xác minh (business/app verification) → làm theo hướng dẫn; việc này có thể mất vài ngày, nên **bắt đầu sớm**.
7. Trong lúc app ở chế độ Development: thêm tài khoản test trong **App roles → Testers** để thử đăng nhập thật.

> App Secret là **bí mật**: chỉ nhập vào Firebase console, **không** đưa vào repo hay gửi cho agent.

## S7 — GitHub Variables / Secrets
Repo → Settings → Secrets and variables → Actions:
- **Variables:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` (từ S4).
- **Secrets:** `AZURE_STATIC_WEB_APPS_API_TOKEN` (deployment token từ S2, đúng tên này) ✅

## S8 — Giới hạn Firebase API key (M12)
Google Cloud Console → APIs & Services → Credentials → API key của Firebase → **Application restrictions: HTTP referrers**: domain SWA + `localhost`.

## S9 — Anthropic API key (trước M4)
1. https://console.anthropic.com → tạo API key.
2. Đặt **giới hạn chi tiêu hằng tháng** trong console.
3. Lưu key trong `tools/pdf-pipeline/.env` **trên máy owner** (`ANTHROPIC_API_KEY=`). Không commit, không gửi vào chat.

## S10 — Nội dung
- [x] Gửi **PDF giáo trình mẫu** → `sources/03-loai-tu.pdf`, `sources/11-cac-truong-hop-cua-na.pdf` (2026-11-17, gitignored; phân tích ở plan 0.11).
- [ ] Hỏi giáo viên **đáp án** (nếu có): loại từ cho bảng "Loại từ"; bản dịch Thái cho "Bài tập vận dụng" (vd. 34 câu của น่า). Không có → dùng `--suggest` của M4 rồi giáo viên duyệt.
- [ ] Hỏi giáo viên **danh sách chuyên đề** (số thứ tự + tên) để làm lộ trình (plan 0.11 #1) và câu ghi công giáo trình hiển thị trong app.
- [x] Duyệt **content mẫu** agent tạo ở M3 (các mục `draft: true`) — owner cho đóng M3 2026-11-16.
- [ ] ~~Duyệt mẹo nhớ & hình cho 44 phụ âm~~ ⛔ bỏ ở v7 (plan 0.2).
- [ ] Duyệt **content mẫu M6** (Unit 1–2, `draft: true` trong `content/`).
- [ ] Nội dung thật: giáo viên điền theo **`content/templates/`** (6 file, hướng dẫn trong `content/templates/README.md`), kiểm tra bằng `pnpm content:check --input <file>` rồi đặt vào `content/` (bỏ `draft`).

## S11 — Duyệt thiết kế
- [x] Đợt M0.5a: brief, flows, tokens, SCR-00/01/02, wireframe — duyệt 2026-11-15.
- [ ] Đợt M0.5b-1: ~~**SCR-08 Trò chơi (ưu tiên)**~~ ✅ duyệt 2026-11-18; còn **SCR-04, SCR-05, SCR-06** + 13 wireframe (`docs/design/screens/`, soạn 2026-11-18) — duyệt để mở UI M7.5, M7, M9.
- [ ] Đợt M0.5b-2: SCR-03 Tổng quan, SCR-07 Sổ từ, SCR-09 Tiến độ (trước M10).
Ghi ngày duyệt vào `docs/design/README.md`.

## S12 — Email liên hệ (trước M1)
Một email **cá nhân** (không dùng email công ty) hiển thị trên `/privacy`, `/terms`, `/account/delete-instructions`, đồng thời khai báo ở Google OAuth consent screen (S5) và Facebook App (S6).

**Đầu ra cho agent:** email: `dominhchien206@gmail.com`
