"""
generate_data.py
-----------------
Simulates the OUTPUT of a job-portal scraper/API ingestion step.

WHY THIS EXISTS:
Live scraping of LinkedIn/Naukri/Indeed requires portal-specific auth,
breaks their ToS in many cases, and needs network access this sandboxed
environment doesn't have. So this script generates a large, statistically
realistic dataset of job postings (roles, skills, locations, salaries,
posted dates spread over 6 months so trends are visible).

TO GO LIVE: replace this file's output with real data from:
  - LinkedIn Jobs API / Naukri API (needs partner access), OR
  - A compliant scraper (requests + BeautifulSoup) respecting robots.txt,
    writing rows into the SAME schema this script produces (see schema.sql).
Everything downstream (SQL, backend, dashboard) does not care where the
CSV came from - swap this one file and the rest of the pipeline keeps working.
"""

import csv
import random
import datetime
import os

random.seed(42)

ROLES = [
    "Data Analyst", "Data Scientist", "Data Engineer", "Business Analyst",
    "MERN Stack Developer", "Backend Developer", "Full Stack Developer",
    "ML Engineer", "DevOps Engineer", "Product Analyst"
]

LOCATIONS = [
    "Bengaluru", "Delhi NCR", "Hyderabad", "Pune", "Mumbai",
    "Chennai", "Gurugram", "Noida", "Remote", "Kolkata"
]

COMPANIES = [
    "Innotech Systems", "Quantify Labs", "Northbridge Analytics", "Vertex Software",
    "PixelForge", "DataNest", "CloudPeak Technologies", "BrightWave Solutions",
    "Lumen Digital", "Corestack", "Fintara", "Meridian Softworks", "ByteBloom",
    "Skyline InfoTech", "GreenPath Analytics", "Novara Systems", "Arclight IT",
    "TrueNorth Data", "Pinnacle Cloud", "Ironclad Technologies"
]

# Skill pool tagged by role family so postings look plausible.
SKILL_POOL = {
    "Data Analyst": ["SQL", "Excel", "Python", "Power BI", "Tableau", "Pandas",
                     "Statistics", "A/B Testing", "GenAI Tools", "Looker"],
    "Data Scientist": ["Python", "Machine Learning", "SQL", "Pandas", "Scikit-learn",
                        "Deep Learning", "Statistics", "GenAI Tools", "PyTorch", "MLOps"],
    "Data Engineer": ["SQL", "Python", "Spark", "Airflow", "AWS", "ETL",
                       "Kafka", "Data Warehousing", "Docker", "GCP"],
    "Business Analyst": ["SQL", "Excel", "Power BI", "Stakeholder Management",
                          "Requirements Gathering", "Tableau", "Statistics", "Jira"],
    "MERN Stack Developer": ["MongoDB", "Express.js", "React", "Node.js", "JavaScript",
                              "REST API", "JWT", "Redux", "TypeScript", "AWS"],
    "Backend Developer": ["Node.js", "SQL", "REST API", "Docker", "AWS",
                           "System Design", "Microservices", "MongoDB", "Redis"],
    "Full Stack Developer": ["React", "Node.js", "MongoDB", "SQL", "AWS",
                              "JavaScript", "TypeScript", "Docker", "REST API"],
    "ML Engineer": ["Python", "Machine Learning", "Deep Learning", "MLOps", "Docker",
                     "AWS", "PyTorch", "GenAI Tools", "SQL"],
    "DevOps Engineer": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform",
                         "Linux", "Jenkins", "Python", "GCP"],
    "Product Analyst": ["SQL", "Excel", "Power BI", "A/B Testing", "Statistics",
                         "Product Metrics", "Python", "Tableau"]
}

EXPERIENCE_BANDS = ["0-1", "1-3", "3-5", "5-8", "8+"]

# Base salary (LPA) ranges by experience band, role gets a multiplier.
BASE_SALARY = {
    "0-1": (3.5, 6),
    "1-3": (6, 11),
    "3-5": (10, 18),
    "5-8": (16, 28),
    "8+": (25, 45),
}

ROLE_MULTIPLIER = {
    "Data Analyst": 1.0, "Business Analyst": 0.95, "Product Analyst": 1.05,
    "Data Scientist": 1.25, "ML Engineer": 1.3, "Data Engineer": 1.2,
    "MERN Stack Developer": 1.05, "Backend Developer": 1.1,
    "Full Stack Developer": 1.1, "DevOps Engineer": 1.15,
}

# Skills that are trending UP over the 6-month window (to make the
# "trending skills" chart meaningful instead of flat/random).
TRENDING_UP = {"GenAI Tools", "TypeScript", "AWS", "MLOps", "Kubernetes"}
TRENDING_DOWN = {"Redux", "Jenkins", "Excel"}

N_POSTINGS = 1400
START_DATE = datetime.date(2026, 3, 1)
END_DATE = datetime.date(2026, 8, 30)
DAY_SPAN = (END_DATE - START_DATE).days


def weighted_date():
    """Pick a posting date; trending skills get pushed toward recent dates."""
    t = random.random() ** 1.0
    offset = int(t * DAY_SPAN)
    return START_DATE + datetime.timedelta(days=offset)


def pick_skills(role, posted_date):
    pool = SKILL_POOL[role][:]
    k = random.randint(4, 7)
    chosen = set(random.sample(pool, min(k, len(pool))))

    days_from_start = (posted_date - START_DATE).days
    recency = days_from_start / DAY_SPAN  # 0 -> old, 1 -> recent

    # Bias trending-up skills to appear more often in recent postings
    for s in TRENDING_UP:
        if random.random() < (0.15 + 0.45 * recency):
            chosen.add(s)
    # Bias trending-down skills to appear more often in older postings
    for s in TRENDING_DOWN:
        if random.random() < (0.4 - 0.3 * recency):
            chosen.add(s)

    return sorted(chosen)


def make_salary(role, exp_band):
    lo, hi = BASE_SALARY[exp_band]
    mult = ROLE_MULTIPLIER.get(role, 1.0)
    lo, hi = lo * mult, hi * mult
    val = round(random.uniform(lo, hi), 1)
    return val


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "raw_job_postings.csv")

    rows = []
    for i in range(1, N_POSTINGS + 1):
        role = random.choice(ROLES)
        location = random.choices(
            LOCATIONS,
            weights=[18, 20, 12, 10, 12, 8, 10, 10, 8, 6]
        )[0]
        company = random.choice(COMPANIES)
        exp_band = random.choices(
            EXPERIENCE_BANDS, weights=[15, 30, 25, 20, 10]
        )[0]
        posted_date = weighted_date()
        skills = pick_skills(role, posted_date)
        salary = make_salary(role, exp_band)

        rows.append({
            "job_id": f"JOB{i:05d}",
            "title": role,
            "company": company,
            "location": location,
            "experience_band": exp_band,
            "salary_lpa": salary,
            "posted_date": posted_date.isoformat(),
            "skills_raw": "|".join(skills),
        })

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} job postings -> {out_path}")


if __name__ == "__main__":
    main()
