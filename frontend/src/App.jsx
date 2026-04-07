import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { healthCheck, isLoggedIn, getStoredUser, logout, login, register } from './services/api';
import PatientDashboard from './pages/PatientDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import ConsentLog from './pages/ConsentLog';
import ArchitectureDiagram from './pages/ArchitectureDiagram';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function LoginPage() {
  const { setUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isRegister ? await register(email, password, name) : await login(email, password);
      setUser({ email: result.email, name: result.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', width: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{'\u{1F6E1}\uFE0F'}</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>zkHealthCred</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>ZK Health Credentials on Algorand</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
          <button onClick={() => setIsRegister(false)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
            background: !isRegister ? '#fff' : 'transparent', color: !isRegister ? '#111827' : '#6b7280',
            boxShadow: !isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>Login</button>
          <button onClick={() => setIsRegister(true)} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
            background: isRegister ? '#fff' : 'transparent', color: isRegister ? '#111827' : '#6b7280',
            boxShadow: isRegister ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>Register</button>
        </div>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#374151', display: 'block', marginBottom: '4px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 4 characters" required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', color: '#991b1b', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>{loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
          Are you a verifier?{' '}
          <a href="/verify" style={{ color: '#1d4ed8' }}>Verify credentials without logging in</a>
        </p>
      </div>
    </div>
  );
}

function NavBar() {
  const location = useLocation();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => { healthCheck().then(setStatus).catch(() => setStatus(null)); }, []);

  const handleLogout = () => { logout(); setUser(null); };

  const navItems = [
    { path: '/', label: 'My Health' },
    { path: '/verify', label: 'Verify' },
    { path: '/consent', label: 'My Consents' },
    { path: '/how-it-works', label: 'How It Works' },
  ];

  return (
    <nav style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 24px', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>{'\u{1F6E1}\uFE0F'}</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>zkHealthCred</span>
          <span style={{
            fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px',
            background: status ? '#dcfce7' : '#fee2e2', color: status ? '#166534' : '#991b1b',
          }}>{status ? 'Algorand TestNet' : 'Offline'}</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500',
              color: location.pathname === item.path ? '#1d4ed8' : '#6b7280',
              background: location.pathname === item.path ? '#eff6ff' : 'transparent',
            }}>{item.label}</Link>
          ))}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{user.name}</span>
              <button onClick={handleLogout} style={{
                padding: '4px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px',
                fontSize: '12px', color: '#6b7280', cursor: 'pointer',
              }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
          {user && <NavBar />}
          {/* Show minimal nav for verifier page even without login */}
          {!user && <div style={{ display: 'none' }}></div>}
          <main style={{ maxWidth: '900px', margin: '0 auto', padding: user ? '24px' : '0' }}>
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
              <Route path="/" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
              {/* Verifier page is PUBLIC — no login required */}
              <Route path="/verify" element={
                user ? <VerifierDashboard /> : (
                  <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                      <span style={{ fontSize: '22px' }}>{'\u{1F6E1}\uFE0F'}</span>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>zkHealthCred</span>
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', background: '#dcfce7', color: '#166534' }}>Algorand TestNet</span>
                    </div>
                    <VerifierDashboard />
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <a href="/login" style={{ color: '#1d4ed8', fontSize: '14px' }}>Are you a patient? Login to manage your health credentials</a>
                    </div>
                  </div>
                )
              } />
              <Route path="/consent" element={<ProtectedRoute><ConsentLog /></ProtectedRoute>} />
              <Route path="/how-it-works" element={
                user ? <ArchitectureDiagram /> : (
                  <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                      <span style={{ fontSize: '22px' }}>{'\u{1F6E1}\uFE0F'}</span>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>zkHealthCred</span>
                    </div>
                    <ArchitectureDiagram />
                  </div>
                )
              } />
            </Routes>
          </main>
          {user && (
            <footer style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '12px' }}>
              zkHealthCred — AlgoBharat Hack Series 3.0 | Team PrivacyShield
            </footer>
          )}
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
