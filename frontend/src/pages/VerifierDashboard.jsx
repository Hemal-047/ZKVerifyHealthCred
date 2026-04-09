import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCredential } from '../services/api';

export default function VerifierDashboard() {
  const [searchParams] = useSearchParams();
  const [credentialId, setCredentialId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setCredentialId(idFromUrl);
      doVerify(idFromUrl);
    }
  }, [searchParams]);

  const doVerify = async (id) => {
    const target = id || credentialId.trim();
    if (!target) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getCredential(target);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isRevoked = result?.status === 'revoked';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Verify Health Credentials
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
          Enter a Credential ID shared by a patient, or use a verification link. You will see pass/fail status only — actual health values are never revealed.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Enter Credential ID (e.g., HS-0001)"
          value={credentialId}
          onChange={e => setCredentialId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doVerify()}
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px' }}
        />
        <button
          onClick={() => doVerify()}
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
        <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '14px' }}>
          Credential "{credentialId}" not found. Make sure the patient has generated their credentials first.
        </div>
      )}

      {/* REVOKED CREDENTIAL — ACCESS DENIED */}
      {result && isRevoked && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #ef4444', overflow: 'hidden' }}>
          <div style={{ padding: '24px', background: '#fef2f2', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{'\u{1F6AB}'}</div>
            <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '20px', marginBottom: '4px' }}>
              Access denied — consent revoked
            </div>
            <div style={{ fontSize: '14px', color: '#991b1b' }}>
              The patient has revoked consent for credential {result.credential_id}.
              <br />Health verification data is no longer accessible.
            </div>
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid #fecaca' }}>
            {result.results?.map((r, i) => (
              <div key={i} style={{
                padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < result.results.length - 1 ? '1px solid #f3f4f6' : 'none',
                opacity: 0.4,
              }}>
                <span style={{ fontWeight: '500', color: '#111827', fontSize: '15px' }}>{r.label}</span>
                <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', background: '#fee2e2', padding: '3px 10px', borderRadius: '4px' }}>
                  REVOKED
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #fecaca', fontSize: '13px' }}>
            <p style={{ margin: '0 0 4px 0', color: '#374151' }}>
              Original consent:{' '}
              <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                View on Algorand
              </a>
            </p>
            <p style={{ margin: '0', color: '#374151' }}>
              Revocation recorded on Algorand blockchain — this action is immutable.
            </p>
          </div>

          <div style={{ padding: '16px 20px', background: '#fef2f2', fontSize: '13px', color: '#991b1b' }}>
            <strong>DPDP Act Section 12 — Right to Erasure:</strong> The patient has exercised their right to revoke consent. Under the Digital Personal Data Protection Act 2023, this revocation is binding and the verifier must cease using any previously obtained verification data.
          </div>
        </div>
      )}

      {/* ACTIVE CREDENTIAL — SHOW RESULTS */}
      {result && !isRevoked && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #22c55e', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: '600', color: '#166534', fontSize: '16px' }}>
              {'\u2705'} Credential {result.credential_id} — verified on Algorand
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
              Issued: {new Date(result.created_at).toLocaleString()} | Consent: Active
            </div>
          </div>

          {result.results?.map((r, i) => (
            <div key={i} style={{
              padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: i < result.results.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <span style={{ fontWeight: '500', color: '#111827', fontSize: '15px' }}>{r.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: r.verified ? '#166534' : '#991b1b', fontWeight: '600' }}>
                  {r.verified ? '\u2705' : '\u274C'} {r.result_label}
                </span>
                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px' }}>
                  Actual value: HIDDEN (ZK Proof)
                </span>
              </div>
            </div>
          ))}

          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            {result.tx_id && (
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#374151' }}>
                Consent transaction:{' '}
                <a href={result.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                  View on Algorand Explorer
                </a>
              </p>
            )}
            {result.verifier_app_id > 0 && (
              <p style={{ margin: '0', fontSize: '13px', color: '#374151' }}>
                ZK verifier contract:{' '}
                <a href={result.verifier_explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                  App ID {result.verifier_app_id} on Algorand
                </a>
              </p>
            )}
          </div>

          <div style={{ padding: '16px 20px', background: '#fefce8', fontSize: '13px', color: '#92400e' }}>
            <strong>DPDP compliant verification:</strong> No personal health data was transmitted. Only zero-knowledge proof results (pass/fail) are recorded on the Algorand blockchain. The patient retains full control and can revoke this consent at any time.
          </div>
        </div>
      )}

      {!result && !error && (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#9ca3af',
          background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{'\u{1F50D}'}</div>
          <p style={{ margin: '0 0 8px 0' }}>Enter a Credential ID to verify health credentials.</p>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Patients generate credentials and share a verification link. You see pass/fail only — never actual values.
          </p>
        </div>
      )}
    </div>
  );
}
