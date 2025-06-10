const Course = require("../models/Course");
const CourseClass = require("../models/CourseClass");
const { deleteFromVimeo, deleteFromVimeoById } = require("../controllers/uploadController");

const isAdmin = (req) => req.user && req.user.role === "admin";

// 🔹 Obtener todos los cursos (admin)
exports.getAllCourses = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const courses = await Course.find().populate("classes");
    res.json(courses);
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Obtener cursos visibles por idioma (alumnos)
exports.getVisibleCoursesByLanguage = async (req, res) => {
  const lang = req.query.lang || "es";

  if (!["es", "en", "fr"].includes(lang)) {
    return res.status(400).json({ error: "Idioma no válido" });
  }

  try {
    const courses = await Course.find({ [`visible.${lang}`]: true }).populate(
      "classes"
    );
    res.json(courses);
  } catch (error) {
    console.error("Error obteniendo cursos visibles:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Obtener curso por ID y devolver toda la estructura multilenguaje
exports.getCourseById = async (req, res) => {
  const { id } = req.params;
  const lang = req.query.lang || "es";

  try {
    const course = await Course.findById(id).populate("classes");

    if (!course) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Verificar visibilidad en el idioma
    if (!course.visible?.[lang]) {
      return res
        .status(403)
        .json({ error: "Curso no disponible en este idioma" });
    }

    // Filtrar clases visibles por idioma
    const clasesFiltradas = course.classes.filter((cl) => cl.visible?.[lang]);

    // ✅ Devolvemos todo el contenido multilenguaje, no solo el traducido
    res.json({
      _id: course._id,
      title: course.title, // ← objeto completo
      description: course.description,
      image: course.image,
      video: course.video,
      pdf: course.pdf,
      visible: course.visible,
      price: course.price,
      classes: clasesFiltradas,
    });
  } catch (error) {
    console.error("Error al obtener curso por ID:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Crear un curso (admin)
exports.createCourse = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { title, description, price, image, pdf, video } = req.body;

    if (!title?.es || !description?.es || !price) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const newCourse = new Course({
      title,
      description,
      price,
      image,
      pdf,
      video,
      classes: [],
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Actualizar un curso (admin)
exports.updateCourse = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { id } = req.params;
    const updatedData = req.body;

    const course = await Course.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔄 Cambiar visibilidad de un curso por idioma
exports.toggleCourseVisibilityByLanguage = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { id } = req.params;
    const { language } = req.body;

    if (!["es", "en", "fr"].includes(language)) {
      return res.status(400).json({ error: "Idioma no válido" });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Curso no encontrado" });

    course.visible[language] = !course.visible[language];
    await course.save({ validateBeforeSave: false }); // 👈 Aca está la clave

    res.json({
      message: `Curso en ${language.toUpperCase()} ahora está ${
        course.visible[language] ? "visible" : "oculto"
      }`,
    });
  } catch (error) {
    console.error("Error al cambiar visibilidad del curso:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// 🔹 Eliminar un curso y sus clases (admin)
exports.deleteCourse = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: "No autorizado" });

  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate("classes");

    if (!course) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // 🔹 Eliminar todos los videos de las clases asociadas
    for (const clase of course.classes) {
      for (const video of clase.videos) {
        for (const lang of ["es", "en", "fr"]) {
          const url = video.url?.[lang];
          if (url && url.includes("vimeo.com")) {
            const videoId = url.split("/").pop();
            try {
              await deleteFromVimeoById(videoId); // ✅ AHORA sí está bien
            } catch (err) {
              console.warn(`Error al eliminar video ${videoId}:`, err.message);
            }
          }
        }
      }
    }

    // 🔹 Eliminar las clases asociadas
    await CourseClass.deleteMany({
      _id: { $in: course.classes.map((c) => c._id) },
    });

    // 🔹 Eliminar el curso
    await Course.findByIdAndDelete(id);

    res.json({ message: "Curso, clases y videos eliminados correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
