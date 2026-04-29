const ExcelJS = require("exceljs");

// ============================================================
// HELPERS
// ============================================================
function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  return date.toLocaleString("es-HN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function prettifyOption(option) {
  if (!option) return "";

  try {
    const parsed = JSON.parse(option);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      return Object.entries(parsed)
        .map(
          ([key, val]) =>
            `${key}: ${val}`
        )
        .join(" | ");
    }
  } catch {}

  return option;
}

function styleHeader(row) {
  row.font = {
    bold: true,
    color: { argb: "FFFFFFFF" }
  };

  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4F46E5" }
  };

  row.alignment = {
    vertical: "middle",
    horizontal: "center"
  };
}

// ============================================================
// EXPORTAR VOTOS
// ============================================================
async function exportVotesToExcel(votes) {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Sistema de Votaciones";

  const sheet =
    workbook.addWorksheet(
      "Votos"
    );

  sheet.columns = [
    {
      header: "ID",
      key: "id",
      width: 10
    },
    {
      header: "Centro",
      key: "studentCenter",
      width: 18
    },
    {
      header: "Poll ID",
      key: "pollId",
      width: 22
    },
    {
      header: "Voto / Respuestas",
      key: "option",
      width: 65
    },
    {
      header: "Fecha y Hora",
      key: "timestamp",
      width: 28
    }
  ];

  styleHeader(
    sheet.getRow(1)
  );

  votes.forEach((v) => {
    sheet.addRow({
      id: v.id,
      studentCenter:
        v.studentCenter,
      pollId: v.pollId,
      option:
        prettifyOption(
          v.option
        ),
      timestamp:
        formatDateTime(
          v.timestamp ||
            v.createdAt
        )
    });
  });

  sheet.eachRow(
    (row, index) => {
      if (index > 1) {
        row.alignment = {
          vertical:
            "middle",
          wrapText: true
        };
      }
    }
  );

  sheet.autoFilter = {
    from: "A1",
    to: "E1"
  };

  const buffer =
    await workbook.xlsx.writeBuffer();

  return buffer;
}

// ============================================================
// EXPORTAR RESULTADOS
// ============================================================
async function exportResultsToExcel(
  results
) {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Sistema de Votaciones";

  const sheet =
    workbook.addWorksheet(
      "Resultados"
    );

  // INFO GENERAL
  sheet.mergeCells(
    "A1:D1"
  );

  sheet.getCell(
    "A1"
  ).value =
    "Reporte Oficial de Resultados";

  sheet.getCell(
    "A1"
  ).font = {
    bold: true,
    size: 16
  };

  sheet.getCell(
    "A1"
  ).alignment = {
    horizontal:
      "center"
  };

  sheet.mergeCells(
    "A2:D2"
  );

  sheet.getCell(
    "A2"
  ).value = `Generado: ${formatDateTime(
    new Date()
  )}`;

  sheet.getCell(
    "A2"
  ).alignment = {
    horizontal:
      "center"
  };

  // TABLA
  sheet.columns = [
    {
      header: "Poll ID",
      key: "pollId",
      width: 22
    },
    {
      header: "Opción / Sección",
      key: "option",
      width: 50
    },
    {
      header: "Total Votos",
      key: "count",
      width: 18
    },
    {
      header: "Porcentaje",
      key: "percent",
      width: 15
    }
  ];

  const headerRow =
    sheet.getRow(4);

  headerRow.values = [
    "Poll ID",
    "Opción / Sección",
    "Total Votos",
    "Porcentaje"
  ];

  styleHeader(
    headerRow
  );

  const totalVotes =
    results.reduce(
      (
        acc,
        item
      ) =>
        acc +
        Number(
          item.count || 0
        ),
      0
    );

  results.forEach(
    (r) => {
      const count =
        Number(
          r.count || 0
        );

      const percent =
        totalVotes > 0
          ? (
              (count /
                totalVotes) *
              100
            ).toFixed(2) +
            "%"
          : "0%";

      sheet.addRow({
        pollId: r.pollId,
        option:
          r.option,
        count,
        percent
      });
    }
  );

  sheet.eachRow(
    (row, index) => {
      if (index >= 4) {
        row.alignment = {
          vertical:
            "middle",
          wrapText: true
        };
      }
    }
  );

  sheet.autoFilter = {
    from: "A4",
    to: "D4"
  };

  const buffer =
    await workbook.xlsx.writeBuffer();

  return buffer;
}

module.exports = {
  exportVotesToExcel,
  exportResultsToExcel
};