import React, { useState } from 'react';
import { CREDENTIAL_TYPES } from '../services/api';

// TODO: Implement full Patient Dashboard
// This is the primary screen — where users input health data and generate ZK proofs

export default function PatientDashboard() {
  const [credentials, setCredentials] = useState({
    blood_pressure: { value1: '', value2: '' },
    blood_sugar: { value1: '' },
    bmi: { height: '', weight: '' },
    cholesterol: { value1: '' },
    report_recency: { date: '' },
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateAll = async () => {
    setLoading(true);
    // TODO: Call generateAllProofs API
    // For now, simulate
    setTimeout(() => {
      setResults({
        credential_id: `HS-${String(Date.now()).slice(-4)}`,
        results: Object.keys(CREDENTIAL_TYPES).map((type) => ({
          credential_type: type,
          label: CREDENTIAL_TYPES[type].label,
          status: 'verified',
          tx_id: 'PLACEHOLDER_TX',
        })),
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          🏥 Health Credential Dashboard
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Enter your health data below. Zero-knowledge proofs will verify your values are within
          acceptable ranges — without revealing the actual numbers.
        </p>
      </div>

      {/* Credential Cards */}
      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(CREDENTIAL_TYPES).map(([type, config]) => (
          <div
            key={type}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '20px', marginRight: '8px' }}>{config.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{config.label}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>
                Range: {config.threshold}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {config.fields.map((field) => (
                <div key={field.key} style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'number'}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Show result if available */}
            {results && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#f0fdf4',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#166534', fontWeight: '500' }}>
                  ✅ Verified on Algorand
                </span>
                <a href="#" style={{ fontSize: '12px', color: '#1d4ed8' }}>
                  View Tx ↗
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateAll}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? '#9ca3af' : '#1d4ed8',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Generating ZK Proofs...' : '🛡️ Generate All ZK Proofs'}
      </button>

      {results && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#eff6ff',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1e40af' }}>
            Credential ID: {results.credential_id}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>
            Share this ID with your verifier. They will see pass/fail status only — never your actual values.
          </p>
        </div>
      )}

      {/* DPDP Notice */}
      <div style={{
        marginTop: '24px',
        padding: '12px 16px',
        background: '#fefce8',
        border: '1px solid #fde68a',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#92400e',
      }}>
        ⚖️ <strong>DPDP Act Compliant:</strong> Your actual health values never leave this page.
        Only zero-knowledge proofs (pass/fail) are sent to Algorand. You maintain full control
        and can revoke consent anytime.
      </div>
    </div>
  );
}
