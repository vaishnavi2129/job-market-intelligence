import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiUrl } from "../api.js";

export default function RoleLeaderboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/analytics/role-salary-leaderboard"))
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">Failed to load: {error}</p>;
  if (!data) return <p className="loading">Loading...</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2c47" horizontal={false} />
        <XAxis type="number" stroke="#8ea0bf" fontSize={12} />
        <YAxis type="category" dataKey="title" stroke="#8ea0bf" fontSize={11} width={130} />
        <Tooltip
          contentStyle={{ background: "#121c30", border: "1px solid #1f2c47", borderRadius: 8 }}
          formatter={(value) => [`₹${value} LPA`, "Avg Salary"]}
        />
        <Bar dataKey="avgSalaryLpa" fill="#4fd1c5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
