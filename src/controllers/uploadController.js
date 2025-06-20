const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const VIMEO_TOKEN = process.env.VIMEO_TOKEN;

// 🔹 Multer para video
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Middleware general
exports.uploadVideoMiddleware = upload.single("file");

// 🔹 Función base reutilizable
exports.uploadVideoConPrivacidad = async (req, res, privacy = "unlisted") => {
  const file = req.file;
  const { title, description } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Archivo de video requerido" });
  }

  try {
    const stats = fs.statSync(file.path);
    const size = stats.size;

    // Crear recurso en Vimeo
    const createRes = await axios.post(
      "https://api.vimeo.com/me/videos",
      {
        upload: { approach: "tus", size },
        name: title,
        description,
        privacy: {
          view: privacy, // 👈 "anybody" | "disable" | "unlisted"
        },
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

    // Subir archivo binario
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

    fs.unlinkSync(file.path); // limpieza

    const finalVideoUrl = `https://vimeo.com${videoUri.replace("/videos", "")}`;
    res.json({ url: finalVideoUrl });
  } catch (err) {
    console.error("❌ Error al subir video:", err.response?.data || err.message);
    res.status(500).json({ error: "Error al subir video" });
  }
};

// 🔸 Subida de video PROMOCIONAL (público)
exports.uploadPromotionalVideo = async (req, res) => {
  return exports.uploadVideoConPrivacidad(req, res, "anybody");
};

// 🔸 Subida de video PRIVADO (clase, solo embebido)
exports.uploadPrivateVideo = async (req, res) => {
  return exports.uploadVideoConPrivacidad(req, res, "disable");
};

// 🔹 Eliminar video por ID
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

// 🔹 Eliminar video desde URL
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

// 🔹 Consultar estado de un video
exports.getVimeoStatus = async (req, res) => {
  const videoId = req.params.videoId;

  try {
    const response = await axios.get(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
      },
    });

    const status = response.data.status; // 'available', etc.
    res.json({ status });
  } catch (error) {
    console.error("Error consultando estado del video:", error.response?.data || error.message);
    res.status(500).json({ error: "Error consultando estado del video" });
  }
};

// 🔹 Eliminar todos los videos de un objeto con URLs por idioma
exports.eliminarVideosDeObjeto = async (objetoConUrls) => {
  for (const lang of ["es", "en", "fr"]) {
    const url = objetoConUrls?.[lang];
    if (url && url.includes("vimeo.com")) {
      const videoId = url.split("/").pop();
      try {
        await exports.deleteFromVimeoById(videoId);
        console.log(`✅ Video eliminado: ${videoId}`);
      } catch (err) {
        console.warn(`⚠️ Error al eliminar video ${videoId}:`, err.message);
      }
    }
  }
};
