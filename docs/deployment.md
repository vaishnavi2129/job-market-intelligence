# Deploying the project (free tier)

Two pieces to deploy: the **backend** (Node/Express API + SQLite DB) and
the **frontend** (React static site). Recommended free combo:
**Render** for the backend, **Vercel** for the frontend.

## 1. Push the project to GitHub first

See `docs/github_setup.md` if you haven't done this yet — Render and
Vercel both deploy by connecting to a GitHub repo.

## 2. Deploy the backend on Render

1. Go to https://render.com → sign up/log in (GitHub login is easiest)
2. **New +** → **Web Service** → connect your `job-market-intelligence` repo
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance type**: Free
4. Under **Environment Variables**, add (optional, for the AI feature):
   - `ANTHROPIC_API_KEY` = your key
5. Click **Create Web Service**. Render will build and deploy — you'll get
   a URL like `https://job-market-intelligence-backend.onrender.com`

**Important**: `data-pipeline/job_market.db` must be committed to the repo
(it already is, per `.gitignore` — only `.env` and `node_modules` are
excluded) since Render reads it directly. The backend doesn't need Python
running on the server; the DB file is already built.

Free-tier note: Render's free web services sleep after 15 minutes of
inactivity and take ~30-50 seconds to wake on the next request — normal
for a portfolio demo, just mention it if a recruiter says "it's slow to load".

## 3. Deploy the frontend on Vercel

1. Go to https://vercel.com → sign up/log in with GitHub
2. **Add New** → **Project** → import the same repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = your Render backend URL from step 2 (no trailing slash), e.g. `https://job-market-intelligence-backend.onrender.com`
5. Click **Deploy**. You'll get a live URL like `https://job-market-intelligence.vercel.app`

## 4. Verify

Open the Vercel URL — the dashboard should load data from your Render
backend. If charts show "Failed to load", double-check `VITE_API_URL` has
no trailing slash and that the Render service is awake (open its URL
directly first to "wake" it if it's been idle).

## 5. Put it on your resume

```
Job Market Intelligence Platform — github.com/<you>/job-market-intelligence
Live: https://job-market-intelligence.vercel.app
```
