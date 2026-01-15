// backend/src/routes/admin.js
const express = require("express");
const router = express.Router();

const { adminAuth } = require("../middleware/authMiddleware");

// Aquí SOLO importamos el modelo existente, NO lo redefinimos.
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");

// ---------------------------------------------------------
// 🔵 Login de administrador (si aún usas esta ruta)
// ---------------------------------------------------------
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ where: { username } });
  if (!admin) return res.status(401).json({ message: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  res.json({ message: "Login OK" });
});

// ---------------------------------------------------------
module.exports = router;
