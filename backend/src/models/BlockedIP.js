const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BlockedIP = sequelize.define("BlockedIP", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  ipAddress: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },

  reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  }

}, {
  tableName: "blocked_ips",
  timestamps: true
});

module.exports = BlockedIP;