const Discount = require("../models/Discount");

// 🟢 Crear un nuevo bono
exports.createDiscount = async (req, res) => {
  try {
    const nuevoBono = new Discount(req.body);
    await nuevoBono.save();
    res.status(201).json(nuevoBono);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el bono", error });
  }
};

// 🟡 Editar un bono existente
exports.updateDiscount = async (req, res) => {
  try {
    const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!updated) {
      return res.status(404).json({ message: "Bono no encontrado" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el bono", error });
  }
};

// 🔴 Eliminar un bono
exports.deleteDiscount = async (req, res) => {
  try {
    const deleted = await Discount.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Bono no encontrado" });
    }
    res.json({ message: "Bono eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el bono", error });
  }
};

// 📄 Obtener todos los bonos (para admin)
exports.getAllDiscounts = async (req, res) => {
  try {
    const bonos = await Discount.find().sort({ startDate: -1 });
    res.json(bonos);
  } catch (error) {
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
      endDate: { $gte: now }
    });
    res.json(activos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los bonos activos", error });
  }
};

// 🔎 Obtener un bono por ID
exports.getDiscountById = async (req, res) => {
  try {
    const bono = await Discount.findById(req.params.id);
    if (!bono) {
      return res.status(404).json({ message: "Bono no encontrado" });
    }
    res.json(bono);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el bono", error });
  }
};

