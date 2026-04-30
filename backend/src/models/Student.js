// backend/src/models/Student.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

function cleanString(str, max = 100) {
  return String(str || "")
    .trim()
    .substring(0, max);
}

function cleanAccount(str) {
  return String(str || "")
    .replace(/\s/g, "")
    .trim();
}

const Student = sequelize.define("Student", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  accountNumber: { 
    type: DataTypes.STRING(20), 
    allowNull: false, 
    unique: true,
    validate: {
      notEmpty: true,
      len: [5, 20]
    },
    set(value) {
      this.setDataValue("accountNumber", cleanAccount(value));
    }
  },

  name: { 
    type: DataTypes.STRING(150), 
    allowNull: false,
    validate: {
      notEmpty: true
    },
    set(value) {
      this.setDataValue("name", cleanString(value, 150));
    }
  },

  center: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [["VS", "CU", "Danlí", "Otro"]]
    },
    set(value) {
      this.setDataValue("center", cleanString(value, 50));
    }
  },

  email: { 
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: true
    },
    set(value) {
      if (!value) return;
      this.setDataValue("email", cleanString(value, 150));
    }
  }

}, {
  tableName: "students",
  timestamps: false
});

module.exports = Student;