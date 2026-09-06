-- schema.sql
-- Normalized schema for the Job Market Intelligence Platform.
-- Works on SQLite (used for local dev) and Postgres/MySQL with minor
-- type tweaks (SERIAL/AUTO_INCREMENT instead of INTEGER PRIMARY KEY).

DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS skills;

CREATE TABLE jobs (
    job_id           TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    company          TEXT NOT NULL,
    location         TEXT NOT NULL,
    experience_band  TEXT NOT NULL,
    salary_lpa       REAL,
    posted_date      TEXT NOT NULL   -- ISO date, stored as text in SQLite
);

CREATE TABLE skills (
    skill_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_name  TEXT UNIQUE NOT NULL
);

CREATE TABLE job_skills (
    job_id    TEXT NOT NULL REFERENCES jobs(job_id),
    skill_id  INTEGER NOT NULL REFERENCES skills(skill_id),
    PRIMARY KEY (job_id, skill_id)
);

CREATE INDEX idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX idx_jobs_title       ON jobs(title);
CREATE INDEX idx_jobs_location    ON jobs(location);
CREATE INDEX idx_job_skills_skill ON job_skills(skill_id);
