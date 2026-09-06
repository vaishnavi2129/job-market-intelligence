const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// Separate from job_market.db (which is read-only, built by the Python
// pipeline). This DB is created and managed entirely by the backend, and
// tracks how many free skill-gap checks each device has used, plus which
// plan they're on. No login system - device_id is a random ID generated
// client-side and stored in localStorage.
const DB_PATH = path.join(__dirname, "app_usage.db");

const conn = new DatabaseSync(DB_PATH);

conn.exec(`
  CREATE TABLE IF NOT EXISTS usage (
    device_id   TEXT PRIMARY KEY,
    check_count INTEGER NOT NULL DEFAULT 0,
    plan        TEXT NOT NULL DEFAULT 'free',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const FREE_LIMIT = 3;

function getUsage(deviceId) {
  const row = conn.prepare("SELECT * FROM usage WHERE device_id = ?").get(deviceId);
  if (!row) {
    return { device_id: deviceId, check_count: 0, plan: "free" };
  }
  return row;
}

function ensureRow(deviceId) {
  conn.prepare(`
    INSERT INTO usage (device_id, check_count, plan)
    VALUES (?, 0, 'free')
    ON CONFLICT(device_id) DO NOTHING
  `).run(deviceId);
}

function incrementCheck(deviceId) {
  ensureRow(deviceId);
  conn.prepare(`
    UPDATE usage SET check_count = check_count + 1, updated_at = datetime('now')
    WHERE device_id = ?
  `).run(deviceId);
  return getUsage(deviceId);
}

function setPlan(deviceId, plan) {
  ensureRow(deviceId);
  conn.prepare(`
    UPDATE usage SET plan = ?, updated_at = datetime('now')
    WHERE device_id = ?
  `).run(plan, deviceId);
  return getUsage(deviceId);
}

module.exports = { getUsage, incrementCheck, setPlan, FREE_LIMIT };
