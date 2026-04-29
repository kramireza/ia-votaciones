const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Election = sequelize.define("Election", {
  pollId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ✅ Tipo de elección
  type: {
    type: DataTypes.ENUM("simple", "compound"),
    allowNull: false,
    defaultValue: "simple",
  },

  // ✅ Para elecciones simples (modo actual)
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },

  // ✅ Para elecciones compuestas
  // [
  //   {
  //     title: "Asociación",
  //     options: [{ text, imageUrl, description }]
  //   }
  // ]
  sections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },

  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "closed",
  },
});

module.exports = Election;