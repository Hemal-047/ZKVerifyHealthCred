import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PatientDashboard from './pages/PatientDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import ConsentLog from './pages/ConsentLog';

function NavBar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '🏥 Patient', description: 'Generate health credentials' },
    { path: '/verify', label: '🔍 Verifier', description: 'Verify credentials' },
    { path: '/consent', label: '📋 Consent Log', description: 'Manage consent' },
  ];

  return (
    <nav style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>PrivacyShield</span>
          <span style={{
            fontSize: '11px',
            background: '#dbeafe',
            color: '#1d4ed8',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontWeight: '600',
          }}>
            Algorand TestNet
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: location.pathname === item.path ? '#1d4ed8' : '#6b7280',
                background: location.pathname === item.path ? '#eff6ff' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <NavBar />
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/verify" element={<VerifierDashboard />} />
            <Route path="/consent" element={<ConsentLog />} />
          </Routes>
        </main>
        <footer style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>
          PrivacyShield — AlgoBharat Hack Series 3.0 | DPDP & RegTech Track |{' '}
          <a href="https://github.com/" style={{ color: '#6b7280' }}>GitHub ↗</a>
        </footer>
      </div>
    </Router>
  );
}
