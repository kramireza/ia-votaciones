const express = require("express");
const router = express.Router();

const { upload, validateImage } = require("../middleware/uploadImages");
const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

const {
  createElection,
  getElections,
  getActiveElection,
  getActiveElectionsSmart,
  changeElectionStatus,
  deleteVotes,
  deleteElection,
  editElection
} = require("../controllers/electionsController");

// ============================================================
// 🔵 RUTA PÚBLICA
// ============================================================
router.get("/active", getActiveElection);
// 🔵 NUEVO — MULTI ELECCIÓN
router.get("/active-smart", getActiveElectionsSmart);

// ============================================================
// 🔵 CREAR ELECCIÓN
// ============================================================
router.post(
  "/create",
  adminAuth,
  permit("superadmin", "editor"),
  (req, res, next) => {
    upload.array("images")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          message: err.message || "Error subiendo imágenes"
        });
      }

      try {
        if (req.files && req.files.length > 0) {
          for (let file of req.files) {
            await validateImage({ file }, res, () => {});
          }
        }
        next();
      } catch (error) {
        return res.status(400).json({
          message: "Error validando imágenes"
        });
      }
    });
  },
  createElection
);

// ============================================================
// 🔵 LISTAR
// ============================================================
router.get(
  "/",
  adminAuth,
  permit("superadmin", "editor"),
  getElections
);

// ============================================================
// 🔵 CAMBIAR ESTADO
// ============================================================
router.patch(
  "/:pollId/status",
  adminAuth,
  permit("superadmin", "editor"),
  changeElectionStatus
);

// ============================================================
// 🔵 EDITAR (SOLO SUPERADMIN)
// ============================================================
router.put(
  "/:pollId",
  adminAuth,
  permit("superadmin"),
  (req, res, next) => {
    upload.array("images")(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          message: err.message || "Error subiendo imágenes"
        });
      }

      try {
        if (req.files && req.files.length > 0) {
          for (let file of req.files) {
            await validateImage({ file }, res, () => {});
          }
        }
        next();
      } catch (error) {
        return res.status(400).json({
          message: "Error validando imágenes"
        });
      }
    });
  },
  editElection
);

// ============================================================
// 🔵 ELIMINAR VOTOS
// ============================================================
router.delete(
  "/:pollId/votes",
  adminAuth,
  permit("superadmin"),
  deleteVotes
);

// ============================================================
// 🔵 ELIMINAR ELECCIÓN
// ============================================================
router.delete(
  "/:pollId",
  adminAuth,
  permit("superadmin"),
  deleteElection
);

module.exports = router;