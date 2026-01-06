// src/controllers/physicalProductController.js
const PhysicalProduct = require("../models/PhysicalProduct");

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const normalizeLangField = (obj) => {
  const safe = obj && typeof obj === "object" ? obj : {};
  return {
    es: safe.es ? String(safe.es).trim() : "",
    en: safe.en ? String(safe.en).trim() : "",
    fr: safe.fr ? String(safe.fr).trim() : "",
  };
};

exports.createPhysicalProduct = async (req, res) => {
  try {
    const { title, description, imageUrl, amazonUrl, priceEur, stock } = req.body;

    if (!title || !imageUrl || !amazonUrl || priceEur === undefined || stock === undefined) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const titleObj = normalizeLangField(title);
    const descObj = normalizeLangField(description);

    if (!titleObj.es && !titleObj.en && !titleObj.fr) {
      return res.status(400).json({ message: "El título debe estar en al menos un idioma." });
    }

    if (!Number.isInteger(Number(stock))) {
      return res.status(400).json({ message: "Stock debe ser un número entero." });
    }

    const product = await PhysicalProduct.create({
      title: titleObj,
      description: descObj,
      imageUrl: String(imageUrl).trim(),
      amazonUrl: String(amazonUrl).trim(),
      priceEur: Number(priceEur),
      stock: Number(stock),
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("❌ Error createPhysicalProduct:", error);
    return res.status(500).json({ message: "Error creando producto físico." });
  }
};

exports.getAllPhysicalProducts = async (req, res) => {
  try {
    const products = await PhysicalProduct.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error getAllPhysicalProducts:", error);
    return res.status(500).json({ message: "Error obteniendo productos físicos." });
  }
};

exports.getPhysicalProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const product = await PhysicalProduct.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("❌ Error getPhysicalProductById:", error);
    return res.status(500).json({ message: "Error obteniendo el producto físico." });
  }
};

exports.updatePhysicalProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const patch = { ...req.body };

    // Multi-idioma
    if (patch.title !== undefined) patch.title = normalizeLangField(patch.title);
    if (patch.description !== undefined) patch.description = normalizeLangField(patch.description);

    // Campos simples
    if (patch.imageUrl !== undefined) patch.imageUrl = String(patch.imageUrl).trim();
    if (patch.amazonUrl !== undefined) patch.amazonUrl = String(patch.amazonUrl).trim();

    if (patch.stock !== undefined) {
      if (!Number.isInteger(Number(patch.stock))) {
        return res.status(400).json({ message: "Stock debe ser un número entero." });
      }
      patch.stock = Number(patch.stock);
    }

    if (patch.priceEur !== undefined) {
      patch.priceEur = Number(patch.priceEur);
    }

    const updated = await PhysicalProduct.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updatePhysicalProduct:", error);
    return res.status(500).json({ message: "Error actualizando producto físico." });
  }
};

exports.deletePhysicalProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const deleted = await PhysicalProduct.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    return res.status(200).json({ message: "Producto eliminado con éxito." });
  } catch (error) {
    console.error("❌ Error deletePhysicalProduct:", error);
    return res.status(500).json({ message: "Error eliminando producto físico." });
  }
};
