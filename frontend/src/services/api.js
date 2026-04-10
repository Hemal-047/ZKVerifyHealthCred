const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('zkh_token');
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function register(email, password, name) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('zkh_token', data.token);
  localStorage.setItem('zkh_user', JSON.stringify({ email: data.email, name: data.name }));
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('zkh_token', data.token);
  localStorage.setItem('zkh_user', JSON.stringify({ email: data.email, name: data.name }));
  return data;
}

export function logout() {
  localStorage.removeItem('zkh_token');
  localStorage.removeItem('zkh_user');
}

export function getStoredUser() {
  const u = localStorage.getItem('zkh_user');
  return u ? JSON.parse(u) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function generateAllProofs(credentials, verifierId) {
  const res = await fetch(`${API_BASE}/api/proof/generate-all`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify({ credentials, verifier_id: verifierId || 'zkVerify Demo Verifier' }),
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
  const res = await fetch(`${API_BASE}/api/consent/history`, { headers: authHeaders() });
  return res.json();
}

export async function revokeConsent(consentId) {
  const res = await fetch(`${API_BASE}/api/consent/revoke/${consentId}`, {
    method: 'POST', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to revoke');
  return res.json();
}

// No threshold info exposed to frontend — backend determines pass/fail
export const CREDENTIAL_FIELDS = {
  blood_pressure: {
    label: 'Blood Pressure',
    icon: '\u{1FAC0}',
    fields: [
      { key: 'value1', label: 'Systolic (mmHg)', placeholder: '125' },
      { key: 'value2', label: 'Diastolic (mmHg)', placeholder: '82' },
    ],
  },
  blood_sugar: {
    label: 'Fasting Blood Sugar',
    icon: '\u{1FA78}',
    fields: [{ key: 'value1', label: 'Glucose (mg/dL)', placeholder: '92' }],
  },
  bmi: {
    label: 'BMI',
    icon: '\u2696\uFE0F',
    fields: [
      { key: 'height', label: 'Height (cm)', placeholder: '175' },
      { key: 'weight', label: 'Weight (kg)', placeholder: '72' },
    ],
  },
  cholesterol: {
    label: 'Total Cholesterol',
    icon: '\u{1F9EA}',
    fields: [{ key: 'value1', label: 'Total Cholesterol (mg/dL)', placeholder: '185' }],
  },
  report_recency: {
    label: 'Report Recency',
    icon: '\u{1F4C5}',
    fields: [{ key: 'date', label: 'Report Date', placeholder: '', type: 'date' }],
  },
};
