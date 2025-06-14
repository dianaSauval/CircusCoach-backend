const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const VIMEO_TOKEN = process.env.VIMEO_TOKEN;

// 🔹 Multer para video
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Middleware para subir video
exports.uploadVideoMiddleware = upload.single("file");

// ✅ Subir video y devolver link
exports.uploadVideo = async (req, res) => {
  const file = req.file;
  const { title, description } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Archivo de video requerido" });
  }

  try {
    // Paso 1: Crear el recurso en Vimeo
    const stats = fs.statSync(file.path);
    const size = stats.size;

    const createRes = await axios.post(
      "https://api.vimeo.com/me/videos",
      {
        upload: {
          approach: "tus",
          size,
        },
        name: title,
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${VIMEO_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const videoUri = createRes.data.uri; // /videos/123456
    const uploadLink = createRes.data.upload.upload_link;

    // Paso 2: Subir el archivo binario
    const buffer = fs.readFileSync(file.path);
    await axios.patch(uploadLink, buffer, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
        "Content-Type": "application/offset+octet-stream",
        "Content-Length": size,
        "Upload-Offset": 0,
        "Tus-Resumable": "1.0.0",
      },
    });

    fs.unlinkSync(file.path); // limpia temporal

    const finalVideoUrl = `https://vimeo.com${videoUri.replace("/videos", "")}`;
    res.json({ url: finalVideoUrl });
  } catch (err) {
    console.error("❌ Error al subir video a Vimeo:", err.response?.data || err.message);
    res.status(500).json({ error: "Error al subir video" });
  }
};

// ✅ Eliminar video desde Vimeo (por ID)
exports.deleteFromVimeoById = async (videoId) => {
  try {
    const videoUri = `/videos/${videoId}`;
    await axios.delete(`https://api.vimeo.com${videoUri}`, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
      },
    });
    console.log(`✅ Video ${videoId} eliminado correctamente`);
  } catch (err) {
    console.error(`❌ Error al eliminar video ${videoId}:`, err.response?.data || err.message);
    throw err;
  }
};

// ✅ Ruta para eliminar video desde el cliente (por URL)
exports.deleteFromVimeo = async (req, res) => {
  const videoUrl = typeof req.body === "string" ? req.body : req.body.videoUrl;
  console.log("🔍 URL recibida:", videoUrl);

  if (!videoUrl) {
    return res.status(400).json({ error: "URL del video requerida" });
  }

  const match = videoUrl.match(/(?:\/videos\/|\/)(\d+)/);
  const videoId = match?.[1];

  if (!videoId) {
    return res.status(400).json({ error: "No se pudo obtener el ID del video" });
  }

  try {
    await exports.deleteFromVimeoById(videoId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el video" });
  }
};

// ✅ Consultar estado de un video en Vimeo
exports.getVimeoStatus = async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const response = await axios.get(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
      },
    });

    const status = response.data.status; // 'available', 'uploading', 'transcoding'
    res.json({ status });
  } catch (error) {
    console.error("Error consultando estado del video:", error.response?.data || error.message);
    res.status(500).json({ error: "Error consultando estado del video" });
  }
};
