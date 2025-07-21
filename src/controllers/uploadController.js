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
  privacy = "unlisted",
  embed = "whitelist"
) => {
  const file = req.file;
  const { title, description } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Archivo de video requerido" });
  }

  try {
    const stats = fs.statSync(file.path);
    const size = stats.size;

    // Whitelist solo si se indica
    const domainWhitelist =
      embed === "whitelist"
        ? [
            "localhost:5173",
            "127.0.0.1:5173",
            "mycircuscoach.com",
            "www.mycircuscoach.com",
          ]
        : [];

    // 🎛 Configuración para subir video
    const vimeoPayload = {
      upload: { approach: "tus", size },
      name: title,
      description,
      privacy: {
        view: privacy, // "anybody" o "unlisted"
        embed: embed, // "public" o "whitelist"
        download: false,
        add: false,
      },
      embed: {
        buttons: {
          like: false,
          watchlater: false,
          share: false,
          embed: false,
        },
      },
      ...(domainWhitelist.length > 0 && { embed_domains: domainWhitelist }),
    };

    // 🔍 Log para ver la config exacta
    console.log("🎥 Subiendo video con configuración:");
    console.log(JSON.stringify(vimeoPayload, null, 2));

    // 📡 1. Crear video en Vimeo
    const createRes = await axios.post(
      "https://api.vimeo.com/me/videos",
      vimeoPayload,
      {
        headers: {
          Authorization: `Bearer ${VIMEO_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const videoUri = createRes.data.uri;
    const uploadLink = createRes.data.upload.upload_link;

    // ⬆️ 2. Subir el archivo binario al link de upload
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

    fs.unlinkSync(file.path); // 🧹 Limpieza

    // 🔧 3. Forzar configuración final (por si no aplicó bien al crear)
    // 🔧 3. Forzar configuración final (por si no aplicó bien al crear)
    const patchPayload = {
      privacy: {
        view: privacy,
        embed: embed,
        download: false,
        add: false,
      },
      embed: {
        buttons: {
          like: false,
          watchlater: false,
          share: false,
          embed: false,
        },
      },
      ...(domainWhitelist.length > 0 && { embed_domains: domainWhitelist }),
    };

    console.log(
      "🛠 PATCH forzado a Vimeo con:",
      JSON.stringify(patchPayload, null, 2)
    );

    await axios.patch(`https://api.vimeo.com${videoUri}`, patchPayload, {
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // ✅ 4. Respuesta final con URL del video
    const finalVideoUrl = `https://vimeo.com${videoUri.replace("/videos", "")}`;
    console.log(`✅ Video subido correctamente: ${finalVideoUrl}`);
    res.json({ url: finalVideoUrl });
  } catch (err) {
    console.error(
      "❌ Error al subir video:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Error al subir video" });
  }
};

// 🔸 Subida de video PROMOCIONAL (público, visible en Vimeo y embebible en cualquier sitio)
exports.uploadPromotionalVideo = async (req, res) => {
  return exports.uploadVideoConPrivacidad(req, res, "anybody", "public");
};

// 🔸 Subida de video PRIVADO (solo embebido en tu web, no visible en Vimeo)
exports.uploadPrivateVideo = async (req, res) => {
  return exports.uploadVideoConPrivacidad(req, res, "unlisted", "whitelist");
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
    let clase = await Class.findById(classId).populate("module");
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
    if (!clase || !videoUrl) {
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
