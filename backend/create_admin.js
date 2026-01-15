// create_admin.js
//-------------------------------------------
// Script para crear un nuevo admin vía terminal
//-------------------------------------------

const sequelize = require("./src/db");
const Admin = require("./src/models/Admin");
const bcrypt = require("bcrypt");

async function create() {
  try {
    const username = process.argv[2];
    const password = process.argv[3];
    const role = process.argv[4] || "editor"; // default: editor

    if (!username || !password) {
      console.log("Uso:");
      console.log("node create_admin.js <usuario> <contraseña> <rol(opcional)>");
      console.log("Roles válidos: superadmin | editor");
      process.exit(0);
    }

    await sequelize.authenticate();

    const exists = await Admin.findOne({ where: { username } });
    if (exists) {
      console.log("❌ Ese usuario ya existe.");
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);

    await Admin.create({
      username,
      passwordHash: hash,
      role
    });

    console.log(`✅ Admin creado correctamente:
Usuario: ${username}
Rol: ${role}`);

    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

create();
