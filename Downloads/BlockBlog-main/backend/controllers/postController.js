const Post = require("../models/Post");
const User = require("../models/User");

// GET /api/posts
// browse-post feature: scrolling all posts, searching, filter by category,
// sorting by date (latest/oldest) or by likes
exports.getPosts = async (req, res) => {
  try {
    const { search, category, sort = "latest", page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    let sortOption = { createdAt: -1 }; // latest first (default)
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "likes") sortOption = { likesCount: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.aggregate([
      { $match: query },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      { $sort: sortOption },
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    await Post.populate(posts, {
      path: "author",
      select: "name email",
    });

    // Respect anonymous authorship
    const sanitized = posts.map((p) => ({
      ...p,
      author: p.isAnonymous ? { name: "Anonymous" } : p.author,
    }));

    const total = await Post.countDocuments(query);

    res.json({
      posts: sanitized,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalPosts: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts", error: error.message });
  }
};

// GET /api/posts/:id  -> maps to /{postingan}
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name email")
      .populate("comments.user", "name");

    if (!post) return res.status(404).json({ message: "Post not found" });

    const result = post.toObject();
    if (post.isAnonymous) result.author = { name: "Anonymous" };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch post", error: error.message });
  }
};

// POST /api/posts  (auth required) -> /post
exports.createPost = async (req, res) => {
  try {
    const { title, image, imageFit, body, category, isAnonymous } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body text are required" });
    }

    const post = await Post.create({
      title,
      image: image || null,
      imageFit: imageFit === "contain" ? "contain" : "cover",
      body,
      category,
      isAnonymous: !!isAnonymous,
      author: req.user._id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
};

// PUT /api/posts/:id  (author only)
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    const { title, image, imageFit, body, category, isAnonymous } = req.body;
    if (title !== undefined) post.title = title;
    if (image !== undefined) post.image = image;
    if (imageFit !== undefined) post.imageFit = imageFit === "contain" ? "contain" : "cover";
    if (body !== undefined) post.body = body;
    if (category !== undefined) post.category = category;
    if (isAnonymous !== undefined) post.isAnonymous = isAnonymous;

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Failed to update post", error: error.message });
  }
};

// DELETE /api/posts/:id  (author only)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete post", error: error.message });
  }
};

// POST /api/posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text });
    await post.save();

    const populated = await post.populate("comments.user", "name");
    res.status(201).json(populated.comments[populated.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

// POST /api/posts/:id/like  (toggles like, removes opposing dislike)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({ likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to like post", error: error.message });
  }
};

// POST /api/posts/:id/dislike  (toggles dislike, removes opposing like)
exports.toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyDisliked = post.dislikes.some((id) => id.toString() === userId);

    if (alreadyDisliked) {
      post.dislikes = post.dislikes.filter((id) => id.toString() !== userId);
    } else {
      post.dislikes.push(req.user._id);
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();
    res.json({ likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to dislike post", error: error.message });
  }
};

// POST /api/posts/:id/save  (toggles saved post for the logged-in user)
exports.toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(req.user._id);
    const postId = post._id.toString();
    const alreadySaved = user.savedPosts.some((id) => id.toString() === postId);

    if (alreadySaved) {
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== postId);
    } else {
      user.savedPosts.push(post._id);
    }

    await user.save();
    res.json({ saved: !alreadySaved, savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ message: "Failed to save post", error: error.message });
  }
};
