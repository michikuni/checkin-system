import os
import ipaddress
import json
import secrets
import socket
import time
from collections.abc import Mapping
from datetime import date
from enum import Enum
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, render_template, request, jsonify
from flask_sock import Sock

import qrcode

from fido2.server import Fido2Server
from fido2.webauthn import (
    PublicKeyCredentialRpEntity,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from fido2.utils import websafe_encode

app = Flask(__name__)
sock = Sock(app)

DEFAULT_PORT = 5000


def get_server_private_ip():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as udp_sock:
            udp_sock.connect(("8.8.8.8", 80))
            ip = ipaddress.ip_address(udp_sock.getsockname()[0])

            if ip.version == 4 and ip.is_private:
                return ip
    except OSError:
        pass

    try:
        for address in socket.gethostbyname_ex(socket.gethostname())[2]:
            ip = ipaddress.ip_address(address)

            if ip.version == 4 and ip.is_private:
                return ip
    except OSError:
        pass

    return None


def normalize_host(value):
    value = str(value or "").strip()

    if not value:
        return ""

    parsed = urlparse(value if "://" in value else f"//{value}")
    host = parsed.hostname or value
    return host.strip().strip("[]").strip("/")


def normalize_origin(value):
    value = str(value or "").strip().rstrip("/")
    parsed = urlparse(value)

    if not parsed.scheme or not parsed.hostname:
        raise ValueError("APP_ORIGIN phai co dang https://host[:port]")

    return value


def get_app_port():
    return int(os.getenv("APP_PORT", os.getenv("PORT", str(DEFAULT_PORT))))


def get_default_app_host():
    return str(get_server_private_ip() or "localhost")


APP_PORT = get_app_port()
APP_SCHEME = os.getenv("APP_SCHEME", "https").strip().rstrip(":/").lower()
configured_origin = os.getenv("APP_ORIGIN") or os.getenv("ORIGIN")
APP_HOST = normalize_host(
    os.getenv("APP_HOST")
    or os.getenv("PUBLIC_DOMAIN")
    or os.getenv("RP_ID")
    or configured_origin
    or get_default_app_host()
)
RP_ID = normalize_host(os.getenv("RP_ID") or APP_HOST)
APP_DEBUG = os.getenv("APP_DEBUG", "1").strip() != "0"

if configured_origin:
    ORIGIN = normalize_origin(configured_origin)
else:
    uses_default_port = (
        (APP_SCHEME == "https" and APP_PORT == 443)
        or (APP_SCHEME == "http" and APP_PORT == 80)
    )
    port_suffix = "" if uses_default_port else f":{APP_PORT}"
    ORIGIN = f"{APP_SCHEME}://{APP_HOST}{port_suffix}"

TLS_CERT_FILE = Path(os.getenv("TLS_CERT_FILE", "certs/local-server.crt"))
TLS_KEY_FILE = Path(os.getenv("TLS_KEY_FILE", "certs/local-server.key"))

rp = PublicKeyCredentialRpEntity(
    id=RP_ID,
    name="Passkey Demo"
)

server = Fido2Server(rp)

users = {}
sessions = {}
sockets = {}


def get_lan_networks():
    configured_cidr = os.getenv("LAN_CIDR", "").strip()

    if configured_cidr:
        return [ipaddress.ip_network(part.strip(), strict=False)
                for part in configured_cidr.split(",")
                if part.strip()]

    server_ip = get_server_private_ip()

    if not server_ip:
        return []

    return [ipaddress.ip_network(f"{server_ip}/24", strict=False)]

LAN_NETWORKS = get_lan_networks()
REQUIRE_SAME_LAN = os.getenv("REQUIRE_SAME_LAN", "1").strip() != "0"

def get_client_ip():
    for header in ("CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"):
        value = request.headers.get(header, "").strip()

        if value:
            return value.split(",")[0].strip()

    return request.remote_addr

def check_same_lan():
    client_ip_text = get_client_ip()

    if not REQUIRE_SAME_LAN:
        return True, client_ip_text, "LAN check disabled"

    if not LAN_NETWORKS:
        return False, client_ip_text, "Khong xac dinh duoc subnet LAN cua may chu"

    try:
        client_ip = ipaddress.ip_address(client_ip_text)
    except ValueError:
        return False, client_ip_text, "Khong doc duoc IP cua thiet bi"

    if not client_ip.is_private:
        return False, client_ip_text, (
            "Khong thay IP LAN cua thiet bi. Neu dang di qua Cloudflare Tunnel, "
            "server chi thay IP public/proxy nen khong the kiem tra cung LAN."
        )

    if any(client_ip in network for network in LAN_NETWORKS):
        return True, client_ip_text, "Cung subnet LAN"

    networks = ", ".join(str(network) for network in LAN_NETWORKS)
    return False, client_ip_text, f"IP khong nam trong subnet LAN cua may chu: {networks}"

def to_jsonable(value):
    if isinstance(value, Mapping):
        return {key: to_jsonable(value[key]) for key in value}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(item) for item in value]
    if isinstance(value, Enum):
        return value.value
    return value

def save_qr(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = qrcode.make(data)
    img.save(path)

def auth_qr_path(credential_id):
    return f"static/auth_{credential_id}.png"

def user_payload(credential_id, user):
    return {
        "credential_id": credential_id,
        "name": user["name"],
        "auth_url": user["auth_url"],
        "auth_qr": user["auth_qr"],
        "last_auth_ip": user.get("last_auth_ip"),
        "last_lan_status": user.get("last_lan_status"),
        "last_verified_date": user.get("last_verified_date"),
        "verified_today": user.get("last_verified_date") == date.today().isoformat()
    }

@app.route("/")
def index():
    register_url = f"{ORIGIN}/register"
    register_qr = "static/register.png"
    save_qr(register_url, register_qr)

    return render_template(
        "index.html",
        register_url=register_url,
        register_qr=f"/{register_qr}",
        users=[user_payload(k, v) for k, v in users.items()]
    )

@app.route("/api/network")
def api_network():
    server_private_ip = get_server_private_ip()

    return jsonify({
        "app_host": APP_HOST,
        "app_origin": ORIGIN,
        "app_port": APP_PORT,
        "debug": APP_DEBUG,
        "rp_id": RP_ID,
        "require_same_lan": REQUIRE_SAME_LAN,
        "lan_networks": [str(network) for network in LAN_NETWORKS],
        "detected_server_private_ip": str(server_private_ip) if server_private_ip else None,
        "tls_cert_file": str(TLS_CERT_FILE),
        "tls_key_file": str(TLS_KEY_FILE),
    })

@app.route("/api/users")
def api_users():
    return jsonify({
        "users": [user_payload(k, v) for k, v in users.items()]
    })

@app.route("/session-status/<session_id>")
def session_status(session_id):
    session = sessions.get(session_id)

    if not session:
        return jsonify({
            "exists": False
        }), 404

    return jsonify({
        "exists": True,
        "type": session.get("type"),
        "registered": bool(session.get("registered")),
        "verified": bool(session.get("verified")),
        "credential_id": session.get("credential_id")
    })

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/register/options", methods=["POST"])
def register_options():
    body = request.json or {}
    username = body.get("name", "").strip()

    if not username:
        return jsonify({
            "success": False,
            "error": "Vui long nhap ten user"
        }), 400

    session_id = secrets.token_hex(16)

    registration_data, state = server.register_begin(
        {
            "id": secrets.token_bytes(16),
            "name": username,
            "displayName": username
        },
        credentials=[user["credential_data"] for user in users.values()],
        resident_key_requirement=ResidentKeyRequirement.PREFERRED,
        user_verification=UserVerificationRequirement.PREFERRED
    )

    sessions[session_id] = {
        "state": state,
        "type": "register",
        "username": username,
        "registration_data": registration_data
    }

    return jsonify({
        "success": True,
        "session_id": session_id,
        "publicKey": to_jsonable(registration_data["publicKey"])
    })

@app.route("/register/verify/<session_id>", methods=["POST"])
def register_verify(session_id):
    body = request.json

    session = sessions[session_id]

    try:
        auth_data = server.register_complete(
            session["state"],
            body
        )
    except Exception as exc:
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 400

    credential_id = websafe_encode(auth_data.credential_data.credential_id)
    auth_url = f"{ORIGIN}/auth/start/{credential_id}"
    qr_path = auth_qr_path(credential_id)
    save_qr(auth_url, qr_path)

    users[credential_id] = {
        "credential_id": credential_id,
        "name": session["username"],
        "credential_data": auth_data.credential_data,
        "public_key": auth_data.credential_data.public_key,
        "auth_url": auth_url,
        "auth_qr": f"/{qr_path}",
        "last_auth_ip": None,
        "last_lan_status": None,
        "last_verified_date": None
    }

    session["registered"] = True
    session["credential_id"] = credential_id

    return jsonify({
        "success": True,
        "credential_id": credential_id
    })

@app.route("/auth/start/<credential_id>")
def auth_start(credential_id):
    if credential_id not in users:
        return render_template(
            "auth.html",
            session_id=None,
            error="Khong tim thay user cho QR nay"
        ), 404

    session_id = secrets.token_hex(16)

    auth_data, state = server.authenticate_begin([
        users[credential_id]["credential_data"]
    ], user_verification=UserVerificationRequirement.REQUIRED)

    sessions[session_id] = {
        "state": state,
        "auth_data": auth_data,
        "credential_id": credential_id,
        "type": "auth",
        "verified": False
    }

    return render_template(
        "auth.html",
        session_id=session_id,
        error=None
    )

@app.route("/create-auth/<credential_id>")
def create_auth(credential_id):
    user = users.get(credential_id)

    if not user:
        return jsonify({
            "success": False,
            "error": "Unknown credential"
        }), 404

    return jsonify({
        "success": True,
        "credential_id": credential_id,
        "url": user["auth_url"],
        "qr": user["auth_qr"]
    })

@app.route("/auth/<session_id>")
def auth_page(session_id):
    return render_template(
        "auth.html",
        session_id=session_id,
        error=None
    )

@app.route("/auth/options/<session_id>")
def auth_options(session_id):
    session = sessions[session_id]
    return jsonify(to_jsonable(session["auth_data"]["publicKey"]))

@app.route("/auth/verify/<session_id>", methods=["POST"])
def auth_verify(session_id):
    session = sessions[session_id]
    user = users.get(session["credential_id"])

    if not user:
        return jsonify({
            "success": False,
            "error": "Unknown credential"
        }), 404

    try:
        matched_credential = server.authenticate_complete(
            session["state"],
            [user["credential_data"]],
            request.json
        )
    except Exception as exc:
        return jsonify({
            "success": False,
            "error": str(exc)
        }), 400

    if matched_credential.credential_id != user["credential_data"].credential_id:
        return jsonify({
            "success": False,
            "error": "Credential does not match"
        }), 400

    same_lan, client_ip, lan_message = check_same_lan()
    user["last_auth_ip"] = client_ip
    user["last_lan_status"] = lan_message
    session["client_ip"] = client_ip
    session["lan_ok"] = same_lan
    session["lan_message"] = lan_message

    if not same_lan:
        return jsonify({
            "success": False,
            "error": lan_message,
            "client_ip": client_ip,
            "lan_networks": [str(network) for network in LAN_NETWORKS]
        }), 403

    session["verified"] = True
    user["last_verified_date"] = date.today().isoformat()
    user["last_lan_status"] = "Cung LAN"

    return jsonify({
        "success": True,
        "client_ip": client_ip,
        "lan_status": "Cung LAN"
    })

@sock.route('/ws/<session_id>')
def ws(ws, session_id):
    sockets[session_id] = ws

    try:
        while True:
            session = sessions.get(session_id)

            if session and session.get("registered"):
                ws.send(json.dumps({
                    "registered": True,
                    "credential_id": session["credential_id"]
                }))
                break

            if session and session.get("verified"):
                ws.send(json.dumps({
                    "verified": True
                }))
                break

            time.sleep(0.2)
    finally:
        sockets.pop(session_id, None)


def get_ssl_context():
    if APP_SCHEME != "https":
        return None

    if not TLS_CERT_FILE.exists() or not TLS_KEY_FILE.exists():
        raise RuntimeError(
            "Khong tim thay certificate local. Hay chay "
            "`python scripts/create_local_cert.py` truoc, hoac cau hinh "
            "TLS_CERT_FILE/TLS_KEY_FILE."
        )

    return (str(TLS_CERT_FILE), str(TLS_KEY_FILE))


if __name__ == "__main__":
    print(f"Dashboard: {ORIGIN}/")
    print(f"Register QR URL: {ORIGIN}/register")
    print(f"RP ID: {RP_ID}")
    app.run(
        host="0.0.0.0",
        port=APP_PORT,
        debug=APP_DEBUG,
        ssl_context=get_ssl_context(),
        use_reloader=False,
    )
