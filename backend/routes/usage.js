const express = require("express");
const { getUsage, setPlan, FREE_LIMIT } = require("../db/usage");

const router = express.Router();

// GET /api/usage/:deviceId
router.get("/:deviceId", (req, res) => {
  const usage = getUsage(req.params.deviceId);
  res.json({
    plan: usage.plan,
    checkCount: usage.check_count,
    limit: usage.plan === "pro" ? null : FREE_LIMIT,
    remaining: usage.plan === "pro" ? null : Math.max(FREE_LIMIT - usage.check_count, 0),
  });
});

// POST /api/usage/upgrade  { deviceId, plan }
//
// DEMO ONLY: this instantly flips the plan with no payment involved.
// In a real product this endpoint would NOT be called directly from the
// frontend - a payment provider (Stripe/Razorpay) would confirm payment
// first via a webhook, and that webhook handler would call setPlan().
// See docs/payments_integration.md for how to wire that up.
router.post("/upgrade", (req, res) => {
  const { deviceId, plan } = req.body;
  if (!deviceId || !["free", "pro"].includes(plan)) {
    return res.status(400).json({ error: "deviceId and a valid plan are required" });
  }
  const usage = setPlan(deviceId, plan);
  res.json({ plan: usage.plan, checkCount: usage.check_count });
});

module.exports = router;
