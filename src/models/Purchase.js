const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Usuario que compró
  formation: { type: mongoose.Schema.Types.ObjectId, ref: "Formation", required: true }, // Formación comprada
  purchaseDate: { type: Date, default: Date.now }, // Fecha de compra
  expiryDate: { type: Date, required: true }, // Fecha de expiración (1 año después)
  progress: { type: Map, of: Boolean, default: {} }, // Almacena el progreso del usuario en cada clase
});

module.exports = mongoose.model("Purchase", purchaseSchema);
