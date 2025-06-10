const express = require('express');
const router = express.Router();

const {
  getAllPresentialFormations,
  getVisiblePresentialFormations,
  createPresentialFormation,
  updatePresentialFormation,
  deletePresentialFormation
} = require('../controllers/presentialFormationController');

const { authMiddleware, isAdminMiddleware } = require("../middlewares/authMiddleware");

// 📌 Rutas públicas

router.get("/presencial", getVisiblePresentialFormations);


// 📌 Rutas solo para admin
router.get('/', authMiddleware, getAllPresentialFormations);
router.post('/', authMiddleware, isAdminMiddleware, createPresentialFormation);
router.put('/:id', authMiddleware, isAdminMiddleware, updatePresentialFormation);
router.delete('/:id', authMiddleware, isAdminMiddleware, deletePresentialFormation);

module.exports = router;
