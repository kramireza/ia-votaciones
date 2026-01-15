// backend/scripts/showLastVote.js
const sequelize = require("../src/db");      // ajusta si tu db está en otra ruta
const Vote = require("../src/models/Vote");

async function main() {
  await sequelize.authenticate();
  const vote = await Vote.findOne({ order: [["timestamp", "DESC"]] , raw: true });
  console.log("Último voto:", vote);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
