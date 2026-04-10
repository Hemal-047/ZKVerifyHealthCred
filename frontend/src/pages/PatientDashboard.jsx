import React, { useState } from 'react';
import { CREDENTIAL_FIELDS, generateAllProofs } from '../services/api';
import { useAuth } from '../App';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [values, setValues] = useState({
    blood_pressure: { value1: '', value2: '' },
    blood_sugar: { value1: '' },
    bmi: { height: '', weight: '' },
    cholesterol: { value1: '' },
    report_recency: { date: '' },
  });
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateValue = (type, key, val) => {
    setValues(prev => ({ ...prev, [type]: { ...prev[type], [key]: val } }));
    // Clear old results when user changes any value
    if (bundle) setBundle(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setBundle(null);
    try {
      const credentials = Object.entries(values).map(([type, vals]) => ({
        type,
        ...Object.fromEntries(
          Object.entries(vals).map(([k, v]) => [k, k === 'date' ? v : Number(v) || 0])
        ),
      }));
      const result = await generateAllProofs(credentials);
      setBundle(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getBMI = () => {
    const h = Number(values.bmi.height);
    const w = Number(values.bmi.weight);
    if (h > 0 && w > 0) return (w / ((h / 100) ** 2)).toFixed(1);
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Welcome, {user?.name || 'User'}
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
          Enter your health data and generate zero-knowledge proofs. The backend verifies if values are within acceptable medical ranges — you only see pass/fail, and so does the verifier. Actual values are never shared.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(CREDENTIAL_FIELDS).map(([type, config]) => {
          const result = bundle?.results?.find(r => r.credential_type === type);
          return (
            <div key={type} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: result ? `2px solid ${result.in_range ? '#22c55e' : '#ef4444'}` : '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{config.icon}</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{config.label}</span>
                  {type === 'bmi' && getBMI() && (
                    <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
                      BMI: {getBMI()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {config.fields.map(field => (
                  <div key={field.key} style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>{field.label}</label>
                    <input
                      type={field.type || 'number'}
                      placeholder={field.placeholder}
                      value={values[type]?.[field.key] || ''}
                      onChange={e => updateValue(type, field.key, e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              {result && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
                  background: result.in_range ? '#f0fdf4' : '#fef2f2',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: result.in_range ? '#166534' : '#991b1b', fontWeight: '600', fontSize: '14px' }}>
                    {result.in_range ? '\u2705' : '\u274C'} {result.result_label} — ZK Verified
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                    Actual value: HIDDEN
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleGenerate} disabled={loading} style={{
        width: '100%', padding: '14px', background: loading ? '#9ca3af' : '#1d4ed8',
        color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Generating ZK Proofs & Logging on Algorand...' : 'Generate All ZK Proofs'}
      </button>

      {error && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
          Error: {error}
        </div>
      )}

      {bundle && (
        <div style={{
          marginTop: '16px', padding: '20px', borderRadius: '12px',
          background: bundle.all_passed ? '#f0fdf4' : '#fefce8',
          border: `1px solid ${bundle.all_passed ? '#bbf7d0' : '#fde68a'}`,
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '700', fontSize: '18px', color: bundle.all_passed ? '#166534' : '#92400e' }}>
            {bundle.all_passed ? '\u2705 All Credentials Verified!' : '\u26A0\uFE0F Some Credentials Outside Range'}
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>
            Credential ID: <strong>{bundle.credential_id}</strong>
          </p>
          {bundle.consent?.tx_id && (
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>
              Consent Tx:{' '}
              <a href={bundle.consent.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                {bundle.consent.tx_id.substring(0, 16)}... (View on Algorand)
              </a>
            </p>
          )}

          {/* Shareable link section */}
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Share with your verifier (insurance, employer, etc.):
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                readOnly
                value={`${window.location.origin}/verify?id=${bundle.credential_id}`}
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' }}
                onClick={e => { e.target.select(); navigator.clipboard?.writeText(e.target.value); }}
              />
              <button
                onClick={() => {
                  const url = `${window.location.origin}/verify?id=${bundle.credential_id}`;
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => {
                      window.prompt('Copy this link:', url);
                    });
                  } else {
                    window.prompt('Copy this link:', url);
                  }
                }}
                style={{ padding: '8px 14px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Copy Link
              </button>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Anyone with this link can verify your credentials — they will only see pass/fail status, never your actual values.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '12px 16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e' }}>
        <strong>DPDP Act Compliant:</strong> Your health values stay on this page. Only ZK proofs (pass/fail) are logged on Algorand. Revoke consent anytime from the Consent Log.
      </div>
    </div>
  );
}
