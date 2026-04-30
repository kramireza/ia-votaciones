const Vote = require("../models/Vote");
const Election = require("../models/Election");
const {
  exportVotesToExcel,
  exportResultsToExcel
} = require("../utils/excelExport");

const { fn, col } = require("sequelize");
const logAction = require("../utils/logAction");

// ============================================================
// REGISTRAR VOTO
// ============================================================
async function castVote(req, res) {
  try {
    const {
      studentAccount,
      studentName,
      studentCenter,
      pollId,
      option,
      answers
    } = req.body;

    if (!studentAccount || !pollId) {
      return res.status(400).json({
        message: "Faltan datos."
      });
    }

    const election = await Election.findOne({
      where: { pollId }
    });

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
      return res.status(400).json({
        message: "Ya votó en esta votación."
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

    const rows = [];
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
          option:
            `${section.title} - ${opt.text}`,
          count
        });
      });
    });

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

    const sections =
      (election.sections || []).map(
        (section) => {
          const options =
            section.options.map(
              (opt) => {
                let count = 0;

                votes.forEach((v) => {

                  try {
                    const parsed = JSON.parse(v.option);

                    if (parsed[section.title] === opt.text) {
                      count++;
                    }
                  } catch {}

                });

                return {
                  text: opt.text,
                  votes: count
                };
              }
            );

          return {
            title:
              section.title,
            options
          };
        }
      );

    return res.json({
      pollId,
      title: election.title,
      type: election.type,
      totalVotes,
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

    const sections =
      (election.sections || []).map(
        (section) => {
          const options =
            section.options.map(
              (opt) => {
                let count = 0;

                votes.forEach((v) => {

                  try {
                    const parsed = JSON.parse(v.option);

                    if (parsed[section.title] === opt.text) {
                      count++;
                    }
                  } catch {}
                });

                return {
                  text: opt.text,
                  votes: count
                };
              }
            );

          return {
            title: section.title,
            options
          };
        }
      );

    return res.json({
      pollId,
      title: election.title,
      type: election.type,
      totalVotes,
      sections,
      isClosed
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

      const sections =
        (election.sections || []).map(
          (section) => {
            const options =
              (section.options || []).map(
                (opt) => {
                  let count = 0;

                  votes.forEach((v) => {

                    try {
                      const parsed = JSON.parse(v.option);

                      if (parsed[section.title] === opt.text) {
                        count++;
                      }
                    } catch {}
                  });

                  return {
                    text: opt.text,
                    votes: count
                  };
                }
              );

            return {
              title: section.title,
              options
            };
          }
        );

      finalResults.push({
        pollId,
        title: election.title,
        type: election.type,
        status: election.status,
        totalVotes,
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