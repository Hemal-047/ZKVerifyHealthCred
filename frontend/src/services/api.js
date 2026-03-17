// PrivacyShield API Client
// Communicates with the Go backend for ZK proof generation and Algorand operations

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============ Proof Generation ============

export async function generateProof(credentialType, value1, value2 = 0) {
  const response = await fetch(`${API_BASE}/api/proof/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential_type: credentialType,
      value1: Number(value1),
      value2: Number(value2),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Proof generation failed');
  }

  return response.json();
}

export async function generateAllProofs(credentials, userHash, verifierId = '') {
  const response = await fetch(`${API_BASE}/api/proof/generate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials: credentials.map((c) => ({
        credential_type: c.type,
        value1: Number(c.value1),
        value2: Number(c.value2 || 0),
      })),
      user_hash: userHash,
      verifier_id: verifierId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Batch proof generation failed');
  }

  return response.json();
}

// ============ Credential Verification ============

export async function getCredential(credentialId) {
  const response = await fetch(`${API_BASE}/api/credential/${credentialId}`);

  if (!response.ok) {
    throw new Error('Credential not found');
  }

  return response.json();
}

// ============ Consent Management ============

export async function getConsentHistory(userHash) {
  const response = await fetch(`${API_BASE}/api/consent/history/${userHash}`);

  if (!response.ok) {
    throw new Error('Failed to fetch consent history');
  }

  return response.json();
}

export async function revokeConsent(consentId) {
  const response = await fetch(`${API_BASE}/api/consent/revoke/${consentId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to revoke consent');
  }

  return response.json();
}

// ============ Health Check ============

export async function healthCheck() {
  const response = await fetch(`${API_BASE}/api/health`);
  return response.json();
}

// ============ Credential Type Helpers ============

export const CREDENTIAL_TYPES = {
  blood_pressure: {
    label: 'Blood Pressure',
    icon: '🫀',
    unit: 'mmHg',
    fields: [
      { key: 'value1', label: 'Systolic', placeholder: '125' },
      { key: 'value2', label: 'Diastolic', placeholder: '82' },
    ],
    threshold: 'Systolic 60-140, Diastolic 40-90',
    passLabel: 'Normal',
    failLabel: 'Elevated',
  },
  blood_sugar: {
    label: 'Fasting Blood Sugar',
    icon: '🩸',
    unit: 'mg/dL',
    fields: [{ key: 'value1', label: 'Glucose Level', placeholder: '92' }],
    threshold: '70-100 mg/dL',
    passLabel: 'Normal',
    failLabel: 'Outside Range',
  },
  bmi: {
    label: 'BMI',
    icon: '⚖️',
    unit: '',
    fields: [
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
      { key: 'weight', label: 'Weight (kg)', placeholder: '72' },
    ],
    threshold: '18.5-24.9',
    passLabel: 'Healthy',
    failLabel: 'Outside Range',
    // BMI is calculated client-side, then value1 = BMI * 10
    computeValue1: (height, weight) => {
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      return Math.round(bmi * 10); // Scale by 10 for integer circuit
    },
    displayBMI: (height, weight) => {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
    },
  },
  cholesterol: {
    label: 'Total Cholesterol',
    icon: '🧪',
    unit: 'mg/dL',
    fields: [{ key: 'value1', label: 'Total Cholesterol', placeholder: '185' }],
    threshold: 'Below 200 mg/dL',
    passLabel: 'Desirable',
    failLabel: 'Elevated',
  },
  report_recency: {
    label: 'Report Recency',
    icon: '📅',
    unit: 'days',
    fields: [{ key: 'date', label: 'Report Date', placeholder: '2026-03-01', type: 'date' }],
    threshold: 'Within last 90 days',
    passLabel: 'Recent',
    failLabel: 'Expired',
    // Days since report calculated client-side
    computeValue1: (dateStr) => {
      const reportDate = new Date(dateStr);
      const now = new Date();
      const diffMs = now - reportDate;
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },
  },
};
