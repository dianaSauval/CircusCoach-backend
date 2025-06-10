const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB conectado con éxito");
  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
