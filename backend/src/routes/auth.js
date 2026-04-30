// backend/src/routes/auth.js
const express = require("express");
const router = express.Router();

const { login } = require("../controllers/authController");

// ============================================================
// 🔵 VALIDACIÓN LOGIN
// ============================================================
function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Usuario y contraseña requeridos"
    });
  }

  next();
}

// ============================================================
// 🔵 LOGIN
// ============================================================
router.post(
  "/login",
  validateLogin,
  login
);

module.exports = router;