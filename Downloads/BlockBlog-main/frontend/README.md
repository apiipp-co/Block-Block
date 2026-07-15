# BlockBlog — Frontend

React (Vite) frontend for **BlockBlog**, a Reddit-style anonymous news/blog platform.
Implements the `BlockBlog.dc.html` design handoff against the existing
[blockblog-backend](https://github.com/ambush-coder/blockblog-backend) (Express + MongoDB Atlas + JWT).

## Stack

- React 19 + Vite
- react-router-dom v6 for the routes below
- Plain CSS design tokens (light theme, `#7353ea` accent) — no UI framework
- JWT auth stored client-side; all API calls go through `src/api/client.js`

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev            # http://localhost:5173
```

`VITE_API_URL` defaults to `http://localhost:5000/api` (the backend's default port).
Run the backend separately per its README (needs `MONGO_URI` + `JWT_SECRET`, and
seed data for the feed to show content).

## Routes (PRD §6)

| Route | Screen |
|---|---|
| `/` | Landing — logged-out conversion panel **or** logged-in feed (search / filter / sort) |
| `/login`, `/register`, `/forgot-password` | Auth (security-question recovery) |
| `/post` | Create a post (title, category, optional image, body) — auth required |
| `/user` | Account + your published posts — auth required |
| `/saved-post` | Saved reading list (≤30-word previews) — auth required |
| `/:id` | Post detail — article, like/dislike, save, share, comments |
| `/about-us` | Static about page |

## Structure

```
src/
├── api/client.js          # fetch wrapper + endpoint map, token + image URL resolution
├── context/AuthContext.jsx # session + saved-post state, shared app-wide
├── lib/                   # format helpers (gradients, dates, excerpts) + optimistic vote logic
├── components/            # TopNav, Layout, PostCard, ImageDrop, AuthShell, icons, RequireAuth
├── pages/                 # one file per screen above
└── styles/global.css      # design tokens + bb-* component classes from the prototype
```

## Notes on design decisions

- **Categories**: the PRD leaves the taxonomy open; the prototype defines six
  (Tech, World, Business, Culture, Science, Sports), used for filters and the
  create form. See `src/lib/format.js`.
- **Anonymous authorship**: posts are created with `isAnonymous: true` (PRD §6.2);
  the backend hides the author in public responses.
- **Image placeholders**: posts without an uploaded image get the prototype's
  category-hued gradient block; uploaded images render via `/api/posts/upload-image`.
- **Social buttons** on the logged-out landing (Google/Apple/Email) are visual
  entry points that route to sign-in — no OAuth is wired (out of scope, PRD §11).
