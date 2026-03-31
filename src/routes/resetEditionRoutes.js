const express = require("express");
const router = express.Router();

const {
  createResetEdition,
  getAllResetEditions,
  getPublicResetEditions,
  getResetEditionById,
  updateResetEdition,
  addPaidParticipantToResetEdition,
  removePaidParticipantFromResetEdition,
  toggleResetEditionClosed,
  deleteResetEdition,
} = require("../controllers/resetEditionController");

const {
  authMiddleware,
  isAdminMiddleware,
} = require("../middlewares/authMiddleware");

// =======================
// RUTAS PÚBLICAS
// =======================
router.get("/public", getPublicResetEditions);

// =======================
// RUTAS ADMIN
// =======================
router.post("/admin", authMiddleware, isAdminMiddleware, createResetEdition);

router.get("/admin", authMiddleware, isAdminMiddleware, getAllResetEditions);

router.get("/admin/:id", authMiddleware, isAdminMiddleware, getResetEditionById);

router.put("/admin/:id", authMiddleware, isAdminMiddleware, updateResetEdition);

router.patch(
  "/admin/:id/toggle-closed",
  authMiddleware,
  isAdminMiddleware,
  toggleResetEditionClosed
);

router.post(
  "/admin/:id/paid-participants",
  authMiddleware,
  isAdminMiddleware,
  addPaidParticipantToResetEdition
);

router.delete(
  "/admin/:id/paid-participants/:participantId",
  authMiddleware,
  isAdminMiddleware,
  removePaidParticipantFromResetEdition
);

router.delete("/admin/:id", authMiddleware, isAdminMiddleware, deleteResetEdition);

module.exports = router;