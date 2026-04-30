// backend/src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./db");

const Admin = require("./models/Admin");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const voteRoutes = require("./routes/votes");
const adminRoutes = require("./routes/admin");
const importStudentsRoute = require("./routes/importStudents");
const approvalsRoutes = require("./routes/approvals");

const app = express();

// 🔐 CORS CONTROLADO
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// 📁 Archivos
app.use("/uploads", express.static("uploads"));

// 📌 Rutas
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/import-csv", importStudentsRoute);
app.use("/api/elections", require("./routes/elections"));
app.use("/api/admin-users", require("./routes/adminUsers"));
app.use("/api/admin-logs", require("./routes/adminLogs"));
app.use("/api/logs", require("./routes/logExport"));
app.use("/api/approvals", approvalsRoutes);

// 🚨 ERROR HANDLER GLOBAL
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("DB conectada");

    // ⚠️ PRODUCCIÓN: usar false
    await sequelize.sync();

    const bcrypt = require("bcrypt");

    const existing = await Admin.findOne({
      where: { username: "admin" }
    });

    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);

      await Admin.create({
        username: "admin",
        passwordHash: hash,
        role: "superadmin"
      });

      console.log("Admin default creado");
    }

    app.listen(PORT, () =>
      console.log(`Server en http://localhost:${PORT}`)
    );

  } catch (err) {
    console.error("Error arrancando server:", err);
  }
}

start();