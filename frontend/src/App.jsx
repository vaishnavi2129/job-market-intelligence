import React from "react";
import TrendingSkills from "./components/TrendingSkills.jsx";
import MonthlyVolume from "./components/MonthlyVolume.jsx";
import RoleLeaderboard from "./components/RoleLeaderboard.jsx";
import SalaryBands from "./components/SalaryBands.jsx";
import SkillsByLocation from "./components/SkillsByLocation.jsx";
import SkillGapTool from "./components/SkillGapTool.jsx";

export default function App() {
  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Job Market Intelligence Platform</h1>
          <p>Live skill demand, salary trends & skill-gap analysis from job posting data</p>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Trending Skills (last 30 days vs prior 30)</h2>
          <p className="sub">Which skills are gaining demand right now</p>
          <TrendingSkills />
        </div>

        <div className="panel">
          <h2>Posting Volume Over Time</h2>
          <p className="sub">Overall hiring activity trend</p>
          <MonthlyVolume />
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Average Salary by Role (LPA)</h2>
          <p className="sub">Ranked leaderboard across all postings</p>
          <RoleLeaderboard />
        </div>

        <div className="panel">
          <h2>Salary by Experience</h2>
          <p className="sub">Pick a role to see salary progression by experience band</p>
          <SalaryBands />
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Top Skills by Location</h2>
          <p className="sub">Pick a city to see what's in demand there</p>
          <SkillsByLocation />
        </div>

        <div className="panel">
          <h2>Skill Gap Analysis</h2>
          <p className="sub">Pick a role & your known skills to see what to learn next</p>
          <SkillGapTool />
        </div>
      </div>
    </div>
  );
}
