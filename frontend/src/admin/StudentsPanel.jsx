import React, { useState } from "react";
import api from "../services/api";

export default function StudentsPanel({ token }) {
  const [csvFile, setCsvFile] = useState(null);
  const [msg, setMsg] = useState(null);

  async function uploadCSV(e) {
    e.preventDefault();

    if (!csvFile) {
      setMsg({ type: "error", text: "Selecciona un archivo CSV." });
      return;
    }

    try {
      const res = await api.uploadStudentsCSV(csvFile, token);
      setMsg({ type: "success", text: `Insertados: ${res.data.insertados}` });
    } catch {
      setMsg({ type: "error", text: "Error subiendo CSV." });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Importar Estudiantes</h2>

      <form onSubmit={uploadCSV} className="p-4 border rounded-lg bg-white shadow">
        <input
          type="file"
          name="file"
          accept=".csv"
          onChange={e => setCsvFile(e.target.files[0])}
          className="mb-3"
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Subir CSV
        </button>
      </form>

      {msg && (
        <p className={`mt-3 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
