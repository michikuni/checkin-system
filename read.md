# Ghi chú triển khai

Luồng chính hiện tại là chạy local HTTPS trong LAN:

1. Tạo CA và server cert bằng `python scripts/create_local_cert.py`.
2. Cài `certs/local-ca.crt` vào điện thoại.
3. Chạy `python app.py` với `APP_HOST` là IP LAN hoặc hostname LAN.
4. Mở `https://APP_HOST:5000/` trên điện thoại cùng Wi-Fi.

Nếu muốn dùng hostname thay vì IP, hãy trỏ DNS nội bộ của router/Pi-hole/AdGuard về IP máy chạy server rồi tạo lại cert:

```powershell
python scripts/create_local_cert.py --host checkin.local --host 192.168.1.10
$env:APP_HOST='checkin.local'
python app.py
```

Khi dùng passkey, `RP_ID` phải khớp host trong URL. Với cấu hình mặc định, app tự dùng `APP_HOST` làm `RP_ID`.
