const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware } = require("../middlewares/authMiddleware");
const registrarCompraUsuario = require("../utils/registrarCompraUsuario");

router.post("/compras-simuladas", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const user = await User.findById(req.user.id);
    const { agregados, yaTenia } = await registrarCompraUsuario(user, items);

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
