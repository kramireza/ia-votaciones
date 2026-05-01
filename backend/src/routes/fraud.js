const express = require("express");
const router = express.Router();

const {
  getFraudSummary,
  getVotesByIP,
  blockIP,
  unblockIP,
  getHourlyTrend
} = require("../controllers/fraudController");

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");

// 🔐 SOLO ADMIN
router.get(
  "/summary",
  adminAuth,
  permit("superadmin", "editor"),
  getFraudSummary
);

router.get(
  "/ip/:ip",
  adminAuth,
  permit("superadmin", "editor"),
  getVotesByIP
);

router.post(
  "/block",
  adminAuth,
  permit("superadmin"),
  blockIP
);

router.post(
  "/unblock",
  adminAuth,
  permit("superadmin"),
  unblockIP
);

router.get(
  "/trend",
  adminAuth,
  permit("superadmin", "editor"),
  getHourlyTrend
);

module.exports = router;