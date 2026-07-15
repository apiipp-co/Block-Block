import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, PlusIcon, UserIcon, LogoutIcon } from './icons';

// Sticky top navigation. Search is shown only on the landing route and is
// bound to the ?q= URL param so it stays shareable and in sync with the feed.
export default function TopNav({ showSearch = false }) {
  const navigate = useNavigate();
  const { loggedIn, logout } = useAuth();
  const [params, setParams] = useSearchParams();

  const onSearchChange = (e) => {
    const next = new URLSearchParams(params);
    if (e.target.value) next.set('q', e.target.value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const onLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid #edeff1' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-6)', height: 64 }}>
        <button
          className="bb-btn-plain"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19, color: '#1a1a1b' }}
          onClick={() => navigate('/')}
        >
          <span style={{ width: 28, height: 28, borderRadius: 8, background: '#7353ea', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff' }}>B</span>
          BlockBlog
        </button>

        {showSearch && (
          <div style={{ flex: 1, maxWidth: 600, position: 'relative' }}>
            <SearchIcon stroke="#787c7e" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="bb-input"
              placeholder="Find anything"
              value={params.get('q') || ''}
              onChange={onSearchChange}
              style={{ paddingLeft: 36 }}
            />
          </div>
        )}

        <div style={{ flex: 1 }} />

        {loggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className="bb-pill-btn bb-pill-primary" onClick={() => navigate('/post')}>
              <PlusIcon size={14} /> Post
            </button>
            <button className="bb-icon-btn" aria-label="Account" onClick={() => navigate('/user')}>
              <UserIcon size={18} />
            </button>
            <button className="bb-icon-btn" aria-label="Log out" onClick={onLogout}>
              <LogoutIcon size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button className="bb-pill-btn bb-pill-outline" onClick={() => navigate('/register')}>Sign Up</button>
            <button className="bb-pill-btn bb-pill-primary" onClick={() => navigate('/login')}>Log In</button>
          </div>
        )}
      </div>
    </div>
  );
}
