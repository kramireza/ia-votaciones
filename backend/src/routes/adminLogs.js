const express = require("express");
const router = express.Router();

const { adminAuth } = require("../middleware/authMiddleware");
const permit = require("../middleware/permit");
const AdminLog = require("../models/AdminLog");

// ============================================================
// 🔵 GET LOGS (CON PAGINACIÓN + FILTROS)
// ============================================================
router.get(
  "/",
  adminAuth,
  permit("superadmin", "editor"),
  async (req, res) => {
    try {

      const {
        page = 1,
        limit = 20,
        action,
        adminUsername,
        entity
      } = req.query;

      const offset = (page - 1) * limit;

      const where = {};

      if (action) where.action = action;
      if (adminUsername) where.adminUsername = adminUsername;
      if (entity) where.entity = entity;

      const result = await AdminLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]]
      });

      res.json({
        total: result.count,
        page: parseInt(page),
        pages: Math.ceil(result.count / limit),
        data: result.rows
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Error obteniendo logs"
      });
    }
  }
);

module.exports = router;