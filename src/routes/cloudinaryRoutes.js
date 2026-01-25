const express = require("express");
const router = express.Router();

const {
  uploadPdfPublico,
  uploadPdfPrivado,
  deleteArchivo,
  uploadImagenCurso,
  uploadImagenMiddleware,
  obtenerPdfPrivado,
  obtenerPdfPrivadoCurso,
  uploadPdfLibro,
} = require("../controllers/cloudinaryController");

const uploadPdfMiddleware = require("../middlewares/pdfMulter");
const { authMiddleware } = require("../middlewares/authMiddleware");

// 📤 Subida de PDF público (para cursos)
router.post("/upload-pdf-publico", uploadPdfMiddleware, uploadPdfPublico);

// 📤 Subida de PDF privado (para clases)
router.post("/upload-pdf-privado", uploadPdfMiddleware, uploadPdfPrivado);

// 📸 Subida de imagen de curso (tipo flyer)
router.post("/upload-imagen-curso", uploadImagenMiddleware, uploadImagenCurso);

// 📘 Subida de PDF de libro (admin)
router.post(
  "/upload-pdf-libro",
  authMiddleware,
  uploadPdfMiddleware,
  uploadPdfLibro
);

// 🗑 Eliminación general de archivos (PDFs o imágenes)
router.delete("/delete", deleteArchivo);

router.get(
  "/privado/:classId/:pdfIndex/:lang",
  authMiddleware,
  obtenerPdfPrivado
);

router.get(
  "/pdf-curso-privado/:classId/:pdfIndex/:lang",
  authMiddleware,
  obtenerPdfPrivadoCurso
);

module.exports = router;
