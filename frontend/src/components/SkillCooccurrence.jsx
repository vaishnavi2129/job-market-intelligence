import React, { useEffect, useState } from "react";
import { apiUrl } from "../api.js";

const COMMON_SKILLS = ["SQL", "Python", "AWS", "React", "Excel", "Docker"];

export default function SkillCooccurrence() {
  const [skill, setSkill] = useState("SQL");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl(`/api/analytics/skill-cooccurrence?skill=${encodeURIComponent(skill)}`))
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, [skill]);

  return (
    <div>
      <div className="skill-gap-controls">
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          {COMMON_SKILLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {!data ? (
        <p className="loading">Loading...</p>
      ) : (
        <div>
          <p className="sub" style={{ margin: "0 0 10px" }}>
            Skills most often listed alongside {skill}
          </p>
          <div>
            {data.map((row) => (
              <span key={row.coSkill} className="tag have" style={{ background: "rgba(246,173,85,0.15)", color: "#f6ad55" }}>
                {row.coSkill} ({row.coOccurrences})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}