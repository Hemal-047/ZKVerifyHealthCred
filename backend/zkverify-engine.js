import crypto from 'crypto';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getNetworkName() {
  return process.env.ZKVERIFY_NETWORK || 'Volta';
}

function getExplorerBaseUrl() {
  return process.env.ZKVERIFY_EXPLORER_URL || 'https://zkverify-explorer.zeeve.net/extrinsic';
}

function getMode() {
  if (process.env.ZKVERIFY_SEED_PHRASE) {
    return 'sdk';
  }
  if (process.env.ZKVERIFY_API_KEY) {
    return 'relayer';
  }
  return 'demo';
}

function normalizeSubmission(data, source) {
  const txHash =
    data?.txHash ||
    data?.extrinsicHash ||
    data?.transactionHash ||
    data?.result?.txHash ||
    data?.proofVerificationDetail?.txHash ||
    '';

  const attestationId =
    data?.attestationId ||
    data?.proofVerificationDetail?.attestationId ||
    data?.result?.attestationId ||
    '';

  return {
    source,
    txHash,
    attestationId,
    blockHash: data?.blockHash || data?.result?.blockHash || '',
    explorerUrl: txHash ? `${getExplorerBaseUrl()}/${txHash}` : '',
  };
}

function createLocalReceipt(kind, payload) {
  const digest = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return {
    source: 'local-ledger',
    txHash: `local-${kind}-${digest.slice(0, 18)}`,
    attestationId: '',
    blockHash: '',
    explorerUrl: '',
  };
}

async function submitWithSdk({ proof, publicSignals, verificationKey }) {
  const sdk = await import('zkverifyjs');
  const { zkVerifySession, Library, CurveType } = sdk;

  const builder = zkVerifySession.start();
  const sessionBuilder = getNetworkName().toLowerCase() === 'mainnet' ? builder.Mainnet() : builder.Volta();
  const session = await sessionBuilder.withAccount(process.env.ZKVERIFY_SEED_PHRASE);

  const { transactionResult } = await session
    .verify()
    .groth16({
      library: Library.snarkjs,
      curve: CurveType.bn128,
    })
    .execute({
      proofData: {
        vk: verificationKey,
        proof,
        publicSignals,
      },
    });

  const result = await transactionResult;
  return normalizeSubmission(result, 'sdk');
}

async function submitWithRelayer({ proof, publicSignals, verificationKey }) {
  const apiKey = process.env.ZKVERIFY_API_KEY;
  const apiUrl = process.env.ZKVERIFY_RELAYER_API_URL || 'https://relayer-api.horizenlabs.io/api/v1';

  const payload = {
    proofType: 'groth16',
    vkRegistered: false,
    proofOptions: {
      library: 'snarkjs',
      curve: 'bn128',
    },
    proofData: {
      proof,
      publicSignals,
      vk: verificationKey,
    },
  };

  const submitRes = await fetch(`${apiUrl}/submit-proof/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    throw new Error(`Relayer submit failed with status ${submitRes.status}`);
  }

  const submitData = await submitRes.json();
  const jobId = submitData.jobId || submitData.id;

  if (!jobId) {
    throw new Error('Relayer did not return a job ID');
  }

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await sleep(2000);

    const statusRes = await fetch(`${apiUrl}/job-status/${apiKey}/${jobId}`);
    if (!statusRes.ok) {
      throw new Error(`Relayer status failed with status ${statusRes.status}`);
    }

    const statusData = await statusRes.json();
    const status = String(statusData.status || '').toLowerCase();

    if (status === 'completed' || status === 'success' || status === 'verified') {
      return normalizeSubmission(statusData, 'relayer');
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(statusData.message || 'Relayer verification failed');
    }
  }

  throw new Error('Relayer timed out waiting for zkVerify attestation');
}

export function getIntegrationStatus() {
  const mode = getMode();
  return {
    mode,
    network: getNetworkName(),
    network_label: `zkVerify ${getNetworkName()}`,
    explorer_base_url: getExplorerBaseUrl(),
    sdk_configured: Boolean(process.env.ZKVERIFY_SEED_PHRASE),
    relayer_configured: Boolean(process.env.ZKVERIFY_API_KEY),
  };
}

export async function submitProofToZkVerify({ proof, publicSignals, verificationKey }) {
  const mode = getMode();
  if (!proof || !verificationKey) {
    return createLocalReceipt('proof', { publicSignals, mode });
  }

  if (mode === 'sdk') {
    return submitWithSdk({ proof, publicSignals, verificationKey });
  }

  if (mode === 'relayer') {
    return submitWithRelayer({ proof, publicSignals, verificationKey });
  }

  return createLocalReceipt('proof', { publicSignals, mode });
}

export function createConsentReceipt({ credentialId, verifierId, results, submissions }) {
  const primarySubmission = submissions.find((submission) => submission?.txHash);
  if (primarySubmission) {
    return primarySubmission;
  }
  return createLocalReceipt('consent', { credentialId, verifierId, results });
}

export function createRevocationReceipt({ credentialId, userHash, previousTxId }) {
  return createLocalReceipt('revoke', { credentialId, userHash, previousTxId });
}
