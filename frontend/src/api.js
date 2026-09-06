// In local dev, Vite proxies /api -> http://localhost:5000 (see vite.config.js),
// so a relative path works. In production (e.g. deployed on Vercel), the
// frontend and backend are on different domains, so set VITE_API_URL to the
// deployed backend's URL (e.g. https://your-backend.onrender.com) as an
// environment variable at build time.
const BASE = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  return `${BASE}${path}`;
}

// No login system - identify this browser with a random ID persisted in
// localStorage, so the backend can count free-tier usage per device.
export function getDeviceId() {
  let id = localStorage.getItem("jmip_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("jmip_device_id", id);
  }
  return id;
}
