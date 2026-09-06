require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analyticsRouter = require("./routes/analytics");
const usageRouter = require("./routes/usage");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "job-market-intelligence-backend" });
});

app.use("/api/analytics", analyticsRouter);
app.use("/api/usage", usageRouter);

app.listen(PORT, () => {
  console.log(`Job Market Intelligence API running on http://localhost:${PORT}`);
});
