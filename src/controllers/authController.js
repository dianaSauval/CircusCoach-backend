const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { sendRecoveryEmail } = require("../utils/emailService");



const register = async (req, res) => {
  try {
    const { name, surname, email, password, role } = req.body;

    // ✅ Validar que todos los campos requeridos estén presentes
    if (!name || !surname || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // 🔎 Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // 🔒 Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ✅ Asignar el rol, por defecto "user" si no se especifica
    const userRole = role || "user";

    // 📌 Crear usuario con los campos correctos
    user = new User({
      name,
      surname, // Se incluye el apellido
      email,
      password: hashedPassword,
      role: userRole, 
    });

    await user.save();

    res.status(201).json({ message: "Usuario creado con éxito" });
  } catch (error) {
    console.error("❌ ERROR en /register:", error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 🔑 Generar JWT con el ID y el rol del usuario
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ message: "Login exitoso", token });
  } catch (error) {
    console.error("❌ ERROR en /login:", error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "No se encontró un usuario con ese email." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 1000 * 60 * 30;

    user.resetToken = resetToken;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();
    console.log("📨 Preparando envío de email a:", user.email); // 👉 LOG 1
    await sendRecoveryEmail(user.email, resetToken);
    console.log("✅ Email enviado (al menos intentado)");

    res.json({ message: "Correo de recuperación enviado correctamente." });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Buscar al usuario con el token válido y no expirado
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    console.log("👤 Usuario encontrado:", user);

    if (!user) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    // Hashear y guardar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Limpiar los campos del token
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error en getUserProfile:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};




// EXPORTAMOS AMBAS FUNCIONES
module.exports = { register, login , forgotPassword, resetPassword, getUserProfile};
