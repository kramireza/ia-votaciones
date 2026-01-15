import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function VotesPanel({ token }) {
  const [elections, setElections] = useState([]);
  const [msg, setMsg] = useState(null);

  // Cargar elecciones correctamente dentro del useEffect
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.getElections(token);
        setElections(res.data);
      } catch (err) {
        console.error("Error cargando elecciones:", err);
      }
    }
    fetchData();
  }, [token]);

  // Borrar votos
  async function deleteVotes(pollId) {
    if (!confirm("¿Seguro que deseas eliminar todos los votos de esta elección?")) return;

    try {
      await api.deleteVotes(pollId, token);
      setMsg({ type: "success", text: "Votos eliminados correctamente." });

      // recargar después de borrar
      const res = await api.getElections(token);
      setElections(res.data);
    } catch {
      setMsg({ type: "error", text: "Error borrando votos." });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Votos</h2>

      <div className="bg-white p-4 rounded shadow border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">pollId</th>
              <th className="p-2">Título</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>

          <tbody>
            {elections.map(e => (
              <tr key={e.pollId} className="border-b">
                <td className="p-2">{e.pollId}</td>
                <td className="p-2">{e.title}</td>
                <td className="p-2">
                  <button
                    onClick={() => deleteVotes(e.pollId)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Borrar votos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {msg && (
        <p className={`mt-3 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
