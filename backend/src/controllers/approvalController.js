// backend/src/controllers/approvalController.js
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
    const election = await Election.findOne({ where: { pollId }});
    if (!election) return res.status(404).json({ message: "Elección no encontrada" });

    const reqObj = await ApprovalRequest.create({
      type: "delete",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload: null
    });

    await logAction(req.admin, "Solicitar eliminación", `Solicitud ${reqObj.id} para eliminar elección ${pollId}`);

    return res.json({ message: "Solicitud de eliminación enviada", request: reqObj });
  } catch (err) {
    console.error("ERROR requestDeleteElection:", err);
    res.status(500).json({ message: "Error creando solicitud" });
  }
}

// Crear solicitud de edición
async function requestEditElection(req, res) {
  try {
    const { pollId } = req.params;
    // election must exist
    const election = await Election.findOne({ where: { pollId }});
    if (!election) return res.status(404).json({ message: "Elección no encontrada" });

    // options may refer to image file names; if files were uploaded, map them to payload urls
    let payload = {};
    // Expecting fields: title, options (JSON string)
    const title = req.body.title;
    let options = JSON.parse(req.body.options || "[]");

    // assign images uploaded (same logic as create/edit)
    if (req.files && req.files.length > 0) {
      let fileIndex = 0;
      options = options.map(opt => {
        if (opt.newImage) {
          opt.imageUrl = `/uploads/${req.files[fileIndex].filename}`;
          fileIndex++;
        }
        delete opt.newImage;
        return opt;
      });
    }

    payload.title = title;
    payload.options = options;

    const reqObj = await ApprovalRequest.create({
      type: "edit",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload
    });

    await logAction(req.admin, "Solicitar edición", `Solicitud ${reqObj.id} para editar elección ${pollId}`);

    return res.json({ message: "Solicitud de edición enviada", request: reqObj });
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
      // superadmin ve todas
      const requests = await ApprovalRequest.findAll({
        order: [["createdAt", "DESC"]]
      });
      return res.json(requests);
    }

    // editors u otros roles: devolver solo solicitudes creadas por este usuario
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
    if (!reqObj) return res.status(404).json({ message: "Solicitud no encontrada" });

    // Si editor pide y no es suya -> 403
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
    if (!reqObj) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (reqObj.status !== "pending") return res.status(400).json({ message: "Solicitud ya procesada" });

    // Aplicar según tipo
    if (reqObj.type === "delete") {
      // eliminar elección y sus votos
      await Election.destroy({ where: { pollId: reqObj.pollId }});
      // eliminar votes; si tienes modelo Vote:
      const Vote = require("../models/Vote");
      await Vote.destroy({ where: { pollId: reqObj.pollId }});
      await logAction(req.admin, "Aprobar eliminación", `Solicitud ${id} aprobada. Se eliminó elección ${reqObj.pollId}`);
    } else if (reqObj.type === "edit") {
      // Aplicar cambios de payload (title/options)
      const election = await Election.findOne({ where: { pollId: reqObj.pollId }});
      if (!election) return res.status(404).json({ message: "Elección no encontrada al aplicar cambios" });

      const { title, options } = reqObj.payload || {};
      if (title !== undefined) election.title = title;
      if (options !== undefined) election.options = options;
      await election.save();

      await logAction(req.admin, "Aprobar edición", `Solicitud ${id} aprobada. Se aplicaron cambios a ${reqObj.pollId}`);
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
    if (!reqObj) return res.status(404).json({ message: "Solicitud no encontrada" });
    if (reqObj.status !== "pending") return res.status(400).json({ message: "Solicitud ya procesada" });

    reqObj.status = "rejected";
    reqObj.adminComment = req.body.comment || null;
    await reqObj.save();

    await logAction(req.admin, "Rechazar solicitud", `Solicitud ${id} rechazada por ${req.admin.username || req.admin.id}`);

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
