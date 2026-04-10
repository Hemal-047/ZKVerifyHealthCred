import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { CREDENTIAL_CONFIGS, generateProof, getCircuitArtifactsStatus } from './proof-generator.js';
import {
  createConsentReceipt,
  createRevocationReceipt,
  getIntegrationStatus,
  submitProofToZkVerify,
} from './zkverify-engine.js';
import {
  findConsentById,
  getUserByEmail,
  listConsentsForUser,
  saveConsent,
  saveUser,
  updateConsent,
} from './storage.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const sessions = new Map();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function hashIdentity(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createCredentialId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ZKHV-${stamp}-${suffix}`;
}

function getCurrentUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return { email: null, user: null };
  }
  const token = auth.slice(7);
  const email = sessions.get(token);
  const user = email ? getUserByEmail(email) : null;
  return { email, user };
}

function normalizeCredentialInput(rawCredential = {}) {
  const type = rawCredential.type;
  if (type === 'bmi') {
    const height = Number(rawCredential.height) || 0;
    const weight = Number(rawCredential.weight) || 0;
    const bmi = height > 0 && weight > 0 ? weight / ((height / 100) ** 2) : 0;
    return { type, value1: Math.round(bmi * 10), value2: 0 };
  }

  if (type === 'report_recency' && rawCredential.date) {
    const reportDate = new Date(rawCredential.date);
    const diffMs = Date.now() - reportDate.getTime();
    const diffDays = Number.isFinite(diffMs) ? Math.max(0, Math.floor(diffMs / 86400000)) : 0;
    return { type, value1: diffDays, value2: 0 };
  }

  return {
    type,
    value1: Number(rawCredential.value1) || 0,
    value2: Number(rawCredential.value2) || 0,
  };
}

function buildVerifierResult(result) {
  return {
    credential_type: result.credential_type,
    label: result.label,
    result_label: result.result_label,
    verified: result.in_range,
    proof_mode: result.proof_mode,
    tx_id: result.tx_id || '',
    explorer_url: result.explorer_url || '',
    attestation_id: result.attestation_id || '',
    warning: result.warning || '',
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'zkHealthCred zkVerify API',
    ...getIntegrationStatus(),
    circuit: getCircuitArtifactsStatus(),
  });
});

app.post('/api/auth/register', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  if (getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already registered. Please login.' });
  }

  const token = createToken();
  const user = saveUser(email, {
    password_hash: hashPassword(password),
    name: name || email.split('@')[0],
    user_hash: hashIdentity(email),
  });

  sessions.set(token, email);
  return res.json({ status: 'ok', token, name: user.name, email });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = getUserByEmail(email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createToken();
  sessions.set(token, email);
  return res.json({ status: 'ok', token, name: user.name, email });
});

app.get('/api/auth/me', (req, res) => {
  const { email, user } = getCurrentUser(req);
  if (!email || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ email, name: user.name, user_hash: user.user_hash });
});

app.post('/api/proof/generate-all', async (req, res) => {
  const rawCredentials = Array.isArray(req.body?.credentials) ? req.body.credentials : [];
  const verifierId = String(req.body?.verifier_id || 'zkVerify Demo Verifier').trim();

  if (rawCredentials.length === 0) {
    return res.status(400).json({ error: 'No credentials provided' });
  }

  const { email, user } = getCurrentUser(req);
  const userHash =
    user?.user_hash || hashIdentity(email || `anon_${new Date().toISOString()}_${crypto.randomUUID()}`);

  try {
    const processed = rawCredentials.map(normalizeCredentialInput);
    const results = [];
    const submissions = [];

    for (const credential of processed) {
      const proofResult = await generateProof(credential.type, credential.value1, credential.value2);
      let submission = null;

      if (proofResult.can_submit && proofResult.proof && proofResult.verificationKey) {
        try {
          submission = await submitProofToZkVerify({
            proof: proofResult.proof,
            publicSignals: proofResult.publicSignals,
            verificationKey: proofResult.verificationKey,
          });
          submissions.push(submission);
        } catch (error) {
          submission = {
            source: getIntegrationStatus().mode,
            txHash: '',
            attestationId: '',
            explorerUrl: '',
            warning: error.message,
          };
        }
      }

      results.push({
        credential_type: proofResult.credential_type,
        label: proofResult.label,
        in_range: proofResult.in_range,
        result_label: proofResult.result_label,
        verified: proofResult.verified,
        proof_mode: proofResult.proof_mode,
        tx_id: submission?.txHash || '',
        explorer_url: submission?.explorerUrl || '',
        attestation_id: submission?.attestationId || '',
        warning: proofResult.warning || submission?.warning || '',
      });
    }

    const credentialId = createCredentialId();
    const consentReceipt = createConsentReceipt({
      credentialId,
      verifierId,
      results,
      submissions,
    });

    const consent = saveConsent({
      consent_id: credentialId,
      credential_id: credentialId,
      user_hash: userHash,
      verifier_id: verifierId,
      credential_types: processed.map((credential) => credential.type),
      status: 'active',
      tx_id: consentReceipt.txHash,
      explorer_url: consentReceipt.explorerUrl,
      attestation_id: consentReceipt.attestationId,
      source: consentReceipt.source,
      results,
      created_at: new Date().toISOString(),
    });

    return res.json({
      credential_id: credentialId,
      all_passed: results.every((result) => result.in_range),
      results,
      consent,
      zkverify: {
        ...getIntegrationStatus(),
        circuit: getCircuitArtifactsStatus(),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to generate proofs' });
  }
});

app.get('/api/credential/:credentialId', (req, res) => {
  const consent = findConsentById(req.params.credentialId);
  if (!consent) {
    return res.status(404).json({ error: 'Credential not found' });
  }

  return res.json({
    credential_id: consent.credential_id,
    verifier_id: consent.verifier_id,
    credential_types: consent.credential_types,
    status: consent.status,
    tx_id: consent.tx_id || '',
    explorer_url: consent.explorer_url || '',
    attestation_id: consent.attestation_id || '',
    revoke_tx_id: consent.revoke_tx_id || '',
    revoke_explorer_url: consent.revoke_explorer_url || '',
    source: consent.source || 'local-ledger',
    created_at: consent.created_at,
    revoked_at: consent.revoked_at || '',
    results: (consent.results || []).map(buildVerifierResult),
  });
});

app.get('/api/consent/history', (req, res) => {
  const { user } = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ history: listConsentsForUser(user.user_hash) });
});

app.post('/api/consent/revoke/:credentialId', (req, res) => {
  const { user } = getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Must be logged in to revoke' });
  }

  const existing = findConsentById(req.params.credentialId);
  if (!existing || existing.user_hash !== user.user_hash || existing.status !== 'active') {
    return res.status(404).json({ error: 'Consent not found or already revoked' });
  }

  const receipt = createRevocationReceipt({
    credentialId: existing.credential_id,
    userHash: user.user_hash,
    previousTxId: existing.tx_id,
  });

  const updated = updateConsent(existing.credential_id, (current) => ({
    ...current,
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    revoke_tx_id: receipt.txHash,
    revoke_explorer_url: receipt.explorerUrl,
  }));

  return res.json({ status: 'revoked', consent: updated });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  const integration = getIntegrationStatus();
  console.log(`zkHealthCred zkVerify API listening on http://localhost:${port}`);
  console.log(`Mode: ${integration.mode} | Network: ${integration.network_label}`);
});
