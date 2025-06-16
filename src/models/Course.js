const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    es: { type: String, required: true },
    en: { type: String },
    fr: { type: String },
  },
  description: {
    es: { type: String, required: true },
    en: { type: String },
    fr: { type: String },
  },
  price: { type: Number, required: true },
  image: {
    es: { type: String },
    en: { type: String },
    fr: { type: String },
  },
  pdf: {
    es: { type: String },
    en: { type: String },
    fr: { type: String },
  },
  public_id_pdf: {
  es: { type: String },
  en: { type: String },
  fr: { type: String },
},
  video: {
    es: { type: String },
    en: { type: String },
    fr: { type: String },
  },
  visible: {
    es: { type: Boolean, default: false },
    en: { type: Boolean, default: false },
    fr: { type: Boolean, default: false },
  },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseClass" }]
});

module.exports = mongoose.model("Course", courseSchema);

