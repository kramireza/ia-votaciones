const Election = require("../models/Election");
const Student = require("../models/Student");
const Vote = require("../models/Vote");
const fs = require("fs");

const logAction = require("../utils/logAction");

// 🔐 Sanitizador básico
function cleanString(str, max = 255) {
  return String(str || "")
    .trim()
    .substring(0, max);
}

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
    let {
      pollId,
      title,
      type,
      mode,
      segmentType,
      segmentValue,
      startDate,
      endDate
    } = req.body;


    mode = mode || "single";
    type = type || "simple";
    title = cleanString(title);

    let options = [];
    let sections = [];

    // ================= VALIDACIÓN TYPE =================
    if (!["simple", "compound"].includes(type)) {
      return res.status(400).json({
        message: "Tipo de elección inválido"
      });
    }

    // ==========================================
    // SIMPLE
    // ==========================================
    if (type === "simple") {
      options = JSON.parse(req.body.options || "[]");

      if (!Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          message: "Debe enviar al menos una opción"
        });
      }

      options = options.map(opt => ({
        text: cleanString(opt.text),
        description: cleanString(opt.description),
        imageUrl: opt.imageUrl || ""
      }));

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
      sections = JSON.parse(req.body.sections || "[]");

      if (!Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          message: "Debe enviar al menos una sección"
        });
      }

      sections = sections.map(sec => ({
        title: cleanString(sec.title),
        options: (sec.options || []).map(opt => ({
          text: cleanString(opt.text),
          description: cleanString(opt.description),
          imageUrl: opt.imageUrl || ""
        }))
      }));

      // 🔥 FIX REAL IMÁGENES COMPOUND
      if (req.files && req.files.length > 0) {
        let fileIndex = 0;

        sections = sections.map((sec) => {
          sec.options = (sec.options || []).map((opt) => {

            if (req.files[fileIndex]) {
              opt.imageUrl = `/uploads/${req.files[fileIndex].filename}`;
              fileIndex++;
            }

            return {
              text: cleanString(opt.text),
              description: cleanString(opt.description),
              imageUrl: opt.imageUrl || ""
            };
          });

          return sec;
        });
      }
    }

    if (!title || title === "") {
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
      status: "closed",
      mode,
      segmentType,
      segmentValue,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    await logAction({
      admin: req.admin,
      action: "create_election",
      entity: "election",
      entityId: pollId,
      details: `Creación tipo ${type}`,
      req
    });

    return res.json({
      message: "Elección creada correctamente",
      election
    });

  } catch (err) {
    console.error("ERROR CREATE ELECTION:", err);

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
    const elections = await Election.findAll({
      order: [["createdAt", "DESC"]]
    });

    return res.json(elections);

  } catch (err) {
    console.error("GET ELECTIONS ERROR:", err);

    return res.status(500).json({
      message: "Error obteniendo elecciones"
    });
  }
}

// =====================================================
// 🔵 CAMBIAR ESTADO
// =====================================================
async function changeElectionStatus(req, res) {
  try {
    const { pollId } = req.params;
    const { status } = req.body;

    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        message: "Estado inválido"
      });
    }

    const election = await Election.findOne({
      where: { pollId }
    });

    if (!election) {
      return res.status(404).json({
        message: "Elección no encontrada"
      });
    }

    if (status === "open") {
      await Election.update(
        { status: "closed" },
        { where: { status: "open" } }
      );
    }

    election.status = status;
    await election.save();

    await logAction({
      admin: req.admin,
      action: "change_status",
      entity: "election",
      entityId: pollId,
      details: `Nuevo estado: ${status}`,
      req
    });

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
// 🔵 EDITAR ELECCIÓN
// =====================================================
async function editElection(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({
      where: { pollId }
    });

    if (!election) {
      return res.status(404).json({
        message: "Elección no encontrada"
      });
    }

    const newTitle = cleanString(req.body.title || election.title);
    const newType = req.body.type || election.type || "simple";

    let newOptions = [];
    let newSections = [];

    if (newType === "simple") {
      newOptions = JSON.parse(req.body.options || "[]");

      newOptions = newOptions.map(opt => ({
        text: cleanString(opt.text),
        description: cleanString(opt.description),
        imageUrl: opt.imageUrl || ""
      }));
    }

    if (newType === "compound") {
      newSections = JSON.parse(req.body.sections || "[]");

      newSections = newSections.map(sec => ({
        title: cleanString(sec.title),
        options: (sec.options || []).map(opt => ({
          text: cleanString(opt.text),
          description: cleanString(opt.description),
          imageUrl: opt.imageUrl || ""
        }))
      }));
    }

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

    await logAction({
      admin: req.admin,
      action: "edit_election",
      entity: "election",
      entityId: pollId,
      details: `Tipo: ${newType}`,
      req
    });

    return res.json({
      message: "Elección editada correctamente"
    });

  } catch (err) {
    console.error("EDIT ERROR:", err);

    return res.status(500).json({
      message: "Error editando elección"
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

    await logAction({
      admin: req.admin,
      action: "delete_votes",
      entity: "election",
      entityId: pollId,
      details: "Se eliminaron votos",
      req
    });

    return res.json({
      message: "Votos eliminados"
    });

  } catch (err) {
    console.error("ERROR DELETE VOTES:", err);

    return res.status(500).json({
      message: "Error eliminando votos"
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

    await logAction({
      admin: req.admin,
      action: "delete_election",
      entity: "election",
      entityId: pollId,
      details: "Eliminación",
      req
    });

    return res.json({
      message: "Elección eliminada"
    });

  } catch (err) {
    console.error("ERROR DELETE:", err);

    return res.status(500).json({
      message: "Error eliminando elección"
    });
  }
}

// =====================================================
// 🔵 NUEVO — MULTI ELECCIÓN INTELIGENTE
// =====================================================
async function getActiveElectionsSmart(req, res) {
  try {
    const { studentAccount } = req.query;

    if (!studentAccount) {
      return res.status(400).json({
        message: "Cuenta requerida"
      });
    }

    // ⚠️ Aquí debes obtener el estudiante desde tu lógica actual
    // Ajusta esto según tu modelo real
    const student = await Student.findOne({
      where: { accountNumber: studentAccount }
    });

    if (!student) {
      return res.status(404).json({
        message: "Estudiante no encontrado"
      });
    }

    const now = new Date();

    const elections = await Election.findAll({
      where: { status: "open" }
    });

    // 🔥 separar modos
    const singleElections = elections.filter(e => e.mode === "single");
    const multiElections = elections.filter(e => e.mode === "multi");

    let valid = [];

    // ===================================================
    // 🔵 CASO 1: EXISTE SINGLE (modo actual)
    // ===================================================
    if (singleElections.length > 0) {

      const single = singleElections.find(e => {
        if (e.startDate && now < new Date(e.startDate)) return false;
        if (e.endDate && now > new Date(e.endDate)) return false;
        return true;
      });

      if (single) {
        return res.json({
          mode: "single",
          elections: [single]
        });
      }
    }

    // ===================================================
    // 🔵 CASO 2: MULTI ELECCIÓN
    // ===================================================
    valid = multiElections.filter(e => {

      if (e.startDate && now < new Date(e.startDate)) return false;
      if (e.endDate && now > new Date(e.endDate)) return false;

      // 🌐 GLOBAL
      if (e.segmentType === "global") return true;

      // 🏫 CENTER
      if (
        e.segmentType === "center" &&
        String(student.center).trim().toLowerCase() ===
        String(e.segmentValue).trim().toLowerCase()
      ) return true;

      // 🎓 CAREER (listo para futuro)
      if (
        e.segmentType === "career" &&
        student.career &&
        String(student.career).trim().toLowerCase() ===
        String(e.segmentValue).trim().toLowerCase()
      ) return true;

      // 🏛 FACULTY (listo para futuro)
      if (
        e.segmentType === "faculty" &&
        student.faculty &&
        String(student.faculty).trim().toLowerCase() ===
        String(e.segmentValue).trim().toLowerCase()
      ) return true;
      
      return false;
    });

    return res.json({
      mode: "multi",
      elections: valid
    });

  } catch (err) {
    console.error("SMART ERROR:", err);

    return res.status(500).json({
      message: "Error obteniendo elecciones inteligentes"
    });
  }
}

module.exports = {
  createElection,
  getElections,
  getActiveElection,
  getActiveElectionsSmart,
  changeElectionStatus,
  editElection,
  deleteVotes,
  deleteElection
};