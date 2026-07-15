import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, resolveImage } from '../api/client';
import { hueFor, gradientFor, mediaStyle } from '../lib/format';

// Saved reading list. Backend returns { id, title, image, excerpt(≤30 words), category }.
export default function Saved() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.savedPosts()
      .then((list) => { if (!cancelled) setItems(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bb-fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-8) var(--space-6) 80px', width: '100%', boxSizing: 'border-box' }}>
      <h1 style={{ fontSize: 24, marginBottom: 'var(--space-6)', fontWeight: 800 }}>Saved posts</h1>

      {loading && <div style={{ color: '#787c7e', fontSize: 14 }}>Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="bb-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#787c7e' }}>Nothing saved yet. Bookmark a post from the feed.</div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 'var(--space-4)' }}>
          {items.map((post) => {
            const image = resolveImage(post.image);
            const gradient = gradientFor(hueFor(post));
            return (
              <div key={post.id} className="bb-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(`/${post.id}`)}>
                {image && <div style={{ width: '100%', aspectRatio: '16 / 9', ...mediaStyle(image, gradient, post.imageFit) }} />}
                <div style={{ padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>{post.title}</div>
                  <p style={{ fontSize: 13, color: '#787c7e', margin: 0 }}>{post.excerpt}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
