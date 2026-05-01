const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  castVote,
  getVotesForAdmin,
  exportVotesExcel,
  exportResultsExcel,
  getDetailedVoteResults,
  getPublicResults,
  getAllResults,
  checkVote
} = require("../controllers/voteController");

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

// ============================================================
// 🔵 VALIDADORES BÁSICOS
// ============================================================
function basicBotProtection(req, res, next) {
  const userAgent = req.headers["user-agent"];

  // bloquear requests sin user-agent (bots simples)
  if (!userAgent) {
    return res.status(403).json({
      message: "Acceso no permitido"
    });
  }

  next();
}

function validateCastVote(req, res, next) {
  let { studentAccount, pollId, option, answers } = req.body;

  // 🔐 Normalización
  studentAccount = String(studentAccount || "").trim();
  pollId = String(pollId || "").trim();

  if (!studentAccount || !pollId) {
    return res.status(400).json({
      message: "Datos incompletos"
    });
  }

  // 🔒 Validación básica de longitud
  if (studentAccount.length > 20) {
    return res.status(400).json({
      message: "Cuenta inválida"
    });
  }

  // 🔒 Validación contra payloads raros
  if (typeof studentAccount !== "string") {
    return res.status(400).json({
      message: "Formato inválido"
    });
  }

  // 🔒 Validar contenido de voto
  if (!option && !answers) {
    return res.status(400).json({
      message: "Debe seleccionar una opción"
    });
  }

  next();
}

function validateCheckVote(req, res, next) {
  const { pollId, studentAccount } = req.query;

  if (!pollId || !studentAccount) {
    return res.status(400).json({
      message: "Parámetros requeridos"
    });
  }

  next();
}

// 🔐 Rate limit específico para votos (ANTI SPAM)
const voteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // máximo 50 requests por IP
  message: {
    message: "Demasiados intentos de voto, intenta más tarde."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================
// 🔵 PÚBLICO
// ============================================================

// Registrar voto
router.post(
  "/cast",
  voteLimiter,
  basicBotProtection,
  validateCastVote,
  castVote
);

// Revisar si ya votó
router.get(
  "/check",
  validateCheckVote,
  checkVote
);

// Resultados públicos
router.get(
  "/public/results",
  getPublicResults
);

// ============================================================
// 🔵 ADMIN
// ============================================================

// Resultados generales admin
router.get(
  "/results",
  adminAuth,
  permit("superadmin", "editor"),
  getAllResults
);

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