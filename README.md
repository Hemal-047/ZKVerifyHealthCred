# 🛡️ PrivacyShield — ZK Health Credentials on Algorand

**AlgoBharat Hack Series 3.0 | Team: PrivacyShield | Track: DPDP & RegTech**

Privacy-preserving health credential verification using zero-knowledge proofs on Algorand. Prove your health attributes without revealing your actual data.

## What It Does

Users can prove health attributes (blood pressure, blood sugar, BMI, cholesterol, report recency) to verifiers **without revealing the actual values**. All verification happens on-chain via ZK proofs on Algorand, with full DPDP Act-compliant consent logging.

| Credential | What You Prove | What Verifier Sees |
|-----------|---------------|-------------------|
| Blood Pressure | Systolic & Diastolic within range | ✅ Normal / ❌ Elevated |
| Fasting Blood Sugar | Glucose in healthy range | ✅ Normal / ❌ Outside Range |
| BMI | Body mass index in healthy range | ✅ Healthy / ❌ Outside Range |
| Total Cholesterol | Below threshold | ✅ Desirable / ❌ Elevated |
| Report Recency | Report date within 90 days | ✅ Recent / ❌ Expired |

## Architecture

```
┌──────────────┐     REST API     ┌──────────────┐     AlgoSDK     ┌──────────────┐
│   Frontend   │ ───────────────► │  Go Backend  │ ──────────────► │   Algorand   │
│   (React)    │                  │  (gnark +    │                  │   TestNet    │
│              │ ◄─────────────── │   AlgoSDK)   │ ◄────────────── │              │
└──────────────┘                  └──────────────┘                  │ • ZK Verifier│
                                                                    │ • Consent Mgr│
                                                                    └──────────────┘
```

## Project Structure

```
privacyshield/
├── circuits/          # gnark ZK circuit definitions
│   └── healthrange/   # Configurable health range proof circuit
├── backend/           # Go backend — proof generation + Algorand interaction
│   ├── cmd/           # Entry point
│   └── internal/
│       ├── api/       # REST API handlers
│       ├── algorand/  # AlgoSDK integration
│       └── prover/    # gnark proof generation wrapper
├── frontend/          # React web app
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Patient Dashboard, Verifier, Consent Log
│       └── services/    # API client
├── contracts/         # Algorand smart contracts
│   ├── consent/       # Consent Manager (Algorand Python)
│   └── verifier/      # AlgoPlonk-generated verifier (auto-generated)
├── scripts/           # Build, deploy, test scripts
└── docs/              # Documentation
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| ZK Circuits | [gnark](https://github.com/ConsenSys/gnark) (Go) |
| ZK Verifier | [AlgoPlonk](https://github.com/giuliop/AlgoPlonk) → Algorand Smart Contract |
| Consent Logger | Algorand Python (Puya) |
| Backend | Go |
| Frontend | React |
| Blockchain | Algorand TestNet |
| Dev Tooling | AlgoKit + VibeKit |

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- AlgoKit CLI
- Algorand TestNet account with ALGO

### Setup
```bash
# Clone
git clone https://github.com/[your-repo]/privacyshield.git
cd privacyshield

# Backend
cd backend && go mod tidy && go run cmd/main.go

# Frontend
cd frontend && npm install && npm start

# Deploy contracts
cd contracts && algokit deploy
```

## DPDP Act Compliance

This module directly addresses India's Digital Personal Data Protection Act 2023:
- **Data Minimization (Section 4):** Only pass/fail status is shared, never raw health data
- **Consent Management (Section 6):** Every verification requires explicit consent, logged immutably on Algorand
- **Right to Erasure (Section 12):** Users can revoke consent at any time, recorded on-chain

## License

MIT License — see [LICENSE](LICENSE)

## Team

Built by the team behind [Privexa](https://privexa.io) — a live health data platform with 1,000+ users. This hackathon module demonstrates ZK credential verification as a standalone, reusable component for the Algorand ecosystem.
