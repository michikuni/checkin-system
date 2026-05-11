#!/bin/bash
# Generate self-signed cert with mkcert (recommended)
# or fallback to openssl

CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

if command -v mkcert &> /dev/null; then
  echo "Using mkcert..."
  mkcert -install
  mkcert -key-file "$CERT_DIR/key.pem" -cert-file "$CERT_DIR/cert.pem" \
    checkin.office.local localhost 127.0.0.1 ::1
  echo "Certs generated with mkcert (trusted by OS)"
else
  echo "mkcert not found — using openssl (self-signed, you'll get browser warnings)"
  openssl req -x509 -newkey rsa:4096 -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" -days 365 -nodes \
    -subj "/CN=checkin.office.local" \
    -addext "subjectAltName=DNS:checkin.office.local,DNS:localhost,IP:127.0.0.1"
  echo "Self-signed cert generated — import $CERT_DIR/cert.pem into your OS/browser trust store"
fi
