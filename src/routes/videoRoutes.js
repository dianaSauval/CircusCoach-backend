const express = require("express");
const router = express.Router();

const {
  uploadPromotionalVideo,
  uploadPrivateVideo,
  deleteFromVimeo,
  getVimeoStatus,
  uploadVideoMiddleware,
  obtenerVideoPrivado,
} = require("../controllers/uploadController");
const { authMiddleware } = require("../middlewares/authMiddleware"); 

// 📤 Subir video promocional (público)
router.post("/video-promocional", uploadVideoMiddleware, uploadPromotionalVideo);

// 📤 Subir video privado (solo embebido)
router.post("/video-privado", uploadVideoMiddleware, uploadPrivateVideo);

// 🗑 Eliminar video desde URL
router.post("/delete-video", deleteFromVimeo);

// 🔍 Consultar estado del video en Vimeo
router.get("/video-status/:videoId", getVimeoStatus);

// 🔐 Obtener video privado solo si es admin o comprador
router.get("/video/:classId/:videoIndex/:lang", authMiddleware, obtenerVideoPrivado);

module.exports = router;
