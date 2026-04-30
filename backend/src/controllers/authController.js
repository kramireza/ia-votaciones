// backend/src/controllers/authController.js
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const logAction = require("../utils/logAction");

// 🔐 Sanitizador
function cleanString(str, max = 50) {
  return String(str || "").trim().substring(0, max);
}

async function login(req, res) {
  try {
    let { username, password } = req.body;

    username = cleanString(username);

    if (!username || !password) {
      return res.status(400).json({
        message: "Credenciales requeridas"
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

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // 🔥 LOG PRO
    await logAction({
      admin,
      action: "login",
      entity: "admin",
      entityId: admin.id,
      details: "Inicio de sesión",
      req
    });

    res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Error en login"
    });
  }
}

module.exports = { login };