const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AdminLog = sequelize.define("AdminLog", {
  adminUsername: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = AdminLog;
