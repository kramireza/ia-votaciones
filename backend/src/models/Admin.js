// backend/src/models/Admin.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

function cleanUsername(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .substring(0, 50);
}

const Admin = sequelize.define("Admin", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    },
    set(value) {
      this.setDataValue("username", cleanUsername(value));
    }
  },

  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 255]
    }
  },

  role: {
    type: DataTypes.ENUM("superadmin", "editor"),
    allowNull: false,
    defaultValue: "editor",
  },

  // 🔐 Seguridad futura / auditoría
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // 🔥 NUEVO — forzar cambio de contraseña
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  tableName: "admins",
  timestamps: false,
});

module.exports = Admin;