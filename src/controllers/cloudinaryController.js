const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const multer = require("multer");

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
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
    public_id,        // ✅ Asegura que tenga el nombre del título
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
  const publicId = req.body.public_id;

  if (!file) {
    return res.status(400).json({ error: "Archivo PDF requerido" });
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      folder: "PDFsPrivados",
      public_id: `PDFsPrivados/${publicId}`, // ✅ Se guarda con ese nombre
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    fs.unlinkSync(file.path);
    console.log("✅ Subida privada exitosa:", result.secure_url);
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
  try {
    console.log(`🔄 Llamando a Cloudinary para eliminar: ${public_id}`);
    await cloudinary.uploader.destroy(public_id, { resource_type });
    console.log(`✅ Archivo eliminado de Cloudinary: ${public_id}`);
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
      const match = imageUrl.match(/\/upload\/(?:v\d+\/)?ImagenesCursos\/(.+)\.(jpg|png|jpeg|webp)/i);
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
