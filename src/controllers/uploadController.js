const axios = require("axios");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Class = require("../models/Class");
const User = require("../models/User");
const Module = require("../models/Module");
const Formation = require("../models/Formation");
const CourseClass = require("../models/CourseClass");

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
exports.uploadVideoConPrivacidad = async (
  req,
  res,
  view = "nobody",
  embed = "whitelist"
) => {
  const file = req.file;
  const { title, description } = req.body;
  if (!file)
    return res.status(400).json({ error: "Archivo de video requerido" });

  try {
    const stats = fs.statSync(file.path);
    const size = stats.size;

    const whitelist = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://mycircuscoach.com",
      "https://www.mycircuscoach.com",
    ];

    // 1) Crear el contenedor del video
    const createPayload = {
      upload: { approach: "tus", size },
      name: title,
      description,
      privacy: {
        view, // "nobody" para que NO exista página pública
        embed, // "whitelist" para limitar el embed
        download: false,
        add: false,
      },
      embed: {
        buttons: { like: false, watchlater: false, share: false, embed: false },
      },
      embed_domains: embed === "whitelist" ? whitelist : undefined,
    };

    const createRes = await axios.post(
      "https://api.vimeo.com/me/videos",
      createPayload,
      {
        headers: {
          Authorization: `Bearer ${VIMEO_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const videoUri = createRes.data.uri; // e.g. "/videos/123456789"
    const uploadLink = createRes.data.upload.upload_link;

    // 2) Subir el binario por TUS
    const buffer = fs.readFileSync(file.path);
    await axios.patch(uploadLink, buffer, {
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": 0,
        "Content-Type": "application/offset+octet-stream",
        "Content-Length": buffer.length,
      },
    });

    fs.unlinkSync(file.path); // limpiar archivo temporal

    // 3) Poll de procesamiento hasta "available"
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    let status = "uploading";
    let tries = 0;

    while (status !== "available" && tries < 40) {
      // ~2 min máx
      const info = await axios.get(`https://api.vimeo.com${videoUri}`, {
        headers: { Authorization: `Bearer ${VIMEO_TOKEN}` },
      });
      status = info.data.status; // "uploading" | "transcoding" | "available"
      if (status === "available") {
        // 4) PATCH de refuerzo de privacidad/whitelist (opcional pero útil)
        await axios.patch(
          `https://api.vimeo.com${videoUri}`,
          {
            privacy: { view, embed, download: false, add: false },
            embed: {
              buttons: {
                like: false,
                watchlater: false,
                share: false,
                embed: false,
              },
            },
            embed_domains: embed === "whitelist" ? whitelist : undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${VIMEO_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        // traer datos definitivos
        const finalInfo = await axios.get(`https://api.vimeo.com${videoUri}`, {
          headers: { Authorization: `Bearer ${VIMEO_TOKEN}` },
        });

        // IMPORTANTE: no expongas la página de Vimeo (vimeo.com/ID/...)
        const id = finalInfo.data.uri.split("/").pop();
        const playerUrl = `https://player.vimeo.com/video/${id}`; // no necesita hash con whitelist

        return res.json({
          id,
          url: playerUrl,
          player_embed_url: finalInfo.data.player_embed_url,
        });
      }

      await delay(3000);
      tries++;
    }

    return res.status(202).json({
      // si no llegó a available a tiempo
      id: videoUri.split("/").pop(),
      status,
      message: "El video sigue procesando. Reintenta en unos segundos.",
    });
  } catch (err) {
    console.error(
      "❌ Error al subir video:",
      err.response?.data || err.message
    );
    return res.status(500).json({ error: "Error al subir video" });
  }
};

// 🔸 Subida de video PROMOCIONAL (público, visible en Vimeo y embebible en cualquier sitio)
exports.uploadPromotionalVideo = (req, res) =>
  exports.uploadVideoConPrivacidad(req, res, "anybody", "public");

// 🔸 Subida de video PRIVADO (solo embebido en tu web, no visible en Vimeo)
exports.uploadPrivateVideo = (req, res) =>
  exports.uploadVideoConPrivacidad(req, res, "nobody", "whitelist");

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
    console.error(
      `❌ Error al eliminar video ${videoId}:`,
      err.response?.data || err.message
    );
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
    return res
      .status(400)
      .json({ error: "No se pudo obtener el ID del video" });
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

  console.log("🔍 Consultando estado del video en Vimeo:", videoId);

  try {
    const url = `https://api.vimeo.com/videos/${videoId}`;
    console.log("📡 GET a:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
      },
    });

    const status = response.data.status; // 'available', 'uploading', etc.
    console.log("✅ Estado recibido:", status);

    res.json({ status });
  } catch (error) {
    console.error("❌ Error consultando estado del video:", {
      status: error.response?.status,
      message: error.response?.data || error.message,
    });

    res.status(500).json({
      error: "Error consultando estado del video",
      vimeoError: error.response?.data || error.message,
    });
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

exports.obtenerVideoPrivado = async (req, res) => {
  const userId = req.user.id;
  const { classId, videoIndex, lang } = req.params;

  console.log("🎥 Solicitud para video privado recibida:", {
    userId,
    classId,
    videoIndex,
    lang,
  });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(403).json({ error: "Usuario no encontrado" });

    // 🔍 1. Intentar encontrar en formación
    let clase = await Class.findById(classId);
    if (clase) await clase.populate("module");
    let tipo = "formacion";
    let videoUrl = null;
    let accesoValido = false;

    if (clase) {
      const modulo = clase.module;
      const formationId = modulo?.formation;
      const videoData = clase.videos?.[videoIndex];
      videoUrl = videoData?.url?.[lang];

      if (
        user.role === "admin" ||
        user.formacionesCompradas.some(
          (f) => f.formationId.toString() === formationId?.toString()
        )
      ) {
        accesoValido = true;
      }
    }

    // 🔍 2. Si no existe como formación, buscar como clase de curso
    if (!clase || typeof videoUrl !== "string") {
      clase = await CourseClass.findById(classId);
      tipo = "curso";
      const videoData = clase?.videos?.[videoIndex];
      videoUrl = videoData?.url?.[lang];

      if (clase && user.role === "admin") {
        accesoValido = true;
      }

      if (clase && !accesoValido) {
        const cursoComprado = user.cursosComprados.some(
          (c) => c.courseId.toString() === clase.course?.toString()
        );
        accesoValido = cursoComprado;
      }
    }

    if (!clase) {
      console.warn("⚠️ Clase no encontrada:", classId);
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    if (!videoUrl) {
      console.warn("⚠️ Video no encontrado en idioma o índice", {
        videoIndex,
        lang,
      });
      return res
        .status(404)
        .json({ error: "Video no encontrado en ese idioma o índice" });
    }

    if (!accesoValido) {
      console.warn("❌ Usuario no tiene acceso a este video");
      return res.status(403).json({ error: `No compraste esta ${tipo}` });
    }

    console.log(`✅ Usuario tiene acceso al video (${tipo})`);
    return res.json({ url: videoUrl });
  } catch (err) {
    console.error("❌ Error en obtenerVideoPrivado:", err);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};
