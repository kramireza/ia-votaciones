// backend/src/routes/approvals.js
const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadImages");
const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

const {
  requestDeleteElection,
  requestEditElection,
  requestPasswordChange,
  listRequests,
  getRequest,
  approveRequest,
  rejectRequest
} = require("../controllers/approvalController");

// ============================================================
// 🔵 SOLICITUDES
// ============================================================

// DELETE
router.post(
  "/elections/:pollId/request-delete",
  adminAuth,
  permit("superadmin", "editor"),
  requestDeleteElection
);

// EDIT (con imágenes)
router.post(
  "/elections/:pollId/request-edit",
  adminAuth,
  permit("superadmin", "editor"),
  (req, res, next) => {
    upload.array("images")(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          message: err.message || "Error subiendo imágenes"
        });
      }
      next();
    });
  },
  requestEditElection
);

// 🔐 PASSWORD CHANGE (NUEVO)
router.post(
  "/request-password-change",
  adminAuth,
  permit("superadmin", "editor"),
  requestPasswordChange
);

// ============================================================
// 🔵 CONSULTAS
// ============================================================

router.get(
  "/requests",
  adminAuth,
  permit("superadmin", "editor"),
  listRequests
);

router.get(
  "/requests/:id",
  adminAuth,
  permit("superadmin", "editor"),
  getRequest
);

// ============================================================
// 🔵 ACCIONES SUPERADMIN
// ============================================================

router.post(
  "/requests/:id/approve",
  adminAuth,
  permit("superadmin"),
  approveRequest
);

router.post(
  "/requests/:id/reject",
  adminAuth,
  permit("superadmin"),
  rejectRequest
);

module.exports = router;