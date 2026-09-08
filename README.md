# Job Market Intelligence Platform

An end-to-end data analytics project: ingestion → cleaning → SQL storage →
analysis → REST API → interactive React dashboard. Built to demonstrate
the full data-analyst-to-data-engineer workflow, not just a static chart.

## Architecture

```
data-pipeline/          Python: generate → clean → extract skills → load
    generate_data.py       creates raw_job_postings.csv (see note below)
    load_to_db.py           cleans + normalizes into job_market.db (SQLite)
    schema.sql              jobs / skills / job_skills tables
    analysis_queries.sql    the 6 core business questions, in plain SQL

backend/                Node.js + Express REST API reading from job_market.db
    server.js
    routes/analytics.js     one endpoint per analysis query + skill-gap tool
    routes/usage.js          usage tracking + plan upgrade (3 free checks, then paywall)
    db/usage.js               separate writable SQLite DB for per-device usage/plan

frontend/                React + Recharts dashboard, calls the API
    src/App.jsx
    src/components/          TrendingSkills, MonthlyVolume, RoleLeaderboard, SalaryBands, SkillsByLocation, SkillCooccurrence, SkillGapTool, PricingModalj

docs/
    genai_integration.md     how the real Claude API call works & how to enable it
    deployment.md             deploy backend on Render + frontend on Vercel
    github_setup.md           push this project to GitHub
    payments_integration.md   connect real Stripe/Razorpay billing (demo upgrade flow is built in)
```

## A note on the data

Live scraping of LinkedIn/Naukri/Indeed needs portal-specific API access
and (for scraping) careful ToS compliance, which isn't available in every
dev environment. `generate_data.py` produces a **statistically realistic
synthetic dataset** (1,400 postings, 10 roles, 10 locations, 6 months of
dates, with deliberately trending/declining skills) so the rest of the
pipeline — cleaning, SQL, API, dashboard — is 100% real and functional
out of the box.

**To go live:** swap `generate_data.py`'s output for real data from the
LinkedIn/Naukri API or a compliant scraper, writing to the same CSV
columns. Nothing downstream needs to change — that's the point of having
a clean pipeline boundary.

## Setup & run

### 1. Build the data pipeline
```bash
cd data-pipeline
python3 generate_data.py    # -> raw_job_postings.csv
python3 load_to_db.py       # -> job_market.db (SQLite)
```

### 2. Start the backend
```bash
cd backend
npm install
npm start                   # http://localhost:5000
```

Test it:
```bash
curl http://localhost:5000/api/analytics/trending-skills
```

### 3. Enable the AI skill-gap recommendation (optional)
The skill-gap tool works out of the box with a rule-based (non-AI) gap
list. To get an AI-written learning plan instead:
```bash
cd backend
cp .env.example .env
# edit .env and paste your key from https://console.anthropic.com/settings/keys
```
Restart the backend (`npm start`) — the skill-gap tool will now call
`claude-sonnet-5` and return a short prioritized learning plan alongside
the data-backed skill list. Without a key, everything else in the app
still works exactly the same.

### 4. Start the frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend dev server proxies `/api/*` to `http://localhost:5000`
(see `vite.config.js`), so both must be running.

## API reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/analytics/trending-skills` | GET | Fastest-growing skills, last 30 vs prior 30 days |
| `/api/analytics/salary-bands?role=X` | GET | Avg/min/max salary by role & experience band |
| `/api/analytics/skills-by-location` | GET | Top 5 skills per location |
| `/api/analytics/skill-cooccurrence?skill=X` | GET | Skills that most often appear alongside skill X (self-join) |
| `/api/analytics/monthly-volume` | GET | Posting volume trend over time |
| `/api/analytics/role-salary-leaderboard` | GET | Avg salary ranked by role |
| `/api/analytics/roles` | GET | Distinct role list |
| `/api/analytics/skill-gap` | POST | `{role, knownSkills, deviceId}` → gap analysis + AI plan/roadmap (free plan: 3 checks, then 403) |
| `/api/usage/:deviceId` | GET | Current plan, checks used, remaining |
| `/api/usage/upgrade` | POST | `{deviceId, plan}` → switch plan (demo — see `docs/payments_integration.md` for real billing) |

## Technical Highlights

Most portfolio "data analyst" projects stop at a static chart on a CSV.
This one shows the full chain a working analyst/analytics-engineer is
actually expected to reason about:

- **Data modeling**: normalized schema (jobs / skills / many-to-many join table), not a flat sheet
- **Real SQL**: window functions (`RANK() OVER PARTITION BY`), CTEs, self-joins for co-occurrence
- **A deployable product**: REST API + live dashboard, not a notebook
- **A real GenAI integration**: the skill-gap tool calls the actual Claude API for a written learning plan, with graceful fallback if no key is set (`docs/genai_integration.md`)
- **Freemium usage limiting**: 3 free skill-gap checks per device, then a paywall — Pro plan unlocks unlimited checks + a detailed multi-week roadmap (demo billing, with a documented path to real Stripe/Razorpay integration in `docs/payments_integration.md`)
- **Deployable**: step-by-step guides to push to GitHub and deploy live for free (`docs/github_setup.md`, `docs/deployment.md`)


