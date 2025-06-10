const express = require("express");
const router = express.Router();

const {
  getVisibleCourseClassesByLanguage,
  getAllCourseClasses,
  createCourseClass,
  updateCourseClass,
  deleteCourseClass,
  toggleCourseClassVisibilityByLanguage
} = require("../controllers/courseClassController");

const {
  authMiddleware,
  isAdminMiddleware
} = require("../middlewares/authMiddleware");

// 🔹 Obtener clases visibles de un curso por idioma (público)
router.get("/visible/:courseId", getVisibleCourseClassesByLanguage);

// 🔹 Obtener TODAS las clases (solo admin)
router.get("/admin", authMiddleware, isAdminMiddleware, getAllCourseClasses);

// 🔹 Crear una clase para un curso (solo admin)
router.post("/:courseId", authMiddleware, isAdminMiddleware, createCourseClass);

// 🔹 Editar una clase de curso (solo admin)
router.put("/:id", authMiddleware, isAdminMiddleware, updateCourseClass);

// 🔹 Eliminar una clase de curso (solo admin)
router.delete("/:id", authMiddleware, isAdminMiddleware, deleteCourseClass);

// 🔹 Cambiar visibilidad por idioma (solo admin)
router.patch("/:id/visibility/:lang", authMiddleware, isAdminMiddleware, toggleCourseClassVisibilityByLanguage);

module.exports = router;
