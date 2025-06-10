const axios = require("axios");
const fs = require("fs");
const path = require("path");

const VIMEO_TOKEN = process.env.VIMEO_TOKEN;

// ✅ Subir video y esperar procesamiento
exports.uploadVideo = async (req, res) => {
  const file = req.file;
  const { title, description } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Archivo de video requerido" });
  }

  try {
    // Paso 1: Crear video en Vimeo
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

    const videoUri = createRes.data.uri; // ejemplo: /videos/123456789
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

    // ✅ NO ESPERAR procesamiento
    // 🔁 En lugar de esperar a que esté disponible:
    const finalVideoUrl = `https://vimeo.com${videoUri.replace("/videos", "")}`;

    // Borrar archivo temporal
    fs.unlinkSync(file.path);

    // ✅ Devolver link inmediatamente
    res.json({ url: finalVideoUrl });
  } catch (err) {
    console.error(
      "❌ Error al subir video a Vimeo:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Error al subir video" });
  }
};

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

// ✅ Eliminar video
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
