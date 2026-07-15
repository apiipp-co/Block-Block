const User = require("../models/User");
const Post = require("../models/Post");

// GET /api/users/me  -> /User "Info akun"
exports.getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  });
};

// PUT /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (name !== undefined) user.name = name;
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// GET /api/users/me/posts -> "User Posted"
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your posts", error: error.message });
  }
};

// GET /api/users/me/saved -> /Saved Post
// Title, Image(optional), article limited to 30 words in the response
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      select: "title image imageFit body createdAt category",
    });

    const trimmed = user.savedPosts.map((post) => {
      const words = post.body.split(/\s+/).slice(0, 30).join(" ");
      return {
        id: post._id,
        title: post.title,
        image: post.image,
        imageFit: post.imageFit || "cover",
        excerpt: words + (post.body.split(/\s+/).length > 30 ? "..." : ""),
        category: post.category,
        createdAt: post.createdAt,
      };
    });

    res.json(trimmed);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch saved posts", error: error.message });
  }
};
