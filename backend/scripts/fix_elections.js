// backend/scripts/fix_elections.js
//-----------------------------------------------------
// Normaliza elecciones antiguas que tienen options mal
// formados: null, "", {}, strings o arrays invalidos.
//-----------------------------------------------------

const sequelize = require("../src/db");
const Election = require("../src/models/Election");

async function fix() {
  try {
    console.log("🔵 Conectando a BD...");
    await sequelize.authenticate();
    console.log("✅ Conectado.\n");

    const elections = await Election.findAll();
    console.log(`🔎 ${elections.length} elecciones encontradas.`);

    for (const e of elections) {
      let opts = e.options;

      // Si está vacío o null → dejar array vacío
      if (!opts) {
        console.log(`⚠️ ${e.pollId} tenía options = null → reparado`);
        e.options = [];
        await e.save();
        continue;
      }

      // Si es string → intentar convertir
      if (typeof opts === "string") {
        try {
          const parsed = JSON.parse(opts);
          if (Array.isArray(parsed)) {
            console.log(`🔧 ${e.pollId} tenía options como STRING → reparado`);
            e.options = parsed;
            await e.save();
            continue;
          } else {
            console.log(`⚠️ ${e.pollId} tenía options string pero no array → corrigiendo`);
            e.options = [];
            await e.save();
            continue;
          }
        } catch {
          console.log(`❌ ${e.pollId} tenía string inválido → se resetea`);
          e.options = [];
          await e.save();
          continue;
        }
      }

      // Si es objeto → convertir a array válido
      if (!Array.isArray(opts)) {
        console.log(`⚠️ ${e.pollId} tenía options = objeto → reparado`);
        e.options = [];
        await e.save();
        continue;
      }

      // Si es array pero contiene basura
      const clean = opts
        .filter(o => o && typeof o === "object" && o.text)
        .map(o => ({
          text: o.text,
          imageUrl: o.imageUrl || null
        }));

      if (clean.length !== opts.length) {
        console.log(`🔧 ${e.pollId} tenía opciones inválidas → limpiadas`);
        e.options = clean;
        await e.save();
      }
    }

    console.log("\n✅ Limpieza completada.");
    process.exit();

  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

fix();
