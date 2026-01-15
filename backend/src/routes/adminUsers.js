// backend/src/routes/adminUsers.js
const express = require("express");
const router = express.Router();

const { adminAuth, requireSuperAdmin } = require("../middleware/authMiddleware");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const logAction = require("../utils/logAction"); // <-- IMPORTANTE

// ============================================================
// 🔵 LISTAR TODOS LOS ADMINS
// ============================================================
router.get("/", adminAuth, requireSuperAdmin, async (req, res) => {
  const admins = await Admin.findAll({
    attributes: ["id", "username", "role"]
  });

  // Log de auditoría
  logAction({ username: req.admin.username }, "LISTAR ADMINS", "El superadmin consultó la lista de administradores");

  res.json(admins);
});

// ============================================================
// 🔵 CREAR NUEVO ADMIN
// ============================================================
router.post("/", adminAuth, requireSuperAdmin, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const hash = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    username,
    passwordHash: hash,
    role: role || "editor"
  });

  // Log de auditoría
  logAction(
    req.admin.username,
    "CREAR ADMIN",
    `Creó al admin '${username}' con rol '${role || "editor"}'`
  );

  res.json({ message: "Admin creado", admin });
});

// ============================================================
// 🔵 ELIMINAR ADMIN
// ============================================================
router.delete("/:id", adminAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findByPk(id);

  if (!admin) {
    return res.status(404).json({ message: "Admin no encontrado" });
  }

  await Admin.destroy({ where: { id } });

  // Log de auditoría
  logAction(
    req.admin.username,
    "ELIMINAR ADMIN",
    `Eliminó al admin '${admin.username}' (ID: ${id})`
  );

  res.json({ message: "Admin eliminado" });
});

module.exports = router;
