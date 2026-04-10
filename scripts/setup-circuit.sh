#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/circuits/build"
PTAU_INITIAL="$ROOT_DIR/circuits/pot12_0000.ptau"
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

echo "Creating local Powers of Tau ceremony..."
npx snarkjs powersoftau new bn128 12 circuits/pot12_0000.ptau -v
npx snarkjs powersoftau prepare phase2 circuits/pot12_0000.ptau circuits/pot12_final.ptau

echo "Running Groth16 setup..."
npx snarkjs groth16 setup circuits/build/healthrange.r1cs "$PTAU_FINAL" circuits/circuit_0000.zkey
cp circuits/circuit_0000.zkey circuits/circuit_final.zkey
npx snarkjs zkey export verificationkey circuits/circuit_final.zkey circuits/verification_key.json

echo "Circuit artifacts ready in circuits/."
