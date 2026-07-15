const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getMe,
  updateMe,
  getMyPosts,
  getSavedPosts,
} = require("../controllers/userController");

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.get("/me/posts", protect, getMyPosts);
router.get("/me/saved", protect, getSavedPosts);

module.exports = router;
