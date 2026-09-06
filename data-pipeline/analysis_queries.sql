-- analysis_queries.sql
-- Core analysis queries powering the dashboard. Each is also exposed as a
-- backend API endpoint (see backend/routes/analytics.js).

-- 1. TRENDING SKILLS: postings in the last 30 days vs the 30 days before that,
--    ranked by % growth. This is the single most "recruiter-impressive" query
--    because it answers "what should I learn right now" with real evidence.
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
    r.skill_name,
    r.recent_count,
    COALESCE(p.prev_count, 0) AS prev_count,
    ROUND(
      100.0 * (r.recent_count - COALESCE(p.prev_count, 0))
      / MAX(COALESCE(p.prev_count, 1), 1), 1
    ) AS pct_growth
FROM recent r
LEFT JOIN previous p ON p.skill_name = r.skill_name
ORDER BY pct_growth DESC, r.recent_count DESC
LIMIT 15;


-- 2. SALARY BANDS BY EXPERIENCE (per role)
SELECT
    title,
    experience_band,
    ROUND(AVG(salary_lpa), 1) AS avg_salary_lpa,
    ROUND(MIN(salary_lpa), 1) AS min_salary_lpa,
    ROUND(MAX(salary_lpa), 1) AS max_salary_lpa,
    COUNT(*) AS n_postings
FROM jobs
GROUP BY title, experience_band
ORDER BY title,
    CASE experience_band
        WHEN '0-1' THEN 1 WHEN '1-3' THEN 2 WHEN '3-5' THEN 3
        WHEN '5-8' THEN 4 WHEN '8+' THEN 5 END;


-- 3. SKILL DEMAND BY LOCATION (top 5 skills per location)
SELECT location, skill_name, postings
FROM (
    SELECT
        j.location,
        s.skill_name,
        COUNT(*) AS postings,
        RANK() OVER (PARTITION BY j.location ORDER BY COUNT(*) DESC) AS rnk
    FROM job_skills js
    JOIN jobs j ON j.job_id = js.job_id
    JOIN skills s ON s.skill_id = js.skill_id
    GROUP BY j.location, s.skill_name
)
WHERE rnk <= 5
ORDER BY location, postings DESC;


-- 4. SKILL CO-OCCURRENCE (which skills are commonly asked for together
--    with a given anchor skill, e.g. "SQL") - useful for "what to learn next"
SELECT
    s2.skill_name AS co_skill,
    COUNT(*) AS co_occurrences
FROM job_skills js1
JOIN job_skills js2 ON js1.job_id = js2.job_id AND js1.skill_id != js2.skill_id
JOIN skills s1 ON s1.skill_id = js1.skill_id
JOIN skills s2 ON s2.skill_id = js2.skill_id
WHERE s1.skill_name = 'SQL'
GROUP BY s2.skill_name
ORDER BY co_occurrences DESC
LIMIT 10;


-- 5. MONTHLY POSTING VOLUME (overall market activity trend)
SELECT
    strftime('%Y-%m', posted_date) AS month,
    COUNT(*) AS postings
FROM jobs
GROUP BY month
ORDER BY month;


-- 6. ROLE-WISE AVERAGE SALARY LEADERBOARD
SELECT
    title,
    ROUND(AVG(salary_lpa), 1) AS avg_salary_lpa,
    COUNT(*) AS n_postings
FROM jobs
GROUP BY title
ORDER BY avg_salary_lpa DESC;
