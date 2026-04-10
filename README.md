# zkHealthCred on zkVerify

Zero-knowledge health credential verification ported from the original Algorand build to a zkVerify-first stack.

Patients enter five health credentials, the app evaluates them with a Circom-compatible range proof flow, submits Groth16 proofs to zkVerify when configured, and shares a pass/fail-only verification link with third parties. Consent can be revoked later, at which point verifier lookups are denied.

## What Changed

- `Circom + snarkjs` replaces the original gnark / AlgoPlonk circuit flow.
- `Node.js + Express` replaces the original Flask API.
- `zkVerify relayer or SDK` replaces Algorand verification.
- `React/Vite frontend` keeps the existing user experience, now rebranded for zkVerify.

The original Python, Go, and Algorand files are still in the repo as reference material, but the active demo entrypoints are:

- `backend/server.js`
- `backend/proof-generator.js`
- `backend/zkverify-engine.js`
- `circuits/healthrange.circom`

## Current Modes

The backend supports three modes automatically:

1. `sdk`
Use when `ZKVERIFY_SEED_PHRASE` is set. The server will try to submit Groth16 proofs through `zkverifyjs`.

2. `relayer`
Use when `ZKVERIFY_API_KEY` is set. The server will submit Groth16 proofs through the zkVerify relayer API and poll for completion.

3. `demo`
Used when zkVerify credentials or circuit artifacts are missing. The app still works end to end with the same UX and a local consent ledger, which is useful for demos and UI validation.

## Health Credentials

The demo supports the same five credentials:

- Blood pressure
- Fasting blood sugar
- BMI
- Cholesterol
- Report recency

Only pass/fail status is ever shared with a verifier.

## Local Setup

Prerequisites:

- Node.js 18+
- `circom` installed if you want real Groth16 artifacts

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
node server.js
```

Optional env vars for real zkVerify submission:

- `ZKVERIFY_SEED_PHRASE`
- `ZKVERIFY_API_KEY`
- `ZKVERIFY_RELAYER_API_URL`
- `ZKVERIFY_EXPLORER_URL`

### 2. Circuit Setup

If you want actual snarkjs proofs instead of demo mode:

```bash
./scripts/setup-circuit.sh
```

That script compiles the Circom circuit, downloads the powers of tau file, creates a demo Groth16 setup, and exports `circuits/verification_key.json`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

## Deployment

### Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables:
  - `PORT=8080`
  - `ZKVERIFY_NETWORK=Volta`
  - `ZKVERIFY_SEED_PHRASE` or `ZKVERIFY_API_KEY`
  - `ZKVERIFY_RELAYER_API_URL=https://relayer-api.horizenlabs.io/api/v1`
  - `ZKVERIFY_EXPLORER_URL=https://zkverify-explorer.zeeve.net/extrinsic`

Important:

- If you do not upload the generated circuit artifacts (`circuits/circuit_final.zkey`, `circuits/verification_key.json`, `circuits/build/...`), the backend will fall back to demo mode.
- Render has ephemeral storage, so the local consent ledger is demo-grade only. For a production version, move consent records to a durable database or complete the on-chain consent logging path.

### Frontend on Vercel

- Root directory: `frontend`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_URL=https://your-render-service.onrender.com`

## GitHub Deploy Steps

```bash
git init
git add .
git commit -m "Port zkHealthCred to zkVerify"
git branch -M main
git remote add origin https://github.com/<your-username>/zkhealthcred-zkverify.git
git push -u origin main
```

Then:

1. Create a new Render Web Service from that GitHub repo and point it to the `backend` folder.
2. Create a new Vercel project from the same GitHub repo and point it to the `frontend` folder.
3. Add the environment variables in both dashboards.
4. Redeploy after setting `VITE_API_URL` to the live Render backend URL.

## Demo Flow

1. Register or login.
2. Enter health data on the patient dashboard.
3. Generate the credential bundle.
4. Copy the verification link.
5. Open it as a verifier and confirm only pass/fail is visible.
6. Revoke consent from the consent log and verify that the public lookup is denied afterward.

## Notes

- The frontend now presents zkVerify terminology everywhere.
- The backend keeps the original API shape so the UI flow remains stable.
- If you need full production-grade on-chain consent storage, the next step would be replacing the local consent ledger with durable storage and extending zkVerify submission beyond proof attestations.
