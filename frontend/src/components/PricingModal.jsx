import React from "react";
import { apiUrl, getDeviceId } from "../api.js";

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
};

const cardStyle = {
  background: "#121c30", border: "1px solid #1f2c47", borderRadius: 12,
  padding: 24, maxWidth: 460, width: "90%",
};

const planBoxStyle = {
  border: "1px solid #1f2c47", borderRadius: 8, padding: "14px 16px", marginBottom: 12,
};

export default function PricingModal({ onClose, onUpgraded }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const upgrade = () => {
    setLoading(true);
    setError(null);
    fetch(apiUrl("/api/usage/upgrade"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId(), plan: "pro" }),
    })
      .then((r) => r.json())
      .then(() => {
        setLoading(false);
        onUpgraded();
      })
      .catch((e) => { setLoading(false); setError(e.message); });
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>You've used your 3 free checks</h2>
        <p className="sub" style={{ margin: "0 0 16px" }}>Upgrade for unlimited skill-gap checks + a full learning roadmap</p>

        <div style={planBoxStyle}>
          <strong style={{ fontSize: 14 }}>Free</strong>
          <p className="sub" style={{ margin: "6px 0 0" }}>3 skill-gap checks · Basic 3-step plan</p>
        </div>

        <div style={{ ...planBoxStyle, borderColor: "#4fd1c5" }}>
          <strong style={{ fontSize: 14, color: "#4fd1c5" }}>Pro</strong>
          <p className="sub" style={{ margin: "6px 0 0" }}>Unlimited checks · 4-6 week learning roadmap · Project ideas per skill</p>
        </div>

        {error && <p className="error">{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1 }}>Maybe later</button>
          <button onClick={upgrade} disabled={loading} style={{ flex: 1, background: "#4fd1c5", color: "#0b1220", border: "none", fontWeight: 600 }}>
            {loading ? "Upgrading..." : "Upgrade to Pro"}
          </button>
        </div>
        <p className="sub" style={{ marginTop: 12, fontSize: 11 }}>
          Demo mode — no real payment is charged. See docs/payments_integration.md to connect real billing.
        </p>
      </div>
    </div>
  );
}
