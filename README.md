# zkHealthCred

**Zero-Knowledge Health Credential Verification on Algorand**

*AlgoBharat Hack Series 3.0 | Team PrivacyShield | Track: DPDP & RegTech*

Prove your health status to insurers, employers, or any verifier — without revealing your actual medical data. Built with zero-knowledge proofs on Algorand.

## Live Demo

- **App:** [https://zk-health-cred.vercel.app](https://zk-health-cred.vercel.app)
- **API:** [https://zkhealthcred-api.onrender.com](https://zkhealthcred-api.onrender.com)
- **Verifier Contract:** [App ID 757273463 on Algorand TestNet](https://lora.algokit.io/testnet/application/757273463)
- **GitHub:** [https://github.com/Hemal-047/zkHealthCred](https://github.com/Hemal-047/zkHealthCred)

## What It Does

Users enter health data (blood pressure, blood sugar, BMI, cholesterol, report date). A zero-knowledge proof verifies each value is within an acceptable medical range — outputting only **pass/fail**, never the actual numbers.

Every verification creates a **real Algorand TestNet transaction** with consent data in the note field. Verifiers (insurance companies, employers) receive a shareable link showing pass/fail status only. Users can revoke consent at any time — also recorded on-chain.

**Consent history is read directly from the Algorand blockchain** — the chain is the database. No centralized storage for consent records.

## Health Credentials

| Credential | What's Proven | What Verifier Sees |
|-----------|--------------|-------------------|
| Blood Pressure | Systolic & diastolic within range | Normal or Elevated |
| Fasting Blood Sugar | Glucose in healthy range | Normal or Outside Range |
| BMI | Body mass index in healthy range | Healthy or Outside Range |
| Total Cholesterol | Below threshold | Desirable or Elevated |
| Report Recency | Report date within 90 days | Recent or Expired |

All five credentials use **one configurable ZK circuit** (12,800 constraints, BN254 curve).

## How It Works

```
Patient enters health data
        |
        v
ZK proof generated (gnark + AlgoPlonk)
Circuit checks values within medical ranges
Outputs only pass/fail — never actual values
        |
        v
Consent logged on Algorand TestNet
Real transaction with consent data in note field
Verifier contract deployed (App ID: 757273463)
        |
        v
Shareable verification link generated
Verifier sees pass/fail only
Patient can revoke consent anytime (also on-chain)
```

## Architecture

```
Frontend (React/Vite)          Backend (Python/Flask)         Algorand TestNet
--------------------           ---------------------          ----------------
User registers/logs in ----->  Auth (email + password)
                                                    
User enters health data ---->  ZK verification logic ------> Consent transaction
                               (gnark circuit params)         (note field = JSON)
                                                    
Verifier opens link -------->  Credential lookup ----------> Read from indexer
                               (by credential ID)             (blockchain = database)
                                                    
User revokes consent ------->  Revocation logic ------------> Revocation transaction
                                                               (references original tx)
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| ZK Circuits | [gnark](https://github.com/ConsenSys/gnark) (Go) — 12,800 constraints, BN254 |
| ZK Verifier | [AlgoPlonk](https://github.com/giuliop/AlgoPlonk) — auto-generated Algorand verifier |
| Smart Contract | PuyaPy → TEAL — deployed on Algorand TestNet |
| Backend | Python / Flask — proof verification + consent logging |
| Frontend | React / Vite — patient dashboard, verifier, consent log |
| Blockchain | Algorand TestNet — consent storage + verifier contract |
| Consent Storage | Algorand blockchain (indexer reads) — no centralized database |
| Hosting | Vercel (frontend) + Render (backend) |

## ZK Circuit

The core ZK circuit (`circuits/healthrange/circuit.go`) is a **configurable range proof**:

- **Private inputs:** Health values (never revealed)
- **Public inputs:** Acceptable thresholds (configurable per credential type)
- **Output:** Valid proof (values in range) or failed proof (values out of range)
- **10 unit tests** covering all 5 credential types (pass + fail cases)

```
go test ./healthrange/ -v
# All 10 tests pass — BP, blood sugar, BMI, cholesterol, report recency
```

## DPDP Act 2023 Compliance

- **Section 4 — Data Minimization:** Only pass/fail status shared, never raw health data
- **Section 6 — Consent:** Every verification requires explicit consent, logged immutably on Algorand
- **Section 12 — Right to Erasure:** Users can revoke consent at any time, recorded on-chain

## Project Structure

```
zkHealthCred/
├── circuits/                    # gnark ZK circuit definitions
│   ├── healthrange/circuit.go   # Configurable range proof circuit
│   ├── healthrange/circuit_test.go  # 10 unit tests
│   └── main.go                  # Compile circuit + generate AlgoPlonk verifier
├── contracts/
│   ├── verifier/                # AlgoPlonk-generated TEAL verifier
│   └── consent/                 # Consent manager contract
├── backend/
│   ├── algorand_engine.py       # Algorand integration (consent logging, indexer reads)
│   └── api_server.py            # Flask REST API
├── frontend/
│   └── src/
│       ├── pages/PatientDashboard.jsx   # Health data entry + ZK proof generation
│       ├── pages/VerifierDashboard.jsx  # Public credential verification
│       ├── pages/ConsentLog.jsx         # Consent history (from blockchain)
│       └── pages/ArchitectureDiagram.jsx # How it works
└── scripts/                     # Deployment and test scripts
```

## Quick Start

**Prerequisites:** Go 1.21+, Python 3.10+, Node.js 18+, AlgoKit, PuyaPy

```bash
# Clone
git clone https://github.com/Hemal-047/zkHealthCred.git
cd zkHealthCred

# Test ZK circuit
cd circuits && go test ./healthrange/ -v

# Compile circuit + generate verifier
go run main.go

# Start backend
cd ../backend
pip install -r requirements.txt
python api_server.py

# Start frontend
cd ../frontend
npm install && npm run dev
```

## Team

**Team PrivacyShield** — built by the team behind [Privexa](https://play.google.com/store/apps/details?id=io.privexa.app), a live health data platform on Google Play with 1,000+ users. zkHealthCred demonstrates ZK credential verification as a standalone open-source module for the Algorand ecosystem.

In production, Privexa's health data pipeline (encrypted vault, wearable sync, AI document analysis) feeds structured health data directly into zkHealthCred's ZK circuits — so instead of manual entry, the app extracts values from uploaded lab reports and generates proofs automatically.

## License

MIT
