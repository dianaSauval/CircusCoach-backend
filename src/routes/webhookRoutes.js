// routes/webhookRoutes.js
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const registrarCompraUsuario = require("../utils/registrarCompraUsuario");
const User = require("../models/User");

router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // ⚠️ NECESARIO para validar firma
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET // ⚠️ Este lo vas a configurar en el próximo paso
      );
    } catch (err) {
      console.error("❌ Error validando webhook:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 💡 Manejo de evento: Payment exitoso
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const paymentIntentId = intent.id;
      const userId = intent.metadata?.userId;
      const items = intent.metadata?.items
        ? JSON.parse(intent.metadata.items)
        : [];

      console.log("📥 Webhook recibido: payment_intent.succeeded");
      console.log("👤 Usuario:", userId);
      console.log("🛒 Items:", items);
      console.log("💳 PaymentIntent:", paymentIntentId);

      if (userId && items.length) {
        await registrarCompraUsuario(userId, items, paymentIntentId);
        console.log("✅ Compra procesada desde webhook");
      }
    }

    res.status(200).send("ok");
  }
);

module.exports = router;
