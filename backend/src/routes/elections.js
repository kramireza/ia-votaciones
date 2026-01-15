const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadImages");
const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

const {
  createElection,
  getElections,
  getActiveElection,
  changeElectionStatus,
  deleteVotes,
  deleteElection,
  editElection
} = require("../controllers/electionsController");

// 🔵 Ruta pública — elección activa
router.get("/active", getActiveElection);

// Crear elección -> permitimos editor + superadmin
router.post("/create", adminAuth, permit("superadmin", "editor"), upload.array("images"), createElection);

// Listar elecciones (admin/editor)
router.get("/", adminAuth, permit("superadmin", "editor"), getElections);

// Cambiar estado (admin/editor)
router.patch("/:pollId/status", adminAuth, permit("superadmin", "editor"), changeElectionStatus);

// Editar elección (con imágenes) (admin/editor)
router.put("/:pollId", adminAuth, permit("superadmin"), upload.array("images"), editElection);

// Eliminar votos -> SOLO superadmin ahora
router.delete("/:pollId/votes", adminAuth, permit("superadmin"), deleteVotes);

// Eliminar elección (admin/editor) — si en el futuro quieres restringir, lo ajustamos
router.delete("/:pollId", adminAuth, permit("superadmin"), deleteElection);

module.exports = router;
