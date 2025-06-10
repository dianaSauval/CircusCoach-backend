const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { uploadVideo, deleteFromVimeo, getVimeoStatus } = require("../controllers/uploadController");

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // carpeta temporal

// 📤 Ruta para subir video
router.post("/upload-video", upload.single("file"), uploadVideo);

// 🗑 Ruta para eliminar video
router.post("/delete-video", deleteFromVimeo);

// uploadRoutes.js
router.get("/video-status/:videoId", getVimeoStatus);


module.exports = router;

