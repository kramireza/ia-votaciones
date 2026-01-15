const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Election = sequelize.define("Election", {
  pollId: {
    type: DataTypes.STRING(50),
    primaryKey: true,     // ✔ clave primaria correcta
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ✔ opciones con imágenes: [{ text, imageUrl }]
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },

  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "closed"   // ✔ que comiencen cerradas
  }
});

module.exports = Election;
