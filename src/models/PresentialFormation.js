const mongoose = require("mongoose");

const PresentialFormationSchema = new mongoose.Schema({
    title: {
      es: { type: String, required: true },
      en: { type: String, required: true },
      fr: { type: String, required: true }
    },
    description: {
      es: { type: String, required: true },
      en: { type: String, required: true },
      fr: { type: String, required: true }
    },
    location: {
      es: { type: String, required: true },
      en: { type: String, required: true },
      fr: { type: String, required: true }
    },
    dateType: {
      type: String,
      enum: ['single', 'range'],
      required: true
    },
    singleDate: { type: Date }, // si es solo un día
    dateRange: {
      start: { type: Date },
      end: { type: Date }
    },
    time: { type: String }, // Ejemplo: "10:00 a 14:00"
    registrationLink: { type: String }
  });

  module.exports = mongoose.model("PresentialFormationSchema", PresentialFormationSchema);