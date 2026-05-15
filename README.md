# Checkin System chạy local HTTPS

Dự án đã bỏ phụ thuộc `cloudflared`. App chạy trực tiếp trong mạng LAN bằng HTTPS local, điện thoại cài CA nội bộ rồi truy cập qua IP Wi-Fi của máy chạy server.

## 1. Cài thư viện

```powershell
pip install flask flask-sock fido2 qrcode[pil] cryptography
```

## 2. Tạo certificate local

Chạy lệnh sau trong thư mục dự án:

```powershell
python scripts/create_local_cert.py
```

Script sẽ tự dò IP LAN và tạo:

- `certs/local-ca.crt`: CA cần cài vào điện thoại.
- `certs/local-server.crt`: certificate cho Flask.
- `certs/local-server.key`: private key cho Flask.

Nếu muốn chỉ định IP cố định:

```powershell
python scripts/create_local_cert.py --host 192.168.1.10
```

Nếu IP máy tính đổi, chạy lại lệnh trên với IP mới. Không dùng `--force-ca` thì điện thoại không cần cài lại CA.

## 3. Cài CA vào điện thoại

Copy file `certs/local-ca.crt` sang điện thoại.

Android:

1. Mở Settings.
2. Vào Security/Privacy > Encryption & credentials.
3. Chọn Install a certificate > CA certificate.
4. Chọn file `local-ca.crt` và xác nhận.

iPhone/iPad:

1. Mở file `local-ca.crt` để cài profile.
2. Vào Settings > General > VPN & Device Management và Install profile.
3. Vào Settings > General > About > Certificate Trust Settings.
4. Bật full trust cho `Checkin Local CA`.

## 4. Chạy app local

Dùng IP được script in ra ở dòng `Primary host`:

```powershell
$env:APP_HOST='192.168.1.10'
python app.py
```

Mở trên máy tính hoặc điện thoại cùng Wi-Fi:

```text
https://192.168.1.10:5000/
```

Nếu Windows hỏi firewall, chọn Allow cho mạng Private. Nếu điện thoại vẫn không vào được, kiểm tra máy tính và điện thoại có cùng Wi-Fi/subnet không.

## Cấu hình

- `APP_HOST`: host/IP điện thoại dùng để truy cập. Giá trị này cũng là RP ID mặc định cho passkey.
- `APP_PORT`: port Flask, mặc định `5000`.
- `APP_ORIGIN`: origin đầy đủ nếu cần ghi đè, ví dụ `https://192.168.1.10:5000`.
- `RP_ID`: chỉ set riêng nếu dùng hostname khác với `APP_HOST`.
- `APP_DEBUG`: mặc định `1`; set `0` để tắt debug Flask.
- `LAN_CIDR`: subnet LAN cho kiểm tra cùng mạng, ví dụ `192.168.1.0/24`.
- `TLS_CERT_FILE`: mặc định `certs/local-server.crt`.
- `TLS_KEY_FILE`: mặc định `certs/local-server.key`.

`APP_SCHEME=http` chỉ nên dùng debug trên `localhost`; passkey trên điện thoại cần HTTPS hợp lệ.
