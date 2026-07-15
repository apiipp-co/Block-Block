const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, securityQuestion, securityAnswer } =
      req.body;

    if (!email || !password || !securityAnswer) {
      return res.status(400).json({
        message: "Email, password, and a security answer are required",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      securityQuestion,
      securityAnswer,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// GET /api/auth/forgot-password?email=...
// Step 1 of forgot-password flow: return the security question for the email
exports.getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }
    res.json({ securityQuestion: user.securityQuestion });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// POST /api/auth/forgot-password
// Step 2: verify the answer and set a new password
exports.resetPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({
        message: "Email, security answer, and new password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+securityAnswer"
    );
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    const isMatch = await user.compareSecurityAnswer(securityAnswer);
    if (!isMatch) {
      return res.status(401).json({ message: "Security answer is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};
