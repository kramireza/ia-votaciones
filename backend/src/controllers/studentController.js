// backend/src/controllers/studentController.js
const Student = require("../models/Student");

// body: { accountNumber, center }
async function verifyStudent(req, res) {
  const { accountNumber, center } = req.body;
  if (!accountNumber || !center) return res.status(400).json({ message: "Faltan datos" });
  const student = await Student.findOne({ where: { accountNumber, center }});
  if (!student) return res.status(404).json({ message: "No encontrado" });
  // devuelve datos básicos (sin exponer información sensible)
  res.json({
    id: student.id,
    accountNumber: student.accountNumber,
    name: student.name,
    center: student.center,
    email: student.email
  });
}

module.exports = { verifyStudent };
