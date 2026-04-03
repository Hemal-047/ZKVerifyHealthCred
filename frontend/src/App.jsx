import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { healthCheck } from './services/api';
import PatientDashboard from './pages/PatientDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import ConsentLog from './pages/ConsentLog';

function NavBar() {
  const location = useLocation();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    healthCheck().then(setStatus).catch(() => setStatus(null));
  }, []);

  const navItems = [
    { path: '/', label: 'Patient' },
    { path: '/verify', label: 'Verifier' },
    { path: '/consent', label: 'Consent Log' },
  ];

  return (
    <nav style={{
      borderBottom: '1px solid #e5e7eb', padding: '12px 24px', background: '#fff',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{'\u{1F6E1}\uFE0F'}</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>zkHealthCred</span>
          <span style={{
            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px',
            background: status ? '#dcfce7' : '#fee2e2',
            color: status ? '#166534' : '#991b1b',
          }}>
            {status ? 'TestNet Connected' : 'Backend Offline'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
                fontSize: '14px', fontWeight: '500',
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
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/verify" element={<VerifierDashboard />} />
            <Route path="/consent" element={<ConsentLog />} />
          </Routes>
        </main>
        <footer style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '12px' }}>
          zkHealthCred — AlgoBharat Hack Series 3.0 | Team PrivacyShield | DPDP & RegTech Track
          {' | '}
          <a href="https://github.com/Hemal-047/zkHealthCred" style={{ color: '#6b7280' }}>GitHub</a>
        </footer>
      </div>
    </Router>
  );
}
