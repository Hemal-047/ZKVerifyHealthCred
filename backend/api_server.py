import hashlib
import secrets
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from algorand_engine import AlgorandEngine, CREDENTIAL_CONFIGS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

engine = None
users = {}
sessions = {}

def get_engine():
    global engine
    if engine is None:
        engine = AlgorandEngine()
    return engine

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_current_user():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        email = sessions.get(token)
        if email and email in users:
            return email, users[email]
    return None, None

@app.route("/api/health", methods=["GET"])
def health_check():
    eng = get_engine()
    return jsonify({"status": "ok", "service": "zkHealthCred API", "network": "Algorand TestNet", "account": eng.address, "balance": eng.get_balance(), "verifier_app_id": eng.verifier_app_id})

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400
    if email in users:
        return jsonify({"error": "Email already registered. Please login."}), 400
    token = secrets.token_hex(32)
    users[email] = {"password_hash": hash_password(password), "token": token, "name": name or email.split("@")[0], "user_hash": hashlib.sha256(email.encode()).hexdigest()}
    sessions[token] = email
    return jsonify({"status": "ok", "token": token, "name": users[email]["name"], "email": email})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    user = users.get(email)
    if not user or user["password_hash"] != hash_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    token = secrets.token_hex(32)
    old = user.get("token")
    if old in sessions:
        del sessions[old]
    user["token"] = token
    sessions[token] = email
    return jsonify({"status": "ok", "token": token, "name": user["name"], "email": email})

@app.route("/api/auth/me", methods=["GET"])
def get_me():
    email, user = get_current_user()
    if not email:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"email": email, "name": user["name"], "user_hash": user["user_hash"]})

@app.route("/api/proof/generate-all", methods=["POST"])
def generate_all_proofs():
    data = request.json
    eng = get_engine()
    credentials = data.get("credentials", [])
    verifier_id = data.get("verifier_id", "Demo Verifier")
    if not credentials:
        return jsonify({"error": "No credentials provided"}), 400
    email, user = get_current_user()
    if email and user:
        user_hash = user["user_hash"]
    else:
        user_hash = data.get("user_hash") or hashlib.sha256(f"anon_{datetime.utcnow().isoformat()}".encode()).hexdigest()
    processed = []
    for cred in credentials:
        ct = cred.get("type")
        if ct == "bmi":
            h = cred.get("height", 0) or 0
            w = cred.get("weight", 0) or 0
            if h > 0 and w > 0:
                bmi_val = w / ((h / 100) ** 2)
                processed.append({"type": "bmi", "value1": round(bmi_val * 10), "value2": 0})
            else:
                processed.append({"type": "bmi", "value1": 0, "value2": 0})
        elif ct == "report_recency" and cred.get("date"):
            days = (datetime.utcnow() - datetime.fromisoformat(cred["date"])).days
            processed.append({"type": "report_recency", "value1": max(0, days), "value2": 0})
        else:
            processed.append({"type": ct, "value1": cred.get("value1", 0) or 0, "value2": cred.get("value2", 0) or 0})
    bundle = eng.generate_credential_bundle(credentials=processed, user_hash=user_hash, verifier_id=verifier_id)
    return jsonify(bundle)

@app.route("/api/credential/<credential_id>", methods=["GET"])
def get_credential(credential_id):
    """Look up a credential from the blockchain."""
    eng = get_engine()
    consent = eng.get_credential_from_chain(credential_id)
    if consent:
        return jsonify({
            "credential_id": credential_id,
            "verifier_id": consent.get("verifier_id", ""),
            "credential_types": consent.get("credential_types", []),
            "status": consent.get("status", ""),
            "tx_id": consent.get("tx_id", ""),
            "explorer_url": consent.get("explorer_url", ""),
            "created_at": consent.get("created_at", ""),
            "verifier_app_id": eng.verifier_app_id,
            "verifier_explorer_url": f"https://lora.algokit.io/testnet/application/{eng.verifier_app_id}",
            "results": [
                {
                    "credential_type": r.get("type", ct),
                    "label": CREDENTIAL_CONFIGS.get(r.get("type", ct), {}).get("label", ct),
                    "result_label": CREDENTIAL_CONFIGS.get(r.get("type", ct), {}).get("pass_label" if r.get("passed", True) else "fail_label", ""),
                    "verified": r.get("passed", True),
                }
                for r, ct in zip(consent.get("results", []), consent.get("credential_types", []))
            ] if consent.get("results") else [
                {
                    "credential_type": ct,
                    "label": CREDENTIAL_CONFIGS.get(ct, {}).get("label", ct),
                    "result_label": CREDENTIAL_CONFIGS.get(ct, {}).get("pass_label", "Verified"),
                    "verified": True,
                }
                for ct in consent.get("credential_types", [])
            ],
        })
    return jsonify({"error": "Credential not found"}), 404

@app.route("/api/consent/history", methods=["GET"])
def get_consent_history():
    """Read consent history directly from Algorand blockchain."""
    eng = get_engine()
    email, user = get_current_user()
    user_hash = user["user_hash"] if user else None
    history = eng.get_consent_history_from_chain(user_hash)
    return jsonify({"history": history})

@app.route("/api/consent/revoke/<consent_id>", methods=["POST"])
def revoke_consent(consent_id):
    """Revoke a consent — logs revocation on Algorand."""
    eng = get_engine()
    email, user = get_current_user()
    if not user:
        return jsonify({"error": "Must be logged in to revoke"}), 401
    result = eng.revoke_consent_on_chain(consent_id, user["user_hash"])
    if result:
        return jsonify({"status": "revoked", "consent": result})
    return jsonify({"error": "Consent not found or already revoked"}), 404

if __name__ == "__main__":
    print("zkHealthCred API Server")
    try:
        eng = get_engine()
        print(f"Account: {eng.address} | Balance: {eng.get_balance()} ALGO | Verifier: {eng.verifier_app_id}")
        # Test reading from chain
        history = eng.get_consent_history_from_chain()
        print(f"Found {len(history)} consents on Algorand blockchain")
    except Exception as e:
        print(f"Warning: {e}")
    port = int(os.environ.get("PORT", 5000))
    print(f"Running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
