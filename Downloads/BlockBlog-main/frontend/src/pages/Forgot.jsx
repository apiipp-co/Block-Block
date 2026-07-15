import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import AuthShell from '../components/AuthShell';

// Two-step security-question recovery (backend: GET question, then POST answer).
export default function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const findQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { securityQuestion } = await api.getSecurityQuestion(email);
      setQuestion(securityQuestion);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Could not find that account');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.resetPassword({ email, securityAnswer: answer, newPassword });
      setNotice('Password reset successfully. Please log in.');
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell width={380}>
      <h1 style={{ fontSize: 22, marginBottom: 'var(--space-1)', fontWeight: 800 }}>Reset your password</h1>
      <p style={{ fontSize: 13, color: '#787c7e', marginBottom: 'var(--space-6)' }}>
        {step === 1 ? 'Enter your email to find your security question.' : 'Answer your saved security question to continue.'}
      </p>

      {step === 1 ? (
        <form onSubmit={findQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div><label className="bb-label">Email</label><input className="bb-field-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          {error && <p className="bb-error">{error}</p>}
          <button className="bb-pill-btn bb-pill-primary" style={{ width: '100%', borderRadius: 8, height: 42 }} type="submit" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
        </form>
      ) : (
        <form onSubmit={reset} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div><label className="bb-label">{question}</label><input className="bb-field-input" placeholder="Your answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required /></div>
          <div><label className="bb-label">New password</label><input className="bb-field-input" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required /></div>
          {error && <p className="bb-error">{error}</p>}
          {notice && <p style={{ color: '#2e7d32', fontSize: 13, margin: 0 }}>{notice}</p>}
          <button className="bb-pill-btn bb-pill-primary" style={{ width: '100%', borderRadius: 8, height: 42 }} type="submit" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</button>
        </form>
      )}

      <p style={{ marginTop: 'var(--space-4)', fontSize: 13 }}><a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Back to log in</a></p>
    </AuthShell>
  );
}
