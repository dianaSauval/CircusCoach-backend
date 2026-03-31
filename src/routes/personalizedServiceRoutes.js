const express = require("express");
const router = express.Router();

const {
  createRequest,
  getAllRequests,
  getRequestById,
  setCustomPrice,
  approveRequest,
  rejectRequest,
} = require("../controllers/personalizedServiceController");

const {
  authMiddleware,
  isAdminMiddleware,
} = require("../middlewares/authMiddleware");

// pública
router.post("/requests", createRequest);

// admin
router.get("/requests", authMiddleware, isAdminMiddleware, getAllRequests);
router.get("/requests/:id", authMiddleware, isAdminMiddleware, getRequestById);

router.patch(
  "/requests/:id/set-price",
  authMiddleware,
  isAdminMiddleware,
  setCustomPrice
);

router.patch(
  "/requests/:id/approve",
  authMiddleware,
  isAdminMiddleware,
  approveRequest
);

router.patch(
  "/requests/:id/reject",
  authMiddleware,
  isAdminMiddleware,
  rejectRequest
);

module.exports = router;