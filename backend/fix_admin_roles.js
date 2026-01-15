require("dotenv").config();
const sequelize = require("./src/db");
const Admin = require("./src/models/Admin");

async function fixRoles() {
  try {
    await sequelize.authenticate();
    console.log("DB OK\n");

    const admins = await Admin.findAll();
    console.log("Admins encontrados:", admins.length);

    for (const a of admins) {
      if (!a.role) {
        console.log(`Corrigiendo admin: ${a.username}`);

        // Superadmin SOLO el usuario "admin"
        a.role = a.username === "admin" ? "superadmin" : "editor";
        await a.save();
      }
    }

    console.log("\nRoles actualizados exitosamente.");
    process.exit(0);

  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

fixRoles();
