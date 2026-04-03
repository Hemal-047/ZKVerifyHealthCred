import React, { useState } from 'react';
import { getCredential } from '../services/api';

export default function VerifierDashboard() {
  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!credentialId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getCredential(credentialId.trim());
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Verify Health Credentials
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Enter a Credential ID to verify someone's health status. You will see pass/fail
          results only — actual health values are never revealed.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Enter Credential ID (e.g., HS-0001)"
          value={credentialId}
          onChange={e => setCredentialId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          style={{
            flex: 1, padding: '12px 16px', border: '1px solid #d1d5db',
            borderRadius: '8px', fontSize: '15px',
          }}
        />
        <button
          onClick={handleVerify}
          disabled={loading || !credentialId.trim()}
          style={{
            padding: '12px 24px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            opacity: loading || !credentialId.trim() ? 0.5 : 1,
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px', background: '#fef2f2', borderRadius: '8px',
          border: '1px solid #fecaca', color: '#991b1b', fontSize: '14px',
        }}>
          Credential "{credentialId}" not found. Make sure the patient has generated their credentials first.
        </div>
      )}

      {result && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: '600', color: '#166534', fontSize: '16px' }}>
              Credential {result.credential_id} — Verified
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
              Issued: {new Date(result.created_at).toLocaleString()} | Verifier: {result.verifier_id}
            </div>
          </div>

          {result.results?.map((r, i) => (
            <div key={i} style={{
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: i < result.results.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{ fontWeight: '500', color: '#111827' }}>{r.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}>
                  {r.verified ? '\u2705' : '\u274C'} {r.result_label}
                </span>
                <span style={{
                  fontSize: '12px', color: '#9ca3af', background: '#f3f4f6',
                  padding: '2px 8px', borderRadius: '4px',
                }}>
                  Actual value: HIDDEN (ZK Proof)
                </span>
              </div>
            </div>
          ))}

          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            {result.tx_id && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#374151' }}>
                Consent Tx:{' '}
                <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                  View on Algorand Explorer
                </a>
              </p>
            )}
            {result.verifier_app_id > 0 && (
              <p style={{ margin: '0', fontSize: '13px', color: '#374151' }}>
                Verifier Contract:{' '}
                <a href={result.verifier_explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                  App ID {result.verifier_app_id}
                </a>
              </p>
            )}
          </div>

          <div style={{ padding: '16px 20px', background: '#fefce8', fontSize: '13px', color: '#92400e' }}>
            <strong>DPDP Compliant:</strong> No personal health data was shared.
            Only pass/fail verification status confirmed via zero-knowledge proofs on Algorand.
          </div>
        </div>
      )}

      {!result && !error && (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#9ca3af',
          background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <p>Enter a Credential ID above to verify health credentials.</p>
          <p style={{ fontSize: '13px' }}>
            The patient generates credentials from the Patient Dashboard and shares the ID with you.
          </p>
        </div>
      )}
    </div>
  );
}
