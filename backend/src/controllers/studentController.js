// backend/src/controllers/studentController.js
const Student = require("../models/Student");

function cleanString(str, max = 50) {
  return String(str || "").trim().substring(0, max);
}

async function verifyStudent(req, res) {
  try {
    let { accountNumber, center } = req.body;

    accountNumber = cleanString(accountNumber);
    center = cleanString(center);

    if (!accountNumber || !center) {
      return res.status(400).json({
        message: "Faltan datos"
      });
    }

    const student = await Student.findOne({
      where: { accountNumber, center }
    });

    if (!student) {
      return res.status(404).json({
        message: "No encontrado"
      });
    }

    res.json({
      id: student.id,
      accountNumber: student.accountNumber,
      name: student.name,
      center: student.center,
      email: student.email || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error verificando estudiante"
    });
  }
}

module.exports = { verifyStudent };