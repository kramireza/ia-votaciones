// backend/src/controllers/electionsController.js
const Election = require("../models/Election");
const Vote = require("../models/Vote");
const fs = require("fs");

// ⭐ Nuevo: logger
const logAction = require("../utils/logAction");

// =====================================================
//  🔵 RUTA PÚBLICA — Obtener elección activa
// =====================================================
async function getActiveElection(req, res) {
  try {
    const active = await Election.findOne({ where: { status: "open" } });

    if (!active)
      return res.status(404).json({ message: "No hay elección activa." });

    res.json(active);
  } catch (err) {
    console.error("ERROR GET ACTIVE:", err);
    res.status(500).json({ message: "Error obteniendo elección activa" });
  }
}

// =====================================================
//  🔵 CREAR ELECCIÓN CON IMÁGENES
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
            options[index].imageUrl = `/uploads/${file.filename}`;
          }
        });
      }
    }

    // ==========================================
    // COMPOUND
    // ==========================================
    if (type === "compound") {
      sections = JSON.parse(req.body.sections || "[]");
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "El título es requerido",
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
      status: "closed",
    });

    await logAction(
      req.admin,
      "Crear elección",
      `Se creó la elección ${pollId} (${type}).`
    );

    res.json({
      message: "Elección creada correctamente",
      election,
    });

  } catch (err) {
    console.error("ERROR CREATE ELECTION:", err);
    res.status(500).json({
      message: "Error creando elección",
    });
  }
}

// =====================================================
//  🔵 OBTENER TODAS LAS ELECCIONES (Admin)
// =====================================================
async function getElections(req, res) {
  try {
    const elections = await Election.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.json(elections);
  } catch (err) {
    console.error("GET ELECTIONS ERROR:", err);
    res.status(500).json({ message: "Error obteniendo elecciones" });
  }
}

// =====================================================
//  🔵 CAMBIAR ESTADO
// =====================================================
async function changeElectionStatus(req, res) {
  try {
    const { pollId } = req.params;
    const { status } = req.body;

    const election = await Election.findOne({
      where: { pollId }
    });

    if (!election) {
      return res.status(404).json({
        message: "Elección no encontrada"
      });
    }

    // =====================================================
    // SI QUIEREN ABRIR UNA ELECCIÓN:
    // cerrar cualquier otra abierta primero
    // =====================================================
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

    // Abrir/Cerrar la seleccionada
    election.status = status;
    await election.save();

    // =====================================================
    // LOGS
    // =====================================================
    if (status === "open") {
      await logAction(
        req.admin,
        "Activar elección",
        `Se activó ${pollId} y se cerraron otras elecciones abiertas.`
      );
    } else {
      await logAction(
        req.admin,
        "Cerrar elección",
        `Se cerró la elección ${pollId}.`
      );
    }

    return res.json({
      message: "Estado actualizado correctamente"
    });

  } catch (err) {
    console.error("ERROR CHANGE STATUS:", err);

    return res.status(500).json({
      message: "Error cambiando estado"
    });
  }
}

// =====================================================
//  🔵 EDITAR ELECCIÓN COMPLETA (con nuevas imágenes)
// =====================================================
async function editElection(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({ where: { pollId } });
    if (!election)
      return res.status(404).json({ message: "Elección no encontrada" });

    const newTitle = req.body.title;
    let newOptions = JSON.parse(req.body.options || "[]");

    // asignar nuevas imágenes
    if (req.files && req.files.length > 0) {
      let fileIndex = 0;
      newOptions = newOptions.map(opt => {
        if (opt.newImage) {
          opt.imageUrl = `/uploads/${req.files[fileIndex].filename}`;
          fileIndex++;
        }
        delete opt.newImage;
        return opt;
      });
    }

    // actualizar
    election.title = newTitle;
    election.options = newOptions;

    await election.save();

    // 🔵 LOG: edición
    await logAction(
      req.admin,
      "Editar elección",
      `Se editó la elección ${pollId}. Nuevo título: "${newTitle}".`
    );

    res.json({ message: "Elección editada correctamente" });

  } catch (err) {
    console.error("EDIT ERROR:", err);
    res.status(500).json({ message: "Error editando elección" });
  }
}

// =====================================================
//  🔵 ELIMINAR VOTOS
// =====================================================
async function deleteVotes(req, res) {
  try {
    const { pollId } = req.params;
    await Vote.destroy({ where: { pollId } });

    // 🔵 LOG
    await logAction(
      req.admin,
      "Eliminar votos",
      `Se eliminaron todos los votos de la elección ${pollId}.`
    );

    res.json({ message: "Votos eliminados" });

  } catch (err) {
    console.error("ERROR DELETE VOTES:", err);
    res.status(500).json({ message: "Error eliminando votos" });
  }
}

// =====================================================
//  🔵 ELIMINAR ELECCIÓN
// =====================================================
async function deleteElection(req, res) {
  try {
    const { pollId } = req.params;
    await Election.destroy({ where: { pollId } });

    // 🔵 LOG
    await logAction(
      req.admin,
      "Eliminar elección",
      `Se eliminó la elección ${pollId}.`
    );

    res.json({ message: "Elección eliminada" });
  } catch (err) {
    console.error("ERROR DELETE:", err);
    res.status(500).json({ message: "Error eliminando elección" });
  }
}

module.exports = {
  createElection,
  getElections,
  getActiveElection,
  changeElectionStatus,
  deleteVotes,
  deleteElection,
  editElection
};
