const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");




router.post("/", authMiddleware, isAdminMiddleware, discountController.createDiscount);
router.put("/:id", authMiddleware, isAdminMiddleware, discountController.updateDiscount);
router.delete("/:id", authMiddleware, isAdminMiddleware, discountController.deleteDiscount);
router.get("/", authMiddleware, isAdminMiddleware, discountController.getAllDiscounts);
router.get("/activos", discountController.getActiveDiscounts);
router.get("/:id", discountController.getDiscountById);

module.exports = router;
