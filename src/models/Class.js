const mongoose = require("mongoose");

// Subesquema de video multilenguaje
const videoSchema = new mongoose.Schema({
  url: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  title: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  description: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  }
}, { _id: false });

// Subesquema de PDF multilenguaje
const pdfSchema = new mongoose.Schema({
  url: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  title: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  description: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  }
}, { _id: false });

const classSchema = new mongoose.Schema({
  title: {
    es: { type: String, required: true },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  subtitle: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  content: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  secondaryContent: {
    es: { type: String, default: "" },
    en: { type: String, default: "" },
    fr: { type: String, default: "" }
  },
  pdfs: [pdfSchema],     // ✅ Múltiples PDFs multilingües
  videos: [videoSchema],  // ✅ Múltiples videos multilingües
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  visible: {
    es: { type: Boolean, default: false },
    en: { type: Boolean, default: false },
    fr: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("Class", classSchema);
