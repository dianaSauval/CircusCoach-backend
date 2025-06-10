const mongoose = require("mongoose");

const formationSchema = new mongoose.Schema({
  title: {
    es: { type: String, required: true },
    en: { type: String },
    fr: { type: String }
  },
  description: {
    es: { type: String, required: true },
    en: { type: String },
    fr: { type: String }
  },
  price: { type: Number, required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
  visible: {
    es: { type: Boolean, default: false },
    en: { type: Boolean, default: false },
    fr: { type: Boolean, default: false }
  },
  pdf: {
    es: { type: String },
    en: { type: String },
    fr: { type: String }
  },
  video: {
    es: { type: String },
    en: { type: String },
    fr: { type: String }
  },
  image: {
    es: { type: String },
    en: { type: String },
    fr: { type: String }
  }
});

module.exports = mongoose.model("Formation", formationSchema);


