const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const db = require("../db/connection");
const { getUsage, incrementCheck, FREE_LIMIT } = require("../db/usage");

const router = express.Router();

// Client reads ANTHROPIC_API_KEY from environment automatically.
// If the key isn't set, calls will fail and the /skill-gap route below
// gracefully falls back to a rule-based (non-AI) response.
const anthropic = new Anthropic();

// GET /api/analytics/trending-skills
// Skills growing fastest in the last 30 days vs the 30 before that.
router.get("/trending-skills", (req, res) => {
  const rows = db.prepare(`
    WITH recent AS (
      SELECT s.skill_name, COUNT(*) AS recent_count
      FROM job_skills js
      JOIN skills s ON s.skill_id = js.skill_id
      JOIN jobs j ON j.job_id = js.job_id
      WHERE j.posted_date >= date((SELECT MAX(posted_date) FROM jobs), '-30 days')
      GROUP BY s.skill_name
    ),
    previous AS (
      SELECT s.skill_name, COUNT(*) AS prev_count
      FROM job_skills js
      JOIN skills s ON s.skill_id = js.skill_id
      JOIN jobs j ON j.job_id = js.job_id
      WHERE j.posted_date >= date((SELECT MAX(posted_date) FROM jobs), '-60 days')
        AND j.posted_date <  date((SELECT MAX(posted_date) FROM jobs), '-30 days')
      GROUP BY s.skill_name
    )
    SELECT
      r.skill_name AS skill,
      r.recent_count AS recentCount,
      COALESCE(p.prev_count, 0) AS prevCount,
      ROUND(100.0 * (r.recent_count - COALESCE(p.prev_count, 0))
            / MAX(COALESCE(p.prev_count, 1), 1), 1) AS pctGrowth
    FROM recent r
    LEFT JOIN previous p ON p.skill_name = r.skill_name
    ORDER BY pctGrowth DESC, recentCount DESC
    LIMIT 15
  `).all();
  res.json(rows);
});

// GET /api/analytics/salary-bands?role=Data%20Analyst
router.get("/salary-bands", (req, res) => {
  const { role } = req.query;
  const base = `
    SELECT title, experience_band AS experienceBand,
           ROUND(AVG(salary_lpa), 1) AS avgSalaryLpa,
           ROUND(MIN(salary_lpa), 1) AS minSalaryLpa,
           ROUND(MAX(salary_lpa), 1) AS maxSalaryLpa,
           COUNT(*) AS nPostings
    FROM jobs
    ${role ? "WHERE title = ?" : ""}
    GROUP BY title, experience_band
    ORDER BY title,
      CASE experience_band
        WHEN '0-1' THEN 1 WHEN '1-3' THEN 2 WHEN '3-5' THEN 3
        WHEN '5-8' THEN 4 WHEN '8+' THEN 5 END
  `;
  const rows = role ? db.prepare(base).all(role) : db.prepare(base).all();
  res.json(rows);
});

// GET /api/analytics/skills-by-location
router.get("/skills-by-location", (req, res) => {
  const rows = db.prepare(`
    SELECT location, skill_name AS skill, postings FROM (
      SELECT j.location, s.skill_name, COUNT(*) AS postings,
             RANK() OVER (PARTITION BY j.location ORDER BY COUNT(*) DESC) AS rnk
      FROM job_skills js
      JOIN jobs j ON j.job_id = js.job_id
      JOIN skills s ON s.skill_id = js.skill_id
      GROUP BY j.location, s.skill_name
    )
    WHERE rnk <= 5
    ORDER BY location, postings DESC
  `).all();
  res.json(rows);
});

// GET /api/analytics/monthly-volume
router.get("/monthly-volume", (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', posted_date) AS month, COUNT(*) AS postings
    FROM jobs GROUP BY month ORDER BY month
  `).all();
  res.json(rows);
});

// GET /api/analytics/role-salary-leaderboard
router.get("/role-salary-leaderboard", (req, res) => {
  const rows = db.prepare(`
    SELECT title, ROUND(AVG(salary_lpa), 1) AS avgSalaryLpa, COUNT(*) AS nPostings
    FROM jobs GROUP BY title ORDER BY avgSalaryLpa DESC
  `).all();
  res.json(rows);
});

// GET /api/analytics/roles  (distinct role list, for dropdowns)
router.get("/roles", (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT title FROM jobs ORDER BY title`).all();
  res.json(rows.map(r => r.title));
});

// POST /api/analytics/skill-gap
// Body: { role: "Data Analyst", knownSkills: ["SQL", "Excel"] }
//
// Uses the real Claude API (claude-sonnet-5) to turn the data-backed skill
// gap into a short, prioritized learning plan. Falls back to a plain
// rule-based gap list (no AI call) if ANTHROPIC_API_KEY isn't set, so the
// rest of the project still works without an API key configured.
router.post("/skill-gap", async (req, res) => {
  const { role, knownSkills = [], deviceId } = req.body;
  if (!role) return res.status(400).json({ error: "role is required" });
  if (!deviceId) return res.status(400).json({ error: "deviceId is required" });

  const usage = getUsage(deviceId);
  if (usage.plan === "free" && usage.check_count >= FREE_LIMIT) {
    return res.status(403).json({
      error: "limit_reached",
      message: `You've used all ${FREE_LIMIT} free checks. Upgrade to Pro for unlimited checks and a full learning roadmap.`,
      checkCount: usage.check_count,
      limit: FREE_LIMIT,
    });
  }

  const topSkills = db.prepare(`
    SELECT s.skill_name AS skill, COUNT(*) AS postings
    FROM job_skills js
    JOIN jobs j ON j.job_id = js.job_id
    JOIN skills s ON s.skill_id = js.skill_id
    WHERE j.title = ?
    GROUP BY s.skill_name
    ORDER BY postings DESC
    LIMIT 10
  `).all(role);

  const known = new Set(knownSkills.map(s => s.toLowerCase().trim()));
  const gap = topSkills.filter(s => !known.has(s.skill.toLowerCase()));
  const covered = topSkills.filter(s => known.has(s.skill.toLowerCase()));
  const coveragePct = Math.round((covered.length / topSkills.length) * 100);

  const updatedUsage = incrementCheck(deviceId);

  const baseResult = {
    role,
    topSkillsForRole: topSkills,
    skillsYouHave: covered.map(s => s.skill),
    recommendedToLearn: gap.map(s => s.skill),
    coveragePct,
    plan: updatedUsage.plan,
    checkCount: updatedUsage.check_count,
    remaining: updatedUsage.plan === "pro" ? null : Math.max(FREE_LIMIT - updatedUsage.check_count, 0),
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ ...baseResult, aiPlan: null, aiEnabled: false });
  }

  const isPro = updatedUsage.plan === "pro";
  const prompt = isPro
    ? `A candidate targeting a "${role}" role already knows: ${knownSkills.join(", ") || "no skills listed"}.
Based on real job posting data, the top in-demand skills for this role right now are: ${topSkills.map(s => `${s.skill} (${s.postings} postings)`).join(", ")}.
They are missing: ${gap.map(s => s.skill).join(", ") || "nothing - full coverage"}.
Write a detailed 4-6 week learning ROADMAP with week-by-week milestones to close this gap, prioritized by demand. Include a brief note on how to demonstrate each skill (project idea or certification). Keep it under 300 words, use short headers per week.`
    : `A candidate targeting a "${role}" role already knows: ${knownSkills.join(", ") || "no skills listed"}.
Based on real job posting data, the top in-demand skills for this role right now are: ${topSkills.map(s => `${s.skill} (${s.postings} postings)`).join(", ")}.
They are missing: ${gap.map(s => s.skill).join(", ") || "nothing - full coverage"}.
Write a short, encouraging, prioritized 3-step learning plan (a few sentences each) to close the gap. Keep it under 150 words total.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: isPro ? 700 : 400,
      messages: [{ role: "user", content: prompt }]
    });

    const aiPlan = msg.content.find(b => b.type === "text")?.text || null;
    res.json({ ...baseResult, aiPlan, aiEnabled: true, isRoadmap: isPro });
  } catch (err) {
    console.error("Claude API call failed, falling back to rule-based result:", err.message);
    res.json({ ...baseResult, aiPlan: null, aiEnabled: false, aiError: "AI plan unavailable right now" });
  }
});

module.exports = router;
