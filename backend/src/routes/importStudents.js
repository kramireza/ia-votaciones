const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { adminAuth } = require("../middleware/authMiddleware");
const { importStudents } = require("../controllers/studentImportController");

// protegemos la ruta para solo admins
router.post("/", adminAuth, upload.single("file"), importStudents);

module.exports = router;
