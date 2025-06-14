const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

dotenv.config();
connectDB();

const app = express();
app.use(cors()); // Habilita CORS

// ⚠️ Webhook de Stripe debe ir antes de express.json()
const stripeWebhook = require("./routes/stripeWebhook");
app.use("/api/stripe", stripeWebhook);

// Ahora sí va el middleware que parsea JSON
app.use(express.json());

// Importar rutas normales
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const formationRoutes = require("./routes/formationRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const classRoutes = require("./routes/classRoutes");
const courseRoutes = require("./routes/courseRoutes");
const courseClassRoutes = require("./routes/courseClassRoutes");
const presentialRoutes = require('./routes/presentialFormationsRoutes');
const pagosRoutes = require("./routes/pagosRoutes");
const uploadRoutes = require("./routes/videoRoutes");
const stripeRoutes = require("./routes/stripe");
const cloudinaryRoutes = require("./routes/cloudinaryRoutes");

// Configuración de rutas
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
app.use("/api/stripe", stripeRoutes); // rutas como /crear-sesion
app.use("/api/cloudinary", cloudinaryRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API de CircusCoach funcionando correctamente");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
