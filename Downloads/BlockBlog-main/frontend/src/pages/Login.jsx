import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell width={380} brand>
      <h1 style={{ fontSize: 22, marginBottom: 'var(--space-1)', fontWeight: 800 }}>Log in</h1>
      <p style={{ fontSize: 13, color: '#787c7e', marginBottom: 'var(--space-6)' }}>Welcome back. Enter your details.</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div><label className="bb-label">Email</label><input className="bb-field-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="bb-label">Password</label><input className="bb-field-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <p className="bb-error">{error}</p>}
        <button className="bb-pill-btn bb-pill-primary" style={{ width: '100%', borderRadius: 8, height: 42 }} type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)', fontSize: 13 }}>
        <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Create account</a>
        <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>
      </div>
    </AuthShell>
  );
}
