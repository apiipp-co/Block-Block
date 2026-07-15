import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORIES } from '../lib/format';
import ImageDrop from '../components/ImageDrop';

// Handles both creating a new post (/post) and editing an existing one
// (/edit/:id). The backend enforces author-only editing via JWT.
export default function PostCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState(null);
  const [imageFit, setImageFit] = useState('contain');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Prefill when editing.
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    api.getPost(id)
      .then((p) => {
        if (cancelled) return;
        setTitle(p.title || '');
        setCategory(CATEGORIES.includes(p.category) ? p.category : (p.category || CATEGORIES[0]));
        setImage(p.image || null);
        setImageFit(p.imageFit || 'contain');
        setBody(p.body || '');
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Could not load this post'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const onSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and article text are required.'); return; }
    setError('');
    setBusy(true);
    try {
      const payload = { title, category, image, imageFit, body, isAnonymous: true };
      if (isEdit) {
        await api.updatePost(id, payload);
        navigate(`/${id}`);
      } else {
        await api.createPost(payload);
        navigate('/user');
      }
    } catch (err) {
      setError(err.message || (isEdit ? 'Failed to save' : 'Failed to publish'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-6)', color: '#787c7e' }}>Loading…</div>;
  }

  return (
    <div className="bb-fade-in" style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 26, marginBottom: 'var(--space-1)', fontWeight: 800 }}>{isEdit ? 'Edit post' : 'Write a post'}</h1>
      <p style={{ fontSize: 13, color: '#787c7e', marginBottom: 'var(--space-6)' }}>Published anonymously — your account isn't shown publicly.</p>
      <div className="bb-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div><label className="bb-label">Title</label><input className="bb-field-input" placeholder="Give your post a title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
        <div>
          <label className="bb-label">Category</label>
          <select className="bb-field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="bb-label">Picture (optional)</label><ImageDrop value={image} onChange={setImage} fit={imageFit} onFitChange={setImageFit} /></div>
        <div><label className="bb-label">Article text</label><textarea className="bb-field-input" rows={10} placeholder="Write your article..." value={body} onChange={(e) => setBody(e.target.value)} /></div>
        {error && <p className="bb-error">{error}</p>}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button className="bb-pill-btn bb-pill-outline" style={{ borderRadius: 8 }} onClick={() => navigate(isEdit ? `/${id}` : '/')}>Cancel</button>
          <button className="bb-pill-btn bb-pill-primary" style={{ borderRadius: 8 }} onClick={onSubmit} disabled={busy}>{busy ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save changes' : 'Publish')}</button>
        </div>
      </div>
    </div>
  );
}
