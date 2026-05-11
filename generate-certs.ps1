# Windows: generate certs with mkcert or openssl
$certDir = ".\certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

if (Get-Command mkcert -ErrorAction SilentlyContinue) {
    Write-Host "Using mkcert..."
    mkcert -install
    mkcert -key-file "$certDir\key.pem" -cert-file "$certDir\cert.pem" `
        checkin.office.local localhost 127.0.0.1 "::1"
    Write-Host "Certs generated (trusted by OS)"
} elseif (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Host "Using openssl (self-signed)..."
    $san = "subjectAltName=DNS:checkin.office.local,DNS:localhost,IP:127.0.0.1"
    openssl req -x509 -newkey rsa:4096 `
        -keyout "$certDir\key.pem" `
        -out "$certDir\cert.pem" `
        -days 365 -nodes `
        -subj "/CN=checkin.office.local" `
        -addext $san
    Write-Host "Self-signed cert created. Import $certDir\cert.pem into Windows trusted root CA."
} else {
    Write-Host "Install mkcert: https://github.com/FiloSottile/mkcert/releases"
    Write-Host "Or openssl: https://slproweb.com/products/Win32OpenSSL.html"
}
