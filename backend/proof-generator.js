import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const circuitsDir = path.join(__dirname, '..', 'circuits');
const buildDir = path.join(circuitsDir, 'build');
const wasmPath = path.join(buildDir, 'healthrange_js', 'healthrange.wasm');
const zkeyPath = path.join(circuitsDir, 'circuit_final.zkey');
const verificationKeyPath = path.join(circuitsDir, 'verification_key.json');

export const CREDENTIAL_CONFIGS = {
  blood_pressure: {
    label: 'Blood Pressure',
    min1: 60,
    max1: 140,
    min2: 40,
    max2: 90,
    checkDual: 1,
    passLabel: 'Normal',
    failLabel: 'Elevated',
  },
  blood_sugar: {
    label: 'Fasting Blood Sugar',
    min1: 70,
    max1: 100,
    min2: 0,
    max2: 0,
    checkDual: 0,
    passLabel: 'Normal',
    failLabel: 'Outside Range',
  },
  bmi: {
    label: 'BMI',
    min1: 185,
    max1: 249,
    min2: 0,
    max2: 0,
    checkDual: 0,
    passLabel: 'Healthy',
    failLabel: 'Outside Range',
  },
  cholesterol: {
    label: 'Total Cholesterol',
    min1: 100,
    max1: 200,
    min2: 0,
    max2: 0,
    checkDual: 0,
    passLabel: 'Desirable',
    failLabel: 'Elevated',
  },
  report_recency: {
    label: 'Report Recency',
    min1: 0,
    max1: 90,
    min2: 0,
    max2: 0,
    checkDual: 0,
    passLabel: 'Recent',
    failLabel: 'Expired',
  },
};

function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function buildInput(config, value1, value2) {
  return {
    value1: toInt(value1),
    value2: toInt(value2),
    min1: config.min1,
    max1: config.max1,
    min2: config.min2,
    max2: config.max2,
    checkDual: config.checkDual,
  };
}

function computeResult(config, value1, value2) {
  let inRange = value1 >= config.min1 && value1 <= config.max1;
  if (config.checkDual === 1) {
    inRange = inRange && value2 >= config.min2 && value2 <= config.max2;
  }
  return {
    inRange,
    resultLabel: inRange ? config.passLabel : config.failLabel,
  };
}

function buildPublicSignals(config) {
  return [config.min1, config.max1, config.min2, config.max2, config.checkDual].map(String);
}

function buildMockProof(credentialType, input) {
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify({ credentialType, input }))
    .digest('hex');

  return {
    protocol: 'demo-groth16',
    curve: 'bn128',
    commitment: digest,
    pi_a: [digest.slice(0, 16), digest.slice(16, 32), '1'],
    pi_b: [
      [digest.slice(32, 48), digest.slice(48, 64)],
      [digest.slice(0, 16), digest.slice(16, 32)],
      ['1', '0'],
    ],
    pi_c: [digest.slice(8, 24), digest.slice(24, 40), '1'],
  };
}

async function loadSnarkjs() {
  try {
    return await import('snarkjs');
  } catch {
    return null;
  }
}

export function getCircuitArtifactsStatus() {
  return {
    wasm: fs.existsSync(wasmPath),
    zkey: fs.existsSync(zkeyPath),
    verificationKey: fs.existsSync(verificationKeyPath),
    ready: fs.existsSync(wasmPath) && fs.existsSync(zkeyPath) && fs.existsSync(verificationKeyPath),
  };
}

export function loadVerificationKey() {
  if (!fs.existsSync(verificationKeyPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(verificationKeyPath, 'utf8'));
}

export async function generateProof(credentialType, value1, value2 = 0) {
  const config = CREDENTIAL_CONFIGS[credentialType];
  if (!config) {
    throw new Error(`Unknown credential type: ${credentialType}`);
  }

  const input = buildInput(config, value1, value2);
  const { inRange, resultLabel } = computeResult(config, input.value1, input.value2);
  const verificationKey = loadVerificationKey();

  const baseResult = {
    credential_type: credentialType,
    label: config.label,
    in_range: inRange,
    result_label: resultLabel,
    publicSignals: buildPublicSignals(config),
    verificationKey,
  };

  if (!inRange) {
    return {
      ...baseResult,
      proof: null,
      verified: false,
      proof_mode: 'range-check-only',
      can_submit: false,
    };
  }

  const artifacts = getCircuitArtifactsStatus();
  const snarkjs = artifacts.ready ? await loadSnarkjs() : null;

  if (snarkjs && verificationKey) {
    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      const verified = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);

      return {
        ...baseResult,
        proof,
        publicSignals,
        verified,
        proof_mode: 'groth16',
        can_submit: verified,
      };
    } catch (error) {
      return {
        ...baseResult,
        proof: buildMockProof(credentialType, input),
        verified: true,
        proof_mode: 'demo-fallback',
        can_submit: false,
        warning: `Fell back to demo proof: ${error.message}`,
      };
    }
  }

  return {
    ...baseResult,
    proof: buildMockProof(credentialType, input),
    verified: true,
    proof_mode: 'demo',
    can_submit: false,
  };
}
