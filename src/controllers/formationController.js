const Formation = require("../models/Formation");
const Module = require("../models/Module");
const Class = require("../models/Class");
const { eliminarClaseConRecursos } = require("./classController");
const { eliminarVideosDeObjeto } = require("./uploadController");
const { deleteArchivoCloudinary } = require("./cloudinaryController");
const { deleteImagenesCurso } = require("./cloudinaryController");

// 🔹 Middleware para verificar si el usuario es admin
const isAdmin = (req) => req.user && req.user.role === "admin";

// 🔹 Obtener formaciones visibles por idioma
exports.getFormations = async (req, res) => {
  const lang = req.query.lang || "es";

  try {
    // Buscamos formaciones donde visible.[lang] sea true
    const formations = await Formation.find({ [`visible.${lang}`]: true });

    // Formateamos la respuesta para enviar solo lo necesario
    const formatted = formations.map((f) => ({
      _id: f._id,
      title: f.title?.[lang] || "",
      description: f.description?.[lang] || "",
      image: f.image?.[lang] || "",
      type: f.type || "", // por si querés filtrar después en frontend
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error obteniendo formaciones:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Obtener todas las formaciones (admin)
exports.getAllFormations = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });
  try {
    const formations = await Formation.find().populate("modules");
    res.json(formations);
  } catch (error) {
    console.error("Error obteniendo formaciones:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Obtener formación por ID y por idioma (sin autenticación)
// 🔹 Obtener formación por ID (con visibilidad por idioma, pero devuelve todo el objeto multilenguaje)
exports.getFormationById = async (req, res) => {
  const { id } = req.params;
  const lang = req.query.lang || "es";

  try {
    const formation = await Formation.findById(id).populate("modules");

    if (!formation) {
      return res.status(404).json({ message: "Formación no encontrada" });
    }

    if (!formation.visible?.[lang]) {
      return res.status(403).json({
        message: `La formación aún no está disponible en ${lang.toUpperCase()}.`,
        availableLanguages: formation.visible,
      });
    }

    // 👉 Devuelve el objeto completo (como getCourseById)
    res.status(200).json(formation);
  } catch (error) {
    console.error("Error al obtener la formación:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// 🔹 Obtener formación por ID
exports.getFormationByIdAllInformation = async (req, res) => {
  try {
    const { id } = req.params;
    const formation = await Formation.findById(id).populate("modules");

    if (!formation) {
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    res.json(formation);
  } catch (error) {
    console.error("Error obteniendo formación por ID:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.getFormationVisibleContent = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "es";

    const formation = await Formation.findById(id);
    if (!formation) {
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    // ⚠️ Si no está visible en este idioma, devolver 403 (excepto si es admin, si querés agregar esa lógica luego)
    if (!formation.visible?.[lang]) {
      return res.status(403).json({
        error: "Esta formación no está disponible en este idioma",
        visible: false,
      });
    }

    const modules = await Module.find({
      formation: id,
      [`visible.${lang}`]: true,
    });

    const modulesConClases = await Promise.all(
      modules.map(async (mod) => {
        const classes = await Class.find({
          module: mod._id,
          [`visible.${lang}`]: true,
        }).select("title");
        return {
          _id: mod._id,
          title: mod.title,
          description: mod.description,
          classes,
        };
      })
    );

    res.json({
      formation: {
        _id: formation._id,
        title: formation.title,
        description: formation.description,
        image: formation.image,
      },
      modules: modulesConClases,
    });
  } catch (error) {
    console.error("❌ Error en getFormationVisibleContent:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Crear formación
exports.createFormation = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { title, description, price, pdf, video, image } = req.body;

    if (!title?.es || !description?.es || !price) {
      return res.status(400).json({
        error: "Título en español, descripción y precio son obligatorios",
      });
    }

    const newFormation = new Formation({
      title: {
        es: title.es,
        en: title.en || "",
        fr: title.fr || "",
      },
      description: {
        es: description.es,
        en: description.en || "",
        fr: description.fr || "",
      },
      price,
      modules: [],
      visible: {
        es: false,
        en: false,
        fr: false,
      },
      pdf: {
        es: pdf?.es || "",
        en: pdf?.en || "",
        fr: pdf?.fr || "",
      },
      video: {
        es: video?.es || "",
        en: video?.en || "",
        fr: video?.fr || "",
      },
      image: {
        es: image?.es || "",
        en: image?.en || "",
        fr: image?.fr || "",
      },
    });

    await newFormation.save();
    res.status(201).json(newFormation);
  } catch (error) {
    console.error("❌ ERROR en createFormation:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Actualizar formación
exports.updateFormation = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { title, description, price, visible, pdf, video, image } = req.body;
    const { id } = req.params;

    const formation = await Formation.findById(id);
    if (!formation) {
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    if (title) {
      formation.title.es = title.es ?? formation.title.es;
      formation.title.en = title.en ?? formation.title.en;
      formation.title.fr = title.fr ?? formation.title.fr;
    }

    if (description) {
      formation.description.es = description.es ?? formation.description.es;
      formation.description.en = description.en ?? formation.description.en;
      formation.description.fr = description.fr ?? formation.description.fr;
    }

    if (price !== undefined) {
      formation.price = price;
    }

    if (visible) {
      formation.visible.es = visible.es ?? formation.visible.es;
      formation.visible.en = visible.en ?? formation.visible.en;
      formation.visible.fr = visible.fr ?? formation.visible.fr;
    }

    if (pdf) {
      formation.pdf = {
        ...formation.pdf,
        es: pdf.es ?? formation.pdf?.es,
        en: pdf.en ?? formation.pdf?.en,
        fr: pdf.fr ?? formation.pdf?.fr,
      };
    }

    if (video) {
      formation.video = {
        ...formation.video,
        es: video.es ?? formation.video?.es,
        en: video.en ?? formation.video?.en,
        fr: video.fr ?? formation.video?.fr,
      };
    }

    if (image) {
      formation.image = {
        ...formation.image,
        es: image.es ?? formation.image?.es,
        en: image.en ?? formation.image?.en,
        fr: image.fr ?? formation.image?.fr,
      };
    }

    await formation.save();
    res
      .status(200)
      .json({ message: "Formación actualizada correctamente", formation });
  } catch (error) {
    console.error("❌ ERROR en updateFormation:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};

// 🔹 Hacer visible en todos los idiomas
exports.makeFormationVisibleInAllLanguages = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { id } = req.params;
    const formation = await Formation.findById(id);
    if (!formation)
      return res.status(404).json({ error: "Formación no encontrada" });

    formation.visible = { es: true, en: true, fr: true };
    await formation.save();

    res.json({ message: "Formación ahora es visible en todos los idiomas." });
  } catch (error) {
    console.error("Error haciendo visible en todos los idiomas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Alternar visibilidad por idioma
exports.toggleFormationVisibilityByLanguage = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { id } = req.params;
    const { language } = req.body;

    if (!["es", "en", "fr"].includes(language)) {
      return res.status(400).json({ error: "Idioma no válido" });
    }

    const formation = await Formation.findById(id);
    if (!formation)
      return res.status(404).json({ error: "Formación no encontrada" });

    formation.visible[language] = !formation.visible[language];
    await formation.save();

    res.json({
      message: `Formación en ${language.toUpperCase()} ahora es ${
        formation.visible[language] ? "visible" : "oculta"
      }`,
    });
  } catch (error) {
    console.error("Error cambiando visibilidad por idioma:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Eliminar formación (junto con módulos, clases, videos y PDFs asociados)
exports.deleteFormation = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const formation = await Formation.findById(req.params.id).populate(
      "modules"
    );

    if (!formation) {
      return res.status(404).json({ error: "Formación no encontrada" });
    }

    console.log(`🧹 Eliminando formación con ID: ${formation._id}`);

    // 🔸 1. Eliminar videos de la formación
    await eliminarVideosDeObjeto(formation.video);

    // 🔸 2. Eliminar PDFs públicos
    for (const lang of ["es", "en", "fr"]) {
      const url = formation.pdf?.[lang];
      if (url && url.includes("cloudinary.com")) {
        const match = url.match(
          /\/upload\/(?:v\d+\/)?PDFsPublicos\/(.+)\.pdf/i
        );
        const publicId = match ? `PDFsPublicos/${match[1]}.pdf` : null;
        if (publicId) {
          await deleteArchivoCloudinary(publicId, "raw");
          console.log(`✅ PDF eliminado: ${publicId}`);
        }
      }
    }

    // 🔸 3. Eliminar imágenes de la formación
    await deleteImagenesCurso(formation.image);

    // 🔸 4. Eliminar módulos y clases asociadas
    const modules = formation.modules;

    for (const mod of modules) {
      const module = await Module.findById(mod._id).populate("classes");

      if (module?.classes?.length > 0) {
        for (const clase of module.classes) {
          console.log(`🔍 Procesando clase: ${clase._id}`);

          if (clase.videos?.length > 0) {
            console.log(
              `🎬 Videos encontrados en clase ${clase._id}:`,
              clase.videos
            );
            for (const video of clase.videos) {
              console.log(`⛔ Eliminando video con URL:`, video.url);
              await eliminarVideosDeObjeto(video.url);
            }
          } else {
            console.log(`⚠️ No se encontraron videos en clase ${clase._id}`);
          }

          if (clase.pdfs?.length > 0) {
            console.log(
              `📄 PDFs encontrados en clase ${clase._id}:`,
              clase.pdfs
            );
            for (const pdf of clase.pdfs) {
              const publicIds = Object.values(pdf.url || {})
                .filter((url) => url.includes("cloudinary.com"))
                .map((url) => {
                  const match = url.match(
                    /\/upload\/(?:v\d+\/)?PDFsPrivados\/(.+)\.pdf/
                  );
                  return match ? `PDFsPrivados/${match[1]}.pdf` : null;
                })
                .filter(Boolean);

              console.log(`📑 publicIds encontrados:`, publicIds);

              for (const publicId of publicIds) {
                try {
                  console.log(
                    `⛔ Eliminando PDF desde Cloudinary: ${publicId}`
                  );
                  await deleteArchivoCloudinary(publicId, "raw");
                  console.log(`✅ PDF eliminado: ${publicId}`);
                } catch (err) {
                  console.warn(
                    `⚠️ Error al eliminar PDF ${publicId}:`,
                    err.message
                  );
                }
              }
            }
          } else {
            console.log(`⚠️ No se encontraron PDFs en clase ${clase._id}`);
          }

          await Class.findByIdAndDelete(clase._id);
          console.log(`🗑️ Clase eliminada: ${clase._id}`);
        }
      } else {
        console.log(`⚠️ El módulo ${mod._id} no tiene clases`);
      }

      await Module.findByIdAndDelete(mod._id);
      console.log(`🗑️ Módulo eliminado: ${mod._id}`);
    }

    // 🔸 5. Eliminar la formación en sí
    await Formation.findByIdAndDelete(req.params.id);

    res.json({
      message: "Formación y todos sus recursos eliminados correctamente",
    });
  } catch (error) {
    console.error("❌ ERROR en deleteFormation:", error);
    res
      .status(500)
      .json({ error: "Error en el servidor", details: error.message });
  }
};
