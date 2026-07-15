# BlockBlog

A Reddit-style anonymous news/blog platform. Publish and browse articles, save
posts for later, and engage through comments and likes/dislikes — no public
author identity required.

This is a monorepo: an Express/MongoDB API and a React frontend, developed
and run independently.

```
blockblog/
├── backend/    Express + MongoDB Atlas + JWT API
└── frontend/   React (Vite) client
```

Each folder has its own `README.md` with full details — routes, data models,
component structure. This file covers running both together.

## Stack

| | |
|---|---|
| Database | MongoDB Atlas |
| Backend | Express.js, JWT auth |
| Frontend | React 19 + Vite, react-router-dom |

## Quick start

Requires Node.js and a MongoDB Atlas connection string.

```bash
git clone https://github.com/ambush-coder/blockblog-backend.git blockblog
cd blockblog
```

**1. Backend** — `backend/`

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev             # http://localhost:5001 (see note below)
```

**2. Frontend** — `frontend/` (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env    # point VITE_API_URL at the backend above
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`.

## Environment variables

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signing secret for auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Frontend origin, for CORS (must match where Vite actually runs) |

**`frontend/.env`**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5001/api` |

Both `.env` files are gitignored — never committed.

## Known gotcha: port 5000

`backend/.env.example` defaults to `PORT=5000`, but on macOS this port is
often already claimed by **AirPlay Receiver** (Control Center), which causes
`EADDRINUSE` on startup with no other error. If the backend won't bind:

- turn off AirPlay Receiver (System Settings → General → AirDrop & Handoff), **or**
- run the backend on a different port (e.g. `PORT=5001`) and update
  `VITE_API_URL` in `frontend/.env` to match.

Whatever port the backend runs on, `CLIENT_URL` in `backend/.env` must equal
the frontend's actual origin (`http://localhost:5173` by default) or the API
will reject requests via CORS.

## Notes

- **Anonymous authorship**: posts are created with `isAnonymous: true`; the
  API replaces the author with `{ name: "Anonymous" }` in public responses,
  while still tracking the real author internally for edit/delete rights.
- **Categories**: fixed taxonomy — Tech, World, Business, Culture, Science,
  Sports — used for filtering and post creation.
- See [`backend/README.md`](backend/README.md) for the full API route table
  and data models, and [`frontend/README.md`](frontend/README.md) for the
  page/route map and component structure.
