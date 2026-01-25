// middlewares/uploadPdfMiddleware.js
const multer = require("multer");

const MAX_BOOK_PDF_MB = Number(process.env.MAX_BOOK_PDF_MB || 10);
const MAX_BYTES = MAX_BOOK_PDF_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    const err = new Error("Solo se permiten archivos PDF");
    err.code = "INVALID_PDF_TYPE";
    return cb(err);
  }

  cb(null, true);
};

const uploadPdfMiddleware = multer({
  storage,
  limits: { fileSize: MAX_BYTES }, // ✅ ACÁ está la clave
  fileFilter,
}).single("pdf");

module.exports = { uploadPdfMiddleware, MAX_BOOK_PDF_MB };
