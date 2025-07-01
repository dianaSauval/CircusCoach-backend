const Class = require("../models/Class");
const Module = require("../models/Module");
const { eliminarVideosDeObjeto } = require("./uploadController");
const { deleteArchivoCloudinary } = require("./cloudinaryController");

// 🔹 Middleware para verificar si el usuario es admin
const isAdmin = (req) => req.user && req.user.role === "admin";

// 🔹 Obtener todas las clases (para el administrador)
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error obteniendo clases:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Obtener clases visibles por formación (para alumnos y admin)
const getClassesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const isAdminRequest = req.user && req.user.role === "admin";

    console.log("📩 ID del módulo recibido:", moduleId);
    console.log("👤 Es admin?", isAdminRequest);

    // Verificar si el módulo existe
    const moduleExists = await Module.findById(moduleId);
    if (!moduleExists) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    // Si el usuario no es admin, filtrar solo las clases visibles
    const query = { module: moduleId };
    if (!isAdminRequest) {
      query.$or = [
        { "visible.es": true },
        { "visible.en": true },
        { "visible.fr": true },
      ];
    }

    const classes = await Class.find(query);

    console.log("📤 Clases encontradas:", classes);

    res.status(200).json(classes);
  } catch (error) {
    console.error("❌ Error al obtener clases:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Crear una nueva clase dentro de un módulo
const createClass = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    console.log("📩 Datos recibidos en el backend:", req.body);

    const {
      title,
      subtitle,
      content,
      secondaryContent,
      pdfs,
      videos,
      moduleId,
    } = req.body;

    if (!title || !moduleId) {
      return res
        .status(400)
        .json({ error: "El título y el módulo son obligatorios" });
    }

    const newClass = new Class({
      title,
      subtitle,
      content,
      secondaryContent,
      pdfs,
      videos,
      module: moduleId,
      visible: { es: false, en: false, fr: false },
    });

    await newClass.save();

    // 🔥 Aquí se asocia la clase al módulo correspondiente
    await Module.findByIdAndUpdate(moduleId, {
      $push: { classes: newClass._id },
    });

    console.log("✅ Clase creada y asociada al módulo con éxito:", newClass);

    res.status(201).json(newClass);
  } catch (error) {
    console.error("❌ Error en createClass:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Editar una clase
const updateClass = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.classId,
      req.body,
      { new: true }
    );

    if (!updatedClass)
      return res.status(404).json({ error: "Clase no encontrada" });

    res.json(updatedClass);
  } catch (error) {
    console.error("Error actualizando clase:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Hacer visible una clase en todos los idiomas
const makeClassVisibleInAllLanguages = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const classItem = await Class.findById(req.params.classId);
    if (!classItem)
      return res.status(404).json({ error: "Clase no encontrada" });

    classItem.visible = { es: true, en: true, fr: true };
    await classItem.save();

    res.json({ message: "Clase ahora es visible en todos los idiomas" });
  } catch (error) {
    console.error("Error cambiando visibilidad:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Cambiar visibilidad de un idioma específico en una clase
const toggleClassVisibilityByLanguage = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { classId, lang } = req.params;

    // 🔹 Lista de idiomas válidos
    const validLanguages = ["es", "en", "fr"];
    if (!validLanguages.includes(lang)) {
      return res.status(400).json({ error: "Idioma no válido" });
    }

    const classItem = await Class.findById(classId);
    if (!classItem)
      return res.status(404).json({ error: "Clase no encontrada" });

    // 🔹 Cambiar visibilidad del idioma específico
    classItem.visible[lang] = !classItem.visible[lang];
    await classItem.save();

    res.json({
      message: `Clase ahora es ${
        classItem.visible[lang] ? "visible" : "oculta"
      } en ${lang}`,
    });
  } catch (error) {
    console.error("Error cambiando visibilidad por idioma:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Eliminar una clase (solo admins)
const deleteClass = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { classId } = req.params;
    const clase = await Class.findById(classId);

    if (!clase) return res.status(404).json({ error: "Clase no encontrada" });

    console.log(`🧹 Eliminando clase con ID: ${classId}`);

    // 🔸 Eliminar VIDEOS de Vimeo
    for (const video of clase.videos) {
      await eliminarVideosDeObjeto(video.url);
    }

    // 🔸 Eliminar PDFs de Cloudinary
    for (const pdf of clase.pdfs) {
      const urls = Object.values(pdf.url).filter((url) =>
        url.includes("cloudinary.com")
      );

      const publicIds = urls
        .map((url) => {
          try {
            const parts = new URL(url).pathname.split("/");
            const folderIndex = parts.findIndex(
              (part) => part === "PDFsPrivados" || part === "PDFsPublicos"
            );
            if (folderIndex !== -1 && parts[folderIndex + 1]) {
              const folder = parts[folderIndex];
              const filenameWithExt = parts[folderIndex + 1];
              return `${folder}/${filenameWithExt}`;
            }
          } catch (e) {
            console.warn("⚠️ No se pudo analizar la URL del PDF:", url);
            return null;
          }
        })
        .filter(Boolean);

      for (const publicId of publicIds) {
        try {
          console.log(`⛔ Eliminando PDF desde Cloudinary: ${publicId}`);
          await deleteArchivoCloudinary(publicId, "raw");
        } catch (err) {
          console.warn(`⚠️ Error al eliminar PDF ${publicId}:`, err.message);
        }
      }
    }

    // 🔸 Eliminar la clase en sí
    await Class.findByIdAndDelete(classId);

    console.log("✅ Clase y recursos eliminados correctamente");
    res.json({ message: "Clase y recursos eliminados correctamente" });
  } catch (error) {
    console.error("💥 Error eliminando clase:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const eliminarClaseConRecursos = async (classId) => {
  const clase = await Class.findById(classId).lean(); // ⚠️ Usa .lean()

  if (!clase) {
    console.warn(`⚠️ Clase con ID ${classId} no encontrada`);
    return;
  }

  console.log(`🧹 Eliminando clase con ID: ${classId}`);

  // 1. Eliminar videos
  for (const video of clase.videos || []) {
    await eliminarVideosDeObjeto(video.url);
  }

  // 2. Eliminar PDFs
  for (const pdf of clase.pdfs || []) {
    const urls = Object.values(pdf.url || {}).filter((url) =>
      url.includes("cloudinary.com")
    );

    const publicIds = urls
      .map((url) => {
        try {
          const parts = new URL(url).pathname.split("/");
          const folderIndex = parts.findIndex(
            (part) => part === "PDFsPrivados" || part === "PDFsPublicos"
          );
          if (folderIndex !== -1 && parts[folderIndex + 1]) {
            const folder = parts[folderIndex];
            const filenameWithExt = parts[folderIndex + 1];
            return `${folder}/${filenameWithExt}`;
          }
        } catch (e) {
          console.warn("⚠️ No se pudo analizar la URL del PDF:", url);
          return null;
        }
      })
      .filter(Boolean);

    for (const publicId of publicIds) {
      try {
        console.log(`⛔ Eliminando PDF desde Cloudinary: ${publicId}`);
        await deleteArchivoCloudinary(publicId, "raw");
      } catch (err) {
        console.warn(`⚠️ Error al eliminar PDF ${publicId}:`, err.message);
      }
    }
  }

  // 3. Eliminar la clase en sí
  await Class.findByIdAndDelete(classId);
  console.log(`✅ Clase ${classId} y recursos eliminados`);
};

// 🔹 Obtener clase por ID (filtrando por idioma)
const getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const lang = req.query.lang || "es";

    const clase = await Class.findById(classId);
    if (!clase) return res.status(404).json({ error: "Clase no encontrada" });

    // Si la clase no está visible en ese idioma (y no es admin), rechazar
    if (!clase.visible?.[lang]) {
      return res
        .status(403)
        .json({ error: "Esta clase no está disponible en este idioma" });
    }

    res.json({
      _id: clase._id,
      title: clase.title?.[lang] || "",
      subtitle: clase.subtitle?.[lang] || "",
      content: clase.content?.[lang] || "",
      secondaryContent: clase.secondaryContent?.[lang] || "",
      pdfs: clase.pdfs || [],
      videos: clase.videos || [],
    });
  } catch (error) {
    console.error("❌ Error al obtener clase por ID:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

const getClassByIdAdmin = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { classId } = req.params;

    const clase = await Class.findById(classId);
    if (!clase) return res.status(404).json({ error: "Clase no encontrada" });

    res.json(clase); // 🔹 Devuelve todo el objeto completo
  } catch (error) {
    console.error("❌ Error al obtener clase por ID (admin):", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassesByModule,
  getClassById,
  getClassByIdAdmin,
  createClass,
  updateClass,
  makeClassVisibleInAllLanguages,
  toggleClassVisibilityByLanguage,
  deleteClass,
  eliminarClaseConRecursos,
};
