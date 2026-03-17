import React, { useState } from 'react';

// TODO: Implement full Verifier Dashboard
// This is where verifiers (insurance, employers) check credential status

export default function VerifierDashboard() {
  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!credentialId.trim()) return;
    setLoading(true);

    // TODO: Call getCredential API
    setTimeout(() => {
      setResult({
        credential_id: credentialId,
        results: [
          { label: 'Blood Pressure', status: 'verified', icon: '🫀' },
          { label: 'Fasting Blood Sugar', status: 'verified', icon: '🩸' },
          { label: 'BMI', status: 'verified', icon: '⚖️' },
          { label: 'Total Cholesterol', status: 'verified', icon: '🧪' },
          { label: 'Report Recency', status: 'verified', icon: '📅' },
        ],
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          🔍 Verify Health Credentials
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Enter a Credential ID to verify someone's health status. You will see pass/fail
          results only — actual health values are never revealed.
        </p>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Enter Credential ID (e.g., HS-0042)"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {loading ? '⏳ Verifying...' : 'Verify'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontWeight: '600', color: '#166534' }}>
              ✅ Credential {result.credential_id} — All Verified
            </span>
          </div>
          {result.results.map((r, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: i < result.results.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              <div>
                <span style={{ marginRight: '8px' }}>{r.icon}</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>{r.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}>✅ Within Range</span>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  background: '#f3f4f6',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  🔒 Actual value: HIDDEN (ZK Proof)
                </span>
              </div>
            </div>
          ))}
          <div style={{ padding: '16px 20px', background: '#fefce8', fontSize: '13px', color: '#92400e' }}>
            ⚖️ <strong>DPDP Compliant:</strong> No personal health data was shared.
            Only pass/fail verification status confirmed via zero-knowledge proofs on Algorand.
          </div>
        </div>
      )}
    </div>
  );
}
