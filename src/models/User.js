const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },

  resetToken: { type: String },
  resetTokenExpire: { type: Date },

  cursosComprados: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
  ],
  formacionesCompradas: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Formation" }
  ],

  progresoCursos: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      clasesCompletadas: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseClass" }]
    }
  ],

  progresoFormaciones: [
    {
      formationId: { type: mongoose.Schema.Types.ObjectId, ref: "Formation" },
      clasesCompletadas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }]
    }
  ],
  aceptacionTerminos: [
  {
    tipo: { type: String, enum: ["curso", "formacion"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Course o Formation
    aceptado: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now },
  }
],
});

module.exports = mongoose.model("User", userSchema);

