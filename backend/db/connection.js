const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// The DB is built by the Python pipeline (data-pipeline/load_to_db.py)
// and lives at data-pipeline/job_market.db. Run the pipeline before
// starting the backend.
//
// Uses Node's built-in `node:sqlite` module (stable in Node 22+) instead
// of better-sqlite3, which requires native compilation (Visual Studio
// Build Tools on Windows, build-essential on Linux) that many machines
// don't have set up. node:sqlite needs zero extra installs.
const DB_PATH = path.join(__dirname, "..", "..", "data-pipeline", "job_market.db");

const conn = new DatabaseSync(DB_PATH, { readOnly: true });

// Thin wrapper so routes/analytics.js (written against the better-sqlite3
// API) doesn't need to change: db.prepare(sql).all(...params) / .get(...)
const db = {
  prepare(sql) {
    const stmt = conn.prepare(sql);
    return {
      all: (...params) => stmt.all(...params),
      get: (...params) => stmt.get(...params),
    };
  },
};

module.exports = db;
