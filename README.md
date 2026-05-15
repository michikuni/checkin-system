# Tải Cloudflared trên window
Tải chính thức từ
`https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe?utm_source=chatgpt.com`
## Sau khi tải rename thành 
`cloudflared.exe`
## Và đặt vào 
`C:\cloudflared\`
## Chạy Tunnel
` cd C:\cloudflared
.\cloudflared.exe tunnel --url http://localhost:5000 `
## Sau đó sửa app.py
`RP_ID = "abcxyz.trycloudflare.com"`
`ORIGIN = "https://abcxyz.trycloudflare.com"`