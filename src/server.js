// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

dotenv.config();
connectDB();

const app = express();
app.use(cors());

// ⚠️ 1) Montar el webhook ANTES de express.json()
const stripeWebhook = require("./routes/stripeWebhook"); // o "./routes/webhookRoutes", pero UNO solo
app.use("/api/stripe", stripeWebhook);

// ✅ 2) Ahora sí, el parser JSON global
app.use(express.json());

// ✅ 3) Rutas normales
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const formationRoutes = require("./routes/formationRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const classRoutes = require("./routes/classRoutes");
const courseRoutes = require("./routes/courseRoutes");
const courseClassRoutes = require("./routes/courseClassRoutes");
const presentialRoutes = require("./routes/presentialFormationsRoutes");
const pagosRoutes = require("./routes/pagosRoutes");
const uploadRoutes = require("./routes/videoRoutes");
const stripeRoutes = require("./routes/stripe");
const cloudinaryRoutes = require("./routes/cloudinaryRoutes");
const discountRoutes = require("./routes/discountRoutes");
const physicalProductRoutes = require("./routes/physicalProductRoutes");
const bookRoutes = require("./routes/bookRoutes");



// ✅ 4) Mounts
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/formations", formationRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/course-classes", courseClassRoutes);
app.use("/api/presential-formations", presentialRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stripe", stripeRoutes); // /crear-sesion, /confirmar-compra, etc.
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/physical-products", physicalProductRoutes);
app.use("/api/books", bookRoutes);



app.get("/", (req, res) => {
  res.send("🚀 API de CircusCoach funcionando correctamente");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
