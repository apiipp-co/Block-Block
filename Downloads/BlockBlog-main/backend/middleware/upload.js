const multer = require("multer");
const path = require("path");

// Files are held in memory as a Buffer, then streamed to Cloudinary by the
// route handler (see routes/postRoutes.js). Nothing touches local disk.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ok) return cb(null, true);
  cb(new Error("Only image files (jpg, png, webp, gif) are allowed"));
};

// Post spec says "Only 1 Picture" — .single() enforces exactly one file field
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
