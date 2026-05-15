import argparse
import ipaddress
import socket
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID


def detect_private_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as udp_sock:
            udp_sock.connect(("8.8.8.8", 80))
            ip = ipaddress.ip_address(udp_sock.getsockname()[0])

            if ip.version == 4 and ip.is_private:
                return str(ip)
    except OSError:
        pass

    try:
        for address in socket.gethostbyname_ex(socket.gethostname())[2]:
            ip = ipaddress.ip_address(address)

            if ip.version == 4 and ip.is_private:
                return str(ip)
    except OSError:
        pass

    return "localhost"


def make_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def cert_name(common_name):
    return x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "VN"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Checkin Local"),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ]
    )


def write_private_key(path, key):
    path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )


def write_cert(path, cert):
    path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))


def load_or_create_ca(cert_dir, force_ca, ca_days):
    ca_key_path = cert_dir / "local-ca.key"
    ca_cert_path = cert_dir / "local-ca.crt"

    if not force_ca and ca_key_path.exists() and ca_cert_path.exists():
        ca_key = serialization.load_pem_private_key(ca_key_path.read_bytes(), None)
        ca_cert = x509.load_pem_x509_certificate(ca_cert_path.read_bytes())
        return ca_key, ca_cert, False

    now = datetime.now(timezone.utc)
    ca_key = make_key()
    ca_subject = cert_name("Checkin Local CA")
    ca_cert = (
        x509.CertificateBuilder()
        .subject_name(ca_subject)
        .issuer_name(ca_subject)
        .public_key(ca_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        .not_valid_after(now + timedelta(days=ca_days))
        .add_extension(x509.BasicConstraints(ca=True, path_length=0), critical=True)
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(x509.SubjectKeyIdentifier.from_public_key(ca_key.public_key()), False)
        .sign(ca_key, hashes.SHA256())
    )

    write_private_key(ca_key_path, ca_key)
    write_cert(ca_cert_path, ca_cert)
    return ca_key, ca_cert, True


def san_for_host(host):
    try:
        return x509.IPAddress(ipaddress.ip_address(host))
    except ValueError:
        return x509.DNSName(host)


def create_server_cert(cert_dir, ca_key, ca_cert, hosts, days):
    now = datetime.now(timezone.utc)
    server_key = make_key()
    primary_host = hosts[0]
    server_subject = cert_name(primary_host)

    san_values = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.ip_address("127.0.0.1")),
        x509.IPAddress(ipaddress.ip_address("::1")),
    ]

    for host in hosts:
        san = san_for_host(host)

        if san not in san_values:
            san_values.append(san)

    server_cert = (
        x509.CertificateBuilder()
        .subject_name(server_subject)
        .issuer_name(ca_cert.subject)
        .public_key(server_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(minutes=5))
        .not_valid_after(now + timedelta(days=days))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.SubjectAlternativeName(san_values), critical=False)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=False,
                key_encipherment=True,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .sign(ca_key, hashes.SHA256())
    )

    write_private_key(cert_dir / "local-server.key", server_key)
    write_cert(cert_dir / "local-server.crt", server_cert)


def unique_hosts(hosts):
    seen = set()
    result = []

    for host in hosts:
        host = str(host).strip().strip("/")

        if not host or host in seen:
            continue

        seen.add(host)
        result.append(host)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Create a local CA and HTTPS certificate for the checkin app."
    )
    parser.add_argument(
        "--host",
        action="append",
        help="Host or IP used by the phone. Repeat to add more SAN entries.",
    )
    parser.add_argument("--cert-dir", default="certs", help="Output certificate directory.")
    parser.add_argument("--days", type=int, default=825, help="Server certificate lifetime.")
    parser.add_argument("--ca-days", type=int, default=3650, help="CA certificate lifetime.")
    parser.add_argument(
        "--force-ca",
        action="store_true",
        help="Regenerate the local CA. Phones must reinstall local-ca.crt after this.",
    )
    args = parser.parse_args()

    cert_dir = Path(args.cert_dir)
    cert_dir.mkdir(parents=True, exist_ok=True)

    hosts = unique_hosts(args.host or [detect_private_ip()])
    ca_key, ca_cert, created_ca = load_or_create_ca(cert_dir, args.force_ca, args.ca_days)
    create_server_cert(cert_dir, ca_key, ca_cert, hosts, args.days)

    print("Local certificates are ready.")
    print(f"Primary host: {hosts[0]}")
    print(f"CA certificate for phone: {cert_dir / 'local-ca.crt'}")
    print(f"Server certificate: {cert_dir / 'local-server.crt'}")
    print(f"Server key: {cert_dir / 'local-server.key'}")
    print(f"CA regenerated: {'yes' if created_ca else 'no'}")
    print("")
    print("Run with:")
    print(f"  $env:APP_HOST='{hosts[0]}'; python app.py")


if __name__ == "__main__":
    main()
