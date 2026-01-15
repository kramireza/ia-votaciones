// backend/src/routes/student.js
const express = require("express");
const router = express.Router();
const { verifyStudent } = require("../controllers/studentController");

router.post("/verify", verifyStudent);

module.exports = router;
