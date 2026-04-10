#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/circuits/build"
PTAU_FILE="$ROOT_DIR/circuits/powersOfTau28_hez_final_14.ptau"

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

if [ ! -f "$PTAU_FILE" ]; then
  echo "Downloading powers of tau file..."
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau -o "$PTAU_FILE"
fi

echo "Running Groth16 setup..."
npx snarkjs groth16 setup circuits/build/healthrange.r1cs "$PTAU_FILE" circuits/circuit_0000.zkey
echo "zkHealthCred zkVerify demo contribution" | npx snarkjs zkey contribute circuits/circuit_0000.zkey circuits/circuit_final.zkey --name="zkHealthCred zkVerify" -v
npx snarkjs zkey export verificationkey circuits/circuit_final.zkey circuits/verification_key.json

echo "Circuit artifacts ready in circuits/."
