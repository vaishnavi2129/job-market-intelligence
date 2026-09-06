import React, { useEffect, useState } from "react";
import { apiUrl, getDeviceId } from "../api.js";
import PricingModal from "./PricingModal.jsx";

export default function SkillGapTool() {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState("");
  const [skillsInput, setSkillsInput] = useState("SQL, Excel");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  const loadUsage = () => {
    fetch(apiUrl(`/api/usage/${getDeviceId()}`))
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  };

  useEffect(() => {
    fetch(apiUrl("/api/analytics/roles"))
      .then((r) => r.json())
      .then((list) => {
        setRoles(list);
        setRole(list[0] || "");
      })
      .catch((e) => setError(e.message));
    loadUsage();
  }, []);

  const runAnalysis = () => {
    setError(null);
    const knownSkills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    fetch(apiUrl("/api/analytics/skill-gap"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, knownSkills, deviceId: getDeviceId() }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 403 && data.error === "limit_reached") {
          setShowPricing(true);
          loadUsage();
          return;
        }
        setResult(data);
        setUsage({
          plan: data.plan,
          checkCount: data.checkCount,
          remaining: data.remaining,
          limit: data.plan === "pro" ? null : 3,
        });
      })
      .catch((e) => setError(e.message));
  };

  return (
    <div>
      {usage && (
        <p className="sub" style={{ margin: "0 0 10px" }}>
          {usage.plan === "pro"
            ? "Pro plan — unlimited checks"
            : `${usage.remaining} of 3 free checks remaining`}
        </p>
      )}

      <div className="skill-gap-controls">
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input
          style={{ flex: 1, minWidth: 180 }}
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="Your skills, comma separated"
        />
        <button onClick={runAnalysis}>Analyze</button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div>
          <div className="coverage-bar">
            <div className="coverage-fill" style={{ width: `${result.coveragePct}%` }} />
          </div>
          <p className="sub" style={{ margin: "0 0 12px" }}>
            {result.coveragePct}% coverage of top skills for {result.role}
          </p>
          <div style={{ marginBottom: result.aiPlan ? 16 : 0 }}>
            {result.skillsYouHave.map((s) => (
              <span key={s} className="tag have">&#10003; {s}</span>
            ))}
            {result.recommendedToLearn.map((s) => (
              <span key={s} className="tag gap">+ {s}</span>
            ))}
          </div>
          {result.aiPlan && (
            <div style={{
              background: "#0e1727", border: "1px solid #1f2c47",
              borderRadius: 8, padding: "12px 14px", fontSize: 13,
              lineHeight: 1.6, whiteSpace: "pre-wrap"
            }}>
              <p style={{ margin: "0 0 6px", color: "#4fd1c5", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
                {result.isRoadmap ? "PRO: AI LEARNING ROADMAP" : "AI-GENERATED LEARNING PLAN"}
              </p>
              {result.aiPlan}
            </div>
          )}
          {result.aiEnabled === false && !result.aiError && (
            <p className="sub" style={{ marginTop: 10 }}>
              (Rule-based result -- set ANTHROPIC_API_KEY in backend/.env for an AI-written plan)
            </p>
          )}
        </div>
      )}

      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          onUpgraded={() => { setShowPricing(false); loadUsage(); }}
        />
      )}
    </div>
  );
}
