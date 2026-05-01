const Vote = require("../models/Vote");
const Election = require("../models/Election");
const FraudLog = require("../models/FraudLog");
const {
  exportVotesToExcel,
  exportResultsToExcel
} = require("../utils/excelExport");
const BlockedIP = require("../models/BlockedIP");

const { fn, col } = require("sequelize");
const logAction = require("../utils/logAction");

// ============================================================
// REGISTRAR VOTO
// ============================================================
async function castVote(req, res) {

  // 🌐 Obtener IP real PRIMERO
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

  // 🔒 BLOQUEO DE IP
  const blocked = await BlockedIP.findOne({
    where: { ipAddress: ip }
  });

  if (blocked) {
    return res.status(403).json({
      message: "Acceso bloqueado"
    });
  }

  try {
    let {
      studentAccount,
      studentName,
      studentCenter,
      pollId,
      option,
      answers,
      fingerprint,
      signature
    } = req.body;

    // 🔐 Normalización básica
    studentAccount = String(studentAccount || "").trim();
    pollId = String(pollId || "").trim();

    // 🔐 VALIDACIÓN DE FIRMA SIMPLE (CORRECTA)
    const crypto = require("crypto");

    const SECRET = process.env.VOTE_SECRET || "secret123";

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(studentAccount + pollId)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(403).json({
        message: "Solicitud inválida"
      });
    }

    if (!studentAccount || !pollId) {
      return res.status(400).json({
        message: "Faltan datos."
      });
    }

    const election = await Election.findOne({
      where: { pollId }
    });

    // 🔒 Anti spam (misma IP en corto tiempo)
    const recentVote = await Vote.findOne({
      where: {
        pollId
      },
      order: [["timestamp", "DESC"]]
    });

    if (recentVote) {
      const lastVoteTime = new Date(recentVote.timestamp).getTime();
      const now = Date.now();

      // 3 segundos de cooldown (ajustable)
      if (now - lastVoteTime < 3000) {
        return res.status(429).json({
          message: "Espera unos segundos antes de votar nuevamente."
        });
      }
    }

    if (!election) {
      return res.status(400).json({
        message: "Elección no válida."
      });
    }

    const type = election.type || "simple";

    // 🔒 VALIDACIÓN GLOBAL (EVITA DOBLE VOTO)
    const existing = await Vote.findOne({
      where: { pollId, studentAccount }
    });

    if (existing) {

      await FraudLog.create({
        ipAddress: ip,
        pollId,
        type: "duplicate",
        message: "Intento de doble voto"
      });

      return res.status(400).json({
        message: "Ya votó en esta votación."
      });
    }

    // 🔍 DETECCIÓN POR FINGERPRINT
    if (fingerprint) {
      const sameDeviceVotes = await Vote.count({
        where: {
          pollId,
          fingerprint
        }
      });

      if (sameDeviceVotes >= 2) {
        await FraudLog.create({
          ipAddress: ip,
          pollId,
          type: "fingerprint",
          message: "Múltiples votos desde mismo dispositivo"
        });
      }
    }

    // 🔍 Conteo de votos por IP (control global)
    const votesFromIP = await Vote.count({
      where: {
        pollId,
        ipAddress: ip
      }
    });

    // 🚨 LOG SI IP ES SOSPECHOSA
    if (votesFromIP >= 3) {
      await FraudLog.create({
        ipAddress: ip,
        pollId,
        type: "suspicious",
        message: `IP con ${votesFromIP} votos`
      });
    }

    // 🔒 Permitir hasta 5 votos por IP (laboratorio seguro)
    if (votesFromIP >= 5) {
      
      await FraudLog.create({
        ipAddress: ip,
        pollId,
        type: "blocked",
        message: "Demasiados votos desde esta IP"
      });

      return res.status(429).json({
        message: "Demasiados votos desde esta red. Intente más tarde."
      });
    }
    // ================= SIMPLE =================
    if (type === "simple") {

      if (!option) {
        return res.status(400).json({
          message: "Debe seleccionar una opción."
        });
      }

      const vote = await Vote.create({
        studentAccount,
        studentName,
        studentCenter,
        pollId,
        option,
        ipAddress: ip,
        fingerprint
      });

      return res.json({
        message: "Voto registrado correctamente.",
        vote
      });
    }

    // ================= COMPOUND =================
    if (type === "compound") {
      if (!answers || typeof answers !== "object") {
        return res.status(400).json({
          message: "Respuestas inválidas."
        });
      }

      const vote = await Vote.create({
        studentAccount,
        studentName,
        studentCenter,
        pollId,
        option: JSON.stringify(answers),
        ipAddress: ip,
        fingerprint
      });

      return res.json({
        message: "Voto registrado correctamente.",
        vote
      });
    }

    return res.status(400).json({
      message: "Tipo de elección inválido."
    });

  } catch (error) {
    console.error("Error castVote:", error);
    return res.status(500).json({
      message:
        "Error interno al registrar voto."
    });
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
    return res.status(500).json({
      message: "Error obteniendo votos."
    });
  }
}

// ============================================================
// EXPORTAR EXCEL VOTOS
// ============================================================
async function exportVotesExcel(req, res) {
  try {
    const { pollId } = req.query;

    const whereClause =
      pollId ? { pollId } : {};

    const votes = await Vote.findAll({
      where: whereClause,
      order: [["timestamp", "DESC"]],
      raw: true
    });

    const buffer =
      await exportVotesToExcel(votes);

    logAction(
      req.admin,
      "Exportó Excel",
      "Excel de votos"
    );

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
    return res.status(500).json({
      message: "Error generando Excel."
    });
  }
}

// ============================================================
// EXPORTAR EXCEL RESULTADOS (HIBRIDO)
// ============================================================
async function exportResultsExcel(req, res) {
  try {
    const { pollId } = req.query;

    if (!pollId) {
      return res.status(400).json({
        message: "pollId requerido."
      });
    }

    const election = await Election.findOne({
      where: { pollId }
    });

    if (!election) {
      return res.status(404).json({
        message: "Elección no encontrada."
      });
    }

    const votes = await Vote.findAll({
      where: { pollId },
      raw: true
    });

    let rows = [];

    // ================= SIMPLE =================
    if (election.type === "simple") {

      const options = election.options || [];

      options.forEach(opt => {
        let count = 0;

        votes.forEach(v => {
          if (v.option === opt.text) {
            count++;
          }
        });

        rows.push({
          pollId,
          option: typeof opt === "object" ? opt.text : opt,
          count
        });
      });

    }

    // ================= COMPOUND =================
    else {

      const sections = election.sections || [];

      sections.forEach((section) => {
        section.options.forEach((opt) => {
          let count = 0;

          votes.forEach((v) => {
            try {
              const parsed = JSON.parse(v.option);

              if (parsed[section.title] === opt.text) {
                count++;
              }
            } catch {}
          });

          rows.push({
            pollId,
            option: `${section.title} - ${opt.text}`,
            count
          });
        });
      });

    }

    const buffer =
      await exportResultsToExcel(rows);

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
    return res.status(500).json({
      message: "Error generando Excel."
    });
  }
}

// ============================================================
// RESULTADOS DETALLADOS ADMIN (HIBRIDO)
// ============================================================
async function getDetailedVoteResults(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({
      where: { pollId }
    });

    if (!election) {
      return res.status(404).json({
        message:
          "Elección no encontrada."
      });
    }

    const votes = await Vote.findAll({
      where: { pollId },
      raw: true
    });

    const totalVotes = votes.length;

    let options = [];
    let sections = [];

    if (election.type === "simple") {

      const opts = election.options || [];

      options = opts.map(opt => {
        let count = 0;

        votes.forEach(v => {
          if (v.option === opt.text) {
            count++;
          }
        });

        return {
          text: typeof opt === "object" ? opt.text : opt,
          image: typeof opt === "object" ? opt.imageUrl || opt.image : null,
          description: typeof opt === "object" ? opt.description : null,
          votes: count
        };
      });

    } else {

      sections = (election.sections || []).map(section => {
        const opts = (section.options || []).map(opt => {
          let count = 0;

          votes.forEach(v => {
            try {
              const parsed = JSON.parse(v.option);
              if (parsed[section.title] === opt.text) {
                count++;
              }
            } catch {}
          });

          return {
            text: opt.text,
            votes: count,

            imageUrl: opt.imageUrl
              ? opt.imageUrl
              : opt.image
                ? opt.image.startsWith("http")
                  ? opt.image
                  : opt.image.startsWith("/")
                    ? opt.image
                    : `/${opt.image}`
                : null,
            description: opt.description || null
          };
        });

        return {
          title: section.title,
          options: opts
        };
      });

    }

    return res.json({
      pollId,
      title: election.title,
      type: election.type,
      totalVotes,
      options,
      sections
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "Error obteniendo resultados."
    });
  }
}

// ============================================================
// RESULTADOS PÚBLICOS (HIBRIDO)
// ============================================================
async function getPublicResults(req, res) {
  try {
    let election =
      await Election.findOne({
        where: { status: "open" }
      });

    let isClosed = false;

    if (!election) {
      election =
        await Election.findOne({
          order: [["updatedAt", "DESC"]]
        });

      isClosed = true;
    }

    if (!election) {
      return res.status(404).json({
        message:
          "No hay elecciones disponibles."
      });
    }

    const pollId =
      election.pollId;

    const votes = await Vote.findAll({
      where: { pollId },
      raw: true
    });

    const totalVotes =
      votes.length;

    // 🔥 FIX SIMPLE VS COMPOUND
    let options = [];
    let sections = [];

    if (election.type === "simple") {

      const opts = election.options || [];

      options = opts.map(opt => {
        let count = 0;

        votes.forEach(v => {
          if (v.option === opt.text) {
            count++;
          }
        });

        return {
          text: typeof opt === "object" ? opt.text : opt,
          image: typeof opt === "object" ? opt.imageUrl || opt.image : null,
          description: typeof opt === "object" ? opt.description : null,
          votes: count
        };
      });

    } else {

      sections = (election.sections || []).map(section => {
        const opts = (section.options || []).map(opt => {
          let count = 0;

          votes.forEach(v => {
            try {
              const parsed = JSON.parse(v.option);
              if (parsed[section.title] === opt.text) {
                count++;
              }
            } catch {}
          });

          return {
            text: opt.text,
            votes: count,

            imageUrl: opt.imageUrl
              ? opt.imageUrl
              : opt.image
                ? opt.image.startsWith("http")
                  ? opt.image
                  : opt.image.startsWith("/")
                    ? opt.image
                    : `/${opt.image}`
                : null,
            description: opt.description || null
          };
        });

        return {
          title: section.title,
          options: opts
        };
      });

    }

    return res.json({
      pollId,
      title: election.title,
      type: election.type,
      totalVotes,
      options,
      sections,
      isClosed,
      updatedAt: election.updatedAt
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "Error obteniendo resultados públicos."
    });
  }
}

// ============================================================
// CHECK VOTO
// ============================================================
async function checkVote(req, res) {
  try {
    let { pollId, studentAccount } = req.query;

    // 🔐 limpieza
    pollId = String(pollId || "").trim();
    studentAccount = String(studentAccount || "").trim();

    if (!pollId || !studentAccount) {
      return res.json({ hasVoted: false });
    }

    const existing = await Vote.findOne({
      where: {
        pollId,
        studentAccount
      }
    });

    return res.json({
      hasVoted: !!existing
    });

  } catch (error) {
    console.error("ERROR checkVote:", error);

    return res.json({
      hasVoted: false
    });
  }
}

// ============================================================
// TODOS LOS RESULTADOS (HIBRIDO)
// ============================================================
async function getAllResults(req, res) {
  try {
    const elections = await Election.findAll({
      order: [["createdAt", "DESC"]],
      raw: true
    });

    const finalResults = [];

    for (const election of elections) {
      const pollId = election.pollId;

      const votes = await Vote.findAll({
        where: { pollId },
        raw: true
      });

      const totalVotes = votes.length;

      let options = [];
      let sections = [];

      if (election.type === "simple") {

        const opts = election.options || [];

        options = opts.map(opt => {
          let count = 0;

          votes.forEach(v => {
            if (v.option === opt.text) {
              count++;
            }
          });

          return {
            text: typeof opt === "object" ? opt.text : opt,
            image: typeof opt === "object" ? opt.imageUrl || opt.image : null,
            description: typeof opt === "object" ? opt.description : null,
            votes: count
          };
        });

      } else {

        sections = (election.sections || []).map(section => {
          const opts = (section.options || []).map(opt => {
            let count = 0;

            votes.forEach(v => {
              try {
                const parsed = JSON.parse(v.option);
                if (parsed[section.title] === opt.text) {
                  count++;
                }
              } catch {}
            });

            return {
              text: opt.text,
              votes: count,

              imageUrl: opt.imageUrl
                ? opt.imageUrl
                : opt.image
                  ? opt.image.startsWith("http")
                    ? opt.image
                    : opt.image.startsWith("/")
                      ? opt.image
                      : `/${opt.image}`
                  : null,
              description: opt.description || null
            };
          });

          return {
            title: section.title,
            options: opts
          };
        });

      }

      finalResults.push({
        pollId,
        title: election.title,
        type: election.type,
        status: election.status,
        totalVotes,
        options,
        sections
      });
    }

    return res.json(finalResults);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error obteniendo resultados."
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
  getAllResults,
  checkVote
};