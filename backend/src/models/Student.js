// backend/src/models/Student.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Student = sequelize.define("Student", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accountNumber: { type: DataTypes.STRING, allowNull: false, unique: true }, // numero de cuenta
  name: { type: DataTypes.STRING, allowNull: false },
  center: { type: DataTypes.STRING, allowNull: false }, // centro
  email: { type: DataTypes.STRING }
}, {
  tableName: "students",
  timestamps: false
});

module.exports = Student;
