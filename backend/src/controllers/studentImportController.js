const fs = require("fs");
const csv = require("csv-parser");
const Student = require("../models/Student");
const logAction = require("../utils/logAction");

function detectSeparator(headerLine) {
  if (headerLine.includes(";")) return ";";
  return ",";
}

function normalizeKey(key) {
  return key.replace(/^\uFEFF/, "").trim().toLowerCase();
}

async function importStudents(req, res) {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({
      message: "No se subió archivo"
    });
  }

  try {
    const firstLine = fs.readFileSync(filePath, "utf8").split("\n")[0];
    const separator = detectSeparator(firstLine);

    const results = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator }))
        .on("data", (row) => {
          const normalized = {};

          for (const key in row) {
            normalized[normalizeKey(key)] = row[key]?.trim() || "";
          }

          const acc = normalized["accountnumber"];
          const name = normalized["name"];
          const center = normalized["center"];
          const email = normalized["email"] || null;

          if (!acc || !name || !center) {
            errors.push({ row: normalized, error: "Campos faltantes" });
            return;
          }

          results.push({
            accountNumber: acc,
            name,
            center,
            email
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (results.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "CSV inválido",
        errores: errors
      });
    }

    // =========================================
    // 🔥 NUEVO: DETECTAR DUPLICADOS
    // =========================================
    const accounts = results.map(r => r.accountNumber);

    const existingStudents = await Student.findAll({
      where: {
        accountNumber: accounts
      },
      attributes: ["accountNumber"]
    });

    const existingSet = new Set(
      existingStudents.map(s => s.accountNumber)
    );

    const newStudents = [];
    const duplicates = [];

    for (const student of results) {
      if (existingSet.has(student.accountNumber)) {
        duplicates.push(student);
      } else {
        newStudents.push(student);
      }
    }

    // Insertar solo nuevos
    if (newStudents.length > 0) {
      await Student.bulkCreate(newStudents);
    }

    fs.unlinkSync(filePath);

    await logAction({
      admin: req.admin,
      action: "import_students",
      entity: "student",
      details: `Insertados: ${newStudents.length}, Duplicados: ${duplicates.length}`,
      req
    });

    res.json({
      message: "Importación completada",
      insertados: newStudents.length,
      duplicados: duplicates.length,
      errores: errors.length,
      detallesErrores: errors
    });

  } catch (err) {
    console.error(err);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      message: "Error procesando CSV"
    });
  }
}

module.exports = { importStudents };