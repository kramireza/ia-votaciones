// backend/src/models/Election.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

function cleanString(str) {
  return String(str || "")
    .trim()
    .substring(0, 255);
}

const Election = sequelize.define("Election", {
  pollId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },

  // ✅ Tipo de elección
  type: {
    type: DataTypes.ENUM("simple", "compound"),
    allowNull: false,
    defaultValue: "simple",
  },

  // ✅ Para elecciones simples
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidOptions(value) {
        if (!Array.isArray(value)) {
          throw new Error("Options debe ser un array");
        }

        if (value.length > 100) {
          throw new Error("Máximo 100 opciones");
        }

        value.forEach(opt => {
          if (!opt.text) {
            throw new Error("Cada opción debe tener texto");
          }

          // Sanitización
          opt.text = cleanString(opt.text);
          opt.description = cleanString(opt.description);

          if (opt.imageUrl && typeof opt.imageUrl !== "string") {
            throw new Error("imageUrl inválido");
          }
        });
      }
    }
  },

  // ✅ Para elecciones compuestas
  sections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidSections(value) {
        if (!Array.isArray(value)) {
          throw new Error("Sections debe ser un array");
        }

        if (value.length > 50) {
          throw new Error("Máximo 50 secciones");
        }

        value.forEach(sec => {
          if (!sec.title) {
            throw new Error("Cada sección debe tener título");
          }

          if (!Array.isArray(sec.options)) {
            throw new Error("Cada sección debe tener opciones");
          }

          if (sec.options.length === 0) {
            throw new Error("Cada sección debe tener al menos una opción");
          }

          sec.options.forEach(opt => {
            if (!opt.text) {
              throw new Error("Cada opción debe tener texto");
            }

            // Sanitización
            opt.text = cleanString(opt.text);
            opt.description = cleanString(opt.description);

            if (opt.imageUrl && typeof opt.imageUrl !== "string") {
              throw new Error("imageUrl inválido");
            }
          });
        });
      }
    }
  },

  status: {
    type: DataTypes.ENUM("open", "closed"),
    defaultValue: "closed",
  },
}, {
  hooks: {
    beforeSave: (election) => {

      // 🔥 VALIDACIÓN CRUZADA (CLAVE)
      if (election.type === "simple") {
        if (!election.options || election.options.length === 0) {
          throw new Error("Elección simple requiere opciones");
        }

        // limpiar sections
        election.sections = [];
      }

      if (election.type === "compound") {
        if (!election.sections || election.sections.length === 0) {
          throw new Error("Elección compuesta requiere secciones");
        }

        // limpiar options
        election.options = [];
      }
    }
  }
});

module.exports = Election;