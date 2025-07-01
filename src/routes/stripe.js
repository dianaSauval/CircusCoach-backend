// routes/stripe.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const registrarCompraUsuario = require("../utils/registrarCompraUsuario");

const User = require("../models/User");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/crear-sesion", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title?.es || "Producto",
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));
    const minimalItems = items.map((item) => ({
      id: item.id,
      type: item.type,
    }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/carrito`,

      metadata: {
        userId: req.user.id,
        items: JSON.stringify(minimalItems),
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error al crear sesión de Stripe:", error);
    res.status(500).json({ error: "Error al crear sesión de pago" });
  }
});

router.get("/confirmar-compra", authMiddleware, async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const items = session.metadata?.items
      ? JSON.parse(session.metadata.items)
      : [];

      
    if (!items.length) {
      return res
        .status(400)
        .json({ success: false, error: "No hay productos para confirmar." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });
    }

    // ✅ NUEVO: usar función reutilizable
    const { agregados, yaTenia } = await registrarCompraUsuario(user, items);
   

    res.json({ success: true, agregados, yaTenia });
  } catch (error) {
    console.error("❌ Error al confirmar compra:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al confirmar compra" });
  }
});

router.post("/crear-payment-intent", async (req, res) => {
  try {
    const { items } = req.body;

    const total = items.reduce((sum, item) => sum + item.price, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "eur",
      metadata: {
        userId: "id-mockeado", // opcional, si querés guardar el ID real también podrías
        items: JSON.stringify(
          items.map((i) => ({
            id: i.id,
            type: i.type,
          }))
        ),
      },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ Error creando PaymentIntent:", error);
    res.status(500).send("Error interno");
  }
});



router.post("/confirmar-compra-payment-intent", authMiddleware, async (req, res) => {
    console.log("📩 Se recibió una solicitud para confirmar un PaymentIntent");
  console.log("➡️ ID recibido:", req.body.paymentIntentId);
  try {
    const { paymentIntentId } = req.body;

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!intent || intent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: "El pago no se completó correctamente.",
      });
    }

    const items = intent.metadata?.items
      ? JSON.parse(intent.metadata.items)
      : [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        error: "No se encontraron productos en la metadata.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // ✅ Reutilizamos tu función para registrar la compra
    const { agregados, yaTenia } = await registrarCompraUsuario(user, items);
 console.log("✅ Compra registrada con éxito:", { agregados, yaTenia });
    res.json({ success: true, agregados, yaTenia });
  } catch (error) {
    console.error("❌ Error al confirmar payment intent:", error);
    res.status(500).json({
      success: false,
      error: "Error interno al confirmar la compra",
    });
  }
});


module.exports = router;
