// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 🔐 Helper para logs controlados
function safeLog(...args) {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args);
  }
}

// =======================================================
// 🔐 ADMIN AUTH
// =======================================================
function adminAuth(req, res, next) {

  // ⛔ Ignorar OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return next();
  }

  safeLog("🔎 adminAuth:", req.method, req.originalUrl);

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No autorizado (sin token)"
    });
  }

  // 🔥 Validar formato Bearer
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Formato de token inválido"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token no proporcionado"
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    safeLog("🔑 TOKEN PAYLOAD:", payload);

    // 🔐 Validación básica del payload
    if (!payload || !payload.id || !payload.role) {
      return res.status(403).json({
        message: "Token inválido (estructura incorrecta)"
      });
    }

    req.admin = payload;

    next();

  } catch (err) {

    // 🔥 Manejo específico de errores JWT
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expirado"
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido"
      });
    }

    console.error("❌ Error JWT:", err);

    return res.status(401).json({
      message: "No autorizado"
    });
  }
}

// =======================================================
// 🔐 SUPERADMIN CHECK
// =======================================================
function requireSuperAdmin(req, res, next) {

  safeLog("🔍 requireSuperAdmin:", req.admin);

  if (!req.admin) {
    return res.status(401).json({
      message: "No autenticado"
    });
  }

  if (req.admin.role !== "superadmin") {
    return res.status(403).json({
      message: "Permisos insuficientes (solo SUPERADMIN)"
    });
  }

  next();
}

module.exports = { adminAuth, requireSuperAdmin };