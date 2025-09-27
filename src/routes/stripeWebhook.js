// routes/stripeWebhook.js
// routes/stripeWebhook.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

const User = require("../models/User");
const registrarCompraUsuario = require("../utils/registrarCompraUsuario");
const sendPurchaseEmail = require("../utils/sendPurchaseEmail");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ Montar ANTES de express.json()
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

  // ✅ Evento de pago exitoso con Checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const userId = session.metadata?.userId;
      const items = session.metadata?.items ? JSON.parse(session.metadata.items) : [];

      if (!userId || !items.length) {
        console.warn("⚠️ Webhook sin userId o items");
        return res.status(200).send("OK");
      }

      const paymentIntentId = session.payment_intent || session.id;

      // Registrar compra (deduplicado)
      const { yaProcesado } = await registrarCompraUsuario(userId, items, paymentIntentId);
      if (yaProcesado) {
        console.log("⚠️ Pago ya procesado. No se envía email duplicado.");
        return res.status(200).send("OK");
      }

      // Construir order a partir de line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const orderItems = lineItems.data.map(li => ({
        title: li.description,
        type: "digital",
        price: (li.amount_total ?? li.amount_subtotal) / 100,
        qty: li.quantity || 1,
      }));

      const subtotal = orderItems.reduce((s, i) => s + i.price * (i.qty || 1), 0);
      const shipping = 0;
      const taxes = 0;
      const total = subtotal + shipping + taxes;

      const user = await User.findById(userId);
      if (!user) {
        console.warn("⚠️ Usuario no encontrado al enviar email");
        return res.status(200).send("OK");
      }

      await sendPurchaseEmail({
        to: user.email,
        buyer: { name: user.name, surname: user.surname },
        order: { items: orderItems, subtotal, shipping, taxes, total, deliveryOrAccessDate: "inmediata" },
        vendor: {
          tradeName: "CircusCoach / Productions associées asbl",
          vat: "BE 0896.755.397",
          address: "rue Coenraets 72, 1060 Bruselas, Bélgica",
          email: "circuscoachbyrociogarrote@gmail.com",
          claimsEmail: "circuscoachbyrociogarrote@gmail.com",
        },
        policyLinks: {
          termsUrl: process.env.TERMS_URL || "https://www.mycircuscoach.com/terminos",
        },
      });

      console.log(`✅ Email de confirmación enviado a ${user.email}`);
    } catch (e) {
      console.error("❌ Error al guardar compra/enviar email en webhook:", e);
      // Respondemos 200 igualmente
    }
  }

  res.status(200).send("✅ Webhook recibido");
});

module.exports = router;
