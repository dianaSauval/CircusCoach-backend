const mongoose = require("mongoose");

const LangStringSchema = new mongoose.Schema(
  {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" },
  },
  { _id: false }
);

const discountSchema = new mongoose.Schema(
  {
    // ✅ multilenguaje
    name: { type: LangStringSchema, required: true },
    // ✅ multilenguaje (opcional)
    description: { type: LangStringSchema, default: () => ({ es: "", en: "", fr: "" }) },

    percentage: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    active: { type: Boolean, default: true },

    type: {
      type: String,
      enum: ["course", "formation", "both"],
      default: "course",
    },

    targetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
    ],

    // ✅ mejor hacerlo multilenguaje para que se vea bien en EN/FR
    targetItems: [
      {
        _id: { type: String, required: true },
        title: { type: LangStringSchema, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", discountSchema);
