const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Ej: "Invierno 2025"
    description: { type: String, default: "" }, // Para mostrar en el panel
    percentage: { type: Number, default: 0 }, // Ej: 20 = 20%
    amount: { type: Number, default: 0 }, // Ej: 10 = €10 fijo

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true },

    // Aplica a uno o más tipos de elementos
    type: {
      type: String,
      enum: ["course", "formation", "both"], // 'both' si se aplica a ambos
      default: "course"
    },

    // Array de IDs de cursos o formaciones según el tipo
    targetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Discount", discountSchema);
