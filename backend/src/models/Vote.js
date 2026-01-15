// backend/src/models/Vote.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Student = require("./Student");

const Vote = sequelize.define("Vote", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentAccount: { type: DataTypes.STRING, allowNull: false },
  studentName: { type: DataTypes.STRING },
  studentCenter: { type: DataTypes.STRING },
  pollId: { type: DataTypes.STRING(50), allowNull: false }, // id de votacion
  option: { type: DataTypes.STRING, allowNull: false }, // la opción elegida
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: "votes",
  timestamps: false
});

module.exports = Vote;
