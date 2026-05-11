# Office Checkin System — QR + Passkey

Hệ thống điểm danh nội bộ bằng QR Code và WebAuthn (FaceID / Fingerprint / Windows Hello).

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | MongoDB |
| Auth | WebAuthn / Passkey (`@simplewebauthn`) |
| Proxy | Nginx (HTTPS) |
| Deploy | Docker Compose |

---

## Cài đặt nhanh (Development)

### 1. Clone / tải project

```bash
cd checkin-system
```

### 2. Tạo SSL certificate (bắt buộc cho WebAuthn)

**Windows (PowerShell):**
```powershell
.\generate-certs.ps1
```

**Linux/macOS:**
```bash
chmod +x generate-certs.sh && ./generate-certs.sh
```

> **Khuyến nghị:** Dùng [mkcert](https://github.com/FiloSottile/mkcert) để cert được trust tự động bởi OS.  
> Nếu dùng openssl, phải import `certs/cert.pem` vào trust store của từng thiết bị.

### 3. Cấu hình hosts

Thêm vào `C:\Windows\System32\drivers\etc\hosts` (Windows) hoặc `/etc/hosts` (Linux/macOS):

```
127.0.0.1   checkin.office.local
```

Trên các máy nhân viên, thay `127.0.0.1` bằng IP máy chủ, ví dụ:

```
192.168.1.100   checkin.office.local
```

### 4. Cài dependencies

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 5. Cấu hình môi trường

```bash
# Backend
cp backend/.env.example backend/.env
# Chỉnh sửa backend/.env với secrets thực tế
```

### 6. Seed admin mặc định

```bash
cd backend && npm run seed
```

Tạo tài khoản: `admin` / `Admin@123`

### 7. Chạy development

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Truy cập: `https://checkin.office.local:5173`

---

## Deploy với Docker

### 1. Tạo file .env

```bash
cp .env.example .env
# Chỉnh JWT_SECRET và các secrets khác
```

### 2. Build và chạy

```bash
docker compose up -d --build
```

### 3. Seed admin

```bash
docker compose exec backend node seeds/admin.js
```

Truy cập: `https://checkin.office.local`

---

## Cấu trúc project

```
checkin-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/       # Auth, LAN check, rate limit
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # Express routes
│   │   └── services/        # WebAuthn, QR, Attendance
│   ├── seeds/               # Default admin seed
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/           # Home, Checkin, RegisterPasskey, Admin pages
│       ├── components/      # Shared components
│       ├── hooks/           # useWebAuthn
│       ├── services/        # Axios API client
│       └── context/         # Auth context
├── nginx/                   # Nginx reverse proxy config
├── certs/                   # SSL certs (gitignore this!)
├── docker-compose.yml
├── generate-certs.ps1       # Windows cert helper
└── generate-certs.sh        # Linux/macOS cert helper
```

---

## Luồng hoạt động

### Đăng ký Passkey

```
Admin → Trang nhân viên → "Tạo QR đăng ký"
→ QR hiển thị (có link chứa register token)
→ Nhân viên scan QR bằng điện thoại
→ Trình duyệt gọi WebAuthn registration
→ Thiết bị hiện FaceID/Fingerprint
→ Server lưu credential
```

### Checkin

```
Nhân viên → Trang chủ → Scan QR của mình
→ Web mở trang /checkin?token=xxx
→ WebAuthn authentication tự động
→ Thiết bị hiện FaceID/Fingerprint
→ Server verify → Lưu attendance
→ Chỉ lưu lần đầu tiên trong ngày
```

---

## API Reference

### Public

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/webauthn/register/options` | Lấy options đăng ký passkey |
| POST | `/webauthn/register/verify` | Xác nhận đăng ký passkey |
| POST | `/webauthn/auth/options` | Lấy options xác thực |
| POST | `/webauthn/auth/verify` | Xác thực + checkin |

### Admin (Bearer JWT)

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/admin/login` | Đăng nhập |
| GET | `/employees` | Danh sách nhân viên |
| POST | `/employees` | Thêm nhân viên |
| PUT | `/employees/:id` | Sửa nhân viên |
| DELETE | `/employees/:id` | Xóa nhân viên |
| POST | `/employees/:id/generate-register-qr` | Tạo QR đăng ký passkey |
| GET | `/employees/:id/checkin-qr` | Lấy QR checkin |
| DELETE | `/employees/:id/passkey` | Xóa passkey |
| GET | `/attendance/today` | Checkin hôm nay |
| GET | `/attendance/history` | Lịch sử điểm danh |

---

## Bảo mật

- Chỉ chấp nhận request từ IP nội bộ (192.168.x.x / 10.x.x.x / 172.16-31.x.x)
- WebAuthn yêu cầu user verification bắt buộc
- QR checkin hết hạn sau 5 phút
- QR đăng ký hết hạn sau 1 giờ
- Chống replay attack qua WebAuthn counter
- Rate limiting trên tất cả APIs
- JWT cho admin session

---

## Troubleshooting

**WebAuthn không hoạt động:**
- Phải dùng HTTPS (hoặc localhost)
- Kiểm tra `WEBAUTHN_RP_ID` và `WEBAUTHN_ORIGIN` trong `.env` phải khớp với domain thực tế

**Lỗi "Access denied: not on internal network":**
- Backend đang nhận IP không phải LAN
- Nếu dev: đặt `SKIP_LAN_CHECK=true` trong `backend/.env`

**Cert không được trust trên điện thoại:**
- Dùng mkcert và cài root CA lên điện thoại
- Hoặc dùng nginx với Let's Encrypt nếu có domain thực
