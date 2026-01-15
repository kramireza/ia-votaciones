// backend/src/models/Admin.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Admin = sequelize.define("Admin", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },

  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM("superadmin", "editor"),
    allowNull: false,
    defaultValue: "editor",
  },
}, {
  tableName: "admins",
  timestamps: false,
});

module.exports = Admin;
