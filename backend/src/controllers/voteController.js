// backend/src/controllers/voteController.js
const Vote = require("../models/Vote");
const Election = require("../models/Election");
const { exportVotesToExcel, exportResultsToExcel } = require("../utils/excelExport");
const { Op, fn, col } = require("sequelize");

const logAction = require("../utils/logAction");

// ============================================================
//   REGISTRAR VOTO
// ============================================================
async function castVote(req, res) {
  const { studentAccount, studentName, studentCenter, pollId, option } = req.body;

  // 🔥 LOG 1: payload recibido
  console.log("BACKEND CAST PAYLOAD:", req.body);

  if (!studentAccount || !pollId || !option)
    return res.status(400).json({ message: "Faltan datos" });

  const election = await Election.findOne({ where: { pollId } });

  if (!election)
    return res.status(400).json({ message: "Elección no válida" });

  const existing = await Vote.findOne({
    where: { pollId, studentAccount }
  });

  // 🔥 LOG 2: voto encontrado
  console.log("BACKEND EXISTING VOTE:", existing);

  if (existing)
    return res.status(400).json({ message: "Ya votó en esta votación" });

  const vote = await Vote.create({
    studentAccount,
    studentName,
    studentCenter,
    pollId,
    option
  });

  res.json({ message: "Voto registrado", vote });
}

// ============================================================
//   OBTENER VOTOS PARA ADMIN
// ============================================================
async function getVotesForAdmin(req, res) {
  const votes = await Vote.findAll({ order: [["timestamp","DESC"]] });
  res.json(votes);
}

// ============================================================
//   EXPORTAR TODOS LOS VOTOS A EXCEL (CON LOG)
// ============================================================
async function exportVotesExcel(req, res) {
  try {
    const { pollId } = req.query;

    const whereClause = pollId ? { pollId } : {};

    const votes = await Vote.findAll({
      where: whereClause,
      order: [["timestamp","DESC"]],
      raw: true
    });
    const buffer = await exportVotesToExcel(votes);

    // ✅ LOG
    logAction(req.admin, "Exportó Excel", "Excel completo de votos");

    res.setHeader("Content-Disposition", `attachment; filename="votos_${pollId || "todos"}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);

  } catch (err) {
    console.error("Excel error:", err);
    res.status(500).json({ message: "Error generando Excel." });
  }
}

// ============================================================
//   EXPORTAR RESULTADOS AGRUPADOS A EXCEL (CON LOG)
// ============================================================
async function exportResultsExcel(req, res) {
  try {
    const { pollId } = req.query;

    if (!pollId) {
      return res.status(400).json({ message: "pollId es requerido" });
    }
    const results = await Vote.findAll({
      where: { pollId },
      attributes: [
        "pollId",
        "option",
        [fn("COUNT", col("option")), "count"]
      ],
      group: ["pollId", "option"],
      raw: true
    });

    const buffer = await exportResultsToExcel(results);

    // ✅ LOG
    logAction(req.admin, "Exportó Resultados Excel", "Excel de resultados agrupados");

    res.setHeader("Content-Disposition", `attachment; filename="resultados_${pollId}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    return res.send(buffer);

  } catch (err) {
    console.error("Excel error:", err);
    res.status(500).json({ message: "Error generando Excel." });
  }
}

// ============================================================
//   RESULTADOS DETALLADOS
// ============================================================
async function getDetailedVoteResults(req, res) {
  const { pollId } = req.params;

  try {
    const election = await Election.findOne({ where: { pollId } });
    if (!election)
      return res.status(404).json({ message: "Elección no encontrada" });

    const votes = await Vote.findAll({ where: { pollId }, raw: true });
    const totalVotes = votes.length;

    const detailedOptions = election.options.map(opt => {
      const count = votes.filter(v => v.option === opt.text).length;

      return {
        text: opt.text,
        imageUrl: opt.imageUrl || null,
        votes: count
      };
    });

    res.json({
      pollId,
      title: election.title,
      totalVotes,
      options: detailedOptions
    });

  } catch (err) {
    console.error("Error en resultados detallados:", err);
    res.status(500).json({ message: "Error obteniendo resultados detallados." });
  }
}

// ============================================================
//   REVISION DE VOTOS
// ============================================================

async function checkVote(req, res) {
  const { pollId, studentAccount } = req.query;

  if (!pollId || !studentAccount) {
    return res.json({ hasVoted: false });
  }

  const vote = await Vote.findOne({
    where: { pollId, studentAccount }
  });

  res.json({ hasVoted: !!vote });
}

// ============================================================
//   EXPORTAR FUNCIONES
// ============================================================
module.exports = { 
  castVote, 
  getVotesForAdmin, 
  exportVotesExcel, 
  exportResultsExcel,
  getDetailedVoteResults,
  checkVote
};
