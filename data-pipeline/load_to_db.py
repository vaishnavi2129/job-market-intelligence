"""
load_to_db.py
--------------
Cleaning + skill-extraction + load step of the pipeline.

  raw_job_postings.csv  --(clean + normalize)-->  job_market.db (SQLite)

Run after generate_data.py:
    python3 load_to_db.py
"""

import csv
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "raw_job_postings.csv")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")
DB_PATH = os.path.join(BASE_DIR, "job_market.db")


def clean_row(row):
    """Basic cleaning: trim whitespace, guard against missing/bad values."""
    row = {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items()}
    try:
        row["salary_lpa"] = round(float(row["salary_lpa"]), 1)
    except (ValueError, TypeError):
        row["salary_lpa"] = None
    return row


def extract_skills(skills_raw):
    """skills_raw is '|' separated in the source CSV -> list of clean skill names.
    In a real scrape this is where NLP (spaCy PhraseMatcher / regex against a
    skill taxonomy) would pull skills out of free-text job descriptions."""
    if not skills_raw:
        return []
    return [s.strip() for s in skills_raw.split("|") if s.strip()]


def main():
    if not os.path.exists(CSV_PATH):
        raise SystemExit("raw_job_postings.csv not found - run generate_data.py first.")

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    with open(SCHEMA_PATH) as f:
        cur.executescript(f.read())

    skill_id_cache = {}

    def get_skill_id(name):
        if name in skill_id_cache:
            return skill_id_cache[name]
        cur.execute("INSERT OR IGNORE INTO skills (skill_name) VALUES (?)", (name,))
        cur.execute("SELECT skill_id FROM skills WHERE skill_name = ?", (name,))
        sid = cur.fetchone()[0]
        skill_id_cache[name] = sid
        return sid

    n_jobs, n_links, n_skipped = 0, 0, 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for raw_row in reader:
            row = clean_row(raw_row)
            if row["salary_lpa"] is None:
                n_skipped += 1
                continue

            cur.execute(
                """INSERT OR REPLACE INTO jobs
                   (job_id, title, company, location, experience_band, salary_lpa, posted_date)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (row["job_id"], row["title"], row["company"], row["location"],
                 row["experience_band"], row["salary_lpa"], row["posted_date"])
            )
            n_jobs += 1

            for skill in extract_skills(row["skills_raw"]):
                sid = get_skill_id(skill)
                cur.execute(
                    "INSERT OR IGNORE INTO job_skills (job_id, skill_id) VALUES (?, ?)",
                    (row["job_id"], sid)
                )
                n_links += 1

    conn.commit()
    conn.close()
    print(f"Loaded {n_jobs} jobs, {n_links} job-skill links, skipped {n_skipped} bad rows.")
    print(f"DB written to {DB_PATH}")


if __name__ == "__main__":
    main()
