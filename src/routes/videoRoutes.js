const express = require("express");
const {
  uploadVideo,
  deleteFromVimeo,
  getVimeoStatus,
} = require("../controllers/uploadController");

const multer = require("multer");
const uploadVideoMulter = multer({ dest: "uploads/" });

const router = express.Router();

router.post("/upload-video", uploadVideoMulter.single("file"), uploadVideo);
router.post("/delete-video", deleteFromVimeo);
router.get("/video-status/:videoId", getVimeoStatus);

module.exports = router;
