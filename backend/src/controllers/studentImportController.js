const fs = require("fs");
const csv = require("csv-parser");
const Student = require("../models/Student");
const path = require("path");

/**
 * Detecta automáticamente el separador CSV.
 */
function detectSeparator(headerLine) {
  if (headerLine.includes(";")) return ";";
  return ",";
}

/**
 * Limpia claves de encabezado (remove BOM, lowercase, trim)
 */
function normalizeKey(key) {
  return key
    .replace(/^\uFEFF/, "") // elimina BOM
    .trim()
    .toLowerCase();
}

async function importStudents(req, res) {

  // 🔵🔵🔵 LOGS IMPORTANTES PARA DETECTAR EL ERROR 🔵🔵🔵
  console.log("📥 IMPORT STUDENTS ejecutándose...");
  console.log("📁 req.file =", req.file);
  console.log("📝 req.body =", req.body);

  if (!req.file) {
    console.log("❌ ERROR: No llegó archivo");
    return res.status(400).json({ message: "No se subió ningún archivo." });
  }

  const filePath = req.file.path;

  try {
    // Leer solo la primera línea para detectar el separador
    const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
    const separator = detectSeparator(firstLine);

    const results = [];
    const errors = [];

    console.log("🔍 SEPARATOR DETECTED:", separator);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator }))
        .on("data", (row) => {
          // Normalizar claves
          const normalized = {};
          for (const key in row) {
            normalized[normalizeKey(key)] = row[key] ? row[key].trim() : "";
          }

          const acc = normalized["accountnumber"];
          const name = normalized["name"];
          const center = normalized["center"];
          const email = normalized["email"] || null;

          // Validaciones
          if (!acc || !name || !center) {
            errors.push({
              row: normalized,
              error: "Faltan campos obligatorios (accountNumber, name, center)",
            });
            return;
          }

          results.push({
            accountNumber: acc,
            name: name,
            center: center,
            email: email,
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      console.log("❌ ERROR: CSV vacío o inválido");
      return res.status(400).json({
        message: "El archivo CSV no contiene datos válidos.",
        errores: errors,
      });
    }

    await Student.bulkCreate(results, {
      ignoreDuplicates: true,
    });

    console.log("✅ INSERTADOS:", results.length);
    console.log("⚠️ ERRORES:", errors.length);

    fs.unlinkSync(filePath);

    res.json({
      message: "Importación completada.",
      insertados: results.length,
      errores: errors.length,
      detallesErrores: errors,
    });

  } catch (err) {
    console.error("❌ ERROR CSV:", err);
    res.status(500).json({ message: "Error procesando CSV.", error: err });
  }
}

module.exports = { importStudents };
