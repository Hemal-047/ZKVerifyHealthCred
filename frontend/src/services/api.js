// zkHealthCred API Client
// Communicates with the Python Flask backend

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function generateAllProofs(credentials, userHash, verifierId) {
  const res = await fetch(`${API_BASE}/api/proof/generate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials,
      user_hash: userHash,
      verifier_id: verifierId || 'Demo Verifier',
    }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function getCredential(credentialId) {
  const res = await fetch(`${API_BASE}/api/credential/${credentialId}`);
  if (!res.ok) throw new Error('Credential not found');
  return res.json();
}

export async function getConsentHistory() {
  const res = await fetch(`${API_BASE}/api/consent/history`);
  return res.json();
}

export async function revokeConsent(consentId) {
  const res = await fetch(`${API_BASE}/api/consent/revoke/${consentId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to revoke');
  return res.json();
}

export const CREDENTIAL_TYPES = {
  blood_pressure: {
    label: 'Blood Pressure', icon: '\u{1FAC0}',
    fields: [
      { key: 'value1', label: 'Systolic', placeholder: '125' },
      { key: 'value2', label: 'Diastolic', placeholder: '82' },
    ],
    threshold: 'Systolic 60-140, Diastolic 40-90 mmHg',
  },
  blood_sugar: {
    label: 'Fasting Blood Sugar', icon: '\u{1FA78}',
    fields: [{ key: 'value1', label: 'Glucose (mg/dL)', placeholder: '92' }],
    threshold: '70-100 mg/dL',
  },
  bmi: {
    label: 'BMI', icon: '\u2696\uFE0F',
    fields: [
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
      { key: 'weight', label: 'Weight (kg)', placeholder: '72' },
    ],
    threshold: '18.5 - 24.9',
  },
  cholesterol: {
    label: 'Total Cholesterol', icon: '\u{1F9EA}',
    fields: [{ key: 'value1', label: 'Cholesterol (mg/dL)', placeholder: '185' }],
    threshold: '100-200 mg/dL',
  },
  report_recency: {
    label: 'Report Recency', icon: '\u{1F4C5}',
    fields: [{ key: 'date', label: 'Report Date', placeholder: '', type: 'date' }],
    threshold: 'Within last 90 days',
  },
};
