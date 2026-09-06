import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiUrl } from "../api.js";

export default function SalaryBands() {
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/analytics/roles"))
      .then((r) => r.json())
      .then((list) => {
        setRoles(list);
        setRole(list[0] || "");
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!role) return;
    fetch(apiUrl(`/api/analytics/salary-bands?role=${encodeURIComponent(role)}`))
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, [role]);

  if (error) return <p className="error">Failed to load: {error}</p>;

  return (
    <div>
      <div className="skill-gap-controls">
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      {!data ? (
        <p className="loading">Loading...</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2c47" />
            <XAxis dataKey="experienceBand" stroke="#8ea0bf" fontSize={12} />
            <YAxis stroke="#8ea0bf" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#121c30", border: "1px solid #1f2c47", borderRadius: 8 }}
              formatter={(value, name) => [`₹${value} LPA`, name]}
            />
            <Bar dataKey="avgSalaryLpa" name="Avg Salary" fill="#4fd1c5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
