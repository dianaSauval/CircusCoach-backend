const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("🟡 Destino multer:", file.originalname);
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + "-" + file.originalname;
    console.log("🟢 Nombre final del archivo:", filename);
    cb(null, filename);
  },
});

const uploadPdfMiddleware = multer({ storage }).single("pdf");

module.exports = uploadPdfMiddleware;
