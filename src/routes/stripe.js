// routes/stripe.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const registrarCompraUsuario = require("../utils/registrarCompraUsuario");
const User = require("../models/User");
const sendPurchaseEmail = require("../utils/sendPurchaseEmail");
const Course = require("../models/Course");
const Formation = require("../models/Formation");
const Book = require("../models/Book");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Crear sesión de Checkout
router.post("/crear-sesion", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title?.es || item.title || "Producto",
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
      payment_intent_data: {
        statement_descriptor: "MYCIRCUSCOACH",
        statement_descriptor_suffix: "COURSES",
        payment_method_options: {
          card: { request_three_d_secure: "automatic" },
        },
        metadata: { userId: req.user.id, items: JSON.stringify(minimalItems) },
      },
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

// Confirmar compra (Checkout): SIN email aquí (lo maneja el webhook)
// La usamos para dar feedback rápido al frontend y, si querés, también registrar.
// Si preferís que SOLO el webhook registre, podés devolver 200 sin registrar aquí.
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

    // Opción A (recomendada): NO registrar aquí y dejar que el webhook sea la fuente de verdad.
    // return res.json({ success: true, message: "Compra recibida. En breve se confirmará." });

    // Opción B: Registrar aquí también para reflejar acceso inmediato (deduplicado por intent).
    // Usamos payment_intent para deduplicar exactamente igual que en el webhook.
    const paymentIntentId = session.payment_intent || session.id;

    const { agregados, yaTenia } = await registrarCompraUsuario(
      req.user.id,
      items,
      paymentIntentId
    );

    // No enviamos email aquí. El webhook lo hará.
    res.json({ success: true, agregados, yaTenia });
  } catch (error) {
    console.error("❌ Error al confirmar compra:", error);
    res
      .status(500)
      .json({ success: false, error: "Error al confirmar compra" });
  }
});

// Crear PaymentIntent (Elements)
router.post("/crear-payment-intent", async (req, res) => {
  try {
    const { items } = req.body;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    // total en centavos y con validación defensiva
    const amount = Math.round(Number(total) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Monto inválido" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      // ✅ Deja que Stripe habilite solo lo disponible en tu cuenta
      automatic_payment_methods: { enabled: true },
      statement_descriptor: "MYCIRCUSCOACH",
      statement_descriptor_suffix: "COURSES",
      payment_method_options: {
        card: { request_three_d_secure: "automatic" }, // SCA si el banco lo pide
      },
      metadata: {
        userId: "id-mockeado", // si tenés el real, reemplazalo en producción
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

// Confirmar PaymentIntent (Elements): SIN email aquí (puedes enviarlo aquí si quieres).
router.post(
  "/confirmar-compra-payment-intent",
  authMiddleware,
  async (req, res) => {
    console.log("📩 Se recibió una solicitud para confirmar un PaymentIntent");
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

      // 1) Registrar compra (con deduplicación por paymentIntentId)
      // ✅ Usa el ID real del intent para deduplicar
      const { agregados, yaTenia, yaProcesado } = await registrarCompraUsuario(
        req.user.id,
        items,
        intent.id
      );

      if (yaProcesado) {
        console.log("⚠️ Este PaymentIntent ya fue procesado anteriormente");
        return res.status(200).json({
          success: true,
          message: "Este pago ya fue confirmado antes",
          agregados: [],
          yaTenia: [],
        });
      }

      // 2) Construir "order" consultando la DB (no hay lineItems en PI)
      const orderItems = [];
      for (const it of items) {
        let title = "Contenido digital",
          price = 0,
          type = it.type || "digital";
        if (it.type === "course") {
          const c = await Course.findById(it.id);
          title = c?.title?.es || c?.title?.en || "Curso";
          price = c?.price || 0;
        } else if (it.type === "formation") {
          const f = await Formation.findById(it.id);
          title = f?.title?.es || f?.title?.en || "Formación";
          price = f?.price || 0;
        } else if (it.type === "book") {
          const b = await Book.findById(it.id);
          title = b?.title || "Libro";
          price = b?.price || 0;
        }

        orderItems.push({ title, type, price, qty: 1 });
      }

      const subtotal = orderItems.reduce(
        (s, i) => s + i.price * (i.qty || 1),
        0
      );
      const shipping = 0;
      const taxes = 0;
      const total = subtotal + shipping + taxes;

      // 3) Enviar email al comprador (NO BLOQUEANTE)
      const user = await User.findById(req.user.id);

      let emailSent = false;
      try {
        await sendPurchaseEmail({
          to: user.email,
          buyer: { name: user.name, surname: user.surname },
          order: {
            items: orderItems,
            subtotal,
            shipping,
            taxes,
            total,
            deliveryOrAccessDate: "inmediata",
          },
          vendor: {
            tradeName: "CircusCoach / Productions associées asbl",
            vat: "BE 0896.755.397",
            address: "rue Coenraets 72, 1060 Bruselas, Bélgica",
            email: "circuscoachbyrociogarrote@gmail.com",
            claimsEmail: "circuscoachbyrociogarrote@gmail.com",
          },
          policyLinks: {
            termsUrl:
              process.env.TERMS_URL || "https://www.mycircuscoach.com/terminos",
          },
        });
        emailSent = true;
        console.log(`✅ Email de confirmación (PI) enviado a ${user.email}`);
      } catch (e) {
        // ⚠️ Importante: NO hacemos return 500
        console.error(
          "⚠️ Falló el envío de email (PI):",
          e.code,
          e.response?.body || e.message
        );
      }

      // Respondemos éxito igual; si falló el mail, avisamos al front
      return res.json({ success: true, agregados, yaTenia, emailSent });
    } catch (error) {
      console.error(
        "❌ Error al confirmar payment intent (y enviar email):",
        error
      );
      return res.status(500).json({
        success: false,
        error: "Error interno al confirmar la compra",
      });
    }
  }
);

module.exports = router;
