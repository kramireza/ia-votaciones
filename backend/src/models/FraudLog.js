const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FraudLog = sequelize.define("FraudLog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  ipAddress: {
    type: DataTypes.STRING(100)
  },

  pollId: {
    type: DataTypes.STRING(50)
  },

  type: {
    type: DataTypes.STRING(50) // spam, duplicate, suspicious
  },

  message: {
    type: DataTypes.STRING(255)
  }

}, {
  tableName: "fraud_logs",
  timestamps: true
});

module.exports = FraudLog;