{/*import React, { useState } from "react";
import api from "../services/api";

export default function ReportsPanel({ token }) {
  const [msg, setMsg] = useState(null);

  async function downloadAll() {
    try {
      const res = await api.exportExcelAll(token);

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "votos_completos.xlsx";
      a.click();

      URL.revokeObjectURL(url);
      setMsg({ type: "success", text: "Excel descargado." });
    } catch {
      setMsg({ type: "error", text: "Error descargando." });
    }
  }

  async function downloadResults() {
    try {
      const res = await api.exportExcelResults(token);

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "resultados.xlsx";
      a.click();

      URL.revokeObjectURL(url);
      setMsg({ type: "success", text: "Excel de resultados descargado." });
    } catch {
      setMsg({ type: "error", text: "Error descargando resultados." });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Reportes</h2>

      <div className="space-y-3">
        <button onClick={downloadAll} className="bg-indigo-600 text-white px-4 py-2 rounded">
          Descargar Excel (Votos completos)
        </button>

        <button onClick={downloadResults} className="bg-green-600 text-white px-4 py-2 rounded">
          Descargar Excel (Resultados)
        </button>
      </div>

      {msg && (
        <p className={`mt-3 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}*/}
