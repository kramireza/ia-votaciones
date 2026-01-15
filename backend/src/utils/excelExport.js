// backend/src/utils/excelExport.js
const ExcelJS = require('exceljs');

async function exportVotesToExcel(votes) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Votos');
  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Cuenta', key: 'studentAccount', width: 20 },
    { header: 'Nombre', key: 'studentName', width: 30 },
    { header: 'Centro', key: 'studentCenter', width: 20 },
    { header: 'Poll ID', key: 'pollId', width: 20 },
    { header: 'Opción', key: 'option', width: 30 },
    { header: 'Fecha', key: 'timestamp', width: 25 }
  ];
  votes.forEach(v => sheet.addRow(v));
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function exportResultsToExcel(results) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Resultados');

  sheet.columns = [
    { header: 'Poll ID', key: 'pollId', width: 20 },
    { header: 'Opción', key: 'option', width: 30 },
    { header: 'Total Votos', key: 'count', width: 15 }
  ];

  results.forEach(r => sheet.addRow(r));

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { exportVotesToExcel, exportResultsToExcel };
