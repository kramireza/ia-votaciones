// backend/src/routes/approvals.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadImages");
const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

const {
  requestDeleteElection,
  requestEditElection,
  listRequests,
  getRequest,
  approveRequest,
  rejectRequest
} = require("../controllers/approvalController");

// Editor o superadmin puede enviar solicitud de eliminación
router.post("/elections/:pollId/request-delete", adminAuth, permit("superadmin","editor"), requestDeleteElection);

// Editor o superadmin puede enviar solicitud de edición (images opcional)
router.post("/elections/:pollId/request-edit", adminAuth, permit("superadmin","editor"), upload.array("images"), requestEditElection);

// Rutas de listado/detalle: permitir a editor ver sus propias solicitudes
router.get("/requests", adminAuth, permit("superadmin","editor"), listRequests);
router.get("/requests/:id", adminAuth, permit("superadmin","editor"), getRequest);

// Aprobar / Rechazar: solo superadmin
router.post("/requests/:id/approve", adminAuth, permit("superadmin"), approveRequest);
router.post("/requests/:id/reject", adminAuth, permit("superadmin"), rejectRequest);

module.exports = router;
