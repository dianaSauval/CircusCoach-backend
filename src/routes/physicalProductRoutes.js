const express = require("express");
const router = express.Router();

const {
  createPhysicalProduct,
  getAllPhysicalProducts,
  getPhysicalProductById,
  updatePhysicalProduct,
  deletePhysicalProduct,
} = require("../controllers/physicalProductController");

const {
  authMiddleware,
  isAdminMiddleware,
} = require("../middlewares/authMiddleware");

// -------------------------
// 🔐 ADMIN (CRUD)
// -------------------------
router.post(
  "/admin",
  authMiddleware,
  isAdminMiddleware,
  createPhysicalProduct
);

router.put(
  "/admin/:id",
  authMiddleware,
  isAdminMiddleware,
  updatePhysicalProduct
);

router.delete(
  "/admin/:id",
  authMiddleware,
  isAdminMiddleware,
  deletePhysicalProduct
);

// -------------------------
// 🌍 PUBLIC (clientes)
// -------------------------
router.get("/", getAllPhysicalProducts);
router.get("/:id", getPhysicalProductById);

module.exports = router;
