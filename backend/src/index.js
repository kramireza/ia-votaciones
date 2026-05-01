// backend/src/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./db");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const xssClean = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

const Admin = require("./models/Admin");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const voteRoutes = require("./routes/votes");
const adminRoutes = require("./routes/admin");
const importStudentsRoute = require("./routes/importStudents");
const approvalsRoutes = require("./routes/approvals");

const app = express();
app.disable("x-powered-by");

// 🔐 CORS CONTROLADO
app.use(cors({
  origin: function (origin, callback) {

    // Permitir herramientas como Postman o server-to-server
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://informatica-vs.com",
      "https://www.informatica-vs.com"
    ];

    // Permitir cualquier subruta (como /votaciones)
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o));

    if (isAllowed) {
      return callback(null, true);
    }

    // ⚠️ TEMPORAL: permitir mientras estás en transición
    return callback(null, true);

    // 🔒 FUTURO (cuando todo esté probado)
    // return callback(new Error("No permitido por CORS"));
  },
  credentials: true
}));

// ======================================
// 🔐 SEGURIDAD GLOBAL
// ======================================

// 🛡️ Headers seguros
app.use(helmet());

app.use(express.json());

// 🧼 Sanitizar NoSQL Injection
app.use(mongoSanitize());

// 🧼 Sanitizar XSS
app.use(xssClean());

// 🚫 Evitar HTTP Parameter Pollution
app.use(hpp());

// ⏱️ Rate Limit GLOBAL
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // máximo requests por IP
  message: {
    message: "Demasiadas solicitudes, intenta más tarde"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 📁 Archivos
app.use("/uploads", express.static("uploads"));

// 📌 Rutas
// 🔐 Rate limit para login (más estricto)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 20, // 20 intentos
  message: {
    message: "Demasiados intentos de login, intenta en 10 minutos"
  }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/import-csv", importStudentsRoute);
app.use("/api/elections", require("./routes/elections"));
app.use("/api/admin-users", require("./routes/adminUsers"));
app.use("/api/admin-logs", require("./routes/adminLogs"));
app.use("/api/logs", require("./routes/logExport"));
app.use("/api/approvals", approvalsRoutes);
app.use("/api/fraud", require("./routes/fraud"));

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