// Presentation helpers ported from the BlockBlog prototype so real backend
// posts render identically to the mocked ones.

// Fixed category taxonomy (PRD leaves it open; the prototype defines these six).
export const CATEGORIES = ['Tech', 'World', 'Business', 'Culture', 'Science', 'Sports'];

// Per-category hues so a post without an uploaded image still gets the
// prototype's colored gradient placeholder. Falls back to a stable hash.
const CATEGORY_HUE = {
  Tech: 265, World: 205, Business: 150, Culture: 20, Science: 190, Sports: 340,
};

function hashHue(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function hueFor(post) {
  if (post && CATEGORY_HUE[post.category] != null) return CATEGORY_HUE[post.category];
  return hashHue((post && (post.category || post.title)) || '');
}

export function gradientFor(hue) {
  return `linear-gradient(135deg, hsl(${hue} 62% 62%), hsl(${hue + 40} 55% 48%))`;
}

// Background style for a post's media box. Respects the creator's chosen
// display mode — "contain" shows the whole picture (letterboxed on a neutral
// backdrop), "cover" crops it to fill the frame. Falls back to the
// category gradient when there's no image, and to "cover" for older posts
// saved before imageFit existed.
export function mediaStyle(image, gradient, fit) {
  if (!image) {
    return { backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' };
  }
  const mode = fit === 'contain' ? 'contain' : 'cover';
  return {
    backgroundImage: `url("${image}")`,
    backgroundSize: mode,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: mode === 'contain' ? '#f6f7f8' : undefined,
  };
}

export function dateLabel(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function preview30(text = '') {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= 30 ? text : `${words.slice(0, 30).join(' ')}…`;
}

// First sentence-ish excerpt for feed cards (backend body is one string).
export function excerptOf(post) {
  if (post.excerpt) return post.excerpt;
  return preview30(post.body || '');
}

// Split a stored body string into paragraphs for the detail view.
export function paragraphsOf(body = '') {
  return body.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
}

export function initialsOf(nameOrEmail = '') {
  const s = String(nameOrEmail).trim();
  if (!s) return '?';
  if (s.includes('@')) return s[0].toUpperCase();
  const parts = s.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function displayName(user) {
  if (!user) return '';
  return user.name && user.name.trim() ? user.name : (user.email || '');
}
