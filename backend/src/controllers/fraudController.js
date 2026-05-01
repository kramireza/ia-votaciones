// backend/src/controllers/fraudController.js
const Vote = require("../models/Vote");
const { fn, col } = require("sequelize");

// ============================================================
// 🔍 RESUMEN GENERAL DE FRAUDE
// ============================================================
async function getFraudSummary(req, res) {
  try {
    const totalVotes = await Vote.count();

    // 🔥 votos por IP
    const votesByIP = await Vote.findAll({
      attributes: [
        "ipAddress",
        [fn("COUNT", col("id")), "count"]
      ],
      group: ["ipAddress"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      raw: true
    });

    // 🔥 IPs sospechosas (>5 votos)
    const suspiciousIPs = votesByIP.filter(v => v.count >= 5);

    // 🔥 actividad reciente (últimos 5 min)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recentVotes = await Vote.count({
      where: {
        timestamp: {
          [require("sequelize").Op.gte]: fiveMinutesAgo
        }
      }
    });

    return res.json({
      totalVotes,
      totalIPs: votesByIP.length,
      suspiciousIPs,
      recentVotes,
      topIPs: votesByIP.slice(0, 10)
    });

  } catch (error) {
    console.error("Fraud summary error:", error);
    res.status(500).json({
      message: "Error obteniendo datos de fraude"
    });
  }
}

// ============================================================
// 🔍 DETALLE POR IP
// ============================================================
async function getVotesByIP(req, res) {
  try {
    const { ip } = req.params;

    const votes = await Vote.findAll({
      where: { ipAddress: ip },
      order: [["timestamp", "DESC"]],
      limit: 100
    });

    return res.json(votes);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error obteniendo votos por IP"
    });
  }
}

const BlockedIP = require("../models/BlockedIP");

// 🔴 BLOQUEAR IP
async function blockIP(req, res) {
  try {
    const { ip } = req.body;

    await BlockedIP.findOrCreate({
      where: { ipAddress: ip },
      defaults: {
        reason: "Bloqueo manual desde panel"
      }
    });

    res.json({ message: "IP bloqueada" });

  } catch (err) {
    res.status(500).json({ message: "Error bloqueando IP" });
  }
}

// 🟢 DESBLOQUEAR IP
async function unblockIP(req, res) {
  try {
    const { ip } = req.body;

    await BlockedIP.destroy({
      where: { ipAddress: ip }
    });

    res.json({ message: "IP desbloqueada" });

  } catch (err) {
    res.status(500).json({ message: "Error desbloqueando IP" });
  }
}

async function getHourlyTrend(req, res) {
  try {
    const votes = await Vote.findAll({ raw: true });

    const hours = {};

    votes.forEach(v => {
      const hour = new Date(v.timestamp).getHours();

      hours[hour] = (hours[hour] || 0) + 1;
    });

    const result = Object.keys(hours)
      .sort((a, b) => a - b)
      .map(h => ({
        hour: `${h}:00`,
        votes: hours[h]
      }));

    res.json(result);

  } catch (err) {
    res.status(500).json({
      message: "Error tendencia"
    });
  }
}

module.exports = {
  getFraudSummary,
  getVotesByIP,
  blockIP,
  unblockIP,
  getHourlyTrend
};