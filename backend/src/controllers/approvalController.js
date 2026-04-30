const ApprovalRequest = require("../models/ApprovalRequest");
const Election = require("../models/Election");
const fs = require("fs");
const path = require("path");
const logAction = require("../utils/logAction");

// 🔐 Sanitizador
function cleanString(str, max = 255) {
  return String(str || "").trim().substring(0, max);
}

// ============================================================
// DELETE
// ============================================================
async function requestDeleteElection(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({ where: { pollId } });
    if (!election) {
      return res.status(404).json({ message: "Elección no encontrada" });
    }

    const reqObj = await ApprovalRequest.create({
      type: "delete",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload: null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    await logAction({
      admin: req.admin,
      action: "request_delete",
      entity: "election",
      entityId: pollId,
      details: `Solicitud ${reqObj.id}`,
      req
    });

    return res.json({
      message: "Solicitud de eliminación enviada",
      request: reqObj
    });

  } catch (err) {
    console.error("ERROR requestDeleteElection:", err);
    res.status(500).json({ message: "Error creando solicitud" });
  }
}

// ============================================================
// EDIT
// ============================================================
async function requestEditElection(req, res) {
  try {
    const { pollId } = req.params;

    const election = await Election.findOne({ where: { pollId } });
    if (!election) {
      return res.status(404).json({ message: "Elección no encontrada" });
    }

    let payload = {};

    const title = cleanString(req.body.title);
    const type = req.body.type || "simple";

    if (!["simple", "compound"].includes(type)) {
      return res.status(400).json({
        message: "Tipo inválido"
      });
    }

    payload.title = title;
    payload.type = type;

    // ================= SIMPLE =================
    if (type === "simple") {
      let options = JSON.parse(req.body.options || "[]");

      if (!Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          message: "Debe enviar opciones"
        });
      }

      options = options.map(opt => ({
        text: cleanString(opt.text),
        description: cleanString(opt.description),
        imageUrl: opt.imageUrl || null
      }));

      payload.options = options;
    }

    // ================= COMPOUND =================
    if (type === "compound") {
      let sections = JSON.parse(req.body.sections || "[]");

      if (!Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          message: "Debe enviar secciones"
        });
      }

      sections = sections.map(sec => ({
        title: cleanString(sec.title),
        options: (sec.options || []).map(opt => ({
          text: cleanString(opt.text),
          description: cleanString(opt.description),
          imageUrl: opt.imageUrl || null
        }))
      }));

      payload.sections = sections;
    }

    const reqObj = await ApprovalRequest.create({
      type: "edit",
      pollId,
      requestedBy: req.admin.username || (`id:${req.admin.id}`),
      payload,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    await logAction({
      admin: req.admin,
      action: "request_edit",
      entity: "election",
      entityId: pollId,
      details: `Solicitud ${reqObj.id}`,
      req
    });

    return res.json({
      message: "Solicitud de edición enviada",
      request: reqObj
    });

  } catch (err) {
    console.error("ERROR requestEditElection:", err);
    res.status(500).json({ message: "Error creando solicitud" });
  }
}

// ============================================================
// PASSWORD CHANGE (NUEVO)
// ============================================================
async function requestPasswordChange(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Contraseña inválida"
      });
    }

    const reqObj = await ApprovalRequest.create({
      type: "password_change",
      pollId: null,
      requestedBy: req.admin.username,
      payload: { newPassword },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    await logAction({
      admin: req.admin,
      action: "request_password_change",
      entity: "admin",
      details: `Solicitud ${reqObj.id}`,
      req
    });

    res.json({
      message: "Solicitud enviada",
      request: reqObj
    });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
}

// ============================================================
// LIST
// ============================================================
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

// ============================================================
// GET
// ============================================================
async function getRequest(req, res) {
  try {
    const { id } = req.params;

    const reqObj = await ApprovalRequest.findByPk(id);
    if (!reqObj) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    if (
      req.admin.role === "editor" &&
      reqObj.requestedBy !== req.admin.username
    ) {
      return res.status(403).json({ message: "Permisos insuficientes" });
    }

    res.json(reqObj);

  } catch (err) {
    console.error("ERROR getRequest:", err);
    res.status(500).json({ message: "Error obteniendo solicitud" });
  }
}

// ============================================================
// APPROVE
// ============================================================
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

    // DELETE
    if (reqObj.type === "delete") {
      await Election.destroy({ where: { pollId: reqObj.pollId } });

      const Vote = require("../models/Vote");
      await Vote.destroy({ where: { pollId: reqObj.pollId } });
    }

    // EDIT
    if (reqObj.type === "edit") {
      const election = await Election.findOne({
        where: { pollId: reqObj.pollId }
      });

      if (!election) {
        return res.status(404).json({
          message: "Elección no encontrada"
        });
      }

      const { title, options, sections, type } = reqObj.payload || {};

      if (title !== undefined) election.title = title;
      if (type !== undefined) election.type = type;

      if (type === "simple") {
        election.options = options || [];
        election.sections = [];
      }

      if (type === "compound") {
        election.sections = sections || [];
        election.options = [];
      }

      await election.save();
    }

    // PASSWORD CHANGE
    if (reqObj.type === "password_change") {
      const Admin = require("../models/Admin");
      const bcrypt = require("bcrypt");

      const admin = await Admin.findOne({
        where: { username: reqObj.requestedBy }
      });

      admin.passwordHash = await bcrypt.hash(
        reqObj.payload.newPassword,
        10
      );

      await admin.save();
    }

    reqObj.status = "approved";
    reqObj.adminComment = req.body.comment || null;

    await reqObj.save();

    await logAction({
      admin: req.admin,
      action: "approve_request",
      entity: "approval_request",
      entityId: id,
      details: `Tipo: ${reqObj.type}`,
      req
    });

    return res.json({ message: "Solicitud aprobada" });

  } catch (err) {
    console.error("ERROR approveRequest:", err);
    res.status(500).json({ message: "Error aprobando solicitud" });
  }
}

// ============================================================
// REJECT
// ============================================================
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

    await logAction({
      admin: req.admin,
      action: "reject_request",
      entity: "approval_request",
      entityId: id,
      details: "Rechazada",
      req
    });

    return res.json({ message: "Solicitud rechazada" });

  } catch (err) {
    console.error("ERROR rejectRequest:", err);
    res.status(500).json({ message: "Error rechazando solicitud" });
  }
}

module.exports = {
  requestDeleteElection,
  requestEditElection,
  requestPasswordChange,
  listRequests,
  getRequest,
  approveRequest,
  rejectRequest
};