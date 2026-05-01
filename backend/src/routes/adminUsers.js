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

    // 🔒 VALIDACIÓN CRÍTICA PARA SUPERADMIN
    if (admin.role === "superadmin") {
      const totalSuperAdmins = await Admin.count({
        where: { role: "superadmin" }
      });

      if (totalSuperAdmins <= 2) {
        return res.status(400).json({
          message: "Debe haber al menos 2 superadmins en el sistema"
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

router.post("/:id/reset-password", adminAuth, requireSuperAdmin, async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findByPk(id);

  if (!admin) {
    return res.status(404).json({ message: "Admin no encontrado" });
  }

  const bcrypt = require("bcrypt");

  // 🔥 SI ES SUPERADMIN → CAMBIO CON CONTRASEÑA ACTUAL
  if (admin.role === "superadmin") {
    const { currentPassword, newPassword } = req.body;

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);

    if (!ok) {
      return res.status(400).json({
        message: "Contraseña actual incorrecta"
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    admin.passwordHash = hash;
    await admin.save();

    return res.json({
      message: "Contraseña actualizada correctamente"
    });
  }

  // 🔥 SI ES EDITOR → GENERAR TEMPORAL
  const tempPassword = Math.random().toString(36).slice(-8);

  const hash = await bcrypt.hash(tempPassword, 10);

  admin.passwordHash = hash;
  await admin.save();

  return res.json({
    message: "Contraseña temporal generada",
    tempPassword
  });
});

// ============================================================
// 🔵 CAMBIAR PROPIA CONTRASEÑA (FORZADO)
// ============================================================
router.post(
  "/change-own-password",
  adminAuth,
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          message: "La contraseña debe tener al menos 6 caracteres"
        });
      }

      const admin = await Admin.findByPk(req.admin.id);

      if (!admin) {
        return res.status(404).json({
          message: "Admin no encontrado"
        });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      admin.passwordHash = hash;

      // 🔥 CLAVE: quitar obligación
      admin.mustChangePassword = false;

      await admin.save();

      await logAction({
        admin: req.admin,
        action: "change_own_password",
        entity: "admin",
        entityId: admin.id,
        details: "Cambio de contraseña obligatorio",
        req
      });

      res.json({
        message: "Contraseña actualizada correctamente"
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Error cambiando contraseña"
      });
    }
  }
);

module.exports = router;