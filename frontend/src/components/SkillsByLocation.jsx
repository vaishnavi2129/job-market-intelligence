import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiUrl } from "../api.js";

export default function SkillsByLocation() {
  const [allData, setAllData] = useState(null);
  const [location, setLocation] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/analytics/skills-by-location"))
      .then((r) => r.json())
      .then((rows) => {
        setAllData(rows);
        const firstLocation = rows[0]?.location;
        if (firstLocation) setLocation(firstLocation);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">Failed to load: {error}</p>;
  if (!allData) return <p className="loading">Loading...</p>;

  const locations = [...new Set(allData.map((r) => r.location))].sort();
  const filtered = allData.filter((r) => r.location === location);

  return (
    <div>
      <div className="skill-gap-controls">
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={filtered} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2c47" horizontal={false} />
          <XAxis type="number" stroke="#8ea0bf" fontSize={12} />
          <YAxis type="category" dataKey="skill" stroke="#8ea0bf" fontSize={12} width={110} />
          <Tooltip
            contentStyle={{ background: "#121c30", border: "1px solid #1f2c47", borderRadius: 8 }}
            formatter={(value) => [`${value} postings`, "Demand"]}
          />
          <Bar dataKey="postings" fill="#f6ad55" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
