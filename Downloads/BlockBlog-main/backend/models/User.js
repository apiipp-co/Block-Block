const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    // "Simple Question for Forgot Password" flow
    securityQuestion: {
      type: String,
      required: true,
      default: "What is your favorite food?",
    },
    securityAnswer: {
      type: String,
      required: true,
      select: false,
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified("securityAnswer")) {
    const salt = await bcrypt.genSalt(10);
    this.securityAnswer = await bcrypt.hash(
      this.securityAnswer.toLowerCase().trim(),
      salt
    );
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.compareSecurityAnswer = function (candidate) {
  return bcrypt.compare(candidate.toLowerCase().trim(), this.securityAnswer);
};

module.exports = mongoose.model("User", userSchema);
