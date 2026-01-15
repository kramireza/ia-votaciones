// backend/src/controllers/authController.js
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ⭐ Nuevo: registrar actividad
const logAction = require("../utils/logAction");

async function login(req, res) {
  const { username, password } = req.body;

  console.log("🔍 Intento de login:", username);

  const admin = await Admin.findOne({ where: { username } });

  console.log("🟦 Admin encontrado en BD:", admin ? admin.toJSON() : null);

  if (!admin) {
    console.log("❌ No existe admin con ese username");
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);

  console.log("🔑 Comparación de contraseña:", ok);

  if (!ok) {
    console.log("❌ Contraseña incorrecta");
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  console.log("✅ Login correcto:", username);

  // 🔵 Registrar log de auditoría
  await logAction(admin, "Inicio de sesión", "El administrador inició sesión.");

  res.json({ token });
}

module.exports = { login };
