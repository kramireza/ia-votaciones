// backend/src/models/ApprovalRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ApprovalRequest = sequelize.define("ApprovalRequest", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Tipo de solicitud: 'delete' | 'edit'
  type: {
    type: DataTypes.ENUM("delete", "edit"),
    allowNull: false
  },

  pollId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },

  // Quién solicitó (admin id o username) - lo sacamos del token
  requestedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Payload con datos propuestos (para edit -> title/options etc.)
  payload: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // Estado: pending | approved | rejected
  status: {
    type: DataTypes.ENUM("pending","approved","rejected"),
    allowNull: false,
    defaultValue: "pending"
  },

  // Comentario del superadmin al aprobar/rechazar
  adminComment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "approval_requests",
  timestamps: true
});

module.exports = ApprovalRequest;
