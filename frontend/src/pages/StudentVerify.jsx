import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function StudentVerify({ onVerified }) {
  const [account, setAccount] = useState("");
  const [center, setCenter] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⭐ ELECCIÓN ACTIVA
  const [activePollId, setActivePollId] = useState(null);

  // ========================================================
  //   Cargar ELECCIÓN ACTIVA al abrir la página
  // ========================================================
  useEffect(() => {
    async function load() {
      try {
        const res = await api.getActiveElection();
        setActivePollId(res.data?.pollId || null);
      } catch {
        setActivePollId(null);
      }
    }
    load();
  }, []);

  // ========================================================
  //   Verificación del estudiante
  // ========================================================
  async function handleVerify(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await api.verifyStudent(account.trim(), center.trim());
      const studentData = res.data;
      setLoading(false);

      // ⭐ Si NO hay elección activa → no permitir voto
      if (!activePollId) {
        setMessage({
          type: "error",
          text: "No hay una elección activa en este momento.",
        });
        return;
      }

      if (activePollId) {
        // 1️⃣ Consultar al backend si ya votó realmente
        try {
          const backend = await api.checkVote(activePollId, studentData.accountNumber);

          if (backend.data.hasVoted) {
            setMessage({
              type: "error",
              text: "Ya has realizado tu voto para esta elección."
            });

            return;
          }
        } catch (err) {
          console.log("Error al verificar voto en backend:", err);
        }
      }

      // ⭐ Si no ha votado → permitir entrada
      setMessage({
        type: "success",
        text: `Bienvenido(a), ${studentData.name}`,
      });

      onVerified(studentData);

    } catch (err) {
      setLoading(false);
      const text =
        err.response?.data?.message || "Error de conexión.";
      setMessage({ type: "error", text });
    }
  }

  // ========================================================
  //   Render
  // ========================================================
  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-4">
        Verificación de Estudiante
      </h2>

      <form onSubmit={handleVerify} className="space-y-4">
        
        {/* Número de cuenta */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Número de cuenta
          </label>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="ej. 20190000111"
            required
          />
        </div>

        {/* Centro */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Centro
          </label>
          <select
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">-- Selecciona --</option>
            <option value="VS">VS</option>
            <option value="CU">CU</option>
            <option value="Danlí">Danlí</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3">
          <button
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Verificando..." : "Verificar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setAccount("");
              setCenter("");
              setMessage(null);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            Limpiar
          </button>
        </div>

        {/* Mensajes */}
        {message && (
          <div
            className={
              message.type === "error"
                ? "mt-3 text-red-600"
                : "mt-3 text-green-600"
            }
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
