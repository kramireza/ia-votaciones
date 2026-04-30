const ApprovalRequest = require("../models/ApprovalRequest");
const Election = require("../models/Election");
const fs = require("fs");
const path = require("path");
const logAction = require("../utils/logAction");

// Crear solicitud de eliminación
async function requestDeleteElection(req, res) {
  try {
    const { pollId } = req.params;

    // Verificar existencia de la elección
    const election = await Election.findOne({ where: { pollId } });
    if (!election) return res.status(404).json({ message: "Elección no encontrada" });

    const reqObj = await ApprovalRequest.create({
      type: "delete",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload: null
    });

    await logAction(
      req.admin,
      "Solicitar eliminación",
      `Solicitud ${reqObj.id} para eliminar elección ${pollId}`
    );

    return res.json({
      message: "Solicitud de eliminación enviada",
      request: reqObj
    });

  } catch (err) {
    console.error("ERROR requestDeleteElection:", err);
    res.status(500).json({ message: "Error creando solicitud" });
  }
}

// Crear solicitud de edición
async function requestEditElection(req, res) {
  try {
    const { pollId } = req.params;

    // Verificar existencia
    const election = await Election.findOne({ where: { pollId } });
    if (!election) {
      return res.status(404).json({ message: "Elección no encontrada" });
    }

    let payload = {};

    // ==========================
    // CAMPOS BASE
    // ==========================
    const title = req.body.title;
    const type = req.body.type || "simple";

    payload.title = title;
    payload.type = type;

    // ==========================
    // SIMPLE
    // ==========================
    if (type === "simple") {
      let options = JSON.parse(req.body.options || "[]");

      // Manejo de imágenes
      if (req.files && req.files.length > 0) {
        let fileIndex = 0;

        options = options.map(opt => {
          if (opt.newImage && req.files[fileIndex]) {
            opt.imageUrl = `/uploads/${req.files[fileIndex].filename}`;
            fileIndex++;
          }

          delete opt.newImage;

          return {
            text: opt.text,
            description: opt.description || "",
            imageUrl: opt.imageUrl || null
          };
        });
      } else {
        // Asegurar estructura aunque no haya imágenes
        options = options.map(opt => ({
          text: opt.text,
          description: opt.description || "",
          imageUrl: opt.imageUrl || null
        }));
      }

      payload.options = options;
    }

    // ==========================
    // COMPOUND
    // ==========================
    if (type === "compound") {
      let sections = JSON.parse(req.body.sections || "[]");

      if (req.files && req.files.length > 0) {
        let fileIndex = 0;

        sections = sections.map(section => ({
          ...section,
          options: section.options.map(opt => {
            if (opt.newImage && req.files[fileIndex]) {
              opt.imageUrl = `/uploads/${req.files[fileIndex].filename}`;
              fileIndex++;
            }

            delete opt.newImage;

            return {
              text: opt.text,
              description: opt.description || "",
              imageUrl: opt.imageUrl || null
            };
          })
        }));
      } else {
        // Asegurar estructura aunque no haya imágenes
        sections = sections.map(section => ({
          ...section,
          options: section.options.map(opt => ({
            text: opt.text,
            description: opt.description || "",
            imageUrl: opt.imageUrl || null
          }))
        }));
      }

      payload.sections = sections;
    }

    // ==========================
    // CREAR SOLICITUD
    // ==========================
    const reqObj = await ApprovalRequest.create({
      type: "edit",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload
    });

    await logAction(
      req.admin,
      "Solicitar edición",
      `Solicitud ${reqObj.id} para editar elección ${pollId}`
    );

    return res.json({
      message: "Solicitud de edición enviada",
      request: reqObj
    });

  } catch (err) {
    console.error("ERROR requestEditElection:", err);
    res.status(500).json({ message: "Error creando solicitud" });
  }
}

// Listar solicitudes
async function listRequests(req, res) {
  try {
    const role = req.admin?.role;
    const username = req.admin?.username;

    if (role === "superadmin") {
      const requests = await ApprovalRequest.findAll({
        order: [["createdAt", "DESC"]]
      });
      return res.json(requests);
    }

    const requests = await ApprovalRequest.findAll({
      where: { requestedBy: username },
      order: [["createdAt", "DESC"]]
    });

    return res.json(requests);

  } catch (err) {
    console.error("ERROR listRequests:", err);
    res.status(500).json({ message: "Error listando solicitudes" });
  }
}

// Ver solicitud
async function getRequest(req, res) {
  try {
    const { id } = req.params;

    const reqObj = await ApprovalRequest.findByPk(id);
    if (!reqObj) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    const role = req.admin?.role;
    const username = req.admin?.username;

    if (role === "editor" && reqObj.requestedBy !== username) {
      return res.status(403).json({ message: "Permisos insuficientes" });
    }

    res.json(reqObj);

  } catch (err) {
    console.error("ERROR getRequest:", err);
    res.status(500).json({ message: "Error obteniendo solicitud" });
  }
}

// Aprobar solicitud
async function approveRequest(req, res) {
  try {
    const { id } = req.params;

    const reqObj = await ApprovalRequest.findByPk(id);
    if (!reqObj) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    if (reqObj.status !== "pending") {
      return res.status(400).json({ message: "Solicitud ya procesada" });
    }

    // ==========================
    // DELETE
    // ==========================
    if (reqObj.type === "delete") {
      await Election.destroy({ where: { pollId: reqObj.pollId } });

      const Vote = require("../models/Vote");
      await Vote.destroy({ where: { pollId: reqObj.pollId } });

      await logAction(
        req.admin,
        "Aprobar eliminación",
        `Solicitud ${id} aprobada. Se eliminó elección ${reqObj.pollId}`
      );
    }

    // ==========================
    // EDIT
    // ==========================
    else if (reqObj.type === "edit") {
      const election = await Election.findOne({
        where: { pollId: reqObj.pollId }
      });

      if (!election) {
        return res.status(404).json({
          message: "Elección no encontrada al aplicar cambios"
        });
      }

      const { title, options, sections, type } = reqObj.payload || {};

      if (title !== undefined) election.title = title;
      if (options !== undefined) election.options = options;
      if (sections !== undefined) election.sections = sections;
      if (type !== undefined) election.type = type;

      await election.save();

      await logAction(
        req.admin,
        "Aprobar edición",
        `Solicitud ${id} aprobada. Se aplicaron cambios a ${reqObj.pollId}`
      );
    }

    reqObj.status = "approved";
    reqObj.adminComment = req.body.comment || null;

    await reqObj.save();

    return res.json({ message: "Solicitud aprobada" });

  } catch (err) {
    console.error("ERROR approveRequest:", err);
    res.status(500).json({ message: "Error aprobando solicitud" });
  }
}

// Rechazar solicitud
async function rejectRequest(req, res) {
  try {
    const { id } = req.params;

    const reqObj = await ApprovalRequest.findByPk(id);
    if (!reqObj) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    if (reqObj.status !== "pending") {
      return res.status(400).json({ message: "Solicitud ya procesada" });
    }

    reqObj.status = "rejected";
    reqObj.adminComment = req.body.comment || null;

    await reqObj.save();

    await logAction(
      req.admin,
      "Rechazar solicitud",
      `Solicitud ${id} rechazada por ${req.admin.username || req.admin.id}`
    );

    return res.json({ message: "Solicitud rechazada" });

  } catch (err) {
    console.error("ERROR rejectRequest:", err);
    res.status(500).json({ message: "Error rechazando solicitud" });
  }
}

module.exports = {
  requestDeleteElection,
  requestEditElection,
  listRequests,
  getRequest,
  approveRequest,
  rejectRequest
};