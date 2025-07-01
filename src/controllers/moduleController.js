const Module = require("../models/Module");
const Formation = require("../models/Formation");
const Class = require("../models/Class");
const { eliminarClaseConRecursos } = require("./classController");

// 🔹 Middleware para verificar si el usuario es admin
const isAdmin = (req) => req.user && req.user.role === "admin";

// 🔹 Obtener todos los módulos (para el administrador)
const getAllModules = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const modules = await Module.find().populate("classes");
    res.status(200).json(modules);
  } catch (error) {
    console.error("❌ Error al obtener módulos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Obtener módulos visibles por formación (para alumnos y admin)
const getModulesByFormation = async (req, res) => {
  try {
    const { formationId } = req.params;
    const isAdminRequest = req.user && req.user.role === "admin";

    console.log("📩 ID de formación recibido:", formationId);
    console.log("👤 Es admin?", isAdminRequest);

    // Verificar si la formación existe
    const formationExists = await Formation.findById(formationId);
    if (!formationExists) {
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    // Si el usuario no es admin, filtrar solo los módulos visibles
    const query = { formation: formationId };
    if (!isAdminRequest) {
      query.$or = [{ "visible.es": true }, { "visible.en": true }, { "visible.fr": true }];
    }

    const modules = await Module.find(query).populate("classes");

    console.log("📤 Módulos encontrados:", modules);

    res.status(200).json(modules);
  } catch (error) {
    console.error("❌ Error al obtener módulos:", error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Crear un nuevo módulo
const createModule = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { title, description, formationId } = req.body;

    if (!title || !formationId) {
      return res.status(400).json({ error: "El título y la formación son obligatorios" });
    }

    const newModule = new Module({
      title: {
        es: title.es || "",
        en: title.en || "",
        fr: title.fr || ""
      },
      description: {
        es: description?.es || "",
        en: description?.en || "",
        fr: description?.fr || ""
      },
      formation: formationId,
      classes: [], // 🔹 Se inicializa vacío
      visible: { es: false, en: false, fr: false }
    });

    await newModule.save();
    await Formation.findByIdAndUpdate(formationId, { $push: { modules: newModule._id } });

    res.status(201).json(newModule);
  } catch (error) {
    console.error("❌ Error al crear módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Editar un módulo
const updateModule = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { title, description } = req.body;

    const updatedModule = await Module.findByIdAndUpdate(
      req.params.moduleId,
      {
        title: {
          es: title?.es || "",
          en: title?.en || "",
          fr: title?.fr || ""
        },
        description: {
          es: description?.es || "",
          en: description?.en || "",
          fr: description?.fr || ""
        }
      },
      { new: true }
    );

    if (!updatedModule) return res.status(404).json({ error: "Módulo no encontrado" });

    res.status(200).json(updatedModule);
  } catch (error) {
    console.error("❌ Error al actualizar módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Poner el módulo **visible en todos los idiomas** (si estaba oculto, se activa en todos)
const makeModuleVisibleInAllLanguages = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const module = await Module.findById(req.params.moduleId);
    if (!module) return res.status(404).json({ error: "Módulo no encontrado" });

    // 🔹 Se pone visible en **todos los idiomas**
    module.visible = { es: true, en: true, fr: true };

    await module.save();
    res.json({ message: "Módulo ahora es visible en todos los idiomas." });
  } catch (error) {
    console.error("Error cambiando visibilidad del módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Cambiar visibilidad de un idioma específico del módulo
const toggleModuleVisibilityByLanguage = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { language } = req.params;
    const validLanguages = ["es", "en", "fr"];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: "Idioma no válido. Usa 'es', 'en' o 'fr'." });
    }

    const module = await Module.findById(req.params.moduleId);
    if (!module) return res.status(404).json({ error: "Módulo no encontrado" });

    module.visible[language] = !module.visible[language];

    await module.save();
    res.json({ message: `Módulo ahora es ${module.visible[language] ? "visible" : "oculto"} en ${language}` });
  } catch (error) {
    console.error("Error cambiando visibilidad del módulo:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Eliminar un módulo y sus clases (solo admins)
const deleteModule = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { moduleId } = req.params;

    const moduleToDelete = await Module.findById(moduleId);
    if (!moduleToDelete) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    console.log(`🧹 Eliminando módulo con ID: ${moduleId}`);

    // ✅ 1. Eliminar todas las clases asociadas con sus recursos
    const classIds = moduleToDelete.classes || [];

    for (const classId of classIds) {
      await eliminarClaseConRecursos(classId);
    }

    // ✅ 2. Eliminar el módulo en sí
    await Module.findByIdAndDelete(moduleId);

    // ✅ 3. Removerlo del array en la formación
    await Formation.findByIdAndUpdate(moduleToDelete.formation, {
      $pull: { modules: moduleId },
    });

    res.status(200).json({ message: "✅ Módulo y clases asociadas eliminadas correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando módulo:", error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Exportamos correctamente en CommonJS
module.exports = {
  getAllModules,
  getModulesByFormation,
  createModule,
  updateModule,
  makeModuleVisibleInAllLanguages,
  toggleModuleVisibilityByLanguage,
  deleteModule
};
