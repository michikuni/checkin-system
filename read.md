Cách triển khai chuẩn là dùng split DNS:

Public DNS dùng để xin certificate.
LAN DNS trỏ domain về IP nội bộ của máy chủ.
Certificate hợp lệ vì domain thật.
Điện thoại cùng Wi‑Fi truy cập domain đó nhưng đi tới IP LAN, nên Flask thấy IP LAN.
Ví dụ domain:

passkey.example.com
Máy chủ LAN:

192.168.1.10
1. Tạo DNS record public
Trong Cloudflare/Namecheap/etc tạo record:

A passkey.example.com -> 192.168.1.10
Hoặc không cần A record đúng nếu bạn dùng DNS challenge. Quan trọng là bạn kiểm soát DNS domain.

2. Xin TLS bằng DNS challenge
Ví dụ dùng certbot với Cloudflare:

certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/.secrets/cloudflare.ini \
  -d passkey.example.com
Nó sẽ tạo cert:

/etc/letsencrypt/live/passkey.example.com/fullchain.pem
/etc/letsencrypt/live/passkey.example.com/privkey.pem
Trên Windows có thể dùng win-acme hoặc lego.

3. Trỏ domain về IP LAN trong mạng nội bộ
Bạn cần router/local DNS trả:

passkey.example.com -> 192.168.1.10
Tùy thiết bị:

Router có mục DNS override / Host override / Local DNS.
Pi-hole/AdGuard Home: thêm local DNS record.
Nếu chỉ test trên máy/điện thoại, có thể cấu hình DNS nội bộ thủ công, nhưng router/Pi-hole sạch hơn.
Kiểm tra trên điện thoại cùng Wi‑Fi:

passkey.example.com
phải resolve ra:

192.168.1.10
4. Chạy Flask bằng HTTPS
Trong app.py:

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=443,
        ssl_context=(
            "/etc/letsencrypt/live/passkey.example.com/fullchain.pem",
            "/etc/letsencrypt/live/passkey.example.com/privkey.pem",
        )
    )
Nếu không muốn chạy Flask trực tiếp port 443, dùng Nginx reverse proxy tốt hơn.

5. Cấu hình app
Trong app.py, RP_ID phải là domain, không phải IP:

RP_ID = "passkey.example.com"
ORIGIN = "https://passkey.example.com"
QR sẽ trỏ tới:

https://passkey.example.com/register
6. Kết quả
Điện thoại cùng Wi‑Fi:

Mở https://passkey.example.com/register.
TLS hợp lệ.
WebAuthn/passkey hoạt động.
Request đi tới 192.168.1.10.
Flask thấy IP điện thoại kiểu 192.168.1.x.
Subnet check LAN hoạt động thật.
Điện thoại ngoài Wi‑Fi:

Nếu public DNS không trỏ được vào máy hoặc firewall chặn, sẽ không truy cập được.
Nếu vẫn truy cập được qua public internet, Flask thấy IP public, subnet LAN check sẽ fail.