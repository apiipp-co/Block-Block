// Optimistic vote toggling that mirrors the backend's rules:
// liking clears any dislike (and vice-versa); a second tap removes the vote.

function has(arr, id) { return arr.some((u) => String(u) === String(id)); }
function without(arr, id) { return arr.filter((u) => String(u) !== String(id)); }

export function applyVote(post, userId, type) {
  const uid = String(userId);
  let likes = Array.isArray(post.likes) ? [...post.likes] : [];
  let dislikes = Array.isArray(post.dislikes) ? [...post.dislikes] : [];

  if (type === 'like') {
    if (has(likes, uid)) likes = without(likes, uid);
    else { likes.push(uid); dislikes = without(dislikes, uid); }
  } else {
    if (has(dislikes, uid)) dislikes = without(dislikes, uid);
    else { dislikes.push(uid); likes = without(likes, uid); }
  }
  return { ...post, likes, dislikes, likesCount: likes.length };
}

// Reconcile counts with the authoritative server response ({ likes, dislikes }).
export function reconcileCounts(post, res) {
  if (!res) return post;
  return { ...post, likesCount: res.likes };
}
