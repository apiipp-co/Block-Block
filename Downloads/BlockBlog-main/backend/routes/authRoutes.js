const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getSecurityQuestion,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/forgot-password", getSecurityQuestion); // step 1: get question
router.post("/forgot-password", resetPassword); // step 2: answer + new password

module.exports = router;
