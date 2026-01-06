const Discount = require("../models/Discount");

// -------- Helpers --------
const isLangObject = (v) =>
  v && typeof v === "object" && !Array.isArray(v);

const toLangObject = (value) => {
  // Si ya es {es,en,fr}, lo devolvemos "limpio"
  if (isLangObject(value)) {
    return {
      es: (value.es || "").toString().trim(),
      en: (value.en || "").toString().trim(),
      fr: (value.fr || "").toString().trim(),
    };
  }

  // Si viene como string, lo ponemos en ES por defecto (compatibilidad)
  if (typeof value === "string") {
    return { es: value.trim(), en: "", fr: "" };
  }

  // Si viene null/undefined/otro
  return { es: "", en: "", fr: "" };
};

const hasAnyLang = (obj) =>
  Boolean(obj?.es?.trim() || obj?.en?.trim() || obj?.fr?.trim());

// Normaliza payload: fechas inclusivas y targetIds desde targetItems
const normalizeDiscountPayload = (payload = {}) => {
  const body = { ...payload };

  // ✅ Multilenguaje
  if (body.name !== undefined) body.name = toLangObject(body.name);
  if (body.description !== undefined) body.description = toLangObject(body.description);

  // ✅ targetItems.title multilenguaje (si lo implementaste)
  if (Array.isArray(body.targetItems)) {
    body.targetItems = body.targetItems
      .filter(Boolean)
      .map((it) => ({
        _id: it._id,
        title: toLangObject(it.title),
      }));

    // Derivar targetIds desde targetItems
    body.targetIds = body.targetItems
      .map((it) => it?._id)
      .filter(Boolean);
  }

  // Fechas: inicio a 00:00 y fin a 23:59:59.999 (día inclusivo)
  if (body.startDate) {
    const s = new Date(body.startDate);
    s.setHours(0, 0, 0, 0);
    body.startDate = s;
  }
  if (body.endDate) {
    const e = new Date(body.endDate);
    e.setHours(23, 59, 59, 999);
    body.endDate = e;
  }

  // Números (por si llegan como string)
  if (body.percentage !== undefined) body.percentage = Number(body.percentage) || 0;
  if (body.amount !== undefined) body.amount = Number(body.amount) || 0;

  return body;
};

// -------- Controllers --------

// 🟢 Crear un nuevo bono
exports.createDiscount = async (req, res) => {
  try {
    const body = normalizeDiscountPayload(req.body);

    // ✅ Validación mínima para multilenguaje: al menos un idioma
    if (!body.name || !hasAnyLang(body.name)) {
      return res
        .status(400)
        .json({ message: "El nombre del bono es obligatorio (al menos en un idioma)." });
    }

    const nuevoBono = await Discount.create(body);
    res.status(201).json(nuevoBono);
  } catch (error) {
    console.error("❌ Error createDiscount:", error);
    res.status(500).json({ message: "Error al crear el bono", error });
  }
};

// 🟡 Editar un bono existente
exports.updateDiscount = async (req, res) => {
  try {
    const body = normalizeDiscountPayload(req.body);

    // ✅ Si mandan name, validarlo
    if (body.name !== undefined && !hasAnyLang(body.name)) {
      return res
        .status(400)
        .json({ message: "El nombre del bono no puede quedar vacío en todos los idiomas." });
    }

    const updated = await Discount.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Bono no encontrado" });
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updateDiscount:", error);
    res.status(500).json({ message: "Error al actualizar el bono", error });
  }
};

// 🔴 Eliminar un bono
exports.deleteDiscount = async (req, res) => {
  try {
    const deleted = await Discount.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Bono no encontrado" });
    res.json({ message: "Bono eliminado" });
  } catch (error) {
    console.error("❌ Error deleteDiscount:", error);
    res.status(500).json({ message: "Error al eliminar el bono", error });
  }
};

// 📄 Obtener todos los bonos (para admin)
exports.getAllDiscounts = async (req, res) => {
  try {
    const bonos = await Discount.find().sort({ startDate: -1 });
    res.json(bonos);
  } catch (error) {
    console.error("❌ Error getAllDiscounts:", error);
    res.status(500).json({ message: "Error al obtener los bonos", error });
  }
};

// ⏳ Obtener bonos activos y vigentes
exports.getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const activos = await Discount.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
    res.json(activos);
  } catch (error) {
    console.error("❌ Error getActiveDiscounts:", error);
    res.status(500).json({ message: "Error al obtener los bonos activos", error });
  }
};

// 🔎 Obtener un bono por ID
exports.getDiscountById = async (req, res) => {
  try {
    const bono = await Discount.findById(req.params.id);
    if (!bono) return res.status(404).json({ message: "Bono no encontrado" });
    res.json(bono);
  } catch (error) {
    console.error("❌ Error getDiscountById:", error);
    res.status(500).json({ message: "Error al obtener el bono", error });
  }
};
