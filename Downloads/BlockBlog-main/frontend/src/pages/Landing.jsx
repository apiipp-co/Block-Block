import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CATEGORIES } from '../lib/format';
import { applyVote, reconcileCounts } from '../lib/vote';
import PostCard from '../components/PostCard';
import { HomeIcon, PlusIcon, BookmarkIcon, EmailIcon } from '../components/icons';

const activePill = { background: '#7353ea', color: '#fff', borderColor: '#7353ea' };
const inactivePill = { background: '#fff', color: '#1a1a1b', borderColor: '#edeff1' };

export default function Landing() {
  const navigate = useNavigate();
  const { loggedIn, user, savedIds, toggleSaved } = useAuth();
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounced search value so we don't refetch on every keystroke.
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listPosts({
        search: debouncedQ,
        category: category === 'All' ? '' : category,
        sort: sortBy,
        limit: 30,
      });
      setPosts(data.posts || []);
    } catch (e) {
      setError(e.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category, sortBy]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  useEffect(() => {
    let cancelled = false;
    api.listPosts({ sort: 'likes', limit: 3 })
      .then((d) => { if (!cancelled) setTrending(d.posts || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const userId = user && (user.id || user._id);

  const openPost = useCallback((id, goLogin) => {
    if (goLogin) navigate('/login');
    else navigate(`/${id}`);
  }, [navigate]);

  const vote = useCallback(async (id, type) => {
    setPosts((prev) => prev.map((p) => ((p._id || p.id) === id ? applyVote(p, userId, type) : p)));
    try {
      const res = type === 'like' ? await api.toggleLike(id) : await api.toggleDislike(id);
      setPosts((prev) => prev.map((p) => ((p._id || p.id) === id ? reconcileCounts(p, res) : p)));
    } catch {
      fetchFeed();
    }
  }, [userId, fetchFeed]);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const feed = (
    <>
      {loading && <div style={{ padding: 'var(--space-8) 0', color: '#787c7e', fontSize: 14 }}>Loading posts…</div>}
      {error && !loading && (
        <div className="bb-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#c02b2b' }}>{error}</div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="bb-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#787c7e' }}>
          No posts match your search or filter.
        </div>
      )}
      {!loading && !error && posts.map((post) => (
        <PostCard
          key={post._id || post.id}
          post={post}
          userId={userId}
          savedSet={savedSet}
          loggedIn={loggedIn}
          onOpen={openPost}
          onLike={(id) => vote(id, 'like')}
          onDislike={(id) => vote(id, 'dislike')}
          onSave={(id) => toggleSaved(id)}
          onShare={() => {}}
        />
      ))}
    </>
  );

  if (!loggedIn) return <LandingOut navigate={navigate} feed={feed} />;

  return (
    <div className="bb-fade-in bb-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '250px minmax(0,1fr) 250px', gap: 'var(--space-6)' }}>
      {/* Left nav sidebar */}
      <div className="bb-leftcol" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button className="bb-navlink active"><HomeIcon /> Home</button>
        <button className="bb-navlink" onClick={() => navigate('/post')}><PlusIcon /> Start a post</button>
        <div style={{ height: 1, background: '#edeff1', margin: 'var(--space-3) 0' }} />
        <button className="bb-navlink" onClick={() => navigate('/saved-post')}><BookmarkIcon /> Saved posts</button>
      </div>

      {/* Center feed with toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', paddingBottom: 'var(--space-4)', borderBottom: '1px solid #edeff1', marginBottom: 'var(--space-2)' }}>
          <div style={{ flex: 1, minWidth: 160, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className="bb-pill-btn" style={{ ...(category === 'All' ? activePill : inactivePill), height: 32, fontSize: 13 }} onClick={() => setCategory('All')}>All</button>
            {CATEGORIES.map((cat) => (
              <button key={cat} className="bb-pill-btn" style={{ ...(cat === category ? activePill : inactivePill), height: 32, fontSize: 13 }} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
          <select className="bb-field-input" style={{ width: 'auto', height: 32, fontSize: 13 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="likes">Most liked</option>
          </select>
        </div>
        {feed}
      </div>

      {/* Right modules */}
      <div className="bb-rightcol" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="bb-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1b', marginBottom: 'var(--space-4)' }}>Popular categories</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} className="bb-tag" style={{ cursor: 'pointer', border: 0 }} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="bb-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1b', marginBottom: 'var(--space-4)' }}>Trending today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {trending.map((t, i) => (
              <div key={t._id} style={{ display: 'flex', gap: 'var(--space-3)', cursor: 'pointer' }} onClick={() => navigate(`/${t._id}`)}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: '#7353ea', flexShrink: 0 }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.35, color: '#1a1a1b', fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: '#787c7e', marginTop: 2 }}>{(t.likesCount ?? (t.likes ? t.likes.length : 0))} likes</div>
                </div>
              </div>
            ))}
            {trending.length === 0 && <div style={{ fontSize: 13, color: '#787c7e' }}>No posts yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingOut({ navigate, feed }) {
  return (
    <div className="bb-fade-in bb-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '280px minmax(0,1fr) 280px', gap: 'var(--space-8)' }}>
      <div className="bb-leftcol" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ padding: 'var(--space-2) 0' }}>
          <h1 style={{ fontSize: 26, lineHeight: 1.25, margin: '0 0 var(--space-6)', fontWeight: 800 }}>Join the most straightforward place to write online.</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button className="bb-pill-btn bb-pill-primary" style={{ justifyContent: 'flex-start', paddingLeft: 16 }} onClick={() => navigate('/login')}><EmailIcon size={15} /> Continue with Email</button>
          </div>
          <p style={{ fontSize: 12, color: '#787c7e', margin: 'var(--space-4) 0 0', lineHeight: 1.5 }}>By continuing, you agree to BlockBlog's User Agreement and acknowledge the Privacy Policy.</p>
          <p style={{ fontSize: 13, marginTop: 'var(--space-6)' }}>New here? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Create an account</a></p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#787c7e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 var(--space-2)' }}>Latest posts</h2>
        {feed}
      </div>

      <div className="bb-rightcol" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="bb-card" style={{ padding: 'var(--space-6)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a1b', marginBottom: 'var(--space-4)' }}>Popular categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {CATEGORIES.map((cat) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f1edfe', color: '#7353ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{cat.slice(0, 2).toUpperCase()}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1b' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
