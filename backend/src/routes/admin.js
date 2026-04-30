// backend/src/routes/admin.js
const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");

// ==========================================================
// 🔵 LOGIN LEGACY (SOLO PARA PRUEBAS)
// ==========================================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Datos requeridos"
      });
    }

    const admin = await Admin.findOne({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({
        message: "Credenciales inválidas"
      });
    }

    const ok = await bcrypt.compare(
      password,
      admin.passwordHash
    );

    if (!ok) {
      return res.status(401).json({
        message: "Credenciales inválidas"
      });
    }

    // ⚠️ ESTE LOGIN NO GENERA TOKEN
    return res.json({
      message: "Login OK (legacy)"
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error en login"
    });
  }
});

module.exports = router;