const jwt = require("jsonwebtoken");

// 🔹 Middleware para verificar autenticación de cualquier usuario
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado, se requiere un token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Token inválido" });
  }
};

// 🔹 Middleware para verificar si el usuario es ADMIN
const isAdminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "No autorizado. Solo administradores pueden acceder." });
  }
  next();
};

// ✅ Exportamos correctamente
module.exports = {
  authMiddleware,
  isAdminMiddleware,
};
