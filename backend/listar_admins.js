// listar_admins.js
//----------------------------------------------------
// Script para mostrar todos los admins en la base de datos
//----------------------------------------------------

const sequelize = require("./src/db");
const Admin = require("./src/models/Admin");

async function listarAdmins() {
  try {
    console.log("Conectando a la BD...");

    await sequelize.authenticate();
    console.log("✅ Conexión correcta.");

    const admins = await Admin.findAll({ raw: true });

    if (admins.length === 0) {
      console.log("⚠️ No existe ningún admin en la tabla Admins.");
    } else {
      console.log("🟦 Lista de administradores encontrados:");
      console.table(admins);
    }

    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

listarAdmins();
