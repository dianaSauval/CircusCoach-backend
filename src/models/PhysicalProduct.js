// src/models/PhysicalProduct.js
const mongoose = require("mongoose");

const LangStringSchema = new mongoose.Schema(
  {
    es: { type: String, trim: true, default: "" },
    en: { type: String, trim: true, default: "" },
    fr: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PhysicalProductSchema = new mongoose.Schema(
  {
    title: {
      type: LangStringSchema,
      required: true,
      validate: {
        validator: function (v) {
          return Boolean(v?.es?.trim() || v?.en?.trim() || v?.fr?.trim());
        },
        message: "El título debe estar completo al menos en un idioma.",
      },
    },

    description: {
      type: LangStringSchema,
      default: () => ({ es: "", en: "", fr: "" }),
    },

    imageUrl: {
      type: String,
      trim: true,
      required: true,
    },

    amazonUrl: {
      type: String,
      trim: true,
      required: true,
    },

    priceEur: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock debe ser un número entero.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PhysicalProduct", PhysicalProductSchema);
