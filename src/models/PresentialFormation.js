const mongoose = require("mongoose");

const PresentialFormationSchema = new mongoose.Schema({
 title: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" },
  },
  description: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" },
  },
  location: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" },
  },
  dateType: {
    type: String,
    enum: ["single", "range"],
    required: true,
  },
  singleDate: { type: Date }, // si es solo un día
  dateRange: {
    start: { type: Date },
    end: { type: Date },
  },
  time: { type: String }, // Ejemplo: "10:00 a 14:00"
  registrationLink: { type: String },
  });

  module.exports = mongoose.model("PresentialFormationSchema", PresentialFormationSchema);