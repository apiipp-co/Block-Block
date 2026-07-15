const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    image: {
      type: String, // URL/path, optional — "Only 1 Picture" per spec
      default: null,
    },
    imageFit: {
      // How the (optional) picture is displayed: "contain" shows it in full
      // (letterboxed), "cover" crops it to fill the frame. Author's choice
      // at post creation, applied consistently everywhere the post appears.
      type: String,
      enum: ["cover", "contain"],
      default: "cover",
    },
    body: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Enable text search across title and body
postSchema.index({ title: "text", body: "text" });

module.exports = mongoose.model("Post", postSchema);
