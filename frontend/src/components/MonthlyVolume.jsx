import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiUrl } from "../api.js";

export default function MonthlyVolume() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl("/api/analytics/monthly-volume"))
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">Failed to load: {error}</p>;
  if (!data) return <p className="loading">Loading...</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2c47" />
        <XAxis dataKey="month" stroke="#8ea0bf" fontSize={12} />
        <YAxis stroke="#8ea0bf" fontSize={12} />
        <Tooltip contentStyle={{ background: "#121c30", border: "1px solid #1f2c47", borderRadius: 8 }} />
        <Line type="monotone" dataKey="postings" stroke="#f6ad55" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
