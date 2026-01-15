const express = require("express");
const router = express.Router();

const { 
  castVote, 
  getVotesForAdmin, 
  exportVotesExcel, 
  exportResultsExcel,
  getDetailedVoteResults,
  checkVote
} = require("../controllers/voteController");

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

// Registrar voto (público)
router.post("/cast", castVote);

// Obtener todos los votos (admin/editor)
router.get("/admin/all", adminAuth, permit("superadmin", "editor"), getVotesForAdmin);

// Exportar EXCEL completo (admin/editor)
router.get("/admin/export/excel", adminAuth, permit("superadmin", "editor"), exportVotesExcel);

// Exportar EXCEL de resultados agrupados (admin/editor)
router.get("/admin/export/excel/results", adminAuth, permit("superadmin", "editor"), exportResultsExcel);

// Obtener resultados detallados (admin/editor)
router.get("/admin/results/:pollId", adminAuth, permit("superadmin", "editor"), getDetailedVoteResults);

router.get("/check", checkVote);

module.exports = router;
