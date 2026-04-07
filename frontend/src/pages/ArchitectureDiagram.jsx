import React from 'react';

export default function ArchitectureDiagram() {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
          How zkHealthCred Works
        </h1>
        <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
          Zero-knowledge proofs let you prove health attributes without revealing actual values.
          Every verification is logged immutably on Algorand.
        </p>
      </div>

      {/* Flow diagram */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px 24px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 24px 0', textAlign: 'center' }}>
          Verification flow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>1</div>
            <div style={{ flex: 1, padding: '14px 18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>Patient enters health data</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>BP, blood sugar, BMI, cholesterol, report date — stays on your device</div>
            </div>
          </div>

          <div style={{ marginLeft: '18px', borderLeft: '2px dashed #d1d5db', height: '16px' }}></div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>2</div>
            <div style={{ flex: 1, padding: '14px 18px', background: '#fefce8', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontWeight: '600', color: '#92400e', fontSize: '14px' }}>ZK proof generated (gnark + AlgoPlonk)</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Circuit checks if values are within medical ranges — outputs only pass/fail, never actual values</div>
            </div>
          </div>

          <div style={{ marginLeft: '18px', borderLeft: '2px dashed #d1d5db', height: '16px' }}></div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>3</div>
            <div style={{ flex: 1, padding: '14px 18px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: '600', color: '#1e40af', fontSize: '14px' }}>Verified on Algorand blockchain</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Proof submitted to deployed verifier contract (App ID: 757273463) on TestNet</div>
            </div>
          </div>

          <div style={{ marginLeft: '18px', borderLeft: '2px dashed #d1d5db', height: '16px' }}></div>

          {/* Step 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>4</div>
            <div style={{ flex: 1, padding: '14px 18px', background: '#faf5ff', borderRadius: '10px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontWeight: '600', color: '#6b21a8', fontSize: '14px' }}>Consent logged on-chain</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Immutable record: who verified, what was checked, when — with real Algorand transaction ID</div>
            </div>
          </div>

          <div style={{ marginLeft: '18px', borderLeft: '2px dashed #d1d5db', height: '16px' }}></div>

          {/* Step 5 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>5</div>
            <div style={{ flex: 1, padding: '14px 18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>Verifier sees pass/fail only</div>
              <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>Insurance, employer, or any third party gets a shareable link — never sees actual health values</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
          Tech stack
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'ZK circuits', value: 'gnark (Go)', bg: '#fefce8', color: '#92400e', border: '#fde68a' },
            { label: 'ZK verifier', value: 'AlgoPlonk', bg: '#fefce8', color: '#92400e', border: '#fde68a' },
            { label: 'Blockchain', value: 'Algorand TestNet', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
            { label: 'Backend', value: 'Python / Flask', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
            { label: 'Frontend', value: 'React / Vite', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
            { label: 'Compliance', value: 'DPDP Act 2023', bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: '8px', background: item.bg, border: `1px solid ${item.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
              <div style={{ fontSize: '14px', color: item.color, fontWeight: '600', marginTop: '4px' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What data is shared vs hidden */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>
          What the verifier sees vs. what stays private
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: '600', color: '#166534', fontSize: '14px', marginBottom: '8px' }}>
              Verifier sees (public)
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
              <li>Blood pressure: Normal or Elevated</li>
              <li>Blood sugar: Normal or Outside Range</li>
              <li>BMI: Healthy or Outside Range</li>
              <li>Cholesterol: Desirable or Elevated</li>
              <li>Report: Recent or Expired</li>
              <li>Algorand transaction proof</li>
            </ul>
          </div>
          <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '14px', marginBottom: '8px' }}>
              Always hidden (private)
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
              <li>Actual BP reading (e.g., 125/82)</li>
              <li>Actual glucose level (e.g., 92)</li>
              <li>Height, weight, actual BMI</li>
              <li>Actual cholesterol number</li>
              <li>Exact report date</li>
              <li>Doctor name, hospital, any PII</li>
            </ul>
          </div>
        </div>
      </div>

      {/* DPDP compliance */}
      <div style={{ padding: '16px 20px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '12px', fontSize: '13px', color: '#92400e' }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>DPDP Act 2023 compliance</div>
        <div style={{ lineHeight: '1.8' }}>
          <strong>Section 4 — Data minimization:</strong> Only pass/fail status is shared, never raw health data.
          <br />
          <strong>Section 6 — Consent:</strong> Every verification requires explicit consent, logged immutably on Algorand.
          <br />
          <strong>Section 12 — Right to erasure:</strong> Users can revoke consent at any time, recorded on-chain.
        </div>
      </div>
    </div>
  );
}
