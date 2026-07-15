const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  addComment,
  toggleLike,
  toggleDislike,
  toggleSavePost,
} = require("../controllers/postController");

router.get("/", optionalAuth, getPosts); // browse-post: search, filter, sort, pagination
router.get("/:id", optionalAuth, getPostById); // /{postingan}

// Upload the (optional) single picture for a post, returns a URL to use in POST /
router.post("/upload-image", protect, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image file provided" });

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "blockblog", // all post images land in this folder in your Cloudinary account
      transformation: [{ width: 1600, crop: "limit" }],
    },
    (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Image upload failed", error: error.message });
      }
      res.status(201).json({ imageUrl: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

router.post("/", protect, createPost); // /post
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

router.post("/:id/comments", protect, addComment);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/dislike", protect, toggleDislike);
router.post("/:id/save", protect, toggleSavePost);

module.exports = router;
