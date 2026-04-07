import os
import json
import hashlib
import time
import base64
from pathlib import Path
from datetime import datetime

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod, indexer
from algosdk.atomic_transaction_composer import AccountTransactionSigner

ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
INDEXER_URL = "https://testnet-idx.algonode.cloud"
INDEXER_TOKEN = ""

CREDENTIAL_CONFIGS = {
    "blood_pressure": {
        "label": "Blood Pressure",
        "min1": 60, "max1": 140, "min2": 40, "max2": 90, "check_dual": 1,
        "pass_label": "Normal", "fail_label": "Elevated",
    },
    "blood_sugar": {
        "label": "Fasting Blood Sugar",
        "min1": 70, "max1": 100, "min2": 0, "max2": 0, "check_dual": 0,
        "pass_label": "Normal", "fail_label": "Outside Range",
    },
    "bmi": {
        "label": "BMI",
        "min1": 185, "max1": 249, "min2": 0, "max2": 0, "check_dual": 0,
        "pass_label": "Healthy", "fail_label": "Outside Range",
    },
    "cholesterol": {
        "label": "Total Cholesterol",
        "min1": 100, "max1": 200, "min2": 0, "max2": 0, "check_dual": 0,
        "pass_label": "Desirable", "fail_label": "Elevated",
    },
    "report_recency": {
        "label": "Report Recency",
        "min1": 0, "max1": 90, "min2": 0, "max2": 0, "check_dual": 0,
        "pass_label": "Recent", "fail_label": "Expired",
    },
}


class AlgorandEngine:
    def __init__(self, env_path=None):
        if env_path is None:
            env_path = Path(__file__).parent.parent / ".env"

        if os.environ.get("ALGORAND_MNEMONIC"):
            self.env = {
                "ALGORAND_MNEMONIC": os.environ["ALGORAND_MNEMONIC"],
                "VERIFIER_APP_ID": os.environ.get("VERIFIER_APP_ID", "757273463"),
            }
        else:
            self.env = self._load_env(env_path)

        mn = self.env.get("ALGORAND_MNEMONIC", "")
        if not mn:
            raise ValueError("ALGORAND_MNEMONIC not found in .env")

        self.private_key = mnemonic.to_private_key(mn)
        self.address = account.address_from_private_key(self.private_key)
        self.client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)
        self.indexer_client = indexer.IndexerClient(INDEXER_TOKEN, INDEXER_URL)
        self.signer = AccountTransactionSigner(self.private_key)
        self.verifier_app_id = int(self.env.get("VERIFIER_APP_ID", "0"))
        self.credential_counter = 0

    def _load_env(self, env_path):
        env_vars = {}
        if Path(env_path).exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        env_vars[key.strip()] = value.strip()
        return env_vars

    def get_balance(self):
        info = self.client.account_info(self.address)
        return info["amount"] / 1_000_000

    def check_value_in_range(self, credential_type, value1, value2=0):
        config = CREDENTIAL_CONFIGS.get(credential_type)
        if not config:
            return False, f"Unknown credential type: {credential_type}"
        if not (config["min1"] <= value1 <= config["max1"]):
            return False, config["fail_label"]
        if config["check_dual"] == 1:
            if not (config["min2"] <= value2 <= config["max2"]):
                return False, config["fail_label"]
        return True, config["pass_label"]

    def verify_credential(self, credential_type, value1, value2=0):
        in_range, result_label = self.check_value_in_range(credential_type, value1, value2)
        config = CREDENTIAL_CONFIGS[credential_type]
        return {
            "credential_type": credential_type,
            "label": config["label"],
            "in_range": in_range,
            "result_label": result_label,
        }

    def log_consent_on_chain(self, user_hash, verifier_id, credential_types, credential_id, results_summary):
        consent_data = {
            "type": "zkHealthCred_consent",
            "version": "1.0",
            "credential_id": credential_id,
            "user_hash": user_hash,
            "verifier_id": verifier_id,
            "credential_types": credential_types,
            "results": results_summary,
            "timestamp": int(time.time()),
            "verifier_app_id": self.verifier_app_id,
            "status": "active",
        }
        sp = self.client.suggested_params()
        note = json.dumps(consent_data).encode("utf-8")
        txn = transaction.PaymentTxn(
            sender=self.address, sp=sp, receiver=self.address, amt=0, note=note,
        )
        signed_txn = txn.sign(self.private_key)
        tx_id = self.client.send_transaction(signed_txn)
        transaction.wait_for_confirmation(self.client, tx_id, 10)
        return tx_id

    def log_revocation_on_chain(self, consent_id, user_hash, original_tx_id):
        revocation_data = {
            "type": "zkHealthCred_revocation",
            "version": "1.0",
            "consent_id": consent_id,
            "user_hash": user_hash,
            "original_tx_id": original_tx_id,
            "timestamp": int(time.time()),
        }
        sp = self.client.suggested_params()
        note = json.dumps(revocation_data).encode("utf-8")
        txn = transaction.PaymentTxn(
            sender=self.address, sp=sp, receiver=self.address, amt=0, note=note,
        )
        signed_txn = txn.sign(self.private_key)
        tx_id = self.client.send_transaction(signed_txn)
        transaction.wait_for_confirmation(self.client, tx_id, 10)
        return tx_id

    def generate_credential_bundle(self, credentials, user_hash, verifier_id="demo"):
        self.credential_counter += 1
        credential_id = f"HS-{self.credential_counter:04d}"

        results = []
        results_summary = []
        all_passed = True

        for cred in credentials:
            result = self.verify_credential(cred["type"], cred["value1"], cred.get("value2", 0))
            results.append(result)
            results_summary.append({"type": cred["type"], "passed": result["in_range"]})
            if not result["in_range"]:
                all_passed = False

        credential_types = [c["type"] for c in credentials]
        try:
            consent_tx_id = self.log_consent_on_chain(
                user_hash=user_hash, verifier_id=verifier_id,
                credential_types=credential_types, credential_id=credential_id,
                results_summary=results_summary,
            )
            consent_explorer_url = f"https://lora.algokit.io/testnet/transaction/{consent_tx_id}"
        except Exception as e:
            consent_tx_id = None
            consent_explorer_url = None
            print(f"Warning: Failed to log consent on-chain: {e}")

        consent_record = {
            "consent_id": credential_id,
            "credential_id": credential_id,
            "user_hash": user_hash,
            "verifier_id": verifier_id,
            "credential_types": credential_types,
            "results": results_summary,
            "status": "active",
            "tx_id": consent_tx_id,
            "explorer_url": consent_explorer_url,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        return {
            "credential_id": credential_id,
            "all_passed": all_passed,
            "results": results,
            "consent": consent_record,
            "verifier_app_id": self.verifier_app_id,
            "verifier_explorer_url": f"https://lora.algokit.io/testnet/application/{self.verifier_app_id}",
        }

    def get_consent_history_from_chain(self, user_hash=None):
        """Read consent history directly from Algorand blockchain via indexer."""
        try:
            # Search for all transactions from our account with note prefix
            search_result = self.indexer_client.search_transactions(
                address=self.address,
                note_prefix=base64.b64encode(b'{"type":"zkHealthCred_consent"').decode(),
                limit=50,
            )

            # Also get revocations
            revocation_result = self.indexer_client.search_transactions(
                address=self.address,
                note_prefix=base64.b64encode(b'{"type":"zkHealthCred_revocation"').decode(),
                limit=50,
            )

            # Parse revocations into a set of revoked tx_ids
            revoked_tx_ids = set()
            revocation_map = {}
            for txn in revocation_result.get("transactions", []):
                note_b64 = txn.get("note", "")
                try:
                    note_bytes = base64.b64decode(note_b64)
                    note_data = json.loads(note_bytes)
                    if note_data.get("type") == "zkHealthCred_revocation":
                        original_tx = note_data.get("original_tx_id", "")
                        revoked_tx_ids.add(original_tx)
                        revocation_map[original_tx] = {
                            "revoke_tx_id": txn["id"],
                            "revoked_at": datetime.utcfromtimestamp(
                                note_data.get("timestamp", 0)
                            ).isoformat() + "Z",
                        }
                except Exception:
                    continue

            # Parse consent transactions
            consents = []
            for txn in search_result.get("transactions", []):
                note_b64 = txn.get("note", "")
                try:
                    note_bytes = base64.b64decode(note_b64)
                    note_data = json.loads(note_bytes)
                    if note_data.get("type") != "zkHealthCred_consent":
                        continue

                    tx_id = txn["id"]
                    consent_user_hash = note_data.get("user_hash", "")

                    # Filter by user_hash if provided
                    if user_hash and consent_user_hash != user_hash:
                        continue

                    is_revoked = tx_id in revoked_tx_ids
                    revoke_info = revocation_map.get(tx_id, {})

                    consent = {
                        "consent_id": note_data.get("credential_id", ""),
                        "credential_id": note_data.get("credential_id", ""),
                        "user_hash": consent_user_hash,
                        "verifier_id": note_data.get("verifier_id", ""),
                        "credential_types": note_data.get("credential_types", []),
                        "results": note_data.get("results", []),
                        "status": "revoked" if is_revoked else "active",
                        "tx_id": tx_id,
                        "explorer_url": f"https://lora.algokit.io/testnet/transaction/{tx_id}",
                        "created_at": datetime.utcfromtimestamp(
                            note_data.get("timestamp", 0)
                        ).isoformat() + "Z",
                    }

                    if is_revoked:
                        consent["revoke_tx_id"] = revoke_info.get("revoke_tx_id")
                        consent["revoked_at"] = revoke_info.get("revoked_at")

                    consents.append(consent)
                except Exception:
                    continue

            # Sort by timestamp descending (newest first)
            consents.sort(key=lambda c: c.get("created_at", ""), reverse=True)
            return consents

        except Exception as e:
            print(f"Warning: Failed to read consent history from chain: {e}")
            return []

    def get_credential_from_chain(self, credential_id):
        """Look up a specific credential from the blockchain."""
        consents = self.get_consent_history_from_chain()
        for c in consents:
            if c.get("credential_id") == credential_id:
                return c
        return None

    def revoke_consent_on_chain(self, credential_id, user_hash):
        """Revoke a consent by logging a revocation transaction."""
        # Find the original consent tx
        consents = self.get_consent_history_from_chain(user_hash)
        original_tx_id = None
        for c in consents:
            if c.get("credential_id") == credential_id and c.get("status") == "active":
                original_tx_id = c.get("tx_id")
                break

        if not original_tx_id:
            return None

        try:
            revoke_tx_id = self.log_revocation_on_chain(
                consent_id=credential_id,
                user_hash=user_hash,
                original_tx_id=original_tx_id,
            )
            return {
                "credential_id": credential_id,
                "status": "revoked",
                "revoke_tx_id": revoke_tx_id,
                "revoke_explorer_url": f"https://lora.algokit.io/testnet/transaction/{revoke_tx_id}",
            }
        except Exception as e:
            print(f"Warning: Failed to revoke on-chain: {e}")
            return None


if __name__ == "__main__":
    print("zkHealthCred — Algorand Engine Test")
    engine = AlgorandEngine()
    print(f"Account: {engine.address}")
    print(f"Balance: {engine.get_balance()} ALGO")

    print("\nReading consent history from Algorand blockchain...")
    history = engine.get_consent_history_from_chain()
    print(f"Found {len(history)} consents on-chain")
    for c in history:
        print(f"  {c['credential_id']} | {c['verifier_id']} | {c['status']} | {c['tx_id'][:16]}...")
