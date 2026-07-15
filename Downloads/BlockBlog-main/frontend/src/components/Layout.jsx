import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from './TopNav';

// Page chrome: sticky nav + content + footer. Search shows on the landing route.
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const showSearch = pathname === '/';

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1a1a1b', fontFamily: 'var(--font-body)', display: 'flex', flexDirection: 'column' }}>
      <TopNav showSearch={showSearch} />
      <div style={{ flex: 1 }}>{children}</div>
      <div style={{ borderTop: '1px solid #edeff1', padding: 'var(--space-4) var(--space-6)', display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', fontSize: 12, color: '#787c7e' }}>
        <a href="/about-us" onClick={(e) => { e.preventDefault(); navigate('/about-us'); }}>About us</a>
        <span>BlockBlog · a news &amp; blog prototype</span>
      </div>
    </div>
  );
}
