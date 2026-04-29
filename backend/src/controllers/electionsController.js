const Election = require("../models/Election");
const Vote = require("../models/Vote");
const fs = require("fs");

// ⭐ Logger
const logAction = require("../utils/logAction");

// =====================================================
// 🔵 RUTA PÚBLICA — Obtener elección activa
// =====================================================
async function getActiveElection(req, res) {
  try {
    const active = await Election.findOne({
      where: { status: "open" }
    });

    if (!active) {
      return res.status(404).json({
        message: "No hay elección activa."
      });
    }

    return res.json(active);

  } catch (err) {
    console.error("ERROR GET ACTIVE:", err);

    return res.status(500).json({
      message: "Error obteniendo elección activa"
    });
  }
}

// =====================================================
// 🔵 CREAR ELECCIÓN
// =====================================================
async function createElection(req, res) {
  try {
    let { pollId, title, type } = req.body;

    type = type || "simple";

    let options = [];
    let sections = [];

    // ==========================================
    // SIMPLE
    // ==========================================
    if (type === "simple") {
      options = JSON.parse(req.body.options || "[]");

      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          if (options[index]) {
            options[index].imageUrl =
              `/uploads/${file.filename}`;
          }
        });
      }
    }

    // ==========================================
    // COMPOUND
    // ==========================================
    if (type === "compound") {
      sections = JSON.parse(
        req.body.sections || "[]"
      );
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "El título es requerido"
      });
    }

    if (!pollId || pollId.trim() === "") {
      pollId = "poll_" + Date.now();
    }

    const election = await Election.create({
      pollId,
      title,
      type,
      options,
      sections,
      status: "closed"
    });

    await logAction(
      req.admin,
      "Crear elección",
      `Se creó la elección ${pollId} (${type}).`
    );

    return res.json({
      message: "Elección creada correctamente",
      election
    });

  } catch (err) {
    console.error(
      "ERROR CREATE ELECTION:",
      err
    );

    return res.status(500).json({
      message: "Error creando elección"
    });
  }
}

// =====================================================
// 🔵 OBTENER TODAS
// =====================================================
async function getElections(req, res) {
  try {
    const elections =
      await Election.findAll({
        order: [["createdAt", "DESC"]]
      });

    return res.json(elections);

  } catch (err) {
    console.error(
      "GET ELECTIONS ERROR:",
      err
    );

    return res.status(500).json({
      message:
        "Error obteniendo elecciones"
    });
  }
}

// =====================================================
// 🔵 CAMBIAR ESTADO
// =====================================================
async function changeElectionStatus(
  req,
  res
) {
  try {
    const { pollId } = req.params;
    const { status } = req.body;

    const election =
      await Election.findOne({
        where: { pollId }
      });

    if (!election) {
      return res.status(404).json({
        message:
          "Elección no encontrada"
      });
    }

    // Si se abre una, cerrar otras
    if (status === "open") {
      await Election.update(
        { status: "closed" },
        {
          where: {
            status: "open"
          }
        }
      );
    }

    election.status = status;
    await election.save();

    if (status === "open") {
      await logAction(
        req.admin,
        "Activar elección",
        `Se activó ${pollId} y se cerraron otras abiertas.`
      );
    } else {
      await logAction(
        req.admin,
        "Cerrar elección",
        `Se cerró la elección ${pollId}.`
      );
    }

    return res.json({
      message:
        "Estado actualizado correctamente"
    });

  } catch (err) {
    console.error(
      "ERROR CHANGE STATUS:",
      err
    );

    return res.status(500).json({
      message:
        "Error cambiando estado"
    });
  }
}

// =====================================================
// 🔵 EDITAR ELECCIÓN COMPLETA
// Soporta simple y compound
// =====================================================
async function editElection(req, res) {
  try {
    const { pollId } = req.params;

    const election =
      await Election.findOne({
        where: { pollId }
      });

    if (!election) {
      return res.status(404).json({
        message:
          "Elección no encontrada"
      });
    }

    const newTitle =
      req.body.title || election.title;

    const newType =
      req.body.type ||
      election.type ||
      "simple";

    let newOptions = [];
    let newSections = [];

    // ======================================
    // SIMPLE
    // ======================================
    if (newType === "simple") {
      newOptions = JSON.parse(
        req.body.options || "[]"
      );

      if (
        req.files &&
        req.files.length > 0
      ) {
        let fileIndex = 0;

        newOptions = newOptions.map(
          (opt) => {
            if (
              opt.newImage &&
              req.files[fileIndex]
            ) {
              opt.imageUrl =
                `/uploads/${req.files[fileIndex].filename}`;

              fileIndex++;
            }

            delete opt.newImage;
            return opt;
          }
        );
      }
    }

    // ======================================
    // COMPOUND
    // ======================================
    if (newType === "compound") {
      newSections = JSON.parse(
        req.body.sections || "[]"
      );
    }

    // ======================================
    // GUARDAR
    // ======================================
    election.title = newTitle;
    election.type = newType;

    if (newType === "simple") {
      election.options = newOptions;
      election.sections = [];
    }

    if (newType === "compound") {
      election.sections = newSections;
      election.options = [];
    }

    await election.save();

    await logAction(
      req.admin,
      "Editar elección",
      `Se editó ${pollId}. Tipo: ${newType}.`
    );

    return res.json({
      message:
        "Elección editada correctamente"
    });

  } catch (err) {
    console.error(
      "EDIT ERROR:",
      err
    );

    return res.status(500).json({
      message:
        "Error editando elección"
    });
  }
}

// =====================================================
// 🔵 ELIMINAR VOTOS
// =====================================================
async function deleteVotes(req, res) {
  try {
    const { pollId } = req.params;

    await Vote.destroy({
      where: { pollId }
    });

    await logAction(
      req.admin,
      "Eliminar votos",
      `Se eliminaron los votos de ${pollId}.`
    );

    return res.json({
      message: "Votos eliminados"
    });

  } catch (err) {
    console.error(
      "ERROR DELETE VOTES:",
      err
    );

    return res.status(500).json({
      message:
        "Error eliminando votos"
    });
  }
}

// =====================================================
// 🔵 ELIMINAR ELECCIÓN
// =====================================================
async function deleteElection(req, res) {
  try {
    const { pollId } = req.params;

    await Election.destroy({
      where: { pollId }
    });

    await logAction(
      req.admin,
      "Eliminar elección",
      `Se eliminó ${pollId}.`
    );

    return res.json({
      message:
        "Elección eliminada"
    });

  } catch (err) {
    console.error(
      "ERROR DELETE:",
      err
    );

    return res.status(500).json({
      message:
        "Error eliminando elección"
    });
  }
}

module.exports = {
  createElection,
  getElections,
  getActiveElection,
  changeElectionStatus,
  editElection,
  deleteVotes,
  deleteElection
};