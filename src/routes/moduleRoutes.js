const express = require("express");
const {
  getAllModules,
  getModulesByFormation,
  createModule,
  updateModule,
  makeModuleVisibleInAllLanguages,
  toggleModuleVisibilityByLanguage,
  deleteModule,
} = require("../controllers/moduleController");

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();



// 🔹 Obtener todos los módulos (solo admin)
router.get("/admin", authMiddleware, isAdminMiddleware, getAllModules);

// 🔹 Obtener módulos visibles de una formación
router.get("/formation/:formationId", authMiddleware, getModulesByFormation);

// 🔹 Crear un módulo (solo admin)
router.post("/", authMiddleware, isAdminMiddleware, createModule);

// 🔹 Editar un módulo (solo admin)
router.put("/:moduleId", authMiddleware, updateModule);

// 🔹 Poner visible el módulo en TODOS los idiomas (solo admin)
router.patch("/:moduleId/visibility/all", authMiddleware, isAdminMiddleware, makeModuleVisibleInAllLanguages);

// 🔹 Alternar visibilidad de un IDIOMA específico del módulo (solo admin)
router.patch("/:moduleId/visibility/:language", authMiddleware, isAdminMiddleware, toggleModuleVisibilityByLanguage);

// 🔹 Eliminar un módulo (solo admin)
router.delete("/:moduleId", authMiddleware, isAdminMiddleware, deleteModule);

module.exports = router;
