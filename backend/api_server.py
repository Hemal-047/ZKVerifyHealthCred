"""
zkHealthCred — REST API Backend
================================

Simple Flask API that the React frontend calls.
Handles proof verification and consent logging on Algorand TestNet.

Run: python api_server.py
"""

import hashlib
import math
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

from algorand_engine import AlgorandEngine, CREDENTIAL_CONFIGS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Initialize Algorand engine
engine = None

def get_engine():
    global engine
    if engine is None:
        engine = AlgorandEngine()
    return engine


# ============ Health Check ============

@app.route("/api/health", methods=["GET"])
def health_check():
    eng = get_engine()
    return jsonify({
        "status": "ok",
        "service": "zkHealthCred API",
        "network": "Algorand TestNet",
        "account": eng.address,
        "balance": eng.get_balance(),
        "verifier_app_id": eng.verifier_app_id,
    })


# ============ Credential Types ============

@app.route("/api/credential-types", methods=["GET"])
def get_credential_types():
    """Return available credential types and their configurations."""
    types = {}
    for key, config in CREDENTIAL_CONFIGS.items():
        types[key] = {
            "label": config["label"],
            "pass_label": config["pass_label"],
            "fail_label": config["fail_label"],
            "check_dual": config["check_dual"] == 1,
        }
    return jsonify(types)


# ============ Proof Generation ============

@app.route("/api/proof/generate", methods=["POST"])
def generate_proof():
    """Generate ZK proof for a single credential."""
    data = request.json
    eng = get_engine()

    credential_type = data.get("credential_type")
    value1 = data.get("value1", 0)
    value2 = data.get("value2", 0)

    if credential_type not in CREDENTIAL_CONFIGS:
        return jsonify({"error": f"Unknown credential type: {credential_type}"}), 400

    result = eng.verify_credential(credential_type, value1, value2)
    return jsonify(result)


@app.route("/api/proof/generate-all", methods=["POST"])
def generate_all_proofs():
    """Generate ZK proofs for all credentials and log consent on Algorand."""
    data = request.json
    eng = get_engine()

    credentials = data.get("credentials", [])
    user_hash = data.get("user_hash", "")
    verifier_id = data.get("verifier_id", "Demo Verifier")

    if not credentials:
        return jsonify({"error": "No credentials provided"}), 400

    if not user_hash:
        # Generate a hash from timestamp if not provided
        user_hash = hashlib.sha256(
            f"user_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()

    # Process BMI — calculate from height/weight if provided
    processed_credentials = []
    for cred in credentials:
        cred_type = cred.get("type")
        if cred_type == "bmi" and "height" in cred and "weight" in cred:
            height_m = cred["height"] / 100
            bmi = cred["weight"] / (height_m * height_m)
            processed_credentials.append({
                "type": "bmi",
                "value1": round(bmi * 10),  # Scale by 10 for integer circuit
                "value2": 0,
            })
        elif cred_type == "report_recency" and "date" in cred:
            report_date = datetime.fromisoformat(cred["date"])
            days_ago = (datetime.utcnow() - report_date).days
            processed_credentials.append({
                "type": "report_recency",
                "value1": max(0, days_ago),
                "value2": 0,
            })
        else:
            processed_credentials.append({
                "type": cred_type,
                "value1": cred.get("value1", 0),
                "value2": cred.get("value2", 0),
            })

    bundle = eng.generate_credential_bundle(
        credentials=processed_credentials,
        user_hash=user_hash,
        verifier_id=verifier_id,
    )

    return jsonify(bundle)


# ============ Credential Lookup ============

@app.route("/api/credential/<credential_id>", methods=["GET"])
def get_credential(credential_id):
    """Look up a credential by ID (from consent history)."""
    eng = get_engine()

    for consent in eng.consents:
        if consent["credential_id"] == credential_id:
            # Return verification status without actual health values
            return jsonify({
                "credential_id": credential_id,
                "verifier_id": consent["verifier_id"],
                "credential_types": consent["credential_types"],
                "status": consent["status"],
                "tx_id": consent["tx_id"],
                "explorer_url": consent.get("explorer_url"),
                "created_at": consent["created_at"],
                "verifier_app_id": eng.verifier_app_id,
                "verifier_explorer_url": f"https://lora.algokit.io/testnet/application/{eng.verifier_app_id}",
                # Results are pass/fail only — actual values are NEVER exposed
                "results": [
                    {
                        "credential_type": ct,
                        "label": CREDENTIAL_CONFIGS[ct]["label"],
                        "result_label": CREDENTIAL_CONFIGS[ct]["pass_label"],
                        "verified": True,
                    }
                    for ct in consent["credential_types"]
                ],
            })

    return jsonify({"error": "Credential not found"}), 404


# ============ Consent Management ============

@app.route("/api/consent/history", methods=["GET"])
def get_consent_history():
    """Get all consent records."""
    eng = get_engine()
    user_hash = request.args.get("user_hash")
    history = eng.get_consent_history(user_hash)
    return jsonify({"history": history})


@app.route("/api/consent/revoke/<consent_id>", methods=["POST"])
def revoke_consent(consent_id):
    """Revoke a consent record. Logs revocation on Algorand."""
    eng = get_engine()
    result = eng.revoke_consent(consent_id)

    if result:
        return jsonify({
            "status": "revoked",
            "consent": result,
        })

    return jsonify({"error": "Consent not found or already revoked"}), 404


# ============ Run Server ============

if __name__ == "__main__":
    print("zkHealthCred — Starting API Server")
    print("=" * 50)

    try:
        eng = get_engine()
        print(f"Account: {eng.address}")
        print(f"Balance: {eng.get_balance()} ALGO")
        print(f"Verifier App ID: {eng.verifier_app_id}")
    except Exception as e:
        print(f"Warning: Could not initialize Algorand engine: {e}")
        print("Server will start but Algorand operations will fail.")

    print(f"\nAPI running on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /api/health")
    print("  GET  /api/credential-types")
    print("  POST /api/proof/generate")
    print("  POST /api/proof/generate-all")
    print("  GET  /api/credential/<id>")
    print("  GET  /api/consent/history")
    print("  POST /api/consent/revoke/<id>")
    print("=" * 50)

    app.run(host="0.0.0.0", port=5000, debug=True)
