const mongoose = require("mongoose");

const resetSessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
  },
  { _id: true },
);

const paidParticipantSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const resetEditionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    durationWeeks: {
      type: Number,
      default: 4,
      min: 1,
    },

    totalSessions: {
      type: Number,
      default: 4,
      min: 1,
    },

    sessions: {
      type: [resetSessionSchema],
      default: [],
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 250,
    },

    paidParticipants: {
      type: [paidParticipantSchema],
      default: [],
    },

    // ✅ NUEVO CAMPO
    whatsappGroupLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (value) {
          if (!value) return true; // permite vacío
          return /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/.+/i.test(value);
        },
        message: "El link del grupo de WhatsApp no es válido",
      },
    },

    visible: {
      type: Boolean,
      default: true,
    },

    manuallyClosed: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

resetEditionSchema.pre("validate", function (next) {
  if (this.sessions?.length > 0) {
    this.sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.startDate = this.sessions[0].date;
  }

  if (this.sessions.length > this.totalSessions) {
    return next(
      new Error("La cantidad de encuentros no puede superar totalSessions"),
    );
  }

  if (this.paidParticipants.length > this.capacity) {
    return next(
      new Error(
        "La cantidad de participantes pagos no puede superar la capacidad",
      ),
    );
  }

  next();
});

module.exports = mongoose.model("ResetEdition", resetEditionSchema);
