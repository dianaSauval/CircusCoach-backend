const Purchase = require("../models/Purchase");
const Formation = require("../models/Formation");

exports.buyFormation = async (req, res) => {
  try {
    const { formationId } = req.body;
    const userId = req.user.id; // Usuario autenticado

    // Verificar si el usuario ya compró la formación y aún tiene acceso
    const existingPurchase = await Purchase.findOne({
      user: userId,
      formation: formationId,
      expiryDate: { $gte: new Date() }, // Si la fecha de expiración es futura
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "Ya tienes acceso a esta formación." });
    }

    // Calcular la fecha de expiración (1 año desde la compra)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Registrar la compra
    const newPurchase = new Purchase({
      user: userId,
      formation: formationId,
      expiryDate,
      progress: {},
    });

    await newPurchase.save();
    res.json({ message: "Compra realizada con éxito", expiryDate });
  } catch (error) {
    console.error("Error en la compra:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
