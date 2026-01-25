// models/Book.js
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ Idioma del libro (para mostrarlo en el front)
    // Podés ampliar esto si algún día agregás más idiomas
    language: {
      type: String,
      required: true,
      enum: ["es", "en", "fr"],
      default: "es",
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ PDF del libro (uno solo)
    pdf: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    // (Opcional pero muy útil en tienda)
    coverImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    // ✅ Control de publicación del producto
    visible: {
      type: Boolean,
      default: false,
    },

    // ✅ Para tenerlo bien etiquetado si después suman otros formatos
    type: {
      type: String,
      default: "ebook_pdf",
    },

    // ✅ Para dejar explícito qué permite este producto
    access: {
      viewOnline: { type: Boolean, default: true },
      downloadable: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);
