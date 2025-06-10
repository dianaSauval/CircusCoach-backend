// routes/stripe.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/carrito`,
      metadata: {
        userId: req.user.id,
        items: JSON.stringify(items), // esto lo vamos a usar luego
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
      return res.status(400).json({ success: false, error: "No hay productos para confirmar." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const agregados = [];
    const yaTenia = [];

    for (let item of items) {
      const itemId = item.id.toString();

      if (item.type === "course") {
        const yaComprado = user.cursosComprados.some(id => id.toString() === itemId);
        if (!yaComprado) {
          user.cursosComprados.push(itemId);
          agregados.push(item);
        } else {
          yaTenia.push(item);
        }
      }

      if (item.type === "formation") {
        const yaComprado = user.formacionesCompradas.some(id => id.toString() === itemId);
        if (!yaComprado) {
          user.formacionesCompradas.push(itemId);
          agregados.push(item);
        } else {
          yaTenia.push(item);
        }
      }
    }

    await user.save();

    res.json({ success: true, agregados, yaTenia });
  } catch (error) {
    console.error("❌ Error al confirmar compra:", error);
    res.status(500).json({ success: false, error: "Error al confirmar compra" });
  }
});


module.exports = router;
