#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/circuits/build"
PTAU_INITIAL="$ROOT_DIR/circuits/pot12_0000.ptau"
PTAU_CONTRIBUTED="$ROOT_DIR/circuits/pot12_0001.ptau"
PTAU_FINAL="$ROOT_DIR/circuits/pot12_final.ptau"

mkdir -p "$BUILD_DIR"

echo "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install

cd "$ROOT_DIR"

if ! command -v circom >/dev/null 2>&1; then
  echo "circom is not installed. Install it first: https://docs.circom.io/getting-started/installation/"
  exit 1
fi

echo "Compiling Circom circuit..."
circom circuits/healthrange.circom --r1cs --wasm --sym -l backend/node_modules -o circuits/build

echo "Phase 1: Creating Powers of Tau ceremony..."
npx snarkjs powersoftau new bn128 12 "$PTAU_INITIAL" -v

echo "Phase 1: Adding contribution with entropy..."
echo "zkHealthCred-ceremony-$(date +%s)-$$" | \
  npx snarkjs powersoftau contribute "$PTAU_INITIAL" "$PTAU_CONTRIBUTED" \
    --name="zkHealthCred contribution 1" -v

echo "Phase 1: Preparing phase 2..."
npx snarkjs powersoftau prepare phase2 "$PTAU_CONTRIBUTED" "$PTAU_FINAL" -v

echo "Phase 2: Groth16 setup..."
npx snarkjs groth16 setup circuits/build/healthrange.r1cs "$PTAU_FINAL" circuits/circuit_0000.zkey

echo "Phase 2: Adding circuit-specific contribution..."
echo "zkHealthCred-phase2-$(date +%s)-$$" | \
  npx snarkjs zkey contribute circuits/circuit_0000.zkey circuits/circuit_final.zkey \
    --name="zkHealthCred phase2 contribution" -v

echo "Exporting verification key..."
npx snarkjs zkey export verificationkey circuits/circuit_final.zkey circuits/verification_key.json

echo ""
echo "Circuit artifacts ready:"
echo "  WASM:             circuits/build/healthrange_js/healthrange.wasm"
echo "  Proving key:      circuits/circuit_final.zkey"
echo "  Verification key: circuits/verification_key.json"
