const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// 🔹 Subida reutilizable con carpeta visible
const subirPdfCloudinary = async (file, carpeta) => {
  const nombreSinExtension = file.originalname.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const nombreFinal = `${nombreSinExtension}-${timestamp}`;

  return await cloudinary.uploader.upload(file.path, {
    resource_type: "raw",
    public_id: nombreFinal, // solo nombre, sin carpeta
    folder: carpeta, // 👈 organiza visualmente en la carpeta
    use_filename: false,
    unique_filename: false,
  });
};

// 📄 Subir PDF público (curso)
exports.uploadPdfPublico = async (req, res) => {
  console.log("📥 Subiendo PDF público...");
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Archivo PDF requerido" });
  }

  try {
    const result = await subirPdfCloudinary(file, "PDFsPublicos");
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

