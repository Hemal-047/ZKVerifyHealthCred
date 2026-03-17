"""
PrivacyShield — Deploy Verifier & Test On-Chain Proof Verification
==================================================================

This script:
1. Deploys the ZK verifier LogicSig to Algorand TestNet
2. Deploys a simple test app that calls the verifier
3. Submits the test proof (BP 125/82) for on-chain verification
4. Confirms the proof is verified on Algorand TestNet

Usage:
    cd X:\algo zk\privacyshield\scripts
    python deploy_and_test.py
"""

import os
import sys
import base64
from pathlib import Path
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# ============ Configuration ============

ALGOD_URL = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""

# Load mnemonic from .env file
def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        print(f"❌ .env file not found at {env_path}")
        print("   Create it with: ALGORAND_MNEMONIC=your 25 word mnemonic here")
        sys.exit(1)

    env_vars = {}
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

def main():
    print("🛡️  PrivacyShield — On-Chain Verification Test")
    print("=" * 50)

    # Load environment
    env = load_env()
    mn = env.get("ALGORAND_MNEMONIC", "")
    if not mn:
        print("❌ ALGORAND_MNEMONIC not found in .env")
        sys.exit(1)

    # Recover account
    private_key = mnemonic.to_private_key(mn)
    sender_address = account.address_from_private_key(private_key)
    print(f"📍 Account: {sender_address}")

    # Connect to TestNet
    client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)
    account_info = client.account_info(sender_address)
    balance = account_info["amount"] / 1_000_000
    print(f"💰 Balance: {balance} ALGO")

    if balance < 1:
        print("❌ Insufficient balance. Fund your account at https://bank.testnet.algorand.network/")
        sys.exit(1)

    # ============ Step 1: Read TEAL files ============
    print("\n📂 Step 1: Loading TEAL verifier...")

    verifier_dir = Path(__file__).parent.parent / "contracts" / "verifier"
    approval_path = verifier_dir / "Verifier.approval.teal"
    clear_path = verifier_dir / "Verifier.clear.teal"

    if not approval_path.exists():
        print(f"❌ {approval_path} not found. Run 'puyapy verifier.py' first.")
        sys.exit(1)

    with open(approval_path, encoding="utf-8") as f:
        approval_teal = f.read()
    with open(clear_path, encoding="utf-8") as f:
        clear_teal = f.read()

    # Compile TEAL to bytecode
    print("   Compiling approval program...")
    approval_result = client.compile(approval_teal)
    approval_program = base64.b64decode(approval_result["result"])

    print("   Compiling clear program...")
    clear_result = client.compile(clear_teal)
    clear_program = base64.b64decode(clear_result["result"])

    print(f"   ✅ Approval program: {len(approval_program)} bytes")
    print(f"   ✅ Clear program: {len(clear_program)} bytes")

    # ============ Step 2: Deploy Smart Contract ============
    print("\n🚀 Step 2: Deploying verifier to TestNet...")

    sp = client.suggested_params()

    # Read ARC56 to get schema info
  
# Schema for the verifier contract - needs 1 uint (immutable flag) + 2 byte slices (app_name, etc)
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=2)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Use ABI to call the create method during deployment
    from algosdk.abi import Method
    from algosdk.atomic_transaction_composer import AtomicTransactionComposer, AccountTransactionSigner

    create_method = Method.from_signature("create(string)void")
    signer = AccountTransactionSigner(private_key)

    atc = AtomicTransactionComposer()
    atc.add_method_call(
        app_id=0,  # 0 means create new app
        method=create_method,
        sender=sender_address,
        sp=sp,
        signer=signer,
        method_args=["zkHealthCred Verifier"],
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        extra_pages=2,
    )

    print("   📤 Sending create transaction...")
    result = atc.execute(client, 10)
    tx_id = result.tx_ids[0]

    # Get the app ID from the transaction result
    tx_info = client.pending_transaction_info(tx_id)
    app_id = tx_info["application-index"]
    print(f"   ✅ Verifier deployed! App ID: {app_id}")
    print(f"   🔗 https://lora.algokit.io/testnet/application/{app_id}")

    # ============ Step 3: Test Proof Verification ============
    print("\n🧪 Step 3: Submitting test proof for on-chain verification...")

    # Read proof and public inputs
    generated_dir = verifier_dir / "generated"
    proof_path = generated_dir / "proof.bin"
    public_inputs_path = generated_dir / "public_inputs.bin"

    if not proof_path.exists() or not public_inputs_path.exists():
        print(f"❌ Proof files not found. Run 'go run main.go' in circuits/ first.")
        sys.exit(1)

    with open(proof_path, "rb") as f:
        proof_bytes = f.read()
    with open(public_inputs_path, "rb") as f:
        public_inputs_bytes = f.read()

    print(f"   Proof size: {len(proof_bytes)} bytes")
    print(f"   Public inputs size: {len(public_inputs_bytes)} bytes")

    # Call the verify method on the deployed app
    # The verifier expects proof and public_inputs as app args
    sp = client.suggested_params()
    sp.flat_fee = True
    sp.fee = 1000  # minimum fee

    # For LogicSig verifier the opcode budget is ~145,000
    # We need to pool opcode budget by adding extra app calls in a group
    # Each app call adds 700 opcodes, we need ~208 calls
    # But for a smart contract verifier, we use inner txns

    # Try calling verify ABI method
    from algosdk.abi import Method, Contract

    verify_method = Method.from_signature("verify(byte[],byte[])bool")

    atc = AtomicTransactionComposer()

    signer = AccountTransactionSigner(private_key)

    # Add extra app calls to pool opcode budget
    # Smart contract verifier needs ~145,000 budget
    # Each inner app call gives 700, but we can also use fee pooling
    sp_pooled = client.suggested_params()
    sp_pooled.flat_fee = True
    # Pay for extra budget: 145000 / 700 ≈ 208 app calls
    # But max group size is 16, so we need inner txn budget
    # Set fee high enough to cover inner txns
    sp_pooled.fee = 1000 * 250  # Pay for ~250 inner txns worth of budget

    atc.add_method_call(
        app_id=app_id,
        method=verify_method,
        sender=sender_address,
        sp=sp_pooled,
        signer=signer,
        method_args=[proof_bytes, public_inputs_bytes],
    )

    print("   📤 Sending verification transaction...")
    try:
        result = atc.execute(client, 10)
        tx_id = result.tx_ids[0]
        # Get the return value
        abi_result = result.abi_results[0]
        verified = abi_result.return_value
        print(f"   ✅ Proof verification result: {verified}")
        print(f"   🔗 https://lora.algokit.io/testnet/transaction/{tx_id}")

        if verified:
            print("\n" + "=" * 50)
            print("🎉 SUCCESS! ZK proof verified ON-CHAIN on Algorand TestNet!")
            print(f"   Verifier App ID: {app_id}")
            print(f"   Transaction: {tx_id}")
            print("=" * 50)
        else:
            print("\n   ⚠️ Proof was submitted but verification returned False")

    except Exception as e:
        error_msg = str(e)
        if "budget" in error_msg.lower() or "opcode" in error_msg.lower():
            print(f"\n   ⚠️ Opcode budget exceeded. This is expected for smart contract verifiers.")
            print(f"   The BN254 verifier needs ~145,000 opcodes.")
            print(f"   For the hackathon demo, we may need to use the LogicSig approach instead.")
            print(f"   Verifier is still deployed at App ID: {app_id}")
        else:
            print(f"\n   ❌ Verification transaction failed: {e}")
            print(f"   Verifier is still deployed at App ID: {app_id}")

    # Save app ID to .env
    env_path = Path(__file__).parent.parent / ".env"
    with open(env_path, "a") as f:
        f.write(f"\nVERIFIER_APP_ID={app_id}\n")
    print(f"\n   💾 App ID saved to .env: VERIFIER_APP_ID={app_id}")


if __name__ == "__main__":
    main()
