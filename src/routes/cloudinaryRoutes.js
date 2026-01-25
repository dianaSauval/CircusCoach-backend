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

const {
  uploadPdfMiddleware,
  MAX_BOOK_PDF_MB,
} = require("../middlewares/pdfMulter");
const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

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
  isAdminMiddleware,
  (req, res, next) => {
    uploadPdfMiddleware(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `El archivo supera el máximo permitido (${MAX_BOOK_PDF_MB} MB). Cloudinary en este plan permite hasta ${MAX_BOOK_PDF_MB} MB por archivo. Comprimilo e intentá nuevamente.`,
          errorCode: "BOOK_PDF_TOO_LARGE",
          maxMb: MAX_BOOK_PDF_MB,
        });
      }

      if (err.code === "INVALID_PDF_TYPE") {
        return res.status(400).json({
          error: "Archivo inválido. Solo se permiten PDFs.",
          errorCode: "BOOK_PDF_INVALID_TYPE",
        });
      }

      return res.status(400).json({
        error: err.message || "Error al procesar el archivo",
        errorCode: "BOOK_PDF_UPLOAD_ERROR",
      });
    });
  },
  uploadPdfLibro,
);

// 🗑 Eliminación general de archivos (PDFs o imágenes)
router.delete("/delete", authMiddleware, isAdminMiddleware, deleteArchivo);


router.get(
  "/privado/:classId/:pdfIndex/:lang",
  authMiddleware,
  obtenerPdfPrivado,
);

router.get(
  "/pdf-curso-privado/:classId/:pdfIndex/:lang",
  authMiddleware,
  obtenerPdfPrivadoCurso,
);

module.exports = router;
