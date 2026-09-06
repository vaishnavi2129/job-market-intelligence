# Connecting real payments (Stripe example)

Right now `POST /api/usage/upgrade` (in `backend/routes/usage.js`) is a
**demo-only** endpoint - clicking "Upgrade to Pro" in the UI calls it
directly and instantly flips the plan. No money changes hands. This is
fine for a portfolio demo but NOT how a real product works.

## How a real flow differs

In production, the frontend never gets to decide "I'm pro now" - only a
confirmed payment does. The flow becomes:

1. User clicks "Upgrade" → frontend calls your backend to create a Stripe
   Checkout Session, then redirects to Stripe's hosted payment page.
2. User pays on Stripe's page (your app never touches card details).
3. Stripe calls a **webhook** on your backend to confirm payment.
4. Your webhook handler - not the frontend - calls `setPlan(deviceId, "pro")`.

## Steps to wire this up

1. Create a Stripe account at https://dashboard.stripe.com, get your API keys
2. `npm install stripe` in `backend/`
3. Replace the `/api/usage/upgrade` handler with a Checkout Session creator:
   ```js
   const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

   router.post("/create-checkout-session", async (req, res) => {
     const { deviceId } = req.body;
     const session = await stripe.checkout.sessions.create({
       mode: "subscription",
       line_items: [{ price: "price_xxx", quantity: 1 }], // your Stripe Price ID
       success_url: "https://your-app.com/success",
       cancel_url: "https://your-app.com/cancel",
       metadata: { deviceId }, // so the webhook knows who paid
     });
     res.json({ url: session.url });
   });
   ```
4. Add a webhook endpoint Stripe can call on successful payment:
   ```js
   router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
     const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
     if (event.type === "checkout.session.completed") {
       const { deviceId } = event.data.object.metadata;
       setPlan(deviceId, "pro"); // NOW it's real
     }
     res.json({ received: true });
   });
   ```
5. Register the webhook URL in the Stripe dashboard, and set
   `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` as env vars on your
   deployed backend (Render → Environment tab).
6. Update `PricingModal.jsx`'s upgrade button to call
   `/api/usage/create-checkout-session` and redirect to the returned URL,
   instead of calling `/api/usage/upgrade` directly.

## A note on device-based tracking

This project uses a random `deviceId` in localStorage instead of user
accounts, since there's no login system. That's fine for a demo but has a
real limitation: clearing browser storage resets the free-tier count, and
a paid plan doesn't follow the user across devices. A production version
would pair this with real authentication (e.g. email + password or OAuth)
and key the `usage` table on `user_id` instead of `device_id`.

Razorpay (popular in India) follows the same webhook pattern - see
https://razorpay.com/docs/payments/payment-gateway/webhooks/ for their
equivalent of steps 3-4 above.
