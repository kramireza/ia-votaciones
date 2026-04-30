const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");
const { importStudents } = require("../controllers/studentImportController");

// ============================================================
// 🔵 IMPORTAR ESTUDIANTES
// ============================================================
router.post(
  "/",
  adminAuth,
  permit("superadmin", "editor"),
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          message: err.message || "Error subiendo archivo"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Debe enviar un archivo CSV"
        });
      }

      next();
    });
  },
  importStudents
);

module.exports = router;