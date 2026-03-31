// routes/stripeWebhook.js
const express = require("express");
const Stripe = require("stripe");
const router = express.Router();

const User = require("../models/User");
const PersonalizedServiceRequest = require("../models/PersonalizedServiceRequest");
const ResetEdition = require("../models/ResetEdition");

const registrarCompraUsuario = require("../utils/registrarCompraUsuario");
const sendPurchaseEmail = require("../utils/sendPurchaseEmail");
const sendPersonalizedServiceEmail = require("../utils/sendPersonalizedServiceEmail");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const normalizeString = (value = "") => String(value).trim().toLowerCase();

const isDuplicateParticipant = (participants = [], candidate = {}) => {
  const candidateEmail = normalizeString(candidate.email || "");
  const candidateFirstName = normalizeString(candidate.firstName || "");
  const candidateLastName = normalizeString(candidate.lastName || "");

  return participants.some((participant) => {
    const participantEmail = normalizeString(participant.email || "");
    const participantFirstName = normalizeString(participant.firstName || "");
    const participantLastName = normalizeString(participant.lastName || "");

    if (candidateEmail && participantEmail) {
      return candidateEmail === participantEmail;
    }

    return (
      candidateFirstName &&
      candidateLastName &&
      candidateFirstName === participantFirstName &&
      candidateLastName === participantLastName
    );
  });
};

// ⚠️ Esta ruta debe montarse antes de express.json() en server.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      console.log("✅ Firma del webhook verificada correctamente");
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log("📩 Evento recibido:", event.type);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        console.log("🔥 checkout.session.completed recibido");
        console.log("👉 metadata completa:", session.metadata);

        // =========================================================
        // A) PAGO EXITOSO DE SERVICIO PERSONALIZADO
        // =========================================================
        if (session.metadata?.kind === "personalized-service") {
          console.log("✅ Entró al flujo de servicio personalizado");

          const personalizedRequestId = session.metadata?.personalizedRequestId;
          console.log("👉 personalizedRequestId:", personalizedRequestId);

          if (!personalizedRequestId) {
            console.warn(
              "⚠️ Webhook de servicio personalizado sin personalizedRequestId"
            );
            return res.status(200).send("OK");
          }

          const request = await PersonalizedServiceRequest.findById(
            personalizedRequestId
          ).populate("resetEdition");

          if (!request) {
            console.warn("⚠️ Solicitud personalizada no encontrada en webhook");
            return res.status(200).send("OK");
          }

          console.log("👉 Solicitud encontrada:", request._id.toString());
          console.log("👉 Estado actual:", request.status);

          if (request.status === "paid") {
            console.log("⚠️ Solicitud personalizada ya marcada como pagada");
            return res.status(200).send("OK");
          }

          let edition = null;

          if (request.serviceType === "reset" && request.resetEdition) {
            edition = await ResetEdition.findById(request.resetEdition._id);

            if (!edition) {
              console.warn("⚠️ No se encontró la edición RESET asociada");
              return res.status(200).send("OK");
            }

            if (edition.manuallyClosed) {
              console.warn(
                "⚠️ La edición RESET está cerrada manualmente. No se procesa el cupo."
              );
              return res.status(200).send("OK");
            }

            const paidCount = edition.paidParticipants?.length || 0;
            const editionIsFull = paidCount >= edition.capacity;

            if (editionIsFull && !request.allowOverbooking) {
              console.warn(
                "⚠️ La edición está llena y esta solicitud no tiene sobrecupo autorizado."
              );
              return res.status(200).send("OK");
            }
          }

          // ✅ marcar solicitud como pagada
          request.status = "paid";
          request.paidAt = new Date();

          console.log("👉 Marcando solicitud como paid...");
          await request.save();
          console.log("✅ Solicitud guardada como paid");

          // ✅ si es RESET, agregar participante pago
          if (request.serviceType === "reset" && edition) {
            const participantData = {
              firstName: request.firstName?.trim() || "Sin nombre",
              lastName: request.lastName?.trim() || "Sin apellido",
              email: request.email?.trim().toLowerCase() || "",
              paymentDate: new Date(),
            };

            const alreadyExists = isDuplicateParticipant(
              edition.paidParticipants,
              participantData
            );

            if (alreadyExists) {
              console.log(
                "⚠️ El participante ya figura en paidParticipants. No se duplica."
              );
            } else {
              edition.paidParticipants.push(participantData);
              await edition.save();
              console.log("✅ Participante agregado a paidParticipants");
            }
          }

          // ✅ mail al cliente
          try {
            await sendPersonalizedServiceEmail({
              type: "paid",
              to: request.email,
              firstName: request.firstName,
              serviceType: request.serviceType,
              selectedOption: request.selectedOption,
              price: request.price,
              whatsappGroupLink:
                request.serviceType === "reset"
                  ? request.resetEdition?.whatsappGroupLink || ""
                  : "",
            });

            console.log(
              `✅ Email de pago personalizado enviado a ${request.email}`
            );
          } catch (mailError) {
            console.error(
              "⚠️ Error enviando email de pago personalizado:",
              mailError
            );
          }

          return res.status(200).send("OK");
        }

        // =========================================================
        // B) PAGO EXITOSO DE COMPRA NORMAL DEL SITIO
        // =========================================================
        console.log("🛒 Entró al flujo de compra normal");

        const userId = session.metadata?.userId;
        const items = session.metadata?.items
          ? JSON.parse(session.metadata.items)
          : [];

        if (!userId || !items.length) {
          console.warn("⚠️ Webhook sin userId o items");
          return res.status(200).send("OK");
        }

        const paymentIntentId = session.payment_intent || session.id;

        const { yaProcesado } = await registrarCompraUsuario(
          userId,
          items,
          paymentIntentId
        );

        if (yaProcesado) {
          console.log("⚠️ Pago ya procesado. No se envía email duplicado.");
          return res.status(200).send("OK");
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          limit: 100,
        });

        const orderItems = lineItems.data.map((li) => ({
          title: li.description,
          type: "digital",
          price: (li.amount_total ?? li.amount_subtotal) / 100,
          qty: li.quantity || 1,
        }));

        const subtotal = orderItems.reduce(
          (s, i) => s + i.price * (i.qty || 1),
          0
        );
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

        console.log(`✅ Email de confirmación enviado a ${user.email}`);
      }

      return res.status(200).send("✅ Webhook recibido");
    } catch (e) {
      console.error("❌ Error al procesar webhook:", e);
      return res.status(500).send("Error procesando webhook");
    }
  }
);

module.exports = router;