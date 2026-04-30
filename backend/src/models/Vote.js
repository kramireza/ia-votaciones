// backend/src/models/Vote.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

function cleanString(str, max = 255) {
  return String(str || "")
    .trim()
    .substring(0, max);
}

const Vote = sequelize.define("Vote", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  studentAccount: { 
    type: DataTypes.STRING(20), 
    allowNull: false,
    validate: {
      notEmpty: true
    },
    set(value) {
      this.setDataValue("studentAccount", cleanString(value, 20));
    }
  },

  studentName: { 
    type: DataTypes.STRING(150),
    set(value) {
      this.setDataValue("studentName", cleanString(value, 150));
    }
  },

  studentCenter: { 
    type: DataTypes.STRING(50),
    set(value) {
      this.setDataValue("studentCenter", cleanString(value, 50));
    }
  },

  pollId: { 
    type: DataTypes.STRING(50), 
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },

  // 🔥 opción elegida
  option: { 
    type: DataTypes.STRING,
    allowNull: false
  },

  // 🔥 sección (solo para compound)
  section: {
    type: DataTypes.STRING,
    allowNull: true
  },

  timestamp: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }

}, {
  tableName: "votes",
  timestamps: false,

  indexes: [
    // 🔥 CLAVE PARA COMPOUND
    {
      unique: true,
      fields: ["studentAccount", "pollId", "section"]
    }
  ]
});

module.exports = Vote;