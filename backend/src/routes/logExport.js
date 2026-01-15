const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/authMiddleware");
const logAction = require("../utils/logAction");

router.post("/pdf", adminAuth, (req, res) => {
  const { pollTitle } = req.body;

  logAction(
    req.admin,
    "Exportó PDF",
    `PDF generado de la elección: ${pollTitle}`
  );

  res.json({ message: "Log registrado" });
});

module.exports = router;
