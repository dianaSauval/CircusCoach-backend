const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const User = require("../models/User");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ ¡Muy importante! Este endpoint no usa bodyParser.json()
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Evento de pago exitoso
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const items = JSON.parse(session.metadata.items);

    try {
      const user = await User.findById(userId);
      if (!user) return console.warn("⚠️ Usuario no encontrado para el webhook");

      const agregados = [];

      for (let item of items) {
        const itemId = item.id.toString();

        if (item.type === "course") {
          const yaComprado = user.cursosComprados.some(id => id.toString() === itemId);
          if (!yaComprado) {
            user.cursosComprados.push(itemId);
            agregados.push(item);
          }
        }

        if (item.type === "formation") {
          const yaComprado = user.formacionesCompradas.some(id => id.toString() === itemId);
          if (!yaComprado) {
            user.formacionesCompradas.push(itemId);
            agregados.push(item);
          }
        }
      }

      await user.save();
      console.log(`✅ Compra guardada para el usuario ${user.email}`);
    } catch (e) {
      console.error("❌ Error al guardar compra en webhook:", e);
    }
  }

  res.status(200).send("✅ Webhook recibido");
});

module.exports = router;
