const mongoose = require("mongoose");

// Reutilizamos los subesquemas como en el modelo de Class
const videoSchema = new mongoose.Schema({
   _id: { type: String, required: true },
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

const pdfSchema = new mongoose.Schema({
   _id: { type: String, required: true },
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

const courseClassSchema = new mongoose.Schema({
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
  pdfs: [pdfSchema],       // ✅ Múltiples PDFs por clase
  videos: [videoSchema],   // ✅ Múltiples videos por clase
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  visible: {
    es: { type: Boolean, default: false },
    en: { type: Boolean, default: false },
    fr: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model("CourseClass", courseClassSchema);
