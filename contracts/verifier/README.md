# ZK Verifier Contract

This directory will contain the AlgoPlonk-generated Algorand smart contract verifier.

## How It's Generated

The verifier is **auto-generated** — you don't write it manually:

```bash
cd ../../circuits
go run main.go
```

This compiles the `HealthRangeProof` gnark circuit with AlgoPlonk and outputs:
- `verifier.py` — Algorand Python (PuyaPy) smart contract verifier
- `generated/proof.bin` — Test proof for on-chain verification
- `generated/public_inputs.bin` — Corresponding public inputs

## Deployment

```bash
algokit compile verifier.py
algokit deploy --network testnet
```

## How Verification Works

1. Backend generates a gnark proof for a health credential
2. Backend submits proof + public inputs to this verifier contract on Algorand
3. Verifier contract runs AlgoPlonk verification (elliptic curve pairing checks)
4. Contract returns `True` (valid proof) or `False` (invalid)
5. Transaction is recorded on-chain as immutable verification evidence
