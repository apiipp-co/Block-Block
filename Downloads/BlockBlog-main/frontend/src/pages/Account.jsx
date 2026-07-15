import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { initialsOf, displayName } from '../lib/format';
import { applyVote, reconcileCounts } from '../lib/vote';
import PostCard from '../components/PostCard';

export default function Account() {
  const navigate = useNavigate();
  const { user, setUser, savedIds, toggleSaved } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile-name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Per-post delete confirmation
  const [deletePending, setDeletePending] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const userId = user && (user.id || user._id);

  useEffect(() => {
    let cancelled = false;
    api.myPosts()
      .then((p) => { if (!cancelled) setPosts(Array.isArray(p) ? p : []); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const vote = useCallback(async (id, type) => {
    setPosts((prev) => prev.map((p) => ((p._id || p.id) === id ? applyVote(p, userId, type) : p)));
    try {
      const res = type === 'like' ? await api.toggleLike(id) : await api.toggleDislike(id);
      setPosts((prev) => prev.map((p) => ((p._id || p.id) === id ? reconcileCounts(p, res) : p)));
    } catch { /* ignore */ }
  }, [userId]);

  const startEditName = () => {
    setNameError('');
    setNameInput(user && user.name ? user.name : '');
    setEditingName(true);
  };

  const saveName = async () => {
    setSavingName(true);
    setNameError('');
    try {
      const updated = await api.updateMe({ name: nameInput.trim() });
      setUser((prev) => ({ ...prev, ...updated }));
      setEditingName(false);
    } catch (err) {
      setNameError(err.message || 'Could not save your name');
    } finally {
      setSavingName(false);
    }
  };

  const confirmDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.deletePost(id);
      setPosts((prev) => prev.filter((p) => (p._id || p.id) !== id));
      setDeletePending(null);
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const name = displayName(user);

  return (
    <div className="bb-fade-in" style={{ maxWidth: 820, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="bb-card" style={{ padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1edfe', color: '#7353ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{initialsOf(name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="bb-field-input"
                  style={{ maxWidth: 260, height: 36 }}
                  placeholder="Your display name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }}
                  maxLength={60}
                  autoFocus
                />
                <button className="bb-pill-btn bb-pill-primary" style={{ height: 36 }} onClick={saveName} disabled={savingName}>{savingName ? 'Saving…' : 'Save'}</button>
                <button className="bb-pill-btn bb-pill-outline" style={{ height: 36 }} onClick={() => setEditingName(false)}>Cancel</button>
              </div>
              {nameError && <span className="bb-error">{nameError}</span>}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 17, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'Your account'}</div>
                <button className="bb-btn-plain" style={{ fontSize: 12.5, color: '#7353ea', fontWeight: 700 }} onClick={startEditName}>Edit name</button>
              </div>
              <div style={{ fontSize: 13, color: '#787c7e' }}>{user && user.email}</div>
            </>
          )}
        </div>
        <button className="bb-pill-btn bb-pill-outline" style={{ flexShrink: 0 }} onClick={() => navigate('/saved-post')}>Saved posts</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 19, margin: 0, fontWeight: 800 }}>Your posts</h2>
        <button className="bb-pill-btn bb-pill-primary" onClick={() => navigate('/post')}>New post</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {loading && <div style={{ color: '#787c7e', fontSize: 14 }}>Loading…</div>}
        {!loading && posts.length === 0 && (
          <div className="bb-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#787c7e' }}>You haven't published any posts yet.</div>
        )}
        {!loading && posts.map((post) => {
          const id = post._id || post.id;
          return (
            <div key={id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 'var(--space-4)' }}>
                <div style={{ flex: 1 }} />
                {deletePending === id ? (
                  <>
                    <span style={{ fontSize: 13, color: '#787c7e' }}>Delete this post?</span>
                    <button className="bb-pill-btn" style={{ height: 30, fontSize: 13, background: '#c02b2b', color: '#fff' }} onClick={() => confirmDelete(id)} disabled={deletingId === id}>{deletingId === id ? 'Deleting…' : 'Delete'}</button>
                    <button className="bb-pill-btn bb-pill-outline" style={{ height: 30, fontSize: 13 }} onClick={() => setDeletePending(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="bb-pill" style={{ height: 30 }} onClick={() => navigate(`/edit/${id}`)}>Edit</button>
                    <button className="bb-pill" style={{ height: 30 }} onClick={() => setDeletePending(id)}>Delete</button>
                  </>
                )}
              </div>
              <PostCard
                post={post}
                userId={userId}
                savedSet={savedSet}
                loggedIn
                onOpen={(pid, goLogin) => (goLogin ? navigate('/login') : navigate(`/${pid}`))}
                onLike={(pid) => vote(pid, 'like')}
                onDislike={(pid) => vote(pid, 'dislike')}
                onSave={(pid) => toggleSaved(pid)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
