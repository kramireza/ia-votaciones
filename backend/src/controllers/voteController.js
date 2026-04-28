const Vote = require("../models/Vote");
const Election = require("../models/Election");
const { exportVotesToExcel, exportResultsToExcel } = require("../utils/excelExport");
const { fn, col } = require("sequelize");
const logAction = require("../utils/logAction");

// ============================================================
// REGISTRAR VOTO
// ============================================================
async function castVote(req, res) {
  try {
    const { studentAccount, studentName, studentCenter, pollId, option } = req.body;

    if (!studentAccount || !pollId || !option) {
      return res.status(400).json({ message: "Faltan datos." });
    }

    const election = await Election.findOne({ where: { pollId } });

    if (!election) {
      return res.status(400).json({ message: "Elección no válida." });
    }

    const existing = await Vote.findOne({
      where: { pollId, studentAccount }
    });

    if (existing) {
      return res.status(400).json({ message: "Ya votó en esta votación." });
    }

    const vote = await Vote.create({
      studentAccount,
      studentName,
      studentCenter,
      pollId,
      option
    });

    return res.json({
      message: "Voto registrado correctamente.",
      vote
    });

  } catch (error) {
    console.error("Error castVote:", error);
    return res.status(500).json({ message: "Error interno al registrar voto." });
  }
}

// ============================================================
// ADMIN - TODOS LOS VOTOS
// ============================================================
async function getVotesForAdmin(req, res) {
  try {
    const votes = await Vote.findAll({
      order: [["timestamp", "DESC"]]
    });

    return res.json(votes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obteniendo votos." });
  }
}

// ============================================================
// EXPORTAR EXCEL VOTOS
// ============================================================
async function exportVotesExcel(req, res) {
  try {
    const { pollId } = req.query;

    const whereClause = pollId ? { pollId } : {};

    const votes = await Vote.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      raw: true
    });

    const buffer = await exportVotesToExcel(votes);

    logAction(req.admin, "Exportó Excel", "Excel de votos");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="votos_${pollId || "todos"}.xlsx"`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error generando Excel." });
  }
}

// ============================================================
// EXPORTAR EXCEL RESULTADOS
// ============================================================
async function exportResultsExcel(req, res) {
  try {
    const { pollId } = req.query;

    if (!pollId) {
      return res.status(400).json({ message: "pollId requerido." });
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

    logAction(req.admin, "Exportó Resultados Excel", "Excel agrupado");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resultados_${pollId}.xlsx"`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error generando Excel." });
  }
}

// ============================================================
// RESULTADOS DETALLADOS ADMIN
// ============================================================
async function getDetailedVoteResults(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({ where: { pollId } });

    if (!election) {
      return res.status(404).json({ message: "Elección no encontrada." });
    }

    const votes = await Vote.findAll({
      where: { pollId },
      raw: true
    });

    const totalVotes = votes.length;

    const options = election.options.map((opt) => {
      const count = votes.filter((v) => v.option === opt.text).length;

      return {
        text: opt.text,
        imageUrl: opt.imageUrl || null,
        votes: count
      };
    });

    return res.json({
      pollId,
      title: election.title,
      totalVotes,
      options
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error obteniendo resultados." });
  }
}

// ============================================================
// RESULTADOS PÚBLICOS
// ============================================================
async function getPublicResults(req, res) {
  try {
    const election = await Election.findOne({
      where: { status: "active" }
    });

    if (!election) {
      return res.status(404).json({
        message: "No hay elección activa."
      });
    }

    const pollId = election.pollId;

    const votes = await Vote.findAll({
      where: { pollId },
      raw: true
    });

    const totalVotes = votes.length;

    const options = election.options.map((opt) => {
      const count = votes.filter((v) => v.option === opt.text).length;

      return {
        text: opt.text,
        imageUrl: opt.imageUrl || null,
        votes: count
      };
    });

    return res.json({
      pollId,
      title: election.title,
      totalVotes,
      updatedAt: new Date(),
      options
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error obteniendo resultados públicos."
    });
  }
}

// ============================================================
// CHECK VOTO
// ============================================================
async function checkVote(req, res) {
  try {
    const { pollId, studentAccount } = req.query;

    if (!pollId || !studentAccount) {
      return res.json({ hasVoted: false });
    }

    const vote = await Vote.findOne({
      where: { pollId, studentAccount }
    });

    return res.json({
      hasVoted: !!vote
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      hasVoted: false
    });
  }
}

module.exports = {
  castVote,
  getVotesForAdmin,
  exportVotesExcel,
  exportResultsExcel,
  getDetailedVoteResults,
  getPublicResults,
  checkVote
};