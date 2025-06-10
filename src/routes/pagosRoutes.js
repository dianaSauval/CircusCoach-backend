const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.post("/compras-simuladas", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const user = await User.findById(req.user.id);

    const agregados = [];
    const yaTenia = [];

    for (let item of items) {
      const itemId = item.id.toString();

      if (item.type === "course") {
        const yaComprado = user.cursosComprados.some(id => id.toString() === itemId);
        if (!yaComprado) {
          user.cursosComprados.push(item.id);
          agregados.push(item);
        } else {
          yaTenia.push(item);
        }
      } else if (item.type === "formation") {
        if (!user.formacionesCompradas) user.formacionesCompradas = [];

        const yaComprado = user.formacionesCompradas.some(id => id.toString() === itemId);
        if (!yaComprado) {
          user.formacionesCompradas.push(item.id);
          agregados.push(item);
        } else {
          yaTenia.push(item);
        }
      }
    }

    await user.save();

    res.json({
      message: "Compra simulada registrada",
      agregados,
      yaTenia,
    });
  } catch (err) {
    console.error("Error al registrar compra:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
