// backend/src/routes/student.js
const express = require("express");
const router = express.Router();

const { verifyStudent } = require("../controllers/studentController");

// ============================================================
// 🔵 VALIDADOR
// ============================================================
function validateVerify(req, res, next) {
  const { accountNumber } = req.body;

  if (!accountNumber) {
    return res.status(400).json({
      message: "Número de cuenta requerido"
    });
  }

  if (typeof accountNumber !== "string") {
    return res.status(400).json({
      message: "Formato inválido"
    });
  }

  if (accountNumber.length < 5 || accountNumber.length > 20) {
    return res.status(400).json({
      message: "Número de cuenta inválido"
    });
  }

  next();
}

// ============================================================
// 🔵 VERIFY STUDENT
// ============================================================
router.post(
  "/verify",
  validateVerify,
  verifyStudent
);

module.exports = router;