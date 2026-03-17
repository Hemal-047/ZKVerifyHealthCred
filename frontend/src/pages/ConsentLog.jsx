import React, { useState } from 'react';

// TODO: Implement full Consent Log
// Shows all consent history and allows revocation

export default function ConsentLog() {
  // Placeholder data — will be replaced with API calls
  const [consents, setConsents] = useState([
    {
      id: 'C-0001',
      credential_id: 'HS-0042',
      verifier_id: 'InsureCo (demo)',
      credential_types: ['Blood Pressure', 'Blood Sugar', 'BMI', 'Cholesterol', 'Report Date'],
      status: 'active',
      tx_id: 'PLACEHOLDER_TX_1',
      created_at: '2026-03-28T10:30:00Z',
    },
    {
      id: 'C-0002',
      credential_id: 'HS-0038',
      verifier_id: 'CorpWellness (demo)',
      credential_types: ['Blood Pressure', 'BMI'],
      status: 'revoked',
      tx_id: 'PLACEHOLDER_TX_2',
      created_at: '2026-03-25T14:15:00Z',
      revoked_at: '2026-03-26T09:00:00Z',
    },
  ]);

  const handleRevoke = (consentId) => {
    // TODO: Call revokeConsent API
    setConsents((prev) =>
      prev.map((c) =>
        c.id === consentId
          ? { ...c, status: 'revoked', revoked_at: new Date().toISOString() }
          : c
      )
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          📋 Consent History
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          View all verification consents you've granted. Revoke any consent at any time —
          the revocation is recorded immutably on Algorand.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {consents.map((consent) => (
          <div
            key={consent.id}
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: `1px solid ${consent.status === 'active' ? '#bbf7d0' : '#fecaca'}`,
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {consent.credential_id} — {consent.verifier_id}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  {new Date(consent.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: consent.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: consent.status === 'active' ? '#166534' : '#991b1b',
                }}
              >
                {consent.status === 'active' ? '✅ Active' : '❌ Revoked'}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              <strong>Credentials shared:</strong> {consent.credential_types.join(', ')}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={`https://lora.algokit.io/testnet/transaction/${consent.tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#1d4ed8' }}
              >
                View on Algorand Explorer ↗
              </a>
              {consent.status === 'active' && (
                <button
                  onClick={() => handleRevoke(consent.id)}
                  style={{
                    padding: '6px 14px',
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Revoke Consent
                </button>
              )}
              {consent.status === 'revoked' && consent.revoked_at && (
                <span style={{ fontSize: '12px', color: '#991b1b' }}>
                  Revoked on {new Date(consent.revoked_at).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {consents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          No consent records yet. Generate credentials from the Patient Dashboard to get started.
        </div>
      )}
    </div>
  );
}
