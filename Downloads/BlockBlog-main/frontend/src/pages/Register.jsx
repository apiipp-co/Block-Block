import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const SECURITY_QUESTIONS = [
  'What city were you born in?',
  "What was your first pet's name?",
  "What is your mother's maiden name?",
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell width={400} brand>
      <h1 style={{ fontSize: 22, marginBottom: 'var(--space-1)', fontWeight: 800 }}>Create your account</h1>
      <p style={{ fontSize: 13, color: '#787c7e', marginBottom: 'var(--space-6)' }}>Posts are published anonymously — no public byline.</p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div><label className="bb-label">Email</label><input className="bb-field-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required /></div>
        <div><label className="bb-label">Password</label><input className="bb-field-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} minLength={6} required /></div>
        <div>
          <label className="bb-label">Security question</label>
          <select className="bb-field-input" value={form.securityQuestion} onChange={set('securityQuestion')}>
            {SECURITY_QUESTIONS.map((qn) => <option key={qn}>{qn}</option>)}
          </select>
        </div>
        <div><label className="bb-label">Answer</label><input className="bb-field-input" placeholder="Your answer" value={form.securityAnswer} onChange={set('securityAnswer')} required /></div>
        {error && <p className="bb-error">{error}</p>}
        <button className="bb-pill-btn bb-pill-primary" style={{ width: '100%', borderRadius: 8, height: 42 }} type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p style={{ marginTop: 'var(--space-4)', fontSize: 13 }}>Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Log in</a></p>
    </AuthShell>
  );
}
