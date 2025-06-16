const express = require("express");
const router = express.Router();

const {
  uploadPdfPublico,
  uploadPdfPrivado,
  deleteArchivo,
} = require("../controllers/cloudinaryController");

const uploadPdfMiddleware = require("../middlewares/pdfMulter");

// 📤 Subida de PDF público (para cursos)
router.post("/upload-pdf-publico", uploadPdfMiddleware, uploadPdfPublico);

// 📤 Subida de PDF privado (para clases)
router.post("/upload-pdf-privado", uploadPdfMiddleware, uploadPdfPrivado);

// 🗑 Eliminación (general)
router.delete("/delete", deleteArchivo);

module.exports = router;
