const express = require("express");
const router = express.Router();

const {
  uploadPromotionalVideo,
  uploadPrivateVideo,
  deleteFromVimeo,
  getVimeoStatus,
  uploadVideoMiddleware,
} = require("../controllers/uploadController");

// 📤 Subir video promocional (público)
router.post("/video-promocional", uploadVideoMiddleware, uploadPromotionalVideo);

// 📤 Subir video privado (solo embebido)
router.post("/video-privado", uploadVideoMiddleware, uploadPrivateVideo);

// 🗑 Eliminar video desde URL
router.post("/delete-video", deleteFromVimeo);

// 🔍 Consultar estado del video en Vimeo
router.get("/video-status/:videoId", getVimeoStatus);

module.exports = router;
