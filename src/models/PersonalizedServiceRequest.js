const mongoose = require("mongoose");

const personalizedServiceRequestSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["reset", "coaching", "artistic-direction"],
    },
    selectedOption: {
      type: String,
      required: true,
      enum: [
        "reset-full-program",
        "coaching-single-session",
        "coaching-pack-4",
        "coaching-custom",
        "direction-video-feedback",
        "direction-live-session",
        "direction-creative-process",
      ],
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    language: {
      type: String,
      enum: ["es", "en", "fr"],
      default: "es",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    price: {
      type: Number,
      default: null,
      min: 0,
    },
    isCustomPrice: {
      type: Boolean,
      default: false,
    },
    resetEdition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResetEdition",
      default: null,
    },

    isWaitlist: {
      type: Boolean,
      default: false,
    },
    allowOverbooking: {
      type: Boolean,
      default: false,
    },
    capacitySnapshot: {
      type: Number,
      default: null,
    },
    occupiedSnapshot: {
      type: Number,
      default: null,
    },

    paymentLink: {
      type: String,
      default: "",
    },
    stripeSessionId: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "PersonalizedServiceRequest",
  personalizedServiceRequestSchema,
);
