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
    let { pollId, title } = req.body;
    let options = JSON.parse(req.body.options || "[]");

    if (!title || !title.trim() === "") {
      return res.status(400).json({ message: "El título es requerido" });
    }

    // ✔ Si NO se envía pollId → lo generamos automáticamente
    if (!pollId || pollId.trim() === "") {
      pollId = "poll_" + Date.now();   // Ejemplo: poll_1732399901234
    }

    // asignar imágenes
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        if (options[index]) {
          options[index].imageUrl = `/uploads/${file.filename}`;
        }
      });
    }

    // ✔ Crear elección
    const election = await Election.create({
      pollId,
      title,
      options,
      status: "closed"
    });

    // 🔵 LOG: creación de elección
    await logAction(
      req.admin,
      "Crear elección",
      `Se creó la elección ${pollId} con ${options.length} opciones.`
    );

    res.json({ message: "Elección creada correctamente", election });

  } catch (err) {
    console.error("ERROR CREATE ELECTION:", err);
    res.status(500).json({ message: "Error creando elección" });
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

    const election = await Election.findOne({ where: { pollId } });
    if (!election)
      return res.status(404).json({ message: "Elección no encontrada" });

    election.status = status;
    await election.save();

    // 🔵 LOG: estado cambiado
    await logAction(
      req.admin,
      "Cambiar estado de elección",
      `La elección ${pollId} ahora está ${status}.`
    );

    res.json({ message: "Estado actualizado" });

  } catch (err) {
    console.error("ERROR CHANGE STATUS:", err);
    res.status(500).json({ message: "Error cambiando estado" });
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
