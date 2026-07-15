# Basicly — Backend

Backend for **Basicly** (article posting platform), built from the spec:
Node.js + Express + MongoDB Atlas + JWT.

## 1. Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGO_URI` — your MongoDB Atlas connection string (create a free cluster at mongodb.com/atlas, add a database user, and whitelist your IP — same steps you already did for JunaScript).
- `JWT_SECRET` — any long random string.

Run it:
```bash
npm run dev     # with nodemon
npm start        # plain node
```

Server boots on `http://localhost:5000`. Health check: `GET /api/health`.

## 2. Data models

**User**: `name`, `email`, `password` (hashed), `securityQuestion`, `securityAnswer` (hashed), `savedPosts[]`.

**Post**: `title`, `image` (optional, single picture), `body`, `category`, `author` (ref User), `isAnonymous`, `likes[]`, `dislikes[]`, `comments[]` (embedded: `user`, `text`, timestamps).

## 3. API Routes

### Auth — `/api/auth`
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/register` | `name, email, password, securityQuestion, securityAnswer` | returns JWT |
| POST | `/login` | `email, password` | returns JWT |
| GET | `/forgot-password?email=` | — | step 1: returns the user's security question |
| POST | `/forgot-password` | `email, securityAnswer, newPassword` | step 2: verifies answer, sets new password |

### Posts — `/api/posts`
| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/?search=&category=&sort=latest\|oldest\|likes&page=&limit=` | optional | browse-post: scroll, search, filter, sort, pagination |
| GET | `/:id` | optional | `/{postingan}` — full article + comments |
| POST | `/upload-image` | required | multipart `image` field, single file, ≤5MB, returns `imageUrl` |
| POST | `/` | required | create post: `title, image, body, category, isAnonymous` |
| PUT | `/:id` | required (author) | edit post |
| DELETE | `/:id` | required (author) | delete post |
| POST | `/:id/comments` | required | `{ text }` |
| POST | `/:id/like` | required | toggles like, clears opposing dislike |
| POST | `/:id/dislike` | required | toggles dislike, clears opposing like |
| POST | `/:id/save` | required | toggles save for logged-in user |

### Users — `/api/users`
| Method | Route | Notes |
|---|---|---|
| GET | `/me` | account info |
| PUT | `/me` | update name |
| GET | `/me/posts` | posts the user has created |
| GET | `/me/saved` | `/Saved Post` — title, image, 30-word excerpt |

## 4. Auth header

All protected routes expect:
```
Authorization: Bearer <token>
```

## 5. Notes on spec decisions

- **Anonymous author**: `isAnonymous` flag on the post; API replaces `author` with `{ name: "Anonymous" }` in responses when set, while still storing the real author internally for edit/delete permissions.
- **Forgot password**: since the spec only listed `email/password` at register but a security question at login, `securityQuestion`/`securityAnswer` are captured at registration so the question exists to ask later — adjust your register form accordingly.
- **Likes/Dislikes**: implemented as toggle endpoints storing user IDs (prevents duplicate votes, easy to compute counts).
- **Image**: single optional picture per post, uploaded via `/api/posts/upload-image` (multipart) before creating/editing the post, or you can pass any external URL directly in `image`.

## 6. Next steps

- Frontend: React app consuming these routes (landing page, browse-post, /post, /User, /Saved Post, /{postingan}, /About-Us) — happy to scaffold this next.
- Categories are free-text right now; let me know if you want a fixed enum list.
