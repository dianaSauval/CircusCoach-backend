const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getComprasDelUsuario,

  // Cursos
  comprarCurso,
  marcarClaseCurso,
  desmarcarClaseCurso,
  obtenerProgresoCurso,

  // Formaciones
  marcarClaseFormacion,
  desmarcarClaseFormacion,
  obtenerProgresoFormacion
} = require("../controllers/userController");

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();


// 🔹 Compras
router.get("/mis-compras", authMiddleware, getComprasDelUsuario);

// 🔹 Usuarios
router.get("/", authMiddleware, isAdminMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.post("/", createUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, isAdminMiddleware, deleteUser);

// 🔹 Compras
router.post("/:id/comprar/:courseId", authMiddleware, comprarCurso);

// 🔹 Progreso en Cursos
router.post("/:id/progreso-curso/:courseId", authMiddleware, marcarClaseCurso);
router.delete("/:id/progreso-curso/:courseId/:classId", authMiddleware, desmarcarClaseCurso);
router.get("/:id/progreso-curso/:courseId", authMiddleware, obtenerProgresoCurso);

// 🔹 Progreso en Formaciones
router.post("/:id/progreso-formacion/:formationId", authMiddleware, marcarClaseFormacion);
router.delete("/:id/progreso-formacion/:formationId/:classId", authMiddleware, desmarcarClaseFormacion);
router.get("/:id/progreso-formacion/:formationId", authMiddleware, obtenerProgresoFormacion);

module.exports = router;
