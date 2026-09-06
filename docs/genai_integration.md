# GenAI layer — how it works

`POST /api/analytics/skill-gap` (in `backend/routes/analytics.js`) calls
the real **Claude API** (`claude-sonnet-5`) to turn a data-backed skill
gap into a short, prioritized learning plan.

## How it works

1. SQL query finds the top 10 in-demand skills for the requested role
   (same query used for the rest of the dashboard - no separate data path).
2. The gap between those skills and what the user says they know is computed.
3. That gap + the role + posting counts are sent to Claude, which writes
   a short 3-step learning plan.
4. If `ANTHROPIC_API_KEY` isn't set, or the API call fails for any reason,
   the route falls back to the rule-based gap list with no plan - the
   dashboard still works, it just won't show the AI-written plan.

## Enabling it

```bash
cd backend
cp .env.example .env
# paste your key into .env: ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Get a key at https://console.anthropic.com/settings/keys

## Why it's built this way

- **Graceful degradation**: the core product (SQL analytics + dashboard)
  never depends on an external API being up or a key being configured.
- **Grounded, not hallucinated**: the prompt only contains numbers pulled
  from the actual SQLite database, so the model is writing prose around
  real data rather than inventing skill trends.
- **One isolated call site**: everything AI-related lives in one route
  handler, so swapping models or providers later touches one file.
