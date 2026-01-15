// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

function adminAuth(req, res, next) {

  // ⛔ Ignorar OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return next();
  }
  
  console.log("🔎 adminAuth INTERCEPTA RUTA:", req.method, req.originalUrl);
  console.log("🔎 Authorization HEADER:", req.headers.authorization);

  const authHeader = req.headers.authorization;
  
  if (!authHeader)
    return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 LOG IMPORTANTE PARA VER QUÉ LLEGA DEL TOKEN
    console.log("🔑 TOKEN PAYLOAD:", payload);

    req.admin = payload;
    next();

  } catch (err) {
    console.error("❌ Token inválido:", err);
    res.status(401).json({ message: "Token inválido" });
  }
}

// =======================================================
//   🚨 Verificar que el usuario sea SUPERADMIN
// =======================================================
function requireSuperAdmin(req, res, next) {

  // 🔍 LOG PARA VER EL req.admin REAL
  console.log("🔍 req.admin EN requireSuperAdmin:", req.admin);

  if (!req.admin || req.admin.role !== "superadmin") {
    console.log("⛔ BLOQUEADO — req.admin.role =", req.admin?.role);
    return res.status(403).json({
      message: "Permisos insuficientes (solo SUPERADMIN)"
    });
  }

  next();
}

module.exports = { adminAuth, requireSuperAdmin };
