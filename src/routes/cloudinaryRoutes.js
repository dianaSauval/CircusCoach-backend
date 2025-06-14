const express = require("express");
const router = express.Router();
const { uploadPdf, deleteArchivo } = require("../controllers/cloudinaryController");
const uploadPdfMiddleware = require("../middlewares/pdfMulter");

// 📤 Subida de PDF
router.post("/upload-pdf", uploadPdfMiddleware, uploadPdf);

// 🗑 Eliminación (general, sirve para cualquier tipo si se le pasa el tipo)
router.delete("/delete", deleteArchivo);

module.exports = router;
