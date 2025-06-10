const express = require("express");
const {
  getAllClasses,
  getClassesByModule,
  getClassById,
  getClassByIdAdmin,
  createClass,
  updateClass,
  makeClassVisibleInAllLanguages,
  toggleClassVisibilityByLanguage,
  deleteClass,
} = require("../controllers/classController");

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

/* // 🔹 Verificar si los controladores están bien importados
console.log("🛠️ Controllers importados en classRoutes:", {
  getAllClasses,
  getClassesByModule,
  createClass,
  updateClass,
  makeClassVisibleInAllLanguages,
  toggleClassVisibilityByLanguage,
  deleteClass,
}); */

// 🔹 Obtener todas las clases (solo admin)
router.get("/admin", authMiddleware, isAdminMiddleware, getAllClasses);

// 🔹 Obtener clases de un módulo (visibles para alumnos o todas para admin)
router.get("/module/:moduleId", authMiddleware, getClassesByModule);

// 🔹 Crear una nueva clase (solo admin)
router.post("/", authMiddleware, isAdminMiddleware, createClass);

// 🆕 Obtener clase por ID y idioma
router.get("/:classId", getClassById);

// 🆕 Ruta para admin: obtener clase completa
router.get("/admin/:classId", authMiddleware, isAdminMiddleware, getClassByIdAdmin);


// 🔹 Editar una clase (solo admin)
router.put("/:classId", authMiddleware, updateClass);

// 🔹 Hacer visible una clase en **todos** los idiomas (solo admin)
router.patch("/:classId/visibility/all", authMiddleware, isAdminMiddleware, makeClassVisibleInAllLanguages);

// 🔹 Cambiar visibilidad de un idioma específico (solo admin)
router.patch("/:classId/visibility/:lang", authMiddleware, isAdminMiddleware, toggleClassVisibilityByLanguage);

// 🔹 Eliminar una clase (solo admin)
router.delete("/:classId", authMiddleware, isAdminMiddleware, deleteClass);

module.exports = router;

