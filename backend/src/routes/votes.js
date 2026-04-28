const express = require("express");
const router = express.Router();

const {
  castVote,
  getVotesForAdmin,
  exportVotesExcel,
  exportResultsExcel,
  getDetailedVoteResults,
  getPublicResults,
  checkVote
} = require("../controllers/voteController");

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

// ============================================================
// PÚBLICO
// ============================================================

// Registrar voto
router.post("/cast", castVote);

// Revisar si ya votó
router.get("/check", checkVote);

// 🔥 NUEVO: Resultados públicos
router.get("/public/results", getPublicResults);

// ============================================================
// ADMIN
// ============================================================

// Todos los votos
router.get(
  "/admin/all",
  adminAuth,
  permit("superadmin", "editor"),
  getVotesForAdmin
);

// Exportar votos
router.get(
  "/admin/export/excel",
  adminAuth,
  permit("superadmin", "editor"),
  exportVotesExcel
);

// Exportar resultados
router.get(
  "/admin/export/excel/results",
  adminAuth,
  permit("superadmin", "editor"),
  exportResultsExcel
);

// Resultados detallados
router.get(
  "/admin/results/:pollId",
  adminAuth,
  permit("superadmin", "editor"),
  getDetailedVoteResults
);

module.exports = router;