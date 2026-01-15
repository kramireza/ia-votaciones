const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/authMiddleware");
const AdminLog = require("../models/AdminLog");

router.get("/", adminAuth, async (req, res) => {
  const logs = await AdminLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 200
  });
  res.json(logs);
});

module.exports = router;
