const { DataTypes } = require("sequelize");
const sequelize = require("../db");

function cleanString(str) {
  return String(str || "")
    .trim()
    .substring(0, 255);
}

const AdminLog = sequelize.define("AdminLog", {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  adminUsername: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    set(value) {
      this.setDataValue("adminUsername", cleanString(value));
    }
  },

  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    set(value) {
      this.setDataValue("action", cleanString(value));
    }
  },

  // 🔥 NUEVO — tipo de entidad (election, admin, vote, etc)
  entity: {
    type: DataTypes.STRING(50),
    allowNull: true
  },

  // 🔥 NUEVO — id de la entidad afectada
  entityId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // 🔐 Seguridad
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true
  },

  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: "AdminLogs",
  timestamps: true, // 👈 importante para auditoría
  indexes: [
    {
      fields: ["adminUsername"]
    },
    {
      fields: ["action"]
    },
    {
      fields: ["entity"]
    },
    {
      fields: ["entityId"]
    },
    {
      fields: ["createdAt"]
    }
  ]
});

module.exports = AdminLog;