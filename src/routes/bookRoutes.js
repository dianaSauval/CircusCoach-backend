const express = require("express");
const router = express.Router();

const bookController = require("../controllers/bookController");
const {
  authMiddleware,
  isAdminMiddleware,
} = require("../middlewares/authMiddleware");

// =====================
// 🔐 Admin
// =====================
router.get(
  "/admin/all",
  authMiddleware,
  isAdminMiddleware,
  bookController.getAllBooksAdmin
);


router.post("/", authMiddleware, isAdminMiddleware, bookController.createBook);

router.put("/:id", authMiddleware, isAdminMiddleware, bookController.updateBook);

router.patch(
  "/:id/visibility",
  authMiddleware,
  isAdminMiddleware,
  bookController.setBookVisibility
);

router.delete(
  "/:id",
  authMiddleware,
  isAdminMiddleware,
  bookController.deleteBook
);

// =====================
// 🔒 Usuario logueado
// =====================
router.get(
  "/:id/file",
  authMiddleware,
  bookController.getBookFile
);

// =====================
// 🌍 Públicas
// =====================
router.get("/", bookController.getBooks);
router.get("/slug/:slug", bookController.getBookBySlug);
router.get("/:id", bookController.getBookById);


module.exports = router;
