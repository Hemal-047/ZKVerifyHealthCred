import React, { useState, useEffect } from 'react';
import { getConsentHistory, revokeConsent, CREDENTIAL_TYPES } from '../services/api';

export default function ConsentLog() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const fetchHistory = async () => {
    try {
      const data = await getConsentHistory();
      setConsents(data.history || []);
    } catch (e) {
      console.error('Failed to fetch consent history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleRevoke = async (consentId) => {
    setRevoking(consentId);
    try {
      await revokeConsent(consentId);
      await fetchHistory();
    } catch (e) {
      console.error('Failed to revoke:', e);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Consent History
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          View all verification consents you've granted. Revoke any consent at any time —
          the revocation is recorded immutably on Algorand.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          Loading consent history...
        </div>
      ) : consents.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#9ca3af',
          background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <p>No consent records yet.</p>
          <p style={{ fontSize: '13px' }}>
            Generate credentials from the Patient Dashboard to create your first consent record.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {consents.map(consent => (
            <div key={consent.consent_id} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: `1px solid ${consent.status === 'active' ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {consent.credential_id} — {consent.verifier_id}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                    {new Date(consent.created_at).toLocaleString()}
                  </div>
                </div>
                <span style={{
                  fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '9999px',
                  background: consent.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: consent.status === 'active' ? '#166534' : '#991b1b',
                }}>
                  {consent.status === 'active' ? '\u2705 Active' : '\u274C Revoked'}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                <strong>Credentials shared:</strong>{' '}
                {consent.credential_types?.map(t => CREDENTIAL_TYPES[t]?.label || t).join(', ')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {consent.tx_id && (
                    <a
                      href={consent.explorer_url}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#1d4ed8' }}
                    >
                      Consent Tx ↗
                    </a>
                  )}
                  {consent.revoke_tx_id && (
                    <a
                      href={`https://lora.algokit.io/testnet/transaction/${consent.revoke_tx_id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: '#991b1b' }}
                    >
                      Revocation Tx ↗
                    </a>
                  )}
                </div>

                {consent.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(consent.consent_id)}
                    disabled={revoking === consent.consent_id}
                    style={{
                      padding: '6px 14px', background: '#fee2e2', color: '#991b1b',
                      border: '1px solid #fecaca', borderRadius: '6px',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      opacity: revoking === consent.consent_id ? 0.5 : 1,
                    }}
                  >
                    {revoking === consent.consent_id ? 'Revoking...' : 'Revoke Consent'}
                  </button>
                )}

                {consent.status === 'revoked' && consent.revoked_at && (
                  <span style={{ fontSize: '12px', color: '#991b1b' }}>
                    Revoked: {new Date(consent.revoked_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '24px', padding: '12px 16px', background: '#fefce8',
        border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e',
      }}>
        <strong>DPDP Act Section 12 — Right to Erasure:</strong> You can revoke any consent at any time.
        Revocations are recorded immutably on Algorand TestNet. Once revoked, verifiers can no longer
        access your credential verification status.
      </div>
    </div>
  );
}
