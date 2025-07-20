const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const Class = require("../models/Class");
const User = require("../models/User");
const Module = require("../models/Module");
const Formation = require("../models/Formation");
const CourseClass = require("../models/CourseClass");
const Course = require("../models/Course");

const multer = require("multer");

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

exports.uploadImagenMiddleware = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes"));
    }
    cb(null, true);
  },
}).single("file");

// 🔹 Subida reutilizable con carpeta visible
const subirPdfCloudinary = async (file, carpeta, nombre = null) => {
  // Si hay un nombre personalizado, lo usamos
  const public_id = nombre
    ? nombre // 👈 solo el nombre limpio, sin carpeta
    : `${file.originalname.replace(/\.[^/.]+$/, "")}-${Date.now()}`;

  return await cloudinary.uploader.upload(file.path, {
    resource_type: "raw",
    folder: carpeta, // ✅ Asegura que esté en PDFsPublicos
    public_id, // ✅ Asegura que tenga el nombre del título
    use_filename: false,
    unique_filename: false,
    overwrite: true,
  });
};

// 📄 Subir PDF público (curso)
exports.uploadPdfPublico = async (req, res) => {
  console.log("📥 Subiendo PDF público...");
  const file = req.file;
  const nombre = req.body.public_id; // 👈 título normalizado que viene del frontend

  if (!file) {
    return res.status(400).json({ error: "Archivo PDF requerido" });
  }

  try {
    const result = await subirPdfCloudinary(file, "PDFsPublicos", nombre); // 👈 este tercer parámetro FALTABA
    fs.unlinkSync(file.path);
    console.log("✅ Subida pública exitosa:", result.secure_url);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("❌ Error al subir PDF público:", error.message);
    res.status(500).json({ error: "Error al subir PDF público" });
  }
};

// 📄 Subir PDF privado (clase)
exports.uploadPdfPrivado = async (req, res) => {
  console.log("📥 Subiendo PDF privado...");
  const file = req.file;
  const publicId = req.body.public_id; // 👈 Esperamos algo como "clase_1_probando"

  if (!file) {
    return res.status(400).json({ error: "Archivo PDF requerido" });
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      folder: "PDFsPrivados", // 👈 Solo especificamos la carpeta aquí
      public_id: publicId, // ✅ El nombre final será: PDFsPrivados/clase_1_probando
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    fs.unlinkSync(file.path); // ✅ Borra el archivo temporal del servidor
    console.log("✅ Subida privada exitosa:", result.secure_url);

    // Devolvemos la URL y el public_id generado por Cloudinary
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("❌ Error al subir PDF privado:", error.message);
    res.status(500).json({ error: "Error al subir PDF privado" });
  }
};

// 🗑 Eliminar archivo desde el panel
exports.deleteArchivo = async (req, res) => {
  const { public_id, resource_type = "raw" } = req.body;
  console.log("🗑 Recibido para eliminar:", { public_id, resource_type });

  if (!public_id) {
    return res.status(400).json({ error: "public_id requerido" });
  }

  try {
    await cloudinary.uploader.destroy(public_id, { resource_type });
    res.json({ success: true, message: `Archivo eliminado: ${public_id}` });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error.message);
    res.status(500).json({ error: "Error al eliminar archivo" });
  }
};

// 🧩 Para usar desde otros controladores (reutilizable)
exports.deleteArchivoCloudinary = async (public_id, resource_type = "raw") => {
  if (!public_id) {
    console.warn("⚠️ No se proporcionó public_id");
    return;
  }

  try {
    console.log(`🔄 Llamando a Cloudinary para eliminar: ${public_id}`);

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });
    console.log("📤 Respuesta de Cloudinary:", result);

    if (result.result !== "ok") {
      console.warn(
        `⚠️ Cloudinary no eliminó el archivo: ${public_id} (resultado: ${result.result})`
      );
    } else {
      console.log(`✅ Archivo eliminado de Cloudinary: ${public_id}`);
    }

    return result;
  } catch (err) {
    console.error("❌ Error al eliminar archivo de Cloudinary:", err.message);
  }
};

// 📸 Subida de imagen de curso (formato flyer)
exports.uploadImagenCurso = async (req, res) => {
  console.log("📤 Subiendo imagen de curso...");
  const file = req.file;
  const nombre = req.body.public_id;

  if (!file) {
    return res.status(400).json({ error: "Archivo de imagen requerido" });
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "ImagenesCursos",
      public_id: nombre, // 👈 opcional, si querés controlarlo desde el frontend
      use_filename: false,
      unique_filename: false,
      overwrite: true,
    });

    fs.unlinkSync(file.path);
    console.log("✅ Imagen subida con éxito:", result.secure_url);

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("❌ Error al subir imagen:", error.message);
    res.status(500).json({ error: "Error al subir imagen de curso" });
  }
};

// 🧹 Eliminar imágenes de un curso (por idioma)
exports.deleteImagenesCurso = async (imagenesPorIdioma) => {
  for (const lang of ["es", "en", "fr"]) {
    const imageUrl = imagenesPorIdioma?.[lang];

    if (imageUrl && imageUrl.includes("cloudinary.com")) {
      const match = imageUrl.match(
        /\/upload\/(?:v\d+\/)?ImagenesCursos\/(.+)\.(jpg|png|jpeg|webp)/i
      );
      const publicId = match ? `ImagenesCursos/${match[1]}` : null;

      if (publicId) {
        try {
          await exports.deleteArchivoCloudinary(publicId, "image");
          console.log(`✅ Imagen eliminada: ${publicId}`);
        } catch (err) {
          console.warn(`⚠️ Error al eliminar imagen ${publicId}:`, err.message);
        }
      } else {
        console.log(`⚠️ No se pudo extraer public_id de imagen (${lang})`);
      }
    } else {
      console.log(`ℹ️ No hay imagen para idioma ${lang} o no es de Cloudinary`);
    }
  }
};

exports.obtenerPdfPrivado = async (req, res) => {
  const userId = req.user.id;
  const { classId, pdfIndex, lang } = req.params;

  console.log("📡 Solicitud para PDF privado recibida:", {
    userId,
    classId,
    pdfIndex,
    lang,
  });

  try {
    const clase = await Class.findById(classId).populate("module");

    if (!clase) {
      console.warn("⚠️ Clase no encontrada:", classId);
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    console.log("✅ Clase encontrada:", clase.title?.es || clase._id);
    console.log("📄 PDFs disponibles:", clase.pdfs?.length);

    const modulo = clase.module;
    if (!modulo) {
      console.warn("⚠️ Módulo no encontrado dentro de clase:", classId);
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    const formationId = modulo.formation;
    if (!formationId) {
      console.warn("⚠️ Formación no encontrada en módulo:", modulo._id);
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ Usuario no encontrado:", userId);
      return res.status(403).json({ error: "Usuario no encontrado" });
    }

    console.log("👤 Usuario:", user.email, "| Rol:", user.role);

    const pdfData = clase.pdfs?.[pdfIndex];
    const pdfUrl = pdfData?.url?.[lang];

    console.log("🔍 PDF seleccionado:", {
      index: pdfIndex,
      lang,
      existePdf: !!pdfData,
      url: pdfUrl,
    });

    // ✅ Permitir admins
    if (user.role === "admin") {
      console.log("🛡️ Usuario es admin. Acceso autorizado.");
      return res.json({ url: pdfUrl });
    }

    const haComprado = user.formacionesCompradas.some(
      (compra) => compra.formationId.toString() === formationId.toString()
    );

    console.log("🧾 ¿Compró la formación?", haComprado);
    console.log("🔎 Formation ID desde la clase:", formationId.toString());
    console.log(
      "🎯 IDs de formaciones compradas:",
      user.formacionesCompradas.map((f) => f.formationId.toString())
    );

    if (!haComprado) {
      console.warn("⛔ Acceso denegado. No compró la formación.");
      return res.status(403).json({ error: "No compraste esta formación" });
    }

    if (!pdfUrl) {
      console.warn("❌ URL del PDF no encontrada para ese idioma o índice");
      return res.status(404).json({ error: "PDF no encontrado" });
    }

    return res.json({ url: pdfUrl }); // 👈 ya no usamos redirect
  } catch (err) {
    console.error("❌ Error en el servidor:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


exports.obtenerPdfPrivadoCurso = async (req, res) => {
  const userId = req.user.id;
  const { classId, pdfIndex, lang } = req.params;

  console.log("📡 Solicitud para PDF privado de CURSO recibida:", {
    userId,
    classId,
    pdfIndex,
    lang,
  });

  try {
    const clase = await CourseClass.findById(classId);
    if (!clase) {
      console.warn("⚠️ Clase de curso no encontrada:", classId);
      return res.status(404).json({ error: "Clase no encontrada" });
    }

    const courseId = clase.course;
    if (!courseId) {
      console.warn("⚠️ No se encontró curso asociado a la clase");
      return res.status(404).json({ error: "Curso no asociado" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(403).json({ error: "Usuario no encontrado" });
    }

    const haComprado = user.cursosComprados.some(
      (compra) => compra.courseId.toString() === courseId.toString()
    );

    if (!haComprado && user.role !== "admin") {
      console.warn("⛔ Acceso denegado. No compró el curso.");
      return res.status(403).json({ error: "No compraste este curso" });
    }

    const pdfData = clase.pdfs?.[pdfIndex];
    const pdfUrl = pdfData?.url?.[lang];

    if (!pdfUrl) {
      console.warn("❌ URL del PDF no encontrada para ese idioma o índice");
      return res.status(404).json({ error: "PDF no encontrado" });
    }

    console.log("✅ PDF autorizado y encontrado:", pdfUrl);
    return res.json({ url: pdfUrl });
  } catch (err) {
    console.error("❌ Error al obtener PDF privado de curso:", err.message);
    res.status(500).json({ error: "Error interno" });
  }
};