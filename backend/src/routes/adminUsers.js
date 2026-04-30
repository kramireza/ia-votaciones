const express = require("express");
const router = express.Router();

const { adminAuth, requireSuperAdmin } = require("../middleware/authMiddleware");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const logAction = require("../utils/logAction");

// 🔐 Sanitizador
function cleanString(str, max = 50) {
  return String(str || "")
    .trim()
    .substring(0, max);
}

// ============================================================
// 🔵 LISTAR TODOS LOS ADMINS
// ============================================================
router.get("/", adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ["id", "username", "role"]
    });

    await logAction({
      admin: req.admin,
      action: "list_admins",
      entity: "admin",
      details: "Consulta de administradores",
      req
    });

    res.json(admins);

  } catch (err) {
    res.status(500).json({ message: "Error listando admins" });
  }
});

// ============================================================
// 🔵 CREAR NUEVO ADMIN
// ============================================================
router.post("/", adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    let { username, password, role } = req.body;

    username = cleanString(username);
    role = role || "editor";

    if (!username || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    if (!["editor", "superadmin"].includes(role)) {
      return res.status(400).json({
        message: "Rol inválido"
      });
    }

    // 🔥 VALIDAR DUPLICADO
    const existing = await Admin.findOne({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({
        message: "El usuario ya existe"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      passwordHash: hash,
      role
    });

    await logAction({
      admin: req.admin,
      action: "create_admin",
      entity: "admin",
      entityId: admin.id,
      details: `Creó usuario ${username} con rol ${role}`,
      req
    });

    res.json({ message: "Admin creado", admin });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando admin" });
  }
});

// ============================================================
// 🔵 ELIMINAR ADMIN
// ============================================================
router.delete("/:id", adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin no encontrado" });
    }

    // 🔥 PROTEGER SUPERADMIN
    if (admin.role === "superadmin") {
      const total = await Admin.count({
        where: { role: "superadmin" }
      });

      if (total <= 1) {
        return res.status(400).json({
          message: "Debe existir al menos un superadmin"
        });
      }
    }

    await Admin.destroy({ where: { id } });

    await logAction({
      admin: req.admin,
      action: "delete_admin",
      entity: "admin",
      entityId: id,
      details: `Eliminó ${admin.username}`,
      req
    });

    res.json({ message: "Admin eliminado" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error eliminando admin" });
  }
});

module.exports = router;