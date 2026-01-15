// backend/src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./db");

// modelos existentes
const Student = require("./models/Student");
const Admin = require("./models/Admin");
const Vote = require("./models/Vote");

// ✅ Nuevo modelo: ApprovalRequest (para solicitudes de edición/eliminación)
const ApprovalRequest = require("./models/ApprovalRequest");

// rutas existentes
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const voteRoutes = require("./routes/votes");
const adminRoutes = require("./routes/admin");
const importStudentsRoute = require("./routes/importStudents");

// ✅ Nueva ruta de approvals (solicitudes)
const approvalsRoutes = require("./routes/approvals");

const app = express();
app.use(cors());
app.use(express.json());

// ⭐ SERVIR ARCHIVOS ESTÁTICOS (IMÁGENES)
app.use("/uploads", express.static("uploads"));

// RUTAS API
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/import-csv", importStudentsRoute);
app.use("/api/elections", require("./routes/elections"));
app.use("/api/admin-users", require("./routes/adminUsers"));
app.use("/api/admin-logs", require("./routes/adminLogs"));
app.use("/api/logs", require("./routes/logExport"));

// ✅ Montar endpoints para solicitudes/approvals
app.use("/api/approvals", approvalsRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB conectada");

    // ⭐ PRIMERO sincronizamos todas las tablas
    await sequelize.sync({ alter: true });

    // 🔵 LIMPIEZA AUTOMÁTICA DE VOTOS HUÉRFANOS (votos de elecciones viejas)
    try {
      await sequelize.query(`
        DELETE FROM votes
        WHERE pollId NOT IN (SELECT pollId FROM elections);
      `);
      console.log("🧹 Votos viejos eliminados (elecciones inexistentes).");
    } catch (err) {
      console.log("ℹ️ Tabla 'elections' aún no existe. Limpieza omitida.");
    }

    // ⭐ LUEGO creamos el admin por defecto (cuando la tabla YA existe)
    const bcrypt = require("bcrypt");
    const existing = await Admin.findOne({ where: { username: "admin" } });

    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);
      await Admin.create({
        username: "admin",
        passwordHash: hash,
        role: "superadmin"
      });

      console.log("Admin default creado: admin / admin123");
    }

    app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`));
  } catch (err) {
    console.error("Error arrancando server:", err);
  }
}

start();
