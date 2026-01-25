// controllers/bookController.js
const Book = require("../models/Book");
const slugify = require("slugify");
const { deleteArchivoCloudinary } = require("./cloudinaryController");


// Helpers
const buildSlug = (input = "") =>
  slugify(String(input), { lower: true, strict: true, trim: true });

const isDuplicateKeyError = (err) =>
  err && (err.code === 11000 || err.name === "MongoServerError");

/**
 * ✅ CREATE (admin)
 * body:
 * - title (string) required
 * - description (string)
 * - language ("es"|"en"|"fr") required
 * - price (number) required
 * - pdf: { url, public_id } optional (si lo subís antes con upload endpoint)
 * - coverImage: { url, public_id } optional
 * - visible (boolean) optional (default false en el modelo)
 * - access: { viewOnline, downloadable } optional
 * - slug optional (si no viene, se genera por title)
 */
exports.createBook = async (req, res) => {
  try {
    const {
      title,
      description,
      language,
      price,
      pdf,
      coverImage,
      visible,
      access,
      slug: slugFromBody,
      type,
    } = req.body;

    if (!title || String(title).trim() === "") {
      return res.status(400).json({ error: "title is required" });
    }

    if (!language || !["es", "en", "fr"].includes(language)) {
      return res
        .status(400)
        .json({ error: "language must be one of: es, en, fr" });
    }

    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return res
        .status(400)
        .json({ error: "price is required and must be a number" });
    }

    // slug único (si no mandan slug, usa title)
    const baseSlug = slugFromBody?.trim()
      ? buildSlug(slugFromBody)
      : buildSlug(title);

    let finalSlug = baseSlug;
    let i = 1;
    while (await Book.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${i++}`;
    }

    const book = await Book.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      language,
      price: Number(price),
      slug: finalSlug,
      pdf: pdf || { url: "", public_id: "" },
      coverImage: coverImage || { url: "", public_id: "" },
      visible: typeof visible === "boolean" ? visible : false,
      access: access || { viewOnline: true, downloadable: true },
      type: type || "ebook_pdf",
    });

    return res.status(201).json(book);
  } catch (err) {
    console.error("❌ Error createBook:", err.message);

    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: "Duplicate key (slug already exists)" });
    }

    return res.status(500).json({ error: "Error creating book" });
  }
};

/**
 * ✅ UPDATE (admin)
 * - Permite editar todo.
 * - Si cambian title y NO mandan slug, regenera slug (con sufijo si colisiona).
 * - Si reemplazan pdf/cover, pueden pasar flags para borrar assets previos:
 *   - deletePreviousPdf: boolean
 *   - deletePreviousCover: boolean
 */
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      language,
      price,
      pdf,
      coverImage,
      visible,
      access,
      slug: slugFromBody,
      type,
      deletePreviousPdf,
      deletePreviousCover,
    } = req.body;

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    const prevPdfPublicId = book?.pdf?.public_id || "";
    const prevCoverPublicId = book?.coverImage?.public_id || "";

    // Campos simples
    if (title !== undefined) book.title = String(title).trim();
    if (description !== undefined) book.description = String(description).trim();

    if (language !== undefined) {
      if (!["es", "en", "fr"].includes(language)) {
        return res.status(400).json({ error: "Invalid language. Use es/en/fr" });
      }
      book.language = language;
    }

    if (price !== undefined && price !== null && price !== "") {
      if (Number.isNaN(Number(price))) {
        return res.status(400).json({ error: "price must be a number" });
      }
      book.price = Number(price);
    }

    if (typeof visible === "boolean") book.visible = visible;
    if (access) book.access = { ...book.access, ...access };
    if (type) book.type = type;

    // Slug: si viene explícito lo usamos, si no y cambió title, regeneramos
    const hasExplicitSlug = slugFromBody?.trim();

    if (hasExplicitSlug) {
      const base = buildSlug(slugFromBody);
      let final = base;
      let i = 1;
      while (await Book.exists({ slug: final, _id: { $ne: book._id } })) {
        final = `${base}-${i++}`;
      }
      book.slug = final;
    } else if (title !== undefined) {
      const base = buildSlug(book.title);
      let final = base;
      let i = 1;
      while (await Book.exists({ slug: final, _id: { $ne: book._id } })) {
        final = `${base}-${i++}`;
      }
      book.slug = final;
    }

    // Assets
    if (pdf) book.pdf = pdf;
    if (coverImage) book.coverImage = coverImage;

    await book.save();

    // Borrar assets previos si se reemplazaron
    if (
      deletePreviousPdf &&
      pdf?.public_id &&
      prevPdfPublicId &&
      prevPdfPublicId !== pdf.public_id
    ) {
      await deleteArchivoCloudinary(prevPdfPublicId, "raw");
    }

    if (
      deletePreviousCover &&
      coverImage?.public_id &&
      prevCoverPublicId &&
      prevCoverPublicId !== coverImage.public_id
    ) {
      await deleteArchivoCloudinary(prevCoverPublicId, "image");
    }

    return res.json(book);
  } catch (err) {
    console.error("❌ Error updateBook:", err.message);

    if (isDuplicateKeyError(err)) {
      return res.status(409).json({ error: "Duplicate key (slug already exists)" });
    }

    return res.status(500).json({ error: "Error updating book" });
  }
};

/**
 * ✅ DELETE (admin)
 * query: ?deleteAssets=true/false (default true)
 */
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteAssets = String(req.query.deleteAssets ?? "true") === "true";

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (deleteAssets) {
      if (book?.pdf?.public_id) await deleteArchivoCloudinary(book.pdf.public_id, "raw");
      if (book?.coverImage?.public_id) await deleteArchivoCloudinary(book.coverImage.public_id, "image");
    }

    await Book.findByIdAndDelete(id);
    return res.json({ success: true, message: "Book deleted" });
  } catch (err) {
    console.error("❌ Error deleteBook:", err.message);
    return res.status(500).json({ error: "Error deleting book" });
  }
};

/**
 * ✅ GET ALL (public)
 * - solo devuelve visibles
 */
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ visible: true }).sort({ createdAt: -1 });
    return res.json(books);
  } catch (err) {
    console.error("❌ Error getBooks:", err.message);
    return res.status(500).json({ error: "Error fetching books" });
  }
};

/**
 * ✅ GET ALL (admin)
 */
exports.getAllBooksAdmin = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    return res.json(books);
  } catch (err) {
    console.error("❌ Error getAllBooksAdmin:", err.message);
    return res.status(500).json({ error: "Error fetching books" });
  }
};

/**
 * ✅ GET BY ID (public)
 * - solo si visible
 */
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findOne({ _id: id, visible: true });
    if (!book) return res.status(404).json({ error: "Book not found" });
    return res.json(book);
  } catch (err) {
    console.error("❌ Error getBookById:", err.message);
    return res.status(500).json({ error: "Error fetching book" });
  }
};

/**
 * ✅ GET BY SLUG (public)
 * - solo si visible
 */
exports.getBookBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const book = await Book.findOne({ slug, visible: true });
    if (!book) return res.status(404).json({ error: "Book not found" });
    return res.json(book);
  } catch (err) {
    console.error("❌ Error getBookBySlug:", err.message);
    return res.status(500).json({ error: "Error fetching book" });
  }
};

/**
 * ✅ TOGGLE VISIBLE (admin)
 */
exports.setBookVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    if (typeof visible !== "boolean") {
      return res.status(400).json({ error: "visible must be boolean" });
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { visible },
      { new: true }
    );

    if (!book) return res.status(404).json({ error: "Book not found" });

    return res.json(book);
  } catch (err) {
    console.error("❌ Error setBookVisibility:", err.message);
    return res.status(500).json({ error: "Error updating visibility" });
  }
};


/**
 * 📘 GET BOOK PDF (user/admin)
 * - Admin: siempre puede acceder
 * - User: solo si compró el libro
 */
exports.getBookFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // bookId

    const book = await Book.findById(id);
    if (!book || !book.visible) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (!book.pdf?.url) {
      return res.status(404).json({ error: "Book has no PDF" });
    }

    const user = await require("../models/User").findById(userId);
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    // 🛡️ Admin bypass
    if (user.role === "admin") {
      return res.json({
        url: book.pdf.url,
        downloadable: book.access?.downloadable ?? true,
        viewOnline: book.access?.viewOnline ?? true,
      });
    }

    // 📚 Verificar compra
    const comproLibro = user.librosComprados?.some(
      (c) => c.bookId.toString() === id
    );

    if (!comproLibro) {
      return res.status(403).json({ error: "You did not purchase this book" });
    }

    // ✅ Acceso autorizado
    return res.json({
      url: book.pdf.url,
      downloadable: book.access?.downloadable ?? true,
      viewOnline: book.access?.viewOnline ?? true,
    });
  } catch (err) {
    console.error("❌ Error getBookFile:", err.message);
    return res.status(500).json({ error: "Error getting book file" });
  }
};
