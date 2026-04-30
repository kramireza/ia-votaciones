const AdminLog = require("../models/AdminLog");

function getSafeString(value, max = 255) {
  return String(value || "")
    .trim()
    .substring(0, max);
}

async function logAction(...args) {
  try {

    // ================================
    // 🧠 MODO 1: LEGACY (NO ROMPER NADA)
    // ================================
    if (args.length >= 2 && typeof args[0] === "object" && args[0].username) {
      const [admin, action, details = ""] = args;

      await AdminLog.create({
        adminUsername: getSafeString(admin.username),
        action: getSafeString(action),
        details: getSafeString(details, 2000)
      });

      return;
    }

    // ================================
    // 🚀 MODO 2: AVANZADO
    // ================================
    const {
      admin,
      action,
      entity = null,
      entityId = null,
      details = "",
      req = null
    } = args[0] || {};

    if (!admin || !action) {
      console.warn("⚠️ logAction: datos incompletos");
      return;
    }

    const ip =
      req?.ip ||
      req?.headers?.["x-forwarded-for"] ||
      null;

    const userAgent =
      req?.headers?.["user-agent"] ||
      null;

    await AdminLog.create({
      adminUsername: getSafeString(admin.username),
      action: getSafeString(action),
      entity: entity ? getSafeString(entity) : null,
      entityId: entityId ? getSafeString(entityId) : null,
      details: getSafeString(details, 5000),
      ipAddress: ip,
      userAgent: userAgent
    });

  } catch (err) {
    console.error("❌ Error guardando log:", err);
  }
}

module.exports = logAction;