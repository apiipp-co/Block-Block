import { resolveImage } from '../api/client';
import { hueFor, gradientFor, dateLabel, excerptOf, mediaStyle } from '../lib/format';
import { UpvoteIcon, DownvoteIcon, CommentIcon, ShareIcon, BookmarkIcon } from './icons';

// Feed card — a faithful port of PostCard.dc.html.
// `post` is a raw backend post; interaction state is derived from userId/savedSet.
export default function PostCard({ post, userId, savedSet, loggedIn, onOpen, onLike, onDislike, onSave, onShare }) {
  const id = post._id || post.id;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const dislikes = Array.isArray(post.dislikes) ? post.dislikes : [];
  const liked = userId && likes.some((u) => String(u) === String(userId));
  const disliked = userId && dislikes.some((u) => String(u) === String(userId));
  const saved = savedSet ? savedSet.has(String(id)) : false;
  const likeCount = typeof post.likesCount === 'number' ? post.likesCount : likes.length;
  const commentCount = Array.isArray(post.comments) ? post.comments.length : (post.commentCount || 0);
  const gradient = gradientFor(hueFor(post));
  const image = resolveImage(post.image);
  const interactiveClass = loggedIn ? '' : 'muted';

  const guard = (fn) => (e) => {
    e.stopPropagation();
    if (!loggedIn) { onOpen && onOpen(id, true); return; } // route to login when logged out
    fn && fn(id);
  };

  return (
    <div style={{ padding: 'var(--space-5) 0', borderBottom: '1px solid #edeff1', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: gradient, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a1a1b' }}>{post.category || 'General'}</span>
        <span style={{ fontSize: 12, color: '#787c7e' }}>· {dateLabel(post.createdAt || post.date)}</span>
      </div>

      <div className="bb-card-title" style={{ fontSize: 19, fontWeight: 700, color: '#1a1a1b', cursor: 'pointer', lineHeight: 1.3 }} onClick={() => onOpen && onOpen(id)}>
        {post.title}
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.5, color: '#4a4a4b', margin: 0 }}>{excerptOf(post)}</p>

      {image && (
        <div
          onClick={() => onOpen && onOpen(id)}
          style={{
            width: '100%', maxWidth: 560, aspectRatio: '16 / 10', borderRadius: 12,
            ...mediaStyle(image, gradient, post.imageFit),
            cursor: 'pointer', marginTop: 2,
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f6f7f8', borderRadius: 999, height: 32, padding: '0 4px', flexShrink: 0 }}>
          <button className={`bb-vote-btn ${liked ? 'on' : ''} ${interactiveClass}`} onClick={guard(onLike)} aria-label="Upvote">
            <UpvoteIcon size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1b', minWidth: 20, textAlign: 'center' }}>{likeCount}</span>
          <button className={`bb-vote-btn ${disliked ? 'on' : ''} ${interactiveClass}`} onClick={guard(onDislike)} aria-label="Downvote">
            <DownvoteIcon size={16} />
          </button>
        </div>

        <button className="bb-pill" style={{ flexShrink: 0 }} onClick={() => onOpen && onOpen(id)}>
          <CommentIcon size={15} /> {commentCount}
        </button>

        <button className="bb-pill" style={{ flexShrink: 0 }} aria-label="Share" onClick={(e) => { e.stopPropagation(); onShare && onShare(id); }}>
          <ShareIcon size={15} /> Share
        </button>

        {loggedIn && <div style={{ flex: 1 }} />}

        <button className={`bb-vote-btn ${saved ? 'on' : ''} ${interactiveClass}`} style={{ flexShrink: 0 }} onClick={guard(onSave)} aria-label="Save">
          <BookmarkIcon size={16} />
        </button>

        {!loggedIn && <span style={{ fontSize: 12, color: '#9a9a9b', whiteSpace: 'nowrap', flexShrink: 0 }}>Log in to interact</span>}
      </div>
    </div>
  );
}
