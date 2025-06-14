const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// 📄 Subir PDF a Cloudinary
exports.uploadPdf = async (req, res) => {
  console.log("📥 Entrando a uploadPdf...");
  console.log("📦 req.file:", req.file);

  const file = req.file;
  if (!file) {
    console.log("❌ No se recibió ningún archivo PDF");
    return res.status(400).json({ error: "Archivo PDF requerido" });
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      folder: "PDFs",
    });

    console.log("✅ Subida exitosa a Cloudinary:", result.secure_url);
    fs.unlinkSync(file.path);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("❌ Error al subir PDF a Cloudinary:", error.message);
    res.status(500).json({ error: "Error al subir PDF" });
  }
};


// 🗑 Eliminar archivo (imagen, PDF, lo que sea)
exports.deleteArchivo = async (req, res) => {
  const { public_id, resource_type = "raw" } = req.body;

  console.log("🗑 Recibido para eliminar:", { public_id, resource_type });

  if (!public_id) return res.status(400).json({ error: "public_id requerido" });

  try {
    await cloudinary.uploader.destroy(public_id, { resource_type });
    res.json({ success: true, message: `Archivo eliminado: ${public_id}` });
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error.message);
    res.status(500).json({ error: "Error al eliminar archivo" });
  }
};
