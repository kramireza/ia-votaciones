const AdminLog = require("../models/AdminLog");

async function logAction(admin, action, details = "") {
  try {
    await AdminLog.create({
      adminUsername: admin.username,
      action,
      details
    });
  } catch (err) {
    console.error("❌ Error guardando log:", err);
  }
}

module.exports = logAction;
