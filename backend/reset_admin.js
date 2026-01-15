// reset_admin.js
//--------------------------------------------------
// Resetea contraseña del admin usando la MISMA BD
//--------------------------------------------------

require("dotenv").config();
const { Sequelize } = require("sequelize");
const bcrypt = require("bcrypt");

// Conectarse exactamente a la BD del backend
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: process.env.DB_PORT
  }
);

// Cargar modelo Admin (usa la misma instancia)
const Admin = require("./src/models/Admin");

async function reset() {
  try {
    console.log("Conectando a la BD REAL del backend...");

    await sequelize.authenticate();
    console.log("✅ Conexión correcta.");

    const username = "admin";
    const newPassword = "admin123";

    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      console.log("❌ No existe admin con usuario:", username);
      process.exit();
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    admin.passwordHash = hashed;
    await admin.save();

    console.log("🔵 Admin reseteado correctamente:");
    console.log("Usuario:", username);
    console.log("Contraseña nueva:", newPassword);

    process.exit();

  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

reset();
