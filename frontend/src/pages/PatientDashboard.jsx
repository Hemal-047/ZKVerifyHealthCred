import React, { useState } from 'react';
import { CREDENTIAL_TYPES, generateAllProofs } from '../services/api';

export default function PatientDashboard() {
  const [values, setValues] = useState({
    blood_pressure: { value1: '', value2: '' },
    blood_sugar: { value1: '' },
    bmi: { height: '', weight: '' },
    cholesterol: { value1: '' },
    report_recency: { date: new Date().toISOString().split('T')[0] },
  });
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateValue = (type, key, val) => {
    setValues(prev => ({ ...prev, [type]: { ...prev[type], [key]: val } }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setBundle(null);

    try {
      const credentials = Object.entries(values).map(([type, vals]) => ({
        type,
        ...Object.fromEntries(
          Object.entries(vals).map(([k, v]) => [k, k === 'date' ? v : Number(v)])
        ),
      }));

      const userHash = 'demo_user_' + Date.now();
      const result = await generateAllProofs(credentials, userHash, 'Demo Verifier');
      setBundle(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getBMIDisplay = () => {
    const h = Number(values.bmi.height);
    const w = Number(values.bmi.weight);
    if (h > 0 && w > 0) {
      return (w / ((h / 100) ** 2)).toFixed(1);
    }
    return '--';
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          Health Credential Dashboard
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Enter your health data below. Zero-knowledge proofs verify your values are within
          acceptable ranges without revealing the actual numbers to anyone.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(CREDENTIAL_TYPES).map(([type, config]) => {
          const resultForType = bundle?.results?.find(r => r.credential_type === type);

          return (
            <div key={type} style={{
              background: '#fff', borderRadius: '12px', padding: '20px',
              border: resultForType
                ? `2px solid ${resultForType.in_range ? '#22c55e' : '#ef4444'}`
                : '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>{config.icon}</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{config.label}</span>
                  {type === 'bmi' && values.bmi.height && values.bmi.weight && (
                    <span style={{ marginLeft: '12px', fontSize: '14px', color: '#6b7280' }}>
                      Calculated: {getBMIDisplay()}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                  {config.threshold}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {config.fields.map(field => (
                  <div key={field.key} style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'number'}
                      placeholder={field.placeholder}
                      value={values[type]?.[field.key] || ''}
                      onChange={e => updateValue(type, field.key, e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
                        borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </div>

              {resultForType && (
                <div style={{
                  marginTop: '12px', padding: '8px 12px', borderRadius: '6px',
                  background: resultForType.in_range ? '#f0fdf4' : '#fef2f2',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: resultForType.in_range ? '#166534' : '#991b1b', fontWeight: '500' }}>
                    {resultForType.in_range ? '\u2705' : '\u274C'} {resultForType.result_label}
                    {' '}— Verified via ZK Proof
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    Actual value: HIDDEN
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          background: loading ? '#9ca3af' : '#1d4ed8',
          color: '#fff', border: 'none', borderRadius: '10px',
          fontSize: '16px', fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating ZK Proofs & Logging on Algorand...' : 'Generate All ZK Proofs'}
      </button>

      {error && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#fef2f2', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
          Error: {error}. Make sure the backend is running (python api_server.py).
        </div>
      )}

      {bundle && (
        <div style={{
          marginTop: '16px', padding: '20px', borderRadius: '12px',
          background: bundle.all_passed ? '#f0fdf4' : '#fefce8',
          border: `1px solid ${bundle.all_passed ? '#bbf7d0' : '#fde68a'}`,
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '700', fontSize: '18px', color: bundle.all_passed ? '#166534' : '#92400e' }}>
            {bundle.all_passed ? '\u2705 All Credentials Verified!' : '\u26A0\uFE0F Some Credentials Failed'}
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>
            Credential ID: <strong>{bundle.credential_id}</strong>
          </p>
          {bundle.consent?.tx_id && (
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>
              Consent Tx:{' '}
              <a href={bundle.consent.explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                {bundle.consent.tx_id.substring(0, 12)}... (View on Algorand)
              </a>
            </p>
          )}
          {bundle.verifier_app_id > 0 && (
            <p style={{ margin: '0', fontSize: '14px', color: '#374151' }}>
              Verifier Contract:{' '}
              <a href={bundle.verifier_explorer_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>
                App ID {bundle.verifier_app_id} (View on Algorand)
              </a>
            </p>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            Share Credential ID "{bundle.credential_id}" with your verifier. They see pass/fail only — never your actual values.
          </p>
        </div>
      )}

      <div style={{
        marginTop: '24px', padding: '12px 16px', background: '#fefce8',
        border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e',
      }}>
        <strong>DPDP Act Compliant:</strong> Your actual health values never leave this page.
        Only zero-knowledge proofs (pass/fail) are sent to Algorand. You maintain full control
        and can revoke consent anytime from the Consent Log.
      </div>
    </div>
  );
}
