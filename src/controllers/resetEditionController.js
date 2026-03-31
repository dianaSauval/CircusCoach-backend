const ResetEdition = require("../models/ResetEdition");

// ======================================
// Helpers
// ======================================

const sortSessionsByDate = (sessions = []) => {
  return [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
};

const getLastSessionDate = (sessions = []) => {
  if (!sessions.length) return null;
  const sorted = sortSessionsByDate(sessions);
  return new Date(sorted[sorted.length - 1].date);
};

const getEditionStatus = (edition) => {
  const now = new Date();
  const sessions = sortSessionsByDate(edition.sessions || []);
  const occupiedSpots = edition.paidParticipants?.length || 0;
  const lastSessionDate = getLastSessionDate(sessions);

  if (lastSessionDate && lastSessionDate < now) {
    return "finished";
  }

  if (edition.manuallyClosed) {
    return "closed";
  }

  if (occupiedSpots >= edition.capacity) {
    return "full";
  }

  return "open";
};

const getEditionComputedData = (edition) => {
  const sessions = sortSessionsByDate(edition.sessions || []);
  const paidParticipants = edition.paidParticipants || [];
  const occupiedSpots = paidParticipants.length;
  const availableSpots = Math.max(edition.capacity - occupiedSpots, 0);
  const status = getEditionStatus(edition);

  return {
    ...edition.toObject(),
    sessions,
    occupiedSpots,
    availableSpots,
    status,
  };
};

const sanitizePublicEdition = (edition) => {
  const computed = getEditionComputedData(edition);

  const {
    paidParticipants,
    manuallyClosed,
    whatsappGroupLink,
    __v,
    ...publicEdition
  } = computed;

  return publicEdition;
};

const normalizeString = (value = "") => value.trim().toLowerCase();

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

const validateSessions = (sessions, totalSessions) => {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return "sessions debe ser un array con al menos un encuentro";
  }

  if (sessions.length > totalSessions) {
    return "La cantidad de encuentros no puede superar totalSessions";
  }

  const invalidDate = sessions.some(
    (session) =>
      !session?.date || Number.isNaN(new Date(session.date).getTime()),
  );

  if (invalidDate) {
    return "Todos los encuentros deben tener una fecha válida";
  }

  return null;
};

const validatePaidParticipantsArray = (participants, capacity) => {
  if (!Array.isArray(participants)) {
    return "paidParticipants debe ser un array";
  }

  if (participants.length > capacity) {
    return "La cantidad de participantes pagos no puede superar la capacidad";
  }

  const seenEmails = new Set();
  const seenNames = new Set();

  for (const participant of participants) {
    const firstName = participant?.firstName?.trim();
    const lastName = participant?.lastName?.trim();
    const email = normalizeString(participant?.email || "");

    if (!firstName || !lastName) {
      return "Cada participante pago debe tener firstName y lastName";
    }

    if (email) {
      if (seenEmails.has(email)) {
        return "No puede haber participantes pagos duplicados por email";
      }
      seenEmails.add(email);
    } else {
      const fullNameKey = `${normalizeString(firstName)}|${normalizeString(lastName)}`;
      if (seenNames.has(fullNameKey)) {
        return "No puede haber participantes pagos duplicados por nombre y apellido";
      }
      seenNames.add(fullNameKey);
    }
  }

  return null;
};

const buildEditionResponse = (edition) => getEditionComputedData(edition);

// ======================================
// ADMIN - crear edición
// ======================================

const createResetEdition = async (req, res) => {
  try {
    const {
      title,
      startDate,
      durationWeeks = 4,
      totalSessions = 4,
      sessions = [],
      capacity = 10,
      price = 250,
      visible = true,
      manuallyClosed = false,
      notes = "",
      paidParticipants = [],
      whatsappGroupLink = "",
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "title es obligatorio" });
    }

    const sessionsError = validateSessions(sessions, totalSessions);
    if (sessionsError) {
      return res.status(400).json({ error: sessionsError });
    }

    const participantsError = validatePaidParticipantsArray(
      paidParticipants,
      capacity,
    );
    if (participantsError) {
      return res.status(400).json({ error: participantsError });
    }

    const sortedSessions = sortSessionsByDate(sessions);

    const newEdition = new ResetEdition({
      title: title.trim(),
      startDate: startDate || sortedSessions[0].date,
      durationWeeks,
      totalSessions,
      sessions: sortedSessions,
      capacity,
      price,
      visible,
      manuallyClosed,
      notes: notes?.trim() || "",
      paidParticipants,
      whatsappGroupLink: whatsappGroupLink?.trim() || "",
    });

    await newEdition.save();

    res.status(201).json({
      message: "Edición de RESET creada con éxito",
      edition: buildEditionResponse(newEdition),
    });
  } catch (error) {
    console.error("Error creando edición de RESET:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error.errors)[0].message,
      });
    }

    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - listar todas
// ======================================

const getAllResetEditions = async (req, res) => {
  try {
    const editions = await ResetEdition.find().sort({ startDate: 1 });

    const editionsWithComputedData = editions.map(buildEditionResponse);

    res.json(editionsWithComputedData);
  } catch (error) {
    console.error("Error obteniendo ediciones de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// PÚBLICO - listar visibles y no finalizadas
// ======================================

const getPublicResetEditions = async (req, res) => {
  try {
    const editions = await ResetEdition.find({
      visible: true,
    }).sort({ startDate: 1 });

    const publicEditions = editions
      .filter((edition) => getEditionStatus(edition) !== "finished")
      .map(sanitizePublicEdition);

    res.json(publicEditions);
  } catch (error) {
    console.error("Error obteniendo ediciones públicas de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - obtener por id
// ======================================

const getResetEditionById = async (req, res) => {
  try {
    const edition = await ResetEdition.findById(req.params.id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    res.json(buildEditionResponse(edition));
  } catch (error) {
    console.error("Error obteniendo edición de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - actualizar edición
// ======================================

const updateResetEdition = async (req, res) => {
  try {
    const edition = await ResetEdition.findById(req.params.id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    if (req.body.paidParticipants !== undefined) {
      return res.status(400).json({
        error:
          "paidParticipants no se puede editar desde este endpoint. Usa los endpoints específicos de participantes pagos.",
      });
    }

    const fields = [
      "title",
      "startDate",
      "durationWeeks",
      "totalSessions",
      "capacity",
      "price",
      "visible",
      "manuallyClosed",
      "notes",
      "whatsappGroupLink",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "title" && typeof req.body[field] === "string") {
          edition[field] = req.body[field].trim();
        } else if (field === "notes" && typeof req.body[field] === "string") {
          edition[field] = req.body[field].trim();
        } else if (
          field === "whatsappGroupLink" &&
          typeof req.body[field] === "string"
        ) {
          edition[field] = req.body[field].trim();
        } else {
          edition[field] = req.body[field];
        }
      }
    });

    if (req.body.sessions !== undefined) {
      const nextTotalSessions =
        req.body.totalSessions !== undefined
          ? req.body.totalSessions
          : edition.totalSessions;

      const sessionsError = validateSessions(
        req.body.sessions,
        nextTotalSessions,
      );
      if (sessionsError) {
        return res.status(400).json({ error: sessionsError });
      }

      edition.sessions = sortSessionsByDate(req.body.sessions);
    }

    if ((edition.paidParticipants?.length || 0) > edition.capacity) {
      return res.status(400).json({
        error:
          "La capacidad no puede ser menor a la cantidad de participantes pagos",
      });
    }

    await edition.save();

    res.json({
      message: "Edición actualizada con éxito",
      edition: buildEditionResponse(edition),
    });
  } catch (error) {
    console.error("Error actualizando edición de RESET:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error.errors)[0].message,
      });
    }

    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - agregar participante pago
// ======================================

const addPaidParticipantToResetEdition = async (req, res) => {
  try {
    const edition = await ResetEdition.findById(req.params.id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    const currentStatus = getEditionStatus(edition);

    if (currentStatus === "finished") {
      return res.status(400).json({
        error: "No se pueden agregar participantes a una edición finalizada",
      });
    }

    if (currentStatus === "closed") {
      return res.status(400).json({
        error: "La edición está cerrada manualmente",
      });
    }

    if ((edition.paidParticipants?.length || 0) >= edition.capacity) {
      return res.status(400).json({
        error: "La edición ya alcanzó su capacidad máxima",
      });
    }

    const { firstName, lastName, email = "", paymentDate } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        error: "firstName y lastName son obligatorios",
      });
    }

    const newParticipant = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    };

    if (
      newParticipant.paymentDate &&
      Number.isNaN(newParticipant.paymentDate.getTime())
    ) {
      return res.status(400).json({
        error: "paymentDate no es una fecha válida",
      });
    }

    if (isDuplicateParticipant(edition.paidParticipants, newParticipant)) {
      return res.status(400).json({
        error: "Ese participante ya figura como pagado en esta edición",
      });
    }

    edition.paidParticipants.push(newParticipant);
    await edition.save();

    res.json({
      message: "Participante pago agregado con éxito",
      edition: buildEditionResponse(edition),
    });
  } catch (error) {
    console.error("Error agregando participante pago a RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - eliminar participante pago
// ======================================

const removePaidParticipantFromResetEdition = async (req, res) => {
  try {
    const { id, participantId } = req.params;

    const edition = await ResetEdition.findById(id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    const participant = edition.paidParticipants.id(participantId);

    if (!participant) {
      return res.status(404).json({ error: "Participante no encontrado" });
    }

    participant.deleteOne();
    await edition.save();

    res.json({
      message: "Participante pago eliminado con éxito",
      edition: buildEditionResponse(edition),
    });
  } catch (error) {
    console.error("Error eliminando participante pago de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - abrir / cerrar manualmente edición
// ======================================

const toggleResetEditionClosed = async (req, res) => {
  try {
    const edition = await ResetEdition.findById(req.params.id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    const currentStatus = getEditionStatus(edition);

    if (currentStatus === "finished") {
      return res.status(400).json({
        error: "No se puede abrir o cerrar manualmente una edición finalizada",
      });
    }

    if (typeof req.body.manuallyClosed !== "boolean") {
      return res.status(400).json({
        error: "Debes enviar manuallyClosed como boolean",
      });
    }

    edition.manuallyClosed = req.body.manuallyClosed;
    await edition.save();

    res.json({
      message: edition.manuallyClosed
        ? "Edición cerrada manualmente"
        : "Edición reabierta correctamente",
      edition: buildEditionResponse(edition),
    });
  } catch (error) {
    console.error("Error cambiando estado manual de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================================
// ADMIN - eliminar edición
// Solo si está finished
// ======================================

const deleteResetEdition = async (req, res) => {
  try {
    const edition = await ResetEdition.findById(req.params.id);

    if (!edition) {
      return res.status(404).json({ error: "Edición no encontrada" });
    }

    const status = getEditionStatus(edition);

    if (status !== "finished") {
      return res.status(400).json({
        error: "Solo se pueden eliminar ediciones realizadas",
      });
    }

    await ResetEdition.findByIdAndDelete(req.params.id);

    res.json({ message: "Edición eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando edición de RESET:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = {
  createResetEdition,
  getAllResetEditions,
  getPublicResetEditions,
  getResetEditionById,
  updateResetEdition,
  addPaidParticipantToResetEdition,
  removePaidParticipantFromResetEdition,
  toggleResetEditionClosed,
  deleteResetEdition,
};
