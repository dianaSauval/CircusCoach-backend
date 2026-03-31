const mongoose = require("mongoose");
const Stripe = require("stripe");
const PersonalizedServiceRequest = require("../models/PersonalizedServiceRequest");
const ResetEdition = require("../models/ResetEdition");
const sendPersonalizedServiceEmail = require("../utils/sendPersonalizedServiceEmail");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_BY_OPTION = {
  "reset-full-program": 250,
  "coaching-single-session": 80,
  "coaching-pack-4": 300,
  "coaching-custom": 0,
  "direction-video-feedback": 60,
  "direction-live-session": 90,
  "direction-creative-process": 0,
};

const getReadableTitle = (selectedOption) => {
  const labels = {
    "reset-full-program": "RESET – Programa grupal transformador",
    "coaching-single-session": "Coaching 1:1 – Sesión individual",
    "coaching-pack-4": "Coaching 1:1 – Pack de 4 sesiones",
    "coaching-custom": "Coaching 1:1 – Pack personalizado",
    "direction-video-feedback": "Dirección acrobática – Feedback por video",
    "direction-live-session": "Dirección acrobática – Sesión en vivo",
    "direction-creative-process": "Dirección acrobática – Proceso de creación",
  };

  return labels[selectedOption] || "Servicio personalizado";
};

const syncResetEditionStatus = (edition) => {
  if (!edition) return;

  if (edition.status === "closed") return;

  if (edition.occupiedSpots >= edition.capacity) {
    edition.status = "full";
  } else {
    edition.status = "open";
  }
};

// PÚBLICO
const createRequest = async (req, res) => {
  try {
    const {
      firstName,
      lastName = "",
      email,
      whatsapp = "",
      serviceType,
      selectedOption,
      experience = "",
      message = "",
      language = "es",
      resetEdition,
    } = req.body;

    if (!firstName || !email || !serviceType || !selectedOption) {
      return res.status(400).json({
        error:
          "firstName, email, serviceType y selectedOption son obligatorios",
      });
    }

    if (serviceType === "reset" && selectedOption !== "reset-full-program") {
      return res.status(400).json({
        error: "La opción elegida no corresponde al servicio RESET",
      });
    }

    if (
      serviceType === "coaching" &&
      ![
        "coaching-single-session",
        "coaching-pack-4",
        "coaching-custom",
      ].includes(selectedOption)
    ) {
      return res.status(400).json({
        error: "La opción elegida no corresponde al servicio coaching",
      });
    }

    if (
      serviceType === "artistic-direction" &&
      ![
        "direction-video-feedback",
        "direction-live-session",
        "direction-creative-process",
      ].includes(selectedOption)
    ) {
      return res.status(400).json({
        error: "La opción elegida no corresponde a dirección artística",
      });
    }

    let finalPrice = PRICE_BY_OPTION[selectedOption];
    let isCustomPrice = finalPrice === 0;
    let isWaitlist = false;
    let capacitySnapshot = null;
    let occupiedSnapshot = null;
    let resetEditionDoc = null;

    if (serviceType === "reset") {
      if (!resetEdition) {
        return res.status(400).json({
          error: "Para RESET debés seleccionar una edición",
        });
      }

      const edition = await ResetEdition.findById(resetEdition);

      if (!edition) {
        return res.status(404).json({
          error: "La edición de RESET no existe",
        });
      }

      if (!edition.visible) {
        return res.status(400).json({
          error: "La edición seleccionada no está disponible",
        });
      }

      if (edition.status === "closed") {
        return res.status(400).json({
          error: "La edición seleccionada está cerrada",
        });
      }

      finalPrice = edition.price;
      isCustomPrice = false;
      resetEditionDoc = edition;
      capacitySnapshot = edition.capacity;
      occupiedSnapshot = edition.occupiedSpots;

      const editionIsFull =
        edition.status === "full" || edition.occupiedSpots >= edition.capacity;

      if (editionIsFull) {
        isWaitlist = true;
      }
    }

    const newRequest = new PersonalizedServiceRequest({
      firstName,
      lastName,
      email,
      whatsapp,
      serviceType,
      selectedOption,
      experience,
      message,
      language,
      price: isCustomPrice ? null : finalPrice,
      isCustomPrice,
      resetEdition: serviceType === "reset" ? resetEdition : null,
      isWaitlist,
      allowOverbooking: false,
      capacitySnapshot,
      occupiedSnapshot,
    });

    await newRequest.save();

    try {
      await sendPersonalizedServiceEmail({
        type: "received",
        to: email,
        firstName,
        serviceType,
        selectedOption,
        price: isCustomPrice ? null : finalPrice,
        isCustomPrice,
      });
    } catch (mailError) {
      console.error("Error enviando mail de recepción al cliente:", mailError);
    }

    try {
      await sendPersonalizedServiceEmail({
        type: "admin-new-request",
        to:
          process.env.PERSONALIZED_SERVICES_ADMIN_EMAIL ||
          "circuscoachbyrociogarrote@gmail.com",
        firstName,
        lastName,
        email,
        whatsapp,
        serviceType,
        selectedOption,
        price: isCustomPrice ? null : finalPrice,
        isCustomPrice,
        experience,
        message,
        isWaitlist,
        resetEditionTitle: resetEditionDoc?.title || "",
        capacitySnapshot,
        occupiedSnapshot,
      });
    } catch (mailError) {
      console.error("Error enviando mail al admin:", mailError);
    }

    res.status(201).json({
      message: "Solicitud enviada correctamente",
      request: newRequest,
    });
  } catch (error) {
    console.error("Error creando solicitud personalizada:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ADMIN
const getAllRequests = async (req, res) => {
  try {
    const { status, serviceType, resetEdition } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (serviceType) filters.serviceType = serviceType;

    if (resetEdition) {
      if (!mongoose.Types.ObjectId.isValid(resetEdition)) {
        return res.status(400).json({
          error: "resetEdition no es un id válido",
        });
      }

      filters.resetEdition = resetEdition;
    }

    const requests = await PersonalizedServiceRequest.find(filters)
      .populate("resetEdition")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error obteniendo solicitudes:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await PersonalizedServiceRequest.findById(
      req.params.id,
    ).populate("resetEdition");

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error obteniendo solicitud:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const setCustomPrice = async (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({
        error: "El precio debe ser mayor a 0",
      });
    }

    const request = await PersonalizedServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    if (!request.isCustomPrice) {
      return res.status(400).json({
        error: "Esta solicitud no requiere un precio personalizado",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: "Solo podés definir el precio en solicitudes pendientes",
      });
    }

    request.price = Number(price);

    await request.save();

    res.json({
      message: "Precio definido correctamente",
      request,
    });
  } catch (error) {
    console.error("Error definiendo precio personalizado:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { adminNotes = "" } = req.body;

    const request = await PersonalizedServiceRequest.findById(
      req.params.id,
    ).populate("resetEdition");

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: "Solo se pueden aprobar solicitudes pendientes",
      });
    }

    if (request.isCustomPrice && (request.price === null || request.price <= 0)) {
      return res.status(400).json({
        error: "Debés definir un precio antes de aprobar esta solicitud",
      });
    }

    if (request.serviceType === "reset") {
      if (!request.resetEdition) {
        return res.status(400).json({
          error: "La solicitud de RESET no tiene edición asociada",
        });
      }

      const edition = await ResetEdition.findById(request.resetEdition._id);

      if (!edition) {
        return res.status(404).json({
          error: "La edición de RESET ya no existe",
        });
      }

      if (!edition.visible) {
        return res.status(400).json({
          error: "La edición de RESET ya no está visible",
        });
      }

      if (edition.status === "closed") {
        return res.status(400).json({
          error: "La edición de RESET está cerrada",
        });
      }

      request.capacitySnapshot = edition.capacity;
      request.occupiedSnapshot = edition.occupiedSpots;

      const editionIsFull =
        edition.status === "full" || edition.occupiedSpots >= edition.capacity;

      request.allowOverbooking = editionIsFull;
      request.isWaitlist = editionIsFull;

      request.resetEdition = edition._id;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: request.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: getReadableTitle(request.selectedOption),
            },
            unit_amount: Math.round(request.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/servicios/pago-confirmado?session_id={CHECKOUT_SESSION_ID}&serviceType=${request.serviceType}&selectedOption=${request.selectedOption}`,
      cancel_url: `${process.env.CLIENT_URL}/servicios/pago-cancelado?serviceType=${request.serviceType}`,
      metadata: {
        personalizedRequestId: request._id.toString(),
        serviceType: request.serviceType,
        selectedOption: request.selectedOption,
        kind: "personalized-service",
      },
    });

    request.status = "approved";
    request.adminNotes = adminNotes;
    request.approvedAt = new Date();
    request.paymentLink = session.url || "";
    request.stripeSessionId = session.id;

    await request.save();

    try {
      await sendPersonalizedServiceEmail({
        type: "approved",
        to: request.email,
        firstName: request.firstName,
        serviceType: request.serviceType,
        selectedOption: request.selectedOption,
        price: request.price,
        paymentUrl: request.paymentLink,
        adminNotes,
        isWaitlist: request.isWaitlist,
        allowOverbooking: request.allowOverbooking,
        isCustomPrice: request.isCustomPrice,
      });
    } catch (mailError) {
      console.error("Error enviando mail de aprobación:", mailError);
    }

    res.json({
      message: "Solicitud aprobada correctamente",
      request,
    });
  } catch (error) {
    console.error("Error aprobando solicitud:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { adminNotes = "" } = req.body;

    const request = await PersonalizedServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: "Solo se pueden rechazar solicitudes pendientes",
      });
    }

    request.status = "rejected";
    request.adminNotes = adminNotes;
    request.rejectedAt = new Date();

    await request.save();

    try {
      await sendPersonalizedServiceEmail({
        type: "rejected",
        to: request.email,
        firstName: request.firstName,
        serviceType: request.serviceType,
        selectedOption: request.selectedOption,
        price: request.price,
        adminNotes,
        isCustomPrice: request.isCustomPrice,
      });
    } catch (mailError) {
      console.error("Error enviando mail de rechazo:", mailError);
    }

    res.json({
      message: "Solicitud rechazada correctamente",
      request,
    });
  } catch (error) {
    console.error("Error rechazando solicitud:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  setCustomPrice,
  approveRequest,
  rejectRequest,
};