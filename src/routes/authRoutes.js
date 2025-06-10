const express = require("express");
const { register, login, forgotPassword, resetPassword, getUserProfile } = require("../controllers/authController");

const { authMiddleware } = require("../middlewares/authMiddleware")

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword); 

// 🔐 NUEVA RUTA PROTEGIDA CON TU MIDDLEWARE
router.get("/perfil", authMiddleware, getUserProfile);

module.exports = router;
