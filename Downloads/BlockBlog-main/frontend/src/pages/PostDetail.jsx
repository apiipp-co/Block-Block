import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, resolveImage } from '../api/client';
import { hueFor, gradientFor, dateLabel, paragraphsOf, initialsOf, mediaStyle } from '../lib/format';
import { applyVote, reconcileCounts } from '../lib/vote';
import { ArrowLeftIcon, UpvoteIcon, DownvoteIcon, BookmarkIcon, ShareIcon } from '../components/icons';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loggedIn, user, isSaved, toggleSaved } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [shareNote, setShareNote] = useState('');

  const userId = user && (user.id || user._id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getPost(id)
      .then((p) => { if (!cancelled) setPost(p); })
      .catch((e) => { if (!cancelled) setError(e.message || 'Post not found'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const vote = useCallback(async (type) => {
    if (!loggedIn) { navigate('/login'); return; }
    setPost((p) => applyVote(p, userId, type));
    try {
      const res = type === 'like' ? await api.toggleLike(id) : await api.toggleDislike(id);
      setPost((p) => reconcileCounts(p, res));
    } catch {
      api.getPost(id).then(setPost).catch(() => {});
    }
  }, [loggedIn, userId, id, navigate]);

  const onSave = () => { if (!loggedIn) { navigate('/login'); return; } toggleSaved(id); };

  const onShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); setShareNote('Link copied'); }
    catch { setShareNote(url); }
    setTimeout(() => setShareNote(''), 1800);
  };

  const addComment = async () => {
    if (!commentDraft.trim()) return;
    setPosting(true);
    try {
      const c = await api.addComment(id, commentDraft.trim());
      setPost((p) => ({ ...p, comments: [...(p.comments || []), c] }));
      setCommentDraft('');
    } catch (e) {
      setError(e.message || 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--space-6)', color: '#787c7e' }}>Loading…</div>;
  if (error || !post) return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      <div className="bb-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#787c7e' }}>{error || 'Post not found.'}</div>
    </div>
  );

  const likes = Array.isArray(post.likes) ? post.likes : [];
  const dislikes = Array.isArray(post.dislikes) ? post.dislikes : [];
  const liked = userId && likes.some((u) => String(u) === String(userId));
  const disliked = userId && dislikes.some((u) => String(u) === String(userId));
  const likeCount = typeof post.likesCount === 'number' ? post.likesCount : likes.length;
  const saved = isSaved(id);
  const image = resolveImage(post.image);
  const gradient = gradientFor(hueFor(post));
  const comments = post.comments || [];

  return (
    <div className="bb-fade-in" style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box' }}>
      <button className="bb-btn-plain" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#787c7e', marginBottom: 'var(--space-6)', fontWeight: 600 }} onClick={() => navigate('/')}>
        <ArrowLeftIcon size={14} /> Back to feed
      </button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-3)', alignItems: 'center' }}>
        <span className="bb-tag">{post.category || 'General'}</span>
        <span style={{ fontSize: 12.5, color: '#787c7e' }}>{dateLabel(post.createdAt)}</span>
      </div>

      <h1 style={{ fontSize: 32, lineHeight: 1.2, marginBottom: 'var(--space-4)', fontWeight: 800 }}>{post.title}</h1>

      {image && (
        <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 12, marginBottom: 'var(--space-6)', ...mediaStyle(image, gradient, post.imageFit) }} />
      )}

      <div style={{ fontSize: 16, lineHeight: 1.7, color: '#1a1a1b' }}>
        {paragraphsOf(post.body).map((para, i) => <p key={i} style={{ marginBottom: 'var(--space-4)' }}>{para}</p>)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-4) 0', borderTop: '1px solid #edeff1', borderBottom: '1px solid #edeff1', margin: 'var(--space-6) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f6f7f8', borderRadius: 999, height: 36, padding: '0 4px' }}>
          <button className={`bb-icon-btn ${liked ? 'on' : ''}`} style={{ width: 28, height: 28, color: 'inherit' }} onClick={() => vote('like')} aria-label="Upvote"><UpvoteIcon size={16} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1b', minWidth: 24, textAlign: 'center' }}>{likeCount}</span>
          <button className={`bb-icon-btn ${disliked ? 'on' : ''}`} style={{ width: 28, height: 28, color: 'inherit' }} onClick={() => vote('dislike')} aria-label="Downvote"><DownvoteIcon size={16} /></button>
        </div>
        <div style={{ flex: 1 }} />
        {shareNote && <span style={{ fontSize: 12, color: '#7353ea', fontWeight: 600 }}>{shareNote}</span>}
        <button className={`bb-icon-btn ${saved ? 'on' : ''}`} aria-label="Save" onClick={onSave}><BookmarkIcon size={17} /></button>
        <button className="bb-icon-btn" aria-label="Share" onClick={onShare}><ShareIcon size={17} /></button>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 'var(--space-4)', fontWeight: 800 }}>Comments ({comments.length})</h2>

      {loggedIn ? (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <input className="bb-field-input" style={{ flex: 1, borderRadius: 999 }} placeholder="Add a comment" value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }} />
          <button className="bb-pill-btn bb-pill-primary" onClick={addComment} disabled={posting}>Post</button>
        </div>
      ) : (
        <div className="bb-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 14, color: '#4a4a4b' }}>Log in to join the discussion.</span>
          <button className="bb-pill-btn bb-pill-outline" onClick={() => navigate('/login')}>Log in</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {comments.map((c) => {
          const name = (c.user && c.user.name) || 'User';
          return (
            <div key={c._id || `${name}-${c.text}`} style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1edfe', color: '#7353ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initialsOf(name)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 14, color: '#333' }}>{c.text}</div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && <div style={{ fontSize: 14, color: '#787c7e' }}>No comments yet.</div>}
      </div>
    </div>
  );
}
