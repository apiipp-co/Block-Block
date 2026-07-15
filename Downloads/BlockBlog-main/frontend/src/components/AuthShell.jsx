import { useNavigate } from 'react-router-dom';

// Centered card used by the login / register / forgot screens (no page chrome).
export default function AuthShell({ width = 380, brand = false, children }) {
  const navigate = useNavigate();
  return (
    <div className="bb-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: '#fff' }}>
      <div className="bb-card" style={{ width, maxWidth: '100%', padding: 'var(--space-8)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {brand && (
          <button className="bb-btn-plain" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-6)' }} onClick={() => navigate('/')}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#7353ea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>B</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>BlockBlog</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
