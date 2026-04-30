// backend/src/models/ApprovalRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ApprovalRequest = sequelize.define("ApprovalRequest", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  // Tipo de solicitud: delete | edit | password_change
  type: {
    type: DataTypes.ENUM("delete", "edit", "password_change"),
    allowNull: false
  },

  // Puede ser null para acciones globales (ej: password_change)
  pollId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },

  // Quién solicitó (admin id o username)
  requestedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Payload con datos propuestos
  payload: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      isValidPayload(value) {
        // Seguridad básica: evitar payloads extremadamente grandes
        if (value && JSON.stringify(value).length > 50000) {
          throw new Error("Payload demasiado grande");
        }
      }
    }
  },

  // Estado: pending | approved | rejected
  status: {
    type: DataTypes.ENUM("pending","approved","rejected"),
    allowNull: false,
    defaultValue: "pending"
  },

  // Comentario del superadmin
  adminComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // 🔐 Seguridad / auditoría
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },

  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: "approval_requests",
  timestamps: true
});

module.exports = ApprovalRequest;