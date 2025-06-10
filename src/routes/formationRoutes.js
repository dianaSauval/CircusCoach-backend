const express = require("express");
const {
  getFormations,
  getAllFormations,
  getFormationById ,
  getFormationByIdAllInformation,
  getFormationVisibleContent,
  createFormation,
  updateFormation,
  makeFormationVisibleInAllLanguages,
  toggleFormationVisibilityByLanguage,
  deleteFormation
} = require("../controllers/formationController");

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔹 Obtener TODAS las formaciones (solo admin)
router.get("/admin", authMiddleware, isAdminMiddleware, getAllFormations);

// 🔹 Cambiar visibilidad en todos los lenguajes (solo admin)
router.patch("/:id/visibility/all", authMiddleware, isAdminMiddleware, makeFormationVisibleInAllLanguages);

// 🔹 Cambiar visibilidad de un solo lenguaje (solo admin)
router.patch("/:id/visibility/language", authMiddleware, isAdminMiddleware, toggleFormationVisibilityByLanguage);

// 🔹 Editar una formación (solo admin)
router.put("/:id", authMiddleware, isAdminMiddleware, updateFormation);

// 🔹 Eliminar una formación (solo admin)
router.delete("/:id", authMiddleware, isAdminMiddleware, deleteFormation);

// 🔹 Crear una formación (solo admin)
router.post("/", authMiddleware, isAdminMiddleware, createFormation);

// 🔹 Obtener formación por ID (usuario autenticado)
router.get("/id/:id", authMiddleware, getFormationByIdAllInformation);

// 🔹 Obtener formación por id e idioma (sin autenticación)
router.get("/:id", getFormationById);

// 🔹 Obtener formación con contenido visible (módulos y clases) por idioma
router.get("/visible/:id", authMiddleware, getFormationVisibleContent);

// 🔹 Obtener formaciones visibles para alumnos (pública)
router.get("/", getFormations);

module.exports = router;

