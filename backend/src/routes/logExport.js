const express = require("express");
const router = express.Router();

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");
const logAction = require("../utils/logAction");

// ============================================================
// 🔵 LOG EXPORT PDF
// ============================================================
router.post(
  "/pdf",
  adminAuth,
  permit("superadmin", "editor"),
  async (req, res) => {
    try {
      const { pollTitle } = req.body;

      await logAction({
        admin: req.admin,
        action: "export_pdf",
        entity: "election",
        details: `PDF generado: ${pollTitle}`,
        req
      });

      res.json({ message: "Log registrado" });

    } catch (err) {
      res.status(500).json({
        message: "Error registrando log"
      });
    }
  }
);

module.exports = router;